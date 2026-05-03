import React, { useEffect, useState } from 'react';
import { milkApi } from '../../api';
import { toast } from 'sonner';
import { useI18n } from '../../i18n';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faDroplet, faCoins, faCheckCircle, faClock, faXmarkCircle, faSearch } from '@fortawesome/free-solid-svg-icons';

export default function FarmerDeliveriesView() {
  const { t } = useI18n();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await milkApi.getFarmerRecords();
      setRecords(data || []);
    } catch (e: any) {
      toast.error(t('errors.fetchFailed') + ': ' + (e.message || e));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filteredRecords = records.filter(r => {
    const search = searchTerm.toLowerCase();
    const date = new Date(r.collection_date).toLocaleDateString();
    return (
      date.includes(search) ||
      r.liters?.toString().includes(searchTerm) ||
      r.total_amount?.toString().includes(searchTerm) ||
      r.status?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/60 overflow-hidden">
      <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/50 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t('dashboard.recentDeliveries')}</h3>
          <p className="text-xs text-slate-400 font-medium mt-1">Full history of your milk supplies</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-full sm:w-64">
            <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm" />
            <input
              type="text"
              placeholder={t('dashboard.searchFarmer')} // Using common search key
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm font-medium"
            />
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm shadow-emerald-500/10">
            <FontAwesomeIcon icon={faDroplet} className="text-xl" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium italic">{t('common.loading')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto custom-scrollbar">
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
              {filteredRecords.length > 0 ? filteredRecords.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-sm" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">{new Date(r.collection_date).toLocaleDateString()}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{r.collection_time || '08:00 AM'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="inline-flex items-center px-4 py-2 bg-slate-100 rounded-xl font-black text-slate-900 shadow-inner group-hover:bg-white transition-colors">
                      {r.liters}<span className="text-[10px] ml-1 text-slate-400">L</span>
                    </span>
                  </td>
                  <td className="px-8 py-5 text-slate-600 font-medium text-[13.5px]">{r.rate_per_liter} RWF</td>
                  <td className="px-8 py-5">
                    <p className="text-emerald-600 font-black text-lg -tracking-tighter">
                      <span className="text-[10px] text-slate-400 mr-1 font-bold">RWF</span>
                      {Number(r.total_amount).toLocaleString()}
                    </p>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${r.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700 shadow-emerald-500/10' : r.status === 'rejected' ? 'bg-red-100 text-red-700 shadow-red-500/10' : 'bg-orange-100 text-orange-700 shadow-orange-500/10'}`}>
                      {t(`milk.status.${r.status}`)}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-4xl" />
                      </div>
                      <p className="text-slate-400 font-medium italic">No delivery records found matching "{searchTerm}"</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
