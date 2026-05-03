import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faUser, faEnvelope, faLock, faPhone, faMapMarkerAlt, faEye, faEyeSlash, faCalendar, faIdCard, faGenderless, faBuilding, faLandmark, faDollar } from '@fortawesome/free-solid-svg-icons';
import { adminApi } from '../../api';
import { toast } from 'sonner';

interface CreateUserProps {
  onClose: () => void;
}

export default function CreateUser({ onClose }: CreateUserProps) {
  const [formData, setFormData] = useState({
    // Basic Information
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    role: 'collector' as 'admin' | 'collector',
    
    // Location Information
    village: '',
    sector: '',
    district: '',
    province: '',
    
    // Personal Information
    dateOfBirth: '',
    gender: '',
    nationalId: '',
    
    // Payment Information
    bankName: '',
    accountNumber: '',
    mobileMoneyNumber: '',
    
    // Emergency Contact
    emergencyContactName: '',
    emergencyContactPhone: '',
    
    // Additional
    notes: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Filter out empty fields
      const userData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== '')
      );
      
      await adminApi.createUser(userData);
      toast.success('User created successfully!');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6 sticky top-0 bg-white z-10 pb-4 border-b border-slate-100">
        <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FontAwesomeIcon icon={faUserPlus} className="text-purple-600" />
          Create New User
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2">
          <FontAwesomeIcon icon={faUserPlus} className="text-xl" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Role Selection */}
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
          <label className="block text-sm text-purple-700 mb-2 font-bold">
            <FontAwesomeIcon icon={faUser} className="mr-2" />
            User Role *
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
          >
            <option value="collector">Village Collector</option>
            <option value="admin">Sector Admin</option>
          </select>
        </div>

        {/* Section 1: Basic Information */}
        <div>
          <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 pb-2 border-b border-slate-200">
            <FontAwesomeIcon icon={faUser} className="text-blue-600" />
            Basic Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-700 mb-1 font-medium">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-1 font-medium">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-1 font-medium">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-1 font-medium">
                Phone *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="+250..."
              />
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-1 font-medium">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-1 font-medium">
                Date of Birth
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-1 font-medium">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-1 font-medium">
                National ID
              </label>
              <input
                type="text"
                name="nationalId"
                value={formData.nationalId}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter national ID"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Location Information */}
        <div>
          <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 pb-2 border-b border-slate-200">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-green-600" />
            Location Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-slate-700 mb-1 font-medium">
                Village
              </label>
              <input
                type="text"
                name="village"
                value={formData.village}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter village"
              />
            </div>

            <div>
              <label className="block text-s-sm text-slate-700 mb-1 font-medium">
                Sector
              </label>
              <input
                type="text"
                name="sector"
                value={formData.sector}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter sector"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-1 font-medium">
                District
              </label>
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter district"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-1 font-medium">
                Province
              </label>
              <select
                name="province"
                value={formData.province}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select province</option>
                <option value="Kigali">Kigali</option>
                <option value="Northern">Northern</option>
                <option value="Southern">Southern</option>
                <option value="Eastern">Eastern</option>
                <option value="Western">Western</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Payment Information */}
        <div>
          <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 pb-2 border-b border-slate-200">
            <FontAwesomeIcon icon={faDollar} className="text-emerald-600" />
            Payment Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-700 mb-1 font-medium">
                Bank Name
              </label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., BK, BPR, Equity"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-1 font-medium">
                Account Number
              </label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter account number"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-1 font-medium">
                Mobile Money Number
              </label>
              <input
                type="tel"
                name="mobileMoneyNumber"
                value={formData.mobileMoneyNumber}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="+250..."
              />
            </div>
          </div>
        </div>

        {/* Section 4: Emergency Contact */}
        <div>
          <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 pb-2 border-b border-slate-200">
            <FontAwesomeIcon icon={faPhone} className="text-red-600" />
            Emergency Contact
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-700 mb-1 font-medium">
                Contact Name
              </label>
              <input
                type="text"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Emergency contact name"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-1 font-medium">
                Contact Phone
              </label>
              <input
                type="tel"
                name="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="+250..."
              />
            </div>
          </div>
        </div>

        {/* Section 5: Additional Notes */}
        <div>
          <label className="block text-sm text-slate-700 mb-1 font-medium">
            Additional Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Any additional information..."
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 font-bold"
        >
          <FontAwesomeIcon icon={faUserPlus} />
          {loading ? 'Creating...' : 'Create User'}
        </button>
      </form>
    </div>
  );
}
