import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.resolve(process.cwd(), 'mambusao_lgu.db');

const FUNDS = {
  general: 'General Fund',
  sef: 'Special Education Fund (SEF)',
  devfund: '20% Development Fund',
  trust: 'Trust Fund',
  meedo: 'MEEDO Fund (Market & Slaughterhouse)'
};

const TABLES = ['JEV', 'JEVDetails', 'AC', 'RC', 'Budget', 'ObR', 'Bank', 'Config'];

export function initializeDatabase(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    // If database exists and contains some tables, we don't need to rebuild
    const dbExists = fs.existsSync(DB_PATH);
    const db = new sqlite3.Database(DB_PATH);

    db.serialize(() => {
      // Setup tables for all 5 funds
      for (const fund of Object.keys(FUNDS)) {
        // Config table
        db.run(`
          CREATE TABLE IF NOT EXISTS ${fund}_Config (
            Municipality TEXT,
            Province TEXT,
            Accountant TEXT,
            Treasurer TEXT,
            Budget_Officer TEXT,
            Mayor TEXT
          )
        `);

        // Bank Accounts table
        db.run(`
          CREATE TABLE IF NOT EXISTS ${fund}_Bank (
            AC TEXT PRIMARY KEY,
            Account_Number TEXT,
            Bank_Name TEXT,
            Address TEXT
          )
        `);

        // Responsibility Centers
        db.run(`
          CREATE TABLE IF NOT EXISTS ${fund}_RC (
            RC_Code TEXT PRIMARY KEY,
            Description TEXT,
            Office TEXT,
            FunctionProgramProject TEXT,
            Classification TEXT,
            Active_Flag INTEGER DEFAULT 1
          )
        `);

        // Chart of Accounts
        db.run(`
          CREATE TABLE IF NOT EXISTS ${fund}_AC (
            AC_Code TEXT PRIMARY KEY,
            Title TEXT,
            Nature TEXT,
            BalanceSheetCategory TEXT,
            IncomeStatementCategory TEXT,
            CashflowCategory TEXT
          )
        `);

        // JEV Vouchers
        db.run(`
          CREATE TABLE IF NOT EXISTS ${fund}_JEV (
            JEV_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            JEV_Number TEXT UNIQUE,
            Date TEXT,
            JEV_Type TEXT,
            Description TEXT,
            Payee TEXT,
            Check_Number TEXT,
            Check_Date TEXT,
            DV_Number TEXT,
            ALOVS TEXT,
            Closing_Flag INTEGER DEFAULT 0
          )
        `);

        // JEV Details entries (ledger entries)
        db.run(`
          CREATE TABLE IF NOT EXISTS ${fund}_JEVDetails (
            Entry_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            JEV_ID INTEGER,
            AC TEXT,
            RC TEXT,
            Debit REAL DEFAULT 0,
            Credit REAL DEFAULT 0,
            FOREIGN KEY(JEV_ID) REFERENCES ${fund}_JEV(JEV_ID)
          )
        `);

        // Obligations Requests
        db.run(`
          CREATE TABLE IF NOT EXISTS ${fund}_ObR (
            ObR_No TEXT PRIMARY KEY,
            Payee TEXT,
            Office TEXT,
            Date TEXT,
            Printed_Name TEXT,
            Position TEXT,
            JEV_ID INTEGER,
            FOREIGN KEY(JEV_ID) REFERENCES ${fund}_JEV(JEV_ID)
          )
        `);

        // Budget
        db.run(`
          CREATE TABLE IF NOT EXISTS ${fund}_Budget (
            Budget_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            Entry_Type TEXT,
            SARO_REF TEXT,
            Date TEXT,
            AC TEXT,
            Appropriation REAL DEFAULT 0,
            Allotment_Received REAL DEFAULT 0,
            Allotment_Adjustment REAL DEFAULT 0,
            FOREIGN KEY(AC) REFERENCES ${fund}_AC(AC_Code)
          )
        `);

        // Performance Indexes
        db.run(`CREATE INDEX IF NOT EXISTS idx_${fund}_jev_date ON ${fund}_JEV(Date)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_${fund}_jv_det_jev ON ${fund}_JEVDetails(JEV_ID)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_${fund}_jv_det_ac ON ${fund}_JEVDetails(AC)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_${fund}_jv_det_rc ON ${fund}_JEVDetails(RC)`);
      }

      // Check if data already exists
      db.get("SELECT count(*) as count FROM general_JEV", (err, row: any) => {
        if (err || !row || row.count === 0) {
          console.log('No data found in SQLite. Generating realistic PPSAS seed dataset...');
          try {
            seedDatabase(db);
            console.log('Seeding fully completed!');
          } catch (seedErr) {
            console.error('Error seeding SQLite database:', seedErr);
            db.close();
            return reject(seedErr);
          }
        } else {
          console.log(`SQLite database verified: ${row.count} General Fund JEVs loaded.`);
        }
        db.close();
        resolve(true);
      });
    });
  });
}

function seedDatabase(db: sqlite3.Database) {
  // Config parameters for Mambusao, Capiz
  const config = [
    'Municipality of Mambusao',
    'Province of Capiz',
    'MA. ANGEL ADORA C. LAUNIO', // Accountant
    'MA. TERESA J. LEYSON',       // Treasurer
    'NESTOR T. SOLANO',          // Budget Officer
    'LEODEGARIO A. LABAO, JR.'    // Mayor
  ];

  // Chart of Accounts definition matching PPSAS (Philippine Public Sector Accounting Standards)
  const coa = [
    // Assets (1-00)
    ['1-01-01-010', 'Cash in Bank - Local Currency, Current Account', 'Debit', 'Assets', null, 'Operating Cash Inflow'],
    ['1-01-01-020', 'Cash in Bank - Local Currency, Savings Account', 'Debit', 'Assets', null, 'Operating Cash Inflow'],
    ['1-03-01-010', 'Accounts Receivable', 'Debit', 'Assets', null, 'Operating Cash Inflow'],
    ['1-03-05-020', 'Due from Special Education Fund', 'Debit', 'Assets', null, null],
    ['1-04-01-010', 'Office Supplies Inventory', 'Debit', 'Assets', null, null],
    ['1-07-03-010', 'Road Networks', 'Debit', 'Assets', null, 'Investing Cash Outflow'],
    ['1-07-04-020', 'School Buildings', 'Debit', 'Assets', null, 'Investing Cash Outflow'],
    ['1-07-05-020', 'Office Equipment', 'Debit', 'Assets', null, 'Investing Cash Outflow'],
    // Liabilities (2-00)
    ['2-01-01-010', 'Accounts Payable', 'Credit', 'Liabilities', null, 'Operating Cash Outflow'],
    ['2-01-02-010', 'Due to Officers and Employees', 'Credit', 'Liabilities', null, 'Operating Cash Outflow'],
    ['2-02-01-010', 'Due to BIR', 'Credit', 'Liabilities', null, 'Operating Cash Outflow'],
    ['2-02-01-020', 'Due to GSIS', 'Credit', 'Liabilities', null, 'Operating Cash Outflow'],
    ['2-02-01-030', 'Due to Pag-IBIG', 'Credit', 'Liabilities', null, 'Operating Cash Outflow'],
    ['2-02-01-040', 'Due to PhilHealth', 'Credit', 'Liabilities', null, 'Operating Cash Outflow'],
    // Equity (3-00)
    ['3-01-01-010', 'Government Equity', 'Credit', 'Equity', null, null],
    // Revenue (4-00)
    ['4-01-01-010', 'Tax Revenue - Fine and Penalties', 'Credit', 'Revenue', 'Revenue', 'Operating Cash Inflow'],
    ['4-01-02-040', 'Share from Internal Revenue Allotment (IRA)', 'Credit', 'Revenue', 'Revenue', 'Operating Cash Inflow'],
    ['4-01-02-010', 'Special Education Tax', 'Credit', 'Revenue', 'Revenue', 'Operating Cash Inflow'],
    ['4-02-01-010', 'Business Income - Stall Fees', 'Credit', 'Revenue', 'Revenue', 'Operating Cash Inflow'],
    ['4-02-02-230', 'Market Fees', 'Credit', 'Revenue', 'Revenue', 'Operating Cash Inflow'],
    ['4-02-02-240', 'Slaughterhouse Fees', 'Credit', 'Revenue', 'Revenue', 'Operating Cash Inflow'],
    // Expenses (5-00)
    ['5-01-01-010', 'Salaries and Wages - Regular', 'Debit', 'Expenses', 'Expenses', 'Operating Cash Outflow'],
    ['5-01-02-010', 'Personnel Economic Relief Allowance (PERA)', 'Debit', 'Expenses', 'Expenses', 'Operating Cash Outflow'],
    ['5-01-02-050', 'Representation Allowance (RA)', 'Debit', 'Expenses', 'Expenses', 'Operating Cash Outflow'],
    ['5-02-01-010', 'Traveling Expenses - Local', 'Debit', 'Expenses', 'Expenses', 'Operating Cash Outflow'],
    ['5-02-03-010', 'Office Supplies Expenses', 'Debit', 'Expenses', 'Expenses', 'Operating Cash Outflow'],
    ['5-02-11-030', 'Representation Expenses', 'Debit', 'Expenses', 'Expenses', 'Operating Cash Outflow'],
    ['5-02-13-040', 'Repairs and Maintenance - Buildings', 'Debit', 'Expenses', 'Expenses', 'Operating Cash Outflow'],
    ['5-02-13-030', 'Repairs and Maintenance - Infrastructure Assets', 'Debit', 'Expenses', 'Expenses', 'Operating Cash Outflow']
  ];

  // Responsibility Centers (RC)
  const rcs = [
    ['1011', 'Office of the Municipal Mayor', 'Mayor\'s Office', 'Executive Administration', 'Administrative', 1],
    ['1021', 'Office of the Sangguniang Bayan', 'Legislative', 'Local Legislation', 'Legislative', 1],
    ['1071', 'Municipal Budget Office', 'Budget', 'Budget Operations', 'Administrative', 1],
    ['1081', 'Municipal Accounting Office', 'Accounting', 'Accounting Records', 'Administrative', 1],
    ['1091', 'Municipal Treasury Office', 'Treasury', 'Revenue & Payments', 'Administrative', 1],
    ['1101', 'Municipal Education Department', 'Education', 'Education Support', 'Social Services', 1],
    ['1111', 'Municipal Economic Enterprise (MEEDO)', 'MEEDO', 'Market & Slaughterhouse Operations', 'Economic Enterprise', 1],
    ['1121', 'Municipal Engineering Services', 'Engineering', 'Infrastructure Construction', 'Infrastructure', 1]
  ];

  // Banks
  const banks = [
    ['1-01-01-010', '0142-1045-21', 'Land Bank of the Philippines - Mambusao Branch', 'Mambusao Highway, Capiz'],
    ['1-01-01-020', '1549-0943-12', 'Development Bank of the Philippines - Roxas City Branch', 'Roxas City, Capiz']
  ];

  // Generate data for all 5 funds
  for (const fund of Object.keys(FUNDS)) {
    // Config
    const stmtConfig = db.prepare(`
      INSERT OR REPLACE INTO ${fund}_Config (Municipality, Province, Accountant, Treasurer, Budget_Officer, Mayor)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmtConfig.run(config);
    stmtConfig.finalize();

    // Banks
    const stmtBank = db.prepare(`
      INSERT OR REPLACE INTO ${fund}_Bank (AC, Account_Number, Bank_Name, Address)
      VALUES (?, ?, ?, ?)
    `);
    for (const bank of banks) {
      stmtBank.run(bank);
    }
    stmtBank.finalize();

    // Responsibility Centers
    const stmtRC = db.prepare(`
      INSERT OR REPLACE INTO ${fund}_RC (RC_Code, Description, Office, FunctionProgramProject, Classification, Active_Flag)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const rc of rcs) {
      stmtRC.run(rc);
    }
    stmtRC.finalize();

    // COAs
    const stmtAC = db.prepare(`
      INSERT OR REPLACE INTO ${fund}_AC (AC_Code, Title, Nature, BalanceSheetCategory, IncomeStatementCategory, CashflowCategory)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const account of coa) {
      stmtAC.run(account);
    }
    stmtAC.finalize();
  }

  // Generate JEV Records & Details spanning 2017 to 2020 (to keep memory load reasonable but enough depth)
  const payees = [
    'Mambusao Water District', 'Capiz Electric Cooperative (CAPELCO)',
    'Mercury Drug Roxas Branch', 'Petron Mambusao Retail Station', 'Mambusao Construction Supply',
    'J&F Office Logistics', 'DepEd Capiz - Mambusao West', 'Capiz State University (CAPSU)',
    'Mambusao Market Cooperative', 'Solid Concrete Specialists', 'LGU Payroll Group'
  ];

  const years = [2017, 2018, 2019, 2020];
  let obrNo = 2000;
  let jevCount = 300;

  for (const fund of Object.keys(FUNDS)) {
    for (const year of years) {
      for (let month = 1; month <= 12; month++) {
        const mStr = month < 10 ? `0${month}` : `${month}`;
        const dateStr = `${year}-${mStr}-15`;

        // 1. Monthly Collections
        jevCount++;
        const jevNumColl = `JEV-${year}-${mStr}-${jevCount}`;
        const descriptionColl = `To record municipal tax collections and operating income for ${mStr}/${year}`;
        const payeeColl = 'Municipal Treasurer - Collections Officer';

        // High fidelity collection formulas depend on the fund type
        let collectionAmount = 0;
        let revenueAccount = '4-01-01-010'; // Fine and Penalties by default

        if (fund === 'general') {
          collectionAmount = Math.floor(Math.random() * 1500000) + 2000000; // 2M to 3.5M
          revenueAccount = '4-01-02-040'; // IRA share
        } else if (fund === 'sef') {
          collectionAmount = Math.floor(Math.random() * 300000) + 150000; // 150k to 450k
          revenueAccount = '4-01-02-010'; // Special Education Tax
        } else if (fund === 'devfund') {
          collectionAmount = Math.floor(Math.random() * 800000) + 500000; // 500k to 1.3M
          revenueAccount = '4-01-02-040'; // IRA 20% portion
        } else if (fund === 'trust') {
          collectionAmount = Math.floor(Math.random() * 400000) + 100000; // 100k to 500k
          revenueAccount = '4-01-01-010'; // Grunts held in trust
        } else if (fund === 'meedo') {
          collectionAmount = Math.floor(Math.random() * 500000) + 300000; // 300k to 800k
          revenueAccount = Math.random() > 0.5 ? '4-02-02-230' : '4-02-02-240'; // Market Fees vs Slaughterhouse
        }

        // Apply a multiplier for year growth
        const multiplier = 1 + (year - 2017) * 0.08;
        const adjustedColl = Math.round(collectionAmount * multiplier);

        // Insert JEV Collection
        db.run(`
          INSERT INTO ${fund}_JEV (JEV_Number, Date, JEV_Type, Description, Payee, Check_Number, Check_Date, DV_Number, ALOVS, Closing_Flag)
          VALUES (?, ?, 'Collection', ?, ?, NULL, NULL, ?, NULL, 0)
        `, [jevNumColl, dateStr, descriptionColl, payeeColl, `DV-C-${year}-${mStr}`]);

        // Capture last JEV ID
        db.get(`SELECT last_insert_rowid() as id`, (err, rowId: any) => {
          const checkAc = Math.random() > 0.4 ? '1-01-01-010' : '1-01-01-020';
          // Debit Bank, Credit Revenue
          db.run(`INSERT INTO ${fund}_JEVDetails (JEV_ID, AC, RC, Debit, Credit) VALUES (?, ?, '1091', ?, 0)`, [rowId.id, checkAc, adjustedColl]);
          db.run(`INSERT INTO ${fund}_JEVDetails (JEV_ID, AC, RC, Debit, Credit) VALUES (?, ?, '1091', 0, ?)`, [rowId.id, revenueAccount, adjustedColl]);
        });


        // 2. Monthly Disbursements (usually multiple transactions)
        const disbCount = fund === 'general' ? 3 : 2;
        for (let d = 1; d <= disbCount; d++) {
          jevCount++;
          const jevNumDisb = `JEV-${year}-${mStr}-${jevCount}`;
          const currentPayee = payees[Math.floor(Math.random() * payees.length)];
          const chkNum = `CHK-${year % 100}${mStr}${jevCount}`;
          const dvNum = `DV-${year}-${mStr}-${jevCount}`;
          const alovsNum = `ALOVS-${year}-${mStr}-${jevCount}`;
          const chkDateVal = `${year}-${mStr}-18`;

          // Expense formulas
          let expenseAmount = 0;
          let expenseAccount = '5-02-03-010'; // Office supplies
          let responsibilityCenter = '1011'; // Mayor

          if (fund === 'general') {
            expenseAmount = Math.floor(Math.random() * 500000) + 400000;
            expenseAccount = Math.random() > 0.5 ? '5-01-01-010' : '5-02-01-010'; // Payroll regular vs Travel
            responsibilityCenter = Math.random() > 0.5 ? '1011' : '1081'; // Mayor vs Accounting
          } else if (fund === 'sef') {
            expenseAmount = Math.floor(Math.random() * 100000) + 50000;
            expenseAccount = '5-02-13-040'; // Repairs to School Buildings
            responsibilityCenter = '1101'; // Education Office
          } else if (fund === 'devfund') {
            expenseAmount = Math.floor(Math.random() * 300000) + 200000;
            expenseAccount = '5-02-13-030'; // Repairs to Infra road networks
            responsibilityCenter = '1121'; // Engineering Office
          } else if (fund === 'trust') {
            expenseAmount = Math.floor(Math.random() * 150000) + 50000;
            expenseAccount = '5-02-11-030'; // Representation
            responsibilityCenter = '1021'; // Sangguniang Bayan
          } else if (fund === 'meedo') {
            expenseAmount = Math.floor(Math.random() * 150000) + 80000;
            expenseAccount = '5-02-03-010'; // Supplies / Stalldev
            responsibilityCenter = '1111'; // MEEDO
          }

          const adjustedExp = Math.round(expenseAmount * multiplier);

          // Insert JEV Disbursement
          db.run(`
            INSERT INTO ${fund}_JEV (JEV_Number, Date, JEV_Type, Description, Payee, Check_Number, Check_Date, DV_Number, ALOVS, Closing_Flag)
            VALUES (?, ?, 'Disbursement', ?, ?, ?, ?, ?, ?, 0)
          `, [
            jevNumDisb, 
            dateStr, 
            `Disbursement voucher payment of operational logistics and payroll expenditures`, 
            currentPayee, 
            chkNum, 
            chkDateVal, 
            dvNum, 
            alovsNum
          ]);

          // Capture disbursement JEV details
          db.get(`SELECT last_insert_rowid() as id`, (err, rowId: any) => {
            const currentJevId = rowId.id;
            const checkAc = Math.random() > 0.5 ? '1-01-01-010' : '1-01-01-020';
            
            // Debit Expense, Credit Cash
            db.run(`INSERT INTO ${fund}_JEVDetails (JEV_ID, AC, RC, Debit, Credit) VALUES (?, ?, ?, ?, 0)`, [currentJevId, expenseAccount, responsibilityCenter, adjustedExp]);
            db.run(`INSERT INTO ${fund}_JEVDetails (JEV_ID, AC, RC, Debit, Credit) VALUES (?, ?, ?, 0, ?)`, [currentJevId, checkAc, '1091', adjustedExp]);

            // Create active corresponding ObR (Obligation Request)
            obrNo++;
            db.run(`
              INSERT INTO ${fund}_ObR (ObR_No, Payee, Office, Date, Printed_Name, Position, JEV_ID)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
              `OBR-${year}-${mStr}-${obrNo}`, 
              currentPayee, 
              responsibilityCenter, 
              dateStr, 
              'ENGR. ROMEO T. ABELARDO', 
              'Municipal Project Engineer', 
              currentJevId
            ]);

            // Generate budget configuration as of Month 1 of each year
            if (month === 1 && d === 1) {
              const appropVal = adjustedExp * 12 * 1.15;
              const allotmentVal = adjustedExp * 12 * 1.10;
              db.run(`
                INSERT INTO ${fund}_Budget (Entry_Type, SARO_REF, Date, AC, Appropriation, Allotment_Received, Allotment_Adjustment)
                VALUES ('Annual Budget', ?, ?, ?, ?, ?, 0)
              `, [`SARO-LGU-${year}-${fund.toUpperCase()}`, `${year}-01-02`, expenseAccount, appropVal, allotmentVal]);
            }
          });
        }
      }
    }
  }
}
