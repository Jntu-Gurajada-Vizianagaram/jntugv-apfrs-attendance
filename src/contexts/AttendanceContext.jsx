/* eslint-disable react-refresh/only-export-components */
/* eslint-disable no-unused-vars */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { handleExcelUpload } from '../core/attendance/processor';
import { processFinalizedAttendance } from '../utils/attendanceCalculator';
import { persons } from '../utils/data/faculty';

const AttendanceContext = createContext();

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};

export const AttendanceProvider = ({ children }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const [fileName, setFileName] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(1); // Default to Jan (1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);
  const [reportsPublished, setReportsPublished] = useState(false);

  const [customHolidays, setCustomHolidays] = useState({});

  // 1. Fetch Approved Leaves from Backend API
  const fetchApprovedLeaves = async () => {
    try {
      const res = await fetch('/api/leaves/pending-approvals');
      if (res.ok) {
        const data = await res.json();
        setApprovedLeaves(data.leaves || []);
        return data.leaves || [];
      }
    } catch (err) {
      console.warn('AttendanceContext: Could not fetch leaves from backend:', err.message);
    }
    return [];
  };

  // 2. Fetch Reports Status
  const fetchReportsStatus = async () => {
    try {
      const res = await fetch('/api/reports/status');
      if (res.ok) {
        const data = await res.json();
        setReportsPublished(data.isPublished);
      }
    } catch (err) {
      console.warn('Could not fetch reports status', err);
    }
  };

  // 3. Initialize dataset
  useEffect(() => {
    const initializeDataset = async () => {
      setLoading(true);
      await fetchReportsStatus();
      const leaves = await fetchApprovedLeaves();

      try {
        const savedData = localStorage.getItem('apfrs_attendance_data');
        const savedFileName = localStorage.getItem('apfrs_filename');
        const savedMonth = localStorage.getItem('apfrs_month');
        const savedYear = localStorage.getItem('apfrs_year');

        if (savedData && savedFileName) {
          const parsedData = JSON.parse(savedData);
          setFileName(savedFileName);
          if (savedMonth) setSelectedMonth(Number(savedMonth));
          if (savedYear) setSelectedYear(Number(savedYear));
          
          // Re-merge with current leaves to ensure they are up to date
          const finalized = processFinalizedAttendance(parsedData, leaves);
          setAttendanceData(finalized);
          setLoading(false);
          setReady(true);
          return;
        }
      } catch (err) {
        console.warn('Error loading attendance from localStorage:', err);
      }

      // No fallback data; just start with an empty dataset
      setAttendanceData([]);
      setLoading(false);
      setReady(true);
    };

    initializeDataset();
  }, []);

  const refreshLeaves = async () => {
    const leaves = await fetchApprovedLeaves();
    if (attendanceData && attendanceData.length > 0) {
      const updated = processFinalizedAttendance(attendanceData, leaves);
      setAttendanceData(updated);
    }
  };

  const handleFileUpload = async (file, rawData, month, year) => {
    if (!file || !rawData) {
      setError('No file or data provided');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📤 Processing uploaded file:', file.name, 'Month:', month);
      let monthNum = month || 1;
      let yearNum = year || new Date().getFullYear();

      // Process raw Excel data
      const processedData = handleExcelUpload(rawData, file.name, monthNum, yearNum);

      if (!processedData || !Array.isArray(processedData) || processedData.length === 0) {
        throw new Error('No valid attendance data found in the file');
      }

      // Merge with current approved leaves
      const leaves = await fetchApprovedLeaves();
      const finalized = processFinalizedAttendance(processedData, leaves);

      setAttendanceData(finalized);
      setFileName(file.name);
      setSelectedMonth(monthNum);
      setSelectedYear(yearNum);

      // Save to localStorage so it survives page refresh
      localStorage.setItem('apfrs_attendance_data', JSON.stringify(processedData));
      localStorage.setItem('apfrs_filename', file.name);
      localStorage.setItem('apfrs_month', String(monthNum));
      localStorage.setItem('apfrs_year', String(yearNum));

      console.log(`📊 Attendance data processed & merged with leaves. Count: ${finalized.length}`);
      return true;

    } catch (err) {
      console.error('❌ Error processing file:', err);
      setError(err.message || 'Failed to process the uploaded file');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const toggleHoliday = (monthIndex, day) => {
    setCustomHolidays(prev => {
      const key = `${monthIndex + 1}-${day}`;
      const newHolidays = { ...prev };

      if (newHolidays[key]) {
        delete newHolidays[key];
      } else {
        newHolidays[key] = 'holiday';
      }

      return newHolidays;
    });
  };

  const resetData = () => {
    setAttendanceData([]);
    setFileName('');
    setSelectedMonth(1);
    setSelectedYear(new Date().getFullYear());
    setError(null);
    setCustomHolidays({});
    localStorage.removeItem('apfrs_attendance_data');
    localStorage.removeItem('apfrs_filename');
    localStorage.removeItem('apfrs_month');
    localStorage.removeItem('apfrs_year');
    console.log('🗑️ Attendance data reset');
  };

  const value = {
    attendanceData,
    approvedLeaves,
    fileName,
    selectedMonth,
    selectedYear,
    customHolidays,
    loading,
    error,
    ready,
    reportsPublished,
    setReportsPublished, // allow toggle from UI
    fetchReportsStatus,
    hasData: attendanceData.length > 0,
    handleFileUpload,
    refreshLeaves,
    resetData,
    toggleHoliday
  };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
};

export default AttendanceProvider;