// scripts/json-to-sqlite.js
// One-time conversion script: JSON → SQLite

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

console.log('═══════════════════════════════════════════════════');
console.log('🔄 Converting JSON to SQLite Database');
console.log('═══════════════════════════════════════════════════\n');

// Paths
const jsonPath = path.join(__dirname, '../public/data/vulnerabilities.json');
const dbPath = path.join(__dirname, '../data/vulnerabilities.db');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✅ Created data directory\n');
}

// Check if JSON file exists
if (!fs.existsSync(jsonPath)) {
  console.error('❌ ERROR: JSON file not found!');
  console.error(`   Expected location: ${jsonPath}\n`);
  console.error('📥 Please download the file first:');
  console.error('   1. git lfs install');
  console.error('   2. git clone https://github.com/chanduusc/Ui-Demo-Data.git');
  console.error('   3. mkdir -p public/data');
  console.error('   4. cp Ui-Demo-Data/ui_demo.json public/data/vulnerabilities.json\n');
  process.exit(1);
}

// Check file size
const stats = fs.statSync(jsonPath);
const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
console.log(`📁 Source JSON file: ${sizeMB} MB`);

// Check if it's a Git LFS pointer (not actual file)
const firstBytes = fs.readFileSync(jsonPath, 'utf-8').slice(0, 100);
if (firstBytes.includes('git-lfs.github.com')) {
  console.error('\n❌ ERROR: This is a Git LFS pointer file, not the actual JSON!');
  console.error('   Run: git lfs pull\n');
  process.exit(1);
}

console.log('✅ JSON file verified\n');

// Create/open database
console.log('📊 Creating database schema...');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create table with indexes
db.exec(`
  DROP TABLE IF EXISTS vulnerabilities;
  
  CREATE TABLE vulnerabilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cveId TEXT NOT NULL,
    packageName TEXT,
    currentVersion TEXT,
    fixedVersion TEXT,
    severity TEXT NOT NULL,
    cvssScore REAL,
    description TEXT,
    publishedDate TEXT,
    lastModifiedDate TEXT,
    kaiStatus TEXT,
    exploitAvailable INTEGER DEFAULT 0,
    patchAvailable INTEGER DEFAULT 0,
    riskFactors TEXT,
    cwe TEXT,
    referenceLinks TEXT,
    epssScore REAL,
    rawData TEXT
  );
  
  -- Indexes for fast queries
  CREATE INDEX idx_severity ON vulnerabilities(severity);
  CREATE INDEX idx_cveId ON vulnerabilities(cveId);
  CREATE INDEX idx_kaiStatus ON vulnerabilities(kaiStatus);
  CREATE INDEX idx_packageName ON vulnerabilities(packageName);
  CREATE INDEX idx_publishedDate ON vulnerabilities(publishedDate);
`);

console.log('✅ Database schema created\n');

// Read and parse JSON
console.log('📖 Reading JSON file...');
const startRead = Date.now();
const fileContent = fs.readFileSync(jsonPath, 'utf-8');
console.log(`✅ File read in ${((Date.now() - startRead) / 1000).toFixed(2)}s\n`);

console.log('🔍 Parsing JSON...');
const startParse = Date.now();
const rawData = JSON.parse(fileContent);
console.log(`✅ Parsed in ${((Date.now() - startParse) / 1000).toFixed(2)}s\n`);

// Handle different JSON structures
let items = [];

for (const group of Object.values(rawData.groups || {})) {
  for (const repo of Object.values(group.repos || {})) {
    for (const image of Object.values(repo.images || {})) {
      for (const vuln of image.vulnerabilities || []) {
        items.push({
          groupName: group.name,
          repoName: repo.name,
          imageName: image.name,
          imageVersion: image.version,
          baseImage: image.baseImage,
          buildType: image.buildType,
          maintainer: image.maintainer,
          createTime: image.createTime,
          ...vuln
        });
      }
    }
  }
}

if (items.length === 0) {
  console.error('❌ ERROR: No vulnerabilities found in JSON file');
  process.exit(1);
}

console.log(`📊 Found ${items.length.toLocaleString()} vulnerabilities`);


console.log(`📊 Found ${items.length.toLocaleString()} items\n`);

// Show sample item structure
console.log('📋 Sample item structure:');
console.log('   Keys:', Object.keys(items[0]).slice(0, 10).join(', '), '...\n');

// Prepare insert statement
const insert = db.prepare(`
  INSERT INTO vulnerabilities (
    cveId, packageName, currentVersion, fixedVersion,
    severity, cvssScore, description, publishedDate,
    lastModifiedDate, kaiStatus, exploitAvailable, patchAvailable,
    riskFactors, cwe, referenceLinks, epssScore, rawData
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Batch insert with transaction for speed
const insertMany = db.transaction((items) => {
  let processed = 0;
  let errors = 0;
  
  for (const item of items) {
    try {
      // Normalize field names (handle different possible field names)
      const cveId = item.cveId || item.CVE_ID || item.id || item.cve_id || `CVE-${processed}`;
      const packageName = item.packageName || item.package || item.Package || item.pkg || 'Unknown';
      const currentVersion = item.currentVersion || item.version || item.Version || item.current_version || '0.0.0';
      const fixedVersion = item.fixedVersion || item.fixed_version || item.Fixed || item.fix || null;
      const severity = (item.severity || item.Severity || item.SEVERITY || 'UNKNOWN').toUpperCase();
      const cvssScore = parseFloat(item.cvssScore || item.cvss_score || item.CVSS || item.score || 0);
      const description = item.description || item.Description || item.summary || 'No description available';
      const publishedDate = item.publishedDate || item.published_date || item.published || item.date || null;
      const lastModifiedDate = item.lastModifiedDate || item.last_modified || item.updated || null;
      const kaiStatus = item.kaiStatus || item.kai_status || item.status || null;
      const exploitAvailable = item.exploitAvailable || item.exploit_available || item.exploit ? 1 : 0;
      const patchAvailable = item.patchAvailable || item.patch_available || item.patch || fixedVersion ? 1 : 0;
      const riskFactors = JSON.stringify(item.riskFactors || item.risk_factors || []);
      const cwe = JSON.stringify(item.cwe || item.CWE || []);
      const referenceLinks = JSON.stringify(item.references || item.refs || []);
      const epssScore = parseFloat(item.epssScore || item.epss_score || 0);
      const rawData = JSON.stringify(item);
      
      insert.run(
        cveId, packageName, currentVersion, fixedVersion,
        severity, cvssScore, description, publishedDate,
        lastModifiedDate, kaiStatus, exploitAvailable, patchAvailable,
        riskFactors, cwe, referenceLinks, epssScore, rawData
      );
      
      processed++;
      
      // Progress indicator
      if (processed % 10000 === 0) {
        console.log(`   ⏳ Processed ${processed.toLocaleString()} items...`);
      }
    } catch (error) {
      errors++;
      if (errors <= 5) {
        console.error(`   ⚠️  Error on item ${processed}:`, error.message);
      }
    }
  }
  
  return { processed, errors };
});

console.log('💾 Inserting data into database...\n');
const startInsert = Date.now();
const result = insertMany(items);
const insertDuration = ((Date.now() - startInsert) / 1000).toFixed(2);

console.log(`\n✅ Insertion complete in ${insertDuration}s`);
console.log(`   📊 Processed: ${result.processed.toLocaleString()} items`);
if (result.errors > 0) {
  console.log(`   ⚠️  Errors: ${result.errors}`);
}

// Verify database
console.log('\n🔍 Verifying database...');
const count = db.prepare('SELECT COUNT(*) as count FROM vulnerabilities').get();
const dbSize = (fs.statSync(dbPath).size / 1024 / 1024).toFixed(2);

console.log(`✅ Database verified:`);
console.log(`   📊 Records: ${count.count.toLocaleString()}`);
console.log(`   📁 Size: ${dbSize} MB`);
console.log(`   📍 Location: ${dbPath}`);

// Show some statistics
const severityStats = db.prepare(`
  SELECT 
    severity,
    COUNT(*) as count,
    ROUND(AVG(cvssScore), 2) as avgScore
  FROM vulnerabilities
  GROUP BY severity
  ORDER BY 
    CASE severity 
      WHEN 'CRITICAL' THEN 1
      WHEN 'HIGH' THEN 2
      WHEN 'MEDIUM' THEN 3
      WHEN 'LOW' THEN 4
      ELSE 5
    END
`).all();

console.log('\n📈 Distribution by Severity:');
severityStats.forEach(s => {
  console.log(`   ${s.severity.padEnd(10)}: ${s.count.toString().padStart(6)} (avg CVSS: ${s.avgScore})`);
});

// Close database
db.close();

console.log('\n═══════════════════════════════════════════════════');
console.log('✅ CONVERSION COMPLETE!');
console.log('═══════════════════════════════════════════════════');
console.log('\nNext steps:');
console.log('1. npm run dev');
console.log('2. Open http://localhost:3000');
console.log('3. See your data with blazing fast queries! ⚡\n');