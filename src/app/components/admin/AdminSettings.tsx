import React, { useEffect, useState, useMemo } from 'react';
import { paymentsApi, adminApi } from '../../api';
import { toast } from 'sonner';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faMoneyBillWave, faCog, faUser, faPlus, faEdit, faTrash, faSearch, faEye, faDownload, faCow, faTimes } from '@fortawesome/free-solid-svg-icons';

type SettingsModel = {
  siteName: string;
  defaultCurrency: string;
  milkPricePerLiter: number;
  allowPublicRegistration: boolean;
  notifyAdminOnNewRecord: boolean;
  theme: 'light' | 'dark' | 'system';
};

type FarmerForm = {
  email: string;
  full_name: string;
  phone?: string;
  village?: string;
  sector?: string;
  password?: string;
  username?: string;
};

interface FarmerWithStats {
  id: number;
  user_id: number;
  email: string;
  full_name: string;
  phone?: string;
  village?: string;
  sector?: string;
  username?: string;
  total_liters: number;
  total_amount: number;
  total_entries: number;
  avg_rate: number;
}

const DEFAULT_SETTINGS: SettingsModel = {
  siteName: 'AmataLink',
  defaultCurrency: 'RWF',
  milkPricePerLiter: 500,
  allowPublicRegistration: true,
  notifyAdminOnNewRecord: true,
  theme: 'system'
};

export default function AdminSettings() {
  const [section, setSection] = useState<'general'|'payments'|'farmers'>('general');
  const [methods, setMethods] = useState<any[]>([]);
  const [settings, setSettings] = useState<SettingsModel>(DEFAULT_SETTINGS);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => { 
    loadAll(); 
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const serverSettings = await adminApi.getSettings();
      if (serverSettings) {
        setSettings(prev => ({
          ...prev,
          siteName: serverSettings.siteName || prev.siteName,
          defaultCurrency: serverSettings.defaultCurrency || prev.defaultCurrency,
          milkPricePerLiter: serverSettings.milkPricePerLiter || prev.milkPricePerLiter
        }));
      }
    } catch (e) {
      console.log('Using local settings');
    }
  };

  const loadAll = async () => {
    setLoadingMethods(true);
    try {
      const m = await paymentsApi.getMethods();
      setMethods(m || []);
    } catch (e) {
      // ignore
    } finally {
      setLoadingMethods(false);
    }
  };

  const saveSettingsToServer = async () => {
    setSavingSettings(true);
    try {
      await adminApi.updateSettings({
        milkPricePerLiter: settings.milkPricePerLiter,
        siteName: settings.siteName,
        defaultCurrency: settings.defaultCurrency
      });
      toast.success('Price per liter updated successfully!');
    } catch (e: any) {
      toast.error('Failed to save: ' + (e.message || e));
    } finally {
      setSavingSettings(false);
    }
  };

  const createPaymentMethod = async (name: string) => {
    try {
      await paymentsApi.createMethod({ name });
      toast.success('Payment method created');
      loadAll();
    } catch (e: any) {
      toast.error('Create failed: ' + (e.message || e));
    }
  };

  const updatePaymentMethod = async (id: number, name: string) => {
    try {
      await paymentsApi.updateMethod(id, { name });
      toast.success('Updated');
      loadAll();
    } catch (e: any) { toast.error('Update failed'); }
  };

  const deletePaymentMethod = async (id: number) => {
    try {
      await paymentsApi.deleteMethod(id);
      toast.success('Deleted');
      loadAll();
    } catch (e: any) { toast.error('Delete failed'); }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 p-4 lg:p-6">
      {/* Sidebar - Responsive */}
      <div className="w-full lg:w-64 shrink-0">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <h3 className="text-lg font-bold mb-4 px-2">Settings</h3>
          <nav className="space-y-1 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible">
            {[
              { id: 'general', label: 'General', icon: faCog },
              { id: 'payments', label: 'Payment Methods', icon: faMoneyBillWave },
              { id: 'farmers', label: 'Manage Farmers', icon: faCow },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setSection(item.id as any)}
                className={`whitespace-nowrap text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  section === item.id ? 'bg-purple-100 text-purple-700' : 'hover:bg-slate-100'
                }`}
              >
                <FontAwesomeIcon icon={item.icon} className="w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content - Responsive */}
      <section className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 lg:p-6 overflow-x-auto">
        {section === 'general' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faMoneyBillWave} className="text-purple-600" />
                Milk Price Settings
              </h4>
              
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-4 lg:p-6 border border-purple-100">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-600 mb-2">Price per Liter (RWF)</label>
                  <input
                    type="number"
                    value={settings.milkPricePerLiter}
                    onChange={(e) => setSettings({ ...settings, milkPricePerLiter: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-bold"
                    min="0"
                    step="10"
                  />
                  <p className="text-xs text-slate-500 mt-2">This price will be used for all new milk records</p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-600 mb-2">Site Name</label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-600 mb-2">Currency</label>
                  <select
                    value={settings.defaultCurrency}
                    onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                    className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="RWF">RWF - Rwandan Franc</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                </div>

                <button
                  onClick={saveSettingsToServer}
                  disabled={savingSettings}
                  className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faSave} />
                  {savingSettings ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        )}

        {section === 'payments' && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h4 className="text-xl font-bold">Payment Methods</h4>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium flex items-center gap-2">
                    <FontAwesomeIcon icon={faPlus} /> Add Method
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>New Payment Method</DialogTitle>
                  </DialogHeader>
                  <PaymentMethodForm onSubmit={createPaymentMethod} />
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-2">
              {loadingMethods ? (
                <div className="text-center py-8">Loading...</div>
              ) : methods.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No payment methods configured</div>
              ) : (
                methods.map(m => (
                  <div key={m.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg gap-2">
                    <span className="font-medium">{m.name}</span>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="px-3 py-1 bg-slate-100 rounded text-sm flex items-center gap-1">
                            <FontAwesomeIcon icon={faEdit} /> Edit
                          </button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Payment Method</DialogTitle>
                          </DialogHeader>
                          <PaymentMethodEdit id={m.id} name={m.name} onSave={updatePaymentMethod} />
                        </DialogContent>
                      </Dialog>
                      <button onClick={() => deletePaymentMethod(m.id)} className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm flex items-center gap-1">
                        <FontAwesomeIcon icon={faTrash} /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {section === 'farmers' && <FarmersManagement />}
      </section>
    </div>
  );
}

// Farmers Management Component
function FarmersManagement() {
  const [farmers, setFarmers] = useState<FarmerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FarmerWithStats | null>(null);
  const [form, setForm] = useState<FarmerForm>({ email: '', full_name: '', phone: '', village: '', sector: '', password: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerWithStats | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getFarmers();
      const records = await adminApi.getAllRecords();
      
      const farmersWithStats = (data || []).map((farmer: any) => {
        const farmerRecordsData = records.filter((r: any) => r.farmer_user_id === farmer.user_id);
        const totalLiters = farmerRecordsData.reduce((sum: number, r: any) => sum + parseFloat(r.liters || 0), 0);
        const totalAmount = farmerRecordsData.reduce((sum: number, r: any) => sum + parseFloat(r.total_amount || 0), 0);
        
        return {
          ...farmer,
          total_liters: totalLiters,
          total_amount: totalAmount,
          total_entries: farmerRecordsData.length,
          avg_rate: totalLiters > 0 ? totalAmount / totalLiters : 0
        };
      });
      
      setFarmers(farmersWithStats);
    } catch (err: any) {
      toast.error('Failed to load farmers: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => setForm({ email: '', full_name: '', phone: '', village: '', sector: '', password: '' });

  const openCreate = () => { resetForm(); setEditing(null); setOpen(true); };

  const openEdit = (f: FarmerWithStats) => {
    setEditing(f);
    setForm({
      email: f.email || '',
      full_name: f.full_name || f.username || '',
      phone: f.phone || '',
      village: f.village || '',
      sector: f.sector || '',
      password: ''
    });
    setOpen(true);
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('Delete this farmer? This action cannot be undone.')) return;
    try {
      await adminApi.deleteUser(userId);
      toast.success('Farmer deleted');
      setFarmers(prev => prev.filter(f => f.user_id !== userId && f.id !== userId));
    } catch (err: any) {
      toast.error('Delete failed: ' + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await adminApi.updateUser(editing.user_id || editing.id, form);
        toast.success('Farmer updated successfully');
      } else {
        await adminApi.createUser({ ...form, role: 'farmer' });
        toast.success('Farmer created successfully');
      }
      setOpen(false);
      load();
    } catch (err: any) {
      toast.error('Save failed: ' + err.message);
    }
  };

  const filteredFarmers = useMemo(() => {
    if (!searchTerm) return farmers;
    const term = searchTerm.toLowerCase();
    return farmers.filter(f => 
      f.full_name?.toLowerCase().includes(term) ||
      f.email?.toLowerCase().includes(term) ||
      f.phone?.toLowerCase().includes(term) ||
      f.village?.toLowerCase().includes(term)
    );
  }, [farmers, searchTerm]);

  const totals = useMemo(() => ({
    totalLiters: filteredFarmers.reduce((s, f) => s + f.total_liters, 0),
    totalAmount: filteredFarmers.reduce((s, f) => s + f.total_amount, 0),
    totalFarmers: filteredFarmers.length
  }), [filteredFarmers]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h4 className="text-xl font-bold flex items-center gap-2">
          <FontAwesomeIcon icon={faCow} className="text-emerald-600" />
          Manage Farmers
        </h4>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search farmers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full sm:w-48"
            />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button onClick={openCreate} className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium flex items-center gap-2 whitespace-nowrap">
                <FontAwesomeIcon icon={faPlus} /> New Farmer
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit Farmer' : 'Create New Farmer'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm block mb-1">Full Name *</label>
                    <input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full border px-3 py-2 rounded" placeholder="Enter full name" />
                  </div>
                  <div>
                    <label className="text-sm block mb-1">Email *</label>
                    <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full border px-3 py-2 rounded" placeholder="email@example.com" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm block mb-1">Phone</label>
                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full border px-3 py-2 rounded" placeholder="+250 7XX XXX XXX" />
                  </div>
                  <div>
                    <label className="text-sm block mb-1">Village</label>
                    <input value={form.village} onChange={e => setForm({ ...form, village: e.target.value })} className="w-full border px-3 py-2 rounded" placeholder="Village name" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm block mb-1">Sector</label>
                    <input value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })} className="w-full border px-3 py-2 rounded" placeholder="Sector name" />
                  </div>
                  {!editing && (
                    <div>
                      <label className="text-sm block mb-1">Password *</label>
                      <input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full border px-3 py-2 rounded" placeholder="Enter password" />
                    </div>
                  )}
                </div>
                {editing && (
                  <p className="text-xs text-slate-500">Leave password empty to keep current password</p>
                )}
                <DialogFooter>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 bg-slate-100 rounded flex-1 sm:flex-none">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded flex-1 sm:flex-none">{editing ? 'Update' : 'Create'}</button>
                  </div>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-blue-50 p-4 rounded-xl">
          <p className="text-xs text-blue-600 font-bold uppercase">Total Farmers</p>
          <p className="text-2xl font-black text-blue-700">{totals.totalFarmers}</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-xl">
          <p className="text-xs text-emerald-600 font-bold uppercase">Total Liters</p>
          <p className="text-2xl font-black text-emerald-700">{totals.totalLiters.toFixed(1)}L</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl">
          <p className="text-xs text-purple-600 font-bold uppercase">Total Amount</p>
          <p className="text-2xl font-black text-purple-700">{totals.totalAmount.toLocaleString()} RWF</p>
        </div>
      </div>

      {/* Table - Responsive */}
      {loading ? (
        <div className="p-6 text-center">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="text-sm text-slate-500 font-bold bg-slate-50">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2">Village</th>
                <th className="px-3 py-2 text-right">Total L</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-right">Entries</th>
                <th className="px-3 py-2 text-right">Avg Rate</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFarmers.map((f, index) => (
                <tr key={f.id || f.user_id} className="hover:bg-slate-50 border-b border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-500">{index + 1}</td>
                  <td className="px-3 py-2 font-bold">{f.full_name || f.username}</td>
                  <td className="px-3 py-2">{f.phone || '-'}</td>
                  <td className="px-3 py-2">{f.village || '-'}</td>
                  <td className="px-3 py-2 text-right font-medium text-blue-600">{f.total_liters.toFixed(1)}L</td>
                  <td className="px-3 py-2 text-right font-bold text-emerald-600">{f.total_amount.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{f.total_entries}</td>
                  <td className="px-3 py-2 text-right text-purple-600">{f.avg_rate.toFixed(0)} RWF/L</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button onClick={() => { setSelectedFarmer(f); setViewDialogOpen(true); }} className="p-1.5 bg-blue-100 text-blue-700 rounded text-xs" title="View">
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button onClick={() => openEdit(f)} className="p-1.5 bg-slate-100 rounded text-xs" title="Edit">
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button onClick={() => handleDelete(f.user_id || f.id)} className="p-1.5 bg-red-100 text-red-700 rounded text-xs" title="Delete">
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                <td className="px-3 py-2 text-slate-700">TOTAL</td>
                <td className="px-3 py-2 text-slate-700">{totals.totalFarmers} Farmers</td>
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2 text-right text-blue-600">{totals.totalLiters.toFixed(1)}L</td>
                <td className="px-3 py-2 text-right text-emerald-600">{totals.totalAmount.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{filteredFarmers.reduce((s, f) => s + f.total_entries, 0)}</td>
                <td className="px-3 py-2 text-right text-purple-600">{totals.totalLiters > 0 ? (totals.totalAmount / totals.totalLiters).toFixed(0) : 0} RWF/L</td>
                <td className="px-3 py-2"></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PaymentMethodForm({ onSubmit }:{ onSubmit: (name:string)=>void }){
  const [formName, setFormName] = React.useState('');
  return (
    <form onSubmit={(e) => { e.preventDefault(); if(formName) onSubmit(formName); }} className="space-y-3">
      <div>
        <label className="text-sm">Method name</label>
        <input value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full mt-2 p-2 border rounded" />
      </div>
      <DialogFooter>
        <div className="flex gap-2">
          <button type="button" className="px-4 py-2 bg-slate-100 rounded">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded">Create</button>
        </div>
      </DialogFooter>
    </form>
  );
}

function PaymentMethodEdit({ id, name, onSave }:{ id:number; name:string; onSave:(id:number, name:string)=>void }){
  const [editValue, setEditValue] = React.useState(name);
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(id, editValue); }} className="space-y-3">
      <div>
        <label className="text-sm">Method name</label>
        <input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-full mt-2 p-2 border rounded" />
      </div>
      <DialogFooter>
        <div className="flex gap-2">
          <button type="button" className="px-4 py-2 bg-slate-100 rounded">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded">Save</button>
        </div>
      </DialogFooter>
    </form>
  );
}
