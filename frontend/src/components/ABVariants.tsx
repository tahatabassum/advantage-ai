import React from 'react';
import { ABVariants as ABVariantsType } from '../types/advantage';
import { Split, ArrowRight, BrainCircuit } from 'lucide-react';

interface ABVariantsProps {
  variants: ABVariantsType;
}

const ABVariants: React.FC<ABVariantsProps> = ({ variants }) => {
  if (!variants) return null;
  
  const variantList = [
    { id: 'A', data: variants?.variant_a, color: 'blue' },
    { id: 'B', data: variants?.variant_b, color: 'emerald' },
    { id: 'C', data: variants?.variant_c, color: 'purple' },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-8 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2">
          <Split className="w-5 h-5 text-blue-500" />
          Recursive A/B Variants
        </h2>
        <p className="text-sm text-slate-500 font-medium mt-1">Multi-angle tests to pinpoint your highest CTR creative direction.</p>
      </div>

      <div className="p-8 space-y-12">
        {variantList.map((v) => (
          <div key={v.id} className="relative space-y-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl 
                ${v.color === 'blue' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 
                  v.color === 'emerald' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 
                  'bg-purple-600 text-white shadow-lg shadow-purple-200'}
              `}>
                {v.id}
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">{v.data?.angle ?? ''} Angle</h3>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Psychology-Driven Direction</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pl-16">
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400">Headline</span>
                  <p className="text-md font-black italic">"{v.data?.headline ?? ''}"</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400">Body</span>
                  <p className="text-sm font-medium text-slate-600 leading-relaxed">{v.data?.body ?? ''}</p>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-widest">
                  {v.data?.cta ?? ''} <ArrowRight className="w-3 h-3" />
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <BrainCircuit className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Strategy Logic</span>
                  </div>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed italic">
                    {v.data?.explanation ?? ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ABVariants;
