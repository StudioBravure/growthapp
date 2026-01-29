
export type AppMode = 'PF' | 'PJ' | 'CONSOLIDATED';

export type TransactionStatus = 'PENDING' | 'PAID' | 'LATE' | 'SCHEDULED';

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
    id: string;
    date: string; // ISO date string
    dueDate?: string;
    amount: number; // in cents
    description: string;
    category: string;
    type: TransactionType;
    status: TransactionStatus;
    mode: 'PF' | 'PJ'; // Origin context
    projectId?: string;
    clientId?: string;
    attachmentUrl?: string;
    isFixed?: boolean;
    recurrenceId?: string;
    tags?: string[];
}

export interface RecurringBill {
    id: string;
    description: string;
    amount: number; // in cents
    category: string;
    dayOfMonth: number; // 1-31
    mode: 'PF' | 'PJ';
    type: TransactionType; // INCOME or EXPENSE
    active: boolean;
    lastGenerated?: string; // ISO month key (YYYY-MM)
}

export type ProjectStatus = 'LEAD' | 'ACTIVE' | 'DONE' | 'ARCHIVED' | 'PAUSED' | 'CANCELED';

export type PipelineStage = 'LEAD' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED' | 'EXECUTION' | 'DELIVERY' | 'POST_SALE';

export interface Project {
    id: string;
    clientId: string;
    name: string;
    status: ProjectStatus;
    stage: PipelineStage;
    totalValue: number; // cents
    deadline?: string;
    hoursEstimated?: number;
    hoursUsed: number;
    // Computed/Virtual fields (not stored, but useful for types if we mapped them)
    // financialStatus?: 'PROFITABLE' | 'LOSS' | 'BREAKEVEN';
}

export interface Client {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    companyName?: string;
    contractType?: 'PROJECT' | 'RETAINER' | 'HOURLY';
    defaultPaymentDay?: number;
}

export interface Debt {
    id: string;
    name: string;
    type: 'CREDIT_CARD' | 'LOAN' | 'FINANCING' | 'TAX' | 'OTHER';
    balance: number; // current debt amount
    interestRate: number; // monthly %
    minimumPayment?: number; // stored minimum payment
    dueDate: number; // day of month
    mode: 'PF' | 'PJ';
    status?: 'NORMAL' | 'LATE' | 'RENEGOTIATED';
    // Advanced Simulation
    totalMonths?: number;
    customSchedule?: Record<number, number>; // month index (1..N) -> payment amount (cents)
}


export interface Goal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline?: string;
    type: 'SAVINGS' | 'REVENUE' | 'PROFIT';
    mode: 'PF' | 'PJ';
}

export type AlertSeverity = 'CRITICAL' | 'ATTENTION' | 'INFO';
export type AlertType = 'BILL' | 'CARD' | 'BUDGET' | 'GOAL' | 'DEBT';

export interface Alert {
    id: string;
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    description: string;
    date: string;
    relatedId?: string;
    actions: {
        label: string;
        action: string;
        variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'link';
    }[];
}

export interface Category {
    id: string;
    name: string;
    type: 'INCOME' | 'EXPENSE';
    color?: string;
    mode: 'PF' | 'PJ';
    isDefault?: boolean;
}

export interface CategorizationRule {
    id: string;
    priority: number;
    name: string;
    condition: 'CONTAINS' | 'STARTS_WITH' | 'EQUALS' | 'REGEX';
    value: string;
    categoryId: string;
    mode: 'PF' | 'PJ';
    active: boolean;
}

export interface Integration {
    id: string;
    name: string;
    provider: 'GOOGLE_CALENDAR' | 'GOOGLE_DRIVE' | 'WHATSAPP' | 'EMAIL' | 'STRIPE' | 'PIX';
    status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
    config?: Record<string, any>;
    lastSync?: string;
}

export interface AppSettings {
    preferences: {
        theme: 'light' | 'dark' | 'system'; // syncing with next-themes
        timezone: string;
        defaultDateView: 'WEEK' | 'MONTH' | '3M' | '6M' | 'YEAR';
    };
    modes: {
        consolidatedBehavior: 'SUM' | 'SEPARATE';
        defaultMode: AppMode;
    };
    notifications: {
        billsWarningDays: number[]; // e.g. [0, 1, 7]
        budgetThresholds: number[]; // e.g. [80, 100]
        projectRiskDays: number;
        quietHoursStart?: string; // HH:mm
        quietHoursEnd?: string; // HH:mm
        channels: {
            app: boolean;
            email: boolean;
            whatsapp: boolean;
        };
    };
    import: {
        dateTolerance: number;
        amountTolerance: number;
        autoCategorize: boolean;
        detectDuplicates: boolean;
    };
    studio: {
        projectStages: string[]; // Ordered list of stage IDs or Labels
        riskThresholdDays: number;
        inactiveRiskDays: number;
        defaultHourlyRate: number; // cents
    };
}
