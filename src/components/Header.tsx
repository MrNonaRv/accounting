import React, { useEffect, useState } from 'react';
import { Building, Award, User, Calendar } from 'lucide-react';
import { FundId, FUNDS, Config } from '../types';

interface HeaderProps {
  currentFund: FundId;
}

export default function Header({ currentFund }: HeaderProps) {
  const [config, setConfig] = useState<Config | null>(null);

  useEffect(() => {
    fetch(`/api/config?fund=${currentFund}`)
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error(err));
  }, [currentFund]);

  const activeFundName = FUNDS.find(f => f.id === currentFund)?.name || "LGU Fund";

  // Formatted date
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="bg-white border-b border-slate-250 py-5 px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-0">
      {/* Mambusao LGU Info */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-wider font-mono font-bold px-2 py-0.5 bg-brand-navy text-white rounded uppercase">
            PHILIPPINES
          </span>
          <span className="text-[10px] tracking-wider font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-250 uppercase">
            PPSAS COMPLIANT
          </span>
        </div>
        <h2 className="text-2xl font-bold font-serif tracking-tight text-brand-navy mt-1.5">
          {config?.Municipality || "Municipality of Mambusao"}
        </h2>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
          <Building className="w-3.5 h-3.5 text-slate-400" />
          {config?.Province || "Province of Capiz"} &bull; <span className="text-brand-navy">{activeFundName}</span>
        </p>
      </div>

      {/* Authorized Officers Overview */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] font-sans border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 w-full md:w-auto">
        {/* Accountant Card */}
        <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2.5 rounded shadow-xs">
          <div className="p-1.5 bg-slate-100 rounded text-slate-700">
            <User className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-800 font-sans">{config?.Accountant || "MA. ANGEL ADORA C. LAUNIO"}</p>
            <p className="text-[9px] text-slate-400 uppercase font-mono tracking-wider font-semibold">Municipal Accountant</p>
          </div>
        </div>

        {/* Mayor Card */}
        <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2.5 rounded shadow-xs">
          <div className="p-1.5 bg-brand-navy/5 rounded text-brand-navy">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-800 font-sans">{config?.Mayor || "LEODEGARIO A. LABAO, JR."}</p>
            <p className="text-[9px] text-slate-400 uppercase font-mono tracking-wider font-semibold font-serif">Municipal Mayor</p>
          </div>
        </div>

        {/* Date tracker */}
        <div className="hidden lg:flex items-center gap-3 bg-white border border-slate-200 px-4 py-2.5 rounded shadow-xs">
          <div className="p-1.5 bg-slate-100 rounded text-slate-600">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-800 font-sans capitalize">{currentDate}</p>
            <p className="text-[9px] text-slate-400 uppercase font-mono tracking-wider font-semibold">System Date</p>
          </div>
        </div>
      </div>
    </header>
  );
}
