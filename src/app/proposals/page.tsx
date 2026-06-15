'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProposalStore, ProposalStatus } from '@/store/useProposalStore';
import { AddProposalDialog } from '@/components/features/AddProposalDialog';
import { EditProposalDialog } from '@/components/features/EditProposalDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, Reply, Send, ExternalLink, Zap, Trash2, Sparkles, Pencil } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProposalsPage() {
  const { user } = useAuth();
  const { proposals, subscribe, isLoading, updateProposalStatus, deleteProposal } = useProposalStore();
  const [filterType, setFilterType] = useState<'all' | 'this_month' | 'last_7_days'>('all');

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribe(user.uid);
    return () => unsubscribe();
  }, [user, subscribe]);

  const filteredProposals = proposals.filter((p) => {
    if (filterType === 'all') return true;
    
    const pDate = parseISO(p.date);
    const now = new Date();
    
    if (filterType === 'this_month') {
      return pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
    }
    
    if (filterType === 'last_7_days') {
      const diffTime = Math.abs(now.getTime() - pDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }
    
    return true;
  });

  const totalApplied = filteredProposals.length;
  const totalViewed = filteredProposals.filter(p => p.status === 'Viewed' || p.status === 'Replied').length;
  const totalReplied = filteredProposals.filter(p => p.status === 'Replied').length;
  
  const totalConnects = filteredProposals.reduce((sum, p) => sum + p.connects + (p.boostConnects || 0), 0);

  const getStatusBadge = (status: ProposalStatus) => {
    switch (status) {
      case 'Applied':
        return <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">Applied</span>;
      case 'Viewed':
        return <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">Viewed</span>;
      case 'Replied':
        return <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20">Replied</span>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Proposals</h1>
          <p className="text-muted-foreground mt-1">Track and analyze your Upwork applications.</p>
        </div>
        <AddProposalDialog />
      </div>

      <div className="flex gap-2 p-1 bg-muted rounded-lg w-max">
        <Button 
          variant={filterType === 'all' ? 'default' : 'ghost'} 
          size="sm"
          onClick={() => setFilterType('all')}
          className="rounded-md"
        >
          All Time
        </Button>
        <Button 
          variant={filterType === 'this_month' ? 'default' : 'ghost'} 
          size="sm"
          onClick={() => setFilterType('this_month')}
          className="rounded-md"
        >
          This Month
        </Button>
        <Button 
          variant={filterType === 'last_7_days' ? 'default' : 'ghost'} 
          size="sm"
          onClick={() => setFilterType('last_7_days')}
          className="rounded-md"
        >
          Last 7 Days
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-zinc-900 to-black border border-border/80 shadow-md text-white">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">Total Applied</CardTitle>
            <div className="p-1.5 bg-white/10 text-white rounded-lg border border-white/10">
              <Send className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-9 w-16 bg-white/20" /> : <div className="text-3xl font-bold font-mono tracking-tight">{totalApplied}</div>}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-zinc-900 to-black border border-border/80 shadow-md text-white">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">Total Viewed</CardTitle>
            <div className="p-1.5 bg-white/10 text-white rounded-lg border border-white/10">
              <Eye className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2"><Skeleton className="h-9 w-16 bg-white/20" /><Skeleton className="h-3 w-20 bg-white/10" /></div>
            ) : (
              <>
                <div className="text-3xl font-bold font-mono tracking-tight">{totalViewed}</div>
                <p className="text-xs text-zinc-400 mt-1">{totalApplied > 0 ? Math.round((totalViewed / totalApplied) * 100) : 0}% view rate</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-zinc-900 to-black border border-border/80 shadow-md text-white">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">Total Replied</CardTitle>
            <div className="p-1.5 bg-white/10 text-white rounded-lg border border-white/10">
              <Reply className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2"><Skeleton className="h-9 w-16 bg-white/20" /><Skeleton className="h-3 w-20 bg-white/10" /></div>
            ) : (
              <>
                <div className="text-3xl font-bold font-mono tracking-tight">{totalReplied}</div>
                <p className="text-xs text-zinc-400 mt-1">{totalApplied > 0 ? Math.round((totalReplied / totalApplied) * 100) : 0}% reply rate</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-zinc-900 to-black border border-border/80 shadow-md text-white">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-28 h-28 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">Connects Used</CardTitle>
            <div className="p-1.5 bg-white/10 text-white rounded-lg border border-white/10">
              <Zap className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-9 w-16 bg-white/20" /> : <div className="text-3xl font-bold font-mono tracking-tight">{totalConnects}</div>}
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="w-[120px]">Date</TableHead>
              <TableHead>Account</TableHead>
              <TableHead className="w-[80px]">Connects</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Link</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </>
            ) : filteredProposals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No proposals found.</TableCell>
              </TableRow>
            ) : (
              filteredProposals.map((p) => (
                <TableRow key={p.id} className={`border-border/50 transition-colors group ${p.isInvite ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-muted/50'}`}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {format(parseISO(p.date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${p.account === 'Harshil' ? 'bg-indigo-500' : 'bg-fuchsia-500'}`} />
                      {p.account}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {p.isInvite ? (
                      <span className="inline-flex items-center gap-1 text-amber-500 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-md text-xs border border-amber-500/20">
                        <Sparkles className="h-3 w-3" /> Invite
                      </span>
                    ) : (
                      <>
                        {p.connects + (p.boostConnects || 0)}
                        {p.boostConnects ? <span className="text-xs text-[#14a800] ml-1">(+{p.boostConnects})</span> : null}
                      </>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(p.status)}
                  </TableCell>
                  <TableCell>
                    <a 
                      href={p.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-primary hover:underline hover:text-primary/80 transition-colors"
                    >
                      <span className="max-w-[200px] truncate">{p.link}</span>
                      <ExternalLink className="ml-1.5 h-3 w-3 shrink-0" />
                    </a>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <EditProposalDialog 
                        proposal={p}
                        trigger={
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                      {p.status === 'Applied' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-xs bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20"
                          onClick={() => updateProposalStatus(p.id, 'Viewed')}
                        >
                          <Eye className="mr-1.5 h-3 w-3" /> Mark Viewed
                        </Button>
                      )}
                      {(p.status === 'Applied' || p.status === 'Viewed') && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-xs bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20"
                          onClick={() => updateProposalStatus(p.id, 'Replied')}
                        >
                          <Reply className="mr-1.5 h-3 w-3" /> Mark Replied
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this proposal?')) {
                            deleteProposal(p.id);
                          }
                        }}
                      >
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
      </div>
    </div>
  );
}
