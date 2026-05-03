import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignInAlt, faUserPlus, faBars, faXmark, faHome, faInfoCircle, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { Milk } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Scrolled state for elevation effect
      setIsScrolled(currentScrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'home', label: 'Home', faIcon: faHome },
    { id: 'about', label: 'About Us', faIcon: faInfoCircle },
    { id: 'contact', label: 'Contact', faIcon: faEnvelope },
    { id: 'signup', label: 'Sign Up', faIcon: faUserPlus },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] py-4 transition-all duration-300 bg-white shadow-sm border-b border-slate-100 ${isScrolled ? 'bg-white/95 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.06)]' : 'bg-white-100'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 transform -rotate-2 group-hover:rotate-2 bg-green-600 text-white shadow-green-900/10">
              <Milk className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight leading-none text-slate-900">
                Amata<span className="text-emerald-500">Link</span>
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest mt-1 text-slate-400">
                Dairy Network
              </span>
            </div>
          </div>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => onNavigate(link.id)}
                  className={`flex items-center gap-2 text-sm font-bold transition-all px-5 py-2.5 rounded-xl border cursor-pointer ${currentPage === link.id
                      ? (link.id === 'signup'
                        ? 'bg-green-600 text-white border-green-600 shadow-lg shadow-green-900/20'
                        : 'bg-green-50 text-green-600 border-green-100 shadow-sm')
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-transparent hover:border-slate-100'
                    }`}
                >
                  <FontAwesomeIcon icon={link.faIcon} className="text-xs" />
                  {link.label}
                </button>
              ))}
            </div>

            <div className="w-px h-6 bg-slate-200 mx-1" />

            <button
              onClick={() => onNavigate('signin')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all border cursor-pointer ${currentPage === 'signin'
                  ? 'bg-green-600 text-white border-green-600 shadow-lg shadow-green-900/20'
                  : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
            >
              <FontAwesomeIcon icon={faSignInAlt} className="text-xs" />
              Sign In
            </button>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-11 h-11 rounded-xl flex items-center justify-center transition-all bg-slate-100 text-slate-600 cursor-pointer"
          >
            <FontAwesomeIcon icon={mobileMenuOpen ? faXmark : faBars} className="text-lg" />
          </button>
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden absolute top-full left-4 right-4 mt-4 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[101]"
          >
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-2">
                {[...navLinks, { id: 'signin', label: 'Sign In', faIcon: faSignInAlt }].map((link) => (
                  <button
                    key={link.id}
                    onClick={() => { onNavigate(link.id); setMobileMenuOpen(false); }}
                    className={`flex items-center gap-4 px-6 py-4 rounded-xl text-left font-bold transition-all cursor-pointer ${currentPage === link.id ? 'bg-green-600 text-white shadow-lg shadow-green-900/10' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <FontAwesomeIcon icon={link.faIcon} className={`w-5 h-5 ${currentPage === link.id ? 'text-white' : 'opacity-50'}`} />
                    {link.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
