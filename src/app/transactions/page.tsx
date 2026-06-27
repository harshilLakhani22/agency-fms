'use client';

import { useEffect, useState } from 'react';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTransactionStore } from '@/store/useTransactionStore';
import { TransactionActions } from '@/components/features/TransactionActions';
import { EditTransactionDialog } from '@/components/features/EditTransactionDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Download, Trash2, Pencil, Calendar as CalendarIcon, Filter, X, Check, LineChartIcon } from 'lucide-react';
import Papa from 'papaparse';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { TransactionAnalytics } from '@/components/features/TransactionAnalytics';

export default function TransactionsPage() {
  const { transactions, accounts, expenseCategories, incomeCategories, isLoading } = useTransactionStore();
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        await updateDoc(doc(db, 'transactions', id), { 
          isDeleted: true, 
          deletedAt: new Date().toISOString(),
          updatedAt: Date.now()
        });
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }
  };

  const getAccountName = (accountId: string) => {
    const acc = accounts.find(a => a.id === accountId);
    return acc ? `${acc.name} (${acc.owner})` : 'Unknown Account';
  };

  const handleExportCSV = () => {
    const csvData = filteredTransactions.map(t => ({
      Date: t.date,
      Account: getAccountName(t.accountId),
      Type: t.type,
      Category: t.category,
      Description: t.description,
      Amount: t.amount,
    }));
    
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTransactions = transactions.filter(t => {
    const matchType = filterType === 'all' || t.type === filterType;
    const matchCategory = selectedCategories.length === 0 || selectedCategories.includes(t.category);
    
    let matchDateRange = true;
    if (dateRange?.from) {
      const txDate = new Date(t.date);
      // set hours to 0 to compare dates easily
      txDate.setHours(0, 0, 0, 0);
      
      if (dateRange.to) {
        matchDateRange = txDate >= dateRange.from && txDate <= dateRange.to;
      } else {
        matchDateRange = txDate >= dateRange.from;
      }
    }
    
    return matchType && matchCategory && matchDateRange;
  });

  const availableCategories = Array.from(new Set([
    ...(filterType === 'all' || filterType === 'expense' ? expenseCategories : []),
    ...(filterType === 'all' || filterType === 'income' ? incomeCategories : []),
    ...transactions.map(t => t.category) // Include custom categories
  ])).sort();

  const activeDateFilterCount = dateRange?.from ? 1 : 0;
  const activeCategoryFilterCount = selectedCategories.length;

  const clearDateFilter = () => setDateRange(undefined);
  const clearCategoryFilter = () => setSelectedCategories([]);
  
  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Transactions</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => setShowAnalytics(!showAnalytics)} className={`shadow-sm w-full sm:w-auto rounded-xl transition-colors ${showAnalytics ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' : 'bg-background text-foreground'}`}>
            <LineChartIcon className="mr-2 h-4 w-4" /> Analytics
          </Button>
          <Button variant="outline" onClick={handleExportCSV} className="bg-background text-foreground shadow-sm w-full sm:w-auto rounded-xl">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          
          <Popover>
            <PopoverTrigger render={<Button variant="outline" className="bg-background text-foreground shadow-sm w-full sm:w-auto rounded-xl relative" />}>
              <CalendarIcon className="mr-2 h-4 w-4" /> 
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd")
                )
              ) : (
                "Filter by Date"
              )}
              {activeDateFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center">
                  1
                </span>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl border-border/50 shadow-xl" align="end">
              <Calendar
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
              {dateRange?.from && (
                <div className="p-3 border-t border-border/50 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={clearDateFilter} className="text-xs text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3 mr-1" /> Clear Date Filter
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger render={<Button variant="outline" className="bg-background text-foreground shadow-sm w-full sm:w-auto rounded-xl relative" />}>
              <Filter className="mr-2 h-4 w-4" /> 
              {selectedCategories.length > 0 ? `${selectedCategories.length} Categories` : "Filter by Category"}
              {activeCategoryFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center">
                  {activeCategoryFilterCount}
                </span>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 rounded-2xl border-border/50 shadow-xl" align="end">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <h4 className="font-semibold leading-none text-foreground">Categories</h4>
                {selectedCategories.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearCategoryFilter} className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3 mr-1" /> Clear
                  </Button>
                )}
              </div>
              <div className="max-h-[300px] overflow-y-auto p-2">
                {incomeCategories.length > 0 && (
                  <div className="mb-4">
                    <div className="px-2 py-1.5 text-xs font-semibold text-emerald-500 uppercase tracking-wider">Income</div>
                    {incomeCategories.map(cat => (
                      <label key={cat} className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 rounded-md cursor-pointer transition-colors" onClick={() => toggleCategory(cat)}>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedCategories.includes(cat) ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30'}`}>
                          {selectedCategories.includes(cat) && <Check className="w-3 h-3" />}
                        </div>
                        <span className="text-sm">{cat}</span>
                      </label>
                    ))}
                  </div>
                )}
                {expenseCategories.length > 0 && (
                  <div>
                    <div className="px-2 py-1.5 text-xs font-semibold text-rose-500 uppercase tracking-wider">Expense</div>
                    {expenseCategories.map(cat => (
                      <label key={cat} className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 rounded-md cursor-pointer transition-colors" onClick={() => toggleCategory(cat)}>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedCategories.includes(cat) ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30'}`}>
                          {selectedCategories.includes(cat) && <Check className="w-3 h-3" />}
                        </div>
                        <span className="text-sm">{cat}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          <TransactionActions />
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-muted rounded-lg w-full sm:w-max overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <Button 
          variant={filterType === 'all' ? 'default' : 'ghost'} 
          size="sm"
          onClick={() => setFilterType('all')}
          className="rounded-md"
        >
          All
        </Button>
        <Button 
          variant={filterType === 'income' ? 'default' : 'ghost'} 
          size="sm"
          onClick={() => setFilterType('income')}
          className="rounded-md"
        >
          Income
        </Button>
        <Button 
          variant={filterType === 'expense' ? 'default' : 'ghost'} 
          size="sm"
          onClick={() => setFilterType('expense')}
          className="rounded-md"
        >
          Expense
        </Button>
      </div>

      {showAnalytics && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <TransactionAnalytics transactions={filteredTransactions} />
        </div>
      )}

      {/* Desktop View: Table */}
      <div className="hidden md:block rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead>Date</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Added By</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </>
            ) : filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No transactions found.</TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((t) => (
                <TableRow key={t.id} className="border-border/50">
                  <TableCell className="font-medium whitespace-nowrap">{t.date}</TableCell>
                  <TableCell className="text-muted-foreground">{getAccountName(t.accountId)}</TableCell>
                  <TableCell>{t.description}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground shadow-sm">
                      {t.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {t.addedByName || 'Unknown'}
                  </TableCell>
                  <TableCell className={`text-right font-bold whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
                    {t.type === 'income' ? '+' : '-'}₹{formatCurrency(t.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <EditTransactionDialog 
                        transaction={t}
                        trigger={
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View: Cards */}
      <div className="md:hidden space-y-3 pb-20">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card border border-border/80 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-16 rounded-full" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border/40 mt-1">
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2 w-16" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            ))}
          </>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">No transactions found.</div>
        ) : (
          filteredTransactions.map((t) => (
            <div key={t.id} className="bg-card border border-border/80 rounded-xl p-4 shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-start gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-secondary text-secondary-foreground shadow-sm">
                      {t.category}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-medium">{t.date}</span>
                  </div>
                  <p className="font-semibold text-foreground text-sm leading-tight">{t.description}</p>
                </div>
                <div className={`text-right font-bold shrink-0 ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
                  {t.type === 'income' ? '+' : '-'}₹{formatCurrency(t.amount)}
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-border/40">
                <div className="flex flex-col">
                  <span className="text-[11px] text-muted-foreground font-medium">{getAccountName(t.accountId)}</span>
                  <span className="text-[10px] text-muted-foreground/70">Added by {t.addedByName || 'Unknown'}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <EditTransactionDialog 
                    transaction={t}
                    trigger={
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    }
                  />
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} className="h-8 w-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
