import { persons } from '../../utils/data/faculty';
import { isStaffOnDuty } from '../../utils/data/leaves';
import { parseDurationToHours, estimateHoursFromTimes } from '../calendar/dateUtils';
import { calculateSummary, calculateOverallStats, calculateMonthlyStats } from './calculations';
import { detectMonthFromFileName } from '../../utils/export/file';
import { getWorkingDays, getDaysInMonth } from '../calendar/workingDays';
import { getHolidayLabel, getHolidayType } from '../../config/calendar';

const BASE_FIELD_KEYS = new Set([
  'name',
  'designation',

  'cfmsid',
  'cfms_id',

  'emptype',
  'emp_type',
  'department',
  'email'
]);

const sanitizeHeaderKey = (header, index) => {
  if (!header) return `column_${index + 1}`;
  return (
    header
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || `column_${index + 1}`
  );
};

const findDayColumns = (headerRow, dayPrefix) => {
  if (!headerRow || !Array.isArray(headerRow)) return -1;

  for (let i = 0; i < headerRow.length; i++) {
    const cell = headerRow[i]?.toString() || '';
    const dayPattern = new RegExp(`^${dayPrefix}[^0-9]`);
    if (
      dayPattern.test(cell) ||
      cell.startsWith(dayPrefix + 'In') ||
      cell.startsWith(dayPrefix + 'Out') ||
      cell.startsWith(dayPrefix + 'Status') ||
      cell.startsWith(dayPrefix + 'Duration') ||
      cell === dayPrefix
    ) {
      return i;
    }
  }
  return -1;
};

const detectDaysInMonth = (headerRow) => {
  if (!headerRow || !Array.isArray(headerRow)) return 31;
  let maxDay = 0;
  // Match "01 ", "01-", "01/" etc at the start
  const dayPattern = /^(\d{2})[^0-9]/;

  headerRow.forEach((cell) => {
    const cellStr = cell?.toString() || '';
    const match = cellStr.match(dayPattern);
    if (match) {
      const dayNum = parseInt(match[1], 10);
      if (dayNum > maxDay && dayNum <= 31) {
        maxDay = dayNum;
      }
    } else if (/^\d{2}$/.test(cellStr)) {
      const dayNum = parseInt(cellStr, 10);
      if (dayNum > maxDay && dayNum <= 31) {
        maxDay = dayNum;
      }
    }
  });

  return maxDay > 0 ? maxDay : 31;
};

const buildDayColumnSet = (headerRow, daysInMonth) => {
  const columns = new Set();
  if (!headerRow || !Array.isArray(headerRow)) return columns;

  for (let day = 1; day <= daysInMonth; day++) {
    const dayPrefix = day.toString().padStart(2, '0');
    const baseCol = findDayColumns(headerRow, dayPrefix);
    if (baseCol !== -1) {
      for (let offset = 0; offset < 4; offset++) {
        columns.add(baseCol + offset);
      }
    }
  }

  return columns;
};

const extractAdditionalFields = (row, headerRow, dayColumnSet) => {
  const additionalFields = {};
  const totalColumns = Math.max(row?.length || 0, headerRow?.length || 0);

  for (let col = 0; col < totalColumns; col++) {
    if (col <= 3) continue;
    if (dayColumnSet.has(col)) continue;
    const key = sanitizeHeaderKey(headerRow?.[col], col);
    if (BASE_FIELD_KEYS.has(key)) continue;
    additionalFields[key] = row?.[col] ?? '';
  }

  return additionalFields;
};

const formatTime = (timeValue) => {
  if (!timeValue) return '';
  const timeStr = timeValue.toString().trim();
  if (!timeStr) return '';
  if (timeStr.includes(':')) return timeStr;

  if (!Number.isNaN(Number(timeStr))) {
    const timeNum = parseFloat(timeStr);
    if (timeNum < 1) {
      const totalMinutes = Math.round(timeNum * 24 * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    const hours = Math.floor(timeNum);
    const minutes = Math.round((timeNum - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  return timeStr;
};

export const processAttendanceData = (rawData, monthNumber = null, year = new Date().getFullYear()) => {
  if (!rawData || rawData.length < 3) return [];

  const processed = [];
  const headerRow = rawData[0];
  const daysInMonth = detectDaysInMonth(headerRow);
  const dayColumnSet = buildDayColumnSet(headerRow, daysInMonth);

  // Use detected month if not provided
  const actualMonth = monthNumber || new Date().getMonth() + 1;

  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length < 4) continue;
    if (!row[0] && !row[2]) continue;

    const cfmsId = row[2]?.toString()?.trim() || '';
    const additionalFields = extractAdditionalFields(row, headerRow, dayColumnSet);
    const personInfo = persons.find((person) => person.cfms_id === cfmsId) || {};

    const employee = {
      ...additionalFields,
      name: (row[0] || 'Unknown').toString().trim(),
      designation: (personInfo.designation || row[1] || '').toString().trim(),
      cfmsId,
      empType: (row[3] || '').toString().trim(),
      department: (personInfo.department || 'N/A').toString().trim(),
      email: (personInfo.email || '').toString().trim(),
      attendance: []
    };

    for (let day = 1; day <= daysInMonth; day++) {
      const dayPrefix = day.toString().padStart(2, '0');
      const baseCol = findDayColumns(headerRow, dayPrefix);

      // Check if this day is a holiday or weekend
      const holidayLabel = getHolidayLabel(actualMonth, day, year);
      const holidayType = getHolidayType(actualMonth, day, year);

      const dateObj = new Date(year, actualMonth - 1, day);
      const isSunday = dateObj.getDay() === 0;
      let isSecondSaturday = false;
      if (dateObj.getDay() === 6) {
        let saturdayCount = 0;
        for (let d = 1; d <= day; d++) {
          if (new Date(year, actualMonth - 1, d).getDay() === 6) {
            saturdayCount++;
          }
        }
        isSecondSaturday = saturdayCount === 2;
      }

      if (baseCol !== -1 && baseCol + 3 < row.length) {
        const inTime = formatTime(row[baseCol]);
        const outTime = formatTime(row[baseCol + 1]);
        let rawStatus = (row[baseCol + 2] || '').toString().trim();
        const duration = (row[baseCol + 3] || '').toString().trim();

        // Determine final status based on calendar configuration
        let finalStatus;
        if (holidayType === 'general' || holidayType === 'public') {
          finalStatus = 'H';
        } else if (isSunday || isSecondSaturday) {
          const rawUpper = rawStatus.toUpperCase();
          if (rawUpper === 'P' || rawUpper === 'PRESENT') {
            finalStatus = 'P';
          } else {
            finalStatus = isSunday ? 'Weekend' : 'SS';
          }
        } else if (holidayType === 'optional') {
          let allAbsent = true;
          for (let r = 1; r < rawData.length; r++) {
            const checkRow = rawData[r];
            if (!checkRow || checkRow.length <= baseCol + 2) continue;
            if (!checkRow[0] && !checkRow[2]) continue;
            const checkStatus = (checkRow[baseCol + 2] || '').toString().trim();
            const checkUpper = checkStatus.toUpperCase();
            if (checkUpper === 'P' || checkUpper === 'PRESENT') {
              allAbsent = false;
              break;
            }
          }
          const rawUpper = rawStatus.toUpperCase();
          if (allAbsent && (rawUpper === 'A' || rawUpper === 'ABSENT' || !rawStatus)) {
            finalStatus = 'OH';
          } else {
            finalStatus = (rawUpper === 'P' || rawUpper === 'PRESENT' || rawUpper === 'A' || rawUpper === 'ABSENT') ? rawStatus : holidayLabel;
          }
        } else if (holidayLabel) {
          // If it's a holiday/weekend/second Saturday, check if they actually attended
          const rawUpper = rawStatus.toUpperCase();
          if (rawUpper === 'P' || rawUpper === 'PRESENT') {
            // They came to work on a holiday - mark as Present
            finalStatus = 'P';
          } else {
            // No attendance data - show the holiday label
            if (holidayType === 'sunday') {
              finalStatus = 'Weekend';
            } else if (holidayType === 'second_saturday') {
              finalStatus = 'SS';
            } else {
              finalStatus = holidayLabel; // e.g., "Republic Day", "Diwali"
            }
          }
        } else {
          // On working days, only allow P, A or OD
          const upperStatus = rawStatus.toUpperCase();
          if (upperStatus === 'P' || upperStatus === 'PRESENT') {
            finalStatus = 'P';
          } else if (isStaffOnDuty(cfmsId, year, actualMonth, day)) {
            finalStatus = 'OD';
          } else {
            finalStatus = (upperStatus === 'A' || upperStatus === 'ABSENT') ? 'A' : '';
          }
        }

        let hours = 0;
        if (duration && finalStatus === 'P') {
          hours = parseDurationToHours(duration);
        } else if (finalStatus === 'P' && (inTime || outTime)) {
          hours = estimateHoursFromTimes(inTime, outTime);
        }

        employee.attendance.push({
          day,
          date: dayPrefix,
          inTime,
          outTime,
          status: finalStatus,
          duration,
          hours
        });
      } else {
        // For missing columns, still check if it's a holiday/weekend
        let finalStatus = '';
        if (holidayLabel) {
          if (holidayType === 'sunday') {
            finalStatus = 'Weekend';
          } else if (holidayType === 'second_saturday') {
            finalStatus = 'Second Saturday';
          } else {
            finalStatus = holidayLabel;
          }
        }

        employee.attendance.push({
          day,
          date: dayPrefix,
          inTime: '',
          outTime: '',
          status: finalStatus,
          duration: '',
          hours: 0
        });
      }
    }

    processed.push(employee);
  }

  return processed;
};

export const handleExcelUpload = (rawData, fileName = '', monthNumber = null, year = new Date().getFullYear()) => {
  const actualMonth = monthNumber || detectMonthFromFileName(fileName) || 11;
  const actualYear = year || new Date().getFullYear();

  const attendanceData = processAttendanceData(rawData, actualMonth, actualYear);
  if (!attendanceData || !Array.isArray(attendanceData)) return [];

  return attendanceData.map((employee) => {
    const summary = calculateSummary(employee, actualMonth, actualYear);
    return {
      canSendEmail: true,
      cfmsId: employee.cfmsId,
      name: employee.name,
      designation: employee.designation,
      department: employee.department,
      empType: employee.empType,
      email: employee.email || '',
      emailSentToday: false,
      lastEmailStatus: null,
      attendance: employee.attendance || [],
      summary: {
        ...summary,
        summaryPercentage: Number(summary.attendancePercentage),
        summaryStatus:
          summary.attendancePercentage >= 75
            ? 'Good'
            : summary.attendancePercentage >= 50
              ? 'Average'
              : 'Poor'
      }
    };
  });
};

export const analyzeAttendanceData = (attendanceData, monthNumber = 11, year = new Date().getFullYear()) => {
  if (!attendanceData || !attendanceData.length) {
    return {
      summary: calculateOverallStats([], monthNumber, year),
      dailyStats: [],
      departmentStats: [],
      issues: []
    };
  }

  const overallStats = calculateOverallStats(attendanceData, monthNumber, year);
  const dailyStats = calculateMonthlyStats(attendanceData, monthNumber, year);
  const workingDays = getWorkingDays(attendanceData, monthNumber, null, year);
  const totalDays = getDaysInMonth(attendanceData);

  const departmentMap = new Map();
  attendanceData.forEach((employee) => {
    const dept = employee.department || 'Unknown';
    if (!departmentMap.has(dept)) {
      departmentMap.set(dept, {
        department: dept,
        employees: [],
        totalPresent: 0,
        totalAbsent: 0,
        totalLeave: 0,
        totalHours: 0
      });
    }

    const deptData = departmentMap.get(dept);
    deptData.employees.push(employee.name);
    const summary = calculateSummary(employee, monthNumber, year);
    deptData.totalPresent += summary.presentDays;
    deptData.totalAbsent += summary.absentDays;
    deptData.totalLeave += summary.leaveDays;
    deptData.totalHours += summary.totalHours;
  });

  const departmentStats = Array.from(departmentMap.values()).map((dept) => ({
    ...dept,
    employeeCount: dept.employees.length,
    avgAttendance:
      dept.employees.length > 0
        ? ((dept.totalPresent / (dept.employees.length * (workingDays.length || 1))) * 100).toFixed(1)
        : '0.0'
  }));

  const issues = attendanceData
    .map((employee) => ({ employee, summary: calculateSummary(employee, monthNumber, year) }))
    .filter(({ summary }) => summary.attendancePercentage < 50)
    .map(({ employee, summary }) => ({
      name: employee.name,
      department: employee.department,
      designation: employee.designation,
      attendancePercentage: summary.attendancePercentage,
      presentDays: summary.presentDays,
      absentDays: summary.absentDays,
      workingDays: summary.workingDays
    }));

  return {
    summary: overallStats,
    dailyStats,
    departmentStats,
    issues,
    workingDays: workingDays.length,
    totalHolidays: totalDays - workingDays.length,
    month: monthNumber,
    year
  };
};

export const filterEmployees = (attendanceData, filters = {}) => {
  if (!attendanceData || !filters || Object.keys(filters).length === 0) return attendanceData;

  return attendanceData.filter((employee) => {
    if (filters.department && employee.department !== filters.department) return false;
    if (filters.designation && employee.designation !== filters.designation) return false;
    if (filters.empType && employee.empType !== filters.empType) return false;
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const matches =
        (employee.name && employee.name.toLowerCase().includes(searchLower)) ||
        (employee.cfmsId && employee.cfmsId.toLowerCase().includes(searchLower)) ||
        (employee.department && employee.department.toLowerCase().includes(searchLower)) ||
        (employee.designation && employee.designation.toLowerCase().includes(searchLower));
      if (!matches) return false;
    }
    return true;
  });
};