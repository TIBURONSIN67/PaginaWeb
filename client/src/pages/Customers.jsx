import { useState } from 'react';
import { customersApi } from '../lib/api';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, Search, Phone, Mail, MapPin, ShoppingCart, MessageSquare,
  Edit, Plus, X, Calendar, DollarSign,
} from 'lucide-react';

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500',
];

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(str) {
  if (!str) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

const INITIAL_FORM = {
  phone_number: '',
  full_name: '',
  email: '',
  city: '',
  address: '',
  notes: '',
};

export default function Customers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [detailCustomerId, setDetailCustomerId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [detailNotes, setDetailNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const { data: customersRes, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.getAll(),
  });

  const { data: detailRes, isLoading: detailLoading } = useQuery({
    queryKey: ['customer', detailCustomerId],
    queryFn: () => customersApi.getById(detailCustomerId),
    enabled: !!detailCustomerId,
  });

  const createCustomer = useMutation({
    mutationFn: customersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer created');
      setModalOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create customer'),
  });

  const updateCustomer = useMutation({
    mutationFn: ({ id, data }) => customersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', detailCustomerId] });
      toast.success('Customer updated');
      setModalOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to update customer'),
  });

  const customers = customersRes?.data || (Array.isArray(customersRes) ? customersRes : []);
  const detail = detailRes?.data || detailRes;

  const filteredCustomers = Array.isArray(customers)
    ? customers.filter((c) => {
        if (!search) return true;
        const q = search.toLowerCase();
        const name = (c.full_name || '').toLowerCase();
        const phone = (c.phone_number || '').toLowerCase();
        const email = (c.email || '').toLowerCase();
        const city = (c.city || '').toLowerCase();
        return name.includes(q) || phone.includes(q) || email.includes(q) || city.includes(q);
      })
    : [];

  const customerId = (c) => c.id || '';
  const customerName = (c) => c.full_name || 'Unknown';
  const customerPhone = (c) => c.phone_number || '\u2014';
  const customerEmail = (c) => c.email || '\u2014';
  const customerCity = (c) => c.city || '\u2014';
  const customerOrders = (c) => c.total_orders ?? 0;
  const customerSpent = (c) =>
    (c.total_spent ?? 0).toFixed(2);
  const customerLastMsg = (c) => c.last_message || '';
  const customerCreatedAt = (c) => c.created_at || '';

  const openAddModal = () => {
    setEditingCustomer(null);
    setForm(INITIAL_FORM);
    setModalOpen(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setForm({
      phone_number: customer.phone_number || '',
      full_name: customer.full_name || '',
      email: customer.email || '',
      city: customer.city || '',
      address: customer.address || '',
      notes: customer.notes || '',
    });
    setModalOpen(true);
    setDetailCustomerId(null);
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    if (!form.full_name.trim() && !form.phone_number.trim()) {
      toast.error('Name or phone number is required');
      return;
    }
    const payload = { ...form };

    if (editingCustomer) {
      const id = editingCustomer.id;
      updateCustomer.mutate({ id, data: payload });
    } else {
      createCustomer.mutate(payload);
    }
  };

  const openDetail = (customer) => {
    const id = customerId(customer);
    setDetailCustomerId(id);
    setDetailNotes(customer.notes || '');
  };

  const handleSaveNotes = () => {
    if (!detailCustomerId) return;
    setSavingNotes(true);
    customersApi
      .update(detailCustomerId, { notes: detailNotes })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['customer', detailCustomerId] });
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        toast.success('Notes saved');
      })
      .catch((err) => toast.error(err.response?.data?.error || 'Failed to save notes'))
      .finally(() => setSavingNotes(false));
  };

  const isSaving = createCustomer.isPending || updateCustomer.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your customer relationships</p>
        </div>
        <button onClick={openAddModal} className="btn-primary text-sm">
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, phone, email, or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20">
          <Users className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-1">No customers found</h3>
          <p className="text-sm text-gray-400">
            {search ? 'Try adjusting your search' : 'Add your first customer to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => {
            const id = customerId(customer);
            return (
              <button
                key={id}
                onClick={() => openDetail(customer)}
                className="card p-5 text-left hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-white text-lg font-semibold ${getAvatarColor(customerName(customer))}`}
                  >
                    {getInitials(customerName(customer))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {customerName(customer)}
                    </h3>
                    <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                      <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{customerPhone(customer)}</span>
                    </div>
                    {customerEmail(customer) !== '\u2014' && (
                      <div className="flex items-center gap-1 mt-0.5 text-sm text-gray-500">
                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{customerEmail(customer)}</span>
                      </div>
                    )}
                    {customerCity(customer) !== '\u2014' && (
                      <div className="flex items-center gap-1 mt-0.5 text-sm text-gray-500">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{customerCity(customer)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-1.5">
                    <ShoppingCart className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      <span className="font-medium text-gray-900">{customerOrders(customer)}</span> orders
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium text-gray-900">
                      ${customerSpent(customer)}
                    </span>
                  </div>
                </div>

                {customerLastMsg(customer) && (
                  <div className="flex items-start gap-1.5 mt-3 pt-3 border-t border-gray-50">
                    <MessageSquare className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {customerLastMsg(customer)}
                    </p>
                  </div>
                )}

                {customerCreatedAt(customer) && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-400">
                      {formatDate(customerCreatedAt(customer))}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {detailCustomerId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDetailCustomerId(null)} />
          <div className="relative bg-white w-full max-w-2xl h-full overflow-y-auto shadow-2xl animate-slide-in-right">
            {detailLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-6 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            ) : detail ? (
              <div>
                <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Customer Details</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal({ ...detail, id: detailCustomerId })}
                      className="btn-secondary text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button onClick={() => setDetailCustomerId(null)} className="btn-ghost p-2">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-5 space-y-6">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 ${getAvatarColor(detail.full_name || '')}`}
                    >
                      {getInitials(detail.full_name || '')}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{detail.full_name || 'Unknown'}</h3>
                      <p className="text-sm text-gray-500">{detail.phone_number || 'No phone'}</p>
                    </div>
                  </div>

                  <div className="card p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-400">Phone</p>
                        <p className="font-medium text-gray-900 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {detail.phone_number || '\u2014'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Email</p>
                        <p className="font-medium text-gray-900 flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {detail.email || '\u2014'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">City</p>
                        <p className="font-medium text-gray-900 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {detail.city || '\u2014'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Customer Since</p>
                        <p className="font-medium text-gray-900 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(detail.created_at) || '\u2014'}
                        </p>
                      </div>
                      {detail.address && (
                        <div className="col-span-2">
                          <p className="text-gray-400">Address</p>
                          <p className="font-medium text-gray-900">{detail.address}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="card p-4 text-center">
                      <ShoppingCart className="w-5 h-5 text-primary-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900">
                        {detail.total_orders ?? 0}
                      </p>
                      <p className="text-xs text-gray-500">Total Orders</p>
                    </div>
                    <div className="card p-4 text-center">
                      <DollarSign className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900">
                        ${(detail.total_spent ?? 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">Total Spent</p>
                    </div>
                  </div>

                  {(detail.order_history || detail.orders) && (
                    <div className="card p-4 space-y-3">
                      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-gray-400" />
                        Order History
                      </h3>
                      {(() => {
                        const orders = detail.order_history || detail.orders || [];
                        if (!Array.isArray(orders) || orders.length === 0) {
                          return <p className="text-sm text-gray-400">No orders yet</p>;
                        }
                        return (
                          <div className="space-y-2">
                            {orders.slice(0, 10).map((order, i) => (
                              <div
                                key={order.id || i}
                                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                              >
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    #{`ORD-${String(order.id || '').padStart(6, '0')}`}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatDate(order.created_at || order.date)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-gray-900">
                                    ${(order.total || 0).toFixed(2)}
                                  </p>
                                  <span className="badge bg-gray-100 text-gray-600 text-xs">
                                    {order.status || 'Pending'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <div className="card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Edit className="w-4 h-4 text-gray-400" />
                        Notes
                      </h3>
                      <button
                        onClick={handleSaveNotes}
                        disabled={savingNotes}
                        className="btn-ghost text-sm text-primary-600"
                      >
                        {savingNotes ? 'Saving...' : 'Save Notes'}
                      </button>
                    </div>
                    <textarea
                      value={detailNotes}
                      onChange={(e) => setDetailNotes(e.target.value)}
                      rows={4}
                      placeholder="Add notes about this customer..."
                      className="input resize-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Customer not found</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingCustomer ? 'Edit Customer' : 'Add Customer'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="btn-ghost p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">Phone Number</label>
                <input
                  name="phone_number"
                  value={form.phone_number}
                  onChange={handleFormChange}
                  placeholder="Phone number"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Full Name</label>
                <input
                  name="full_name"
                  value={form.full_name}
                  onChange={handleFormChange}
                  placeholder="Full name"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleFormChange}
                  placeholder="Email address"
                  className="input"
                />
              </div>
              <div>
                <label className="label">City</label>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleFormChange}
                  placeholder="City"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Address</label>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleFormChange}
                  placeholder="Street address"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="Add notes..."
                  className="input resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setModalOpen(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleSave} disabled={isSaving} className="btn-primary">
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
