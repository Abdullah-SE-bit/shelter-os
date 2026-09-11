import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Building2,
  CirclePlus,
  HeartHandshake,
  Siren,
  Search,
  Gift,
  Map,
  Bell,
  MessageSquare,
  ScrollText,
  LogIn,
  LogOut,
  PawPrint,
  CalendarClock,
  Heart,
  Package,
  Wallet,
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  UserCircle,
  AlertTriangle,
} from 'lucide-react';

/**
 * Single source of truth for role-aware navigation. Drives the Sidebar,
 * the QuickActionsMenu, and (later) breadcrumb labels. Routes/roles here
 * mirror the guards already declared in App.jsx — this file only changes
 * how they're presented, not who can reach them (ProtectedRoute still
 * enforces access independently).
 */
export const navConfig = {
  SUPER_ADMIN: [
    {
      section: 'Overview',
      items: [{ icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' }],
    },
    {
      section: 'Platform',
      items: [
        { icon: Users, label: 'Users', path: '/admin/users' },
        { icon: Stethoscope, label: 'Vet Approvals', path: '/admin/vet-approvals' },
        { icon: ScrollText, label: 'Audit Log', path: '/audit' },
      ],
    },
    {
      section: 'Animals',
      items: [{ icon: PawPrint, label: 'Pets', path: '/pets' }],
    },
    {
      section: 'Shelters',
      items: [
        { icon: Building2, label: 'Shelters', path: '/shelters' },
        { icon: CirclePlus, label: 'Create Shelter', path: '/shelters/create' },
        { icon: Map, label: 'Shelter Map', path: '/maps' },
      ],
    },
    {
      section: 'Community',
      items: [
        { icon: HeartHandshake, label: 'Employees', path: '/employees' },
        { icon: Siren, label: 'Rescues', path: '/rescue' },
        { icon: Search, label: 'Lost & Found', path: '/lost-found' },
      ],
    },
    {
      section: 'Finance',
      items: [
        { icon: Gift, label: 'Donations & Finance', path: '/finance/donations' },
        { icon: CirclePlus, label: 'Record Donation', path: '/finance/donations/record' },
      ],
    },
    {
      section: 'Comms',
      items: [
        { icon: Bell, label: 'Notifications', path: '/notifications' },
        { icon: MessageSquare, label: 'Messages', path: '/messages' },
      ],
    },
  ],

  SHELTER_ADMIN: [
    {
      section: 'Overview',
      items: [{ icon: LayoutDashboard, label: 'Dashboard', path: '/shelter/dashboard' }],
    },
    {
      section: 'Animals',
      items: [
        { icon: PawPrint, label: 'Pets', path: '/pets' },
        { icon: LogIn, label: 'Intake', path: '/shelter/intake' },
        { icon: LogOut, label: 'Discharge', path: '/shelter/discharge' },
      ],
    },
    {
      section: 'People',
      items: [
        { icon: HeartHandshake, label: 'Employees', path: '/employees' },
        { icon: PawPrint, label: 'Foster', path: '/foster' },
        { icon: Stethoscope, label: 'Vet Approvals', path: '/admin/vet-approvals' },
      ],
    },
    {
      section: 'Care',
      items: [
        { icon: CalendarClock, label: 'Appointments', path: '/appointments' },
        { icon: Heart, label: 'Adoption Applications', path: '/shelter/applications' },
        { icon: Siren, label: 'Rescues', path: '/rescue' },
      ],
    },
    {
      section: 'Operations',
      items: [
        { icon: Package, label: 'Inventory', path: '/inventory' },
        { icon: Wallet, label: 'Donations & Finance', path: '/finance/donations' },
        { icon: CirclePlus, label: 'Record Donation', path: '/finance/donations/record' },
        { icon: BarChart3, label: 'Reports', path: '/reports' },
      ],
    },
    {
      section: 'Comms',
      items: [
        { icon: Map, label: 'Map', path: '/maps' },
        { icon: Bell, label: 'Notifications', path: '/notifications' },
        { icon: MessageSquare, label: 'Messages', path: '/messages' },
      ],
    },
  ],

  VET: [
    { icon: UserCircle, label: 'Profile', path: '/profile' },
    { icon: CalendarClock, label: 'Appointments', path: '/appointments' },
    { icon: AlertTriangle, label: 'Health Alerts', path: '/health-alerts' },
    { icon: Map, label: 'Map', path: '/maps' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: MessageSquare, label: 'Messages', path: '/messages' },
  ],

  EMPLOYEE: [
    { icon: ClipboardCheck, label: 'Assignments', path: '/employees/assignments' },
    { icon: UserCircle, label: 'Profile', path: '/profile' },
    { icon: PawPrint, label: 'Pets', path: '/pets' },
    { icon: CirclePlus, label: 'Register My Pet', path: '/pets/register' },
    { icon: Building2, label: 'Add Shelter Pet', path: '/pets/create' },
    { icon: CalendarClock, label: 'Appointments', path: '/appointments' },
    { icon: Siren, label: 'Rescues', path: '/rescue' },
    { icon: Map, label: 'Map', path: '/maps' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: MessageSquare, label: 'Messages', path: '/messages' },
  ],

  PET_OWNER: [
    { icon: PawPrint, label: 'My Pets', path: '/pets' },
    { icon: CirclePlus, label: 'Register Pet', path: '/pets/register' },
    { icon: CalendarClock, label: 'Appointments', path: '/appointments' },
    { icon: Search, label: 'Lost & Found', path: '/lost-found' },
    { icon: Map, label: 'Map', path: '/maps' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: MessageSquare, label: 'Messages', path: '/messages' },
    { icon: UserCircle, label: 'Profile', path: '/profile' },
  ],

  ADOPTER: [
    { icon: Heart, label: 'Browse Pets', path: '/adoption' },
    { icon: ClipboardList, label: 'My Applications', path: '/adoption/my-applications' },
    { icon: PawPrint, label: 'My Pets', path: '/pets' },
    { icon: CirclePlus, label: 'Register Pet', path: '/pets/register' },
    { icon: CalendarClock, label: 'Appointments', path: '/appointments' },
    { icon: Search, label: 'Lost & Found', path: '/lost-found' },
    { icon: Map, label: 'Map', path: '/maps' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: MessageSquare, label: 'Messages', path: '/messages' },
    { icon: UserCircle, label: 'Profile', path: '/profile' },
  ],
};

/** Normalizes either a flat item list or a sectioned list into sections. */
export function getNavSections(role) {
  const entries = navConfig[role] || [];
  if (entries.length && entries[0].section) return entries;
  return [{ section: null, items: entries }];
}

export const quickActions = [
  { label: 'Create Shelter', path: '/shelters/create', roles: ['SUPER_ADMIN'] },
  { label: 'Record Donation', path: '/finance/donations/record', roles: ['SHELTER_ADMIN', 'SUPER_ADMIN'] },
  { label: 'New Intake', path: '/shelter/intake', roles: ['SHELTER_ADMIN'] },
  { label: 'New Discharge', path: '/shelter/discharge', roles: ['SHELTER_ADMIN'] },
  { label: 'Add Shelter Pet', path: '/pets/create', roles: ['SHELTER_ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'] },
  {
    label: 'Register My Pet',
    path: '/pets/register',
    roles: ['SUPER_ADMIN', 'SHELTER_ADMIN', 'VET', 'EMPLOYEE', 'PET_OWNER', 'ADOPTER'],
  },
  {
    label: 'Submit Rescue Report',
    path: '/rescue/submit',
    roles: ['SUPER_ADMIN', 'SHELTER_ADMIN', 'VET', 'EMPLOYEE', 'PET_OWNER', 'ADOPTER'],
  },
  {
    label: 'Report Lost Pet',
    path: '/lost-found/create',
    roles: ['SUPER_ADMIN', 'SHELTER_ADMIN', 'VET', 'EMPLOYEE', 'PET_OWNER', 'ADOPTER'],
  },
  { label: 'Send Message', path: '/messages', roles: ['SUPER_ADMIN', 'SHELTER_ADMIN', 'VET', 'EMPLOYEE', 'PET_OWNER', 'ADOPTER'] },
];
