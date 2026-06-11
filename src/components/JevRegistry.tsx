import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  BadgeAlert, 
  UserX, 
  Clock, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw,
  SearchCode
} from 'lucide-react';
import { FundId, JEV } from '../types';

interface JevRegistryProps {
  currentFund: FundId;
  userRole: 'admin' | 'viewer';
  onOpenJev: (id: number) => void;
}

export default function JevRegistry({ currentFund, userRole, onOpenJev }: JevRegistryProps) {
  const [jevs, setJevs] = useState<JEV[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [jevType, setJevType] = useState<string>('');
  const [payee, setPayee] = useState<string>('');
  const [year, setYear] = useState<string>('');
  const [month, setMonth] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setStartDateEnd] = useState<string>('');

  const limit = 20; // Items per page

  const fetchJevs = () => {
    setLoading(true);
    let url = `/api/jev-registry?fund=${currentFund}&page=${page}&limit=${limit}`;

    if (jevType) url += `&jevType=${jevType}`;
    if (payee) url += `&payee=${encodeURIComponent(payee)}`;
    if (year) url += `&year=${year}`;
    if (month) url += `&month=${month}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setJevs(data.jevs || []);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchJevs();
  }, [currentFund, page, jevType, year, month, startDate, endDate]);

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setPage(1);
      fetchJevs();
    }
  };

  const clearFilters = () => {
    setJevType('');
    setPayee('');
    setYear('');
    setMonth('');
    setStartDate('');
    setStartDateEnd('');
    setPage(1);
  };

  // CSV Exporter
  const handleExportCSV = () => {
    if (userRole !== 'admin') return;

    // Fetch all JEVs for download without limit
    let url = `/api/jev-registry?fund=${currentFund}&page=1&limit=5000`;
    if (jevType) url += `&jevType=${jevType}`;
    if (payee) url += `&payee=${encodeURIComponent(payee)}`;
    if (year) url += `&year=${year}`;
    if (month) url += `&month=${month}`;

    fetch(url)
      .then(res => res.json())
      .then(resData => {
        const dJevs: JEV[] = resData.jevs || [];
        
        // Define Columns
        const csvHeaders = ["JEV Number", "Date", "Voucher Type", "Payee", "Check Number", "DV Number", "Description", "Debit Total", "Credit Total"];
        const csvRows = dJevs.map(j => [
          j.JEV_Number,
          j.Date,
          j.JEV_Type,
          `"${(j.Payee || '').replace(/"/g, '""')}"`,
          j.Check_Number || 'Direct',
          j.DV_Number || 'N/A',
          `"${(j.Description || '').replace(/"/g, '""')}"`,
          j.TotalDebit || 0,
          j.TotalCredit || 0
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
          + [csvHeaders.join(","), ...csvRows.map(e => e.join(","))].join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `mambusao_jev_${currentFund}_registry.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch(err => console.error("CSV Export failed: ", err));
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

  return (
    <div className="space-y-6">
      
      {/* Search and Export banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold font-serif tracking-tight text-brand-navy">Journal Entry Voucher Registry</h3>
          <p className="text-xs text-slate-500 font-medium font-sans">Double-entry audit archives of Mambusao Treasury Ledger</p>
        </div>

        {/* Export Gatekeeping */}
        <div className="flex items-center gap-3">
          {userRole === 'admin' ? (
            <button
              id="export-csv-btn"
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-brand-navy hover:bg-brand-navy/90 text-white font-sans text-xs font-semibold px-4 py-2.5 rounded shadow-sm transition-all select-none cursor-pointer"
            >
              <Download className="w-4 h-4 text-white/90" />
              Export Registry to CSV
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-4 py-2 rounded text-slate-400 text-xs font-semibold cursor-not-allowed uppercase tracking-wider font-mono">
              <UserX className="w-4 h-4 text-slate-400" />
              <span>Export Restricted</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Filtering System
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-sans">
          
          {/* Payee Search */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Payee Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400" />
              <input
                id="search-payee-input"
                type="text"
                placeholder="Name or company..."
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                onKeyDown={handleSearchKeyPress}
                className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 rounded-lg outline-none focus:border-blue-500 text-slate-800"
              />
            </div>
          </div>

          {/* Vouchers Type */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Voucher Type</label>
            <select
              id="filter-jev-type"
              value={jevType}
              onChange={(e) => { setJevType(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg outline-none focus:border-blue-500 text-slate-700 font-medium cursor-pointer"
            >
              <option value="">All Transactions</option>
              <option value="Collection">Collection</option>
              <option value="Disbursement">Disbursement</option>
            </select>
          </div>

          {/* Ledger Calendar Year */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Calendar Year</label>
            <select
              id="filter-jev-year"
              value={year}
              onChange={(e) => { setYear(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg outline-none focus:border-blue-500 text-slate-700 font-medium cursor-pointer"
            >
              <option value="">All Years (2005 - 2020)</option>
              <option value="2020">FY 2020</option>
              <option value="2019">FY 2019</option>
              <option value="2018">FY 2018</option>
              <option value="2017">FY 2017</option>
            </select>
          </div>

          {/* Ledger Calendar Month */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Reporting Month</label>
            <select
              id="filter-jev-month"
              value={month}
              onChange={(e) => { setMonth(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg outline-none focus:border-blue-500 text-slate-700 font-medium cursor-pointer"
            >
              <option value="">All Months</option>
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

        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] font-medium font-sans">
          <p className="text-slate-400">Press ENTER or change dropdown conditions to execute server search queries</p>
          <div className="flex items-center gap-3">
            <button 
              id="clear-filters-btn"
              onClick={clearFilters}
              className="text-slate-500 hover:text-slate-855 font-bold uppercase tracking-wider font-mono text-[10px] cursor-pointer"
            >
              Clear All Filters
            </button>
            <button 
              id="manual-query-btn"
              onClick={() => { setPage(1); fetchJevs(); }}
              className="bg-brand-navy/5 hover:bg-brand-navy/10 text-brand-navy px-3 py-1.5 rounded border border-brand-navy/15 font-bold transition-all select-none cursor-pointer"
            >
              Apply Filter Query
            </button>
          </div>
        </div>
      </div>

      {/* Main Ledger Table Panel */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-brand-navy border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400 font-mono font-bold">Querying general ledgers...</p>
          </div>
        ) : jevs.length === 0 ? (
          <div className="py-24 text-center text-slate-400 font-sans space-y-3">
            <BookOpen className="w-12 h-12 mx-auto text-slate-200" />
            <p className="text-sm font-semibold">No journal vouchers match the defined scope</p>
            <p className="text-xs text-slate-400">Try widening your date filters or spelling criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-brand-navy font-bold font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3.5 px-6">Voucher Number</th>
                  <th className="py-3.5 px-6">Record Date</th>
                  <th className="py-3.5 px-6">Voucher Type</th>
                  <th className="py-3.5 px-6">Payee Partner</th>
                  <th className="py-3.5 px-6">Check Reference</th>
                  <th className="py-3.5 px-6">DV Reference</th>
                  <th className="py-3.5 px-6 text-right">Debit Tot.</th>
                  <th className="py-3.5 px-6 text-right">Credit Tot.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 font-medium">
                {jevs.map((j) => (
                  <tr 
                    key={j.JEV_ID} 
                    id={`jev-row-${j.JEV_ID}`}
                    onClick={() => onOpenJev(j.JEV_ID)}
                    className="hover:bg-slate-50/70 cursor-pointer transition-all border-l-2 border-l-transparent hover:border-l-brand-navy group"
                  >
                    <td className="py-4 px-6 font-mono text-brand-navy font-bold group-hover:underline">
                      {j.JEV_Number}
                    </td>
                    <td className="py-4 px-6 text-slate-500 font-mono text-[11px]">
                      {parseHumanDate(j.Date)}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.1 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                        j.JEV_Type === 'Collection' ? 'bg-emerald-50 text-emerald-800 border border-emerald-110' :
                        'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}>
                        {j.JEV_Type}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-slate-800 font-semibold">{j.Payee || 'Administrative Account'}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 max-w-sm truncate font-normal leading-normal">{j.Description}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-600 text-[11px]">
                      {j.Check_Number || <span className="text-slate-400 font-sans italic text-xs">Direct Clearing</span>}
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-500">
                      {j.DV_Number || 'N/A'}
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

        {/* Pagination bar */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-sans">
          <div className="text-slate-500">
            Total records counted: <span className="font-semibold text-slate-800">{total.toLocaleString()}</span> &bull; Page <span className="font-semibold text-slate-800">{page}</span> of <span className="font-semibold text-slate-800">{totalPages}</span>
          </div>

          <div className="flex items-center gap-1.5 font-bold">
            <button
              id="prev-page-btn"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-2 border border-slate-200 rounded-lg hover:bg-white bg-slate-50 hover:shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>

            <span className="px-3 text-slate-500 font-medium">Page {page}</span>

            <button
              id="next-page-btn"
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="p-2 border border-slate-200 rounded-lg hover:bg-white bg-slate-50 hover:shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
