import React, { useState, useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { DigitalPassportView } from './pages/passport/DigitalPassportView';
import { ApplicationQueueView } from './pages/applications/ApplicationQueueView';
import { FieldVerificationView } from './pages/field/FieldVerificationView';
import { InstrumentListPage } from './pages/instruments/InstrumentListPage';
import { RuleEngineView } from './pages/admin/RuleEngineView';
import { AuditTrailView } from './pages/admin/AuditTrailView';
import { CertificateViewerModal } from './pages/certificates/CertificateViewerModal';
import { PublicVerifyView } from './pages/public/PublicVerifyView';

export function App() {
  const { user, token, initAuth, isLoading } = useAuthStore();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [activeCertificateId, setActiveCertificateId] = useState<string | null>(null);

  // Check URL path for public verification route `/verify/:token`
  const pathname = window.location.pathname;
  const isVerifyRoute = pathname.startsWith('/verify/');
  const publicToken = isVerifyRoute ? pathname.replace('/verify/', '').trim() : null;

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Public unauthenticated route
  if (isVerifyRoute && publicToken) {
    return (
      <PublicVerifyView
        token={publicToken}
        onBackToApp={() => {
          window.history.pushState({}, '', '/');
          window.location.reload();
        }}
      />
    );
  }

  // Not logged in -> Show Login Page
  if (!token || !user) {
    if (isLoading) {
      return (
        <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center text-slate-400 font-mono text-xs">
          Loading INSPECTRA...
        </div>
      );
    }
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar onNavigate={(tab) => setCurrentTab(tab)} />

      <div className="flex-1 flex overflow-hidden">
        {/* Role-Adaptive Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#0a0f1e]">
          {currentTab === 'dashboard' && (
            <DashboardPage onNavigate={(tab) => setCurrentTab(tab)} />
          )}

          {currentTab === 'instruments' && (
            <InstrumentListPage onOpenPassport={() => setCurrentTab('passport')} />
          )}

          {currentTab === 'admin-instruments' && (
            <InstrumentListPage onOpenPassport={() => setCurrentTab('passport')} />
          )}

          {currentTab === 'passport' && (
            <DigitalPassportView
              onNavigateToApply={() => setCurrentTab('applications')}
              onViewCertificate={(certId) => setActiveCertificateId(certId)}
            />
          )}

          {(currentTab === 'applications' || currentTab === 'lmo-applications' || currentTab === 'assignments' || currentTab === 'verifications') && (
            <ApplicationQueueView
              onViewCertificate={(certId) => setActiveCertificateId(certId)}
              onNavigateToFieldVerify={() => setCurrentTab('field-verify')}
            />
          )}

          {currentTab === 'certificates' && (
            <ApplicationQueueView
              onViewCertificate={(certId) => setActiveCertificateId(certId)}
              onNavigateToFieldVerify={() => setCurrentTab('field-verify')}
            />
          )}

          {(currentTab === 'field-tasks' || currentTab === 'field-verify') && (
            <FieldVerificationView
              onVerificationSubmitted={() => setCurrentTab('dashboard')}
            />
          )}

          {currentTab === 'rules' && <RuleEngineView />}

          {currentTab === 'audit' && <AuditTrailView />}
        </main>
      </div>

      {/* Certificate Viewer Modal */}
      {activeCertificateId && (
        <CertificateViewerModal
          certificateId={activeCertificateId}
          onClose={() => setActiveCertificateId(null)}
          onNavigateToPublicVerify={(tok) => {
            setActiveCertificateId(null);
            window.history.pushState({}, '', `/verify/${tok}`);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

export default App;
