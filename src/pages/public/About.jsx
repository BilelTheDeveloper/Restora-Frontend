import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Eye, Award, Heart, Zap, CheckCircle, Sparkles,
  ArrowRight, MapPin, Calendar, Globe, Shield,
} from 'lucide-react';

/* ── animated counter ── */
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

function useInView(threshold = 0.2) {
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

const VALUES = [
  { key: 'transparency', icon: Eye,    gradient: 'from-blue-500/15 to-violet-500/15',   border: 'border-blue-500/20',   text: 'text-blue-400'    },
  { key: 'quality',      icon: Award,  gradient: 'from-amber-500/15 to-orange-500/15',  border: 'border-amber-500/20',  text: 'text-amber-400'   },
  { key: 'community',    icon: Heart,  gradient: 'from-rose-500/15 to-pink-500/15',     border: 'border-rose-500/20',   text: 'text-rose-400'    },
  { key: 'innovation',   icon: Zap,    gradient: 'from-emerald-500/15 to-teal-500/15',  border: 'border-emerald-500/20',text: 'text-emerald-400' },
];

export default function About() {
  const { t } = useTranslation('public');
  const [statsRef, statsInView] = useInView(0.25);

  const countR = useCountUp(500,   2200, statsInView);
  const countC = useCountUp(25,    2000, statsInView);
  const countK = useCountUp(50000, 2400, statsInView);

  return (
    <div>

      {/* ══════ HERO ══════ */}
      <section className="relative min-h-[62vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[#0b0500]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0800]/80 via-transparent to-orange-950/60" />
        <div className="absolute top-20 start-[20%] w-80 h-80 bg-orange-600/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-16 end-[12%] w-64 h-64 bg-amber-500/15 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 opacity-[0.04]"
             style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '36px 36px' }} />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/25 text-orange-400 rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold mb-8 backdrop-blur-sm">
            <Sparkles size={13} />
            {t('about.hero.badge')}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-black text-white leading-[1.05] tracking-tight mb-6">
            {t('about.hero.title')}
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
            {t('about.hero.subtitle')}
          </p>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-gray-50 dark:from-gray-950 to-transparent" />
      </section>

      {/* ══════ STORY ══════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* text */}
          <div>
            <span className="inline-flex items-center gap-1.5 text-orange-500 font-semibold text-xs sm:text-sm uppercase tracking-widest mb-4">
              <Sparkles size={12} /> {t('about.story.label')}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-gray-900 dark:text-white leading-tight mb-6">
              {t('about.story.title')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-4 text-[15px]">{t('about.story.p1')}</p>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-[15px]">{t('about.story.p2')}</p>

            <div className="flex flex-wrap gap-3 mt-8">
              {['tag1', 'tag2', 'tag3'].map((k) => (
                <span key={k}
                  className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/40 text-orange-600 dark:text-orange-400 text-xs font-semibold px-3.5 py-1.5 rounded-full">
                  <CheckCircle size={12} /> {t(`about.story.${k}`)}
                </span>
              ))}
            </div>
          </div>

          {/* visual card */}
          <div className="relative">
            <div className="bg-gray-950 rounded-3xl p-8 border border-white/8 shadow-2xl shadow-black/40">
              {/* founding badge */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <Sparkles size={22} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-black text-xl leading-none">Restora</p>
                  <p className="text-gray-400 text-sm mt-0.5">{t('about.story.founded')} {t('about.story.year')}</p>
                </div>
              </div>

              <div className="space-y-5">
                <InfoRow icon={Calendar} label={t('about.story.founded')}   value={t('about.story.year')} />
                <InfoRow icon={MapPin}   label="Headquartered"              value={t('about.story.location')} />
                <InfoRow icon={Globe}    label="Languages"                  value="العربية · Français · English" />
                <InfoRow icon={Shield}   label="Compliance"                 value="KYC Verified · GDPR Ready" />
              </div>

              <div className="mt-8 pt-6 border-t border-white/8 grid grid-cols-3 gap-4 text-center">
                {[
                  { val: '500+', label: 'Restaurants' },
                  { val: '25',   label: 'Cities' },
                  { val: '4.9★', label: 'Rating' },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="text-2xl font-black text-orange-400">{s.val}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* floating accent */}
            <div className="absolute -top-4 -end-4 w-24 h-24 bg-orange-500/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -start-4 w-20 h-20 bg-amber-500/15 rounded-full blur-2xl" />
          </div>
        </div>
      </section>

      {/* ══════ VALUES ══════ */}
      <section className="bg-gray-50 dark:bg-gray-900/50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 text-orange-500 font-semibold text-xs sm:text-sm uppercase tracking-widest mb-3">
              <Sparkles size={12} /> {t('about.values.label')}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-gray-900 dark:text-white leading-tight">
              {t('about.values.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v) => (
              <div key={v.key}
                className="group bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-white/5 hover:shadow-2xl dark:hover:shadow-black/40 hover:-translate-y-1 transition-all duration-300">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${v.gradient} border ${v.border} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <v.icon size={24} className={v.text} />
                </div>
                <h3 className="font-black text-gray-900 dark:text-white text-lg mb-2 leading-snug">
                  {t(`about.values.items.${v.key}.title`)}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                  {t(`about.values.items.${v.key}.desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ STATS ══════ */}
      <section ref={statsRef} className="py-24 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { val: countR, suffix: '+',  label: t('about.stats.restaurants'), g: 'from-orange-500/15 to-amber-500/15',   b: 'border-orange-500/20', t2: 'text-orange-400' },
              { val: countC, suffix: '',   label: t('about.stats.cities'),       g: 'from-blue-500/15 to-violet-500/15',   b: 'border-blue-500/20',   t2: 'text-blue-400'   },
              { val: countK, suffix: '+',  label: t('about.stats.customers'),    g: 'from-emerald-500/15 to-teal-500/15', b: 'border-emerald-500/20',t2: 'text-emerald-400'},
              { val: 4.9,    suffix: '★', label: t('about.stats.rating'),        g: 'from-amber-500/15 to-yellow-500/15', b: 'border-amber-500/20',  t2: 'text-amber-400', fixed: 1 },
            ].map((s, i) => (
              <div key={i} className={`bg-gradient-to-br ${s.g} border ${s.b} rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-2`}>
                <div className={`text-4xl sm:text-5xl font-black ${s.t2}`}>
                  {s.fixed ? s.val.toFixed(s.fixed) : s.val.toLocaleString()}{s.suffix}
                </div>
                <div className="text-gray-400 text-sm font-medium text-center leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ MISSION ══════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 text-orange-500 font-semibold text-xs sm:text-sm uppercase tracking-widest mb-4">
              <Sparkles size={12} /> {t('about.mission.label')}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-gray-900 dark:text-white leading-tight mb-6">
              {t('about.mission.title')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-[15px] mb-8">
              {t('about.mission.body')}
            </p>
            <ul className="space-y-4">
              {['p1', 'p2', 'p3'].map((k) => (
                <li key={k} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-orange-500/15 border border-orange-500/25 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle size={13} className="text-orange-500" />
                  </div>
                  <span className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{t(`about.mission.${k}`)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* side CTA card */}
          <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl p-10 text-center shadow-2xl shadow-orange-500/25 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.08]"
                 style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
            <div className="relative">
              <h3 className="text-2xl font-black text-white mb-3">{t('about.cta.title')}</h3>
              <p className="text-orange-100 text-sm leading-relaxed mb-8">{t('about.cta.subtitle')}</p>
              <div className="flex flex-col gap-3">
                <Link to="/restaurants"
                  className="bg-white text-orange-600 hover:bg-orange-50 py-3.5 rounded-2xl font-black text-sm transition-all duration-200 shadow-lg flex items-center justify-center gap-2">
                  {t('about.cta.dinerBtn')} <ArrowRight size={14} />
                </Link>
                <Link to="/register"
                  className="bg-orange-600/30 hover:bg-orange-600/50 border border-white/20 text-white py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 backdrop-blur-sm flex items-center justify-center gap-2">
                  {t('about.cta.ownerBtn')} <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2.5 text-gray-400 text-sm">
        <Icon size={15} className="text-orange-400 shrink-0" />
        {label}
      </div>
      <span className="text-white font-semibold text-sm">{value}</span>
    </div>
  );
}
