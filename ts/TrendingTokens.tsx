import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSolanaData } from '../hooks/useSolanaData';

const TrendingTokens = () => {
  const { trendingTokens, loading, error } = useSolanaData();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 animate-glow-pulse" />
            Trending Tokens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-purple-400">Loading trending data...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Trending Tokens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-400">Failed to load trending data</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 animate-glow-pulse" />
          Trending Tokens
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {trendingTokens.map((token, index) => (
            <div
              key={token.address}
              className="bg-purple-900/20 p-3 rounded-lg border border-purple-500/20
                       hover:border-purple-500/40 transition-colors duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-green-400 font-medium">{token.symbol}</div>
                  <div className="text-xs text-purple-400">{token.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-green-400">${token.price.toFixed(4)}</div>
                  <div className={`text-xs ${token.priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {token.priceChange >= 0 ? '+' : ''}{token.priceChange.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrendingTokens;