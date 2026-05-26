import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  User, Search, Calendar, Star,
  Shield, Settings, Globe, BarChart2,
  ChevronDown, Sparkles, ArrowRight,
} from 'lucide-react';

const DINER_ICONS  = [User, Search, Calendar, Star];
const OWNER_ICONS  = [Shield, Settings, Globe, BarChart2];

const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'];

export default function HowItWorks() {
  const { t } = useTranslation('public');
  const [tab,     setTab]     = useState('diners');
  const [openFaq, setOpenFaq] = useState(null);

  const isDiners = tab === 'diners';
  const steps    = isDiners ? ['1','2','3','4'] : ['1','2','3','4'];
  const icons    = isDiners ? DINER_ICONS : OWNER_ICONS;
  const prefix   = isDiners ? 'howItWorks.diners' : 'howItWorks.owners';

  return (
    <div>

      {/* ══════ HERO ══════ */}
      <section className="relative min-h-[62vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[#0b0500]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0800]/80 via-transparent to-orange-950/60" />
        <div className="absolute top-20 start-[18%] w-80 h-80 bg-orange-600/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-16 end-[14%] w-64 h-64 bg-amber-500/15 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1.1s' }} />
        <div className="absolute inset-0 opacity-[0.04]"
             style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '36px 36px' }} />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/25 text-orange-400 rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold mb-8 backdrop-blur-sm">
            <Sparkles size={13} />
            {t('howItWorks.hero.badge')}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-black text-white leading-[1.05] tracking-tight mb-6">
            {t('howItWorks.hero.title')}
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
            {t('howItWorks.hero.subtitle')}
          </p>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-gray-50 dark:from-gray-950 to-transparent" />
      </section>

      {/* ══════ TAB SWITCHER ══════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

        <div className="flex justify-center mb-16">
          <div className="inline-flex bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-white/8 rounded-2xl p-1.5 gap-1">
            {['diners', 'owners'].map((t_key) => (
              <button
                key={t_key}
                onClick={() => setTab(t_key)}
                className={[
                  'px-7 py-3 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap',
                  tab === t_key
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white',
                ].join(' ')}
              >
                {t(`howItWorks.tabs.${t_key}`)}
              </button>
            ))}
          </div>
        </div>

        {/* label + title */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-1.5 text-orange-500 font-semibold text-xs sm:text-sm uppercase tracking-widest mb-3">
            <Sparkles size={12} /> {t(`${prefix}.label`)}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-gray-900 dark:text-white leading-tight">
            {t(`${prefix}.title`)}
          </h2>
        </div>

        {/* steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* connector line */}
          <div className="hidden lg:block absolute top-[52px] start-[calc(12.5%+2rem)] end-[calc(12.5%+2rem)] h-0.5 bg-gradient-to-r from-orange-500/30 via-orange-500/60 to-orange-500/30 rounded-full" />

          {steps.map((s, i) => {
            const Icon = icons[i];
            return (
              <div key={s} className="flex flex-col items-center text-center group">
                {/* number + icon */}
                <div className="relative mb-6">
                  <div className="w-[104px] h-[104px] rounded-[28px] bg-white dark:bg-gray-900 border-2 border-orange-500/30 group-hover:border-orange-500 shadow-lg shadow-orange-500/10 group-hover:shadow-orange-500/25 flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-105">
                    <Icon size={36} className="text-orange-500" />
                  </div>
                  <div className="absolute -top-3 -end-3 w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <span className="text-white font-black text-sm leading-none">{s.padStart(2, '0')}</span>
                  </div>
                </div>

                <h3 className="font-black text-gray-900 dark:text-white text-lg mb-2 leading-snug">
                  {t(`${prefix}.steps.${s}.title`)}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-[200px] mx-auto">
                  {t(`${prefix}.steps.${s}.desc`)}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA after steps */}
        <div className="text-center mt-14">
          <Link
            to={isDiners ? '/restaurants' : '/register'}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-9 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 shadow-lg shadow-orange-500/25 hover:gap-3"
          >
            {isDiners ? t('howItWorks.cta.dinerBtn') : t('howItWorks.cta.ownerBtn')}
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ══════ FAQ ══════ */}
      <section className="bg-gray-50 dark:bg-gray-900/40 py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 text-orange-500 font-semibold text-xs sm:text-sm uppercase tracking-widest mb-3">
              <Sparkles size={12} /> FAQ
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">
              {t('howItWorks.faq.title')}
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ_KEYS.map((key) => (
              <FAQItem
                key={key}
                q={t(`howItWorks.faq.items.${key}.q`)}
                a={t(`howItWorks.faq.items.${key}.a`)}
                open={openFaq === key}
                onToggle={() => setOpenFaq(openFaq === key ? null : key)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ══════ CTA BANNER ══════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 p-12 sm:p-16 text-center shadow-2xl shadow-orange-500/20">
          <div className="absolute inset-0 opacity-[0.08]"
               style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">{t('howItWorks.cta.title')}</h2>
            <p className="text-orange-100 mb-10 max-w-lg mx-auto text-[15px]">{t('howItWorks.cta.subtitle')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register"
                className="bg-white text-orange-600 hover:bg-orange-50 px-10 py-4 rounded-2xl font-black text-sm transition-all duration-200 shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2">
                {t('howItWorks.cta.ownerBtn')} <ArrowRight size={14} />
              </Link>
              <Link to="/restaurants"
                className="bg-orange-600/30 hover:bg-orange-600/50 border border-white/25 text-white px-10 py-4 rounded-2xl font-bold text-sm transition-all duration-200 backdrop-blur-sm flex items-center justify-center gap-2">
                {t('howItWorks.cta.dinerBtn')} <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ── FAQ accordion item ── */
function FAQItem({ q, a, open, onToggle }) {
  return (
    <div
      className={[
        'bg-white dark:bg-gray-900 border rounded-2xl overflow-hidden transition-all duration-300',
        open
          ? 'border-orange-300 dark:border-orange-700/50 shadow-md shadow-orange-500/10'
          : 'border-gray-200 dark:border-white/8 hover:border-orange-200 dark:hover:border-orange-900/40',
      ].join(' ')}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-start"
      >
        <span className={`font-bold text-sm leading-snug ${open ? 'text-orange-500 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>
          {q}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-gray-400 transition-transform duration-300 ${open ? 'rotate-180 text-orange-500' : ''}`}
        />
      </button>

      {open && (
        <div className="px-6 pb-5">
          <div className="border-t border-gray-100 dark:border-white/5 pt-4">
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{a}</p>
          </div>
        </div>
      )}
    </div>
  );
}
