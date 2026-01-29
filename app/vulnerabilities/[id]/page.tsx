// app/vulnerabilities/[id]/page.tsx
'use client';

import { use, useState, useEffect } from 'react';
import { Vulnerability } from '@/lib/types';
import { ArrowLeft, ExternalLink, AlertTriangle, Shield, Calendar, Package } from 'lucide-react';
import Link from 'next/link';

export default function VulnerabilityDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = use(params);
  const [vulnerability, setVulnerability] = useState<Vulnerability | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVulnerability = async () => {
      try {
        // Search for the specific CVE
        const response = await fetch(`/api/vulnerabilities?search=${encodeURIComponent(id)}&limit=1`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch vulnerability');
        }

        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
          // Find exact match
          const vuln = result.data.find((v: Vulnerability) => v.cveId === id);
          setVulnerability(vuln || null);
        } else {
          setVulnerability(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVulnerability();
  }, [id]);

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      CRITICAL: 'bg-red-100 text-red-800 border-red-300',
      HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
      MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      LOW: 'bg-green-100 text-green-800 border-green-300',
      UNKNOWN: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return colors[severity] || colors.UNKNOWN;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vulnerability details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold mb-2">Error Loading Data</h2>
          <p className="text-red-600">{error}</p>
          <Link href="/vulnerabilities" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            ← Back to list
          </Link>
        </div>
      </div>
    );
  }

  if (!vulnerability) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Vulnerability Not Found</h1>
          <p className="text-gray-600 mb-4">Could not find CVE: {id}</p>
          <Link 
            href="/vulnerabilities" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to vulnerabilities
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link 
          href="/vulnerabilities" 
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to vulnerabilities
        </Link>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 border-b">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{vulnerability.cveId}</h1>
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    <span className="font-medium">{vulnerability.packageName}</span>
                  </div>
                  <span>•</span>
                  <span>Version {vulnerability.currentVersion}</span>
                </div>
              </div>
              <span className={`px-4 py-2 text-sm font-semibold rounded-lg border-2 ${getSeverityColor(vulnerability.severity)}`}>
                {vulnerability.severity}
              </span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-8 bg-gray-50">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-sm text-gray-600 mb-1">CVSS Score</div>
              <div className="text-2xl font-bold text-gray-900">
                {vulnerability.cvssScore?.toFixed(1) || 'N/A'}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-sm text-gray-600 mb-1">Exploit Available</div>
              <div className="text-2xl font-bold">
                {vulnerability.exploitAvailable ? (
                  <span className="text-red-600">⚠️ Yes</span>
                ) : (
                  <span className="text-green-600">✓ No</span>
                )}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-sm text-gray-600 mb-1">Patch Available</div>
              <div className="text-2xl font-bold">
                {vulnerability.patchAvailable ? (
                  <span className="text-green-600">✓ Yes</span>
                ) : (
                  <span className="text-gray-600">✗ No</span>
                )}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-sm text-gray-600 mb-1">Status</div>
              <div className="text-sm font-medium text-gray-900 truncate">
                {vulnerability.kaiStatus || 'Unknown'}
              </div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="p-8 space-y-6">
            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Description
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {vulnerability.description}
              </p>
            </div>

            {/* Version Information */}
            {vulnerability.fixedVersion && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">Fixed Version Available</h3>
                <p className="text-green-800">
                  Upgrade to version <span className="font-mono font-bold">{vulnerability.fixedVersion}</span> to fix this vulnerability
                </p>
              </div>
            )}

            {/* Timeline */}
            {vulnerability.publishedDate && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Timeline
                </h2>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-32">Published:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(vulnerability.publishedDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  {vulnerability.lastModifiedDate && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-32">Last Modified:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(vulnerability.lastModifiedDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Risk Factors */}
            {vulnerability.riskFactors && vulnerability.riskFactors.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Risk Factors</h2>
                <div className="flex flex-wrap gap-2">
                  {vulnerability.riskFactors.map((factor, idx) => (
                    <span 
                      key={idx} 
                      className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium"
                    >
                      {factor}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CWE */}
            {vulnerability.cwe && vulnerability.cwe.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">CWE</h2>
                <div className="flex flex-wrap gap-2">
                  {vulnerability.cwe.map((cweId, idx) => (
                    <span 
                      key={idx} 
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-mono"
                    >
                      {cweId}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reference Links */}
            {vulnerability.referenceLinks && vulnerability.referenceLinks.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ExternalLink className="w-5 h-5" />
                  Reference Links
                </h2>
                <div className="space-y-2">
                  {vulnerability.referenceLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline transition"
                    >
                      <ExternalLink className="w-4 h-4 flex-shrink-0" />
                      <span className="break-all">{link}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Metrics */}
            {vulnerability.epssScore !== undefined && vulnerability.epssScore > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">EPSS Score</h3>
                <p className="text-gray-700">
                  Exploit Prediction Scoring System: <span className="font-bold">{vulnerability.epssScore.toFixed(4)}</span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Probability that this vulnerability will be exploited in the wild
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4">
          <Link
            href="/vulnerabilities"
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center font-medium"
          >
            Back to List
          </Link>
          <Link
            href="/"
            className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition text-center font-medium"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}