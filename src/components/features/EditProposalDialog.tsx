'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Link as LinkIcon, Zap, Loader2, Sparkles, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProposalStore, Proposal } from '@/store/useProposalStore';
import { toast } from 'sonner';

interface EditProposalDialogProps {
  proposal: Proposal;
  trigger: React.ReactNode;
}

export function EditProposalDialog({ proposal, trigger }: EditProposalDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [link, setLink] = useState(proposal.link);
  const [connects, setConnects] = useState(proposal.connects.toString());
  const [boostConnects, setBoostConnects] = useState(proposal.boostConnects ? proposal.boostConnects.toString() : '');
  const [isInvite, setIsInvite] = useState(proposal.isInvite || false);
  const [account, setAccount] = useState<'Harshil' | 'Dhruvit'>(proposal.account);
  const [date, setDate] = useState<string>(proposal.date);
  const [status, setStatus] = useState<Proposal['status']>(proposal.status);

  const updateProposal = useProposalStore((state) => state.updateProposal);

  // Reset state if proposal changes
  useEffect(() => {
    setLink(proposal.link);
    setConnects(proposal.connects.toString());
    setBoostConnects(proposal.boostConnects ? proposal.boostConnects.toString() : '');
    setIsInvite(proposal.isInvite || false);
    setAccount(proposal.account);
    setDate(proposal.date);
    setStatus(proposal.status);
  }, [proposal]);

  const resetForm = () => {
    setLink(proposal.link);
    setConnects(proposal.connects.toString());
    setBoostConnects(proposal.boostConnects ? proposal.boostConnects.toString() : '');
    setIsInvite(proposal.isInvite || false);
    setAccount(proposal.account);
    setDate(proposal.date);
    setStatus(proposal.status);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!link || !date) return;
    
    // Connects must be 0 if invite, otherwise require connects
    if (!isInvite && !connects) return;

    setIsLoading(true);
    try {
      await updateProposal(proposal.id, {
        link,
        connects: isInvite ? 0 : Number(connects),
        boostConnects: isInvite ? 0 : (boostConnects ? Number(boostConnects) : 0),
        isInvite,
        account,
        date,
        status,
      });

      toast.success("Proposal updated successfully.");
      setOpen(false);
    } catch (error) {
      toast.error("Failed to update proposal. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) resetForm();
    }}>
      <DialogTrigger render={trigger} />
      
      <DialogContent className="sm:max-w-[420px] bg-card/95 backdrop-blur-2xl border-blue-500/20 shadow-2xl rounded-3xl overflow-hidden p-0 gap-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        
        <div className="p-6 pb-4 relative">
          <DialogHeader className="relative z-10 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30 shrink-0">
                <Pencil className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground text-left">
                  Edit Proposal
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground/80 text-left mt-0.5">
                  Update the details of your proposal.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form id={`edit-proposal-form-${proposal.id}`} onSubmit={handleSubmit} className="space-y-4 relative z-10">
            {/* Job Link */}
            <div className="space-y-1.5">
              <Label htmlFor={`link-${proposal.id}`} className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Job Link</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id={`link-${proposal.id}`}
                  type="url"
                  placeholder="https://www.upwork.com/jobs/..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="pl-9 h-12 bg-background/50 border-border/60 focus-visible:ring-blue-500/30 transition-all rounded-xl text-sm"
                  required
                />
              </div>
            </div>
            
            {/* Invite Switch */}
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 p-3 transition-all">
              <div className="space-y-0.5">
                <Label htmlFor={`invite-mode-${proposal.id}`} className="text-sm font-semibold flex items-center">
                  <Sparkles className="w-4 h-4 text-amber-500 mr-2" />
                  Received an Invite?
                </Label>
                <p className="text-xs text-muted-foreground">
                  Invites cost 0 connects.
                </p>
              </div>
              <Switch
                id={`invite-mode-${proposal.id}`}
                checked={isInvite}
                onCheckedChange={(checked) => {
                  setIsInvite(checked);
                  if (checked) {
                    setConnects('');
                    setBoostConnects('');
                  }
                }}
                className="data-[state=checked]:bg-amber-500"
              />
            </div>

            {/* Connects and Boost Connects Row */}
            <div className={`grid grid-cols-2 gap-4 transition-all duration-300 ${isInvite ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="space-y-1.5">
                <Label htmlFor={`connects-${proposal.id}`} className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Connects</Label>
                <div className="relative flex items-center justify-center">
                  <div className="absolute left-3 text-muted-foreground">
                    <Zap className="w-4 h-4 text-[#14a800]" />
                  </div>
                  <Input 
                    id={`connects-${proposal.id}`} 
                    type="number" 
                    min="1"
                    required={!isInvite}
                    value={isInvite ? '0' : connects}
                    onChange={(e) => setConnects(e.target.value)}
                    placeholder="0"
                    disabled={isInvite}
                    className="text-left text-xl font-bold h-12 rounded-xl bg-background/50 border-border/60 focus-visible:ring-blue-500/30 pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`boostConnects-${proposal.id}`} className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Boost Connects</Label>
                <div className="relative flex items-center justify-center">
                  <div className="absolute left-3 text-muted-foreground">
                    <Zap className="w-4 h-4 text-[#14a800]/60" />
                  </div>
                  <Input 
                    id={`boostConnects-${proposal.id}`} 
                    type="number" 
                    min="0"
                    value={isInvite ? '0' : boostConnects}
                    onChange={(e) => setBoostConnects(e.target.value)}
                    placeholder="0"
                    disabled={isInvite}
                    className="text-left text-xl font-bold h-12 rounded-xl bg-background/50 border-border/60 focus-visible:ring-blue-500/30 pl-9"
                  />
                </div>
              </div>
            </div>

            {/* Date and Account Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor={`date-${proposal.id}`} className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Date Applied</Label>
                <Popover>
                  <PopoverTrigger 
                    render={
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-background/50 border-border/60 focus-visible:ring-blue-500/30 transition-all rounded-xl h-12",
                          !date && "text-muted-foreground"
                        )}
                      />
                    }
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span className="text-sm">{date ? format(new Date(date), "PPP") : "Pick a date"}</span>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-blue-500/20 shadow-xl rounded-xl" align="start">
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
                <Label htmlFor={`account-${proposal.id}`} className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Account</Label>
                <Select required value={account} onValueChange={(val: any) => setAccount(val)}>
                  <SelectTrigger className="!h-12 bg-background/50 border-border/60 focus-visible:ring-blue-500/30 transition-all rounded-xl">
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

            {/* Status Select */}
            <div className="space-y-1.5">
              <Label htmlFor={`status-${proposal.id}`} className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Status</Label>
              <Select required value={status} onValueChange={(val: any) => setStatus(val)}>
                <SelectTrigger className="!h-12 bg-background/50 border-border/60 focus-visible:ring-blue-500/30 transition-all rounded-xl">
                  <SelectValue placeholder="Select status">
                    {(value) => value || 'Select status'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/60 shadow-xl">
                  <SelectItem value="Applied" className="rounded-lg">Applied</SelectItem>
                  <SelectItem value="Viewed" className="rounded-lg">Viewed</SelectItem>
                  <SelectItem value="Replied" className="rounded-lg">Replied</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
        </div>

        <div className="p-6 pt-4 bg-muted/30 border-t border-border/40 mt-2">
          <Button 
            type="submit" 
            form={`edit-proposal-form-${proposal.id}`}
            className="w-full rounded-xl h-12 text-sm font-bold tracking-wide transition-all duration-300 shadow-xl bg-blue-600 hover:bg-blue-600/90 text-white shadow-blue-500/30 hover:shadow-blue-500/50"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
