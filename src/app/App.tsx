import { useState, useEffect, useCallback } from 'react';
import { Toaster } from 'sonner';
import { HomePage } from './components/HomePage';
import { AboutUs } from './components/AboutUs';
import { ContactUs } from './components/ContactUs';
import { SignIn } from './components/SignIn';
import { SignUp } from './components/SignUp';
import { RoleSelection } from './components/RoleSelection';
import { FarmerDashboard } from './components/FarmerDashboard';
import { CollectorDashboard } from './components/CollectorDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { RegistrationPending } from './components/RegistrationPending';
import { ForgotPassword } from '@/app/components/ForgotPassword';
import { ResetPassword } from '@/app/components/ResetPassword';
import { I18nProvider } from './i18n';

type UserRole = 'farmer' | 'collector' | 'admin' | null;
type Page = 'home' | 'about' | 'contact' | 'signin' | 'signup' | 'get-started' | 'forgot-password' | 'reset-password' | 'dashboard' | 'registration-pending';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [userName, setUserName] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Check for existing session on mount - only once
  useEffect(() => {
    if (isInitialized) return;

    const token = localStorage.getItem('amatalink_token');
    const userStr = localStorage.getItem('amatalink_user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.role) {
          setUserName(user.fullName || user.username);
          setSelectedRole(user.role);
          setCurrentPage('dashboard');
        }
      } catch (e) {
        localStorage.removeItem('amatalink_token');
        localStorage.removeItem('amatalink_user');
      }
    }
    setIsInitialized(true);
  }, [isInitialized]);

  const handleNavigate = useCallback((page: string) => {
    setCurrentPage(page as Page);
    window.scrollTo(0, 0);
  }, []);

  const handleSignIn = useCallback((role: UserRole) => {
    const userStr = localStorage.getItem('amatalink_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.fullName || user.username);
        setSelectedRole(user.role);
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
    setCurrentPage('dashboard');
  }, []);

  const handleSignupSuccess = useCallback((result: any) => {
    localStorage.setItem('amatalink_user', JSON.stringify(result.user));
    setUserName(result.user.fullName || result.user.username);
    setSelectedRole(result.user.role);
    setCurrentPage('dashboard');
  }, []);

  const handleRoleSelect = useCallback((role: UserRole) => {
    setSelectedRole(role);
    setCurrentPage('dashboard');
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('amatalink_token');
    localStorage.removeItem('amatalink_user');
    setSelectedRole(null);
    setUserName('');
    setCurrentPage('home');
  }, []);

  // Render Pages
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'about':
        return <AboutUs onNavigate={handleNavigate} />;
      case 'contact':
        return <ContactUs onNavigate={handleNavigate} />;
      case 'signin':
        return <SignIn onNavigate={handleNavigate} onSignIn={handleSignIn} />;
      case 'signup':
        return <SignUp onNavigate={handleNavigate} onSignupSuccess={handleSignupSuccess} />;
      case 'forgot-password':
        return <ForgotPassword onNavigate={handleNavigate} />;
      case 'reset-password':
        return <ResetPassword onNavigate={handleNavigate} />;
      case 'registration-pending':
        return <RegistrationPending onNavigate={handleNavigate} />;
      case 'get-started':
        return <RoleSelection onRoleSelect={handleRoleSelect} onBack={() => handleNavigate('home')} />;
      case 'dashboard':
        if (!selectedRole) {
          return <SignIn onNavigate={handleNavigate} onSignIn={handleSignIn} />;
        }

        switch (selectedRole) {
          case 'farmer':
            return <FarmerDashboard farmerName={userName} onLogout={handleLogout} />;
          case 'collector':
            return <CollectorDashboard collectorName={userName} onLogout={handleLogout} />;
          case 'admin':
            return <AdminDashboard adminName={userName} onLogout={handleLogout} />;
          default:
            return <HomePage onNavigate={handleNavigate} />;
        }
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <>
      {renderPage()}
      <Toaster position="top-right" richColors />
    </>
  );
}

function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}

export default App;
