import React, { useEffect, useState } from 'react';
import { notificationsApi } from '../../api';
import { toast } from 'sonner';
import { useI18n } from '../../i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faCheckCircle, faEnvelope, faInfoCircle, faTrash, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

export default function AdminNotifications() {
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

    useEffect(() => {
        load();
    }, []);

    const markRead = async (id: number) => {
        try {
            await notificationsApi.markAsRead(id);
            setNotes(notes.map(n => n.id === id ? { ...n, read: true } : n));
            toast.success('Marked as read');
        } catch (e: any) {
            toast.error('Failed to mark read');
        }
    };

    const markAllRead = async () => {
        try {
            // Assuming API supports this or we loop
            const unread = notes.filter(n => !n.read);
            await Promise.all(unread.map(n => notificationsApi.markAsRead(n.id)));
            setNotes(notes.map(n => ({ ...n, read: true })));
            toast.success('All marked as read');
        } catch (e: any) {
            toast.error('Failed to mark all read');
        }
    };

    const getIcon = (title: string) => {
        const lowTitle = title.toLowerCase();
        if (lowTitle.includes('milk') || lowTitle.includes('record')) return faInfoCircle;
        if (lowTitle.includes('user') || lowTitle.includes('account')) return faEnvelope;
        if (lowTitle.includes('error') || lowTitle.includes('fail')) return faExclamationTriangle;
        return faBell;
    };

    const getColor = (title: string) => {
        const lowTitle = title.toLowerCase();
        if (lowTitle.includes('milk') || lowTitle.includes('record')) return 'bg-blue-500';
        if (lowTitle.includes('user') || lowTitle.includes('account')) return 'bg-emerald-500';
        if (lowTitle.includes('error') || lowTitle.includes('fail')) return 'bg-red-500';
        return 'bg-amber-500';
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t('sidebar.notifications')}</h2>
                    <p className="text-slate-400 font-medium mt-1">Platform-wide activity and alerts</p>
                </div>
                {notes.some(n => !n.read) && (
                    <button
                        onClick={markAllRead}
                        className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                    >
                        {t('notifications.markAllRead')}
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
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-white rounded-[2.5rem] p-20 text-center border border-slate-100 shadow-xl"
                            >
                                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-6">
                                    <FontAwesomeIcon icon={faBell} className="text-4xl" />
                                </div>
                                <h4 className="text-xl font-bold text-slate-900 mb-2">{t('notifications.noNotifications')}</h4>
                                <p className="text-slate-400">System is running smooth. No alerts for now.</p>
                            </motion.div>
                        ) : (
                            notes.map((n, idx) => (
                                <motion.div
                                    key={n.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`group bg-white p-6 rounded-[2rem] border transition-all duration-300 shadow-lg hover:shadow-xl ${n.read ? 'border-slate-100 opacity-70' : 'border-emerald-100 shadow-emerald-500/5'}`}
                                >
                                    <div className="flex flex-col sm:flex-row items-center gap-6">
                                        <div className={`w-16 h-16 ${getColor(n.title)} rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 group-hover:scale-110 transition-transform duration-500`}>
                                            <FontAwesomeIcon icon={getIcon(n.title)} className="text-2xl" />
                                        </div>
                                        <div className="flex-1 text-center sm:text-left">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                                <h4 className="font-black text-slate-900 text-lg tracking-tight">{n.title}</h4>
                                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                                    {new Date(n.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-slate-500 font-medium leading-relaxed">{n.message}</p>
                                        </div>
                                        {!n.read && (
                                            <button
                                                onClick={() => markRead(n.id)}
                                                className="px-6 py-3 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all shrink-0"
                                            >
                                                {t('notifications.markAsRead')}
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
