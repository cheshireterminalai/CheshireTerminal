import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PriceChart = () => {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center text-purple-500">
          <TrendingUp className="w-6 h-6 mr-2 animate-glow-pulse" />
          Live Price Action
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={[]} className="text-purple-400">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(147,51,234,0.2)" />
              <XAxis stroke="#a855f7" />
              <YAxis stroke="#a855f7" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(20,10,30,0.95)',
                  border: '1px solid #a855f7',
                  borderRadius: '4px',
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#4ade80" 
                strokeWidth={2}
                dot={{ stroke: '#4ade80', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceChart;