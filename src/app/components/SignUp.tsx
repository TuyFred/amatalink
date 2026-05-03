import { useState } from 'react';
import { motion } from 'framer-motion'; // Fixed: motion/react → framer-motion
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faUser, faEnvelope, faLock, faPhone, faMapMarkerAlt, faEye, faEyeSlash, faSignInAlt, faCheck, faSpinner, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Navigation } from './Navigation';
import { Milk } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '../api';


interface SignUpProps {
  onNavigate: (page: string) => void;
  onSignupSuccess?: (result: any) => void;
}

export function SignUp({ onNavigate, onSignupSuccess }: SignUpProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'farmer' as 'farmer' | 'collector' | 'admin',
    village: '',
    sector: '',
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // DISABLED VERIFICATION - COMMENTED OUT FOR TESTING
  // const [showVerifyModal, setShowVerifyModal] = useState(false);
  // const [userEmail, setUserEmail] = useState('');
  // const [verificationCode, setVerificationCode] = useState('');
  // const [verifying, setVerifying] = useState(false);
  // const [resending, setResending] = useState(false);
  const showVerifyModal = false;
  const userEmail = '';
  const verificationCode = '';
  const verifying = false;
  const resending = false;

// DISABLED handleVerify - COMMENTED OUT FOR TESTING
  // const handleVerify = async () => {
  //   if (!verificationCode || verificationCode.length !== 6) {
  //     toast.error('Please enter a 6-digit verification code');
  //     return;
  //   }
  //   setVerifying(true);
  //   try {
  //     const result = await authApi.verifyEmail({ email: userEmail, code: verificationCode });
  //     toast.success('Your account has been verified successfully.');
  //     localStorage.setItem('amatalink_token', result.token);
  //     localStorage.setItem('amatalink_user', JSON.stringify(result.user));
  //     onSignupSuccess?.(result);
  //     setTimeout(() => onNavigate('dashboard'), 1500);
  //   } catch (error: any) {
  //     toast.error(error.message || 'Verification failed');
  //   } finally {
  //     setVerifying(false);
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }
    if (!formData.agreeToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }
    try {
      const { confirmPassword, agreeToTerms, ...registrationData } = formData;
      
      // Register with the backend
      await authApi.register(registrationData);
      
      toast.success('Registration request submitted! Please wait for approval.');
      
      // Navigate to pending page
      setTimeout(() => onNavigate('registration-pending'), 1500);
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="signup" onNavigate={onNavigate} />
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Milk className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-4xl text-gray-900 mb-2">Create Account</h2>
            <p className="text-gray-600">Join AmataLink and digitize your milk tracking</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-700 mb-2"><FontAwesomeIcon icon={faUser} className="mr-2" />Account Role *</label>
                  <select name="role" value={formData.role} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white">
                    <option value="farmer">Farmer</option>
                    <option value="collector">Collector</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2"><FontAwesomeIcon icon={faUser} className="mr-2" />Full Name *</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="Enter your full name" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2"><FontAwesomeIcon icon={faEnvelope} className="mr-2" />Email Address *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="Enter your email address" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2"><FontAwesomeIcon icon={faPhone} className="mr-2" />Phone Number *</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="Enter your phone number" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2"><FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />Village *</label>
                  <input type="text" name="village" value={formData.village} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="Enter your village" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2"><FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />Sector *</label>
                  <input type="text" name="sector" value={formData.sector} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="Enter your sector" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2"><FontAwesomeIcon icon={faLock} className="mr-2" />Password *</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required minLength={6} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-12" placeholder="Create a password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"><FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} /></button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2"><FontAwesomeIcon icon={faLock} className="mr-2" />Confirm Password *</label>
                  <div className="relative">
                    <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required minLength={6} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-12" placeholder="Re-enter password" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"><FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} /></button>
                  </div>
                </div>
              </div>
              <div className="flex items-start">
                <input type="checkbox" name="agreeToTerms" checked={formData.agreeToTerms} onChange={handleChange} className="w-4 h-4 mt-1 text-green-600 border-gray-300 rounded focus:ring-green-500" />
                <label className="ml-3 text-sm text-gray-600">I agree to the <button type="button" className="text-green-600 hover:text-green-700 cursor-pointer">Terms and Conditions</button> and <button type="button" className="text-green-600 hover:text-green-700 cursor-pointer">Privacy Policy</button></label>
              </div>
              <button type="submit" className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer"><FontAwesomeIcon icon={faUserPlus} />Create Account</button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-gray-600">Already have an account? <button onClick={() => onNavigate('signin')} className="text-green-600 hover:text-green-700 flex items-center justify-center gap-2 mx-auto mt-2 cursor-pointer"><FontAwesomeIcon icon={faSignInAlt} />Sign in instead</button></p>
            </div>
          </div>

          {/* DISABLED VERIFICATION MODAL - COMMENTED OUT FOR TESTING */}
          {/* {showVerifyModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              ... entire modal ...
            </div>
          )} */}
          
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl text-white mb-4">Why Join AmataLink?</h3>
            <ul className="space-y-3 text-green-100">
              <li className="flex items-start gap-3"><span className="text-white">✓</span><span>Digital tracking of all milk deliveries</span></li>
              <li className="flex items-start gap-3"><span className="text-white">✓</span><span>Automated earnings calculations</span></li>
              <li className="flex items-start gap-3"><span className="text-white">✓</span><span>Daily SMS notifications</span></li>
              <li className="flex items-start gap-3"><span className="text-white">✓</span><span>Transparent payment tracking</span></li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
