import React, { useEffect, useState } from 'react';
import { Scale, Calendar, HelpCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { FundId, AC } from '../types';

interface TrialBalanceProps {
  currentFund: FundId;
}

export default function TrialBalance({ currentFund }: TrialBalanceProps) {
  const [accounts, setAccounts] = useState<AC[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [selectedYear, setSelectedYear] = useState<string>('2020');
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    let url = `/api/trial-balance?fund=${currentFund}&year=${selectedYear}`;
    if (selectedMonth) {
      url += `&month=${selectedMonth}`;
    }

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setAccounts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [currentFund, selectedYear, selectedMonth]);

  // Compute overall running balances for matching debits vs credits
  const totalDebitSum = accounts.reduce((sum, item: any) => sum + (item.TotalDebit || 0), 0);
  const totalCreditSum = accounts.reduce((sum, item: any) => sum + (item.TotalCredit || 0), 0);
  const isBalanced = Math.abs(totalDebitSum - totalCreditSum) < 0.1;

  // Group accounts by categories:
  // BS (Assets, Liabilities, Equity)
  // IS (Revenue, Expenses)
  const balanceSheetAccounts = accounts.filter(a => a.BalanceSheetCategory && ['Assets', 'Liabilities', 'Equity'].includes(a.BalanceSheetCategory));
  const incomeStatementAccounts = accounts.filter(a => a.IncomeStatementCategory && ['Revenue', 'Expenses'].includes(a.IncomeStatementCategory));

  const formatPHP = (val: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(val);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header filter layout */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Post-Audit Trial Balance</h3>
          <p className="text-xs text-slate-500 font-medium font-sans">Dynamic ledger balances verifying the algebraic equality of total debit and credit postings</p>
        </div>

        {/* Date parameters */}
        <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 px-3 py-2 rounded-lg shadow-xs text-xs font-sans">
          <Calendar className="w-4 h-4 text-slate-450" />
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Year:</span>
            <select
              id="trial-year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-slate-50 border border-slate-100 rounded px-2.1 py-1 font-bold text-slate-700 cursor-pointer outline-none focus:border-blue-500"
            >
              <option value="2020">FY 2020</option>
              <option value="2019">FY 2019</option>
              <option value="2018">FY 2018</option>
              <option value="2017">FY 2017</option>
            </select>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Month:</span>
            <select
              id="trial-month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-50 border border-slate-100 rounded px-2.1 py-1 font-bold text-slate-700 cursor-pointer outline-none focus:border-blue-500"
            >
              <option value="">Full Year (Jan-Dec)</option>
              <option value="01">January</option>
              <option value="02">February</option>
              <option value="03">March</option>
              <option value="04">April</option>
              <option value="05">May</option>
              <option value="06">June</option>
              <option value="07">July</option>
              <option value="08">August</option>
              <option value="09">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit state Banner */}
      <div className={`p-4 rounded-xl flex items-center justify-between gap-4 border text-xs ${
        isBalanced ? 'bg-emerald-50 border-emerald-250 text-emerald-800' : 'bg-red-50 border-red-250 text-red-800'
      }`}>
        <div className="flex items-center gap-3">
          {isBalanced ? (
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <div>
            <p className="font-bold">
              {isBalanced ? 'Trial Balance Ledger Mathematically Confirmed' : 'Trial balance mismatch notice'}
            </p>
            <p className={`mt-0.5 font-medium ${isBalanced ? 'text-emerald-650' : 'text-red-650'}`}>
              Cumulative DR: <strong className="font-mono">{formatPHP(totalDebitSum)}</strong> &bull; Cumulative CR: <strong className="font-mono">{formatPHP(totalCreditSum)}</strong>
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex text-[9px] font-mono font-bold uppercase tracking-wider bg-white px-2 py-1 border border-slate-100 rounded">
          {isBalanced ? 'Matched (0.00 offset)' : 'Correction Pending'}
        </span>
      </div>

      {/* Trial Sheets render */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400 font-mono font-bold">Summing trial equations...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="py-24 text-center text-slate-400 font-sans">
            <Scale className="w-12 h-12 mx-auto text-slate-200 mb-2" />
            <p className="text-sm font-semibold">No balances loaded inside the selected periods</p>
            <p className="text-xs text-slate-400">Perform voucher allocations to fill this worksheet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3.5 px-6 w-32">Account Code</th>
                  <th className="py-3.5 px-6">Account Title</th>
                  <th className="py-3.5 px-6 w-36">Nature Classification</th>
                  <th className="py-3.5 px-6 text-right w-40">Debit Summary (Dr.)</th>
                  <th className="py-3.5 px-6 text-right w-40">Credit Summary (Cr.)</th>
                  <th className="py-3.5 px-6 text-right w-40">Calculated Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                
                {/* 1. BALANCE SHEET GROUP */}
                {balanceSheetAccounts.length > 0 && (
                  <>
                    <tr className="bg-slate-100/60 font-bold border-y border-slate-200">
                      <td colSpan={6} className="py-2.5 px-6 text-[10px] font-mono tracking-widest text-slate-500 uppercase">
                        Section A: Balance Sheet Accounts (PPSAS Core)
                      </td>
                    </tr>
                    {balanceSheetAccounts.map((a: any) => (
                      <tr key={a.AC_Code} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-6 font-mono text-slate-900 font-extrabold">{a.AC_Code}</td>
                        <td className="py-3.5 px-6 font-semibold text-slate-800">{a.Title}</td>
                        <td className="py-3.5 px-6 text-slate-500 text-[11px] font-medium leading-none">
                          {a.BalanceSheetCategory} &bull; <span className="font-mono text-[9px] uppercase font-bold">{a.Nature}</span>
                        </td>
                        <td className="py-3.5 px-6 text-right font-mono text-slate-650">
                          {a.TotalDebit > 0 ? formatPHP(a.TotalDebit) : '-'}
                        </td>
                        <td className="py-3.5 px-6 text-right font-mono text-slate-650">
                          {a.TotalCredit > 0 ? formatPHP(a.TotalCredit) : '-'}
                        </td>
                        <td className="py-3.5 px-6 text-right font-mono text-slate-900 font-bold">
                          {formatPHP(a.Balance || 0)}
                        </td>
                      </tr>
                    ))}
                  </>
                )}

                {/* 2. INCOME STATEMENT GROUP */}
                {incomeStatementAccounts.length > 0 && (
                  <>
                    <tr className="bg-slate-100/60 font-bold border-y border-slate-200">
                      <td colSpan={6} className="py-2.5 px-6 text-[10px] font-mono tracking-widest text-slate-500 uppercase">
                        Section B: Income Statement Accounts (Performance)
                      </td>
                    </tr>
                    {incomeStatementAccounts.map((a: any) => (
                      <tr key={a.AC_Code} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-6 font-mono text-slate-900 font-extrabold">{a.AC_Code}</td>
                        <td className="py-3.5 px-6 font-semibold text-slate-800">{a.Title}</td>
                        <td className="py-3.5 px-6 text-slate-500 text-[11px] font-medium leading-none">
                          {a.IncomeStatementCategory} &bull; <span className="font-mono text-[9px] uppercase font-bold">{a.Nature}</span>
                        </td>
                        <td className="py-3.5 px-6 text-right font-mono text-slate-655">
                          {a.TotalDebit > 0 ? formatPHP(a.TotalDebit) : '-'}
                        </td>
                        <td className="py-3.5 px-6 text-right font-mono text-slate-655">
                          {a.TotalCredit > 0 ? formatPHP(a.TotalCredit) : '-'}
                        </td>
                        <td className="py-3.5 px-6 text-right font-mono text-slate-900 font-bold">
                          {formatPHP(a.Balance || 0)}
                        </td>
                      </tr>
                    ))}
                  </>
                )}

                {/* Total algebra double verification matching */}
                <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-350 text-[13px]">
                  <td colSpan={3} className="py-4 px-6 text-right text-[10px] uppercase font-mono tracking-wider text-slate-600">
                    Grand Reconciled Sum
                  </td>
                  <td className="py-4 px-6 text-right font-mono text-blue-700">
                    {formatPHP(totalDebitSum)}
                  </td>
                  <td className="py-4 px-6 text-right font-mono text-blue-700">
                    {formatPHP(totalCreditSum)}
                  </td>
                  <td className="py-4 px-6 text-right font-mono text-emerald-850">
                    {formatPHP(Math.abs(totalDebitSum - totalCreditSum))}
                  </td>
                </tr>

              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
