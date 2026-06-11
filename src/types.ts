/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type FundId = 'general' | 'sef' | 'devfund' | 'trust' | 'meedo';

export interface FundMeta {
  id: FundId;
  name: string;
}

export const FUNDS: FundMeta[] = [
  { id: 'general', name: 'General Fund' },
  { id: 'sef', name: 'Special Education Fund (SEF)' },
  { id: 'devfund', name: '20% Development Fund' },
  { id: 'trust', name: 'Trust Fund' },
  { id: 'meedo', name: 'MEEDO Fund (Market & Slaughterhouse)' }
];

export interface JEV {
  JEV_ID: number;
  JEV_Number: string;
  Date: string; // ISO date or formatted
  JEV_Type: 'Collection' | 'Disbursement' | 'General Journal';
  Description: string;
  Payee: string;
  Check_Number: string | null;
  Check_Date: string | null;
  DV_Number: string | null;
  ALOVS: string | null;
  Closing_Flag: number;
  TotalDebit?: number;
  TotalCredit?: number;
  Details?: JEVDetails[];
}

export interface JEVDetails {
  Entry_ID: number;
  JEV_ID: number;
  AC: string;
  RC: string;
  Debit: number;
  Credit: number;
  AC_Title?: string;
  RC_Description?: string;
}

export interface AC {
  AC_Code: string;
  Title: string;
  Nature: 'Debit' | 'Credit';
  BalanceSheetCategory: string; // e.g. "Assets", "Liabilities", "Equity"
  IncomeStatementCategory: string | null; // e.g. "Revenue", "Expenses"
  CashflowCategory: string | null; // e.g. "Operating Cash Inflow", "Operating Cash Outflow"
  RunningBalance?: number;
}

export interface RC {
  RC_Code: string;
  Description: string;
  Office: string;
  FunctionProgramProject: string;
  Classification: string;
  Active_Flag: number;
  TotalDisbursements?: number;
  JEVCount?: number;
}

export interface Budget {
  Entry_Type: string;
  SARO_REF: string;
  Date: string;
  AC: string;
  AC_Title?: string;
  Appropriation: number;
  Allotment_Received: number;
  Allotment_Adjustment: number;
  Obligations?: number;
  Balance?: number;
}

export interface ObR {
  ObR_No: string;
  Payee: string;
  Office: string;
  Date: string;
  Printed_Name: string;
  Position: string;
  JEV_ID?: number;
}

export interface Bank {
  AC: string;
  Account_Number: string;
  Bank_Name: string;
  Address: string;
}

export interface Config {
  Municipality: string;
  Province: string;
  Accountant: string;
  Treasurer: string;
  Budget_Officer: string;
  Mayor: string;
}

export interface SummaryCards {
  totalCollections: number;
  totalDisbursements: number;
  jevCount: number;
  activeRCs: number;
}

export interface MonthlyTrend {
  month: string; // "Jan", "Feb", etc.
  collections: number;
  disbursements: number;
}
