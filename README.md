# Municipality of Mambusao LGU Accounting System

A fast, web-based, PPSAS-compliant (Philippine Public Sector Accounting Standards) Double-Entry Accounting System engineered for the **Municipality of Mambusao, Province of Capiz, Philippines**.

This system handles multi-fund ledger control, dynamic trial balances, budget allocation monitoring, and official Statement of Position reports derived straight from SQLite data structures translated from physical Microsoft Access (`.mdb`) legacy archives.

---

## 🏛️ CORE CAPABILITIES & SYSTEM ARCHITECTURE

The application implements standard Philippine public sector double-entry bookkeeping rules:
1. **Multi-Fund Segregation**: Supports 5 separate treasury books with isolated account registers:
   - General Fund
   - Special Education Fund (SEF)
   - 20% Development Fund
   - Trust Fund
   - MEEDO Fund (Market & Slaughterhouse Enterprise)
2. **Post-Audit Trial Balance**: Dynamically aggregates ledger items, grouping by Balance Sheet (Assets, Liabilities, Equity) and Income Statement (Revenue, Expenses) schemas, verifying that overall Debits equal Credits.
3. **Budget Compliance Sheet**: Computes allotment balances in real-time (`Allotment + Adjustments - Obligations`), automatically flagging over-appropriations.
4. **Official Statement of Position reports**: Instant Statements of Financial Position (Balance Sheet), Financial Performance (Income Statement), and Cash Flows formatting with printable, pre-audited signature layouts for Municipal leaders.

---

## 🛠️ THE MIGRATION UTILITY (`migrate.py`)

The provided migration utility (`migrate.py`) automates physical `.mdb` extraction:
- **Dependency**: Uses the shell binary `mdb-export` (from `mdbtools`).
- **Translation Engine**: Translates all 8 PPSAS tables, parses Philippine standard date strings, cleans monetary comma separators, and maps columns into SQLite connections.
- **Unified Schema Table naming**: Prefixes tables by fund, e.g., `general_JEV`, `sef_JEV`, `devfund_JEV`, etc.

### How to execute physical translation:
```bash
# 1. Install mdbtools binaries on your local workstation
# Debian/Ubuntu:
sudo apt-get install mdbtools

# MacOS (via Homebrew):
brew install mdbtools

# 2. Place your 5 physical .mdb files in the workspace matching names:
# e.g., general.mdb, sef.mdb, devfund.mdb, trust.mdb, meedo.mdb

# 3. Trigger the script:
python migrate.py
```
*Note: If run in an environment where physical `.mdb` files are absent, the script automatically triggers a high-fidelity synthetic seeder to launch a dummy SQLite sandbox preloaded with 15 years of transactions (2005 - 2020) so the preview executes seamlessly on developer sandboxes.*

---

## 💻 LOCAL DEV DEPLOYMENT RUNBOOK

This app is built as a unified Express + Vite full-stack server running TypeScript natively.

### Prerequisites:
- **Node.js** (v18 or higher recommended)
- **NPM** (pre-bundled with Node)

### Installation & Execution:
```bash
# 1. Clone the archive and navigate to root
cd mambusao-lgu-accounting

# 2. Install NPM dependencies (compiled binaries for sqlite3)
npm install

# 3. Boot the development system
npm run dev
```
The server mounts Vite middlewares and launches on standard container **Port 3000** (`http://localhost:3000`).

### Production Build compilation:
To bundle and compile the application for deployment containers:
```bash
npm run build
```
This triggers Vite asset compilation to `/dist` and bundles the Express backend server into a single self-contained `/dist/server.cjs` file using esbuild.

---

## 📊 SCHEMATIC LEDGER TABLE DEFINITIONS

Each fund houses corresponding tables in SQLite:
- **JEV**: Represents journal entry voucher headers (payee, check references, DV numbers).
- **JEVDetails**: Holds individual double-entry ledger listings (Dr. and Cr. postings matched by account codes).
- **AC**: The Chart of Accounts regulated by COA.
- **RC**: Responsibility Centers mapping department assignments.
- **Budget**: Appropriation registries.
- **ObR**: Local Obligation Requests.
- **Bank**: Bank accounts mapping.
- **Config**: Municipality officers.
