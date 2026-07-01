'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUpCircle, ArrowDownCircle, ArrowLeftRight } from 'lucide-react';
import { IncomeDialog } from './IncomeDialog';
import { ExpenseDialog } from './ExpenseDialog';
import { CrossCurrencyTransferDialog } from './CrossCurrencyTransferDialog';

export function TransactionActions() {
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto shrink-0">
        <Button 
          className="shrink-0 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium w-full md:w-auto" 
          onClick={() => setIncomeOpen(true)}
        >
          <ArrowUpCircle className="mr-2 h-4 w-4" /> Income
        </Button>
        <Button 
          className="shrink-0 shadow-sm bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium w-full md:w-auto" 
          onClick={() => setExpenseOpen(true)}
        >
          <ArrowDownCircle className="mr-2 h-4 w-4" /> Expense
        </Button>
        <Button 
          className="shrink-0 shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium w-full md:w-auto" 
          onClick={() => setTransferOpen(true)}
        >
          <ArrowLeftRight className="mr-2 h-4 w-4" /> Currency
        </Button>
      </div>

      <IncomeDialog open={incomeOpen} onOpenChange={setIncomeOpen} />
      <ExpenseDialog open={expenseOpen} onOpenChange={setExpenseOpen} />
      <CrossCurrencyTransferDialog open={transferOpen} onOpenChange={setTransferOpen} />
    </>
  );
}
