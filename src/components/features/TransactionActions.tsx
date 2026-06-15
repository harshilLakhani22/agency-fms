'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { IncomeDialog } from './IncomeDialog';
import { ExpenseDialog } from './ExpenseDialog';

export function TransactionActions() {
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2 w-full">
        <Button 
          className="shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium w-full sm:w-auto" 
          onClick={() => setIncomeOpen(true)}
        >
          <ArrowUpCircle className="mr-2 h-4 w-4" /> Add Income
        </Button>
        <Button 
          className="shadow-sm bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium w-full sm:w-auto" 
          onClick={() => setExpenseOpen(true)}
        >
          <ArrowDownCircle className="mr-2 h-4 w-4" /> Add Expense
        </Button>
      </div>

      <IncomeDialog open={incomeOpen} onOpenChange={setIncomeOpen} />
      <ExpenseDialog open={expenseOpen} onOpenChange={setExpenseOpen} />
    </>
  );
}
