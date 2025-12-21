/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { Header } from '@/components/ui/header';
import { useEffect, useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react';
import { generateServiceId } from '@/lib/x402-service-id';

interface InvalidVote {
  userAddress: string;
  reason: string | null;
  validationDetails: any;
  createdAt: string;
}

interface ServiceReport {
  id: number;
  serviceId: string;
  serviceName: string;
  validationStatus: 'verified' | 'failed' | 'pending' | 'disputed';
  validationScore: number | null;
  validVoteCount: number;
  invalidVoteCount: number;
  lastValidatedAt: string | null;
  invalidVotes: InvalidVote[];
  recentValidVotes: number;
  testnetChain: string | null;
}

export default function ReportsPage() {
  const { address } = useAppKitAccount();
  const [reports, setReports] = useState<ServiceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'failed' | 'disputed'>('all');

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        const statusParam = filter === 'all' ? '' : filter;
        const response = await fetch(`/api/reports?status=${statusParam}&limit=100`);
        
        if (!response.ok) {
          throw new Error('Failed to load reports');
        }

        const data = await response.json();
        setReports(data.services || []);
      } catch (error) {
        console.error('Error loading reports:', error);
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, [filter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'failed':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-mono border border-red-300">
            FAILED
          </span>
        );
      case 'disputed':
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-mono border border-yellow-300">
            DISPUTED
          </span>
        );
      case 'verified':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-mono border border-green-300">
            VERIFIED
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-mono border border-gray-300">
            PENDING
          </span>
        );
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-grow py-12 px-4">
        <div className="container mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold font-mono tracking-wider mb-4">
              VALIDATION REPORTS
            </h1>
            <p className="text-xl font-mono text-gray-700 mb-4">
              Services with validation issues and user complaints
            </p>

            {/* Filter Buttons */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 font-mono text-sm border-2 ${
                  filter === 'all'
                    ? 'bg-blue-500 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                ALL ISSUES
              </button>
              <button
                onClick={() => setFilter('failed')}
                className={`px-4 py-2 font-mono text-sm border-2 ${
                  filter === 'failed'
                    ? 'bg-red-500 text-white border-red-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                FAILED
              </button>
              <button
                onClick={() => setFilter('disputed')}
                className={`px-4 py-2 font-mono text-sm border-2 ${
                  filter === 'disputed'
                    ? 'bg-yellow-500 text-white border-yellow-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                DISPUTED
              </button>
            </div>
          </div>

          {/* Reports List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 bg-gray-200 mx-auto mb-4 animate-pulse"></div>
              <p className="font-mono text-gray-600">Loading reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="font-mono text-xl text-gray-700 mb-2">No Issues Found</p>
              <p className="font-mono text-gray-600">All services are validated correctly!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reports.map((report) => (
                <div key={report.id} className="retro-card">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-mono font-bold">
                          {report.serviceName}
                        </h3>
                        {getStatusBadge(report.validationStatus)}
                        {report.validationScore !== null && (
                          <span className="text-sm font-mono text-gray-600">
                            Score: {report.validationScore}/100
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-mono text-gray-600 mb-2">
                        Service ID: {truncateAddress(report.serviceId)}
                      </p>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-green-700">{report.validVoteCount} Valid</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="text-red-700">{report.invalidVoteCount} Invalid</span>
                        </div>
                        {report.testnetChain && (
                          <span className="text-gray-600">Chain: {report.testnetChain}</span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/validate/${encodeURIComponent(report.serviceId)}/test`}
                      className="retro-button text-sm"
                    >
                      VALIDATE
                      <ExternalLink className="w-3 h-3 ml-1 inline" />
                    </Link>
                  </div>

                  {/* Invalid Votes / Complaints */}
                  {report.invalidVotes.length > 0 && (
                    <div className="border-t-2 border-gray-300 pt-4 mt-4">
                      <h4 className="font-mono font-bold text-sm mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        INVALID VOTES ({report.invalidVotes.length})
                      </h4>
                      <div className="space-y-3">
                        {report.invalidVotes.map((vote, idx) => (
                          <div key={idx} className="bg-red-50 border border-red-200 p-3 rounded">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-red-800">
                                  {truncateAddress(vote.userAddress)}
                                </span>
                                <span className="text-xs font-mono text-gray-500">
                                  {new Date(vote.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            {vote.reason && (
                              <p className="text-xs font-mono text-red-700 mb-2">
                                <span className="font-bold">Reason:</span> {vote.reason}
                              </p>
                            )}
                            {vote.validationDetails && (
                              <div className="text-xs font-mono text-gray-600">
                                {vote.validationDetails.error && (
                                  <p className="mb-1">
                                    <span className="font-bold">Error:</span> {vote.validationDetails.error}
                                  </p>
                                )}
                                {vote.validationDetails.warnings && vote.validationDetails.warnings.length > 0 && (
                                  <div>
                                    <span className="font-bold">Warnings:</span>
                                    <ul className="list-disc list-inside ml-2">
                                      {vote.validationDetails.warnings.map((warning: string, wIdx: number) => (
                                        <li key={wIdx}>{warning}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

