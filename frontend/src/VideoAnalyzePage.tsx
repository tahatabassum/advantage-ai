import React, { useState } from 'react';
import { Video, Upload, Link as LinkIcon, Loader2, Play, AlertCircle, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeVideoAd, analyzeByUrl } from './services/api';
import ScoreDashboard from './components/ScoreDashboard';
import FeedbackPanel from './components/FeedbackPanel';
import UsageBanner from './UsageBanner';

interface VideoAnalyzePageProps {
  onBack?: () => void;
  initialResult?: any;
  onAnalyzeStart?: () => void;
  onAnalyzeEnd?: () => void;
}

const VideoAnalyzePage: React.FC<VideoAnalyzePageProps> = ({ 
  onBack, 
  initialResult,
  onAnalyzeStart,
  onAnalyzeEnd
}) => {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(initialResult || null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    onAnalyzeStart?.();
    try {
      if (mode === 'upload' && file) {
        const result = await analyzeVideoAd(file, "", "Meta", "Conversion");
        setAnalysis(result);
      } else if (mode === 'url' && url) {
        // Video URL analysis
        const result = await analyzeByUrl(url, 'video_url', 'Meta', 'Conversion');
        setAnalysis(result);
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || err.message || "Video analysis failed.";
      setError(msg);
    } finally {
      setIsLoading(false);
      onAnalyzeEnd?.();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <UsageBanner />
      
      <div className="flex items-center gap-4 mb-8">
        {onBack && (
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
          >
            <X className="w-6 h-6" />
          </button>
        )}
        <h1 className="text-3xl font-black font-sans text-slate-900 tracking-tight">Video Ad Audit</h1>
      </div>

      {!analysis ? (
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                <Video className="w-5 h-5 text-indigo-600" />
                Video Audit Engine
              </h2>
              <p className="text-sm text-slate-500 font-medium mt-1">Upload mp4/mov or paste a direct video link for a neural audit.</p>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setMode('upload')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload File
              </button>
              <button
                onClick={() => setMode('url')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'url' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                Paste URL
              </button>
            </div>
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
              {mode === 'upload' ? (
                <motion.div 
                  key="upload"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div 
                    className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center hover:border-indigo-400 hover:bg-slate-50 transition-all cursor-pointer group"
                    onClick={() => document.getElementById('video-upload')?.click()}
                  >
                    <input 
                      type="file" 
                      id="video-upload" 
                      className="hidden" 
                      accept="video/*"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Video className="w-8 h-8 text-indigo-600" />
                    </div>
                    {file ? (
                      <div className="space-y-2">
                        <p className="text-slate-900 font-black">{file.name}</p>
                        <p className="text-indigo-600 text-[10px] font-black uppercase tracking-widest">Click to change file</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-black text-slate-900">Drop your video here</p>
                        <p className="text-slate-500 text-xs mt-1">MP4, MOV supported (Max 50MB)</p>
                      </>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="url"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Direct Video or Meta Ads URL</label>
                    <input 
                      type="text"
                      placeholder="Paste link (Dropbox, S3, Meta Ads Library)..."
                      className="w-full px-5 py-4 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                  </div>
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-indigo-900">AI Processing Notice</p>
                      <p className="text-[10px] text-indigo-700 leading-relaxed mt-0.5">
                        Our engine will automatically crawl the link and extract the creative for neural analysis. This may take up to 45 seconds for complex pages like Meta Ads Library.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <div className="mt-6 p-4 bg-rose-50 text-rose-600 rounded-2xl flex items-center gap-3 border border-rose-100">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-bold">Audit Error</p>
                  <p className="text-[10px] opacity-80">{error}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={isLoading || (mode === 'upload' && !file) || (mode === 'url' && !url)}
              className="w-full mt-8 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-800 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-indigo-900/10 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Extracting & Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 text-indigo-400" />
                  Initialize Neural Audit
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8 pb-20">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-8">
              <ScoreDashboard 
                scoring={analysis?.scoring} 
                visual={analysis?.visual_analysis}
                copy={analysis?.copy_analysis}
                psychology={analysis?.psychology_triggers}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FeedbackPanel feedback={analysis?.feedback_checklist} />
                
                <div className="space-y-8">
                  <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Play className="w-4 h-4" />
                      </div>
                      <h3 className="text-xl font-black tracking-tight text-slate-900">
                        Narrative Audit
                      </h3>
                    </div>
                    
                    <div className="space-y-8">
                      <div className="relative">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">AI Audio Transcript</p>
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                          <p className="text-sm font-bold text-slate-900 leading-relaxed italic">
                            "{analysis?.video_analysis?.audio_transcript || "No high-confidence speech detected."}"
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pacing</p>
                          <p className="text-lg font-black text-slate-900">{analysis.video_analysis?.pacing || "Balanced"}</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hook</p>
                          <p className="text-lg font-black text-slate-900">{analysis.video_analysis?.hook_strength || "Moderate"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Prediction Card */}
                  <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/40 transition-colors" />
                    <div className="relative z-10">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-4">Neural Performance Prediction</h4>
                      <p className="text-xl font-bold leading-tight mb-6">
                        {analysis?.scoring?.verdict ?? 'No verdict available.'}
                      </p>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          High Retention
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          Scalable
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="xl:col-span-1 space-y-8">
              {/* Media Preview Card */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm sticky top-8">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                    <Video className="w-3.5 h-3.5 text-indigo-600" />
                    Ad Creative Preview
                  </h3>
                </div>
                <div className="aspect-[9/16] bg-slate-900 flex items-center justify-center relative group overflow-hidden">
                  {/* Priority 1: Show screenshot from URL analysis (Meta Ads, etc) */}
                  {analysis?.screenshot_b64 ? (
                    <img 
                      src={`data:image/png;base64,${analysis.screenshot_b64}`}
                      alt="Ad Creative Screenshot"
                      className="w-full h-full object-contain"
                    />
                  ) : /* Priority 2: Show uploaded video file */
                  file ? (
                    <video 
                      src={URL.createObjectURL(file)} 
                      controls 
                      className="w-full h-full object-contain"
                    />
                  ) : /* Priority 3: Direct video URL (non-Meta) */
                  url && mode === 'url' && !analysis?.warning ? (
                    <video 
                      src={url} 
                      controls 
                      className="w-full h-full object-contain"
                    />
                  ) : /* Priority 4: Source URL link */
                  analysis?.source_url ? (
                    <div className="text-slate-500 flex flex-col items-center gap-4 text-center px-8">
                      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
                        <LinkIcon className="w-6 h-6 text-indigo-400" />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-widest opacity-70">Analyzed from URL</p>
                      <a 
                        href={analysis.source_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-400 hover:text-indigo-300 underline break-all transition-colors"
                      >
                        {analysis.source_url.length > 60 ? analysis.source_url.slice(0, 60) + '...' : analysis.source_url}
                      </a>
                    </div>
                  ) : (
                    <div className="text-slate-500 flex flex-col items-center gap-4 text-center px-8">
                      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
                        <Play className="w-6 h-6 text-slate-600" />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-widest italic opacity-50">Frame extraction only<br/>Video preview unavailable</p>
                    </div>
                  )}
                </div>
                <div className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Duration</p>
                      <p className="text-sm font-black text-slate-900">{analysis?.video_analysis?.duration_seconds || '0'}s</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Scenes</p>
                      <p className="text-sm font-black text-slate-900">{analysis?.video_analysis?.scene_count || 'Analyzed'}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => { setAnalysis(null); setFile(null); setUrl(''); }}
                    className="w-full py-4 bg-slate-100 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
                  >
                    Select New Creative
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoAnalyzePage;
