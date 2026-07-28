import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquare, Package, ClipboardList,
  Warehouse, Users, Settings, Smartphone, Zap
} from 'lucide-react';
import { useUnreadCount } from '../hooks/useMessages';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/messages', icon: MessageSquare, label: 'Messages', badge: true },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/orders', icon: ClipboardList, label: 'Orders' },
  { to: '/inventory', icon: Warehouse, label: 'Inventory' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const location = useLocation();
  const { data: unread } = useUnreadCount();

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col">
      <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-50">
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
          <Smartphone className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-gray-900">Mobile Parts Store</h1>
          <p className="text-[10px] text-gray-400 flex items-center gap-1">
            <Zap className="w-2.5 h-2.5" /> AI Powered
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, badge }) => {
          const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{label}</span>
              {badge && unread?.data?.unread_conversations > 0 && (
                <span className="ml-auto w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unread.data.unread_conversations}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-50">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-xs font-semibold text-primary-700">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">Alex</p>
            <p className="text-[10px] text-emerald-600">AI Assistant Online</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
