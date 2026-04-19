import { useState, useEffect } from 'react';
import { useCalendarApp, ScheduleXCalendar } from '@schedule-x/react';
import {
  createViewDay,
  createViewWeek,
  createViewMonthAgenda,
} from '@schedule-x/calendar';
import { createEventsServicePlugin } from '@schedule-x/events-service';
import { createDragAndDropPlugin } from '@schedule-x/drag-and-drop';
import '@schedule-x/theme-default/dist/index.css';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { Machine, Part, Order } from '@/lib/types';
import { Button } from '@/components/ui/button';

const getFormattedDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
};

export function TimelineCalendar() {
  const eventsService = useState(() => createEventsServicePlugin())[0];
  const [loading, setLoading] = useState(true);
  
  const [machines, setMachines] = useState<Machine[]>([]);
  const [queue, setQueue] = useState<(Part & { orderName?: string })[]>([]);

  const formattedDate = getFormattedDate();

  const plugins = useState(() => [
    eventsService,
    createDragAndDropPlugin(),
  ])[0];

  const calendar = useCalendarApp({
    views: [createViewDay(), createViewWeek(), createViewMonthAgenda()],
    defaultView: createViewWeek().name,
    events: [],
    callbacks: {
      onEventUpdate: async (updatedEvent) => {
         try {
           const user = getCurrentUser();
           if(!user) return;
           await setDoc(doc(db, 'users', user.uid, 'tasks', updatedEvent.id as string), {
             title: updatedEvent.title,
             start: updatedEvent.start,
             end: updatedEvent.end,
             machineId: updatedEvent.machineId || null,
             authorId: user.uid,
             updatedAt: serverTimestamp()
           }, { merge: true });
         } catch(err) {
           console.error("Error updating event in cloud: ", err);
         }
      },
    }
  }, plugins);

  useEffect(() => {
    async function loadData() {
      try {
        const user = getCurrentUser();
         if (!user) return;
         
         // Load machines
         const mq = query(collection(db, 'users', user.uid, 'machines'));
         const mSnap = await getDocs(mq);
         const mList: Machine[] = [];
         mSnap.forEach(d => mList.push({ id: d.id, ...d.data() } as Machine));
         setMachines(mList);

         // Load orders to map names
         const oq = query(collection(db, 'users', user.uid, 'orders'));
         const oSnap = await getDocs(oq);
         const ordersMap = new Map<string, string>();
         oSnap.forEach(d => ordersMap.set(d.id, d.data().title));
         
         // Load parts for queue (where scheduledQuantity < quantity)
         const pq = query(collection(db, 'users', user.uid, 'parts'));
         const pSnap = await getDocs(pq);
         const pList: (Part & { orderName?: string })[] = [];
         pSnap.forEach(d => {
            const data = d.data() as Part;
            if ((data.scheduledQuantity || 0) < data.quantity) {
               pList.push({ id: d.id, ...data, orderName: ordersMap.get(data.orderId) });
            }
         });
         setQueue(pList);
         
         // Load Tasks
         const q = query(collection(db, 'users', user.uid, 'tasks'));
         const snapshot = await getDocs(q);
         const tasks: any[] = [];
         const sanitizeDate = (d: string, fallback: string) => {
            if (!d || typeof d !== 'string') return fallback;
            let cleaned = d.trim();
            const timeMatcher = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
            const dateMatcher = /^\d{4}-\d{2}-\d{2}$/;
            
            if (cleaned.includes('T')) {
               cleaned = cleaned.split('T')[0] + ' ' + cleaned.split('T')[1].substring(0, 5);
            }
            
            if (timeMatcher.test(cleaned)) return cleaned;
            if (dateMatcher.test(cleaned)) return `${cleaned} 00:00`;
            
            return fallback;
         };

         snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            tasks.push({
               id: docSnap.id,
               title: data.title || 'Безымянный заказ',
               start: sanitizeDate(data.start, `${formattedDate} 08:00`),
               end: sanitizeDate(data.end, `${formattedDate} 10:00`),
               machineId: data.machineId
            });
         });
         
         eventsService.set(tasks);
      } catch(err) {
        console.error("Error loading tasks: ", err);
      } finally {
        setLoading(false);
      }
    }
    
    if (calendar) {
      loadData();
    }
  }, [calendar, eventsService]);
  
  async function schedulePart(part: Part & { orderName?: string }) {
     const user = getCurrentUser();
     if (!user) return;
     
     // Very simple click-to-schedule logic for MVP
     const newTaskId = 'task_' + Date.now();
     const m = machines.find(m => m.id === part.machineId);
     const partTitle = `${part.orderName} - ${part.name} ${m ? `(${m.name})` : ''}`;
     
     // Calculate end time
     const totalMinutes = (part.timeHours * 60) + part.timeMinutes;
     const endDate = new Date();
     endDate.setMinutes(endDate.getMinutes() + totalMinutes);
     
     const formatDate = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const h = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        return `${y}-${m}-${d} ${h}:${min}`;
     };
     
     const newTask = {
        id: newTaskId,
        title: partTitle,
        start: formatDate(new Date()),
        end: formatDate(endDate),
        machineId: part.machineId,
        authorId: user.uid,
        updatedAt: serverTimestamp()
     };
     
     try {
       await setDoc(doc(db, 'users', user.uid, 'tasks', newTaskId), newTask);
       
       // Update scheduled quantity
       const newScheduledQty = (part.scheduledQuantity || 0) + 1;
       await setDoc(doc(db, 'users', user.uid, 'parts', part.id), {
          scheduledQuantity: newScheduledQty
       }, { merge: true });
       
       // Update UI
       eventsService.add(newTask as any);
       setQueue(prev => prev.map(p => p.id === part.id ? { ...p, scheduledQuantity: newScheduledQty } : p).filter(p => p.scheduledQuantity < p.quantity));
     } catch (err) {
       console.error("Failed to schedule part", err);
     }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full h-[800px]">
       {/* Sidebar for Resources / Details */}
       <div className="w-full lg:w-80 glass flex flex-col rounded-xl overflow-hidden border border-white/5 relative">
          <div className="p-6 border-b border-white/5 space-y-1">
             <h2 className="serif italic text-xl">Ресурсы</h2>
             <p className="text-[10px] uppercase tracking-widest opacity-40">Станки и оборудование</p>
          </div>
          <div className="p-6 flex-1 overflow-y-auto space-y-6">
             <div className="space-y-3">
                {machines.length === 0 ? (
                   <span className="text-xs opacity-50">Оборудование не найдено</span>
                ) : machines.map(m => (
                   <div key={m.id} className="relative">
                      <div className="flex items-center justify-between">
                         <div className="flex flex-col">
                            <span className="text-sm font-medium">{m.name}</span>
                            <span className="text-xs text-[#c5a059] uppercase">{m.type}</span>
                         </div>
                         <div className="w-2 h-2 rounded-full bg-green-500/80"></div>
                      </div>
                      <div className="h-[1px] w-full bg-white/5 mt-3"></div>
                   </div>
                ))}
             </div>

             <div className="pt-6 border-t border-white/5 space-y-4">
                <div className="space-y-1 mb-4">
                   <h2 className="serif italic text-xl">Очередь</h2>
                   <p className="text-[10px] uppercase tracking-widest opacity-40">Ожидающие детали</p>
                </div>
                
                {queue.length === 0 ? (
                   <div className="p-3 bg-white/5 rounded border border-white/10 text-xs text-white/40">
                      Нет деталей в очереди. Добавьте их в разделе Заказы.
                   </div>
                ) : queue.map(part => (
                   <div key={part.id} className="p-3 bg-white/5 rounded border border-white/10 text-xs group">
                      <span className="font-semibold block mb-1 text-[#c5a059]">{part.orderName || 'Без названия'}</span>
                      <span className="opacity-80 block">{part.name}</span>
                      <span className="opacity-50 block mb-2">{part.timeHours}ч {part.timeMinutes}м на 1 шт. • Осталось: {part.quantity - (part.scheduledQuantity || 0)} шт.</span>
                      <Button size="sm" variant="ghost" className="w-full mt-1 border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white" onClick={() => schedulePart(part)}>Запланировать (1 шт.)</Button>
                   </div>
                ))}
             </div>
          </div>
       </div>

       {/* Calendar Area */}
       <div className="flex-1 rounded-xl border border-white/10 shadow-sm p-4 overflow-hidden relative glass sx-theme-dark h-full">
          {loading && <div className="absolute inset-0 z-50 flex items-center justify-center glass"><span className="uppercase tracking-widest text-[#c5a059] text-xs font-semibold">Загрузка плана...</span></div>}
          <style>{`
             .sx-react-calendar-wrapper {
                --sx-color-background: transparent !important;
                --sx-color-surface: rgba(255,255,255,0.03) !important;
                --sx-color-primary: #c5a059 !important;
                --sx-color-on-primary: #000 !important;
                --sx-color-border: rgba(255,255,255,0.1) !important;
                --sx-color-text: #e5e5e5 !important;
                --sx-color-text-muted: rgba(255,255,255,0.6) !important;
                height: 100% !important;
             }
             .sx__week-grid__time-axis, .sx__time-grid-day {
                border-color: rgba(255,255,255,0.05) !important;
             }
             .sx__calendar-header {
                color: #c5a059 !important;
             }
             /* CSS Fix for overlapping text and readability */
             .sx__event {
                padding: 4px !important;
             }
             .sx__time-grid-event-inner {
                padding: 4px 6px !important;
                white-space: normal !important;
                overflow-wrap: break-word !important;
                line-height: 1.3 !important;
             }
             .sx__event-title, .sx__event-time {
                white-space: normal !important;
                display: block !important;
                font-size: 11px !important;
             }
             .sx__event-title {
                font-weight: 600 !important;
                margin-bottom: 4px;
             }
          `}</style>
          <div className="h-full">
            <ScheduleXCalendar calendarApp={calendar} />
          </div>
       </div>
    </div>
  );
}
