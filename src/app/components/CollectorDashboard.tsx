import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  faUsers, faCow, faChartPie, faPlusCircle, faCheckCircle, faTimesCircle,
  faPhone, faMapMarkerAlt, faChevronLeft, faChevronRight,
  faBell, faFileInvoice, faDroplet, faCoins, faHistory,
  faEdit, faTrash, faSearch, faClock, faMoneyBillWave, faEnvelope
} from '@fortawesome/free-solid-svg-icons';

import { safeSum, safeNumber, safeMultiply, safeRound, formatCurrency, formatLiters } from '../utils/math';


import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Sidebar } from './Sidebar';
import { MilkEntryForm } from './MilkEntryForm';
import { FarmerEntryForm } from './FarmerEntryForm';
import { milkApi, notificationsApi, adminApi, authApi } from '../api';
import MyDeliveriesView from './collector/MyDeliveriesView';
import CollectorAnalytics from './collector/CollectorAnalytics';
import CollectorNotifications from './collector/CollectorNotifications';
import CollectorSettings from './collector/CollectorSettings';
import PayoutsView from './collector/PayoutsView';
import MessagesView from './MessagesView';
import ReportView from './reports/ReportView';
import ApprovalsView from './ApprovalsView';
import { toast } from 'sonner';
import { useI18n } from '../i18n';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line
} from 'recharts';

interface CollectorDashboardProps {
  collectorName: string;
  onLogout: () => void;
}

interface User {
  total_liters_delivered: number;
  id: number;
  user_id: number;
  full_name: string;
  phone: string;
  village: string | null;
  sector: string | null;
}

function UserAvatar({ name, role }: { name: string; role: string }) {
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const colors: Record<string, string> = {
    collector: 'from-blue-500 to-cyan-600',
    farmer: 'from-emerald-500 to-teal-600'
  };
  const colorClass = colors[role] || 'from-slate-400 to-slate-500';
  return (
    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white text-xs font-black shadow-md border-2 border-white`}>
      {initials}
    </div>
  );
}

function StatCard({ icon, label, value, sub, gradient, delay = 0 }: { icon: any; label: string; value: string | number; sub?: string; gradient: string; delay?: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay }} 
      className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative"
    >
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-slate-50 to-white rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
      <div className="flex items-center justify-between gap-4 relative z-10">
        <div className="flex-1">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{label}</p>
          <div className="flex items-baseline gap-1">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
            {sub && <span className="text-[10px] font-black text-slate-400 uppercase ml-0.5">{sub}</span>}
          </div>
        </div>
        <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500`}>
          <FontAwesomeIcon icon={icon} className="text-white text-xl" />
        </div>
      </div>
    </motion.div>
  );
}

function TableSection({ title, searchPlaceholder, searchTerm, onSearch, headers, rows, totalRow, paginationInfo, onPageChange, currentPage, totalPages, action }: {
  title: string;
  searchPlaceholder: string;
  searchTerm: string;
  onSearch: (val: string) => void;
  headers: string[];
  rows: { key: any; cells: React.ReactNode[] }[];
  totalRow?: React.ReactNode;
  paginationInfo?: string;
  onPageChange?: (page: number) => void;
  currentPage?: number;
  totalPages?: number;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/60 overflow-hidden">
      <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-white to-slate-50/50">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h3>
          <p className="text-xs text-slate-400 font-medium mt-1">Manage your assigned farmers and record milk collections</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-full sm:w-80 flex-shrink-0 group">
            <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm font-medium"
            />
            {searchTerm && (
              <button 
                onClick={() => onSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-400 hover:text-slate-900 rounded-xl transition-all"
              >
                <FontAwesomeIcon icon={faTimesCircle} className="text-xs" />
              </button>
            )}
          </div>
          {action}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
              {headers.map((h, i) => (
                <th key={i} className={`px-8 py-5 ${i === 0 ? 'text-slate-900 bg-slate-100/50' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80">
            {rows.length > 0 ? rows.map((row, i) => (
              <tr key={row.key || i} className="hover:bg-slate-50/80 transition-all group">
                {row.cells.map((cell, j) => (
                  <td key={j} className={`px-8 py-5 text-[13.5px] ${j === 0 ? 'font-bold text-slate-900' : 'text-slate-600'}`}>{cell}</td>
                ))}
              </tr>
            )) : (
              <tr>
                <td colSpan={headers.length} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-24 h-24 bg-gradient-to-br from-slate-50 to-white rounded-full flex items-center justify-center text-slate-200 shadow-inner mb-6">
                      <FontAwesomeIcon icon={faUsers} className="text-5xl" />
                    </div>
                    <p className="text-slate-900 font-black text-xl tracking-tight mb-2">No farmers found</p>
                    <p className="text-slate-400 font-medium max-w-[280px] mb-8">
                      {searchTerm ? 'Try adjusting your search or clearing the filters' : 'Start growing your network by adding your first farmer today'}
                    </p>
                    {searchTerm && (
                      <button 
                        onClick={() => onSearch('')}
                        className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/10"
                      >
                        Clear All Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
          {totalRow && (
            <tfoot>
              {totalRow}
            </tfoot>
          )}
        </table>
      </div>
      {paginationInfo && onPageChange && currentPage && totalPages && (
        <div className="px-8 py-6 bg-gradient-to-r from-slate-50 to-white border-t border-slate-100 flex items-center justify-between">
          <span className="text-sm text-slate-500 font-medium">{paginationInfo}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <span className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl shadow-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function CollectorDashboard({ collectorName, onLogout }: CollectorDashboardProps) {
  const { t } = useI18n();
  const [activeItem, setActiveItem] = useState('overview');
  const [farmers, setFarmers] = useState<User[]>([]);
  const [summary, setSummary] = useState<any>({ total_records: 0, total_liters: 0, total_amount: 0 });
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [isAddFarmerModalOpen, setIsAddFarmerModalOpen] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<User | null>(null);
  const [farmerForm, setFarmerForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    village: '',
    sector: '',
    role: 'farmer'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [targetContactId, setTargetContactId] = useState<number | null>(null);

  // Pagination and filtering
  const filteredFarmers = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return farmers.filter(f =>
      f.full_name.toLowerCase().includes(search) ||
      f.phone?.toLowerCase().includes(search) ||
      f.village?.toLowerCase().includes(search) ||
      f.sector?.toLowerCase().includes(search)
    );
  }, [farmers, searchTerm]);

  const totalPages = Math.ceil(filteredFarmers.length / itemsPerPage);
  const paginatedFarmers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredFarmers.slice(start, start + itemsPerPage);
  }, [filteredFarmers, currentPage, itemsPerPage]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [farmersData, summaryData, notificationsData, recordsData] = await Promise.all([
        milkApi.getFarmers(),
        milkApi.getTodaySummary(),
        notificationsApi.getNotifications(),
        milkApi.getCollectorRecords()
      ]);
      setFarmers(farmersData || []);
      setSummary(summaryData || { total_records: 0, total_liters: 0, total_amount: 0 });
      setNotifications(notificationsData || []);
      setRecords(recordsData || []);
    } catch (error: any) {
      toast.error(t('errors.fetchFailed') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Chart data from actual historical records
  const dailyChartData = useMemo(() => {
    if (records.length > 0) {
      const days: Record<string, { liters: number; amount: number }> = {};
      records.forEach((r: any) => {
        const d = new Date(r.collection_date).toLocaleDateString('en-RW', { day: 'numeric', month: 'short' });
        if (!days[d]) days[d] = { liters: 0, amount: 0 };
        days[d].liters += safeNumber(r.liters);
        days[d].amount += safeNumber(r.total_amount);
      });
      return Object.entries(days).slice(-14).reverse().map(([name, v]) => ({ name, liters: v.liters, amount: v.amount }));
    }
    // Fallback to today's summary only
    const today = new Date().toLocaleDateString('en-RW', { weekday: 'short' });
    return [{ name: today, liters: safeNumber(summary.total_liters), amount: safeNumber(summary.total_amount) }];
  }, [records, summary]);

  const villageStats = useMemo(() => {
    const villages = Array.from(new Set(farmers.map(f => f.village || 'Other')));
    return villages.map(village => ({
      name: village,
      value: farmers.filter(f => f.village === village).length
    }));
  }, [farmers]);

  const handleRecordMilk = (farmer: User) => {
    setSelectedFarmer(farmer);
    setShowEntryForm(true);
  };

  const handleSubmitMilk = async (liters: number, pricePerLiter: number) => {
    if (!selectedFarmer) return;
    try {
      const totalAmount = liters * pricePerLiter;

      await milkApi.addRecord({
        farmerId: selectedFarmer.user_id,
        liters,
        ratePerLiter: pricePerLiter
      });

      toast.success(
        `✅ Milk recorded for ${selectedFarmer.full_name}: ` +
        `${liters}L × ${pricePerLiter} RWF/L = ${totalAmount.toLocaleString()} RWF`
      );

      setShowEntryForm(false);
      fetchData();
    } catch (error: any) {
      toast.error(t('errors.recordFailed') + ': ' + error.message);
    }
  };

  const handleMessageUser = (userId: number) => {
    setTargetContactId(userId);
    setActiveItem('messages');
  };

  const handleAddFarmer = async (formData: any) => {
    try {
      setLoading(true);
      await adminApi.createUser(formData);
      toast.success('Farmer added successfully');
      setIsAddFarmerModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error('Failed to add farmer: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && activeItem === 'overview') {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Sub-views
  const renderSubView = () => {
    return (
      <div className="lg:ml-72 w-full p-2 sm:p-4">
        {activeItem === 'my-deliveries' && <MyDeliveriesView />}
        {activeItem === 'analytics-collector' && <CollectorAnalytics />}
        {activeItem === 'notifications' && <CollectorNotifications />}
        {activeItem === 'messages' && <MessagesView initialContactId={targetContactId} />}
        {activeItem === 'reports' && <ReportView />}
        {activeItem === 'settings-collector' && <CollectorSettings />}
        {activeItem === 'approvals' && <ApprovalsView roleToApprove="farmer" />}
        {activeItem === 'payouts' && <PayoutsView />}
      </div>
    );
  };


  if (activeItem !== 'overview') {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex">
        <Sidebar role="collector" userName={collectorName} onLogout={onLogout} activeItem={activeItem} onItemSelect={setActiveItem} />
        <main className="flex-1 lg:ml-72 min-h-screen">
          {renderSubView()}
        </main>
      </div>
    );
  }

  // Overview
  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      <Sidebar role="collector" userName={collectorName} onLogout={onLogout} activeItem={activeItem} onItemSelect={setActiveItem} />

      <main className="flex-1 lg:ml-72 min-h-screen">
        <div className="w-full p-2 sm:p-4 lg:p-6">
          {/* Header */}
          <div className="mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="px-3 py-1 bg-blue-500/10 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-500/20">
                  Collector
                </div>
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              </div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[11px] font-black uppercase tracking-widest rounded-full shadow-lg">AmataLink Dairy Network</span>
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Professional Reports Dashboard</h1>
              <p className="text-slate-400 font-medium">Welcome back, <span className="text-slate-900 font-bold">{collectorName}</span></p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={() => setIsAddFarmerModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faPlusCircle} className="text-sm" />
                <span className="text-sm font-bold">Add Farmer</span>
              </button>
              <div className="bg-white px-6 py-4 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1.5">Current Time</p>
                  <p className="text-xs font-black text-slate-900">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6 mb-10">
            <StatCard icon={faDroplet} label="Today's Liters" value={formatLiters(summary.total_liters)} gradient="from-blue-600 to-indigo-700" delay={0.1} />
            <StatCard icon={faHistory} label="Today's Records" value={summary.total_records || 0} gradient="from-emerald-500 to-teal-600" delay={0.2} />
            <StatCard icon={faUsers} label="Total Farmers" value={farmers.length} gradient="from-orange-500 to-amber-600" delay={0.3} />
            <StatCard icon={faCoins} label="Today's Earnings" value={formatCurrency(summary.total_amount)} sub="RWF" gradient="from-purple-600 to-indigo-700" delay={0.4} />
            <StatCard icon={faMoneyBillWave} label="Commission (5%)" value={formatCurrency(safeRound(safeMultiply(summary.total_amount, 0.05)))} sub="RWF" gradient="from-pink-600 to-rose-700" delay={0.5} />
            <StatCard icon={faBell} label="Notifications" value={notifications.length} gradient="from-cyan-500 to-blue-600" delay={0.6} />

          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-10">
            <div className="xl:col-span-2 bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Collection Trends</h3>
                  <p className="text-xs text-slate-400 font-medium">Today's production overview</p>
                </div>
              </div>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyChartData}>
                    <defs>
                      <linearGradient id="colorLiters" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9333ea" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="liters" stroke="#9333ea" strokeWidth={3} fillOpacity={1} fill="url(#colorLiters)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 flex flex-col">
              <h3 className="text-xl font-black text-slate-900 tracking-tight mb-6">Farmers by Village</h3>
              <div className="h-[250px] mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={villageStats} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                      {villageStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#9333ea', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-auto max-h-36 overflow-y-auto custom-scrollbar">
                {villageStats.map((v, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100/50">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ['#9333ea', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'][i % 5] }} />
                    <span className="text-[10px] font-black text-slate-600 truncate uppercase tracking-widest">{v.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Farmers Table */}
          <TableSection
            title="My Farmers"
            searchPlaceholder="Search farmers by name, phone, village..."
            searchTerm={searchTerm}
            onSearch={setSearchTerm}
            headers={['#', 'Farmer', 'Phone', 'Village', 'Total Liters', 'Total Amount', 'Action']}

            rows={paginatedFarmers.map((farmer, index) => ({
              key: farmer.user_id,
              cells: [
                <span className="font-mono text-slate-500">{((currentPage - 1) * itemsPerPage) + index + 1}</span>,
                <div className="flex items-center gap-3">
                  <UserAvatar name={farmer.full_name} role="farmer" />
                  <div>
                    <p className="font-bold text-slate-900 leading-tight">{farmer.full_name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Supplier</p>
                  </div>
                </div>,
                <span className="text-slate-600 font-medium">{farmer.phone || 'N/A'}</span>,
                <span className="text-slate-600 font-medium italic">{farmer.village || 'N/A'}</span>,
                <span className="font-bold text-emerald-600">{formatLiters(farmer.total_liters_delivered)}</span>,


                <div className="flex gap-2">
                  <button
                    onClick={() => handleRecordMilk(farmer)}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                  >
                    Record Milk
                  </button>
                  <button
                    onClick={() => handleMessageUser(farmer.user_id)}
                    className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    title="Message Farmer"
                  >
                    <FontAwesomeIcon icon={faEnvelope} />
                  </button>
                </div>
              ]
            }))}
            totalRow={
              <tr className="bg-gradient-to-r from-emerald-50 to-blue-50">
                <td className="px-8 py-5 font-bold text-slate-900 text-lg" colSpan={2}>TOTALS</td>
                <td className="px-8 py-5" />
                <td className="px-8 py-5" />
                <td className="px-8 py-5 font-black text-2xl text-emerald-600">
                  {formatLiters(safeSum(filteredFarmers, 'total_liters_delivered'))}
                </td>

                <td className="px-8 py-5" />
              </tr>
            }
            paginationInfo={`Showing ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, filteredFarmers.length)} of ${filteredFarmers.length} farmers`}
            onPageChange={setCurrentPage}
            currentPage={currentPage}
            totalPages={totalPages}
            action={
              <button
                onClick={() => setIsAddFarmerModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
              >
                <FontAwesomeIcon icon={faPlusCircle} />
                Add New Farmer
              </button>
            }
          />


          {/* Quick Notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/60 overflow-hidden">
              <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/50 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Recent Notifications</h3>
                  <p className="text-xs text-slate-400 font-medium">Latest system updates</p>
                </div>
                <button onClick={() => setActiveItem('notifications')} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-emerald-500 transition-colors">
                  <FontAwesomeIcon icon={faBell} />
                </button>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.slice(0, 5).map((notif) => (
                  <div key={notif.id} className="p-6 flex items-start gap-4 hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-b-0">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FontAwesomeIcon icon={faBell} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{notif.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">
                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="p-20 text-center">
                    <FontAwesomeIcon icon={faBell} className="text-4xl text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">No recent notifications</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-[2.5rem] border border-emerald-100 p-8">
              <h3 className="text-xl font-black text-slate-900 mb-8">Quick Actions</h3>
              <div className="space-y-4">
                <button
                  onClick={() => setShowEntryForm(true)}
                  className="w-full p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex items-center gap-4 text-left group"
                >
                  <div className="w-14 h-14 bg-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FontAwesomeIcon icon={faDroplet} className="text-white text-xl" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-lg group-hover:text-emerald-600 transition-colors">Record Milk</p>
                    <p className="text-slate-500 text-sm mt-1">Quick entry for recent farmers</p>
                  </div>
                </button>
                <button
                  onClick={() => setActiveItem('analytics-collector')}
                  className="w-full p-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-4 text-left group font-bold"
                >
                  <FontAwesomeIcon icon={faFileInvoice} className="text-xl" />
                  <div>
                    <p className="text-lg group-hover:scale-105 transition-transform">Generate & Download Reports</p>
                    <p className="text-xs opacity-90 mt-0.5 font-medium">Collection analytics, CSV export</p>
                  </div>
                </button>
                <button
                  onClick={() => setActiveItem('analytics-collector')}
                  className="w-full p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex items-center gap-4 text-left group"
                >
                  <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FontAwesomeIcon icon={faChartPie} className="text-white text-xl" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">View Analytics</p>
                    <p className="text-slate-500 text-sm mt-1">Performance and earnings charts</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals preserved from original */}
      {showEntryForm && selectedFarmer && (
        <MilkEntryForm 
          onClose={() => setShowEntryForm(false)} 
          onSubmit={handleSubmitMilk}
          farmer={selectedFarmer}
        />
      )}

      {isAddFarmerModalOpen && (
        <FarmerEntryForm 
          onClose={() => setIsAddFarmerModalOpen(false)}
          onSubmit={handleAddFarmer}
          loading={loading}
        />
      )}
    </div>
  );
}


