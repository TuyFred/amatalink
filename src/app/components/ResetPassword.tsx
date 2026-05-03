import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faKey, faEye, faEyeSlash, faCheck, faSpinner, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { Navigation } from './Navigation';
import { Milk } from 'lucide-react';
import { authApi } from '../api';
import { toast } from 'sonner';

interface ResetPasswordProps {
  onNavigate: (page: string) => void;
}

export function ResetPassword({ onNavigate }: ResetPasswordProps) {
  const [formData, setFormData] = useState({
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('reset_email');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.code.length !== 6) {
      toast.error('Verification code must be 6 digits');
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword({
        email: formData.email,
        code: formData.code,
        newPassword: formData.newPassword
      });
      toast.success('Ijambo ry\'ibanga ryahinduwe neza!');
      localStorage.removeItem('reset_email');
      onNavigate('signin');
    } catch (error: any) {
      toast.error(error.message || 'Haje ikibazo mu guhindura ijambo ry\'ibanga.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="reset-password" onNavigate={onNavigate} />

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
            <h2 className="text-4xl text-gray-900 mb-2">Reset Password</h2>
            <p className="text-gray-600">Enter the 6-digit code and your new password</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email (Disabled/Read-only) */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-3 border border-gray-100 bg-gray-50 text-gray-500 rounded-lg cursor-not-allowed"
                />
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faKey} className="mr-2" />
                  Security Code (6 digits)
                </label>
                <input
                  type="text"
                  name="code"
                  maxLength={6}
                  value={formData.code}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl tracking-[1em] font-bold"
                  placeholder="000000"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faLock} className="mr-2" />
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-12"
                    placeholder="Minimal 6 characters"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faCheck} className="mr-2" />
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Confirm your password"
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
                  <FontAwesomeIcon icon={faCheck} />
                )}
                Reset Password
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => onNavigate('forgot-password')}
                className="text-gray-600 hover:text-gray-800 flex items-center justify-center gap-2 mx-auto cursor-pointer"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                Back to Email Input
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
