import { useState } from 'react';
import { signIn } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      await signIn();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Окно авторизации было закрыто. Пожалуйста, завершите вход.');
      } else if (err.code === 'auth/popup-blocked' || err.message.includes('fetch')) {
        setError('Ваш браузер блокирует всплывающие окна или сторонние куки внутри этого фрейма. Откройте приложение в новой вкладке (кнопка в правом верхнем углу AI Studio).');
      } else {
        setError(err.message || 'Ошибка авторизации. Попробуйте открыть приложение в новой вкладке.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
         <div className="text-[#ff5555] text-[11px] bg-[#ff5555]/10 p-4 rounded-sm border border-[#ff5555]/20 leading-relaxed font-sans">
           {error}
         </div>
      )}
      <Button onClick={handleGoogleLogin} disabled={loading} className="w-full py-4 text-xs">
        {loading ? 'ВХОД...' : 'ВОЙТИ ЧЕРЕЗ GOOGLE'}
      </Button>
    </div>
  );
}
