import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader2, Image as ImageIcon, Zap, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import UrlInputPanel from './UrlInputPanel';

interface UploadPanelProps {
  onAnalyze: (images: File[], captions: string[], platform: string, objective: string) => void;
  onAnalyzeByUrl: (url: string, platform: string, objective: string) => void;
  isLoading: boolean;
}

const platforms = ['Meta', 'TikTok', 'Google', 'LinkedIn', 'X (Twitter)'];
const objectives = ['Conversion', 'Awareness', 'Traffic', 'Engagement', 'Lead Gen'];

const UploadPanel: React.FC<UploadPanelProps> = ({ onAnalyze, onAnalyzeByUrl, isLoading }) => {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [files, setFiles] = useState<{file: File, preview: string, caption: string}[]>([]);
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [globalCaption, setGlobalCaption] = useState('');
  const [platform, setPlatform] = useState('Meta');
  const [objective, setObjective] = useState('Conversion');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 5,
    onDrop: (acceptedFiles: File[]) => {
      if (url.trim()) {
        setError("Please choose one input method: either upload an image OR paste a URL, not both.");
        return;
      }
      setError(null);
      const newFiles = acceptedFiles.map(f => ({
        file: f,
        preview: URL.createObjectURL(f),
        caption: globalCaption
      }));
      setFiles(prev => [...prev, ...newFiles].slice(0, 5));
    },
  } as any);

  const handleClear = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCaptionChange = (index: number, val: string) => {
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, caption: val } : f));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length > 0) {
      onAnalyze(
        files.map(f => f.file), 
        files.map(f => f.caption.trim() !== '' ? f.caption.trim() : globalCaption.trim()), 
        platform, 
        objective
      );
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            Ad Audit Engine
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Upload creatives or paste a URL for a deep neural audit.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setMode('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Upload Image
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

      <AnimatePresence mode="wait">
        {error && (
           <motion.div 
             initial={{ height: 0, opacity: 0 }}
             animate={{ height: 'auto', opacity: 1 }}
             exit={{ height: 0, opacity: 0 }}
             className="px-8 pt-6"
           >
              <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
                <button onClick={() => setError(null)} className="ml-auto hover:text-rose-800"><X className="w-4 h-4" /></button>
              </div>
           </motion.div>
        )}
      </AnimatePresence>

      <div className="p-8">
        {mode === 'upload' ? (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 gap-8">
              {/* Dropzone */}
              <div 
                {...getRootProps()} 
                className={`relative min-h-[200px] rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-8
                  ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300 bg-slate-50'}
                `}
              >
                <input {...getInputProps()} />
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto text-slate-400 border border-slate-100">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Drop ad creatives here (Max 5)</p>
                    <p className="text-xs text-slate-500 mt-1">PNG, JPG or WEBP (Max 5MB each)</p>
                  </div>
                </div>
              </div>
    
              {/* Configuration */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Default Caption</label>
                  <textarea
                    value={globalCaption}
                    onChange={(e) => setGlobalCaption(e.target.value)}
                    placeholder="Base caption for all variants..."
                    className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                  />
                </div>
                
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Platform</label>
                      <select
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none"
                      >
                        {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Campaign Objective</label>
                      <select
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none"
                      >
                        {objectives.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
    
              {/* Files List/Edit */}
              <AnimatePresence>
                {files.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Individual Variant Details</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {files.map((f, idx) => (
                        <motion.div 
                          key={idx}
                          layout
                          className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-4 relative group"
                        >
                          <button 
                             type="button"
                             onClick={() => handleClear(idx)}
                             className="absolute -top-2 -right-2 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          
                          <div className="flex gap-4">
                            <img src={f.preview} alt="Variant" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                               <p className="text-[10px] font-black uppercase text-slate-400 truncate mb-1">{f.file.name}</p>
                               <textarea 
                                  value={f.caption}
                                  onChange={(e) => handleCaptionChange(idx, e.target.value)}
                                  placeholder="Override caption..."
                                  className="w-full h-20 text-xs p-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                               />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
    
            <button
              type="submit"
              disabled={isLoading || files.length === 0}
              className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 transition-all font-black uppercase tracking-widest text-sm shadow-xl
                ${isLoading || files.length === 0 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-[1.01] active:scale-[0.98]'
                }
              `}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Running Neural Audit...
                </>
              ) : (
                <>
                  <Zap className={`w-5 h-5 ${files.length > 0 ? 'text-blue-400' : 'text-slate-400'}`} />
                  Audit {files.length > 0 ? files.length : ''} Creative{files.length > 1 ? 's' : ''}
                </>
              )}
            </button>
          </form>
        ) : (
           <UrlInputPanel 
              type="image" 
              isLoading={isLoading} 
              onAnalyze={(url, plat, obj) => {
                if (files.length > 0) {
                  setError("Please choose one input method: either upload an image OR paste a URL, not both.");
                  return;
                }
                setError(null);
                onAnalyzeByUrl(url, plat, obj);
              }} 
           />
        )}
      </div>
    </div>
  );
};

export default UploadPanel;
