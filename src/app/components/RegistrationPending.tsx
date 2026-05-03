import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faCheckCircle, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { useI18n } from '../i18n';
import { Navigation } from './Navigation';
import { Milk } from 'lucide-react';

interface RegistrationPendingProps {
    onNavigate: (page: string) => void;
}

export function RegistrationPending({ onNavigate }: RegistrationPendingProps) {
    const { t } = useI18n();

    return (
        <div className="min-h-screen bg-[#0f172a] overflow-hidden flex flex-col">
            <Navigation onNavigate={onNavigate} currentPage="register" />

            <main className="flex-1 flex items-center justify-center p-6 relative">
                {/* Background Decorations */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full" />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-xl w-full bg-slate-900/50 backdrop-blur-3xl p-10 sm:p-16 rounded-[3rem] border border-slate-800 shadow-2xl text-center relative z-10"
                >
                    <div className="w-24 h-24 bg-gradient-to-tr from-emerald-500 to-green-600 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-emerald-500/20 rotate-6">
                        <FontAwesomeIcon icon={faPaperPlane} className="text-white text-4xl" />
                    </div>

                    <h2 className="text-4xl font-black text-white tracking-tight mb-4">
                        Request Sent!
                    </h2>
                    <p className="text-slate-400 text-lg font-medium leading-relaxed mb-10">
                        Thank you for registering with <span className="text-emerald-500 font-bold">AmataLink</span>. Your account is currently under review by our administration team.
                    </p>

                    <div className="space-y-6 mb-12">
                        <div className="flex items-start gap-4 text-left p-6 bg-slate-800/40 rounded-3xl border border-slate-700/50">
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 shrink-0">
                                <FontAwesomeIcon icon={faClock} />
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-sm">Review in Progress</h4>
                                <p className="text-slate-500 text-xs mt-1">Our team typically verifies new accounts within 24 hours. Check your email for a confirmation receipt.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 text-left p-6 bg-slate-800/40 rounded-3xl border border-slate-700/50">
                            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                                <FontAwesomeIcon icon={faCheckCircle} />
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-sm">Activation Email</h4>
                                <p className="text-slate-500 text-xs mt-1">You will receive an activation email on your registered address once approved by an Admin or Collector.</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => onNavigate('home')}
                        className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-100 transition-all active:scale-95 shadow-xl"
                    >
                        Back to Home
                    </button>

                    <div className="mt-8 flex items-center justify-center gap-2 text-slate-500">
                        <Milk className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Powered by AmataLink Dairy Network</span>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
