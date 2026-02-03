export type TimeSessionStatus = 'RUNNING' | 'PAUSED' | 'FINISHED';
export type TimeSessionEventType = 'START' | 'PAUSE' | 'RESUME' | 'FINISH' | 'EDIT';

export interface TimeSession {
    id: string;
    owner_email: string;
    ledger_type: 'PJ';
    client_id: string;
    project_id: string;
    status: TimeSessionStatus;
    started_at: string;
    ended_at?: string | null;
    last_resumed_at?: string | null;
    total_seconds: number;
    billable: boolean;
    note?: string | null;
    created_at: string;
    updated_at: string;
}

export interface TimeSessionEvent {
    id: string;
    session_id: string;
    type: TimeSessionEventType;
    at: string;
    delta_seconds?: number | null;
    meta_json?: any;
}

export interface ProjectComment {
    id: string;
    owner_email: string;
    ledger_type: 'PJ';
    client_id: string;
    project_id: string;
    body: string;
    visibility: 'INTERNAL' | 'PUBLIC';
    created_at: string;
    user?: { email: string }; // Optional for display if we join
}

export interface Project {
    id: string;
    // ... existing fields ...
    comments?: ProjectComment[];
}

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

export type AlertStatus = 'OPEN' | 'ACKED' | 'SNOOZED' | 'RESOLVED';
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertType = 'BUDGET_OVER' | 'BUDGET_NEAR' | 'SPEND_ANOMALY' | 'DUE_TODAY' | 'DUE_SOON' | 'OVERDUE' | 'LOW_BALANCE_7D' | 'MONTH_NEGATIVE_RISK' | 'UNCATEGORIZED' | 'DUPLICATE_SUSPECT';

export interface Alert {
    id: string;
    owner_id?: string; // Optional in frontend types depending on usage
    ledgerType: 'PF' | 'PJ';
    type: AlertType;
    severity: AlertSeverity;
    status: AlertStatus;
    title: string;
    message: string;
    reasonPayload?: Record<string, any>;
    sourceRefs?: { entity: string; id: string }[];
    fingerprint: string;
    createdAt: string;
    snoozedUntil?: string;
    resolvedAt?: string;
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

// Legacy Budget Interface
export interface Budget {
    category: string;
    limit: number;
    mode: 'PF' | 'PJ';
}

export interface BudgetMonthly {
    id: string; // uuid
    owner_id?: string;
    owner_email?: string;
    ledger_type: 'PF' | 'PJ';
    month_key: string; // YYYY-MM
    category_id: string;
    budget_amount: number; // cents or as per usage (seems to be cents in app)
    is_alerts_paused: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface BudgetSettings {
    id: string;
    owner_id?: string;
    owner_email?: string;
    ledger_type: 'PF';
    alert_threshold_percent: number;
    alert_on_over: boolean;
    detect_anomaly: boolean;
    ignore_category_ids: string[];
    calc_basis: 'TRANSACTION_DATE' | 'DUE_DATE';
    updated_at?: string;
}

export interface BudgetSummaryCard {
    totalLimit: number;
    totalSpent: number;
    remaining: number;
    percentConsumed: number;
    status: 'OK' | 'WARNING' | 'OVER';
}

// Scanner de Extratos Types

export type SourceType = 'CSV' | 'PDF' | 'OCR' | 'OFX';
export type BatchStatus = 'PROCESSING' | 'READY_TO_REVIEW' | 'IMPORTED' | 'ROLLED_BACK' | 'FAILED';
export type ImportRowStatus = 'NEW' | 'DUPLICATE_SUSPECT' | 'NEEDS_REVIEW' | 'READY' | 'IMPORTED' | 'SKIPPED';
export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ImportFile {
    id: string;
    owner_id?: string;
    owner_email: string;
    ledger_type: 'PF' | 'PJ';
    storage_path: string;
    original_name: string;
    mime_type?: string;
    size?: number;
    sha256_hash?: string;
    created_at: string;
}

export interface ImportBatch {
    id: string;
    owner_id?: string;
    owner_email: string;
    ledger_type: 'PF' | 'PJ';
    source_type: SourceType;
    file_id?: string;
    status: BatchStatus;
    date_start?: string;
    date_end?: string;
    totals_json?: {
        incoming: number;
        outgoing: number;
        count: number;
    };
    created_at: string;
    updated_at: string;
}

export interface ImportRow {
    id: string;
    batch_id: string;
    owner_id?: string;
    owner_email: string;
    ledger_type: 'PF' | 'PJ';
    row_index: number;
    date: string; // YYYY-MM-DD
    amount: number; // cents
    direction: 'IN' | 'OUT';
    description_raw?: string;
    description_norm?: string;
    merchant?: string;
    suggested_category_id?: string;
    final_category_id?: string;
    confidence: ConfidenceLevel;
    status: ImportRowStatus;
    duplicate_of_transaction_id?: string;
    created_transaction_id?: string;
    created_at?: string;
}

export interface CategoryMappingRule {
    id: string;
    owner_id?: string;
    owner_email: string;
    ledger_type: 'PF' | 'PJ';
    match_type: 'CONTAINS' | 'REGEX' | 'STARTS_WITH' | 'EXACT';
    pattern: string;
    category_id: string;
    priority: number;
    created_at?: string;
}
