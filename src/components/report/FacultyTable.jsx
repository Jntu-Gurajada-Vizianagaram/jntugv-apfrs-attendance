/* eslint-disable no-unused-vars */
import React, { useRef, useCallback, useState } from 'react';
import { calculateSummary } from '../../core/attendance/calculations';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, Mail, CheckCircle2 } from 'lucide-react';

const FacultyTable = ({
  facultyData,
  workingDays,
  totalWorkingDays,
  onSendEmail,
  emailStatus,
  sendingEmail,
  bulkEmailProgress,
  selectedMonth = 1,
  selectedYear = 2026
}) => {
  const { canSendEmail } = useAuth();
  const effectiveWorkingDays = workingDays && workingDays.length ? workingDays : null;
  const headerRef = useRef(null);
  const bodyRef = useRef(null);

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc' // 'asc' or 'desc'
  });

  const handleBodyScroll = useCallback((e) => {
    if (headerRef.current) {
      headerRef.current.scrollLeft = e.target.scrollLeft;
    }
  }, []);

  const handleHeaderScroll = useCallback((e) => {
    if (bodyRef.current) {
      bodyRef.current.scrollLeft = e.target.scrollLeft;
    }
  }, []);

  // Function to handle sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Function to get sorted data
  const getSortedData = () => {
    if (!sortConfig.key) return facultyData;

    return [...facultyData].sort((a, b) => {
      const summaryA = a.summary || calculateSummary(a, selectedMonth, selectedYear);
      const summaryB = b.summary || calculateSummary(b, selectedMonth, selectedYear);
      const percentageA = parseFloat(summaryA.attendancePercentage) || 0;
      const percentageB = parseFloat(summaryB.attendancePercentage) || 0;

      let valueA, valueB;

      switch (sortConfig.key) {
        case 'sno':
          return 0;

        case 'name':
          valueA = (a.name || a.facultyName || '').toLowerCase();
          valueB = (b.name || b.facultyName || '').toLowerCase();
          break;

        case 'department':
          valueA = (a.department || '').toLowerCase();
          valueB = (b.department || '').toLowerCase();
          break;

        case 'designation':
          valueA = (a.designation || '').toLowerCase();
          valueB = (b.designation || '').toLowerCase();
          break;

        case 'stats':
          valueA = summaryA.presentDays;
          valueB = summaryB.presentDays;
          break;

        case 'hours':
          valueA = parseFloat(summaryA.totalHours);
          valueB = parseFloat(summaryB.totalHours);
          break;

        case 'percentage':
          valueA = percentageA;
          valueB = percentageB;
          break;

        default:
          return 0;
      }

      if (valueA < valueB) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Function to get dynamic background color based on percentage
  const getStatsBackgroundColor = (percentage) => {
    if (percentage >= 75) return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    if (percentage >= 50) return 'bg-amber-100 text-amber-800 border border-amber-200';
    return 'bg-rose-100 text-rose-800 border border-rose-200';
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const sortedData = getSortedData();

  return (
    <div className="flex flex-col bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      {/* Header with synchronized horizontal scroll */}
      <div
        ref={headerRef}
        className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] bg-slate-50 border-b border-slate-200"
        onScroll={handleHeaderScroll}
      >
        <div className="flex min-w-max">
          {/* S.No */}
          <div
            className="w-16 px-3 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider border-r border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={() => handleSort('sno')}
          >
            S.No
          </div>

          {/* Faculty Member (Name & CFMS ID Tracking) */}
          <div
            className="w-80 px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider border-r border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={() => handleSort('name')}
          >
            <div className="flex items-center">
              Faculty Member (Name & CFMS ID)
              <span className="ml-1 text-xs">{getSortIndicator('name')}</span>
            </div>
          </div>

          {/* Details - Department & Designation */}
          <div
            className="w-64 px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider border-r border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={() => handleSort('department')}
          >
            <div className="flex items-center">
              Department & Designation
              <span className="ml-1 text-xs">{getSortIndicator('department')}</span>
            </div>
          </div>

          {/* Stats - Present/Total Days */}
          <div
            className="w-48 px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider border-r border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={() => handleSort('stats')}
          >
            <div className="flex items-center justify-center">
              Stats [P/T]
              <span className="ml-1 text-xs">{getSortIndicator('stats')}</span>
            </div>
          </div>

          {/* Total Hours & Avg/Day */}
          <div
            className="w-40 px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider border-r border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={() => handleSort('hours')}
          >
            <div className="flex items-center justify-center">
              Hours (Total / Avg Day)
              <span className="ml-1 text-xs">{getSortIndicator('hours')}</span>
            </div>
          </div>

          {/* Percentage */}
          <div
            className="w-32 px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider border-r border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={() => handleSort('percentage')}
          >
            <div className="flex items-center justify-center">
              Percentage
              <span className="ml-1 text-xs">{getSortIndicator('percentage')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Body with synchronized horizontal scroll */}
      <div
        ref={bodyRef}
        className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] max-h-[70vh]"
        onScroll={handleBodyScroll}
      >
        <div className="min-w-max">
          {sortedData.map((employee, index) => {
            const summary = employee.summary || calculateSummary(employee, selectedMonth, selectedYear);
            const totalDaysForEmployee = summary.workingDays || summary.totalDays || totalWorkingDays || employee.totalWorkingDays || 22;
            const presentDays = employee.finalCalculatedPresent !== undefined ? employee.finalCalculatedPresent : summary.presentDays;
            const percentageValue = employee.finalAttendancePercent !== undefined ? employee.finalAttendancePercent : (parseFloat(summary.attendancePercentage) || 0);
            const percentage = percentageValue.toFixed(1);
            const totalHoursValue = parseFloat(summary.totalHours) || (presentDays * 8.0);
            const totalHoursDisplay = `${totalHoursValue.toFixed(1)}h`;
            const cfmsId = employee.cfmsId || employee.cfms_id || 'N/A';
            const facultyName = employee.name || employee.facultyName || 'Faculty Member';

            return (
              <div key={index} className="flex border-b border-slate-200 hover:bg-slate-50 transition-colors duration-150 min-w-max items-center">
                {/* S.No */}
                <div className="w-16 px-3 py-3.5 whitespace-nowrap text-xs text-slate-600 text-center font-bold border-r border-slate-200">
                  {index + 1}
                </div>

                {/* Faculty Member (Name & CFMS ID Tracking) */}
                <div className="w-80 px-4 py-3.5 whitespace-nowrap border-r border-slate-200">
                  <div className="min-w-0 space-y-1">
                    <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 flex-wrap">
                      <span>{facultyName}</span>
                      <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                        CFMS: {cfmsId}
                      </span>
                    </div>
                    {employee.email && employee.email !== 'N/A' && (
                      <div className="text-[11px] text-slate-500 font-medium truncate">{employee.email}</div>
                    )}
                  </div>
                </div>

                {/* Details - Department & Designation */}
                <div className="w-64 px-4 py-3.5 whitespace-nowrap border-r border-slate-200">
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-extrabold bg-slate-100 text-slate-800 border border-slate-200">
                        {employee.department || 'General'}
                      </span>
                    </div>
                    {employee.designation && employee.designation !== 'N/A' && (
                      <div className="text-[11px] text-slate-500 font-medium truncate">
                        {employee.designation}
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats - Present/Total Days */}
                <div className="w-48 px-4 py-3.5 whitespace-nowrap text-center border-r border-slate-200">
                  <div className="flex flex-col items-center space-y-1">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black ${getStatsBackgroundColor(percentageValue)}`}>
                      {presentDays}/{totalDaysForEmployee} days
                    </span>
                  </div>
                </div>

                {/* Total Hours & Avg/Day */}
                <div className="w-40 px-4 py-3.5 whitespace-nowrap text-xs text-slate-700 text-center font-bold border-r border-slate-200">
                  <div className="space-y-0.5">
                    <div>{totalHoursDisplay}</div>
                    <div className="text-[10px] text-indigo-700 font-extrabold bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100 inline-block">
                      {summary.averageHoursPerDay || (presentDays > 0 ? (totalHoursValue / presentDays).toFixed(1) : '8.0')} hrs/day
                    </div>
                  </div>
                </div>

                {/* Percentage */}
                <div className="w-32 px-4 py-3.5 whitespace-nowrap text-center">
                  <div className="flex flex-col items-center space-y-0.5">
                    <span className={`text-sm font-black ${percentageValue >= 75 ? 'text-emerald-700' :
                      percentageValue >= 50 ? 'text-amber-700' : 'text-rose-700'
                      }`}>
                      {percentage}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {percentageValue >= 75 ? 'Compliant' : 'Deficient'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FacultyTable;