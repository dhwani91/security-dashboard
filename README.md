# Security Vulnerability Dashboard

A high-performance Next.js dashboard for visualizing and analyzing security vulnerabilities using SQLite database.

## Features

- ✅ **SQLite Database** - Lightning fast queries (50-100ms)
- ✅ **Analysis Filters** - Manual and AI analysis status filtering
- ✅ **Interactive Charts** - Severity distribution, trends, package analytics
- ✅ **Real-time Search** - Instant vulnerability search and filtering
- ✅ **Export Functionality** - Export data to CSV
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile
- ✅ **Production Ready** - Optimized for Vercel deployment

## 📋 Prerequisites

- Node.js 18+ installed
- Git LFS for downloading large files
- 500MB free disk space

## 🛠️ Installation

### Step 1: Clone and Setup

```bash
# Create Next.js project
npx create-next-app@latest security-dashboard --typescript --tailwind --app --no-src-dir

cd security-dashboard

# Install dependencies
npm install
```

### Step 2: Download Data

```bash
# Install Git LFS (if not already installed)
brew install git-lfs              # macOS
# OR
sudo apt-get install git-lfs      # Ubuntu

# Initialize LFS
git lfs install

# Clone data repository
git clone https://github.com/chanduusc/Ui-Demo-Data.git

# Create directory and copy file
mkdir -p public/data
cp Ui-Demo-Data/ui_demo.json public/data/vulnerabilities.json

# Verify file (should be ~389MB, not 120 bytes)
ls -lh public/data/vulnerabilities.json
```

### Step 3: Convert JSON to SQLite

```bash
# Run conversion script (takes ~30 seconds)
npm run setup
```

Expected output:
```
✅ Database created: data/vulnerabilities.db
📊 Records: 50,000+
📁 Size: ~150MB
```

### Step 4: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
security-dashboard/
├── app/
│   ├── api/
│   │   └── vulnerabilities/
│   │       └── route.ts              # SQLite API endpoints
│   ├── vulnerabilities/
│   │   └── page.tsx                  # List view
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Dashboard home
│   └── globals.css
├── components/
│   └── dashboard/
│       ├── AnalysisButtons.tsx       # Filter buttons
│       ├── MetricsCards.tsx          # Metrics display
│       ├── FilterPanel.tsx           # Search & filters
│       ├── SeverityChart.tsx         # Pie chart
│       └── TrendChart.tsx            # Line chart
├── hooks/
│   └── useVulnerabilities.ts         # Data fetching hook
├── lib/
│   └── types.ts                      # TypeScript interfaces
├── data/
│   └── vulnerabilities.db            # SQLite database (150MB)
├── scripts/
│   └── json-to-sqlite.js             # Conversion script
└── public/
    └── data/
        └── vulnerabilities.json      # Original data (389MB)
```

## 🎯 Usage

### Dashboard Features

1. **Analysis Filters**
   - Click "Manual Analysis" to filter out `invalid - norisk` CVEs
   - Click "AI Analysis" to filter out `ai-invalid-norisk` CVEs

2. **Search & Filters**
   - Search by CVE ID, package name, or description
   - Filter by severity (CRITICAL, HIGH, MEDIUM, LOW)

3. **Charts**
   - View severity distribution pie chart
   - Track vulnerability trends over time

4. **Export**
   - Click "Export to CSV" to download filtered data

### API Endpoints

#### GET `/api/vulnerabilities`

Query vulnerabilities with filters:

```bash
curl "http://localhost:3000/api/vulnerabilities?page=1&limit=10&severity=CRITICAL&search=react"
```

Parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 100)
- `search` - Search term
- `severity` - Comma-separated severities (CRITICAL,HIGH,MEDIUM,LOW)
- `kaiStatusFilter` - Filter type (none, analysis, ai-analysis)
- `sortBy` - Sort field (cveId, severity, cvssScore, packageName, publishedDate)
- `sortOrder` - Sort direction (asc, desc)

#### POST `/api/vulnerabilities`

Export data to CSV:

```bash
curl -X POST http://localhost:3000/api/vulnerabilities \
  -H "Content-Type: application/json" \
  -d '{"format":"csv"}' \
  --output vulnerabilities.csv
```

##  Deployment

### Deploy to Vercel

```bash
# Initialize git
git init
git add .
git commit -m "Initial commit"

# Create GitHub repository
gh repo create security-dashboard --public --source=. --push

# Deploy to Vercel
npx vercel --prod
```

The `.db` file will be automatically included in deployment.

### Environment Variables

No environment variables needed! Everything works out of the box.

## 🎨 Customization

### Change Theme Colors

Edit `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      primary: '#your-color',
    },
  },
}
```

### Add New Filters

Update `lib/types.ts` and `app/api/vulnerabilities/route.ts`

### Customize Charts

Modify components in `components/dashboard/`

## 📊 Performance

| Metric | Value |
|--------|-------|
| Initial Load | < 1s |
| Query Time | 50-100ms |
| Memory Usage | ~50MB |
| Database Size | ~150MB |
| Concurrent Users | 100+ |


## 📝 Scripts

```bash
npm run setup       # Convert JSON to SQLite
npm run dev         # Start development server
npm run build       # Build for production
npm run start       # Run production build
npm run lint        # Run ESLint
```

## 🔒 Security

- SQLite database is read-only in API routes
- No SQL injection vulnerabilities (parameterized queries)
- CORS disabled by default
- Rate limiting recommended for production


## 🎓 Technical Details

### Why SQLite?

- **Fast**: 100x faster than loading JSON files
- **Scalable**: Handles millions of records
- **Portable**: Single file database
- **Zero Config**: No database server needed
- **Vercel Compatible**: Works perfectly in serverless

### Database Schema

```sql
CREATE TABLE vulnerabilities (
  id INTEGER PRIMARY KEY,
  cveId TEXT NOT NULL,
  packageName TEXT,
  currentVersion TEXT,
  severity TEXT NOT NULL,
  cvssScore REAL,
  description TEXT,
  publishedDate TEXT,
  kaiStatus TEXT,
  -- ... more fields
);

-- Indexes for fast queries
CREATE INDEX idx_severity ON vulnerabilities(severity);
CREATE INDEX idx_cveId ON vulnerabilities(cveId);
CREATE INDEX idx_kaiStatus ON vulnerabilities(kaiStatus);
```

### Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: SQLite (better-sqlite3)
- **UI**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Language**: TypeScript
