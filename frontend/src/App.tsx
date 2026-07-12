import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import LandingPage from './pages/LandingPage';
import Home from './pages/Home';
import NewSession from './pages/NewSession';
import ReportView from './pages/ReportView';
import RemediationView from './pages/RemediationView';

function App() {
  return (
    <BrowserRouter>
      <div className="relative w-full h-full">
        <Routes>
          <Route path="/" element={
            <>
              {/* Home page surfaces beneath the landing page */}
              <div id="home-reveal-target" className="fixed inset-0 z-0 opacity-0 scale-[0.92] pointer-events-none transition-none">
                <Home />
              </div>
              <LandingPage />
            </>
          } />
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Home />} />
            <Route path="/new" element={<NewSession />} />
            <Route path="/report/:id" element={<ReportView />} />
            <Route path="/remediation/:id" element={<RemediationView />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
