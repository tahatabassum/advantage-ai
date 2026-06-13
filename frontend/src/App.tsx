import React, { useState, useEffect, useRef } from 'react';
import { analyzeAd, analyzeBulk, checkHealth, rewriteAdText, getMe, resetUsers } from './services/api';
import { FullAnalysisResponse } from './types/advantage';
import { BrainCircuit, Loader2, Sparkles, RefreshCw, ChevronLeft, LogOut, User, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Components
import UploadPanel from './components/UploadPanel';
import ScoreDashboard from './components/ScoreDashboard';
import FeedbackPanel from './components/FeedbackPanel';
import CopyVariants from './components/CopyVariants';
import ABVariants from './components/ABVariants';
import PDFDownload from './components/PDFDownload';
import UserDashboard from './components/UserDashboard';
import AdComparison from './components/AdComparison';
import BrandCenter from './components/BrandCenter';
import RewritePanel from './components/RewritePanel';
import VideoAnalyzePage from './VideoAnalyzePage';
import { AuthPage } from './components/auth/AuthPage';

import HeroVisual from './components/HeroVisual';

import UsageBanner from './UsageBanner';
import PricingPage from './PricingPage';

const loadingSteps = [
    "Scanning visual elements...",
    "Analyzing copy strength...",
    "Mapping psychology triggers...",
    "Calculating platform fit...",
    "Generating recommendations..."
];

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('access_token'));
    const [user, setUser] = useState<any>(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
    const [view, setView] = useState<'home' | 'video' | 'dashboard' | 'comparison' | 'brand' | 'pricing'>('home');
    const [analysis, setAnalysis] = useState<FullAnalysisResponse | null>(null);
    const [lastCaption, setLastCaption] = useState<string>('');
    const [comparisonAds, setComparisonAds] = useState<FullAnalysisResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [health, setHealth] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [rewriting, setRewriting] = useState(false);
    const [rewriteData, setRewriteData] = useState<{ rewritten_text: string, explanation: string } | null>(null);
    const [videoInitialResult, setVideoInitialResult] = useState<any>(null);
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const resultsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkUser = async () => {
            const token = localStorage.getItem('access_token');
            if (token) {
                try {
                    const userData = await getMe();
                    setUser(userData);
                    setIsAuthenticated(true);
                } catch (err) {
                    console.error("Session expired", err);
                    localStorage.removeItem('access_token');
                    setIsAuthenticated(false);
                    setUser(null);
                }
            }
            setIsCheckingAuth(false);
        };
        checkUser();
    }, []);

    useEffect(() => {
        let timer: any;
        if (loading) {
            timer = setInterval(() => {
                setLoadingStep(s => (s + 1) % loadingSteps.length);
            }, 1500);
        } else {
            setLoadingStep(0);
        }
        return () => clearInterval(timer);
    }, [loading]);

    useEffect(() => {
        if (!isAuthenticated) return;
        const interval = setInterval(() => {
            checkHealth().then(setHealth).catch(() => setHealth(null));
        }, 10000);
        checkHealth().then(setHealth).catch(console.error);
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    const handleAuthSuccess = (token: string, userData: any) => {
        localStorage.setItem('access_token', token);
        setUser(userData);
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        setIsAuthenticated(false);
        setUser(null);
        setView('home');
        setAnalysis(null);
    };

    const handleResetUsers = async () => {
        if (!window.confirm("RESET ALL USERS? This will delete everyone!")) return;
        try {
            await resetUsers((import.meta as any).env.VITE_ADMIN_SECRET);
            alert("All users deleted. Please log out or refresh.");
            handleLogout();
        } catch (err) {
            console.error(err);
            alert("Failed to reset users.");
        }
    };

    const handleAnalyze = async (images: File[], captions: string[], platform: string, objective: string) => {
        setLoading(true);
        setError(null);
        setLastCaption(captions[0] || '');
        setRewriteData(null);
        try {
            if (images.length > 1) {
                const results = await analyzeBulk(images, captions, platform, objective);
                setAnalysis(results[0]); 
                setComparisonAds(results);
                setView('comparison');
            } else {
                const result = await analyzeAd(images[0], captions[0], platform, objective);
                setAnalysis(result);
                setTimeout(() => {
                    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        } catch (err: any) {
            console.error(err);
            const detail = err.response?.data?.detail || err.message;
            if (err.response?.status === 401) {
                handleLogout();
                return;
            }
            if (err.response?.status === 429) {
                setError("Analysis limit reached. Please upgrade your plan to continue auditing.");
                setView('pricing');
                return;
            }
            setError(`Analysis failed: ${detail}. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    const handleRewrite = async () => {
        if (!analysis || !lastCaption) return;
        
        setRewriting(true);
        try {
            const allFeedback = [
                ...analysis.feedback_checklist.high_priority,
                ...analysis.feedback_checklist.medium_priority,
                ...analysis.feedback_checklist.low_priority
            ];
            const result = await rewriteAdText(lastCaption, allFeedback);
            setRewriteData(result);
            setTimeout(() => {
                document.getElementById('rewrite-panel')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } catch (err: any) {
            console.error(err);
            const detail = err.response?.data?.detail || err.message;
            setError(`Rewrite failed: ${detail}. Please try again.`);
        } finally {
            setRewriting(false);
        }
    };

    const handleReset = () => {
        setAnalysis(null);
        setError(null);
        setComparisonAds([]);
        setView('home');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAddToComparison = (ad: FullAnalysisResponse) => {
        setComparisonAds(prev => {
            const exists = prev.find(a => 
                a.scoring.overall_score === ad.scoring.overall_score && 
                a.hook_analysis.hook_text === ad.hook_analysis.hook_text
            );
            if (exists) return prev;
            return [...prev, ad];
        });
    };

    const handleSelectPastAnalysis = (pastAnalysis: any) => {
    const isVideo = pastAnalysis?.advantage_ai_analysis?.type === 'video' 
                    || !!pastAnalysis?.video_analysis;
    
    if (isVideo) {
        setVideoInitialResult(pastAnalysis);
        setView('video');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        setAnalysis(pastAnalysis);
        setView('home');
        setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
};

    if (isCheckingAuth) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <AuthPage onSuccess={handleAuthSuccess} />;
    }

    return (
        <div className="min-h-screen w-full flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* Header */}
    <header className="h-16 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-[100]">

    {/* Logo */}
    <div className="flex items-center gap-3 group cursor-pointer" onClick={() => { handleReset(); setMobileMenuOpen(false); }}>
        <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xl transition-transform group-hover:scale-105 active:scale-95 shadow-lg shadow-slate-900/10">
            A
        </div>
        <div>
            <h1 className="font-black text-lg tracking-tight leading-none">AdVantage AI</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mt-1">Senior Marketing Auditor</p>
        </div>
    </div>

    {/* Desktop Nav */}
    <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
        <button onClick={() => { setView('home'); setAnalysis(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'home' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
            Analyze
        </button>
        <button onClick={() => { setView('video'); setAnalysis(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`px-6 py-2 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'video' ? 'bg-white text-slate-900 shadow-sm' : 'text-emerald-500/60 hover:text-emerald-500'}`}>
            Video
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
        </button>
        <button onClick={() => { setView('brand'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'brand' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
            Brand
        </button>
        <button onClick={() => { setView('dashboard'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'dashboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
            History
        </button>
        <button onClick={() => { setView('pricing'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'pricing' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
            Pricing
        </button>
        {comparisonAds.length >= 2 && (
            <button onClick={() => { setView('comparison'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'comparison' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                Compare ({comparisonAds.length})
            </button>
        )}
    </nav>

    {/* Right Side */}
    <div className="flex items-center gap-3">
        {/* User/Logout */}
        <div className="flex items-center gap-2 group cursor-pointer" onClick={handleLogout}>
            <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] font-black uppercase text-slate-900 line-clamp-1 max-w-[120px]">{user?.email}</span>
                <span className="text-[9px] font-bold text-blue-500 uppercase flex items-center gap-1">
                    <LogOut className="w-2 h-2" />
                    Logout
                </span>
            </div>
            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-rose-50 group-hover:text-rose-500 transition-colors">
                <User className="w-4 h-4" />
            </div>
        </div>

        {/* Hamburger - mobile only */}
        <button
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
            onClick={() => setMobileMenuOpen(prev => !prev)}
        >
            {mobileMenuOpen ? <X className="w-5 h-5 text-slate-700" /> : <Menu className="w-5 h-5 text-slate-700" />}
        </button>
    </div>

    {/* Mobile Dropdown */}
    <AnimatePresence>
        {mobileMenuOpen && (
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="absolute top-16 left-0 right-0 bg-white border-b border-slate-200 shadow-xl z-[99] md:hidden px-4 py-4 flex flex-col gap-2"
            >
                <div className="px-4 py-2 mb-1 border-b border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 truncate">{user?.email}</p>
                </div>

                {[
                    { label: 'Analyze', viewKey: 'home' },
                    { label: 'Video', viewKey: 'video' },
                    { label: 'Brand', viewKey: 'brand' },
                    { label: 'History', viewKey: 'dashboard' },
                    { label: 'Pricing', viewKey: 'pricing' },
                    ...(comparisonAds.length >= 2 ? [{ label: `Compare (${comparisonAds.length})`, viewKey: 'comparison' }] : []),
                ].map(({ label, viewKey }) => (
                    <button
                        key={viewKey}
                        onClick={() => {
                            if (viewKey === 'home') { setView('home'); setAnalysis(null); }
                            else setView(viewKey as any);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                            view === viewKey ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                    >
                        {label}
                    </button>
                ))}

                <button
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="w-full text-left px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 transition-all mt-1 border-t border-slate-100 flex items-center gap-2"
                >
                    <LogOut className="w-3.5 h-3.5" />
                    Logout
                </button>
            </motion.div>
        )}
    </AnimatePresence>

</header>

            <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 space-y-12">
                {isAuthenticated && view !== 'pricing' && (
                    <UsageBanner onUpgradeClick={() => setView('pricing')} />
                )}
                {view === 'home' ? (
                    <>
                        {/* Hero Section */}
                        <section className="relative min-h-[calc(100vh-64px)] grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-12 md:py-20 overflow-hidden">
                            <div className="space-y-8 relative z-10">
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 shadow-sm"
                                >
                                    <Sparkles className="w-3 h-3" />
                                    AI Powered Ad Audit
                                </motion.div>
                                <motion.h1 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-6xl md:text-8xl font-black tracking-tighter text-slate-900 leading-[0.85]"
                                >
                                    Stop guessing. <span className="text-blue-600 font-black italic">Start auditing.</span>
                                </motion.h1>
                                <motion.p 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-xl md:text-2xl text-slate-500 font-semibold leading-tight max-w-2xl"
                                >
                                    The first real-time AI creative auditor that analyzes your ads like a senior agency director. 
                                    Get scores on visual hierarchy, psychology, and platform fit in seconds.
                                </motion.p>
        
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="flex items-center gap-6"
                                >
                                     <button 
                                        onClick={() => document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' })}
                                        className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all"
                                     >
                                        Get Started
                                     </button>
                                     <div className="flex items-center gap-3">
                                        <div className="flex -space-x-3">
                                            {[1,2,3].map(i => (
                                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" />
                                            ))}
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Join 500+ agencies</span>
                                     </div>
                                </motion.div>
                            </div>
        
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5, duration: 0.8 }}
                                className="hidden lg:block relative"
                            >
                                <HeroVisual />
                            </motion.div>
                        </section>
        
                        {/* Upload Section */}
                        <section id="upload" className="max-w-5xl mx-auto py-20">
                            <UploadPanel onAnalyze={handleAnalyze} isLoading={loading} />
                        </section>

                        <AnimatePresence>
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="max-w-5xl mx-auto p-6 bg-rose-50 border border-rose-200 rounded-3xl flex items-center gap-4 text-rose-800"
                                >
                                    <BrainCircuit className="w-8 h-8 text-rose-500" />
                                    <div>
                                        <h3 className="font-black text-sm uppercase tracking-wide">Analysis Engine Error</h3>
                                        <p className="text-sm font-medium opacity-80">{error}</p>
                                    </div>
                                    <button 
                                        onClick={handleReset}
                                        className="ml-auto p-2 hover:bg-rose-100 rounded-xl transition-colors"
                                    >
                                        <RefreshCw className="w-5 h-5" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Results Section */}
                        <AnimatePresence>
                            {analysis && !loading && (
                                <motion.div 
                                    ref={resultsRef}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-12 pb-32"
                                >
                                    <div className="flex items-center justify-between border-t border-slate-200 pt-12">
                                        <h2 className="text-3xl font-black tracking-tight">Audit Insights</h2>
                                        <button 
                                            onClick={handleReset}
                                            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            New Audit
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                                        <div className="xl:col-span-2 space-y-12">
                                            <ScoreDashboard 
                                                scoring={analysis.scoring}
                                                visual={analysis.visual_analysis}
                                                copy={analysis.copy_analysis}
                                                psychology={analysis.psychology_triggers}
                                            />
                                            <FeedbackPanel 
                                                feedback={analysis.feedback_checklist} 
                                                onRewriteRequested={handleRewrite}
                                                isRewriting={rewriting}
                                            />
                                            
                                            <AnimatePresence>
                                                {rewriteData && (
                                                    <div id="rewrite-panel">
                                                        <RewritePanel 
                                                            originalText={lastCaption}
                                                            rewrittenText={rewriteData.rewritten_text}
                                                            explanation={rewriteData.explanation}
                                                            onClose={() => setRewriteData(null)}
                                                        />
                                                    </div>
                                                )}
                                            </AnimatePresence>

                                            <CopyVariants variants={analysis.copy_variants} />
                                            <ABVariants variants={analysis.ab_variants} />
                                        </div>
                                        
                                        <div className="space-y-8 sticky top-24 h-fit">
                                            <PDFDownload analysis={analysis} />
                                            
                                            <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6 shadow-sm">
                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Audience Mismatch</h3>
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-slate-50 flex items-center justify-center rounded-xl font-black text-slate-400">18</div>
                                                        <div className="space-y-0.5">
                                                            <p className="text-[10px] font-black uppercase text-slate-400 leading-none">Inferred Age</p>
                                                            <p className="text-sm font-black leading-none">{analysis.audience.inferred_age_range}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-slate-50 flex items-center justify-center rounded-xl font-black text-slate-400">$</div>
                                                        <div className="space-y-0.5">
                                                            <p className="text-[10px] font-black uppercase text-slate-400 leading-none">Income Bracket</p>
                                                            <p className="text-sm font-black leading-none">{analysis.audience.income_bracket}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="pt-4 border-t border-slate-100">
                                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-3">Mismatch Warnings</p>
                                                    <div className="space-y-2">
                                                        {analysis.audience.mismatch_warnings.map((w, i) => (
                                                            <div key={i} className="text-xs font-bold text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100">
                                                                {w}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl shadow-slate-900/10">
                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Platform Heatmap</h3>
                                                <div className="space-y-4">
                                                    {Object.entries(analysis.platform_fit_scores).map(([k, v]) => (
                                                        <div key={k} className="space-y-1.5">
                                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                                <span>{k.replace('_', ' ')}</span>
                                                                <span className="text-white">{v}%</span>
                                                            </div>
                                                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                                                <motion.div 
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${v}%` }}
                                                                    className="h-full bg-blue-500"
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
               ) : view === 'video' ? (
    <section className="py-12">
        <VideoAnalyzePage 
           key={videoInitialResult ? JSON.stringify(videoInitialResult.scoring) : 'new'}
           initialResult={videoInitialResult}
           onAnalyzeStart={() => {
             setVideoInitialResult(null);
             setLoading(true);
             setLoadingStep(0);
           }}
           onAnalyzeEnd={() => setLoading(false)}
        />
    </section>
                ) : view === 'dashboard' ? (
                    <section className="py-12 space-y-12">
                        <div className="space-y-2">
                            <h2 className="text-4xl font-black tracking-tight text-slate-900">Personal Dashboard</h2>
                            <p className="text-slate-500 font-semibold">Track historical performance across all audited creatives.</p>
                        </div>
                        <UserDashboard 
                            onSelectAnalysis={handleSelectPastAnalysis}
                            onAddToComparison={handleAddToComparison}
                            comparisonCount={comparisonAds.length}
                        />
                    </section>
                ) : view === 'brand' ? (
                    <section className="py-12 space-y-12">
                        <div className="space-y-2">
                             <h2 className="text-4xl font-black tracking-tight text-slate-900">Brand Identity</h2>
                             <p className="text-slate-500 font-semibold">Define your unique market position and creative boundaries.</p>
                        </div>
                        <BrandCenter />
                    </section>
                ) : view === 'pricing' ? (
                    <section className="py-12">
                        <PricingPage currentTier={user?.subscription_tier} />
                    </section>
                ) : (
                    <section className="py-12">
                        <AdComparison 
                            ads={comparisonAds} 
                            onBack={() => setView('dashboard')}
                        />
                    </section>
                )}

                {/* Loading State Overlay */}
                <AnimatePresence>
                    {loading && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
                        >
                            <div className="relative w-24 h-24 mb-8">
                                <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
                                <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <BrainCircuit className="w-8 h-8 text-blue-500" />
                                </div>
                            </div>
                            
                            <h2 className="text-2xl font-black text-white mb-2 leading-none uppercase tracking-tighter">Analyzing your ad creative...</h2>
                            <AnimatePresence mode="wait">
                                <motion.p 
                                    key={loadingStep}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-blue-400 font-bold tracking-widest text-[10px] uppercase h-4"
                                >
                                    {loadingSteps[loadingStep]}
                                </motion.p>
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
            
            {/* Footer */}
            <footer className="w-full bg-slate-950 text-white pt-20 pb-8 border-t border-blue-500/20">
                <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                    <div className="col-span-1 md:col-span-2 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20">A</div>
                            <span className="font-black text-2xl tracking-tighter">AdVantage AI</span>
                        </div>
                        <p className="text-slate-400 font-medium leading-relaxed max-w-sm">
                            Get a senior marketer's audit of your ad in 30 seconds. Powered by Advanced Vision models trained on 10,000+ top-performing creative assets.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500">Features</h3>
                        <ul className="space-y-4 text-sm font-bold text-slate-400">
                            <li className="hover:text-white transition-colors cursor-pointer">Visual Analysis</li>
                            <li className="hover:text-white transition-colors cursor-pointer">Copy Strength</li>
                            <li className="hover:text-white transition-colors cursor-pointer">Hook Scoring</li>
                            <li className="hover:text-white transition-colors cursor-pointer">Psychology Triggers</li>
                            <li className="hover:text-white transition-colors cursor-pointer">Platform Fit</li>
                            <li className="hover:text-white transition-colors cursor-pointer">PDF Export</li>
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500">Platforms</h3>
                        <ul className="space-y-4 text-sm font-bold text-slate-400">
                            <li className="hover:text-white transition-colors cursor-pointer">Meta Ads</li>
                            <li className="hover:text-white transition-colors cursor-pointer">TikTok Ads</li>
                            <li className="hover:text-white transition-colors cursor-pointer">Google Ads</li>
                            <li className="hover:text-white transition-colors cursor-pointer">YouTube Pre-roll</li>
                            <li className="hover:text-white transition-colors cursor-pointer">LinkedIn</li>
                        </ul>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-8 pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            © 2026 AdVantage AI. All rights reserved.
                        </p>
                        <button 
                            onClick={handleResetUsers}
                            className="text-[8px] font-black uppercase text-slate-800 hover:text-rose-500 opacity-20 hover:opacity-100 transition-all ml-4"
                        >
                            Reset System Data
                        </button>
                    </div>
                    <p className="text-xs font-black text-blue-500 uppercase tracking-widest">
                       Built for elite creative auditing
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default App;
