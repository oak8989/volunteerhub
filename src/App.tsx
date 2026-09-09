import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { store } from './store';
import { ToastContainer } from './components/UI';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Admin from './pages/Admin';
import MemberPortal from './pages/Member';

function App() {
  useEffect(() => {
    // Apply theme from settings
    const settings = store.getSettings();
    document.documentElement.setAttribute('data-theme', settings.theme || 'emerald');
    
    // Seed data on first load
    store.seedData();
    
    // Listen for settings changes to update theme
    const unsub = store.subscribe(() => {
      const s = store.getSettings();
      document.documentElement.setAttribute('data-theme', s.theme || 'emerald');
    });
    return () => { unsub(); };
  }, []);

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/member" element={<MemberPortal />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
