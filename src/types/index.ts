export interface Account {
  id: string;
  name: string;
  type: 'bank' | 'credit' | 'cash';
  currency?: 'INR' | 'USD';
  initialBalance: number;
  addedBy: string;
  owner: 'Harshil' | 'Dhruvit';
  createdAt: number;
}

export interface Transaction {
  id: string;
  accountId: string;
  type: 'income' | 'expense';
  amount: number;
  currency?: 'INR' | 'USD';
  date: string;
  category: string;
  description: string;
  addedBy: string;
  addedByName: 'Harshil' | 'Dhruvit';
  createdAt: number;
  isDeleted?: boolean;
  deletedAt?: string;
  updatedAt?: number;
  // Cross-currency transfer metadata
  linkedTransactionId?: string;
  exchangeRate?: number;
  feePercent?: number;
  feeAmount?: number;
  originalAmount?: number;
}
