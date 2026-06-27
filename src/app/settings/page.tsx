'use client';

import { useState } from 'react';
import { useTransactionStore } from '@/store/useTransactionStore';
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, writeBatch } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { CategoryMigrationDialog } from '@/components/features/CategoryMigrationDialog';

export default function SettingsPage() {
  const { expenseCategories, incomeCategories, isLoading, allTransactions } = useTransactionStore();
  const [newExpenseCategory, setNewExpenseCategory] = useState('');
  const [newIncomeCategory, setNewIncomeCategory] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean, type: 'expense' | 'income', category: string } | null>(null);
  const [migrationDialog, setMigrationDialog] = useState<{ open: boolean, type: 'expense' | 'income', category: string, count: number } | null>(null);

  const handleAddCategory = async (type: 'expense' | 'income') => {
    const value = type === 'expense' ? newExpenseCategory.trim() : newIncomeCategory.trim();
    if (!value) return;

    const isDuplicate = type === 'expense' 
      ? expenseCategories.includes(value) 
      : incomeCategories.includes(value);

    if (isDuplicate) {
      toast.error('Category already exists');
      return;
    }

    setIsUpdating(true);
    try {
      const docRef = doc(db, 'settings', 'categories');
      if (type === 'expense') {
        await updateDoc(docRef, { expenseCategories: arrayUnion(value) });
        setNewExpenseCategory('');
      } else {
        await updateDoc(docRef, { incomeCategories: arrayUnion(value) });
        setNewIncomeCategory('');
      }
      toast.success('Category added successfully');
    } catch (error: any) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteCategoryClick = (type: 'expense' | 'income', category: string) => {
    const affected = allTransactions.filter(t => t.type === type && t.category === category);
    
    if (affected.length > 0) {
      setMigrationDialog({ open: true, type, category, count: affected.length });
    } else {
      setConfirmDialog({ open: true, type, category });
    }
  };

  const executeDelete = async (type: 'expense' | 'income', category: string) => {
    setIsUpdating(true);
    try {
      const docRef = doc(db, 'settings', 'categories');
      if (type === 'expense') {
        await updateDoc(docRef, { expenseCategories: arrayRemove(category) });
      } else {
        await updateDoc(docRef, { incomeCategories: arrayRemove(category) });
      }
      toast.success('Category deleted successfully');
      setConfirmDialog(null);
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    } finally {
      setIsUpdating(false);
    }
  };

  const executeMigrationAndDelete = async (type: 'expense' | 'income', oldCategory: string, newCategory: string) => {
    setIsUpdating(true);
    try {
      const batch = writeBatch(db);
      
      const affected = allTransactions.filter(t => t.type === type && t.category === oldCategory);
      affected.forEach(t => {
        const tRef = doc(db, 'transactions', t.id);
        batch.update(tRef, { category: newCategory });
      });
      
      const docRef = doc(db, 'settings', 'categories');
      if (type === 'expense') {
        batch.update(docRef, { expenseCategories: arrayRemove(oldCategory) });
      } else {
        batch.update(docRef, { incomeCategories: arrayRemove(oldCategory) });
      }
      
      await batch.commit();
      toast.success('Transactions migrated and category deleted');
      setMigrationDialog(null);
    } catch (error: any) {
      console.error('Error migrating category:', error);
      toast.error('Failed to migrate transactions');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Settings</h1>
        <p className="text-white/60">Manage your application settings and custom categories.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Expense Categories</CardTitle>
            <CardDescription className="text-white/60">Manage categories for your expenses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="New expense category..."
                value={newExpenseCategory}
                onChange={(e) => setNewExpenseCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory('expense')}
                className="bg-black/20 border-white/10 text-white placeholder:text-white/40"
              />
              <Button 
                onClick={() => handleAddCategory('expense')} 
                disabled={!newExpenseCategory.trim() || isUpdating}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {expenseCategories.map((cat) => (
                <div key={cat} className="flex items-center justify-between p-3 rounded-md bg-black/20 border border-white/5">
                  <span className="text-white/90">{cat}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteCategoryClick('expense', cat)}
                    disabled={isUpdating}
                    className="h-8 w-8 text-white/40 hover:text-red-400 hover:bg-red-400/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Income Categories</CardTitle>
            <CardDescription className="text-white/60">Manage categories for your income</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="New income category..."
                value={newIncomeCategory}
                onChange={(e) => setNewIncomeCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory('income')}
                className="bg-black/20 border-white/10 text-white placeholder:text-white/40"
              />
              <Button 
                onClick={() => handleAddCategory('income')} 
                disabled={!newIncomeCategory.trim() || isUpdating}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {incomeCategories.map((cat) => (
                <div key={cat} className="flex items-center justify-between p-3 rounded-md bg-black/20 border border-white/5">
                  <span className="text-white/90">{cat}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteCategoryClick('income', cat)}
                    disabled={isUpdating}
                    className="h-8 w-8 text-white/40 hover:text-red-400 hover:bg-red-400/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmDialog?.open ?? false}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
        title="Delete Category"
        description={<>Are you sure you want to delete the category <strong>"{confirmDialog?.category}"</strong>? This action cannot be undone.</>}
        onConfirm={() => confirmDialog && executeDelete(confirmDialog.type, confirmDialog.category)}
        isConfirming={isUpdating}
        variant="destructive"
        confirmText="Delete"
      />

      <CategoryMigrationDialog
        open={migrationDialog?.open ?? false}
        onOpenChange={(open) => !open && setMigrationDialog(null)}
        categoryToDelete={migrationDialog?.category ?? ''}
        affectedCount={migrationDialog?.count ?? 0}
        availableCategories={
          migrationDialog?.type === 'expense' 
            ? expenseCategories.filter(c => c !== migrationDialog.category)
            : incomeCategories.filter(c => c !== migrationDialog?.category)
        }
        onConfirm={(newCategory) => migrationDialog && executeMigrationAndDelete(migrationDialog.type, migrationDialog.category, newCategory)}
        isConfirming={isUpdating}
      />
    </div>
  );
}
