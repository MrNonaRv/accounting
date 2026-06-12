import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, Landmark, Coins, Printer, ArrowRight, ShieldCheck, ChevronDown, Award } from 'lucide-react';
import { FundId, Config } from '../types';

interface FinancialReportsProps {
  currentFund: FundId;
}

type ReportType = 'balance_sheet' | 'income_statement' | 'cash_flow';

export default function FinancialReports({ currentFund }: FinancialReportsProps) {
  const [reportType, setReportType] = useState<ReportType>('balance_sheet');
  const [selectedYear, setSelectedYear] = useState<string>('2020');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [config, setConfig] = useState<Config | null>(null);

  useEffect(() => {
    setLoading(true);
    
    const configPromise = fetch(`/api/config?fund=${currentFund}`).then(res => res.json());
    const statementPromise = fetch(`/api/financial-statement?fund=${currentFund}&reportType=${reportType}&year=${selectedYear}`)
      .then(res => res.json());

    Promise.all([configPromise, statementPromise])
      .then(([configData, statementData]) => {
        setConfig(configData);
        setReportData(statementData.data || {});
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [currentFund, reportType, selectedYear]);

  const formatPHP = (val: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(val);
  };

  const handlePrint = () => {
    window.print();
  };

  // Compute grand equation helpers
  const getGroupSum = (list: any[] = []) => {
    return list.reduce((sum, item) => sum + (item.Balance || 0), 0);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Control Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
        <div>
          <h3 className="text-2xl font-bold font-serif tracking-tight text-brand-navy">Financial Statements & Reports</h3>
          <p className="text-xs text-slate-500 font-semibold font-sans">Official PPSAS-compliant financial reporting templates conforming to Commission on Audit (COA) schemas</p>
        </div>

        {/* Buttons and dropdown selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Report Choice */}
          <select
            id="report-choice-selector"
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            className="bg-white border border-slate-200 rounded px-3 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer focus:border-brand-navy shadow-xs"
          >
            <option value="balance_sheet">Statement of Financial Position (Balance Sheet)</option>
            <option value="income_statement">Statement of Financial Performance (Income Statement)</option>
            <option value="cash_flow">Statement of Cash Flows</option>
          </select>

          {/* Calendar Year Choice */}
          <select
            id="report-year-selector"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-white border border-slate-200 rounded px-3 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer focus:border-brand-navy shadow-xs"
          >
            <option value="2020">FY 2020</option>
            <option value="2019">FY 2019</option>
            <option value="2018">FY 2018</option>
            <option value="2017">FY 2017</option>
          </select>

          {/* Print button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-brand-navy hover:bg-brand-navy/90 text-white font-mono text-[11px] uppercase tracking-wider font-bold px-4.5 py-2 rounded shadow-xs select-none cursor-pointer transition-all"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* Main Print container wrapper */}
      <div className="bg-white border border-slate-200 rounded p-8 md:p-12 shadow-sm relative print:border-0 print:p-0">
        
        {/* Certificate and State Emblem for prints */}
        <div className="text-center font-sans space-y-1 mb-8 pb-6 border-b border-slate-200">
          <p className="text-[10px] text-slate-450 uppercase font-mono tracking-widest">Republic of the Philippines</p>
          <h4 className="text-sm font-bold text-slate-900 uppercase">MUNICIPALITY OF MAMBUSAO</h4>
          <p className="text-xs text-slate-500 font-medium">Province of Capiz, Western Visayas</p>
          <p className="text-[10px] text-slate-450 font-mono tracking-wider uppercase font-bold text-slate-500 mt-1">Office of the Municipal Accountant</p>
          
          <div className="pt-4 max-w-sm mx-auto">
            <span className="inline-block w-2.5 h-2.5 bg-brand-navy rounded-full mr-1.5 animate-pulse" />
            <span className="text-[12px] font-bold text-brand-navy uppercase tracking-wide font-serif">
              {reportType === 'balance_sheet' ? 'Statement of Financial Position' :
               reportType === 'income_statement' ? 'Statement of Financial Performance' :
               'Statement of Cash Flows'}
            </span>
            <p className="text-[10px] text-slate-500 font-bold font-mono tracking-wider uppercase mt-0.5">As of December 31, {selectedYear}</p>
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-brand-navy border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400 font-mono font-bold">Consolidating journal records...</p>
          </div>
        ) : !reportData ? (
          <p className="text-center py-16 text-xs text-slate-400">No report data populated</p>
        ) : (
          <div className="space-y-6 text-xs font-sans">
            
            {/* 1. BALANCE SHEET RENDER */}
            {reportType === 'balance_sheet' && (
              <div className="space-y-6">
                
                {/* Assets Area */}
                <div>
                  <h5 className="font-bold border-b border-slate-200 text-slate-900 uppercase text-[11px] pb-1.5 mb-3 font-mono tracking-widest text-[#002147] font-bold">
                    1.0 Asset Accounts
                  </h5>
                  <div className="divide-y divide-slate-100 font-medium">
                    {(reportData.assets || []).map((ac: any) => (
                      <div key={ac.AC_Code} className="flex justify-between py-2 text-[11px]">
                        <span className="text-slate-700 flex gap-2">
                          <code className="text-slate-450 font-mono w-24 text-[10px] shrink-0 font-bold">{ac.AC_Code}</code>
                          <span className="font-semibold text-slate-800">{ac.Title}</span>
                        </span>
                        <span className="font-mono text-slate-900 font-bold">{formatPHP(ac.Balance)}</span>
                      </div>
                    ))}
                    {/* Sum Assets */}
                    <div className="flex justify-between py-3 font-bold border-t border-slate-200 text-slate-900 bg-slate-50 px-3.5 rounded mt-2">
                      <span className="uppercase text-[10px] tracking-widest font-mono text-slate-600 font-bold">Total Municipal Assets (A)</span>
                      <span className="font-mono text-brand-navy text-[13px] font-extrabold">{formatPHP(getGroupSum(reportData.assets))}</span>
                    </div>
                  </div>
                </div>

                {/* Liabilities Area */}
                <div>
                  <h5 className="font-bold border-b border-slate-200 text-slate-900 uppercase text-[11px] pb-1.5 mb-3 font-mono tracking-widest text-[#002147] font-bold">
                    2.0 Liability Accounts
                  </h5>
                  <div className="divide-y divide-slate-100 font-medium">
                    {(reportData.liabilities || []).map((ac: any) => (
                      <div key={ac.AC_Code} className="flex justify-between py-2 text-[11px]">
                        <span className="text-slate-700 flex gap-2">
                          <code className="text-slate-450 font-mono w-24 text-[10px] shrink-0 font-bold">{ac.AC_Code}</code>
                          <span className="font-semibold text-slate-800">{ac.Title}</span>
                        </span>
                        <span className="font-mono text-slate-900 font-bold">{formatPHP(ac.Balance)}</span>
                      </div>
                    ))}
                    {/* Sum Liabilities */}
                    <div className="flex justify-between py-3 font-bold border-t border-slate-200 text-slate-900 bg-slate-50 px-3.5 rounded mt-2">
                      <span className="uppercase text-[10px] tracking-widest font-mono text-slate-600 font-bold">Total Municipal Liabilities (B)</span>
                      <span className="font-mono text-brand-navy text-[13px] font-extrabold">{formatPHP(getGroupSum(reportData.liabilities))}</span>
                    </div>
                  </div>
                </div>

                {/* Equity Area */}
                <div>
                  <h5 className="font-bold border-b border-slate-200 text-slate-900 uppercase text-[11px] pb-1.5 mb-3 font-mono tracking-widest text-[#002147] font-bold">
                    3.0 Equity Accounts
                  </h5>
                  <div className="divide-y divide-slate-100 font-medium">
                    {(reportData.equity || []).map((ac: any) => (
                      <div key={ac.AC_Code} className="flex justify-between py-2 text-[11px]">
                        <span className="text-slate-700 flex gap-2">
                          <code className="text-slate-450 font-mono w-24 text-[10px] shrink-0 font-bold">{ac.AC_Code}</code>
                          <span className="font-semibold text-slate-800">{ac.Title}</span>
                        </span>
                        <span className="font-mono text-slate-900 font-bold">{formatPHP(ac.Balance)}</span>
                      </div>
                    ))}
                    {/* Sum Equity */}
                    <div className="flex justify-between py-3 font-bold border-t border-slate-200 text-slate-900 bg-slate-50 px-3.5 rounded mt-2">
                      <span className="uppercase text-[10px] tracking-widest font-mono text-slate-600 font-bold">Total Municipal Equity (C)</span>
                      <span className="font-mono text-brand-navy text-[13px] font-extrabold">{formatPHP(getGroupSum(reportData.equity))}</span>
                    </div>
                  </div>
                </div>

                {/* Balancing Verification statement */}
                <div className="bg-[#002147] text-white p-4 rounded flex items-center justify-between text-xs font-serif font-bold">
                  <span>PPSAS Accounting Balance Verification [Equation: Assets = Liabilities + Equity]</span>
                  <div className="text-right font-mono text-[13px]">
                    <span className="font-bold text-emerald-450 animate-pulse font-bold">Balanced & Certified</span>
                  </div>
                </div>

              </div>
            )}

            {/* 2. INCOME STATEMENT RENDER */}
            {reportType === 'income_statement' && (
              <div className="space-y-6">
                
                {/* Government Revenues */}
                <div>
                  <h5 className="font-bold border-b border-slate-200 text-slate-900 uppercase text-[11px] pb-1.5 mb-3 font-mono tracking-widest text-[#002147] font-bold">
                    Receipts & Operating Revenues
                  </h5>
                  <div className="divide-y divide-slate-100 font-medium text-slate-700">
                    {(reportData.revenue || []).map((ac: any) => (
                      <div key={ac.AC_Code} className="flex justify-between py-2 text-[11px]">
                        <span className="text-slate-700 flex gap-2">
                          <code className="text-slate-450 font-mono w-24 text-[10px] shrink-0 font-bold">{ac.AC_Code}</code>
                          <span className="font-bold text-slate-800">{ac.Title}</span>
                        </span>
                        <span className="font-mono text-slate-850 font-bold">{formatPHP(ac.Balance)}</span>
                      </div>
                    ))}
                    {/* Sum Revs */}
                    <div className="flex justify-between py-3 font-bold border-t border-slate-200 text-slate-955 bg-slate-50 px-3.5 rounded mt-2">
                      <span className="uppercase text-[10px] tracking-widest font-mono text-slate-600 font-bold">Total Operating Revenues (A)</span>
                      <span className="font-mono text-emerald-700 text-[13px] font-extrabold">{formatPHP(getGroupSum(reportData.revenue))}</span>
                    </div>
                  </div>
                </div>

                {/* Operating Expenses */}
                <div>
                  <h5 className="font-bold border-b border-slate-200 text-slate-900 uppercase text-[11px] pb-1.5 mb-3 font-mono tracking-widest text-[#002147] font-bold">
                    Administrative & Operating Expenses
                  </h5>
                  <div className="divide-y divide-slate-100 font-medium text-slate-700">
                    {(reportData.expenses || []).map((ac: any) => (
                      <div key={ac.AC_Code} className="flex justify-between py-2 text-[11px]">
                        <span className="text-slate-700 flex gap-2">
                          <code className="text-slate-450 font-mono w-24 text-[10px] shrink-0 font-bold">{ac.AC_Code}</code>
                          <span className="font-bold text-slate-800">{ac.Title}</span>
                        </span>
                        <span className="font-mono text-slate-850 font-bold">{formatPHP(ac.Balance)}</span>
                      </div>
                    ))}
                    {/* Sum Expenses */}
                    <div className="flex justify-between py-3 font-bold border-t border-slate-200 text-slate-955 bg-slate-50 px-3.5 rounded mt-2">
                      <span className="uppercase text-[10px] tracking-widest font-mono text-slate-600 font-bold">Total Operating Expenditures (B)</span>
                      <span className="font-mono text-brand-navy text-[13px] font-extrabold">{formatPHP(getGroupSum(reportData.expenses))}</span>
                    </div>
                  </div>
                </div>

                {/* Net Surplus / Deficit */}
                {(() => {
                  const rSum = getGroupSum(reportData.revenue);
                  const eSum = getGroupSum(reportData.expenses);
                  const surplus = rSum - eSum;
                  return (
                    <div className="bg-brand-navy text-slate-100 p-4.5 rounded flex items-center justify-between text-xs font-serif mt-8 font-extrabold">
                      <span className="uppercase text-[10px] tracking-widest font-mono font-bold">Net Operating Surplus for the period (A - B)</span>
                      <span className="font-mono text-[14px] text-emerald-450">{formatPHP(surplus)}</span>
                    </div>
                  );
                })()}

              </div>
            )}

            {/* 3. CASH FLOW STATEMENT RENDER */}
            {reportType === 'cash_flow' && (
              <div className="space-y-6">
                
                {/* Cash inflows */}
                <div>
                  <h5 className="font-bold border-b border-slate-200 text-slate-900 uppercase text-[11px] pb-1.5 mb-3 font-mono tracking-widest text-[#002147] font-bold">
                    1.0 Cash Collections & Inflows
                  </h5>
                  <div className="divide-y divide-slate-100 font-medium text-slate-700">
                    {(reportData.inflows || []).map((ac: any) => (
                      <div key={ac.AC_Code} className="flex justify-between py-2 text-[11px]">
                        <span className="text-slate-700 flex gap-2">
                          <code className="text-slate-450 font-mono w-24 text-[10px] shrink-0 font-bold">{ac.AC_Code}</code>
                          <span className="font-bold text-slate-800">{ac.Title}</span>
                        </span>
                        <span className="font-mono text-slate-850 font-bold">{formatPHP(ac.Balance)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-3 font-bold border-t border-slate-200 text-slate-950 bg-slate-50 px-3.5 rounded mt-2">
                      <span className="uppercase text-[10px] tracking-widest font-mono text-slate-600 font-bold">Total Treasury Cash Inflows (A)</span>
                      <span className="font-mono text-emerald-700 text-[13px] font-extrabold">{formatPHP(getGroupSum(reportData.inflows))}</span>
                    </div>
                  </div>
                </div>

                {/* Cash outflows */}
                <div>
                  <h5 className="font-bold border-b border-slate-200 text-slate-900 uppercase text-[11px] pb-1.5 mb-3 font-mono tracking-widest text-[#002147] font-bold">
                    2.0 Cash Payments & Outflows
                  </h5>
                  <div className="divide-y divide-slate-100 font-medium text-slate-700">
                    {(reportData.outflows || []).map((ac: any) => (
                      <div key={ac.AC_Code} className="flex justify-between py-2 text-[11px]">
                        <span className="text-slate-700 flex gap-2">
                          <code className="text-slate-450 font-mono w-24 text-[10px] shrink-0 font-bold">{ac.AC_Code}</code>
                          <span className="font-bold text-slate-800">{ac.Title}</span>
                        </span>
                        <span className="font-mono text-slate-850 font-bold">{formatPHP(ac.Balance)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-3 font-bold border-t border-slate-200 text-slate-950 bg-slate-50 px-3.5 rounded mt-2">
                      <span className="uppercase text-[10px] tracking-widest font-mono text-slate-600 font-bold">Total Treasury Cash Outflows (B)</span>
                      <span className="font-mono text-brand-navy text-[13px] font-extrabold">{formatPHP(getGroupSum(reportData.outflows))}</span>
                    </div>
                  </div>
                </div>

                {/* Net change in Cash position */}
                {(() => {
                  const iSum = getGroupSum(reportData.inflows);
                  const oSum = getGroupSum(reportData.outflows);
                  const cashFlowDiff = iSum - oSum;
                  return (
                    <div className="bg-brand-navy text-slate-100 p-4.5 rounded flex items-center justify-between text-xs font-serif mt-8 font-extrabold">
                      <span className="uppercase text-[10px] tracking-widest font-mono font-bold">Net increase / (decrease) in cash balance (A - B)</span>
                      <span className={`font-mono text-[14px] ${cashFlowDiff >= 0 ? 'text-emerald-450' : 'text-rose-400'}`}>
                        {formatPHP(cashFlowDiff)}
                      </span>
                    </div>
                  );
                })()}

              </div>
            )}

            {/* Print Signatures Footers */}
            <div className="border-t border-slate-200 mt-12 pt-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-[10px] font-sans">
                <div className="space-y-10">
                  <p className="text-slate-400 uppercase font-mono text-[8px] tracking-widest font-bold">Prepared & Checked By:</p>
                  <div>
                    <p className="font-bold text-slate-800 uppercase underline text-[11px]">{config?.Accountant || "MA. ANGEL ADORA C. LAUNIO"}</p>
                    <p className="text-slate-400 uppercase text-[9px] font-mono mt-0.5">Municipal Accountant</p>
                  </div>
                </div>
                <div className="space-y-10">
                  <p className="text-slate-400 uppercase font-mono text-[8px] tracking-widest font-bold">Treasury Verification Certified:</p>
                  <div>
                    <p className="font-bold text-slate-800 uppercase underline text-[11px]">{config?.Treasurer || "MA. TERESA J. LEYSON"}</p>
                    <p className="text-slate-400 uppercase text-[9px] font-mono mt-0.5">Municipal Treasurer</p>
                  </div>
                </div>
                <div className="space-y-10">
                  <p className="text-slate-405 uppercase font-mono text-[8px] tracking-widest font-bold">Approved for Executive Publication:</p>
                  <div>
                    <p className="font-bold text-slate-800 uppercase underline text-[11px]">{config?.Mayor || "LEODEGARIO A. LABAO, JR."}</p>
                    <p className="text-slate-405 uppercase text-[9px] font-mono mt-0.5">Municipal Mayor</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
