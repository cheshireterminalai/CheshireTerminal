import React from 'react';

interface SystemStatsProps {
  stats: {
    uptime: string;
    cpuLoad: string;
    memUsage: string;
  };
}

const SystemStats: React.FC<SystemStatsProps> = ({ stats }) => {
  return (
    <div className="fixed bottom-4 right-4 text-xs text-purple-400 opacity-50">
      <div>SYS::UPTIME: {stats.uptime}</div>
      <div>CPU::LOAD: {stats.cpuLoad}</div>
      <div>MEM::USAGE: {stats.memUsage}</div>
    </div>
  );
};

export default SystemStats;