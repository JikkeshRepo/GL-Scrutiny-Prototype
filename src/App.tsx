import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Workbench } from './pages/Workbench';
import { Rulebook } from './pages/Rulebook';
import { AppProvider } from './context/AppContext';
import { TooltipProvider } from './components/ui/tooltip';

export type ViewState = 'workbench' | 'rulebook';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('workbench');

  const renderContent = () => {
    switch (currentView) {
      case 'workbench':
        return <Workbench />;
      case 'rulebook':
        return <Rulebook />;
      default:
        return <Workbench />;
    }
  };

  return (
    <AppProvider>
      <TooltipProvider>
        <div className="flex h-screen w-full bg-[#f4f7fe] font-sans text-slate-900 overflow-hidden">
          <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
          <div className="flex-1 flex flex-col min-w-0 relative">
            <main className="flex-1 overflow-y-auto overflow-x-hidden p-8 relative space-y-6">
              {renderContent()}
            </main>
          </div>
        </div>
      </TooltipProvider>
    </AppProvider>
  );
}
