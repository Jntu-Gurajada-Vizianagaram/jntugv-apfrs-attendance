import React from 'react';
import PageLayout from './PageLayout';
import ManageCalendar from '../components/ManageCalendar';

const AcademicCalendar = () => {
    const bodyContent = (
        <div className="w-full space-y-6">
            {/* Page Header */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Academic Calendar</h1>
                    <p className="text-slate-500 text-sm sm:text-base mt-1">
                        JNTU-GV University Official Academic & Government Holiday Management System
                    </p>
                </div>
            </header>

            {/* Calendar Main Section */}
            <ManageCalendar />
        </div>
    );

    return <PageLayout Sidebar={null} Body={bodyContent} />;
};

export default AcademicCalendar;
