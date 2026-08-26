import React from "react";
import FacultyTable from "./FacultyTable";
import { useAuth } from "../../contexts/AuthContext";
import { Lock, Mail } from "lucide-react";

const ReportBody = ({
  filteredData,
  effectiveWorkingDays,
  periodStats,
  sendingEmail,
  bulkEmailProgress,
  onBulkSend,
  onAction,
  actionLabel,
  onSendEmail,
  emailStatus,
  searchValue,
  onSearchChange,
  selectedMonth,
  selectedYear
}) => {
  const { canSendEmail } = useAuth();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Faculty Attendance Tracking Matrix</h3>
            <p className="text-xs text-slate-500 mt-0.5">CFMS ID tracking & biometric report analysis</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="search"
              placeholder="Search by Faculty Name, CFMS ID, Department..."
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64"
              value={searchValue || ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />

            {canSendEmail ? (
              <button
                onClick={onAction}
                disabled={sendingEmail || bulkEmailProgress.processing}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm flex items-center gap-1.5"
              >
                <Mail className="w-4 h-4" />
                <span>{bulkEmailProgress.processing ? "Sending..." : (actionLabel || "Send Bulk Email (IT Support)")}</span>
              </button>
            ) : (
              <div className="px-3 py-2 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Email Dispatch Enabled for IT Support (DMC / DPO)</span>
              </div>
            )}
          </div>
        </div>

        <FacultyTable
          facultyData={filteredData}
          workingDays={effectiveWorkingDays}
          totalWorkingDays={periodStats.totalWorkingDays}
          onSendEmail={onSendEmail}
          emailStatus={emailStatus}
          sendingEmail={sendingEmail}
          bulkEmailProgress={bulkEmailProgress}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />
      </div>
    </div>
  );
};

export default ReportBody;
