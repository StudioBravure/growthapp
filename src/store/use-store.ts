import { create } from 'zustand';
import { AppMode, Transaction, Project, PipelineStage, Debt, RecurringBill, Goal, Client, AppSettings, Category, CategorizationRule, Integration } from '@/lib/types';
import { addMonths, format, setDate } from 'date-fns';
import { api } from '@/services/api';

interface AppState {
    mode: AppMode;
    setMode: (mode: AppMode) => void;
    isSidebarOpen: boolean;

    toggleSidebar: () => void;

    // Data Loading
    isLoading: boolean;
    loadData: () => Promise<void>;

    // Transactions
    transactions: Transaction[];
    addTransaction: (t: Omit<Transaction, 'id'>) => void;
    updateTransaction: (id: string, updates: Partial<Transaction>) => void;
    deleteTransaction: (id: string) => void;

    // Projects
    projects: Project[];
    addProject: (p: Omit<Project, 'id'>) => void;
    updateProject: (id: string, updates: Partial<Project>) => void;
    updateProjectStage: (id: string, stage: PipelineStage) => void;
    deleteProject: (id: string) => void;

    // Clients
    clients: Client[];
    addClient: (c: Omit<Client, 'id'>) => void;
    updateClient: (id: string, updates: Partial<Client>) => void;
    deleteClient: (id: string) => void;

    // Debts
    debts: Debt[];
    addDebt: (d: Omit<Debt, 'id'>) => void;
    updateDebt: (id: string, updates: Partial<Debt>) => void;
    deleteDebt: (id: string) => void;
    payDebt: (id: string, amount: number) => void;

    // Recurring Bills
    recurringBills: RecurringBill[];
    addRecurringBill: (b: Omit<RecurringBill, 'id'>) => void;
    updateRecurringBill: (id: string, updates: Partial<RecurringBill>) => void;
    toggleRecurringBillStatus: (id: string) => void;
    deleteRecurringBill: (id: string) => void;
    generateMonthlyBills: (month: Date) => void;

    // Goals
    goals: Goal[];
    addGoal: (g: Omit<Goal, 'id'>) => void;
    updateGoal: (id: string, updates: Partial<Goal>) => void;
    deleteGoal: (id: string) => void;

    // Budgets
    budgets: Budget[];
    updateBudget: (category: string, mode: 'PF' | 'PJ', limit: number) => void;

    // Settings & Configuration
    settings: AppSettings;
    updateSettings: (updates: Partial<AppSettings> | ((current: AppSettings) => Partial<AppSettings>)) => void;

    categories: Category[];
    addCategory: (c: Omit<Category, 'id'>) => void;
    updateCategory: (id: string, updates: Partial<Category>) => void;
    deleteCategory: (id: string) => void;

    categorizationRules: CategorizationRule[];
    addRule: (r: Omit<CategorizationRule, 'id'>) => void;
    updateRule: (id: string, updates: Partial<CategorizationRule>) => void;
    deleteRule: (id: string) => void;
    reorderRules: (ids: string[]) => void;

    integrations: Integration[];
    updateIntegration: (id: string, updates: Partial<Integration>) => void;
}

export interface Budget {
    category: string;
    limit: number;
    mode: 'PF' | 'PJ';
}

const DEFAULT_SETTINGS: AppSettings = {
    preferences: {
        theme: 'system',
        timezone: 'America/Sao_Paulo',
        defaultDateView: 'MONTH',
    },
    modes: {
        consolidatedBehavior: 'SUM',
        defaultMode: 'CONSOLIDATED',
    },
    notifications: {
        billsWarningDays: [0, 1, 7],
        budgetThresholds: [80, 100],
        projectRiskDays: 7,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        channels: { app: true, email: false, whatsapp: false },
    },
    import: {
        dateTolerance: 2,
        amountTolerance: 0.05,
        autoCategorize: true,
        detectDuplicates: true,
    },
    studio: {
        projectStages: ['LEAD', 'PROPOSAL', 'NEGOTIATION', 'CLOSED', 'EXECUTION', 'DELIVERY', 'POST_SALE'],
        riskThresholdDays: 7,
        inactiveRiskDays: 5,
        defaultHourlyRate: 15000, // R$ 150,00
    },
};

const MOCK_CATEGORIES: Category[] = [
    { id: '1', name: 'Alimentação', type: 'EXPENSE', mode: 'PF', color: '#ef4444', isDefault: true },
    { id: '2', name: 'Moradia', type: 'EXPENSE', mode: 'PF', color: '#3b82f6', isDefault: true },
    { id: '3', name: 'Transporte', type: 'EXPENSE', mode: 'PF', color: '#eab308', isDefault: true },
    { id: '4', name: 'Salário', type: 'INCOME', mode: 'PF', color: '#10b981', isDefault: true },
    { id: '5', name: 'Projetos', type: 'INCOME', mode: 'PJ', color: '#8b5cf6', isDefault: true },
    { id: '6', name: 'Software', type: 'EXPENSE', mode: 'PJ', color: '#6366f1', isDefault: true },
    { id: '7', name: 'Impostos', type: 'EXPENSE', mode: 'PJ', color: '#f97316', isDefault: true },
];

const MOCK_RULES: CategorizationRule[] = [
    { id: '1', priority: 1, name: 'Uber Trips', condition: 'CONTAINS', value: 'Uber', categoryId: '3', mode: 'PF', active: true },
    { id: '2', priority: 2, name: 'AWS Cloufront', condition: 'CONTAINS', value: 'AWS', categoryId: '6', mode: 'PJ', active: true },
];

const MOCK_INTEGRATIONS: Integration[] = [
    { id: '1', name: 'Google Calendar', provider: 'GOOGLE_CALENDAR', status: 'DISCONNECTED' },
    { id: '2', name: 'Google Drive', provider: 'GOOGLE_DRIVE', status: 'DISCONNECTED' },
    { id: '3', name: 'WhatsApp', provider: 'WHATSAPP', status: 'DISCONNECTED' },
    { id: '4', name: 'Stripe', provider: 'STRIPE', status: 'CONNECTED', lastSync: new Date().toISOString() },
];

const MOCK_CLIENTS: Client[] = [
    { id: '1', name: 'Alpha Corp', companyName: 'Alpha Tecnologia LTDA', email: 'contato@alpha.com', contractType: 'PROJECT' },
    { id: '2', name: 'Beta Solutions', companyName: 'Beta Servicos ME', email: 'financeiro@beta.com', contractType: 'RETAINER' },
    { id: '3', name: 'Gamma Design', companyName: 'Gamma Studio', email: 'gamma@studio.com', contractType: 'HOURLY' },
];

const MOCK_RECURRING: RecurringBill[] = [
    { id: '1', description: 'Aluguel Apartamento', amount: 350000, category: 'Moradia', dayOfMonth: 5, mode: 'PF', type: 'EXPENSE', active: true },
    { id: '2', description: 'Internet Fibra', amount: 14990, category: 'Moradia', dayOfMonth: 12, mode: 'PF', type: 'EXPENSE', active: true },
    { id: '3', description: 'Netflix', amount: 5590, category: 'Assinaturas', dayOfMonth: 15, mode: 'PF', type: 'EXPENSE', active: true },
    { id: '4', description: 'Retainer Cliente X', amount: 500000, category: 'Serviços', dayOfMonth: 10, mode: 'PJ', type: 'INCOME', active: true },
];

const MOCK_DEBTS: Debt[] = [
    { id: '1', name: 'Cartão de Crédito Nubank', type: 'CREDIT_CARD', balance: 500000, interestRate: 14.5, minimumPayment: 75000, dueDate: 10, mode: 'PF', status: 'LATE' }, // 14.5% ao mês
    { id: '2', name: 'Empréstimo Equipamentos', type: 'LOAN', balance: 1200000, interestRate: 2.5, minimumPayment: 38000, dueDate: 5, mode: 'PJ', status: 'NORMAL' },
    { id: '3', name: 'Cheque Especial', type: 'OTHER', balance: 150000, interestRate: 8.0, minimumPayment: 15000, dueDate: 1, mode: 'PF', status: 'NORMAL' },
];

const MOCK_PROJECTS: Project[] = [
    { id: '1', clientId: '1', name: 'Rebranding Alpha', status: 'ACTIVE', stage: 'EXECUTION', totalValue: 1500000, hoursUsed: 12, deadline: new Date('2026-03-01').toISOString() },
    { id: '2', clientId: '2', name: 'E-commerce Beta', status: 'LEAD', stage: 'PROPOSAL', totalValue: 2500000, hoursUsed: 0 },
    { id: '3', clientId: '3', name: 'Landing Page Gamma', status: 'ACTIVE', stage: 'DELIVERY', totalValue: 350000, hoursUsed: 5 },
    { id: '4', clientId: '1', name: 'App Mobile Alpha', status: 'PAUSED', stage: 'EXECUTION', totalValue: 8000000, hoursUsed: 40, deadline: new Date('2026-05-20').toISOString() },
];

const MOCK_TRANSACTIONS: Transaction[] = [
    { id: '1', description: 'Recebimento Projeto Alpha', amount: 500000, type: 'INCOME', date: new Date().toISOString(), status: 'PAID', mode: 'PJ', category: 'Projetos', projectId: '1', clientId: '1' },
    { id: '2', description: 'Supermercado Mensal', amount: 85000, type: 'EXPENSE', date: new Date().toISOString(), status: 'PAID', mode: 'PF', category: 'Alimentação' },
    { id: '3', description: 'Assinatura Adobe Creative Cloud', amount: 24000, type: 'EXPENSE', date: new Date().toISOString(), status: 'PENDING', mode: 'PJ', category: 'Software' },
];

const MOCK_GOALS: Goal[] = [
    { id: '1', name: 'Reserva de Emergência', targetAmount: 2000000, currentAmount: 1500000, type: 'SAVINGS', mode: 'PF', deadline: new Date('2026-12-31').toISOString() },
    { id: '2', name: 'Viagem Japão', targetAmount: 1500000, currentAmount: 300000, type: 'SAVINGS', mode: 'PF', deadline: new Date('2026-06-15').toISOString() },
];

const MOCK_BUDGETS: Budget[] = [
    { category: 'Alimentação', limit: 200000, mode: 'PF' },
    { category: 'Transporte', limit: 80000, mode: 'PF' },
    { category: 'Lazer', limit: 50000, mode: 'PF' },
];

export const useAppStore = create<AppState>((set) => ({
    mode: 'CONSOLIDATED', // Default start
    setMode: (mode) => set({ mode }),
    isSidebarOpen: true,
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

    transactions: [],
    addTransaction: (t) => {
        const newTransaction = { ...t, id: crypto.randomUUID() };
        set((state) => ({
            transactions: [newTransaction, ...state.transactions]
        }));
        api.transactions.create(newTransaction).catch(err => {
            console.error("Failed to persist transaction", err);
            // Optional: Rollback logic
        });
    },
    updateTransaction: (id, updates) => set((state) => ({
        transactions: state.transactions.map(t => t.id === id ? { ...t, ...updates } : t)
    })),
    deleteTransaction: (id) => set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id)
    })),

    projects: [],
    addProject: (p) => {
        const newProject = { ...p, id: crypto.randomUUID() };
        set((state) => ({
            projects: [...state.projects, newProject]
        }));
        api.projects.create(newProject).catch(err => console.error(err));
    },
    updateProject: (id, updates) => set((state) => ({
        projects: state.projects.map(p => p.id === id ? { ...p, ...updates } : p)
    })),
    updateProjectStage: (id, stage) => set((state) => ({
        projects: state.projects.map(p => p.id === id ? { ...p, stage } : p)
    })),
    deleteProject: (id) => set((state) => ({
        projects: state.projects.filter(p => p.id !== id)
    })),

    clients: MOCK_CLIENTS,
    addClient: (c) => set((state) => ({
        clients: [...state.clients, { ...c, id: crypto.randomUUID() }]
    })),
    updateClient: (id, updates) => set((state) => ({
        clients: state.clients.map(c => c.id === id ? { ...c, ...updates } : c)
    })),
    deleteClient: (id) => set((state) => ({
        clients: state.clients.filter(c => c.id !== id)
    })),

    debts: MOCK_DEBTS,
    addDebt: (d) => set((state) => ({
        debts: [...state.debts, { ...d, id: crypto.randomUUID() }]
    })),
    updateDebt: (id, updates) => set((state) => ({
        debts: state.debts.map(d => d.id === id ? { ...d, ...updates } : d)
    })),
    deleteDebt: (id) => set((state) => ({
        debts: state.debts.filter(d => d.id !== id)
    })),
    payDebt: (id, amount) => set((state) => ({
        debts: state.debts.map(d => d.id === id ? { ...d, balance: Math.max(0, d.balance - amount) } : d)
    })),

    recurringBills: MOCK_RECURRING,
    addRecurringBill: (b) => set((state) => ({
        recurringBills: [...state.recurringBills, { ...b, id: crypto.randomUUID() }]
    })),
    updateRecurringBill: (id, updates) => set((state) => ({
        recurringBills: state.recurringBills.map(b => b.id === id ? { ...b, ...updates } : b)
    })),
    toggleRecurringBillStatus: (id) => set((state) => ({
        recurringBills: state.recurringBills.map(b => b.id === id ? { ...b, active: !b.active } : b)
    })),
    deleteRecurringBill: (id) => set((state) => ({
        recurringBills: state.recurringBills.filter(b => b.id !== id)
    })),
    generateMonthlyBills: (targetDate) => set((state) => {
        const monthKey = format(targetDate, 'yyyy-MM');
        const newTransactions: Transaction[] = [];

        state.recurringBills.forEach(bill => {
            const alreadyExists = state.transactions.some(t =>
                t.recurrenceId === bill.id && format(new Date(t.date), 'yyyy-MM') === monthKey
            );

            if (!alreadyExists && bill.active) {
                let billDate = setDate(targetDate, bill.dayOfMonth);
                newTransactions.push({
                    id: crypto.randomUUID(),
                    description: bill.description,
                    amount: bill.amount,
                    type: bill.type,
                    category: bill.category,
                    isFixed: true,
                    recurrenceId: bill.id,
                    mode: bill.mode,
                    status: 'PENDING',
                    date: billDate.toISOString(),
                });
            }
        });

        if (newTransactions.length === 0) return state;

        return {
            transactions: [...newTransactions, ...state.transactions]
        };
    }),

    goals: MOCK_GOALS,
    addGoal: (g) => set((state) => ({ goals: [...state.goals, { ...g, id: crypto.randomUUID() }] })),
    updateGoal: (id, updates) => set((state) => ({ goals: state.goals.map(g => g.id === id ? { ...g, ...updates } : g) })),
    deleteGoal: (id) => set((state) => ({ goals: state.goals.filter(g => g.id !== id) })),

    budgets: MOCK_BUDGETS,
    updateBudget: (category, mode, limit) => set((state) => {
        const existing = state.budgets.find(b => b.category === category && b.mode === mode);
        if (existing) {
            return { budgets: state.budgets.map(b => (b.category === category && b.mode === mode) ? { ...b, limit } : b) };
        }
        return { budgets: [...state.budgets, { category, mode, limit }] };
    }),

    // Settings & Configuration Actions
    settings: DEFAULT_SETTINGS,
    updateSettings: (updates) => set((state) => {
        const newSettings = typeof updates === 'function' ? updates(state.settings) : updates;
        return { settings: { ...state.settings, ...newSettings } };
    }),

    categories: MOCK_CATEGORIES,
    addCategory: (c) => set((state) => ({ categories: [...state.categories, { ...c, id: crypto.randomUUID() }] })),
    updateCategory: (id, updates) => set((state) => ({ categories: state.categories.map(c => c.id === id ? { ...c, ...updates } : c) })),
    deleteCategory: (id) => set((state) => ({ categories: state.categories.filter(c => c.id !== id) })),

    categorizationRules: MOCK_RULES,
    addRule: (r) => set((state) => ({ categorizationRules: [...state.categorizationRules, { ...r, id: crypto.randomUUID() }] })),
    updateRule: (id, updates) => set((state) => ({ categorizationRules: state.categorizationRules.map(r => r.id === id ? { ...r, ...updates } : r) })),
    deleteRule: (id) => set((state) => ({ categorizationRules: state.categorizationRules.filter(r => r.id !== id) })),
    reorderRules: (ids) => set((state) => {
        // Simple reorder: in real app, we would sort array based on IDs order.
        const ruleMap = new Map(state.categorizationRules.map(r => [r.id, r]));
        const reordered = ids.map(id => ruleMap.get(id)).filter(Boolean) as CategorizationRule[];
        // Add any missing ones at end (safety)
        const missing = state.categorizationRules.filter(r => !ids.includes(r.id));
        return { categorizationRules: [...reordered, ...missing] };
    }),

    integrations: MOCK_INTEGRATIONS,
    updateIntegration: (id, updates) => set((state) => ({
        integrations: state.integrations.map(i => i.id === id ? { ...i, ...updates } : i)
    })),

    isLoading: false,
    loadData: async () => {
        set({ isLoading: true });
        try {
            const [transactions, projects] = await Promise.all([
                api.transactions.list(),
                api.projects.list()
            ]);
            set({ transactions, projects });
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            set({ isLoading: false });
        }
    }
}));
