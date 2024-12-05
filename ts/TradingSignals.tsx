import React from 'react';
import { Activity, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TradingSignals = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-purple-500">
          <Activity className="w-6 h-6 mr-2 animate-glow-pulse" />
          Trading Signals
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1,2,3].map((_, i) => (
            <div 
              key={i}
              className="bg-purple-900/20 p-3 rounded-lg border border-purple-500/20
                       hover:border-purple-500/40 transition-colors duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ArrowUpRight className="w-5 h-5 text-green-400 mr-2 animate-glow-pulse" />
                  <div>
                    <div className="text-green-400">BUY Signal (95%)</div>
                    <div className="text-xs text-purple-400">Strong momentum detected</div>
                  </div>
                </div>
                <div className="text-xs text-purple-400">12:45:30</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TradingSignals;