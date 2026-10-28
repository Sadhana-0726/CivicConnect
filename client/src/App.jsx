import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ReportPage from './pages/ReportPage';
import MapPage from './pages/MapPage';
import ComplaintForm from './components/ComplaintForm';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import InspectorDashboard from './pages/InspectorDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

export default function App() {
  const [route, setRoute] = useState(window.location.hash || '#/');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash || '#/');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try { 
        setUser(JSON.parse(storedUser)); 
      } catch (e) { 
        setUser(null); 
      }
    } else {
      setUser(null);
    }
  }, [route]);

  const renderContent = () => {
    switch (route) {
      case '#/':
      case '':
        return <HomePage />;
      case '#/report':
        return (
          <div style={{ padding: '2rem 1.5rem', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#29221F', margin: '0 0 0.4rem 0' }}>
                Report Civic Issue
              </h1>
              <p style={{ color: '#736B63', fontSize: '0.95rem', margin: 0, lineHeight: '1.5' }}>
                Select a category, drop a pin on the map, describe the hazard, and submit directly to your local department.
              </p>
            </div>
            <ComplaintForm />
          </div>
        );
      case '#/my-reports':
        return <ReportPage />;
      case '#/map':
        return <MapPage />;
      case '#/login':
        return <LoginPage />;
      case '#/superadmin':
        if (!user) {
          return (
            <div style={{ padding: '4rem 1.5rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
              <h2 style={{ color: '#29221F', fontWeight: '800', margin: '0 0 0.5rem 0' }}>Authentication Required</h2>
              <p style={{ color: '#736B63', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                Please sign in with your Super Administrator account.
              </p>
              <a href="#/login" style={{ background: '#F2673A', color: '#ffffff', padding: '0.65rem 1.25rem', borderRadius: '6px', textDecoration: 'none', fontWeight: '700' }}>
                Sign In
              </a>
            </div>
          );
        }
        if (user.role === 'super_admin') {
          return <SuperAdminDashboard user={user} />;
        }
        return (
          <div style={{ padding: '4rem 1.5rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
            <h2 style={{ color: '#29221F', fontWeight: '800', margin: '0 0 0.5rem 0' }}>Access Denied</h2>
            <p style={{ color: '#736B63', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              Only system Super Administrators are permitted to access this governance console.
            </p>
            <a href="#/" style={{ background: '#29221F', color: '#FAF8F5', padding: '0.65rem 1.25rem', borderRadius: '6px', textDecoration: 'none', fontWeight: '700' }}>
              Return to Home
            </a>
          </div>
        );
      case '#/admin':
      case '#/dashboard':
        // 1. Unauthenticated Visitor
        if (!user) {
          return (
            <div style={{ padding: '4rem 1.5rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
              <h2 style={{ color: '#29221F', fontWeight: '800', margin: '0 0 0.5rem 0' }}>Staff Authentication Required</h2>
              <p style={{ color: '#736B63', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                Please sign in with your authorized municipal staff account to access this operational portal.
              </p>
              <a href="#/login" style={{ background: '#F2673A', color: '#ffffff', padding: '0.65rem 1.25rem', borderRadius: '6px', textDecoration: 'none', fontWeight: '700' }}>
                Sign In Now
              </a>
            </div>
          );
        }
        // 2. Super Administrator View
        if (user.role === 'super_admin') {
          return <SuperAdminDashboard user={user} />;
        }
        // 3. Department Administrator View
        if (user.role === 'department_admin' || user.role === 'department' || user.role === 'admin') {
          return <AdminDashboard user={user} />;
        }
        // 4. Field Inspector / Department Officer View
        if (user.role === 'department_officer' || user.role === 'inspector' || user.role === 'field') {
          return <InspectorDashboard user={user} />;
        }
        // 5. Citizen / Unauthorized View
        return (
          <div style={{ padding: '4rem 1.5rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
            <h2 style={{ color: '#29221F', fontWeight: '800', margin: '0 0 0.5rem 0' }}>
              Staff Portal Access Restricted
            </h2>
            <p style={{ color: '#736B63', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              You are currently signed in as <strong>Citizen ({user?.name || 'User'})</strong>. This area is reserved for authorized municipal inspectors and administrators.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <a href="#/my-reports" style={{ background: '#29221F', color: '#FAF8F5', padding: '0.65rem 1.25rem', borderRadius: '6px', textDecoration: 'none', fontWeight: '700' }}>
                My Submitted Reports
              </a>
              <a href="#/login" style={{ background: '#F2673A', color: '#ffffff', padding: '0.65rem 1.25rem', borderRadius: '6px', textDecoration: 'none', fontWeight: '700' }}>
                Switch Account
              </a>
            </div>
          </div>
        );
      default:
        return <HomePage />;
    }
  };

  // Staff dashboard routes — render without the public footer to avoid UI disruption
  const STAFF_ROUTES = new Set(['#/admin', '#/dashboard', '#/superadmin']);
  const showFooter = !STAFF_ROUTES.has(route);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F7F5F0', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <Navbar currentRoute={route} user={user} />
      <main style={{ flex: 1 }}>{renderContent()}</main>
      {showFooter && <Footer />}
    </div>
  );
}
