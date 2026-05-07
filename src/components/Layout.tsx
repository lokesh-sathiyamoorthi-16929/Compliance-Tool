import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Disclaimer from './Disclaimer';

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex-1">
        <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
          <Outlet />
        </main>
      </div>
      <Disclaimer />
    </div>
  );
}
