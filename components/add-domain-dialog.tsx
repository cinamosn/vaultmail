import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddDomainDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAdd: (domain: string) => void;
}

export function AddDomainDialog({ open, onOpenChange, onAdd }: AddDomainDialogProps) {
    const [value, setValue] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value.trim()) {
            onAdd(value.trim());
            setValue('');
            onOpenChange(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => onOpenChange(false)}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                    />
                    
                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-6"
                    >
                        <div className="glass-card rounded-xl p-6 shadow-2xl border border-white/10 bg-black/80">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white">Add Custom Domain</h3>
                                <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">
                                        Enter the domain you have configured with your Webhook.
                                    </p>
                                    <Input 
                                        placeholder="e.g. my-custom-domain.com" 
                                        value={value}
                                        onChange={(e) => setValue(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={!value.trim()}>
                                        Add Domain
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
