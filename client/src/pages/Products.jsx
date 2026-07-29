import { useState } from 'react';
import { productsApi } from '../lib/api';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '../hooks/useProducts';
import toast from 'react-hot-toast';
import { Plus, Search, Edit, Trash2, Copy, Download, Upload, Filter, ChevronLeft, ChevronRight, X, Package } from 'lucide-react';

const CATEGORIES = [
  'Display', 'Battery', 'Charging Port', 'Flex Cable', 'Housing',
  'Camera', 'IC', 'Connector', 'Speaker', 'Microphone', 'Frame',
  'Back Cover', 'Accessory', 'Tool',
];

const ITEMS_PER_PAGE = 10;

const INITIAL_FORM = {
  sku: '',
  product_name: '',
  brand: '',
  model: '',
  category: '',
  description: '',
  purchase_price: '',
  sale_price: '',
  stock: '',
  minimum_stock: '',
  barcode: '',
  supplier: '',
  compatible_models: '',
};

export default function Products() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const queryParams = { page, limit: ITEMS_PER_PAGE };
  if (search) queryParams.search = search;
  if (categoryFilter) queryParams.category = categoryFilter;
  if (brandFilter) queryParams.brand = brandFilter;
  if (supplierFilter) queryParams.supplier = supplierFilter;

  const { data: productsRes, isLoading } = useProducts(queryParams);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const pagination = productsRes?.data?.pagination || productsRes?.pagination || {};
  const products = productsRes?.data?.items || (Array.isArray(productsRes?.data) ? productsRes.data : (Array.isArray(productsRes) ? productsRes : []));
  const totalPages = pagination.pages || 1;
  const total = pagination.total || products.length;

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setForm(INITIAL_FORM);
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setForm({
      sku: product.sku || '',
      product_name: product.product_name || '',
      brand: product.brand || '',
      model: product.model || '',
      category: product.category || '',
      description: product.description || '',
      purchase_price: product.purchase_price ?? '',
      sale_price: product.sale_price ?? '',
      stock: product.stock ?? '',
      minimum_stock: product.minimum_stock ?? '',
      barcode: product.barcode || '',
      supplier: product.supplier || '',
      compatible_models: product.compatible_models || '',
    });
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    const payload = {
      sku: form.sku,
      product_name: form.product_name,
      brand: form.brand,
      model: form.model,
      category: form.category,
      description: form.description,
      purchase_price: Number(form.purchase_price) || 0,
      sale_price: Number(form.sale_price) || 0,
      stock: Number(form.stock) || 0,
      minimum_stock: Number(form.minimum_stock) || 0,
      barcode: form.barcode,
      supplier: form.supplier,
    };

    if (editingProduct) {
      const id = editingProduct.id;
      updateProduct.mutate({ id, data: payload }, {
        onSuccess: () => setModalOpen(false),
      });
    } else {
      createProduct.mutate(payload, {
        onSuccess: () => setModalOpen(false),
      });
    }
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    const id = deleteConfirm.id;
    deleteProduct.mutate(id, {
      onSuccess: () => setDeleteConfirm(null),
    });
  };

  const handleDuplicate = (product) => {
    const payload = {
      sku: (product.sku || '') + '-COPY',
      product_name: (product.product_name || '') + ' (Copy)',
      brand: product.brand || '',
      model: product.model || '',
      category: product.category || '',
      description: product.description || '',
      purchase_price: product.purchase_price || 0,
      sale_price: product.sale_price || 0,
      stock: product.stock || 0,
      minimum_stock: product.minimum_stock || 0,
      barcode: product.barcode || '',
      supplier: product.supplier || '',
    };
    createProduct.mutate(payload);
  };

  const handleImportCSV = () => {
    toast('Import CSV \u2013 feature coming soon', { icon: '\uD83D\uDCC1' });
  };

  const handleExportCSV = () => {
    toast('Export CSV \u2013 feature coming soon', { icon: '\uD83D\uDCE4' });
  };

  const getStockBadge = (stock, minStock) => {
    if (stock <= 0) return <span className="badge-danger">Out of Stock</span>;
    if (stock <= minStock) return <span className="badge-warning">Low Stock</span>;
    return <span className="badge-success">In Stock</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleImportCSV} className="btn-ghost text-sm">
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button onClick={handleExportCSV} className="btn-ghost text-sm">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button onClick={openAddModal} className="btn-primary text-sm">
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
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

      {showFilter && (
        <div className="card p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="input"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Brand</label>
            <input
              type="text"
              placeholder="Filter by brand"
              value={brandFilter}
              onChange={(e) => { setBrandFilter(e.target.value); setPage(1); }}
              className="input"
            />
          </div>
          <div>
            <label className="label">Supplier</label>
            <input
              type="text"
              placeholder="Filter by supplier"
              value={supplierFilter}
              onChange={(e) => { setSupplierFilter(e.target.value); setPage(1); }}
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
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3 w-14">Image</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">SKU</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Product Name</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Brand</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Model</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Category</th>
                <th className="text-right text-xs font-medium text-gray-500 px-5 py-3">Price</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Stock</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Supplier</th>
                <th className="text-right text-xs font-medium text-gray-500 px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center text-sm text-gray-400 py-16">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const id = product.id;
                  return (
                    <tr key={id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                          {product.image_url ? (
                            <img src={product.image_url} alt="" className="w-10 h-10 object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {product.sku}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-700">
                        {product.product_name}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {product.brand || '\u2014'}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {product.model || '\u2014'}
                      </td>
                      <td className="px-5 py-3">
                        <span className="badge-gray">{product.category || '\u2014'}</span>
                      </td>
                      <td className="px-5 py-3 text-sm font-medium text-gray-900 text-right whitespace-nowrap">
                        ${(product.sale_price || 0).toFixed(2)}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{product.stock ?? 0}</span>
                          {getStockBadge(product.stock || 0, product.minimum_stock || 0)}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {product.supplier || '\u2014'}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(product)}
                            className="btn-ghost p-2 text-sm"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(product)}
                            className="btn-ghost p-2 text-sm text-red-600 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(product)}
                            className="btn-ghost p-2 text-sm"
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages} ({total} products)
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="btn-ghost p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">SKU</label>
                <input name="sku" value={form.sku} onChange={handleFormChange} className="input" />
              </div>
              <div>
                <label className="label">Product Name</label>
                <input name="product_name" value={form.product_name} onChange={handleFormChange} className="input" />
              </div>
              <div>
                <label className="label">Brand</label>
                <input name="brand" value={form.brand} onChange={handleFormChange} className="input" />
              </div>
              <div>
                <label className="label">Model</label>
                <input name="model" value={form.model} onChange={handleFormChange} className="input" />
              </div>
              <div>
                <label className="label">Category</label>
                <select name="category" value={form.category} onChange={handleFormChange} className="input">
                  <option value="">Select category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Supplier</label>
                <input name="supplier" value={form.supplier} onChange={handleFormChange} className="input" />
              </div>
              <div>
                <label className="label">Purchase Price</label>
                <input name="purchase_price" type="number" step="0.01" value={form.purchase_price} onChange={handleFormChange} className="input" />
              </div>
              <div>
                <label className="label">Sale Price</label>
                <input name="sale_price" type="number" step="0.01" value={form.sale_price} onChange={handleFormChange} className="input" />
              </div>
              <div>
                <label className="label">Stock</label>
                <input name="stock" type="number" value={form.stock} onChange={handleFormChange} className="input" />
              </div>
              <div>
                <label className="label">Minimum Stock</label>
                <input name="minimum_stock" type="number" value={form.minimum_stock} onChange={handleFormChange} className="input" />
              </div>
              <div>
                <label className="label">Barcode</label>
                <input name="barcode" value={form.barcode} onChange={handleFormChange} className="input" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Description</label>
                <textarea name="description" value={form.description} onChange={handleFormChange} rows={3} className="input" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Compatible Models <span className="text-gray-400 font-normal">(comma separated)</span></label>
                <input
                  name="compatible_models"
                  value={form.compatible_models}
                  onChange={handleFormChange}
                  placeholder="iPhone 12, Galaxy S21, Pixel 6"
                  className="input"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setModalOpen(false)} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={createProduct.isPending || updateProduct.isPending}
                className="btn-primary"
              >
                {editingProduct ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Product</h2>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.product_name}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteProduct.isPending}
                className="btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
