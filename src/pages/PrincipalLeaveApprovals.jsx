import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import { CheckCircle2, XCircle, Clock, ShieldCheck, UserCheck, Search, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const PrincipalLeaveApprovals = () => {
    const { user, isHOD, isPrincipal, isRegistrar, isAdmin } = useAuth();
    
    let currentRole = 'Admin';
    if (isRegistrar) currentRole = 'Registrar';
    else if (isPrincipal) currentRole = 'Principal';
    else if (isHOD) currentRole = 'HOD';

    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [remarksInput, setRemarksInput] = useState({});

    const fetchPendingLeaves = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/leaves/pending-approvals?role=${currentRole}&department=${user?.department || ''}`);
            if (res.ok) {
                const data = await res.json();
                setLeaves(data.leaves || []);
            }
        } catch (err) {
            console.error('Error fetching leave applications:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingLeaves();
    }, []);

    const handleAction = async (leaveId, action) => {
        setActionLoading(leaveId);
        try {
            const remarks = remarksInput[leaveId] || (action === 'APPROVE' ? `Approved by ${currentRole}` : `Rejected by ${currentRole}`);
            const res = await fetch('/api/leaves/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leaveId, action, remarks, actorName: user?.name, actorRole: currentRole })
            });
            if (res.ok) {
                fetchPendingLeaves();
            }
        } catch (err) {
            console.error(`Error processing leave ${action}:`, err);
        } finally {
            setActionLoading(null);
        }
    };

    const filteredLeaves = leaves.filter(l => {
        const matchesSearch = 
            l.facultyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.facultyEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.cfmsId.toLowerCase().includes(searchTerm.toLowerCase());

        if (filterType === 'ALL') return matchesSearch;
        return matchesSearch && l.status === filterType;
    });

    const pendingStatusType = `PENDING_${currentRole.toUpperCase()}`;
    const pendingCount = leaves.filter(l => l.status === pendingStatusType).length;

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 p-6 rounded-2xl text-white shadow-xl">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {currentRole} Executive Authority
                        </span>
                        <span className="text-xs text-slate-300 font-medium">
                            {user?.email}
                        </span>
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-tight mt-1 flex items-center gap-2">
                        <UserCheck className="w-6 h-6 text-emerald-400" />
                        <span>Faculty Leave Approvals</span>
                    </h1>
                    <p className="text-slate-300 text-xs mt-0.5">
                        Review, approve, or reject leave applications routed to your authority level.
                    </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/15 text-right">
                    <div className="text-[11px] text-indigo-200 font-semibold uppercase tracking-wider">Pending Review</div>
                    <div className="text-xl font-black text-amber-300 flex items-center gap-1.5 justify-end mt-0.5">
                        <Clock className="w-5 h-5" />
                        <span>{pendingCount} Applications</span>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <Card className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <Input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by Faculty Name, CFMS ID, Department, or Email..."
                        className="pl-9 text-xs"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    >
                        <option value="ALL">All Applications</option>
                        <option value={pendingStatusType}>⌛ Pending Approval ({pendingCount})</option>
                        <option value="APPROVED">✅ Approved</option>
                        <option value="REJECTED">❌ Rejected</option>
                    </select>
                </div>
            </Card>

            {/* Applications List */}
            {loading ? (
                <div className="py-16 text-center text-slate-400 text-xs font-medium">Loading faculty leave applications...</div>
            ) : filteredLeaves.length === 0 ? (
                <Card className="p-12 text-center text-slate-400 text-xs font-medium bg-white rounded-2xl border border-slate-200">
                    No leave applications found matching your criteria.
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredLeaves.map((lv) => (
                        <Card key={lv.id} className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm space-y-3 hover:border-indigo-300 transition-all">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-extrabold text-slate-900">{lv.facultyName}</h3>
                                        <Badge variant="secondary" className="text-[10px] uppercase font-mono">{lv.department}</Badge>
                                        <span className="text-xs text-slate-400 font-mono">CFMS: {lv.cfmsId}</span>
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium mt-0.5">{lv.facultyEmail}</div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-1 bg-indigo-100 text-indigo-900 text-xs font-extrabold rounded-lg">
                                        {lv.leaveTypeName}
                                    </span>

                                    {lv.status === 'APPROVED' && (
                                        <Badge variant="success" className="text-xs flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                            <span>Approved</span>
                                        </Badge>
                                    )}
                                    {lv.status === 'REJECTED' && (
                                        <Badge variant="danger" className="text-xs flex items-center gap-1">
                                            <XCircle className="w-3 h-3 text-rose-600" />
                                            <span>Rejected</span>
                                        </Badge>
                                    )}
                                    {lv.status.startsWith('PENDING_') && (
                                        <Badge variant="warning" className="text-xs flex items-center gap-1">
                                            <Clock className="w-3 h-3 text-amber-600" />
                                            <span>{lv.status.replace('_', ' ')}</span>
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <div>
                                    <span className="text-slate-400 font-medium block">Duration</span>
                                    <span className="font-extrabold text-slate-800">{lv.startDate} to {lv.endDate} ({lv.daysCount} days)</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-medium block">Application Date</span>
                                    <span className="font-semibold text-slate-700">{new Date(lv.appliedAt).toLocaleDateString()}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-medium block">Approver Authority</span>
                                    <span className="font-semibold text-indigo-700 flex items-center gap-1">
                                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                                        <span>Target: {lv.targetApprover}</span>
                                    </span>
                                </div>
                            </div>

                            {/* Reason Statement */}
                            <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200/70 space-y-1">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Purpose / Reason</span>
                                <p className="font-medium italic text-slate-800">"{lv.reason}"</p>
                            </div>

                            {/* Approval Action Form (Only if Pending at current level) */}
                            {lv.status === pendingStatusType ? (
                                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
                                    <Input
                                        type="text"
                                        placeholder="Add approval comments or rejection remarks (optional)..."
                                        value={remarksInput[lv.id] || ''}
                                        onChange={(e) => setRemarksInput({ ...remarksInput, [lv.id]: e.target.value })}
                                        className="text-xs flex-1"
                                    />

                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <Button
                                            type="button"
                                            disabled={actionLoading === lv.id}
                                            onClick={() => handleAction(lv.id, 'APPROVE')}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 flex-1 sm:flex-initial flex items-center justify-center gap-1"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>Approve</span>
                                        </Button>

                                        <Button
                                            type="button"
                                            disabled={actionLoading === lv.id}
                                            onClick={() => handleAction(lv.id, 'REJECT')}
                                            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 flex-1 sm:flex-initial flex items-center justify-center gap-1"
                                        >
                                            <XCircle className="w-3.5 h-3.5" />
                                            <span>Reject</span>
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                lv.history && lv.history.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-slate-100/60 space-y-1">
                                        <div className="text-[10px] font-bold text-slate-500 uppercase">Approval History</div>
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
                                )
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PrincipalLeaveApprovals;
