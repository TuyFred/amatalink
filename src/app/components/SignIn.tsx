import { useState } from 'react';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignInAlt, faEnvelope, faLock, faEye, faEyeSlash, faUserPlus, faSpinner, faCheck } from '@fortawesome/free-solid-svg-icons';
import { Navigation } from './Navigation';
import { Milk } from 'lucide-react';
import { authApi } from '../api';
import { toast } from 'sonner';

interface SignInProps {
  onNavigate: (page: string) => void;
  onSignIn: (role: 'farmer' | 'collector' | 'admin') => void;
}

export function SignIn({ onNavigate, onSignIn }: SignInProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Use email as username for the backend login if that's how we registered
      const response = await authApi.login({
        username: formData.email,
        password: formData.password
      });

      localStorage.setItem('amatalink_token', response.token);
      localStorage.setItem('amatalink_user', JSON.stringify(response.user));

      toast.success('Login successful.');
      onSignIn(response.user.role);
    } catch (error: any) {
      if (error.message && error.message.includes('pending')) {
        toast.info('Your registration is still pending approval.');
        setTimeout(() => onNavigate('registration-pending'), 1000);
      } else {
        toast.error(error.message || 'Sign in failed.');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="signin" onNavigate={onNavigate} />

      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-8"
        >
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Milk className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-4xl text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">
              Sign in to your AmataLink account
            </p>
          </div>

          {/* Sign In Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faLock} className="mr-2" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-12"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate('forgot-password')}
                  className="text-sm text-green-600 hover:text-green-700 cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <FontAwesomeIcon icon={faSignInAlt} />
                Sign In
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => onNavigate('signup')}
                  className="text-green-600 hover:text-green-700 flex items-center justify-center gap-2 mx-auto mt-2 cursor-pointer"
                >
                  <FontAwesomeIcon icon={faUserPlus} />
                  Create an account
                </button>
              </p>
            </div>
          </div>



        </motion.div>
      </div>
    </div>
  );
}
