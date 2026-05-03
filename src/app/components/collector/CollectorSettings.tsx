import { useState, useEffect, useMemo } from 'react';
import { adminApi, milkApi, authApi, notificationsApi } from '../../api';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSave, faMoneyBillWave, faHistory, faBell, faExclamationTriangle,
  faUsers, faEdit, faTrash, faSearch, faChevronLeft, faChevronRight,
  faLock, faTimes
} from '@fortawesome/free-solid-svg-icons';

interface PriceHistory {
  id: number;
  milkPricePerLiter: number;
  effectiveDate: string;
  createdAt: string;
}

export default function CollectorSettings() {
  const [milkPricePerLiter, setMilkPricePerLiter] = useState(500);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPrice, setPendingPrice] = useState<number | null>(null);

  // Farmer Management State
  const [farmers, setFarmers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReauthModalOpen, setIsReauthModalOpen] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<any>(null);
  const [reauthPassword, setReauthPassword] = useState('');
  const [reauthAction, setReauthAction] = useState<'update' | 'delete' | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    village: '',
    sector: ''
  });

  useEffect(() => {
    loadSettings();
    loadPriceHistory();
    loadFarmers();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await adminApi.getSettings();
      if (settings && settings.milkPricePerLiter) {
        setMilkPricePerLiter(settings.milkPricePerLiter);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPriceHistory = async () => {
    // In a real app, this would be an API call
    // For now, we'll use local storage or mock data
    const stored = localStorage.getItem('priceHistory');
    if (stored) {
      setPriceHistory(JSON.parse(stored));
    }
  };

  const loadFarmers = async () => {
    try {
      const data = await milkApi.getFarmers();
      setFarmers(data || []);
    } catch (error) {
      console.error('Failed to load farmers:', error);
    }
  };

  const filteredFarmers = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return farmers.filter(f =>
      f.full_name?.toLowerCase().includes(search) ||
      f.phone?.toLowerCase().includes(search) ||
      f.village?.toLowerCase().includes(search) ||
      f.sector?.toLowerCase().includes(search)
    );
  }, [farmers, searchTerm]);

  const totalPages = Math.ceil(filteredFarmers.length / itemsPerPage);
  const paginatedFarmers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredFarmers.slice(start, start + itemsPerPage);
  }, [filteredFarmers, currentPage, itemsPerPage]);

  const openEditModal = (farmer: any) => {
    setSelectedFarmer(farmer);
    setEditForm({
      fullName: farmer.full_name,
      phone: farmer.phone,
      village: farmer.village || '',
      sector: farmer.sector || ''
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (farmer: any) => {
    setSelectedFarmer(farmer);
    setIsDeleteModalOpen(true);
  };

  const triggerReauth = (action: 'update' | 'delete') => {
    setReauthAction(action);
    setIsReauthModalOpen(true);
  };

  const handleReauth = async () => {
    try {
      // In a real scenario, we might have the current user's email stored
      // For this implementation, we'll assume we can verify with just password or prompt for email
      // Let's use authApi.login to verify credentials
      const userStr = localStorage.getItem('amatalink_user');
      const currentUser = userStr ? JSON.parse(userStr) : null;

      if (!currentUser?.email) {
        toast.error('Session error. Please logout and login again.');
        return;
      }

      await authApi.login({
        username: currentUser.username,
        email: currentUser.email,
        password: reauthPassword
      });

      setIsReauthModalOpen(false);
      setReauthPassword('');

      if (reauthAction === 'update') {
        await executeUpdate();
      } else if (reauthAction === 'delete') {
        await executeDelete();
      }
    } catch (error: any) {
      toast.error('Re-authentication failed: ' + (error.message || 'Incorrect password'));
    }
  };

  const executeUpdate = async () => {
    setSaving(true);
    try {
      await adminApi.updateUser(selectedFarmer.user_id, {
        fullName: editForm.fullName,
        phone: editForm.phone,
        village: editForm.village,
        sector: editForm.sector
      });
      toast.success('Farmer updated successfully');

      try {
        const userStr = localStorage.getItem('amatalink_user');
        const currentUser = userStr ? JSON.parse(userStr) : null;
        if (currentUser?.id) {
          await notificationsApi.createNotification({
            userId: currentUser.id,
            title: 'Farmer Details Updated',
            message: `You updated details for farmer ${editForm.fullName}.`,
            type: 'activity'
          });
        }
      } catch (e) { console.log('Update notification error:', e); }

      setIsEditModalOpen(false);
      loadFarmers();
    } catch (error: any) {
      toast.error('Failed to update farmer: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const executeDelete = async () => {
    setSaving(true);
    try {
      const farmerName = selectedFarmer?.full_name;
      await adminApi.deleteUser(selectedFarmer.user_id);
      toast.success('Farmer deleted successfully');

      try {
        const userStr = localStorage.getItem('amatalink_user');
        const currentUser = userStr ? JSON.parse(userStr) : null;
        if (currentUser?.id) {
          await notificationsApi.createNotification({
            userId: currentUser.id,
            title: 'Farmer Deleted',
            message: `Farmer ${farmerName} has been removed from the system.`,
            type: 'system'
          });
        }
      } catch (e) { console.log('Delete notification error:', e); }

      setIsDeleteModalOpen(false);
      loadFarmers();
    } catch (error: any) {
      toast.error('Failed to delete farmer: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const savePrice = async () => {
    if (pendingPrice === null) return;

    setSaving(true);
    try {
      await adminApi.updateSettings({
        milkPricePerLiter: pendingPrice
      });
      await loadSettings();  // Reload to confirm persistence

      // Save to price history
      const newHistory: PriceHistory = {
        id: Date.now(),
        milkPricePerLiter: pendingPrice,
        effectiveDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };

      const updatedHistory = [newHistory, ...priceHistory];
      setPriceHistory(updatedHistory);
      localStorage.setItem('priceHistory', JSON.stringify(updatedHistory));

      try {
        const userStr = localStorage.getItem('amatalink_user');
        const currentUser = userStr ? JSON.parse(userStr) : null;
        if (currentUser?.id) {
          await notificationsApi.createNotification({
            userId: currentUser.id,
            title: 'Milk Price Updated',
            message: `Milk price has been changed from ${milkPricePerLiter} RWF to ${pendingPrice} RWF per liter.`,
            type: 'system'
          });
        }
      } catch (e) { console.log('Price notification error:', e); }

      setMilkPricePerLiter(pendingPrice);
      toast.success(`Milk price updated to ${pendingPrice} RWF per liter and persisted to database!`);
      setShowConfirmModal(false);
      setPendingPrice(null);
    } catch (error: any) {
      toast.error('Failed to update price: ' + (error.message || error));
    } finally {
      setSaving(false);
    }
  };

  const handlePriceChange = (newPrice: number) => {
    setPendingPrice(newPrice);
    setShowConfirmModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <FontAwesomeIcon icon={faMoneyBillWave} className="text-purple-600" />
          Milk Price Settings
        </h3>
      </div>

      {/* Current Price */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 mb-1">Current Price per Liter</p>
            <p className="text-4xl font-black text-purple-600">{milkPricePerLiter} RWF</p>
          </div>
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
            <FontAwesomeIcon icon={faMoneyBillWave} className="text-2xl text-purple-600" />
          </div>
        </div>
      </div>

      {/* Update Price */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-600 mb-2">
          Update Price (RWF per liter)
        </label>
        <div className="flex gap-4">
          <input
            type="number"
            value={pendingPrice ?? milkPricePerLiter}
            onChange={(e) => setPendingPrice(Number(e.target.value))}
            className="flex-1 px-4 py-3 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-bold"
            min="0"
            step="10"
          />
          <button
            onClick={() => handlePriceChange(pendingPrice ?? milkPricePerLiter)}
            disabled={saving || pendingPrice === milkPricePerLiter}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faSave} />
            {saving ? 'Saving...' : 'Update Price'}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          This price will be used for all new milk records entered by collectors
        </p>
      </div>

      {/* Price History */}
      <div>
        <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faHistory} className="text-slate-400" />
          Price History
        </h4>
        {priceHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-sm text-slate-500 font-bold bg-slate-50">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Price (RWF/L)</th>
                  <th className="px-4 py-3">Effective Date</th>
                  <th className="px-4 py-3">Changed At</th>
                </tr>
              </thead>
              <tbody>
                {priceHistory.map((record, index) => (
                  <tr key={record.id} className="hover:bg-slate-50 border-b border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-500">{index + 1}</td>
                    <td className="px-4 py-3 font-bold text-purple-600">{record.milkPricePerLiter} RWF</td>
                    <td className="px-4 py-3">{new Date(record.effectiveDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(record.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <FontAwesomeIcon icon={faHistory} className="text-4xl mb-2 opacity-30" />
            <p>No price history available</p>
          </div>
        )}
      </div>

      {/* Farmer Management Section */}
      <div className="mt-12 border-t border-slate-100 pt-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <FontAwesomeIcon icon={faUsers} className="text-emerald-600" />
            Manage Farmers
          </h3>
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search farmer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-widest font-black">
                  <th className="px-6 py-4">Farmer</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedFarmers.length > 0 ? paginatedFarmers.map((farmer) => (
                  <tr key={farmer.user_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{farmer.full_name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{farmer.email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                      {farmer.phone}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-700">{farmer.village || 'N/A'}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{farmer.sector || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(farmer)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(farmer)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                      No farmers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredFarmers.length > 0 && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500 font-medium">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 disabled:opacity-50 hover:bg-slate-100 transition-colors"
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 disabled:opacity-50 hover:bg-slate-100 transition-colors"
                >
                  <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Farmer Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Update Farmer</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Phone Number</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Village</label>
                  <input
                    type="text"
                    value={editForm.village}
                    onChange={(e) => setEditForm({ ...editForm, village: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Sector</label>
                  <input
                    type="text"
                    value={editForm.sector}
                    onChange={(e) => setEditForm({ ...editForm, sector: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-6">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => triggerReauth('update')}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-red-50">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mb-6">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-2xl" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Farmer?</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Are you sure you want to delete <strong>{selectedFarmer?.full_name}</strong>? This action cannot be undone and will remove all their associated data from the active system.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                No, Keep
              </button>
              <button
                onClick={() => triggerReauth('delete')}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-500/20 transition-all hover:-translate-y-0.5"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Re-authentication Modal */}
      {isReauthModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
              <FontAwesomeIcon icon={faLock} className="text-2xl" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Identity</h3>
            <p className="text-slate-500 text-sm mb-6">
              For security reasons, please enter your login password to authorize this sensitive action.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Your Password</label>
                <input
                  type="password"
                  value={reauthPassword}
                  onChange={(e) => setReauthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleReauth()}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setIsReauthModalOpen(false);
                    setReauthPassword('');
                  }}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReauth}
                  className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5"
                >
                  Authorize
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Price Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4 text-orange-600">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-2xl" />
              <h3 className="text-xl font-bold">Confirm Price Change</h3>
            </div>
            <p className="text-slate-600 mb-6">
              Are you sure you want to change the milk price from <strong>{milkPricePerLiter} RWF</strong> to <strong>{pendingPrice} RWF</strong> per liter?
            </p>
            <p className="text-sm text-slate-500 mb-6">
              All collectors and farmers will be notified of this price change.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={savePrice}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Confirm Change'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
