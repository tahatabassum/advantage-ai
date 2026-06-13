import React, { useState } from 'react';
import { Mail, Lock, Sparkles, ArrowRight, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { login, signup, forgotPassword } from '../../services/api';

interface AuthPageProps {
  onSuccess: (token: string, user: any) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'login') {
        const data = await login(email, password);
        onSuccess(data.access_token, data.user);
      } else if (mode === 'signup') {
        const data = await signup(email, password);
        setMessage("Account created! Please check your email to verify your account.");
        setTimeout(() => {
          onSuccess(data.access_token, data.user);
        }, 3000);
      } else if (mode === 'forgot') {
        await forgotPassword(email);
        setMessage("If that email exists, we've sent a reset link.");
        setTimeout(() => setMode('login'), 4000);
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (err.response?.status === 401) {
        setError('Incorrect email or password.');
      } else if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError(err.message || 'Authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-transparent to-transparent">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-[20px] shadow-xl shadow-blue-200 mb-6 group transition-transform hover:scale-105 active:scale-95 cursor-pointer">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">AdVantage AI</h1>
          <p className="text-slate-500 font-medium">The AI-Powered Creative Strategist</p>
        </div>

        <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
          <div className="p-8 md:p-10">
            {mode !== 'forgot' && (
              <div className="flex gap-1 p-1 bg-slate-50 border border-slate-100 rounded-2xl mb-8">
                <button 
                  onClick={() => setMode('login')}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Log In
                </button>
                <button 
                  onClick={() => setMode('signup')}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Sign Up
                </button>
              </div>
            )}

            {mode === 'forgot' && (
              <div className="mb-8">
                <button onClick={() => setMode('login')} className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline mb-2">← Back to login</button>
                <h2 className="text-xl font-black text-slate-900">Reset Password</h2>
                <p className="text-xs text-slate-500 font-bold mt-1">Enter your email and we'll send you a link.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </motion.div>
                )}
                {message && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 text-sm font-bold"
                  >
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    {message}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-900 font-bold placeholder:text-slate-300"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Password</label>
                    {mode === 'login' && (
                      <button 
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-900 font-bold placeholder:text-slate-300"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-[24px] text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all hover:-translate-y-1 active:translate-y-0.5 flex items-center justify-center gap-3 group"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {mode === 'login' ? 'Enter App' : mode === 'signup' ? 'Create Account' : 'Send Link'}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
        
        <p className="mt-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
          {mode === 'login' ? "Don't have an account?" : "Already have an account?"} 
          <button 
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="ml-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            {mode === 'login' ? 'Sign up now' : 'Log in here'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};
