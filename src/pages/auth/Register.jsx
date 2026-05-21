import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Lock } from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { Button, Input, ThemeToggle, LanguageSwitcher } from '../../components/ui';

export default function Register() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });

  const { mutate, isPending } = useMutation({
    mutationFn: authService.register,
    onSuccess: ({ data }) => {
      setAuth(data.user, data.token);
      toast.success(t('register.success'));
      navigate('/admin');
    },
    onError: (err) => toast.error(err.message),
  });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const fields = [
    { key: 'name',     label: t('register.name'),     type: 'text',     icon: User,  placeholder: 'Ahmed Ben Ali' },
    { key: 'email',    label: t('register.email'),    type: 'email',    icon: Mail,  placeholder: 'you@example.com' },
    { key: 'phone',    label: t('register.phone'),    type: 'tel',      icon: Phone, placeholder: '+216 XX XXX XXX' },
    { key: 'password', label: t('register.password'), type: 'password', icon: Lock,  placeholder: '••••••••' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors">
      {/* Top bar */}
      <div className="flex justify-between items-center px-6 py-4">
        <Link to="/" className="text-xl font-bold text-orange-500">Restora</Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('register.title')}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('register.subtitle')}</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); mutate(form); }} className="space-y-4">
              {fields.map(({ key, label, type, icon, placeholder }) => (
                <Input
                  key={key}
                  label={label}
                  type={type}
                  icon={icon}
                  required
                  value={form[key]}
                  onChange={set(key)}
                  placeholder={placeholder}
                />
              ))}
              <Button type="submit" loading={isPending} fullWidth size="lg" className="mt-2">
                {isPending ? t('register.submitting') : t('register.submit')}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              {t('register.hasAccount')}{' '}
              <Link to="/login" className="text-orange-500 font-medium hover:underline">
                {t('register.loginLink')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
