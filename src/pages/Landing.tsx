import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { store, formatDateTime, timeAgo } from '../store';
import { LiveClock, CountUp, ActivityTicker, showToast } from '../components/UI';
import { Calendar, Users, Clock, Award, Heart, ChevronRight, MapPin, UserPlus, LogIn, Leaf, TreePine, Mountain, Sun } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const settings = store.getSettings();
  const events = store.getEvents();
  const activities = store.getActivities();
  const users = store.getUsers();
  const attendance = store.getAttendance();
  const registrations = store.getRegistrations();
  const [showFirstRun, setShowFirstRun] = useState(store.isFirstRun());
  const [regEvent, setRegEvent] = useState<string | null>(null);

  useEffect(() => {
    store.seedData();
  }, []);

  const totalHours = store.getOrgTotalHours();
  const totalVolunteers = users.filter(u => u.status === 'active').length;
  const totalEvents = events.filter(e => store.getEventStatus(e) === 'past').length;
  const communityValue = totalHours * settings.dollarPerHour;

  const upcomingEvents = events
    .filter(e => store.getEventStatus(e) !== 'past' && e.isPublic)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 6);

  const liveEvents = events.filter(e => store.getEventStatus(e) === 'live' && e.isPublic);
  const recentActivities = activities.slice(0, 10);

  const getEventRegistrations = (eventId: string) => registrations.filter(r => r.eventId === eventId && r.status === 'registered').length;

  const handleRegister = (eventId: string) => {
    const user = store.getCurrentUser();
    if (!user) {
      showToast('Please sign in to register', 'info');
      navigate('/auth');
      return;
    }
    const event = events.find(e => e.id === eventId);
    if (event?.requireWaiver && !user.waiverSigned) {
      showToast('Please sign the waiver first', 'error');
      navigate('/member/profile');
      return;
    }
    store.registerForEvent(eventId, user.id);
    showToast('Successfully registered!', 'success');
    setRegEvent(null);
  };

  const logoIcons: Record<string, ReactNode> = {
    leaf: <Leaf size={32} className="text-white" />,
    tree: <TreePine size={32} className="text-white" />,
    mountain: <Mountain size={32} className="text-white" />,
    sun: <Sun size={32} className="text-white" />,
  };

  return (
    <div className="min-h-screen">
      {/* First Run Hint */}
      {showFirstRun && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <p className="text-sm text-amber-800">
              <strong>First Visit:</strong> Admin credentials — Email: <code className="bg-amber-100 px-1 rounded">admin@volunteerhub.org</code> | Password: <code className="bg-amber-100 px-1 rounded">Admin123!</code>
            </p>
            <button onClick={() => { store.markFirstVisitDone(); setShowFirstRun(false); }} className="text-amber-600 hover:text-amber-800 text-sm font-medium">Dismiss</button>
          </div>
        </div>
      )}

      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--sidebar-bg)] to-[#0f2a1a]" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, var(--accent) 0%, transparent 50%), radial-gradient(circle at 80% 20%, var(--accent-light) 0%, transparent 40%)' }} />
        <nav className="relative max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg accent-bg flex items-center justify-center">
              {logoIcons[settings.logo] || <Leaf size={24} className="text-white" />}
            </div>
            <span className="text-white font-bold text-lg">{settings.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/auth')} className="text-white/80 hover:text-white text-sm font-medium flex items-center gap-1">
              <LogIn size={16} /> Sign In
            </button>
            <button onClick={() => navigate('/auth?mode=register')} className="btn-primary text-sm flex items-center gap-1">
              <UserPlus size={16} /> Join Us
            </button>
          </div>
        </nav>

        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
          <div className="animate-rise">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">{settings.name}</h1>
            <p className="text-xl text-white/80 mb-2">{settings.tagline}</p>
            <p className="text-white/60 max-w-2xl mx-auto mt-4">{settings.mission}</p>
          </div>
          <div className="mt-8 animate-rise delay-200" style={{ opacity: 0 }}>
            <LiveClock />
          </div>
        </div>
      </header>

      {/* Activity Ticker */}
      {recentActivities.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 -mt-6 relative z-10">
          <ActivityTicker activities={recentActivities.map(a => ({ message: a.message, timestamp: a.timestamp }))} />
        </div>
      )}

      {/* Front Desk Punch Board */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card animate-rise">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Clock size={20} className="accent-text" /> Front Desk</h2>
            <div className="text-center py-6">
              <LiveClock />
              <div className="mt-6 flex gap-3 justify-center">
                <button onClick={() => {
                  const user = store.getCurrentUser();
                  if (!user) { navigate('/auth'); return; }
                  const active = attendance.find(a => a.userId === user.id && !a.checkOut);
                  if (active) { store.checkOut(active.id); showToast('Checked out!', 'success'); }
                  else { store.checkIn(user.id); showToast('Checked in!', 'success'); }
                }} className="btn-primary text-lg px-8 py-3">
                  {attendance.find(a => a.userId === store.getCurrentUser()?.id && !a.checkOut) ? '⏹ Check Out' : '▶ Check In'}
                </button>
              </div>
              {store.getCurrentUser() && attendance.find(a => a.userId === store.getCurrentUser()?.id && !a.checkOut) && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Current session:</p>
                  <span className="font-mono text-2xl font-bold accent-text">
                    {(() => {
                      const rec = attendance.find(a => a.userId === store.getCurrentUser()?.id && !a.checkOut);
                      if (!rec) return '00:00:00';
                      const diff = Date.now() - new Date(rec.checkIn).getTime();
                      const h = Math.floor(diff/3600000), m = Math.floor((diff%3600000)/60000), s = Math.floor((diff%60000)/1000);
                      return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
                    })()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Impact Stats */}
          <div className="card animate-rise delay-100" style={{ opacity: 0 }}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Heart size={20} className="accent-text" /> Our Impact</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold accent-text"><CountUp end={Math.round(totalHours)} suffix="h" /></div>
                <div className="text-sm text-gray-600 mt-1">Hours Served</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold accent-text"><CountUp end={totalVolunteers} /></div>
                <div className="text-sm text-gray-600 mt-1">Active Volunteers</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold accent-text"><CountUp end={totalEvents} /></div>
                <div className="text-sm text-gray-600 mt-1">Events Held</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold accent-text"><CountUp end={Math.round(communityValue)} prefix="$" /></div>
                <div className="text-sm text-gray-600 mt-1">Community Value</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Events */}
      {liveEvents.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse-dot" />
            Live Now
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {liveEvents.map(event => (
              <div key={event.id} className="card border-l-4 border-l-red-500">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{event.title}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><MapPin size={14} />{event.location}</p>
                  </div>
                  <span className="badge badge-live">LIVE</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => {
                    const user = store.getCurrentUser();
                    if (!user) { navigate('/auth'); return; }
                    const active = attendance.find(a => a.userId === user.id && !a.checkOut);
                    if (active) { store.checkOut(active.id); showToast('Checked out!', 'success'); }
                    else { store.checkIn(user.id, event.id); showToast('Checked in!', 'success'); }
                  }} className="btn-primary text-sm">
                    {attendance.find(a => a.userId === store.getCurrentUser()?.id && !a.checkOut) ? 'Check Out' : 'Check In'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2"><Calendar size={20} className="accent-text" /> Upcoming Events</h2>
        </div>
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No upcoming events scheduled</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingEvents.map((event, i) => {
              const regCount = getEventRegistrations(event.id);
              const capacityPct = Math.min((regCount / event.capacity) * 100, 100);
              return (
                <div key={event.id} className="card hover:shadow-lg transition-shadow animate-rise" style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`badge ${store.getEventStatus(event) === 'live' ? 'badge-live' : 'badge-upcoming'}`}>
                      {store.getEventStatus(event).toUpperCase()}
                    </span>
                    {event.fee > 0 && <span className="text-sm font-semibold accent-text">${event.fee}</span>}
                  </div>
                  <h3 className="font-semibold text-lg">{event.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{formatDateTime(event.startTime)}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><MapPin size={12} />{event.location}</p>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{event.description}</p>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{regCount} registered</span>
                      <span>{event.capacity} capacity</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${capacityPct}%` }} />
                    </div>
                  </div>
                  <button onClick={() => handleRegister(event.id)} className="btn-primary w-full mt-4 text-sm">
                    Register <ChevronRight size={14} className="inline" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Mission Section */}
      <section className="bg-gradient-to-br from-gray-50 to-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Award size={40} className="accent-text mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
          <p className="text-gray-600 text-lg leading-relaxed">{settings.mission}</p>
          <div className="mt-8 grid grid-cols-3 gap-6">
            <div className="animate-float">
              <div className="text-3xl mb-2">🌱</div>
              <h3 className="font-semibold">Serve</h3>
              <p className="text-sm text-gray-500">Making a difference daily</p>
            </div>
            <div className="animate-float delay-200">
              <div className="text-3xl mb-2">🤝</div>
              <h3 className="font-semibold">Connect</h3>
              <p className="text-sm text-gray-500">Building community bonds</p>
            </div>
            <div className="animate-float delay-400">
              <div className="text-3xl mb-2">🌟</div>
              <h3 className="font-semibold">Grow</h3>
              <p className="text-sm text-gray-500">Developing future leaders</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--sidebar-bg)] text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded accent-bg flex items-center justify-center">
                  {logoIcons[settings.logo] || <Leaf size={18} className="text-white" />}
                </div>
                <span className="font-bold">{settings.name}</span>
              </div>
              <p className="text-white/60 text-sm">{settings.tagline}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contact</h4>
              <div className="space-y-2 text-sm text-white/70">
                <p>{settings.contactEmail}</p>
                <p>{settings.contactPhone}</p>
                <p>{settings.address}</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Organization</h4>
              <div className="space-y-2 text-sm text-white/70">
                <p>EIN: {settings.ein}</p>
                <p>501(c)(3) Nonprofit</p>
                <a href="https://github.com" target="_blank" className="flex items-center gap-1 accent-text hover:underline">
                  GitHub Repository
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-6 text-center text-sm text-white/40">
            © {new Date().getFullYear()} {settings.name}. All rights reserved. Powered by VolunteerHub.
          </div>
        </div>
      </footer>

      {/* Film grain overlay */}
      <div className="film-grain" />
    </div>
  );
}
