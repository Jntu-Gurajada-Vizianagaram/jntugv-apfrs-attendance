import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from './PageLayout';
import { useAuth } from '../contexts/AuthContext';
import { useAttendance } from '../contexts/AttendanceContext';
import Card, { CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import {
    User,
    Calendar,
    Award,
    Clock,
    FileText,
    CheckCircle2,
    Building,
    ExternalLink,
    Send,
    ShieldCheck
} from 'lucide-react';

const FacultyDashboard = () => {
    const { user } = useAuth();
    const { attendanceData, approvedLeaves, reportsPublished } = useAttendance();
    const navigate = useNavigate();

    const userCfmsId = String(user?.cfmsId || user?.username || '').trim();
    const userEmail = String(user?.email || '').trim().toLowerCase();

    // Find logged-in faculty record from attendance dataset
    const facultyRecord = attendanceData.find(r => {
        const matchCfms = userCfmsId && String(r.cfmsId).trim() === userCfmsId;
        const matchEmail = userEmail && String(r.facultyEmail || r.email || '').trim().toLowerCase() === userEmail;
        return matchCfms || matchEmail;
    }) || attendanceData[0] || {};

    const [myLeaves, setMyLeaves] = useState([]);
    const [fetchingLeaves, setFetchingLeaves] = useState(true);

    useEffect(() => {
        const fetchMyLeaves = async () => {
            setFetchingLeaves(true);
            try {
                const emailParam = encodeURIComponent(userEmail || '');
                const res = await fetch(`/api/leaves/my-applications?email=${emailParam}`);
                if (res.ok) {
                    const data = await res.json();
                    setMyLeaves(data.leaves || []);
                }
            } catch (err) {
                console.error('Error fetching my leaves:', err);
            } finally {
                setFetchingLeaves(false);
            }
        };
        fetchMyLeaves();
    }, [userEmail]);

    const workingDays = facultyRecord.totalWorkingDays || 0;
    const rawBiometricPresent = facultyRecord.rawBiometricPresent || 0;
    const odDays = facultyRecord.odDays || 0;
    const alDays = facultyRecord.alDays || 0;
    const vlDays = facultyRecord.vlDays || 0;
    const dutyCredits = facultyRecord.dutyCreditDays || 0;
    const finalPresent = facultyRecord.finalCalculatedPresent || 0;
    const attendancePercent = facultyRecord.finalAttendancePercent || 0;
    const isCompliant = attendancePercent >= 75;

    const bodyContent = (
        <div className="space-y-8 max-w-6xl mx-auto pb-10">
            {/* Faculty Welcome Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 rounded-2xl text-white shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                        <User className="w-8 h-8 text-indigo-300" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-extrabold tracking-tight">{user?.name || facultyRecord.facultyName || 'Faculty Member'}</h1>
                            <Badge variant="info" className="bg-indigo-500/30 text-indigo-200 border-indigo-400/30">Faculty Portal</Badge>
                        </div>
                        <p className="text-xs font-semibold text-slate-300 mt-1 flex items-center gap-3">
                            <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5 text-indigo-400" /> {user?.department || facultyRecord.department || 'University Section'}</span>
                            <span>•</span>
                            <span className="font-mono text-indigo-200">CFMS ID: {userCfmsId || facultyRecord.cfmsId || '15071465'}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button onClick={() => navigate('/user/apply-leaves')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                        <Send className="w-4 h-4" /> Apply Leaves (CL/OD/SL/AL)
                    </Button>
                    <Button onClick={() => navigate('/calendar')} variant="secondary" className="font-bold text-xs bg-white/10 hover:bg-white/20 text-white border-white/20">
                        <Calendar className="w-4 h-4" /> Academic Calendar
                    </Button>
                </div>
            </div>

            {/* Attendance KPI Cards */}
            {reportsPublished ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Working Days</span>
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                                <Calendar className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <span className="text-3xl font-extrabold text-slate-900">{workingDays}</span>
                            <span className="text-xs text-slate-400 block mt-1">January 2026</span>
                        </div>
                    </Card>

                    <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Biometric Present</span>
                            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <span className="text-3xl font-extrabold text-emerald-700">{rawBiometricPresent} days</span>
                            <span className="text-xs text-slate-400 block mt-1">Biometric Fingerprint Logs</span>
                        </div>
                    </Card>

                    <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">OD, AL & Pongal Duty</span>
                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                <ShieldCheck className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <span className="text-3xl font-extrabold text-indigo-700">+{dutyCredits} days</span>
                            <span className="text-xs text-indigo-600 font-semibold block mt-1">Credited as Present</span>
                        </div>
                    </Card>

                    <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Finalized Rate</span>
                            <div className="p-2 bg-violet-50 rounded-lg text-violet-600">
                                <Award className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <span className="text-3xl font-extrabold text-slate-900">{attendancePercent}%</span>
                            <span className={`text-xs font-extrabold block mt-1 ${isCompliant ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {isCompliant ? '✅ G.O Compliant (≥75%)' : '❌ Deficient (<75%)'}
                            </span>
                        </div>
                    </Card>
                </div>
            ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-sm font-medium">
                    Attendance reports and KPIs are currently being compiled and finalized by IT Support. You will be notified once they are published.
                </div>
            )}

            {/* Approved Leaves Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Approved Leaves List */}
                <Card className="lg:col-span-2 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                    <CardHeader className="px-0 pt-0 border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-bold text-slate-900">My Leave Applications</CardTitle>
                            <CardDescription className="text-xs">Track real-time approval status</CardDescription>
                        </div>
                        <Badge variant="outline" className="text-xs font-bold">{myLeaves.length} Total Applied</Badge>
                    </CardHeader>

                    {fetchingLeaves ? (
                        <div className="py-8 text-center text-slate-400 text-xs font-medium">Loading applications...</div>
                    ) : myLeaves.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs font-medium">
                            No leave applications found. Applied leaves will appear here.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {myLeaves.map((lv) => (
                                <div key={lv.id} className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-900 text-xs font-extrabold rounded-md">
                                                {lv.leaveType}
                                            </span>
                                            <span className="text-xs font-extrabold text-slate-800">{lv.leaveTypeName}</span>
                                        </div>
                                        {lv.status === 'APPROVED' && (
                                            <Badge variant="success" className="flex items-center gap-1 text-xs">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                <span>Approved ({lv.daysCount} {lv.daysCount === 1 ? 'day' : 'days'})</span>
                                            </Badge>
                                        )}
                                        {lv.status === 'REJECTED' && (
                                            <Badge variant="danger" className="flex items-center gap-1 text-xs">
                                                <span>Rejected</span>
                                            </Badge>
                                        )}
                                        {lv.status.startsWith('PENDING_') && (
                                            <Badge variant="warning" className="flex items-center gap-1 text-xs">
                                                <Clock className="w-3 h-3 text-amber-600" />
                                                <span>{lv.status.replace('_', ' ')}</span>
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="text-xs text-slate-600 font-medium">
                                        <strong>Dates:</strong> {lv.startDate} to {lv.endDate}
                                    </div>
                                    <div className="text-xs text-slate-500 italic bg-white p-2 rounded-lg border border-slate-100">
                                        "{lv.reason}"
                                    </div>

                                    {lv.history && lv.history.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-slate-200/60 space-y-2">
                                            <div className="text-[10px] font-bold text-slate-500 uppercase">Approval History</div>
                                            <div className="space-y-1.5">
                                                {lv.history.map((h, i) => (
                                                    <div key={i} className="flex items-start gap-2 text-[11px]">
                                                        <div className={`mt-0.5 w-1.5 h-1.5 rounded-full ${h.action === 'APPROVED' ? 'bg-emerald-500' : h.action === 'REJECTED' ? 'bg-rose-500' : 'bg-slate-300'}`} />
                                                        <div>
                                                            <span className="font-semibold text-slate-700">{h.actorRole || 'System'} ({h.actor}):</span>
                                                            <span className="text-slate-600 ml-1">{h.action} - {h.remarks || 'No remarks'}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Right: Quick Links & Summary */}
                <div className="space-y-6">
                    {reportsPublished && (
                        <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                            <CardHeader className="px-0 pt-0">
                                <CardTitle className="text-base font-bold text-slate-900">Attendance Status Summary</CardTitle>
                            </CardHeader>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                                    <span className="font-semibold text-slate-600">Final Calculated Present</span>
                                    <span className="font-extrabold text-slate-900">{finalPresent} / {workingDays} days</span>
                                </div>
                                <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                                    <span className="font-semibold text-slate-600">Duty Credits Added</span>
                                    <span className="font-extrabold text-emerald-700">+{dutyCredits} days</span>
                                </div>
                                <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                                    <span className="font-semibold text-slate-600">Official Email Dispatch</span>
                                    <Badge variant="success">Active</Badge>
                                </div>
                            </div>
                        </Card>
                    )}
                    <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                        <div className="pt-2">
                            <Button onClick={() => navigate('/user/apply-leaves')} className="w-full font-bold text-xs py-2.5">
                                <Send className="w-4 h-4" /> Apply for New Leave
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );

    return <PageLayout Body={bodyContent} />;
};

export default FacultyDashboard;
