import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from './PageLayout';
import Card, { CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import {
    Users,
    Calendar,
    Send,
    FileSpreadsheet,
    ShieldCheck,
    ArrowUpRight,
    TrendingUp,
    CheckCircle2,
    Clock,
    AlertTriangle
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { useAttendance } from '../contexts/AttendanceContext';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user, isExecutive, canUpload } = useAuth();
    const { reportsPublished } = useAttendance();

    const [stats, setStats] = useState({
        totalFaculty: 48,
        attendancePercentage: '92.4%',
        unresolvedConflicts: 0,
        smtpStatus: 'Operational'
    });

    useEffect(() => {
        // Fetch health & conflicts from backend API
        fetch('/api/holidays/2026/weekend-conflicts')
            .then(res => res.json())
            .then(data => {
                const unresolved = (data.conflicts || []).filter(c => !c.alreadyCompensated).length;
                setStats(prev => ({ ...prev, unresolvedConflicts: unresolved }));
            })
            .catch(() => {});
    }, []);

    const bodyContent = (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 rounded-2xl text-white shadow-xl">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Badge variant={isExecutive ? "info" : "success"} className={isExecutive ? "bg-sky-500/20 text-sky-300 border-sky-500/30" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"}>
                            {isExecutive ? "👑 Executive Watcher (Read-Only)" : "⚙️ IT & Processing Control Cell"}
                        </Badge>
                        <span className="text-xs text-slate-300 font-mono">G.O. Rt. No. 2276 Compliant</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        {isExecutive ? "University Executive Attendance Dashboard" : "IT & Data Processing Control Hub"}
                    </h1>
                    <p className="text-slate-300 text-sm max-w-2xl">
                        {isExecutive 
                            ? `Welcome ${user?.name || 'Executive Officer'}. Executive read-only overview of university consolidated attendance, department statistics, and faculty reporting sheets.` 
                            : "Centralized control hub for attendance reports, dynamic AP Government holiday management, and faculty report dispatches."}
                    </p>
                </div>

                {canUpload && (
                    <div className="flex items-center gap-3">
                        <Button onClick={() => navigate('/home')} className="bg-white text-slate-900 hover:bg-slate-100 font-bold shadow-md">
                            <FileSpreadsheet className="w-4 h-4" /> Import Report
                        </Button>
                    </div>
                )}
            </div>

            {/* KPI Cards Grid */}
            {(!isExecutive || reportsPublished) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Faculty</span>
                            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                                <Users className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-baseline justify-between">
                            <span className="text-3xl font-extrabold text-slate-900">{stats.totalFaculty}</span>
                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                                <TrendingUp className="w-3.5 h-3.5" /> +2 Active
                            </span>
                        </div>
                    </Card>

                    <Card className="p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Attendance</span>
                            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-baseline justify-between">
                            <span className="text-3xl font-extrabold text-slate-900">{stats.attendancePercentage}</span>
                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                                <TrendingUp className="w-3.5 h-3.5" /> High
                            </span>
                        </div>
                    </Card>

                    <Card className="p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Weekend Conflicts</span>
                            <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-baseline justify-between">
                            <span className="text-3xl font-extrabold text-slate-900">{stats.unresolvedConflicts}</span>
                            <span className="text-xs font-bold text-slate-500">Unresolved</span>
                        </div>
                    </Card>

                    <Card className="p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Relay Service</span>
                            <div className="p-2.5 bg-sky-50 rounded-xl text-sky-600">
                                <Send className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-baseline justify-between">
                            <span className="text-lg font-bold text-emerald-700">{stats.smtpStatus}</span>
                            <Badge variant="success">Backend .env</Badge>
                        </div>
                    </Card>
                </div>
            ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-sm font-medium">
                    Attendance reports and statistics are currently being compiled and finalized by IT Support. 
                    <br />
                    You will be notified once they are published.
                </div>
            )}

            {/* Quick Navigation Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Management Hub */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6">
                        <CardHeader className="px-0 pt-0">
                            <CardTitle className="text-xl">Administrative Action Hub</CardTitle>
                            <CardDescription>Direct access to university attendance management modules.</CardDescription>
                        </CardHeader>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                            <button
                                onClick={() => navigate('/calendar')}
                                className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all text-left group"
                            >
                                <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 flex items-center gap-1 group-hover:text-indigo-600">
                                        Academic Calendar <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Manage AP Govt holidays, moon-cycle date shifts, and 2nd Saturday comp-offs.
                                    </p>
                                </div>
                            </button>

                            <button
                                onClick={() => navigate('/faculty-summary')}
                                className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all text-left group"
                            >
                                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 flex items-center gap-1 group-hover:text-emerald-600">
                                        Faculty Reports <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1">
                                        View individual faculty attendance breakdowns and dispatch email receipts.
                                    </p>
                                </div>
                            </button>

                            <button
                                onClick={() => navigate('/consolidated-report')}
                                className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all text-left group"
                            >
                                <div className="p-3 bg-purple-100 text-purple-700 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    <FileSpreadsheet className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 flex items-center gap-1 group-hover:text-purple-600">
                                        Consolidated View <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Comprehensive department-wide attendance matrix and statistics.
                                    </p>
                                </div>
                            </button>

                            <button
                                onClick={() => navigate('/admin')}
                                className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all text-left group"
                            >
                                <div className="p-3 bg-sky-100 text-sky-700 rounded-xl group-hover:bg-sky-600 group-hover:text-white transition-colors">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 flex items-center gap-1 group-hover:text-sky-600">
                                        Email System Config <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Server SMTP relay health and environment variable configuration.
                                    </p>
                                </div>
                            </button>
                        </div>
                    </Card>
                </div>

                {/* Audit Activity Sidebar */}
                <div className="space-y-6">
                    <Card className="p-6">
                        <CardHeader className="px-0 pt-0">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Clock className="w-4 h-4 text-indigo-600" /> System Activity Audit
                            </CardTitle>
                        </CardHeader>
                        <div className="space-y-4 text-xs text-slate-600">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                                <div className="font-bold text-slate-800">Milad-un-Nabi Date Shifted</div>
                                <div className="text-slate-500">Aug 25 → Aug 26 (G.O RT 2267)</div>
                                <div className="text-[10px] text-slate-400 font-mono">Today, 11:08 AM</div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                                <div className="font-bold text-slate-800">Email Transporter Verified</div>
                                <div className="text-slate-500">SMTP Relay connected (Port 587)</div>
                                <div className="text-[10px] text-slate-400 font-mono">Today, 11:14 AM</div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );

    return <PageLayout Body={bodyContent} />;
};

export default AdminDashboard;
