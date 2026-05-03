import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend
} from 'recharts';
import { milkApi } from '../../api';
import { toast } from 'sonner';
import { useI18n } from '../../i18n';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faChartLine, faChartBar, faChartPie, faCoins, faDroplet, faUsers, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function CollectorAnalytics() {
  const { t } = useI18n();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const data = await milkApi.getCollectorRecords();
      setRecords(data || []);
    } catch (e: any) {
      toast.error('Failed to load analytics data: ' + (e.message || e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const chartData = useMemo(() => {
    const map = new Map<string, { liters: number; amount: number; count: number }>();
    records.forEach((r: any) => {
      const d = new Date(r.collection_date);
      let key: string;
      switch (timeRange) {
        case 'daily':
          key = d.toLocaleDateString('en-RW', { day: 'numeric', month: 'short' });
          break;
        case 'weekly':
          key = `Week ${Math.floor(d.getDate() / 7) + 1}`;
          break;
        case 'monthly':
          key = d.toLocaleDateString('en-RW', { month: 'short', year: 'numeric' });
          break;
        default:
          key = d.toLocaleDateString('en-RW', { day: 'numeric', month: 'short' });
      }
      if (!map.has(key)) map.set(key, { liters: 0, amount: 0, count: 0 });
      const entry = map.get(key)!;
      entry.liters += Number(r.liters);
      entry.amount += Number(r.total_amount);
      entry.count += 1;
    });
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, liters: data.liters, amount: data.amount, count: data.count }))
      .reverse()
      .slice(0, 12);
  }, [records, timeRange]);

  const stats = useMemo(() => ({
    totalLiters: records.reduce((sum, r) => sum + Number(r.liters), 0),
    totalAmount: records.reduce((sum, r) => sum + Number(r.total_amount), 0),
    totalRecords: records.length,
    avgLiters: records.length > 0 ? records.reduce((sum, r) => sum + Number(r.liters), 0) / records.length : 0,
    commission: records.reduce((sum, r) => sum + Number(r.total_amount), 0) * 0.05,
    confirmed: records.filter((r: any) => r.status === 'confirmed').length,
  }), [records]);

  const statusPieData = useMemo(() => [
    { name: 'Confirmed', value: records.filter((r: any) => r.status === 'confirmed').length },
    { name: 'Pending', value: records.filter((r: any) => r.status === 'pending').length },
    { name: 'Rejected', value: records.filter((r: any) => r.status === 'rejected').length },
  ], [records]);

  const handleExportCSV = () => {
    const headers = ['Date', 'Farmer', 'Liters', 'Amount (RWF)', 'Status'];
    const rows = records.map(r => [
      new Date(r.collection_date).toLocaleDateString(),
      r.farmer_name || 'N/A',
      r.liters,
      r.total_amount,
      r.status || 'Pending',
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `collector_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const StatCard = ({ title, value, icon, gradient }: { title: string; value: string | number; icon: any; gradient: string; }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl hover:shadow-2xl hover:-translate-y-1 group relative overflow-hidden cursor-pointer transition-all duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{title}</p>
          <p className="text-2xl font-black text-slate-900">{value}</p>
        </div>
        <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg`}>
          <FontAwesomeIcon icon={icon} className="text-white text-lg" />
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <motion.div className="flex items-center justify-center min-h-[500px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-20 h-20 border-4 border-emerald-200 rounded-full border-t-emerald-500"
        />
      </motion.div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20">
              Collector Analytics
            </span>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Performance Dashboard</h1>
          <p className="text-slate-400 font-medium">Your milk collection trends and earnings overview</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faDownload} />
          Download CSV
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard title="Total Collected" value={`${stats.totalLiters.toFixed(1)}L`} icon={faDroplet} gradient="from-emerald-500 to-teal-600" />
        <StatCard title="Total Earnings" value={stats.totalAmount.toLocaleString()} icon={faCoins} gradient="from-blue-500 to-cyan-600" />
        <StatCard title="Records" value={stats.totalRecords} icon={faChartBar} gradient="from-purple-500 to-violet-600" />
        <StatCard title="Avg Per Record" value={`${stats.avgLiters.toFixed(1)}L`} icon={faChartLine} gradient="from-orange-500 to-amber-600" />
        <StatCard title="Commission (5%)" value={Math.round(stats.commission).toLocaleString()} icon={faCoins} gradient="from-pink-500 to-rose-600" />
        <StatCard title="Confirmed" value={stats.confirmed} icon={faCheckCircle} gradient="from-green-500 to-emerald-600" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Trends Chart */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900">Collection Trends</h3>
              <p className="text-xs text-slate-400 font-medium">{timeRange.toUpperCase()} View</p>
            </div>
            <div className="flex bg-slate-100 rounded-xl p-1">
              {(['daily', 'weekly', 'monthly'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${timeRange === range ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="litersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} />
                <YAxis axisLine={false} tickLine={false} tickMargin={10} tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', backgroundColor: 'white', border: '1px solid #e5e7eb' }} />
                <Area type="monotone" dataKey="liters" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#litersGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie + Export */}
        <div className="space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8">
            <h3 className="text-xl font-black text-slate-900 mb-6">Record Status</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData.filter(d => d.value > 0)}
                    cx="50%" 
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {statusPieData
                      .filter(d => d.value > 0)
                      .map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', backgroundColor: 'white', border: '1px solid #e5e7eb' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-gradient-to-r from-slate-50 to-emerald-50 rounded-[2rem] p-8 border border-slate-100 shadow-sm">
            <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-sm flex items-center gap-2">
              Export Analytics
            </h4>
            <button
              onClick={handleExportCSV}
              className="w-full p-6 bg-white border border-slate-200 rounded-2xl text-slate-900 font-bold shadow-sm hover:shadow-lg hover:border-slate-300 hover:bg-white hover:-translate-y-0.5 transition-all flex items-center gap-3"
            >
              <FontAwesomeIcon icon={faDownload} className="text-emerald-500 text-lg" />
              <span>Download Full Dataset (CSV)</span>
              <span className="ml-auto text-[10px] text-slate-400 font-black uppercase tracking-wider">{records.length} records</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Records Table */}
      {records.length > 0 && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              Recent Deliveries
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                {records.length} records
              </span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[11px] uppercase tracking-[0.2em] font-black">
                  <th className="px-8 py-6 text-left">Date</th>
                  <th className="px-8 py-6 text-left">Farmer</th>
                  <th className="px-8 py-6 text-right">Liters</th>
                  <th className="px-8 py-6 text-right">Amount</th>
                  <th className="px-8 py-6 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6 font-bold text-slate-900">
                      {new Date(record.collection_date).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-6 font-bold text-slate-900 max-w-[200px] truncate">
                      {record.farmer_name || 'N/A'}
                    </td>
                    <td className="px-8 py-6 text-right font-bold text-emerald-600 text-lg">
                      {record.liters}L
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="font-black text-slate-900 text-lg">
                        {Number(record.total_amount || 0).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">RWF</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                        record.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800 shadow-emerald-500/10' :
                        record.status === 'rejected' ? 'bg-red-100 text-red-800 shadow-red-500/10' :
                        'bg-orange-100 text-orange-800 shadow-orange-500/10'
                      }`}>
                        {record.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

