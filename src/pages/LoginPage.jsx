import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Label from '../components/ui/Label';
import { Shield, Lock, User, CheckCircle2, AlertCircle, Sparkles, Building2, BookOpen } from 'lucide-react';

const LoginPage = () => {
    const navigate = useNavigate();
    const { login, loginWithGoogle } = useAuth();

    const [activeTab, setActiveTab] = useState('password'); // 'password' | 'google'
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // Google SSO form input
    const [googleEmail, setGoogleEmail] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handlePasswordLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await login(username, password);
            if (res.user.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/user/dashboard');
            }
        } catch (err) {
            setError(err.message || 'Login failed. Please verify CFMS ID.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSSO = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await loginWithGoogle(googleEmail, 'University Faculty');
            if (res.user.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/user/dashboard');
            }
        } catch (err) {
            setError(err.message || 'Google SSO verification failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickLogin = (type) => {
        if (type === 'vc') {
            setUsername('vc@jntugv.edu.in');
            setPassword('VC@JNTUGV2026');
            setActiveTab('password');
        } else if (type === 'registrar') {
            setUsername('registrar@jntugv.edu.in');
            setPassword('Registrar@JNTUGV2026');
            setActiveTab('password');
        } else if (type === 'dmc') {
            setUsername('dmc@jntugv.edu.in');
            setPassword('DMC@JNTUGV2026');
            setActiveTab('password');
        } else if (type === 'principal') {
            setUsername('principal@jntugvcev.edu.in');
            setPassword('Principal@JNTUGVCEV');
            setActiveTab('password');
        } else if (type === 'dpo') {
            setUsername('dpo@jntugv.edu.in');
            setPassword('DPO@JNTUGV2026');
            setActiveTab('password');
        } else if (type === 'faculty1') {
            setUsername('15071465');
            setPassword('15071465');
            setActiveTab('password');
        } else {
            setUsername('1000218038');
            setPassword('1000218038');
            setActiveTab('password');
        }
    };

    return (
        <div className="h-screen overflow-hidden bg-slate-50 flex w-full font-sans">
            {/* Left Side - Branding (Hidden on mobile) */}
            <div className="hidden lg:flex w-1/2 bg-slate-900 relative flex-col justify-between overflow-hidden">
                {/* Ambient Gradients */}
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/40 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 right-0 w-[40rem] h-[40rem] bg-emerald-600/20 rounded-full blur-3xl pointer-events-none"></div>
                </div>
                
                {/* Content */}
                <div className="relative z-10 p-10 lg:p-14 flex flex-col h-full justify-between">
                    <div>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="inline-flex items-center justify-center p-2.5 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md overflow-hidden shadow-lg">
                                <img 
                                    src="/jntugv-logo.png" 
                                    alt="JNTU-GV Logo" 
                                    className="w-14 h-14 object-contain drop-shadow-md" 
                                />
                            </div>
                            <div className="inline-flex items-center justify-center p-2.5 bg-white/95 rounded-2xl border border-white/20 backdrop-blur-md overflow-hidden shadow-lg">
                                <img 
                                    src="/apfrs.png" 
                                    alt="APFRS" 
                                    className="w-14 h-14 object-contain drop-shadow-md" 
                                />
                            </div>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                            JNTU-GV <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">
                                APFRS Portal
                            </span>
                        </h1>
                        <p className="mt-4 text-base lg:text-lg text-slate-300 font-medium max-w-lg leading-relaxed">
                            Attendance Reports Generator from the Facial Bio Metric of APFRS of AP Govt.
                            For JNTU-GV University along with JNTU-GV College of Engineering and JNTU-GV CPSV College Faculty.
                        </p>
                    </div>

                    <div className="space-y-4 pb-4">
                        <div className="flex items-center gap-4 text-slate-400 group">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 backdrop-blur-sm group-hover:bg-white/10 transition-colors">
                                <Building2 className="w-5 h-5 text-indigo-300" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-xs uppercase tracking-wider">Centralized Management</h3>
                                <p className="text-xs mt-0.5">Unified system for all university departments</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-slate-400 group">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 backdrop-blur-sm group-hover:bg-white/10 transition-colors">
                                <BookOpen className="w-5 h-5 text-emerald-300" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-xs uppercase tracking-wider">Academic Excellence</h3>
                                <p className="text-xs mt-0.5">Supporting transparent educational operations</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative bg-white shadow-2xl z-10 overflow-y-auto">
                <div className="w-full max-w-md space-y-6">
                    {/* Mobile Logo (visible only on small screens) */}
                    <div className="lg:hidden flex flex-col items-center justify-center space-y-3 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="inline-flex items-center justify-center p-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                                <img 
                                    src="/jntugv-logo.png" 
                                    alt="JNTU-GV Logo" 
                                    className="w-10 h-10 object-contain drop-shadow-sm" 
                                />
                            </div>
                            <div className="inline-flex items-center justify-center p-2 bg-slate-50 rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                                <img 
                                    src="/apfrs.png" 
                                    alt="APFRS" 
                                    className="w-10 h-10 object-contain drop-shadow-sm" 
                                />
                            </div>
                        </div>
                        <div className="text-center">
                            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">JNTU-GV APFRS</h1>
                            <p className="text-slate-500 text-xs font-medium">
                                Faculty Reporting & Attendance
                            </p>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h2>
                        <p className="text-xs text-slate-500 mt-1 font-medium">Please sign in to access your dashboard.</p>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex p-1 bg-slate-100 rounded-xl">
                        <button
                            type="button"
                            onClick={() => { setActiveTab('password'); setError(null); }}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                                activeTab === 'password'
                                    ? 'bg-white text-indigo-700 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            Portal Login
                        </button>
                        <button
                            type="button"
                            onClick={() => { setActiveTab('google'); setError(null); }}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                                activeTab === 'google'
                                    ? 'bg-white text-indigo-700 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            Google SSO
                        </button>
                    </div>

                    {error && (
                        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-sm font-semibold flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Form 1: Password Login */}
                    {activeTab === 'password' && (
                        <form onSubmit={handlePasswordLogin} className="space-y-5">
                            <div className="bg-indigo-50/70 border border-indigo-100/50 p-3.5 rounded-xl text-xs text-indigo-900 font-semibold space-y-1.5 shadow-sm">
                                <div className="flex gap-2"><span>👑</span><span><strong>Administrators:</strong> Sign in with Username/Email & Password</span></div>
                                <div className="flex gap-2"><span>🎓</span><span><strong>Faculty Members:</strong> Sign in with CFMS ID (Default Password = CFMS ID)</span></div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="username" className="text-slate-700 font-bold">Username, Email, or CFMS ID</Label>
                                <div className="relative">
                                    <Input
                                        id="username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="e.g. vc@jntugv.edu.in or CFMS 15071465"
                                        required
                                        className="pl-10 py-2.5 bg-slate-50 border-slate-200 focus:bg-white"
                                    />
                                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password" className="text-slate-700 font-bold">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••••••"
                                        required
                                        className="pl-10 py-2.5 bg-slate-50 border-slate-200 focus:bg-white"
                                    />
                                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                                </div>
                            </div>

                            <Button type="submit" disabled={loading} className="w-full py-2.5 font-bold text-sm bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20">
                                {loading ? 'Authenticating...' : 'Sign In to Portal'}
                            </Button>
                        </form>
                    )}

                    {/* Form 2: Google SSO */}
                    {activeTab === 'google' && (
                        <form onSubmit={handleGoogleSSO} className="space-y-4">
                            <div className="bg-emerald-50/70 border border-emerald-100/50 p-3.5 rounded-xl text-xs text-emerald-900 font-semibold space-y-1.5 shadow-sm">
                                <div className="flex gap-2"><span>👑</span><span>Admin & Executive: <strong>@jntugv.edu.in</strong></span></div>
                                <div className="flex gap-2"><span>🎓</span><span>Faculty Members: <strong>@jntugvcev.edu.in</strong></span></div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="googleEmail" className="text-slate-700 font-bold">Official University Email</Label>
                                <Input
                                    id="googleEmail"
                                    type="email"
                                    value={googleEmail}
                                    onChange={(e) => setGoogleEmail(e.target.value)}
                                    placeholder="vkaneela.maths@jntugvcev.edu.in"
                                    required
                                    className="py-2.5 bg-slate-50 border-slate-200 focus:bg-white"
                                />
                            </div>

                            <Button type="submit" disabled={loading} className="w-full py-2.5 font-bold text-sm bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20">
                                {loading ? 'Verifying...' : 'Continue with Google'}
                            </Button>
                        </form>
                    )}

                    {/* Quick Demo Shortcuts Removed for Production */}

                    {/* Footer Security Badge */}
                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>AP Govt G.O. Rt. No. 2276 Authenticated</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
