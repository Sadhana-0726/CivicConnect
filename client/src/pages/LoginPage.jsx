import { useState } from 'react';
import { loginUser, registerUser } from '../services/api';

// 4-Tier Enterprise Roles
const ROLE_OPTIONS = [
  { id: 'citizen', label: 'Citizen', icon: '👤', desc: 'Public Resident' },
  { id: 'department_officer', label: 'Inspector', icon: '👷', desc: 'Field Officer' },
  { id: 'department_admin', label: 'Dept Lead', icon: '🏛️', desc: 'Dept Administrator' },
  { id: 'super_admin', label: 'Super Admin', icon: '⚡', desc: 'System Governance' },
];

export default function LoginPage() {
  const [userType, setUserType] = useState('citizen');
  const [isRegister, setIsRegister] = useState(false);
  const [department, setDepartment] = useState('Roads & Infrastructure');
  const [staffKey, setStaffKey] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Only Department Officers and Dept Leads are assigned to specific municipal sectors
  const isDepartmentStaff = userType === 'department_officer' || userType === 'department_admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      let loggedUser;
      if (isRegister) {
        const payload = { 
          ...form, 
          role: userType,
          department: isDepartmentStaff ? department : null,
          staffKey: userType !== 'citizen' ? staffKey : undefined,
        };
        loggedUser = await registerUser(payload);
        localStorage.setItem('token', loggedUser.token);
        localStorage.setItem('user', JSON.stringify(loggedUser));
        setSuccess('Account created successfully! Redirecting...');
      } else {
        loggedUser = await loginUser({ email: form.email, password: form.password });
        localStorage.setItem('token', loggedUser.token);
        localStorage.setItem('user', JSON.stringify(loggedUser));
        setSuccess(`Welcome back, ${loggedUser.name}!`);
      }
      
      setTimeout(() => {
        const targetRole = loggedUser.role || userType;
        const redirectHash = targetRole === 'citizen' 
          ? '#/my-reports' 
          : targetRole === 'super_admin' 
            ? '#/superadmin' 
            : '#/admin';
        window.location.hash = redirectHash;
        window.location.reload();
      }, 900);
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      background: 'linear-gradient(135deg, #F7F5F0 0%, #EAE5D9 100%)',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        display: 'flex',
        maxWidth: '940px',
        width: '100%',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        border: '1px solid #E5E0D8'
      }}>
        {/* Left Side - Brand Banner */}
        <div style={{
          flex: '1',
          background: 'linear-gradient(180deg, #29221F 0%, #1A1513 100%)',
          color: '#ffffff',
          padding: '3rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.85rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#F2673A', fontWeight: '700', marginBottom: '1rem' }}>
              CivicConnect Platform
            </div>
            <h2 style={{ fontSize: '2.2rem', lineHeight: '1.2', fontWeight: '800', margin: '0 0 1rem 0', color: '#FAF8F5' }}>
              Pinpoint.<br />Report.<br />Resolve.
            </h2>
            <p style={{ color: '#A39B92', fontSize: '0.95rem', lineHeight: '1.6' }}>
              Empowering citizens and municipal departments to fix civic infrastructure faster through real-time coordinate tracking and transparent workflows.
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '1.2rem', borderRadius: '12px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#FAF8F5' }}>Live Municipal Network</div>
            <div style={{ fontSize: '0.75rem', color: '#8C837A', marginTop: '0.2rem' }}>Connected directly to MongoDB Atlas Engine</div>
          </div>
        </div>

        {/* Right Side - Form Container */}
        <div style={{ flex: '1.2', padding: '2.5rem 2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: '1.2rem' }}>
            <h3 style={{ fontSize: '1.6rem', fontWeight: '700', color: '#29221F', margin: '0 0 0.4rem 0' }}>
              {isRegister ? 'Create Account' : 'Access CivicConnect'}
            </h3>
            <p style={{ color: '#736B63', fontSize: '0.88rem', margin: 0 }}>
              {isRegister ? 'Select your portal access role below' : 'Select your portal role to sign in'}
            </p>
          </div>

          {/* DARK NAVBAR STYLED ROLE SELECTION TOOLBAR */}
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#736B63', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>
              Select Portal Access Role
            </label>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#29221F',
              padding: '0.5rem 0.8rem',
              borderRadius: '8px',
              border: '1px solid #1A1513',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}>
              {ROLE_OPTIONS.map((item) => {
                const isSelected = userType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setUserType(item.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: isSelected ? '#F2673A' : '#FAF8F5',
                      fontSize: '0.88rem',
                      fontWeight: isSelected ? '800' : '500',
                      cursor: 'pointer',
                      padding: '0.35rem 0.6rem',
                      position: 'relative',
                      transition: 'color 0.2s ease',
                      borderBottom: isSelected ? '2px solid #F2673A' : '2px solid transparent',
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {error && <div className="alert alert--error" style={{ padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem', background: '#FDF2F2', color: '#991B1B' }}>{error}</div>}
          {success && <div className="alert alert--success" style={{ padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem', background: '#E6F4EA', color: '#137333' }}>{success}</div>}

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <div className="field" style={{ marginBottom: '0.9rem' }}>
                <label htmlFor="name" style={{ fontSize: '0.85rem', fontWeight: '600', color: '#29221F' }}>Full Name</label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={update}
                  placeholder="e.g. Alex Johnson"
                  required
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #D1CDC7', fontSize: '0.9rem' }}
                />
              </div>
            )}

            <div className="field" style={{ marginBottom: '0.9rem' }}>
              <label htmlFor="email" style={{ fontSize: '0.85rem', fontWeight: '600', color: '#29221F' }}>
                {userType !== 'citizen' ? 'Official Email / Staff ID' : 'Email Address or Mobile'}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={update}
                placeholder={userType !== 'citizen' ? 'officer@citygov.org' : 'name@example.com'}
                required
                style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #D1CDC7', fontSize: '0.9rem' }}
              />
            </div>

            {/* PASSWORD INPUT WITH EYE TOGGLE BUTTON */}
            <div className="field" style={{ marginBottom: '1rem' }}>
              <label htmlFor="password" style={{ fontSize: '0.85rem', fontWeight: '600', color: '#29221F' }}>Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={update}
                  placeholder="••••••••"
                  required
                  style={{ 
                    width: '100%', 
                    padding: '0.65rem 2.5rem 0.65rem 0.65rem', 
                    borderRadius: '6px', 
                    border: '1px solid #D1CDC7', 
                    fontSize: '0.9rem' 
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#736B63',
                    userSelect: 'none'
                  }}
                  title={showPassword ? 'Hide Password' : 'Show Password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* ASSIGNED DEPARTMENT DROPDOWN: Rendered ONLY for Inspector and Dept Lead during registration */}
            {isRegister && isDepartmentStaff && (
              <div className="field" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#29221F' }}>Assigned Sector / Department</label>
                <select 
                  value={department} 
                  onChange={(e) => setDepartment(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #D1CDC7', fontSize: '0.9rem', background: '#fff' }}
                >
                  <option value="Roads & Infrastructure">Roads & Infrastructure</option>
                  <option value="Sanitation & Solid Waste">Sanitation & Solid Waste</option>
                  <option value="Water & Sewage">Water & Sewage</option>
                  <option value="Electrical & Streetlights">Electrical & Streetlights</option>
                  <option value="Public Safety & General">Public Safety & General</option>
                </select>
              </div>
            )}

            {/* STAFF AUTHORIZATION PASSKEY: Rendered ONLY for privileged staff during registration */}
            {isRegister && userType !== 'citizen' && (
              <div className="field" style={{ marginBottom: '1rem' }}>
                <label htmlFor="staffKey" style={{ fontSize: '0.85rem', fontWeight: '600', color: '#29221F' }}>
                  Staff Authorization Key <span style={{ color: '#E53E3E' }}>*</span>
                </label>
                <input
                  id="staffKey"
                  name="staffKey"
                  type="password"
                  value={staffKey}
                  onChange={(e) => setStaffKey(e.target.value)}
                  placeholder="Enter authorized municipal staff passkey..."
                  required
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #D1CDC7', fontSize: '0.9rem' }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#F2673A',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'background 0.2s ease'
              }}
            >
              {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {/* Social Sign-In */}
          <div style={{ marginTop: '1.2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: '#8C837A', marginBottom: '0.6rem' }}>
              Or continue with
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.45rem 1.1rem',
                  borderRadius: '6px',
                  border: '1px solid #D1CDC7',
                  background: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#29221F',
                  cursor: 'pointer'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Google
              </button>

              <button
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.45rem 1.1rem',
                  borderRadius: '6px',
                  border: '1px solid #D1CDC7',
                  background: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#29221F',
                  cursor: 'pointer'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#000000">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.66-.8 1.11-1.92.99-3.04-.96.04-2.12.64-2.81 1.44-.61.71-1.14 1.86-.99 2.96 1.07.08 2.15-.55 2.81-1.36z" />
                </svg>
                Apple
              </button>
            </div>
          </div>

          <div style={{ marginTop: '1.2rem', textAlign: 'center', fontSize: '0.85rem', color: '#736B63' }}>
            {isRegister ? 'Already registered?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              style={{ background: 'none', border: 'none', color: '#F2673A', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {isRegister ? 'Sign In' : 'Sign up now'}
            </button>
          </div>

          <div style={{ marginTop: '0.8rem', textAlign: 'center' }}>
            <a href="#/report" style={{ fontSize: '0.8rem', color: '#736B63', textDecoration: 'underline' }}>
              Just want to report a quick issue? Report as Guest.
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
