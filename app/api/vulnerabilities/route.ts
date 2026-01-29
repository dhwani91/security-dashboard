// app/api/vulnerabilities/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

// Database connection (reused across requests)
let db: Database.Database | null = null;

function getDatabase() {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'data', 'vulnerabilities.db');
    db = new Database(dbPath, { readonly: true });
    db.pragma('journal_mode = WAL');
    console.log('✅ Database connected');
  }
  return db;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const database = getDatabase();
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '50')));
    const search = searchParams.get('search')?.trim() || '';
    const severity = searchParams.get('severity')?.split(',').filter(Boolean) || [];
    const kaiStatusFilter = searchParams.get('kaiStatusFilter') || 'none';
    const sortBy = searchParams.get('sortBy') || 'severity';
    const sortOrder = (searchParams.get('sortOrder') || 'desc').toUpperCase();
    
    // Build WHERE conditions
    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    
    // Search filter
    if (search) {
      conditions.push('(cveId LIKE ? OR packageName LIKE ? OR description LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    // Severity filter
    if (severity.length > 0) {
      const placeholders = severity.map(() => '?').join(',');
      conditions.push(`severity IN (${placeholders})`);
      params.push(...severity);
    }
    
    // KaiStatus filter
    if (kaiStatusFilter === 'analysis') {
      conditions.push("(kaiStatus IS NULL OR (kaiStatus != 'invalid - norisk' AND kaiStatus != 'invalid-norisk'))");
    } else if (kaiStatusFilter === 'ai-analysis') {
      conditions.push("(kaiStatus IS NULL OR kaiStatus != 'ai-invalid-norisk')");
    }
    
    const whereClause = conditions.join(' AND ');
    
    // Build ORDER BY
    const orderByMap: Record<string, string> = {
      severity: "CASE severity WHEN 'CRITICAL' THEN 4 WHEN 'HIGH' THEN 3 WHEN 'MEDIUM' THEN 2 WHEN 'LOW' THEN 1 ELSE 0 END",
      cvssScore: 'cvssScore',
      cveId: 'cveId',
      packageName: 'packageName',
      publishedDate: 'publishedDate',
    };
    const orderBy = orderByMap[sortBy] || orderByMap.severity;
    
    // Get total count (for pagination)
    const countQuery = `SELECT COUNT(*) as count FROM vulnerabilities WHERE ${whereClause}`;
    const countResult = database.prepare(countQuery).get(...params) as { count: number };
    const totalCount = countResult.count;
    
    // Get paginated data
    const offset = (page - 1) * limit;
    const dataQuery = `
      SELECT 
        id, cveId, packageName, currentVersion, fixedVersion,
        severity, cvssScore, description, publishedDate,
        lastModifiedDate, kaiStatus, exploitAvailable, patchAvailable,
        riskFactors, cwe, referenceLinks, epssScore
      FROM vulnerabilities 
      WHERE ${whereClause}
      ORDER BY ${orderBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    
    const rawData = database.prepare(dataQuery).all(...params, limit, offset);
    
    // Process data (parse JSON fields)
    const data = rawData.map((row: any) => ({
      ...row,
      exploitAvailable: Boolean(row.exploitAvailable),
      patchAvailable: Boolean(row.patchAvailable),
      riskFactors: row.riskFactors ? JSON.parse(row.riskFactors) : [],
      cwe: row.cwe ? JSON.parse(row.cwe) : [],
      referenceLinks: row.referenceLinks ? JSON.parse(row.referenceLinks) : [],
    }));
    
    // Calculate metrics (for filtered data)
    const metricsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN severity = 'CRITICAL' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN severity = 'HIGH' THEN 1 ELSE 0 END) as high,
        SUM(CASE WHEN severity = 'MEDIUM' THEN 1 ELSE 0 END) as medium,
        SUM(CASE WHEN severity = 'LOW' THEN 1 ELSE 0 END) as low,
        SUM(CASE WHEN exploitAvailable = 1 THEN 1 ELSE 0 END) as withExploit,
        SUM(CASE WHEN patchAvailable = 1 THEN 1 ELSE 0 END) as patchAvailable
      FROM vulnerabilities 
      WHERE ${whereClause}
    `;
    const metrics = database.prepare(metricsQuery).get(...params) as any;
    
    // Get chart data for ALL filtered vulnerabilities (not just paginated)
    const chartDataQuery = `
      SELECT 
        cveId,
        packageName,
        severity,
        publishedDate,
        cvssScore
      FROM vulnerabilities 
      WHERE ${whereClause}
      ORDER BY ${orderBy} ${sortOrder}
    `;
    const allFilteredData = database.prepare(chartDataQuery).all(...params);
    
    // Get filter counts
    const filterCountsQuery = `
      SELECT 
        SUM(CASE WHEN kaiStatus IN ('invalid - norisk', 'invalid-norisk') THEN 1 ELSE 0 END) as invalidNorisk,
        SUM(CASE WHEN kaiStatus = 'ai-invalid-norisk' THEN 1 ELSE 0 END) as aiInvalidNorisk
      FROM vulnerabilities
    `;
    const filterCounts = database.prepare(filterCountsQuery).get() as any;
    
    // Process chart data (group by package and month)
    const packageDistribution: Record<string, number> = {};
    const monthlyTrends: Record<string, any> = {};
    
    allFilteredData.forEach((item: any) => {
      // Package distribution
      packageDistribution[item.packageName] = (packageDistribution[item.packageName] || 0) + 1;
      
      // Monthly trends
      if (item.publishedDate) {
        const date = new Date(item.publishedDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyTrends[monthKey]) {
          monthlyTrends[monthKey] = { month: monthKey, CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
        }
        monthlyTrends[monthKey][item.severity]++;
      }
    });
    
    // Prepare chart data
    const topPackages = Object.entries(packageDistribution)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
      
    const trendData = Object.values(monthlyTrends)
      .sort((a: any, b: any) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1,
      },
      metrics: {
        totalVulnerabilities: metrics.total,
        criticalCount: metrics.critical,
        highCount: metrics.high,
        mediumCount: metrics.medium,
        lowCount: metrics.low,
        withExploit: metrics.withExploit,
        patchAvailable: metrics.patchAvailable,
        filteredOutByAnalysis: filterCounts.invalidNorisk,
        filteredOutByAI: filterCounts.aiInvalidNorisk,
      },
      chartData: {
        severityDistribution: [
          { name: 'CRITICAL', value: metrics.critical },
          { name: 'HIGH', value: metrics.high },
          { name: 'MEDIUM', value: metrics.medium },
          { name: 'LOW', value: metrics.low },
        ].filter(d => d.value > 0),
        packageDistribution: topPackages,
        monthlyTrends: trendData,
      },
      meta: {
        responseTime: `${responseTime}ms`,
        database: 'SQLite',
        cacheStatus: 'direct',
        totalDataPoints: allFilteredData.length,
      }
    });
    
  } catch (error: any) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Database query failed',
        message: error.message,
        hint: error.message.includes('no such table') 
          ? 'Database not initialized. Run: npm run setup'
          : 'Check server logs for details'
      },
      { status: 500 }
    );
  }
}

// Export to CSV
export async function POST(request: NextRequest) {
  try {
    const database = getDatabase();
    const body = await request.json();
    const format = body.format || 'csv';
    
    // Get all data (limit to 50k for safety)
    const data = database.prepare(`
      SELECT cveId, packageName, currentVersion, severity, cvssScore, kaiStatus
      FROM vulnerabilities
      LIMIT 50000
    `).all();
    
    if (format === 'csv') {
      const headers = ['CVE ID', 'Package', 'Version', 'Severity', 'CVSS Score', 'Status'];
      const rows = [
        headers.join(','),
        ...data.map((v: any) => 
          [v.cveId, v.packageName, v.currentVersion, v.severity, v.cvssScore, v.kaiStatus || 'N/A']
            .map(field => `"${field}"`)
            .join(',')
        )
      ];
      
      return new NextResponse(rows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="vulnerabilities-${Date.now()}.csv"`,
        },
      });
    }
    
    return NextResponse.json(data);
    
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Export failed', message: error.message },
      { status: 500 }
    );
  }
}