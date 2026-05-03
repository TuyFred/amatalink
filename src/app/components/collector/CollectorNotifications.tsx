import React, { useEffect, useState } from 'react';
import { notificationsApi } from '../../api';
import { toast } from 'sonner';
import { useI18n } from '../../i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faCheckCircle, faEnvelope, faInfoCircle, faExclamationTriangle, faTruckLoading, faUserEdit, faUserMinus, faMoneyBillWave, faHistory } from '@fortawesome/free-solid-svg-icons';

export default function CollectorNotifications() {
  const { t } = useI18n();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await notificationsApi.getNotifications();
      setNotes(data || []);
    } catch (e: any) {
      toast.error('Failed to load notifications: ' + (e.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotes(notes.map(n => n.id === id ? { ...n, read: true } : n));
      toast.success('Marked as read');
    } catch (e: any) {
      toast.error('Failed to mark read');
    }
  };

  const getIcon = (title: string) => {
    const lowTitle = title.toLowerCase();
    if (lowTitle.includes('milk') || lowTitle.includes('record')) return faTruckLoading;
    if (lowTitle.includes('price')) return faMoneyBillWave;
    if (lowTitle.includes('details update')) return faUserEdit;
    if (lowTitle.includes('delete') || lowTitle.includes('remove')) return faUserMinus;
    if (lowTitle.includes('register')) return faEnvelope;
    if (lowTitle.includes('activity')) return faHistory;
    return faBell;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t('sidebar.notifications')}</h2>
          <p className="text-slate-400 font-medium mt-1">Managing collection center alerts and farmer updates</p>
        </div>
        {notes.some(n => !n.read) && (
          <button
            onClick={async () => {
              try {
                await Promise.all(notes.filter(n => !n.read).map(n => notificationsApi.markAsRead(n.id)));
                setNotes(notes.map(n => ({ ...n, read: true })));
                toast.success('All notifications marked as read');
              } catch (e) {
                toast.error('Failed to clear some notifications');
              }
            }}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
          >
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mb-4"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{t('common.loading')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {notes.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2.5rem] p-20 text-center border border-slate-100 shadow-xl">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-6">
                  <FontAwesomeIcon icon={faBell} className="text-4xl" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">Clear notifications</h4>
                <p className="text-slate-400 font-medium">All systems normal at your collection point.</p>
              </motion.div>
            ) : (
              notes.map((n, idx) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`bg-white p-6 rounded-[2rem] border transition-all duration-300 shadow-lg ${n.read ? 'border-slate-100 opacity-70' : 'border-emerald-100 shadow-emerald-500/5'}`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 ${n.read ? 'bg-slate-100 text-slate-400' :
                      n.title.toLowerCase().includes('delete') ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' :
                        n.title.toLowerCase().includes('price') ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' :
                          'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'} rounded-2xl flex items-center justify-center shrink-0`}>
                      <FontAwesomeIcon icon={getIcon(n.title)} className="text-xl" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-black text-slate-900 tracking-tight">{n.title}</h4>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg">
                          {new Date(n.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-500 font-medium text-sm leading-relaxed">{n.message}</p>
                    </div>
                    {!n.read && (
                      <button onClick={() => markRead(n.id)} className="px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all">
                        Mark as read
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
