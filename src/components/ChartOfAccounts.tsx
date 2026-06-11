import React, { useEffect, useState } from 'react';
import { Search, Info, ListOrdered, Landmark, TrendingUp, HelpCircle } from 'lucide-react';
import { FundId, AC } from '../types';

interface ChartOfAccountsProps {
  currentFund: FundId;
}

export default function ChartOfAccounts({ currentFund }: ChartOfAccountsProps) {
  const [accounts, setAccounts] = useState<AC[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchAccounts = () => {
    setLoading(true);
    fetch(`/api/accounts?fund=${currentFund}&search=${encodeURIComponent(search)}`)
      .then(res => res.json())
      .then(data => {
        setAccounts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAccounts();
  }, [currentFund, search]);

  const formatPHP = (val: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(val);
  };

  return (
    <div className="space-y-6">
      
      {/* Header and description */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold font-serif tracking-tight text-brand-navy">Chart of Accounts (COA)</h3>
          <p className="text-xs text-slate-500 font-semibold font-sans">Standard government accounts catalog regulated by Commission on Audit (COA)</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            id="coa-search-input"
            type="text"
            placeholder="Search code or account name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-250 text-xs pl-9 pr-3 py-2.5 rounded outline-none focus:border-brand-navy text-slate-800 shadow-xs font-semibold"
          />
        </div>
      </div>

      {/* Information Banner explanation */}
      <div className="bg-slate-55/60 border border-slate-200 rounded p-5 text-slate-800 flex items-start gap-4 text-xs font-sans">
        <Info className="w-5 h-5 text-brand-navy shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-sm text-brand-navy font-serif">Commission on Audit (COA) Running Balance Computation</p>
          <p className="leading-relaxed text-slate-600 font-semibold">
            Accumulated running balances are computed automatically from JEV ledgers:
            <br />
            &bull; Accounts with <strong className="text-brand-navy">Debit (DR)</strong> Nature: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-[10px] text-brand-navy">Total Debit - Total Credit</code>
            <br />
            &bull; Accounts with <strong className="text-brand-navy">Credit (CR)</strong> Nature: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-[10px] text-brand-navy">Total Credit - Total Debit</code>
          </p>
        </div>
      </div>

      {/* Accounts List Table */}
      <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-brand-navy border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400 font-mono font-bold">Querying chart codes...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="py-24 text-center text-slate-400 font-sans space-y-2">
            <ListOrdered className="w-12 h-12 mx-auto text-slate-200" />
            <p className="text-sm font-semibold">No accounts found matching search keyword</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-brand-navy font-bold font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3.5 px-6 w-36">Account Code</th>
                  <th className="py-3.5 px-6">Account Title</th>
                  <th className="py-3.5 px-6 w-28">Booking Nature</th>
                  <th className="py-3.5 px-6 w-40">Balance Sheet Class</th>
                  <th className="py-3.5 px-6 w-40">Income Statement</th>
                  <th className="py-3.5 px-6 text-right w-44">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 font-medium">
                {accounts.map((a) => {
                  const bal = a.RunningBalance || 0;
                  return (
                    <tr key={a.AC_Code} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-mono text-slate-900 font-extrabold text-[12px]">
                        {a.AC_Code}
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-slate-800 font-bold">{a.Title}</span>
                        {a.CashflowCategory && (
                          <div className="text-[9px] text-slate-405 mt-1 font-mono tracking-wider font-semibold uppercase">
                            Cashflow: {a.CashflowCategory}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                          a.Nature === 'Debit' ? 'bg-indigo-50 text-indigo-700 border border-indigo-110' : 'bg-pink-50 text-pink-700 border border-pink-110'
                        }`}>
                          {a.Nature}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-extrabold">
                        {a.BalanceSheetCategory || <span className="text-slate-350 font-normal italic">Non-BS</span>}
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-extrabold">
                        {a.IncomeStatementCategory || <span className="text-slate-350 font-normal italic">Non-IS</span>}
                      </td>
                      <td className={`py-4 px-6 text-right font-mono text-[13px] font-bold ${
                        bal < 0 ? 'text-red-750' : bal > 0 ? 'text-brand-navy' : 'text-slate-400'
                      }`}>
                        {formatPHP(bal)}
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
