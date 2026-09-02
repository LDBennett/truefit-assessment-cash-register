import { useState } from 'react';

import { ConfigDrawer } from '@/features';
import { Footer, Header, RegisterWorkbench } from '@/widgets';

export function RegisterPage() {
  const [currencyCode, setCurrencyCode] = useState<'USD' | 'EUR'>('USD');
  const [divisor, setDivisor] = useState<number>(3);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <Header
        currencyCode={currencyCode}
        onCurrencyChange={setCurrencyCode}
        onOpenConfig={() => setIsConfigOpen(true)}
        divisor={divisor}
      />

      <main className="flex-1">
        <RegisterWorkbench
          currencyCode={currencyCode}
          onCurrencyChange={setCurrencyCode}
          divisor={divisor}
          onDivisorChange={setDivisor}
        />
      </main>

      <ConfigDrawer
        divisor={divisor}
        onChange={setDivisor}
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />

      <Footer />
    </div>
  );
}
