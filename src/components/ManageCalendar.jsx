import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import {
  getHolidaysByMonth,
  HOLIDAY_TYPE_COLORS,
  getHolidayLabel,
  getHolidayType,
  getColorForType,
  getAvailableYears,
  getYearStats,
  updateCustomHolidaysCache,
  updateCompensatoryLeavesCache,
  updateHolidayAdjustmentsCache
} from '../config/calendar';
import {
  fetchHolidays,
  addHoliday,
  deleteHoliday,
  adjustHolidayDate,
  fetchAdjustments,
  fetchCompensatoryLeaves,
  addCompensatoryLeave,
  deleteCompensatoryLeave,
  fetchWeekendConflicts
} from '../api/holidayService';
import { Trash2, Plus, Calendar as CalendarIcon, Loader2, ArrowRight, AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

const ManageCalendar = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-based (0 = January)
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [activeMonth, setActiveMonth] = useState(currentMonth); // Track visible month
  const [apiHolidays, setApiHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // New Holiday Form State
  const [newHoliday, setNewHoliday] = useState({ label: '', date: '', type: 'general' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Adjustment State
  const [adjustments, setAdjustments] = useState([]);
  const [adjustForm, setAdjustForm] = useState({ holidayId: '', newDate: '', reason: '', goReference: '' });
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [showAdjustSection, setShowAdjustSection] = useState(false);

  // Compensatory Leave State
  const [compLeaves, setCompLeaves] = useState([]);
  const [weekendConflicts, setWeekendConflicts] = useState([]);
  const [compForm, setCompForm] = useState({ conflictIdx: -1, compDate: '', goReference: '' });
  const [isAddingComp, setIsAddingComp] = useState(false);
  const [showCompSection, setShowCompSection] = useState(false);
  const [isLoadingConflicts, setIsLoadingConflicts] = useState(false);

  // 2nd Saturday Academic Duty Comp-Off state
  const [satCompForm, setSatCompForm] = useState({
    selectedSat: '',
    eventType: 'Convocation Ceremony',
    compDate: '',
    goReference: ''
  });
  const [isAddingSatComp, setIsAddingSatComp] = useState(false);
  const [showSatCompForm, setShowSatCompForm] = useState(false);

  // Helper: Get all 2nd Saturdays of the selected academic year
  const secondSaturdays = React.useMemo(() => {
    const list = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let m = 0; m < 12; m++) {
      let satCount = 0;
      const daysInMonth = new Date(selectedYear, m + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        if (new Date(selectedYear, m, d).getDay() === 6) {
          satCount++;
          if (satCount === 2) {
            list.push({ day: d, month: m + 1, year: selectedYear, label: `2nd Sat, ${d} ${monthNames[m]} ${selectedYear}` });
            break;
          }
        }
      }
    }
    return list;
  }, [selectedYear]);

  const handleGrantSatCompLeave = async (e) => {
    e.preventDefault();
    if (!satCompForm.selectedSat || !satCompForm.compDate) {
      alert('Please select an occupied 2nd Saturday and a Compensatory Off date');
      return;
    }
    setIsAddingSatComp(true);
    try {
      const [dayStr, monthStr, yearStr] = satCompForm.selectedSat.split('-');
      const [cYear, cMonth, cDay] = satCompForm.compDate.split('-').map(Number);

      const leavePayload = {
        originalHolidayLabel: `2nd Sat Duty (${satCompForm.eventType})`,
        originalDate: { day: Number(dayStr), month: Number(monthStr), year: Number(yearStr) },
        compensatoryDate: { day: cDay, month: cMonth, year: cYear },
        reason: satCompForm.eventType,
        goReference: satCompForm.goReference || '2nd Saturday Academic Task'
      };

      const newLeave = await addCompensatoryLeave(leavePayload);
      const updatedList = [...compLeaves, newLeave];
      setCompLeaves(updatedList);
      updateCompensatoryLeavesCache(updatedList);
      setSatCompForm({ selectedSat: '', eventType: 'Convocation Ceremony', compDate: '', goReference: '' });
      setShowSatCompForm(false);
    } catch (err) {
      console.error('Failed to grant 2nd Saturday comp leave:', err);
    } finally {
      setIsAddingSatComp(false);
    }
  };

  // Load holidays + compensatory leaves whenever year changes, plus real-time polling for concurrent users
  React.useEffect(() => {
    const loadYearData = async (showSpinner = false) => {
      if (showSpinner) setLoading(true);
      try {
        const [holidaysData, compData, adjData] = await Promise.all([
          fetchHolidays(selectedYear),
          fetchCompensatoryLeaves(selectedYear),
          fetchAdjustments(selectedYear)
        ]);
        setApiHolidays(holidaysData);
        setCompLeaves(compData);
        setAdjustments(adjData);
        updateCustomHolidaysCache(holidaysData);
        updateCompensatoryLeavesCache(compData);
        updateHolidayAdjustmentsCache(adjData);
      } catch (error) {
        console.error("Failed to load calendar data:", error);
      } finally {
        if (showSpinner) setLoading(false);
      }
    };
    
    loadYearData(true);

    // Real-time synchronization for concurrent users (Poll every 10s & sync on tab focus)
    const timer = setInterval(() => loadYearData(false), 10000);
    const onFocus = () => loadYearData(false);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [selectedYear]);

  // Handle adding a holiday
  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!newHoliday.label || !newHoliday.date) return;
    
    setIsSubmitting(true);
    try {
      // Parse the standard YYYY-MM-DD input
      const [year, month, day] = newHoliday.date.split('-').map(Number);
      
      const added = await addHoliday({
        label: newHoliday.label,
        type: newHoliday.type,
        year, month, day
      });
      
      const newList = [...apiHolidays, added];
      setApiHolidays(newList);
      updateCustomHolidaysCache(newList); // Re-render calendar
      
      // Reset form
      setNewHoliday({ label: '', date: '', type: 'general' });
      
      // Navigate to the newly added month if different
      if (year === selectedYear && (month - 1) !== activeMonth) {
         setActiveMonth(month - 1);
      }
      if (year !== selectedYear) {
         setSelectedYear(year);
      }
    } catch (error) {
      alert("Failed to add holiday.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deleting a custom holiday
  const handleDeleteHoliday = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteHoliday(id);
      const newList = apiHolidays.filter(h => h.id !== id);
      setApiHolidays(newList);
      updateCustomHolidaysCache(newList);
    } catch (error) {
      alert("Failed to delete holiday.");
    }
  };

  // Handle adjusting a holiday date
  const handleAdjustHoliday = async (e) => {
    e.preventDefault();
    if (!adjustForm.holidayId || !adjustForm.newDate) return;

    setIsAdjusting(true);
    try {
      const [, newMonth, newDay] = adjustForm.newDate.split('-').map(Number);
      
      const result = await adjustHolidayDate(adjustForm.holidayId, {
        newDay,
        newMonth,
        reason: adjustForm.reason,
        goReference: adjustForm.goReference
      });

      // Update holidays list with the adjusted holiday
      const updatedList = apiHolidays.map(h => 
        h.id === adjustForm.holidayId ? result.holiday : h
      );
      setApiHolidays(updatedList);
      
      // Add the adjustment to history and update cache
      const newAdjustments = [...adjustments, result.adjustment];
      setAdjustments(newAdjustments);

      // Re-generate calendar configs with fresh holiday & adjustment caches
      updateCustomHolidaysCache(updatedList);
      updateHolidayAdjustmentsCache(newAdjustments);
      
      // Reset form
      setAdjustForm({ holidayId: '', newDate: '', reason: '', goReference: '' });
    } catch (error) {
      alert("Failed to adjust holiday date.");
    } finally {
      setIsAdjusting(false);
    }
  };

  // Load weekend conflicts
  const handleLoadConflicts = async () => {
    setIsLoadingConflicts(true);
    try {
      const conflicts = await fetchWeekendConflicts(selectedYear);
      setWeekendConflicts(conflicts);
    } catch (error) {
      console.error("Failed to load weekend conflicts:", error);
    } finally {
      setIsLoadingConflicts(false);
    }
  };

  // Handle adding a compensatory leave
  const handleAddCompLeave = async (conflict) => {
    if (!compForm.compDate) {
      alert("Please select a compensatory leave date.");
      return;
    }

    setIsAddingComp(true);
    try {
      const [year, month, day] = compForm.compDate.split('-').map(Number);
      
      const leave = await addCompensatoryLeave({
        originalHolidayLabel: conflict.label,
        originalDate: conflict.date,
        compensatoryDate: { day, month, year },
        reason: `${conflict.label} ${conflict.conflictLabel}`,
        goReference: compForm.goReference
      });

      const newCompList = [...compLeaves, leave];
      setCompLeaves(newCompList);
      updateCompensatoryLeavesCache(newCompList);
      
      // Refresh weekend conflicts to update "alreadyCompensated" flags
      const conflicts = await fetchWeekendConflicts(selectedYear);
      setWeekendConflicts(conflicts);
      
      // Reset form
      setCompForm({ conflictIdx: -1, compDate: '', goReference: '' });
    } catch (error) {
      alert("Failed to add compensatory leave.");
    } finally {
      setIsAddingComp(false);
    }
  };

  // Handle deleting a compensatory leave
  const handleDeleteCompLeave = async (id) => {
    try {
      await deleteCompensatoryLeave(id);
      const newList = compLeaves.filter(cl => cl.id !== id);
      setCompLeaves(newList);
      updateCompensatoryLeavesCache(newList);
      
      // Refresh weekend conflicts
      if (weekendConflicts.length > 0) {
        const conflicts = await fetchWeekendConflicts(selectedYear);
        setWeekendConflicts(conflicts);
      }
    } catch (error) {
      alert("Failed to delete compensatory leave.");
    }
  };

  // Get public holidays for a specific month and year
  const getPublicHolidaysForMonth = (monthIndex, year) => {
    const month = monthIndex + 1; // Convert to 1-based
    const holidayList = getHolidaysByMonth(year, month);
    return holidayList.map(holiday => ({
      date: new Date(year, monthIndex, holiday.day),
      label: holiday.label,
      type: holiday.type
    }));
  };

  // Check if a date is a public holiday
  const isPublicHoliday = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const holidays = getHolidaysByMonth(year, month);
    return holidays.some(h => h.day === day);
  };

  // Get holiday name for a specific date
  const getHolidayNameForDate = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return getHolidayLabel(month, day, year) || 'Holiday';
  };

  // Get holiday type for a specific date
  const getHolidayTypeForDate = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return getHolidayType(month, day, year);
  };

  // Check if a date is Sunday
  const isSunday = (date) => {
    return date.getDay() === 0;
  };

  // Tile content for calendar with professional badge styling
  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;

    const isHoliday = isPublicHoliday(date);
    const sunday = isSunday(date);
    const holidayType = getHolidayTypeForDate(date);
    const holidayName = isHoliday ? getHolidayNameForDate(date) : '';

    return (
      <div className="w-full flex flex-col items-center gap-1 mt-1 overflow-hidden px-0.5">
        {isHoliday && (
          <div
            className={`w-full text-center px-1.5 py-0.5 rounded-md text-[10px] font-bold truncate leading-tight transition-all shadow-sm ${
              holidayType === 'general' || holidayType === 'festival'
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : holidayType === 'optional'
                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                : holidayType === 'compensatory'
                ? 'bg-teal-100 text-teal-800 border border-teal-200'
                : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
            }`}
            title={`${holidayName} (${holidayType})`}
          >
            {holidayName}
          </div>
        )}
        {sunday && !isHoliday && (
          <span className="text-[10px] font-extrabold text-orange-600 uppercase tracking-wider mt-0.5">
            Sunday
          </span>
        )}
      </div>
    );
  };

  // Tile class name for styling
  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return '';

    const classes = [];
    if (isPublicHoliday(date)) {
      const holidayType = getHolidayTypeForDate(date);
      classes.push(`holiday-${holidayType}`);
    }
    if (isSunday(date)) classes.push('sunday');

    return classes.join(' ');
  };

  // Handle active month change when navigating calendar
  const handleActiveStartDateChange = ({ activeStartDate }) => {
    if (activeStartDate) {
      const newYear = activeStartDate.getFullYear();
      // Only allow navigation to configured years
      if (availableYears.includes(newYear)) {
        setActiveMonth(activeStartDate.getMonth());
        setSelectedYear(newYear);
      }
    }
  };

  // Get holidays for currently visible month and year
  const publicHolidays = getPublicHolidaysForMonth(activeMonth, selectedYear);

  // Get year statistics
  const yearStats = getYearStats(selectedYear);
  const availableYears = getAvailableYears();

  // Format date helper
  const formatDateShort = (dateObj) => {
    if (!dateObj) return '';
    const { day, month, year } = dateObj;
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  // Get adjustable holidays — only current month and previous months (not future)
  // AP GOs for moon-cycle changes are issued around the time of the holiday, not months in advance.
  const nowMonth = new Date().getMonth() + 1; // 1-based
  const nowYear = new Date().getFullYear();

  const adjustableHolidays = apiHolidays
    .filter(h => {
      // Must belong to the selected academic year
      if (h.year !== selectedYear) return false;

      // Must be a public (general), festival, or optional holiday
      if (h.type !== 'general' && h.type !== 'festival' && h.type !== 'optional') return false;

      // For current year: only show current month and previous months
      if (selectedYear === nowYear) return h.month <= nowMonth;

      // For past years: show all
      if (selectedYear < nowYear) return true;

      // For future years: do not show
      return false;
    })
    .sort((a, b) => (a.month !== b.month ? a.month - b.month : a.day - b.day));

  return (
    <div className="manage-calendar-container">
      <style>{`
  :root {
    --bg: #f8fafc;
    --card: #ffffff;
    --border: #e2e8f0;
    --text: #0f172a;
    --muted: #64748b;

    --public: #dc2626;
    --optional: #d97706;
    --sunday: #ea580c;
    --primary: #4f46e5;
    --compensatory: #0d9488;
  }

  body {
    background: var(--bg);
  }

  .manage-calendar-container {
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 0;
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media (min-width: 1024px) {
    .calendar-grid {
      grid-template-columns: minmax(0, 1fr) 380px;
    }
  }

  @media (min-width: 1280px) {
    .calendar-grid {
      grid-template-columns: minmax(0, 1fr) 420px;
    }
  }

  .calendar-section,
  .sidebar-section,
  .legend-section {
    background: var(--card);
    border-radius: 16px;
    padding: 1.5rem;
    border: 1px solid var(--border);
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.03);
  }

  /* ================= CALENDAR ================= */

  .react-calendar {
    width: 100%;
    border: none;
    font-family: inherit;
    background: transparent;
  }

  .react-calendar__navigation {
    margin-bottom: 1rem;
    height: 44px;
  }

  .react-calendar__navigation button {
    font-weight: 700;
    font-size: 1rem;
    color: var(--text);
    border-radius: 10px;
    padding: 6px 12px;
  }

  .react-calendar__navigation button:hover {
    background: #f1f5f9;
  }

  .react-calendar__month-view__weekdays {
    font-size: 0.75rem;
    color: var(--muted);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding-bottom: 0.5rem;
  }

  .react-calendar__month-view__days {
    display: grid !important;
    grid-template-columns: repeat(7, 1fr) !important;
    gap: 6px !important;
    padding-top: 4px;
  }

  .react-calendar__month-view__days__day--neighboringMonth {
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
  }

  .react-calendar__tile {
    margin-inline-start: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    min-height: 80px;
    height: 84px;
    border: 1px solid #e2e8f0 !important;
    border-radius: 12px !important;
    font-weight: 700;
    font-size: 0.95rem;
    color: var(--text);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    padding: 6px 4px !important;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    position: relative;
    background: #ffffff;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.02);
  }

  .react-calendar__tile:hover {
    background: #f8fafc;
    border-color: #cbd5e1 !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px -2px rgba(0, 0, 0, 0.06);
  }

  .react-calendar__tile--now {
    border: 2px solid #f59e0b !important;
    background: #fffbeb !important;
    color: #92400e !important;
    font-weight: 800;
    box-shadow: 0 2px 6px -1px rgba(245, 158, 11, 0.2);
  }

  .react-calendar__tile--now::after {
    content: 'TODAY';
    position: absolute;
    top: 2px;
    right: 3px;
    font-size: 0.45rem;
    font-weight: 800;
    background: #f59e0b;
    color: #ffffff;
    padding: 1px 3px;
    border-radius: 3px;
    letter-spacing: 0.05em;
  }

  .react-calendar__tile--active {
    border: 2px solid #4f46e5 !important;
    background: #eef2ff !important;
    color: #3730a3 !important;
    box-shadow: 0 2px 6px -1px rgba(79, 70, 229, 0.2);
  }

  /* ================= TILE MARKERS ================= */

  .tile-content {
    display: flex;
    gap: 4px;
    margin-top: 4px;
  }

  .holiday-indicator,
  .sunday-indicator {
    width: 6px;
    height: 6px;
    border-radius: 999px;
  }

  .holiday-public .holiday-indicator {
    background: var(--public);
  }

  .holiday-optional .holiday-indicator {
    background: var(--optional);
  }

  .sunday .sunday-indicator {
    background: var(--sunday);
  }

  .holiday-compensatory .holiday-indicator {
    background: var(--compensatory);
  }

  /* ================= TILE STATES ================= */

  .holiday-public {
    color: var(--public) !important;
  }

  .holiday-optional {
    color: var(--optional) !important;
  }

  .sunday {
    color: var(--sunday) !important;
  }

  .holiday-compensatory {
    color: var(--compensatory) !important;
    background: #f0fdfa !important;
  }

  /* ================= SIDEBAR ================= */

  .sidebar-title {
    font-size: 0.95rem;
    font-weight: 800;
    margin-bottom: 1rem;
    color: var(--text);
  }

  .holiday-list {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    max-height: 310px;
    overflow-y: auto;
    padding-right: 0.375rem;
  }
  
  /* Custom Scrollbar for holiday list */
  .holiday-list::-webkit-scrollbar {
    width: 6px;
  }
  
  .holiday-list::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .holiday-list::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 20px;
  }

  .holiday-item {
    padding: 0.75rem;
    border-radius: 10px;
    background: #f8fafc;
    border-left: 4px solid var(--primary);
  }

  .holiday-date {
    font-size: 0.7rem;
    color: var(--muted);
    font-weight: 700;
    margin-bottom: 0.25rem;
  }

  .holiday-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text);
  }

  .type-badge {
    margin-top: 6px;
    font-size: 0.65rem;
    padding: 2px 8px;
    border-radius: 999px;
    font-weight: 700;
    text-transform: uppercase;
    border: 1px solid currentColor;
  }

  /* ================= LEGEND ================= */

  .legend-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    color: var(--muted);
    font-weight: 600;
  }

  .legend-color {
    width: 10px;
    height: 10px;
    border-radius: 999px;
  }

  /* ================= COLLAPSIBLE SECTIONS ================= */

  .section-toggle {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    margin-bottom: 0.75rem;
  }

  .section-toggle:hover .sidebar-title {
    color: var(--primary);
  }

  /* ================= ADJUSTMENT SECTION ================= */

  .adjustment-card {
    padding: 0.625rem;
    border-radius: 10px;
    background: #fef3c7;
    border-left: 4px solid #f59e0b;
    margin-bottom: 0.5rem;
  }

  .adjustment-card .adj-label {
    font-size: 0.8rem;
    font-weight: 700;
    color: #92400e;
  }

  .adjustment-card .adj-dates {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: #78350f;
    margin-top: 0.25rem;
  }

  .adjustment-card .adj-old {
    text-decoration: line-through;
    opacity: 0.6;
  }

  .adjustment-card .adj-go {
    font-size: 0.65rem;
    color: #a16207;
    margin-top: 0.25rem;
    font-style: italic;
  }

  /* ================= CONFLICT SECTION ================= */

  .conflict-card {
    padding: 0.75rem;
    border-radius: 10px;
    background: #fff7ed;
    border-left: 4px solid #f97316;
    margin-bottom: 0.75rem;
  }

  .conflict-card.compensated {
    background: #f0fdfa;
    border-left-color: var(--compensatory);
    opacity: 0.7;
  }

  .conflict-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .conflict-label {
    font-size: 0.85rem;
    font-weight: 700;
    color: #9a3412;
  }

  .conflict-card.compensated .conflict-label {
    color: #115e59;
  }

  .conflict-type {
    font-size: 0.65rem;
    padding: 2px 6px;
    border-radius: 999px;
    font-weight: 700;
    background: #fed7aa;
    color: #9a3412;
    white-space: nowrap;
  }

  .conflict-card.compensated .conflict-type {
    background: #ccfbf1;
    color: #115e59;
  }

  .conflict-date {
    font-size: 0.7rem;
    color: #78350f;
    font-weight: 600;
    margin-top: 0.25rem;
  }

  .conflict-card.compensated .conflict-date {
    color: #0f766e;
  }

  .comp-form {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px dashed #fdba74;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  /* ================= COMPENSATORY LEAVES LIST ================= */

  .comp-leave-card {
    padding: 0.625rem;
    border-radius: 10px;
    background: #f0fdfa;
    border-left: 4px solid var(--compensatory);
    margin-bottom: 0.5rem;
  }

  .comp-leave-label {
    font-size: 0.8rem;
    font-weight: 700;
    color: #115e59;
  }

  .comp-leave-mapping {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: #0f766e;
    margin-top: 0.25rem;
  }

  .comp-leave-go {
    font-size: 0.65rem;
    color: #5eead4;
    margin-top: 0.25rem;
    font-style: italic;
  }

  /* ================= FORM INPUTS ================= */
  .mc-input {
    padding: 0.375rem 0.625rem;
    font-size: 0.8rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    outline: none;
    transition: all 0.15s;
    width: 100%;
    box-sizing: border-box;
  }

  .mc-input:focus {
    border-color: #818cf8;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  .mc-select {
    padding: 0.375rem 0.625rem;
    font-size: 0.8rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    outline: none;
    transition: all 0.15s;
    width: 100%;
    box-sizing: border-box;
    background: white;
  }

  .mc-select:focus {
    border-color: #818cf8;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  .mc-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    font-size: 0.8rem;
    font-weight: 600;
    border-radius: 0.5rem;
    border: none;
    cursor: pointer;
    transition: all 0.15s;
  }

  .mc-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .mc-btn-primary {
    background: var(--primary);
    color: white;
  }

  .mc-btn-primary:hover:not(:disabled) {
    background: #4338ca;
  }

  .mc-btn-teal {
    background: var(--compensatory);
    color: white;
  }

  .mc-btn-teal:hover:not(:disabled) {
    background: #0f766e;
  }

  .mc-btn-amber {
    background: #f59e0b;
    color: white;
  }

  .mc-btn-amber:hover:not(:disabled) {
    background: #d97706;
  }

  .mc-btn-outline {
    background: white;
    color: var(--muted);
    border: 1px solid var(--border);
  }

  .mc-btn-outline:hover:not(:disabled) {
    background: #f1f5f9;
    color: var(--text);
  }
`}</style>

      {/* Main Grid */}
      <div className="calendar-grid">
        {/* Calendar */}
        <div className="calendar-section">
          {/* Year Selector & Stats Control Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Academic Year:</span>
              <div className="inline-flex p-1 bg-slate-200/80 rounded-xl">
                {availableYears.map(year => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(Number(year))}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      selectedYear === Number(year)
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            {/* Year Stats Chips */}
            {yearStats && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-200/80 rounded-lg shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span className="text-xs font-bold text-rose-800">Public: {yearStats.totalPublicHolidays}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200/80 rounded-lg shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="text-xs font-bold text-amber-800">Optional: {yearStats.totalOptionalHolidays}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200/80 rounded-lg shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  <span className="text-xs font-bold text-indigo-800">Sundays: {yearStats.totalSundays}</span>
                </div>
                {compLeaves.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 border border-teal-200/80 rounded-lg shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                    <span className="text-xs font-bold text-teal-800">Comp-Offs: {compLeaves.length}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {loading ? (
             <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
          ) : (
             <Calendar
               activeStartDate={new Date(selectedYear, activeMonth, 1)}
               onActiveStartDateChange={handleActiveStartDateChange}
               tileContent={tileContent}
               tileClassName={tileClassName}
               showNeighboringMonth={true}
               minDetail="month"
               defaultView="month"
               minDate={new Date(Math.min(...availableYears), 0, 1)}
               maxDate={new Date(Math.max(...availableYears), 11, 31)}
               prev2Label={null}
               next2Label={null}
               className="rounded-xl border-none font-sans"
             />
          )}
        </div>

        {/* Sidebar */}
        <div>
          {/* Public Holidays */}
          <div className="sidebar-section">
            <h3 className="sidebar-title">
              🎉 {new Date(selectedYear, activeMonth).toLocaleDateString('en-US', { month: 'long' })} {selectedYear} Holidays ({publicHolidays.length})
            </h3>
            <div className="holiday-list">
              {publicHolidays.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>
                  No public holidays this month.
                </p>
              ) : (
                publicHolidays.map((holiday, idx) => (
                  <div
                    key={`${holiday.date.toISOString()}-${holiday.label}-${idx}`}
                    className="holiday-item"
                    style={{ borderLeftColor: getColorForType(holiday.type) }}
                  >
                    <div className="holiday-date">
                      {holiday.date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    
                    <div className="flex justify-between items-start">
                      <div className="holiday-name">
                        {holiday.label}
                        <br/>
                        <span
                          className="type-badge inline-block"
                          style={{
                            backgroundColor: `${getColorForType(holiday.type)}20`,
                            color: getColorForType(holiday.type),
                            border: `1px solid ${getColorForType(holiday.type)}`
                          }}
                        >
                          {holiday.type}
                        </span>
                      </div>
                      
                      {/* Show delete button if it's a custom holiday tracked by API */}
                      {apiHolidays.find(h => h.label === holiday.label && h.day === holiday.date.getDate()) && (
                        <button 
                          onClick={(e) => handleDeleteHoliday(apiHolidays.find(h => h.label === holiday.label && h.day === holiday.date.getDate()).id, e)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove custom holiday"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add Custom Holiday Admin Form */}
          <div className="sidebar-section mt-4">
             <h3 className="sidebar-title flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" /> Add Custom Holiday
             </h3>
             <form onSubmit={handleAddHoliday} className="flex flex-col gap-3">
                <input 
                  type="text" 
                  required
                  placeholder="Holiday Name (e.g. Diwali)" 
                  value={newHoliday.label}
                  onChange={e => setNewHoliday({...newHoliday, label: e.target.value})}
                  className="mc-input"
                />
                <input 
                  type="date" 
                  required
                  value={newHoliday.date}
                  onChange={e => setNewHoliday({...newHoliday, date: e.target.value})}
                  className="mc-input"
                />
                <select 
                  value={newHoliday.type}
                  onChange={e => setNewHoliday({...newHoliday, type: e.target.value})}
                  className="mc-select"
                >
                   <option value="general">General (Public)</option>
                   <option value="optional">Optional</option>
                   <option value="festival">Festival</option>
                   <option value="custom">Custom Event</option>
                </select>
                
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="mc-btn mc-btn-primary w-full mt-1"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {isSubmitting ? 'Adding...' : 'Add Holiday'}
                </button>
             </form>
          </div>

          {/* ============ ADJUST HOLIDAY DATE SECTION ============ */}
          <div className="sidebar-section mt-4">
            <button 
              className="section-toggle"
              onClick={() => setShowAdjustSection(!showAdjustSection)}
            >
              <h3 className="sidebar-title flex items-center gap-2" style={{ marginBottom: 0 }}>
                🔄 Adjust Holiday Date
              </h3>
              {showAdjustSection ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showAdjustSection && (
              <div>
                <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                  Shift holiday dates when AP Govt issues a GO for moon-cycle changes (Eid, Bakrid, Moharram, etc.)
                </p>

                <form onSubmit={handleAdjustHoliday} className="flex flex-col gap-3">
                  <select
                    value={adjustForm.holidayId}
                    onChange={e => setAdjustForm({...adjustForm, holidayId: e.target.value})}
                    className="mc-select"
                    required
                  >
                    <option value="">Select holiday to adjust...</option>
                    {adjustableHolidays.map(h => (
                      <option key={h.id} value={h.id}>
                        {h.label} ({h.day}/{h.month}/{h.year})
                      </option>
                    ))}
                  </select>

                  <input
                    type="date"
                    required
                    value={adjustForm.newDate}
                    onChange={e => setAdjustForm({...adjustForm, newDate: e.target.value})}
                    className="mc-input"
                    placeholder="New date"
                  />

                  <input
                    type="text"
                    value={adjustForm.goReference}
                    onChange={e => setAdjustForm({...adjustForm, goReference: e.target.value})}
                    className="mc-input"
                    placeholder="GO Reference (e.g. G.O. Rt. No.2276)"
                  />

                  <input
                    type="text"
                    value={adjustForm.reason}
                    onChange={e => setAdjustForm({...adjustForm, reason: e.target.value})}
                    className="mc-input"
                    placeholder="Reason (e.g. Moon sighting - Eid shifted)"
                  />

                  <button
                    type="submit"
                    disabled={isAdjusting || !adjustForm.holidayId || !adjustForm.newDate}
                    className="mc-btn mc-btn-amber w-full"
                  >
                    {isAdjusting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    {isAdjusting ? 'Adjusting...' : 'Adjust Date'}
                  </button>
                </form>

                {/* Adjustment History */}
                {adjustments.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                      Adjustment History ({adjustments.length})
                    </p>
                    {adjustments.map(adj => (
                      <div key={adj.id} className="adjustment-card">
                        <div className="adj-label">{adj.holidayLabel}</div>
                        <div className="adj-dates">
                          <span className="adj-old">{formatDateShort(adj.originalDate)}</span>
                          <ArrowRight className="w-3 h-3" style={{ flexShrink: 0 }} />
                          <span style={{ fontWeight: 700 }}>{formatDateShort(adj.newDate)}</span>
                        </div>
                        {adj.goReference && <div className="adj-go">{adj.goReference}</div>}
                        {adj.reason && <div className="adj-go">{adj.reason}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ============ COMPENSATORY LEAVES SECTION ============ */}
          <div className="sidebar-section mt-4">
            <button 
              className="section-toggle"
              onClick={() => setShowCompSection(!showCompSection)}
            >
              <h3 className="sidebar-title flex items-center gap-2" style={{ marginBottom: 0 }}>
                🔁 Compensatory Leaves
              </h3>
              {showCompSection ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showCompSection && (
              <div>
                <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                  When a public holiday falls on a Sunday or 2nd Saturday, grant a compensatory leave on a nearby working day.
                </p>

                {/* Detect Weekend Conflicts Button */}
                <button
                  onClick={handleLoadConflicts}
                  disabled={isLoadingConflicts}
                  className="mc-btn mc-btn-outline w-full"
                  style={{ marginBottom: '0.75rem' }}
                >
                  {isLoadingConflicts ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                  {isLoadingConflicts ? 'Scanning...' : 'Detect Weekend Conflicts'}
                </button>

                {/* Weekend Conflicts List */}
                {weekendConflicts.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9a3412', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                      Weekend Conflicts ({weekendConflicts.filter(c => !c.alreadyCompensated).length} unresolved)
                    </p>
                    
                    {weekendConflicts.map((conflict, idx) => (
                      <div 
                        key={`${conflict.holidayId}-${idx}`}
                        className={`conflict-card ${conflict.alreadyCompensated ? 'compensated' : ''}`}
                      >
                        <div className="conflict-header">
                          <div>
                            <div className="conflict-label">{conflict.label}</div>
                            <div className="conflict-date">
                              {formatDateShort(conflict.date)} · {conflict.conflictLabel}
                            </div>
                          </div>
                          <span className="conflict-type">
                            {conflict.alreadyCompensated ? '✓ Compensated' : conflict.conflictType === 'sunday' ? 'SUN' : '2nd SAT'}
                          </span>
                        </div>

                        {/* Compensatory leave form for unresolved conflicts */}
                        {!conflict.alreadyCompensated && (
                          <div className="comp-form">
                            {compForm.conflictIdx === idx ? (
                              <>
                                <input
                                  type="date"
                                  value={compForm.compDate}
                                  onChange={e => setCompForm({...compForm, compDate: e.target.value})}
                                  className="mc-input"
                                  placeholder="Compensatory date"
                                />
                                <input
                                  type="text"
                                  value={compForm.goReference}
                                  onChange={e => setCompForm({...compForm, goReference: e.target.value})}
                                  className="mc-input"
                                  placeholder="GO Reference (optional)"
                                />
                                <div style={{ display: 'flex', gap: '0.375rem' }}>
                                  <button
                                    onClick={() => handleAddCompLeave(conflict)}
                                    disabled={isAddingComp || !compForm.compDate}
                                    className="mc-btn mc-btn-teal"
                                    style={{ flex: 1 }}
                                  >
                                    {isAddingComp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                                    Grant
                                  </button>
                                  <button
                                    onClick={() => setCompForm({ conflictIdx: -1, compDate: '', goReference: '' })}
                                    className="mc-btn mc-btn-outline"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </>
                            ) : (
                              <button
                                onClick={() => {
                                  // Pre-fill with suggested date
                                  const sg = conflict.suggestedCompDate;
                                  const suggestedStr = sg 
                                    ? `${sg.year}-${String(sg.month).padStart(2, '0')}-${String(sg.day).padStart(2, '0')}`
                                    : '';
                                  setCompForm({ conflictIdx: idx, compDate: suggestedStr, goReference: '' });
                                }}
                                className="mc-btn mc-btn-teal w-full"
                                style={{ fontSize: '0.72rem' }}
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Assign Compensatory Leave
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {weekendConflicts.length === 0 && !isLoadingConflicts && (
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', padding: '0.5rem 0' }}>
                    Click above to scan for weekend conflicts.
                  </p>
                )}

                {/* 2nd Saturday Academic Duty Comp-Off Grantor */}
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <button
                    onClick={() => setShowSatCompForm(!showSatCompForm)}
                    className="flex items-center justify-between w-full text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100/80 p-2.5 rounded-lg transition-colors border border-teal-200"
                  >
                    <span className="flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      Grant 2nd Saturday Duty Comp-Off
                    </span>
                    {showSatCompForm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showSatCompForm && (
                    <form onSubmit={handleGrantSatCompLeave} className="mt-3 space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <p className="text-[11px] font-semibold text-slate-600">
                        Applicable when 2nd Saturday is occupied by academic/emergency events (Convocation, Special Meetings, Planned Duty).
                      </p>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Occupied 2nd Saturday:</label>
                        <select
                          value={satCompForm.selectedSat}
                          onChange={e => setSatCompForm({ ...satCompForm, selectedSat: e.target.value })}
                          className="mc-select text-xs"
                          required
                        >
                          <option value="">-- Select 2nd Saturday --</option>
                          {secondSaturdays.map(sat => (
                            <option key={`${sat.day}-${sat.month}-${sat.year}`} value={`${sat.day}-${sat.month}-${sat.year}`}>
                              {sat.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Academic Event / Task Type:</label>
                        <select
                          value={satCompForm.eventType}
                          onChange={e => setSatCompForm({ ...satCompForm, eventType: e.target.value })}
                          className="mc-select text-xs"
                        >
                          <option value="Convocation Ceremony">🎓 Convocation Ceremony</option>
                          <option value="Emergency Meeting">🚨 Emergency Meeting</option>
                          <option value="University Examination Duty">📝 University Examination Duty</option>
                          <option value="NAAC / NBA Inspection Work">🔬 NAAC / NBA / Inspection Work</option>
                          <option value="Academic Event / Task">🏛️ Academic / Planned Task</option>
                          <option value="Non-Academic Special Duty">💼 Non-Academic Special Duty</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Compensatory Off Date:</label>
                        <input
                          type="date"
                          value={satCompForm.compDate}
                          onChange={e => setSatCompForm({ ...satCompForm, compDate: e.target.value })}
                          className="mc-input text-xs"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Circular / GO Reference (Optional):</label>
                        <input
                          type="text"
                          value={satCompForm.goReference}
                          onChange={e => setSatCompForm({ ...satCompForm, goReference: e.target.value })}
                          className="mc-input text-xs"
                          placeholder="e.g. Proc. No. JNTUGV/COMP/2026"
                        />
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="submit"
                          disabled={isAddingSatComp || !satCompForm.selectedSat || !satCompForm.compDate}
                          className="mc-btn mc-btn-teal flex-1"
                        >
                          {isAddingSatComp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                          Grant Comp-Off
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowSatCompForm(false)}
                          className="mc-btn mc-btn-outline"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Active Compensatory Leaves */}
                {compLeaves.length > 0 && (
                  <div>
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#115e59', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', marginTop: '0.5rem' }}>
                      Active Compensatory Leaves ({compLeaves.length})
                    </p>
                    {compLeaves.map(cl => (
                      <div key={cl.id} className="comp-leave-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div className="comp-leave-label">{cl.originalHolidayLabel}</div>
                            <div className="comp-leave-mapping">
                              <span style={{ opacity: 0.7 }}>{formatDateShort(cl.originalDate)}</span>
                              <ArrowRight className="w-3 h-3" style={{ flexShrink: 0 }} />
                              <span style={{ fontWeight: 700 }}>{formatDateShort(cl.compensatoryDate)}</span>
                            </div>
                            {cl.goReference && <div className="comp-leave-go">{cl.goReference}</div>}
                          </div>
                          <button
                            onClick={() => handleDeleteCompLeave(cl.id)}
                            className="p-1 text-teal-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove compensatory leave"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ManageCalendar;
