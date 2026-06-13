import React, { useState } from 'react';
import { Check, Sparkles, MessageCircle, Mail, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PricingPageProps {
    currentTier?: string;
    onClose?: () => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ currentTier = "free", onClose }) => {
    const [showContactModal, setShowContactModal] = useState(false);

    const plans = [
        {
            name: "Free",
            price: "0",
            tier: "free",
            description: "Perfect for testing the waters",
            features: [
                "5 audits per month",
                "Visual analysis",
                "Copy audit",
                "Single ad upload",
                "Standard speed"
            ],
            color: "slate"
        },
        {
            name: "Pro",
            price: "19",
            tier: "pro",
            description: "For active advertisers",
            features: [
                "50 audits per month",
                "Bulk upload (5 ads)",
                "PDF exports",
                "Brand profiles",
                "Priority support"
            ],
            color: "blue",
            popular: true
        },
        {
            name: "Agency",
            price: "49",
            tier: "agency",
            description: "Scale your creative operations",
            features: [
                "Unlimited audits",
                "Bulk upload (20 ads)",
                "White-label exports",
                "Custom brand voice",
                "Early access features"
            ],
            color: "slate"
        }
    ];

    return (
        <div className="space-y-12 py-12">
            <div className="text-center space-y-4">
                <h2 className="text-4xl font-black tracking-tight text-slate-900 uppercase italic">Elevate your creative output</h2>
                <p className="text-slate-500 font-semibold max-w-2xl mx-auto">Choose the plan that fits your growth. Audit faster, score higher, and convert better.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
                {plans.map((plan) => (
                    <motion.div 
                        key={plan.tier}
                        whileHover={{ y: -5 }}
                        className={`relative rounded-3xl p-8 border-2 flex flex-col ${
                            plan.popular ? 'border-blue-500 shadow-xl shadow-blue-500/10' : 'border-slate-100 shadow-sm'
                        } bg-white`}
                    >
                        {plan.popular && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                                Most Popular
                            </div>
                        )}

                        {currentTier === plan.tier && (
                            <div className="absolute top-4 right-4 px-2 py-1 bg-slate-100 text-slate-900 text-[8px] font-black uppercase tracking-widest rounded-md border border-slate-200">
                                Current Plan
                            </div>
                        )}

                        <div className="mb-8">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2">{plan.name}</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black">${plan.price}</span>
                                <span className="text-slate-400 font-bold uppercase text-[10px]">/month</span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium mt-4">{plan.description}</p>
                        </div>

                        <ul className="space-y-4 mb-10 flex-1">
                            {plan.features.map((feature, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center ${plan.popular ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                        <Check className="w-3 h-3" />
                                    </div>
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <button 
                            onClick={() => plan.tier !== currentTier && setShowContactModal(true)}
                            disabled={plan.tier === currentTier}
                            className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                plan.tier === currentTier
                                ? 'bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-100'
                                : plan.popular
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:scale-105'
                                : 'bg-slate-900 text-white hover:scale-105 shadow-xl shadow-slate-900/10'
                            }`}
                        >
                            {plan.tier === currentTier ? 'Active' : `Upgrade to ${plan.name}`}
                        </button>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {showContactModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-8"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-[40px] p-12 max-w-xl w-full relative shadow-2xl overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8">
                                <button onClick={() => setShowContactModal(false)} className="p-2 hover:bg-slate-100 rounded-2xl transition-colors">
                                    <X className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>

                            <div className="space-y-8">
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center">
                                    <Sparkles className="w-8 h-8" />
                                </div>
                                
                                <div className="space-y-4">
                                    <h2 className="text-4xl font-black tracking-tight leading-none uppercase italic">Let's get you set up</h2>
                                    <p className="text-slate-500 font-semibold">
                                        We are currently refining our automated payment system. To upgrade your account immediately, 
                                        reach out to our partnership team.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <a 
                                        href="https://wa.me/your-number" 
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-4 p-6 bg-emerald-50 text-emerald-900 rounded-3xl border border-emerald-100 hover:scale-105 active:scale-95 transition-all"
                                    >
                                        <MessageCircle className="w-6 h-6 text-emerald-600" />
                                        <div className="text-left">
                                            <p className="text-[10px] font-black uppercase text-emerald-600 opacity-60">WhatsApp</p>
                                            <p className="font-black">Instant Chat</p>
                                        </div>
                                    </a>
                                    <a 
                                        href="mailto:partners@advantageai.com" 
                                        className="flex items-center gap-4 p-6 bg-blue-50 text-blue-900 rounded-3xl border border-blue-100 hover:scale-105 active:scale-95 transition-all"
                                    >
                                        <Mail className="w-6 h-6 text-blue-600" />
                                        <div className="text-left">
                                            <p className="text-[10px] font-black uppercase text-blue-600 opacity-60">Email</p>
                                            <p className="font-black">Partnership team</p>
                                        </div>
                                    </a>
                                </div>

                                <button 
                                    onClick={() => setShowContactModal(false)}
                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs"
                                >
                                    Maybe Later
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PricingPage;
