'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { useTransactionStore } from '@/store/useTransactionStore';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Loader2, CalendarIcon, IndianRupee, Pencil } from 'lucide-react';
import { updateDoc, doc } from 'firebase/firestore';
import { Transaction } from '@/types';

const formatIndianNumber = (val: string) => {
  if (!val) return '';
  const parts = val.split('.');
  if (parts[0]) {
    parts[0] = parseInt(parts[0], 10).toLocaleString('en-IN');
  }
  return parts.join('.');
};

const INCOME_CATEGORIES = ['Upwork Client', 'Consulting', 'Other Income'];
const EXPENSE_CATEGORIES = ['Software Subscriptions', 'Upwork Connects', 'Office/Equipment', 'Other Expense'];

interface EditTransactionDialogProps {
  transaction: Transaction;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function EditTransactionDialog({ transaction, open: externalOpen, onOpenChange: externalOnOpenChange, trigger, onSuccess }: EditTransactionDialogProps) {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const isControlled = externalOpen !== undefined && externalOnOpenChange !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  const onOpenChange = isControlled ? externalOnOpenChange : setInternalOpen;
  
  const [amount, setAmount] = useState(String(transaction.amount));
  const [date, setDate] = useState(transaction.date);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [accountId, setAccountId] = useState(transaction.accountId);
  const [description, setDescription] = useState(transaction.description);
  const [addedByName, setAddedByName] = useState<'Harshil' | 'Dhruvit'>(transaction.addedByName || 'Harshil');

  const { accounts, transactions } = useTransactionStore();
  const type = transaction.type;

  const isDefaultCategory = (cat: string, t: 'income' | 'expense') => {
    const list = t === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    return list.includes(cat);
  };

  useEffect(() => {
    if (open) {
      setAmount(String(transaction.amount));
      setDate(transaction.date);
      setAccountId(transaction.accountId);
      setDescription(transaction.description);
      setAddedByName(transaction.addedByName || 'Harshil');
      
      const cat = transaction.category;
      if (isDefaultCategory(cat, type)) {
        setSelectedCategory(cat);
        setCustomCategory('');
      } else {
        setSelectedCategory('custom');
        setCustomCategory(cat);
      }
    }
  }, [open, transaction, type]);

  const categories = useMemo(() => {
    const defaults = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const custom = transactions
      .filter(t => t.type === type)
      .map(t => t.category);
    return Array.from(new Set([...defaults, ...custom]));
  }, [type, transactions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !accountId) return;
    
    const finalCategory = selectedCategory === 'custom' ? customCategory.trim() : selectedCategory;
    if (!finalCategory) return;
    
    setLoading(true);
    try {
      await updateDoc(doc(db, 'transactions', transaction.id), {
        accountId,
        amount: parseFloat(amount),
        date,
        category: finalCategory,
        description,
        addedByName,
        updatedAt: Date.now(),
      });
      
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error updating document: ', error);
    } finally {
      setLoading(false);
    }
  };

  const isIncome = type === 'income';

  return (
    <>
      {trigger && (
        <span onClick={() => onOpenChange(true)} className="inline-block cursor-pointer">
          {trigger}
        </span>
      )}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={`sm:max-w-[420px] bg-card/95 backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden p-0 gap-0 border ${isIncome ? 'border-emerald-500/20' : 'border-rose-500/20'}`}>
        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2 ${isIncome ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`} />
        
        <div className="p-6 pb-4">
          <DialogHeader className="relative z-10 mb-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 ${isIncome ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-rose-500/20 border-rose-500/30'}`}>
                <Pencil className={`h-4 w-4 ${isIncome ? 'text-emerald-500' : 'text-rose-500'}`} />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground text-left">
                  Edit {isIncome ? 'Income' : 'Expense'}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground/80 text-left mt-0.5">
                  Update the details of this transaction.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form id="edit-form" onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="amount-edit" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Amount</Label>
                <div className="relative flex items-center justify-center">
                  <div className="absolute left-3 text-muted-foreground">
                    <IndianRupee className="w-5 h-5" />
                  </div>
                  <Input 
                    id="amount-edit" 
                    type="text"
                    inputMode="decimal" 
                    required 
                    value={formatIndianNumber(amount)}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, '');
                      if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                        setAmount(raw);
                      }
                    }}
                    placeholder="0.00"
                    className={`text-left text-2xl font-bold h-14 rounded-xl bg-background/50 border-border/60 pl-10 transition-all ${
                      transaction.type === 'income' 
                        ? 'focus-visible:ring-emerald-500/30' 
                        : 'focus-visible:ring-rose-500/30'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Date</Label>
                <Popover>
                  <PopoverTrigger 
                    render={
                      <Button
                        variant="outline"
                        className={cn(
                          `w-full justify-start text-left font-normal bg-background/50 border-border/60 transition-all rounded-xl h-14 ${
                            transaction.type === 'income' 
                              ? 'focus-visible:ring-emerald-500/30' 
                              : 'focus-visible:ring-rose-500/30'
                          }`,
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-5 w-5" />
                        <span className="text-base">{date ? format(new Date(date), "PPP") : "Pick a date"}</span>
                      </Button>
                    }
                  />
                  <PopoverContent className={`w-auto p-0 shadow-xl rounded-xl ${
                    transaction.type === 'income' 
                      ? 'border-emerald-500/20' 
                      : 'border-rose-500/20'
                  }`} align="start">
                    <Calendar
                      mode="single"
                      selected={date ? new Date(date) : undefined}
                      onSelect={(newDate) => {
                        if (newDate) {
                          const tzOffset = newDate.getTimezoneOffset() * 60000;
                          const localISOTime = (new Date(newDate.getTime() - tzOffset)).toISOString().slice(0, -1);
                          setDate(localISOTime.split('T')[0]);
                        }
                      }}
                      className="rounded-xl"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="addedByName" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Added By</Label>
                <Select required value={addedByName} onValueChange={(val: any) => setAddedByName(val)}>
                  <SelectTrigger className={`bg-background/50 border-border/60 transition-all rounded-xl h-14 ${isIncome ? 'focus-visible:ring-emerald-500/30' : 'focus-visible:ring-rose-500/30'}`}>
                    <SelectValue placeholder="Select user">
                      {addedByName}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Harshil">Harshil</SelectItem>
                    <SelectItem value="Dhruvit">Dhruvit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="account" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Bank Account</Label>
                <Select required value={accountId} onValueChange={(val) => setAccountId(val || '')}>
                  <SelectTrigger className={`bg-background/50 border-border/60 transition-all rounded-xl h-14 ${isIncome ? 'focus-visible:ring-emerald-500/30' : 'focus-visible:ring-rose-500/30'}`}>
                    <SelectValue placeholder="Select an account">
                      {accounts.find(a => a.id === accountId)?.name || 'Select account'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.owner})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Category</Label>
              <Select required value={selectedCategory} onValueChange={(val) => setSelectedCategory(val || '')}>
                <SelectTrigger className={`bg-background/50 border-border/60 transition-all rounded-xl h-14 ${isIncome ? 'focus-visible:ring-emerald-500/30' : 'focus-visible:ring-rose-500/30'}`}>
                  <SelectValue placeholder="Select a category">
                    {selectedCategory === 'custom' ? '+ Custom Category' : selectedCategory}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                  <SelectItem value="custom" className={`font-semibold ${isIncome ? 'text-emerald-500 hover:text-emerald-600' : 'text-rose-500 hover:text-rose-600'}`}>
                    + Custom Category
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {selectedCategory === 'custom' && (
                <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                  <Input 
                    placeholder="Enter custom category name" 
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    required
                    className={`bg-background/50 border-border/60 transition-all rounded-xl h-14 ${isIncome ? 'focus-visible:ring-emerald-500/30' : 'focus-visible:ring-rose-500/30'}`}
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Description</Label>
              <textarea 
                id="description" 
                required 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description..."
                className={`flex w-full bg-background/50 border border-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ring-offset-background transition-all rounded-xl min-h-[80px] py-3 px-3 text-sm resize-none ${isIncome ? 'focus-visible:ring-emerald-500/30' : 'focus-visible:ring-rose-500/30'}`}
              />
            </div>
          </form>
        </div>
        
        <div className="p-6 pt-4 bg-muted/30 border-t border-border/40 mt-2">
          <Button 
            type="submit" 
            form="edit-form"
            className={`w-full rounded-xl h-12 text-sm font-bold tracking-wide transition-all duration-300 shadow-xl text-white ${
              isIncome 
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/50 hover:shadow-emerald-600/50' 
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/50 hover:shadow-rose-600/50'
            }`}
            disabled={loading || !selectedCategory || (selectedCategory === 'custom' && !customCategory.trim()) || !accountId || accountId === 'none'}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Transaction
          </Button>
        </div>
      </DialogContent>
      </Dialog>
    </>
  );
}
