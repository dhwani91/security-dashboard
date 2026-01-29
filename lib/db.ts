// lib/db.ts
// FIXED VERSION - Uses ref_links instead of references

import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database | null = null;

export function getDatabase() {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'public', 'data', 'vulnerabilities.db');
    db = new Database(dbPath, { readonly: true });
    
    // Enable performance optimizations
    db.pragma('journal_mode = WAL');
    db.pragma('cache_size = 10000');
  }
  return db;
}

export interface Vulnerability {
  id: number;
  cveId: string;
  packageName: string;
  currentVersion: string;
  fixedVersion?: string;
  severity: string;
  cvssScore: number;
  description: string;
  publishedDate?: string;
  lastModifiedDate?: string;
  kaiStatus?: string;
  exploitAvailable: boolean;
  patchAvailable: boolean;
  riskFactors?: string[];
  cwe?: string[];
  references?: string[]; // We'll map ref_links to this in the response
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  severity?: string[];
  kaiStatusFilter?: 'none' | 'analysis' | 'ai-analysis';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function queryVulnerabilities(options: QueryOptions) {
  const db = getDatabase();
  
  const {
    page = 1,
    limit = 50,
    search = '',
    severity = [],
    kaiStatusFilter = 'none',
    sortBy = 'severity',
    sortOrder = 'desc',
  } = options;

  // Build WHERE clause
  const conditions: string[] = ['1=1'];
  const params: any[] = [];

  if (search) {
    conditions.push('(cveId LIKE ? OR packageName LIKE ? OR description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (severity.length > 0) {
    conditions.push(`severity IN (${severity.map(() => '?').join(',')})`);
    params.push(...severity);
  }

  if (kaiStatusFilter === 'analysis') {
    conditions.push("(kaiStatus IS NULL OR kaiStatus NOT IN ('invalid - norisk', 'invalid-norisk'))");
  } else if (kaiStatusFilter === 'ai-analysis') {
    conditions.push("(kaiStatus IS NULL OR kaiStatus != 'ai-invalid-norisk')");
  }

  const whereClause = conditions.join(' AND ');

  // Build ORDER BY clause
  const severityOrder = `
    CASE severity
      WHEN 'CRITICAL' THEN 4
      WHEN 'HIGH' THEN 3
      WHEN 'MEDIUM' THEN 2
      WHEN 'LOW' THEN 1
      ELSE 0
    END
  `;

  let orderByClause = '';
  if (sortBy === 'severity') {
    orderByClause = `ORDER BY ${severityOrder} ${sortOrder}`;
  } else {
    orderByClause = `ORDER BY ${sortBy} ${sortOrder}`;
  }

  // Count total
  const countStmt = db.prepare(`SELECT COUNT(*) as count FROM vulnerabilities WHERE ${whereClause}`);
  const { count: totalCount } = countStmt.get(...params) as { count: number };

  // Get paginated data
  const offset = (page - 1) * limit;
  const dataStmt = db.prepare(`
    SELECT * FROM vulnerabilities 
    WHERE ${whereClause}
    ${orderByClause}
    LIMIT ? OFFSET ?
  `);

  const rows = dataStmt.all(...params, limit, offset);

  // Parse JSON fields and map ref_links to references
  const data = rows.map((row: any) => ({
    id: row.id,
    cveId: row.cveId,
    packageName: row.packageName,
    currentVersion: row.currentVersion,
    fixedVersion: row.fixedVersion,
    severity: row.severity,
    cvssScore: row.cvssScore,
    description: row.description,
    publishedDate: row.publishedDate,
    lastModifiedDate: row.lastModifiedDate,
    kaiStatus: row.kaiStatus,
    exploitAvailable: Boolean(row.exploitAvailable),
    patchAvailable: Boolean(row.patchAvailable),
    riskFactors: row.riskFactors ? JSON.parse(row.riskFactors) : [],
    cwe: row.cwe ? JSON.parse(row.cwe) : [],
    references: row.ref_links ? JSON.parse(row.ref_links) : [], // Map ref_links to references
  }));

  return {
    data,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
}

export function getMetrics() {
  const db = getDatabase();
  
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as totalVulnerabilities,
      SUM(CASE WHEN severity = 'CRITICAL' THEN 1 ELSE 0 END) as criticalCount,
      SUM(CASE WHEN severity = 'HIGH' THEN 1 ELSE 0 END) as highCount,
      SUM(CASE WHEN severity = 'MEDIUM' THEN 1 ELSE 0 END) as mediumCount,
      SUM(CASE WHEN severity = 'LOW' THEN 1 ELSE 0 END) as lowCount,
      SUM(CASE WHEN kaiStatus IN ('invalid - norisk', 'invalid-norisk') THEN 1 ELSE 0 END) as filteredOutByAnalysis,
      SUM(CASE WHEN kaiStatus = 'ai-invalid-norisk' THEN 1 ELSE 0 END) as filteredOutByAI,
      SUM(CASE WHEN exploitAvailable = 1 THEN 1 ELSE 0 END) as withExploit,
      SUM(CASE WHEN patchAvailable = 1 THEN 1 ELSE 0 END) as patchAvailable
    FROM vulnerabilities
  `).get();

  return stats;
}

export function getVulnerabilityById(cveId: string) {
  const db = getDatabase();
  
  const stmt = db.prepare('SELECT * FROM vulnerabilities WHERE cveId = ?');
  const row = stmt.get(cveId) as any;
  
  if (!row) return null;

  return {
    id: row.id,
    cveId: row.cveId,
    packageName: row.packageName,
    currentVersion: row.currentVersion,
    fixedVersion: row.fixedVersion,
    severity: row.severity,
    cvssScore: row.cvssScore,
    description: row.description,
    publishedDate: row.publishedDate,
    lastModifiedDate: row.lastModifiedDate,
    kaiStatus: row.kaiStatus,
    exploitAvailable: Boolean(row.exploitAvailable),
    patchAvailable: Boolean(row.patchAvailable),
    riskFactors: row.riskFactors ? JSON.parse(row.riskFactors) : [],
    cwe: row.cwe ? JSON.parse(row.cwe) : [],
    references: row.ref_links ? JSON.parse(row.ref_links) : [], // Map ref_links to references
  };
}