import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCow, faUsers, faChartLine, faCoins, faTimesCircle, faSms, faCalendar, faDownload } from '@fortawesome/free-solid-svg-icons';
import { adminApi } from '../../api';
import { useI18n } from '../../i18n';
import { toast } from 'sonner';

interface AnalyticsDashboardProps {
  onClose?: () => void;
}

interface AnalyticsData {
  dailyData: any[];
  weeklyData: any[];
  monthlyData: any[];
  stats: {
    totalMilk: number;
    totalPayments: number;
    totalCommission: number;
    activeUsers: number;
    rejectedQuantity: number;
    smsCount: number;
  };
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AnalyticsDashboard({ onClose }: AnalyticsDashboardProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData>({
    dailyData: [],
    weeklyData: [],
    monthlyData: [],
    stats: {
      totalMilk: 0,
      totalPayments: 0,
      totalCommission: 0,
      activeUsers: 0,
      rejectedQuantity: 0,
      smsCount: 0
    }
  });
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [statsData, farmersData] = await Promise.all([
        adminApi.getStats(),
        adminApi.getFarmers()
      ]);

      // Generate sample data for charts (in real app, this would come from backend)
      const dailyData = generateDailyData();
      const weeklyData = generateWeeklyData();
      const monthlyData = generateMonthlyData();

      setData({
        dailyData,
        weeklyData,
        monthlyData,
        stats: {
          totalMilk: statsData.total_liters_all_time || 0,
          totalPayments: statsData.total_earnings_all_time || 0,
          totalCommission: (statsData.total_earnings_all_time || 0) * 0.05, // 5% commission
          activeUsers: (statsData.total_farmers || 0) + (statsData.total_collectors || 0),
          rejectedQuantity: 0, // Would come from milk records with status='rejected'
          smsCount: 0 // Would come from notifications table
        }
      });
    } catch (error: any) {
      toast.error('Failed to load analytics: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateDailyData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({
      name: day,
      liters: Math.floor(Math.random() * 500) + 100,
      earnings: Math.floor(Math.random() * 50000) + 10000,
      commission: Math.floor(Math.random() * 2500) + 500
    }));
  };

  const generateWeeklyData = () => {
    return Array.from({ length: 4 }, (_, i) => ({
      name: `Week ${i + 1}`,
      liters: Math.floor(Math.random() * 3000) + 1000,
      earnings: Math.floor(Math.random() * 300000) + 100000,
      commission: Math.floor(Math.random() * 15000) + 3000
    }));
  };

  const generateMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map(month => ({
      name: month,
      liters: Math.floor(Math.random() * 10000) + 2000,
      earnings: Math.floor(Math.random() * 1000000) + 200000,
      commission: Math.floor(Math.random() * 50000) + 10000
    }));
  };

  const currentData = timeRange === 'daily' ? data.dailyData : 
                     timeRange === 'weekly' ? data.weeklyData : data.monthlyData;

  const statCards = [
    { title: t('analytics.totalCollected'), value: `${data.stats.totalMilk.toLocaleString()}L`, icon: faCow, color: 'bg-green-500' },
    { title: t('analytics.totalPayments'), value: `${data.stats.totalPayments.toLocaleString()} RWF`, icon: faCoins, color: 'bg-blue-500' },
    { title: t('analytics.totalCommission'), value: `${data.stats.totalCommission.toLocaleString()} RWF`, icon: faChartLine, color: 'bg-purple-500' },
    { title: t('analytics.activeUsers'), value: data.stats.activeUsers.toString(), icon: faUsers, color: 'bg-orange-500' },
    { title: t('analytics.rejectedQuantity'), value: `${data.stats.rejectedQuantity}L`, icon: faTimesCircle, color: 'bg-red-500' },
    { title: t('analytics.smsUsage'), value: data.stats.smsCount.toString(), icon: faSms, color: 'bg-teal-500' }
  ];

  const pieData = [
    { name: t('milk.status.confirmed'), value: 75 },
    { name: t('milk.status.pending'), value: 15 },
    { name: t('milk.status.rejected'), value: 10 }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('analytics.analytics')}</h2>
          <p className="text-slate-500">{t('dashboard.overview')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('daily')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeRange === 'daily' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Daily
          </button>
          <button
            onClick={() => setTimeRange('weekly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeRange === 'weekly' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Weekly
          </button>
          <button
            onClick={() => setTimeRange('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeRange === 'monthly' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-slate-50 rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
              <FontAwesomeIcon icon={stat.icon} className="text-white text-lg" />
            </div>
            <p className="text-xs text-slate-500 mb-1">{stat.title}</p>
            <p className="text-lg font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Line Chart - Collection Trend */}
        <div className="bg-slate-50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">{t('analytics.totalCollected')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentData}>
                <defs>
                  <linearGradient id="colorLiters" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  formatter={(value: number) => [`${value.toLocaleString()} L`, 'Milk']}
                />
                <Area type="monotone" dataKey="liters" stroke="#10b981" fillOpacity={1} fill="url(#colorLiters)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart - Earnings */}
        <div className="bg-slate-50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">{t('analytics.totalPayments')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  formatter={(value: number) => [`${value.toLocaleString()} RWF`, 'Earnings']}
                />
                <Bar dataKey="earnings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart - Commission */}
        <div className="bg-slate-50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">{t('analytics.totalCommission')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  formatter={(value: number) => [`${value.toLocaleString()} RWF`, 'Commission']}
                />
                <Line type="monotone" dataKey="commission" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart - Status Distribution */}
        <div className="bg-slate-50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">{t('common.status')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="mt-8 flex justify-end gap-4">
        <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2">
          <FontAwesomeIcon icon={faDownload} />
          {t('reports.exportPDF')}
        </button>
        <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2">
          <FontAwesomeIcon icon={faDownload} />
          {t('reports.exportExcel')}
        </button>
      </div>
    </div>
  );
}
