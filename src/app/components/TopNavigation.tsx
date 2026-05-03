import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faBell, faUser, faSignOutAlt, faGlobe } from '@fortawesome/free-solid-svg-icons';
import { LanguageSelector } from './LanguageSelector';
import { useI18n } from '../i18n';

interface TopNavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
  showLanguageSelector?: boolean;
}

export function TopNavigation({ currentPage, onNavigate, userName, userRole, onLogout, showLanguageSelector = true }: TopNavigationProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <FontAwesomeIcon icon={faBars} className="text-xl" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold tracking-tight">{t('common.appName')}</h1>
                <p className="text-[10px] text-emerald-400 uppercase tracking-widest">Dairy Management</p>
              </div>
            </div>
          </div>

          {/* Center - Real Time Clock */}
          <div className="hidden md:flex flex-col items-center">
            <span className="text-2xl font-bold tracking-wider font-mono">{formatTime(currentTime)}</span>
            <span className="text-xs text-slate-400">{formatDate(currentTime)}</span>
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            {showLanguageSelector && (
              <div className="hidden sm:flex items-center">
                <LanguageSelector />
              </div>
            )}

            {/* Mobile Time */}
            <div className="md:hidden text-right">
              <span className="text-lg font-bold font-mono">{formatTime(currentTime)}</span>
            </div>

            {/* Notifications */}
            {userName && (
              <button className="relative p-2 rounded-lg hover:bg-slate-800 transition-colors">
                <FontAwesomeIcon icon={faBell} className="text-xl" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            )}

            {/* User Menu */}
            {userName ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                    <FontAwesomeIcon icon={faUser} className="text-slate-300" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium">{userName}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-xl shadow-lg py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-700">
                      <p className="text-sm font-medium">{userName}</p>
                      <p className="text-xs text-slate-400 capitalize">{userRole}</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout?.();
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-700 transition-colors flex items-center gap-2 text-red-400"
                    >
                      <FontAwesomeIcon icon={faSignOutAlt} />
                      {t('navigation.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('signin')}
                  className="px-4 py-2 text-sm font-medium hover:bg-slate-800 rounded-lg transition-colors"
                >
                  {t('auth.signIn')}
                </button>
                <button
                  onClick={() => onNavigate('signup')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
                >
                  {t('auth.signUp')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="lg:hidden py-4 border-t border-slate-800">
            <div className="flex flex-col gap-2">
              {userName ? (
                <>
                  <button
                    onClick={() => { setShowMobileMenu(false); onNavigate('dashboard'); }}
                    className="px-4 py-2 text-left hover:bg-slate-800 rounded-lg"
                  >
                    {t('navigation.dashboard')}
                  </button>
                  <button
                    onClick={() => { setShowMobileMenu(false); onLogout?.(); }}
                    className="px-4 py-2 text-left hover:bg-slate-800 rounded-lg text-red-400"
                  >
                    {t('navigation.logout')}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setShowMobileMenu(false); onNavigate('signin'); }}
                    className="px-4 py-2 text-left hover:bg-slate-800 rounded-lg"
                  >
                    {t('auth.signIn')}
                  </button>
                  <button
                    onClick={() => { setShowMobileMenu(false); onNavigate('signup'); }}
                    className="px-4 py-2 text-left hover:bg-slate-800 rounded-lg"
                  >
                    {t('auth.signUp')}
                  </button>
                </>
              )}
              {showLanguageSelector && (
                <div className="px-4 py-2">
                  <LanguageSelector />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
