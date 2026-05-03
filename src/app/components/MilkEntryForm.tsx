import { faXmark, faCow, faDroplet, faCoins, faCheckCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../api';
import { safeMultiply, formatCurrency } from '../utils/math';


interface MilkEntryFormProps {
  farmer: {
    id: number;
    full_name: string;
    phone: string;
  };
  onClose: () => void;
  onSubmit: (liters: number, pricePerLiter: number) => void;
}

export function MilkEntryForm({ farmer, onClose, onSubmit }: MilkEntryFormProps) {
  const [liters, setLiters] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState(500);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrice();
  }, []);

  const loadPrice = async () => {
    try {
      const settings = await adminApi.getSettings();
      if (settings && settings.milkPricePerLiter) {
        setPricePerLiter(settings.milkPricePerLiter);
      }
    } catch (e) {
      console.log('Using default price');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const literValue = parseFloat(liters);
    
    // Validation
    if (isNaN(literValue) || literValue <= 0) {
      return;
    }
    
    if (literValue > 100) {
      alert('Maximum 100 liters per entry');
      return;
    }

    onSubmit(literValue, pricePerLiter);
  };

  const calculatedAmount = safeMultiply(liters, pricePerLiter);


  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col"
      >
        <div className="p-8 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <FontAwesomeIcon icon={faDroplet} className="text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Record Milk</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Daily Collection</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-12 h-12 flex items-center justify-center hover:bg-slate-50 rounded-2xl transition-all text-slate-300 hover:text-slate-900"
            >
              <FontAwesomeIcon icon={faXmark} className="text-xl" />
            </button>
          </div>

          <div className="mb-10 p-6 bg-gradient-to-br from-slate-50 to-white rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm relative z-10">
              <span className="text-2xl font-black">{farmer.full_name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Supplier</p>
              <p className="font-black text-slate-900 text-lg leading-none">{farmer.full_name}</p>
              <p className="text-xs text-slate-400 mt-2 font-bold">{farmer.phone}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="relative group">
              <label htmlFor="liters" className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
                Quantity in Liters
              </label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                  <FontAwesomeIcon icon={faDroplet} className="text-xl" />
                </div>
                <input
                  type="number"
                  id="liters"
                  step="0.1"
                  min="0.1"
                  max="100"
                  value={liters}
                  onChange={(e) => setLiters(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-black text-2xl text-slate-900"
                  placeholder="0.0"
                  required
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-between mt-3 px-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Max Cap: 100L</p>
                <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">Standard Rate: {pricePerLiter} RWF/L</p>
              </div>
            </div>

            <AnimatePresence>
              {liters && parseFloat(liters) > 0 && !loading && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  className="p-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2.5rem] text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                      <p className="text-xs font-black opacity-80 uppercase tracking-[0.2em]">Estimated Payout</p>
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <FontAwesomeIcon icon={faCoins} className="text-lg" />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-5xl font-black tracking-tight">{formatCurrency(calculatedAmount)}</p>
                      <span className="text-sm font-black opacity-80 uppercase tracking-widest">RWF</span>
                    </div>
                    <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faCheckCircle} className="text-xs opacity-80" />
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Farmer will be notified</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {liters && parseFloat(liters) > 100 && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600">
                <FontAwesomeIcon icon={faExclamationTriangle} />
                <p className="text-xs font-bold uppercase tracking-wide">Exceeds Maximum Limit of 100 Liters</p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-5 bg-slate-50 text-slate-500 font-black text-xs uppercase tracking-widest rounded-3xl hover:bg-slate-100 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!liters || parseFloat(liters) <= 0 || parseFloat(liters) > 100}
                className="flex-[1.5] px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-3xl shadow-lg shadow-blue-500/20 hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
              >
                Confirm Collection
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
