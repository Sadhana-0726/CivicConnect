import React, { useState, useEffect } from 'react';

export default function Navbar({ currentRoute }) {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Read logged-in user details from local storage
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
  }, [currentRoute]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.hash = '#/login';
  };

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  const getDashboardLabel = () => {
    if (!user) return 'Staff Portal';
    if (user.role === 'super_admin') return '⚡ Super Admin';
    if (user.role === 'department_admin') return '🏛️ Dept Portal';
    if (user.role === 'department_officer') return '👷 Field Tasks';
    return 'Staff Portal';
  };

  const getRoleIcon = () => {
    if (!user) return '👤';
    if (user.role === 'super_admin') return '⚡';
    if (user.role === 'department_admin') return '🏛️';
    if (user.role === 'department_officer') return '👷';
    return '👤';
  };

  return (
    <nav className="navbar" style={{ background: '#29221F', padding: '0.8rem 1.5rem', color: '#FAF8F5' }}>
      <div className="navbar__inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
        <a
          href="#/"
          className="navbar__brand"
          onClick={closeMenu}
          style={{ color: '#FAF8F5', fontWeight: '800', fontSize: '1.2rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <img
            src="/navbar-icon.png"
            alt=""
            aria-hidden="true"
            style={{ width: '36px', height: '36px', objectFit: 'contain', flexShrink: 0 }}
          />
          CivicConnect
        </a>

        <div className={`navbar__links ${isOpen ? 'is-open' : ''}`} style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
          <a
            href="#/"
            style={{ color: currentRoute === '#/' || currentRoute === '' ? '#F2673A' : '#FAF8F5', textDecoration: 'none', fontSize: '0.9rem' }}
            onClick={closeMenu}
          >
            Home
          </a>
          <a
            href="#/report"
            style={{ color: currentRoute === '#/report' ? '#F2673A' : '#FAF8F5', textDecoration: 'none', fontSize: '0.9rem' }}
            onClick={closeMenu}
          >
            Report Issue
          </a>
          <a
            href="#/my-reports"
            style={{ color: currentRoute === '#/my-reports' ? '#F2673A' : '#FAF8F5', textDecoration: 'none', fontSize: '0.9rem' }}
            onClick={closeMenu}
          >
            My Reports
          </a>
          <a
            href="#/map"
            style={{ color: currentRoute === '#/map' ? '#F2673A' : '#FAF8F5', textDecoration: 'none', fontSize: '0.9rem' }}
            onClick={closeMenu}
          >
            Map View
          </a>
          <a
            href={user?.role === 'super_admin' ? '#/superadmin' : '#/admin'}
            style={{ color: currentRoute === '#/admin' || currentRoute === '#/superadmin' || currentRoute === '#/dashboard' ? '#F2673A' : '#FAF8F5', textDecoration: 'none', fontSize: '0.9rem' }}
            onClick={closeMenu}
          >
            {getDashboardLabel()}
          </a>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginLeft: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#FAF8F5', background: '#3D3430', padding: '0.3rem 0.8rem', borderRadius: '20px', border: '1px solid #4A403B' }}>
                {getRoleIcon()} {user.name}
              </span>
              <button
                onClick={handleLogout}
                style={{ background: 'transparent', border: '1px solid #F2673A', color: '#F2673A', padding: '0.35rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600' }}
              >
                Logout
              </button>
            </div>
          ) : (
            <a
              href="#/login"
              style={{ background: '#F2673A', color: '#ffffff', padding: '0.4rem 1rem', borderRadius: '6px', textDecoration: 'none', fontWeight: '600', fontSize: '0.85rem' }}
              onClick={closeMenu}
            >
              Sign In
            </a>
          )}
        </div>
      </div>
    </nav>
  );
}
