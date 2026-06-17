import React from 'react';
import { FeedbackChecklist } from '../types/advantage';
import { AlertCircle, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';

interface FeedbackPanelProps {
  feedback: FeedbackChecklist;
  onRewriteRequested?: () => void;
  isRewriting?: boolean;
}

const FeedbackPanel: React.FC<FeedbackPanelProps> = ({ feedback, onRewriteRequested, isRewriting }) => {
  if (!feedback) return null;

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
        {feedback.high_priority && feedback.high_priority.length > 0 && (
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
        )}

        {/* Medium Priority */}
        {feedback.medium_priority && feedback.medium_priority.length > 0 && (
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
        )}

        {/* Low Priority */}
        {feedback.low_priority && feedback.low_priority.length > 0 && (
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
        )}
        
        {(!feedback.high_priority || feedback.high_priority.length === 0) &&
         (!feedback.medium_priority || feedback.medium_priority.length === 0) &&
         (!feedback.low_priority || feedback.low_priority.length === 0) && (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-900 font-black">No issues detected!</p>
              <p className="text-slate-500 text-xs">Your ad creative is performing exceptionally well according to our neural audit.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackPanel;
