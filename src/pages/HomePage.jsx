/* eslint-disable react-hooks/preserve-manual-memoization */
/* eslint-disable no-unused-vars */
import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAttendance } from '../contexts/AttendanceContext';

import PageLayout from './PageLayout';
import ReportOverview from '../components/report/ReportOverview';
import StatsCards from '../components/report/StatsCards';
import * as XLSX from 'xlsx';
import { Download, Upload } from 'lucide-react';

import { calculateSummary } from '../core/attendance/calculations';
import { getWorkingDays, getDaysInMonth } from '../core/calendar/workingDays';

import {
  getSMTPConfig,
  validateSMTPConfig,
} from '../utils/email/index';

const EMAIL_REPORTS_KEY = "faculty_email_reports";

const getEmailReports = () => ({});

const hasEmailSentToday = (cfmsId) => {
  try {
    const reports = getEmailReports();
    const today = new Date().toDateString();
    if (!reports[cfmsId]) return false;
    return reports[cfmsId].some(
      (report) => report.date === today && report.status === "success"
    );
  } catch {
    return false;
  }
};

const HomePage = () => {
  const navigate = useNavigate();
  const {
    attendanceData,
    handleFileUpload,
    loading,
    error,
    hasData,
    fileName,
    selectedMonth,
    selectedYear,
  } = useAttendance();

  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Download Sample Preferred XLSX Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'CFMS ID': '15071465',
        'Faculty Name': 'Vemuri KrishnaAnila',
        'Department': 'BS&HSS',
        'Designation': 'Assistant Professor',
        'Total Working Days': 24,
        'Biometric Present': 18,
        'Biometric Absent': 6
      },
      {
        'CFMS ID': '1000218038',
        'Faculty Name': 'B.Tirumula Rao',
        'Department': 'IT',
        'Designation': 'Associate Professor',
        'Total Working Days': 24,
        'Biometric Present': 20,
        'Biometric Absent': 4
      },
      {
        'CFMS ID': '15166317',
        'Faculty Name': 'G. Jaya Suma',
        'Department': 'IT',
        'Designation': 'Professor',
        'Total Working Days': 24,
        'Biometric Present': 22,
        'Biometric Absent': 2
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Template');

    XLSX.writeFile(workbook, 'JNTU-GV_Faculty_Biometric_Attendance_Template.xlsx');
  };

  /* ---------------- PERIOD STATS ---------------- */
  const workingDays = useMemo(
    () => (attendanceData.length ? getWorkingDays(attendanceData, selectedMonth, null, selectedYear) : []),
    [attendanceData, selectedMonth, selectedYear]
  );

  const totalDaysInPeriod = useMemo(
    () => getDaysInMonth(selectedMonth, selectedYear),
    [selectedMonth, selectedYear]
  );

  const effectiveWorkingDays = workingDays.length ? workingDays : null;

  const periodStats = useMemo(() => {
    const totalWorkingDays = workingDays.length;
    return {
      totalWorkingDays,
      totalPeriodDays: totalDaysInPeriod,
      workingDayPercentage:
        totalDaysInPeriod > 0
          ? ((totalWorkingDays / totalDaysInPeriod) * 100).toFixed(1)
          : '0.0',
    };
  }, [workingDays, totalDaysInPeriod]);

  /* ---------------- OVERALL STATS ---------------- */
  const overallStats = useMemo(() => {
    if (!attendanceData.length) {
      return {
        totalEmployees: 0,
        averageAttendancePercentage: '0.0',
        averageHoursPerFaculty: '0.0',
      };
    }

    let totalPresent = 0;
    let totalHours = 0;

    attendanceData.forEach((emp) => {
      const summary = calculateSummary(emp, selectedMonth, selectedYear);
      totalPresent += summary.presentDays;
      totalHours += parseFloat(summary.totalHours || 0);
    });

    const denominator =
      attendanceData.length *
      (workingDays.length || totalDaysInPeriod || 1);

    return {
      totalEmployees: attendanceData.length,
      averageAttendancePercentage:
        denominator > 0
          ? ((totalPresent / denominator) * 100).toFixed(1)
          : '0.0',
      averageHoursPerFaculty:
        attendanceData.length > 0
          ? (totalHours / attendanceData.length).toFixed(1)
          : '0.0',
    };
  }, [attendanceData, workingDays, totalDaysInPeriod]);

  /* ---------------- SMTP & EMAIL STATUS ---------------- */
  const isSMTPConfigured = useMemo(() => {
    const config = getSMTPConfig();
    return validateSMTPConfig(config).isValid;
  }, []);

  const employeesWithEmail = useMemo(() => {
    return attendanceData.filter(emp => emp.email && emp.email.includes('@') && emp.email !== 'N/A').length;
  }, [attendanceData]);

  const employeesAlreadySent = useMemo(() => {
    return attendanceData.filter(emp => hasEmailSentToday(emp.cfmsId)).length;
  }, [attendanceData]);

  const bodyContent = (
    <div className="space-y-10 max-w-6xl mx-auto pb-10">

      {/* HERO */}
      <section className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          APFRS Attendance & Leave Finalization Engine
        </h1>
        <p className="text-base text-slate-600 font-medium max-w-2xl mx-auto">
          Analyze faculty biometric records, automatically apply approved On Duty (OD) & Academic Leave (AL) credits, and finalize monthly attendance reports.
        </p>
      </section>

      {/* EMPTY STATE */}
      {!hasData && (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm space-y-4 max-w-2xl mx-auto">
          <div className="bg-indigo-50 p-4 rounded-full text-indigo-600">
            <Upload className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 text-center">No Attendance Biometric Dataset Loaded</h3>
          <p className="text-slate-500 text-xs text-center leading-relaxed">
            Upload an Excel (.xlsx / .csv) sheet containing biometric present days. Approved <strong>OD & AL</strong> duty leaves will automatically credit as Present days.
          </p>

            <Link
              to="/import"
              className="px-6 py-3 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Go to Bulk Import Page</span>
            </Link>
        </div>
      )}

      {hasData && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Link
              to="/import"
              className="px-4 py-2 bg-indigo-50 text-indigo-700 font-bold text-sm rounded-lg hover:bg-indigo-100 transition border border-indigo-200 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Re-Import New Data</span>
            </Link>
          </div>
          <ReportOverview
            periodStats={periodStats}
            overallStats={overallStats}
            facultyData={attendanceData}
            workingDays={effectiveWorkingDays || []}
            isSMTPConfigured={isSMTPConfigured}
            employeesAlreadySent={employeesAlreadySent}
            employeesWithEmail={employeesWithEmail}
            bulkEmailProgress={{}}
            sendingEmail={false}
            onBulkSend={() => navigate('/summary')}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
        </div>
      )}
    </div>
  );

  return <PageLayout Sidebar={null} Body={bodyContent} />;
};

export default HomePage;
