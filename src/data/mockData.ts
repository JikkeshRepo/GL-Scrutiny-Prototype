export interface Transaction {
  id: string;
  date: string;
  accountCode: string;
  accountType: string;
  account: string;
  source: string;
  description: string;
  reference: string;
  debit: number | null;
  credit: number | null;
  amount: number;
  violatedRules: string[];
  isFlagged: boolean;
  overridenBy?: string;
  overrideReason?: string;
}

export interface GLAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  totalRows: number;
  flaggedCount: number;
  status: 'flagged' | 'passed';
  totalValue: number;
  transactions: Transaction[];
}

export interface Client {
  id: string;
  name: string;
  industry: string;
  abn: string;
  xeroId: string;
  totalRuns: number;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  periodType: 'Quarterly' | 'FY';
  periodStart: string;
  periodEnd: string;
  status: 'In progress' | 'Ready for review' | 'Signed off';
  reviewer: string;
  createdAt: string;
}

export interface Run {
  id: string;
  projectId: string;
  name: string;
  timestamp: string;
  triggeredBy: string;
  rulebookVersion: string;
  status: 'Needs fixes' | 'Ready for review' | 'Signed off';
  files: {
    cy: string;
    py: string;
    coa: string;
  };
  metrics: {
    totalRows: number;
    flagsFound: number;
    passed: number;
    overrides: number;
    flagsResolved: number;
    flagsDiff?: number;
  };
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  severity: 'high' | 'medium' | 'low';
  pythonCode?: string;
}

export const mockClients: Client[] = [
  { id: 'client_1', name: 'ABC Retail Pty Ltd', industry: 'Retail', abn: '12 345 678 901', xeroId: 'XRO-12345', totalRuns: 12 },
  { id: 'client_2', name: 'Global Logistics Corp (GLC)', industry: 'Logistics', abn: '98 765 432 109', xeroId: 'XRO-98765', totalRuns: 5 },
  { id: 'client_3', name: 'Apex Tech Industries', industry: 'Technology', abn: '55 555 555 555', xeroId: 'XRO-55555', totalRuns: 8 },
];

export const mockProjects: Project[] = [
  { id: 'proj_1', clientId: 'client_1', name: 'FY 2024-25', periodType: 'FY', periodStart: '2024-07-01', periodEnd: '2025-06-30', status: 'In progress', reviewer: 'John Smith', createdAt: '2025-05-01' },
  { id: 'proj_2', clientId: 'client_1', name: 'Q3 BAS 2024', periodType: 'Quarterly', periodStart: '2024-01-01', periodEnd: '2024-03-31', status: 'Signed off', reviewer: 'Sarah Jones', createdAt: '2024-04-05' },
  { id: 'proj_3', clientId: 'client_2', name: 'Annual Review 2023', periodType: 'FY', periodStart: '2023-01-01', periodEnd: '2023-12-31', status: 'In progress', reviewer: 'Mike Johnson', createdAt: '2024-01-20' },
];

export const mockRuns: Run[] = [
  {
    id: 'run_3',
    projectId: 'proj_1',
    name: 'Run 3',
    timestamp: '2025-05-14T10:05:00Z',
    triggeredBy: 'Priya M.',
    rulebookVersion: 'Standard v2.1',
    status: 'Ready for review',
    files: { cy: 'GL_CY_FY25.csv', py: 'GL_PY_FY24.csv', coa: 'COA_Retail.xlsx' },
    metrics: { totalRows: 1284, flagsFound: 3, passed: 1281, overrides: 7, flagsResolved: 84, flagsDiff: -28 }
  },
  {
    id: 'run_2',
    projectId: 'proj_1',
    name: 'Run 2',
    timestamp: '2025-05-13T14:22:00Z',
    triggeredBy: 'Priya M.',
    rulebookVersion: 'Standard v2.1',
    status: 'Needs fixes',
    files: { cy: 'GL_CY_FY25.csv', py: 'GL_PY_FY24.csv', coa: 'COA_Retail.xlsx' },
    metrics: { totalRows: 1284, flagsFound: 31, passed: 1253, overrides: 4, flagsResolved: 56, flagsDiff: -56 }
  },
  {
    id: 'run_1',
    projectId: 'proj_1',
    name: 'Run 1',
    timestamp: '2025-05-12T09:41:00Z',
    triggeredBy: 'Priya M.',
    rulebookVersion: 'Standard v2.0',
    status: 'Needs fixes',
    files: { cy: 'GL_CY_FY25_DRAFT.csv', py: 'GL_PY_FY24.csv', coa: 'COA_Retail.xlsx' },
    metrics: { totalRows: 1284, flagsFound: 87, passed: 1197, overrides: 0, flagsResolved: 0 }
  }
];

export const mockRules: Rule[] = [
  { id: 'R001', name: 'High Value Weekend Expenses', description: 'Flag any T&E expense over $500 posted on a weekend.', status: 'active', severity: 'high', pythonCode: 'def evaluate(transaction):\n    if transaction.amount > 500 and transaction.date.weekday() >= 5:\n        return True\n    return False' },
  { id: 'R002', name: 'Missing Reference Number', description: 'Identify journal entries missing reference numbers for transactions above $10,000.', status: 'active', severity: 'high', pythonCode: 'def evaluate(transaction):\n    if transaction.amount > 10000 and not transaction.reference:\n        return True\n    return False' },
  { id: 'R003', name: 'Duplicate Payment', description: 'Identify payments to the same vendor on the same day for the exact same amount.', status: 'active', severity: 'high', pythonCode: 'def evaluate(transactions):\n    seen = set()\n    for t in transactions:\n        key = (t.vendor_id, t.date, t.amount)\n        if key in seen:\n            return True\n        seen.add(key)\n    return False' },
  { id: 'R004', name: 'Rounding Anomalies', description: 'Flag exact round number journal entries (e.g. $50,000.00).', status: 'active', severity: 'medium', pythonCode: 'def evaluate(transaction):\n    if transaction.amount > 1000 and transaction.amount % 1000 == 0:\n        return True\n    return False' },
];

export const mockAccounts: GLAccount[] = [
  {
    id: 'acc_6100',
    accountNumber: '6100',
    accountName: 'Travel & Entertainment',
    totalRows: 1250,
    flaggedCount: 14,
    status: 'flagged',
    totalValue: 145000.00,
    transactions: [
      { id: 'tx_001', date: '2023-09-16', accountCode: '6100', accountType: 'Expense', account: 'Travel & Entertainment', source: 'SJ', description: 'Delta Airlines', reference: 'EXP-9921', debit: 1250.00, credit: null, amount: 1250.00, violatedRules: ['R001'], isFlagged: true },
      { id: 'tx_002', date: '2023-09-17', accountCode: '6100', accountType: 'Expense', account: 'Travel & Entertainment', source: 'SJ', description: 'Ritz Carlton', reference: '', debit: 850.00, credit: null, amount: 850.00, violatedRules: ['R001', 'R002'], isFlagged: true },
      { id: 'tx_003', date: '2023-09-21', accountCode: '6100', accountType: 'Expense', account: 'Travel & Entertainment', source: 'SJ', description: 'Uber Trip', reference: 'EXP-9945', debit: 45.00, credit: null, amount: 45.00, violatedRules: [], isFlagged: false },
      { id: 'tx_004', date: '2023-09-22', accountCode: '6100', accountType: 'Expense', account: 'Travel & Entertainment', source: 'SJ', description: 'Client Dinner', reference: '', debit: 620.00, credit: null, amount: 620.00, violatedRules: ['R002'], isFlagged: true },
    ]
  },
  {
    id: 'acc_7200',
    accountNumber: '7200',
    accountName: 'Professional Fees',
    totalRows: 420,
    flaggedCount: 8,
    status: 'flagged',
    totalValue: 850000.00,
    transactions: [
      { id: 'tx_101', date: '2023-09-05', accountCode: '7200', accountType: 'Expense', account: 'Professional Fees', source: 'PJ', description: 'Legal Consultaion', reference: 'INV-1002', debit: 15000.00, credit: null, amount: 15000.00, violatedRules: [], isFlagged: false },
      { id: 'tx_102', date: '2023-09-10', accountCode: '7200', accountType: 'Expense', account: 'Professional Fees', source: 'GJ', description: 'Audit Retainer', reference: '', debit: 50000.00, credit: null, amount: 50000.00, violatedRules: ['R002', 'R004'], isFlagged: true },
      { id: 'tx_103', date: '2023-09-10', accountCode: '7200', accountType: 'Expense', account: 'Professional Fees', source: 'GJ', description: 'Audit Retainer', reference: '', debit: 50000.00, credit: null, amount: 50000.00, violatedRules: ['R003'], isFlagged: true },
    ]
  },
  {
    id: 'acc_1100',
    accountNumber: '1100',
    accountName: 'Cash and Cash Equivalents',
    totalRows: 4500,
    flaggedCount: 2,
    status: 'passed',
    totalValue: 4500000.00,
    transactions: [
      { id: 'tx_201', date: '2023-09-01', accountCode: '1100', accountType: 'Asset', account: 'Cash and Cash Equivalents', source: 'CPJ', description: 'Transfer to Payroll', reference: 'TRN-101', debit: null, credit: 250000.00, amount: 250000.00, violatedRules: [], isFlagged: false },
      { id: 'tx_202', date: '2023-09-28', accountCode: '1100', accountType: 'Asset', account: 'Cash and Cash Equivalents', source: 'CRJ', description: 'Wire Transfer', reference: '', debit: 100000.00, credit: null, amount: 100000.00, violatedRules: ['R002', 'R004'], isFlagged: true },
    ]
  },
  {
    id: 'acc_5100',
    accountNumber: '5100',
    accountName: 'Cost of Goods Sold',
    totalRows: 8500,
    flaggedCount: 45,
    status: 'passed',
    totalValue: 2150000.00,
    transactions: [
      { id: 'tx_301', date: '2023-09-15', accountCode: '5100', accountType: 'Expense', account: 'Cost of Goods Sold', source: 'PJ', description: 'Supplier Payment A', reference: 'INV-888', debit: 45000.00, credit: null, amount: 45000.00, violatedRules: [], isFlagged: false },
      { id: 'tx_302', date: '2023-09-15', accountCode: '5100', accountType: 'Expense', account: 'Cost of Goods Sold', source: 'PJ', description: 'Supplier Payment A', reference: 'INV-888', debit: 45000.00, credit: null, amount: 45000.00, violatedRules: ['R003'], isFlagged: true },
    ]
  }
];
