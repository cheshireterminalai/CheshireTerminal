import React, { useState, useEffect } from 'react';
import Header from './Header';
import AIStatusCard from './AIStatusCard';
import PriceChart from './PriceChart';
import TradingSignals from './TradingSignals';
import RiskAnalysis from './RiskAnalysis';
import SystemStats from './SystemStats';

const TradingTerminal = () => {
  const [systemStats, setSystemStats] = useState({
    uptime: '00:00:00',
    cpuLoad: '0%',
    memUsage: '0GB'
  });

  useEffect(() => {
    const updateSystemStats = () => {
      setSystemStats({
        uptime: new Date().toLocaleTimeString(),
        cpuLoad: `${Math.floor(Math.random() * 30 + 20)}%`,
        memUsage: `${(Math.random() * 2 + 0.5).toFixed(1)}TB`
      });
    };

    const interval = setInterval(updateSystemStats, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 font-mono relative z-10">
      <Header />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AIStatusCard />
        <PriceChart />
        <TradingSignals />
        <RiskAnalysis />
      </div>
      <SystemStats stats={systemStats} />
    </div>
  );
};

export default TradingTerminal;