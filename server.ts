import express from 'express';
import path from 'path';
import sqlite3 from 'sqlite3';
import { createServer as createViteServer } from 'vite';
import { initializeDatabase } from './src/db_seeder';

async function startServer() {
  // Ensure database is fully initialized & seeded prior to API availability
  try {
    await initializeDatabase();
    console.log('Database seeded and running!');
  } catch (err) {
    console.error('Critical warning during DB start, proceeding in recovery mode:', err);
  }

  const app = express();
  const PORT = 3000;
  const DB_PATH = path.resolve(process.cwd(), 'mambusao_lgu.db');

  // Support JSON parsing
  app.use(express.json());

  // Helper function to query the SQLite DB safely
  function queryAll(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
        if (err) return reject(err);
      });
      db.all(sql, params, (err, rows) => {
        db.close();
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  }

  function queryGet(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
        if (err) return reject(err);
      });
      db.get(sql, params, (err, row) => {
        db.close();
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  // --- API ROUTES ---

  // 1. Config / Metadata (LGU officers)
  app.get('/api/config', async (req, res) => {
    try {
      const fund = (req.query.fund as string) || 'general';
      const config = await queryGet(`SELECT * FROM ${fund}_Config LIMIT 1`);
      if (config) {
        res.json(config);
      } else {
        res.json({
          Municipality: "Municipality of Mambusao",
          Province: "Province of Capiz",
          Accountant: "MA. ANGEL ADORA C. LAUNIO",
          Treasurer: "MA. TERESA J. LEYSON",
          Budget_Officer: "NESTOR T. SOLANO",
          Mayor: "LEODEGARIO A. LABAO, JR."
        });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Fund Summary Dashboard Cards
  app.get('/api/summary', async (req, res) => {
    try {
      const fund = (req.query.fund as string) || 'general';
      
      // Total Collections -> Credit on collection Vouchers (Cash Accounts receiving money OR sum of revenue account credits)
      // JEV_Type = 'Collection', Credit from JEV Details
      const colRow = await queryGet(`
        SELECT COALESCE(SUM(d.Credit), 0) as totalCollections
        FROM ${fund}_JEV j
        JOIN ${fund}_JEVDetails d ON j.JEV_ID = d.JEV_ID
        WHERE j.JEV_Type = 'Collection' AND d.Credit > 0
      `);

      // Total Disbursements -> Debit on disbursement vouchers (or cash account credit sum in disbursement Vouchers)
      const disbRow = await queryGet(`
        SELECT COALESCE(SUM(d.Debit), 0) as totalDisbursements
        FROM ${fund}_JEV j
        JOIN ${fund}_JEVDetails d ON j.JEV_ID = d.JEV_ID
        WHERE j.JEV_Type = 'Disbursement' AND d.Debit > 0
      `);

      // Transactions count
      const countRow = await queryGet(`SELECT COUNT(*) as jCount FROM ${fund}_JEV`);

      // Active RCs
      const rcsRow = await queryGet(`SELECT COUNT(*) as rcsCount FROM ${fund}_RC WHERE Active_Flag = 1`);

      res.json({
        totalCollections: colRow?.totalCollections || 0,
        totalDisbursements: disbRow?.totalDisbursements || 0,
        jevCount: countRow?.jCount || 0,
        activeRCs: rcsRow?.rcsCount || 0
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Monthly Collections vs Disbursements
  app.get('/api/monthly-trend', async (req, res) => {
    try {
      const fund = (req.query.fund as string) || 'general';
      const year = (req.query.year as string) || '2020';

      const trendData = await queryAll(`
        SELECT
          strftime('%m', j.Date) as monthNum,
          SUM(CASE WHEN j.JEV_Type = 'Collection' AND d.Credit > 0 THEN d.Credit ELSE 0 END) as collections,
          SUM(CASE WHEN j.JEV_Type = 'Disbursement' AND d.Debit > 0 THEN d.Debit ELSE 0 END) as disbursements
        FROM ${fund}_JEV j
        JOIN ${fund}_JEVDetails d ON j.JEV_ID = d.JEV_ID
        WHERE strftime('%Y', j.Date) = ?
        GROUP BY monthNum
        ORDER BY monthNum ASC
      `, [year]);

      // Map to full month names
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const trendMap = trendData.reduce((acc: any, curr: any) => {
        const idx = parseInt(curr.monthNum, 10) - 1;
        if (idx >= 0 && idx < 12) {
          acc[months[idx]] = {
            collections: curr.collections || 0,
            disbursements: curr.disbursements || 0
          };
        }
        return acc;
      }, {});

      const result = months.map(m => ({
        month: m,
        collections: trendMap[m]?.collections || 0,
        disbursements: trendMap[m]?.disbursements || 0
      }));

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. JEV Registry with robust filtering & pagination
  app.get('/api/jev-registry', async (req, res) => {
    try {
      const fund = (req.query.fund as string) || 'general';
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const jevType = req.query.jevType as string;
      const payee = req.query.payee as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const month = req.query.month as string;
      const year = req.query.year as string;

      let whereClauses = [];
      let params = [];

      if (jevType) {
        whereClauses.push("j.JEV_Type = ?");
        params.push(jevType);
      }
      if (payee) {
        whereClauses.push("j.Payee LIKE ?");
        params.push(`%${payee}%`);
      }
      if (startDate) {
        whereClauses.push("j.Date >= ?");
        params.push(startDate);
      }
      if (endDate) {
        whereClauses.push("j.Date <= ?");
        params.push(endDate);
      }
      if (year) {
        whereClauses.push("strftime('%Y', j.Date) = ?");
        params.push(year);
      }
      if (month) {
        whereClauses.push("strftime('%m', j.Date) = ?");
        params.push(month);
      }

      const whereQuery = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

      // We need to calculate totals (Debit / Credit) per JEV
      const listSql = `
        SELECT 
          j.*,
          COALESCE(SUM(d.Debit), 0) as TotalDebit,
          COALESCE(SUM(d.Credit), 0) as TotalCredit
        FROM ${fund}_JEV j
        LEFT JOIN ${fund}_JEVDetails d ON j.JEV_ID = d.JEV_ID
        ${whereQuery}
        GROUP BY j.JEV_ID
        ORDER BY j.Date DESC, j.JEV_Number DESC
        LIMIT ? OFFSET ?
      `;

      const listParams = [...params, limit, offset];
      const jevs = await queryAll(listSql, listParams);

      // Get count for pagination
      const countSql = `
        SELECT COUNT(DISTINCT j.JEV_ID) as count 
        FROM ${fund}_JEV j
        ${whereQuery}
      `;
      const countRow = await queryGet(countSql, params);
      const total = countRow?.count || 0;

      res.json({
        jevs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 5. JEV Details by ID
  app.get('/api/jev-details/:id', async (req, res) => {
    try {
      const fund = (req.query.fund as string) || 'general';
      const id = req.params.id;

      // JEV Header Info
      const jevHeader = await queryGet(`SELECT * FROM ${fund}_JEV WHERE JEV_ID = ?`, [id]);
      if (!jevHeader) {
        return res.status(404).json({ error: "JEV Voucher not found" });
      }

      // JEV Details linked with AC accounts and RC centers
      const details = await queryAll(`
        SELECT 
          d.*,
          ac.Title as AC_Title,
          rc.Description as RC_Description
        FROM ${fund}_JEVDetails d
        LEFT JOIN ${fund}_AC ac ON d.AC = ac.AC_Code
        LEFT JOIN ${fund}_RC rc ON d.RC = rc.RC_Code
        WHERE d.JEV_ID = ?
      `, [id]);

      // Linked ObR info (if any)
      const obr = await queryGet(`SELECT * FROM ${fund}_ObR WHERE JEV_ID = ?`, [id]);

      res.json({
        jev: jevHeader,
        details,
        obr
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 6. Chart of Accounts (AC) list
  app.get('/api/accounts', async (req, res) => {
    try {
      const fund = (req.query.fund as string) || 'general';
      const search = req.query.search as string;

      let sql = `
        SELECT 
          ac.*,
          COALESCE(SUM(d.Debit), 0) as TotalDebit,
          COALESCE(SUM(d.Credit), 0) as TotalCredit
        FROM ${fund}_AC ac
        LEFT JOIN ${fund}_JEVDetails d ON ac.AC_Code = d.AC
        ${search ? "WHERE ac.AC_Code LIKE ? OR ac.Title LIKE ?" : ""}
        GROUP BY ac.AC_Code
        ORDER BY ac.AC_Code ASC
      `;

      const params = search ? [`%${search}%`, `%${search}%`] : [];
      const accounts = await queryAll(sql, params);

      // Compute Running Balance based on account Nature:
      // Nature = Debit -> Debit - Credit
      // Nature = Credit -> Credit - Debit
      const computedAccounts = accounts.map(a => {
        const running = a.Nature === 'Debit' 
          ? (a.TotalDebit - a.TotalCredit) 
          : (a.TotalCredit - a.TotalDebit);
        return {
          ...a,
          RunningBalance: running
        };
      });

      res.json(computedAccounts);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 7. Responsibility Centers (RC)
  app.get('/api/responsibility-centers', async (req, res) => {
    try {
      const fund = (req.query.fund as string) || 'general';

      const centers = await queryAll(`
        SELECT 
          rc.*,
          COALESCE(SUM(d.Debit), 0) as TotalDisbursements,
          COUNT(DISTINCT d.JEV_ID) as JEVCount
        FROM ${fund}_RC rc
        LEFT JOIN ${fund}_JEVDetails d ON rc.RC_Code = d.RC
        GROUP BY rc.RC_Code
        ORDER BY rc.RC_Code ASC
      `);

      res.json(centers);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 7.1 RC Vouchers Drilldown
  app.get('/api/responsibility-centers/:code/jevs', async (req, res) => {
    try {
      const fund = (req.query.fund as string) || 'general';
      const code = req.params.code;

      const jevs = await queryAll(`
        SELECT DISTINCT
          j.*,
          COALESCE((SELECT SUM(Debit) FROM ${fund}_JEVDetails WHERE JEV_ID = j.JEV_ID), 0) as TotalDebit,
          COALESCE((SELECT SUM(Credit) FROM ${fund}_JEVDetails WHERE JEV_ID = j.JEV_ID), 0) as TotalCredit
        FROM ${fund}_JEV j
        JOIN ${fund}_JEVDetails d ON j.JEV_ID = d.JEV_ID
        WHERE d.RC = ?
        ORDER BY j.Date DESC
      `, [code]);

      const rcInfo = await queryGet(`SELECT * FROM ${fund}_RC WHERE RC_Code = ?`, [code]);

      res.json({
        rcInfo,
        jevs
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 8. Budget Monitoring Sheet
  app.get('/api/budget-monitoring', async (req, res) => {
    try {
      const fund = (req.query.fund as string) || 'general';

      // Sum of Obligations comes from active debit disbursements or linked ObRs
      const budgetSql = `
        SELECT 
          b.*,
          ac.Title as AC_Title,
          COALESCE((
            SELECT SUM(d.Debit)
            FROM ${fund}_JEVDetails d
            JOIN ${fund}_JEV j ON d.JEV_ID = j.JEV_ID
            WHERE d.AC = b.AC AND j.JEV_Type = 'Disbursement'
          ), 0) as Obligations
        FROM ${fund}_Budget b
        LEFT JOIN ${fund}_AC ac ON b.AC = ac.AC_Code
        ORDER BY b.AC ASC
      `;

      const budgets = await queryAll(budgetSql);

      const result = budgets.map(b => {
        // Balance = Allotment Received + Allotment Adjustment - Obligations
        const bal = b.Allotment_Received + b.Allotment_Adjustment - b.Obligations;
        return {
          ...b,
          Balance: bal
        };
      });

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 9. Trial Balance (Dynamic summing & matching of Ledger)
  app.get('/api/trial-balance', async (req, res) => {
    try {
      const fund = (req.query.fund as string) || 'general';
      const year = req.query.year as string;
      const month = req.query.month as string;

      let whereClause = "";
      let params = [];

      if (year && month) {
        whereClause = "WHERE strftime('%Y', j.Date) = ? AND strftime('%m', j.Date) = ?";
        params = [year, month];
      } else if (year) {
        whereClause = "WHERE strftime('%Y', j.Date) = ?";
        params = [year];
      }

      const sql = `
        SELECT 
          ac.AC_Code,
          ac.Title,
          ac.BalanceSheetCategory,
          ac.IncomeStatementCategory,
          ac.Nature,
          COALESCE(SUM(d.Debit), 0) as TotalDebit,
          COALESCE(SUM(d.Credit), 0) as TotalCredit
        FROM ${fund}_AC ac
        LEFT JOIN ${fund}_JEVDetails d ON ac.AC_Code = d.AC
        LEFT JOIN ${fund}_JEV j ON d.JEV_ID = j.JEV_ID
        ${whereClause}
        GROUP BY ac.AC_Code
        ORDER BY ac.AC_Code ASC
      `;

      const rows = await queryAll(sql, params);

      // Filter rows that have non-zero debits or credits to reflect actual trial accounts
      const trialBalance = rows.map(r => {
        const bal = r.Nature === 'Debit'
          ? (r.TotalDebit - r.TotalCredit)
          : (r.TotalCredit - r.TotalDebit);

        return {
          ...r,
          Balance: bal
        };
      }).filter(r => r.TotalDebit > 0 || r.TotalCredit > 0);

      res.json(trialBalance);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 10. Financial Statements Generator (Balance Sheet, Income Statement, Cash flows)
  app.get('/api/financial-statement', async (req, res) => {
    try {
      const fund = (req.query.fund as string) || 'general';
      const reportType = req.query.reportType as string; // 'balance_sheet' | 'income_statement' | 'cash_flow'
      const year = (req.query.year as string) || '2020';

      // We pull ledger sums for the given year
      const sql = `
        SELECT 
          ac.AC_Code,
          ac.Title,
          ac.BalanceSheetCategory,
          ac.IncomeStatementCategory,
          ac.CashflowCategory,
          ac.Nature,
          COALESCE(SUM(d.Debit), 0) as TotalDebit,
          COALESCE(SUM(d.Credit), 0) as TotalCredit
        FROM ${fund}_AC ac
        LEFT JOIN ${fund}_JEVDetails d ON ac.AC_Code = d.AC
        LEFT JOIN ${fund}_JEV j ON d.JEV_ID = j.JEV_ID
        WHERE strftime('%Y', j.Date) = ? OR j.Date IS NULL
        GROUP BY ac.AC_Code
      `;

      const rows = await queryAll(sql, [year]);

      const accounts = rows.map(r => {
        const bal = r.Nature === 'Debit'
          ? (r.TotalDebit - r.TotalCredit)
          : (r.TotalCredit - r.TotalDebit);
        return { ...r, Balance: bal };
      });

      if (reportType === 'balance_sheet') {
        // Group by Assets, Liabilities, and Equity
        const assets = accounts.filter(a => a.BalanceSheetCategory === 'Assets' && a.Balance !== 0);
        const liabilities = accounts.filter(a => a.BalanceSheetCategory === 'Liabilities' && a.Balance !== 0);
        const equity = accounts.filter(a => a.BalanceSheetCategory === 'Equity');

        res.json({
          reportType,
          year,
          data: { assets, liabilities, equity }
        });
      } else if (reportType === 'income_statement') {
        // Group by Revenue vs Expenses
        const revenue = accounts.filter(a => a.IncomeStatementCategory === 'Revenue' && a.Balance !== 0);
        const expenses = accounts.filter(a => a.IncomeStatementCategory === 'Expenses' && a.Balance !== 0);

        res.json({
          reportType,
          year,
          data: { revenue, expenses }
        });
      } else if (reportType === 'cash_flow') {
        // Group by Operating Cash Inflow, Operating Cash Outflow, etc.
        const inflows = accounts.filter(a => a.CashflowCategory && a.CashflowCategory.includes('Inflow') && a.Balance !== 0);
        const outflows = accounts.filter(a => a.CashflowCategory && a.CashflowCategory.includes('Outflow') && a.Balance !== 0);

        res.json({
          reportType,
          year,
          data: { inflows, outflows }
        });
      } else {
        res.status(400).json({ error: "Invalid report type specified" });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 11. Multi-Fund Global Search Engine
  app.get('/api/search', async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q || q.trim() === '') {
        return res.json([]);
      }

       const results: any[] = [];
      const fundNames = {
        general: 'General Fund',
        sef: 'Special Education Fund (SEF)',
        devfund: '20% Development Fund',
        trust: 'Trust Fund',
        meedo: 'MEEDO Fund (Market & Slaughterhouse)'
      };
      const funds = Object.keys(fundNames) as ('general' | 'sef' | 'devfund' | 'trust' | 'meedo')[];

      // We'll search across all 5 funds independently in SQLite
      for (const f of funds) {
        const queryStr = `%${q}%`;
        const hits = await queryAll(`
          SELECT DISTINCT
            j.JEV_ID,
            j.JEV_Number,
            j.Date,
            j.JEV_Type,
            j.Description,
            j.Payee,
            j.Check_Number,
            j.DV_Number,
            COALESCE((SELECT SUM(Debit) FROM ${f}_JEVDetails WHERE JEV_ID = j.JEV_ID), 0) as Amount
          FROM ${f}_JEV j
          LEFT JOIN ${f}_JEVDetails d ON j.JEV_ID = d.JEV_ID
          WHERE 
            j.JEV_Number LIKE ? OR 
            j.Payee LIKE ? OR 
            j.Check_Number LIKE ? OR 
            j.DV_Number LIKE ? OR 
            j.Description LIKE ? OR
            d.AC LIKE ?
          ORDER BY j.Date DESC
          LIMIT 15
        `, [queryStr, queryStr, queryStr, queryStr, queryStr, queryStr]);

        hits.forEach(h => {
          results.push({
            ...h,
            fund: f,
            fundName: fundNames[f]
          });
        });
      }

      // Sort by Date descending
      results.sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());

      res.json(results.slice(0, 30));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // --- VITE DEV SERVER OR STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mambusao LGU Backend running on port ${PORT}`);
  });
}

startServer();
