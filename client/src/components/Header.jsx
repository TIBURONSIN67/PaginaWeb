import { useLocation } from 'react-router-dom';
import { Bell, Search, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useInventoryAlerts } from '../hooks/useInventory';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/messages': 'WhatsApp Messages',
  '/products': 'Products',
  '/orders': 'Orders',
  '/inventory': 'Inventory',
  '/customers': 'Customers',
  '/settings': 'Settings',
};

export default function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const title = pageTitles[location.pathname] || 'Dashboard';
  const { data: alerts } = useInventoryAlerts();

  const alertCount = (alerts?.data?.low_stock_count || 0) + (alerts?.data?.out_of_stock_count || 0);

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-gray-50"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder:text-gray-400 w-48"
          />
        </div>

        <button className="relative p-2 rounded-xl hover:bg-gray-50 transition-colors">
          <Bell className="w-5 h-5 text-gray-500" />
          {alertCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>

        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
          <span className="text-xs font-semibold text-white">AD</span>
        </div>
      </div>
    </header>
  );
}
