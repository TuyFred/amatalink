import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle, faUserClock, faUserCheck, faUserTimes, faSync } from '@fortawesome/free-solid-svg-icons';
import { adminApi } from '../api';
import { toast } from 'sonner';

interface PendingUser {
    id: number;
    full_name: string;
    email: string;
    phone: string;
    village: string | null;
    sector: string | null;
    role: string;
    created_at: string;
}

interface ApprovalsViewProps {
    roleToApprove: 'farmer' | 'collector';
}

export default function ApprovalsView({ roleToApprove }: ApprovalsViewProps) {
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPending = useCallback(async () => {
        try {
            setLoading(true);
            const data = await adminApi.getPendingUsers(roleToApprove);
            setPendingUsers(data);
        } catch (error: any) {
            toast.error('Failed to fetch pending requests: ' + error.message);
        } finally {
            setLoading(false);
        }
    }, [roleToApprove]);

    useEffect(() => {
        fetchPending();
    }, [fetchPending]);

    const handleApprove = async (id: number) => {
        try {
            await adminApi.approveUser(id);
            toast.success('Registration approved successfully!');
            fetchPending();
        } catch (error: any) {
            toast.error('Approval failed: ' + error.message);
        }
    };

    const handleReject = async (id: number) => {
        if (!window.confirm('Are you sure you want to reject this registration?')) return;
        try {
            await adminApi.rejectUser(id);
            toast.success('Registration rejected.');
            fetchPending();
        } catch (error: any) {
            toast.error('Rejection failed: ' + error.message);
        }
    };

    return (
        <div className="p-6">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight capitalize">
                        {roleToApprove} Approvals
                    </h2>
                    <p className="text-slate-400 font-medium">Review and manage pending registration requests</p>
                </div>
                <button 
                    onClick={fetchPending}
                    className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-500 hover:border-blue-200 transition-all shadow-sm"
                >
                    <FontAwesomeIcon icon={faSync} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
                    <p className="text-slate-500 font-medium tracking-wide">Loading requests...</p>
                </div>
            ) : pendingUsers.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] border border-dashed border-slate-200 p-20 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FontAwesomeIcon icon={faUserClock} className="text-4xl text-slate-200" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">No Pending Requests</h3>
                    <p className="text-slate-400 max-w-sm mx-auto">All {roleToApprove} registrations have been reviewed.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {pendingUsers.map((user) => (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 p-6 flex flex-col hover:shadow-2xl transition-all"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg">
                                        {user.full_name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-slate-900 truncate">{user.full_name}</h4>
                                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-8 flex-1">
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 text-xs">
                                            📞
                                        </div>
                                        <span className="text-sm font-medium">{user.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 text-xs">
                                            📍
                                        </div>
                                        <span className="text-sm font-medium">{user.village}, {user.sector}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 text-xs">
                                            🕒
                                        </div>
                                        <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleReject(user.id)}
                                        className="flex-1 py-3 px-4 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:shadow-lg hover:shadow-red-500/10"
                                    >
                                        <FontAwesomeIcon icon={faUserTimes} className="mr-2" />
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleApprove(user.id)}
                                        className="flex-[2] py-3 px-4 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 hover:-translate-y-0.5 transition-all active:scale-95"
                                    >
                                        <FontAwesomeIcon icon={faUserCheck} className="mr-2" />
                                        Approve
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
