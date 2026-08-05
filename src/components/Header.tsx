import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Plus, CreditCard, User, LogOut, LogIn, ChevronDown, Settings, Edit3, Menu, Check, Trash2, AlertCircle, Clock, Info, CheckCheck, X } from 'lucide-react';
import { UserProfile, Payment, Client, Project, NotificationItem } from '../types';

interface HeaderProps {
  title: string;
  subtitle: string;
  onOpenSearch: () => void;
  onOpenAddPayment: () => void;
  onOpenAddProject: () => void;
  onOpenAddClient: () => void;
  profile: UserProfile;
  onOpenEditProfile: () => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onToggleMobileMenu?: () => void;
  payments?: Payment[];
  clients?: Client[];
  projects?: Project[];
  onSelectTab?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onOpenSearch,
  onOpenAddPayment,
  onOpenAddProject,
  onOpenAddClient,
  profile,
  onOpenEditProfile,
  onOpenAuth,
  onSignOut,
  onToggleMobileMenu,
  payments = [],
  clients = [],
  projects = [],
  onSelectTab,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('crt_read_notification_ids');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Save read notification IDs to localStorage
  const markAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      localStorage.setItem('crt_read_notification_ids', JSON.stringify(updated));
    }
  };

  const markAllAsRead = (allIds: string[]) => {
    const updated = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(updated);
    localStorage.setItem('crt_read_notification_ids', JSON.stringify(updated));
  };

  // Generate dynamic, functional notifications from application state
  const generatedNotifications: NotificationItem[] = [];

  // 1. Pending or Overdue Payments
  payments.forEach((pay) => {
    if (pay.status === 'overdue') {
      generatedNotifications.push({
        id: `pay_overdue_${pay.id}`,
        title: 'Overdue Payment Alert',
        message: `Payment of $${pay.amount.toLocaleString()} from ${pay.client_name || 'Client'} for "${pay.project_title || 'Project'}" is overdue.`,
        type: 'overdue',
        timestamp: pay.payment_date || 'Today',
        isRead: readIds.includes(`pay_overdue_${pay.id}`),
        linkTab: 'payments',
        amount: pay.amount,
      });
    } else if (pay.status === 'pending') {
      generatedNotifications.push({
        id: `pay_pending_${pay.id}`,
        title: 'Pending Revenue Action',
        message: `Pending payment of $${pay.amount.toLocaleString()} logged for ${pay.client_name || 'Client'}.`,
        type: 'pending_payment',
        timestamp: pay.payment_date || 'Recent',
        isRead: readIds.includes(`pay_pending_${pay.id}`),
        linkTab: 'payments',
        amount: pay.amount,
      });
    }
  });

  // 2. Upcoming Monthly Retainer Billing Cycles
  const currentDay = new Date().getDate();
  projects.forEach((proj) => {
    if (proj.status === 'active' && proj.type === 'monthly_recurring' && proj.billing_cycle_day) {
      const diff = proj.billing_cycle_day - currentDay;
      if (diff >= 0 && diff <= 5) {
        generatedNotifications.push({
          id: `proj_billing_${proj.id}`,
          title: 'Upcoming Retainer Billing',
          message: `"${proj.title}" billing day is in ${diff === 0 ? 'today' : `${diff} days`} (Day ${proj.billing_cycle_day} of month).`,
          type: 'upcoming_mrr',
          timestamp: `Day ${proj.billing_cycle_day}`,
          isRead: readIds.includes(`proj_billing_${proj.id}`),
          linkTab: 'projects',
          amount: proj.expected_amount,
        });
      }
    }
  });

  // 3. System Status Notification
  if (clients.length > 0) {
    const activeClients = clients.filter((c) => c.status === 'active').length;
    generatedNotifications.push({
      id: `sys_active_clients_${clients.length}`,
      title: 'Client Network Active',
      message: `You currently manage ${activeClients} active client account${activeClients === 1 ? '' : 's'}.`,
      type: 'info',
      timestamp: 'Active',
      isRead: readIds.includes(`sys_active_clients_${clients.length}`),
      linkTab: 'clients',
    });
  }

  const unreadCount = generatedNotifications.filter((n) => !n.isRead).length;
  const allIds = generatedNotifications.map((n) => n.id);

  const userName = profile.fullName || 'User';
  const userEmail = profile.email || 'user@company.com';

  return (
    <header className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200/60 bg-neutral-50/50 relative z-30">
      {/* Left Title & Mobile Menu Toggle */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60 rounded-xl transition-colors shrink-0"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-neutral-900 tracking-tight truncate">
            {title}
          </h1>
          <p className="text-xs text-neutral-500 font-normal mt-0.5 truncate max-w-sm sm:max-w-md md:max-w-xl">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 sm:gap-3 w-full md:w-auto justify-between md:justify-end">
        {/* Search Bar Input / Trigger */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-2 bg-white rounded-full border border-neutral-200 text-neutral-400 hover:text-neutral-600 hover:border-neutral-300 transition-all text-xs flex-1 sm:flex-none sm:w-44 lg:w-56 justify-between shadow-xs"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="text-neutral-400 truncate">Search...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-neutral-100 text-neutral-500 rounded border border-neutral-200 font-mono shrink-0">
            ⌘F
          </kbd>
        </button>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={onOpenAddPayment}
            title="Record Payment"
            className="px-3 sm:px-4 py-2 bg-emerald-900 hover:bg-emerald-950 text-white rounded-full text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs shrink-0"
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span className="hidden sm:inline">Record Payment</span>
            <span className="sm:hidden text-[11px]">Payment</span>
          </button>
        </div>

        {/* Notifications & User Profile Dropdown */}
        <div className="flex items-center gap-2 pl-2 border-l border-neutral-200 shrink-0">
          {/* Functional Bell Button & Popover */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className={`p-2 rounded-full border transition-all relative ${
                notificationsOpen
                  ? 'bg-emerald-900 border-emerald-900 text-white'
                  : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-100'
              }`}
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded-full min-w-[18px] text-center border-2 border-white shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Drawer */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl border border-neutral-200 shadow-2xl py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 pb-3 border-b border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-neutral-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>

                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead(allIds)}
                      className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100">
                  {generatedNotifications.length === 0 ? (
                    <div className="p-6 text-center text-neutral-400 text-xs">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                      <p>All caught up! No active notifications.</p>
                    </div>
                  ) : (
                    generatedNotifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markAsRead(n.id);
                          if (n.linkTab && onSelectTab) {
                            onSelectTab(n.linkTab);
                            setNotificationsOpen(false);
                          }
                        }}
                        className={`p-3.5 text-left transition-colors cursor-pointer hover:bg-neutral-50 flex gap-3 items-start ${
                          !n.isRead ? 'bg-emerald-50/40' : ''
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {n.type === 'overdue' && (
                            <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                              <AlertCircle className="w-4 h-4" />
                            </div>
                          )}
                          {n.type === 'upcoming_mrr' && (
                            <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                              <Clock className="w-4 h-4" />
                            </div>
                          )}
                          {n.type === 'pending_payment' && (
                            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                              <CreditCard className="w-4 h-4" />
                            </div>
                          )}
                          {n.type === 'info' && (
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center">
                              <Info className="w-4 h-4" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <p className="text-xs font-bold text-neutral-900 truncate">{n.title}</p>
                            <span className="text-[10px] text-neutral-400 shrink-0">{n.timestamp}</span>
                          </div>
                          <p className="text-[11px] text-neutral-600 leading-snug line-clamp-2">
                            {n.message}
                          </p>
                        </div>

                        {!n.isRead && (
                          <div className="w-2 h-2 rounded-full bg-emerald-700 mt-2 shrink-0" />
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 px-4 border-t border-neutral-100 text-center">
                  <p className="text-[10px] text-neutral-400">
                    Notifications automatically track retainers, pending invoices & revenue alerts.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown Pill */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1 pl-2 hover:bg-neutral-100 rounded-full transition-all border border-transparent hover:border-neutral-200"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-900 text-white flex items-center justify-center font-bold text-xs shadow-xs overflow-hidden border border-emerald-700 shrink-0">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="User" className="w-full h-full object-cover" />
                ) : (
                  userName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="hidden lg:block text-left pr-1">
                <p className="text-xs font-bold text-neutral-900 leading-tight">
                  {userName}
                </p>
                <p className="text-[11px] text-neutral-400 font-normal truncate max-w-[120px]">
                  {profile.companyName || userEmail}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-neutral-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50/50">
                  <p className="text-xs font-bold text-neutral-900">{userName}</p>
                  <p className="text-[11px] text-neutral-500 truncate">{userEmail}</p>
                  {profile.companyName && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {profile.companyName}
                    </span>
                  )}
                </div>

                <div className="p-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenEditProfile();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 rounded-xl flex items-center gap-2.5 transition-colors"
                  >
                    <Edit3 className="w-4 h-4 text-emerald-800" />
                    <span>Edit Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenAuth();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 rounded-xl flex items-center gap-2.5 transition-colors"
                  >
                    <LogIn className="w-4 h-4 text-emerald-800" />
                    <span>Login / Switch Account</span>
                  </button>
                </div>

                <div className="p-1 border-t border-neutral-100">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onSignOut();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-xl flex items-center gap-2.5 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
