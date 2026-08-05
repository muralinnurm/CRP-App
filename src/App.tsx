import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ClientsView } from './components/ClientsView';
import { ProjectsView } from './components/ProjectsView';
import { PaymentsView } from './components/PaymentsView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { AuthScreen } from './components/AuthScreen';

import { AddClientModal } from './components/AddClientModal';
import { AddProjectModal } from './components/AddProjectModal';
import { AddPaymentModal } from './components/AddPaymentModal';
import { QuickSearchModal } from './components/QuickSearchModal';
import { AuthModal } from './components/AuthModal';
import { EditProfileModal } from './components/EditProfileModal';

import { Client, Project, Payment, DashboardMetrics, UserProfile } from './types';
import { dataService } from './lib/dataService';
import { authService, DEFAULT_PROFILE } from './lib/authService';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => authService.isLoggedIn());
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [loading, setLoading] = useState<boolean>(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // User Profile State
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  // Main Entities State
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  // Modals & Drawers State
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [defaultClientIdForProject, setDefaultClientIdForProject] = useState<string | undefined>(undefined);

  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [defaultClientIdForPayment, setDefaultClientIdForPayment] = useState<string | undefined>(undefined);
  const [defaultProjectIdForPayment, setDefaultProjectIdForPayment] = useState<string | undefined>(undefined);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [selectedClientForDrawer, setSelectedClientForDrawer] = useState<Client | null>(null);

  // Fetch all data & calculate metrics for current user
  const loadData = useCallback(async (showLoadingSpinner = false) => {
    if (showLoadingSpinner) setLoading(true);
    try {
      const { clients: cList, projects: pList, payments: payList, metrics: dashMetrics } =
        await dataService.fetchAllData();

      setClients(cList);
      setProjects(pList);
      setPayments(payList);
      setMetrics(dashMetrics);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to Auth state changes and real-time Firestore database updates
  useEffect(() => {
    let unsubData: (() => void) | undefined;

    const unsubscribeAuth = authService.onAuthStateChangedListener(async (userProf) => {
      if (unsubData) {
        unsubData();
        unsubData = undefined;
      }

      if (userProf) {
        setProfile(userProf);
        setIsAuthenticated(true);

        const currentUser = authService.getCurrentUser();
        const targetUid = currentUser?.uid || userProf.id;
        if (targetUid && targetUid !== 'local_user') {
          unsubData = dataService.subscribeToUserData(targetUid, ({ clients: cList, projects: pList, payments: payList, metrics: dashMetrics }) => {
            setClients(cList);
            setProjects(pList);
            setPayments(payList);
            setMetrics(dashMetrics);
            setLoading(false);
          });
        }
      } else {
        setIsAuthenticated(false);
        setProfile(DEFAULT_PROFILE);
      }

      try {
        const { clients: cList, projects: pList, payments: payList, metrics: dashMetrics } =
          await dataService.fetchAllData();

        setClients(cList);
        setProjects(pList);
        setPayments(payList);
        setMetrics(dashMetrics);
      } catch (err) {
        console.warn('Error fetching initial data:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubData) unsubData();
    };
  }, []);

  // AUTH HANDLERS
  const handleAuthSuccess = (updatedProf: UserProfile) => {
    setProfile(updatedProf);
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    loadData();
  };

  const handleSignOut = async () => {
    await authService.signOut();
    setIsAuthenticated(false);
    setProfile(DEFAULT_PROFILE);
  };

  // CLIENT CRUD HANDLERS
  const handleSaveClient = async (
    clientData: Omit<Client, 'id' | 'created_at'>,
    editingId?: string
  ) => {
    if (editingId) {
      await dataService.updateClient(editingId, clientData);
    } else {
      await dataService.addClient(clientData);
    }
    await loadData();
  };

  const handleDeleteClient = async (clientId: string) => {
    await dataService.deleteClient(clientId);
    if (selectedClientForDrawer?.id === clientId) {
      setSelectedClientForDrawer(null);
    }
    await loadData();
  };

  // PROJECT CRUD HANDLERS
  const handleSaveProject = async (
    projectData: Omit<Project, 'id' | 'created_at'>,
    editingId?: string
  ) => {
    if (editingId) {
      await dataService.updateProject(editingId, projectData);
    } else {
      await dataService.addProject(projectData);
    }
    await loadData();
  };

  const handleDeleteProject = async (projectId: string) => {
    await dataService.deleteProject(projectId);
    await loadData();
  };

  // PAYMENT CRUD HANDLERS
  const handleSavePayment = async (
    paymentData: Omit<Payment, 'id' | 'created_at'>,
    editingId?: string
  ) => {
    if (editingId) {
      await dataService.updatePayment(editingId, paymentData);
    } else {
      await dataService.addPayment(paymentData);
    }
    await loadData();
  };

  const handleDeletePayment = async (paymentId: string) => {
    await dataService.deletePayment(paymentId);
    await loadData();
  };

  const handleResetDemoData = async () => {
    await dataService.resetToDemoData();
    await loadData();
  };

  // If user is not authenticated, show AuthScreen (Firebase Sign In / Registration with OTP)
  if (!isAuthenticated) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  // Title per Tab
  const getPageHeader = () => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: 'Dashboard',
          subtitle: 'Plan, prioritize, and track your client income with ease.',
        };
      case 'clients':
        return {
          title: 'Client Directory',
          subtitle: 'Manage client accounts, contact details, and payment histories.',
        };
      case 'projects':
        return {
          title: 'Projects & Services',
          subtitle: 'Track monthly recurring retainers and one-time project scope.',
        };
      case 'payments':
        return {
          title: 'Payment Records',
          subtitle: 'Complete income history log linked directly to clients & projects.',
        };
      case 'analytics':
        return {
          title: 'Revenue Analytics',
          subtitle: 'Comprehensive monthly MRR trends, client share, and payment insights.',
        };
      case 'settings':
        return {
          title: 'Profile, Settings & Export',
          subtitle: 'Edit profile, manage data, and download backups.',
        };
      default:
        return { title: 'Dashboard', subtitle: '' };
    }
  };

  const headerMeta = getPageHeader();

  return (
    <div className="min-h-screen bg-neutral-100/90 text-neutral-800 font-sans flex flex-col md:flex-row antialiased selection:bg-emerald-900 selection:text-white">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setIsMobileMenuOpen(false);
        }}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        {/* Top Header Navigation */}
        <Header
          title={headerMeta.title}
          subtitle={headerMeta.subtitle}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAddPayment={() => {
            setEditingPayment(null);
            setDefaultClientIdForPayment(undefined);
            setDefaultProjectIdForPayment(undefined);
            setIsAddPaymentOpen(true);
          }}
          onOpenAddProject={() => {
            setEditingProject(null);
            setDefaultClientIdForProject(undefined);
            setIsAddProjectOpen(true);
          }}
          onOpenAddClient={() => {
            setEditingClient(null);
            setIsAddClientOpen(true);
          }}
          profile={profile}
          onOpenEditProfile={() => setIsEditProfileModalOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onSignOut={handleSignOut}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          payments={payments}
          clients={clients}
          projects={projects}
          onSelectTab={setCurrentTab}
        />

        {/* Views Router */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto flex flex-col items-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
              <div className="w-8 h-8 border-3 border-emerald-900 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-neutral-400 font-medium">Syncing database records...</p>
            </div>
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardView
                  metrics={metrics}
                  clients={clients}
                  projects={projects}
                  payments={payments}
                  onOpenAddClient={() => {
                    setEditingClient(null);
                    setIsAddClientOpen(true);
                  }}
                  onOpenAddProject={() => {
                    setEditingProject(null);
                    setDefaultClientIdForProject(undefined);
                    setIsAddProjectOpen(true);
                  }}
                  onOpenAddPayment={() => {
                    setEditingPayment(null);
                    setDefaultClientIdForPayment(undefined);
                    setDefaultProjectIdForPayment(undefined);
                    setIsAddPaymentOpen(true);
                  }}
                  onSelectClient={(client) => {
                    setSelectedClientForDrawer(client);
                    setCurrentTab('clients');
                  }}
                  onSelectTab={setCurrentTab}
                />
              )}

              {currentTab === 'clients' && (
                <ClientsView
                  clients={clients}
                  projects={projects}
                  payments={payments}
                  onOpenAddClient={() => {
                    setEditingClient(null);
                    setIsAddClientOpen(true);
                  }}
                  onEditClient={(client) => {
                    setEditingClient(client);
                    setIsAddClientOpen(true);
                  }}
                  onDeleteClient={handleDeleteClient}
                  onOpenAddProjectForClient={(cId) => {
                    setEditingProject(null);
                    setDefaultClientIdForProject(cId);
                    setIsAddProjectOpen(true);
                  }}
                  onOpenAddPaymentForClient={(cId) => {
                    setEditingPayment(null);
                    setDefaultClientIdForPayment(cId);
                    setDefaultProjectIdForPayment(undefined);
                    setIsAddPaymentOpen(true);
                  }}
                  selectedClientForDrawer={selectedClientForDrawer}
                  onCloseDrawer={() => setSelectedClientForDrawer(null)}
                  onSelectClientForDrawer={(client) => setSelectedClientForDrawer(client)}
                />
              )}

              {currentTab === 'projects' && (
                <ProjectsView
                  projects={projects}
                  clients={clients}
                  onOpenAddProject={() => {
                    setEditingProject(null);
                    setDefaultClientIdForProject(undefined);
                    setIsAddProjectOpen(true);
                  }}
                  onEditProject={(proj) => {
                    setEditingProject(proj);
                    setIsAddProjectOpen(true);
                  }}
                  onDeleteProject={handleDeleteProject}
                  onOpenAddPaymentForProject={(cId, pId) => {
                    setEditingPayment(null);
                    setDefaultClientIdForPayment(cId);
                    setDefaultProjectIdForPayment(pId);
                    setIsAddPaymentOpen(true);
                  }}
                />
              )}

              {currentTab === 'payments' && (
                <PaymentsView
                  payments={payments}
                  clients={clients}
                  projects={projects}
                  onOpenAddPayment={() => {
                    setEditingPayment(null);
                    setDefaultClientIdForPayment(undefined);
                    setDefaultProjectIdForPayment(undefined);
                    setIsAddPaymentOpen(true);
                  }}
                  onEditPayment={(pay) => {
                    setEditingPayment(pay);
                    setIsAddPaymentOpen(true);
                  }}
                  onDeletePayment={handleDeletePayment}
                />
              )}

              {currentTab === 'analytics' && (
                <AnalyticsView
                  metrics={metrics}
                  clients={clients}
                  projects={projects}
                  payments={payments}
                />
              )}

              {currentTab === 'settings' && (
                <SettingsView
                  clients={clients}
                  projects={projects}
                  payments={payments}
                  profile={profile}
                  onOpenEditProfile={() => setIsEditProfileModalOpen(true)}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                  onResetDemoData={handleResetDemoData}
                  onRefreshData={loadData}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* ALL MODALS */}
      <AddClientModal
        isOpen={isAddClientOpen}
        onClose={() => setIsAddClientOpen(false)}
        onSave={handleSaveClient}
        editingClient={editingClient}
      />

      <AddProjectModal
        isOpen={isAddProjectOpen}
        onClose={() => setIsAddProjectOpen(false)}
        clients={clients}
        onSave={handleSaveProject}
        editingProject={editingProject}
        defaultClientId={defaultClientIdForProject}
      />

      <AddPaymentModal
        isOpen={isAddPaymentOpen}
        onClose={() => setIsAddPaymentOpen(false)}
        clients={clients}
        projects={projects}
        onSave={handleSavePayment}
        editingPayment={editingPayment}
        defaultClientId={defaultClientIdForPayment}
        defaultProjectId={defaultProjectIdForPayment}
      />

      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        clients={clients}
        projects={projects}
        payments={payments}
        onSelectClient={(c) => {
          setSelectedClientForDrawer(c);
          setCurrentTab('clients');
        }}
        onSelectProject={() => setCurrentTab('projects')}
        onSelectPayment={() => setCurrentTab('payments')}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        currentProfile={profile}
        onProfileUpdated={(updatedProf) => setProfile(updatedProf)}
      />
    </div>
  );
}
