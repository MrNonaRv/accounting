import React, { useState } from 'react';
import { FundId, FUNDS } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import JevDetailsModal from './components/JevDetailsModal';
import Dashboard from './components/Dashboard';
import JevRegistry from './components/JevRegistry';
import ChartOfAccounts from './components/ChartOfAccounts';
import ResponsibilityCenters from './components/ResponsibilityCenters';
import BudgetMonitoring from './components/BudgetMonitoring';
import TrialBalance from './components/TrialBalance';
import FinancialReports from './components/FinancialReports';
import GlobalSearch from './components/GlobalSearch';

export default function App() {
  const [currentFund, setCurrentFund] = useState<FundId>('general');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [userRole, setUserRole] = useState<'admin' | 'viewer'>('admin');
  
  // Modal tracking states
  const [activeJevId, setActiveJevId] = useState<number | null>(null);
  const [activeJevFund, setActiveJevFund] = useState<FundId>('general');

  const openJevModalFromFund = (jevId: number, fund: FundId = currentFund) => {
    setActiveJevFund(fund);
    setActiveJevId(jevId);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentFund={currentFund}
        setCurrentFund={(f) => {
          setCurrentFund(f);
          // If we change fund, we stay in same tab but views reload data
        }}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={userRole}
        setUserRole={setUserRole}
      />

      {/* Main Content Workspace viewport */}
      <div className="flex-1 pl-80 min-h-screen flex flex-col pt-0 transition-all duration-300">
        
        {/* Header containing officials and system date configs */}
        <Header currentFund={currentFund} />

        {/* Dynamic page container */}
        <main className="flex-1 p-8 md:p-10 space-y-6 overflow-x-hidden">
          {activeTab === 'dashboard' && (
            <Dashboard 
              currentFund={currentFund} 
              onOpenJev={(id) => openJevModalFromFund(id)} 
            />
          )}

          {activeTab === 'jev' && (
            <JevRegistry 
              currentFund={currentFund} 
              userRole={userRole} 
              onOpenJev={(id) => openJevModalFromFund(id)} 
            />
          )}

          {activeTab === 'coa' && (
            <ChartOfAccounts currentFund={currentFund} />
          )}

          {activeTab === 'rc' && (
            <ResponsibilityCenters 
              currentFund={currentFund} 
              onOpenJev={(id) => openJevModalFromFund(id)} 
            />
          )}

          {activeTab === 'budget' && (
            <BudgetMonitoring currentFund={currentFund} />
          )}

          {activeTab === 'trial' && (
            <TrialBalance currentFund={currentFund} />
          )}

          {activeTab === 'reports' && (
            <FinancialReports currentFund={currentFund} />
          )}

          {activeTab === 'search' && (
            <GlobalSearch 
              onOpenJev={(id, fund) => openJevModalFromFund(id, fund)} 
            />
          )}
        </main>
      </div>

      {/* Dynamic Sub-Ledger Entry Modal Portal */}
      {activeJevId !== null && (
        <JevDetailsModal
          jevId={activeJevId}
          fund={activeJevFund}
          onClose={() => setActiveJevId(null)}
        />
      )}
    </div>
  );
}
