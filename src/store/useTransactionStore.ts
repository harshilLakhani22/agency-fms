import { create } from 'zustand';
import { Transaction, Account } from '@/types';
import { collection, query, orderBy, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const DEFAULT_EXPENSE_CATEGORIES = ['Software Subscriptions', 'Salaries', 'Travel', 'Marketing', 'Office/Equipment', 'Internal Transfer', 'Review', 'Other Expense', 'Upwork Connects'];
const DEFAULT_INCOME_CATEGORIES = ['Upwork Client', 'Consulting', 'Internal Transfer', 'Other Income'];

interface TransactionState {
  transactions: Transaction[];
  allTransactions: Transaction[];
  accounts: Account[];
  expenseCategories: string[];
  incomeCategories: string[];
  currencySettings: { defaultExchangeRate: number; defaultFeePercent: number };
  isLoading: boolean;
  error: string | null;
  setTransactions: (transactions: Transaction[]) => void;
  setAccounts: (accounts: Account[]) => void;
  addTransaction: (transaction: Transaction) => void;
  setCurrencySettings: (settings: { defaultExchangeRate: number; defaultFeePercent: number }) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  subscribe: () => () => void;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: [],
  allTransactions: [],
  accounts: [],
  expenseCategories: [],
  incomeCategories: [],
  currencySettings: { defaultExchangeRate: 85, defaultFeePercent: 1 },
  isLoading: true,
  error: null,
  setTransactions: (transactions) => set({ transactions }),
  setAccounts: (accounts) => set({ accounts }),
  addTransaction: (transaction) => set((state) => ({ transactions: [transaction, ...state.transactions] })),
  setCurrencySettings: (settings) => set({ currencySettings: settings }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  subscribe: () => {
    let accountsLoaded = false;
    let transactionsLoaded = false;
    let categoriesLoaded = false;
    
    set({ isLoading: true });

    const checkLoading = () => {
      if (accountsLoaded && transactionsLoaded && categoriesLoaded) {
        set({ isLoading: false });
      }
    };

    // Fetch and sync categories
    const categoriesDocRef = doc(db, 'settings', 'categories');
    
    const fetchCategories = async () => {
      try {
        const docSnap = await getDoc(categoriesDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          set({ 
            expenseCategories: data.expenseCategories || DEFAULT_EXPENSE_CATEGORIES,
            incomeCategories: data.incomeCategories || DEFAULT_INCOME_CATEGORIES
          });
        } else {
          // Migration: Document doesn't exist, create it with defaults
          await setDoc(categoriesDocRef, {
            expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
            incomeCategories: DEFAULT_INCOME_CATEGORIES
          });
          set({ 
            expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
            incomeCategories: DEFAULT_INCOME_CATEGORIES
          });
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        // Fallback to defaults
        set({ 
          expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
          incomeCategories: DEFAULT_INCOME_CATEGORIES
        });
      } finally {
        categoriesLoaded = true;
        checkLoading();
      }
    };
    
    fetchCategories();

    // Also listen for real-time category updates
    const unsubCategories = onSnapshot(categoriesDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        set({ 
          expenseCategories: data.expenseCategories || DEFAULT_EXPENSE_CATEGORIES,
          incomeCategories: data.incomeCategories || DEFAULT_INCOME_CATEGORIES
        });
      }
    });

    const currencyDocRef = doc(db, 'settings', 'currency');
    const unsubCurrency = onSnapshot(currencyDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        set({
          currencySettings: {
            defaultExchangeRate: data.defaultExchangeRate ?? 85,
            defaultFeePercent: data.defaultFeePercent ?? 1
          }
        });
      }
    });

    const unsubTransactions = onSnapshot(
      query(collection(db, 'transactions'), orderBy('date', 'desc'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        set({ 
          transactions: data.filter(t => !t.isDeleted),
          allTransactions: data 
        });
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
      unsubCategories();
      unsubCurrency();
    };
  }
}));
