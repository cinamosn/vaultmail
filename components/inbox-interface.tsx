'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { RefreshCw, Copy, Mail, Loader2, ArrowRight, Trash2, Shield, Globe, History, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

// Types
interface Email {
  id: string;
  from: string;
  subject: string;
  text: string;
  html: string;
  receivedAt: string;
  to: string;
}

import { AddDomainDialog } from './add-domain-dialog';

interface InboxInterfaceProps {
    initialAddress?: string;
}

export function InboxInterface({ initialAddress }: InboxInterfaceProps) {
  const [address, setAddress] = useState<string>(initialAddress || '');
  const [domain, setDomain] = useState<string>('vaultmail.dpdns.org');
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [savedDomains, setSavedDomains] = useState<string[]>(['vaultmail.dpdns.org', 'vaultmail.qzz.io']);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isAddDomainOpen, setIsAddDomainOpen] = useState(false);

  // Load saved data
  useEffect(() => {
    const savedDoms = localStorage.getItem('dispo_domains');
    const savedHist = localStorage.getItem('dispo_history');
    
    if (savedDoms) {
        setSavedDomains(JSON.parse(savedDoms));
    } else {
        // Ensure defaults are set if nothing saved
        localStorage.setItem('dispo_domains', JSON.stringify(['vaultmail.dpdns.org', 'vaultmail.qzz.io']));
    }

    if (savedHist) setHistory(JSON.parse(savedHist));

    if (!initialAddress) {
        const saved = localStorage.getItem('dispo_address');
        if (saved) {
            setAddress(saved);
            const parts = saved.split('@');
            if (parts.length > 1) setDomain(parts[1]);
        } else {
            generateAddress();
        }
    } else {
         const parts = initialAddress.split('@');
         if (parts.length > 1) setDomain(parts[1]);
    }
  }, [initialAddress]);

  // Sync Address to URL (without reloading)
  useEffect(() => {
      if (address && address.includes('@')) {
          window.history.replaceState(null, '', `/${address}`);
      }
  }, [address]);

  const addToHistory = (addr: string) => {
      if (!addr.includes('@')) return;
      
      setHistory(prev => {
          // Prevent duplicates and limit to 10
          if (prev.includes(addr)) {
               // Move to top if exists
               return [addr, ...prev.filter(a => a !== addr)];
          }
          const newHist = [addr, ...prev].slice(0, 10);
          localStorage.setItem('dispo_history', JSON.stringify(newHist));
          return newHist;
      });
  };

  const generateAddress = () => {
    // Generate pronounceable random string (e.g. weidipoffeutre)
    const vowels = 'aeiou';
    const consonants = 'bcdfghjklmnpqrstvwxyz';
    let name = '';
    const length = Math.floor(Math.random() * 5) + 8; // 8-12 chars

    for (let i = 0; i < length; i++) {
        const isVowel = i % 2 === 1; // Start with consonant usually
        const set = isVowel ? vowels : consonants;
        name += set[Math.floor(Math.random() * set.length)];
    }

    const num = Math.floor(Math.random() * 9000) + 1000; // 4 digit number
    const newAddress = `${name}-${num}@${domain}`;
    
    setAddress(newAddress);
    localStorage.setItem('dispo_address', newAddress);
    setEmails([]);
    setSelectedEmail(null);
    toast.success('New alias created');
    addToHistory(newAddress);
  };



  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard');
  };

  const fetchEmails = useCallback(async () => {
    if (!address) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/inbox?address=${encodeURIComponent(address)}`);
      const data = await res.json();
      if (data.emails) {
        // Only update if changes to avoid jitter, or just replace for now
        // De-dupe could be handled here
        setEmails(data.emails);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Initial fetch
  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // Polling
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchEmails, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchEmails]);
  
  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header / Controls */}
      <div className="glass-card rounded-2xl p-6 md:p-8 space-y-6 relative z-10">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="space-y-1 text-center md:text-left">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Your Temporary Inbox
            </h2>
            <p className="text-muted-foreground text-sm">
              Waiting for emails at this address. Messages auto-delete after 24h.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
                {loading ? 'Syncing...' : 'Live'}
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
                <Input 
                    value={address.split('@')[0]}
                    onChange={(e) => {
                        const val = e.target.value.replace(/[^a-zA-Z0-9._-]/g, '');
                        const currentDomain = address.split('@')[1] || domain;
                        setAddress(`${val}@${currentDomain}`);
                        localStorage.setItem('dispo_address', `${val}@${currentDomain}`);
                    }}
                    onBlur={() => addToHistory(address)}
                    className="pr-4 font-mono text-lg bg-black/20 border-white/10 h-12"
                    placeholder="username"
                />
            </div>
            <div className="relative flex items-center">
                 <span className="text-muted-foreground text-lg px-2">@</span>
            </div>
            <div className="relative flex-1 max-w-[250px] flex gap-2">
                 {/* Domain Selection Logic */}
                 <div className="relative w-full">
                    <select 
                        value={domain}
                        onChange={(e) => {
                            const newDomain = e.target.value;
                            if (newDomain === 'add_new') {
                                setIsAddDomainOpen(true);
                            } else {
                                setDomain(newDomain);
                                const currentUser = address.split('@')[0];
                                const newAddr = `${currentUser}@${newDomain}`;
                                setAddress(newAddr);
                                localStorage.setItem('dispo_address', newAddr);
                                addToHistory(newAddr);
                            }
                        }}
                        className="w-full h-12 pl-3 pr-8 rounded-md border border-white/10 bg-black/20 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none glass"
                    >
                        {savedDomains.map((d) => (
                            <option key={d} value={d} className="bg-slate-900">{d}</option>
                        ))}
                        <option value="add_new" className="bg-slate-900 font-bold text-blue-400">+ Add Domain</option>
                    </select>
                    <ArrowRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none rotate-90" />
                 </div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative">
                <Button 
                    onClick={() => setShowHistory(!showHistory)} 
                    variant="ghost" 
                    size="icon" 
                    className={cn("h-12 w-12 border border-white/10 hover:bg-white/5", showHistory && "bg-white/10")}
                >
                    <History className="h-4 w-4" />
                </Button>
                
                <AnimatePresence>
                    {showHistory && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 top-14 w-64 glass-card rounded-xl p-2 z-50 border border-white/10 shadow-2xl"
                        >
                            <div className="flex justify-between items-center px-2 py-1 mb-1 text-xs text-muted-foreground uppercase font-bold tracking-wider">
                                <span>Recent</span>
                                <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => setShowHistory(false)}>
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                            <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                                {history.length === 0 ? (
                                    <div className="text-center p-4 text-sm text-muted-foreground">No history yet</div>
                                ) : (
                                    history.map((histAddr) => (
                                        <div key={histAddr} className="flex group items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                                            <div 
                                                className="flex-1 truncate text-sm font-mono"
                                                onClick={() => {
                                                    setAddress(histAddr);
                                                    const parts = histAddr.split('@');
                                                    if(parts[1]) setDomain(parts[1]);
                                                    localStorage.setItem('dispo_address', histAddr);
                                                    setShowHistory(false);
                                                }}
                                            >
                                                {histAddr}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                                onClick={() => {
                                                    const newHist = history.filter(h => h !== histAddr);
                                                    setHistory(newHist);
                                                    localStorage.setItem('dispo_history', JSON.stringify(newHist));
                                                }}
                                            >
                                                <Trash2 className="h-3 w-3 text-red-400" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <Button onClick={copyAddress} variant="secondary" size="lg" className="h-12">
              <Copy className="mr-2 h-4 w-4" /> Copy
            </Button>
            <Button onClick={generateAddress} variant="outline" size="lg" className="h-12 border-white/10 hover:bg-white/5">
              <RefreshCw className="mr-2 h-4 w-4" /> New
            </Button>
          </div>
        </div>

        <AddDomainDialog 
            open={isAddDomainOpen} 
            onOpenChange={setIsAddDomainOpen} 
            onAdd={(custom) => {
                const newSaved = [...savedDomains, custom];
                setSavedDomains(newSaved);
                localStorage.setItem('dispo_domains', JSON.stringify(newSaved));
                setDomain(custom);
                
                const currentUser = address.split('@')[0];
                const newAddr = `${currentUser}@${custom}`;
                setAddress(newAddr);
                localStorage.setItem('dispo_address', newAddr);
                addToHistory(newAddr);
            }} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
        {/* Email List */}
        <div className="md:col-span-1 glass-card rounded-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                <h3 className="font-semibold flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-400" /> Inbox
                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-muted-foreground">{emails.length}</span>
                </h3>
                <Button variant="ghost" size="icon" onClick={() => fetchEmails()} disabled={loading}>
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {emails.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="h-full flex flex-col items-center justify-center text-center p-4 text-muted-foreground space-y-2 opacity-50"
                        >
                            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                            <p>Waiting for incoming mail...</p>
                        </motion.div>
                    ) : (
                        emails.map((email) => (
                            <motion.div
                                key={email.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onClick={() => setSelectedEmail(email)}
                                className={cn(
                                    "p-4 rounded-xl cursor-pointer transition-all border border-transparent hover:bg-white/5",
                                    selectedEmail?.id === email.id ? "bg-white/10 border-blue-500/30" : "bg-black/20"
                                )}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-medium truncate max-w-[150px] text-sm">{email.from}</span>
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                        {formatDistanceToNow(new Date(email.receivedAt), { addSuffix: true })}
                                    </span>
                                </div>
                                <h4 className="text-sm font-semibold truncate text-blue-100">{email.subject}</h4>
                                <p className="text-xs text-muted-foreground truncate mt-1">{email.text.slice(0, 50)}...</p>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>

        {/* Email Content */}
        <div className="md:col-span-2 glass-card rounded-2xl overflow-hidden flex flex-col h-full bg-black/40">
            {selectedEmail ? (
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 space-y-4 bg-black/20">
                        <div className="flex justify-between items-start">
                            <h1 className="text-xl font-bold text-white">{selectedEmail.subject}</h1>
                            <span className="text-xs text-muted-foreground border border-white/10 px-2 py-1 rounded-md">
                                {new Date(selectedEmail.receivedAt).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs">
                                {selectedEmail.from.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium text-white">{selectedEmail.from}</span>
                                <span className="text-muted-foreground text-xs">to {selectedEmail.to || address}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 bg-white">
                         <div 
                            className="prose prose-sm max-w-none text-black"
                            dangerouslySetInnerHTML={{ __html: selectedEmail.html || `<p>${selectedEmail.text}</p>` }}
                        />
                    </div>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
                    <div className="p-4 rounded-full bg-white/5 border border-white/5">
                        <Mail className="h-8 w-8 opacity-50" />
                    </div>
                    <p>Select an email to read</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
