import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { ThemeToggle, LanguageSwitcher, Avatar } from '../ui';
import {
  Utensils, Share2, MessageCircle, ExternalLink,
  Mail, MapPin, Phone,
  Bell, ChevronDown, LayoutDashboard, LogOut, Menu, X,
} from 'lucide-react';

export default function PublicLayout() {
  const { t } = useTranslation(['common', 'public']);
  const { user, logout } = useAuthStore();
  const token = !!user; // user persists in localStorage; token is in-memory but restored on load
  const navigate = useNavigate();

  const [userMenuOpen,   setUserMenuOpen]   = useState(false);
  const [mobileNavOpen,  setMobileNavOpen]  = useState(false);
  const userMenuRef = useRef(null);

  /* close user dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleLogout() {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  }

  const dashPath = user?.role === 'superadmin' ? '/superadmin' : '/admin';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">

      {/* ════════════════════════════════════════
          NAVBAR
      ════════════════════════════════════════ */}
      <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-white/8 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-sm group-hover:shadow-orange-500/30 group-hover:scale-105 transition-all duration-200">
              <Utensils size={15} className="text-white" />
            </div>
            <span className="text-lg font-black text-gray-900 dark:text-white">
              Resto<span className="text-orange-500">ra</span>
            </span>
          </Link>

          {/* ── Centre nav (desktop) ── */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink
              to="/restaurants"
              className={({ isActive }) =>
                `px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-150 ${
                  isActive
                    ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/8 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              {t('nav.restaurants')}
            </NavLink>
          </nav>

          {/* ── Right controls ── */}
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <LanguageSwitcher />
            <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-1.5" />

            {token ? (
              /* ─── LOGGED-IN STATE ─── */
              <div className="flex items-center gap-1">

                {/* Notification bell */}
                <button
                  title={t('nav.notifications', 'Notifications')}
                  className="relative w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors duration-150"
                >
                  <Bell size={18} />
                  {/* red dot */}
                  <span className="absolute top-1.5 end-1.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-white dark:border-gray-900" />
                </button>

                {/* User dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 h-10 px-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors duration-150"
                  >
                    <Avatar src={user?.avatar} name={user?.name || '?'} size="sm" />
                    <span className="hidden sm:block text-sm font-semibold text-gray-800 dark:text-gray-200 max-w-[96px] truncate leading-none">
                      {user?.name?.split(' ')[0] || 'Account'}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute end-0 top-full mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl dark:shadow-black/40 py-1.5 z-50 origin-top-end animate-in">

                      {/* user info header */}
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-white/5">
                        <Avatar src={user?.avatar} name={user?.name || '?'} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.name}</p>
                          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                        </div>
                      </div>

                      {/* dashboard link */}
                      <Link
                        to={dashPath}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-orange-500 dark:hover:text-orange-400 transition-colors duration-100"
                      >
                        <LayoutDashboard size={15} className="shrink-0" />
                        {t('nav.dashboard')}
                      </Link>

                      {/* divider */}
                      <div className="my-1 mx-3 border-t border-gray-100 dark:border-white/5" />

                      {/* logout */}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors duration-100"
                      >
                        <LogOut size={15} className="shrink-0" />
                        {t('nav.logout')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ─── LOGGED-OUT STATE ─── */
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="hidden sm:flex px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors duration-150"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="flex items-center px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-colors duration-150 shadow-sm shadow-orange-500/20"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ms-1"
            >
              {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile nav panel */}
        {mobileNavOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-white/5 bg-white dark:bg-gray-900 px-4 py-3 flex flex-col gap-1">
            <NavLink
              to="/restaurants"
              onClick={() => setMobileNavOpen(false)}
              className={({ isActive }) =>
                `px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-500'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                }`
              }
            >
              {t('nav.restaurants')}
            </NavLink>
            {!token && (
              <Link to="/login" onClick={() => setMobileNavOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                {t('nav.login')}
              </Link>
            )}
          </div>
        )}
      </header>

      {/* ── Page content ── */}
      <main>
        <Outlet />
      </main>

      {/* ════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
      <footer className="bg-gray-950 border-t border-white/5 mt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

            {/* brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                  <Utensils size={15} className="text-white" />
                </div>
                <span className="text-lg font-black text-white">Resto<span className="text-orange-400">ra</span></span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                {t('public:footer.tagline')}
              </p>
              <div className="flex gap-3">
                {[Share2, MessageCircle, ExternalLink].map((Icon, i) => (
                  <a key={i} href="#"
                     className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-orange-500/20 hover:border-orange-500/30 flex items-center justify-center text-gray-400 hover:text-orange-400 transition-all duration-200">
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            </div>

            {/* platform */}
            <div>
              <h4 className="text-white font-bold text-sm mb-5">{t('public:footer.platform')}</h4>
              <ul className="space-y-3">
                {[
                  { key: 'discover', to: '/restaurants' },
                  { key: 'forOwners', to: '/register' },
                  { key: 'pricing', to: '/register' },
                  { key: 'blog', to: '/' },
                ].map((l) => (
                  <li key={l.key}>
                    <Link to={l.to} className="text-gray-400 hover:text-white text-sm transition-colors duration-150 hover:translate-x-0.5 inline-block">
                      {t(`public:footer.${l.key}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* company */}
            <div>
              <h4 className="text-white font-bold text-sm mb-5">{t('public:footer.company')}</h4>
              <ul className="space-y-3">
                {['about', 'careers', 'privacy', 'terms'].map((k) => (
                  <li key={k}>
                    <Link to="/" className="text-gray-400 hover:text-white text-sm transition-colors duration-150 hover:translate-x-0.5 inline-block">
                      {t(`public:footer.${k}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* contact */}
            <div>
              <h4 className="text-white font-bold text-sm mb-5">{t('public:footer.contact')}</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2.5 text-gray-400 text-sm">
                  <Mail size={15} className="text-orange-400 shrink-0 mt-0.5" />
                  contact@restora.tn
                </li>
                <li className="flex items-start gap-2.5 text-gray-400 text-sm">
                  <Phone size={15} className="text-orange-400 shrink-0 mt-0.5" />
                  +216 XX XXX XXX
                </li>
                <li className="flex items-start gap-2.5 text-gray-400 text-sm">
                  <MapPin size={15} className="text-orange-400 shrink-0 mt-0.5" />
                  Tunis, Tunisia
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-gray-500 text-xs">
              © {new Date().getFullYear()} Restora. {t('public:footer.rights')}
            </p>
            <span className="text-xs text-gray-500">
              {t('public:footer.madeWith')} ❤️ {t('public:footer.inTunisia')}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
