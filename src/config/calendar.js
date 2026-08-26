// Base Configuration and Custom Holidays
// Context: University faculty & administrators work a 6-day week.
// Only Sundays, 2nd Saturdays, and general public holidays apply.
const BASE_CONFIG = {
  state: "Andhra Pradesh",
  authority: "G.O. Rt. No.2276 GAD (Poll.B) Dept",
  total_general_holidays: 24,
  max_optional_holidays_allowed: 5,
  weekly_offs: {
    sundays: true,
    second_saturdays: true // Ensures 1st, 3rd, 4th, 5th Saturdays remain working days.
  }
};

// Dynamic Authenticated AP Government Higher Education Holiday Engine
// Authority: G.O. Rt. No. 2276 GAD (Poll.B) Dept (AP Higher Education & Universities)
export const getAPGovtHolidaysForYear = (year) => {
  // Base fixed-date AP Govt holidays
  const holidays = [
    // Month 1 - January
    { day: 1, month: 1, label: "New Year's Day", type: "optional" },
    { day: 14, month: 1, label: "Bhogi", type: "general" },
    { day: 15, month: 1, label: "Makara Sankranti", type: "general" },
    { day: 16, month: 1, label: "Kanuma", type: "general" },
    { day: 26, month: 1, label: "Republic Day", type: "general" },

    // Month 4 - April
    { day: 5, month: 4, label: "Babu Jagjivan Ram Jayanti", type: "general" },
    { day: 14, month: 4, label: "Dr. B.R. Ambedkar Jayanti", type: "general" },

    // Month 5 - May
    { day: 1, month: 5, label: "May Day / Buddha Purnima", type: "optional" },

    // Month 8 - August
    { day: 15, month: 8, label: "Independence Day", type: "general" },

    // Month 10 - October
    { day: 2, month: 10, label: "Gandhi Jayanti", type: "general" },

    // Month 11 - November
    { day: 1, month: 11, label: "AP Formation Day", type: "general" },

    // Month 12 - December
    { day: 24, month: 12, label: "Christmas Eve", type: "optional" },
    { day: 25, month: 12, label: "Christmas", type: "general" },
    { day: 26, month: 12, label: "Boxing Day", type: "optional" },
  ];

  // Year-specific Luni-Solar & Hijri Sighting Festival dates per AP GOs
  if (year === 2026) {
    holidays.push(
      { day: 3, month: 2, label: "Shab-E-Barath", type: "optional" },
      { day: 15, month: 2, label: "Maha Sivarathri", type: "general" },
      { day: 3, month: 3, label: "Holi", type: "general" },
      { day: 11, month: 3, label: "Shahadat Hazrath Ali (R.A.)", type: "optional" },
      { day: 13, month: 3, label: "Jamatul Veda", type: "optional" },
      { day: 15, month: 3, label: "Shab-E-Qadar", type: "optional" },
      { day: 19, month: 3, label: "Ugadi", type: "general" },
      { day: 21, month: 3, label: "Eid-ul-Fitr (Ramzan)", type: "general" },
      { day: 27, month: 3, label: "Sri Rama Navami", type: "general" },
      { day: 3, month: 4, label: "Good Friday", type: "general" },
      { day: 20, month: 4, label: "Basava Jayanti", type: "optional" },
      { day: 27, month: 5, label: "Eid-ul-Adha (Bakrid)", type: "general" },
      { day: 3, month: 6, label: "Eid-E-Gadeer", type: "optional" },
      { day: 16, month: 6, label: "Moharram (Optional)", type: "optional" },
      { day: 25, month: 6, label: "Moharram (General)", type: "general" },
      { day: 16, month: 7, label: "Ratha Yatra", type: "optional" },
      { day: 4, month: 8, label: "Arbayein (Chahallum)", type: "optional" },
      { day: 21, month: 8, label: "Vara Lakshmi Vratham", type: "general" },
      { day: 25, month: 8, label: "Milad-un-Nabi", type: "general" },
      { day: 4, month: 9, label: "Sri Krishna Ashtami", type: "general" },
      { day: 14, month: 9, label: "Vinayaka Chavithi", type: "general" },
      { day: 10, month: 10, label: "Mahalaya Amavasya", type: "optional" },
      { day: 18, month: 10, label: "Durgashtami", type: "general" },
      { day: 20, month: 10, label: "Vijaya Dasami", type: "general" },
      { day: 8, month: 11, label: "Deepavali", type: "general" },
      { day: 24, month: 11, label: "Guru Nanak Jayanti", type: "optional" }
    );
  } else if (year === 2025) {
    holidays.push(
      { day: 26, month: 2, label: "Maha Sivarathri", type: "general" },
      { day: 14, month: 3, label: "Holi", type: "general" },
      { day: 30, month: 3, label: "Ugadi", type: "general" },
      { day: 31, month: 3, label: "Eid-ul-Fitr (Ramzan)", type: "general" },
      { day: 6, month: 4, label: "Sri Rama Navami", type: "general" },
      { day: 18, month: 4, label: "Good Friday", type: "general" },
      { day: 7, month: 6, label: "Eid-ul-Adha (Bakrid)", type: "general" },
      { day: 6, month: 7, label: "Moharram", type: "general" },
      { day: 27, month: 8, label: "Vinayaka Chavithi", type: "general" },
      { day: 5, month: 9, label: "Milad-un-Nabi", type: "general" },
      { day: 1, month: 10, label: "Durgashtami", type: "general" },
      { day: 2, month: 10, label: "Vijaya Dasami", type: "general" },
      { day: 20, month: 10, label: "Deepavali", type: "general" }
    );
  } else {
    holidays.push(
      { day: 26, month: 2, label: "Maha Sivarathri", type: "general" },
      { day: 15, month: 3, label: "Holi", type: "general" },
      { day: 25, month: 3, label: "Ugadi", type: "general" },
      { day: 30, month: 3, label: "Eid-ul-Fitr (Ramzan)", type: "general" },
      { day: 5, month: 4, label: "Sri Rama Navami", type: "general" },
      { day: 15, month: 4, label: "Good Friday", type: "general" },
      { day: 10, month: 6, label: "Eid-ul-Adha (Bakrid)", type: "general" },
      { day: 10, month: 7, label: "Moharram", type: "general" },
      { day: 25, month: 8, label: "Vinayaka Chavithi", type: "general" },
      { day: 10, month: 9, label: "Milad-un-Nabi", type: "general" },
      { day: 15, month: 10, label: "Vijaya Dasami", type: "general" },
      { day: 1, month: 11, label: "Deepavali", type: "general" }
    );
  }

  return holidays.map(h => ({ ...h, year }));
};

// Global cache for custom holidays, synced via ManageCalendar
let CUSTOM_HOLIDAYS_CACHE = [];

// Global cache for compensatory leaves, synced via ManageCalendar
let COMPENSATORY_LEAVES_CACHE = [];

// Global cache for holiday adjustments, synced via ManageCalendar
let HOLIDAY_ADJUSTMENTS_CACHE = [];

// Re-generate all year configs (called after any cache update)
const regenerateAllConfigs = () => {
  const START_YEAR = new Date().getFullYear() - 1;
  const END_YEAR = new Date().getFullYear() + 5;
  for (let year = START_YEAR; year <= END_YEAR; year++) {
    CALENDAR_CONFIG[year] = generateYearConfig(year);
  }
};

// Allows the frontend to inject loaded holidays from the API
export const updateCustomHolidaysCache = (holidaysArray) => {
  CUSTOM_HOLIDAYS_CACHE = holidaysArray;
  regenerateAllConfigs();
};

// Allows the frontend to inject loaded compensatory leaves from the API
export const updateCompensatoryLeavesCache = (leavesArray) => {
  COMPENSATORY_LEAVES_CACHE = leavesArray;
  regenerateAllConfigs();
};

// Allows the frontend to inject loaded holiday adjustments from the API
export const updateHolidayAdjustmentsCache = (adjustmentsArray) => {
  HOLIDAY_ADJUSTMENTS_CACHE = adjustmentsArray;
  regenerateAllConfigs();
};

// Generate holidays dynamically for a given year
const generateYearConfig = (year) => {
  const config = { ...BASE_CONFIG, holidays: {} };

  // All API holidays and adjustments for this year
  const allApiHolidaysForYear = CUSTOM_HOLIDAYS_CACHE.filter(h => h.year === year);
  const adjustmentsForYear = HOLIDAY_ADJUSTMENTS_CACHE.filter(
    adj => (adj.originalDate && adj.originalDate.year === year) || (adj.newDate && adj.newDate.year === year)
  );

  // Authenticated base AP Govt holidays for this year
  const baseGovtHolidaysForYear = getAPGovtHolidaysForYear(year);

  let totalPublicCount = 0;
  let totalOptionalCount = 0;
  let totalSundaysCount = 0;
  let totalSecondSatCount = 0;

  for (let month = 1; month <= 12; month++) {
    const daysInMonth = new Date(year, month - 1, 0).getDate();

    // Filter custom holidays injected from API for this specific year and month
    const apiHolidaysForMonth = allApiHolidaysForYear.filter(h => h.month === month);

    // Fallback AP Govt base holidays for this month
    const rawFallbackHolidays = baseGovtHolidaysForYear.filter(h => h.month === month);

    // Filter out fallback holidays that have been adjusted away or overridden by API holidays
    const fallbackHolidays = rawFallbackHolidays.filter(fb => {
      const wasAdjustedAway = adjustmentsForYear.some(adj =>
        adj.originalDate &&
        adj.originalDate.month === month &&
        adj.originalDate.day === fb.day
      );
      if (wasAdjustedAway) return false;

      const hasApiLabelMatch = allApiHolidaysForYear.some(
        apiH => apiH.label && apiH.label.toLowerCase() === fb.label.toLowerCase()
      );
      if (hasApiLabelMatch) return false;

      const hasApiDayMatch = apiHolidaysForMonth.some(apiH => apiH.day === fb.day);
      if (hasApiDayMatch) return false;

      return true;
    });

    // Combine remaining fallback and API holidays
    const combinedHolidaysList = [...fallbackHolidays, ...apiHolidaysForMonth];

    let monthlyHolidays = [...combinedHolidaysList];

    // Inject compensatory leaves as holidays
    const compLeavesForMonth = COMPENSATORY_LEAVES_CACHE.filter(
      cl => cl.compensatoryDate.year === year && cl.compensatoryDate.month === month
    );
    compLeavesForMonth.forEach(cl => {
      const existingIdx = monthlyHolidays.findIndex(h => h.day === cl.compensatoryDate.day);
      if (existingIdx < 0) {
        monthlyHolidays.push({
          day: cl.compensatoryDate.day,
          label: `Compensatory: ${cl.originalHolidayLabel}`,
          type: 'compensatory',
          originalHoliday: cl.originalHolidayLabel,
          originalDate: cl.originalDate
        });
      }
    });

    // Add Sundays and Second Saturdays
    let saturdayCount = 0;
    const actualDaysInMonth = new Date(year, month, 0).getDate();
    for (let day = 1; day <= actualDaysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const isSunday = date.getDay() === 0;
      const isSaturday = date.getDay() === 6;

      if (isSaturday) saturdayCount++;

      const isSecondSaturday = isSaturday && saturdayCount === 2;

      const existingHoliday = monthlyHolidays.find(h => h.day === day);

      if (isSunday && !existingHoliday) {
        monthlyHolidays.push({ day, label: "Weekend", type: "sunday" });
      } else if (isSecondSaturday && !existingHoliday) {
        monthlyHolidays.push({ day, label: "Second Saturday", type: "second_saturday" });
      } else if (existingHoliday) {
        if (isSunday) existingHoliday.note = "Sunday";
        if (isSecondSaturday) existingHoliday.note = "Second Saturday";
      }
    }

    // Accumulate stats
    monthlyHolidays.forEach(h => {
      if (h.type === 'general' || h.type === 'public' || h.type === 'festival') totalPublicCount++;
      if (h.type === 'optional') totalOptionalCount++;
      if (h.type === 'sunday') totalSundaysCount++;
      if (h.type === 'second_saturday') totalSecondSatCount++;
    });

    // Sort by day number for easier reading/processing everywhere else
    config.holidays[month] = monthlyHolidays.sort((a, b) => a.day - b.day);
  }

  config.total_public_holidays = totalPublicCount;
  config.total_optional_holidays = totalOptionalCount;
  config.total_sundays = totalSundaysCount;
  config.total_second_saturdays = totalSecondSatCount;

  return config;
};

// Auto-generate for current year, past year, and next 5 years
const CALENDAR_CONFIG = {};
const START_YEAR = new Date().getFullYear() - 1;
const END_YEAR = new Date().getFullYear() + 5;

for (let year = START_YEAR; year <= END_YEAR; year++) {
  CALENDAR_CONFIG[year] = generateYearConfig(year);
}

// Legacy support for older code expecting HOLIDAYS_BY_MONTH
const HOLIDAYS_BY_MONTH = CALENDAR_CONFIG[new Date().getFullYear()].holidays;

// Color mapping for holiday types
const HOLIDAY_TYPE_COLORS = {
  public: '#ef4444',      // Red for public holidays
  optional: '#f59e0b',    // Amber for optional holidays
  custom: '#8b5cf6',      // Purple for custom events
  academic: '#3b82f6',    // Blue for academic events
  festival: '#ec4899',    // Pink for festivals
  compensatory: '#0d9488', // Teal for compensatory leaves
  other: '#6b7280'        // Gray for other events
};

// Get calendar configuration for a specific year
const getCalendarConfig = (year) => {
  return CALENDAR_CONFIG[year] || null;
};

// Get holidays for a specific year and month
const getHolidaysByMonth = (year, month) => {
  const config = getCalendarConfig(year);
  if (!config || !config.holidays) return [];
  return config.holidays[month] || [];
};

// Helper function to get holiday days as array (for backward compatibility)
const getHolidayDays = (month, year = new Date().getFullYear()) => {
  const holidays = getHolidaysByMonth(year, month);
  return holidays.map(h => h.day);
};

// Helper function to get holiday label
const getHolidayLabel = (month, day, year = new Date().getFullYear()) => {
  const holidays = getHolidaysByMonth(year, month);
  const holiday = holidays.find(h => h.day === day);

  if (holiday) return holiday.label;

  // Check if it's a Sunday
  const date = new Date(year, month - 1, day);
  if (date.getDay() === 0) return 'Sunday';

  return null;
};

// Helper function to get holiday type
const getHolidayType = (month, day, year = new Date().getFullYear()) => {
  const holidays = getHolidaysByMonth(year, month);
  const holiday = holidays.find(h => h.day === day);

  if (holiday) return holiday.type;

  // Check if it's a Sunday
  const date = new Date(year, month - 1, day);
  if (date.getDay() === 0) return 'public';

  return null;
};

// Helper function to get color for holiday type
const getColorForType = (type) => {
  return HOLIDAY_TYPE_COLORS[type] || HOLIDAY_TYPE_COLORS.other;
};

// Get available years
const getAvailableYears = () => {
  return Object.keys(CALENDAR_CONFIG).map(Number).sort((a, b) => b - a);
};

// Get statistics for a year
const getYearStats = (year) => {
  const config = getCalendarConfig(year);
  if (!config) return null;

  return {
    year,
    totalPublicHolidays: config.total_public_holidays,
    totalOptionalHolidays: config.total_optional_holidays,
    totalSundays: config.total_sundays
  };
};

export {
  HOLIDAYS_BY_MONTH,
  CALENDAR_CONFIG,
  HOLIDAY_TYPE_COLORS,
  getCalendarConfig,
  getHolidaysByMonth,
  getHolidayDays,
  getHolidayLabel,
  getHolidayType,
  getColorForType,
  getAvailableYears,
  getYearStats
};