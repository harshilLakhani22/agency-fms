'use client';

import { useState, useMemo } from 'react';
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
import { Loader2, ArrowDownCircle, CalendarIcon, IndianRupee } from 'lucide-react';
import { addDoc as firestoreAddDoc, collection as firestoreCollection } from 'firebase/firestore';


const formatIndianNumber = (val: string) => {
  if (!val) return '';
  const parts = val.split('.');
  if (parts[0]) {
    parts[0] = parseInt(parts[0], 10).toLocaleString('en-IN');
  }
  return parts.join('.');
};

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ExpenseDialog({ open, onOpenChange, onSuccess }: ExpenseDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [accountId, setAccountId] = useState('');
  const [description, setDescription] = useState('');
  const [addedByName, setAddedByName] = useState<'Harshil' | 'Dhruvit'>('Harshil');

  const { accounts, transactions, expenseCategories } = useTransactionStore();

  const categories = useMemo(() => {
    const custom = transactions
      .filter(t => t.type === 'expense')
      .map(t => t.category);
    return Array.from(new Set([...expenseCategories, ...custom]));
  }, [transactions, expenseCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !accountId) return;
    
    const finalCategory = selectedCategory === 'custom' ? customCategory.trim() : selectedCategory;
    if (!finalCategory) return;
    
    const selectedAcc = accounts.find(a => a.id === accountId);
    const currency = selectedAcc?.currency || 'INR';

    setLoading(true);
    try {
      await firestoreAddDoc(firestoreCollection(db, 'transactions'), {
        type: 'expense',
        accountId,
        amount: parseFloat(amount),
        currency,
        date,
        category: finalCategory,
        description,
        addedBy: user.uid,
        addedByName,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      
      onOpenChange(false);
      setAmount('');
      setDescription('');
      setAccountId('');
      setSelectedCategory('');
      setCustomCategory('');
      setAddedByName('Harshil');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error saving document: ', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-card/95 backdrop-blur-2xl border-rose-500/20 shadow-2xl rounded-3xl overflow-hidden p-0 gap-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        
        <div className="p-6 pb-4">
          <DialogHeader className="relative z-10 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-500/20 rounded-full flex items-center justify-center border border-rose-500/30 shrink-0">
                <ArrowDownCircle className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground text-left">
                  Add Expense
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground/80 text-left mt-0.5">
                  Record a new cost to your agency.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form id="expense-form" onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {/* Amount and Date Input Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="amount-expense" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">
                  Amount ({accounts.find(a => a.id === accountId)?.currency === 'USD' ? '$' : '₹'})
                </Label>
                <div className="relative flex items-center justify-center">
                  <div className="absolute left-3 text-muted-foreground font-bold text-lg">
                    {accounts.find(a => a.id === accountId)?.currency === 'USD' ? '$' : <IndianRupee className="w-5 h-5" />}
                  </div>
                  <Input 
                    id="amount-expense" 
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
                    className="text-left text-2xl font-bold h-14 rounded-xl bg-background/50 border-border/60 focus-visible:ring-rose-500/30 pl-10"
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
                          "w-full justify-start text-left font-normal bg-background/50 border-border/60 focus-visible:ring-rose-500/30 transition-all rounded-xl h-14",
                          !date && "text-muted-foreground"
                        )}
                      />
                    }
                  >
                    <CalendarIcon className="mr-2 h-5 w-5" />
                    <span className="text-base">{date ? format(new Date(date), "PPP") : "Pick a date"}</span>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-rose-500/20 shadow-xl rounded-xl" align="start">
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
                  <SelectTrigger className="bg-background/50 border-border/60 focus-visible:ring-rose-500/30 transition-all rounded-xl h-14">
                    <SelectValue placeholder="Select user">
                      {(value) => value || 'Select user'}
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
                  <SelectTrigger className="bg-background/50 border-border/60 focus-visible:ring-rose-500/30 transition-all rounded-xl h-14">
                    <SelectValue placeholder="Select an account">
                      {(value) => {
                        const acc = accounts.find(a => a.id === value);
                        return acc ? `${acc.name}` : 'Select account';
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.owner})</SelectItem>
                    ))}
                    {accounts.length === 0 && (
                      <SelectItem value="none" disabled>No accounts</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Category</Label>
              <Select required value={selectedCategory} onValueChange={(val) => setSelectedCategory(val || '')}>
                <SelectTrigger className="bg-background/50 border-border/60 focus-visible:ring-rose-500/30 transition-all rounded-xl h-14">
                  <SelectValue placeholder="Select a category">
                    {(value) => {
                      if (value === 'custom') return '+ Custom Category';
                      return value || 'Select a category';
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                  <SelectItem value="custom" className="font-semibold text-rose-500 hover:text-rose-600">
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
                    className="bg-background/50 border-border/60 focus-visible:ring-rose-500/30 transition-all rounded-xl h-14"
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
                placeholder="e.g. Adobe Suite"
                className="flex w-full bg-background/50 border border-border/60 focus-visible:ring-rose-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ring-offset-background transition-all rounded-xl min-h-[80px] py-3 px-3 text-sm resize-none"
              />
            </div>
          </form>
        </div>
        
        <div className="p-6 pt-4 bg-muted/30 border-t border-border/40 mt-2">
          <Button 
            type="submit" 
            form="expense-form"
            className="w-full rounded-xl h-12 text-sm font-bold tracking-wide transition-all duration-300 shadow-xl bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/50 hover:shadow-rose-600/50"
            disabled={loading || !selectedCategory || (selectedCategory === 'custom' && !customCategory.trim()) || !accountId || accountId === 'none'}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Expense
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
