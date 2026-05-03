import { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faCalendar, faDownload, faFilter, faPrint, faChartBar, faSearch, faUser, faFileExcel, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import { adminApi } from '../../api';
import { useI18n } from '../../i18n';
import { toast } from 'sonner';

interface ReportsProps {
  onClose?: () => void;
}

interface ReportData {
  dailyReport: any[];
  monthlyReport?: any[];
  farmerSummary: any[];
}

// AmataLink Company Information for Reports
const COMPANY_INFO = {
  name: 'AmataLink',
  tagline: 'Milk Collection Management System',
  phone: '+250 788 XXX XXX',
  email: 'info@amatalink.rw',
  website: 'www.amatalink.rw',
  address: 'Rwanda'
};

export default function Reports({ onClose }: ReportsProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('daily');
  const [data, setData] = useState<ReportData>({ dailyReport: [], farmerSummary: [] });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Custom date range
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Farmer filter
  const [farmers, setFarmers] = useState<any[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState<string>('all');
  const [farmerData, setFarmerData] = useState<any>(null);
  const [loadingFarmer, setLoadingFarmer] = useState(false);

  useEffect(() => {
    fetchReportData();
    loadFarmers();
  }, [reportType, selectedMonth, selectedYear, startDate, endDate]);

  useEffect(() => {
    if (selectedFarmer !== 'all') {
      fetchFarmerData();
    } else {
      setFarmerData(null);
    }
  }, [selectedFarmer, startDate, endDate]);

  const loadFarmers = async () => {
    try {
      const farmersData = await adminApi.getFarmers();
      setFarmers(farmersData || []);
    } catch (error) {
      console.error('Failed to load farmers:', error);
    }
  };

  const fetchFarmerData = async () => {
    try {
      setLoadingFarmer(true);
      const result = await adminApi.getRecordsByFarmer(Number(selectedFarmer), {
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });
      setFarmerData(result);
    } catch (error: any) {
      toast.error('Failed to load farmer data: ' + error.message);
    } finally {
      setLoadingFarmer(false);
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      if (reportType === 'monthly') {
        const report = await adminApi.getMonthlyReport(selectedMonth, selectedYear);
        setData(report);
      } else if (reportType === 'yearly') {
        const report = await adminApi.getYearlyReport(selectedYear);
        setData(report);
      } else if (reportType === 'weekly' && startDate && endDate) {
        const report = await adminApi.getWeeklyReport(startDate, endDate);
        setData(report);
      } else if (reportType === 'custom' && startDate && endDate) {
        const report = await adminApi.getCustomDateRangeReport(startDate, endDate);
        setData(report);
      } else {
        // For daily, fetch all records and filter
        const records = await adminApi.getAllRecords();
        setData({
          dailyReport: records,
          farmerSummary: []
        });
      }
    } catch (error: any) {
      toast.error('Failed to load report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = useMemo(() => {
    if (!data.dailyReport) return [];
    return data.dailyReport.filter((record: any) => {
      if (filterStatus === 'all') return true;
      return record.status === filterStatus;
    });
  }, [data.dailyReport, filterStatus]);

  const calculateTotals = () => {
    const records = filteredRecords || [];
    return records.reduce((acc: any, record: any) => {
      acc.totalLiters += parseFloat(record.liters || 0);
      acc.totalAmount += parseFloat(record.total_amount || 0);
      acc.commission += parseFloat(record.total_amount || 0) * 0.05;
      return acc;
    }, { totalLiters: 0, totalAmount: 0, commission: 0 });
  };

  const totals = calculateTotals();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // Export to Excel (CSV format compatible with Excel)
  const exportToExcel = (exportData?: any[], isFarmerReport = false) => {
    const records = exportData || filteredRecords || [];
    let csvRows: string[] = [];
    
    // Add company header info as comments
    csvRows.push(`Report Generated by ${COMPANY_INFO.name}`);
    csvRows.push(`${COMPANY_INFO.tagline}`);
    csvRows.push(`Generated Date: ${new Date().toLocaleDateString()}`);
    csvRows.push(`Report Type: ${isFarmerReport ? 'Farmer Individual Report' : reportType.charAt(0).toUpperCase() + reportType.slice(1) + ' Report'}`);
    csvRows.push('');
    
    if (isFarmerReport && exportData) {
      const headers = ['S.N', 'Date', 'Collector', 'Liters', 'Rate', 'Amount', 'Status'];
      csvRows.push(headers.join(','));
      
      exportData.forEach((r: any, index: number) => {
        const row = [
          index + 1,
          r.collection_date,
          `"${r.collector_name || ''}"`,
          r.liters,
          r.rate_per_liter || 500,
          r.total_amount,
          r.status
        ];
        csvRows.push(row.join(','));
      });
      
      // Add totals
      const farmerTotals = exportData.reduce((acc: any, r: any) => {
        acc.liters += parseFloat(r.liters || 0);
        acc.amount += parseFloat(r.total_amount || 0);
        return acc;
      }, { liters: 0, amount: 0 });
      
      csvRows.push('');
      csvRows.push(`TOTALS,,,${farmerTotals.liters.toFixed(1)},,${farmerTotals.amount},`);
    } else {
      const headers = ['S.N', 'Date', 'Farmer', 'Collector', 'Liters', 'Amount', 'Commission', 'Status'];
      csvRows.push(headers.join(','));
      
      records.forEach((r: any, index: number) => {
        const row = [
          index + 1,
          r.collection_date,
          `"${r.farmer_name || ''}"`,
          `"${r.collector_name || ''}"`,
          r.liters,
          r.total_amount,
          (r.total_amount * 0.05).toFixed(2),
          r.status
        ];
        csvRows.push(row.join(','));
      });

      // Add totals row
      csvRows.push('');
      csvRows.push(`TOTALS,,,${totals.totalLiters.toFixed(1)},${totals.totalAmount.toLocaleString()},${totals.commission.toLocaleString()},`);
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const filename = isFarmerReport 
      ? `AmataLink_Farmer_Report_${selectedFarmer}_${new Date().toISOString().split('T')[0]}.csv`
      : `AmataLink_${reportType}_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.download = filename;
    link.click();
    toast.success('Excel report exported successfully');
  };

  // Export to PDF (using print functionality with custom styling)
  const exportToPDF = (exportData?: any[], isFarmerReport = false) => {
    const records = exportData || filteredRecords || [];
    const isFarmer = isFarmerReport && exportData;
    
    // Create printable content
    const printContent = `
      <html>
      <head>
        <title>AmataLink - ${isFarmer ? 'Farmer' : ''} Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #7c3aed; padding-bottom: 10px; }
          .company-name { font-size: 24px; font-weight: bold; color: #7c3aed; }
          .tagline { font-size: 12px; color: #666; }
          .report-info { margin: 10px 0; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
          th { background-color: #7c3aed; color: white; }
          .totals { font-weight: bold; background-color: #f3f4f6; }
          .footer { margin-top: 20px; font-size: 10px; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">${COMPANY_INFO.name}</div>
          <div class="tagline">${COMPANY_INFO.tagline}</div>
        </div>
        <div class="report-info">
          <strong>Report Type:</strong> ${isFarmer ? 'Farmer Individual Report' : reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report<br>
          <strong>Generated Date:</strong> ${new Date().toLocaleDateString()}<br>
          <strong>Report Period:</strong> ${startDate || 'All'} to ${endDate || 'Present'}
        </div>
        <table>
          <thead>
            <tr>
              ${isFarmer 
                ? '<th>S.N</th><th>Date</th><th>Collector</th><th>Liters</th><th>Rate</th><th>Amount</th><th>Status</th>'
                : '<th>S.N</th><th>Date</th><th>Farmer</th><th>Collector</th><th>Liters</th><th>Amount</th><th>Commission</th><th>Status</th>'
              }
            </tr>
          </thead>
          <tbody>
            ${records.slice(0, 100).map((r: any, index: number) => `
              <tr>
                <td>${index + 1}</td>
                <td>${new Date(r.collection_date).toLocaleDateString()}</td>
                ${isFarmer 
                  ? `<td>${r.collector_name || '-'}</td><td>${r.liters}L</td><td>${r.rate_per_liter || 500}</td><td>${Number(r.total_amount).toLocaleString()}</td><td>${r.status}</td>`
                  : `<td>${r.farmer_name || '-'}</td><td>${r.collector_name || '-'}</td><td>${r.liters}L</td><td>${Number(r.total_amount).toLocaleString()}</td><td>${(r.total_amount * 0.05).toLocaleString()}</td><td>${r.status}</td>`
                }
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>${COMPANY_INFO.name} - ${COMPANY_INFO.tagline}</p>
          <p>${COMPANY_INFO.phone} | ${COMPANY_INFO.email}</p>
        </div>
      </body>
      </html>
    `;

    // Open print window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
    toast.success('PDF report ready for printing');
  };

  const exportToCSV = (exportData?: any[], isFarmerReport = false) => {
    exportToExcel(exportData, isFarmerReport);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <FontAwesomeIcon icon={faChartBar} className="text-purple-600" />
          Reports
        </h3>
      </div>

      {/* Report Type Selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['daily', 'weekly', 'monthly', 'yearly', 'custom'].map(type => (
          <button
            key={type}
            onClick={() => setReportType(type as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              reportType === type 
                ? 'bg-purple-600 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Date Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        {reportType === 'monthly' && (
          <>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 border border-slate-200 rounded-lg"
            >
              {months.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 border border-slate-200 rounded-lg"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </>
        )}

        {reportType === 'yearly' && (
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 border border-slate-200 rounded-lg"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        )}

        {(reportType === 'weekly' || reportType === 'custom') && (
          <>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg"
            />
          </>
        )}

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="rejected">Rejected</option>
        </select>
        
        {/* Farmer Filter */}
        <select
          value={selectedFarmer}
          onChange={(e) => setSelectedFarmer(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg min-w-[200px]"
        >
          <option value="all">All Farmers</option>
          {farmers.map(farmer => (
            <option key={farmer.user_id} value={farmer.user_id}>
              {farmer.full_name}
            </option>
          ))}
        </select>
      </div>

      {/* Farmer-specific report view */}
      {selectedFarmer !== 'all' && (
        <div className="mb-6">
          {loadingFarmer ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent mx-auto"></div>
            </div>
          ) : farmerData ? (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-100">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                  <FontAwesomeIcon icon={faUser} />
                  {farmers.find(f => f.user_id === Number(selectedFarmer))?.full_name} - Individual Report
                </h4>
                <div className="flex gap-2">
                  <button 
                    onClick={() => exportToExcel(farmerData.records, true)}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faFileExcel} />
                    Excel
                  </button>
                  <button 
                    onClick={() => exportToPDF(farmerData.records, true)}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faFilePdf} />
                    PDF
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white rounded-xl p-3 shadow-sm">
                  <p className="text-xs text-slate-500 uppercase">Total Records</p>
                  <p className="text-xl font-bold text-indigo-600">{farmerData.records?.length || 0}</p>
                </div>
                <div className="bg-white rounded-xl p-3 shadow-sm">
                  <p className="text-xs text-slate-500 uppercase">Total Liters</p>
                  <p className="text-xl font-bold text-blue-600">{farmerData.totals?.liters?.toFixed(1) || 0}L</p>
                </div>
                <div className="bg-white rounded-xl p-3 shadow-sm">
                  <p className="text-xs text-slate-500 uppercase">Total Amount</p>
                  <p className="text-xl font-bold text-emerald-600">{Number(farmerData.totals?.amount || 0).toLocaleString()} RWF</p>
                </div>
                <div className="bg-white rounded-xl p-3 shadow-sm">
                  <p className="text-xs text-slate-500 uppercase">Avg. Rate</p>
                  <p className="text-xl font-bold text-purple-600">
                    {farmerData.records?.length > 0 
                      ? (farmerData.totals.amount / farmerData.totals.liters).toFixed(0) 
                      : 0} RWF/L
                  </p>
                </div>
              </div>
              
              {/* Farmer Records Table */}
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs text-slate-500 font-bold bg-white">
                      <th className="px-3 py-2">S.N</th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Collector</th>
                      <th className="px-3 py-2">Liters</th>
                      <th className="px-3 py-2">Rate</th>
                      <th className="px-3 py-2">Amount</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {farmerData.records?.slice(0, 50).map((r: any, index: number) => (
                      <tr key={r.id} className="border-b border-slate-100 hover:bg-white">
                        <td className="px-3 py-2 font-medium">{index + 1}</td>
                        <td className="px-3 py-2">{new Date(r.collection_date).toLocaleDateString()}</td>
                        <td className="px-3 py-2">{r.collector_name}</td>
                        <td className="px-3 py-2">{r.liters}L</td>
                        <td className="px-3 py-2">{r.rate_per_liter || 500} RWF</td>
                        <td className="px-3 py-2 font-medium">{Number(r.total_amount).toLocaleString()} RWF</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            r.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            r.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Summary Cards - Only show when not viewing farmer-specific report */}
      {selectedFarmer === 'all' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
            <p className="text-xs opacity-80 uppercase">Total Liters</p>
            <p className="text-2xl font-bold">{totals.totalLiters.toFixed(1)}L</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white">
            <p className="text-xs opacity-80 uppercase">Total Amount</p>
            <p className="text-2xl font-bold">{totals.totalAmount.toLocaleString()} RWF</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
            <p className="text-xs opacity-80 uppercase">Commission (5%)</p>
            <p className="text-2xl font-bold">{totals.commission.toLocaleString()} RWF</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 text-white">
            <p className="text-xs opacity-80 uppercase">Total Records</p>
            <p className="text-2xl font-bold">{filteredRecords?.length || 0}</p>
          </div>
        </div>
      )}

      {/* Report Table - Only show when not viewing farmer-specific report */}
      {selectedFarmer === 'all' && (
        <>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent mx-auto"></div>
            </div>
          ) : reportType === 'yearly' && data.monthlyReport ? (
            // Monthly breakdown for yearly report
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-sm text-slate-500 font-bold bg-slate-50">
                    <th className="px-4 py-3">S.N</th>
                    <th className="px-4 py-3">Month</th>
                    <th className="px-4 py-3">Deliveries</th>
                    <th className="px-4 py-3">Total Liters</th>
                    <th className="px-4 py-3">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.monthlyReport.map((record: any, index: number) => (
                    <tr key={index} className="hover:bg-slate-50 border-b border-slate-100">
                      <td className="px-4 py-3 font-medium">{index + 1}</td>
                      <td className="px-4 py-3">{months[record.month - 1]}</td>
                      <td className="px-4 py-3">{record.total_deliveries}</td>
                      <td className="px-4 py-3 font-medium">{record.total_liters}L</td>
                      <td className="px-4 py-3 text-emerald-600 font-bold">{Number(record.total_amount).toLocaleString()} RWF</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-sm text-slate-500 font-bold bg-slate-50">
                    <th className="px-4 py-3">S.N</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Farmer</th>
                    <th className="px-4 py-3">Collector</th>
                    <th className="px-4 py-3">Liters</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Commission</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.slice(0, 100).map((record: any, index: number) => (
                      <tr key={index} className="hover:bg-slate-50 border-b border-slate-100">
                        <td className="px-4 py-3 font-medium text-slate-500">{index + 1}</td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(record.collection_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">{record.farmer_name || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm">{record.collector_name || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm font-medium">{record.liters}L</td>
                        <td className="px-4 py-3 text-sm">{record.rate_per_liter || 500} RWF/L</td>
                        <td className="px-4 py-3 text-sm">{Number(record.total_amount).toLocaleString()} RWF</td>
                        <td className="px-4 py-3 text-sm text-purple-600">{(record.total_amount * 0.05).toLocaleString()} RWF</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            record.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            record.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Export Buttons - Only show when not viewing farmer-specific report */}
      {selectedFarmer === 'all' && (
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button onClick={() => exportToPDF()} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
            <FontAwesomeIcon icon={faFilePdf} />
            Export PDF
          </button>
          <button onClick={() => exportToExcel()} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2">
            <FontAwesomeIcon icon={faFileExcel} />
            Export Excel
          </button>
        </div>
      )}
    </div>
  );
}
