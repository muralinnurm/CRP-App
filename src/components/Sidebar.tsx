import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  CreditCard, 
  BarChart3, 
  Settings, 
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  X
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'projects', label: 'Projects & Services', icon: Briefcase },
    { id: 'payments', label: 'Payment Records', icon: CreditCard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const generalItems = [
    { id: 'settings', label: 'Settings & Data', icon: Settings },
  ];

  const handleTabSelect = (tabId: string) => {
    onSelectTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-neutral-200/80 flex flex-col justify-between shrink-0 h-full select-none font-sans overflow-y-auto transition-transform duration-200 ease-in-out md:translate-x-0 ${
        isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Top Logo Section */}
      <div>
        <div className="p-6 pb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900 flex items-center justify-center text-white shadow-xs shadow-emerald-950/20">
              <TrendingUp className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h1 className="font-bold text-neutral-900 text-base tracking-tight leading-none">
                ClientRevenue
              </h1>
              <span className="text-[11px] font-medium text-emerald-700 tracking-wide uppercase mt-1 block">
                Income Tracker
              </span>
            </div>
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* MENU Section */}
        <div className="px-4 py-2">
          <p className="px-3 mb-2 text-[10px] font-bold text-neutral-400 tracking-wider uppercase">
            MENU
          </p>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-950 text-white shadow-xs shadow-emerald-950/20'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-300' : 'text-neutral-500'}`} />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* GENERAL Section */}
        <div className="px-4 py-3 border-t border-neutral-100 mt-2">
          <p className="px-3 mb-2 text-[10px] font-bold text-neutral-400 tracking-wider uppercase">
            GENERAL
          </p>
          <nav className="space-y-1">
            {generalItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-950 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-300' : 'text-neutral-500'}`} />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Feature Box */}
      <div className="p-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white relative overflow-hidden shadow-md">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-700/20 rounded-full blur-xl pointer-events-none" />
          <div className="w-7 h-7 rounded-lg bg-emerald-800/80 flex items-center justify-center mb-2.5 text-emerald-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="font-semibold text-sm leading-tight mb-1 text-white">
            Client MRR Engine
          </h4>
          <p className="text-[11px] text-emerald-200/80 leading-relaxed mb-3">
            Track recurring services vs one-time client projects with total clarity.
          </p>
          <button
            onClick={() => handleTabSelect('analytics')}
            className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <span>View Reports</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
