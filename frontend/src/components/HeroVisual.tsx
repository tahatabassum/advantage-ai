import React from 'react';
import { motion } from 'motion/react';
import { Target, Zap, Waves, Brain, Sparkles } from 'lucide-react';

const FloatingCard = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
  <motion.div
    initial={{ y: 0 }}
    animate={{ y: [-10, 10, -10] }}
    transition={{
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut",
      delay
    }}
    className={`bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-2xl backdrop-blur-md bg-opacity-90 ${className}`}
  >
    {children}
  </motion.div>
);

const HeroVisual: React.FC = () => {
  return (
    <div className="relative w-full h-[500px] flex items-center justify-center">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-600/20 blur-[100px] rounded-full" />
      
      {/* Grid of floating metrics */}
      <div className="relative z-10 w-full max-w-md grid grid-cols-2 gap-4 translate-x-4">
        <FloatingCard delay={0}>
          <div className="space-y-3">
             <div className="flex items-center gap-2 text-blue-400">
                <Target className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Visual Score</span>
             </div>
             <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-white">92</span>
                <span className="text-xs font-bold text-slate-500 mb-1">/ 100</span>
             </div>
             <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "92%" }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-blue-500" 
                />
             </div>
          </div>
        </FloatingCard>

        <FloatingCard delay={1.5} className="mt-8">
          <div className="space-y-3">
             <div className="flex items-center gap-2 text-amber-400">
                <Zap className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Hook Strength</span>
             </div>
             <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-white">89</span>
                <span className="text-xs font-bold text-slate-500 mb-1">/ 100</span>
             </div>
             <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "89%" }}
                  transition={{ duration: 1, delay: 0.8 }}
                  className="h-full bg-amber-500" 
                />
             </div>
          </div>
        </FloatingCard>

        <FloatingCard delay={0.8}>
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                 <Brain className="w-4 h-4" />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-none mb-1">Psychology</p>
                 <p className="text-xs font-bold text-white leading-none">FOMO Detected</p>
              </div>
           </div>
        </FloatingCard>

        <FloatingCard delay={2.2} className="mt-4">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                 <Waves className="w-4 h-4" />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-none mb-1">Platform Fit</p>
                 <p className="text-xs font-bold text-white leading-none">Meta 88/100</p>
              </div>
           </div>
        </FloatingCard>

        <div className="col-span-2 mt-4">
           <FloatingCard delay={1.2}>
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white">AI Real-time Audit Live</span>
                 </div>
                 <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse delay-75" />
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse delay-150" />
                 </div>
              </div>
           </FloatingCard>
        </div>
      </div>
    </div>
  );
};

export default HeroVisual;
