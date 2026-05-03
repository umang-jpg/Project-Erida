import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import Home from './pages/Home';
import NewSession from './pages/NewSession';
import ReportView from './pages/ReportView';
import RemediationView from './pages/RemediationView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<NewSession />} />
          <Route path="/report/:id" element={<ReportView />} />
          <Route path="/remediation/:id" element={<RemediationView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
