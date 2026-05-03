import { useState } from 'react';
import {
    faCow, faChartLine, faUsers, faCoins, faHistory,
    faBell, faSignOutAlt, faBars, faTimes, faEnvelope,
    faHome, faChartBar, faFileInvoice, faFileAlt, faCog, faUserCircle, faUserPlus
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '../i18n';
import { useEffect, useState as reactUseState } from 'react';
import { notificationsApi, adminApi, paymentsApi, messagesApi } from '../api';

interface SidebarProps {
    role: 'admin' | 'collector' | 'farmer';
    userName: string;
    onLogout: () => void;
    activeItem: string;
    onItemSelect: (item: string) => void;
}

export function Sidebar({ role, userName, onLogout, activeItem, onItemSelect }: SidebarProps) {
    const { t, language, setLanguage } = useI18n();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [unreadCount, setUnreadCount] = reactUseState(0);
    const [pendingCount, setPendingCount] = reactUseState(0);
    const [pendingPayoutCount, setPendingPayoutCount] = reactUseState(0);
    const [unreadMessageCount, setUnreadMessageCount] = reactUseState(0);

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const [notes, unreadMsg] = await Promise.all([
                    notificationsApi.getNotifications(),
                    messagesApi.getUnreadCount()
                ]);
                
                const unread = notes.filter((n: any) => !n.read).length;
                setUnreadCount(unread);
                setUnreadMessageCount(unreadMsg.unreadCount);

                if (role === 'admin' || role === 'collector') {
                    const pendingRole = role === 'admin' ? 'collector' : 'farmer';
                    const [pendingUsers, payoutRequests] = await Promise.all([
                        adminApi.getPendingUsers(pendingRole),
                        paymentsApi.getPayoutRequests({ status: 'pending' })
                    ]);
                    setPendingCount(pendingUsers.length);
                    setPendingPayoutCount(payoutRequests.length);
                }
            } catch (error) {
                console.error('Failed to fetch counts:', error);
            }
        };
        fetchCounts();
        const interval = setInterval(fetchCounts, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    // Close mobile menu on item select
    const handleItemSelect = (id: string) => {
        onItemSelect(id);
        setIsMobileMenuOpen(false);
    };

    const menuItems = [
        { id: 'overview', label: t('sidebar.overview'), icon: faHome, roles: ['admin', 'collector', 'farmer'] },
        { id: 'analytics', label: t('sidebar.analytics'), icon: faChartBar, roles: ['admin'] },
        { id: 'farmers', label: t('sidebar.manageFarmers'), icon: faUsers, roles: ['admin'] },
        { id: 'collectors', label: t('sidebar.manageCollectors'), icon: faChartLine, roles: ['admin'] },
        { id: 'records', label: t('sidebar.allRecords'), icon: faFileInvoice, roles: ['admin'] },
        { id: 'commission', label: t('sidebar.commission'), icon: faCoins, roles: ['admin'] },
        { id: 'reports', label: t('sidebar.reports'), icon: faFileAlt, roles: ['admin', 'collector', 'farmer'] },
        { id: 'approvals', label: 'Approvals', icon: faUserPlus, roles: ['admin', 'collector'] },
        { id: 'payouts', label: 'Payouts', icon: faCoins, roles: ['admin', 'collector'] },
        { id: 'settings', label: t('sidebar.settings'), icon: faCog, roles: ['admin'] },
        { id: 'settings-collector', label: t('sidebar.settings'), icon: faCog, roles: ['collector'] },
        { id: 'messages', label: 'Messages', icon: faEnvelope, roles: ['admin', 'collector', 'farmer'] },
    ];

    const filteredItems = menuItems.filter(item => item.roles.includes(role));

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="fixed top-4 left-4 z-[60] lg:hidden w-12 h-12 bg-[#0f172a] text-white rounded-2xl flex items-center justify-center shadow-2xl border border-slate-800 active:scale-90 transition-transform"
            >
                <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} className="text-xl" />
            </button>

            {/* Backdrop Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[51] lg:hidden"
                    />
                )}
            </AnimatePresence>

            <motion.div
                initial={false}
                animate={{ x: isMobileMenuOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024 ? -288 : 0) }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`h-screen w-72 bg-[#0f172a] text-slate-300 flex flex-col fixed left-0 top-0 shadow-2xl z-[52] border-r border-slate-800 lg:translate-x-0 overflow-y-auto custom-scrollbar`}
            >
                <div className="p-8 pb-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 rotate-3 group hover:rotate-0 transition-transform duration-300">
                        <FontAwesomeIcon icon={faCow} className="text-white text-xl" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tighter leading-none">Amata<span className="text-emerald-500">Link</span></h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mt-1">Dairy Portal</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">
                    {filteredItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleItemSelect(item.id)}
                            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden ${activeItem === item.id
                                ? 'bg-emerald-500/10 text-emerald-400 font-bold'
                                : 'hover:bg-slate-800/50 hover:text-white'
                                }`}
                        >
                            {activeItem === item.id && (
                                <motion.div
                                    layoutId="sidebar-active"
                                    className="absolute left-0 w-1 h-6 bg-emerald-500 rounded-r-full"
                                />
                            )}
                            <FontAwesomeIcon
                                icon={item.icon}
                                className={`text-lg transition-transform duration-300 group-hover:scale-110 ${activeItem === item.id ? 'text-emerald-400' : 'text-slate-500'
                                    }`}
                            />
                            <span className="text-[14px]">{item.label}</span>
                            {item.id === 'notifications' && unreadCount > 0 && (
                                <span className="ml-auto bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-red-500/20 animate-pulse">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                            {item.id === 'approvals' && pendingCount > 0 && (
                                <span className="ml-auto bg-blue-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-blue-500/20">
                                    {pendingCount}
                                </span>
                            )}
                            {item.id === 'payouts' && pendingPayoutCount > 0 && (
                                <span className="ml-auto bg-purple-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-purple-500/20">
                                    {pendingPayoutCount}
                                </span>
                            )}
                            {item.id === 'messages' && unreadMessageCount > 0 && (
                                <span className="ml-auto bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-emerald-500/20">
                                    {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-6 space-y-4">
                    {/* Language Toggle */}
                    <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/50">
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-3 px-1">{t('common.language')}</p>
                        <div className="flex bg-slate-900 rounded-xl p-1 relative">
                            <button
                                onClick={() => setLanguage('en')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all z-10 ${language === 'en' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                <span className="opacity-60">🇬🇧</span> EN
                            </button>
                            <button
                                onClick={() => setLanguage('rw')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all z-10 ${language === 'rw' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                <span className="opacity-60">🇷🇼</span> RW
                            </button>
                            <motion.div
                                animate={{ x: language === 'rw' ? '100%' : '0%' }}
                                className="absolute left-1 top-1 bottom-1 w-[calc(50%-4px)] bg-emerald-500/10 border border-emerald-500/20 rounded-lg"
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-2xl border border-slate-700/50 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 p-[1px]">
                            <div className="w-full h-full rounded-[11px] bg-[#0f172a] flex items-center justify-center text-xs font-black text-white group-hover:bg-emerald-500 transition-colors duration-500">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-white truncate">{userName}</p>
                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{role}</p>
                        </div>
                        <button
                            onClick={onLogout}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all"
                        >
                            <FontAwesomeIcon icon={faSignOutAlt} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </>
    );
}
