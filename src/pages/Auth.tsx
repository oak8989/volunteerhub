import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { store } from '../store';
import { showToast } from '../components/UI';
import { LogIn, UserPlus, Key, ArrowLeft, Leaf } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialMode = params.get('mode') === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const settings = store.getSettings();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const user = store.authenticate(email, password);
    if (user) {
      store.setCurrentUser(user.id);
      showToast(`Welcome back, ${user.name}!`, 'success');
      if (user.role === 'admin') navigate('/admin');
      else navigate('/member');
    } else {
      showToast('Invalid email or password', 'error');
    }
    setLoading(false);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const users = store.getUsers();
    if (users.find(u => u.email === email)) {
      showToast('Email already registered', 'error');
      setLoading(false);
      return;
    }
    const user = store.addUser({ email, password, name, phone });
    store.setCurrentUser(user.id);
    store.addEmail(email, 'Welcome to ' + settings.name, `Welcome ${name}! Your account has been created.`);
    showToast('Account created successfully!', 'success');
    navigate('/member');
    setLoading(false);
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const user = store.getUsers().find(u => u.email === email);
    if (user) {
      store.addEmail(email, 'Password Reset', `Click here to reset your password. Link expires in 1 hour.`);
      showToast('Reset link sent to your email', 'success');
    } else {
      showToast('Email not found', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[var(--sidebar-bg)] to-[#0f2a1a] items-center justify-center p-12">
        <div className="text-center text-white max-w-md">
          <div className="w-16 h-16 rounded-xl accent-bg flex items-center justify-center mx-auto mb-6">
            <Leaf size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-3">{settings.name}</h1>
          <p className="text-white/70 text-lg">{settings.tagline}</p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold">{store.getUsers().length}</div>
              <div className="text-xs text-white/60">Volunteers</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold">{store.getEvents().length}</div>
              <div className="text-xs text-white/60">Events</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold">{Math.round(store.getOrgTotalHours())}h</div>
              <div className="text-xs text-white/60">Hours</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-8">
            <ArrowLeft size={16} /> Back to home
          </button>

          <div className="card">
            {mode === 'login' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-lg accent-bg flex items-center justify-center mx-auto mb-3">
                    <LogIn size={24} className="text-white" />
                  </div>
                  <h2 className="text-xl font-bold">Welcome Back</h2>
                  <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your@email.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Signing in...' : 'Sign In'}</button>
                </form>
                <div className="mt-4 text-center space-y-2">
                  <button onClick={() => setMode('reset')} className="text-sm accent-text hover:underline">Forgot password?</button>
                  <p className="text-sm text-gray-500">
                    Don't have an account?{' '}
                    <button onClick={() => setMode('register')} className="accent-text font-medium hover:underline">Sign up</button>
                  </p>
                </div>
              </>
            )}

            {mode === 'register' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-lg accent-bg flex items-center justify-center mx-auto mb-3">
                    <UserPlus size={24} className="text-white" />
                  </div>
                  <h2 className="text-xl font-bold">Join Our Community</h2>
                  <p className="text-sm text-gray-500 mt-1">Create your volunteer account</p>
                </div>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Jane Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your@email.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 123-4567" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min 6 characters" minLength={6} />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Creating...' : 'Create Account'}</button>
                </form>
                <p className="mt-4 text-center text-sm text-gray-500">
                  Already have an account?{' '}
                  <button onClick={() => setMode('login')} className="accent-text font-medium hover:underline">Sign in</button>
                </p>
              </>
            )}

            {mode === 'reset' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-lg accent-bg flex items-center justify-center mx-auto mb-3">
                    <Key size={24} className="text-white" />
                  </div>
                  <h2 className="text-xl font-bold">Reset Password</h2>
                  <p className="text-sm text-gray-500 mt-1">We'll send you a reset link</p>
                </div>
                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your@email.com" />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Sending...' : 'Send Reset Link'}</button>
                </form>
                <p className="mt-4 text-center text-sm text-gray-500">
                  <button onClick={() => setMode('login')} className="accent-text font-medium hover:underline">Back to sign in</button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
