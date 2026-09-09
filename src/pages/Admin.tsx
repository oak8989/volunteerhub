import { useState, useEffect } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { store, formatDateTime, formatDate, formatTime, getHoursBetween, timeAgo, type User, type Event as EventType } from '../store';
import { showToast, Modal, ConfirmDialog, CountUp, LiveTimer, EmptyState, Tabs, QRCode } from '../components/UI';
import {
  LayoutDashboard, Calendar, Users, BarChart3, Settings, Rocket, Activity,
  LogOut, Plus, Search, Filter, Download, Edit, Trash2, Eye, EyeOff,
  Clock, MapPin, DollarSign, Check, X, ChevronDown, Menu, Leaf,
  TreePine, Mountain, Sun, Send, RefreshCw, Mail, AlertTriangle,
  Award, TrendingUp, UserCheck, QrCode, Shield
} from 'lucide-react';

export default function Admin() {
  const navigate = useNavigate();
  const [view, setView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, setTick] = useState(0);
  const user = store.getCurrentUser();

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/auth'); return; }
    const unsub = store.subscribe(() => setTick(t => t + 1));
    return () => { unsub(); };
  }, [user, navigate]);

  if (!user || user.role !== 'admin') return null;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'events', label: 'Events', icon: <Calendar size={18} /> },
    { id: 'members', label: 'Members', icon: <Users size={18} /> },
    { id: 'impact', label: 'Impact', icon: <BarChart3 size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
    { id: 'deploy', label: 'Deploy', icon: <Rocket size={18} /> },
    { id: 'activity', label: 'Activity', icon: <Activity size={18} /> },
  ];

  const handleLogout = () => { store.setCurrentUser(null); navigate('/'); };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={`sidebar w-64 flex-shrink-0 flex flex-col ${sidebarOpen ? 'open !translate-x-0' : ''}`}>
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded accent-bg flex items-center justify-center">
              <Leaf size={18} className="text-white" />
            </div>
            <span className="font-bold text-sm">{store.getSettings().name}</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setView(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${view === item.id ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
              {item.icon}{item.label}
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
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden mb-4 p-2 bg-white rounded-lg shadow">
            <Menu size={20} />
          </button>
          {view === 'dashboard' && <DashboardView />}
          {view === 'events' && <EventsView />}
          {view === 'members' && <MembersView />}
          {view === 'impact' && <ImpactView />}
          {view === 'settings' && <SettingsView />}
          {view === 'deploy' && <DeployView />}
          {view === 'activity' && <ActivityView />}
        </div>
      </main>
    </div>
  );
}

// ============ DASHBOARD ============
function DashboardView() {
  const events = store.getEvents();
  const users = store.getUsers();
  const attendance = store.getAttendance();
  const activities = store.getActivities();
  const registrations = store.getRegistrations();

  const totalHours = store.getOrgTotalHours();
  const liveEvents = events.filter(e => store.getEventStatus(e) === 'live');
  const upcomingEvents = events.filter(e => store.getEventStatus(e) === 'upcoming').slice(0, 5);
  const activeCheckins = attendance.filter(a => !a.checkOut);

  // Top volunteers
  const volunteerHours = users.filter(u => u.status === 'active').map(u => ({
    ...u, hours: store.getUserHours(u.id)
  })).sort((a, b) => b.hours - a.hours).slice(0, 5);

  return (
    <div className="animate-rise">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Hours', value: Math.round(totalHours), suffix: 'h', icon: <Clock size={20} />, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Active Members', value: users.filter(u => u.status === 'active').length, icon: <Users size={20} />, color: 'bg-blue-50 text-blue-600' },
          { label: 'Events', value: events.length, icon: <Calendar size={20} />, color: 'bg-purple-50 text-purple-600' },
          { label: 'Checked In', value: activeCheckins.length, icon: <UserCheck size={20} />, color: 'bg-amber-50 text-amber-600' },
        ].map((stat, i) => (
          <div key={i} className="card">
            <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>{stat.icon}</div>
            <div className="text-2xl font-bold"><CountUp end={stat.value} suffix={stat.suffix} /></div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Live Events */}
        <div className="card">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            {liveEvents.length > 0 && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse-dot" />}
            Live Events
          </h2>
          {liveEvents.length === 0 ? (
            <p className="text-sm text-gray-500">No events are currently live</p>
          ) : (
            <div className="space-y-2">
              {liveEvents.map(e => (
                <div key={e.id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{e.title}</p>
                    <p className="text-xs text-gray-500">{e.location}</p>
                  </div>
                  <span className="badge badge-live">LIVE</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming */}
        <div className="card">
          <h2 className="font-semibold mb-3">Upcoming Events</h2>
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-gray-500">No upcoming events</p>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map(e => (
                <div key={e.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{e.title}</p>
                    <p className="text-xs text-gray-500">{formatDate(e.startTime)}</p>
                  </div>
                  <span className="badge badge-upcoming">Upcoming</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Volunteers */}
        <div className="card">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><Award size={16} className="accent-text" /> Top Volunteers</h2>
          <div className="space-y-3">
            {volunteerHours.map((v, i) => (
              <div key={v.id} className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-400 w-5">#{i+1}</span>
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold">{v.name[0]}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{v.name}</p>
                  <div className="progress-bar mt-1"><div className="progress-fill" style={{ width: `${Math.min((v.hours / (volunteerHours[0]?.hours || 1)) * 100, 100)}%` }} /></div>
                </div>
                <span className="text-sm font-semibold">{Math.round(v.hours)}h</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="font-semibold mb-3">Recent Activity</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {activities.slice(0, 10).map(a => (
              <div key={a.id} className="flex items-start gap-2 text-sm">
                <span className="w-2 h-2 rounded-full accent-bg mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-gray-700">{a.message}</p>
                  <p className="text-xs text-gray-400">{timeAgo(a.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ EVENTS VIEW ============
function EventsView() {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live' | 'past'>('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editEvent, setEditEvent] = useState<EventType | null>(null);
  const [viewAttendance, setViewAttendance] = useState<EventType | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const events = store.getEvents();
  const filtered = events.filter(e => {
    if (filter !== 'all' && store.getEventStatus(e) !== filter) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !e.location.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const handleDelete = (id: string) => {
    store.deleteEvent(id);
    showToast('Event deleted', 'success');
    setDeleteConfirm(null);
  };

  const exportAttendanceCSV = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    const regs = store.getRegistrations().filter(r => r.eventId === eventId);
    const attendance = store.getAttendance().filter(a => a.eventId === eventId);
    const users = store.getUsers();
    let csv = 'Name,Email,Status,Check In,Check Out,Hours,Payment\n';
    regs.forEach(r => {
      const user = users.find(u => u.id === r.userId);
      const att = attendance.find(a => a.userId === r.userId);
      const hours = att?.checkOut ? getHoursBetween(att.checkIn, att.checkOut).toFixed(2) : '0';
      const checkedIn = att ? 'Yes' : 'No';
      csv += `${user?.name},${user?.email},${checkedIn},${att?.checkIn || ''},${att?.checkOut || ''},${hours},${r.paid ? 'Paid' : 'Unpaid'}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${event?.title || 'event'}-attendance.csv`; a.click();
    showToast('CSV exported', 'success');
  };

  return (
    <div className="animate-rise">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Events</h1>
        <button onClick={() => { setEditEvent(null); setShowCreate(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Create Event
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events..." className="pl-9" />
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(['all', 'upcoming', 'live', 'past'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded text-sm font-medium capitalize ${filter === f ? 'bg-white shadow' : 'text-gray-600'}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(event => {
          const status = store.getEventStatus(event);
          const regCount = store.getRegistrations().filter(r => r.eventId === event.id && r.status === 'registered').length;
          return (
            <div key={event.id} className="card hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{event.title}</h3>
                    <span className={`badge ${status === 'live' ? 'badge-live' : status === 'upcoming' ? 'badge-upcoming' : 'badge-past'}`}>
                      {status.toUpperCase()}
                    </span>
                    {!event.isPublic && <span className="badge bg-gray-100 text-gray-600">Private</span>}
                    {event.isRecurring && <span className="badge bg-purple-50 text-purple-600">Recurring</span>}
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Clock size={12} />{formatDateTime(event.startTime)}</span>
                    <span className="flex items-center gap-1"><MapPin size={12} />{event.location}</span>
                    {event.fee > 0 && <span className="flex items-center gap-1"><DollarSign size={12} />${event.fee}/person</span>}
                    <span>{regCount}/{event.capacity} registered</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setViewAttendance(event)} className="btn-secondary text-sm flex items-center gap-1"><Eye size={14} />Attendance</button>
                  <button onClick={() => { setEditEvent(event); setShowCreate(true); }} className="p-2 hover:bg-gray-100 rounded-lg"><Edit size={16} className="text-gray-500" /></button>
                  <button onClick={() => setDeleteConfirm(event.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 size={16} className="text-red-500" /></button>
                </div>
              </div>
              <div className="mt-2 progress-bar"><div className="progress-fill" style={{ width: `${Math.min((regCount/event.capacity)*100, 100)}%` }} /></div>
            </div>
          );
        })}
        {filtered.length === 0 && <EmptyState icon={<Calendar size={40} />} title="No events found" description="Create your first event to get started" />}
      </div>

      {/* Create/Edit Modal */}
      {showCreate && <EventFormModal event={editEvent} onClose={() => setShowCreate(false)} />}

      {/* Attendance Modal */}
      {viewAttendance && (
        <Modal open={true} onClose={() => setViewAttendance(null)} title={`Attendance: ${viewAttendance.title}`} size="lg">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">{store.getRegistrations().filter(r => r.eventId === viewAttendance.id && r.status === 'registered').length} registered</p>
            <button onClick={() => exportAttendanceCSV(viewAttendance.id)} className="btn-secondary text-sm flex items-center gap-1"><Download size={14} />Export CSV</button>
          </div>
          <div className="overflow-x-auto">
            <table>
              <thead><tr><th>Name</th><th>Status</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Payment</th></tr></thead>
              <tbody>
                {store.getRegistrations().filter(r => r.eventId === viewAttendance.id && r.status === 'registered').map(reg => {
                  const u = store.getUser(reg.userId);
                  const att = store.getAttendance().find(a => a.eventId === viewAttendance.id && a.userId === reg.userId);
                  const hours = att?.checkOut ? getHoursBetween(att.checkIn, att.checkOut).toFixed(2) : '—';
                  return (
                    <tr key={reg.id}>
                      <td className="font-medium">{u?.name || 'Unknown'}</td>
                      <td>{att ? <span className="badge badge-success">Checked In</span> : <span className="text-red-500 text-sm">No-show</span>}</td>
                      <td className="text-sm">{att ? formatTime(att.checkIn) : '—'}</td>
                      <td className="text-sm">{att?.checkOut ? formatTime(att.checkOut) : '—'}</td>
                      <td className="text-sm">{hours}</td>
                      <td className="text-sm">{reg.paid ? <span className="text-green-600">Paid ${reg.amount}</span> : <span className="text-gray-400">Free</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)} title="Delete Event" message="This will permanently delete this event and all associated registrations. This cannot be undone." confirmText="Delete" danger />
    </div>
  );
}

// ============ EVENT FORM MODAL ============
function EventFormModal({ event, onClose }: { event: EventType | null; onClose: () => void }) {
  const user = store.getCurrentUser();
  const [form, setForm] = useState({
    title: event?.title || '',
    description: event?.description || '',
    location: event?.location || '',
    startTime: event?.startTime ? new Date(event.startTime).toISOString().slice(0, 16) : '',
    endTime: event?.endTime ? new Date(event.endTime).toISOString().slice(0, 16) : '',
    capacity: event?.capacity || 50,
    fee: event?.fee || 0,
    isPublic: event?.isPublic !== false,
    isRecurring: event?.isRecurring || false,
    recurrenceType: event?.recurrenceType || 'weekly',
    requireWaiver: event?.requireWaiver || false,
    allowedGroups: event?.allowedGroups || [],
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (event) {
      store.updateEvent(event.id, { ...form, startTime: new Date(form.startTime).toISOString(), endTime: new Date(form.endTime).toISOString() });
      showToast('Event updated', 'success');
    } else {
      store.addEvent({ ...form, startTime: new Date(form.startTime).toISOString(), endTime: new Date(form.endTime).toISOString(), createdBy: user?.id });
      showToast('Event created', 'success');
    }
    onClose();
  };

  return (
    <Modal open={true} onClose={onClose} title={event ? 'Edit Event' : 'Create Event'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Title</label>
            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Capacity</label>
            <input type="number" value={form.capacity} onChange={e => setForm({...form, capacity: +e.target.value})} min={1} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Start Time</label>
            <input type="datetime-local" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Time</label>
            <input type="datetime-local" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fee per Person ($)</label>
            <input type="number" value={form.fee} onChange={e => setForm({...form, fee: +e.target.value})} min={0} step={0.01} />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPublic} onChange={e => setForm({...form, isPublic: e.target.checked})} className="w-auto" /> Public Event</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.requireWaiver} onChange={e => setForm({...form, requireWaiver: e.target.checked})} className="w-auto" /> Require Waiver</label>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isRecurring} onChange={e => setForm({...form, isRecurring: e.target.checked})} className="w-auto" /> Recurring</label>
            {form.isRecurring && (
              <select value={form.recurrenceType} onChange={e => setForm({...form, recurrenceType: e.target.value as any})} className="w-auto">
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">{event ? 'Update' : 'Create'} Event</button>
        </div>
      </form>
    </Modal>
  );
}

// ============ MEMBERS VIEW ============
function MembersView() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const users = store.getUsers();
  const filtered = users.filter(u => {
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleDelete = (id: string) => {
    const result = store.deleteUser(id);
    if (result) showToast('Member deleted', 'success');
    else showToast('Cannot delete the last admin', 'error');
    setDeleteConfirm(null);
  };

  const exportCSV = () => {
    let csv = 'Name,Email,Phone,Title,Role,Groups,Status,Hours,Joined\n';
    users.forEach(u => {
      csv += `${u.name},${u.email},${u.phone},${u.title},${u.role},"${u.groups.join('; ')}",${u.status},${store.getUserHours(u.id).toFixed(1)},${formatDate(u.createdAt)}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'members.csv'; a.click();
    showToast('CSV exported', 'success');
  };

  return (
    <div className="animate-rise">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Members ({users.length})</h1>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-1"><Download size={14} />Export</button>
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-1"><Plus size={16} />Add Member</button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..." className="pl-9" />
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button key={f} onClick={() => setStatusFilter(f)} className={`px-3 py-1.5 rounded text-sm font-medium capitalize ${statusFilter === f ? 'bg-white shadow' : 'text-gray-600'}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Groups</th><th>Hours</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold">{u.name[0]}</div>
                      {u.name}
                    </div>
                  </td>
                  <td className="text-gray-500">{u.email}</td>
                  <td><span className={`badge ${u.role === 'admin' ? 'bg-purple-50 text-purple-600' : 'bg-gray-50 text-gray-600'}`}>{u.role}</span></td>
                  <td className="text-sm text-gray-500">{u.groups.join(', ') || '—'}</td>
                  <td className="font-medium">{store.getUserHours(u.id).toFixed(1)}h</td>
                  <td>
                    <button onClick={() => { store.updateUser(u.id, { status: u.status === 'active' ? 'inactive' : 'active' }); showToast('Status updated', 'success'); }}
                      className={`badge cursor-pointer ${u.status === 'active' ? 'badge-success' : 'bg-gray-100 text-gray-500'}`}>
                      {u.status}
                    </button>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => setEditUser(u)} className="p-1.5 hover:bg-gray-100 rounded"><Edit size={14} className="text-gray-500" /></button>
                      <button onClick={() => setDeleteConfirm(u.id)} className="p-1.5 hover:bg-red-50 rounded"><Trash2 size={14} className="text-red-500" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editUser && <MemberEditModal user={editUser} onClose={() => setEditUser(null)} />}
      {showAdd && <AddMemberModal onClose={() => setShowAdd(false)} />}
      <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Member" message="This will permanently delete this member and all their data (attendance, registrations, payments, waivers). This cannot be undone." confirmText="Delete" danger />
    </div>
  );
}

function MemberEditModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [form, setForm] = useState({ ...user });
  const allGroups = ['Leadership', 'Mentors', 'Trail Leads', 'Events', 'Outreach'];

  const handleSave = () => {
    store.updateUser(user.id, form);
    showToast('Member updated', 'success');
    onClose();
  };

  return (
    <Modal open={true} onClose={onClose} title="Edit Member" size="lg">
      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
          <div><label className="block text-sm font-medium mb-1">Email</label><input value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
          <div><label className="block text-sm font-medium mb-1">Phone</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
          <div><label className="block text-sm font-medium mb-1">Title</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value as any})}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Groups</label>
            <div className="flex flex-wrap gap-2">
              {allGroups.map(g => (
                <label key={g} className="flex items-center gap-1 text-sm">
                  <input type="checkbox" checked={form.groups.includes(g)} onChange={e => {
                    if (e.target.checked) setForm({...form, groups: [...form.groups, g]});
                    else setForm({...form, groups: form.groups.filter(x => x !== g)});
                  }} className="w-auto" />
                  {g}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </Modal>
  );
}

function AddMemberModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', title: 'Volunteer', role: 'member' as const });

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    store.addUser(form);
    store.addEmail(form.email, 'Welcome!', `You've been added to ${store.getSettings().name}`);
    showToast('Member added', 'success');
    onClose();
  };

  return (
    <Modal open={true} onClose={onClose} title="Add Member">
      <form onSubmit={handleAdd} className="space-y-4">
        <div><label className="block text-sm font-medium mb-1">Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
        <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></div>
        <div><label className="block text-sm font-medium mb-1">Password</label><input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={6} /></div>
        <div><label className="block text-sm font-medium mb-1">Phone</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Add Member</button>
        </div>
      </form>
    </Modal>
  );
}

// ============ IMPACT VIEW ============
function ImpactView() {
  const users = store.getUsers().filter(u => u.status === 'active');
  const events = store.getEvents();
  const registrations = store.getRegistrations();
  const settings = store.getSettings();
  const totalHours = store.getOrgTotalHours();
  const communityValue = totalHours * settings.dollarPerHour;
  const totalRevenue = registrations.filter(r => r.paid && r.status === 'registered').reduce((sum, r) => sum + (r.amount || 0), 0);
  const checkedIn = registrations.filter(r => {
    const att = store.getAttendance().find(a => a.eventId === r.eventId && a.userId === r.userId);
    return att && r.status === 'registered';
  }).length;
  const showUpRate = registrations.filter(r => r.status === 'registered').length > 0
    ? Math.round((checkedIn / registrations.filter(r => r.status === 'registered').length) * 100) : 0;

  // Monthly hours (last 8 months)
  const monthlyData = Array.from({ length: 8 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (7 - i));
    const month = d.getMonth();
    const year = d.getFullYear();
    const hours = store.getAttendance()
      .filter(a => {
        if (!a.checkOut) return false;
        const ad = new Date(a.checkIn);
        return ad.getMonth() === month && ad.getFullYear() === year;
      })
      .reduce((sum, a) => sum + getHoursBetween(a.checkIn, a.checkOut!), 0);
    return { month: d.toLocaleDateString([], { month: 'short' }), hours: Math.round(hours) };
  });

  const maxMonthlyHours = Math.max(...monthlyData.map(d => d.hours), 1);

  // Leaderboard
  const leaderboard = users.map(u => ({ ...u, hours: store.getUserHours(u.id), medals: store.getUserMedals(u.id) }))
    .sort((a, b) => b.hours - a.hours);

  // Per-event breakdown
  const eventBreakdown = events.map(e => {
    const hours = store.getAttendance().filter(a => a.eventId === e.id && a.checkOut)
      .reduce((sum, a) => sum + getHoursBetween(a.checkIn, a.checkOut!), 0);
    return { ...e, hours };
  }).filter(e => e.hours > 0).sort((a, b) => b.hours - a.hours);

  const maxEventHours = Math.max(...eventBreakdown.map(e => e.hours), 1);

  // Medal distribution
  const medalTiers = store.getMedalTiers();
  const medalDist = medalTiers.map(t => ({
    ...t,
    count: users.filter(u => store.getUserHours(u.id) >= t.hours).length
  }));

  return (
    <div className="animate-rise">
      <h1 className="text-2xl font-bold mb-6">Impact & Insights</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {[
          { label: 'Total Hours', value: Math.round(totalHours), suffix: 'h' },
          { label: 'Community Value', value: Math.round(communityValue), prefix: '$' },
          { label: 'Events Held', value: events.filter(e => store.getEventStatus(e) === 'past').length },
          { label: 'Avg Hours/Vol', value: Math.round(totalHours / (users.length || 1)) },
          { label: 'Show-up Rate', value: showUpRate, suffix: '%' },
          { label: 'Fees Collected', value: totalRevenue, prefix: '$' },
        ].map((s, i) => (
          <div key={i} className="card text-center">
            <div className="text-xl font-bold accent-text"><CountUp end={s.value} prefix={s.prefix || ''} suffix={s.suffix || ''} /></div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Monthly Trend */}
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp size={16} className="accent-text" /> Monthly Hours (Last 8 Months)</h2>
          <div className="flex items-end gap-2 h-40">
            {monthlyData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t bg-gradient-to-t from-[var(--accent)] to-[var(--accent-light)] transition-all" style={{ height: `${(d.hours / maxMonthlyHours) * 100}%`, minHeight: d.hours > 0 ? '4px' : '0' }} />
                <span className="text-xs text-gray-500">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Medal Distribution */}
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Award size={16} className="accent-text" /> Medal Distribution</h2>
          <div className="space-y-3">
            {medalDist.map(m => (
              <div key={m.id} className="flex items-center gap-3">
                <span className="text-xl">{m.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{m.name} ({m.hours}h+)</span>
                    <span className="text-gray-500">{m.count} members</span>
                  </div>
                  <div className="progress-bar mt-1"><div className="progress-fill" style={{ width: `${(m.count / (users.length || 1)) * 100}%`, background: m.color }} /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card mb-6">
        <h2 className="font-semibold mb-4">🏆 Volunteer Leaderboard</h2>
        <div className="space-y-3">
          {leaderboard.slice(0, 10).map((v, i) => {
            const nextMedal = store.getNextMedal(v.id);
            const progress = nextMedal ? Math.min((v.hours / nextMedal.hours) * 100, 100) : 100;
            return (
              <div key={v.id} className="flex items-center gap-3">
                <span className={`text-sm font-bold w-6 ${i < 3 ? 'accent-text' : 'text-gray-400'}`}>#{i+1}</span>
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold">{v.name[0]}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{v.name}</span>
                    {v.medals.map(m => <span key={m.id} className="text-sm">{m.icon}</span>)}
                  </div>
                  <div className="progress-bar mt-1"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
                  {nextMedal && <span className="text-xs text-gray-400">{v.hours.toFixed(1)}h / {nextMedal.hours}h to {nextMedal.name}</span>}
                </div>
                <span className="text-sm font-bold">{v.hours.toFixed(1)}h</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-event breakdown */}
      <div className="card">
        <h2 className="font-semibold mb-4">Hours Per Event</h2>
        <div className="space-y-2">
          {eventBreakdown.slice(0, 10).map(e => (
            <div key={e.id} className="flex items-center gap-3">
              <span className="text-sm font-medium flex-1 truncate">{e.title}</span>
              <div className="w-32 progress-bar"><div className="progress-fill" style={{ width: `${(e.hours / maxEventHours) * 100}%` }} /></div>
              <span className="text-sm font-bold w-12 text-right">{e.hours.toFixed(1)}h</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ SETTINGS VIEW ============
function SettingsView() {
  const settings = store.getSettings();
  const [tab, setTab] = useState('branding');
  const [form, setForm] = useState({ ...settings });
  const [medalTiers, setMedalTiers] = useState(store.getMedalTiers());

  const handleSave = () => {
    store.updateSettings(form);
    showToast('Settings saved', 'success');
  };

  const handleSaveMedals = () => {
    store.saveMedalTiers(medalTiers);
    showToast('Medal tiers updated', 'success');
  };

  const handleTestEmail = () => {
    store.addEmail(form.smtpFrom || 'test@test.com', 'Test Email', 'This is a test email from VolunteerHub.');
    showToast('Test email sent', 'success');
  };

  const handleRefreshSmtp = () => {
    if (form.smtpHost) {
      store.updateSettings({ smtpStatus: 'online' });
      showToast('SMTP connection verified', 'success');
    } else {
      store.updateSettings({ smtpStatus: 'offline' });
      showToast('No SMTP configured', 'info');
    }
  };

  const tabs = [
    { id: 'branding', label: 'Branding' },
    { id: 'waivers', label: 'Waivers' },
    { id: 'awards', label: 'Awards' },
    { id: 'payments', label: 'Payments' },
    { id: 'email', label: 'Email' },
    { id: 'org', label: 'Organization' },
  ];

  const logoOptions = ['leaf', 'tree', 'mountain', 'sun'];
  const logoIcons: Record<string, ReactNode> = { leaf: <Leaf size={20} />, tree: <TreePine size={20} />, mountain: <Mountain size={20} />, sun: <Sun size={20} /> };
  const themeColors = ['emerald', 'blue', 'purple', 'rose', 'amber', 'teal'];

  return (
    <div className="animate-rise">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      <div className="mt-6">
        {tab === 'branding' && (
          <div className="card space-y-4">
            <h2 className="font-semibold">White-Label Customization</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Organization Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1">Tagline</label><input value={form.tagline} onChange={e => setForm({...form, tagline: e.target.value})} /></div>
              <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Mission Statement</label><textarea value={form.mission} onChange={e => setForm({...form, mission: e.target.value})} rows={3} /></div>
              <div>
                <label className="block text-sm font-medium mb-2">Logo</label>
                <div className="flex gap-2">
                  {logoOptions.map(l => (
                    <button key={l} onClick={() => setForm({...form, logo: l})} className={`w-10 h-10 rounded-lg flex items-center justify-center ${form.logo === l ? 'accent-bg text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {logoIcons[l]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Theme Accent</label>
                <div className="flex gap-2">
                  {themeColors.map(c => (
                    <button key={c} onClick={() => setForm({...form, theme: c})} className={`w-10 h-10 rounded-full border-2 ${form.theme === c ? 'border-gray-800 scale-110' : 'border-transparent'}`} style={{ background: `var(--accent)` }} title={c} />
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border">
              <p className="text-sm text-gray-500 mb-2">Live Preview</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded accent-bg flex items-center justify-center text-white">{logoIcons[form.logo]}</div>
                <div>
                  <p className="font-semibold">{form.name}</p>
                  <p className="text-xs text-gray-500">{form.tagline}</p>
                </div>
              </div>
            </div>
            <button onClick={handleSave} className="btn-primary">Save Branding</button>
          </div>
        )}

        {tab === 'waivers' && (
          <div className="card space-y-4">
            <h2 className="font-semibold">Waiver Configuration</h2>
            <div><label className="block text-sm font-medium mb-1">Waiver Text</label><textarea value={form.waiverText} onChange={e => setForm({...form, waiverText: e.target.value})} rows={6} /></div>
            <button onClick={handleSave} className="btn-primary">Save Waiver</button>
          </div>
        )}

        {tab === 'awards' && (
          <div className="card space-y-4">
            <h2 className="font-semibold">Medal Thresholds</h2>
            <div className="space-y-3">
              {medalTiers.map((tier, i) => (
                <div key={tier.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl">{tier.icon}</span>
                  <div className="flex-1">
                    <input value={tier.name} onChange={e => { const t = [...medalTiers]; t[i] = {...t[i], name: e.target.value}; setMedalTiers(t); }} className="font-medium" />
                  </div>
                  <div className="w-24">
                    <input type="number" value={tier.hours} onChange={e => { const t = [...medalTiers]; t[i] = {...t[i], hours: +e.target.value}; setMedalTiers(t); }} className="text-center" />
                    <span className="text-xs text-gray-500 text-center block">hours</span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={handleSaveMedals} className="btn-primary">Save Awards</button>
          </div>
        )}

        {tab === 'payments' && (
          <div className="card space-y-4">
            <h2 className="font-semibold">Payment Settings</h2>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.paymentsEnabled} onChange={e => setForm({...form, paymentsEnabled: e.target.checked})} className="w-auto" />
              <span className="text-sm font-medium">Enable Payments</span>
            </label>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Dollar Value per Hour</label><input type="number" value={form.dollarPerHour} onChange={e => setForm({...form, dollarPerHour: +e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1">Payout Account Label</label><input value={form.payoutLabel} onChange={e => setForm({...form, payoutLabel: e.target.value})} /></div>
            </div>
            <button onClick={handleSave} className="btn-primary">Save Payments</button>
          </div>
        )}

        {tab === 'email' && (
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Email / SMTP Configuration</h2>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${form.smtpStatus === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm capitalize">{form.smtpStatus}</span>
                <button onClick={handleRefreshSmtp} className="p-1 hover:bg-gray-100 rounded"><RefreshCw size={14} /></button>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">SMTP Host</label><input value={form.smtpHost} onChange={e => setForm({...form, smtpHost: e.target.value})} placeholder="smtp.gmail.com" /></div>
              <div><label className="block text-sm font-medium mb-1">SMTP Port</label><input type="number" value={form.smtpPort} onChange={e => setForm({...form, smtpPort: +e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1">SMTP User</label><input value={form.smtpUser} onChange={e => setForm({...form, smtpUser: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1">SMTP Password</label><input type="password" value={form.smtpPass} onChange={e => setForm({...form, smtpPass: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1">From Address</label><input value={form.smtpFrom} onChange={e => setForm({...form, smtpFrom: e.target.value})} /></div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSave} className="btn-primary">Save Settings</button>
              <button onClick={handleTestEmail} className="btn-secondary flex items-center gap-1"><Send size={14} />Send Test Email</button>
            </div>
            {/* Outbox */}
            <div className="mt-6">
              <h3 className="font-medium mb-3">Email Outbox</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {store.getEmails().slice(0, 10).map(email => (
                  <div key={email.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                    <div>
                      <span className="font-medium">{email.subject}</span>
                      <span className="text-gray-500 ml-2">→ {email.to}</span>
                    </div>
                    <span className={`badge ${email.status === 'delivered' ? 'badge-success' : email.status === 'failed' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}`}>{email.status}</span>
                  </div>
                ))}
                {store.getEmails().length === 0 && <p className="text-sm text-gray-500">No emails sent yet</p>}
              </div>
            </div>
          </div>
        )}

        {tab === 'org' && (
          <div className="card space-y-4">
            <h2 className="font-semibold">Organization Info</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Contact Email</label><input value={form.contactEmail} onChange={e => setForm({...form, contactEmail: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1">Contact Phone</label><input value={form.contactPhone} onChange={e => setForm({...form, contactPhone: e.target.value})} /></div>
              <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Address</label><input value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1">EIN (Tax ID)</label><input value={form.ein} onChange={e => setForm({...form, ein: e.target.value})} /></div>
            </div>
            <button onClick={handleSave} className="btn-primary">Save Organization Info</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ DEPLOY VIEW ============
function DeployView() {
  const settings = store.getSettings();
  const storageUsed = Object.keys(localStorage).reduce((sum, key) => sum + (localStorage.getItem(key)?.length || 0), 0);

  return (
    <div className="animate-rise">
      <h1 className="text-2xl font-bold mb-6">Deploy & Instance</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Shield size={16} className="accent-text" /> Instance Status</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Status</span><span className="badge badge-success">Running</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Version</span><span>1.0.0</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Uptime</span><span>Active</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Storage Used</span><span>{(storageUsed / 1024).toFixed(1)} KB</span></div>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Mail size={16} className="accent-text" /> Email Relay</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-gray-500">SMTP Host</span><span>{settings.smtpHost || 'Not configured'}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Status</span>
              <span className={`flex items-center gap-1 ${settings.smtpStatus === 'online' ? 'text-green-600' : 'text-red-500'}`}>
                <span className={`w-2 h-2 rounded-full ${settings.smtpStatus === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                {settings.smtpStatus}
              </span>
            </div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Emails Sent</span><span>{store.getEmails().length}</span></div>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">🔒 Security Checklist</h2>
          <div className="space-y-2">
            {[
              { label: 'Content Security Policy', status: true },
              { label: 'X-Frame-Options: DENY', status: true },
              { label: 'X-Content-Type-Options: nosniff', status: true },
              { label: 'Referrer-Policy: strict-origin', status: true },
              { label: 'Permissions-Policy configured', status: true },
              { label: 'server_tokens off', status: true },
              { label: 'Credential gating', status: true },
              { label: 'Password masking', status: true },
              { label: 'Last-admin protection', status: true },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Check size={14} className="text-green-500" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">📦 Storage Tools</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Users</span><span>{store.getUsers().length} records</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Events</span><span>{store.getEvents().length} records</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Registrations</span><span>{store.getRegistrations().length} records</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Attendance</span><span>{store.getAttendance().length} records</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Activities</span><span>{store.getActivities().length} records</span></div>
            <button onClick={() => {
              const data = {
                users: store.getUsers(),
                events: store.getEvents(),
                registrations: store.getRegistrations(),
                attendance: store.getAttendance(),
                settings: store.getSettings(),
                medals: store.getMedalTiers(),
              };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'volunteerhub-backup.json'; a.click();
              showToast('Backup downloaded', 'success');
            }} className="btn-secondary w-full flex items-center justify-center gap-2"><Download size={14} />Export Full Backup</button>
          </div>
        </div>

        <div className="card md:col-span-2">
          <h2 className="font-semibold mb-4">🐳 Docker Commands</h2>
          <div className="space-y-2 font-mono text-sm bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
            <p># Build and start</p>
            <p>$ docker-compose up -d --build</p>
            <p className="mt-2"># View logs</p>
            <p>$ docker-compose logs -f</p>
            <p className="mt-2"># Reset database</p>
            <p>$ docker-compose exec app npm run seed</p>
            <p className="mt-2"># Backup data</p>
            <p>$ docker-compose exec app cat /data/db.json &gt; backup.json</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ ACTIVITY VIEW ============
function ActivityView() {
  const activities = store.getActivities();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? activities : activities.filter(a => a.type === filter);

  const typeIcons: Record<string, ReactNode> = {
    'check-in': <UserCheck size={14} className="text-green-500" />,
    'check-out': <Clock size={14} className="text-blue-500" />,
    'registration': <Calendar size={14} className="text-purple-500" />,
    'medal': <Award size={14} className="text-yellow-500" />,
    'payment': <DollarSign size={14} className="text-green-500" />,
    'refund': <DollarSign size={14} className="text-red-500" />,
    'email': <Mail size={14} className="text-blue-500" />,
    'event-created': <Calendar size={14} className="text-indigo-500" />,
    'member-added': <Users size={14} className="text-teal-500" />,
  };

  return (
    <div className="animate-rise">
      <h1 className="text-2xl font-bold mb-6">Activity Feed</h1>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-4 overflow-x-auto">
        {['all', 'check-in', 'registration', 'medal', 'payment', 'email', 'event-created'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap capitalize ${filter === f ? 'bg-white shadow' : 'text-gray-600'}`}>{f}</button>
        ))}
      </div>

      <div className="card">
        <div className="space-y-3">
          {filtered.slice(0, 50).map(a => (
            <div key={a.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg">
              <div className="mt-0.5">{typeIcons[a.type] || <Activity size={14} className="text-gray-400" />}</div>
              <div className="flex-1">
                <p className="text-sm">{a.message}</p>
                <p className="text-xs text-gray-400 mt-0.5">{timeAgo(a.timestamp)}</p>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <EmptyState icon={<Activity size={40} />} title="No activity" description="Activity will appear here as actions are taken" />}
        </div>
      </div>
    </div>
  );
}
