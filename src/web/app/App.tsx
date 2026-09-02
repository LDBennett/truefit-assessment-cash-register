import './styles/index.css';

import { RegisterPage } from '@/pages';
import { TooltipProvider } from '@/shared';

export function App() {
  return (
    <TooltipProvider>
      <RegisterPage />
    </TooltipProvider>
  );
}
