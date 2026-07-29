import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useInventory,
  useInventoryAlerts,
  useInventoryHistory,
  useStockIn,
  useStockOut,
  useAdjustStock,
} from '../hooks/useInventory';
import toast from 'react-hot-toast';
import {
  Warehouse,
  Plus,
  Minus,
  RotateCcw,
  Clock,
  AlertTriangle,
  Package,
  ArrowUp,
  ArrowDown,
  Search,
  X,
} from 'lucide-react';

function LoadingSkeleton() {
  return (
    <div className="card">
      <div className="p-6">
        <div className="h-10 w-full bg-gray-100 animate-pulse rounded mb-4" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4 mb-3">
            <div className="h-8 flex-1 bg-gray-100 animate-pulse rounded" />
            <div className="h-8 w-24 bg-gray-100 animate-pulse rounded" />
            <div className="h-8 w-20 bg-gray-100 animate-pulse rounded" />
            <div className="h-8 w-20 bg-gray-100 animate-pulse rounded" />
            <div className="h-8 w-24 bg-gray-100 animate-pulse rounded" />
            <div className="h-8 w-32 bg-gray-100 animate-pulse rounded" />
            <div className="h-8 w-40 bg-gray-100 animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ stock, min }) {
  if (stock <= 0) return <span className="badge badge-red">Out of Stock</span>;
  if (stock <= min) return <span className="badge badge-yellow">Low Stock</span>;
  return <span className="badge badge-green">In Stock</span>;
}

function MovementBadge({ type }) {
  const map = {
    IN: { label: 'IN', className: 'badge badge-green' },
    OUT: { label: 'OUT', className: 'badge badge-red' },
    ADJUSTMENT: { label: 'ADJUST', className: 'badge badge-blue' },
    SALE: { label: 'SALE', className: 'badge badge-purple' },
    RETURN: { label: 'RETURN', className: 'badge badge-blue' },
  };
  const cfg = map[type] || { label: type, className: 'badge' };
  return <span className={cfg.className}>{cfg.label}</span>;
}

export default function Inventory() {
  const queryClient = useQueryClient();
  const { data: items, isLoading: loading, error, refetch } = useInventory();
  const { data: alertsData } = useInventoryAlerts();
  const stockInMutation = useStockIn();
  const stockOutMutation = useStockOut();
  const adjustMutation = useAdjustStock();

  const alerts = alertsData?.data || alertsData || {};
  const lowStockCount = alerts.low_stock_count ?? 0;
  const outOfStockCount = alerts.out_of_stock_count ?? 0;

  const [searchTerm, setSearchTerm] = useState('');
  const [alertFilter, setAlertFilter] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);

  const [receiveForm, setReceiveForm] = useState({ product_id: '', quantity: '', reason: '', employee: '' });
  const [removeForm, setRemoveForm] = useState({ product_id: '', quantity: '', reason: '', employee: '' });
  const [adjustForm, setAdjustForm] = useState({ product_id: '', new_quantity: '', reason: '' });

  const [historyProductId, setHistoryProductId] = useState(null);
  const { data: history, isLoading: historyLoading } = useInventoryHistory(historyProductId);

  const productList = items?.data || (Array.isArray(items) ? items : []);

  const filteredItems = productList
    .filter((item) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        item.product_name?.toLowerCase().includes(term) ||
        item.sku?.toLowerCase().includes(term) ||
        item.category?.toLowerCase().includes(term);
      if (!matchesSearch) return false;
      if (alertFilter === 'low') return item.stock > 0 && item.stock <= item.minimum_stock;
      if (alertFilter === 'out') return item.stock <= 0;
      return true;
    })
    .sort((a, b) => {
      if (alertFilter === 'out') return a.stock - b.stock;
      if (alertFilter === 'low') return (a.stock - a.minimum_stock) - (b.stock - b.minimum_stock);
      return 0;
    });

  const handleAlertClick = (filter) => {
    setAlertFilter((prev) => (prev === filter ? null : filter));
  };

  const resetReceiveForm = () => setReceiveForm({ product_id: '', quantity: '', reason: '', employee: '' });
  const resetRemoveForm = () => setRemoveForm({ product_id: '', quantity: '', reason: '', employee: '' });
  const resetAdjustForm = () => setAdjustForm({ product_id: '', new_quantity: '', reason: '' });

  const openReceive = (product) => {
    setSelectedProduct(product);
    setReceiveForm({ product_id: product?.id || '', quantity: '', reason: '', employee: '' });
    setShowReceiveModal(true);
  };

  const openRemove = (product) => {
    setSelectedProduct(product);
    setRemoveForm({ product_id: product?.id || '', quantity: '', reason: '', employee: '' });
    setShowRemoveModal(true);
  };

  const openAdjust = (product) => {
    setSelectedProduct(product);
    setAdjustForm({ product_id: product?.id || '', new_quantity: String(product.stock), reason: '' });
    setShowAdjustModal(true);
  };

  const openHistory = (product) => {
    setHistoryProductId(product?.id);
    setSelectedProduct(product);
    setShowHistoryPanel(true);
  };

  const handleStockIn = async (e) => {
    e.preventDefault();
    if (!receiveForm.quantity || !receiveForm.reason) return toast.error('Please fill all required fields');
    try {
      await stockInMutation.mutateAsync({
        product_id: receiveForm.product_id,
        quantity: Number(receiveForm.quantity),
        reason: receiveForm.reason,
        employee: receiveForm.employee,
      });
      toast.success('Stock received successfully');
      setShowReceiveModal(false);
      resetReceiveForm();
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to receive stock');
    }
  };

  const handleStockOut = async (e) => {
    e.preventDefault();
    if (!removeForm.quantity || !removeForm.reason) return toast.error('Please fill all required fields');
    try {
      await stockOutMutation.mutateAsync({
        product_id: removeForm.product_id,
        quantity: Number(removeForm.quantity),
        reason: removeForm.reason,
        employee: removeForm.employee,
      });
      toast.success('Stock removed successfully');
      setShowRemoveModal(false);
      resetRemoveForm();
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to remove stock');
    }
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    if (adjustForm.new_quantity === '' || !adjustForm.reason) return toast.error('Please fill all required fields');
    try {
      await adjustMutation.mutateAsync({
        product_id: adjustForm.product_id,
        new_quantity: Number(adjustForm.new_quantity),
        reason: adjustForm.reason,
      });
      toast.success('Stock adjusted successfully');
      setShowAdjustModal(false);
      resetAdjustForm();
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to adjust stock');
    }
  };

  const getRowClass = (item) => {
    if (item.stock <= 0) return 'bg-red-50';
    if (item.stock <= item.minimum_stock) return 'bg-yellow-50';
    return '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Warehouse className="w-7 h-7 text-gray-700" />
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          className={`card cursor-pointer transition border-2 ${alertFilter === 'low' ? 'border-yellow-500' : 'border-transparent'}`}
          onClick={() => handleAlertClick('low')}
        >
          <div className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Low Stock Items</p>
              <p className="text-2xl font-bold text-yellow-600">{lowStockCount}</p>
            </div>
          </div>
        </div>
        <div
          className={`card cursor-pointer transition border-2 ${alertFilter === 'out' ? 'border-red-500' : 'border-transparent'}`}
          onClick={() => handleAlertClick('out')}
        >
          <div className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <Package className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <div className="card p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-600">Failed to load inventory data.</p>
          <button className="btn-secondary mt-3" onClick={() => refetch()}>Retry</button>
        </div>
      ) : (
        <div className="card">
          <div className="p-4 border-b flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="input pl-9 w-full"
                placeholder="Search by name, SKU or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {alertFilter && (
              <button
                className="btn-ghost flex items-center gap-1 text-sm"
                onClick={() => setAlertFilter(null)}
              >
                <X className="w-4 h-4" />
                Clear filter
              </button>
            )}
          </div>

          {filteredItems.length === 0 ? (
            <div className="p-10 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No inventory items found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="text-center p-3 text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                    <th className="text-center p-3 text-xs font-medium text-gray-500 uppercase">Minimum Stock</th>
                    <th className="text-center p-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-center p-3 text-xs font-medium text-gray-500 uppercase">Last Movement</th>
                    <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className={`border-b hover:bg-gray-50 transition ${getRowClass(item)}`}>
                      <td className="p-3 font-medium text-gray-900">{item.product_name}</td>
                      <td className="p-3 text-sm text-gray-500 font-mono">{item.sku}</td>
                      <td className="p-3 text-sm text-gray-600">{item.category}</td>
                      <td className="p-3 text-center font-semibold text-gray-900">{item.stock}</td>
                      <td className="p-3 text-center text-sm text-gray-500">{item.minimum_stock}</td>
                      <td className="p-3 text-center">
                        <StatusBadge stock={item.stock} min={item.minimum_stock} />
                      </td>
                      <td className="p-3 text-center text-sm text-gray-500">
                        {item.last_movement ? new Date(item.last_movement).toLocaleDateString() : '--'}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="btn-ghost p-1.5 text-green-600 hover:bg-green-50"
                            title="Receive Stock"
                            onClick={() => openReceive(item)}
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            className="btn-ghost p-1.5 text-red-600 hover:bg-red-50"
                            title="Remove Stock"
                            onClick={() => openRemove(item)}
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            className="btn-ghost p-1.5 text-blue-600 hover:bg-blue-50"
                            title="Adjust Stock"
                            onClick={() => openAdjust(item)}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            className="btn-ghost p-1.5 text-gray-600 hover:bg-gray-100"
                            title="View History"
                            onClick={() => openHistory(item)}
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showReceiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setShowReceiveModal(false); resetReceiveForm(); }}>
          <div className="card w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Plus className="w-5 h-5 text-green-600" /> Receive Stock
              </h2>
              <button className="btn-ghost p-1" onClick={() => { setShowReceiveModal(false); resetReceiveForm(); }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleStockIn} className="p-4 space-y-4">
              <div>
                <label className="label">Product</label>
                <select
                  className="input w-full"
                  value={receiveForm.product_id}
                  onChange={(e) => setReceiveForm((f) => ({ ...f, product_id: e.target.value }))}
                  required
                >
                  <option value="">Select product</option>
                  {productList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.product_name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Quantity *</label>
                <input
                  className="input w-full"
                  type="number"
                  min="1"
                  placeholder="Enter quantity"
                  value={receiveForm.quantity}
                  onChange={(e) => setReceiveForm((f) => ({ ...f, quantity: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="label">Reason *</label>
                <input
                  className="input w-full"
                  placeholder="e.g. New shipment"
                  value={receiveForm.reason}
                  onChange={(e) => setReceiveForm((f) => ({ ...f, reason: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="label">Employee</label>
                <input
                  className="input w-full"
                  placeholder="Employee name"
                  value={receiveForm.employee}
                  onChange={(e) => setReceiveForm((f) => ({ ...f, employee: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn-secondary" onClick={() => { setShowReceiveModal(false); resetReceiveForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-success flex items-center gap-2" disabled={stockInMutation.isPending}>
                  <ArrowDown className="w-4 h-4" />
                  {stockInMutation.isPending ? 'Processing...' : 'Receive Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRemoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setShowRemoveModal(false); resetRemoveForm(); }}>
          <div className="card w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Minus className="w-5 h-5 text-red-600" /> Remove Stock
              </h2>
              <button className="btn-ghost p-1" onClick={() => { setShowRemoveModal(false); resetRemoveForm(); }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleStockOut} className="p-4 space-y-4">
              <div>
                <label className="label">Product</label>
                <select
                  className="input w-full"
                  value={removeForm.product_id}
                  onChange={(e) => setRemoveForm((f) => ({ ...f, product_id: e.target.value }))}
                  required
                >
                  <option value="">Select product</option>
                  {productList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.product_name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Quantity *</label>
                <input
                  className="input w-full"
                  type="number"
                  min="1"
                  placeholder="Enter quantity"
                  value={removeForm.quantity}
                  onChange={(e) => setRemoveForm((f) => ({ ...f, quantity: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="label">Reason *</label>
                <input
                  className="input w-full"
                  placeholder="e.g. Damaged, Transfer"
                  value={removeForm.reason}
                  onChange={(e) => setRemoveForm((f) => ({ ...f, reason: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="label">Employee</label>
                <input
                  className="input w-full"
                  placeholder="Employee name"
                  value={removeForm.employee}
                  onChange={(e) => setRemoveForm((f) => ({ ...f, employee: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn-secondary" onClick={() => { setShowRemoveModal(false); resetRemoveForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-danger flex items-center gap-2" disabled={stockOutMutation.isPending}>
                  <ArrowUp className="w-4 h-4" />
                  {stockOutMutation.isPending ? 'Processing...' : 'Remove Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setShowAdjustModal(false); resetAdjustForm(); }}>
          <div className="card w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-blue-600" /> Adjust Stock
              </h2>
              <button className="btn-ghost p-1" onClick={() => { setShowAdjustModal(false); resetAdjustForm(); }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdjust} className="p-4 space-y-4">
              <div>
                <label className="label">Product</label>
                <select
                  className="input w-full"
                  value={adjustForm.product_id}
                  onChange={(e) => setAdjustForm((f) => ({ ...f, product_id: e.target.value }))}
                  required
                >
                  <option value="">Select product</option>
                  {productList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.product_name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">New Quantity *</label>
                <input
                  className="input w-full"
                  type="number"
                  min="0"
                  placeholder="Enter new quantity"
                  value={adjustForm.new_quantity}
                  onChange={(e) => setAdjustForm((f) => ({ ...f, new_quantity: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="label">Reason *</label>
                <input
                  className="input w-full"
                  placeholder="e.g. Inventory count"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm((f) => ({ ...f, reason: e.target.value }))}
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn-secondary" onClick={() => { setShowAdjustModal(false); resetAdjustForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex items-center gap-2" disabled={adjustMutation.isPending}>
                  <RotateCcw className="w-4 h-4" />
                  {adjustMutation.isPending ? 'Processing...' : 'Adjust Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHistoryPanel && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowHistoryPanel(false)} />
          <div className="relative w-full max-w-md bg-white shadow-xl h-full overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-600" />
                Movement History
              </h2>
              <button className="btn-ghost p-1" onClick={() => setShowHistoryPanel(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            {selectedProduct && (
              <div className="px-4 py-3 bg-gray-50 border-b">
                <p className="font-medium text-gray-900">{selectedProduct.product_name}</p>
                <p className="text-sm text-gray-500">{selectedProduct.sku}</p>
              </div>
            )}
            <div className="p-4">
              {historyLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 animate-pulse rounded" />
                  ))}
                </div>
              ) : !history || (Array.isArray(history) && history.length === 0) ? (
                <div className="text-center py-10">
                  <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No movement history found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((m, i) => (
                    <div key={m.id || i} className="card p-3">
                      <div className="flex items-center justify-between mb-2">
                        <MovementBadge type={m.movement_type} />
                        <span className="text-xs text-gray-400">
                          {m.created_at ? new Date(m.created_at).toLocaleString() : '--'}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        Quantity: <span className="font-bold">{m.quantity}</span>
                      </p>
                      {m.reason && <p className="text-sm text-gray-500">Reason: {m.reason}</p>}
                      {m.employee && <p className="text-sm text-gray-500">By: {m.employee}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
