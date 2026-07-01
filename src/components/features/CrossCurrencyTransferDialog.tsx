'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { cn, formatAmount } from '@/lib/utils';
import { Loader2, ArrowLeftRight, CalendarIcon, DollarSign, IndianRupee } from 'lucide-react';
import { doc, writeBatch, collection } from 'firebase/firestore';

export function CrossCurrencyTransferDialog({ open, onOpenChange, onSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, onSuccess?: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const { accounts, currencySettings } = useTransactionStore();

  const usdAccounts = useMemo(() => accounts.filter(a => a.currency === 'USD'), [accounts]);
  const inrAccounts = useMemo(() => accounts.filter(a => a.currency !== 'USD'), [accounts]);

  const [sourceAccountId, setSourceAccountId] = useState('');
  const [destAccountId, setDestAccountId] = useState('');
  const [grossAmount, setGrossAmount] = useState('');
  
  const [feePercent, setFeePercent] = useState(currencySettings.defaultFeePercent.toString());
  const [exchangeRate, setExchangeRate] = useState(currencySettings.defaultExchangeRate.toString());
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [addedByName, setAddedByName] = useState<'Harshil' | 'Dhruvit'>('Harshil');

  // Sync defaults when settings change
  useEffect(() => {
    setFeePercent(currencySettings.defaultFeePercent.toString());
    setExchangeRate(currencySettings.defaultExchangeRate.toString());
  }, [currencySettings]);

  const feeAmount = (parseFloat(grossAmount || '0') * parseFloat(feePercent || '0')) / 100;
  const netAmount = parseFloat(grossAmount || '0') - feeAmount;
  const finalINR = netAmount * parseFloat(exchangeRate || '0');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !sourceAccountId || !destAccountId || !grossAmount) return;
    
    setLoading(true);
    try {
      const batch = writeBatch(db);
      
      const expenseRef = doc(collection(db, 'transactions'));
      const incomeRef = doc(collection(db, 'transactions'));
      const timestamp = Date.now();

      // 1. Expense from USD account
      batch.set(expenseRef, {
        accountId: sourceAccountId,
        type: 'expense',
        amount: parseFloat(grossAmount),
        currency: 'USD',
        date,
        category: 'Currency Transfer',
        description: description || 'Transfer to INR',
        addedBy: user.uid,
        addedByName,
        createdAt: timestamp,
        updatedAt: timestamp,
        linkedTransactionId: incomeRef.id,
        exchangeRate: parseFloat(exchangeRate),
        feePercent: parseFloat(feePercent),
        feeAmount,
        originalAmount: parseFloat(grossAmount),
      });

      // 2. Income to INR account
      batch.set(incomeRef, {
        accountId: destAccountId,
        type: 'income',
        amount: finalINR,
        currency: 'INR',
        date,
        category: 'Currency Transfer',
        description: description || 'Transfer from USD',
        addedBy: user.uid,
        addedByName,
        createdAt: timestamp,
        updatedAt: timestamp,
        linkedTransactionId: expenseRef.id,
        exchangeRate: parseFloat(exchangeRate),
        feePercent: parseFloat(feePercent),
        feeAmount,
        originalAmount: parseFloat(grossAmount),
      });

      await batch.commit();
      
      onOpenChange(false);
      setGrossAmount('');
      setDescription('');
      setSourceAccountId('');
      setDestAccountId('');
      setAddedByName('Harshil');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error saving transfer: ', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] w-[95vw] bg-card/95 backdrop-blur-2xl border-indigo-500/20 shadow-2xl rounded-3xl overflow-y-auto max-h-[90dvh] p-0 gap-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        
        <div className="p-6 pb-4">
          <DialogHeader className="relative z-10 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/30 shrink-0">
                <ArrowLeftRight className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground text-left">
                  Currency Transfer
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground/80 text-left mt-0.5">
                  Transfer from USD (e.g. Mulya) to INR Bank
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form id="transfer-form" onSubmit={handleSubmit} className="space-y-4 relative z-10">
            
            {/* Accounts */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="source" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">From (USD)</Label>
                <Select required value={sourceAccountId} onValueChange={(val: any) => setSourceAccountId(val)}>
                  <SelectTrigger className="bg-background/50 border-border/60 focus-visible:ring-indigo-500/30 transition-all rounded-xl h-14">
                    <SelectValue placeholder="Source Account">
                      {(value: string) => {
                        const acc = usdAccounts.find(a => a.id === value);
                        return acc ? acc.name : 'Source Account';
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {usdAccounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                    ))}
                    {usdAccounts.length === 0 && <SelectItem value="none" disabled>No USD Accounts</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dest" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">To (INR)</Label>
                <Select required value={destAccountId} onValueChange={(val: any) => setDestAccountId(val)}>
                  <SelectTrigger className="bg-background/50 border-border/60 focus-visible:ring-indigo-500/30 transition-all rounded-xl h-14">
                    <SelectValue placeholder="Destination Account">
                      {(value: string) => {
                        const acc = inrAccounts.find(a => a.id === value);
                        return acc ? acc.name : 'Destination Account';
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {inrAccounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Gross Amount (USD)</Label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-muted-foreground">
                  <DollarSign className="w-5 h-5" />
                </div>
                <Input 
                  id="amount" 
                  type="number"
                  step="0.01"
                  required 
                  value={grossAmount}
                  onChange={(e) => setGrossAmount(e.target.value)}
                  placeholder="0.00"
                  className="text-left text-2xl font-bold h-14 rounded-xl bg-background/50 border-border/60 focus-visible:ring-indigo-500/30 pl-10"
                />
              </div>
            </div>

            {/* Fee & Rate */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fee" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Platform Fee (%)</Label>
                <Input 
                  id="fee" 
                  type="number"
                  step="0.01"
                  required 
                  value={feePercent}
                  onChange={(e) => setFeePercent(e.target.value)}
                  className="bg-background/50 border-border/60 focus-visible:ring-indigo-500/30 rounded-xl h-14"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rate" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Exchange Rate (INR)</Label>
                <Input 
                  id="rate" 
                  type="number"
                  step="0.01"
                  required 
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  className="bg-background/50 border-border/60 focus-visible:ring-indigo-500/30 rounded-xl h-14"
                />
              </div>
            </div>

            {/* Calculations Preview */}
            <div className="bg-muted/30 p-3 rounded-xl border border-border/40 text-[11px] font-medium space-y-1.5">
              <div className="flex justify-between text-muted-foreground">
                <span>Gross:</span>
                <span>{formatAmount(parseFloat(grossAmount || '0'), 'USD')}</span>
              </div>
              <div className="flex justify-between text-rose-500/80">
                <span>Fee ({feePercent}%):</span>
                <span>-{formatAmount(feeAmount, 'USD')}</span>
              </div>
              <div className="flex justify-between text-foreground">
                <span>Net USD:</span>
                <span>{formatAmount(netAmount, 'USD')}</span>
              </div>
              <div className="h-px bg-border/50 my-1" />
              <div className="flex justify-between text-emerald-500 font-bold text-sm">
                <span>Final INR:</span>
                <span>{formatAmount(finalINR, 'INR')}</span>
              </div>
            </div>

            {/* Date & Desc */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Date</Label>
                <Popover>
                  <PopoverTrigger render={<Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-background/50 border-border/60 h-14 rounded-xl", !date && "text-muted-foreground")} />}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span className="text-sm">{date ? format(new Date(date), "PPP") : "Pick a date"}</span>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-indigo-500/20 shadow-xl rounded-xl" align="start">
                    <Calendar mode="single" selected={date ? new Date(date) : undefined} onSelect={(newDate) => { if (newDate) { const tzOffset = newDate.getTimezoneOffset() * 60000; setDate((new Date(newDate.getTime() - tzOffset)).toISOString().split('T')[0]); } }} className="rounded-xl" />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="addedBy" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Added By</Label>
                <Select required value={addedByName} onValueChange={(val: any) => setAddedByName(val)}>
                  <SelectTrigger className="bg-background/50 border-border/60 h-14 rounded-xl">
                    <SelectValue placeholder="Select user">
                      {(value: string) => value || 'Select user'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Harshil">Harshil</SelectItem>
                    <SelectItem value="Dhruvit">Dhruvit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Notes</Label>
              <Input 
                id="description" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Upwork to SBI"
                className="bg-background/50 border-border/60 h-14 rounded-xl"
              />
            </div>
          </form>
        </div>
        
        <div className="p-6 pt-4 bg-muted/30 border-t border-border/40 mt-2">
          <Button 
            type="submit" 
            form="transfer-form"
            className="w-full rounded-xl h-14 text-base font-bold tracking-wide transition-all duration-300 shadow-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/50 hover:shadow-indigo-600/50"
            disabled={loading || !sourceAccountId || !destAccountId || !grossAmount}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record Transfer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
