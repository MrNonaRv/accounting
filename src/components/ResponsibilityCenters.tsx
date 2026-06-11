import React, { useEffect, useState } from 'react';
import { Building2, Landmark, DollarSign, FileText, ArrowLeft, BookOpen, Clock } from 'lucide-react';
import { FundId, RC, JEV } from '../types';

interface ResponsibilityCentersProps {
  currentFund: FundId;
  onOpenJev: (id: number) => void;
}

export default function ResponsibilityCenters({ currentFund, onOpenJev }: ResponsibilityCentersProps) {
  const [centers, setCenters] = useState<RC[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Drilldown Slate
  const [selectedRC, setSelectedRC] = useState<RC | null>(null);
  const [drilldownJevs, setDrilldownJevs] = useState<JEV[]>([]);
  const [drilldownLoading, setDrilldownLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setSelectedRC(null); // Reset drilldown on fund change
    
    fetch(`/api/responsibility-centers?fund=${currentFund}`)
      .then(res => res.json())
      .then(data => {
        setCenters(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [currentFund]);

  const handleCenterClick = (rc: RC) => {
    setSelectedRC(rc);
    setDrilldownLoading(true);
    fetch(`/api/responsibility-centers/${rc.RC_Code}/jevs?fund=${currentFund}`)
      .then(res => res.json())
      .then(data => {
        setDrilldownJevs(data.jevs || []);
        setDrilldownLoading(false);
      })
      .catch(err => {
        console.error(err);
        setDrilldownLoading(false);
      });
  };

  const formatPHP = (val: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(val);
  };

  const parseHumanDate = (dateStr: string) => {
    try {
      if (!dateStr) return '';
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const dObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return dObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-brand-navy border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-mono font-bold">Querying responsibility centers...</p>
      </div>
    );
  }

  // Drilldown View
  if (selectedRC) {
    return (
      <div className="space-y-6">
        
        {/* Back Button and Office Meta */}
        <div className="flex items-center gap-3.5">
          <button
            id="back-rc-list-btn"
            onClick={() => setSelectedRC(null)}
            className="p-2 border border-slate-200 hover:bg-slate-50 bg-white rounded hover:shadow-xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-650" />
          </button>
          <div>
            <h3 className="text-2xl font-bold font-serif text-brand-navy tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-navy" />
              Responsibility Center: {selectedRC.Description}
            </h3>
            <p className="text-xs text-slate-500 font-semibold font-sans">
              Office Code: <strong className="font-mono text-slate-800">{selectedRC.RC_Code}</strong> &bull; Office Class: <strong className="text-brand-navy">{selectedRC.Classification}</strong>
            </p>
          </div>
        </div>

        {/* Info Grid summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 border border-slate-200 p-5 rounded text-xs font-sans">
          <div>
            <span className="text-slate-400 block font-mono text-[9px] uppercase tracking-wider font-bold">Office Core Assignment</span>
            <span className="font-bold text-brand-navy text-[13px] mt-1.5 block">{selectedRC.Office}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-mono text-[9px] uppercase tracking-wider font-bold">Primary Functions & Programs</span>
            <span className="font-bold text-slate-750 text-[12px] mt-1.5 block">{selectedRC.FunctionProgramProject}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-mono text-[9px] uppercase tracking-wider font-bold">Consolidated Disbursements</span>
            <span className="font-bold text-brand-navy text-[14px] mt-1.5 block font-mono">
              {formatPHP(selectedRC.TotalDisbursements || 0)}
            </span>
          </div>
        </div>

        {/* Associated JEVs list */}
        <div className="bg-white border border-slate-200 rounded overflow-hidden shadow-xs">
          <div className="px-6 py-5 border-b border-slate-150">
            <h4 className="text-base font-bold font-serif text-brand-navy">Voucher Audit Log</h4>
            <p className="text-xs text-slate-405 font-semibold mt-0.5">Transactions referencing cost group {selectedRC.RC_Code}</p>
          </div>

          {drilldownLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-brand-navy border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400 font-mono">Loading records...</p>
            </div>
          ) : drilldownJevs.length === 0 ? (
            <div className="py-16 text-center text-slate-400 font-sans">
              <BookOpen className="w-10 h-10 mx-auto text-slate-200 mb-2.5" />
              <p className="text-xs">No ledger entries debited or credited to this department center</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-brand-navy font-bold font-mono text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-6">Voucher Number</th>
                    <th className="py-3 px-6">Record Date</th>
                    <th className="py-3 px-6">Voucher Type</th>
                    <th className="py-3 px-6">Transaction Payee</th>
                    <th className="py-3 px-6 text-right">Debit Total</th>
                    <th className="py-3 px-6 text-right">Credit Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 font-medium">
                  {drilldownJevs.map(j => (
                    <tr 
                      key={j.JEV_ID}
                      onClick={() => onOpenJev(j.JEV_ID)}
                      className="hover:bg-slate-50/70 cursor-pointer border-l-2 border-l-transparent hover:border-l-brand-navy transition-all group"
                    >
                      <td className="py-3.5 px-6 font-mono text-brand-navy font-bold group-hover:underline">
                        {j.JEV_Number}
                      </td>
                      <td className="py-3.5 px-6 text-slate-505 font-mono text-[11px]">
                        {parseHumanDate(j.Date)}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className={`inline-flex items-center px-1.8 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                          j.JEV_Type === 'Collection' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                          'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}>
                          {j.JEV_Type}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <div>
                          <p className="text-slate-800 font-semibold">{j.Payee || 'Revenue'}</p>
                          <p className="text-[10px] text-slate-400 font-normal max-w-sm truncate">{j.Description}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono font-semibold text-slate-700">
                        {formatPHP(j.TotalDebit || 0)}
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono font-semibold text-slate-700">
                        {formatPHP(j.TotalCredit || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    );
  }

  // Master Grid list
  return (
    <div className="space-y-6">
      
      {/* Visual titles */}
      <div>
        <h3 className="text-2xl font-bold font-serif tracking-tight text-brand-navy">Responsibility Centers (RC)</h3>
        <p className="text-xs text-slate-500 font-semibold font-sans">LGU offices, agencies, and operational programs accountable for local budget allocations</p>
      </div>

      {/* Responsibility Centers list Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
        {centers.map(rc => (
          <div
            key={rc.RC_Code}
            id={`rc-card-${rc.RC_Code}`}
            onClick={() => handleCenterClick(rc)}
            className="bg-white border border-slate-200 hover:border-slate-300 rounded p-6 shadow-xs transition-all cursor-pointer hover:shadow-sm select-none relative group"
          >
            <div className="absolute top-4 right-4 text-[9px] font-mono uppercase tracking-widest font-bold text-slate-400 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded">
              RC: {rc.RC_Code}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-50 rounded text-brand-navy border border-slate-100">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs tracking-tight line-clamp-1 group-hover:text-brand-navy transition-colors">
                    {rc.Description}
                  </h4>
                  <p className="text-[10px] text-slate-405 mt-0.5 font-semibold">{rc.Classification}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-150 pt-3 text-xs leading-normal">
                <div>
                  <span className="text-slate-400 text-[10px] block font-bold">Unique Vouchers</span>
                  <span className="font-bold text-slate-800 block mt-0.5 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    {rc.JEVCount || 0}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-bold">Disbursed Total</span>
                  <span className="font-bold text-brand-navy block mt-0.5 font-mono">
                    {formatPHP(rc.TotalDisbursements || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
