import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { store, formatDateTime, formatDate, formatTime, getHoursBetween, timeAgo } from '../store';
import { showToast, Modal, ConfirmDialog, CountUp, ProgressRing, LiveClock, LiveTimer, QRCode, EmptyState, Tabs } from '../components/UI';
import {
  Home, Calendar, Clock, User, LogOut, MapPin, Award, QrCode,
  Check, X, Edit, Trash2, Shield, FileText, ChevronRight, Menu, Leaf
} from 'lucide-react';

export default function MemberPortal() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('home');
  const [, setTick] = useState(0);
  const user = store.getCurrentUser();

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    const unsub = store.subscribe(() => setTick(t => t + 1));
    return () => { unsub(); };
  }, [user, navigate]);

  if (!user) return null;

  const handleLogout = () => { store.setCurrentUser(null); navigate('/'); };

  const tabs = [
    { id: 'home', label: 'Home', icon: <Home size={16} /> },
    { id: 'events', label: 'Events', icon: <Calendar size={16} /> },
    { id: 'hours', label: 'My Hours', icon: <Clock size={16} /> },
    { id: 'profile', label: 'Profile', icon: <User size={16} /> },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="sidebar w-64 flex-shrink-0 flex-col hidden md:flex">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded accent-bg flex items-center justify-center">
              <Leaf size={18} className="text-white" />
            </div>
            <span className="font-bold text-sm">{store.getSettings().name}</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-white/60">
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">{user.name[0]}</div>
            <span className="flex-1 truncate">{user.name}</span>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-300 hover:bg-red-500/10 mt-1">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-4 md:p-6 max-w-5xl mx-auto">
          {/* Mobile nav */}
          <div className="md:hidden mb-4">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${tab === t.id ? 'bg-white shadow' : 'text-gray-600'}`}>
                  {t.icon}{t.label}
                </button>
              ))}
              <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-red-500 whitespace-nowrap">
                <LogOut size={16} />
              </button>
            </div>
          </div>

          {tab === 'home' && <MemberHome user={user} />}
          {tab === 'events' && <MemberEvents user={user} />}
          {tab === 'hours' && <MemberHours user={user} />}
          {tab === 'profile' && <MemberProfile user={user} />}
        </div>
      </main>
    </div>
  );
}

// ============ MEMBER HOME ============
function MemberHome({ user }: { user: any }) {
  const attendance = store.getAttendance();
  const events = store.getEvents();
  const registrations = store.getRegistrations();
  const settings = store.getSettings();

  const activeSession = attendance.find(a => a.userId === user.id && !a.checkOut);
  const totalHours = store.getUserHours(user.id);
  const nextMedal = store.getNextMedal(user.id);
  const userMedals = store.getUserMedals(user.id);

  const myRegistrations = registrations.filter(r => r.userId === user.id && r.status === 'registered');
  const upcomingRegs = myRegistrations
    .map(r => ({ ...r, event: events.find(e => e.id === r.eventId) }))
    .filter(r => r.event && store.getEventStatus(r.event) !== 'past')
    .sort((a, b) => new Date(a.event!.startTime).getTime() - new Date(b.event!.startTime).getTime());

  const medalProgress = nextMedal ? Math.min((totalHours / nextMedal.hours) * 100, 100) : 100;

  return (
    <div className="animate-rise">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user.name.split(' ')[0]}!</h1>
          <p className="text-gray-500 text-sm">{user.title}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold accent-text">{totalHours.toFixed(1)}h</div>
          <div className="text-xs text-gray-500">Total Hours</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Next Shift / Check In */}
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Clock size={16} className="accent-text" /> {activeSession ? 'Current Session' : 'Quick Check-In'}</h2>
          {activeSession ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-2">Checked in at {formatTime(activeSession.checkIn)}</p>
              <LiveTimer startTime={activeSession.checkIn} />
              <button onClick={() => { store.checkOut(activeSession.id); store.checkMedals(user.id); showToast('Checked out! Great work!', 'success'); }} className="btn-primary mt-4 w-full">
                ⏹ Check Out
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <LiveClock />
              <button onClick={() => { store.checkIn(user.id); showToast('Checked in! Have a great shift!', 'success'); }} className="btn-primary mt-4 w-full text-lg py-3">
                ▶ Check In
              </button>
            </div>
          )}
        </div>

        {/* Medal Progress */}
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Award size={16} className="accent-text" /> Medal Progress</h2>
          <div className="flex items-center justify-center py-2">
            <div className="relative">
              <ProgressRing progress={medalProgress} size={140} strokeWidth={10} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {nextMedal ? (
                  <>
                    <span className="text-2xl">{nextMedal.icon}</span>
                    <span className="text-xs text-gray-500 mt-1">{totalHours.toFixed(0)}/{nextMedal.hours}h</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">👑</span>
                    <span className="text-xs text-gray-500 mt-1">Max level!</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-2 mt-4">
            {userMedals.map(m => (
              <span key={m.id} className="text-xl" title={`${m.name}: ${m.hours}h`}>{m.icon}</span>
            ))}
          </div>
          {nextMedal && <p className="text-center text-sm text-gray-500 mt-2">{(nextMedal.hours - totalHours).toFixed(1)}h to {nextMedal.name} {nextMedal.icon}</p>}
        </div>

        {/* Upcoming Registrations */}
        <div className="card md:col-span-2">
          <h2 className="font-semibold mb-4">Upcoming Registrations</h2>
          {upcomingRegs.length === 0 ? (
            <EmptyState icon={<Calendar size={32} />} title="No upcoming events" description="Browse events to register" />
          ) : (
            <div className="space-y-2">
              {upcomingRegs.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{r.event?.title}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(r.event!.startTime)} • {r.event?.location}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${store.getEventStatus(r.event!) === 'live' ? 'badge-live' : 'badge-upcoming'}`}>
                      {store.getEventStatus(r.event!).toUpperCase()}
                    </span>
                    {store.getEventStatus(r.event!) === 'live' && (
                      <button onClick={() => {
                        const active = attendance.find(a => a.userId === user.id && !a.checkOut);
                        if (active) { store.checkOut(active.id); showToast('Checked out!', 'success'); }
                        else { store.checkIn(user.id, r.event!.id); showToast('Checked in!', 'success'); }
                      }} className="btn-primary text-xs py-1 px-2">
                        {attendance.find(a => a.userId === user.id && !a.checkOut) ? 'Out' : 'In'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ MEMBER EVENTS ============
function MemberEvents({ user }: { user: any }) {
  const events = store.getEvents();
  const registrations = store.getRegistrations();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live' | 'past'>('upcoming');
  const [search, setSearch] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);

  const myRegEventIds = registrations.filter(r => r.userId === user.id && r.status === 'registered').map(r => r.eventId);

  const filtered = events.filter(e => {
    if (filter !== 'all' && store.getEventStatus(e) !== filter) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !e.location.toLowerCase().includes(search.toLowerCase())) return false;
    // Check if user can see this event
    if (!e.isPublic && !e.allowedGroups.some(g => user.groups.includes(g))) return false;
    return true;
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const handleRegister = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event?.requireWaiver && !user.waiverSigned) {
      showToast('Please sign the waiver first', 'error');
      return;
    }
    store.registerForEvent(eventId, user.id);
    showToast('Successfully registered!', 'success');
  };

  const handleCancel = (eventId: string) => {
    const reg = registrations.find(r => r.eventId === eventId && r.userId === user.id && r.status === 'registered');
    if (reg) {
      store.cancelRegistration(reg.id);
      showToast('Registration cancelled', 'info');
    }
  };

  const handleScan = () => {
    setScanSuccess(true);
    setTimeout(() => {
      setShowScanner(false);
      setScanSuccess(false);
      showToast('Walk-in check-in successful!', 'success');
      store.checkIn(user.id, undefined, true);
    }, 2000);
  };

  return (
    <div className="animate-rise">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Events</h1>
        <button onClick={() => setShowScanner(true)} className="btn-secondary flex items-center gap-2">
          <QrCode size={16} /> Scan Walk-In
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events..." className="pl-4" />
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(['upcoming', 'live', 'past', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded text-sm font-medium capitalize ${filter === f ? 'bg-white shadow' : 'text-gray-600'}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(event => {
          const status = store.getEventStatus(event);
          const isRegistered = myRegEventIds.includes(event.id);
          const regCount = registrations.filter(r => r.eventId === event.id && r.status === 'registered').length;

          return (
            <div key={event.id} className="card hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{event.title}</h3>
                    <span className={`badge ${status === 'live' ? 'badge-live' : status === 'upcoming' ? 'badge-upcoming' : 'badge-past'}`}>
                      {status.toUpperCase()}
                    </span>
                    {event.fee > 0 && <span className="text-sm font-semibold accent-text">${event.fee}</span>}
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Clock size={12} />{formatDateTime(event.startTime)}</span>
                    <span className="flex items-center gap-1"><MapPin size={12} />{event.location}</span>
                    <span>{regCount}/{event.capacity} spots</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{event.description}</p>
                </div>
                <div>
                  {isRegistered ? (
                    <div className="flex flex-col gap-2">
                      <span className="badge badge-success text-center">✓ Registered</span>
                      {status !== 'past' && (
                        <button onClick={() => handleCancel(event.id)} className="text-xs text-red-500 hover:underline">Cancel</button>
                      )}
                    </div>
                  ) : status !== 'past' ? (
                    <button onClick={() => handleRegister(event.id)} className="btn-primary text-sm">Register</button>
                  ) : null}
                </div>
              </div>
              <div className="mt-2 progress-bar"><div className="progress-fill" style={{ width: `${Math.min((regCount/event.capacity)*100, 100)}%` }} /></div>
            </div>
          );
        })}
        {filtered.length === 0 && <EmptyState icon={<Calendar size={40} />} title="No events found" description="Check back later for new events" />}
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <Modal open={true} onClose={() => { setShowScanner(false); setScanSuccess(false); }} title="Walk-In QR Scanner">
          <div className="text-center py-6">
            {scanSuccess ? (
              <div className="animate-pop">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Check size={40} className="text-green-500" />
                </div>
                <p className="font-semibold text-lg">Check-in Successful!</p>
                <p className="text-sm text-gray-500 mt-1">Walk-in recorded</p>
              </div>
            ) : (
              <>
                <div className="relative w-48 h-48 mx-auto border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <QrCode size={64} className="text-gray-300" />
                  </div>
                  <div className="absolute left-0 right-0 h-0.5 bg-green-500 animate-scan" />
                  {/* Corner markers */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-green-500 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-green-500 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-green-500 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-green-500 rounded-br-lg" />
                </div>
                <p className="text-sm text-gray-500 mt-4">Position QR code within the frame</p>
                <button onClick={handleScan} className="btn-primary mt-4">Simulate Scan</button>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============ MEMBER HOURS ============
function MemberHours({ user }: { user: any }) {
  const attendance = store.getAttendance().filter(a => a.userId === user.id);
  const events = store.getEvents();
  const totalHours = store.getUserHours(user.id);
  const [activeTimer, setActiveTimer] = useState(attendance.find(a => !a.checkOut));

  useEffect(() => {
    const timer = setInterval(() => setActiveTimer(attendance.find(a => !a.checkOut)), 1000);
    return () => clearInterval(timer);
  }, [attendance]);

  const sortedRecords = [...attendance].sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime());

  return (
    <div className="animate-rise">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Hours</h1>
        <div className="text-right">
          <div className="text-2xl font-bold accent-text">{totalHours.toFixed(1)}h</div>
          <div className="text-xs text-gray-500">Total Hours</div>
        </div>
      </div>

      {activeTimer && (
        <div className="card mb-4 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Currently Checked In</p>
              <p className="text-sm text-gray-500">Since {formatTime(activeTimer.checkIn)}</p>
            </div>
            <LiveTimer startTime={activeTimer.checkIn} />
          </div>
        </div>
      )}

      <div className="card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table>
            <thead><tr><th>Date</th><th>Event</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Type</th></tr></thead>
            <tbody>
              {sortedRecords.map(record => {
                const event = record.eventId ? events.find(e => e.id === record.eventId) : null;
                const hours = record.checkOut ? getHoursBetween(record.checkIn, record.checkOut) : 0;
                return (
                  <tr key={record.id}>
                    <td className="text-sm">{formatDate(record.checkIn)}</td>
                    <td className="text-sm font-medium">{event?.title || 'General Shift'}</td>
                    <td className="text-sm">{formatTime(record.checkIn)}</td>
                    <td className="text-sm">{record.checkOut ? formatTime(record.checkOut) : <span className="text-green-500">Active</span>}</td>
                    <td className="text-sm font-medium">{hours > 0 ? hours.toFixed(2) : '—'}</td>
                    <td className="text-sm">{record.isWalkIn ? <span className="badge bg-amber-50 text-amber-600">Walk-in</span> : <span className="badge bg-blue-50 text-blue-600">Scheduled</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {sortedRecords.length === 0 && <EmptyState icon={<Clock size={40} />} title="No hours recorded" description="Check in at an event to start tracking your hours" />}
      </div>
    </div>
  );
}

// ============ MEMBER PROFILE ============
function MemberProfile({ user }: { user: any }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user.name, email: user.email, phone: user.phone, title: user.title });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [showDelete, setShowDelete] = useState(false);
  const [showWaiver, setShowWaiver] = useState(false);
  const [signature, setSignature] = useState('');
  const navigate = useNavigate();

  const settings = store.getSettings();
  const totalHours = store.getUserHours(user.id);
  const userMedals = store.getUserMedals(user.id);

  const handleSaveProfile = () => {
    store.updateUser(user.id, form);
    showToast('Profile updated', 'success');
    setEditing(false);
  };

  const handleChangePassword = () => {
    if (passwordForm.newPass !== passwordForm.confirm) {
      showToast('Passwords do not match', 'error');
      return;
    }
    if (passwordForm.newPass.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (user.password !== passwordForm.current) {
      showToast('Current password is incorrect', 'error');
      return;
    }
    store.updateUser(user.id, { password: passwordForm.newPass });
    showToast('Password updated', 'success');
    setShowPassword(false);
    setPasswordForm({ current: '', newPass: '', confirm: '' });
  };

  const handleDeleteAccount = () => {
    store.deleteUser(user.id);
    store.setCurrentUser(null);
    showToast('Account deleted', 'info');
    navigate('/');
  };

  const handleSignWaiver = () => {
    if (!signature.trim()) {
      showToast('Please enter your signature', 'error');
      return;
    }
    store.updateUser(user.id, { waiverSigned: true, waiverDate: new Date().toISOString() });
    showToast('Waiver signed successfully!', 'success');
    setShowWaiver(false);
    setSignature('');
  };

  return (
    <div className="animate-rise">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="card">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full accent-bg flex items-center justify-center text-white text-2xl font-bold">
              {user.name[0]}
            </div>
            <div>
              <h2 className="text-lg font-bold">{user.name}</h2>
              <p className="text-sm text-gray-500">{user.title}</p>
              <div className="flex gap-1 mt-1">
                {userMedals.map(m => <span key={m.id} className="text-lg">{m.icon}</span>)}
              </div>
            </div>
          </div>

          {editing ? (
            <div className="space-y-3">
              <div><label className="block text-sm font-medium mb-1">Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1">Email</label><input value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1">Phone</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1">Title</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
              <div className="flex gap-2">
                <button onClick={handleSaveProfile} className="btn-primary">Save</button>
                <button onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Email</span><span>{user.email}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Phone</span><span>{user.phone || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total Hours</span><span className="font-bold accent-text">{totalHours.toFixed(1)}h</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Member Since</span><span>{formatDate(user.createdAt)}</span></div>
              <button onClick={() => setEditing(true)} className="btn-secondary w-full mt-3 flex items-center justify-center gap-1"><Edit size={14} />Edit Profile</button>
            </div>
          )}
        </div>

        {/* QR Membership Card */}
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><QrCode size={16} className="accent-text" /> Membership Card</h2>
          <div className="text-center">
            <div className="inline-block p-4 bg-white border-2 rounded-xl">
              <QRCode value={user.id} size={160} />
            </div>
            <p className="text-sm text-gray-500 mt-3">{user.name}</p>
            <p className="text-xs text-gray-400">ID: {user.id.slice(0, 8)}</p>
          </div>
        </div>

        {/* Waiver Status */}
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><FileText size={16} className="accent-text" /> Waiver Status</h2>
          {user.waiverSigned ? (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <Check size={20} className="text-green-500" />
              <div>
                <p className="font-medium text-green-700">Waiver Signed</p>
                <p className="text-xs text-green-600">{user.waiverDate ? formatDate(user.waiverDate) : ''}</p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-3">You need to sign the waiver before registering for certain events.</p>
              <button onClick={() => setShowWaiver(true)} className="btn-primary w-full">Sign Waiver</button>
            </div>
          )}
        </div>

        {/* Password Management */}
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Shield size={16} className="accent-text" /> Security</h2>
          {showPassword ? (
            <div className="space-y-3">
              <div><label className="block text-sm font-medium mb-1">Current Password</label><input type="password" value={passwordForm.current} onChange={e => setPasswordForm({...passwordForm, current: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1">New Password</label><input type="password" value={passwordForm.newPass} onChange={e => setPasswordForm({...passwordForm, newPass: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1">Confirm Password</label><input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})} /></div>
              <div className="flex gap-2">
                <button onClick={handleChangePassword} className="btn-primary">Update Password</button>
                <button onClick={() => setShowPassword(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowPassword(true)} className="btn-secondary w-full">Change Password</button>
          )}
        </div>

        {/* Account Deletion */}
        <div className="card md:col-span-2 border-red-100">
          <h2 className="font-semibold mb-2 text-red-600">Danger Zone</h2>
          <p className="text-sm text-gray-500 mb-3">Permanently delete your account and all associated data.</p>
          <button onClick={() => setShowDelete(true)} className="btn-primary !bg-red-500 hover:!bg-red-600">Delete My Account</button>
        </div>
      </div>

      {/* Waiver Modal */}
      {showWaiver && (
        <Modal open={true} onClose={() => setShowWaiver(false)} title="Sign Waiver" size="lg">
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg max-h-48 overflow-y-auto text-sm text-gray-600">
              {settings.waiverText}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">E-Signature (Type your full name)</label>
              <input value={signature} onChange={e => setSignature(e.target.value)} placeholder="Your full legal name" className="font-serif text-lg italic" />
            </div>
            <div className="flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => setShowWaiver(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSignWaiver}>Sign & Accept</button>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog open={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDeleteAccount}
        title="Delete Account" message="This will permanently delete your account, all attendance records, registrations, and payments. This cannot be undone." confirmText="Delete My Account" danger />
    </div>
  );
}
