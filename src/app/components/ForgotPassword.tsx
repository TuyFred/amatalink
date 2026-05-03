import { useState } from 'react';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faArrowLeft, faPaperPlane, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { Navigation } from './Navigation';
import { Milk } from 'lucide-react';
import { authApi } from '../api';
import { toast } from 'sonner';

interface ForgotPasswordProps {
  onNavigate: (page: string) => void;
}

export function ForgotPassword({ onNavigate }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authApi.forgotPassword({ email });
      toast.success('Imibare y\'ibanga yoherejwe kuri imeri yawe.');
      // Pass email to reset password page via localStorage or state if complex, 
      // but here we can just navigate and let them type it again or use state
      localStorage.setItem('reset_email', email);
      onNavigate('reset-password');
    } catch (error: any) {
      toast.error(error.message || 'Haje ikibazo mu kohereza imeri.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="forgot-password" onNavigate={onNavigate} />

      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-8"
        >
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Milk className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-4xl text-gray-900 mb-2">Forgot Password</h2>
            <p className="text-gray-600">Enter your email to receive a reset code</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                ) : (
                  <FontAwesomeIcon icon={faPaperPlane} />
                )}
                Send Reset Code
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => onNavigate('signin')}
                className="text-gray-600 hover:text-gray-800 flex items-center justify-center gap-2 mx-auto cursor-pointer"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                Back to Sign In
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
