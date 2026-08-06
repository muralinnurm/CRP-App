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
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-white flex flex-col justify-between shrink-0 h-full select-none font-sans overflow-y-auto transition-transform duration-200 ease-in-out md:translate-x-0 ${
        isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Top Logo Section */}
      <div>
        <div className="p-6 pb-5 flex items-center justify-between">
          <div className="flex items-center">
            <img
              src="https://i.postimg.cc/kMbf5XhW/logo.png"
              alt="Client Revenue Tracker Logo"
              className="h-10 w-auto max-w-[180px] object-contain"
              referrerPolicy="no-referrer"
            />
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

        {/* Navigation Section */}
        <div className="px-4 py-2">
          <nav className="space-y-2.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-50 text-neutral-900'
                      : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-neutral-400'}`} />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* GENERAL Section */}
        <div className="px-4 py-1 mt-1">
          <nav className="space-y-2.5">
            {generalItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-50 text-neutral-900'
                      : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-neutral-400'}`} />
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
        <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-neutral-900 relative overflow-hidden">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center mb-2.5 text-emerald-700">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="font-semibold text-sm leading-tight mb-1 text-neutral-900">
            Client MRR Engine
          </h4>
          <p className="text-[11px] text-neutral-500 leading-relaxed mb-3">
            Track recurring services vs one-time client projects with total clarity.
          </p>
          <button
            onClick={() => handleTabSelect('analytics')}
            className="w-full py-1.5 px-3 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-800 font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <span>View Reports</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
