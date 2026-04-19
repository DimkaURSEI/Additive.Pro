import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function TariffsForm() {
  const [tariffs, setTariffs] = useState({
    monthlyRent: 15000,
    electricityCost: 5.47,
    laborHourlyRate: 500
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadTariffs() {
      try {
        const user = getCurrentUser();
        if (!user) return;
        
        const docRef = doc(db, 'users', user.uid, 'settings', 'tariffs');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTariffs({
            monthlyRent: data.monthlyRent || 15000,
            electricityCost: data.electricityCost || 5.47,
            laborHourlyRate: data.laborHourlyRate || 500
          });
        }
      } catch (err) {
        console.error('Failed to load tariffs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTariffs();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const user = getCurrentUser();
      if (!user) throw new Error('Not authenticated');
      
      const docRef = doc(db, 'users', user.uid, 'settings', 'tariffs');
      await setDoc(docRef, {
        ...tariffs,
        authorId: user.uid,
        updatedAt: serverTimestamp()
      }, { merge: true }); // Using setDoc with merge or just setDoc
      
      setMessage('Тарифы успешно сохранены в облаке');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      console.error('Failed to save tariffs:', err);
      setMessage('Ошибка сохранения: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm opacity-50 px-4 py-8">Loading tariffs from cloud...</div>;
  }

  return (
    <div className="space-y-6">
      <h3 className="serif italic text-lg opacity-90 mb-4">Тарифы и ставки</h3>
      <div className="space-y-2">
        <Label>Ежемесячная аренда (₽)</Label>
        <Input type="number" step="0.01" value={tariffs.monthlyRent} onChange={(e) => setTariffs({...tariffs, monthlyRent: Number(e.target.value)})} />
      </div>
      <div className="space-y-2">
        <Label>Электричество (₽/кВт⋅ч)</Label>
        <Input type="number" step="0.01" value={tariffs.electricityCost} onChange={(e) => setTariffs({...tariffs, electricityCost: Number(e.target.value)})} />
      </div>
      <div className="space-y-2">
        <Label>Ставка труда (₽/час)</Label>
        <Input type="number" step="0.01" value={tariffs.laborHourlyRate} onChange={(e) => setTariffs({...tariffs, laborHourlyRate: Number(e.target.value)})} />
      </div>
      <div className="pt-4 space-y-3">
         <Button onClick={handleSave} disabled={saving} className="w-full h-12 text-xs">
           {saving ? 'СОХРАНЕНИЕ...' : 'СОХРАНИТЬ В ОБЛАКО'}
         </Button>
         {message && <div className="text-[10px] text-center uppercase tracking-widest text-[#c5a059]">{message}</div>}
      </div>
    </div>
  );
}
