import React, { useState } from 'react';
import { Sparkles, Copy, Check, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RewritePanelProps {
  originalText: string;
  rewrittenText: string;
  explanation: string;
  onClose: () => void;
}

const RewritePanel: React.FC<RewritePanelProps> = ({ originalText, rewrittenText, explanation, onClose }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(rewrittenText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-[40px] border border-slate-200 shadow-2xl overflow-hidden"
    >
      <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 leading-tight">AI Copy Rewrite</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Optimized for Conversion</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
        >
          <span className="text-2xl leading-none">&times;</span>
        </button>
      </div>

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Original */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Original Copy</span>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-slate-600 text-sm leading-relaxed min-h-[160px]">
              {originalText}
            </div>
          </div>

          {/* Rewritten */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">AI Rewritten</span>
              <button 
                onClick={copyToClipboard}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  copied ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy Text
                  </>
                )}
              </button>
            </div>
            <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 text-slate-900 text-sm font-bold leading-relaxed min-h-[160px] relative">
              {rewrittenText}
            </div>
          </div>
        </div>

        {/* AI Reasoning */}
        <div className="p-6 bg-slate-900 rounded-3xl text-white">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
              <Info className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">AI Reasoning</p>
              <p className="text-sm font-medium text-slate-300 leading-relaxed italic">
                "{explanation}"
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RewritePanel;
