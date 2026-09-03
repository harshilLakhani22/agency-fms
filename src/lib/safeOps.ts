'use client';

import { db } from '@/lib/firebase';
import { 
  addDoc, 
  collection, 
  doc, 
  updateDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { useSandboxStore } from '@/store/useSandboxStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useProposalStore, Proposal, ProposalStatus } from '@/store/useProposalStore';
import { Transaction, Account } from '@/types';
import { toast } from 'sonner';

/**
 * Safely add a transaction.
 * In Sandbox Mode: Simulated in local memory, zero Firestore write.
 * In Live Mode: Writes to Firestore transactions collection.
 */
export async function safeAddTransaction(data: Omit<Transaction, 'id'>) {
  const isSandbox = useSandboxStore.getState().isSandbox;

  if (isSandbox) {
    const mockId = 'sandbox-tx-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    const newTx: Transaction = {
      ...data,
      id: mockId,
    };
    useTransactionStore.getState().addTransaction(newTx);
    toast.info("🧪 [Sandbox Mode] Transaction simulated in memory. Database was NOT touched.", { duration: 4000 });
    return { id: mockId };
  }

  return await addDoc(collection(db, 'transactions'), data);
}

/**
 * Safely update a transaction.
 */
export async function safeUpdateTransaction(id: string, updates: Partial<Transaction>) {
  const isSandbox = useSandboxStore.getState().isSandbox;

  if (isSandbox) {
    useTransactionStore.getState().updateTransaction(id, updates);
    toast.info("🧪 [Sandbox Mode] Update simulated in memory. Database was NOT touched.", { duration: 4000 });
    return;
  }

  return await updateDoc(doc(db, 'transactions', id), updates);
}

/**
 * Safely soft-delete a transaction.
 */
export async function safeSoftDeleteTransaction(id: string) {
  const isSandbox = useSandboxStore.getState().isSandbox;

  if (isSandbox) {
    useTransactionStore.getState().softDeleteTransaction(id);
    toast.info("🧪 [Sandbox Mode] Deletion simulated in memory. Database was NOT touched.", { duration: 4000 });
    return;
  }

  return await updateDoc(doc(db, 'transactions', id), {
    isDeleted: true,
    deletedAt: new Date().toISOString(),
    updatedAt: Date.now(),
  });
}

/**
 * Safely perform a cross-currency transfer.
 */
export async function safeAddTransfer(expenseData: Omit<Transaction, 'id'>, incomeData: Omit<Transaction, 'id'>) {
  const isSandbox = useSandboxStore.getState().isSandbox;

  if (isSandbox) {
    const expenseId = 'sandbox-tx-' + Date.now() + '-exp';
    const incomeId = 'sandbox-tx-' + (Date.now() + 1) + '-inc';

    const fullExpense: Transaction = {
      ...expenseData,
      id: expenseId,
      linkedTransactionId: incomeId,
    };

    const fullIncome: Transaction = {
      ...incomeData,
      id: incomeId,
      linkedTransactionId: expenseId,
    };

    useTransactionStore.getState().addTransaction(fullExpense);
    useTransactionStore.getState().addTransaction(fullIncome);

    toast.info("🧪 [Sandbox Mode] Currency transfer simulated in memory. Database was NOT touched.", { duration: 4000 });
    return;
  }

  const batch = writeBatch(db);
  const expenseRef = doc(collection(db, 'transactions'));
  const incomeRef = doc(collection(db, 'transactions'));

  batch.set(expenseRef, {
    ...expenseData,
    linkedTransactionId: incomeRef.id,
  });

  batch.set(incomeRef, {
    ...incomeData,
    linkedTransactionId: expenseRef.id,
  });

  return await batch.commit();
}

/**
 * Safely add, update, or delete accounts.
 */
export async function safeAddAccount(data: Omit<Account, 'id'>) {
  const isSandbox = useSandboxStore.getState().isSandbox;

  if (isSandbox) {
    const mockId = 'sandbox-acc-' + Date.now();
    const newAcc: Account = {
      ...data,
      id: mockId,
    };
    useTransactionStore.getState().addAccount(newAcc);
    toast.info("🧪 [Sandbox Mode] Account added in memory. Database was NOT touched.", { duration: 4000 });
    return { id: mockId };
  }

  return await addDoc(collection(db, 'accounts'), data);
}

export async function safeUpdateAccount(id: string, updates: Partial<Account>) {
  const isSandbox = useSandboxStore.getState().isSandbox;

  if (isSandbox) {
    useTransactionStore.getState().updateAccount(id, updates);
    toast.info("🧪 [Sandbox Mode] Account update simulated in memory. Database was NOT touched.", { duration: 4000 });
    return;
  }

  return await updateDoc(doc(db, 'accounts', id), updates);
}

export async function safeDeleteAccount(id: string) {
  const isSandbox = useSandboxStore.getState().isSandbox;

  if (isSandbox) {
    useTransactionStore.getState().deleteAccount(id);
    toast.info("🧪 [Sandbox Mode] Account deletion simulated in memory. Database was NOT touched.", { duration: 4000 });
    return;
  }

  return await deleteDoc(doc(db, 'accounts', id));
}
