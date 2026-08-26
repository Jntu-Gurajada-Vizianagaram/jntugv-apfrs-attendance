import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAttendance } from '../../contexts/AttendanceContext';
import { useAuth } from '../../contexts/AuthContext';
import {
    LayoutDashboard,
    FileText,
    Users,
    Settings,
    Upload,
    Calendar,
    Home,
    Mail,
    X,
    BarChart3,
    Layers,
    LogOut,
    Shield,
    UserCheck,
    Send,
    ShieldCheck,
    CheckSquare
} from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, label, disabled, badge }) => (
    <NavLink
        to={to}
        className={({ isActive }) => `
      flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group
      ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
      ${isActive
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-indigo-600 font-medium'}
    `}
    >
        <div className="flex items-center gap-3">
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs">{label}</span>
        </div>
        {badge && (
            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                {badge}
            </span>
        )}
    </NavLink>
);

const Sidebar = ({ isOpen, onClose, hasData }) => {
    const navigate = useNavigate();
    const { selectedMonth, selectedYear, reportsPublished } = useAttendance();
    const { user, isAdmin, isExecutive, canUpload, logout, isHOD, isPrincipal, isRegistrar, isVC, isDMC, isDPO } = useAuth();
    const today = new Date().getDate();

    const canApproveLeaves = isHOD || isPrincipal || isRegistrar;
    const isTopExec = isVC || isRegistrar || isPrincipal;
    let roleLabel = 'Admin';
    if (isRegistrar) roleLabel = 'Registrar';
    else if (isPrincipal) roleLabel = 'Principal';
    else if (isHOD) roleLabel = 'HOD';

    const handleSignOut = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside className={`
        fixed top-0 left-0 z-50 h-full w-72 bg-white/90 backdrop-blur-xl border-r border-slate-200
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen
      `}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 overflow-hidden shrink-0 p-1">
                                <img src="https://jntugv.edu.in/logo192.png" alt="JNTU-GV Logo" className="w-full h-full object-contain drop-shadow-sm" />
                            </div>
                            <div>
                                <h1 className="text-sm font-black text-slate-900 tracking-tight">APFRS Portal</h1>
                                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">JNTU-GV Attendance</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Dynamic Navigation */}
                    <nav className="flex-1 overflow-y-auto p-3 space-y-1">

                        <div className="px-3 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                            Main Menu
                        </div>

                        {/* Admin vs Principal vs Faculty Dashboards */}
                        {isAdmin ? (
                            <SidebarItem 
                                to="/admin/dashboard" 
                                icon={Shield} 
                                label={canApproveLeaves ? `${roleLabel} Executive Hub` : isExecutive ? "Executive Watcher Hub" : "IT Processing Control Hub"} 
                            />
                        ) : (
                            <SidebarItem to="/user/dashboard" icon={UserCheck} label="My Attendance Dashboard" />
                        )}

                        {/* Leave Approvals Tab */}
                        {canApproveLeaves && (
                            <SidebarItem to="/admin/leave-approvals" icon={CheckSquare} label="Faculty Leave Approvals" badge={roleLabel} />
                        )}

                        {/* Faculty Leave Application Menu Item */}
                        {!isAdmin && (
                            <SidebarItem to="/user/apply-leaves" icon={Send} label="Apply Leaves (CL/OD/SL/AL)" />
                        )}

                        {/* Data Upload — IT Processing Team Only */}
                        {canUpload && (
                            <SidebarItem 
                                to={isPrincipal ? "/import" : "/home"} 
                                icon={isPrincipal ? Upload : Home} 
                                label={isPrincipal ? "Upload Approved Leaves" : "Overview & Data Upload"} 
                            />
                        )}

                        {isAdmin && (
                            <>
                                {(reportsPublished || canUpload) && (
                                    <>
                                        <div className="pt-3 px-3 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                                            Attendance Reports
                                        </div>
                                        <SidebarItem to="/consolidated-report" icon={Layers} label="Consolidated Report" disabled={!hasData} />
                                        {!isTopExec && (
                                            <>
                                                <SidebarItem to="/faculty-summary" icon={Users} label="Faculty Dispatch Summary" disabled={!hasData} />
                                                <SidebarItem to={`/summary/${selectedYear}/${selectedMonth}`} icon={FileText} label="Monthly Faculty Sheet" disabled={!hasData} />
                                                <SidebarItem to={`/daily/${selectedYear}/${selectedMonth}/${today}`} icon={Calendar} label="Daily Report" disabled={!hasData} />
                                                <SidebarItem to={`/weekly/${selectedYear}/${selectedMonth}/1`} icon={Calendar} label="Weekly Report" disabled={!hasData} />
                                            </>
                                        )}
                                        <SidebarItem to="/department" icon={Users} label="Department View" disabled={!hasData} />
                                    </>
                                )}

                                {!isTopExec && (
                                    <>
                                        <div className="pt-3 px-3 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                                            Communication & System
                                        </div>
                                        <SidebarItem to="/status-dashboard" icon={BarChart3} label="Status Dashboard" disabled={!hasData} />
                                        {canUpload && (
                                            <SidebarItem to="/email-preview" icon={Mail} label="Email Template" disabled={!hasData} />
                                        )}

                                        <div className="pt-3 px-3 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                                            Configuration
                                        </div>
                                        <SidebarItem to="/calendar" icon={Calendar} label="Academic Calendar" />
                                        {canUpload && (
                                            <SidebarItem to="/admin" icon={Settings} label="Email System Config" />
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </nav>

                    {/* Bottom User Profile Card */}
                    <div className="p-3 border-t border-slate-100 bg-slate-50/50">
                        <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-xs">
                            <div className="flex items-center gap-2.5 overflow-hidden">
                                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                    {user?.name ? user.name.charAt(0) : 'A'}
                                </div>
                                <div className="truncate">
                                    <div className="text-xs font-extrabold text-slate-800 truncate">{user?.name || 'User'}</div>
                                    <div className="text-[10px] text-slate-400 font-semibold uppercase truncate">
                                        {canApproveLeaves ? roleLabel : user?.type || user?.role || 'Faculty'}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0"
                                title="Sign Out"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
