import React, { useState } from 'react';
import { FileSpreadsheet, BookOpenCheck, ChevronLeft, ChevronRight, ShieldCheck, MessageCircleQuestion } from 'lucide-react';
import { ViewState } from '../../App';

interface SidebarProps {
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems: { id: ViewState; label: string; icon: React.ReactNode }[] = [
    { id: 'workbench', label: 'Workbench', icon: <FileSpreadsheet className="w-5 h-5" /> },
    { id: 'rulebook', label: 'Rulebook', icon: <BookOpenCheck className="w-5 h-5" /> },
  ];

  return (
    <div className={`bg-white m-4 rounded-3xl shadow-[0px_10px_40px_rgba(30,41,59,0.04)] flex flex-col z-20 hidden md:flex h-[calc(100vh-32px)] transition-all duration-300 relative ${isCollapsed ? 'w-20' : 'w-72'}`}>
      
      {/* Collapse Toggle */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-4 top-10 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-full p-1.5 z-30 transition-colors shadow-md"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className={`p-8 flex items-center gap-3 h-24 ${isCollapsed ? 'justify-center px-4' : ''}`}>
        <div className="h-10 w-10 shrink-0 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
          <ShieldCheck className="text-white w-6 h-6" />
        </div>
        {!isCollapsed && (
          <span className="text-slate-900 font-bold tracking-tight text-xl whitespace-nowrap">
            LedgerGuard
          </span>
        )}
      </div>

      <div className="flex-1 px-4 space-y-2 mt-2 overflow-y-auto overflow-x-hidden scrollbar-none">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            title={isCollapsed ? item.label : undefined}
            className={`w-full flex items-center gap-4 py-3.5 transition-colors font-medium group ${
              isCollapsed ? 'justify-center px-0 rounded-xl' : 'px-4 rounded-xl'
            } ${
              currentView === item.id
                ? 'bg-indigo-50/80 text-indigo-700'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className={`shrink-0 ${currentView === item.id ? 'text-indigo-600' : 'group-hover:text-indigo-500 text-slate-400 transition-colors'}`}>
              {item.icon}
            </div>
            {!isCollapsed && (
              <span className={`text-[15px] whitespace-nowrap ${currentView === item.id ? 'font-bold text-indigo-800' : 'font-medium'}`}>
                {item.label}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className={`p-6 mt-auto ${isCollapsed ? 'justify-center px-4' : ''}`}>
        {!isCollapsed && (
          <div className="bg-[#f8fafc] rounded-2xl p-4 mb-6 border border-slate-100">
             <div className="flex items-center gap-3 mb-2">
                 <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">AJ</div>
                 <div>
                    <p className="text-sm font-bold text-slate-900">Auditor John</p>
                    <p className="text-[11px] text-slate-500 font-medium">Senior Auditor</p>
                 </div>
             </div>
          </div>
        )}
        <button className={`w-full flex items-center gap-3 py-2 text-slate-500 hover:text-slate-900 transition-colors ${isCollapsed ? 'justify-center' : 'px-2'}`}>
            <MessageCircleQuestion className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="font-semibold text-sm">Chat with us</span>}
        </button>
      </div>
    </div>
  );
};
