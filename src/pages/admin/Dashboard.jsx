import { useTranslation } from 'react-i18next';
import { ShoppingCart, Users, CalendarDays, TrendingUp } from 'lucide-react';
import { Card, EmptyState, PageHeader } from '../../components/ui';

export default function Dashboard() {
  const { t } = useTranslation('admin');

  const stats = [
    { label: t('dashboard.todayOrders'),  value: '0',       icon: ShoppingCart, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { label: t('dashboard.customers'),    value: '0',        icon: Users,        color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: t('dashboard.reservations'), value: '0',        icon: CalendarDays, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: t('dashboard.revenue'),      value: '0 TND',   icon: TrendingUp,   color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-900/20' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t('dashboard.title')} />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
          </Card>
        ))}
      </div>

      {/* Recent orders */}
      <Card padding={false}>
        <div className="px-5 py-4 border-b border-gray-200 dark:border-white/10">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('dashboard.recentOrders')}</h2>
        </div>
        <EmptyState
          icon={ShoppingCart}
          title={t('dashboard.noOrders')}
        />
      </Card>
    </div>
  );
}
