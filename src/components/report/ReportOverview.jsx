import React, { useState } from "react";
import { Clock, Calendar } from "lucide-react";
import StatsCards from './StatsCards';
import { useAttendance } from '../../contexts/AttendanceContext';

const ReportOverview = ({
  periodStats,
  selectedMonth,
  selectedYear,
  facultyData = [],
  overallStats = {},
  workingDays = []
}) => {
  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthLabel = `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;

  const { reportsPublished, setReportsPublished } = useAttendance();
  const [publishing, setPublishing] = useState(false);

  const handlePublishToggle = async (publish) => {
    setPublishing(true);
    try {
      const res = await fetch('/api/reports/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: publish })
      });
      if (res.ok) {
        setReportsPublished(publish);
        if (publish) {
          alert("Success! Reports are now visible to Faculty and Executives.\n\n(Simulated: Emails have also been dispatched to all faculty members.)");
        } else {
          alert("Reports are now hidden from Faculty and Executives.");
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update publish status.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* IT SUPPORT PUBLISH DASHBOARD */}
      <div className="bg-indigo-900 rounded-2xl border border-indigo-700 p-6 shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-black flex items-center gap-2">
              <span className="p-2 bg-indigo-800 rounded-lg">🚀</span> Dispatch & Publish Control
            </h2>
            <p className="text-indigo-200 text-sm mt-1 max-w-xl">
              Currently, faculty and executives <strong className="text-white underline">cannot see</strong> these reports. 
              Click below to instantly publish the {monthLabel} reports to their dashboards and dispatch emails.
            </p>
          </div>
          
          <div className="shrink-0 flex items-center gap-3">
            {reportsPublished ? (
              <button 
                onClick={() => handlePublishToggle(false)}
                disabled={publishing}
                className="px-6 py-3 rounded-xl font-bold text-sm bg-rose-500/20 text-rose-200 hover:bg-rose-500 hover:text-white border border-rose-500/30 transition-all"
              >
                {publishing ? 'Updating...' : 'Unpublish Reports'}
              </button>
            ) : (
              <button 
                onClick={() => handlePublishToggle(true)}
                disabled={publishing}
                className="px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/30 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                <span>Publish & Dispatch Emails</span>
              </button>
            )}
          </div>
        </div>
        
        {reportsPublished && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-200 text-xs font-bold flex items-center gap-2">
            ✅ Reports are currently LIVE and visible to all faculty and executives.
          </div>
        )}
      </div>
      {/* Working days section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
            <Clock className="w-5 h-5 text-sky-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{monthLabel} Stats</h3>
        </div>

        {/* Calendar Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-200 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{periodStats.totalPeriodDays || 0}</p>
                <p className="text-sm text-slate-600 font-semibold">Total Days</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-200 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{periodStats.totalWorkingDays || 0}</p>
                <p className="text-sm text-slate-600 font-semibold">Working Days</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-white rounded-xl border border-red-200 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{(periodStats.totalPeriodDays || 0) - (periodStats.totalWorkingDays || 0)}</p>
                <p className="text-sm text-slate-600 font-semibold">Holidays</p>
              </div>
            </div>
          </div>
        </div>


        <div className="my-6">
          {/* Month's Top Stats */}
          {facultyData && facultyData.length > 0 && (
            <div className="mb-6">
              <StatsCards
                facultyData={facultyData}
                overallStats={overallStats}
                filteredCount={facultyData.length}
                workingDays={workingDays}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
              />
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

const StatsCard = ({ label, value, type }) => {
  const typeMap = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-green-50 text-green-700 border-green-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
  };

  return (
    <div className={`flex items-center justify-between p-4 rounded-2xl border ${typeMap[type]}`}>
      <span className="text-sm font-bold uppercase tracking-wider opacity-80">{label}</span>
      <span className="text-xl font-black">{value}</span>
    </div>
  );
};

export default ReportOverview;
