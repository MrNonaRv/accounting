import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  ListOrdered, 
  Building2, 
  Coins, 
  Scale, 
  FileSpreadsheet, 
  Search, 
  Shield, 
  CircleDot, 
  LogOut,
  Building
} from 'lucide-react';
import { FundId, FUNDS } from '../types';

interface SidebarProps {
  currentFund: FundId;
  setCurrentFund: (fund: FundId) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: 'admin' | 'viewer';
  setUserRole: (role: 'admin' | 'viewer') => void;
}

export default function Sidebar({
  currentFund,
  setCurrentFund,
  activeTab,
  setActiveTab,
  userRole,
  setUserRole
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'jev', label: 'JEV Registry', icon: BookOpen },
    { id: 'coa', label: 'Chart of Accounts', icon: ListOrdered },
    { id: 'rc', label: 'Responsibility Centers', icon: Building2 },
    { id: 'budget', label: 'Budget Monitoring', icon: Coins },
    { id: 'trial', label: 'Trial Balance', icon: Scale },
    { id: 'reports', label: 'Financial Reports', icon: FileSpreadsheet },
    { id: 'search', label: 'Global Search', icon: Search }
  ];

  return (
    <aside className="w-80 h-screen bg-brand-navy text-white flex flex-col fixed left-0 top-0 border-r border-[#00132c] z-10 transition-all duration-300">
      {/* Header / Brand */}
      <div className="p-6 pb-8 border-b border-white/10 bg-black/15">
        <div className="font-serif text-[24px] font-bold text-white border-l-4 border-white pl-4 tracking-wide leading-tight select-none">
          LGU-MAMBUSAO
        </div>
      </div>

      {/* Fund Selector */}
      <div className="p-5 border-b border-white/10 bg-black/5">
        <label className="block text-[10px] uppercase tracking-widest font-mono text-white/60 mb-2 font-bold">
          Select Active Fund
        </label>
        <div className="relative">
          <select
            id="fund-selector"
            value={currentFund}
            onChange={(e) => setCurrentFund(e.target.value as FundId)}
            className="w-full bg-[#001733] text-white border border-white/15 text-xs rounded px-3 py-2.5 outline-none focus:border-white/40 cursor-pointer transition-all appearance-none pr-10 font-medium font-sans"
          >
            {FUNDS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/60">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Navigation menu */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
        <span className="px-3 text-[10px] uppercase font-mono tracking-widest text-white/50 block mb-3 font-bold">
          Accounting Modules
        </span>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded text-xs font-semibold tracking-wide transition-all duration-150 ${
                isActive
                  ? 'bg-white/15 text-white border-l-2 border-slate-350 bg-white/15'
                  : 'text-white/75 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-white/60'}`} />
              <span>{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1 h-1 bg-white rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Role / Auth profile selector */}
      <div className="p-4 border-t border-white/10 bg-black/20 mt-auto">
        <div className="flex items-center justify-between gap-2 p-2 bg-black/10 rounded border border-white/5">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded ${userRole === 'admin' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-100">
                {userRole === 'admin' ? 'Administrator' : 'Auditor (Viewer)'}
              </p>
              <p className="text-[9px] font-mono text-white/40 uppercase tracking-widest">
                Active Shell
              </p>
            </div>
          </div>
          <button
            id="role-switch-btn"
            onClick={() => setUserRole(userRole === 'admin' ? 'viewer' : 'admin')}
            className="text-[9px] font-bold bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white tracking-wide select-none cursor-pointer transition-all"
          >
            Switch
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-white/40 px-1 font-mono">
          <span>PPSAS COMPLIANT v1.0</span>
          <span className="flex items-center gap-1 font-semibold">
            <CircleDot className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
            Secure
          </span>
        </div>
      </div>
    </aside>
  );
}
