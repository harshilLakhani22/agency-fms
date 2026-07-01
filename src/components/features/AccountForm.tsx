'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Landmark, Trash2 } from 'lucide-react';
import { addDoc, collection, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Account } from '@/types';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface AccountFormProps {
  accountToEdit?: Account;
  trigger?: React.ReactNode;
}
export function AccountForm({ accountToEdit, trigger }: AccountFormProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  const [name, setName] = useState('');
  const [type, setType] = useState<'bank' | 'credit' | 'cash'>('bank');
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [initialBalance, setInitialBalance] = useState('');
  const [owner, setOwner] = useState<'Harshil' | 'Dhruvit'>('Harshil');

  // Sync state when dialog opens or accountToEdit changes
  useEffect(() => {
    if (open) {
      setName(accountToEdit?.name ?? '');
      setType(accountToEdit?.type ?? 'bank');
      setCurrency(accountToEdit?.currency ?? 'INR');
      setInitialBalance(accountToEdit?.initialBalance ? String(accountToEdit.initialBalance) : '');
      setOwner(accountToEdit?.owner ?? 'Harshil');
    }
  }, [open, accountToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      if (accountToEdit) {
        // Edit mode
        await updateDoc(doc(db, 'accounts', accountToEdit.id), {
          name,
          type,
          currency,
          initialBalance: parseFloat(initialBalance),
          owner,
        });
      } else {
        // Add mode
        await addDoc(collection(db, 'accounts'), {
          name,
          type,
          currency,
          initialBalance: parseFloat(initialBalance),
          addedBy: user.uid,
          owner,
          createdAt: Date.now(),
        });
      }
      
      setOpen(false);
      if (!accountToEdit) {
        // Reset only for add mode
        setName('');
        setInitialBalance('');
        setType('bank');
        setCurrency('INR');
        setOwner('Harshil');
      }
    } catch (error) {
      console.error('Error saving account: ', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!accountToEdit) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'accounts', accountToEdit.id));
      setDeleteConfirmOpen(false);
      setOpen(false);
    } catch (error) {
      console.error('Error deleting account: ', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)} className="inline-block cursor-pointer">
          {trigger}
        </span>
      ) : (
        <Button className="shadow-sm bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setOpen(true)}>
          <Landmark className="mr-2 h-4 w-4" /> Add Account
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[420px] bg-card/95 backdrop-blur-2xl border-blue-500/20 shadow-2xl rounded-3xl overflow-hidden p-0 gap-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        
        <div className="p-6 pb-4">
          <DialogHeader className="relative z-10 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30 shrink-0">
                <Landmark className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground text-left">
                  {accountToEdit ? 'Edit Account' : 'Add Account'}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground/80 text-left mt-0.5">
                  {accountToEdit 
                    ? 'Update the details for this account.'
                    : 'Connect a bank or credit card to track balances.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Account Name</Label>
              <Input 
                id="name" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Chase Business Checking"
                className="bg-background/50 h-14 rounded-xl border-border/60 focus-visible:ring-blue-500/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="type" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Account Type</Label>
                <Select required value={type} onValueChange={(val: any) => setType(val)}>
                  <SelectTrigger className="bg-background/50 h-14 rounded-xl border-border/60 focus-visible:ring-blue-500/30">
                    <SelectValue placeholder="Select type">
                      {(value) => {
                        switch (value) {
                          case 'bank': return 'Bank Account';
                          case 'credit': return 'Credit Card';
                          case 'cash': return 'Cash / Other';
                          default: return 'Select type';
                        }
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/60 shadow-lg">
                    <SelectItem value="bank">Bank Account</SelectItem>
                    <SelectItem value="credit">Credit Card</SelectItem>
                    <SelectItem value="cash">Cash / Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="owner" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Account Owner</Label>
                <Select required value={owner} onValueChange={(val: any) => setOwner(val)}>
                  <SelectTrigger className="bg-background/50 h-14 rounded-xl border-border/60 focus-visible:ring-blue-500/30">
                    <SelectValue placeholder="Select owner">
                      {(value) => value || 'Select owner'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/60 shadow-lg">
                    <SelectItem value="Harshil">Harshil</SelectItem>
                    <SelectItem value="Dhruvit">Dhruvit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="currency" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Currency</Label>
                <Select required value={currency} onValueChange={(val: any) => setCurrency(val)}>
                  <SelectTrigger className="bg-background/50 h-14 rounded-xl border-border/60 focus-visible:ring-blue-500/30">
                    <SelectValue placeholder="Select currency">
                      {(value) => value === 'USD' ? 'USD ($)' : 'INR (₹)'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/60 shadow-lg">
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="initialBalance" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">
                  Initial Balance ({currency === 'USD' ? '$' : '₹'})
                </Label>
                <Input 
                  id="initialBalance" 
                  type="number" 
                  step="0.01" 
                  required 
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  className="bg-background/50 h-14 rounded-xl text-lg font-bold border-border/60 focus-visible:ring-blue-500/30"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <Button type="submit" className="flex-1 h-14 rounded-xl font-bold text-base shadow-lg hover:shadow-xl bg-blue-600 hover:bg-blue-500 text-white transition-all hover:-translate-y-0.5" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {accountToEdit ? 'Update Account' : 'Save Account'}
              </Button>
              {accountToEdit && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  className="h-14 w-14 rounded-xl shrink-0 shadow-lg"
                  onClick={() => setDeleteConfirmOpen(true)}
                  disabled={loading}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              )}
            </div>
          </form>
        </div>
      </DialogContent>
      </Dialog>
      
      {accountToEdit && (
        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title="Delete Account"
          description={<>Are you sure you want to delete <strong>{accountToEdit.name}</strong>? This will not delete its transactions, but they will be orphaned.</>}
          onConfirm={handleDelete}
          isConfirming={loading}
          variant="destructive"
          confirmText="Delete"
        />
      )}
    </>
  );
}
