import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Printer, FileDown, Calendar, Building, Landmark, User, FileText } from 'lucide-react';
import { FundId, JEV, JEVDetails, ObR } from '../types';

interface JevDetailsModalProps {
  jevId: number;
  fund: FundId;
  onClose: () => void;
}

export default function JevDetailsModal({ jevId, fund, onClose }: JevDetailsModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ jev: JEV; details: JEVDetails[]; obr: ObR | null } | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/jev-details/${jevId}?fund=${fund}`)
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [jevId, fund]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded shadow-md flex flex-col items-center gap-3 border border-slate-200">
          <div className="w-10 h-10 border-4 border-brand-navy border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-brand-navy font-mono">Loading Voucher Ledger...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { jev, details, obr } = data;

  // Calculatings totals
  const totalDebit = details.reduce((sum, item) => sum + item.Debit, 0);
  const totalCredit = details.reduce((sum, item) => sum + item.Credit, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001;

  // Currency Formatter Utility
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(val);
  };

  // Human Date Formating
  const formatHumanDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        // e.g. YYYY-MM-DD
        const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return dateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-brand-navy text-slate-100 px-6 py-5 flex items-center justify-between border-b border-brand-navy shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded ${
                jev.JEV_Type === 'Collection' ? 'bg-emerald-600/30 text-emerald-350 border border-emerald-500/20' :
                'bg-slate-700/60 text-slate-300 border border-slate-500/20'
              }`}>
                {jev.JEV_Type} Voucher
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#94a3b8] font-bold">
                JEV-ID: #{jev.JEV_ID}
              </span>
            </div>
            <h3 className="text-xl font-bold font-serif mt-1.5 text-white tracking-tight">
              Journal Entry Voucher: <span className="font-mono text-slate-300 font-extrabold">{jev.JEV_Number}</span>
            </h3>
          </div>
          <button 
            id="close-jev-modal-btn"
            onClick={onClose}
            className="p-1 rounded text-slate-300 hover:text-slate-100 hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div id="print-area" className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
          
          {/* Audit Verification status */}
          <div className={`p-4 rounded flex items-center justify-between gap-4 ${
            isBalanced ? 'bg-slate-55 border border-slate-200 text-slate-800' : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-3">
              {isBalanced ? (
                <ShieldCheck className="w-5 h-5 text-brand-navy shrink-0" />
              ) : (
                <X className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <div>
                <p className="text-xs font-bold font-serif text-brand-navy">
                  {isBalanced ? 'PPSAS Double-Entry Balance Assessment Passed' : 'Account balance error detected'}
                </p>
                <p className="text-[10px] text-slate-600 font-mono mt-0.5 font-bold">
                  Debits and Credits are in perfect fiscal agreement: <span className="text-brand-navy">{formatCurrency(totalDebit)}</span>
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <button 
                onClick={handlePrint}
                className="flex items-center gap-1.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 text-[10px] uppercase tracking-wider font-bold font-mono px-3 py-1.5 rounded select-none cursor-pointer transition-all"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                Print Voucher
              </button>
            </div>
          </div>

          {/* Metadata Block Grouping */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 border border-slate-205 rounded p-5 text-xs font-sans">
            <div className="space-y-3">
              <p className="text-[10px] uppercase font-mono tracking-widest text-[#94a3b8] font-bold">Voucher Dates & References</p>
              <div className="space-y-1">
                <div className="flex justify-between border-b border-dashed border-slate-200 py-0.5">
                  <span className="text-slate-500 font-semibold font-sans">Voucher Date</span>
                  <span className="font-bold text-slate-800 font-mono text-[11px]">{formatHumanDate(jev.Date)}</span>
                </div>
                {jev.Check_Number && (
                  <div className="flex justify-between border-b border-dashed border-slate-200 py-0.5">
                    <span className="text-slate-500 font-semibold font-sans">Check No.</span>
                    <span className="font-mono text-brand-navy font-bold">{jev.Check_Number}</span>
                  </div>
                )}
                {jev.Check_Date && (
                  <div className="flex justify-between border-b border-dashed border-slate-200 py-0.5">
                    <span className="text-slate-500 font-semibold font-sans">Check Date</span>
                    <span className="font-bold text-slate-800 font-mono text-[11px]">{formatHumanDate(jev.Check_Date)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] uppercase font-mono tracking-widest text-[#94a3b8] font-bold">Transaction Partners</p>
              <div className="space-y-1">
                <div className="flex justify-between border-b border-dashed border-slate-200 py-0.5">
                  <span className="text-slate-500 font-semibold font-sans">Payee Name</span>
                  <span className="font-bold text-slate-800 text-right max-w-[150px] truncate">{jev.Payee || 'N/A'}</span>
                </div>
                {jev.DV_Number && (
                  <div className="flex justify-between border-b border-dashed border-slate-200 py-0.5">
                    <span className="text-slate-500 font-semibold font-sans">DV No.</span>
                    <span className="font-mono text-brand-navy font-bold">{jev.DV_Number}</span>
                  </div>
                )}
                {jev.ALOVS && (
                  <div className="flex justify-between border-b border-dashed border-slate-200 py-0.5">
                    <span className="text-slate-500 font-semibold font-sans">ALOVS No.</span>
                    <span className="font-mono text-brand-navy font-bold">{jev.ALOVS}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] uppercase font-mono tracking-widest text-[#94a3b8] font-bold">Voucher Narrative</p>
              <div>
                <p className="text-slate-700 leading-normal font-semibold bg-white p-2.5 rounded border border-slate-200 max-h-[75px] overflow-y-auto text-[11px]">
                  {jev.Description || "No description provided."}
                </p>
              </div>
            </div>
          </div>

          {/* double entry ledger items table */}
          <div>
            <p className="text-[10px] uppercase font-mono tracking-widest text-[#94a3b8] font-bold mb-3 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-brand-navy" /> Bookkeeping Records (Dr. & Cr. Ledger Posting)
            </p>
            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-xs font-sans text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-brand-navy font-bold font-mono text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-4 w-32">Account Code</th>
                    <th className="py-3 px-4">Account Title</th>
                    <th className="py-3 px-4 w-40">Responsibility Center</th>
                    <th className="py-3 px-4 text-right w-36">Debit (Dr.)</th>
                    <th className="py-3 px-4 text-right w-36">Credit (Cr.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {details.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-900 font-extrabold">{item.AC}</td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-bold text-slate-800">{item.AC_Title || 'Unknown Account'}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px] font-semibold leading-tight font-sans">
                        {item.RC} - {item.RC_Description || 'General Office'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-900 font-bold">
                        {item.Debit > 0 ? formatCurrency(item.Debit) : <span className="text-slate-350">-</span>}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-900 font-bold">
                        {item.Credit > 0 ? formatCurrency(item.Credit) : <span className="text-slate-350">-</span>}
                      </td>
                    </tr>
                  ))}
                  {/* Ledger Totals */}
                  <tr className="bg-slate-50 font-extrabold border-t border-slate-200">
                    <td colSpan={3} className="py-3.5 px-4 text-right text-brand-navy uppercase font-mono text-[10px] tracking-wider">
                      Voucher Balance Totals
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-brand-navy text-[13px] font-extrabold">
                      {formatCurrency(totalDebit)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-brand-navy text-[13px] font-extrabold">
                      {formatCurrency(totalCredit)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Obligation Request drill down detail (where applicable) */}
          {obr && (
            <div className="bg-[#f8fafc] border border-slate-205 rounded p-5">
              <p className="text-[10px] uppercase font-mono tracking-widest text-[#94a3b8] font-bold mb-3">
                Corresponding Local Budget Obligation Request (ObR)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-sans">
                <div>
                  <span className="text-slate-500 font-semibold block">ObR No.</span>
                  <span className="font-mono font-bold text-brand-navy mt-0.5 block">{obr.ObR_No}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Payee Office</span>
                  <span className="font-bold text-slate-850 mt-0.5 block">RC {obr.Office}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Authorized Representative</span>
                  <span className="font-bold text-slate-850 mt-0.5 block">{obr.Printed_Name}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Official Position</span>
                  <span className="text-slate-405 font-mono uppercase text-[9px] tracking-wider mt-0.5 block font-bold">{obr.Position}</span>
                </div>
              </div>
            </div>
          )}

          {/* Footnotes / Signatures Area ready to Print */}
          <div className="border-t border-slate-200 pt-8 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-[11px] font-sans">
              <div className="space-y-12">
                <p className="text-[#94a3b8] uppercase font-mono text-[9px] tracking-widest font-extrabold">Prepared By:</p>
                <div>
                  <div className="w-5/6 mx-auto border-t border-slate-300 my-2"></div>
                  <p className="font-serif font-bold text-slate-900 uppercase text-[11px]">ADMINISTRATIVE STAFF</p>
                  <p className="text-[#94a3b8] uppercase text-[9px] font-mono mt-0.5 font-bold">Municipal Accountant Office</p>
                </div>
              </div>
              <div className="space-y-12">
                <p className="text-[#94a3b8] uppercase font-mono text-[9px] tracking-widest font-extrabold">Accounting Pre-Audit Certified:</p>
                <div>
                  <div className="w-5/6 mx-auto border-t border-slate-300 my-2"></div>
                  <p className="font-serif font-bold text-slate-900 uppercase text-[11px]">MA. ANGEL ADORA C. LAUNIO</p>
                  <p className="text-[#94a3b8] uppercase text-[9px] font-mono mt-0.5 font-bold">Municipal Accountant</p>
                </div>
              </div>
              <div className="space-y-12">
                <p className="text-[#94a3b8] uppercase font-mono text-[9px] tracking-widest font-extrabold">Approved for Treasury Release:</p>
                <div>
                  <div className="w-5/6 mx-auto border-t border-slate-300 my-2"></div>
                  <p className="font-serif font-bold text-slate-900 uppercase text-[11px]">LEODEGARIO A. LABAO, JR.</p>
                  <p className="text-[#94a3b8] uppercase text-[9px] font-mono mt-0.5 font-bold">Municipal Mayor</p>
                </div>
              </div>
            </div>
          </div>

        </div>
        
        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 z-0">
          <button 
            id="modal-close-btn"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-205 text-xs font-bold text-slate-700 rounded select-none cursor-pointer transition-all shadow-2xs"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
}
