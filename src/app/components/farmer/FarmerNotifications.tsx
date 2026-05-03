import React, { useEffect, useState } from 'react';
import { notificationsApi } from '../../api';
import { toast } from 'sonner';
import { useI18n } from '../../i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faCheckCircle, faEnvelope, faInfoCircle, faExclamationTriangle, faMessage, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

export default function FarmerNotifications() {
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

  const getNoteStyles = (note: any) => {
    if (note.read) return { icon: faBell, color: 'bg-slate-100 text-slate-400' };
    
    switch (note.type) {
      case 'urgent': return { icon: faExclamationCircle, color: 'bg-red-500 text-white shadow-red-500/20' };
      case 'warning': return { icon: faExclamationTriangle, color: 'bg-orange-500 text-white shadow-orange-500/20' };
      case 'high': return { icon: faCheckCircle, color: 'bg-emerald-500 text-white shadow-emerald-500/20' };
      case 'concern': return { icon: faInfoCircle, color: 'bg-blue-500 text-white shadow-blue-500/20' };
      case 'alert': return { icon: faExclamationCircle, color: 'bg-red-500 text-white shadow-red-500/20' };
      default: return { icon: faBell, color: 'bg-emerald-500 text-white shadow-emerald-500/20' };
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t('sidebar.notifications')}</h2>
        <p className="text-slate-400 font-medium mt-1">Updates on your milk deliveries and payments</p>
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
                <h4 className="text-xl font-bold text-slate-900 mb-2">No updates yet</h4>
                <p className="text-slate-400 font-medium">We'll notify you here for every delivery and payment.</p>
              </motion.div>
            ) : (
              notes.map((n, idx) => {
                const styles = getNoteStyles(n);
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`bg-white p-6 rounded-[2rem] border transition-all duration-300 shadow-lg ${n.read ? 'border-slate-100 opacity-70' : 'border-emerald-100 shadow-emerald-500/5'}`}
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 ${styles.color} rounded-2xl flex items-center justify-center shrink-0`}>
                        <FontAwesomeIcon icon={styles.icon} className="text-xl" />
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
                        <button onClick={() => markRead(n.id)} className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all">
                          <FontAwesomeIcon icon={faCheckCircle} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
