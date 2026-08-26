import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchHolidays } from '../api/holidayService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import Badge from '../components/ui/Badge';
import { Calendar, FileText, CheckCircle2, Clock, AlertTriangle, Send, ShieldCheck, AlertCircle } from 'lucide-react';

const FacultyApplyLeaves = () => {
    const { user } = useAuth();
    const today = new Date();
    const currentDayOfMonth = today.getDate();
    const isALActive = currentDayOfMonth >= 1 && currentDayOfMonth <= 25;

    const formatDateTime = (d) => {
        const tzOffset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    };

    const [leaveType, setLeaveType] = useState('CL'); // CL, OD, SL, AL
    const [startDate, setStartDate] = useState(formatDateTime(today));
    const [endDate, setEndDate] = useState(formatDateTime(today));
    const [reason, setReason] = useState('');
    const [targetApprover, setTargetApprover] = useState('HOD'); // HOD, Principal, Registrar
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [warning, setWarning] = useState(null);
    const [holidays, setHolidays] = useState([]);

    const [myLeaves, setMyLeaves] = useState([]);
    const [fetchingLeaves, setFetchingLeaves] = useState(true);

    const fetchMyLeaves = async () => {
        setFetchingLeaves(true);
        try {
            const emailParam = encodeURIComponent(user?.email || '');
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

    const loadHolidays = async () => {
        const year = today.getFullYear();
        const data = await fetchHolidays(year);
        setHolidays(data.map(h => h.date)); // array of YYYY-MM-DD strings
    };

    useEffect(() => {
        fetchMyLeaves();
        loadHolidays();
    }, [user?.email]);

    const handleStartDateChange = (e) => {
        const newStart = e.target.value;
        const selectedDateStr = newStart.split('T')[0];
        
        setError(null);
        setWarning(null);

        // 1. Holiday Check
        if (holidays.includes(selectedDateStr)) {
            setError(`The selected date (${selectedDateStr}) is a holiday. Leave applications are closed for this day. You can apply for future dates.`);
        }

        const selectedDate = new Date(newStart);
        const now = new Date();
        const todayStr = formatDateTime(now).split('T')[0];
        
        let finalStart = newStart;
        let finalEnd = newStart;

        // 2. The 9:30 AM Rule (Same Day Check)
        if (selectedDateStr === todayStr) {
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const timeInMinutes = currentHour * 60 + currentMinute;
            
            // 9:30 AM = 9 * 60 + 30 = 570 minutes
            if (timeInMinutes > 570) {
                setWarning('Same-day applications after 9:30 AM are restricted to Half-Day leaves (1:00 PM to 5:30 PM).');
                finalStart = `${selectedDateStr}T13:00`;
                finalEnd = `${selectedDateStr}T17:30`;
            }
        }

        setStartDate(finalStart);
        
        // Ensure end date is not before start date
        if (new Date(finalEnd) > new Date(endDate) || selectedDate > now) {
            setEndDate(finalEnd);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage(null);

        // Validation for Academic Leave (AL)
        if (leaveType === 'AL' && !isALActive) {
            setError(`Academic Leaves (AL) can only be submitted between the 1st and 25th of the month. Today is Day ${currentDayOfMonth}.`);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/leaves/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    facultyEmail: user?.email,
                    facultyName: user?.name,
                    department: user?.department,
                    cfmsId: user?.cfmsId,
                    leaveType,
                    startDate,
                    endDate,
                    reason,
                    targetApprover
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to submit leave application');
            }

            setMessage(data.message || 'Leave application submitted for Principal approval!');
            setReason('');
            fetchMyLeaves();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-12">
            {/* Header */}
            <div className="relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-gradient-to-br from-indigo-900 via-violet-900 to-slate-900 p-8 rounded-3xl text-white shadow-2xl shadow-indigo-500/20">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-indigo-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full text-xs font-black tracking-wide bg-indigo-500/30 text-indigo-100 border border-indigo-400/30 shadow-inner">
                            Faculty Leave Portal
                        </span>
                        <span className="text-xs text-slate-300 font-medium">
                            Hierarchical Approval Enabled
                        </span>
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-tight mt-1">Apply for Leaves & On-Duty</h1>
                    <p className="text-slate-300 text-xs mt-0.5">
                        Submit Casual (CL), On-Duty (OD), Special (SL), and Academic Leaves (AL) to your approver.
                    </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/15 text-right">
                    <div className="text-[11px] text-indigo-200 font-semibold uppercase tracking-wider">Today's Date Window</div>
                    <div className="text-sm font-black text-emerald-300 flex items-center gap-1.5 justify-end mt-0.5">
                        <Calendar className="w-4 h-4" />
                        <span>Day {currentDayOfMonth} of Month</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Apply Form */}
                <div className="lg:col-span-1 p-6 space-y-6 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all duration-300">
                    <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <div className="p-2 bg-indigo-50 rounded-xl">
                                <Send className="w-5 h-5 text-indigo-600" />
                            </div>
                            <span>New Application</span>
                        </h2>
                        <Badge variant="secondary" className="text-[10px]">Step 1 of 1</Badge>
                    </div>

                    {error && (
                        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {warning && (
                        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-medium flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <span>{warning}</span>
                        </div>
                    )}

                    {message && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span>{message}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Leave Type Options */}
                        <div>
                            <Label htmlFor="leaveType">Select Leave Category</Label>
                            <select
                                id="leaveType"
                                value={leaveType}
                                onChange={(e) => setLeaveType(e.target.value)}
                                className="w-full mt-1.5 px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                            >
                                <option value="CL">🌴 Casual Leave (CL)</option>
                                <option value="OD">💼 On Duty Leave (OD)</option>
                                <option value="SL">🌟 Special Leave (SL)</option>
                                <option value="AL" disabled={!isALActive}>
                                    🏖️ Academic Leave (AL) {!isALActive ? '(Closed 26th-End)' : '(Active 1st-25th)'}
                                </option>
                            </select>
                        </div>

                        {/* AL Warning Banner */}
                        {leaveType === 'AL' && (
                            <div className={`p-3 rounded-xl text-xs font-medium border flex items-start gap-2 ${
                                isALActive 
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                                    : 'bg-amber-50 border-amber-200 text-amber-900'
                            }`}>
                                {isALActive ? (
                                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                )}
                                <div>
                                    <div className="font-bold">Academic Leave (AL) Schedule Rule</div>
                                    <div className="text-[11px] mt-0.5">
                                        AL applications are strictly enabled only from <strong>1st to 25th</strong> of every month. 
                                        {!isALActive && <span className="block text-rose-700 font-bold mt-1">Submission currently closed (Day {currentDayOfMonth}).</span>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="startDate">Start Date & Time</Label>
                                <Input
                                    id="startDate"
                                    type="datetime-local"
                                    value={startDate}
                                    onChange={handleStartDateChange}
                                    required
                                    className="mt-1 text-xs"
                                />
                            </div>
                            <div>
                                <Label htmlFor="endDate">End Date & Time</Label>
                                <Input
                                    id="endDate"
                                    type="datetime-local"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    required
                                    className="mt-1 text-xs"
                                />
                            </div>
                        </div>

                        {/* Reason / Purpose */}
                        <div>
                            <Label htmlFor="reason">Reason / Official Academic Duty Details</Label>
                            <textarea
                                id="reason"
                                rows={3}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Describe academic event, workshop, valuation duty, or personal reason..."
                                required
                                className="w-full mt-1.5 p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                            />
                        </div>

                        {/* Target Approver */}
                        <div>
                            <Label htmlFor="targetApprover">Route Application To (Final Authority)</Label>
                            <select
                                id="targetApprover"
                                value={targetApprover}
                                onChange={(e) => setTargetApprover(e.target.value)}
                                className="w-full mt-1.5 px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                            >
                                <option value="HOD">Level 1: Head of Department (HOD)</option>
                                <option value="Principal">Level 2: College Principal</option>
                                <option value="Registrar">Level 3: University Registrar</option>
                            </select>
                            <p className="text-[10px] text-slate-500 mt-1 pl-1">
                                Note: Applications routed to Registrar will still pass through HOD & Principal first.
                            </p>
                        </div>

                        {/* Submission Notice */}
                        <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] text-slate-600 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                            <span>Application will be sent to <strong>HOD</strong> first for initial review.</span>
                        </div>

                        <Button 
                            type="submit" 
                            disabled={loading || error || (leaveType === 'AL' && !isALActive)} 
                            className="w-full py-3 font-extrabold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/30 rounded-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Submitting...' : 'Submit Application'}
                        </Button>
                    </form>
                </div>

                {/* Right Column: Application Status & History */}
                <div className="lg:col-span-2 p-6 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-xl shadow-slate-200/50">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                <div className="p-2 bg-indigo-50 rounded-xl">
                                    <FileText className="w-5 h-5 text-indigo-600" />
                                </div>
                                <span>My Leave Applications</span>
                            </h2>
                            <p className="text-slate-500 text-xs mt-1 font-medium">Track real-time approval status</p>
                        </div>
                        <Badge variant="outline" className="text-xs font-bold px-3 py-1">{myLeaves.length} Total Applied</Badge>
                    </div>

                    {fetchingLeaves ? (
                        <div className="py-12 text-center text-slate-400 text-xs">Loading leave history...</div>
                    ) : myLeaves.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-xs font-medium space-y-1">
                            <div>No leave applications submitted yet.</div>
                            <div className="text-[11px] text-slate-400">Use the form on the left to submit a new request.</div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {myLeaves.map((lv) => (
                                <div key={lv.id} className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 hover:border-indigo-200 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-extrabold rounded-md">
                                                {lv.leaveType}
                                            </span>
                                            <span className="text-xs font-extrabold text-slate-800">{lv.leaveTypeName}</span>
                                            <span className="text-xs text-slate-500">({lv.daysCount} {lv.daysCount === 1 ? 'day' : 'days'})</span>
                                        </div>

                                        {lv.status === 'APPROVED' && (
                                            <Badge variant="success" className="flex items-center gap-1 text-xs">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                <span>Approved</span>
                                            </Badge>
                                        )}
                                        {lv.status === 'REJECTED' && (
                                            <Badge variant="danger" className="flex items-center gap-1 text-xs">
                                                <AlertCircle className="w-3 h-3 text-rose-600" />
                                                <span>Rejected</span>
                                            </Badge>
                                        )}
                                        {lv.status === 'PENDING_HOD' && (
                                            <Badge variant="warning" className="flex items-center gap-1 text-xs">
                                                <Clock className="w-3 h-3 text-amber-600" />
                                                <span>Pending HOD</span>
                                            </Badge>
                                        )}
                                        {lv.status === 'PENDING_PRINCIPAL' && (
                                            <Badge variant="warning" className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700">
                                                <Clock className="w-3 h-3 text-amber-700" />
                                                <span>Pending Principal</span>
                                            </Badge>
                                        )}
                                        {lv.status === 'PENDING_REGISTRAR' && (
                                            <Badge variant="warning" className="flex items-center gap-1 text-xs bg-orange-100 text-orange-700">
                                                <Clock className="w-3 h-3 text-orange-700" />
                                                <span>Pending Registrar</span>
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="text-xs text-slate-700 font-medium">
                                        <strong>Dates:</strong> {lv.startDate} to {lv.endDate}
                                    </div>
                                    <div className="text-xs text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-100">
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
                </div>
            </div>
        </div>
    );
};

export default FacultyApplyLeaves;
