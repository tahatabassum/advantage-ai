import React, { useEffect, useState } from 'react';
import { getHistory } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { 
    LayoutDashboard, 
    History, 
    BarChart3, 
    ChevronRight, 
    Calendar, 
    Trophy,
    Target,
    Activity,
    Search,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { FullAnalysisResponse } from '../types/advantage';

interface HistoryItem {
    id: number;
    platform: string;
    overall_score: number;
    grade: string;
    created_at: string;
    analysis: any;
}

interface UserDashboardProps {
    onSelectAnalysis: (analysis: any) => void;
    onAddToComparison: (analysis: any) => void;
    comparisonCount: number;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ onSelectAnalysis, onAddToComparison, comparisonCount }) => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const data = await getHistory();
            if (Array.isArray(data)) {
                setHistory(data);
            } else {
                console.error("History data is not an array:", data);
                setHistory([]);
                setError("History data format is invalid.");
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load history.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const filteredHistory = history.filter(item => 
        item.platform.toLowerCase().includes(search.toLowerCase()) ||
        item.grade.toLowerCase().includes(search.toLowerCase())
    );

    const avgScore = history.length > 0 
        ? Math.round(history.reduce((acc, curr) => acc + curr.overall_score, 0) / history.length)
        : 0;

    const topPlatform = history.length > 0
        ? Object.entries(history.reduce((acc: any, curr) => {
            acc[curr.platform] = (acc[curr.platform] || 0) + 1;
            return acc;
          }, {})).sort((a: any, b: any) => b[1] - a[1])[0][0]
        : 'N/A';

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading your history...</p>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Audits', value: history.length, icon: History, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Avg Creative Score', value: `${avgScore}%`, icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { label: 'Top Platform', value: topPlatform, icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-50' }
                ].map((stat, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={stat.label}
                        className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6"
                    >
                        <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center ${stat.color}`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                            <p className="text-2xl font-black text-slate-900 leading-none">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* History Table/List */}
                    <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl shadow-slate-950/[0.02] overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg tracking-tight">Audit History</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Manage and revisit your past audits</p>
                                </div>
                            </div>

                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="Search by platform..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-full md:w-64"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Platform</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Score</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Grade</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    <AnimatePresence>
                                        {filteredHistory.map((item) => (
                                            <motion.tr 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                key={item.id}
                                                className="group hover:bg-slate-50/80 transition-colors"
                                            >
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-black text-[10px] text-slate-500">
                                                            {item.platform[0]}
                                                        </div>
                                                        <span className="text-sm font-black text-slate-900 capitalize">{item.platform}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <div className="inline-flex items-center justify-center w-12 h-8 bg-blue-50 text-blue-600 rounded-lg text-xs font-black">
                                                        {item.overall_score}%
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center text-sm font-black text-slate-600">
                                                    {item.grade}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(item.created_at).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right space-x-2">
                                                    <button 
                                                        onClick={() => onAddToComparison(item.analysis)}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105"
                                                    >
                                                        Compare
                                                    </button>
                                                    <button 
                                                        onClick={() => onSelectAnalysis(item.analysis)}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                    >
                                                        View
                                                        <ChevronRight className="w-3 h-3" />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                            {filteredHistory.length === 0 && (
                                <div className="py-20 text-center space-y-4">
                                    <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto text-slate-300">
                                        <History className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No audits found</p>
                                        <p className="text-xs font-bold text-slate-400">Start by uploading your first ad creative.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <button 
                            onClick={fetchHistory}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors"
                        >
                            <RefreshCw className="w-3 h-3" />
                            Refresh Stats
                        </button>
                    </div>
        </div>
    );
};

export default UserDashboard;
