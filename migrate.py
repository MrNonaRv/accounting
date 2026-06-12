#!/usr/bin/env python3
"""
Mambusao LGU Accounting System - SQLite Database Migration & Seeding tool.
Compatible with PPSAS (Philippine Public Sector Accounting Standards).

This script:
1. Translates 5 Microsoft Access (.mdb) fund databases into a single unified SQLite database.
2. Uses `mdb-export` (from mdbtools) to dump .mdb tables to CSVs, parses and imports them.
3. Automatically falls back to generating a realistic, complete synthetic PPSAS seed dataset of 
   the Municipality of Mambusao (Capiz) if the raw .mdb files are absent, enabling immediate 
   deployment and offline demonstration!
"""

import os
import sys
import sqlite3
import subprocess
import csv
import datetime

DB_NAME = "mambusao_lgu.db"

# 5 separate funds to support
FUNDS = {
    "general": "General Fund",
    "sef": "Special Education Fund (SEF)",
    "devfund": "20% Development Fund",
    "trust": "Trust Fund",
    "meedo": "MEEDO Fund (Market & Slaughterhouse)"
}

TABLES = ["JEV", "JEVDetails", "AC", "RC", "Budget", "ObR", "Bank", "Config"]

def parse_date(date_str):
    """Parses Philippine dates in MM/DD/YY or MM/DD/YYYY format, returns YYYY-MM-DD."""
    if not date_str:
        return None
    date_str = date_str.strip()
    for fmt in ("%m/%d/%y %H:%M:%S", "%m/%d/%Y %H:%M:%S", "%m/%d/%y", "%m/%d/%Y", "%Y-%m-%d"):
        try:
            return datetime.datetime.strptime(date_str, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return date_str

def execute_mdb_export(mdb_path, table_name, csv_path):
    """Executes mdb-export shell utility to dump a table to CSV."""
    try:
        with open(csv_path, "w", encoding="utf-8") as f:
            subprocess.run(["mdb-export", mdb_path, table_name], stdout=f, check=True)
        return True
    except Exception as e:
        print(f"Error running mdb-export for table {table_name}: {e}")
        return False

def import_csv_to_sqlite(conn, csv_path, sq_table_name):
    """Reads a UTF-8 encoded CSV and inserts/loads all rows into SQLite."""
    cursor = conn.cursor()
    if not os.path.exists(csv_path):
        print(f"CSV file not found: {csv_path}")
        return

    with open(csv_path, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.reader(f)
        try:
            headers = next(reader)
        except StopIteration:
            return

        # Prepare column mapping
        columns = [h.replace(" ", "_").replace("-", "_") for h in headers]
        
        # Check table schema and construct insert statements
        cursor.execute(f"PRAGMA table_info({sq_table_name})")
        columns_info = {col[1].lower(): col[2] for col in cursor.fetchall()}
        
        insert_cols = []
        val_placeholders = []
        for col in columns:
            if col.lower() in columns_info:
                insert_cols.append(col)
                val_placeholders.append("?")

        sql = f"INSERT INTO {sq_table_name} ({', '.join(insert_cols)}) VALUES ({', '.join(val_placeholders)})"
        
        row_count = 0
        for r in reader:
            if not r or len(r) != len(headers):
                continue
            # Parse Dates
            parsed_row = []
            for col_idx, label in enumerate(columns):
                if label.lower() in columns_info:
                    val = r[col_idx]
                    col_type = columns_info[label.lower()]
                    if "date" in label.lower() and val:
                        val = parse_date(val)
                    elif col_type == "INTEGER" or col_type == "NUMERIC":
                        val = val.replace(",", "").strip() if val else None
                    parsed_row.append(val)
            
            try:
                cursor.execute(sql, parsed_row)
                row_count += 1
            except Exception as e:
                pass
        
        conn.commit()
        print(f"Loaded {row_count} rows into SQLite table {sq_table_name}")

def setup_sqlite_schema(conn):
    """Initializes tables for all 5 funds with SQLite compatibility."""
    cursor = conn.cursor()
    for prefix in FUNDS.keys():
        print(f"Defining core PPSAS schematics for fund: {prefix.upper()}")
        
        # JEV
        cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS {prefix}_JEV (
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
        )""")
        
        # JEVDetails (With index support for high volume data optimizing)
        cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS {prefix}_JEVDetails (
            Entry_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            JEV_ID INTEGER,
            AC TEXT,
            RC TEXT,
            Debit REAL,
            Credit REAL,
            FOREIGN KEY(JEV_ID) REFERENCES {prefix}_JEV(JEV_ID)
        )""")
        
        # AC (Chart of Accounts)
        cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS {prefix}_AC (
            AC_Code TEXT PRIMARY KEY,
            Title TEXT,
            Nature TEXT,
            BalanceSheetCategory TEXT,
            IncomeStatementCategory TEXT,
            CashflowCategory TEXT
        )""")
        
        # RC (Responsibility Centers)
        cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS {prefix}_RC (
            RC_Code TEXT PRIMARY KEY,
            Description TEXT,
            Office TEXT,
            FunctionProgramProject TEXT,
            Classification TEXT,
            Active_Flag INTEGER DEFAULT 1
        )""")
        
        # Budget
        cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS {prefix}_Budget (
            Budget_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            Entry_Type TEXT,
            SARO_REF TEXT,
            Date TEXT,
            AC TEXT,
            Appropriation REAL,
            Allotment_Received REAL,
            Allotment_Adjustment REAL,
            FOREIGN KEY(AC) REFERENCES {prefix}_AC(AC_Code)
        )""")
        
        # ObR
        cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS {prefix}_ObR (
            ObR_No TEXT PRIMARY KEY,
            Payee TEXT,
            Office TEXT,
            Date TEXT,
            Printed_Name TEXT,
            Position TEXT,
            JEV_ID INTEGER,
            FOREIGN KEY(JEV_ID) REFERENCES {prefix}_JEV(JEV_ID)
        )""")
        
        # Bank
        cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS {prefix}_Bank (
            AC TEXT,
            Account_Number TEXT,
            Bank_Name TEXT,
            Address TEXT,
            PRIMARY KEY(AC)
        )""")
        
        # Config (License Information)
        cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS {prefix}_Config (
            Municipality TEXT,
            Province TEXT,
            Accountant TEXT,
            Treasurer TEXT,
            Budget_Officer TEXT,
            Mayor TEXT
        )""")
        
        # Create performance indexes
        cursor.execute(f"CREATE INDEX IF NOT EXISTS idx_{prefix}_jev_date ON {prefix}_JEV(Date)")
        cursor.execute(f"CREATE INDEX IF NOT EXISTS idx_{prefix}_jv_det_jev ON {prefix}_JEVDetails(JEV_ID)")
        cursor.execute(f"CREATE INDEX IF NOT EXISTS idx_{prefix}_jv_det_ac ON {prefix}_JEVDetails(AC)")
        cursor.execute(f"CREATE INDEX IF NOT EXISTS idx_{prefix}_jv_det_rc ON {prefix}_JEVDetails(RC)")

    conn.commit()

def generate_mock_data(conn):
    """
    Generates an premium, comprehensive synthetic PPSAS-compliant Mambusao LGU database.
    Provides complete trial balance equations, multi-year JEVs, and actual offices.
    """
    import random
    cursor = conn.cursor()
    print("MDB files absent. Generating default high-fidelity demo database...")

    # Chart of Accounts definitions (PPSAS compliant)
    chart_of_accounts = [
        # Assets (1-xx)
        ("1-01-01-010", "Cash in Bank - Local Currency, Current Account", "Debit", "Assets", None, "Operating Cash Inflow"),
        ("1-01-01-020", "Cash in Bank - Local Currency, Savings Account", "Debit", "Assets", None, "Operating Cash Inflow"),
        ("1-03-01-010", "Accounts Receivable", "Debit", "Assets", None, "Operating Cash Inflow"),
        ("1-03-05-020", "Due from Special Education Fund", "Debit", "Assets", None, None),
        ("1-04-01-010", "Office Supplies Inventory", "Debit", "Assets", None, None),
        ("1-07-03-010", "Road Networks", "Debit", "Assets", None, "Investing Cash Outflow"),
        ("1-07-04-020", "School Buildings", "Debit", "Assets", None, "Investing Cash Outflow"),
        ("1-07-05-020", "Office Equipment", "Debit", "Assets", None, "Investing Cash Outflow"),
        # Liabilities (2-xx)
        ("2-01-01-010", "Accounts Payable", "Credit", "Liabilities", None, "Operating Cash Outflow"),
        ("2-01-02-010", "Due to Officers and Employees", "Credit", "Liabilities", None, "Operating Cash Outflow"),
        ("2-02-01-010", "Due to BIR", "Credit", "Liabilities", None, "Operating Cash Outflow"),
        ("2-02-01-020", "Due to GSIS", "Credit", "Liabilities", None, "Operating Cash Outflow"),
        ("2-02-01-030", "Due to Pag-IBIG", "Credit", "Liabilities", None, "Operating Cash Outflow"),
        ("2-02-01-040", "Due to PhilHealth", "Credit", "Liabilities", None, "Operating Cash Outflow"),
        # Equity (3-xx)
        ("3-01-01-010", "Government Equity", "Credit", "Equity", None, None),
        # Revenue (4-xx)
        ("4-01-01-010", "Tax Revenue - Fine and Penalties", "Credit", "Revenue", "Revenue", "Operating Cash Inflow"),
        ("4-01-02-040", "Share from Internal Revenue Allotment (IRA)", "Credit", "Revenue", "Revenue", "Operating Cash Inflow"),
        ("4-02-01-010", "Business Income - Stall Fees", "Credit", "Revenue", "Revenue", "Operating Cash Inflow"),
        ("4-02-02-230", "Market Fees", "Credit", "Revenue", "Revenue", "Operating Cash Inflow"),
        ("4-02-02-240", "Slaughterhouse Fees", "Credit", "Revenue", "Revenue", "Operating Cash Inflow"),
        ("4-01-02-010", "Special Education Tax", "Credit", "Revenue", "Revenue", "Operating Cash Inflow"),
        # Expenses (5-xx)
        ("5-01-01-010", "Salaries and Wages - Regular", "Debit", "Expenses", "Expenses", "Operating Cash Outflow"),
        ("5-01-02-010", "Personnel Economic Relief Allowance (PERA)", "Debit", "Expenses", "Expenses", "Operating Cash Outflow"),
        ("5-01-02-050", "Representation Allowance (RA)", "Debit", "Expenses", "Expenses", "Operating Cash Outflow"),
        ("5-02-01-010", "Traveling Expenses - Local", "Debit", "Expenses", "Expenses", "Operating Cash Outflow"),
        ("5-02-03-010", "Office Supplies Expenses", "Debit", "Expenses", "Expenses", "Operating Cash Outflow"),
        ("5-02-11-030", "Representation Expenses", "Debit", "Expenses", "Expenses", "Operating Cash Outflow"),
        ("5-02-13-040", "Repairs and Maintenance - Buildings", "Debit", "Expenses", "Expenses", "Operating Cash Outflow"),
        ("5-02-13-030", "Repairs and Maintenance - Infrastructure Assets", "Debit", "Expenses", "Expenses", "Operating Cash Outflow")
    ]

    # Responsibility Centers (RC)
    rc_centers = [
        ("1011", "Office of the Municipal Mayor", "Mayor's Office", "Executive Administration", "Administrative", 1),
        ("1021", "Office of the Sangguniang Bayan", "Legislative", "Local Legislation", "Legislative", 1),
        ("1071", "Municipal Budget Office", "Budget", "Budget Operations", "Administrative", 1),
        ("1081", "Municipal Accounting Office", "Accounting", "Accounting Records", "Administrative", 1),
        ("1091", "Municipal Treasury Office", "Treasury", "Revenue & Payments", "Administrative", 1),
        ("1101", "Municipal Education Department", "Education", "Education Support", "Social Services", 1),
        ("1111", "Municipal Economic Enterprise", "MEEDO", "Market & Slaughterhouse Operations", "Economic Enterprise", 1),
        ("1121", "Municipal Engineering Services", "Engineering", "Infrastructure Construction", "Infrastructure", 1)
    ]

    # Bank accounts
    bank_accounts = [
        ("1-01-01-010", "0142-1045-21", "Land Bank of the Philippines - Mambusao Branch", "Mambusao Highway, Capiz"),
        ("1-01-01-020", "1549-0943-12", "Development Bank of the Philippines - Roxas City Branch", "Roxas City, Capiz")
    ]

    # Config (Mambusao, Capiz details)
    config_details = (
        "Municipality of Mambusao",
        "Province of Capiz",
        "MA. ANGEL ADORA C. LAUNIO",
        "MA. TERESA J. LEYSON", # Treasurer
        "NESTOR T. SOLANO", # Budget Officer
        "LEODEGARIO A. LABAO, JR." # Mayor
    )

    # Insert global master records for each fund
    for prefix in FUNDS.keys():
        # Config
        cursor.execute(f"""
            INSERT OR REPLACE INTO {prefix}_Config 
            (Municipality, Province, Accountant, Treasurer, Budget_Officer, Mayor)
            VALUES (?, ?, ?, ?, ?, ?)
        """, config_details)

        # Bank accounts
        for bank in bank_accounts:
            cursor.execute(f"INSERT OR REPLACE INTO {prefix}_Bank (AC, Account_Number, Bank_Name, Address) VALUES (?,?,?,?)", bank)

        # Responsibility Centers
        for rc in rc_centers:
            # Filters depending on fund (MEEDO office primarily active in MEEDO fund, Education in SEF)
            cursor.execute(f"""
                INSERT OR REPLACE INTO {prefix}_RC (RC_Code, Description, Office, FunctionProgramProject, Classification, Active_Flag)
                VALUES (?, ?, ?, ?, ?, ?)
            """, rc)

        # Chart of Accounts
        for ac in chart_of_accounts:
            # Custom fit AC per fund
            cursor.execute(f"""
                INSERT OR REPLACE INTO {prefix}_AC (AC_Code, Title, Nature, BalanceSheetCategory, IncomeStatementCategory, CashflowCategory)
                VALUES (?, ?, ?, ?, ?, ?)
            """, ac)

    conn.commit()

    # Generate synthetic JEVs (Vouchers) spanning 2005 - 2020
    # Make sure we have standard, high quality debit and credit alignments for beautiful charts!
    payees = [
        "Mambusao Water District", "Capiz Electric Cooperative (CAPELCO)",
        "Mercury Drug Roxas", "Petron Mambusao Service Station", "Mambusao Poly-Trading INC",
        "J&F Office Builders", "DepEd Capiz - Mambusao West District", "Capiz State University - Mambusao Campus",
        "Mambusao Market Vendors Association", "Royal Builders Roxas", "Solid Engineering Services",
        "LGU Personnel Payroll Group"
    ]

    jev_counter = {f: 100 for f in FUNDS.keys()}
    obr_counter = 1000

    # Years
    years = list(range(2005, 2021))

    for yr in years:
        for month in range(1, 13):
            # Collections & Disbursements per month per fund
            # Seed varying distributions to make charts look great
            for fund in FUNDS.keys():
                # Define baseline amounts for mock diversity
                if fund == "general":
                    collection_amount_base = random.randint(1200000, 3500000)
                    disb_amount_base = random.randint(1000000, 3000000)
                elif fund == "sef":
                    collection_amount_base = random.randint(150000, 600000)
                    disb_amount_base = random.randint(120000, 50000)
                elif fund == "devfund":
                    collection_amount_base = random.randint(400000, 1200000)
                    disb_amount_base = random.randint(350000, 1100000)
                elif fund == "meedo":
                    collection_amount_base = random.randint(200000, 700000)
                    disb_amount_base = random.randint(150000, 550000)
                else: # Trust
                    collection_amount_base = random.randint(100000, 450000)
                    disb_amount_base = random.randint(80000, 400000)

                # Ensure dynamic variations over years (growth)
                modifier = 1.0 + (yr - 2005) * 0.05
                collections_val = float(collection_amount_base * modifier)
                disb_val = float(disb_amount_base * modifier)

                m_str = f"{month:02d}"
                dt_jev = f"{yr}-{m_str}-05"
                dt_chk = f"{yr}-{m_str}-06"

                # 1. Collection JEV
                jev_counter[fund] += 1
                jev_no_coll = f"{yr}-{m_str}-{jev_counter[fund]}"
                desc_coll = f"Receipt of monthly collection allotments, revenue fees, and tax proceeds"
                payee_coll = "LGU Mambusao Revenue Dept"
                
                cursor.execute(f"""
                    INSERT INTO {fund}_JEV (JEV_Number, Date, JEV_Type, Description, Payee, Check_Number, Check_Date, DV_Number, ALOVS, Closing_Flag)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (jev_no_coll, dt_jev, "Collection", desc_coll, payee_coll, None, None, f"DV-C-{yr}-{m_str}", None, 0))
                jev_id_coll = cursor.lastrowid

                # double entry for collections (Debit Cash, Credit Revenue/IRA)
                # Revenue allocation
                is_cat = "Revenue"
                # Determine revenue accounts
                rev_ac = "4-01-02-040" if fund in ("general", "devfund") else ("4-01-02-010" if fund == "sef" else "4-02-02-230")
                if fund == "meedo": rev_ac = "4-02-01-010"

                # Cash Account
                cash_ac = "1-01-01-010" if random.choice([True, False]) else "1-01-01-020"

                # Double entry detail rows
                cursor.execute(f"INSERT INTO {fund}_JEVDetails (JEV_ID, AC, RC, Debit, Credit) VALUES (?, ?, ?, ?, ?)",
                               (jev_id_coll, cash_ac, "1091", collections_val, 0.0))
                cursor.execute(f"INSERT INTO {fund}_JEVDetails (JEV_ID, AC, RC, Debit, Credit) VALUES (?, ?, ?, ?, ?)",
                               (jev_id_coll, rev_ac, "1091", 0.0, collections_val))

                # 2. Disbursement JEV
                jev_counter[fund] += 1
                jev_no_disb = f"{yr}-{m_str}-{jev_counter[fund]}"
                payee_disb = random.choice(payees)
                desc_disb = f"Payment for quarterly supplies, operational resources, or project capital expenditures to {payee_disb}"
                chk_no = f"CHK-{yr % 100}{m_str}{random.randint(1000, 9999)}"

                cursor.execute(f"""
                    INSERT INTO {fund}_JEV (JEV_Number, Date, JEV_Type, Description, Payee, Check_Number, Check_Date, DV_Number, ALOVS, Closing_Flag)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (jev_no_disb, dt_jev, "Disbursement", desc_disb, payee_disb, chk_no, dt_chk, f"DV-D-{yr}-{m_str}", f"AL-{yr}-{m_str}", 0))
                jev_id_disb = cursor.lastrowid

                # Expense Account
                exp_ac = random.choice(["5-01-01-010", "5-01-02-010", "5-02-01-010", "5-02-03-010", "5-02-11-030", "5-02-13-040"])
                if fund == "devfund":
                    exp_ac = "5-02-13-030" # Road/infra
                elif fund == "sef":
                    exp_ac = "5-02-13-040" # Building upkeep
                
                # Office Responsibility Center
                disb_rc = random.choice(["1011", "1021", "1071", "1081"])
                if fund == "meedo":
                    disb_rc = "1111"
                elif fund == "sef":
                    disb_rc = "1101"

                # Double entry for disbursements (Debit Expense/Liability, Credit Cash)
                cursor.execute(f"INSERT INTO {fund}_JEVDetails (JEV_ID, AC, RC, Debit, Credit) VALUES (?, ?, ?, ?, ?)",
                               (jev_id_disb, exp_ac, disb_rc, disb_val, 0.0))
                cursor.execute(f"INSERT INTO {fund}_JEVDetails (JEV_ID, AC, RC, Debit, Credit) VALUES (?, ?, ?, ?, ?)",
                               (jev_id_disb, cash_ac, "1091", 0.0, disb_val))

                # 3. Create active ObR (Obligation Request) matching the JEV
                obr_counter += 1
                cursor.execute(f"""
                    INSERT INTO {fund}_ObR (ObR_No, Payee, Office, Date, Printed_Name, Position, JEV_ID)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (f"OBR-{yr}-{m_str}-{obr_counter}", payee_disb, disb_rc, dt_jev, "ENGR. ROMEO T. ABELARDO", "Municipal Project Engineer", jev_id_disb))

                # 4. Generate Budget Entries for the major Account Codes
                # One budget setup record per account code for current year budget
                if month == 1:
                    approp = collections_val * 1.12
                    allot_rec = collections_val * 1.10
                    cursor.execute(f"""
                        INSERT INTO {fund}_Budget (Entry_Type, SARO_REF, Date, AC, Appropriation, Allotment_Received, Allotment_Adjustment)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, ("Annual Budget", f"SARO-LGU-{yr}-A", f"{yr}-01-03", exp_ac, approp, allot_rec, 0))

    conn.commit()
    print("Pre-population completed correctly.")

def run_migration_or_seed():
    """Main process handler."""
    # Let's inspect directory to check if physical .mdb files exist
    mdb_files_present = False
    mdb_mapping = {}
    
    # Simple check for any files ending in .mdb or .accdb
    for f in os.listdir("."):
        if f.lower().endswith(".mdb") or f.lower().endswith(".accdb"):
            mdb_files_present = True
            # Build fund matching based on filename
            f_lower = f.lower()
            if "general" in f_lower:
                mdb_mapping["general"] = f
            elif "sef" in f_lower or "school" in f_lower:
                mdb_mapping["sef"] = f
            elif "dev" in f_lower or "20" in f_lower:
                mdb_mapping["devfund"] = f
            elif "trust" in f_lower:
                mdb_mapping["trust"] = f
            elif "meedo" in f_lower or "market" in f_lower:
                mdb_mapping["meedo"] = f

    # Connect to local sqlite
    conn = sqlite3.connect(DB_NAME)
    setup_sqlite_schema(conn)

    if mdb_files_present:
        print(f"Discovered physical .mdb database sources! Starting batch extraction using mdb-export...")
        for fund, mdb_file in mdb_mapping.items():
            print(f"Migrating {FUNDS[fund]} from source: {mdb_file}")
            
            # Temporary directory for clean workspace CSV storage
            os.makedirs("tmp_csv", exist_ok=True)
            
            for table in TABLES:
                csv_path = f"tmp_csv/{fund}_{table}.csv"
                sqlite_table = f"{fund}_{table}"
                
                # Check for direct file translation
                success = execute_mdb_export(mdb_file, table, csv_path)
                if success:
                    # Wipe table first to avoid duplication
                    cursor = conn.cursor()
                    cursor.execute(f"DELETE FROM {sqlite_table}")
                    conn.commit()
                    import_csv_to_sqlite(conn, csv_path, sqlite_table)
                else:
                    print(f"Skipping import for table {table} as export failed.")
        
        # Clean up tmp csv directory
        if os.path.exists("tmp_csv"):
            import shutil
            shutil.rmtree("tmp_csv")
    else:
        # Check if database already matches some rows, if so, skip generating
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='general_JEV'")
        table_exists = cursor.fetchone()
        
        has_rows = False
        if table_exists:
            cursor.execute("SELECT count(*) FROM general_JEV")
            has_rows = (cursor.fetchone()[0] > 0)

        if not has_rows:
            generate_mock_data(conn)
        else:
            print("SQLite database verified. Skipping seed generation as data already present.")

    conn.close()
    print(f"Unified SQLite DB generated safely: {DB_NAME}")

if __name__ == "__main__":
    run_migration_or_seed()
