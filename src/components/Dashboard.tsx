import React, { useEffect, useState } from 'react';
import { 
  DollarSign, 
  Receipt, 
  Users, 
  FileSpreadsheet, 
  CalendarRange, 
  ArrowUpRight, 
  BookOpen,
  ArrowRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { FundId, SummaryCards, JEV, MonthlyTrend } from '../types';

interface DashboardProps {
  currentFund: FundId;
  onOpenJev: (id: number) => void;
}

export default function Dashboard({ currentFund, onOpenJev }: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SummaryCards | null>(null);
  const [trend, setTrend] = useState<MonthlyTrend[]>([]);
  const [recentJevs, setRecentJevs] = useState<JEV[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('2020');

  useEffect(() => {
    setLoading(true);

    const summaryPromise = fetch(`/api/summary?fund=${currentFund}`).then(res => res.json());
    const trendPromise = fetch(`/api/monthly-trend?fund=${currentFund}&year=${selectedYear}`).then(res => res.json());
    const registryPromise = fetch(`/api/jev-registry?fund=${currentFund}&limit=10`).then(res => res.json());

    Promise.all([summaryPromise, trendPromise, registryPromise])
      .then(([summaryData, trendData, registryData]) => {
        setSummary(summaryData);
        setTrend(trendData);
        setRecentJevs(registryData.jevs || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [currentFund, selectedYear]);

  // Currency Formatter Utility
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

  if (loading && !summary) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-mono text-slate-550 font-semibold">Consolidating Treasury Ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Visual Header controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold font-serif tracking-tight text-brand-navy">Financial Dashboard</h3>
          <p className="text-xs text-slate-500 font-medium font-sans">Real-time budgetary indicators and ledger audits</p>
        </div>
        
        {/* Calendar Year Filter selector */}
        <div className="flex items-center gap-2.5 bg-white border border-slate-200 px-3.5 py-2 rounded shadow-xs">
          <CalendarRange className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-650">Reporting Year:</span>
          <select
            id="trend-year-selector"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-slate-50 text-slate-800 text-xs font-bold rounded px-2.5 py-1 border border-slate-200 outline-none cursor-pointer focus:border-brand-navy font-mono"
          >
            <option value="2020">FY 2020</option>
            <option value="2019">FY 2019</option>
            <option value="2018">FY 2018</option>
            <option value="2017">FY 2017</option>
          </select>
        </div>
      </div>

      {/* Numerical Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Collections */}
        <div className="bg-white border border-slate-200 rounded p-6 shadow-xs relative overflow-hidden transition-all duration-200 hover:shadow-sm">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-navy" />
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">Total Collections</span>
              <p className="text-2xl font-bold text-brand-navy font-serif tracking-tight">
                {summary ? formatPHP(summary.totalCollections) : "₱0.00"}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 font-mono uppercase tracking-wider">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Operating Inflow</span>
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 text-brand-navy rounded border border-slate-100">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Disbursements */}
        <div className="bg-white border border-slate-200 rounded p-6 shadow-xs relative overflow-hidden transition-all duration-200 hover:shadow-sm">
          <div className="absolute top-0 left-0 w-1 h-full bg-slate-400" />
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">Total Disbursements</span>
              <p className="text-2xl font-bold text-brand-navy font-serif tracking-tight">
                {summary ? formatPHP(summary.totalDisbursements) : "₱0.00"}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 font-mono uppercase tracking-wider">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Expenditures</span>
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 text-slate-650 rounded border border-slate-100">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Total Ledger Entries (JEVs) */}
        <div className="bg-white border border-slate-200 rounded p-6 shadow-xs relative overflow-hidden transition-all duration-200 hover:shadow-sm">
          <div className="absolute top-0 left-0 w-1 h-full bg-slate-350" />
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">Ledger Vouchers</span>
              <p className="text-2xl font-bold text-brand-navy font-serif tracking-tight">
                {summary ? summary.jevCount.toLocaleString() : "0"}
              </p>
              <p className="text-[10px] text-slate-450 font-semibold font-mono uppercase tracking-wider">Double-Entries</p>
            </div>
            <div className="p-2.5 bg-slate-50 text-slate-650 rounded border border-slate-100">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Active Responsibility Centers */}
        <div className="bg-white border border-slate-200 rounded p-6 shadow-xs relative overflow-hidden transition-all duration-200 hover:shadow-sm">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-navy" />
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">Active Offices (RC)</span>
              <p className="text-2xl font-bold text-brand-navy font-serif tracking-tight">
                {summary ? summary.activeRCs : "0"}
              </p>
              <p className="text-[10px] text-slate-450 font-semibold font-mono uppercase tracking-wider">Compliance Audited</p>
            </div>
            <div className="p-2.5 bg-slate-50 text-brand-navy rounded border border-slate-100">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

      </div>

      {/* Bar Chart of Monthly Collections vs Disbursements */}
      <div className="bg-white border border-slate-200 rounded p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-base font-bold font-serif text-brand-navy">Monthly Revenue vs. Expenditure Trend</h4>
            <p className="text-xs text-slate-400 font-semibold font-sans">Visual budget reconciliation comparison</p>
          </div>
          <span className="text-[10px] font-mono font-bold px-3 py-1 bg-brand-navy text-white rounded uppercase tracking-widest">
            COMPLETED AUDIT ({selectedYear})
          </span>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={trend}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              barGap={5}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tickFormatter={(val) => `₱${(val / 1000).toLocaleString()}k`} 
                tick={{ fill: '#475569', fontSize: 10, fontFamily: 'monospace', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                formatter={(val: number) => [formatPHP(val), '']} 
                contentStyle={{ backgroundColor: '#002147', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                labelStyle={{ fontWeight: 'bold', color: '#cbd5e1', fontFamily: 'Georgia, serif' }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="square"
                iconSize={10}
                wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#1a1a1a', paddingTop: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' }}
              />
              <Bar name="Total Revenue (Collections)" dataKey="collections" fill="#002147" radius={[0, 0, 0, 0]} />
              <Bar name="Expenditures (Disbursements)" dataKey="disbursements" fill="#94a3b8" radius={[0, 0, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent JEVs table (Last 10) */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-150 flex items-center justify-between">
          <div>
            <h4 className="text-base font-bold font-serif text-brand-navy">Recent Journal Entry Vouchers</h4>
            <p className="text-xs text-slate-400 font-semibold">Click on any row to open the full compliance ledger pre-audit viewer</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-brand-navy font-bold uppercase tracking-wider select-none cursor-pointer hover:underline">
            <span>Audit Trail Ledger</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {recentJevs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-sans">
            <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-xs">No transactions recorded inside the registry table</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-brand-navy font-bold font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3.5 px-6">Voucher No.</th>
                  <th className="py-3.5 px-6">Record Date</th>
                  <th className="py-3.5 px-6">Voucher Type</th>
                  <th className="py-3.5 px-6">Payee/Account</th>
                  <th className="py-3.5 px-6">Check Reference</th>
                  <th className="py-3.5 px-6 text-right">Debit Total</th>
                  <th className="py-3.5 px-6 text-right">Credit Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 font-medium">
                {recentJevs.map((j) => (
                  <tr 
                    key={j.JEV_ID} 
                    id={`recent-jev-${j.JEV_ID}`}
                    onClick={() => onOpenJev(j.JEV_ID)}
                    className="hover:bg-slate-50/70 border-l-2 border-l-transparent hover:border-l-brand-navy transition-all cursor-pointer group"
                  >
                    <td className="py-4 px-6 font-mono text-brand-navy font-bold group-hover:underline">
                      {j.JEV_Number}
                    </td>
                    <td className="py-4 px-6 text-slate-500 font-mono text-[11px]">
                      {parseHumanDate(j.Date)}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                        j.JEV_Type === 'Collection' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                        'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}>
                        {j.JEV_Type}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-slate-800 font-bold">{j.Payee || 'Revenue Office'}</p>
                        <p className="text-[10px] text-slate-400 max-w-sm truncate mt-0.5 font-semibold">{j.Description}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-600 text-[11px]">
                      {j.Check_Number ? (
                        <span>{j.Check_Number}</span>
                      ) : (
                        <span className="text-slate-400 font-sans italic text-xs">Direct Clearing</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-slate-800 font-bold">
                      {formatPHP(j.TotalDebit || 0)}
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-slate-800 font-bold">
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
