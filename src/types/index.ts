export interface Account {
  id: string;
  name: string;
  type: 'bank' | 'credit' | 'cash';
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
  date: string;
  category: string;
  description: string;
  addedBy: string;
  addedByName: 'Harshil' | 'Dhruvit';
  createdAt: number;
  isDeleted?: boolean;
  deletedAt?: string;
  updatedAt?: number;
}
