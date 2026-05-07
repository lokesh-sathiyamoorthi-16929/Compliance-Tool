import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import BetaBanner from './BetaBanner';
import EvidencePanel from './EvidencePanel';
import Disclaimer from './Disclaimer';

export default function Layout() {
  const [showBanner, setShowBanner] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="sticky top-0 z-50">
        <BetaBanner onVisibilityChange={setShowBanner} />
      </div>
      <Navbar topOffsetClass={showBanner ? 'top-8' : 'top-0'} />
      <div className="flex-1">
        <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
          <Outlet />
        </main>
      </div>
      <EvidencePanel />
      <Disclaimer />
    </div>
  );
}
