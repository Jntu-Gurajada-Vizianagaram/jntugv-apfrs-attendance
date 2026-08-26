/**
 * Google Form Response Parser & Converter for JNTU-GV APFRS
 * 
 * Normalizes headers from Google Form CSV/XLSX exports:
 * - CFMS ID / Emp ID
 * - Faculty Name
 * - OD Leaves Count & Dates
 * - AL Leaves Count & Dates
 * - CL Leaves Count & Dates
 * - SL & EL Leaves Count
 */

export const normalizeHeader = (headerStr = '') => {
  return String(headerStr)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');
};

export const parseGoogleFormResponses = (rawRows = []) => {
  if (!Array.isArray(rawRows) || rawRows.length === 0) return [];

  return rawRows.map((row, idx) => {
    // Helper to find value from row using multiple possible key variants
    const getValue = (keyPatterns) => {
      const keys = Object.keys(row);
      for (const pattern of keyPatterns) {
        const matchingKey = keys.find((k) => normalizeHeader(k).includes(pattern));
        if (matchingKey && row[matchingKey] !== undefined && row[matchingKey] !== null) {
          return String(row[matchingKey]).trim();
        }
      }
      return '';
    };

    const cfmsId = getValue(['cfms', 'emp_id', 'employee_id']) || `CFMS_FORM_${idx + 1}`;
    const facultyName = getValue(['name_of_the_faculty', 'faculty_name', 'name', 'full_name']) || `Faculty ${idx + 1}`;
    const department = getValue(['department', 'dept']) || 'General';

    // OD (On Duty)
    const odCountStr = getValue(['od_leaves', 'od_leave', 'od_count', 'ods_taken', 'od']);
    const odCount = Number(odCountStr) || (odCountStr && !isNaN(Number(odCountStr)) ? Number(odCountStr) : 0);
    const odDates = getValue(['dates_of_the_ods', 'dates_of_the_od', 'od_date', 'dates_of_od']);

    // AL (Academic Leave)
    const alCountStr = getValue(['al_leaves', 'al_leave', 'al_count', 'al_taken', 'al']);
    const alCount = Number(alCountStr) || (alCountStr && !isNaN(Number(alCountStr)) ? Number(alCountStr) : 0);
    const alDates = getValue(['dates_of_the_al', 'al_date', 'dates_of_al']);

    // CL (Casual Leave)
    const clCountStr = getValue(['cl_count', 'cl_leaves', 'cl_leave', 'cl_taken', 'cl']);
    const clCount = Number(clCountStr) || (clCountStr && !isNaN(Number(clCountStr)) ? Number(clCountStr) : 0);
    const clDates = getValue(['cl_taken_dates', 'dates_of_the_cl', 'cl_date', 'dates_of_cl']);

    // SL / EL
    const slCountStr = getValue(['special_leaves', 'special_leave', 'sl_count', 'sl']);
    const slCount = Number(slCountStr) || 0;

    const elCountStr = getValue(['earned_leaves', 'earned_leave', 'el_count', 'el']);
    const elCount = Number(elCountStr) || 0;

    return {
      cfmsId,
      facultyName,
      department,
      odCount,
      odDates,
      alCount,
      alDates,
      clCount,
      clDates,
      slCount,
      elCount,
      rawRow: row
    };
  });
};

/**
 * Converts Google Form parsed records into standard Leave Application objects
 */
export const convertGoogleFormToLeaveApplications = (parsedFormRecords = []) => {
  const applications = [];
  const now = new Date().toISOString();

  parsedFormRecords.forEach((rec, idx) => {
    // Convert OD
    if (rec.odCount > 0) {
      applications.push({
        id: `gform_od_${idx}_${Date.now()}`,
        facultyEmail: `${rec.cfmsId}@jntugvcev.edu.in`,
        facultyName: rec.facultyName,
        department: rec.department,
        cfmsId: rec.cfmsId,
        leaveType: 'OD',
        leaveTypeName: 'On Duty Leave (OD)',
        startDate: rec.odDates || 'Current Month',
        endDate: rec.odDates || 'Current Month',
        daysCount: rec.odCount,
        reason: `Google Form Self-Declaration: OD on ${rec.odDates || 'Selected Dates'}`,
        approverEmail: 'principal@jntugvcev.edu.in',
        status: 'APPROVED',
        appliedAt: now,
        actionAt: now,
        remarks: 'Imported via Google Form Response Sheet'
      });
    }

    // Convert AL
    if (rec.alCount > 0) {
      applications.push({
        id: `gform_al_${idx}_${Date.now()}`,
        facultyEmail: `${rec.cfmsId}@jntugvcev.edu.in`,
        facultyName: rec.facultyName,
        department: rec.department,
        cfmsId: rec.cfmsId,
        leaveType: 'AL',
        leaveTypeName: 'Academic Leave (AL)',
        startDate: rec.alDates || 'Current Month',
        endDate: rec.alDates || 'Current Month',
        daysCount: rec.alCount,
        reason: `Google Form Self-Declaration: AL on ${rec.alDates || 'Selected Dates'}`,
        approverEmail: 'principal@jntugvcev.edu.in',
        status: 'APPROVED',
        appliedAt: now,
        actionAt: now,
        remarks: 'Imported via Google Form Response Sheet'
      });
    }

    // Convert CL
    if (rec.clCount > 0) {
      applications.push({
        id: `gform_cl_${idx}_${Date.now()}`,
        facultyEmail: `${rec.cfmsId}@jntugvcev.edu.in`,
        facultyName: rec.facultyName,
        department: rec.department,
        cfmsId: rec.cfmsId,
        leaveType: 'CL',
        leaveTypeName: 'Casual Leave (CL)',
        startDate: rec.clDates || 'Current Month',
        endDate: rec.clDates || 'Current Month',
        daysCount: rec.clCount,
        reason: `Google Form Self-Declaration: CL on ${rec.clDates || 'Selected Dates'}`,
        approverEmail: 'principal@jntugvcev.edu.in',
        status: 'APPROVED',
        appliedAt: now,
        actionAt: now,
        remarks: 'Imported via Google Form Response Sheet'
      });
    }

    // Convert SL
    if (rec.slCount > 0) {
      applications.push({
        id: `gform_sl_${idx}_${Date.now()}`,
        facultyEmail: `${rec.cfmsId}@jntugvcev.edu.in`,
        facultyName: rec.facultyName,
        department: rec.department,
        cfmsId: rec.cfmsId,
        leaveType: 'SL',
        leaveTypeName: 'Special Leave (SL)',
        startDate: 'Current Month',
        endDate: 'Current Month',
        daysCount: rec.slCount,
        reason: 'Google Form Self-Declaration: Special Leave',
        approverEmail: 'principal@jntugvcev.edu.in',
        status: 'APPROVED',
        appliedAt: now,
        actionAt: now,
        remarks: 'Imported via Google Form Response Sheet'
      });
    }

    // Convert EL
    if (rec.elCount > 0) {
      applications.push({
        id: `gform_el_${idx}_${Date.now()}`,
        facultyEmail: `${rec.cfmsId}@jntugvcev.edu.in`,
        facultyName: rec.facultyName,
        department: rec.department,
        cfmsId: rec.cfmsId,
        leaveType: 'EL',
        leaveTypeName: 'Earned Leave (EL)',
        startDate: 'Current Month',
        endDate: 'Current Month',
        daysCount: rec.elCount,
        reason: 'Google Form Self-Declaration: Earned Leave',
        approverEmail: 'principal@jntugvcev.edu.in',
        status: 'APPROVED',
        appliedAt: now,
        actionAt: now,
        remarks: 'Imported via Google Form Response Sheet'
      });
    }
  });

  return applications;
};
