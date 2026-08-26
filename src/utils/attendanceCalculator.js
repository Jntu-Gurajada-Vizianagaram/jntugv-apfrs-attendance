/**
 * Attendance Finalization Engine with Approved Leave Adjustments
 * 
 * Rules:
 * 1. On Duty (OD) & Academic Leave (AL):
 *    - NOT counted as absences or leaves.
 *    - Counted as PRESENT ON OFFICIAL/ACADEMIC DUTY.
 *    - Final Present = Biometric Present + Approved OD Days + Approved AL Days.
 * 
 * 2. Casual Leave (CL), Special Leave (SL/SPCL), & Earned Leave (EL):
 *    - Counted as APPROVED LEAVES (Absences from physical attendance).
 *    - Maintained under Approved Leaves breakdown.
 */

export const processFinalizedAttendance = (biometricRecords = [], approvedLeaves = []) => {
  return biometricRecords.map((record) => {
    const cfmsId = String(record.cfms_id || record.cfmsId || record['CFMS ID'] || record['Emp ID'] || '').trim();
    const email = String(record.email || record['Email'] || '').trim().toLowerCase();

    // Find all APPROVED leave applications for this faculty member
    const facultyApprovedLeaves = approvedLeaves.filter((l) => {
      if (l.status !== 'APPROVED') return false;
      const matchCfms = cfmsId && l.cfmsId && String(l.cfmsId).trim() === cfmsId;
      const matchEmail = email && l.facultyEmail && String(l.facultyEmail).trim().toLowerCase() === email;
      return matchCfms || matchEmail;
    });

    let odDays = 0;
    let alDays = 0;
    let vlDays = 0; // Winter / Pongal Vacation Credit
    let clDays = 0;
    let slDays = 0;
    let elDays = 0;

    facultyApprovedLeaves.forEach((leave) => {
      const days = Number(leave.daysCount) || 1;
      const type = String(leave.leaveType || '').toUpperCase();

      if (type === 'OD') {
        odDays += days;
      } else if (type === 'AL') {
        alDays += days;
      } else if (type === 'VL' || type === 'VACATION' || type === 'PONGAL') {
        vlDays += days;
      } else if (type === 'CL') {
        clDays += days;
      } else if (type === 'SL' || type === 'SPCL') {
        slDays += days;
      } else if (type === 'EL') {
        elDays += days;
      }
    });

    const totalWorkingDays = Number(
      record.totalWorkingDays ||
      record.workingDays ||
      record.summary?.workingDays ||
      record['Total Working Days'] ||
      record['Total Days']
    ) || 22;

    const rawBiometricPresent = Number(
      record.biometricPresent ||
      record.presentDays ||
      record.summary?.presentDays ||
      record['Present Days'] ||
      record['Biometric Present']
    ) || 0;

    const rawBiometricAbsent = Number(
      record.biometricAbsent ||
      record.absentDays ||
      record.summary?.absentDays ||
      record['Absent Days'] ||
      record['Biometric Absent']
    ) || Math.max(0, totalWorkingDays - rawBiometricPresent);

    // OD, AL & VL (Pongal Winter Vacation Credit) are credited as Present
    const dutyCreditDays = odDays + alDays + vlDays;
    const finalCalculatedPresent = Math.min(totalWorkingDays, rawBiometricPresent + dutyCreditDays);

    // CL, SL, EL are counted as Approved Leaves
    const approvedLeaveDays = clDays + slDays + elDays;
    const unapprovedAbsences = Math.max(0, rawBiometricAbsent - dutyCreditDays - approvedLeaveDays);

    const finalAttendancePercent = Number(((finalCalculatedPresent / totalWorkingDays) * 100).toFixed(1));
    const isCompliant = finalAttendancePercent >= 75;

    return {
      ...record,
      cfmsId: cfmsId || 'N/A',
      facultyName: record.name || record.facultyName || record['Name'] || record['Faculty Name'] || 'Faculty Member',
      department: record.department || record['Department'] || 'General',
      designation: record.designation || record['Designation'] || 'Faculty',
      totalWorkingDays,
      rawBiometricPresent,
      rawBiometricAbsent,
      // Duty Credits (Added to Present)
      odDays,
      alDays,
      dutyCreditDays,
      // Approved Leaves (Counted as Leaves)
      clDays,
      slDays,
      elDays,
      approvedLeaveDays,
      unapprovedAbsences,
      // Final Computed Totals
      finalCalculatedPresent,
      finalAttendancePercent,
      isCompliant,
      statusLabel: isCompliant ? 'COMPLIANT (≥75%)' : 'DEFICIENT (<75%)'
    };
  });
};
