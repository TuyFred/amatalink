import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle, faWallet, faMoneyCheckAlt, faUser, faCalendarAlt, faSync, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { paymentsApi } from '../../api';
import { toast } from 'sonner';
import { formatCurrency } from '../../utils/math';

export default function PayoutsView() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true);
            const data = await paymentsApi.getPayoutRequests({ status: 'pending' });
            setRequests(data);
        } catch (error: any) {
            toast.error('Failed to fetch payout requests: ' + error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleUpdateStatus = async (id: number, status: string) => {
        const confirmMsg = status === 'processed' 
            ? 'Are you sure you have paid this farmer and want to mark it as processed?' 
            : 'Are you sure you want to cancel this payout request?';
        
        if (!window.confirm(confirmMsg)) return;

        try {
            await paymentsApi.updatePayoutStatus(id, status);
            toast.success(`Payout successfully ${status}!`);
            fetchRequests();
        } catch (error: any) {
            toast.error('Failed to update status: ' + error.message);
        }
    };

    return (
        <div className="p-6">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                        Payout Requests
                    </h2>
                    <p className="text-slate-400 font-medium">Review and process farmer payment requests</p>
                </div>
                <button 
                    onClick={fetchRequests}
                    className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-purple-500 hover:border-purple-200 transition-all shadow-sm"
                >
                    <FontAwesomeIcon icon={faSync} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4"></div>
                    <p className="text-slate-500 font-medium tracking-wide">Loading requests...</p>
                </div>
            ) : requests.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] border border-dashed border-slate-200 p-20 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FontAwesomeIcon icon={faMoneyCheckAlt} className="text-4xl text-slate-200" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">No Pending Payouts</h3>
                    <p className="text-slate-400 max-w-sm mx-auto">There are no farmers currently waiting for payment processing.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {requests.map((req) => (
                            <motion.div
                                key={req.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 p-6 flex flex-col hover:shadow-2xl transition-all group"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg">
                                        {req.farmer_name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-slate-900 truncate">{req.farmer_name}</h4>
                                        <p className="text-xs text-slate-400 truncate">{req.farmer_phone}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-8 flex-1">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Requested Amount</span>
                                            <span className="text-xl font-black text-purple-600 tracking-tight">{formatCurrency(req.amount)} RWF</span>
                                        </div>
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-purple-500">
                                            <FontAwesomeIcon icon={faWallet} />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-slate-600 px-2">
                                        <FontAwesomeIcon icon={faMoneyCheckAlt} className="text-slate-400 text-xs w-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider">{req.method_name || 'MoMo/Airtel'}</span>
                                        <span className="text-xs text-slate-400">({req.account_number})</span>
                                    </div>

                                    <div className="flex items-center gap-3 text-slate-600 px-2">
                                        <FontAwesomeIcon icon={faCalendarAlt} className="text-slate-400 text-xs w-4" />
                                        <span className="text-xs text-slate-400 font-medium">Requested on: {new Date(req.request_date).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleUpdateStatus(req.id, 'cancelled')}
                                        className="flex-1 py-3 px-4 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                        <FontAwesomeIcon icon={faTimesCircle} className="mr-2" />
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(req.id, 'processed')}
                                        className="flex-[2] py-3 px-4 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/20 hover:bg-purple-700 hover:-translate-y-0.5 transition-all active:scale-95"
                                    >
                                        <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                                        Approve & Pay
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
