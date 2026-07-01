'use client';

import { useState } from 'react';
import { useTransactionStore } from '@/store/useTransactionStore';
import { db } from '@/lib/firebase';
import { doc, updateDoc, setDoc, arrayUnion, arrayRemove, writeBatch } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { CategoryMigrationDialog } from '@/components/features/CategoryMigrationDialog';

export default function SettingsPage() {
  const { expenseCategories, incomeCategories, currencySettings, isLoading, allTransactions } = useTransactionStore();
  const [newExpenseCategory, setNewExpenseCategory] = useState('');
  const [newIncomeCategory, setNewIncomeCategory] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean, type: 'expense' | 'income', category: string } | null>(null);
  const [migrationDialog, setMigrationDialog] = useState<{ open: boolean, type: 'expense' | 'income', category: string, count: number } | null>(null);

  const [exchangeRate, setExchangeRate] = useState(currencySettings.defaultExchangeRate.toString());
  const [feePercent, setFeePercent] = useState(currencySettings.defaultFeePercent.toString());
  const [isFetchingRate, setIsFetchingRate] = useState(false);

  const handleUpdateCurrencySettings = async () => {
    setIsUpdating(true);
    try {
      await setDoc(doc(db, 'settings', 'currency'), {
        defaultExchangeRate: parseFloat(exchangeRate) || 85,
        defaultFeePercent: parseFloat(feePercent) || 1,
      }, { merge: true });
      toast.success('Currency settings updated');
    } catch (error) {
      console.error('Error updating currency settings:', error);
      toast.error('Failed to update currency settings');
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchLiveRate = async () => {
    setIsFetchingRate(true);
    try {
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await res.json();
      if (data && data.rates && data.rates.INR) {
        setExchangeRate(data.rates.INR.toString());
        toast.success('Live exchange rate fetched!');
      } else {
        throw new Error('Invalid data');
      }
    } catch (error) {
      console.error('Error fetching live rate:', error);
      toast.error('Failed to fetch live rate');
    } finally {
      setIsFetchingRate(false);
    }
  };

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
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your application settings and custom categories.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card/50 backdrop-blur-sm border-border md:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Currency Settings</CardTitle>
            <CardDescription className="text-muted-foreground">Manage defaults for cross-currency transfers (USD to INR)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Default Exchange Rate (1 USD = X INR)</label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    step="0.01"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                    className="bg-background/50 border-border text-foreground"
                  />
                  <Button 
                    variant="secondary" 
                    onClick={fetchLiveRate}
                    disabled={isFetchingRate}
                  >
                    {isFetchingRate ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Fetch Live Rate'}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Default Transfer Fee (%)</label>
                <Input 
                  type="number" 
                  step="0.01"
                  value={feePercent}
                  onChange={(e) => setFeePercent(e.target.value)}
                  className="bg-background/50 border-border text-foreground"
                />
              </div>
            </div>
            <Button 
              onClick={handleUpdateCurrencySettings}
              disabled={isUpdating || (!exchangeRate && !feePercent)}
              className="w-full md:w-auto bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Currency Settings
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Expense Categories</CardTitle>
            <CardDescription className="text-muted-foreground">Manage categories for your expenses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="New expense category..."
                value={newExpenseCategory}
                onChange={(e) => setNewExpenseCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory('expense')}
                className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground"
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
                <div key={cat} className="flex items-center justify-between p-3 rounded-md bg-muted/50 border border-border/50">
                  <span className="text-foreground/90">{cat}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteCategoryClick('expense', cat)}
                    disabled={isUpdating}
                    className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Income Categories</CardTitle>
            <CardDescription className="text-muted-foreground">Manage categories for your income</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="New income category..."
                value={newIncomeCategory}
                onChange={(e) => setNewIncomeCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory('income')}
                className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground"
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
                <div key={cat} className="flex items-center justify-between p-3 rounded-md bg-muted/50 border border-border/50">
                  <span className="text-foreground/90">{cat}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteCategoryClick('income', cat)}
                    disabled={isUpdating}
                    className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
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
