import { getHolidayDays } from '../../config/calendar';

const normalizeMonth = (monthNumber) => {
  if (!monthNumber || Number.isNaN(Number(monthNumber))) return 1;
  const normalized = Number(monthNumber);
  if (normalized < 1 || normalized > 12) return 1;
  return normalized;
};

/**
 * Calculates working days for a given month dynamically using CALENDAR_CONFIG.
 * 
 * @param {number} monthNumber - Month number (1-12)
 * @param {number} totalDaysInMonth - Days in the attendance data (e.g., from Excel)
 * @param {number} year - Year for which to calculate working days
 * @returns {Array<number>} Array of working day numbers (e.g., [1, 2, 4, 5, ...])
 */
export const calculateWorkingDaysFromCalendar = (monthNumber, totalDaysInMonth = 22, year = new Date().getFullYear()) => {
  const normalizedMonth = normalizeMonth(monthNumber);
  const holidayDays = getHolidayDays(normalizedMonth, year);

  const daysInMonthDate = new Date(year, normalizedMonth, 0).getDate();
  const limitDay = Math.min(totalDaysInMonth, daysInMonthDate);

  const workingDays = [];

  for (let day = 1; day <= limitDay; day++) {
    if (holidayDays.includes(day)) continue;
    workingDays.push(day);
  }

  return workingDays;
};

/**
 * Retrieves all holidays for a given month dynamically from CALENDAR_CONFIG.
 * 
 * @param {number} monthNumber - Month number (1-12)
 * @param {number} totalDaysInMonth - Days in the attendance data
 * @param {number} year - Year for which to retrieve holidays
 * @returns {Array<number>} Sorted array of holiday day numbers
 */
export const getHolidays = (monthNumber, totalDaysInMonth = 22, year = new Date().getFullYear()) => {
  const normalizedMonth = normalizeMonth(monthNumber);
  const holidayDays = getHolidayDays(normalizedMonth, year);

  const daysInMonthDate = new Date(year, normalizedMonth, 0).getDate();
  const limitDay = Math.min(totalDaysInMonth, daysInMonthDate);

  return holidayDays.sort((a, b) => a - b).filter((day) => day <= limitDay);
};

export const getDaysInMonth = (monthNumber, year = new Date().getFullYear()) => {
  if (!monthNumber) return 31;
  const normalizedMonth = normalizeMonth(monthNumber);
  return new Date(year, normalizedMonth, 0).getDate();
};

export const getWorkingDays = (attendanceData, monthNumber = 1, totalDaysOverride = null, year = new Date().getFullYear()) => {
  const totalDays = totalDaysOverride || getDaysInMonth(monthNumber, year);
  return calculateWorkingDaysFromCalendar(monthNumber, totalDays, year);
};

export const compareHolidaysWithAttendance = (attendanceData, monthNumber = 1) => {
  if (!attendanceData || !attendanceData.length) return [];

  const totalDays = getDaysInMonth(monthNumber);
  const holidays = getHolidays(monthNumber, totalDays);
  const results = [];

  attendanceData.forEach((employee) => {
    holidays.forEach((dayNumber) => {
      const record = employee.attendance?.[dayNumber - 1];
      results.push({
        name: employee.name || employee.facultyName,
        cfmsId: employee.cfmsId,
        day: dayNumber,
        date: record?.date || `${String(dayNumber).padStart(2, '0')}`,
        status: record?.status || '',
        inTime: record?.inTime || '',
        outTime: record?.outTime || '',
        expectedStatus: 'Holiday'
      });
    });
  });

  return results;
};

export const getDayAttendanceStatus = (attendanceData, dayNumber) => {
  if (!attendanceData || !Array.isArray(attendanceData) || dayNumber < 1) return [];

  return attendanceData.map((employee) => {
    const record = employee.attendance?.[dayNumber - 1];
    return {
      name: employee.name || employee.facultyName,
      cfmsId: employee.cfmsId,
      department: employee.department,
      designation: employee.designation,
      status: record?.status || 'Unknown',
      inTime: record?.inTime || '',
      outTime: record?.outTime || '',
      duration: record?.duration || '',
      hours: record?.hours || 0
    };
  });
};