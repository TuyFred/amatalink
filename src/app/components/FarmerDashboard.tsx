import { useState, useEffect, useMemo } from 'react';
import { faChartLine, faCalendarAlt, faCoins, faBell, faCheckCircle, faClock, faExclamationCircle, faChevronLeft, faChevronRight, faExclamationTriangle, faInfoCircle, faWallet, faMoneyCheckAlt, faTimes } from '@fortawesome/free-solid-svg-icons';
import { safeSum, safeNumber, formatCurrency, formatLiters } from '../utils/math';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Sidebar } from './Sidebar';
import { Milk } from 'lucide-react';
import { milkApi, notificationsApi, paymentsApi, authApi } from '../api';
import { toast } from 'sonner';
import { useI18n } from '../i18n';
import FarmerDeliveriesView from './farmer/FarmerDeliveriesView';
import FarmerAnalytics from './farmer/FarmerAnalytics';
import FarmerNotifications from './farmer/FarmerNotifications';
import MessagesView from './MessagesView';
import ReportView from './reports/ReportView';

interface FarmerDashboardProps {
  farmerName: string;
  onLogout: () => void;
}

export function FarmerDashboard({ farmerName, onLogout }: FarmerDashboardProps) {
  const { t } = useI18n();
  const [activeItem, setActiveItem] = useState('overview');
  const [milkRecords, setMilkRecords] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlySummary, setMonthlySummary] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Pagination state for delivery history table
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [records, notes, summary, methods, profile] = await Promise.all([
          milkApi.getFarmerRecords(),
          notificationsApi.getNotifications(),
          paymentsApi.getFarmerMonthlySummary(),
          paymentsApi.getMethods(),
          authApi.getMe()
        ]);
        setMilkRecords(records);
        setNotifications(notes);
        setMonthlySummary(summary);
        setPaymentMethods(methods);
        setUserProfile(profile);
      } catch (error: any) {
        toast.error(t('errors.fetchFailed') + ': ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [t]);

  const handlePayoutRequest = async (methodId: number, accountNumber: string) => {
    if (!monthlySummary || monthlySummary.total_amount <= 0) {
      toast.error('Ntabwo mushobora gusaba kwishyurwa kuko nta mafaranga mufite kuri uyu kwezi.');
      return;
    }
    setSubmittingPayment(true);
    try {
      await paymentsApi.requestPayout({
        amount: monthlySummary.total_amount,
        payment_method_id: methodId,
        account_number: accountNumber
      });
      toast.success('Gusaba kwishyurwa byoherejwe neza!');
      setShowPaymentModal(false);
      // Refresh summary
      const newSummary = await paymentsApi.getFarmerMonthlySummary();
      setMonthlySummary(newSummary);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Paginated delivery records
  const totalPages = Math.ceil(milkRecords.length / itemsPerPage);
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return milkRecords.slice(start, start + itemsPerPage);
  }, [milkRecords, currentPage, itemsPerPage]);

  const totalLiters = safeSum(milkRecords, 'liters');
  const totalEarnings = safeSum(milkRecords, 'total_amount');
  const todaysRecords = milkRecords.filter(r => {
    const today = new Date().toISOString().split('T')[0];
    return r.collection_date.split('T')[0] === today;
  });
  const todaysLiters = safeSum(todaysRecords, 'liters');


  const chartData = useMemo(() => {
    const days: Record<string, { liters: number; earnings: number }> = {};
    milkRecords.forEach(r => {
      const d = new Date(r.collection_date).toLocaleDateString('en-RW', { day: 'numeric', month: 'short' });
      if (!days[d]) days[d] = { liters: 0, earnings: 0 };
      days[d].liters += safeNumber(r.liters);
      days[d].earnings += safeNumber(r.total_amount);
    });
    return Object.entries(days).slice(-14).reverse().map(([date, v]) => ({ date, ...v }));
  }, [milkRecords]);


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (activeItem === 'my-milk') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex">
        <Sidebar role="farmer" userName={farmerName} onLogout={onLogout} activeItem={activeItem} onItemSelect={setActiveItem} />
        <main className="ml-64 flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <FarmerDeliveriesView />
          </div>
        </main>
      </div>
    );
  }

  if (activeItem === 'stats') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex">
        <Sidebar role="farmer" userName={farmerName} onLogout={onLogout} activeItem={activeItem} onItemSelect={setActiveItem} />
        <main className="ml-64 flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <FarmerAnalytics />
          </div>
        </main>
      </div>
    );
  }

  if (activeItem === 'notifications') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex">
        <Sidebar role="farmer" userName={farmerName} onLogout={onLogout} activeItem={activeItem} onItemSelect={setActiveItem} />
        <main className="lg:ml-72 flex-1 p-4 sm:p-6 lg:p-10 transition-all duration-300">
          <div className="max-w-[1700px] mx-auto">
            <FarmerNotifications />
          </div>
        </main>
      </div>
    );
  }

  if (activeItem === 'reports') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex">
        <Sidebar role="farmer" userName={farmerName} onLogout={onLogout} activeItem={activeItem} onItemSelect={setActiveItem} />
        <main className="lg:ml-72 flex-1 p-4 sm:p-6 lg:p-10 transition-all duration-300">
          <div className="max-w-[1700px] mx-auto">
            <ReportView />
          </div>
        </main>
      </div>
    );
  }

  if (activeItem === 'messages') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex">
        <Sidebar role="farmer" userName={farmerName} onLogout={onLogout} activeItem={activeItem} onItemSelect={setActiveItem} />
        <main className="lg:ml-72 flex-1 p-4 sm:p-6 lg:p-10 transition-all duration-300">
          <div className="max-w-[1700px] mx-auto">
            <MessagesView />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row shadow-inner overflow-x-hidden">
      <Sidebar role="farmer" userName={farmerName} onLogout={onLogout} activeItem={activeItem} onItemSelect={setActiveItem} />

      <main className="flex-1 lg:ml-72 min-h-screen transition-all duration-300">
        <div className="max-w-[1700px] mx-auto p-4 sm:p-6 lg:p-10">
          {/* Header */}
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">{t('dashboard.farmerDashboard')}</h1>
              <p className="text-slate-400 font-medium mt-1">{t('dashboard.welcomeBack')}, <span className="text-slate-900 font-bold">{farmerName.split(' ')[0]}</span></p>
            </div>
            <div className="bg-white px-6 py-4 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1.5">{t('dashboard.currentDate')}</p>
              <p className="text-xs font-black text-slate-900">{new Date().toLocaleDateString('en-RW', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-10">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg relative overflow-hidden group hover:shadow-xl transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <FontAwesomeIcon icon={faChartLine} className="text-6xl text-green-600" />
              </div>
              <div className="relative z-10">
                <p className="text-slate-500 font-medium text-sm">{t('dashboard.totalDeliveries')}</p>
                <h3 className="text-4xl font-bold text-slate-900 mt-2">{formatLiters(totalLiters)}</h3>

                <div className="mt-4 flex items-center gap-2 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-lg w-fit">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>{t('dashboard.alreadyDelivered')}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg relative overflow-hidden group hover:shadow-xl transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <FontAwesomeIcon icon={faCoins} className="text-6xl text-emerald-600" />
              </div>
              <div className="relative z-10">
                <p className="text-slate-500 font-medium text-sm">{t('dashboard.totalEarnings')}</p>
                <h3 className="text-4xl font-bold text-slate-900 mt-2">{formatCurrency(totalEarnings)} RWF</h3>

                <div className="mt-4 flex items-center gap-2 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg w-fit">
                  <FontAwesomeIcon icon={faChartLine} />
                  <span>{t('dashboard.vsLastMonth')}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg relative overflow-hidden group hover:shadow-xl transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <FontAwesomeIcon icon={faWallet} className="text-6xl text-purple-600" />
              </div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <p className="text-slate-500 font-medium text-sm">Monthly Payout Status</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">
                    {monthlySummary ? formatCurrency(monthlySummary.total_amount) : '0'} RWF
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Earnings this month</p>
                </div>

                <div className="mt-4">
                  {monthlySummary?.pendingRequest ? (
                    <div className="flex items-center gap-2 text-orange-600 text-xs font-bold bg-orange-50 px-3 py-2 rounded-xl">
                      <FontAwesomeIcon icon={faClock} />
                      <span>Pending Payout: {formatCurrency(monthlySummary.pendingRequest.amount)} RWF</span>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowPaymentModal(true)}
                      className="w-full py-2 bg-purple-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
                    >
                      Pick Payment Method
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Modal */}
          {showPaymentModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-8 bg-gradient-to-br from-purple-600 to-indigo-700 text-white relative">
                  <button 
                    onClick={() => setShowPaymentModal(false)}
                    className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                  <FontAwesomeIcon icon={faMoneyCheckAlt} className="text-4xl mb-4 opacity-80" />
                  <h3 className="text-2xl font-black tracking-tight">Select Payment Method</h3>
                  <p className="text-purple-100 text-sm mt-1">Amount to be requested: <span className="font-bold">{monthlySummary ? formatCurrency(monthlySummary.total_amount) : '0'} RWF</span></p>
                </div>
                <div className="p-8 space-y-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Available Options</p>
                  <div className="space-y-3">
                    {paymentMethods.map(method => (
                      <button
                        key={method.id}
                        disabled={submittingPayment}
                        onClick={() => handlePayoutRequest(method.id, userProfile?.phone || '')}
                        className="w-full p-4 border border-slate-100 rounded-2xl flex items-center justify-between hover:border-purple-200 hover:bg-purple-50 group transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-white text-slate-400 group-hover:text-purple-600 transition-colors">
                            <FontAwesomeIcon icon={faWallet} />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-slate-900">{method.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">Using: {userProfile?.phone || 'No phone set'}</p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full border-2 border-slate-100 flex items-center justify-center group-hover:border-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all text-transparent">
                          <FontAwesomeIcon icon={faCheckCircle} className="text-xs" />
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 italic text-center mt-6">
                    Payment will be processed by your collector based on your monthly contract.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Charts & Notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-lg">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-slate-900">{t('dashboard.productionTrend')}</h3>
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                  <FontAwesomeIcon icon={faChartLine} className="text-slate-400" />
                </div>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorLiters" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="liters" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#colorLiters)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-lg">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-slate-900">{t('dashboard.recentNotifications')}</h3>
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                  <FontAwesomeIcon icon={faBell} className="text-slate-400" />
                </div>
              </div>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {notifications.length > 0 ? notifications.map((note) => {
                  let icon = faBell;
                  let colorClass = 'bg-green-100 text-green-600';
                  
                  if (note.type === 'urgent') {
                    icon = faExclamationCircle;
                    colorClass = 'bg-red-100 text-red-600';
                  } else if (note.type === 'warning') {
                    icon = faExclamationTriangle;
                    colorClass = 'bg-orange-100 text-orange-600';
                  } else if (note.type === 'concern' || note.type === 'high') {
                    icon = note.type === 'high' ? faCheckCircle : faInfoCircle;
                    colorClass = note.type === 'high' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600';
                  } else if (note.type === 'alert') {
                    icon = faExclamationCircle;
                    colorClass = 'bg-red-100 text-red-600';
                  }

                  return (
                    <div key={note.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4 hover:bg-slate-100 transition-colors cursor-pointer">
                      <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${colorClass}`}>
                        <FontAwesomeIcon icon={icon} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{note.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">{note.message}</p>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium uppercase tracking-wider">
                          {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-10">
                    <FontAwesomeIcon icon={faBell} className="text-slate-200 text-4xl mb-3" />
                    <p className="text-slate-400 italic">{t('dashboard.noNotifications')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Delivery History Table */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/60 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-white to-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t('dashboard.recentDeliveries')}</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">Your latest milk supply logs</p>
              </div>
              <button onClick={() => setActiveItem('my-milk')} className="px-6 py-2.5 bg-emerald-50 text-emerald-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                {t('dashboard.viewFullHistory')}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
                    <th className="px-8 py-5 border-b border-slate-100/50">{t('common.date')}</th>
                    <th className="px-8 py-5 border-b border-slate-100/50">{t('milk.quantity')}</th>
                    <th className="px-8 py-5 border-b border-slate-100/50">{t('milk.rate')}</th>
                    <th className="px-8 py-5 border-b border-slate-100/50">{t('milk.totalAmount')}</th>
                    <th className="px-8 py-5 border-b border-slate-100/50">{t('common.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {paginatedRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                            <FontAwesomeIcon icon={faCalendarAlt} className="text-sm" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">{new Date(record.collection_date).toLocaleDateString()}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{record.collection_time || '08:00 AM'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="inline-flex items-center px-4 py-2 bg-slate-100 rounded-xl font-black text-slate-900 shadow-inner group-hover:bg-white transition-colors">
                          {record.liters}<span className="text-[10px] ml-1 text-slate-400">L</span>
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-slate-600 font-bold text-[13px]">{record.rate_per_liter} RWF</p>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-emerald-600 font-black text-lg -tracking-tighter">
                          <span className="text-[10px] text-slate-400 mr-1 font-bold">RWF</span>
                          {formatCurrency(record.total_amount)}

                        </p>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${record.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700 shadow-emerald-500/10' :
                          record.status === 'rejected' ? 'bg-red-100 text-red-700 shadow-red-500/10' : 'bg-orange-100 text-orange-700 shadow-orange-500/10'
                          }`}>
                          {t(`milk.status.${record.status}`)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {milkRecords.length > 0 && (
              <div className="px-8 py-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Show:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="px-2 py-1 border border-slate-200 rounded text-sm"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-slate-200 rounded disabled:opacity-50 text-sm hover:bg-slate-50"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} />
                  </button>
                  <span className="text-sm">Page {currentPage} of {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-slate-200 rounded disabled:opacity-50 text-sm hover:bg-slate-50"
                  >
                    <FontAwesomeIcon icon={faChevronRight} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}