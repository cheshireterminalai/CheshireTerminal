import React from 'react';

const Header = () => {
  return (
    <div className="text-center mb-8">
      <pre className="text-purple-500 animate-pulse text-xs">
{`   /\\___/\\     < NEURAL NET ACTIVE >
  (  o.o  )    < SCANNING MARKETS... >
   > ^ <       < ALPHA DETECTED >`}
      </pre>
      <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-green-400 animate-pulse">
        CHESHIRE TERMINAL
      </h1>
      <div className="flex justify-center gap-4 mt-2">
        <span className="text-xs text-purple-400">NETWORK: SOLANA</span>
        <span className="text-xs text-green-400">STATUS: ONLINE</span>
        <span className="text-xs text-purple-400">SIGNALS: ACTIVE</span>
      </div>
    </div>
  );
};

export default Header;