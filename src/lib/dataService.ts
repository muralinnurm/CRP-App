import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  onSnapshot 
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Client, Project, Payment, DashboardMetrics } from '../types';
import { SAMPLE_SEED_CLIENTS, SAMPLE_SEED_PROJECTS, SAMPLE_SEED_PAYMENTS } from './initialData';

const LOCAL_CLIENTS_KEY = 'crt_local_clients_v1';
const LOCAL_PROJECTS_KEY = 'crt_local_projects_v1';
const LOCAL_PAYMENTS_KEY = 'crt_local_payments_v1';

export function computeMetrics(
  clients: Client[],
  projects: Project[],
  payments: Payment[]
): DashboardMetrics {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const activeClientsCount = clients.filter((c) => c.status === 'active').length;
  const activeProjectsCount = projects.filter((p) => p.status === 'active').length;

  const activeRecurringProjects = projects.filter(
    (p) => p.status === 'active' && p.type === 'monthly_recurring'
  );
  const totalMRR = activeRecurringProjects.reduce(
    (sum, p) => sum + Number(p.expected_amount || 0),
    0
  );

  const receivedThisMonthPayments = payments.filter((p) => {
    if (p.status !== 'received') return false;
    const d = new Date(p.payment_date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });
  const paymentsReceivedThisMonth = receivedThisMonthPayments.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );

  const pendingPayments = payments.filter((p) => p.status === 'pending');
  const outstandingRevenue = pendingPayments.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );

  const clientPaymentsMap = new Map<string, number>();
  payments.forEach((pay) => {
    if (pay.status === 'received') {
      const curr = clientPaymentsMap.get(pay.client_id) || 0;
      clientPaymentsMap.set(pay.client_id, curr + Number(pay.amount));
    }
  });

  const highestPayingClients = clients
    .map((client) => {
      const clientProjects = projects.filter((p) => p.client_id === client.id);
      const clientMRR = clientProjects
        .filter((p) => p.status === 'active' && p.type === 'monthly_recurring')
        .reduce((sum, p) => sum + Number(p.expected_amount || 0), 0);

      return {
        client,
        totalRevenue: clientPaymentsMap.get(client.id) || 0,
        mrr: clientMRR,
        projectCount: clientProjects.length,
      };
    })
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  const projectPaymentsMap = new Map<string, number>();
  payments.forEach((pay) => {
    if (pay.status === 'received') {
      const curr = projectPaymentsMap.get(pay.project_id) || 0;
      projectPaymentsMap.set(pay.project_id, curr + Number(pay.amount));
    }
  });

  const clientMap = new Map<string, string>(clients.map((c) => [c.id, c.name]));
  const highestPayingProjects = projects
    .map((project) => ({
      project,
      clientName: clientMap.get(project.client_id) || 'Client',
      totalReceived: projectPaymentsMap.get(project.id) || 0,
    }))
    .sort((a, b) => b.totalReceived - a.totalReceived);

  const monthlyChartData = Array.from({ length: 6 }).map((_, idx) => {
    const monthOffset = 5 - idx;
    const targetDate = new Date(currentYear, currentMonth - monthOffset, 1);
    const tYear = targetDate.getFullYear();
    const tMonth = targetDate.getMonth();
    const monthLabel = targetDate.toLocaleString('en-US', { month: 'short' });

    const receivedInMonth = payments
      .filter((p) => {
        if (p.status !== 'received') return false;
        const d = new Date(p.payment_date);
        return d.getFullYear() === tYear && d.getMonth() === tMonth;
      })
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      month: monthLabel,
      mrr: totalMRR,
      received: receivedInMonth,
      expected: totalMRR,
    };
  });

  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
    .slice(0, 6);

  return {
    totalMRR,
    paymentsReceivedThisMonth,
    outstandingRevenue,
    activeClientsCount,
    activeProjectsCount,
    highestPayingClients,
    highestPayingProjects,
    monthlyChartData,
    recentPayments,
  };
}

function getUserId(): string {
  if (auth.currentUser && auth.currentUser.uid) {
    return auth.currentUser.uid;
  }
  const stored = localStorage.getItem('crt_user_profile_v1');
  if (stored) {
    try {
      const prof = JSON.parse(stored);
      if (prof && prof.id && prof.id !== 'user_default' && prof.id !== 'local_user') {
        return prof.id;
      }
    } catch {
      // ignore parsing error
    }
  }
  return '';
}

function getLocalClients(): Client[] {
  const str = localStorage.getItem(LOCAL_CLIENTS_KEY);
  if (str === null) {
    localStorage.setItem(LOCAL_CLIENTS_KEY, JSON.stringify(SAMPLE_SEED_CLIENTS));
    return SAMPLE_SEED_CLIENTS;
  }
  try { return JSON.parse(str); } catch { return []; }
}

function getLocalProjects(): Project[] {
  const str = localStorage.getItem(LOCAL_PROJECTS_KEY);
  if (str === null) {
    localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(SAMPLE_SEED_PROJECTS));
    return SAMPLE_SEED_PROJECTS;
  }
  try { return JSON.parse(str); } catch { return []; }
}

function getLocalPayments(): Payment[] {
  const str = localStorage.getItem(LOCAL_PAYMENTS_KEY);
  if (str === null) {
    localStorage.setItem(LOCAL_PAYMENTS_KEY, JSON.stringify(SAMPLE_SEED_PAYMENTS));
    return SAMPLE_SEED_PAYMENTS;
  }
  try { return JSON.parse(str); } catch { return []; }
}

export const dataService = {
  getCachedData() {
    const clients = getLocalClients();
    const projects = getLocalProjects();
    const payments = getLocalPayments();
    return {
      clients,
      projects,
      payments,
      metrics: computeMetrics(clients, projects, payments),
    };
  },

  saveToCache(clients: Client[], projects: Project[], payments: Payment[]): void {
    localStorage.setItem(LOCAL_CLIENTS_KEY, JSON.stringify(clients));
    localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
    localStorage.setItem(LOCAL_PAYMENTS_KEY, JSON.stringify(payments));
  },

  // Sync any items stored locally to Firestore for the authenticated user
  async syncLocalToFirestore(uid: string): Promise<void> {
    if (!uid || uid === 'local_user') return;

    try {
      const localClients = getLocalClients();
      const localProjects = getLocalProjects();
      const localPayments = getLocalPayments();

      if (localClients.length === 0 && localProjects.length === 0 && localPayments.length === 0) return;

      const batch = writeBatch(db);
      let count = 0;

      localClients.forEach((c) => {
        const ref = doc(db, 'clients', c.id);
        batch.set(ref, { ...c, userId: uid }, { merge: true });
        count++;
      });

      localProjects.forEach((p) => {
        const ref = doc(db, 'projects', p.id);
        batch.set(ref, { ...p, userId: uid }, { merge: true });
        count++;
      });

      localPayments.forEach((pay) => {
        const ref = doc(db, 'payments', pay.id);
        batch.set(ref, { ...pay, userId: uid }, { merge: true });
        count++;
      });

      if (count > 0) {
        await batch.commit();
      }
    } catch (err) {
      console.warn('Syncing local data to Firestore note:', err);
    }
  },

  // Fetch all user data from Firestore
  async fetchAllData() {
    const uid = getUserId();
    if (!uid || uid === 'local_user') {
      return this.getCachedData();
    }

    try {
      // Sync local items to Firestore if present
      await this.syncLocalToFirestore(uid);

      // Query clients
      const clientsQ = query(collection(db, 'clients'), where('userId', '==', uid));
      const clientsSnap = await getDocs(clientsQ);
      let clientsList: Client[] = clientsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Client));

      // Query projects
      const projectsQ = query(collection(db, 'projects'), where('userId', '==', uid));
      const projectsSnap = await getDocs(projectsQ);
      let projectsList: Project[] = projectsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Project));

      // Query payments
      const paymentsQ = query(collection(db, 'payments'), where('userId', '==', uid));
      const paymentsSnap = await getDocs(paymentsQ);
      let paymentsList: Payment[] = paymentsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Payment));

      // If user has 0 records in Firestore, seed initial demo data into Firestore for them
      if (clientsList.length === 0 && projectsList.length === 0 && paymentsList.length === 0) {
        await this.seedFirestoreSampleData(uid);

        // Re-fetch after seeding
        const cSnap = await getDocs(clientsQ);
        clientsList = cSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Client));
        const prSnap = await getDocs(projectsQ);
        projectsList = prSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Project));
        const paSnap = await getDocs(paymentsQ);
        paymentsList = paSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Payment));
      }

      this.saveToCache(clientsList, projectsList, paymentsList);
      return {
        clients: clientsList,
        projects: projectsList,
        payments: paymentsList,
        metrics: computeMetrics(clientsList, projectsList, paymentsList),
      };
    } catch (err) {
      console.warn('Error fetching Firestore data, returning cached state:', err);
      return this.getCachedData();
    }
  },

  // Real-time Firestore synchronization listener
  subscribeToUserData(
    uid: string,
    onUpdate: (data: { clients: Client[]; projects: Project[]; payments: Payment[]; metrics: DashboardMetrics }) => void
  ) {
    if (!uid || uid === 'local_user') return () => {};

    let clientsList: Client[] = [];
    let projectsList: Project[] = [];
    let paymentsList: Payment[] = [];

    let clientsLoaded = false;
    let projectsLoaded = false;
    let paymentsLoaded = false;

    // Trigger local-to-Firestore sync on subscription
    this.syncLocalToFirestore(uid);

    const notifyIfReady = async () => {
      if (clientsLoaded && projectsLoaded && paymentsLoaded) {
        if (clientsList.length === 0 && projectsList.length === 0 && paymentsList.length === 0) {
          await this.seedFirestoreSampleData(uid);
          this.saveToCache(SAMPLE_SEED_CLIENTS, SAMPLE_SEED_PROJECTS, SAMPLE_SEED_PAYMENTS);
          const metrics = computeMetrics(SAMPLE_SEED_CLIENTS, SAMPLE_SEED_PROJECTS, SAMPLE_SEED_PAYMENTS);
          onUpdate({ clients: SAMPLE_SEED_CLIENTS, projects: SAMPLE_SEED_PROJECTS, payments: SAMPLE_SEED_PAYMENTS, metrics });
          return;
        }
        this.saveToCache(clientsList, projectsList, paymentsList);
        const metrics = computeMetrics(clientsList, projectsList, paymentsList);
        onUpdate({ clients: clientsList, projects: projectsList, payments: paymentsList, metrics });
      }
    };

    const clientsQ = query(collection(db, 'clients'), where('userId', '==', uid));
    const unsubClients = onSnapshot(
      clientsQ,
      (snap) => {
        clientsList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Client));
        clientsLoaded = true;
        notifyIfReady();
      },
      (err) => console.warn('Clients snapshot listener warning:', err)
    );

    const projectsQ = query(collection(db, 'projects'), where('userId', '==', uid));
    const unsubProjects = onSnapshot(
      projectsQ,
      (snap) => {
        projectsList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Project));
        projectsLoaded = true;
        notifyIfReady();
      },
      (err) => console.warn('Projects snapshot listener warning:', err)
    );

    const paymentsQ = query(collection(db, 'payments'), where('userId', '==', uid));
    const unsubPayments = onSnapshot(
      paymentsQ,
      (snap) => {
        paymentsList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Payment));
        paymentsLoaded = true;
        notifyIfReady();
      },
      (err) => console.warn('Payments snapshot listener warning:', err)
    );

    return () => {
      unsubClients();
      unsubProjects();
      unsubPayments();
    };
  },

  async seedFirestoreSampleData(uid: string): Promise<void> {
    const batch = writeBatch(db);

    SAMPLE_SEED_CLIENTS.forEach((c) => {
      const ref = doc(db, 'clients', c.id);
      batch.set(ref, { ...c, userId: uid });
    });

    SAMPLE_SEED_PROJECTS.forEach((p) => {
      const ref = doc(db, 'projects', p.id);
      batch.set(ref, { ...p, userId: uid });
    });

    SAMPLE_SEED_PAYMENTS.forEach((pay) => {
      const ref = doc(db, 'payments', pay.id);
      batch.set(ref, { ...pay, userId: uid });
    });

    try {
      await batch.commit();
    } catch (err) {
      console.warn('Error committing sample seed batch to Firestore:', err);
    }
  },

  async clearAllData(): Promise<void> {
    const uid = getUserId();
    if (uid) {
      try {
        const batch = writeBatch(db);
        const clientsSnap = await getDocs(query(collection(db, 'clients'), where('userId', '==', uid)));
        clientsSnap.docs.forEach((d) => batch.delete(d.ref));

        const projectsSnap = await getDocs(query(collection(db, 'projects'), where('userId', '==', uid)));
        projectsSnap.docs.forEach((d) => batch.delete(d.ref));

        const paymentsSnap = await getDocs(query(collection(db, 'payments'), where('userId', '==', uid)));
        paymentsSnap.docs.forEach((d) => batch.delete(d.ref));

        await batch.commit();
      } catch (e) {
        console.warn('Clear Firestore failed:', e);
      }
    }
    this.saveToCache([], [], []);
  },

  async seedSampleData(): Promise<void> {
    const uid = getUserId();
    if (uid) {
      await this.seedFirestoreSampleData(uid);
    }
    this.saveToCache(SAMPLE_SEED_CLIENTS, SAMPLE_SEED_PROJECTS, SAMPLE_SEED_PAYMENTS);
  },

  async resetToDemoData(): Promise<void> {
    await this.clearAllData();
    await this.seedSampleData();
  },

  // CLIENTS CRUD
  async getClients(): Promise<Client[]> {
    const { clients } = await this.fetchAllData();
    return clients;
  },

  async addClient(client: Omit<Client, 'id' | 'created_at'>): Promise<Client> {
    const uid = getUserId();
    const id = 'c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newClient: Client = {
      ...client,
      id,
      created_at: new Date().toISOString(),
    };

    if (uid) {
      try {
        await setDoc(doc(db, 'clients', id), {
          ...newClient,
          userId: uid,
        });
      } catch (err) {
        console.warn('Error saving client to Firestore:', err);
      }
    }

    const currentClients = getLocalClients();
    const updated = [newClient, ...currentClients];
    localStorage.setItem(LOCAL_CLIENTS_KEY, JSON.stringify(updated));
    return newClient;
  },

  async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
    const uid = getUserId();
    const clients = getLocalClients();
    const index = clients.findIndex((c) => c.id === id);
    let updatedClient: Client;
    if (index !== -1) {
      clients[index] = { ...clients[index], ...updates };
      updatedClient = clients[index];
    } else {
      updatedClient = { id, ...updates } as Client;
      clients.unshift(updatedClient);
    }

    if (uid) {
      try {
        const clientRef = doc(db, 'clients', id);
        await setDoc(clientRef, { ...updatedClient, userId: uid }, { merge: true });
      } catch (err) {
        console.warn('Error updating client in Firestore:', err);
      }
    }

    localStorage.setItem(LOCAL_CLIENTS_KEY, JSON.stringify(clients));
    return updatedClient;
  },

  async deleteClient(id: string): Promise<void> {
    const uid = getUserId();
    if (uid) {
      try {
        await deleteDoc(doc(db, 'clients', id));
      } catch (err) {
        console.warn('Error deleting client in Firestore:', err);
      }
    }

    const clients = getLocalClients().filter((c) => c.id !== id);
    const projects = getLocalProjects().filter((p) => p.client_id !== id);
    const payments = getLocalPayments().filter((pay) => pay.client_id !== id);

    this.saveToCache(clients, projects, payments);
  },

  // PROJECTS CRUD
  async getProjects(): Promise<Project[]> {
    const { projects } = await this.fetchAllData();
    return projects;
  },

  async addProject(project: Omit<Project, 'id' | 'created_at'>): Promise<Project> {
    const uid = getUserId();
    const id = 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newProject: Project = {
      ...project,
      id,
      created_at: new Date().toISOString(),
    };

    if (uid) {
      try {
        await setDoc(doc(db, 'projects', id), {
          ...newProject,
          userId: uid,
        });
      } catch (err) {
        console.warn('Error adding project to Firestore:', err);
      }
    }

    const projects = getLocalProjects();
    const updated = [newProject, ...projects];
    localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(updated));
    return newProject;
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const uid = getUserId();
    const projects = getLocalProjects();
    const index = projects.findIndex((p) => p.id === id);
    let updatedProject: Project;
    if (index !== -1) {
      projects[index] = { ...projects[index], ...updates };
      updatedProject = projects[index];
    } else {
      updatedProject = { id, ...updates } as Project;
      projects.unshift(updatedProject);
    }

    if (uid) {
      try {
        await setDoc(doc(db, 'projects', id), { ...updatedProject, userId: uid }, { merge: true });
      } catch (err) {
        console.warn('Error updating project in Firestore:', err);
      }
    }

    localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
    return updatedProject;
  },

  async deleteProject(id: string): Promise<void> {
    const uid = getUserId();
    if (uid) {
      try {
        await deleteDoc(doc(db, 'projects', id));
      } catch (err) {
        console.warn('Error deleting project from Firestore:', err);
      }
    }

    const projects = getLocalProjects().filter((p) => p.id !== id);
    const payments = getLocalPayments().filter((pay) => pay.project_id !== id);
    const clients = getLocalClients();
    this.saveToCache(clients, projects, payments);
  },

  // PAYMENTS CRUD
  async getPayments(): Promise<Payment[]> {
    const { payments } = await this.fetchAllData();
    return payments;
  },

  async addPayment(payment: Omit<Payment, 'id' | 'created_at'>): Promise<Payment> {
    const uid = getUserId();
    const id = 'pay_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newPayment: Payment = {
      ...payment,
      id,
      created_at: new Date().toISOString(),
    };

    if (uid) {
      try {
        await setDoc(doc(db, 'payments', id), {
          ...newPayment,
          userId: uid,
        });
      } catch (err) {
        console.warn('Error adding payment to Firestore:', err);
      }
    }

    const payments = getLocalPayments();
    const updated = [newPayment, ...payments];
    localStorage.setItem(LOCAL_PAYMENTS_KEY, JSON.stringify(updated));
    return newPayment;
  },

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment> {
    const uid = getUserId();
    const payments = getLocalPayments();
    const index = payments.findIndex((p) => p.id === id);
    let updatedPayment: Payment;
    if (index !== -1) {
      payments[index] = { ...payments[index], ...updates };
      updatedPayment = payments[index];
    } else {
      updatedPayment = { id, ...updates } as Payment;
      payments.unshift(updatedPayment);
    }

    if (uid) {
      try {
        await setDoc(doc(db, 'payments', id), { ...updatedPayment, userId: uid }, { merge: true });
      } catch (err) {
        console.warn('Error updating payment in Firestore:', err);
      }
    }

    localStorage.setItem(LOCAL_PAYMENTS_KEY, JSON.stringify(payments));
    return updatedPayment;
  },

  async deletePayment(id: string): Promise<void> {
    const uid = getUserId();
    if (uid) {
      try {
        await deleteDoc(doc(db, 'payments', id));
      } catch (err) {
        console.warn('Error deleting payment from Firestore:', err);
      }
    }

    const payments = getLocalPayments().filter((p) => p.id !== id);
    const clients = getLocalClients();
    const projects = getLocalProjects();
    this.saveToCache(clients, projects, payments);
  },

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const { metrics } = await this.fetchAllData();
    return metrics;
  },
};
