import { useState, useEffect } from 'react';
import { milkApi } from '../../api';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faDownload, faFilter } from '@fortawesome/free-solid-svg-icons';
import { safeSum, formatCurrency, formatLiters } from '../../utils/math';


interface DeliveryRecord {
  id: number;
  farmer_name: string;
  liters: number;
  total_amount: number;
  collection_date: string;
  status: 'pending' | 'confirmed' | 'rejected';
}

export default function MyDeliveriesView() {
  const [records, setRecords] = useState<DeliveryRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<DeliveryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await milkApi.getCollectorRecords();
      setRecords(data || []);
      setFilteredRecords(data || []);
    } catch (error: any) {
      toast.error('Failed to load deliveries: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...records];

    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.farmer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.liters.toString().includes(searchTerm)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    if (dateFilter) {
      filtered = filtered.filter(r => {
        const recordDate = new Date(r.collection_date).toLocaleDateString();
        return recordDate.includes(dateFilter);
      });
    }

    setFilteredRecords(filtered);
  }, [records, searchTerm, statusFilter, dateFilter]);

  const exportCSV = () => {
    const headers = ['ID', 'Farmer', 'Liters', 'Amount', 'Date', 'Status'];
    const rows = filteredRecords.map(r => [
      r.id,
      r.farmer_name,
      r.liters,
      r.total_amount,
      new Date(r.collection_date).toLocaleDateString(),
      r.status
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my_deliveries.csv';
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">My Deliveries</h2>
          <p className="text-slate-500 mt-1">View and manage your milk collection records</p>
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            onClick={exportCSV}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            <FontAwesomeIcon icon={faDownload} className="mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-4">
        <div className="relative">
          <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by farmer name or liters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-[1.5rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-[0.2em] font-black">
                <th className="px-8 py-5 text-left">Farmer</th>
                <th className="px-8 py-5 text-left">Liters</th>
                <th className="px-8 py-5 text-right">Amount</th>
                <th className="px-8 py-5 text-left">Date</th>
                <th className="px-8 py-5 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length > 0 ? filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="font-bold text-slate-900">{record.farmer_name}</div>
                  </td>
                  <td className="px-8 py-5 font-medium text-blue-600">{formatLiters(record.liters)}</td>
                  <td className="px-8 py-5 text-right">
                    <span className="text-emerald-600 font-bold">
                      {formatCurrency(record.total_amount)}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-slate-600">
                    {new Date(record.collection_date).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      record.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                      record.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="text-slate-400">
                      <FontAwesomeIcon icon={faFilter} className="text-4xl mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No deliveries match your filters</p>
                      <p className="text-sm mt-1">Try adjusting your search or status filter</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Cards */}
      {!loading && filteredRecords.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 text-center">
            <p className="text-sm text-blue-600 font-bold">Total Deliveries</p>
            <p className="text-3xl font-black text-blue-700 mt-2">{filteredRecords.length}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-100 text-center">
            <p className="text-sm text-emerald-600 font-bold">Total Liters</p>
            <p className="text-3xl font-black text-emerald-700 mt-2">
              {formatLiters(safeSum(filteredRecords, 'liters'))}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-100 text-center">
            <p className="text-sm text-purple-600 font-bold">Total Amount</p>
            <p className="text-3xl font-black text-purple-700 mt-2">
              {formatCurrency(safeSum(filteredRecords, 'total_amount'))}
            </p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-2xl border border-orange-100 text-center">
            <p className="text-sm text-orange-600 font-bold">Pending</p>
            <p className="text-3xl font-black text-orange-700 mt-2">
              {filteredRecords.filter(r => r.status === 'pending').length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

