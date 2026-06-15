'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Send, Link as LinkIcon, Zap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useProposalStore } from '@/store/useProposalStore';

export function AddProposalDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [link, setLink] = useState('');
  const [connects, setConnects] = useState('');
  const [boostConnects, setBoostConnects] = useState('');
  const [account, setAccount] = useState<'Harshil' | 'Dhruvit'>('Harshil');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const { user } = useAuth();
  const addProposal = useProposalStore((state) => state.addProposal);

  const resetForm = () => {
    setLink('');
    setConnects('');
    setBoostConnects('');
    setAccount('Harshil');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!link || !connects || !date) return;

    setIsLoading(true);
    try {
      await addProposal({
        link,
        connects: Number(connects),
        boostConnects: boostConnects ? Number(boostConnects) : 0,
        account,
        date,
        status: 'Applied',
        userId: user.uid,
      });

      alert("Proposal tracked successfully.");
      
      setOpen(false);
      resetForm();
    } catch (error) {
      alert("Failed to add proposal. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) resetForm();
    }}>
      <DialogTrigger 
        render={
          <Button className="bg-[#14a800] hover:bg-[#14a800]/90 text-white shadow-lg hover:shadow-xl shadow-[#14a800]/20 transition-all duration-300">
            <Send className="mr-2 h-4 w-4" /> Add Proposal
          </Button>
        }
      />
      
      <DialogContent className="sm:max-w-[420px] bg-card/95 backdrop-blur-2xl border-[#14a800]/20 shadow-2xl rounded-3xl overflow-hidden p-0 gap-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#14a800]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        
        <div className="p-6 pb-4 relative">
          <DialogHeader className="relative z-10 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#14a800]/20 rounded-full flex items-center justify-center border border-[#14a800]/30 shrink-0">
                <Send className="h-5 w-5 text-[#14a800]" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground text-left">
                  Track Proposal
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground/80 text-left mt-0.5">
                  Record a new Upwork proposal.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form id="proposal-form" onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {/* Job Link */}
            <div className="space-y-1.5">
              <Label htmlFor="link" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Job Link</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="link"
                  type="url"
                  placeholder="https://www.upwork.com/jobs/..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="pl-9 h-14 bg-background/50 border-border/60 focus-visible:ring-[#14a800]/30 transition-all rounded-xl text-sm"
                  required
                />
              </div>
            </div>

            {/* Connects and Boost Connects Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="connects" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Connects</Label>
                <div className="relative flex items-center justify-center">
                  <div className="absolute left-3 text-muted-foreground">
                    <Zap className="w-5 h-5 text-[#14a800]" />
                  </div>
                  <Input 
                    id="connects" 
                    type="number" 
                    min="1"
                    required 
                    value={connects}
                    onChange={(e) => setConnects(e.target.value)}
                    placeholder="0"
                    className="text-left text-2xl font-bold h-14 rounded-xl bg-background/50 border-border/60 focus-visible:ring-[#14a800]/30 pl-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="boostConnects" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Boost Connects</Label>
                <div className="relative flex items-center justify-center">
                  <div className="absolute left-3 text-muted-foreground">
                    <Zap className="w-5 h-5 text-[#14a800]/60" />
                  </div>
                  <Input 
                    id="boostConnects" 
                    type="number" 
                    min="0"
                    value={boostConnects}
                    onChange={(e) => setBoostConnects(e.target.value)}
                    placeholder="0"
                    className="text-left text-2xl font-bold h-14 rounded-xl bg-background/50 border-border/60 focus-visible:ring-[#14a800]/30 pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Total Connects Info */}
            {(connects || boostConnects) && (
              <div className="flex justify-end items-center -mt-2 pr-1">
                <div className="text-xs font-semibold text-muted-foreground/80 bg-background/80 px-2.5 py-1 rounded-md border border-border/40">
                  Total Connects Used: <span className="text-[#14a800] font-bold text-sm ml-1">{Number(connects || 0) + Number(boostConnects || 0)}</span>
                </div>
              </div>
            )}

            {/* Date and Account Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Date Applied</Label>
                <Popover>
                  <PopoverTrigger 
                    render={
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-background/50 border-border/60 focus-visible:ring-[#14a800]/30 transition-all rounded-xl h-14",
                          !date && "text-muted-foreground"
                        )}
                      />
                    }
                  >
                    <CalendarIcon className="mr-2 h-5 w-5" />
                    <span className="text-base">{date ? format(new Date(date), "PPP") : "Pick a date"}</span>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-[#14a800]/20 shadow-xl rounded-xl" align="start">
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

              <div className="space-y-1.5">
                <Label htmlFor="account" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Account</Label>
                <Select required value={account} onValueChange={(val: any) => setAccount(val)}>
                  <SelectTrigger className="!h-14 bg-background/50 border-border/60 focus-visible:ring-[#14a800]/30 transition-all rounded-xl">
                    <SelectValue placeholder="Select account">
                      {(value) => value || 'Select account'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/60 shadow-xl">
                    <SelectItem value="Harshil" className="rounded-lg">Harshil</SelectItem>
                    <SelectItem value="Dhruvit" className="rounded-lg">Dhruvit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 pt-4 bg-muted/30 border-t border-border/40 mt-2">
          <Button 
            type="submit" 
            form="proposal-form"
            className="w-full rounded-xl h-12 text-sm font-bold tracking-wide transition-all duration-300 shadow-xl bg-[#14a800] hover:bg-[#14a800]/90 text-black shadow-[#14a800]/30 hover:shadow-[#14a800]/50"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Proposal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
