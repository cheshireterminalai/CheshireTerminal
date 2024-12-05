import React from 'react';
import { Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const StatusItem = ({ label, value }: { label: string; value: string | number }) => (
  <div className="p-4 rounded-lg bg-purple-900/20 border border-purple-500/20">
    <div className="text-sm text-purple-400">{label}</div>
    <div className="text-2xl font-bold text-green-400">{value}</div>
  </div>
);

const AIStatusCard = () => {
  return (
    <Card className="col-span-2 hover:scale-[1.01] transition-transform duration-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-500" />
          AI Agent Status
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-4 gap-4">
        <StatusItem label="Monitored Tokens" value={5} />
        <StatusItem label="Active Signals" value={3} />
        <StatusItem label="Success Rate" value="87%" />
        <StatusItem label="Risk Level" value="MED" />
      </CardContent>
    </Card>
  );
};

export default AIStatusCard;