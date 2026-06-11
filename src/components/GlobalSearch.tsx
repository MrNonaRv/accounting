import React, { useState } from 'react';
import { Search, Compass, BookOpen, AlertCircle, FileText, ArrowRight, Tag } from 'lucide-react';
import { JEV, FundId, FUNDS } from '../types';

interface GlobalSearchProps {
  onOpenJev: (id: number, fund: FundId) => void;
}

interface SearchResult extends JEV {
  fund: FundId;
  fundName: string;
  Amount: number;
}

export default function GlobalSearch({ onOpenJev }: GlobalSearchProps) {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q || q.trim() === '') return;

    setLoading(true);
    setSearched(true);
    
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then(res => res.json())
      .then(data => {
        setResults(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
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

  return (
    <div className="space-y-6 font-sans">
      
      {/* Title */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Cross-Fund Master Search</h3>
        <p className="text-xs text-slate-500 font-medium">Global queries across all 5 municipal funds by Payee name, JEV number, Check reference, DV number, or Account code</p>
      </div>

      {/* Global input search block */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input
            id="global-master-search-input"
            type="text"
            placeholder="Type voucher number, check ID, payee name, or account code (e.g. 1-01-01) then press Enter..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full bg-white border border-slate-250 py-3.5 pl-12 pr-4 rounded-xl text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-800 shadow-sm"
          />
        </div>
        <button
          id="global-search-submit-btn"
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-sans text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all select-none cursor-pointer"
        >
          Execute Search
        </button>
      </form>

      {/* Search Output container */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400 font-mono font-bold">Querying municipal indexes...</p>
          </div>
        ) : !searched ? (
          <div className="py-24 text-center text-slate-400 space-y-3">
            <Compass className="w-12 h-12 mx-auto text-slate-200" />
            <p className="text-sm font-semibold">Ready for queries</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Example query syntax: search <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-[10px] text-slate-705">CAPELCO</code> to look up electric bills, or <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-[10px] text-slate-705">JEV-2020</code> for the voucher ledger index.
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="py-24 text-center text-slate-400 space-y-2">
            <AlertCircle className="w-12 h-12 mx-auto text-slate-200" />
            <p className="text-sm font-semibold">No results match your search parameters</p>
            <p className="text-xs text-slate-400">Verify character entries and query conditions and run again.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="px-6 py-4.5 bg-slate-50 border-b border-slate-150 flex items-center justify-between text-xs text-slate-500">
              <span>Discovered matches count: <strong className="text-slate-800">{results.length} records</strong></span>
              <span className="font-semibold text-blue-700 uppercase font-mono text-[9px] tracking-wider">Cross-Fund Ledger scan verified</span>
            </div>

            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-6">Found In Fund</th>
                  <th className="py-3 px-6">Voucher Number</th>
                  <th className="py-3 px-6">Record Date</th>
                  <th className="py-3 px-6">Voucher Type</th>
                  <th className="py-3 px-6">Payee Partner</th>
                  <th className="py-3 px-6 text-right">Transaction Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {results.map((r, idx) => (
                  <tr 
                    key={idx}
                    onClick={() => onOpenJev(r.JEV_ID, r.fund)}
                    className="hover:bg-slate-50/70 cursor-pointer transition-all border-l-2 border-l-transparent hover:border-l-blue-600 group"
                  >
                    <td className="py-3.5 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] bg-slate-100 text-slate-700 border border-slate-200 font-bold uppercase tracking-wider">
                        <Tag className="w-3 h-3 text-slate-450" />
                        {r.fundName}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-mono text-blue-700 font-extrabold group-hover:underline text-[12px]">
                      {r.JEV_Number}
                    </td>
                    <td className="py-3.5 px-6 text-slate-505">
                      {parseHumanDate(r.Date)}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                        r.JEV_Type === 'Collection' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        {r.JEV_Type}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <div>
                        <p className="text-slate-800 font-semibold">{r.Payee || 'Revenue Office'}</p>
                        <p className="text-[10px] text-slate-400 font-normal mt-0.5 max-w-md truncate">{r.Description}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono font-bold text-slate-800 text-xs">
                      {formatPHP(r.Amount)}
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
