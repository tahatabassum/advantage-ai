import React from 'react';
import { motion } from 'motion/react';
import { 
    ArrowLeftRight, 
    TrendingUp, 
    TrendingDown, 
    CheckCircle2, 
    XCircle,
    Info,
    LayoutGrid,
    Trophy
} from 'lucide-react';
import { FullAnalysisResponse } from '../types/advantage';

interface AdComparisonProps {
    ads: FullAnalysisResponse[];
    onBack: () => void;
}

const AdComparison: React.FC<AdComparisonProps> = ({ ads, onBack }) => {
    if (ads.length < 2) return null;

    const winnerIndex = ads.reduce((prevIdx, curr, currIdx) => 
        curr.scoring.overall_score > ads[prevIdx].scoring.overall_score ? currIdx : prevIdx
    , 0);

    return (
        <div className="space-y-12">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tight">Creative Battleground</h2>
                    <p className="text-slate-500 font-semibold uppercase text-[10px] tracking-widest flex items-center gap-2">
                        <ArrowLeftRight className="w-3 h-3" />
                        Comparing {ads.length} creatives side-by-side
                    </p>
                </div>
                <button 
                    onClick={onBack}
                    className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                >
                    Back to individual view
                </button>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-${Math.min(ads.length, 3)} gap-8`}>
                {ads.map((ad, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`relative p-8 rounded-[40px] border-2 transition-all ${i === winnerIndex ? 'bg-blue-50 border-blue-200 shadow-xl shadow-blue-500/10' : 'bg-white border-slate-100 shadow-sm'}`}
                    >
                        {i === winnerIndex && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                                <Trophy className="w-3 h-3" />
                                Predicted Winner
                            </div>
                        )}

                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black uppercase text-slate-400">Variant {String.fromCharCode(65 + i)}</p>
                                    <p className="text-xl font-black text-slate-900 capitalize">{ad.platform_rules.platform}</p>
                                </div>
                                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center font-black text-2xl ${i === winnerIndex ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    {ad.scoring.overall_score}%
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Performance Metrics</h4>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Visuals', val: ad.scoring.visual_quality_score },
                                        { label: 'Copy', val: ad.scoring.copy_strength_score },
                                        { label: 'Strategy', val: ad.scoring.psychology_score }
                                    ].map(stat => (
                                        <div key={stat.label} className="space-y-1">
                                            <div className="flex justify-between text-[10px] font-black uppercase">
                                                <span>{stat.label}</span>
                                                <span>{stat.val}%</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full transition-all duration-1000 ${i === winnerIndex ? 'bg-blue-500' : 'bg-slate-300'}`}
                                                    style={{ width: `${stat.val}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4 pt-6 border-t border-slate-100">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Visual Hook</h4>
                                <p className="text-sm font-bold text-slate-600 line-clamp-3">"{ad.hook_analysis.hook_text}"</p>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Strategic Pros</h4>
                                <div className="space-y-2">
                                    {ad.feedback_checklist.low_priority.slice(0, 2).map((p, j) => (
                                        <div key={j} className="flex items-start gap-2 text-xs font-bold text-emerald-600">
                                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                                            <span>{p}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* In-depth Contrast Table */}
            <div className="bg-slate-900 rounded-[40px] p-8 md:p-12 overflow-hidden shadow-2xl">
                <div className="flex items-center gap-4 mb-12">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
                        <LayoutGrid className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-white font-black text-xl">Direct Comparison Matrix</h3>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">Deep-dive structural differences</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Benchmark</th>
                                {ads.map((_, i) => (
                                    <th key={i} className="py-6 px-4 text-[10px] font-black uppercase tracking-widest text-white text-center">
                                        Variant {String.fromCharCode(65 + i)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="text-white divide-y divide-white/5">
                            {[
                                { label: 'Dominant Colors', key: 'visual_analysis.dominant_colors', transform: (v: any) => v.join(', ') },
                                { label: 'Tone of Voice', key: 'copy_analysis.emotional_tone' },
                                { label: 'Main Hook', key: 'hook_analysis.hook_type' },
                                { label: 'Audience Age', key: 'audience.inferred_age_range' },
                                { label: 'F.O.M.O Presence', key: 'psychology_triggers.fomo', transform: (v: any) => v ? 'YES' : 'NO' }
                            ].map(row => (
                                <tr key={row.label} className="group hover:bg-white/5 transition-colors">
                                    <td className="py-6 text-xs font-black uppercase tracking-widest text-slate-400">{row.label}</td>
                                    {ads.map((ad: any, i) => {
                                        const keys = row.key.split('.');
                                        let val = ad;
                                        keys.forEach(k => val = val?.[k]);
                                        return (
                                            <td key={i} className="py-6 px-4 text-sm font-bold text-center">
                                                {row.transform ? row.transform(val) : val}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdComparison;
