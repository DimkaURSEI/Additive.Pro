import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router';
import { User } from 'firebase/auth';
import { onAuthStateChanged, signOut } from '@/lib/auth';
import { NavTabs } from '@/components/navigation/nav-tabs';
import { CalculatorForm } from '@/components/calculator/calculator-form';
import { TimelineCalendar } from '@/components/erp/timeline-calendar';
import { TariffsForm } from '@/components/settings/tariffs-form';
import { LoginForm } from '@/components/auth/login-form';
import { Button } from '@/components/ui/button';

import { LogOut, Printer } from 'lucide-react';

function ProtectedLayout({ children, user }: { children: React.ReactNode, user: User | null }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen pb-16 md:pb-0 bg-background flex flex-col">
      <header className="border-b border-white/10 px-4 py-6 md:px-8 pb-6 sticky top-0 z-40 bg-[#050505]/80 backdrop-blur-md">
        <div className="flex justify-between items-end max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-1">
             <span className="text-[10px] uppercase tracking-[0.4em] opacity-50 text-primary">Calculated Precision</span>
             <h1 className="text-4xl md:text-5xl serif italic font-normal tracking-tight">Additive.Pro</h1>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div className="hidden md:flex flex-col items-end mr-4">
              <div className="text-[10px] uppercase tracking-[0.2em] opacity-50">Firebase Deployment Node</div>
              <div className="text-sm font-mono text-primary opacity-80">v2.4.0-stable</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="text-muted-foreground hover:text-white uppercase tracking-widest text-[10px] h-8 hidden md:flex"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 lg:p-10 animate-in fade-in duration-300">
        {children}
      </main>
      
      <NavTabs />
    </div>
  );
}

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="glass p-10 rounded-sm shadow-2xl w-full max-w-md space-y-10 animate-in zoom-in-95 duration-500 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 opacity-5 translate-x-12 -translate-y-12">
           <svg viewBox="0 0 100 100" className="fill-white"><circle cx="50" cy="50" r="50"/></svg>
         </div>
         <div className="flex flex-col items-center text-center space-y-4">
          <div className="space-y-2">
             <span className="text-[10px] uppercase tracking-[0.4em] opacity-50 text-primary">Calculated Precision</span>
             <h1 className="text-4xl serif italic tracking-tight">Additive.Pro</h1>
          </div>
        </div>
        <div className="pt-4 border-t border-white/10">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Render directly without ThemeProvider to enforce the root CSS
  return (
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        
        <Route path="/" element={<ProtectedLayout user={user}><div className="space-y-8"><div className="flex flex-col"><h2 className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">Cost Estimation</h2></div><CalculatorForm /></div></ProtectedLayout>} />
        
        <Route path="/erp" element={<ProtectedLayout user={user}><div className="space-y-8"><div className="flex flex-col"><h2 className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">Production Timeline</h2></div><TimelineCalendar /></div></ProtectedLayout>} />
        
        <Route path="/settings" element={<ProtectedLayout user={user}><div className="space-y-8"><div className="flex flex-col"><h2 className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">System Parameters</h2></div><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="glass p-8 relative overflow-hidden"><TariffsForm /></div></div></div></ProtectedLayout>} />
      </Routes>
  );
}
