import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search, Calendar, ShoppingBag, Activity, Star, Award,
  CreditCard, Utensils, BarChart2, Users, Package, User,
  Smartphone, Zap, MessageCircle, TrendingUp,
  Check, Sparkles, ArrowRight, Globe,
} from 'lucide-react';

const DINER_FEATURES = [
  { key: 'discover', icon: Search,      bg: 'bg-blue-50   dark:bg-blue-950/40',    ic: 'text-blue-500'    },
  { key: 'reserve',  icon: Calendar,    bg: 'bg-orange-50 dark:bg-orange-950/40',  ic: 'text-orange-500'  },
  { key: 'order',    icon: ShoppingBag, bg: 'bg-violet-50 dark:bg-violet-950/40',  ic: 'text-violet-500'  },
  { key: 'track',    icon: Activity,    bg: 'bg-emerald-50 dark:bg-emerald-950/40',ic: 'text-emerald-500' },
  { key: 'review',   icon: Star,        bg: 'bg-amber-50  dark:bg-amber-950/40',   ic: 'text-amber-500'   },
  { key: 'loyalty',  icon: Award,       bg: 'bg-rose-50   dark:bg-rose-950/40',    ic: 'text-rose-500'    },
];

const OWNER_FEATURES = [
  { key: 'pos',          icon: CreditCard     },
  { key: 'kitchen',      icon: Utensils       },
  { key: 'reservations', icon: Calendar       },
  { key: 'analytics',    icon: BarChart2      },
  { key: 'crm',          icon: Users          },
  { key: 'inventory',    icon: Package        },
  { key: 'staff',        icon: User           },
  { key: 'loyalty',      icon: Award          },
  { key: 'menu',         icon: Smartphone     },
  { key: 'copilot',      icon: Zap            },
  { key: 'campaigns',    icon: MessageCircle  },
  { key: 'pricing',      icon: TrendingUp     },
];

const PLANS = ['starter', 'pro', 'enterprise'];

export default function Services() {
  const { t } = useTranslation('public');

  return (
    <div>

      {/* ══════ HERO ══════ */}
      <section className="relative min-h-[62vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[#0b0500]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0800]/80 via-transparent to-orange-950/60" />
        <div className="absolute top-20 start-[18%] w-80 h-80 bg-orange-600/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-10 end-[14%] w-64 h-64 bg-amber-500/15 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1.3s' }} />
        <div className="absolute inset-0 opacity-[0.04]"
             style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '36px 36px' }} />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/25 text-orange-400 rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold mb-8 backdrop-blur-sm">
            <Sparkles size={13} />
            {t('services.hero.badge')}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-black text-white leading-[1.05] tracking-tight mb-6">
            {t('services.hero.title')}
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
            {t('services.hero.subtitle')}
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-10">
            <Link to="/register"
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 shadow-lg shadow-orange-500/30 flex items-center gap-2">
              {t('services.cta.btn')} <ArrowRight size={15} />
            </Link>
            <Link to="/restaurants"
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 backdrop-blur-sm">
              {t('home.cta.exploreBtn')}
            </Link>
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-gray-50 dark:from-gray-950 to-transparent" />
      </section>

      {/* ══════ FOR DINERS ══════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <SectionHeader
          label={t('services.forDiners.label')}
          title={t('services.forDiners.title')}
          subtitle={t('services.forDiners.subtitle')}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-14">
          {DINER_FEATURES.map((f) => (
            <div key={f.key}
              className="group p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 hover:border-orange-200 dark:hover:border-orange-900/40 shadow-sm hover:shadow-2xl dark:hover:shadow-black/40 transition-all duration-300 hover:-translate-y-1">
              <div className={`w-14 h-14 ${f.bg} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <f.icon size={24} className={f.ic} />
              </div>
              <h3 className="font-black text-gray-900 dark:text-white text-lg mb-2">{t(`services.forDiners.items.${f.key}.title`)}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{t(`services.forDiners.items.${f.key}.desc`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════ FOR OWNERS ══════ */}
      <section className="py-24 bg-gray-950 relative overflow-hidden">
        <div className="absolute top-0 start-0 end-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute inset-0 opacity-[0.03]"
             style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute top-10 end-10 w-96 h-96 bg-orange-600/10 rounded-full blur-[120px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 text-orange-400 font-semibold text-xs sm:text-sm uppercase tracking-widest mb-3">
              <Sparkles size={12} /> {t('services.forOwners.label')}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-white leading-tight tracking-tight">
              {t('services.forOwners.title')}
            </h2>
            <p className="text-gray-400 mt-4 max-w-xl mx-auto text-[15px] leading-relaxed">
              {t('services.forOwners.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {OWNER_FEATURES.map((f) => (
              <div key={f.key}
                className="group p-6 rounded-2xl bg-white/5 border border-white/8 hover:bg-white/10 hover:border-orange-500/30 transition-all duration-300 cursor-default">
                <div className="w-11 h-11 rounded-xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <f.icon size={20} className="text-orange-400" />
                </div>
                <h3 className="font-bold text-white text-sm mb-1.5">{t(`services.forOwners.items.${f.key}.title`)}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{t(`services.forOwners.items.${f.key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ PRICING ══════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <SectionHeader
          label={t('services.pricing.label')}
          title={t('services.pricing.title')}
          subtitle={t('services.pricing.subtitle')}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-14 items-stretch">
          {PLANS.map((plan) => (
            <PricingCard key={plan} plan={plan} t={t} />
          ))}
        </div>
      </section>

      {/* ══════ CTA ══════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 p-12 sm:p-16 text-center shadow-2xl shadow-orange-500/20">
          <div className="absolute inset-0 opacity-[0.08]"
               style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <div className="relative">
            <Globe size={36} className="text-white/30 mx-auto mb-5" />
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">{t('services.cta.title')}</h2>
            <p className="text-orange-100 mb-8 max-w-lg mx-auto text-[15px]">{t('services.cta.subtitle')}</p>
            <Link to="/register"
              className="inline-flex items-center gap-2 bg-white text-orange-600 hover:bg-orange-50 px-10 py-4 rounded-2xl font-black text-sm transition-all duration-200 shadow-xl hover:-translate-y-0.5">
              {t('services.cta.btn')} <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ── Pricing card ── */
function PricingCard({ plan, t }) {
  const isPro = plan === 'pro';
  const features = t(`services.pricing.plans.${plan}.features`, { returnObjects: true }) || [];

  return (
    <div className={[
      'relative flex flex-col rounded-3xl p-8 transition-all duration-300',
      isPro
        ? 'bg-gradient-to-b from-orange-500 to-amber-600 shadow-2xl shadow-orange-500/30 scale-[1.02]'
        : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 hover:shadow-xl dark:hover:shadow-black/30 hover:-translate-y-1',
    ].join(' ')}>

      {isPro && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="bg-white text-orange-600 text-xs font-black px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
            {t('services.pricing.popular')}
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className={`text-lg font-black mb-1 ${isPro ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
          {t(`services.pricing.plans.${plan}.name`)}
        </h3>
        <p className={`text-xs leading-relaxed mb-4 ${isPro ? 'text-orange-100' : 'text-gray-500 dark:text-gray-400'}`}>
          {t(`services.pricing.plans.${plan}.desc`)}
        </p>
        <div className="flex items-end gap-1">
          <span className={`text-4xl font-black leading-none ${isPro ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
            {t(`services.pricing.plans.${plan}.price`)}
          </span>
          <span className={`text-sm mb-1 ${isPro ? 'text-orange-200' : 'text-gray-400'}`}>
            {t(`services.pricing.plans.${plan}.period`)}
          </span>
        </div>
      </div>

      <ul className="space-y-3 flex-1 mb-8">
        {Array.isArray(features) && features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isPro ? 'bg-white/20' : 'bg-orange-50 dark:bg-orange-950/40'}`}>
              <Check size={11} className={isPro ? 'text-white' : 'text-orange-500'} />
            </div>
            <span className={`text-sm leading-snug ${isPro ? 'text-white/90' : 'text-gray-600 dark:text-gray-300'}`}>{f}</span>
          </li>
        ))}
      </ul>

      <Link
        to="/register"
        className={[
          'w-full py-3.5 rounded-2xl font-bold text-sm text-center transition-all duration-200',
          isPro
            ? 'bg-white text-orange-600 hover:bg-orange-50 shadow-lg'
            : plan === 'enterprise'
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
              : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20',
        ].join(' ')}
      >
        {t(`services.pricing.plans.${plan}.cta`)}
      </Link>
    </div>
  );
}

/* ── Section header ── */
function SectionHeader({ label, title, subtitle }) {
  return (
    <div className="text-center">
      <span className="inline-flex items-center gap-1.5 text-orange-500 font-semibold text-xs sm:text-sm uppercase tracking-widest mb-3">
        <Sparkles size={12} /> {label}
      </span>
      <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-gray-900 dark:text-white leading-tight tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-gray-500 dark:text-gray-400 mt-4 max-w-xl mx-auto text-[15px] leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}
