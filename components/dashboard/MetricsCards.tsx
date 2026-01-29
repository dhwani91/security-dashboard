// components/dashboard/MetricsCards.tsx
'use client';

import { AlertTriangle, Shield, Bug, CheckCircle } from 'lucide-react';

interface Props {
  metrics: {
    totalVulnerabilities: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    patchAvailable: number;
  };
}

export function MetricsCards({ metrics }: Props) {
  const cards = [
    {
      title: 'Total Vulnerabilities',
      value: metrics.totalVulnerabilities.toLocaleString(),
      icon: Bug,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
    },
    {
      title: 'Critical Severity',
      value: metrics.criticalCount.toLocaleString(),
      icon: AlertTriangle,
      bgColor: 'bg-red-100',
      textColor: 'text-red-600',
    },
    {
      title: 'High Severity',
      value: metrics.highCount.toLocaleString(),
      icon: Shield,
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600',
    },
    {
      title: 'Patch Available',
      value: metrics.patchAvailable.toLocaleString(),
      icon: CheckCircle,
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <Icon className={`w-6 h-6 ${card.textColor}`} />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">{card.title}</h3>
            <p className="text-3xl font-bold text-gray-900">{card.value}</p>
          </div>
        );
      })}
    </div>
  );
}