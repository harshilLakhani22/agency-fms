import { create } from 'zustand';
import { Transaction, Account } from '@/types';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface TransactionState {
  transactions: Transaction[];
  accounts: Account[];
  isLoading: boolean;
  error: string | null;
  setTransactions: (transactions: Transaction[]) => void;
  setAccounts: (accounts: Account[]) => void;
  addTransaction: (transaction: Transaction) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  subscribe: () => () => void;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: [],
  accounts: [],
  isLoading: true,
  error: null,
  setTransactions: (transactions) => set({ transactions }),
  setAccounts: (accounts) => set({ accounts }),
  addTransaction: (transaction) => set((state) => ({ transactions: [transaction, ...state.transactions] })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  subscribe: () => {
    let accountsLoaded = false;
    let transactionsLoaded = false;
    
    set({ isLoading: true });

    const checkLoading = () => {
      if (accountsLoaded && transactionsLoaded) {
        set({ isLoading: false });
      }
    };

    const unsubTransactions = onSnapshot(
      query(collection(db, 'transactions'), orderBy('date', 'desc'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        set({ transactions: data });
        transactionsLoaded = true;
        checkLoading();
      },
      (error) => {
        console.error("Error fetching transactions:", error);
        set({ error: error.message, isLoading: false });
      }
    );

    const unsubAccounts = onSnapshot(
      query(collection(db, 'accounts'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        set({ accounts: data });
        accountsLoaded = true;
        checkLoading();
      },
      (error) => {
        console.error("Error fetching accounts:", error);
        set({ error: error.message, isLoading: false });
      }
    );

    return () => {
      unsubTransactions();
      unsubAccounts();
    };
  }
}));
