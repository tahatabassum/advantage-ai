import React from 'react';
import { motion } from 'motion/react';
import { Scoring, VisualAnalysis, CopyAnalysis, PsychologyTriggers } from '../types/advantage';
import { Target, Zap, Waves, Brain } from 'lucide-react';

interface ScoreDashboardProps {
  scoring: Scoring;
  visual: VisualAnalysis;
  copy: CopyAnalysis;
  psychology: PsychologyTriggers;
}

const ScoreDashboard: React.FC<ScoreDashboardProps> = ({ scoring, visual, copy, psychology }) => {
  if (!scoring) return null;

  const getGradeColor = (grade: string | undefined) => {
    if (!grade) return 'text-slate-500 bg-slate-50 border-slate-100';
    if (grade.startsWith('A')) return 'text-emerald-500 bg-emerald-50 border-emerald-100';
    if (grade.startsWith('B')) return 'text-blue-500 bg-blue-50 border-blue-100';
    if (grade.startsWith('C')) return 'text-amber-500 bg-amber-50 border-amber-100';
    return 'text-rose-500 bg-rose-50 border-rose-100';
  };

  const getScoreColor = (score: number | undefined) => {
    if (score === undefined) return 'text-slate-500';
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-rose-500';
  };

  const metrics = [
    { label: 'Visual Quality', score: scoring.visual_quality_score ?? 0, icon: Target, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Copy Strength', score: scoring.copy_strength_score ?? 0, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Platform Fit', score: scoring.platform_fit_score ?? 0, icon: Waves, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Psychology', score: scoring.psychology_score ?? 0, icon: Brain, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 flex flex-col justify-between shadow-sm">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marketability Score</h3>
              <div className="flex items-baseline gap-2">
                <span className={`text-6xl font-black tracking-tighter ${getScoreColor(scoring.overall_score)}`}>
                  {scoring.overall_score ?? 0}
                </span>
                <span className="text-xl font-bold text-slate-300">/ 100</span>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-xl border-2 font-black text-2xl ${getGradeColor(scoring.grade)}`}>
              {scoring.grade ?? '-'}
            </div>
          </div>
          
          <div className="mt-8">
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${scoring.overall_score ?? 0}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  (scoring.overall_score ?? 0) >= 80 ? 'bg-emerald-500' :
                  (scoring.overall_score ?? 0) >= 60 ? 'bg-blue-500' :
                  (scoring.overall_score ?? 0) >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
              />
            </div>
            <p className="mt-4 text-sm font-bold text-slate-900 leading-relaxed italic">
              "{scoring.verdict ?? 'No verdict available.'}"
            </p>
          </div>
        </div>

        <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col justify-center gap-6 shadow-xl shadow-slate-900/20">
          {metrics.map((m, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${m.bg} ${m.color}`}>
                  <m.icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">{m.label}</span>
              </div>
              <span className="text-xl font-black">{m.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trigger Summary */}
      {psychology && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Psychological Triggers Detected</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(psychology).filter(([k, v]) => typeof v === 'boolean' && v === true).map(([k]) => (
              <div key={k} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-xs font-black uppercase tracking-wide border border-blue-100">
                {k.replace('_', ' ')}
              </div>
            ))}
            {Object.entries(psychology).filter(([k, v]) => typeof v === 'boolean' && v === false).map(([k]) => (
              <div key={k} className="px-4 py-2 bg-slate-50 text-slate-400 rounded-full text-xs font-black uppercase tracking-wide border border-slate-100 opacity-50">
                {k.replace('_', ' ')}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoreDashboard;
