import { Package, ShoppingCart, DollarSign, Users, MessageSquare, AlertTriangle } from 'lucide-react';

export default function StatsCards({ stats }) {
  const cards = [
    {
      label: 'Total Products',
      value: stats?.totalProducts || 0,
      icon: Package,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Low Stock',
      value: stats?.lowStock || 0,
      icon: AlertTriangle,
      color: 'bg-amber-50 text-amber-600',
      valueClass: stats?.lowStock > 0 ? 'text-amber-600' : '',
    },
    {
      label: "Today's Orders",
      value: stats?.todayOrders || 0,
      icon: ShoppingCart,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: "Today's Revenue",
      value: `$${(stats?.todayRevenue || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Customers',
      value: stats?.customers || 0,
      icon: Users,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      label: 'Unread',
      value: stats?.unreadMessages || 0,
      icon: MessageSquare,
      color: 'bg-red-50 text-red-600',
      valueClass: stats?.unreadMessages > 0 ? 'text-red-600' : '',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="card p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500">{card.label}</span>
            <div className={`w-8 h-8 rounded-lg ${card.color} flex items-center justify-center`}>
              <card.icon className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-bold text-gray-900 ${card.valueClass || ''}`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
