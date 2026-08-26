/**
 * Staff OD Leaves
 * 
 * This file contains the records of OD leaves for JNTU-GV faculty.
 * Format: { cfms_id: string, dates: string[], name: string }
 * Dates are in YYYY-MM-DD format.
 */

export const OD_LEAVES = [];

export const isStaffOnDuty = (cfmsId, year, month, day) => {
    if (!cfmsId) return false;
    
    // Format the date for comparison
    const targetDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    const staffLeaves = OD_LEAVES.find(leaf => leaf.cfms_id === cfmsId);
    if (!staffLeaves) return false;
    
    return staffLeaves.dates.includes(targetDate);
};
