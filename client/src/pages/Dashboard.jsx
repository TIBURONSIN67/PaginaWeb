import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, Package, ShoppingCart, MessageSquare, Clock,
} from 'lucide-react';
import StatsCards from '../components/StatsCards';
import api, { ordersApi, messagesApi, customersApi, productsApi, inventoryApi } from '../lib/api';

const statusBadge = {
  Pending: 'badge bg-gray-100 text-gray-700',
  Confirmed: 'badge bg-blue-100 text-blue-700',
  Preparing: 'badge bg-amber-100 text-amber-700',
  Shipped: 'badge bg-purple-100 text-purple-700',
  Completed: 'badge bg-emerald-100 text-emerald-700',
  Cancelled: 'badge bg-red-100 text-red-700',
};

export default function Dashboard() {
  const { data: todayStats } = useQuery({
    queryKey: ['today-stats'],
    queryFn: ordersApi.getTodayStats,
  });

  const { data: productsRes } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: () => productsApi.getAll(),
  });

  const { data: alertsRes } = useQuery({
    queryKey: ['inventory-alerts'],
    queryFn: inventoryApi.getAlerts,
    refetchInterval: 60000,
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: () => ordersApi.getRecent(10),
  });

  const { data: customersRes } = useQuery({
    queryKey: ['customers', 'all'],
    queryFn: () => customersApi.getAll(),
  });

  const { data: unreadCountRes } = useQuery({
    queryKey: ['unread-count'],
    queryFn: messagesApi.getUnreadCount,
    refetchInterval: 10000,
  });

  const { data: recentMessages } = useQuery({
    queryKey: ['recent-messages'],
    queryFn: () => messagesApi.getAll({ limit: 5 }),
    refetchInterval: 5000,
  });

  const products = productsRes?.data || productsRes || [];
  const customers = customersRes?.data || customersRes || [];
  const alerts = alertsRes?.data || alertsRes || {};
  const unreadCount = unreadCountRes?.data || unreadCountRes || {};

  const stats = {
    totalProducts: Array.isArray(products) ? products.length : (products.total || 0),
    lowStock: (alerts.low_stock_count || 0) + (alerts.out_of_stock_count || 0),
    todayOrders: todayStats?.data?.todayOrders || todayStats?.todayOrders || 0,
    todayRevenue: todayStats?.data?.todayRevenue || todayStats?.todayRevenue || 0,
    customers: Array.isArray(customers) ? customers.length : (customers.total || 0),
    unreadMessages: unreadCount?.unread_conversations || unreadCount?.count || 0,
  };

  const alertProducts = alerts.products || [];
  const lowStockItems = alertProducts.filter((a) => (a.stock || a.quantity) > 0);
  const outOfStockItems = alertProducts.filter((a) => (a.stock || a.quantity) === 0);

  const orders = recentOrders?.data || recentOrders || [];
  const messages = recentMessages?.data || recentMessages || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of your store performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/products" className="btn-secondary text-sm">
            <Package className="w-4 h-4" />
            Products
          </Link>
          <Link to="/orders/new" className="btn-primary text-sm">
            <ShoppingCart className="w-4 h-4" />
            New Order
          </Link>
        </div>
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center justify-between p-5 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary-600" />
                <h2 className="text-base font-semibold text-gray-900">Recent Orders</h2>
              </div>
              <Link to="/orders" className="btn-ghost text-sm">
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Order#</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Customer</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Status</th>
                    <th className="text-right text-xs font-medium text-gray-500 px-5 py-3">Total</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Date</th>
                    <th className="text-right text-xs font-medium text-gray-500 px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-sm text-gray-400 py-10">
                        No orders yet
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => {
                      const orderId = order._id || order.id || '';
                      return (
                        <tr
                          key={orderId}
                          className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="px-5 py-3 text-sm font-medium text-gray-900">
                            #{order.orderNumber || orderId.toString().slice(-6).toUpperCase()}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-600">
                            {order.customer?.name || order.customerName || order.customer || 'Walk-in'}
                          </td>
                          <td className="px-5 py-3">
                            <span className={statusBadge[order.status] || 'badge bg-gray-100 text-gray-600'}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-sm font-medium text-gray-900 text-right">
                            ${(order.total || 0).toFixed(2)}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-500">
                            {new Date(order.createdAt || order.date).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Link
                              to={`/orders/${orderId}`}
                              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between p-5 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h2 className="text-base font-semibold text-gray-900">Inventory Alerts</h2>
              </div>
              <Link to="/inventory" className="btn-ghost text-sm">
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="p-5">
              {alertProducts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No inventory alerts</p>
              ) : (
                <div className="space-y-3">
                  {outOfStockItems.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-red-600 mb-2">
                        Out of Stock ({outOfStockItems.length})
                      </p>
                      {outOfStockItems.map((item) => (
                        <div
                          key={item._id || item.product?._id}
                          className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                        >
                          <div className="min-w-0 flex-1 mr-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.product?.name || item.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {item.product?.sku || item.sku || ''}
                            </p>
                          </div>
                          <span className="badge bg-red-50 text-red-700 flex-shrink-0">
                            Out of Stock
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {lowStockItems.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-amber-600 mb-2">
                        Low Stock ({lowStockItems.length})
                      </p>
                      {lowStockItems.map((item) => (
                        <div
                          key={item._id || item.product?._id}
                          className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                        >
                          <div className="min-w-0 flex-1 mr-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.product?.name || item.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              Stock: {item.stock || item.quantity} / Min: {item.minStock || item.min}
                            </p>
                          </div>
                          <span className="badge bg-amber-50 text-amber-700 flex-shrink-0">
                            Low Stock
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between p-5 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary-600" />
                <h2 className="text-base font-semibold text-gray-900">Recent Messages</h2>
              </div>
              <Link to="/messages" className="btn-ghost text-sm">
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="p-5">
              {messages.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No messages yet</p>
              ) : (
                <div className="space-y-1">
                  {messages.map((msg) => (
                    <Link
                      key={msg._id || msg.id}
                      to={`/messages?phone=${msg.from || msg.phone || msg.sender}`}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-4 h-4 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {msg.from || msg.phone || msg.sender || 'Unknown'}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0 ml-2">
                            <Clock className="w-3 h-3" />
                            <span>
                              {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 truncate mt-0.5">
                          {msg.body || msg.text || msg.message || 'No content'}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
