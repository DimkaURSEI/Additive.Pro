import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, setDoc, doc, deleteDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { getCurrentUser } from '@/lib/auth';
import { Order, Part, Machine } from '@/lib/types';
import { calculatePartCost, CalculatorTariffs } from '@/lib/calculator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash } from 'lucide-react';

export function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [tariffs, setTariffs] = useState<CalculatorTariffs | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [creating, setCreating] = useState(false);
  const [newOrder, setNewOrder] = useState({ title: '', description: '', notes: '' });
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  
  // New part form
  const [showPartForm, setShowPartForm] = useState(false);
  const [newPart, setNewPart] = useState<Partial<Part>>({
     name: '', machineId: '', quantity: 1, scheduledQuantity: 0,
     printType: 'fdm', weightGrams: 100, volumeMl: 0, timeHours: 3, timeMinutes: 0,
     materialCost: 2000, failureRate: 5, complexity: 1,
     postProcessingHours: 0.5, paintingEnabled: false, paintingTime: 0, paintArea: 0, paintChemistry: 0, compressorPower: 0
  });

  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    if (selectedOrder) {
       loadParts(selectedOrder.id);
    }
  }, [selectedOrder]);

  async function loadData() {
    try {
      const user = getCurrentUser();
      if (!user) return;
      
      // Load Tariffs
      const docSnap = await getDoc(doc(db, 'users', user.uid, 'settings', 'tariffs'));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTariffs({ monthlyRent: data.monthlyRent || 0, electricityCost: data.electricityCost || 0, laborHourlyRate: data.laborHourlyRate || 0 });
      }

      // Load Machines
      const mq = query(collection(db, 'users', user.uid, 'machines'));
      const mSnap = await getDocs(mq);
      const mList: Machine[] = [];
      mSnap.forEach(d => mList.push({ id: d.id, ...d.data() } as Machine));
      setMachines(mList);

      // Load Orders
      const oq = query(collection(db, 'users', user.uid, 'orders'));
      const oSnap = await getDocs(oq);
      const oList: Order[] = [];
      oSnap.forEach(d => oList.push({ id: d.id, ...d.data() } as Order));
      setOrders(oList);
      
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
  
  async function loadParts(orderId: string) {
      try {
        const user = getCurrentUser();
        if (!user) return;
        const q = query(collection(db, 'users', user.uid, 'parts'));
        const pSnap = await getDocs(q);
        const pList: Part[] = [];
        pSnap.forEach(d => {
           const data = d.data();
           if (data.orderId === orderId) {
             pList.push({ id: d.id, ...data } as Part);
           }
        });
        setParts(pList);
      } catch(err) {
        console.error(err);
      }
  }

  async function handleCreateOrder() {
    try {
      const user = getCurrentUser();
      if (!user) return;
      const id = 'ord_' + Date.now();
      const orderData = { ...newOrder, id, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
      await setDoc(doc(db, 'users', user.uid, 'orders', id), orderData);
      setCreating(false);
      setNewOrder({ title: '', description: '', notes: '' });
      loadData();
    } catch(err) {
      console.error(err);
    }
  }
  
  async function handleSavePart() {
    try {
      const user = getCurrentUser();
      if (!user || !selectedOrder) return;
      
      const id = 'part_' + Date.now();
      
      // Calculate costs using the new calculator logic
      const machine = machines.find(m => m.id === newPart.machineId);
      let calculatedCost = 0;
      if (machine && tariffs) {
         const out = calculatePartCost(newPart as Part, machine, tariffs);
         calculatedCost = out.totalCost;
      }
      
      const partData = { 
        ...newPart, 
        id, 
        orderId: selectedOrder.id,
        calculatedCost,
        createdAt: serverTimestamp(), 
        updatedAt: serverTimestamp() 
      };
      
      await setDoc(doc(db, 'users', user.uid, 'parts', id), partData);
      setShowPartForm(false);
      loadParts(selectedOrder.id);
    } catch(err) {
      console.error(err);
    }
  }

  async function handleDeletePart(partId: string) {
    try {
      const user = getCurrentUser();
      if (!user) return;
      await deleteDoc(doc(db, 'users', user.uid, 'parts', partId));
      if (selectedOrder) loadParts(selectedOrder.id);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-end">
          <div className="space-y-1">
             <h2 className="serif italic text-2xl">Заказы</h2>
             <p className="text-[10px] uppercase tracking-widest opacity-40">Управление проектами</p>
          </div>
          <Button onClick={() => setCreating(true)} className="gold-bg text-black hover:opacity-90">Новый заказ</Button>
       </div>

       {creating && (
         <div className="glass p-6 rounded-xl border border-white/10 space-y-4">
            <h3 className="serif text-xl">Создание заказа</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Название проекта</Label>
                 <Input value={newOrder.title} onChange={e => setNewOrder({...newOrder, title: e.target.value})} placeholder="Корпус РЭА" />
               </div>
               <div className="space-y-2">
                 <Label>Описание (Опционально)</Label>
                 <Input value={newOrder.description} onChange={e => setNewOrder({...newOrder, description: e.target.value})} placeholder="Печать корпусов для партии" />
               </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
               <Button variant="ghost" onClick={() => setCreating(false)}>Отмена</Button>
               <Button onClick={handleCreateOrder} disabled={!newOrder.title}>Создать</Button>
            </div>
         </div>
       )}

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 border-r border-white/10 pr-4 space-y-4 max-h-[800px] overflow-y-auto">
             <h3 className="text-xs uppercase tracking-widest opacity-50 mb-2">Список заказов</h3>
             {loading ? <div className="text-xs opacity-50">Загрузка...</div> : orders.length === 0 ? (
                <div className="glass p-8 rounded-xl text-center border border-white/5 opacity-50 text-sm">Нет активных заказов</div>
             ) : (
                orders.map(o => (
                   <div key={o.id} onClick={() => setSelectedOrder(o)} className={`glass p-4 rounded-xl border transition-colors cursor-pointer ${selectedOrder?.id === o.id ? 'border-[#c5a059]' : 'border-white/10 hover:border-[#c5a059]/50'}`}>
                      <h4 className="font-medium text-lg">{o.title}</h4>
                      {o.description && <p className="text-xs opacity-60 mt-1">{o.description}</p>}
                   </div>
                ))
             )}
          </div>
          
          <div className="lg:col-span-2">
            {!selectedOrder ? (
               <div className="glass rounded-xl border border-white/10 p-8 flex items-center justify-center opacity-50 h-64">
                  <p className="text-sm">Выберите заказ для добавления деталей и расчета стоимости</p>
               </div>
            ) : (
               <div className="space-y-6">
                  <div className="flex justify-between items-center bg-white/5 border border-white/10 p-4 rounded-xl">
                     <div>
                        <h2 className="serif italic text-xl">{selectedOrder.title}</h2>
                        <span className="text-xs opacity-50">ID: {selectedOrder.id}</span>
                     </div>
                     <div className="text-right">
                        <div className="text-[10px] uppercase tracking-widest opacity-50">Сумма заказа</div>
                        <div className="text-2xl text-[#c5a059]">₽{parts.reduce((acc, p) => acc + (p.calculatedCost || 0), 0).toFixed(2)}</div>
                     </div>
                  </div>
                  
                  <div className="flex justify-between items-end">
                     <h3 className="text-xs uppercase tracking-widest opacity-50">Детали в заказе</h3>
                     <Button size="sm" variant="outline" onClick={() => setShowPartForm(!showPartForm)}>{showPartForm ? 'Скрыть форму' : '+ Добавить деталь'}</Button>
                  </div>
                  
                  {showPartForm && (
                     <div className="glass p-6 rounded-xl border border-white/10 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                           <div className="space-y-2">
                             <Label>Название детали</Label>
                             <Input value={newPart.name} onChange={e => setNewPart({...newPart, name: e.target.value})} placeholder="Крышка верхняя" />
                           </div>
                           <div className="space-y-2">
                             <Label>Оборудование</Label>
                             <Select value={newPart.machineId} onValueChange={(v) => {
                                const m = machines.find(m => m.id === v);
                                setNewPart({...newPart, machineId: v, printType: m?.type || 'fdm'});
                             }}>
                                <SelectTrigger><SelectValue placeholder="Выберите станок" /></SelectTrigger>
                                <SelectContent>
                                   {machines.map(m => (
                                      <SelectItem key={m.id} value={m.id}>{m.name} ({m.type.toUpperCase()})</SelectItem>
                                   ))}
                                </SelectContent>
                             </Select>
                           </div>
                           <div className="space-y-2">
                             <Label>Кол-во (шт)</Label>
                             <Input type="number" value={newPart.quantity} onChange={e => setNewPart({...newPart, quantity: Number(e.target.value)})} />
                           </div>
                           
                           <div className="space-y-2">
                             <Label>{newPart.printType === 'fdm' ? 'Вес 1 шт. (г)' : 'Объем 1 шт. (мл)'}</Label>
                             <Input type="number" value={newPart.printType === 'fdm' ? newPart.weightGrams : newPart.volumeMl} onChange={e => {
                                if (newPart.printType === 'fdm') setNewPart({...newPart, weightGrams: Number(e.target.value)});
                                else setNewPart({...newPart, volumeMl: Number(e.target.value)});
                             }} />
                           </div>
                           <div className="space-y-2">
                             <Label>Стоимость материала (₽/кг или л)</Label>
                             <Input type="number" value={newPart.materialCost} onChange={e => setNewPart({...newPart, materialCost: Number(e.target.value)})} />
                           </div>
                           <div className="space-y-2 flex gap-2">
                             <div className="flex-1 space-y-2">
                               <Label>Длительность (Часы)</Label>
                               <Input type="number" value={newPart.timeHours} onChange={e => setNewPart({...newPart, timeHours: Number(e.target.value)})} />
                             </div>
                             <div className="flex-1 space-y-2">
                               <Label>Минуты</Label>
                               <Input type="number" value={newPart.timeMinutes} onChange={e => setNewPart({...newPart, timeMinutes: Number(e.target.value)})} />
                             </div>
                           </div>
                           
                           <div className="space-y-2">
                             <Label>Время постобработки (Часы)</Label>
                             <Input type="number" step="0.1" value={newPart.postProcessingHours} onChange={e => setNewPart({...newPart, postProcessingHours: Number(e.target.value)})} />
                           </div>
                           <div className="space-y-2">
                             <Label>Сложность (1.0 = норм)</Label>
                             <Input type="number" step="0.1" value={newPart.complexity} onChange={e => setNewPart({...newPart, complexity: Number(e.target.value)})} />
                           </div>
                           <div className="space-y-2">
                             <Label>Риск брака (%)</Label>
                             <Input type="number" value={newPart.failureRate} onChange={e => setNewPart({...newPart, failureRate: Number(e.target.value)})} />
                           </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
                           <Button onClick={handleSavePart} disabled={!newPart.name || !newPart.machineId}>Рассчитать и добавить в заказ</Button>
                        </div>
                     </div>
                  )}
                  
                  <div className="space-y-3">
                     {parts.length === 0 ? (
                        <div className="text-xs opacity-50 p-4 border border-dashed border-white/10 rounded text-center">В заказе нет деталей. Добавьте деталь для расчета цены.</div>
                     ) : (
                        parts.map(p => (
                           <div key={p.id} className="glass p-4 rounded-xl border border-white/10 flex justify-between items-center">
                              <div>
                                 <h4 className="font-semibold text-sm">{p.name} <span className="opacity-50 font-normal">x{p.quantity} шт.</span></h4>
                                 <p className="text-xs opacity-50">{p.timeHours}ч {p.timeMinutes}м на деталь | Станок: {machines.find(m => m.id === p.machineId)?.name || 'Удалено'}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                 <div className="text-right">
                                    <div className="text-lg text-[#c5a059]">₽{p.calculatedCost?.toFixed(2)}</div>
                                    <div className="text-[10px] uppercase opacity-50">Итоговая стоимость</div>
                                 </div>
                                 <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-400/10" onClick={() => handleDeletePart(p.id)}><Trash className="w-4 h-4" /></Button>
                              </div>
                           </div>
                        ))
                     )}
                  </div>
               </div>
            )}
          </div>
       </div>
    </div>
  );
}
