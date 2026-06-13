import React, { useState, useEffect } from 'react';
import { getSubscriptionStatus } from './services/api';
import { Sparkles, AlertCircle, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SubscriptionStatus {
    current_tier: string;
    analyses_used: number;
    analyses_remaining: number;
    reset_date: string | null;
}

const UsageBanner: React.FC<{ onUpgradeClick: () => void }> = ({ onUpgradeClick }) => {
    const [status, setStatus] = useState<SubscriptionStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const data = await getSubscriptionStatus();
                setStatus(data);
            } catch (err) {
                console.error("Failed to fetch subscription status", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, []);

    if (loading || !status) return null;
    if (status.current_tier === 'agency') return null;

    const isFree = status.current_tier === 'free';
    const isWarning = status.analyses_remaining <= 1 && status.analyses_remaining >= 0;
    const showUpgradeCTA = isFree && status.analyses_used >= 3;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full mb-6"
            >
                <div className={`rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 border ${
                    isWarning 
                    ? 'bg-rose-50 border-rose-200 text-rose-900' 
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isWarning ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                            {isWarning ? <AlertCircle className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest opacity-60 leading-none mb-1">Usage Tracker</p>
                            <p className="text-sm font-bold">
                                You have used <span className="font-black underline underline-offset-2">{status.analyses_used}</span> of <span className="font-black">{isFree ? '5' : '50'}</span> analyses this month.
                                {status.analyses_remaining >= 0 && (
                                    <span className="ml-2 opacity-60">({status.analyses_remaining} remaining)</span>
                                )}
                            </p>
                        </div>
                    </div>

                    {showUpgradeCTA && (
                        <button 
                            onClick={onUpgradeClick}
                            className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/10 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                        >
                            <Sparkles className="w-3 h-3" />
                            Unlock Unlimited Audits
                        </button>
                    )}
                    
                    {isWarning && !showUpgradeCTA && (
                        <button 
                            onClick={onUpgradeClick}
                            className="px-6 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-600/10 hover:scale-105 active:scale-95 transition-all"
                        >
                            Upgrade Now
                        </button>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default UsageBanner;
