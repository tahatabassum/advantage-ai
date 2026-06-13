import React from 'react';
import { FeedbackChecklist } from '../types/advantage';
import { AlertCircle, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';

interface FeedbackPanelProps {
  feedback: FeedbackChecklist;
  onRewriteRequested?: () => void;
  isRewriting?: boolean;
}

const FeedbackPanel: React.FC<FeedbackPanelProps> = ({ feedback, onRewriteRequested, isRewriting }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            Audit Feedback
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Actionable steps to improve your ad performance.</p>
        </div>

        {onRewriteRequested && (
          <button
            onClick={onRewriteRequested}
            disabled={isRewriting}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            {isRewriting ? (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-pulse" />
                Rewriting...
              </span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Rewrite My Ad
              </>
            )}
          </button>
        )}
      </div>

      <div className="p-8 space-y-8">
        {/* High Priority */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-rose-600">High Priority Fixes</h3>
          </div>
          <div className="space-y-2">
            {feedback.high_priority.map((item, idx) => (
              <div key={idx} className="flex gap-3 p-4 bg-rose-50 rounded-2xl border border-rose-100 text-rose-900">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-bold leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Medium Priority */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-amber-600">Optimization Required</h3>
          </div>
          <div className="space-y-2">
            {feedback.medium_priority.map((item, idx) => (
              <div key={idx} className="flex gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-900">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-bold leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Low Priority */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-blue-600">Minor Enhancements</h3>
          </div>
          <div className="space-y-2">
            {feedback.low_priority.map((item, idx) => (
              <div key={idx} className="flex gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100 text-blue-900">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-bold leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPanel;
