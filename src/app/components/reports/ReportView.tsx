import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf, faFileExcel, faCalendarAlt, faFilter, faSearch, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { reportsApi } from '../../api';
import { format, startOfWeek, startOfMonth, subDays } from 'date-fns';
import { motion } from 'framer-motion';

interface ReportViewProps {
    farmerId?: number;
}

export default function ReportView({ farmerId }: ReportViewProps) {
    const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const handleQuickFilter = (type: 'today' | 'week' | 'month' | 'all') => {
        const now = new Date();
        setEndDate(format(now, 'yyyy-MM-dd'));

        switch (type) {
            case 'today':
                setStartDate(format(now, 'yyyy-MM-dd'));
                break;
            case 'week':
                setStartDate(format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
                break;
            case 'month':
                setStartDate(format(startOfMonth(now), 'yyyy-MM-dd'));
                break;
            case 'all':
                setStartDate('');
                setEndDate('');
                break;
        }
    };

    const handleDownload = (type: 'pdf' | 'excel') => {
        const params = {
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            farmerId
        };

        const url = type === 'pdf' ? reportsApi.exportPDF(params) : reportsApi.exportExcel(params);
        window.open(url, '_blank');
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Professional Reports</h2>
                        <p className="text-slate-400 font-medium mt-1">
                            <span className="text-emerald-500 font-bold">AmataLink Dairy Network</span> • Generate and download collection analytics
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Filter Card */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-8">
                    <div className="flex items-center gap-3 text-slate-900 font-black uppercase text-[10px] tracking-widest">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                            <FontAwesomeIcon icon={faFilter} />
                        </div>
                        Report Parameters
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">From Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all"
                                />
                                <FontAwesomeIcon icon={faCalendarAlt} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">To Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all"
                                />
                                <FontAwesomeIcon icon={faCalendarAlt} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                        <button onClick={() => handleQuickFilter('today')} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors">Today</button>
                        <button onClick={() => handleQuickFilter('week')} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors">This Week</button>
                        <button onClick={() => handleQuickFilter('month')} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors">This Month</button>
                        <button onClick={() => handleQuickFilter('all')} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors">All Time</button>
                    </div>
                </div>

                {/* Action Card */}
                <div className="bg-slate-900 rounded-3xl p-8 flex flex-col justify-between text-white relative overflow-hidden shadow-2xl">
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold mb-2">Export Document</h3>
                        <p className="text-slate-400 text-xs leading-relaxed">Select your preferred format to download the AmataLink Dairy Network logs for the selected period.</p>
                    </div>

                    <div className="space-y-3 mt-8 relative z-10">
                        <button
                            onClick={() => handleDownload('pdf')}
                            className="w-full flex items-center justify-between px-6 py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl transition-all hover:-translate-y-0.5 active:scale-95 group shadow-lg shadow-blue-500/20"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg">
                                    <FontAwesomeIcon icon={faFilePdf} />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-sm">Download PDF</p>
                                    <p className="text-[10px] text-blue-200 font-medium text-white/50">Professional Document</p>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => handleDownload('excel')}
                            className="w-full flex items-center justify-between px-6 py-5 bg-emerald-600 hover:bg-emerald-500 rounded-2xl transition-all hover:-translate-y-0.5 active:scale-95 group shadow-lg shadow-emerald-500/20"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg">
                                    <FontAwesomeIcon icon={faFileExcel} />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-sm">Download Excel</p>
                                    <p className="text-[10px] text-emerald-200 font-medium text-white/50">Workbook & Data Logs</p>
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none"></div>
                </div>
            </div>

            <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 flex gap-4">
                <div className="mt-1 text-blue-600">
                    <FontAwesomeIcon icon={faInfoCircle} />
                </div>
                <div className="space-y-1">
                    <p className="text-blue-900 font-bold text-sm">AmataLink Reporting Standard</p>
                    <p className="text-blue-700/70 text-xs leading-relaxed font-medium">
                        All reports are generated with the official "AmataLink Dairy Network" branding.
                        PDFs are read-only documents optimized for sharing, while Excel workbooks provide raw data and summaries for advanced analysis.
                    </p>
                </div>
            </div>
        </div>
    );
}
