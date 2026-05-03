import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '../ui/dialog';

type UserForm = {
  email: string;
  full_name: string;
  phone?: string;
  village?: string;
  sector?: string;
  password?: string;
};

export default function ManageCollectors() {
  const [collectors, setCollectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<UserForm>({ email: '', full_name: '', phone: '', village: '', sector: '', password: '' });

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getCollectors();
      setCollectors(data || []);
    } catch (err: any) {
      toast.error('Failed to load collectors: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => setForm({ email: '', full_name: '', phone: '', village: '', sector: '', password: '' });

  const openCreate = () => { resetForm(); setEditing(null); setOpen(true); };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({
      email: c.email || '',
      full_name: c.full_name || c.username || '',
      phone: c.phone || '',
      village: c.village || '',
      sector: c.sector || '',
      password: ''
    });
    setOpen(true);
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('Delete this collector?')) return;
    try {
      await adminApi.deleteUser(userId);
      toast.success('Collector deleted');
      setCollectors(prev => prev.filter(c => c.user_id !== userId && c.id !== userId));
    } catch (err: any) {
      toast.error('Delete failed: ' + (err.message || err));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await adminApi.updateUser(editing.user_id || editing.id, form);
        toast.success('Collector updated');
      } else {
        await adminApi.createUser({ ...form, role: 'collector' });
        toast.success('Collector created');
      }
      setOpen(false);
      load();
    } catch (err: any) {
      toast.error('Save failed: ' + (err.message || err));
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Manage Collectors</h3>
        <div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button onClick={openCreate} className="px-4 py-2 bg-purple-600 text-white rounded-lg">New Collector</button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit Collector' : 'Create Collector'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="text-sm block mb-1">Full name</label>
                  <input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full border px-3 py-2 rounded" />
                </div>
                <div>
                  <label className="text-sm block mb-1">Email</label>
                  <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full border px-3 py-2 rounded" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm block mb-1">Phone</label>
                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full border px-3 py-2 rounded" />
                  </div>
                  <div>
                    <label className="text-sm block mb-1">Sector</label>
                    <input value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })} className="w-full border px-3 py-2 rounded" />
                  </div>
                </div>
                {!editing && (
                  <div>
                    <label className="text-sm block mb-1">Password</label>
                    <input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full border px-3 py-2 rounded" />
                  </div>
                )}

                <DialogFooter>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 bg-slate-100 rounded">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded">Save</button>
                  </div>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="p-6">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm text-slate-500 font-bold">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Sector</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {collectors.map((c) => (
                <tr key={c.id || c.user_id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">{c.full_name || c.username}</td>
                  <td className="px-4 py-3">{c.email}</td>
                  <td className="px-4 py-3">{c.phone || '-'}</td>
                  <td className="px-4 py-3">{c.sector || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => { alert(JSON.stringify(c, null, 2)); }} className="px-3 py-1 bg-slate-100 rounded">View</button>
                      <button onClick={() => openEdit(c)} className="px-3 py-1 bg-blue-100 rounded">Edit</button>
                      <button onClick={() => handleDelete(c.user_id || c.id)} className="px-3 py-1 bg-red-100 rounded">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
