import React, { useEffect, useState, useMemo } from 'react';
import { adminApi } from '../../api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '../ui/dialog';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faDownload, faEye, faEdit, faTrash, faCow, faCalendar, faClock, faMoneyBillWave, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

type UserForm = {
  email: string;
  full_name: string;
  phone?: string;
  village?: string;
  sector?: string;
  password?: string;
  username?: string;
};

interface FarmerWithStats {
  id: number;
  user_id: number;
  email: string;
  full_name: string;
  phone?: string;
  village?: string;
  sector?: string;
  username?: string;
  total_liters: number;
  total_amount: number;
  total_entries: number;
  avg_rate: number;
}

export default function ManageFarmers() {
  const [farmers, setFarmers] = useState<FarmerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<UserForm>({ email: '', full_name: '', phone: '', village: '', sector: '', password: '' });
  
  // For viewing farmer details
  const [selectedFarmer, setSelectedFarmer] = useState<any>(null);
  const [farmerRecords, setFarmerRecords] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  
  // Search
  const [searchTerm, setSearchTerm] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getFarmers();
      // Get all records to calculate stats for each farmer
      const records = await adminApi.getAllRecords();
      
      // Calculate stats for each farmer
      const farmersWithStats = (data || []).map((farmer: any) => {
        const farmerRecordsData = records.filter((r: any) => r.farmer_user_id === farmer.user_id);
        const totalLiters = farmerRecordsData.reduce((sum: number, r: any) => sum + parseFloat(r.liters || 0), 0);
        const totalAmount = farmerRecordsData.reduce((sum: number, r: any) => sum + parseFloat(r.total_amount || 0), 0);
        
        return {
          ...farmer,
          total_liters: totalLiters,
          total_amount: totalAmount,
          total_entries: farmerRecordsData.length,
          avg_rate: totalLiters > 0 ? totalAmount / totalLiters : 0
        };
      });
      
      setFarmers(farmersWithStats);
    } catch (err: any) {
      toast.error('Failed to load farmers: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => setForm({ email: '', full_name: '', phone: '', village: '', sector: '', password: '' });

  const openCreate = () => { resetForm(); setEditing(null); setOpen(true); };

  const openEdit = (f: any) => {
    setEditing(f);
    setForm({
      email: f.email || '',
      full_name: f.full_name || f.username || '',
      phone: f.phone || '',
      village: f.village || '',
      sector: f.sector || '',
      password: ''
    });
    setOpen(true);
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('Delete this farmer? This action cannot be undone.')) return;
    try {
      await adminApi.deleteUser(userId);
      toast.success('Farmer deleted');
      setFarmers(prev => prev.filter(f => f.user_id !== userId && f.id !== userId));
    } catch (err: any) {
      toast.error('Delete failed: ' + (err.message || err));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await adminApi.updateUser(editing.user_id || editing.id, form);
        toast.success('Farmer updated');
      } else {
        await adminApi.createUser({ ...form, role: 'farmer' });
        toast.success('Farmer created');
      }
      setOpen(false);
      load();
    } catch (err: any) {
      toast.error('Save failed: ' + (err.message || err));
    }
  };

  const viewFarmerDetails = async (farmer: any) => {
    setSelectedFarmer(farmer);
    setViewDialogOpen(true);
    setLoadingRecords(true);
    try {
      // Get all records for this farmer
      const records = await adminApi.getAllRecords();
      const filtered = records.filter((r: any) => r.farmer_user_id === farmer.user_id);
      
      // Group by date to show entries per day
      const groupedByDate = filtered.reduce((acc: any, record: any) => {
        const date = record.collection_date;
        if (!acc[date]) {
          acc[date] = {
            date,
            entries: [],
            totalLiters: 0,
            totalAmount: 0,
            entryCount: 0
          };
        }
        acc[date].entries.push(record);
        acc[date].totalLiters += parseFloat(record.liters || 0);
        acc[date].totalAmount += parseFloat(record.total_amount || 0);
        acc[date].entryCount += 1;
        return acc;
      }, {});
      
      setFarmerRecords(Object.values(groupedByDate).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (err: any) {
      toast.error('Failed to load records: ' + err.message);
    } finally {
      setLoadingRecords(false);
    }
  };

  const exportFarmerCSV = (farmer: any) => {
    const records = farmerRecords.flatMap((d: any) => d.entries);
    const headers = ['Date', 'Time', 'Collector', 'Liters', 'Rate', 'Amount', 'Status'];
    const csvRows = [headers.join(',')];
    
    records.forEach((r: any) => {
      const row = [
        r.collection_date,
        r.collection_time || '',
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
    link.download = `${farmer.full_name || farmer.username}_milk_records.csv`;
    link.click();
    toast.success('Export complete');
  };

  const filteredFarmers = useMemo(() => {
    if (!searchTerm) return farmers;
    const term = searchTerm.toLowerCase();
    return farmers.filter(f => 
      f.full_name?.toLowerCase().includes(term) ||
      f.email?.toLowerCase().includes(term) ||
      f.phone?.toLowerCase().includes(term) ||
      f.village?.toLowerCase().includes(term)
    );
  }, [farmers, searchTerm]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredFarmers.reduce((acc, f) => ({
      totalLiters: acc.totalLiters + f.total_liters,
      totalAmount: acc.totalAmount + f.total_amount,
      totalFarmers: acc.totalFarmers + 1
    }), { totalLiters: 0, totalAmount: 0, totalFarmers: 0 });
  }, [filteredFarmers]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <FontAwesomeIcon icon={faCow} className="text-emerald-600" />
          Manage Farmers
        </h3>
        <div className="flex gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search farmers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm"
            />
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button onClick={openCreate} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">New Farmer</button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit Farmer' : 'Create Farmer'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="text-sm block mb-1">Full name</label>
                  <input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full border px-3 py-2 rounded" />
                </div>
                <div>
                  <label className="text-sm block mb-1">Email</label>
                  <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full border px-3 py-2 rounded" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm block mb-1">Phone</label>
                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full border px-3 py-2 rounded" />
                  </div>
                  <div>
                    <label className="text-sm block mb-1">Village</label>
                    <input value={form.village} onChange={e => setForm({ ...form, village: e.target.value })} className="w-full border px-3 py-2 rounded" />
                  </div>
                </div>
                <div>
                  <label className="text-sm block mb-1">Sector</label>
                  <input value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })} className="w-full border px-3 py-2 rounded" />
                </div>
                {!editing && (
                  <div>
                    <label className="text-sm block mb-1">Password</label>
                    <input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full border px-3 py-2 rounded" />
                  </div>
                )}

                <DialogFooter>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 bg-slate-100 rounded">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded">Save</button>
                  </div>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-blue-50 p-4 rounded-xl">
          <p className="text-xs text-blue-600 font-bold uppercase">Total Farmers</p>
          <p className="text-2xl font-black text-blue-700">{totals.totalFarmers}</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-xl">
          <p className="text-xs text-emerald-600 font-bold uppercase">Total Liters</p>
          <p className="text-2xl font-black text-emerald-700">{totals.totalLiters.toFixed(1)}L</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl">
          <p className="text-xs text-purple-600 font-bold uppercase">Total Amount</p>
          <p className="text-2xl font-black text-purple-700">{totals.totalAmount.toLocaleString()} RWF</p>
        </div>
      </div>

      {loading ? (
        <div className="p-6 text-center">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm text-slate-500 font-bold bg-slate-50">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Village</th>
                <th className="px-4 py-3 text-right">Total Liters</th>
                <th className="px-4 py-3 text-right">Total Amount</th>
                <th className="px-4 py-3 text-right">Entries</th>
                <th className="px-4 py-3 text-right">Avg Rate</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFarmers.map((f, index) => (
                <tr key={f.id || f.user_id} className="hover:bg-slate-50 border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-500">{index + 1}</td>
                  <td className="px-4 py-3 font-bold">{f.full_name || f.username}</td>
                  <td className="px-4 py-3">{f.phone || '-'}</td>
                  <td className="px-4 py-3">{f.village || '-'}</td>
                  <td className="px-4 py-3 text-right font-medium text-blue-600">{f.total_liters.toFixed(1)}L</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600">{f.total_amount.toLocaleString()} RWF</td>
                  <td className="px-4 py-3 text-right">{f.total_entries}</td>
                  <td className="px-4 py-3 text-right text-purple-600">{f.avg_rate.toFixed(0)} RWF/L</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => viewFarmerDetails(f)} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs" title="View Details">
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button onClick={() => openEdit(f)} className="px-2 py-1 bg-slate-100 rounded text-xs" title="Edit">
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button onClick={() => handleDelete(f.user_id || f.id)} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs" title="Delete">
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {/* Totals Row */}
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                <td className="px-4 py-3 text-slate-700">TOTAL</td>
                <td className="px-4 py-3 text-slate-700">{totals.totalFarmers} Farmers</td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3 text-right text-blue-600">{totals.totalLiters.toFixed(1)}L</td>
                <td className="px-4 py-3 text-right text-emerald-600">{totals.totalAmount.toLocaleString()} RWF</td>
                <td className="px-4 py-3 text-right">{filteredFarmers.reduce((s, f) => s + f.total_entries, 0)}</td>
                <td className="px-4 py-3 text-right text-purple-600">{totals.totalLiters > 0 ? (totals.totalAmount / totals.totalLiters).toFixed(0) : 0} RWF/L</td>
                <td className="px-4 py-3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Farmer Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCow} className="text-emerald-600" />
              {selectedFarmer?.full_name || selectedFarmer?.username} - Milk Records
            </DialogTitle>
          </DialogHeader>
          
          {loadingRecords ? (
            <div className="text-center py-8">Loading records...</div>
          ) : (
            <div>
              {/* Summary */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-blue-600 font-bold">Total Records</p>
                  <p className="text-xl font-black text-blue-700">{farmerRecords.reduce((s, d: any) => s + d.entryCount, 0)}</p>
                </div>
                <div className="bg-emerald-50 p-3 rounded-lg">
                  <p className="text-xs text-emerald-600 font-bold">Total Liters</p>
                  <p className="text-xl font-black text-emerald-700">{farmerRecords.reduce((s, d: any) => s + d.totalLiters, 0).toFixed(1)}L</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-xs text-purple-600 font-bold">Total Amount</p>
                  <p className="text-xl font-black text-purple-700">{farmerRecords.reduce((s, d: any) => s + d.totalAmount, 0).toLocaleString()} RWF</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <p className="text-xs text-orange-600 font-bold">Days Active</p>
                  <p className="text-xl font-black text-orange-700">{farmerRecords.length}</p>
                </div>
              </div>

              <button 
                onClick={() => exportFarmerCSV(selectedFarmer)}
                className="mb-4 px-4 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faDownload} /> Export CSV
              </button>

              {/* Records by Date */}
              <div className="space-y-4">
                {farmerRecords.map((dayData: any, idx: number) => (
                  <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faCalendar} className="text-slate-400" />
                        <span className="font-bold">{new Date(dayData.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span className="text-blue-600 font-medium">{dayData.totalLiters.toFixed(1)}L</span>
                        <span className="text-emerald-600 font-bold">{dayData.totalAmount.toLocaleString()} RWF</span>
                        <span className="text-slate-500">{dayData.entryCount} {dayData.entryCount === 1 ? 'entry' : 'entries'}</span>
                      </div>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-slate-500">
                          <th className="px-4 py-2 text-left">#</th>
                          <th className="px-4 py-2 text-left">Time</th>
                          <th className="px-4 py-2 text-left">Collector</th>
                          <th className="px-4 py-2 text-right">Liters</th>
                          <th className="px-4 py-2 text-right">Rate</th>
                          <th className="px-4 py-2 text-right">Amount</th>
                          <th className="px-4 py-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dayData.entries.map((record: any, recordIdx: number) => (
                          <tr key={recordIdx} className="border-t border-slate-100">
                            <td className="px-4 py-2 text-slate-500">{recordIdx + 1}</td>
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-1">
                                <FontAwesomeIcon icon={faClock} className="text-slate-300 text-xs" />
                                {record.collection_time || '-'}
                              </div>
                            </td>
                            <td className="px-4 py-2">{record.collector_name || '-'}</td>
                            <td className="px-4 py-2 text-right font-medium">{record.liters}L</td>
                            <td className="px-4 py-2 text-right">{record.rate_per_liter || 500} RWF</td>
                            <td className="px-4 py-2 text-right font-bold text-emerald-600">{Number(record.total_amount).toLocaleString()}</td>
                            <td className="px-4 py-2 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                record.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                record.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-orange-100 text-orange-700'
                              }`}>
                                {record.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
