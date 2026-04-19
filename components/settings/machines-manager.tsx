import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { getCurrentUser } from '@/lib/auth';
import { Machine } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function MachinesManager() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Machine>>({
    name: '', type: 'fdm', powerWatt: 150, price: 50000, lifespanHours: 10000
  });

  useEffect(() => {
    loadMachines();
  }, []);

  async function loadMachines() {
    setLoading(true);
    try {
      const user = getCurrentUser();
      if (!user) return;
      const q = query(collection(db, 'users', user.uid, 'machines'));
      const snapshot = await getDocs(q);
      const list: Machine[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Machine);
      });
      setMachines(list);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveMachine() {
    try {
      const user = getCurrentUser();
      if (!user) return;
      const isNew = !editingId;
      const ref = doc(collection(db, 'users', user.uid, 'machines'), isNew ? undefined : editingId!);
      
      const machineData = {
         ...form,
         updatedAt: new Date().toISOString(),
         ...(isNew ? { createdAt: new Date().toISOString() } : {})
      };
      
      await setDoc(ref, machineData, { merge: true });
      setEditingId(null);
      setForm({ name: '', type: 'fdm', powerWatt: 150, price: 50000, lifespanHours: 10000 });
      loadMachines();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id: string) {
    try {
      const user = getCurrentUser();
      if (!user) return;
      await deleteDoc(doc(db, 'users', user.uid, 'machines', id));
      loadMachines();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-6">
       <div className="space-y-2">
          <h2 className="serif italic text-xl">Парк оборудования</h2>
          <p className="text-[10px] uppercase tracking-widest opacity-40">Настройка ваших принтеров</p>
       </div>
       
       {/* Form */}
       <div className="grid grid-cols-1 gap-4 p-4 rounded-xl border border-white/10 bg-white/5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Bambu Lab X1C" />
            </div>
            <div className="space-y-2">
              <Label>Технология</Label>
              <select className="w-full bg-transparent border-b border-white/20 pb-2 text-sm text-white focus:outline-none focus:border-[#c5a059]" 
                value={form.type} onChange={e => setForm({...form, type: (e.target as HTMLSelectElement).value as any})}>
                 <option value="fdm" className="bg-[#111]">FDM</option>
                 <option value="sla" className="bg-[#111]">SLA/DLP</option>
                 <option value="other" className="bg-[#111]">Другое</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Мощность (Ватт)</Label>
              <Input type="number" value={form.powerWatt} onChange={e => setForm({...form, powerWatt: Number(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label>Цена станка (₽)</Label>
              <Input type="number" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label>Срок службы (Часов)</Label>
              <Input type="number" value={form.lifespanHours} onChange={e => setForm({...form, lifespanHours: Number(e.target.value)})} />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-4">
             {editingId && (
                <Button variant="ghost" onClick={() => { setEditingId(null); setForm({ name: '', type: 'fdm', powerWatt: 150, price: 50000, lifespanHours: 10000 }); }}>Отмена</Button>
             )}
             <Button onClick={handleSaveMachine} disabled={!form.name}>
                {editingId ? 'Обновить станок' : 'Добавить станок'}
             </Button>
          </div>
       </div>

       {/* List */}
       <div className="space-y-2">
         {loading ? <div className="text-xs opacity-50">Загрузка...</div> : machines.length === 0 ? (
            <div className="text-xs opacity-50 border border-white/5 rounded-xl p-8 text-center">Оборудование не добавлено</div>
         ) : (
            machines.map(m => (
               <div key={m.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 group">
                  <div>
                    <h4 className="font-medium text-sm flex items-center gap-2">
                       {m.name} 
                       <span className="text-[10px] uppercase tracking-widest text-[#c5a059] border border-[#c5a059]/20 px-1 rounded">{m.type}</span>
                    </h4>
                    <p className="text-xs opacity-50 mt-1">Амортизация: ₽{(m.price / m.lifespanHours).toFixed(2)}/ч | Энергия: {m.powerWatt} Вт</p>
                  </div>
                  <div className="flex gap-2 mt-4 md:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Button size="sm" variant="ghost" onClick={() => { setEditingId(m.id); setForm(m); }}>Изменить</Button>
                     <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => handleDelete(m.id)}>Удалить</Button>
                  </div>
               </div>
            ))
         )}
       </div>
    </div>
  );
}
