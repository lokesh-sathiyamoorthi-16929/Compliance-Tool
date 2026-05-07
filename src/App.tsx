import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import WizardPage from './pages/WizardPage';
import FrameworksPage from './pages/FrameworksPage';
import FrameworkDetailPage from './pages/FrameworkDetailPage';
import ConnectionsPage from './pages/ConnectionsPage';
import DashboardPage from './pages/DashboardPage';
import ComparePage from './pages/ComparePage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  const basename = import.meta.env.PROD ? '/Compliance-Tool' : '/';

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="wizard" element={<WizardPage />} />
          <Route path="frameworks" element={<FrameworksPage />} />
          <Route path="frameworks/:id" element={<FrameworkDetailPage />} />
          <Route path="connections" element={<ConnectionsPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="compare" element={<ComparePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
