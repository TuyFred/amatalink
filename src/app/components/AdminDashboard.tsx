import { useState, useEffect, useCallback } from 'react';
import {
  faUsers, faChartLine, faFileInvoice, faCog, faSearch, faDownload, faCow, faDroplet, faHistory,
  faCoins, faUserShield, faChartBar, faTrash, faEdit, faTimes,
  faClock, faBan, faBell, faSave, faFilePdf, faFileExcel, faPlus, faPaperPlane, faUserPlus, faEnvelope,
  faCheckCircle, faXmarkCircle
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Sidebar } from './Sidebar';
import { adminApi, notificationsApi } from '../api';
import { toast } from 'sonner';
import { useI18n } from '../i18n';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminDashboardProps {
  adminName: string;
  onLogout: () => void;
}

import AdminNotifications from './admin/AdminNotifications';
import MessagesView from './MessagesView';
import ReportView from './reports/ReportView';
import ApprovalsView from './ApprovalsView';
import PayoutsView from './collector/PayoutsView';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  village: string | null;
  sector: string | null;
  collector_name?: string;
  created_at: string;
}

function TableSection({ title, searchPlaceholder, searchTerm, onSearch, headers, rows, action }: {
  title: string;
  searchPlaceholder: string;
  searchTerm: string;
  onSearch: (val: string) => void;
  headers: string[];
  rows: { key: any; cells: React.ReactNode[] }[];
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/60 overflow-hidden">
      <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-white to-slate-50/50">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h3>
          <p className="text-xs text-slate-400 font-medium mt-1">Manage and view system records with ease</p>
        </div>
        <div className="relative w-full sm:w-72">
          <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm"
          />
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
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                      <FontAwesomeIcon icon={faUsers} className="text-4xl" />
                    </div>
                    <p className="text-slate-400 font-medium italic">No data found matching your search</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminDashboard({ adminName, onLogout }: AdminDashboardProps) {
  const { t, language, setLanguage } = useI18n();
  const [activeItem, setActiveItem] = useState('overview');
  const [farmers, setFarmers] = useState<User[]>([]);
  const [collectors, setCollectors] = useState<User[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<any>({ total_farmers: 0, total_collectors: 0, today_liters: 0, today_earnings: 0 });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [settingsTab, setSettingsTab] = useState<'info' | 'prefs' | 'notes'>('info');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: '',
    village: '',
    sector: ''
  });
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'farmer',
    village: '',
    sector: ''
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [reportType, setReportType] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [platformSettings, setPlatformSettings] = useState({
    siteName: 'AmataLink',
    defaultCurrency: 'RWF',
    milkPricePerLiter: 500
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [targetContactId, setTargetContactId] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [farmersData, collectorsData, recordsData, statsData, usersData, notesData, serverSettings] = await Promise.all([
        adminApi.getFarmers(),
        adminApi.getCollectors(),
        adminApi.getAllRecords(),
        adminApi.getStats(),
        adminApi.getUsers(),
        notificationsApi.getNotifications(),
        adminApi.getSettings()
      ]);
      setFarmers(farmersData);
      setCollectors(collectorsData);
      setRecords(recordsData);
      setStats(statsData);
      setUsers(usersData);
      setNotifications(notesData);
      if (serverSettings) {
        setPlatformSettings({
          siteName: serverSettings.siteName || 'AmataLink',
          defaultCurrency: serverSettings.defaultCurrency || 'RWF',
          milkPricePerLiter: serverSettings.milkPricePerLiter || 500
        });
      }
    } catch (error: any) {
      toast.error(t('errors.fetchFailed') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleConfirmRecord = async (recordId: number, status: string) => {
    try {
      await adminApi.confirmRecord(recordId, status);
      toast.success(`${t('milk.status.' + status)}!`);
      fetchData();
    } catch (error: any) {
      toast.error(t('errors.actionFailed') + ': ' + error.message);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm(t('users.deleteConfirm'))) return;
    try {
      await adminApi.deleteUser(userId);
      toast.success(t('users.deleteSuccess'));
      fetchData();
    } catch (error: any) {
      toast.error(t('users.deleteFailed') + ': ' + error.message);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      village: user.village || '',
      sector: user.sector || ''
    });
  };

  const handleCreateUser = async () => {
    try {
      if (!createForm.fullName || !createForm.email || !createForm.password || !createForm.phone) {
        toast.error('Please fill in all required fields');
        return;
      }
      await adminApi.createUser(createForm);
      toast.success('User created successfully');
      setIsCreateModalOpen(false);
      setCreateForm({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        role: 'farmer',
        village: '',
        sector: ''
      });
      fetchData();
    } catch (error: any) {
      toast.error('Failed to create user: ' + error.message);
    }
  };

  // Quick handler to open create modal with collector role pre-selected
  const openCreateCollectorModal = () => {
    setCreateForm({
      ...createForm,
      role: 'collector',
      sector: ''
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    try {
      await adminApi.updateUser(editingUser.id, editForm);
      toast.success(t('common.success'));
      setEditingUser(null);
      fetchData();
    } catch (error: any) {
      toast.error(t('errors.actionFailed') + ': ' + error.message);
    }
  };

  const handleGenerateReport = async (type: string) => {
    setReportType(type);
    setReportLoading(true);
    try {
      const now = new Date();
      if (type === 'monthly') {
        const data = await adminApi.getMonthlyReport(now.getMonth() + 1, now.getFullYear());
        setReportData(data);
      } else {
        const today = now.toISOString().split('T')[0];
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const filtered = records.filter(r => {
          const d = r.collection_date.split('T')[0];
          if (type === 'daily') return d === today;
          return d >= weekAgo;
        });
        const totalLiters = filtered.reduce((s: number, r: any) => s + Number(r.liters), 0);
        const totalAmount = filtered.reduce((s: number, r: any) => s + Number(r.total_amount), 0);
        const confirmed = filtered.filter((r: any) => r.status === 'confirmed');
        const rejected = filtered.filter((r: any) => r.status === 'rejected');
        const pending = filtered.filter((r: any) => r.status === 'pending');
        setReportData({
          type,
          records: filtered,
          summary: { totalLiters, totalAmount, confirmed: confirmed.length, rejected: rejected.length, pending: pending.length, totalRecords: filtered.length },
          commission: totalAmount * 0.05
        });
      }
    } catch (error: any) {
      toast.error(t('errors.fetchFailed') + ': ' + error.message);
    } finally {
      setReportLoading(false);
    }
  };

  const handleMessageUser = (userId: number) => {
    setTargetContactId(userId);
    setActiveItem('messages');
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await adminApi.updateSettings(platformSettings);
      toast.success(t('common.success'));
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredFarmers = farmers.filter(f => {
    const search = searchTerm.toLowerCase();
    return f.full_name?.toLowerCase().includes(search) ||
      f.email?.toLowerCase().includes(search) ||
      f.phone?.includes(searchTerm) ||
      f.village?.toLowerCase().includes(search) ||
      f.sector?.toLowerCase().includes(search);
  });

  const filteredCollectors = collectors.filter(c => {
    const search = searchTerm.toLowerCase();
    return c.full_name?.toLowerCase().includes(search) ||
      c.email?.toLowerCase().includes(search) ||
      c.phone?.includes(searchTerm) ||
      c.sector?.toLowerCase().includes(search);
  });

  const filteredUsers = users.filter(u => {
    const search = searchTerm.toLowerCase();
    return u.full_name?.toLowerCase().includes(search) ||
      u.email?.toLowerCase().includes(search) ||
      u.role?.toLowerCase().includes(search) ||
      u.phone?.includes(searchTerm);
  });

  const filteredRecords = records.filter(r => {
    const matchStatus = !statusFilter || r.status === statusFilter;
    const search = searchTerm.toLowerCase();
    const matchSearch = !searchTerm ||
      r.farmer_name?.toLowerCase().includes(search) ||
      r.collector_name?.toLowerCase().includes(search) ||
      r.liters?.toString().includes(searchTerm) ||
      r.status?.toLowerCase().includes(search);
    return matchStatus && matchSearch;
  });

  const dailyChartData = (() => {
    const days: Record<string, { liters: number; amount: number }> = {};
    records.forEach(r => {
      const d = new Date(r.collection_date).toLocaleDateString('en-RW', { day: 'numeric', month: 'short' });
      if (!days[d]) days[d] = { liters: 0, amount: 0 };
      days[d].liters += Number(r.liters);
      days[d].amount += Number(r.total_amount);
    });
    return Object.entries(days).slice(-14).reverse().map(([name, v]) => ({ name, liters: v.liters, amount: v.amount }));
  })();

  const villageStats = Array.from(new Set(farmers.map(f => f.village))).map(village => ({
    name: village || 'Other',
    value: farmers.filter(f => f.village === village).length
  }));

  const rejectedCount = records.filter(r => r.status === 'rejected').length;
  const confirmedAmount = records.filter(r => r.status === 'confirmed').reduce((s, r) => s + Number(r.total_amount), 0);
  const totalCommission = confirmedAmount * 0.05;

  const COLORS = ['#9333ea', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg">{t('dashboard.loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row shadow-inner overflow-x-hidden">
      <Sidebar role="admin" userName={adminName} onLogout={onLogout} activeItem={activeItem} onItemSelect={setActiveItem} />

      <main className="flex-1 lg:ml-72 min-h-screen transition-all duration-300">
        <div className="max-w-[1700px] mx-auto p-4 sm:p-6 lg:p-10">
          <div className="mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="px-3 py-1 bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20">
                  System Admin
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">{t('dashboard.adminDashboard')}</h1>
              <p className="text-slate-400 font-medium">{t('dashboard.welcome')}, <span className="text-slate-900 font-bold">{adminName}</span></p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={openCreateCollectorModal}
                className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faUserPlus} className="text-sm" />
                <span className="text-sm font-bold">{t('dashboard.createCollector')}</span>
              </button>
              <div className="bg-white px-6 py-4 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1.5">{t('dashboard.currentDate')}</p>
                  <p className="text-xs font-black text-slate-900">{currentTime.toLocaleDateString('en-RW', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="w-px h-10 bg-slate-100 hidden sm:block" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-900 shadow-inner">
                    <FontAwesomeIcon icon={faClock} className="text-sm animate-pulse" />
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums tracking-tighter">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                </div>
              </div>
              <button
                onClick={fetchData}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-lg text-slate-600 hover:text-emerald-500 transition-all active:scale-95"
              >
                <FontAwesomeIcon icon={faDownload} />
              </button>
            </div>
          </div>

          {activeItem === 'overview' && (
            <div className="space-y-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6">
                <StatCard icon={faDroplet} label={t('dashboard.totalMilk')} value={Number(stats.total_liters_all_time || 0).toLocaleString()} sub="L" gradient="from-blue-600 to-indigo-700" delay={0.1} />
                <StatCard icon={faDroplet} label="Today's Milk" value={Number(stats.today_liters || 0).toLocaleString()} sub="L" gradient="from-cyan-500 to-blue-600" delay={0.15} />
                <StatCard icon={faCoins} label={t('dashboard.revenue')} value={Number(stats.total_earnings_all_time || 0).toLocaleString()} sub="RWF" gradient="from-purple-600 to-indigo-700" delay={0.2} />
                <StatCard icon={faCoins} label="Today's Earnings" value={Number(stats.today_earnings || 0).toLocaleString()} sub="RWF" gradient="from-emerald-500 to-teal-600" delay={0.25} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6">
                <StatCard icon={faUsers} label={t('dashboard.activeFarmers')} value={farmers.length} gradient="from-emerald-500 to-teal-600" delay={0.3} />
                <StatCard icon={faCow} label={t('dashboard.collectors')} value={collectors.length} gradient="from-orange-500 to-amber-600" delay={0.35} />
                <StatCard icon={faHistory} label={t('commission.totalCommission')} value={Math.round(totalCommission).toLocaleString()} sub="RWF" gradient="from-pink-600 to-rose-700" delay={0.4} />
                <StatCard icon={faBell} label={t('dashboard.notifications')} value={stats.notification_count || 0} gradient="from-cyan-500 to-blue-600" delay={0.45} />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">{t('analytics.milkCollectionTrends')}</h3>
                      <p className="text-xs text-slate-400 font-medium">Daily production analytics</p>
                    </div>
                  </div>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyChartData}>
                        <defs>
                          <linearGradient id="colorLitersAdmin" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#9333ea" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Area type="monotone" dataKey="liters" stroke="#9333ea" strokeWidth={3} fillOpacity={1} fill="url(#colorLitersAdmin)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 flex flex-col">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mb-6">{t('dashboard.farmerDistribution')}</h3>
                  <div className="h-[250px] mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={villageStats} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                          {villageStats.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-auto max-h-36 overflow-y-auto custom-scrollbar">
                    {villageStats.map((v, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100/50">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-[10px] font-black text-slate-600 truncate uppercase tracking-widest">{v.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/60 overflow-hidden h-full">
                  <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-white to-slate-50/50">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">{t('dashboard.pendingApprovals')}</h3>
                      <p className="text-xs text-slate-400 font-medium">Verify incoming milk records</p>
                    </div>
                    <span className="px-4 py-1.5 bg-orange-500/10 text-orange-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-orange-500/20">
                      {records.filter(r => r.status === 'pending').length} Actions
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto custom-scrollbar">
                    {records.filter(r => r.status === 'pending').length > 0 ? (
                      records.filter(r => r.status === 'pending').slice(0, 8).map((record) => (
                        <div key={record.id} className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors group">
                          <div className="flex items-center gap-4 w-full sm:w-auto">
                            <UserAvatar name={record.farmer_name} role="farmer" />
                            <div>
                              <p className="font-bold text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors">{record.farmer_name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{record.liters} Liters Delivered</p>
                            </div>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto">
                            <button onClick={() => handleConfirmRecord(record.id, 'confirmed')} className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all active:scale-95">{t('milk.confirm')}</button>
                            <button onClick={() => handleConfirmRecord(record.id, 'rejected')} className="flex-1 sm:flex-none px-6 py-2.5 bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all active:scale-95">{t('milk.reject')}</button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-20 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                          <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-500 text-2xl" />
                        </div>
                        <p className="text-slate-400 font-black text-xs uppercase tracking-[0.2em]">{t('dashboard.noPendingRecords')}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/60 overflow-hidden h-full">
                  <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-white to-slate-50/50">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">{t('dashboard.recentNotifications')}</h3>
                      <p className="text-xs text-slate-400 font-medium">System alerts and activities</p>
                    </div>
                    <button onClick={() => setActiveItem('notifications')} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-emerald-500 transition-colors">
                      <FontAwesomeIcon icon={faBell} />
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? (
                      notifications.slice(0, 8).map((note) => (
                        <div key={note.id} className="p-6 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${note.type === 'alert' ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-emerald-50 text-emerald-500 border border-emerald-100'}`}>
                            <FontAwesomeIcon icon={note.type === 'alert' ? faXmarkCircle : faBell} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 text-sm truncate">{note.title}</h4>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{note.message}</p>
                            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-2">{new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-20 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                          <FontAwesomeIcon icon={faPaperPlane} className="text-slate-200 text-2xl" />
                        </div>
                        <p className="text-slate-400 font-black text-xs uppercase tracking-[0.2em]">{t('dashboard.noNotifications')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeItem === 'farmers' && (
            <TableSection
              title={t('farmers.manageFarmers')}
              searchPlaceholder={t('farmers.searchFarmers')}
              searchTerm={searchTerm}
              onSearch={setSearchTerm}
              headers={[t('common.name'), t('common.email'), t('common.phone'), t('common.village'), 'Collector', t('common.joined'), t('common.actions')]}
              rows={filteredFarmers.map(farmer => ({
                key: farmer.id,
                cells: [
                  <div className="flex items-center gap-3">
                    <UserAvatar name={farmer.full_name} role="farmer" />
                    <div>
                      <p className="font-bold text-slate-900 leading-tight">{farmer.full_name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Farmer</p>
                    </div>
                  </div>,
                  <span className="text-slate-600 font-medium">{farmer.email}</span>,
                  <span className="text-slate-600 font-medium">{farmer.phone}</span>,
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-slate-600 font-medium italic">{farmer.village || 'N/A'}</span>
                  </div>,
                  <span className="text-blue-600 font-black text-[11px] uppercase tracking-wider bg-blue-50 px-2 py-1 rounded-lg border border-blue-100/50">{farmer.collector_name || 'System / Admin'}</span>,
                  <span className="text-slate-400 font-bold text-[11px]">{new Date(farmer.created_at).toLocaleDateString()}</span>,
                   <div className="flex gap-2">
                    <button onClick={() => handleMessageUser(farmer.id)} className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm" title="Message Farmer"><FontAwesomeIcon icon={faEnvelope} className="text-sm" /></button>
                    <button onClick={() => handleEditUser(farmer)} className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm"><FontAwesomeIcon icon={faEdit} className="text-sm" /></button>
                    <button onClick={() => handleDeleteUser(farmer.id)} className="w-9 h-9 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm"><FontAwesomeIcon icon={faTrash} className="text-sm" /></button>
                  </div>
                ]
              }))}
            />
          )}

          {activeItem === 'collectors' && (
            <TableSection
              title={t('collectors.manageCollectors')}
              searchPlaceholder={t('collectors.searchCollectors')}
              searchTerm={searchTerm}
              onSearch={setSearchTerm}
              headers={[t('common.name'), t('common.email'), t('common.phone'), t('common.sector'), t('common.joined'), t('common.actions')]}
              rows={filteredCollectors.map(collector => ({
                key: collector.id,
                cells: [
                  <div className="flex items-center gap-3">
                    <UserAvatar name={collector.full_name} role="collector" />
                    <div>
                      <p className="font-bold text-slate-900 leading-tight">{collector.full_name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Collector</p>
                    </div>
                  </div>,
                  <span className="text-slate-600 font-medium">{collector.email}</span>,
                  <span className="text-slate-600 font-medium">{collector.phone}</span>,
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span className="text-slate-600 font-medium italic">{collector.sector || 'N/A'}</span>
                  </div>,
                  <span className="text-slate-400 font-bold text-[11px]">{new Date(collector.created_at).toLocaleDateString()}</span>,
                   <div className="flex gap-2">
                    <button onClick={() => handleMessageUser(collector.id)} className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm" title="Message Collector"><FontAwesomeIcon icon={faEnvelope} className="text-sm" /></button>
                    <button onClick={() => handleEditUser(collector)} className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm"><FontAwesomeIcon icon={faEdit} className="text-sm" /></button>
                    <button onClick={() => handleDeleteUser(collector.id)} className="w-9 h-9 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm"><FontAwesomeIcon icon={faTrash} className="text-sm" /></button>
                  </div>
                ]
              }))}
            />
          )}

          {activeItem === 'create-user' && (
            <TableSection
              title={t('users.allUsers')}
              searchPlaceholder={t('users.searchUsers')}
              searchTerm={searchTerm}
              onSearch={setSearchTerm}
              headers={[t('common.name'), t('common.email'), t('common.phone'), t('common.role'), t('common.joined'), t('common.actions')]}
              action={
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
                >
                  <FontAwesomeIcon icon={faUserPlus} />
                  {t('users.createUser')}
                </button>
              }
              rows={filteredUsers.map(user => ({
                key: user.id,
                cells: [
                  <div className="flex items-center gap-3">
                    <UserAvatar name={user.full_name} role={user.role} />
                    <div>
                      <p className="font-bold text-slate-900 leading-tight">{user.full_name}</p>
                      <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-0.5 capitalize">{user.role}</p>
                    </div>
                  </div>,
                  <span className="text-slate-600 font-medium">{user.email}</span>,
                  <span className="text-slate-600 font-medium">{user.phone}</span>,
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-purple-100 text-purple-700 shadow-sm shadow-purple-500/10' : user.role === 'collector' ? 'bg-blue-100 text-blue-700 shadow-sm shadow-blue-500/10' : 'bg-emerald-100 text-emerald-700 shadow-sm shadow-emerald-500/10'}`}>{user.role}</span>,
                  <span className="text-slate-400 font-bold text-[11px]">{new Date(user.created_at).toLocaleDateString()}</span>,
                  <div className="flex gap-2">
                    <button onClick={() => handleEditUser(user)} className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm"><FontAwesomeIcon icon={faEdit} className="text-sm" /></button>
                    {user.role !== 'admin' && (
                      <button onClick={() => handleDeleteUser(user.id)} className="w-9 h-9 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm"><FontAwesomeIcon icon={faTrash} className="text-sm" /></button>
                    )}
                  </div>
                ]
              }))}
            />
          )}

          {activeItem === 'records' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/60 overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-white to-slate-50/50">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t('milk.allRecords')}</h3>
                  <p className="text-xs text-slate-400 font-medium mt-1">Real-time milk collection logs &mdash; <span className="font-black text-slate-600">{filteredRecords.length}</span> of <span className="font-black text-slate-600">{records.length}</span> records</p>
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-[13px] font-bold text-slate-600 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all shadow-sm cursor-pointer"
                >
                  <option value="">{t('milk.status.allStatus')}</option>
                  <option value="confirmed">{t('milk.status.confirmed')}</option>
                  <option value="pending">{t('milk.status.pending')}</option>
                  <option value="rejected">{t('milk.status.rejected')}</option>
                </select>
              </div>
              <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black sticky top-0 z-10">
                      <th className="px-8 py-5 border-b border-slate-100/50">{t('milk.farmer')}</th>
                      <th className="px-8 py-5 border-b border-slate-100/50">{t('milk.collector')}</th>
                      <th className="px-8 py-5 border-b border-slate-100/50">{t('milk.liters')}</th>
                      <th className="px-8 py-5 border-b border-slate-100/50">{t('milk.amount')}</th>
                      <th className="px-8 py-5 border-b border-slate-100/50">{t('common.date')}</th>
                      <th className="px-8 py-5 border-b border-slate-100/50">{t('common.status')}</th>
                      <th className="px-8 py-5 border-b border-slate-100/50 text-right">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80">
                    {filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/80 transition-all group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <UserAvatar name={record.farmer_name} role="farmer" />
                            <div>
                              <p className="font-bold text-slate-900 leading-tight">{record.farmer_name || 'N/A'}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Supplier</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-400 shadow-sm" />
                            <p className="font-medium text-slate-600">{record.collector_name || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="inline-flex items-center px-4 py-2 bg-slate-100 rounded-xl font-black text-slate-900 shadow-inner">
                            {record.liters}<span className="text-[10px] ml-1 text-slate-400">L</span>
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-emerald-600 font-black text-lg -tracking-tighter">
                            <span className="text-[10px] text-slate-400 mr-1 font-bold">RWF</span>
                            {Number(record.total_amount).toLocaleString()}
                          </p>
                        </td>
                        <td className="px-8 py-5">
                          <div className="text-slate-400 font-black text-[10px] uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 inline-block">
                            {new Date(record.collection_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${record.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700 shadow-emerald-500/10' : record.status === 'rejected' ? 'bg-red-100 text-red-700 shadow-red-500/10' : 'bg-orange-100 text-orange-700 shadow-orange-500/10'}`}>
                            {t(`milk.status.${record.status}`)}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          {record.status === 'pending' && (
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => handleConfirmRecord(record.id, 'confirmed')} className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all duration-300 flex items-center justify-center shadow-lg shadow-emerald-500/10" title={t('milk.confirmRecord')}><FontAwesomeIcon icon={faCheckCircle} /></button>
                              <button onClick={() => handleConfirmRecord(record.id, 'rejected')} className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-300 flex items-center justify-center shadow-lg shadow-red-500/10" title={t('milk.rejectRecord')}><FontAwesomeIcon icon={faXmarkCircle} /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeItem === 'commission' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <StatCard icon={faCoins} label={t('commission.todayCommission')} value={`${Math.round(Number(stats.today_earnings || 0) * 0.05).toLocaleString()}`} sub="RWF" gradient="from-indigo-500 to-purple-600" />
                <StatCard icon={faChartLine} label={t('commission.totalCommission')} value={`${Math.round(totalCommission).toLocaleString()}`} sub="RWF" gradient="from-blue-500 to-cyan-600" />
                <StatCard icon={faCoins} label={t('commission.commissionRate')} value="5" sub="%" gradient="from-emerald-500 to-teal-600" />
              </div>
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/60 overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/50">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t('commission.commissionDetails')}</h3>
                  <p className="text-xs text-slate-400 font-medium mt-1">Breakdown of earnings per transaction</p>
                </div>
                <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Farmer</th>
                        <th className="px-4 py-3">Collector</th>
                        <th className="px-4 py-3 text-right">Liters</th>
                        <th className="px-4 py-3 text-right">Rate</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3 text-right">Commission</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {records.filter(r => r.status === 'confirmed').map((record, index) => (
                        <tr key={record.id}>
                          <td className="px-4 py-3 text-slate-500 font-medium">{index + 1}</td>
                          <td className="px-4 py-3 text-slate-600">{new Date(record.collection_date).toLocaleDateString()}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{record.farmer_name || 'N/A'}</td>
                          <td className="px-4 py-3 text-slate-600">{record.collector_name || 'N/A'}</td>
                          <td className="px-4 py-3 text-right font-medium text-blue-600">{Number(record.liters).toFixed(1)}L</td>
                          <td className="px-4 py-3 text-right text-slate-600">{record.rate_per_liter || 500} RWF</td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-600">{Number(record.total_amount).toLocaleString()} RWF</td>
                          <td className="px-4 py-3 text-right text-purple-600">{Math.round(Number(record.total_amount) * 0.05).toLocaleString()} RWF</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.status === 'confirmed' ? 'bg-green-100 text-green-700' : record.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold">
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-right">TOTALS:</td>
                        <td className="px-4 py-3 text-right text-blue-600">{records.reduce((s, r) => s + Number(r.liters), 0).toFixed(1)}L</td>
                        <td className="px-4 py-3"></td>
                        <td className="px-4 py-3 text-right text-emerald-600">{records.reduce((s, r) => s + Number(r.total_amount), 0).toLocaleString()} RWF</td>
                        <td className="px-4 py-3 text-right text-purple-600">{Math.round(records.reduce((s, r) => s + Number(r.total_amount), 0) * 0.05).toLocaleString()} RWF</td>
                        <td className="px-4 py-3"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeItem === 'analytics' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
                <StatCard icon={faCow} label={t('analytics.totalCollected')} value={`${records.reduce((s, r) => s + Number(r.liters), 0).toLocaleString()}L`} gradient="from-purple-500 to-indigo-600" />
                <StatCard icon={faCoins} label={t('analytics.totalPayments')} value={`${confirmedAmount.toLocaleString()}`} sub="RWF" gradient="from-blue-500 to-blue-600" />
                <StatCard icon={faCoins} label={t('analytics.totalCommission')} value={`${Math.round(totalCommission).toLocaleString()}`} sub="RWF" gradient="from-emerald-500 to-teal-600" />
                <StatCard icon={faBan} label={t('analytics.rejectedQuantity')} value={`${records.filter(r => r.status === 'rejected').reduce((s, r) => s + Number(r.liters), 0).toLocaleString()}L`} gradient="from-red-500 to-rose-600" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-lg">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">{t('analytics.milkCollectionTrends')}</h3>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Line type="monotone" dataKey="liters" stroke="#9333ea" strokeWidth={3} dot={{ r: 5, fill: '#9333ea' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-lg">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">{t('analytics.revenueOverview')}</h3>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Revenue (RWF)" />
                        <Bar dataKey="liters" fill="#10b981" radius={[8, 8, 0, 0]} name="Liters" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Detailed Analytics Table */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-indigo-50">
                  <h3 className="text-xl font-bold text-slate-900">Detailed Analytics - All Records</h3>
                  <p className="text-sm text-slate-500">Complete breakdown of all {records.length} milk collection records</p>
                </div>
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-sm">
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Farmer</th>
                        <th className="px-4 py-3">Collector</th>
                        <th className="px-4 py-3 text-right">Liters</th>
                        <th className="px-4 py-3 text-right">Rate</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3 text-right">Commission</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {records.map((record, i) => (
                        <tr key={record.id}>
                          <td className="px-4 py-3 text-slate-500 font-medium">{i + 1}</td>
                          <td className="px-4 py-3 text-slate-600">{new Date(record.collection_date).toLocaleDateString()}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{record.farmer_name || 'N/A'}</td>
                          <td className="px-4 py-3 text-slate-600">{record.collector_name || 'N/A'}</td>
                          <td className="px-4 py-3 text-right font-medium text-blue-600">{Number(record.liters).toFixed(1)}L</td>
                          <td className="px-4 py-3 text-right text-slate-600">{record.rate_per_liter || 500} RWF</td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-600">{Number(record.total_amount).toLocaleString()} RWF</td>
                          <td className="px-4 py-3 text-right text-purple-600">{Math.round(Number(record.total_amount) * 0.05).toLocaleString()} RWF</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.status === 'confirmed' ? 'bg-green-100 text-green-700' : record.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold">
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-right">TOTALS:</td>
                        <td className="px-4 py-3 text-right text-blue-600">{records.reduce((s, r) => s + Number(r.liters), 0).toFixed(1)}L</td>
                        <td className="px-4 py-3"></td>
                        <td className="px-4 py-3 text-right text-emerald-600">{records.reduce((s, r) => s + Number(r.total_amount), 0).toLocaleString()} RWF</td>
                        <td className="px-4 py-3 text-right text-purple-600">{Math.round(records.reduce((s, r) => s + Number(r.total_amount), 0) * 0.05).toLocaleString()} RWF</td>
                        <td className="px-4 py-3"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeItem === 'notifications' && <AdminNotifications />}

          {activeItem === 'messages' && <MessagesView initialContactId={targetContactId} />}

          {activeItem === 'reports' && (
            <>
              {!reportType ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <button onClick={() => handleGenerateReport('daily')} className="p-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl text-white hover:shadow-2xl transition-all text-left group active:scale-[0.98]">
                    <FontAwesomeIcon icon={faFileInvoice} className="text-4xl mb-4 group-hover:scale-110 transition-transform" />
                    <h4 className="font-bold text-xl mb-1">{t('reports.daily')}</h4>
                    <p className="text-purple-200 text-sm">{t('reports.viewTodaysCollection')}</p>
                  </button>
                  <button onClick={() => handleGenerateReport('weekly')} className="p-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl text-white hover:shadow-2xl transition-all text-left group active:scale-[0.98]">
                    <FontAwesomeIcon icon={faChartBar} className="text-4xl mb-4 group-hover:scale-110 transition-transform" />
                    <h4 className="font-bold text-xl mb-1">{t('reports.weekly')}</h4>
                    <p className="text-blue-200 text-sm">{t('reports.viewWeeklyAnalytics')}</p>
                  </button>
                  <button onClick={() => handleGenerateReport('monthly')} className="p-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl text-white hover:shadow-2xl transition-all text-left group active:scale-[0.98]">
                    <FontAwesomeIcon icon={faDownload} className="text-4xl mb-4 group-hover:scale-110 transition-transform" />
                    <h4 className="font-bold text-xl mb-1">{t('reports.monthly')}</h4>
                    <p className="text-emerald-200 text-sm">{t('reports.downloadMonthlySummary')}</p>
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50">
                    <h3 className="text-xl font-bold text-slate-900">
                      {reportType === 'daily' ? t('reports.daily') : reportType === 'weekly' ? t('reports.weekly') : t('reports.monthly')}
                    </h3>
                    <div className="flex gap-3">
                      <button onClick={() => setReportType(null)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-300 transition-all">
                        {t('common.back')}
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    {reportLoading ? (
                      <div className="text-center py-10">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-3"></div>
                        <p className="text-slate-500">{t('common.loading')}</p>
                      </div>
                    ) : reportData ? (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                          <div className="bg-purple-50 p-4 rounded-2xl text-center">
                            <p className="text-sm text-purple-600 font-medium">{t('common.total')} {t('milk.liters')}</p>
                            <p className="text-2xl font-bold text-purple-700">{(reportData.summary?.totalLiters || 0).toLocaleString()}L</p>
                          </div>
                          <div className="bg-blue-50 p-4 rounded-2xl text-center">
                            <p className="text-sm text-blue-600 font-medium">{t('milk.totalAmount')}</p>
                            <p className="text-2xl font-bold text-blue-700">{(reportData.summary?.totalAmount || 0).toLocaleString()} RWF</p>
                          </div>
                          <div className="bg-green-50 p-4 rounded-2xl text-center">
                            <p className="text-sm text-green-600 font-medium">{t('milk.status.confirmed')}</p>
                            <p className="text-2xl font-bold text-green-700">{reportData.summary?.confirmed || 0}</p>
                          </div>
                          <div className="bg-red-50 p-4 rounded-2xl text-center">
                            <p className="text-sm text-red-600 font-medium">{t('milk.status.rejected')}</p>
                            <p className="text-2xl font-bold text-red-700">{reportData.summary?.rejected || 0}</p>
                          </div>
                        </div>
                        {reportData.records && reportData.records.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="bg-slate-50 text-slate-500 text-sm">
                                  <th className="px-4 py-3 font-semibold">{t('milk.farmer')}</th>
                                  <th className="px-4 py-3 font-semibold">{t('milk.liters')}</th>
                                  <th className="px-4 py-3 font-semibold">{t('milk.amount')}</th>
                                  <th className="px-4 py-3 font-semibold">{t('common.date')}</th>
                                  <th className="px-4 py-3 font-semibold">{t('common.status')}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {reportData.records.map((r: any) => (
                                  <tr key={r.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 text-slate-900">{r.farmer_name || 'N/A'}</td>
                                    <td className="px-4 py-3 text-slate-900 font-medium">{r.liters}L</td>
                                    <td className="px-4 py-3 text-emerald-600 font-medium">{Number(r.total_amount).toLocaleString()} RWF</td>
                                    <td className="px-4 py-3 text-slate-600">{new Date(r.collection_date).toLocaleDateString()}</td>
                                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${r.status === 'confirmed' ? 'bg-green-100 text-green-700' : r.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{r.status}</span></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : reportData.dailyReport ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="bg-slate-50 text-slate-500 text-sm">
                                  <th className="px-4 py-3 font-semibold">{t('common.date')}</th>
                                  <th className="px-4 py-3 font-semibold">{t('dashboard.totalDeliveries')}</th>
                                  <th className="px-4 py-3 font-semibold">{t('milk.totalAmount')}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {reportData.dailyReport.map((r: any, i: number) => (
                                  <tr key={i} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 text-slate-900">{new Date(r.collection_date).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 text-slate-900 font-medium">{Number(r.total_liters).toLocaleString()}L</td>
                                    <td className="px-4 py-3 text-emerald-600 font-medium">{Number(r.total_amount).toLocaleString()} RWF</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-center py-10 text-slate-400">{t('reports.noReportData')}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-center py-10 text-slate-400">{t('reports.noReportData')}</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {activeItem === 'payouts' && <PayoutsView />}
          
          {activeItem === 'settings' && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">{t('settings.title')}</h3>
                  <p className="text-slate-400 font-medium">Control your platform preferences and account security</p>
                </div>
                <button 
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="w-full sm:w-auto px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={savingSettings ? faClock : faSave} className="mr-2" />
                  {savingSettings ? t('common.loading') : t('common.saveChanges')}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-4">
                  <div className="p-1 bg-slate-100 rounded-[2rem] flex flex-col">
                    <button onClick={() => setSettingsTab('info')} className={`px-6 py-4 rounded-[1.8rem] shadow-sm font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all ${settingsTab === 'info' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
                      <FontAwesomeIcon icon={faUserShield} className={settingsTab === 'info' ? 'text-emerald-500' : ''} />
                      Account info
                    </button>
                    <button onClick={() => setSettingsTab('prefs')} className={`px-6 py-4 rounded-[1.8rem] font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all ${settingsTab === 'prefs' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                      <FontAwesomeIcon icon={faCog} className={settingsTab === 'prefs' ? 'text-emerald-500' : ''} />
                      Preferences
                    </button>
                    <button onClick={() => setSettingsTab('notes')} className={`px-6 py-4 rounded-[1.8rem] font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all ${settingsTab === 'notes' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                      <FontAwesomeIcon icon={faBell} className={settingsTab === 'notes' ? 'text-emerald-500' : ''} />
                      Notifications
                    </button>
                  </div>

                  <div className="bg-emerald-600 p-8 rounded-[2rem] text-white relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <h4 className="text-lg font-black tracking-tight relative z-10">Premium Admin</h4>
                    <p className="text-[10px] font-bold text-emerald-100/60 uppercase tracking-widest mt-1 relative z-10">Status: Active</p>
                    <div className="mt-8 relative z-10">
                      <p className="text-xs font-bold text-emerald-100 line-clamp-3">You have 100% full access to all system management modules.</p>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                  {settingsTab === 'info' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50">
                        <h4 className="text-xl font-black text-slate-900 tracking-tight mb-8">Personal Information</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('settings.name')}</label>
                            <input type="text" defaultValue={adminName} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-slate-900" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('settings.email')}</label>
                            <input type="email" defaultValue="admin@amatalink.com" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-slate-900" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                            <input type="text" defaultValue="+250 788 123 456" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-slate-900" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Office Location</label>
                            <input type="text" defaultValue="Kigali, Rwanda" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-slate-900" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {settingsTab === 'prefs' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50">
                      <h4 className="text-xl font-black text-slate-900 tracking-tight mb-8">System Preferences</h4>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl">
                          <div>
                            <p className="font-bold text-slate-900">Default Currency</p>
                            <p className="text-xs text-slate-400 mt-1">Set the primary currency for the platform</p>
                          </div>
                          <select 
                            value={platformSettings.defaultCurrency} 
                            onChange={(e) => setPlatformSettings({ ...platformSettings, defaultCurrency: e.target.value })}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-900 outline-none"
                          >
                            <option value="RWF">RWF</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl">
                          <div>
                            <p className="font-bold text-slate-900">Milk Price per Liter (RWF)</p>
                            <p className="text-xs text-slate-400 mt-1">Base price used for calculations</p>
                          </div>
                          <input 
                            type="number" 
                            value={platformSettings.milkPricePerLiter}
                            onChange={(e) => setPlatformSettings({ ...platformSettings, milkPricePerLiter: Number(e.target.value) })}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-900 outline-none w-24 text-right"
                          />
                        </div>
                        <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl">
                          <div>
                            <p className="font-bold text-slate-900">Language</p>
                            <p className="text-xs text-slate-400 mt-1">Select your preferred interface language</p>
                          </div>
                          <select 
                            value={language} 
                            onChange={(e) => setLanguage(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-900 outline-none"
                          >
                            <option value="en">English</option>
                            <option value="rw">Kinyarwanda</option>
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {settingsTab === 'notes' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50">
                      <h4 className="text-xl font-black text-slate-900 tracking-tight mb-8">Notification Settings</h4>
                      <div className="space-y-4">
                        {[{ label: 'System Alerts', desc: 'Critical system updates and errors' }, { label: 'New Milk Records', desc: 'When collectors upload new data' }, { label: 'Payments', desc: 'Status of processed payments' }].map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer group">
                            <div>
                              <p className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{item.label}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                            </div>
                            <div className="w-12 h-6 bg-emerald-500 rounded-full relative">
                              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setEditingUser(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-white rounded-[2.5rem] p-6 sm:p-10 w-full max-w-xl shadow-2xl border border-slate-100" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t('common.editUser')}</h3>
                <p className="text-xs text-slate-400 font-medium">Update profile information</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{t('common.fullName')}</label>
                  <input type="text" value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-slate-900" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{t('common.email')}</label>
                  <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-slate-900" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{t('common.phone')}</label>
                <input type="text" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-slate-900" />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4 sticky bottom-0 bg-white pb-2 z-10 border-t border-slate-50">
                <button onClick={handleSaveEdit} className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2">
                  <FontAwesomeIcon icon={faSave} /> {t('common.saveChanges')}
                </button>
                <button onClick={() => setEditingUser(null)} className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-200 transition-all active:scale-95">
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setIsCreateModalOpen(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-white rounded-[2.5rem] p-6 sm:p-10 w-full max-w-xl shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8 sticky top-0 bg-white pb-4 z-10 border-b border-slate-50">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t('users.createUser')}</h3>
                <p className="text-xs text-slate-400 font-medium">Register a new system user</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{t('common.fullName')}</label>
                  <input type="text" value={createForm.fullName} onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-slate-900" placeholder="Enter full name" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{t('common.email')}</label>
                  <input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-slate-900" placeholder="email@example.com" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{t('common.phone')}</label>
                  <input type="text" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-slate-900" placeholder="+250 788 000 000" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                  <input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-slate-900" placeholder="Min 6 characters" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{t('common.role')}</label>
                <select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-slate-900">
                  <option value="farmer">Farmer</option>
                  <option value="collector">Collector</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {createForm.role === 'farmer' && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{t('common.village')}</label>
                  <input type="text" value={createForm.village} onChange={(e) => setCreateForm({ ...createForm, village: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-slate-900" placeholder="Enter village" />
                </div>
              )}
              {createForm.role === 'collector' && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Sector</label>
                  <input type="text" value={createForm.sector} onChange={(e) => setCreateForm({ ...createForm, sector: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-slate-900" placeholder="Enter sector" />
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 sticky bottom-0 bg-white pb-2 z-10 border-t border-slate-50">
                <button onClick={handleCreateUser} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2">
                  <FontAwesomeIcon icon={faPlus} /> {t('users.createUser')}
                </button>
                <button onClick={() => setIsCreateModalOpen(false)} className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-200 transition-all active:scale-95">
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function UserAvatar({ name, role }: { name: string; role: string }) {
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const colors: Record<string, string> = {
    admin: 'from-purple-500 to-indigo-600',
    collector: 'from-blue-500 to-cyan-500',
    farmer: 'from-emerald-500 to-teal-500'
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative">
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
