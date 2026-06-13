import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
    Building2, 
    Users, 
    Mic2, 
    Globe, 
    Save, 
    CheckCircle2, 
    Loader2,
    ShieldCheck,
    Target
} from 'lucide-react';
import { getBrandProfile, updateBrandProfile } from '../services/api';

const BrandCenter: React.FC = () => {
    const [profile, setProfile] = useState({
        brand_name: '',
        industry: '',
        target_audience: '',
        brand_voice: 'Professional',
        main_competitors: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await getBrandProfile();
                if (data) setProfile(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateBrandProfile(profile);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading profile...</p>
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-12"
        >
            <div className="lg:col-span-2 space-y-8">
                <div className="bg-white rounded-[40px] border border-slate-200 p-8 md:p-12 space-y-12 shadow-sm">
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black tracking-tight text-slate-900">Brand Intelligence</h3>
                        <p className="text-sm font-semibold text-slate-500">Provide context to help AdVantage AI tailor its analysis to your specific market position.</p>
                    </div>

                    <form onSubmit={handleSave} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <Building2 className="w-3 h-3" />
                                    Brand Name
                                </label>
                                <input 
                                    type="text" 
                                    value={profile.brand_name}
                                    onChange={e => setProfile({...profile, brand_name: e.target.value})}
                                    placeholder="e.g. Acme Tech"
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <Globe className="w-3 h-3" />
                                    Industry
                                </label>
                                <input 
                                    type="text" 
                                    value={profile.industry}
                                    onChange={e => setProfile({...profile, industry: e.target.value})}
                                    placeholder="e.g. SaaS / E-commerce"
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <Users className="w-3 h-3" />
                                Target Audience
                            </label>
                            <textarea 
                                value={profile.target_audience}
                                onChange={e => setProfile({...profile, target_audience: e.target.value})}
                                placeholder="Describe your ideal customer persona in detail..."
                                rows={4}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <Mic2 className="w-3 h-3" />
                                    Brand Voice
                                </label>
                                <select 
                                    value={profile.brand_voice}
                                    onChange={e => setProfile({...profile, brand_voice: e.target.value})}
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none"
                                >
                                    {['Professional', 'Friendly', 'Bold', 'Technical', 'Luxury', 'Witty'].map(v => (
                                        <option key={v} value={v}>{v}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <Target className="w-3 h-3" />
                                    Main Competitors
                                </label>
                                <input 
                                    type="text" 
                                    value={profile.main_competitors}
                                    onChange={e => setProfile({...profile, main_competitors: e.target.value})}
                                    placeholder="Comma separated names..."
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button 
                                type="submit"
                                disabled={saving}
                                className={`flex items-center gap-3 px-8 py-4 ${saved ? 'bg-emerald-500' : 'bg-slate-900'} text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50`}
                            >
                                {saving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : saved ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                {saved ? 'Settings Saved' : 'Save Strategic Profile'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-blue-600 rounded-[32px] p-8 text-white space-y-6 shadow-xl shadow-blue-500/20">
                    <ShieldCheck className="w-10 h-10 opacity-50" />
                    <div className="space-y-2">
                        <h4 className="font-black text-xl leading-tight">Context Matters</h4>
                        <p className="text-sm font-bold text-blue-100 leading-relaxed">
                            Filling out your brand profile allows our AI-powered engine to understand your "Brand DNA". 
                            This enables higher-fidelity analysis of brand sentiment and target audience alignment.
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] border border-slate-200 p-8 space-y-4 shadow-sm">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tips for better audits</h4>
                    <ul className="space-y-3">
                        {[
                            "Be ultra-specific about your customer age and interests.",
                            "List competitors whose style you want to outperform.",
                            "Clearly define your 'Forbidden Words' in the audience section."
                        ].map((tip, i) => (
                            <li key={i} className="flex gap-3 text-xs font-bold text-slate-600">
                                <span className="text-blue-500 mt-1">•</span>
                                {tip}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </motion.div>
    );
};

export default BrandCenter;
