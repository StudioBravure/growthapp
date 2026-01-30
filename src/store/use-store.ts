import { create } from 'zustand';
import { AppMode, Transaction, Project, PipelineStage, Debt, RecurringBill, Goal, Client, AppSettings, Category, CategorizationRule, Integration, Alert, Budget } from '@/lib/types';
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
    resetStore: () => void; // Reset client-side state

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

    // Alerts
    alerts: Alert[];
    setAlerts: (alerts: Alert[]) => void;
    updateAlert: (id: string, updates: Partial<Alert>) => void;
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

export const useAppStore = create<AppState>((set, get) => ({
    mode: 'CONSOLIDATED',
    setMode: (mode) => set({ mode }),
    isSidebarOpen: true,
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

    // Initial State: Empty Arrays to enforce Single Source of Truth from DB
    isLoading: false,
    transactions: [],
    projects: [],
    clients: [],
    debts: [],
    recurringBills: [],
    goals: [],
    budgets: [],
    categories: [],
    categorizationRules: [],
    integrations: [],
    alerts: [],
    settings: DEFAULT_SETTINGS,

    resetStore: () => set({
        transactions: [],
        projects: [],
        clients: [],
        debts: [],
        recurringBills: [],
        goals: [],
        budgets: [],
        categories: [],
        categorizationRules: [],
        integrations: [],
        alerts: [],
        // settings: DEFAULT_SETTINGS // Keep settings or reset them too? User usually wants data reset.
    }),

    loadData: async () => {
        set({ isLoading: true });
        try {
            // Using Promise.allSettled to ensure that failure in one non-critical table 
            // doesn't block the entire dashboard.
            const results = await Promise.allSettled([
                api.transactions.list(),
                api.projects.list(),
                api.clients.list(),
                api.debts.list(),
                api.recurringBills.list(),
                api.goals.list(),
                api.budgets.list(),
                api.categories.list(),
                api.rules.list(),
                api.integrations.list(),
                api.alerts.list()
            ]);

            const [
                txRes, projRes, cliRes, debtRes, billRes, goalRes, budRes, catRes, ruleRes, intRes, alertRes
            ] = results;

            set({
                transactions: txRes.status === 'fulfilled' ? txRes.value : [],
                projects: projRes.status === 'fulfilled' ? projRes.value : [],
                clients: cliRes.status === 'fulfilled' ? cliRes.value : [],
                debts: debtRes.status === 'fulfilled' ? debtRes.value : [],
                recurringBills: billRes.status === 'fulfilled' ? billRes.value : [],
                goals: goalRes.status === 'fulfilled' ? goalRes.value : [],
                budgets: budRes.status === 'fulfilled' ? budRes.value : [],
                categories: catRes.status === 'fulfilled' ? catRes.value : [],
                categorizationRules: ruleRes.status === 'fulfilled' ? ruleRes.value : [],
                integrations: intRes.status === 'fulfilled' ? intRes.value : [],
                alerts: alertRes.status === 'fulfilled' ? alertRes.value : [],
            });

            // Log failures for debugging
            results.forEach((res, index) => {
                if (res.status === 'rejected') {
                    console.warn(`Failed to load data at index ${index}`, res.reason);
                }
            });

        } catch (error) {
            console.error("Critical failure loading data", error);
        } finally {
            set({ isLoading: false });
        }
    },

    // --- Actions ---

    addTransaction: (t) => {
        const newTransaction = { ...t, id: crypto.randomUUID() };
        set((state) => ({ transactions: [newTransaction, ...state.transactions] }));
        api.transactions.create(newTransaction).catch(err => {
            console.error("Failed to persist transaction", err);
            // Revert on failure
            set(state => ({ transactions: state.transactions.filter(x => x.id !== newTransaction.id) }));
        });
    },
    updateTransaction: (id, updates) => {
        set((state) => ({ transactions: state.transactions.map(t => t.id === id ? { ...t, ...updates } : t) }));
        api.transactions.update(id, updates).catch(console.error);
    },
    deleteTransaction: (id) => {
        set((state) => ({ transactions: state.transactions.filter((t) => t.id !== id) }));
        api.transactions.delete(id).catch(console.error);
    },

    addProject: (p) => {
        const newProject = { ...p, id: crypto.randomUUID() };
        set((state) => ({ projects: [...state.projects, newProject] }));
        api.projects.create(newProject).catch(err => {
            set(state => ({ projects: state.projects.filter(x => x.id !== newProject.id) }));
            console.error(err);
        });
    },
    updateProject: (id, updates) => set((state) => ({
        projects: state.projects.map(p => p.id === id ? { ...p, ...updates } : p)
    })),
    updateProjectStage: (id, stage) => set((state) => ({
        projects: state.projects.map(p => p.id === id ? { ...p, stage } : p)
    })),
    deleteProject: (id) => {
        set((state) => ({ projects: state.projects.filter(p => p.id !== id) }));
        api.projects.delete(id).catch(console.error);
    },

    addClient: (c) => {
        const newClient = { ...c, id: crypto.randomUUID() };
        set((state) => ({ clients: [...state.clients, newClient] }));
        api.clients.create(newClient).catch(console.error);
    },
    updateClient: (id, updates) => set((state) => ({
        clients: state.clients.map(c => c.id === id ? { ...c, ...updates } : c)
    })),
    deleteClient: (id) => {
        set((state) => ({ clients: state.clients.filter(c => c.id !== id) }));
        api.clients.delete(id).catch(console.error);
    },

    addDebt: (d) => {
        const newDebt = { ...d, id: crypto.randomUUID() };
        set((state) => ({ debts: [...state.debts, newDebt] }));
        api.debts.create(newDebt).catch(console.error);
    },
    updateDebt: (id, updates) => {
        set((state) => ({ debts: state.debts.map(d => d.id === id ? { ...d, ...updates } : d) }));
        api.debts.update(id, updates).catch(console.error);
    },
    deleteDebt: (id) => {
        set((state) => ({ debts: state.debts.filter(d => d.id !== id) }));
        api.debts.delete(id).catch(console.error);
    },
    payDebt: (id, amount) => {
        set((state) => ({
            debts: state.debts.map(d => d.id === id ? { ...d, balance: Math.max(0, d.balance - amount) } : d)
        }));
        // Logic to update DB would be here (update balance)
        const currentDebt = get().debts.find(d => d.id === id);
        if (currentDebt) api.debts.update(id, { balance: currentDebt.balance }).catch(console.error);
    },

    addRecurringBill: (b) => {
        const newBill = { ...b, id: crypto.randomUUID() };
        set((state) => ({ recurringBills: [...state.recurringBills, newBill] }));
        api.recurringBills.create(newBill).catch(console.error);
    },
    updateRecurringBill: (id, updates) => set((state) => ({
        recurringBills: state.recurringBills.map(b => b.id === id ? { ...b, ...updates } : b)
    })),
    toggleRecurringBillStatus: (id) => {
        set((state) => ({
            recurringBills: state.recurringBills.map(b => b.id === id ? { ...b, active: !b.active } : b)
        }));
        const bill = get().recurringBills.find(b => b.id === id);
        if (bill) api.recurringBills.toggleStatus(id, bill.active).catch(console.error);
    },
    deleteRecurringBill: (id) => {
        set((state) => ({ recurringBills: state.recurringBills.filter(b => b.id !== id) }));
        api.recurringBills.delete(id).catch(console.error);
    },

    generateMonthlyBills: (targetDate) => set((state) => {
        const monthKey = format(targetDate, 'yyyy-MM');
        const newTransactions: Transaction[] = [];

        state.recurringBills.forEach(bill => {
            const alreadyExists = state.transactions.some(t =>
                t.recurrenceId === bill.id && format(new Date(t.date), 'yyyy-MM') === monthKey
            );

            if (!alreadyExists && bill.active) {
                let billDate = setDate(targetDate, bill.dayOfMonth);
                const t: Transaction = {
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
                };
                newTransactions.push(t);
                // Also create in API
                api.transactions.create(t).catch(console.error);
            }
        });

        if (newTransactions.length === 0) return state;

        return {
            transactions: [...newTransactions, ...state.transactions]
        };
    }),

    addGoal: (g) => {
        const newGoal = { ...g, id: crypto.randomUUID() };
        set((state) => ({ goals: [...state.goals, newGoal] }));
        api.goals.create(newGoal).catch(console.error);
    },
    updateGoal: (id, updates) => set((state) => ({ goals: state.goals.map(g => g.id === id ? { ...g, ...updates } : g) })),
    deleteGoal: (id) => {
        set((state) => ({ goals: state.goals.filter(g => g.id !== id) }));
        api.goals.delete(id).catch(console.error);
    },

    updateBudget: (category, mode, limit) => {
        set((state) => {
            const existing = state.budgets.find(b => b.category === category && b.mode === mode);
            if (existing) {
                return { budgets: state.budgets.map(b => (b.category === category && b.mode === mode) ? { ...b, limit } : b) };
            }
            return { budgets: [...state.budgets, { category, mode, limit }] };
        });
        api.budgets.update({ category, mode, limit }).catch(console.error);
    },

    updateSettings: (updates) => set((state) => {
        const newSettings = typeof updates === 'function' ? updates(state.settings) : updates;
        return { settings: { ...state.settings, ...newSettings } };
    }),

    addCategory: (c) => {
        const newCat = { ...c, id: crypto.randomUUID() };
        set((state) => ({ categories: [...state.categories, newCat] }));
        api.categories.create(newCat).catch(console.error);
    },
    updateCategory: (id, updates) => set((state) => ({ categories: state.categories.map(c => c.id === id ? { ...c, ...updates } : c) })),
    deleteCategory: (id) => set((state) => ({ categories: state.categories.filter(c => c.id !== id) })),

    addRule: (r) => {
        const newRule = { ...r, id: crypto.randomUUID() };
        set((state) => ({ categorizationRules: [...state.categorizationRules, newRule] }));
        api.rules.create(newRule).catch(console.error);
    },
    updateRule: (id, updates) => set((state) => ({ categorizationRules: state.categorizationRules.map(r => r.id === id ? { ...r, ...updates } : r) })),
    deleteRule: (id) => set((state) => ({ categorizationRules: state.categorizationRules.filter(r => r.id !== id) })),
    reorderRules: (ids) => set((state) => {
        const ruleMap = new Map(state.categorizationRules.map(r => [r.id, r]));
        const reordered = ids.map(id => ruleMap.get(id)).filter(Boolean) as CategorizationRule[];
        const missing = state.categorizationRules.filter(r => !ids.includes(r.id));
        return { categorizationRules: [...reordered, ...missing] };
    }),

    updateIntegration: (id, updates) => set((state) => ({
        integrations: state.integrations.map(i => i.id === id ? { ...i, ...updates } : i)
    })),

    setAlerts: (alerts) => set({ alerts }),
    updateAlert: (id, updates) => set((state) => ({
        alerts: state.alerts.map(a => a.id === id ? { ...a, ...updates } : a)
    })),
}));
