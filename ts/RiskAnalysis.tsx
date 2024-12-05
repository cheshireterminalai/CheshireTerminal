import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const RiskAnalysis = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-purple-500">
          <AlertTriangle className="w-6 h-6 mr-2 animate-glow-pulse" />
          Risk Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[
            { label: 'Market Cap', value: '$669137.59' },
            { label: 'Liquidity', value: '$384854.69' },
            { label: '24h Volume', value: '$892345.12' },
            { label: 'Price Change', value: '+12.34%' }
          ].map((metric, i) => (
            <div 
              key={i}
              className="bg-purple-900/20 p-3 rounded-lg border border-purple-500/20"
            >
              <div className="text-sm text-purple-400">{metric.label}</div>
              <div className="text-lg text-green-400">{metric.value}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskAnalysis;