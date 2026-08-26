import React, { useState, useEffect } from 'react';
import { useAttendance } from '../contexts/AttendanceContext';
import { useAuth } from '../contexts/AuthContext';
import { Upload, Database, FileSpreadsheet, CheckCircle, AlertCircle, Trash2, ShieldAlert, Download, CheckCircle2, AlertTriangle, FileText, Send, Sparkles } from 'lucide-react';
import PageLayout from './PageLayout';
import FileUpload from '../components/FileUpload';
import * as XLSX from 'xlsx';
import { processFinalizedAttendance } from '../utils/attendanceCalculator';
import { parseGoogleFormResponses, convertGoogleFormToLeaveApplications } from '../utils/googleFormParser';
import { persons } from '../utils/data/faculty';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const ImportData = () => {
    const { canUpload, isPrincipal } = useAuth();
    const {
        selectedMonth,
        selectedYear,
        handleFileUpload,
        fileName,
        attendanceData,
        loading,
        error,
        resetData
    } = useAttendance();

    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [approvedLeaves, setApprovedLeaves] = useState([]);
    const [finalizedRecords, setFinalizedRecords] = useState([]);

    // Google Form Import State
    const [googleFormFileName, setGoogleFormFileName] = useState('');
    const [googleFormSuccess, setGoogleFormSuccess] = useState(false);
    const [googleFormImportCount, setGoogleFormImportCount] = useState(0);
    const [googleFormLoading, setGoogleFormLoading] = useState(false);
    const [googleFormError, setGoogleFormError] = useState(null);

    // Fetch approved leave applications for attendance finalization
    const fetchLeaves = async () => {
        try {
            const res = await fetch('/api/leaves/pending-approvals');
            if (res.ok) {
                const data = await res.json();
                setApprovedLeaves(data.leaves || []);
            }
        } catch (err) {
            console.error('Error fetching approved leaves for finalization:', err);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

    // Calculate finalized attendance whenever attendanceData or approvedLeaves change
    useEffect(() => {
        if (attendanceData && attendanceData.length > 0) {
            const calculated = processFinalizedAttendance(attendanceData, approvedLeaves);
            setFinalizedRecords(calculated);
        } else {
            setFinalizedRecords([]);
        }
    }, [attendanceData, approvedLeaves]);

    // Download Sample Biometric Attendance Template (All 80 Faculty Members)
    const handleDownloadBiometricTemplate = () => {
        const templateData = persons.map((p) => {
            return {
                'CFMS ID': String(p.cfms_id),
                'Faculty Name': p.name,
                'Department': p.department || 'General',
                'Designation': p.designation || 'Faculty',
                'Total Working Days': '',
                'Biometric Present': '',
                'Biometric Absent': ''
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Biometric Attendance');

        XLSX.writeFile(workbook, 'JNTU-GV_Faculty_Biometric_Attendance_Template.xlsx');
    };

    // Download Sample Google Form Response Sheet Template (All 80 Faculty Members with Winter Pongal Vacations & Leaves)
    const handleDownloadGoogleFormTemplate = () => {
        const sampleGoogleFormData = persons.map((p) => {
            return {
                'Timestamp': '',
                'CFMS ID': String(p.cfms_id),
                'Name of the Faculty': p.name,
                'Department': p.department || 'General',
                'OD Leaves Taken for this Month': '',
                'Dates of the ODs Taken': '',
                'AL Leaves Taken for this Month': '',
                'Dates of the AL Taken': '',
                'Pongal / Winter Vacation Days': '',
                'CL Count': '',
                'CL Taken Dates': '',
                'Special Leaves Taken': '',
                'Earned Leaves Taken': ''
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(sampleGoogleFormData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Google Form Responses');

        XLSX.writeFile(workbook, 'JNTU-GV_Google_Form_Leave_Response_Template.xlsx');
    };

    // Handle Google Form Response File Upload
    const handleGoogleFormFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setGoogleFormFileName(file.name);
        setGoogleFormLoading(true);
        setGoogleFormError(null);
        setGoogleFormSuccess(false);

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonRows = XLSX.utils.sheet_to_json(worksheet);

            if (!jsonRows || jsonRows.length === 0) {
                throw new Error('Google Form XLSX/CSV sheet is empty.');
            }

            const parsedFormRecords = parseGoogleFormResponses(jsonRows);
            const convertedLeaveApplications = convertGoogleFormToLeaveApplications(parsedFormRecords);

            if (convertedLeaveApplications.length === 0) {
                throw new Error('No leave declarations found in the uploaded Google Form sheet.');
            }

            // Post to backend API
            const res = await fetch('/api/leaves/import-google-form', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newLeaves: convertedLeaveApplications })
            });

            const resData = await res.json();
            if (!res.ok) {
                throw new Error(resData.error || 'Failed to import Google Form responses.');
            }

            setGoogleFormSuccess(true);
            setGoogleFormImportCount(convertedLeaveApplications.length);
            fetchLeaves(); // Refresh leaves list for live attendance recalculation
        } catch (err) {
            setGoogleFormError(err.message);
        } finally {
            setGoogleFormLoading(false);
        }
    };

    // Upload Biometric Handler
    const onUpload = async (file, data, month, year) => {
        setUploadSuccess(false);
        const success = await handleFileUpload(file, data, month, year);
        setUploadSuccess(success);
        return success;
    };

    const bodyContent = (
        <div className="space-y-8 max-w-6xl mx-auto pb-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                            Biometric & Google Form Integration
                        </span>
                        {isPrincipal && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Principal Access
                            </span>
                        )}
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">Attendance Data & Google Form Response Upload</h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        Upload raw biometric sheets and Google Form faculty leave declarations (OD, AL, Pongal/Winter Vacation VL, CL, SL, EL) to calculate final attendance.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={handleDownloadGoogleFormTemplate}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all shadow-xs"
                    >
                        <Download className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Google Form Template (.xlsx)</span>
                    </button>
                </div>
            </header>

            {/* Read-Only Notice for non-uploaders */}
            {!canUpload ? (
                <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-8 text-center space-y-4 max-w-2xl mx-auto">
                    <div className="inline-flex p-3 bg-amber-100 text-amber-700 rounded-full">
                        <ShieldAlert className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-extrabold text-amber-900">Read-Only Executive Access</h2>
                    <p className="text-sm text-amber-800 leading-relaxed font-medium">
                        Attendance data uploading and report generation are strictly reserved for the <strong>Principal (principal@jntugvcev.edu.in)</strong> and the <strong>IT Processing Team (dmc@jntugv.edu.in / dpo@jntugv.edu.in)</strong>.
                    </p>
                </div>
            ) : (
                /* Main Content Area for Uploaders */
                <div className="space-y-6">
                    {/* Rules Summary Banner */}
                    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 rounded-2xl p-5 text-white shadow-xl grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
                            <div className="flex items-center gap-1.5 text-emerald-300 font-extrabold text-xs">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>OD, AL & Pongal/Winter Vacation (VL)</span>
                            </div>
                            <p className="text-[11px] text-slate-200">
                                <strong>Credited as Present!</strong> Faculty on OD, AL, or Winter Pongal Vacation duties are NOT marked as absent. Added to final present days count.
                            </p>
                        </div>

                        <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
                            <div className="flex items-center gap-1.5 text-amber-300 font-extrabold text-xs">
                                <AlertTriangle className="w-4 h-4" />
                                <span>CL, SL & EL (Casual / Special / Earned Leave)</span>
                            </div>
                            <p className="text-[11px] text-slate-200">
                                <strong>Counted as Approved Leaves!</strong> Maintained under authorized leave absences and deducted from physical present days.
                            </p>
                        </div>
                    </div>

                    <div className={`grid grid-cols-1 ${!isPrincipal ? 'lg:grid-cols-2' : ''} gap-6`}>
                        {/* Section 1: Biometric Sheet Upload */}
                        {!isPrincipal && (
                            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                            <h2 className="text-base font-bold text-slate-900 flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                                    1. Biometric Attendance Upload
                                </span>
                                <span className="text-[11px] text-slate-400 font-medium">XLSX / CSV</span>
                            </h2>
                            <FileUpload
                                onFileUpload={onUpload}
                                fileName={fileName}
                                loading={loading}
                            />
                            {error && (
                                <div className="rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-700 font-medium flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}
                            {uploadSuccess && !error && (
                                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-700 font-medium flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span>Biometric attendance sheet imported cleanly.</span>
                                </div>
                            )}
                        </div>
                        )}

                        {/* Section 2: Google Form Response Importer */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-emerald-600" />
                                    2. Google Form Responses Importer
                                </h2>
                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                    Faculty Self-Declarations
                                </span>
                            </div>

                            <p className="text-xs text-slate-500">
                                Upload XLSX / CSV responses exported from your Google Form (containing CFMS ID, OD Count, AL Count, Pongal/Winter Vacation VL, CL Count).
                            </p>

                            <div className="border-2 border-dashed border-emerald-200 bg-emerald-50/40 rounded-xl p-5 text-center space-y-3">
                                <FileText className="w-8 h-8 text-emerald-600 mx-auto" />
                                <div>
                                    <label htmlFor="googleFormFile" className="cursor-pointer text-xs font-bold text-emerald-800 bg-white px-4 py-2 rounded-xl border border-emerald-300 shadow-xs hover:bg-emerald-50 transition-all inline-block">
                                        Choose Google Form Sheet (.xlsx / .csv)
                                    </label>
                                    <input
                                        id="googleFormFile"
                                        type="file"
                                        accept=".xlsx, .xls, .csv"
                                        onChange={handleGoogleFormFileUpload}
                                        className="hidden"
                                    />
                                </div>
                                {googleFormFileName && (
                                    <div className="text-xs font-mono font-bold text-emerald-900">{googleFormFileName}</div>
                                )}
                            </div>

                            {googleFormLoading && (
                                <div className="p-3 bg-indigo-50 text-indigo-800 rounded-xl text-xs font-medium text-center">
                                    Parsing Google Form response sheet...
                                </div>
                            )}

                            {googleFormError && (
                                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                                    <span>{googleFormError}</span>
                                </div>
                            )}

                            {googleFormSuccess && (
                                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <span>Successfully imported {googleFormImportCount} leave records from Google Form responses! Attendance report recalculated below.</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Finalized Attendance Table */}
                    {!isPrincipal && finalizedRecords.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <Database className="w-5 h-5 text-indigo-600" />
                                        Finalized Faculty Attendance Matrix (Biometric + Google Form Leaves)
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Calculated for <strong>{MONTHS[(selectedMonth - 1) || 0]} {selectedYear}</strong> ({finalizedRecords.length} Faculty Members)
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        if (window.confirm('Are you sure you want to remove this attendance dataset?')) {
                                            resetData();
                                            setUploadSuccess(false);
                                        }
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-rose-100 self-start sm:self-auto"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Reset Dataset</span>
                                </button>
                            </div>

                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                        <tr>
                                            <th className="p-3">CFMS ID</th>
                                            <th className="p-3">Faculty Name</th>
                                            <th className="p-3">Dept</th>
                                            <th className="p-3 text-center">Working Days</th>
                                            <th className="p-3 text-center">Raw Biometric</th>
                                            <th className="p-3 text-center text-emerald-700 bg-emerald-50/50">OD, AL & Pongal VL (+Present)</th>
                                            <th className="p-3 text-center text-amber-700 bg-amber-50/50">CL, SL, EL (Leaves)</th>
                                            <th className="p-3 text-center text-indigo-900 font-extrabold bg-indigo-50/70">Final Present</th>
                                            <th className="p-3 text-center">Attendance %</th>
                                            <th className="p-3 text-center">Compliance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {finalizedRecords.map((r, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-3 font-mono font-bold text-slate-700">{r.cfmsId}</td>
                                                <td className="p-3 font-extrabold text-slate-900">{r.facultyName}</td>
                                                <td className="p-3 font-semibold text-slate-600">{r.department}</td>
                                                <td className="p-3 text-center font-bold text-slate-600">{r.totalWorkingDays}</td>
                                                <td className="p-3 text-center font-bold text-slate-700">{r.rawBiometricPresent} days</td>
                                                <td className="p-3 text-center font-extrabold text-emerald-700 bg-emerald-50/30">
                                                    +{r.dutyCreditDays} days
                                                    {r.dutyCreditDays > 0 && <span className="block text-[10px] text-emerald-600">(OD:{r.odDays}, AL:{r.alDays})</span>}
                                                </td>
                                                <td className="p-3 text-center font-bold text-amber-700 bg-amber-50/30">
                                                    {r.approvedLeaveDays} days
                                                    {r.approvedLeaveDays > 0 && <span className="block text-[10px] text-amber-600">(CL:{r.clDays}, SL:{r.slDays}, EL:{r.elDays})</span>}
                                                </td>
                                                <td className="p-3 text-center font-black text-indigo-900 bg-indigo-50/50 text-sm">
                                                    {r.finalCalculatedPresent} / {r.totalWorkingDays}
                                                </td>
                                                <td className="p-3 text-center font-extrabold text-slate-900 text-sm">
                                                    {r.finalAttendancePercent}%
                                                </td>
                                                <td className="p-3 text-center">
                                                    {r.isCompliant ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                            <span>Compliant</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                                                            <AlertCircle className="w-3 h-3 text-rose-600" />
                                                            <span>Deficient (&lt;75%)</span>
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return <PageLayout Sidebar={null} Body={bodyContent} />;
};

export default ImportData;
