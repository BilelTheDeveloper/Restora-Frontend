import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { ThemeToggle, LanguageSwitcher, Button, Avatar } from '../ui';
import { Utensils, Share2, MessageCircle, ExternalLink, Mail, MapPin, Phone } from 'lucide-react';

export default function PublicLayout() {
  const { t } = useTranslation();
  const { user, token, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      {/* Navbar */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-bold text-orange-500">Restora</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <LanguageSwitcher />

            <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-1" />

            {token ? (
              <div className="flex items-center gap-2">
                <Link to={user?.role === 'superadmin' ? '/superadmin' : '/admin'}>
                  <Button variant="ghost" size="sm">{t('nav.dashboard')}</Button>
                </Link>
                <Avatar name={user?.name} size="sm" />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">{t('nav.login')}</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">{t('nav.register')}</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Page content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-white/5 mt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

            {/* brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                  <Utensils size={16} className="text-white" />
                </div>
                <span className="text-xl font-black text-white">Restora</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                {t('footer.tagline', 'The smartest way to discover, book, and manage restaurants across North Africa.')}
              </p>
              <div className="flex gap-3">
                {[
                  { icon: Share2,         href: '#' },
                  { icon: MessageCircle,  href: '#' },
                  { icon: ExternalLink,   href: '#' },
                ].map(({ icon: Icon, href }, i) => (
                  <a key={i} href={href}
                     className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-orange-500/20 hover:border-orange-500/30 flex items-center justify-center text-gray-400 hover:text-orange-400 transition-all duration-200">
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            </div>

            {/* platform */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4">{t('footer.platform', 'Platform')}</h4>
              <ul className="space-y-2.5">
                {[
                  { label: t('footer.discover', 'Discover Restaurants'), to: '/' },
                  { label: t('footer.forOwners', 'For Restaurant Owners'), to: '/register' },
                  { label: t('footer.pricing', 'Pricing'), to: '/register' },
                  { label: t('footer.blog', 'Blog'), to: '/' },
                ].map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-gray-400 hover:text-white text-sm transition-colors duration-150">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* company */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4">{t('footer.company', 'Company')}</h4>
              <ul className="space-y-2.5">
                {[
                  { label: t('footer.about', 'About Us'), to: '/' },
                  { label: t('footer.careers', 'Careers'), to: '/' },
                  { label: t('footer.privacy', 'Privacy Policy'), to: '/' },
                  { label: t('footer.terms', 'Terms of Service'), to: '/' },
                ].map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-gray-400 hover:text-white text-sm transition-colors duration-150">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* contact */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4">{t('footer.contact', 'Contact')}</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2.5 text-gray-400 text-sm">
                  <Mail size={15} className="text-orange-400 shrink-0 mt-0.5" />
                  <span>contact@restora.tn</span>
                </li>
                <li className="flex items-start gap-2.5 text-gray-400 text-sm">
                  <Phone size={15} className="text-orange-400 shrink-0 mt-0.5" />
                  <span>+216 XX XXX XXX</span>
                </li>
                <li className="flex items-start gap-2.5 text-gray-400 text-sm">
                  <MapPin size={15} className="text-orange-400 shrink-0 mt-0.5" />
                  <span>Tunis, Tunisia</span>
                </li>
              </ul>
            </div>
          </div>

          {/* divider + bottom bar */}
          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-gray-500 text-xs">
              © {new Date().getFullYear()} Restora. {t('footer.rights', 'All rights reserved.')}
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500">{t('footer.madeWith', 'Made with')} ❤️ {t('footer.inTunisia', 'in Tunisia')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
