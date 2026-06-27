import React, { useMemo } from 'react';
import { Transaction } from '@/types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

interface TransactionAnalyticsProps {
  transactions: Transaction[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9'];

export function TransactionAnalytics({ transactions }: TransactionAnalyticsProps) {
  // Process Data for Timeline and Net Flow
  const timelineData = useMemo(() => {
    // Group by date
    const grouped = transactions.reduce((acc, t) => {
      const dateStr = t.date; // YYYY-MM-DD
      if (!acc[dateStr]) {
        acc[dateStr] = { date: dateStr, income: 0, expense: 0, net: 0, parsedDate: parseISO(dateStr) };
      }
      if (t.type === 'income') {
        acc[dateStr].income += t.amount;
      } else {
        acc[dateStr].expense += t.amount;
      }
      return acc;
    }, {} as Record<string, { date: string, income: number, expense: number, net: number, parsedDate: Date }>);
    
    // Sort by date
    const sorted = Object.values(grouped).sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());
    
    // Calculate cumulative net flow
    let cumulativeNet = 0;
    return sorted.map(day => {
      cumulativeNet += (day.income - day.expense);
      return {
        ...day,
        formattedDate: format(day.parsedDate, 'MMM dd'),
        netFlow: cumulativeNet
      };
    });
  }, [transactions]);

  // Process Data for Category Breakdown
  const categoryData = useMemo(() => {
    const expenses: Record<string, number> = {};
    const incomes: Record<string, number> = {};
    
    transactions.forEach(t => {
      if (t.type === 'expense') {
        expenses[t.category] = (expenses[t.category] || 0) + t.amount;
      } else {
        incomes[t.category] = (incomes[t.category] || 0) + t.amount;
      }
    });
    
    const expenseData = Object.entries(expenses).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const incomeData = Object.entries(incomes).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    
    return { expenseData, incomeData };
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground border border-border/50 rounded-2xl bg-card/50">
        No transaction data available for the selected filters to display analytics.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover text-popover-foreground border border-border/50 p-3 rounded-lg shadow-xl text-xs space-y-1.5">
          <p className="font-semibold mb-2 text-sm">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="flex justify-between gap-4 font-medium">
              <span>{entry.name}:</span>
              <span>₹{formatCurrency(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover text-popover-foreground border border-border/50 p-3 rounded-lg shadow-xl text-xs font-medium">
          <p className="flex justify-between gap-4">
            <span>{data.name}:</span>
            <span>₹{formatCurrency(data.value)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Cash Flow Timeline */}
      <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm lg:col-span-2 min-w-0">
        <h3 className="text-sm font-semibold mb-4 text-foreground/80 uppercase tracking-wider">Cash Flow Timeline</h3>
        <div className="h-64 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/40" />
              <XAxis dataKey="formattedDate" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'currentColor' }} className="text-muted-foreground" />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'currentColor' }} className="text-muted-foreground" tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Net Flow Trajectory */}
      <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm min-w-0">
        <h3 className="text-sm font-semibold mb-4 text-foreground/80 uppercase tracking-wider">Net Flow Trajectory</h3>
        <div className="h-64 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/40" />
              <XAxis dataKey="formattedDate" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'currentColor' }} className="text-muted-foreground" />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'currentColor' }} className="text-muted-foreground" tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="netFlow" name="Net Worth" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 justify-between min-w-0">
        <div className="w-full flex flex-col items-center min-w-0">
          <h3 className="text-xs font-semibold mb-2 text-rose-500 uppercase tracking-wider self-start sm:self-center">Expenses by Category</h3>
          {categoryData.expenseData.length > 0 ? (
            <div className="h-48 w-full relative min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Pie
                    data={categoryData.expenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Total</span>
                <span className="text-sm font-bold text-rose-500">
                  ₹{formatCurrency(categoryData.expenseData.reduce((acc, curr) => acc + curr.value, 0))}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">No expenses</div>
          )}
        </div>
        
        <div className="w-px bg-border/50 hidden sm:block"></div>
        <div className="h-px bg-border/50 block sm:hidden"></div>

        <div className="w-full flex flex-col items-center min-w-0">
          <h3 className="text-xs font-semibold mb-2 text-emerald-500 uppercase tracking-wider self-start sm:self-center">Income by Category</h3>
          {categoryData.incomeData.length > 0 ? (
            <div className="h-48 w-full relative min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Pie
                    data={categoryData.incomeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.incomeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Total</span>
                <span className="text-sm font-bold text-emerald-500">
                  ₹{formatCurrency(categoryData.incomeData.reduce((acc, curr) => acc + curr.value, 0))}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">No income</div>
          )}
        </div>
      </div>

    </div>
  );
}
