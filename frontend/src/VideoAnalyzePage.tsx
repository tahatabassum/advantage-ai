import React, { useState, useRef, useEffect } from 'react';import { analyzeVideoAd } from './services/api';
import { 
  Video, 
  Upload, 
  Sparkles, 
  BrainCircuit, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Clock,
  Mic2,
  PlayCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VideoAnalyzePageProps {
  onAnalyzeStart?: () => void;
  onAnalyzeEnd?: () => void;
  initialResult?: any;
}

const VideoAnalyzePage: React.FC<VideoAnalyzePageProps> = ({ onAnalyzeStart, onAnalyzeEnd, initialResult }) => {  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [objective, setObjective] = useState('engagement');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(initialResult || null); 
  useEffect(() => {
    if (initialResult) {
        setAnalysis(initialResult);
        setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}, [initialResult]);

const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Please upload MP4, MOV, AVI, or WebM.");
      return;
    }

    // Validate size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError("Video file too large. Maximum size is 50MB.");
      return;
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!videoFile) return;

    setLoading(true);
    setError(null);
    if (onAnalyzeStart) onAnalyzeStart();

    try {
      const result = await analyzeVideoAd(videoFile, caption, platform, objective);
      setAnalysis(result);
      // Smooth scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || err.message;
      setError(`Analysis failed: ${detail}. Please try again.`);
    } finally {
      setLoading(false);
      if (onAnalyzeEnd) onAnalyzeEnd();
    }
  };

  const platforms = [
    "Facebook", "Instagram", "TikTok", "YouTube", "Google Display", "LinkedIn"
  ];

  const objectives = [
    "Awareness", "Engagement", "Traffic", "Conversions", "Sales"
  ];

  return (
    <div className="space-y-12">
      {/* Title Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-4xl font-black tracking-tight text-slate-900">Video Ad Analyzer</h2>
            <span className="px-2 py-0.5 bg-emerald-500 text-white rounded text-[10px] font-black uppercase tracking-wider animate-pulse">NEW</span>
          </div>
          <p className="text-slate-500 font-semibold italic">Multi-modal AI analysis for high-performing video creatives.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Upload Column */}
        <div className="space-y-8">
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-8 hover:border-blue-400 transition-colors group relative overflow-hidden">
            {!videoPreview ? (
              <label className="flex flex-col items-center justify-center cursor-pointer py-12 space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                  <Upload className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-black uppercase tracking-widest text-slate-900">Upload Video Ad</p>
                  <p className="text-xs font-bold text-slate-400 mt-1">MP4, MOV, AVI, WebM (Max 50MB)</p>
                </div>
                <input type="file" className="hidden" accept="video/*" onChange={handleFileChange} />
              </label>
            ) : (
              <div className="space-y-6">
                <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-800">
                  <video 
                    src={videoPreview} 
                    className="w-full h-full object-contain"
                    controls
                  />
                  <button 
                    onClick={() => { setVideoFile(null); setVideoPreview(null); }}
                    className="absolute top-4 right-4 p-2 bg-slate-900/50 backdrop-blur-md text-white rounded-xl hover:bg-rose-500 transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <Video className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-slate-900 line-clamp-1">{videoFile?.name}</p>
                      <p className="text-[10px] font-bold text-slate-400">{(videoFile!.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-blue-600 cursor-pointer hover:underline">
                    Change
                    <input type="file" className="hidden" accept="video/*" onChange={handleFileChange} />
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Video Script / Caption</label>
              <textarea 
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Paste the ad copy, hook, or full script here..."
                className="w-full h-32 bg-white border border-slate-200 rounded-2xl p-4 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-300 resize-none shadow-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Platform</label>
                <select 
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-black uppercase tracking-wider outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500 shadow-sm"
                >
                  {platforms.map(p => <option key={p} value={p.toLowerCase().replace(' ', '_')}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Objective</label>
                <select 
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-black uppercase tracking-wider outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500 shadow-sm"
                >
                  {objectives.map(o => <option key={o} value={o.toLowerCase()}>{o}</option>)}
                </select>
              </div>
            </div>

            <button 
              onClick={handleAnalyze}
              disabled={!videoFile || loading}
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl transition-all relative overflow-hidden flex items-center justify-center gap-3 ${
                !videoFile || loading 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-slate-900 text-white hover:scale-[1.02] active:scale-[0.98] shadow-slate-900/20'
              }`}
            >
              {loading ? (
                <>
                  <BrainCircuit className="w-5 h-5 animate-spin" />
                  Analyzing Video Ad...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-current" />
                  Start Video Audit
                </>
              )}
            </button>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <p className="text-xs font-bold">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Benefits/Info Column */}
        <div className="space-y-8">
           <div className="bg-slate-900 rounded-3xl p-8 text-white space-y-8 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="space-y-2 relative z-10">
                <h3 className="text-2xl font-black tracking-tight uppercase tracking-[0.1em]">Video Intelligence</h3>
                <p className="text-slate-400 text-sm font-semibold">Our AI analyzes every frame and audio segment to identify high-performing patterns.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                {[
                  { title: "AI Detection", desc: "Identify deepfake, synthetic voices, and AI patterns." },
                  { title: "Frame Analysis", desc: "We scan dynamic visual hierarchy across the duration." },
                  { title: "Speech-to-Insights", desc: "Transcription analysis for tone and persuasion." },
                  { title: "Hook Scoring", desc: "Crucial first 3 seconds breakdown and rating." }
                ].map((item, i) => (
                  <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1">
                    <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest">{item.title}</p>
                    <p className="text-xs font-bold text-slate-300 leading-tight">{item.desc}</p>
                  </div>
                ))}
              </div>
           </div>

           <div className="bg-blue-50 border border-blue-100 rounded-3xl p-8 space-y-6">
              <div className="flex items-center gap-3 text-blue-600">
                <Sparkles className="w-6 h-6" />
                <h3 className="font-black uppercase tracking-widest text-sm">Creative Director Recommendations</h3>
              </div>
              <p className="text-blue-900/70 text-xs font-bold italic leading-relaxed">
                "Video ads require a different psychology than static. The hook is 80% of the battle. We'll identify exactly where you're losing the viewer and how to reclaim their attention."
              </p>
              <div className="flex items-center gap-4 border-t border-blue-200/50 pt-6">
                <div className="w-10 h-10 rounded-full bg-blue-200 border-2 border-blue-100 flex items-center justify-center text-blue-600 font-black italic">AV</div>
                <div>
                  <p className="text-[10px] font-black uppercase text-blue-900 tracking-widest">AdVantage AI</p>
                  <p className="text-[10px] font-bold text-blue-600">Senior Strategy Model</p>
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* Results Section */}
      <AnimatePresence>
        {analysis && (
          <motion.div 
            ref={resultsRef}
            id="video-analysis-results"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12 pb-24 border-t border-slate-200 pt-16"
          >
            {/* Main Score Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex flex-col items-center justify-center relative overflow-hidden shadow-2xl shadow-slate-900/30">
                  <div className="absolute top-0 right-0 p-8">
                    <BrainCircuit className="w-12 h-12 text-white/5" />
                  </div>
                  <div className="relative">
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 text-center">Video Overall Score</div>
                    <div className="text-9xl font-black tracking-tighter leading-none mb-4">{analysis.scoring.overall_score}</div>
                  </div>
                  <div className={`px-8 py-2 rounded-2xl font-black text-xl shadow-lg ${
                    analysis.scoring.grade === 'A' ? 'bg-emerald-500' : 
                    analysis.scoring.grade === 'B' ? 'bg-blue-500' :
                    analysis.scoring.grade === 'C' ? 'bg-amber-500' : 'bg-rose-500'
                  }`}>
                    GRADE: {analysis.scoring.grade}
                  </div>
                  <p className="mt-8 text-center text-slate-400 font-bold uppercase tracking-widest text-[11px] leading-relaxed max-w-[200px]">
                    {analysis.scoring.verdict}
                  </p>
               </div>

               {/* AI Detection Card */}
               <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 flex flex-col justify-between shadow-sm">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Detection Verdict</h3>
                      <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        analysis.ai_detection.is_ai_generated 
                        ? 'bg-rose-50 text-rose-600 border-rose-100' 
                        : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        {analysis.ai_detection.is_ai_generated ? 'AI GENERATED' : 'HUMAN MADE'}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-3xl font-black text-slate-900">{analysis.ai_detection.verdict}</p>
                      <p className="text-xs font-bold text-slate-400">Confidence Score: <span className="text-slate-900">{analysis.ai_detection.confidence}%</span></p>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Found Indicators:</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.ai_detection.indicators.map((ind: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 font-bold text-[10px] uppercase rounded-lg border border-slate-200">
                            {ind}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Recommendation</p>
                    <p className="text-xs font-bold text-slate-600 italic">"{analysis.ai_detection.recommendation}"</p>
                  </div>
               </div>

               {/* Video Metadata Card */}
               <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="space-y-8">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Video Technical Pulse</h3>
                    
                    <div className="grid grid-cols-2 gap-8">
                       <div className="space-y-2">
                         <div className="flex items-center gap-2 text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Duration</span>
                         </div>
                         <p className="text-2xl font-black text-slate-900">{analysis.video_analysis.duration_seconds}s</p>
                       </div>
                       <div className="space-y-2">
                         <div className="flex items-center gap-2 text-slate-400">
                            <Video className="w-3 h-3" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Analyzed</span>
                         </div>
                         <p className="text-2xl font-black text-slate-900">{analysis.video_analysis.total_frames_analyzed} Frames</p>
                       </div>
                       <div className="space-y-2">
                         <div className="flex items-center gap-2 text-slate-400">
                            <Mic2 className="w-3 h-3" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Audio</span>
                         </div>
                         <p className="text-2xl font-black text-slate-900 uppercase">{analysis.video_analysis.has_audio ? 'Enabled' : 'Muted'}</p>
                       </div>
                       <div className="space-y-2">
                         <div className="flex items-center gap-2 text-slate-400">
                            <Zap className="w-3 h-3" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Pacing</span>
                         </div>
                         <p className="text-2xl font-black text-slate-900 line-clamp-1">{analysis.video_analysis.pacing}</p>
                       </div>
                    </div>
                  </div>

                  <div className="mt-8 border-t border-slate-100 pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-black uppercase text-slate-400">Hook Strength</span>
                       <span className="font-black text-emerald-500">{analysis.video_analysis.hook_strength}</span>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-emerald-500" 
                         style={{ width: `${analysis.hook_analysis.hook_score}%` }} 
                       />
                    </div>
                  </div>
               </div>
            </div>

            {/* Sub-scores Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Visual Storytelling', score: analysis.scoring.visual_quality_score, icon: Video },
                { label: 'Copy Strength', score: analysis.scoring.copy_strength_score, icon: BrainCircuit },
                { label: 'Platform Fit', score: analysis.scoring.platform_fit_score, icon: Zap },
                { label: 'Psychology Triggers', score: analysis.scoring.psychology_score, icon: Sparkles }
              ].map((item, i) => (
                <div key={i} className="bg-slate-900 rounded-3xl p-6 text-white border border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <item.icon className="w-12 h-12" />
                  </div>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-1">{item.label}</p>
                  <p className="text-4xl font-black">{item.score}%</p>
                  <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.score}%` }}
                      className="h-full bg-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
               <div className="xl:col-span-2 space-y-12">
                  {/* Hook Analysis */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-10 space-y-8 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Hook Precision Breakdown</h3>
                      <span className="text-xl font-black text-slate-900">{analysis.hook_analysis.hook_score}/100</span>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase text-slate-400">Captured Hook Text:</p>
                      <div className="p-6 bg-slate-950 text-white rounded-2xl relative font-black text-xl italic leading-relaxed shadow-xl shadow-slate-900/10">
                        <span className="text-blue-500 text-4xl absolute -top-2 -left-1 opacity-20">"</span>
                        {analysis.hook_analysis.hook_text}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-slate-400">Hook Performance:</p>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                               <Sparkles className="w-4 h-4" />
                            </div>
                            <div>
                               <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Type identified</p>
                               <p className="text-sm font-black">{analysis.hook_analysis.hook_type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center">
                               <AlertTriangle className="w-4 h-4" />
                            </div>
                            <div>
                               <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Critical Weakness</p>
                               <p className="text-sm font-black text-rose-600">{analysis.hook_analysis.hook_weakness}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-slate-400">AI Hook Variations:</p>
                        <div className="space-y-2">
                           {analysis.hook_analysis.hook_rewrites.map((h: string, i: number) => (
                             <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600">
                               {h}
                             </div>
                           ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Psychology Column */}
                  <div className="bg-slate-900 rounded-3xl p-10 text-white space-y-10 shadow-2xl">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Psychology Triggers Triggered</h3>
                      <Sparkles className="w-6 h-6 text-blue-500" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {Object.entries(analysis.psychology_triggers)
                        .filter(([k]) => k !== 'missing_triggers_suggestions')
                        .map(([k, v]) => (
                        <div key={k} className={`p-4 rounded-2xl border transition-all ${
                          v ? 'bg-blue-600/20 border-blue-500/30 text-blue-400' : 'bg-white/5 border-white/10 text-slate-600'
                        }`}>
                          <div className="flex items-center justify-between mb-4">
                            {v ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          </div>
                          <p className="text-[9px] font-black uppercase tracking-widest">{k.replace('_', ' ')}</p>
                        </div>
                      ))}
                    </div>

                    <div className="p-6 bg-white/5 rounded-2xl space-y-4 border border-white/10">
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Recommended additions:</p>
                       <div className="flex flex-wrap gap-2">
                          {Object.entries(analysis.psychology_triggers.missing_triggers_suggestions).map(([k, v]: any) => (
                             <div key={k} className="px-3 py-1 bg-white/10 text-white font-bold text-[10px] uppercase rounded-lg border border-white/10">
                                {k}: {v}
                             </div>
                          ))}
                       </div>
                    </div>
                  </div>
                  
                  {/* Feedback Checklist */}
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none ml-1">Video Optimization Checklist</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl space-y-4">
                          <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">High Priority</p>
                          <ul className="space-y-3">
                            {analysis.feedback_checklist.high_priority.map((f: string, i: number) => (
                              <li key={i} className="flex gap-2 text-[11px] font-bold text-rose-800 leading-tight">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                {f}
                              </li>
                            ))}
                          </ul>
                       </div>
                       <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl space-y-4">
                          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Medium Priority</p>
                          <ul className="space-y-3">
                            {analysis.feedback_checklist.medium_priority.map((f: string, i: number) => (
                              <li key={i} className="flex gap-2 text-[11px] font-bold text-amber-800 leading-tight">
                                <Zap className="w-3 h-3 shrink-0" />
                                {f}
                              </li>
                            ))}
                          </ul>
                       </div>
                       <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl space-y-4">
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Low Priority</p>
                          <ul className="space-y-3">
                            {analysis.feedback_checklist.low_priority.map((f: string, i: number) => (
                              <li key={i} className="flex gap-2 text-[11px] font-bold text-emerald-800 leading-tight">
                                <CheckCircle2 className="w-3 h-3 shrink-0" />
                                {f}
                              </li>
                            ))}
                          </ul>
                       </div>
                    </div>
                  </div>
               </div>

               <div className="space-y-8 sticky top-24 h-fit">
                  {/* Scene & Pacing Insights */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6 shadow-sm">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Editorial Breakdown</h3>
                    
                    <div className="space-y-6">
                       <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-[10px] font-black uppercase text-slate-400 mb-2">First 3 Seconds</p>
                          <div className={`text-xs font-black uppercase p-3 rounded-xl text-center ${
                             analysis.video_analysis.first_3_seconds_verdict.toLowerCase().includes('strong') 
                             ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                             {analysis.video_analysis.first_3_seconds_verdict}
                          </div>
                       </div>

                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 border border-slate-100 font-black text-xl">
                             {analysis.video_analysis.scene_count}
                          </div>
                          <div>
                             <p className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">Visual Switches</p>
                             <p className="text-xs font-bold text-slate-600">Scene Count Identified</p>
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* A/B Variants */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-8 shadow-sm">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Strategy Reframing</h3>
                    <div className="space-y-6">
                      {Object.entries(analysis.ab_variants).map(([k, v]: any) => (
                        <div key={k} className="space-y-3">
                          <div className="flex items-center gap-2">
                             <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded flex items-center justify-center text-[10px] font-black">{k.replace('variant_', '').toUpperCase()}</div>
                             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{v.angle}</p>
                          </div>
                          <p className="text-xs font-black leading-tight text-slate-900">{v.headline}</p>
                          <p className="text-[10px] font-bold text-slate-500 italic">"{v.explanation}"</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Copy Variants */}
                  <div className="bg-slate-900 rounded-3xl p-8 text-white space-y-8">
                     <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Copy Extension Kit</h3>
                     <div className="space-y-6">
                        <div className="space-y-2">
                           <p className="text-[9px] font-black text-blue-400 uppercase">Direct Response Script</p>
                           <p className="text-[11px] font-bold text-slate-400 leading-relaxed italic">"{analysis.copy_variants.direct_response}"</p>
                        </div>
                        <div className="space-y-2">
                           <p className="text-[9px] font-black text-blue-400 uppercase">Storytelling Script</p>
                           <p className="text-[11px] font-bold text-slate-400 leading-relaxed italic">"{analysis.copy_variants.storytelling}"</p>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                           {analysis.copy_variants.hashtags.map((t: string, i: number) => (
                             <span key={i} className="text-[9px] font-black uppercase text-blue-500">{t}</span>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoAnalyzePage;
