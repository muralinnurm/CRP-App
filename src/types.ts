export type ProjectType = 'monthly_recurring' | 'one_time';
export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'pending';
export type PaymentStatus = 'received' | 'pending' | 'overdue';
export type PaymentMethod = 'bank_transfer' | 'stripe' | 'paypal' | 'check' | 'cash' | 'other';
export type ClientStatus = 'active' | 'inactive';

export interface UserProfile {
  id?: string;
  email: string;
  fullName: string;
  companyName?: string;
  jobTitle?: string;
  avatarUrl?: string;
  currencySymbol?: string;
  phone?: string;
  isVerified?: boolean;
}

export interface Client {
  id: string;
  name: string;
  company?: string;
  companies?: string[]; // Multiple associated companies
  email?: string;
  phone?: string;
  avatar_url?: string; // 50x50 image URL
  status: ClientStatus;
  notes?: string;
  created_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  title: string;
  type: ProjectType;
  expected_amount: number;
  status: ProjectStatus;
  billing_cycle_day?: number; // 1-31 for recurring monthly
  due_date?: string; // for one-time
  company_name?: string; // Linked client company name
  notes?: string;
  created_at: string;
  // Computed / joined fields
  client_name?: string;
}

export interface Payment {
  id: string;
  client_id: string;
  project_id: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  reference_id?: string;
  notes?: string;
  status: PaymentStatus;
  created_at: string;
  // Computed / joined fields
  client_name?: string;
  project_title?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'overdue' | 'upcoming_mrr' | 'pending_payment' | 'info';
  timestamp: string;
  isRead: boolean;
  linkTab?: string;
  amount?: number;
}

export interface DashboardMetrics {
  totalMRR: number;
  paymentsReceivedThisMonth: number;
  outstandingRevenue: number;
  activeClientsCount: number;
  activeProjectsCount: number;
  highestPayingClients: {
    client: Client;
    totalRevenue: number;
    mrr: number;
    projectCount: number;
  }[];
  highestPayingProjects: {
    project: Project;
    clientName: string;
    totalReceived: number;
  }[];
  monthlyChartData: {
    month: string;
    mrr: number;
    received: number;
    expected: number;
  }[];
  recentPayments: Payment[];
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}
