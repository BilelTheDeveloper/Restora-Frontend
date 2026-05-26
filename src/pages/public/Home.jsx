import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search, MapPin, Star, ArrowRight, ChevronRight,
  Utensils, Clock, Shield, Award, Users, Globe,
  CheckCircle, Quote, Smartphone, TrendingUp, Heart,
  Zap, Sparkles, UtensilsCrossed,
} from 'lucide-react';
import { restaurantService } from '../../services/restaurantService';

/* ─── animated counter ─── */
function useCountUp(end, duration = 2200, active = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let t0 = null;
    const step = (ts) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      setVal(Math.floor(p * end));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, active]);
  return val;
}

/* ─── intersection observer ─── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setSeen(true); },
      { threshold },
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen];
}

const TAGS = ['Pizza', 'Sushi', 'Couscous', 'Burger', 'Pasta', 'Tajine'];

const STEPS = [
  { icon: Search,       key: 'search' },
  { icon: Utensils,     key: 'choose' },
  { icon: CheckCircle,  key: 'enjoy'  },
];

const FEATURES = [
  { icon: Shield,      key: 'verified', color: 'text-blue-500',    bg: 'bg-blue-50   dark:bg-blue-950/40'    },
  { icon: Clock,       key: 'realtime', color: 'text-orange-500',  bg: 'bg-orange-50 dark:bg-orange-950/40'  },
  { icon: Award,       key: 'quality',  color: 'text-amber-500',   bg: 'bg-amber-50  dark:bg-amber-950/40'   },
  { icon: Smartphone,  key: 'digital',  color: 'text-violet-500',  bg: 'bg-violet-50 dark:bg-violet-950/40'  },
  { icon: TrendingUp,  key: 'growth',   color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40'},
  { icon: Heart,       key: 'love',     color: 'text-rose-500',    bg: 'bg-rose-50   dark:bg-rose-950/40'    },
];

const TESTIMONIALS = [
  { key: '1', initials: 'SM', gradient: 'from-orange-400 to-rose-500'    },
  { key: '2', initials: 'AK', gradient: 'from-blue-400  to-violet-500'   },
  { key: '3', initials: 'ML', gradient: 'from-emerald-400 to-teal-500'   },
];

export default function Home() {
  const { t, i18n } = useTranslation('public');
  const isRTL = i18n.dir() === 'rtl';

  const [search, setSearch] = useState('');
  const [city,   setCity]   = useState('');
  const [statsRef, statsInView] = useInView(0.25);

  /* top-3 restaurants */
  const { data: topData, isLoading: topLoading } = useQuery({
    queryKey: ['home-top-restaurants'],
    queryFn: () => restaurantService.getAll({ sort: '-rating', limit: 3 }),
  });
  const topRestaurants = (topData?.data || []).slice(0, 3);

  /* search restaurants (only when user types) */
  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ['home-search', search, city],
    queryFn: () => restaurantService.getAll({ search, city }),
    enabled: !!(search || city),
  });
  const searchResults = searchData?.data || [];

  const isSearching = !!(search || city);

  /* animated stats */
  const countRestaurants = useCountUp(500,  2200, statsInView);
  const countCities      = useCountUp(25,   2000, statsInView);
  const countCustomers   = useCountUp(50000, 2400, statsInView);

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="overflow-x-hidden">

      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden">

        {/* dark cinematic backdrop */}
        <div className="absolute inset-0 bg-[#0b0500]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0800]/80 via-transparent to-orange-950/60" />

        {/* floating orbs */}
        <div className="absolute top-24 start-[15%] w-[480px] h-[480px] bg-orange-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-16 end-[10%]  w-[360px] h-[360px] bg-amber-500/15  rounded-full blur-[100px] animate-pulse"
             style={{ animationDelay: '1.4s' }} />
        <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-orange-800/10 rounded-full blur-[140px]" />

        {/* dot grid */}
        <div className="absolute inset-0 opacity-[0.04]"
             style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '36px 36px' }} />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-28 text-center w-full">

          {/* badge */}
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/25 text-orange-400 rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold mb-8 backdrop-blur-sm">
            <Zap size={13} className="fill-orange-400 text-orange-400" />
            {t('home.hero.badge')}
          </div>

          {/* headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-[80px] font-black text-white leading-[1.04] tracking-tight mb-6">
            {t('home.hero.titleLine1')}
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
              {t('home.hero.titleLine2')}
            </span>
          </h1>

          <p className="text-gray-300 text-lg sm:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            {t('home.hero.subtitle')}
          </p>

          {/* search bar */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/8 backdrop-blur-2xl border border-white/15 rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-2xl shadow-black/40">
              <div className="flex-1 flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl px-4 py-3.5">
                <Search size={17} className="text-orange-400 shrink-0" />
                <input
                  type="text"
                  placeholder={t('home.hero.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-gray-800 dark:text-gray-100 text-sm outline-none placeholder:text-gray-400"
                />
              </div>
              <div className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl px-4 py-3.5 sm:w-44">
                <MapPin size={17} className="text-orange-400 shrink-0" />
                <input
                  type="text"
                  placeholder={t('home.hero.cityPlaceholder')}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="flex-1 bg-transparent text-gray-800 dark:text-gray-100 text-sm outline-none placeholder:text-gray-400"
                />
              </div>
              <button
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-7 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 shadow-lg shadow-orange-500/35 whitespace-nowrap flex items-center justify-center gap-2"
              >
                {t('home.hero.searchBtn')}
                <ArrowRight size={15} />
              </button>
            </div>

            {/* popular tags */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearch(tag)}
                  className="text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/12 border border-white/10 hover:border-white/25 rounded-full px-3.5 py-1.5 transition-all duration-150"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* bottom gradient fade into page bg */}
        <div className="absolute bottom-0 inset-x-0 h-36 bg-gradient-to-t from-gray-50 dark:from-gray-950 to-transparent" />
      </section>

      {/* ══════════════════════════════════════════════════════
          SEARCH RESULTS (conditional)
      ══════════════════════════════════════════════════════ */}
      {isSearching && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            {t('home.searchResults')}
          </h2>
          {searchLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 animate-pulse">
                  <div className="h-44 bg-gray-200 dark:bg-gray-700" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-20">
              <UtensilsCrossed size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">{t('home.noResults')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {searchResults.map((r) => (
                <RestaurantCard key={r._id} r={r} t={t} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          TOP RATED (hidden during search)
      ══════════════════════════════════════════════════════ */}
      {!isSearching && (
        <>
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <SectionHeader
              label={t('home.topRated.label')}
              title={t('home.topRated.title')}
              subtitle={t('home.topRated.subtitle')}
            />

            {topLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-14">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-3xl overflow-hidden bg-gray-100 dark:bg-gray-800 animate-pulse">
                    <div className="h-60 bg-gray-200 dark:bg-gray-700" />
                    <div className="p-6 space-y-3">
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-2/3" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-1/2" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-14">
                {topRestaurants.map((r, i) => (
                  <TopRestaurantCard key={r._id} r={r} rank={i} t={t} />
                ))}
                {/* empty fallback cards */}
                {topRestaurants.length === 0 && (
                  [0, 1, 2].map((i) => <FallbackCard key={i} rank={i} t={t} />)
                )}
              </div>
            )}

            <div className="text-center mt-12">
              <Link
                to="/?browse=true"
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-9 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:gap-3"
              >
                {t('home.topRated.viewAll')}
                <ChevronRight size={16} />
              </Link>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════
              HOW IT WORKS
          ══════════════════════════════════════════════════════ */}
          <section className="relative py-24 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-500 to-amber-600" />
            <div className="absolute inset-0 opacity-[0.07]"
                 style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
            <div className="absolute top-0 start-0 end-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4 tracking-tight">
                  {t('home.howItWorks.title')}
                </h2>
                <p className="text-orange-100 text-lg max-w-xl mx-auto">
                  {t('home.howItWorks.subtitle')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
                {/* connector */}
                <div className="hidden md:block absolute top-11 start-[calc(33%+2.5rem)] end-[calc(33%+2.5rem)] h-0.5 bg-white/20 rounded-full" />

                {STEPS.map((step, i) => (
                  <div key={step.key} className="flex flex-col items-center text-center group">
                    <div className="relative w-[88px] h-[88px] rounded-3xl bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 group-hover:bg-white/20 transition-all duration-300">
                      <step.icon size={34} className="text-white" />
                      <span className="absolute -top-3 -end-3 w-8 h-8 bg-white text-orange-600 rounded-xl flex items-center justify-center text-sm font-black shadow-lg">
                        {i + 1}
                      </span>
                    </div>
                    <h3 className="text-white font-black text-xl mb-3">
                      {t(`home.howItWorks.steps.${step.key}.title`)}
                    </h3>
                    <p className="text-orange-100 text-sm leading-relaxed max-w-[220px]">
                      {t(`home.howItWorks.steps.${step.key}.desc`)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════
              FEATURES / SERVICES
          ══════════════════════════════════════════════════════ */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <SectionHeader
              label={t('home.features.label')}
              title={t('home.features.title')}
              subtitle={t('home.features.subtitle')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-14">
              {FEATURES.map((f) => (
                <div
                  key={f.key}
                  className="group p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 hover:border-orange-200 dark:hover:border-orange-900/40 shadow-sm hover:shadow-2xl dark:hover:shadow-black/40 transition-all duration-400 hover:-translate-y-1"
                >
                  <div className={`w-14 h-14 ${f.bg} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <f.icon size={24} className={f.color} />
                  </div>
                  <h3 className="font-black text-gray-900 dark:text-white text-lg mb-2 leading-snug">
                    {t(`home.features.items.${f.key}.title`)}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                    {t(`home.features.items.${f.key}.desc`)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════
              ABOUT / STATS
          ══════════════════════════════════════════════════════ */}
          <section ref={statsRef} className="py-24 bg-gray-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                {/* text */}
                <div>
                  <span className="inline-flex items-center gap-1.5 text-orange-500 font-semibold text-sm uppercase tracking-widest mb-4">
                    <Sparkles size={13} />
                    {t('home.about.label')}
                  </span>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-6">
                    {t('home.about.title')}
                  </h2>
                  <p className="text-gray-400 leading-relaxed mb-8 text-[15px]">
                    {t('home.about.desc')}
                  </p>

                  <ul className="space-y-4">
                    {['mission1', 'mission2', 'mission3'].map((m) => (
                      <li key={m} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle size={12} className="text-orange-400" />
                        </div>
                        <span className="text-gray-300 text-sm leading-relaxed">{t(`home.about.${m}`)}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-10 flex flex-wrap gap-4">
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 shadow-lg shadow-orange-500/25"
                    >
                      {t('home.about.cta')}
                      <ArrowRight size={15} />
                    </Link>
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 border border-white/15 hover:border-white/30 text-gray-300 hover:text-white px-8 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200"
                    >
                      {t('home.about.ctaSecondary')}
                    </Link>
                  </div>
                </div>

                {/* stats grid */}
                <div className="grid grid-cols-2 gap-5">
                  {[
                    {
                      value: countRestaurants, suffix: '+',
                      label: t('home.about.stats.restaurants'),
                      gradient: 'from-orange-500/15 to-amber-500/15',
                      border: 'border-orange-500/20', text: 'text-orange-400',
                    },
                    {
                      value: countCities, suffix: '',
                      label: t('home.about.stats.cities'),
                      gradient: 'from-blue-500/15 to-violet-500/15',
                      border: 'border-blue-500/20', text: 'text-blue-400',
                    },
                    {
                      value: countCustomers, suffix: '+',
                      label: t('home.about.stats.customers'),
                      gradient: 'from-emerald-500/15 to-teal-500/15',
                      border: 'border-emerald-500/20', text: 'text-emerald-400',
                    },
                    {
                      value: 4.9, suffix: '★', fixed: 1,
                      label: t('home.about.stats.rating'),
                      gradient: 'from-amber-500/15 to-yellow-500/15',
                      border: 'border-amber-500/20', text: 'text-amber-400',
                    },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className={`bg-gradient-to-br ${s.gradient} border ${s.border} rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-2`}
                    >
                      <div className={`text-4xl font-black ${s.text}`}>
                        {s.fixed ? s.value.toFixed(s.fixed) : s.value.toLocaleString()}{s.suffix}
                      </div>
                      <div className="text-gray-400 text-sm font-medium leading-tight">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════
              TESTIMONIALS
          ══════════════════════════════════════════════════════ */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <SectionHeader
              label={t('home.testimonials.label')}
              title={t('home.testimonials.title')}
              subtitle={t('home.testimonials.subtitle')}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">
              {TESTIMONIALS.map((item) => (
                <div
                  key={item.key}
                  className="relative p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-2xl dark:hover:shadow-black/40 transition-all duration-400 hover:-translate-y-1 group"
                >
                  {/* quote icon */}
                  <Quote size={36} className="text-orange-100 dark:text-orange-900/50 mb-5" />

                  {/* stars */}
                  <div className="flex gap-0.5 mb-5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={14} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>

                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-7 italic">
                    "{t(`home.testimonials.items.${item.key}.text`)}"
                  </p>

                  <div className="flex items-center gap-3 pt-5 border-t border-gray-100 dark:border-white/5">
                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                      {item.initials}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white text-sm">
                        {t(`home.testimonials.items.${item.key}.name`)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {t(`home.testimonials.items.${item.key}.role`)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════
              CTA BANNER
          ══════════════════════════════════════════════════════ */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 p-12 sm:p-16 text-center shadow-2xl shadow-orange-500/20">
              <div className="absolute inset-0 opacity-[0.08]"
                   style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

              <div className="relative">
                <span className="inline-flex items-center gap-2 bg-white/20 border border-white/30 text-white rounded-full px-4 py-1.5 text-xs font-semibold mb-6 backdrop-blur-sm">
                  <Globe size={12} />
                  {t('home.cta.badge')}
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-5 leading-tight">
                  {t('home.cta.title')}
                </h2>
                <p className="text-orange-100 mb-10 max-w-lg mx-auto text-[15px] leading-relaxed">
                  {t('home.cta.subtitle')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/register"
                    className="bg-white text-orange-600 hover:bg-orange-50 px-10 py-4 rounded-2xl font-black text-sm transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
                  >
                    {t('home.cta.restaurantBtn')}
                  </Link>
                  <Link
                    to="/"
                    className="bg-orange-600/30 hover:bg-orange-600/50 border border-white/25 text-white px-10 py-4 rounded-2xl font-bold text-sm transition-all duration-200 backdrop-blur-sm"
                  >
                    {t('home.cta.exploreBtn')}
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

/* ─── shared section header ─── */
function SectionHeader({ label, title, subtitle }) {
  return (
    <div className="text-center">
      <span className="inline-flex items-center gap-1.5 text-orange-500 font-semibold text-xs sm:text-sm uppercase tracking-widest mb-3">
        <Sparkles size={12} />
        {label}
      </span>
      <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-gray-900 dark:text-white leading-tight tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-gray-500 dark:text-gray-400 mt-4 max-w-xl mx-auto text-[15px] leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* ─── top-3 restaurant card ─── */
function TopRestaurantCard({ r, rank, t }) {
  return (
    <Link
      to={`/r/${r.slug}`}
      className="group relative rounded-3xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-2xl dark:hover:shadow-black/40 transition-all duration-500 hover:-translate-y-2 flex flex-col"
    >
      {/* cover */}
      <div className="relative h-60 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 overflow-hidden shrink-0">
        {r.coverImage
          ? <img src={r.coverImage} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30">
              <Utensils size={44} className="text-orange-200 dark:text-orange-800" />
            </div>
          )
        }

        {/* rank badge */}
        <div className="absolute top-4 start-4">
          {rank === 0 ? (
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg">
              <Award size={11} /> #{rank + 1} {t('home.topRated.top')}
            </span>
          ) : (
            <span className="bg-black/40 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
              #{rank + 1}
            </span>
          )}
        </div>

        {r.isHalal && (
          <span className="absolute top-4 end-4 bg-emerald-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow">
            Halal
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* body */}
      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-black text-gray-900 dark:text-white text-lg leading-tight">{r.name}</h3>
        {r.cuisine?.length > 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{r.cuisine.join(' · ')}</p>
        )}

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-1.5">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s} size={13}
                  className={s <= Math.round(r.rating || 0)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-gray-200 dark:text-gray-700 fill-current'}
                />
              ))}
            </div>
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{(r.rating || 0).toFixed(1)}</span>
            <span className="text-xs text-gray-400">({r.reviewCount || 0})</span>
          </div>
          {r.address?.city && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin size={11} />
              {r.address.city}
            </div>
          )}
        </div>

        <div className="mt-auto pt-5 flex items-center gap-1.5 text-orange-500 dark:text-orange-400 text-sm font-bold group-hover:gap-2.5 transition-all duration-200">
          {t('home.topRated.viewMenu')}
          <ArrowRight size={14} />
        </div>
      </div>
    </Link>
  );
}

/* ─── fallback card when no restaurants ─── */
function FallbackCard({ rank, t }) {
  return (
    <div className="rounded-3xl overflow-hidden bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center p-12 text-center gap-3 min-h-[360px]">
      <Utensils size={36} className="text-gray-300 dark:text-gray-600" />
      <p className="text-gray-400 dark:text-gray-500 text-sm">{t('home.topRated.comingSoon')}</p>
    </div>
  );
}

/* ─── search result card ─── */
function RestaurantCard({ r, t }) {
  return (
    <Link
      to={`/r/${r.slug}`}
      className="group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl dark:hover:shadow-black/30 transition-all duration-300 hover:-translate-y-1"
    >
      <div className="h-44 bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
        {r.coverImage
          ? <img src={r.coverImage} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center"><Utensils size={32} className="text-gray-300 dark:text-gray-600" /></div>
        }
        {r.isHalal && (
          <span className="absolute top-3 start-3 bg-emerald-500 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full">Halal</span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug">{r.name}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{r.cuisine?.join(', ')}</p>
        <div className="flex items-center gap-1 mt-2">
          <Star size={12} className="text-amber-400 fill-amber-400" />
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{(r.rating || 0).toFixed(1)}</span>
          <span className="text-xs text-gray-400">({r.reviewCount || 0})</span>
          {r.address?.city && (
            <span className="text-xs text-gray-400 ms-auto">{r.address.city}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
