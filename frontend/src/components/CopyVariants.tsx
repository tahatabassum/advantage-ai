import React from 'react';
import { CopyVariants as CopyVariantsType } from '../types/advantage';
import { Copy, Sparkles, Hash } from 'lucide-react';

interface CopyVariantsProps {
  variants: CopyVariantsType;
}

const CopyVariants: React.FC<CopyVariantsProps> = ({ variants }) => {
  if (!variants) return null;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-8 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          AI Copy Extensions
        </h2>
        <p className="text-sm text-slate-500 font-medium mt-1">Variations and hooks generated for your campaign.</p>
      </div>

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Direct Response Angle</h3>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-medium leading-relaxed italic border-l-4 border-l-blue-500">
              {variants?.direct_response ?? ''}
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Storytelling Angle</h3>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-medium leading-relaxed italic border-l-4 border-l-purple-500">
              {variants?.storytelling ?? ''}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Headline Variants</h3>
            <div className="flex flex-col gap-2">
              {(variants?.headline_variants ?? []).map((h, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors group">
                  <span className="text-sm font-black">{h}</span>
                  <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-900">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Optimized Hashtags</h3>
            <div className="flex flex-wrap gap-2">
              {(variants?.hashtags ?? []).map((h, i) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">
                  <Hash className="w-3 h-3" />
                  {h.startsWith('#') ? h.slice(1) : h}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CopyVariants;
