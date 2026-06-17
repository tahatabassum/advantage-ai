import React, { useState, useEffect } from 'react';
import { Globe, ShieldCheck, Zap, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface UrlInputPanelProps {
  onAnalyze: (url: string, platform: string, objective: string) => void;
  isLoading: boolean;
  type: 'image' | 'video';
}

const platforms = ['Meta', 'TikTok', 'Google', 'LinkedIn', 'Web'];
const objectives = ['Conversion', 'Awareness', 'Traffic', 'Engagement', 'Lead Gen'];

const UrlInputPanel: React.FC<UrlInputPanelProps> = ({ onAnalyze, isLoading, type }) => {
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState('Meta');
  const [objective, setObjective] = useState('Conversion');
  const [isMetaLibrary, setIsMetaLibrary] = useState(false);

  useEffect(() => {
    const detect = () => {
      const lowUrl = url.toLowerCase();
      if (lowUrl.includes('facebook.com/ads/library') || lowUrl.includes('fb.com/ads/library')) {
        setIsMetaLibrary(true);
        setPlatform('Meta');
      } else {
        setIsMetaLibrary(false);
        if (lowUrl.includes('facebook.com') || lowUrl.includes('fb.com') || lowUrl.includes('instagram.com')) {
          setPlatform('Meta');
        } else if (lowUrl.includes('tiktok.com')) {
          setPlatform('TikTok');
        } else if (lowUrl.includes('google.com') || lowUrl.includes('youtube.com') || lowUrl.includes('youtu.be')) {
          setPlatform('Google');
        } else if (lowUrl.includes('linkedin.com')) {
          setPlatform('LinkedIn');
        } else if (url.trim() !== '') {
          setPlatform('Web');
        }
      }
    };
    detect();
  }, [url]);

  const handleSubmit = () => {
    if (url.trim()) {
      onAnalyze(url, platform, objective);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
          Paste Ad URL
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Globe className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={type === 'video' ? "https://www.tiktok.com/@user/video/..." : "https://www.facebook.com/ads/library/..."}
            className="w-full pl-11 pr-4 py-4 bg-slate-900 text-white border border-slate-800 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/50 shadow-inner group-hover:border-slate-700 transition-all"
          />
          {isMetaLibrary && (
             <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[9px] font-black uppercase tracking-tighter text-blue-500 animate-pulse">
                  <ShieldCheck className="w-3 h-3" />
                  Meta Ads Library Detected
                </span>
             </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Detected Platform</label>
          <div className="relative">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 text-white border border-slate-800 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer"
            >
              {platforms.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
               <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Campaign Objective</label>
          <select
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            className="w-full px-4 py-3 bg-slate-900 text-white border border-slate-800 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer"
          >
            {objectives.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading || !url.trim()}
        className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3 active:scale-[0.98]"
      >
        {isLoading ? (
          <>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
              <Zap className="w-4 h-4" />
            </motion.div>
            Brewing URL Scan...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            Analyze {type === 'video' ? 'Video' : 'Ad'} URL
          </>
        )}
      </button>
    </div>
  );
};

export default UrlInputPanel;
