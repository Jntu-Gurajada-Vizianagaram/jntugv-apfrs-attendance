// Pure API Service — Zero LocalStorage for complete data security & real-time backend processing

export const fetchHolidays = async (year) => {
    try {
        const response = await fetch(`/api/holidays/${year}`);
        if (!response.ok) throw new Error('Failed to fetch holidays');
        const data = await response.json();
        return data.holidays || [];
    } catch (error) {
        console.error('Error fetching holidays from API:', error);
        return [];
    }
};

export const addHoliday = async (holidayData) => {
    const response = await fetch('/api/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(holidayData),
    });
    if (!response.ok) throw new Error('Failed to add holiday');
    return await response.json();
};

export const deleteHoliday = async (id) => {
    const response = await fetch(`/api/holidays/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete holiday');
    return await response.json();
};

// Adjust a holiday's date (moon cycle / GO changes)
export const adjustHolidayDate = async (id, adjustData) => {
    const response = await fetch(`/api/holidays/${id}/adjust`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adjustData),
    });
    if (!response.ok) throw new Error('Failed to adjust holiday date');
    return await response.json();
};

// Fetch adjustment history for a year
export const fetchAdjustments = async (year) => {
    try {
        const response = await fetch(`/api/holidays/${year}/adjustments`);
        if (!response.ok) throw new Error('Failed to fetch adjustments');
        const data = await response.json();
        return data.adjustments || [];
    } catch (error) {
        console.error('Error fetching adjustments from API:', error);
        return [];
    }
};

// Fetch compensatory leaves for a year
export const fetchCompensatoryLeaves = async (year) => {
    try {
        const response = await fetch(`/api/compensatory-leaves/${year}`);
        if (!response.ok) throw new Error('Failed to fetch compensatory leaves');
        const data = await response.json();
        return data.leaves || [];
    } catch (error) {
        console.error('Error fetching compensatory leaves from API:', error);
        return [];
    }
};

// Add a compensatory leave
export const addCompensatoryLeave = async (leaveData) => {
    const response = await fetch('/api/compensatory-leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leaveData),
    });
    if (!response.ok) throw new Error('Failed to add compensatory leave');
    return await response.json();
};

// Delete a compensatory leave
export const deleteCompensatoryLeave = async (id) => {
    const response = await fetch(`/api/compensatory-leaves/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete compensatory leave');
    return await response.json();
};

// Detect holidays falling on weekends (Sunday / 2nd Saturday)
export const fetchWeekendConflicts = async (year) => {
    try {
        const response = await fetch(`/api/holidays/${year}/weekend-conflicts`);
        if (!response.ok) throw new Error('Failed to fetch weekend conflicts');
        const data = await response.json();
        return data.conflicts || [];
    } catch (error) {
        console.error('Error fetching weekend conflicts from API:', error);
        return [];
    }
};
