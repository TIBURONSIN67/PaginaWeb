import { useState } from 'react';
import { ordersApi } from '../lib/api';
import { useOrders, useCreateOrder, useUpdateOrderStatus, useOrder } from '../hooks/useOrders';
import toast from 'react-hot-toast';
import {
  ClipboardList, Search, Eye, Edit3, Ban, CheckCircle,
  ChevronLeft, ChevronRight, Filter, X, Plus, Printer,
  User, Package, Calendar, Trash2,
} from 'lucide-react';

const STATUSES = [
  'Pending', 'Confirmed', 'Preparing', 'Ready for Pickup',
  'Shipped', 'Completed', 'Cancelled',
];

const statusBadge = {
  Pending: 'badge bg-gray-100 text-gray-700',
  Confirmed: 'badge bg-blue-100 text-blue-700',
  Preparing: 'badge bg-amber-100 text-amber-700',
  'Ready for Pickup': 'badge bg-orange-100 text-orange-700',
  Shipped: 'badge bg-purple-100 text-purple-700',
  Completed: 'badge bg-emerald-100 text-emerald-700',
  Cancelled: 'badge bg-red-100 text-red-700',
};

const statusDot = {
  Pending: 'bg-gray-400',
  Confirmed: 'bg-blue-500',
  Preparing: 'bg-amber-500',
  'Ready for Pickup': 'bg-orange-500',
  Shipped: 'bg-purple-500',
  Completed: 'bg-emerald-500',
  Cancelled: 'bg-red-500',
};

const paymentBadge = {
  Pending: 'badge bg-gray-100 text-gray-600',
  Paid: 'badge bg-emerald-100 text-emerald-700',
  Partial: 'badge bg-amber-100 text-amber-700',
  Refunded: 'badge bg-red-100 text-red-700',
};

const PAYMENT_METHODS = ['Cash', 'Transfer', 'Card'];

const ITEMS_PER_PAGE = 10;

const INITIAL_CREATE_FORM = {
  customerPhone: '',
  customerName: '',
  items: [{ productId: '', quantity: '1' }],
  paymentMethod: 'Cash',
  shippingAddress: '',
  notes: '',
  discount: '0',
};

function statusIndex(s) {
  return ['Pending', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Shipped', 'Completed'].indexOf(s);
}

export default function Orders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState(INITIAL_CREATE_FORM);
  const [detailOrderId, setDetailOrderId] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(null);

  const queryParams = { page, limit: ITEMS_PER_PAGE };
  if (search) queryParams.search = search;
  if (statusFilter) queryParams.status = statusFilter;
  if (dateFrom) queryParams.from = dateFrom;
  if (dateTo) queryParams.to = dateTo;

  const { data: ordersRes, isLoading } = useOrders(queryParams);
  const createOrder = useCreateOrder();
  const updateOrderStatus = useUpdateOrderStatus();
  const { data: orderDetailRes, isLoading: detailLoading } = useOrder(detailOrderId);

  const orders = ordersRes?.data || (Array.isArray(ordersRes) ? ordersRes : []);
  const totalPages = ordersRes?.totalPages || ordersRes?.pages || 1;
  const total = ordersRes?.total || orders.length;
  const orderDetail = orderDetailRes?.data || orderDetailRes;

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const openCreateModal = () => {
    setCreateForm(INITIAL_CREATE_FORM);
    setCreateModalOpen(true);
  };

  const handleCreateFormChange = (e) => {
    setCreateForm({ ...createForm, [e.target.name]: e.target.value });
  };

  const handleItemChange = (index, field, value) => {
    const items = [...createForm.items];
    items[index] = { ...items[index], [field]: value };
    setCreateForm({ ...createForm, items });
  };

  const addItem = () => {
    setCreateForm({
      ...createForm,
      items: [...createForm.items, { productId: '', quantity: '1' }],
    });
  };

  const removeItem = (index) => {
    if (createForm.items.length <= 1) return;
    const items = createForm.items.filter((_, i) => i !== index);
    setCreateForm({ ...createForm, items });
  };

  const handleCreateOrder = () => {
    const payload = {
      customerPhone: createForm.customerPhone,
      customerName: createForm.customerName,
      items: createForm.items
        .filter((item) => item.productId)
        .map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity) || 1,
        })),
      paymentMethod: createForm.paymentMethod,
      shippingAddress: createForm.shippingAddress,
      notes: createForm.notes,
      discount: Number(createForm.discount) || 0,
    };

    if (payload.items.length === 0) {
      toast.error('Add at least one item');
      return;
    }

    createOrder.mutate(payload, {
      onSuccess: () => setCreateModalOpen(false),
    });
  };

  const openDetail = (id) => {
    const orderId = id || '';
    setDetailOrderId(orderId);
  };

  const handleStatusUpdate = (status) => {
    updateOrderStatus.mutate({ id: detailOrderId, status });
  };

  const handleCancelOrder = () => {
    if (!cancelConfirm) return;
    const id = cancelConfirm._id || cancelConfirm.id;
    updateOrderStatus.mutate({ id, status: 'Cancelled' }, {
      onSuccess: () => setCancelConfirm(null),
    });
  };

  const handlePrint = () => {
    toast('Print feature coming soon', { icon: '\uD83D\uDDA8\uFE0F' });
  };

  const orderId = (order) => order._id || order.id || '';
  const orderNumber = (order) => order.orderNumber || orderId(order).toString().slice(-6).toUpperCase();
  const orderDate = (order) => new Date(order.createdAt || order.date).toLocaleDateString();
  const orderCustomerName = (order) => order.customer?.name || order.customerName || 'Walk-in';
  const orderCustomerPhone = (order) => order.customer?.phone || order.customerPhone || '\u2014';
  const orderItemCount = (order) => order.items?.length || order.itemCount || 0;
  const orderTotal = (order) => (order.total || 0).toFixed(2);
  const orderPaymentStatus = (order) => order.paymentStatus || 'Pending';
  const orderStatus = (order) => order.status || 'Pending';

  const nextStatuses = (current) => {
    const flow = {
      Pending: ['Confirmed', 'Cancelled'],
      Confirmed: ['Preparing', 'Cancelled'],
      Preparing: ['Ready for Pickup', 'Cancelled'],
      'Ready for Pickup': ['Shipped', 'Cancelled'],
      Shipped: ['Completed', 'Cancelled'],
      Completed: [],
      Cancelled: [],
    };
    return flow[current] || [];
  };

  const detail = orderDetail && (orderDetail._id || orderDetail.id) ? orderDetail : null;

  const visibleStatuses = STATUSES.filter(
    (s) => !['Cancelled'].includes(s) || (detail && detail.status === 'Cancelled')
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Manage customer orders</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary text-sm">
          <Plus className="w-4 h-4" />
          Create Order
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order number or customer..."
            value={search}
            onChange={handleSearchChange}
            className="input pl-10"
          />
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className="btn-secondary text-sm"
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => { setStatusFilter(''); setPage(1); }}
          className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${!statusFilter ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
        >
          All
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {showFilter && (
        <div className="card p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="input"
            />
          </div>
          <div>
            <label className="label">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="input"
            />
          </div>
        </div>
      )}

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Order#</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Customer Name</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Phone</th>
                <th className="text-center text-xs font-medium text-gray-500 px-5 py-3">Items</th>
                <th className="text-right text-xs font-medium text-gray-500 px-5 py-3">Total</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Payment</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Date</th>
                <th className="text-right text-xs font-medium text-gray-500 px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      <ClipboardList className="w-10 h-10 text-gray-300" />
                      <p className="text-sm text-gray-400">No orders found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={orderId(order)}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-5 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                      #{orderNumber(order)}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {orderCustomerName(order)}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {orderCustomerPhone(order)}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600 text-center">
                      {orderItemCount(order)}
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-900 text-right whitespace-nowrap">
                      ${orderTotal(order)}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className={paymentBadge[orderPaymentStatus(order)] || paymentBadge.Pending}>
                        {orderPaymentStatus(order)}
                      </span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className={statusBadge[orderStatus(order)] || statusBadge.Pending}>
                        {orderStatus(order)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {orderDate(order)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openDetail(orderId(order))}
                          className="btn-ghost p-2 text-sm"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDetail(orderId(order))}
                          className="btn-ghost p-2 text-sm"
                          title="Edit Status"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {(orderStatus(order) !== 'Cancelled' && orderStatus(order) !== 'Completed') && (
                          <button
                            onClick={() => setCancelConfirm(order)}
                            className="btn-ghost p-2 text-sm text-red-600 hover:bg-red-50"
                            title="Cancel"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages} ({total} orders)
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-ghost p-2 text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, i, arr) => (
                  <span key={p}>
                    {i > 0 && arr[i - 1] !== p - 1 && (
                      <span className="px-1 text-gray-400">&hellip;</span>
                    )}
                    <button
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        p === page
                          ? 'bg-primary-600 text-white'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="btn-ghost p-2 text-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCreateModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Create Order</h2>
              <button onClick={() => setCreateModalOpen(false)} className="btn-ghost p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Customer Phone</label>
                  <input
                    name="customerPhone"
                    value={createForm.customerPhone}
                    onChange={handleCreateFormChange}
                    placeholder="Phone number"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Customer Name</label>
                  <input
                    name="customerName"
                    value={createForm.customerName}
                    onChange={handleCreateFormChange}
                    placeholder="Customer name"
                    className="input"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Order Items</label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="btn-ghost text-sm p-1 text-primary-600"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {createForm.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        placeholder="Product ID"
                        value={item.productId}
                        onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                        className="input flex-1"
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className="input w-20"
                      />
                      {createForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="btn-ghost p-2 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Payment Method</label>
                  <select
                    name="paymentMethod"
                    value={createForm.paymentMethod}
                    onChange={handleCreateFormChange}
                    className="input"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Discount ($)</label>
                  <input
                    name="discount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={createForm.discount}
                    onChange={handleCreateFormChange}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Shipping Address</label>
                <input
                  name="shippingAddress"
                  value={createForm.shippingAddress}
                  onChange={handleCreateFormChange}
                  placeholder="Shipping address"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea
                  name="notes"
                  value={createForm.notes}
                  onChange={handleCreateFormChange}
                  rows={3}
                  placeholder="Order notes..."
                  className="input"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setCreateModalOpen(false)} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleCreateOrder}
                disabled={createOrder.isPending}
                className="btn-primary"
              >
                {createOrder.isPending ? 'Creating...' : 'Save Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailOrderId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDetailOrderId(null)} />
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
                    <ClipboardList className="w-5 h-5 text-primary-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      Order #{detail.orderNumber || (detail._id || detail.id || '').toString().slice(-6).toUpperCase()}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={handlePrint} className="btn-ghost p-2 text-sm" title="Print">
                      <Printer className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDetailOrderId(null)} className="btn-ghost p-2">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-5 space-y-6">
                  <div className="flex items-center justify-between">
                    <span className={statusBadge[detail.status] || statusBadge.Pending}>
                      {detail.status || 'Pending'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(detail.createdAt || detail.date).toLocaleString()}
                    </span>
                  </div>

                  <div className="card p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      Customer Information
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-400">Name</p>
                        <p className="font-medium text-gray-900">
                          {detail.customer?.name || detail.customerName || 'Walk-in'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Phone</p>
                        <p className="font-medium text-gray-900">
                          {detail.customer?.phone || detail.customerPhone || '\u2014'}
                        </p>
                      </div>
                      {detail.shippingAddress && (
                        <div className="col-span-2">
                          <p className="text-gray-400">Shipping Address</p>
                          <p className="font-medium text-gray-900">{detail.shippingAddress}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-400">Payment Method</p>
                        <p className="font-medium text-gray-900">{detail.paymentMethod || '\u2014'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Payment Status</p>
                        <span className={paymentBadge[detail.paymentStatus] || paymentBadge.Pending}>
                          {detail.paymentStatus || 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="card p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      Order Items
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-50">
                            <th className="text-left text-xs font-medium text-gray-500 py-2">Product</th>
                            <th className="text-center text-xs font-medium text-gray-500 py-2">Qty</th>
                            <th className="text-right text-xs font-medium text-gray-500 py-2">Price</th>
                            <th className="text-right text-xs font-medium text-gray-500 py-2">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(detail.items || []).map((item, i) => (
                            <tr key={i} className="border-b border-gray-50">
                              <td className="py-2 text-gray-700">
                                {item.product?.name || item.productId || item.product?.sku || `Item ${i + 1}`}
                              </td>
                              <td className="py-2 text-center text-gray-600">{item.quantity || 1}</td>
                              <td className="py-2 text-right text-gray-600">
                                ${(item.price || item.unitPrice || 0).toFixed(2)}
                              </td>
                              <td className="py-2 text-right font-medium text-gray-900">
                                ${((item.price || item.unitPrice || 0) * (item.quantity || 1)).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <div className="text-sm space-y-1">
                        {(detail.discount || 0) > 0 && (
                          <p className="text-gray-400">Discount: -${(detail.discount || 0).toFixed(2)}</p>
                        )}
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        ${(detail.total || 0).toFixed(2)}
                      </p>
                    </div>
                    {detail.notes && (
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-400 mb-1">Notes</p>
                        <p className="text-sm text-gray-600">{detail.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="card p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      Status Timeline
                    </h3>
                    <div className="flex items-center gap-0 py-2">
                      {visibleStatuses.map((s, i) => {
                        const currentIdx = statusIndex(detail.status);
                        const itemIdx = statusIndex(s);
                        const isPast = itemIdx >= 0 && itemIdx < currentIdx;
                        const isCurrent = s === detail.status;
                        const isCancelled = detail.status === 'Cancelled';
                        const lineColor = isCancelled
                          ? 'bg-red-200'
                          : isPast
                            ? 'bg-emerald-400'
                            : 'bg-gray-200';

                        return (
                          <div key={s} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                  isCancelled && s === 'Cancelled'
                                    ? 'bg-red-500 text-white'
                                    : isCurrent
                                      ? `${statusDot[s] || 'bg-gray-500'} text-white`
                                      : isPast
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-gray-200 text-gray-500'
                                }`}
                              >
                                {isPast ? <CheckCircle className="w-4 h-4" /> : (itemIdx >= 0 ? itemIdx + 1 : '')}
                              </div>
                              <span className={`text-xs mt-1 text-center whitespace-nowrap ${
                                isCurrent ? 'font-semibold text-gray-900' : 'text-gray-400'
                              }`}>
                                {s === 'Ready for Pickup' ? 'Pickup' : s}
                              </span>
                            </div>
                            {i < visibleStatuses.length - 1 && (
                              <div className={`flex-1 h-0.5 mx-1 ${lineColor}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {nextStatuses(detail.status).length > 0 && (
                    <div className="card p-4 space-y-3">
                      <h3 className="text-sm font-semibold text-gray-900">Update Status</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        {nextStatuses(detail.status).map((ns) => (
                          <button
                            key={ns}
                            onClick={() => handleStatusUpdate(ns)}
                            disabled={updateOrderStatus.isPending}
                            className={ns === 'Cancelled' ? 'btn-danger text-sm' : 'btn-primary text-sm'}
                          >
                            {ns === 'Cancelled' && <Ban className="w-4 h-4" />}
                            {ns !== 'Cancelled' && <CheckCircle className="w-4 h-4" />}
                            {ns}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Order not found</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {cancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCancelConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Cancel Order</h2>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to cancel order <strong>#{orderNumber(cancelConfirm)}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setCancelConfirm(null)} className="btn-secondary">
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={updateOrderStatus.isPending}
                className="btn-danger"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
