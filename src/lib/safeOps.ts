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
import { Transaction, Account } from '@/types';

/**
 * Add a transaction to Firestore.
 */
export async function safeAddTransaction(data: Omit<Transaction, 'id'>) {
  return await addDoc(collection(db, 'transactions'), data);
}

/**
 * Update an existing transaction in Firestore.
 */
export async function safeUpdateTransaction(id: string, updates: Partial<Transaction>) {
  return await updateDoc(doc(db, 'transactions', id), updates);
}

/**
 * Soft-delete a transaction in Firestore.
 */
export async function safeSoftDeleteTransaction(id: string) {
  return await updateDoc(doc(db, 'transactions', id), {
    isDeleted: true,
    deletedAt: new Date().toISOString(),
    updatedAt: Date.now(),
  });
}

/**
 * Perform a cross-currency transfer via a batch write in Firestore.
 */
export async function safeAddTransfer(expenseData: Omit<Transaction, 'id'>, incomeData: Omit<Transaction, 'id'>) {
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
 * Add, update, or delete accounts directly in Firestore.
 */
export async function safeAddAccount(data: Omit<Account, 'id'>) {
  return await addDoc(collection(db, 'accounts'), data);
}

export async function safeUpdateAccount(id: string, updates: Partial<Account>) {
  return await updateDoc(doc(db, 'accounts', id), updates);
}

export async function safeDeleteAccount(id: string) {
  return await deleteDoc(doc(db, 'accounts', id));
}
