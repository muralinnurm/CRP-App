import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  writeBatch 
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Client, Project, Payment, DashboardMetrics } from '../types';
import { SAMPLE_SEED_CLIENTS, SAMPLE_SEED_PROJECTS, SAMPLE_SEED_PAYMENTS } from './initialData';

const LOCAL_CLIENTS_KEY = 'crt_local_clients_v1';
const LOCAL_PROJECTS_KEY = 'crt_local_projects_v1';
const LOCAL_PAYMENTS_KEY = 'crt_local_payments_v1';

const getUserId = (): string | null => {
  return auth.currentUser?.uid || null;
};

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
        .reduce((sum, p) => sum + Number(p.expected_amount), 0);

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

export const dataService = {
  // Synchronous cache reader for instant zero-wait UI rendering
  getCachedData(): { clients: Client[]; projects: Project[]; payments: Payment[]; metrics: DashboardMetrics } {
    try {
      const cStr = localStorage.getItem(LOCAL_CLIENTS_KEY);
      const pStr = localStorage.getItem(LOCAL_PROJECTS_KEY);
      const payStr = localStorage.getItem(LOCAL_PAYMENTS_KEY);

      let clients: Client[] = cStr ? JSON.parse(cStr) : [];
      let projects: Project[] = pStr ? JSON.parse(pStr) : [];
      let payments: Payment[] = payStr ? JSON.parse(payStr) : [];

      // Purge any legacy demo seed records
      const demoClientIds = new Set(['c1', 'c2']);
      const demoProjectIds = new Set(['p1', 'p2']);
      const demoPaymentIds = new Set(['pay_1']);

      const cleanClients = clients.filter((c) => !demoClientIds.has(c.id));
      const cleanProjects = projects.filter((p) => !demoProjectIds.has(p.id) && !demoClientIds.has(p.client_id));
      const cleanPayments = payments.filter((pay) => !demoPaymentIds.has(pay.id) && !demoClientIds.has(pay.client_id));

      if (cleanClients.length !== clients.length) {
        localStorage.setItem(LOCAL_CLIENTS_KEY, JSON.stringify(cleanClients));
      }
      if (cleanProjects.length !== projects.length) {
        localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(cleanProjects));
      }
      if (cleanPayments.length !== payments.length) {
        localStorage.setItem(LOCAL_PAYMENTS_KEY, JSON.stringify(cleanPayments));
      }

      return {
        clients: cleanClients,
        projects: cleanProjects,
        payments: cleanPayments,
        metrics: computeMetrics(cleanClients, cleanProjects, cleanPayments),
      };
    } catch {
      return {
        clients: [],
        projects: [],
        payments: [],
        metrics: computeMetrics([], [], []),
      };
    }
  },

  // Parallel optimized batch fetcher for all user data
  async fetchAllData(): Promise<{
    clients: Client[];
    projects: Project[];
    payments: Payment[];
    metrics: DashboardMetrics;
  }> {
    const userId = getUserId();
    if (!userId) {
      return this.getCachedData();
    }

    try {
      const fetchPromise = Promise.all([
        getDocs(query(collection(db, 'clients'), where('userId', '==', userId))),
        getDocs(query(collection(db, 'projects'), where('userId', '==', userId))),
        getDocs(query(collection(db, 'payments'), where('userId', '==', userId))),
      ]);

      // 2.5 second timeout guard to avoid UI freezing on slow networks or offline states
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore network timeout')), 2500)
      );

      const [clientsSnap, projectsSnap, paymentsSnap] = (await Promise.race([
        fetchPromise,
        timeoutPromise,
      ])) as any[];

      // Clients
      const clients: Client[] = [];
      clientsSnap.forEach((d: any) => {
        const data = d.data();
        clients.push({
          id: d.id,
          name: data.name || '',
          company: data.company || '',
          companies: data.companies || [],
          email: data.email || '',
          phone: data.phone || '',
          avatar_url: data.avatar_url || '',
          status: data.status || 'active',
          notes: data.notes || '',
          created_at: data.created_at || new Date().toISOString(),
        });
      });

      const clientMap = new Map<string, string>(clients.map((c) => [c.id, c.name]));

      // Projects
      const projects: Project[] = [];
      projectsSnap.forEach((d: any) => {
        const data = d.data();
        projects.push({
          id: d.id,
          client_id: data.client_id || '',
          client_name: clientMap.get(data.client_id) || 'Unknown Client',
          title: data.title || '',
          type: data.type || 'monthly_recurring',
          expected_amount: Number(data.expected_amount || 0),
          status: data.status || 'active',
          billing_cycle_day: Number(data.billing_cycle_day || 1),
          due_date: data.due_date || '',
          company_name: data.company_name || '',
          notes: data.notes || '',
          created_at: data.created_at || new Date().toISOString(),
        });
      });

      const projectMap = new Map<string, string>(projects.map((p) => [p.id, p.title]));

      // Payments
      const payments: Payment[] = [];
      paymentsSnap.forEach((d: any) => {
        const data = d.data();
        payments.push({
          id: d.id,
          client_id: data.client_id || '',
          client_name: clientMap.get(data.client_id) || 'Unknown Client',
          project_id: data.project_id || '',
          project_title: projectMap.get(data.project_id) || 'General Service',
          amount: Number(data.amount || 0),
          payment_date: data.payment_date || new Date().toISOString().split('T')[0],
          payment_method: data.payment_method || 'Bank Transfer',
          reference_id: data.reference_id || '',
          status: data.status || 'received',
          notes: data.notes || '',
          created_at: data.created_at || new Date().toISOString(),
        });
      });

      // Update local storage cache
      localStorage.setItem(LOCAL_CLIENTS_KEY, JSON.stringify(clients));
      localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
      localStorage.setItem(LOCAL_PAYMENTS_KEY, JSON.stringify(payments));

      const metrics = computeMetrics(clients, projects, payments);
      return { clients, projects, payments, metrics };
    } catch (err) {
      console.warn('Firestore fetch fallback to cache:', err);
      return this.getCachedData();
    }
  },

  // Clear all client, project, and payment records for current user
  async clearAllData(): Promise<void> {
    const userId = getUserId();
    if (userId) {
      try {
        const batch = writeBatch(db);

        // Fetch & delete user clients
        const clientsSnap = await getDocs(query(collection(db, 'clients'), where('userId', '==', userId)));
        clientsSnap.forEach((d) => batch.delete(d.ref));

        // Fetch & delete user projects
        const projectsSnap = await getDocs(query(collection(db, 'projects'), where('userId', '==', userId)));
        projectsSnap.forEach((d) => batch.delete(d.ref));

        // Fetch & delete user payments
        const paymentsSnap = await getDocs(query(collection(db, 'payments'), where('userId', '==', userId)));
        paymentsSnap.forEach((d) => batch.delete(d.ref));

        await batch.commit();
        return;
      } catch (err) {
        console.warn('Error clearing Firestore data:', err);
      }
    }

    // Fallback to local storage
    localStorage.setItem(LOCAL_CLIENTS_KEY, JSON.stringify([]));
    localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify([]));
    localStorage.setItem(LOCAL_PAYMENTS_KEY, JSON.stringify([]));
  },

  // Seed sample data for current user in Firestore
  async seedSampleData(): Promise<void> {
    const userId = getUserId();
    if (userId) {
      try {
        const clientRefMap = new Map<string, string>();
        const projectRefMap = new Map<string, string>();

        // Seed clients
        for (const seedClient of SAMPLE_SEED_CLIENTS) {
          const docRef = await addDoc(collection(db, 'clients'), {
            userId,
            name: seedClient.name,
            company: seedClient.company || '',
            companies: seedClient.companies || [],
            email: seedClient.email || '',
            phone: seedClient.phone || '',
            avatar_url: seedClient.avatar_url || '',
            status: seedClient.status || 'active',
            notes: seedClient.notes || '',
            created_at: new Date().toISOString(),
          });
          clientRefMap.set(seedClient.id, docRef.id);
        }

        // Seed projects
        for (const seedProject of SAMPLE_SEED_PROJECTS) {
          const newClientId = clientRefMap.get(seedProject.client_id) || seedProject.client_id;
          const docRef = await addDoc(collection(db, 'projects'), {
            userId,
            client_id: newClientId,
            title: seedProject.title,
            type: seedProject.type,
            expected_amount: Number(seedProject.expected_amount || 0),
            status: seedProject.status || 'active',
            billing_cycle_day: Number(seedProject.billing_cycle_day || 1),
            due_date: seedProject.due_date || '',
            company_name: seedProject.company_name || '',
            notes: seedProject.notes || '',
            created_at: new Date().toISOString(),
          });
          projectRefMap.set(seedProject.id, docRef.id);
        }

        // Seed payments
        for (const seedPayment of SAMPLE_SEED_PAYMENTS) {
          const newClientId = clientRefMap.get(seedPayment.client_id) || seedPayment.client_id;
          const newProjectId = projectRefMap.get(seedPayment.project_id) || seedPayment.project_id;

          await addDoc(collection(db, 'payments'), {
            userId,
            client_id: newClientId,
            project_id: newProjectId,
            amount: Number(seedPayment.amount || 0),
            payment_date: seedPayment.payment_date,
            payment_method: seedPayment.payment_method || 'Bank Transfer',
            reference_id: seedPayment.reference_id || '',
            status: seedPayment.status || 'received',
            notes: seedPayment.notes || '',
            created_at: new Date().toISOString(),
          });
        }
        return;
      } catch (err) {
        console.warn('Error seeding sample data to Firestore:', err);
      }
    }

    // Local storage fallback
    localStorage.setItem(LOCAL_CLIENTS_KEY, JSON.stringify(SAMPLE_SEED_CLIENTS));
    localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(SAMPLE_SEED_PROJECTS));
    localStorage.setItem(LOCAL_PAYMENTS_KEY, JSON.stringify(SAMPLE_SEED_PAYMENTS));
  },

  async resetToDemoData(): Promise<void> {
    await this.clearAllData();
  },

  // CLIENTS
  async getClients(): Promise<Client[]> {
    return (await this.fetchAllData()).clients;
  },

  async addClient(client: Omit<Client, 'id' | 'created_at'>): Promise<Client> {
    const userId = getUserId();
    const createdAt = new Date().toISOString();
    const tempId = 'c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    const newClient: Client = {
      ...client,
      id: tempId,
      created_at: createdAt,
    };

    // 1. Instantly update local cache
    const cached = this.getCachedData();
    const updatedClients = [newClient, ...cached.clients.filter((c) => c.id !== tempId)];
    localStorage.setItem(LOCAL_CLIENTS_KEY, JSON.stringify(updatedClients));

    // 2. Sync to Firestore with 2-second timeout guard
    if (userId) {
      try {
        const addPromise = addDoc(collection(db, 'clients'), {
          ...client,
          userId,
          created_at: createdAt,
        });
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firestore write timeout')), 2000)
        );
        const docRef = (await Promise.race([addPromise, timeoutPromise])) as any;
        if (docRef?.id) {
          newClient.id = docRef.id;
          const finalClients = updatedClients.map((c) =>
            c.id === tempId ? { ...c, id: docRef.id } : c
          );
          localStorage.setItem(LOCAL_CLIENTS_KEY, JSON.stringify(finalClients));
        }
      } catch (err) {
        console.warn('Firestore addClient sync fallback to local cache:', err);
      }
    }

    return newClient;
  },

  async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
    const userId = getUserId();

    // 1. Instantly update local cache
    const cached = this.getCachedData();
    const index = cached.clients.findIndex((c) => c.id === id);
    let updatedClient: Client;
    if (index !== -1) {
      cached.clients[index] = { ...cached.clients[index], ...updates };
      updatedClient = cached.clients[index];
    } else {
      updatedClient = { id, ...updates } as Client;
      cached.clients.unshift(updatedClient);
    }
    localStorage.setItem(LOCAL_CLIENTS_KEY, JSON.stringify(cached.clients));

    // 2. Sync to Firestore
    if (userId && !id.startsWith('c_')) {
      try {
        const clientRef = doc(db, 'clients', id);
        const cleanUpdates = { ...updates };
        delete (cleanUpdates as any).id;
        delete (cleanUpdates as any).created_at;

        const updatePromise = updateDoc(clientRef, cleanUpdates);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firestore update timeout')), 2000)
        );
        await Promise.race([updatePromise, timeoutPromise]);
      } catch (err) {
        console.warn('Firestore updateClient sync fallback:', err);
      }
    }

    return updatedClient;
  },

  async deleteClient(id: string): Promise<void> {
    const userId = getUserId();

    // 1. Instantly update local cache
    const cached = this.getCachedData();
    const filteredClients = cached.clients.filter((c) => c.id !== id);
    const filteredProjects = cached.projects.filter((p) => p.client_id !== id);
    const filteredPayments = cached.payments.filter((pay) => pay.client_id !== id);

    localStorage.setItem(LOCAL_CLIENTS_KEY, JSON.stringify(filteredClients));
    localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(filteredProjects));
    localStorage.setItem(LOCAL_PAYMENTS_KEY, JSON.stringify(filteredPayments));

    // 2. Sync to Firestore
    if (userId && !id.startsWith('c_')) {
      try {
        const deletePromise = (async () => {
          await deleteDoc(doc(db, 'clients', id));
          const projectsSnap = await getDocs(
            query(collection(db, 'projects'), where('userId', '==', userId), where('client_id', '==', id))
          );
          const paymentsSnap = await getDocs(
            query(collection(db, 'payments'), where('userId', '==', userId), where('client_id', '==', id))
          );
          const batch = writeBatch(db);
          projectsSnap.forEach((d) => batch.delete(d.ref));
          paymentsSnap.forEach((d) => batch.delete(d.ref));
          await batch.commit();
        })();

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firestore delete timeout')), 2000)
        );
        await Promise.race([deletePromise, timeoutPromise]);
      } catch (err) {
        console.warn('Firestore deleteClient sync fallback:', err);
      }
    }
  },

  // PROJECTS
  async getProjects(): Promise<Project[]> {
    return (await this.fetchAllData()).projects;
  },

  async addProject(project: Omit<Project, 'id' | 'created_at'>): Promise<Project> {
    const userId = getUserId();
    const createdAt = new Date().toISOString();
    const tempId = 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    const newProject: Project = {
      ...project,
      id: tempId,
      created_at: createdAt,
    };

    // 1. Instantly update local cache
    const cached = this.getCachedData();
    const updatedProjects = [newProject, ...cached.projects.filter((p) => p.id !== tempId)];
    localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(updatedProjects));

    // 2. Sync to Firestore
    if (userId) {
      try {
        const cleanData = { ...project };
        delete (cleanData as any).client_name;

        const addPromise = addDoc(collection(db, 'projects'), {
          ...cleanData,
          expected_amount: Number(cleanData.expected_amount || 0),
          userId,
          created_at: createdAt,
        });
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firestore write timeout')), 2000)
        );
        const docRef = (await Promise.race([addPromise, timeoutPromise])) as any;
        if (docRef?.id) {
          newProject.id = docRef.id;
          const finalProjects = updatedProjects.map((p) =>
            p.id === tempId ? { ...p, id: docRef.id } : p
          );
          localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(finalProjects));
        }
      } catch (err) {
        console.warn('Firestore addProject sync fallback:', err);
      }
    }

    return newProject;
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const userId = getUserId();

    // 1. Instantly update local cache
    const cached = this.getCachedData();
    const index = cached.projects.findIndex((p) => p.id === id);
    let updatedProject: Project;
    if (index !== -1) {
      cached.projects[index] = { ...cached.projects[index], ...updates };
      updatedProject = cached.projects[index];
    } else {
      updatedProject = { id, ...updates } as Project;
      cached.projects.unshift(updatedProject);
    }
    localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(cached.projects));

    // 2. Sync to Firestore
    if (userId && !id.startsWith('p_')) {
      try {
        const projectRef = doc(db, 'projects', id);
        const cleanUpdates = { ...updates };
        delete (cleanUpdates as any).id;
        delete (cleanUpdates as any).created_at;
        delete (cleanUpdates as any).client_name;

        if (cleanUpdates.expected_amount !== undefined) {
          cleanUpdates.expected_amount = Number(cleanUpdates.expected_amount);
        }

        const updatePromise = updateDoc(projectRef, cleanUpdates);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firestore update timeout')), 2000)
        );
        await Promise.race([updatePromise, timeoutPromise]);
      } catch (err) {
        console.warn('Firestore updateProject sync fallback:', err);
      }
    }

    return updatedProject;
  },

  async deleteProject(id: string): Promise<void> {
    const userId = getUserId();

    // 1. Instantly update local cache
    const cached = this.getCachedData();
    const filteredProjects = cached.projects.filter((p) => p.id !== id);
    const filteredPayments = cached.payments.filter((pay) => pay.project_id !== id);

    localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(filteredProjects));
    localStorage.setItem(LOCAL_PAYMENTS_KEY, JSON.stringify(filteredPayments));

    // 2. Sync to Firestore
    if (userId && !id.startsWith('p_')) {
      try {
        const deletePromise = (async () => {
          await deleteDoc(doc(db, 'projects', id));
          const paymentsSnap = await getDocs(
            query(collection(db, 'payments'), where('userId', '==', userId), where('project_id', '==', id))
          );
          const batch = writeBatch(db);
          paymentsSnap.forEach((d) => batch.delete(d.ref));
          await batch.commit();
        })();

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firestore delete timeout')), 2000)
        );
        await Promise.race([deletePromise, timeoutPromise]);
      } catch (err) {
        console.warn('Firestore deleteProject sync fallback:', err);
      }
    }
  },

  // PAYMENTS
  async getPayments(): Promise<Payment[]> {
    return (await this.fetchAllData()).payments;
  },

  async addPayment(payment: Omit<Payment, 'id' | 'created_at'>): Promise<Payment> {
    const userId = getUserId();
    const createdAt = new Date().toISOString();
    const tempId = 'pay_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    const newPayment: Payment = {
      ...payment,
      id: tempId,
      created_at: createdAt,
    };

    // 1. Instantly update local cache
    const cached = this.getCachedData();
    const updatedPayments = [newPayment, ...cached.payments.filter((p) => p.id !== tempId)];
    localStorage.setItem(LOCAL_PAYMENTS_KEY, JSON.stringify(updatedPayments));

    // 2. Sync to Firestore
    if (userId) {
      try {
        const cleanData = { ...payment };
        delete (cleanData as any).client_name;
        delete (cleanData as any).project_title;

        const addPromise = addDoc(collection(db, 'payments'), {
          ...cleanData,
          amount: Number(cleanData.amount || 0),
          userId,
          created_at: createdAt,
        });
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firestore write timeout')), 2000)
        );
        const docRef = (await Promise.race([addPromise, timeoutPromise])) as any;
        if (docRef?.id) {
          newPayment.id = docRef.id;
          const finalPayments = updatedPayments.map((p) =>
            p.id === tempId ? { ...p, id: docRef.id } : p
          );
          localStorage.setItem(LOCAL_PAYMENTS_KEY, JSON.stringify(finalPayments));
        }
      } catch (err) {
        console.warn('Firestore addPayment sync fallback:', err);
      }
    }

    return newPayment;
  },

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment> {
    const userId = getUserId();

    // 1. Instantly update local cache
    const cached = this.getCachedData();
    const index = cached.payments.findIndex((p) => p.id === id);
    let updatedPayment: Payment;
    if (index !== -1) {
      cached.payments[index] = { ...cached.payments[index], ...updates };
      updatedPayment = cached.payments[index];
    } else {
      updatedPayment = { id, ...updates } as Payment;
      cached.payments.unshift(updatedPayment);
    }
    localStorage.setItem(LOCAL_PAYMENTS_KEY, JSON.stringify(cached.payments));

    // 2. Sync to Firestore
    if (userId && !id.startsWith('pay_')) {
      try {
        const paymentRef = doc(db, 'payments', id);
        const cleanUpdates = { ...updates };
        delete (cleanUpdates as any).id;
        delete (cleanUpdates as any).created_at;
        delete (cleanUpdates as any).client_name;
        delete (cleanUpdates as any).project_title;

        if (cleanUpdates.amount !== undefined) {
          cleanUpdates.amount = Number(cleanUpdates.amount);
        }

        const updatePromise = updateDoc(paymentRef, cleanUpdates);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firestore update timeout')), 2000)
        );
        await Promise.race([updatePromise, timeoutPromise]);
      } catch (err) {
        console.warn('Firestore updatePayment sync fallback:', err);
      }
    }

    return updatedPayment;
  },

  async deletePayment(id: string): Promise<void> {
    const userId = getUserId();

    // 1. Instantly update local cache
    const cached = this.getCachedData();
    const filteredPayments = cached.payments.filter((p) => p.id !== id);
    localStorage.setItem(LOCAL_PAYMENTS_KEY, JSON.stringify(filteredPayments));

    // 2. Sync to Firestore
    if (userId && !id.startsWith('pay_')) {
      try {
        const deletePromise = deleteDoc(doc(db, 'payments', id));
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firestore delete timeout')), 2000)
        );
        await Promise.race([deletePromise, timeoutPromise]);
      } catch (err) {
        console.warn('Firestore deletePayment sync fallback:', err);
      }
    }
  },

  // DASHBOARD METRICS CALCULATION
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return (await this.fetchAllData()).metrics;
  },
};
