import React, { useEffect, useState } from 'react';
import { Coins, BadgeAlert, CheckCircle, HelpCircle, ShieldAlert } from 'lucide-react';
import { FundId, Budget } from '../types';

interface BudgetMonitoringProps {
  currentFund: FundId;
}

export default function BudgetMonitoring({ currentFund }: BudgetMonitoringProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/budget-monitoring?fund=${currentFund}`)
      .then(res => res.json())
      .then(data => {
        setBudgets(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [currentFund]);

  const formatPHP = (val: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(val);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Title */}
      <div>
        <h3 className="text-2xl font-bold font-serif tracking-tight text-brand-navy">Budget Monitoring Sheet</h3>
        <p className="text-xs text-slate-500 font-semibold font-sans">Compliance oversight detailing legal appropriations, allotment orders, Obligations, and available balances</p>
      </div>

      {/* Overview Explanation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans leading-relaxed">
        <div className="bg-slate-55/60 border border-slate-200 rounded p-5 text-slate-800 flex gap-3.5">
          <CheckCircle className="w-5 h-5 text-brand-navy shrink-0 mt-0.5" />
          <div>
            <p className="font-serif font-bold text-sm text-brand-navy">Within Budget Allotment Guidance</p>
            <p className="text-slate-600 font-semibold mt-1">
              Available balance remains positive or zero. Obligations are fully covered by active allotment allocations. No restrictive actions taken.
            </p>
          </div>
        </div>
        <div className="bg-red-50/20 border border-red-150 rounded p-5 text-slate-800 flex gap-3.5">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-serif font-bold text-sm text-red-950">Over Budget - Restriction Required</p>
            <p className="text-slate-600 font-semibold mt-1">
              Cumulative obligations (expenditures) exceed allotments received + adjustments. Flagged for pre-audit immediate review.
            </p>
          </div>
        </div>
      </div>

      {/* Main Budget Sheet table */}
      <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-brand-navy border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400 font-mono font-bold">Querying local budget registers...</p>
          </div>
        ) : budgets.length === 0 ? (
          <div className="py-24 text-center text-slate-400 font-sans">
            <Coins className="w-12 h-12 mx-auto text-slate-200 mb-2.5" />
            <p className="text-sm font-semibold">No active budget definitions coded for this fund</p>
            <p className="text-xs text-slate-400">Initialize appropriations in your master config</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-brand-navy font-bold font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3.5 px-6 w-32">Account Code</th>
                  <th className="py-3.5 px-6">Account Title</th>
                  <th className="py-3.5 px-6 text-right w-36">Appropriation</th>
                  <th className="py-3.5 px-6 text-right w-36">Allotment Received</th>
                  <th className="py-3.5 px-6 text-right w-36">Adjustments</th>
                  <th className="py-3.5 px-6 text-right w-36">Obligations</th>
                  <th className="py-3.5 px-6 text-right w-36">Available Balance</th>
                  <th className="py-3.5 px-6 text-center w-28">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 font-medium text-slate-700">
                {budgets.map((b, idx) => {
                  const obligations = b.Obligations || 0;
                  const balance = b.Balance || 0;
                  const isOver = balance < 0;

                  return (
                    <tr 
                      key={idx} 
                      className={`hover:bg-slate-50/50 transition-colors border-l-4 ${
                        isOver ? 'border-l-red-500 bg-red-50/5' : 'border-l-brand-navy'
                      }`}
                    >
                      <td className="py-4 px-6 font-mono text-slate-900 font-extrabold">{b.AC}</td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-slate-800">{b.AC_Title || 'Budget Account'}</span>
                        <div className="text-[9px] font-mono text-slate-405 tracking-wider uppercase mt-1 font-semibold">Ref: {b.SARO_REF}</div>
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-slate-600 font-semibold">
                        {formatPHP(b.Appropriation)}
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-slate-600 font-semibold">
                        {formatPHP(b.Allotment_Received)}
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-slate-600 font-semibold">
                        {formatPHP(b.Allotment_Adjustment)}
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-brand-navy font-bold">
                        {formatPHP(obligations)}
                      </td>
                      <td className={`py-4 px-6 text-right font-mono font-extrabold text-[13px] ${
                        isOver ? 'text-red-750' : 'text-brand-navy'
                      }`}>
                        {formatPHP(balance)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {isOver ? (
                          <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 font-sans font-bold text-[9px] px-2 py-0.5 rounded border border-red-200 uppercase tracking-wide">
                            <BadgeAlert className="w-3 h-3 text-red-650" />
                            Over Budget
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 font-sans font-bold text-[9px] px-2 py-0.5 rounded border border-slate-200 uppercase tracking-wide">
                            <CheckCircle className="w-3 h-3 text-slate-500" />
                            On Track
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
