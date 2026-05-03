import React, { useEffect, useState, useMemo } from 'react';
import { adminApi } from '../../api';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faDownload, faFilter, faSort, faSortUp, faSortDown, faTrash } from '@fortawesome/free-solid-svg-icons';
import { safeSum, formatLiters, formatCurrency } from '../../utils/math';


type SortField = 'id' | 'farmer_name' | 'collector_name' | 'liters' | 'total_amount' | 'collection_date' | 'status';
type SortOrder = 'asc' | 'desc';

export default function AllRecordsView() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('collection_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAllRecords();
      setRecords(data);
    } catch (err: any) {
      toast.error('Failed to load records: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Filter and sort records
  const filteredRecords = useMemo(() => {
    let result = [...records];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(r => 
        r.farmer_name?.toLowerCase().includes(term) ||
        r.collector_name?.toLowerCase().includes(term) ||
        r.id?.toString().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter);
    }

    // Date filter
    if (dateFilter) {
      result = result.filter(r => r.collection_date === dateFilter);
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === 'liters' || sortField === 'total_amount') {
        aVal = Number(aVal);
        bVal = Number(bVal);
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [records, searchTerm, statusFilter, dateFilter, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage, itemsPerPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <FontAwesomeIcon icon={faSort} className="text-slate-300" />;
    return sortOrder === 'asc' ? <FontAwesomeIcon icon={faSortUp} className="text-blue-600" /> : <FontAwesomeIcon icon={faSortDown} className="text-blue-600" />;
  };

  const handleRemoveDuplicates = async () => {
    try {
      const result = await adminApi.removeDuplicates();
      toast.success(`Removed ${result.removedCount} duplicate records`);
      load();
    } catch (err: any) {
      toast.error('Failed to remove duplicates: ' + (err.message || err));
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Date', 'Farmer', 'Collector', 'Liters', 'Rate', 'Total Amount', 'Status'];
    const csvRows = [headers.join(',')];
    
    filteredRecords.forEach(r => {
      const row = [
        r.id,
        r.collection_date,
        `"${r.farmer_name || ''}"`,
        `"${r.collector_name || ''}"`,
        r.liters,
        r.rate_per_liter || 500,
        r.total_amount,
        r.status
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `milk_records_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Data exported successfully');
  };

  const totals = {
    liters: safeSum(filteredRecords, 'liters'),
    amount: safeSum(filteredRecords, 'total_amount')
  };


  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">All Records</h3>
        <div className="flex gap-2">
          <button onClick={handleRemoveDuplicates} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 flex items-center gap-2">
            <FontAwesomeIcon icon={faTrash} />
            Remove Duplicates
          </button>
          <button onClick={exportToCSV} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 flex items-center gap-2">
            <FontAwesomeIcon icon={faDownload} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search farmer or collector..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="rejected">Rejected</option>
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Summary */}
      <div className="mb-4 p-3 bg-slate-50 rounded-lg flex gap-6 text-sm">
        <span><strong>Total Records:</strong> {filteredRecords.length}</span>
        <span><strong>Total Liters:</strong> {formatLiters(totals.liters)}</span>
        <span><strong>Total Amount:</strong> {formatCurrency(totals.amount)} RWF</span>

      </div>

      {loading ? <div>Loading...</div> : (
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm text-slate-500 font-bold">
                <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('id')}>
                  <div className="flex items-center gap-1">S.N {getSortIcon('id')}</div>
                </th>
                <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('farmer_name')}>
                  <div className="flex items-center gap-1">Farmer {getSortIcon('farmer_name')}</div>
                </th>
                <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('collector_name')}>
                  <div className="flex items-center gap-1">Collector {getSortIcon('collector_name')}</div>
                </th>
                <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('collection_date')}>
                  <div className="flex items-center gap-1">Date {getSortIcon('collection_date')}</div>
                </th>
                <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('liters')}>
                  <div className="flex items-center gap-1">Liters {getSortIcon('liters')}</div>
                </th>
                <th className="px-4 py-3">
                  <div className="flex items-center gap-1">Price</div>
                </th>
                <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('total_amount')}>
                  <div className="flex items-center gap-1">Amount {getSortIcon('total_amount')}</div>
                </th>
                <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1">Status {getSortIcon('status')}</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.map((r, index) => {
                const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
                return (
                  <tr key={r.id} className="hover:bg-slate-50 border-b border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-600">{rowNumber}</td>
                    <td className="px-4 py-3">{r.farmer_name}</td>
                    <td className="px-4 py-3">{r.collector_name}</td>
                    <td className="px-4 py-3">{new Date(r.collection_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{formatLiters(r.liters)}</td>
                    <td className="px-4 py-3">{r.rate_per_liter || 500} RWF/L</td>
                    <td className="px-4 py-3">{formatCurrency(r.total_amount)} RWF</td>

                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        r.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        r.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="px-2 py-1 border border-slate-200 rounded text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-slate-200 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm">Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-slate-200 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
