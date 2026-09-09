import { v4 as uuidv4 } from 'uuid';

// ============ TYPES ============
export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  phone: string;
  title: string;
  role: 'admin' | 'member';
  groups: string[];
  status: 'active' | 'inactive';
  createdAt: string;
  waiverSigned: boolean;
  waiverDate?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  capacity: number;
  fee: number;
  isPublic: boolean;
  isRecurring: boolean;
  recurrenceType?: 'weekly' | 'monthly';
  recurrenceEnd?: string;
  allowedGroups: string[];
  requireWaiver: boolean;
  createdBy: string;
  createdAt: string;
}

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  status: 'registered' | 'cancelled';
  paid: boolean;
  receiptId?: string;
  amount?: number;
  createdAt: string;
}

export interface Attendance {
  id: string;
  userId: string;
  eventId?: string;
  checkIn: string;
  checkOut?: string;
  isWalkIn: boolean;
  notes?: string;
}

export interface Activity {
  id: string;
  type: 'check-in' | 'check-out' | 'registration' | 'medal' | 'payment' | 'refund' | 'email' | 'event-created' | 'member-added';
  userId?: string;
  eventId?: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface MedalTier {
  id: string;
  name: string;
  hours: number;
  icon: string;
  color: string;
}

export interface OrgSettings {
  name: string;
  tagline: string;
  mission: string;
  logo: string;
  theme: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  ein: string;
  dollarPerHour: number;
  paymentsEnabled: boolean;
  payoutLabel: string;
  waiverText: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
  smtpStatus: 'online' | 'offline' | 'unreachable';
}

export interface EmailMessage {
  id: string;
  to: string;
  subject: string;
  body: string;
  status: 'queued' | 'delivered' | 'failed';
  createdAt: string;
}

// ============ DEFAULT DATA ============
const defaultSettings: OrgSettings = {
  name: 'Green Valley Volunteers',
  tagline: 'Building stronger communities, one hour at a time',
  mission: 'We connect passionate volunteers with meaningful opportunities to serve our community. Through collaborative action, we create lasting positive change for families, neighborhoods, and the environment.',
  logo: 'leaf',
  theme: 'emerald',
  contactEmail: 'info@greenvalleyvolunteers.org',
  contactPhone: '(555) 234-5678',
  address: '123 Community Lane, Green Valley, CA 95432',
  ein: '12-3456789',
  dollarPerHour: 29,
  paymentsEnabled: true,
  payoutLabel: 'Green Valley Volunteers',
  waiverText: 'I hereby waive all claims against Green Valley Volunteers and agree to participate in activities at my own risk. I understand the nature of volunteer work and accept full responsibility for my safety and well-being during all activities.',
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPass: '',
  smtpFrom: 'noreply@greenvalleyvolunteers.org',
  smtpStatus: 'offline',
};

const defaultMedalTiers: MedalTier[] = [
  { id: '1', name: 'Bronze', hours: 10, icon: '🥉', color: '#cd7f32' },
  { id: '2', name: 'Silver', hours: 25, icon: '🥈', color: '#c0c0c0' },
  { id: '3', name: 'Gold', hours: 50, icon: '🥇', color: '#ffd700' },
  { id: '4', name: 'Platinum', hours: 100, icon: '💎', color: '#e5e4e2' },
  { id: '5', name: 'Diamond', hours: 200, icon: '👑', color: '#b9f2ff' },
];

const defaultAdmin: User = {
  id: 'admin-001',
  email: 'admin@volunteerhub.org',
  password: 'Admin123!',
  name: 'System Admin',
  phone: '(555) 000-0001',
  title: 'Administrator',
  role: 'admin',
  groups: ['Leadership'],
  status: 'active',
  createdAt: new Date().toISOString(),
  waiverSigned: true,
  waiverDate: new Date().toISOString(),
};

// ============ STORE ============
class Store {
  private listeners: Set<() => void> = new Set();

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  // Settings
  getSettings(): OrgSettings {
    const stored = localStorage.getItem('vh_settings');
    return stored ? JSON.parse(stored) : defaultSettings;
  }

  updateSettings(partial: Partial<OrgSettings>) {
    const current = this.getSettings();
    localStorage.setItem('vh_settings', JSON.stringify({ ...current, ...partial }));
    this.notify();
  }

  // Users
  getUsers(): User[] {
    const stored = localStorage.getItem('vh_users');
    if (!stored) {
      localStorage.setItem('vh_users', JSON.stringify([defaultAdmin]));
      return [defaultAdmin];
    }
    return JSON.parse(stored);
  }

  saveUsers(users: User[]) {
    localStorage.setItem('vh_users', JSON.stringify(users));
    this.notify();
  }

  addUser(user: Partial<User>): User {
    const users = this.getUsers();
    const newUser: User = {
      id: uuidv4(),
      email: user.email || '',
      password: user.password || '',
      name: user.name || '',
      phone: user.phone || '',
      title: user.title || 'Volunteer',
      role: user.role || 'member',
      groups: user.groups || [],
      status: 'active',
      createdAt: new Date().toISOString(),
      waiverSigned: false,
      ...user,
    } as User;
    users.push(newUser);
    this.saveUsers(users);
    this.addActivity({ type: 'member-added', userId: newUser.id, message: `${newUser.name} joined as a volunteer` });
    return newUser;
  }

  updateUser(id: string, partial: Partial<User>) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...partial };
      this.saveUsers(users);
    }
  }

  deleteUser(id: string) {
    const users = this.getUsers();
    const admins = users.filter(u => u.role === 'admin');
    if (admins.length <= 1 && users.find(u => u.id === id)?.role === 'admin') return false;
    this.saveUsers(users.filter(u => u.id !== id));
    // Cascade delete
    this.saveRegistrations(this.getRegistrations().filter(r => r.userId !== id));
    this.saveAttendance(this.getAttendance().filter(a => a.userId !== id));
    return true;
  }

  getUser(id: string): User | undefined {
    return this.getUsers().find(u => u.id === id);
  }

  authenticate(email: string, password: string): User | null {
    const users = this.getUsers();
    return users.find(u => u.email === email && u.password === password && u.status === 'active') || null;
  }

  // Events
  getEvents(): Event[] {
    const stored = localStorage.getItem('vh_events');
    return stored ? JSON.parse(stored) : [];
  }

  saveEvents(events: Event[]) {
    localStorage.setItem('vh_events', JSON.stringify(events));
    this.notify();
  }

  addEvent(event: Partial<Event>): Event {
    const events = this.getEvents();
    const newEvent: Event = {
      id: uuidv4(),
      title: event.title || '',
      description: event.description || '',
      location: event.location || '',
      startTime: event.startTime || '',
      endTime: event.endTime || '',
      capacity: event.capacity || 50,
      fee: event.fee || 0,
      isPublic: event.isPublic !== false,
      isRecurring: event.isRecurring || false,
      recurrenceType: event.recurrenceType,
      recurrenceEnd: event.recurrenceEnd,
      allowedGroups: event.allowedGroups || [],
      requireWaiver: event.requireWaiver || false,
      createdBy: event.createdBy || '',
      createdAt: new Date().toISOString(),
    };
    events.push(newEvent);
    this.saveEvents(events);
    this.addActivity({ type: 'event-created', eventId: newEvent.id, message: `Event "${newEvent.title}" created` });
    return newEvent;
  }

  updateEvent(id: string, partial: Partial<Event>) {
    const events = this.getEvents();
    const idx = events.findIndex(e => e.id === id);
    if (idx >= 0) {
      events[idx] = { ...events[idx], ...partial };
      this.saveEvents(events);
    }
  }

  deleteEvent(id: string) {
    this.saveEvents(this.getEvents().filter(e => e.id !== id));
    this.saveRegistrations(this.getRegistrations().filter(r => r.eventId !== id));
  }

  getEventStatus(event: Event): 'live' | 'upcoming' | 'past' {
    const now = new Date();
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    if (now >= start && now <= end) return 'live';
    if (now < start) return 'upcoming';
    return 'past';
  }

  // Registrations
  getRegistrations(): Registration[] {
    const stored = localStorage.getItem('vh_registrations');
    return stored ? JSON.parse(stored) : [];
  }

  saveRegistrations(regs: Registration[]) {
    localStorage.setItem('vh_registrations', JSON.stringify(regs));
    this.notify();
  }

  registerForEvent(eventId: string, userId: string): Registration {
    const regs = this.getRegistrations();
    const event = this.getEvents().find(e => e.id === eventId);
    const reg: Registration = {
      id: uuidv4(),
      eventId,
      userId,
      status: 'registered',
      paid: false,
      createdAt: new Date().toISOString(),
    };
    if (event && event.fee > 0) {
      reg.paid = true;
      reg.amount = event.fee;
      reg.receiptId = `RCP-${uuidv4().slice(0, 8).toUpperCase()}`;
    }
    regs.push(reg);
    this.saveRegistrations(regs);
    this.addActivity({ type: 'registration', userId, eventId, message: `Registered for "${event?.title}"` });
    return reg;
  }

  cancelRegistration(regId: string) {
    const regs = this.getRegistrations();
    const idx = regs.findIndex(r => r.id === regId);
    if (idx >= 0) {
      regs[idx].status = 'cancelled';
      if (regs[idx].paid && regs[idx].amount) {
        this.addActivity({ type: 'refund', userId: regs[idx].userId, message: `Refund issued: $${regs[idx].amount}` });
      }
      this.saveRegistrations(regs);
    }
  }

  // Attendance
  getAttendance(): Attendance[] {
    const stored = localStorage.getItem('vh_attendance');
    return stored ? JSON.parse(stored) : [];
  }

  saveAttendance(records: Attendance[]) {
    localStorage.setItem('vh_attendance', JSON.stringify(records));
    this.notify();
  }

  checkIn(userId: string, eventId?: string, isWalkIn = false): Attendance {
    const records = this.getAttendance();
    const record: Attendance = {
      id: uuidv4(),
      userId,
      eventId,
      checkIn: new Date().toISOString(),
      isWalkIn,
    };
    records.push(record);
    this.saveAttendance(records);
    this.addActivity({ type: 'check-in', userId, eventId, message: `Checked in${isWalkIn ? ' (walk-in)' : ''}` });
    return record;
  }

  checkOut(recordId: string) {
    const records = this.getAttendance();
    const idx = records.findIndex(r => r.id === recordId);
    if (idx >= 0 && !records[idx].checkOut) {
      records[idx].checkOut = new Date().toISOString();
      this.saveAttendance(records);
      const user = this.getUser(records[idx].userId);
      this.addActivity({ type: 'check-out', userId: records[idx].userId, message: `${user?.name || 'Volunteer'} checked out` });
    }
  }

  updateAttendance(recordId: string, partial: Partial<Attendance>) {
    const records = this.getAttendance();
    const idx = records.findIndex(r => r.id === recordId);
    if (idx >= 0) {
      records[idx] = { ...records[idx], ...partial };
      this.saveAttendance(records);
    }
  }

  getUserHours(userId: string): number {
    return this.getAttendance()
      .filter(a => a.userId === userId && a.checkOut)
      .reduce((sum, a) => {
        const diff = (new Date(a.checkOut!).getTime() - new Date(a.checkIn).getTime()) / 3600000;
        return sum + diff;
      }, 0);
  }

  getOrgTotalHours(): number {
    return this.getAttendance()
      .filter(a => a.checkOut)
      .reduce((sum, a) => {
        const diff = (new Date(a.checkOut!).getTime() - new Date(a.checkIn).getTime()) / 3600000;
        return sum + diff;
      }, 0);
  }

  // Medals
  getMedalTiers(): MedalTier[] {
    const stored = localStorage.getItem('vh_medals');
    return stored ? JSON.parse(stored) : defaultMedalTiers;
  }

  saveMedalTiers(tiers: MedalTier[]) {
    localStorage.setItem('vh_medals', JSON.stringify(tiers));
    this.notify();
  }

  checkMedals(userId: string) {
    const hours = this.getUserHours(userId);
    const tiers = this.getMedalTiers();
    const user = this.getUser(userId);
    if (!user) return;
    tiers.forEach(tier => {
      if (hours >= tier.hours) {
        const key = `medal_${userId}_${tier.id}`;
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, 'true');
          this.addActivity({ type: 'medal', userId, message: `${user.name} earned the ${tier.name} medal! ${tier.icon}` });
        }
      }
    });
  }

  getUserMedals(userId: string): MedalTier[] {
    const hours = this.getUserHours(userId);
    return this.getMedalTiers().filter(t => hours >= t.hours);
  }

  getNextMedal(userId: string): MedalTier | null {
    const hours = this.getUserHours(userId);
    const tiers = this.getMedalTiers();
    return tiers.find(t => hours < t.hours) || null;
  }

  // Activity
  getActivities(): Activity[] {
    const stored = localStorage.getItem('vh_activities');
    return stored ? JSON.parse(stored) : [];
  }

  addActivity(activity: Partial<Activity>) {
    const activities = this.getActivities();
    activities.unshift({
      id: uuidv4(),
      type: activity.type || 'check-in',
      userId: activity.userId,
      eventId: activity.eventId,
      message: activity.message || '',
      timestamp: new Date().toISOString(),
      metadata: activity.metadata,
    });
    if (activities.length > 200) activities.length = 200;
    localStorage.setItem('vh_activities', JSON.stringify(activities));
    this.notify();
  }

  // Emails
  getEmails(): EmailMessage[] {
    const stored = localStorage.getItem('vh_emails');
    return stored ? JSON.parse(stored) : [];
  }

  async addEmail(to: string, subject: string, body: string): Promise<EmailMessage> {
    const emails = this.getEmails();
    const email: EmailMessage = {
      id: uuidv4(),
      to,
      subject,
      body,
      status: 'queued',
      createdAt: new Date().toISOString(),
    };
    emails.unshift(email);
    localStorage.setItem('vh_emails', JSON.stringify(emails));
    this.notify();

    // Import email service dynamically to avoid circular dependency
    const { emailService } = await import('./services/emailService');
    
    // Attempt to send email
    const result = await emailService.sendEmail(to, subject, body);
    
    // Update email status based on result
    const updatedEmails = this.getEmails();
    const emailIndex = updatedEmails.findIndex(e => e.id === email.id);
    if (emailIndex >= 0) {
      updatedEmails[emailIndex].status = result.success ? 'delivered' : 'failed';
      localStorage.setItem('vh_emails', JSON.stringify(updatedEmails));
    }

    const statusMessage = result.success 
      ? `Email sent to ${to}: ${subject}`
      : `Email failed to ${to}: ${result.error || 'Unknown error'}`;
    
    this.addActivity({ 
      type: 'email', 
      message: statusMessage 
    });
    this.notify();
    
    return updatedEmails[emailIndex] || email;
  }

  // Seed data
  seedData() {
    if (localStorage.getItem('vh_seeded')) return;
    
    const users = this.getUsers();
    const sampleUsers: Partial<User>[] = [
      { name: 'Sarah Chen', email: 'sarah@example.com', password: 'Pass123!', phone: '(555) 111-2222', title: 'Trail Lead', groups: ['Trail Leads', 'Mentors'] },
      { name: 'Marcus Johnson', email: 'marcus@example.com', password: 'Pass123!', phone: '(555) 222-3333', title: 'Mentor', groups: ['Mentors'] },
      { name: 'Emily Rodriguez', email: 'emily@example.com', password: 'Pass123!', phone: '(555) 333-4444', title: 'Event Coordinator', groups: ['Leadership'] },
      { name: 'David Kim', email: 'david@example.com', password: 'Pass123!', phone: '(555) 444-5555', title: 'Volunteer', groups: ['Trail Leads'] },
      { name: 'Lisa Park', email: 'lisa@example.com', password: 'Pass123!', phone: '(555) 555-6666', title: 'Mentor', groups: ['Mentors', 'Leadership'] },
    ];

    sampleUsers.forEach(u => this.addUser(u));

    const now = new Date();
    const events: Partial<Event>[] = [
      { title: 'Community Garden Cleanup', description: 'Help us clean and prepare the community garden for spring planting. Tools and gloves provided.', location: 'Riverside Community Garden', startTime: new Date(now.getTime() + 86400000 * 2).toISOString(), endTime: new Date(now.getTime() + 86400000 * 2 + 14400000).toISOString(), capacity: 30, fee: 0, isPublic: true, createdBy: 'admin-001' },
      { title: 'Youth Mentorship Workshop', description: 'Training session for new mentors. Learn techniques for effective youth engagement.', location: 'Community Center Room 204', startTime: new Date(now.getTime() + 86400000 * 5).toISOString(), endTime: new Date(now.getTime() + 86400000 * 5 + 7200000).toISOString(), capacity: 20, fee: 15, isPublic: true, requireWaiver: true, createdBy: 'admin-001' },
      { title: 'Trail Maintenance Day', description: 'Monthly trail maintenance along Green Valley paths. Bring water and sunscreen.', location: 'Green Valley Trailhead', startTime: new Date(now.getTime() - 3600000).toISOString(), endTime: new Date(now.getTime() + 14400000).toISOString(), capacity: 25, fee: 0, isPublic: true, createdBy: 'admin-001' },
      { title: 'Annual Fundraiser Gala', description: 'Our annual fundraising event. Formal attire requested.', location: 'Grand Ballroom, Hotel Green Valley', startTime: new Date(now.getTime() + 86400000 * 14).toISOString(), endTime: new Date(now.getTime() + 86400000 * 14 + 18000000).toISOString(), capacity: 100, fee: 50, isPublic: true, requireWaiver: true, createdBy: 'admin-001' },
      { title: 'Mentor Planning Session', description: 'Private planning session for mentors only.', location: 'Community Center', startTime: new Date(now.getTime() + 86400000 * 3).toISOString(), endTime: new Date(now.getTime() + 86400000 * 3 + 5400000).toISOString(), capacity: 10, fee: 0, isPublic: false, allowedGroups: ['Mentors'], createdBy: 'admin-001' },
    ];

    events.forEach(e => this.addEvent(e));

    // Add some attendance records
    const allUsers = this.getUsers();
    const pastEvents = this.getEvents().filter(e => this.getEventStatus(e) === 'past');
    pastEvents.forEach(event => {
      allUsers.slice(0, 3).forEach(user => {
        this.checkIn(user.id, event.id);
        const records = this.getAttendance();
        const lastRecord = records[records.length - 1];
        if (lastRecord) {
          lastRecord.checkOut = event.endTime;
          this.saveAttendance(records);
        }
        this.registerForEvent(event.id, user.id);
      });
    });

    // Check medals for all users
    allUsers.forEach(u => this.checkMedals(u.id));

    localStorage.setItem('vh_seeded', 'true');
    this.notify();
  }

  // First run check
  isFirstRun(): boolean {
    return !localStorage.getItem('vh_first_visit_done');
  }

  markFirstVisitDone() {
    localStorage.setItem('vh_first_visit_done', 'true');
  }

  // Get current user
  getCurrentUser(): User | null {
    const id = sessionStorage.getItem('vh_current_user');
    if (!id) return null;
    return this.getUser(id) || null;
  }

  setCurrentUser(id: string | null) {
    if (id) sessionStorage.setItem('vh_current_user', id);
    else sessionStorage.removeItem('vh_current_user');
    this.notify();
  }
}

export const store = new Store();

// ============ HELPERS ============
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} ${formatTime(iso)}`;
}

export function getHoursBetween(start: string, end: string): number {
  return (new Date(end).getTime() - new Date(start).getTime()) / 3600000;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
