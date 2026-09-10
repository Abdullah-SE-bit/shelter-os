import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import { useAuth } from './context/AuthContext';

// Auth
import LoginPage           from './pages/auth/LoginPage';
import RegisterPage        from './pages/auth/RegisterPage';
import ForgotPasswordPage  from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage   from './pages/auth/ResetPasswordPage';
import VerifyEmailPage     from './pages/auth/VerifyEmailPage';

// Legal
import TermsPage           from './pages/legal/TermsPage';

// Profile
import ProfilePage         from './pages/profile/ProfilePage';
import EditProfilePage     from './pages/profile/EditProfilePage';

// Cats
import CatListPage         from './pages/cats/CatListPage';
import CatDetailPage       from './pages/cats/CatDetailPage';
import CreateCatPage       from './pages/cats/CreateCatPage';
import EditCatPage         from './pages/cats/EditCatPage';
import RegisterCatPage     from './pages/cats/RegisterCatPage';

// Shelters
import ShelterListPage     from './pages/shelters/ShelterListPage';
import ShelterDetailPage   from './pages/shelters/ShelterDetailPage';
import CreateShelterPage   from './pages/shelters/CreateShelterPage';
import ShelterDashboardPage from './pages/shelters/ShelterDashboardPage';
import IntakePage          from './pages/shelters/IntakePage';
import DischargePage       from './pages/shelters/DischargePage';

// Volunteers
import VolunteerListPage   from './pages/volunteers/VolunteerListPage';
import VolunteerProfilePage from './pages/volunteers/VolunteerProfilePage';
import AssignmentsPage     from './pages/volunteers/AssignmentsPage';

// Rescue
import RescueListPage      from './pages/rescue/RescueListPage';
import RescueDetailPage    from './pages/rescue/RescueDetailPage';
import SubmitRescuePage    from './pages/rescue/SubmitRescuePage';

// Lost & Found
import LostAlertsPage      from './pages/lost_found/LostAlertsPage';
import LostAlertDetailPage from './pages/lost_found/LostAlertDetailPage';
import FoundReportsPage    from './pages/lost_found/FoundReportsPage';
import FoundReportDetailPage from './pages/lost_found/FoundReportDetailPage';
import CreateLostAlertPage from './pages/lost_found/CreateLostAlertPage';
import MatchesPage         from './pages/lost_found/MatchesPage';

// Adoption
import BrowsePage              from './pages/adoption/BrowsePage';
import CatAdoptionDetailPage   from './pages/adoption/CatAdoptionDetailPage';
import ApplicationFormPage     from './pages/adoption/ApplicationFormPage';
import MyApplicationsPage      from './pages/adoption/MyApplicationsPage';
import AdminApplicationsPage   from './pages/adoption/AdminApplicationsPage';

// Messaging & Notifications
import MessagingPage       from './pages/messaging/MessagingPage';
import NotificationsPage   from './pages/notifications/NotificationsPage';

// Medical
import MedicalHistoryPage    from './pages/medical/MedicalHistoryPage';
import AddMedicalRecordPage  from './pages/medical/AddMedicalRecordPage';
import VaccinationsPage      from './pages/medical/VaccinationsPage';
import MedicationsPage       from './pages/medical/MedicationsPage';

// Wellness
import WeightTrackerPage   from './pages/wellness/WeightTrackerPage';
import AppointmentsPage    from './pages/wellness/AppointmentsPage';
import HealthAlertsPage    from './pages/wellness/HealthAlertsPage';

// Foster
import FosterListPage      from './pages/foster/FosterListPage';
import FosterPlacementsPage from './pages/foster/FosterPlacementsPage';

// Inventory
import InventoryListPage   from './pages/inventory/InventoryListPage';
import InventoryHistoryPage from './pages/inventory/InventoryHistoryPage';

// Finance
import DonationsPage       from './pages/finance/DonationsPage';
import CampaignsPage       from './pages/finance/CampaignsPage';
import ExpensesPage        from './pages/finance/ExpensesPage';

// Analytics
import DashboardPage       from './pages/analytics/DashboardPage';
import ReportsPage         from './pages/analytics/ReportsPage';

// Maps & Audit
import MapPage             from './pages/maps/MapPage';
import AuditLogsPage       from './pages/audit/AuditLogsPage';

// Admin
import AdminUsersPage      from './pages/admin/AdminUsersPage';
import VetApprovalsPage    from './pages/admin/VetApprovalsPage';

const ADMIN    = ['SUPER_ADMIN'];
const SHELTER  = ['SUPER_ADMIN', 'SHELTER_ADMIN'];
const MEDICAL  = ['SUPER_ADMIN', 'SHELTER_ADMIN', 'VET'];
const ALL_AUTH = ['SUPER_ADMIN','SHELTER_ADMIN','VET','VOLUNTEER','CAT_OWNER','ADOPTER'];
// Cats list + medical browse aren't for vets — they reach patients via appointments.
const CATS_VIEW = ['SUPER_ADMIN','SHELTER_ADMIN','VOLUNTEER','CAT_OWNER','ADOPTER'];

// Layout wrapper that shows sidebar for logged-in users
function AppLayout({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  // Full-screen pages (no sidebar/nav)
  const fullScreenPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/terms'];
  const isFullScreen = fullScreenPaths.some(p => location.pathname.startsWith(p));

  if (isFullScreen) {
    return <>{children}</>;
  }

  // Public pages: navbar only (no sidebar)
  const publicPaths = ['/adoption', '/shelters', '/lost-found', '/campaigns'];
  const isPublicPage = !user && publicPaths.some(p => location.pathname.startsWith(p));

  // Full-height "workspace" screens manage their own scroll — no footer.
  const noFooterPaths = ['/messages'];
  const hideFooter = noFooterPaths.some(p => location.pathname.startsWith(p));

  if (isPublicPage || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1 }}>{children}</main>
        {!hideFooter && <Footer />}
      </div>
    );
  }

  // Logged-in: sidebar + content
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <div className="hide-mobile">
          <Sidebar />
        </div>
        <main style={{ flex: 1, minWidth: 0, background: 'var(--cat-cream)' }}>
          {children}
        </main>
      </div>
      {!hideFooter && <Footer />}
    </div>
  );
}

function AppRoutes() {
  return (
    <AppLayout>
      <Routes>
        {/* Public */}
        <Route path="/login"           element={<LoginPage />} />
        <Route path="/register"        element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />
        <Route path="/verify-email"    element={<VerifyEmailPage />} />
        <Route path="/terms"           element={<TermsPage />} />
        <Route path="/adoption"        element={<BrowsePage />} />
        <Route path="/adoption/:catId" element={<CatAdoptionDetailPage />} />
        <Route path="/shelters"        element={<ShelterListPage />} />
        <Route path="/lost-found"      element={<LostAlertsPage />} />
        <Route path="/campaigns"       element={<CampaignsPage />} />

        {/* Auth required */}
        <Route path="/profile"       element={<ProtectedRoute roles={ALL_AUTH}><ProfilePage /></ProtectedRoute>} />
        <Route path="/profile/edit"  element={<ProtectedRoute roles={ALL_AUTH}><EditProfilePage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute roles={ALL_AUTH}><NotificationsPage /></ProtectedRoute>} />
        <Route path="/messages"      element={<ProtectedRoute roles={ALL_AUTH}><MessagingPage /></ProtectedRoute>} />
        <Route path="/cats"          element={<ProtectedRoute roles={CATS_VIEW}><CatListPage /></ProtectedRoute>} />
        <Route path="/cats/register" element={<ProtectedRoute roles={ALL_AUTH}><RegisterCatPage /></ProtectedRoute>} />
        <Route path="/cats/:id"      element={<ProtectedRoute roles={ALL_AUTH}><CatDetailPage /></ProtectedRoute>} />

        {/* Rescue */}
        <Route path="/rescue"        element={<ProtectedRoute roles={ALL_AUTH}><RescueListPage /></ProtectedRoute>} />
        <Route path="/rescue/submit" element={<ProtectedRoute roles={ALL_AUTH}><SubmitRescuePage /></ProtectedRoute>} />
        <Route path="/rescue/:id"    element={<ProtectedRoute roles={ALL_AUTH}><RescueDetailPage /></ProtectedRoute>} />

        {/* Lost & Found */}
        <Route path="/lost-found/create"           element={<ProtectedRoute roles={ALL_AUTH}><CreateLostAlertPage /></ProtectedRoute>} />
        <Route path="/lost-found/found"            element={<ProtectedRoute roles={ALL_AUTH}><FoundReportsPage /></ProtectedRoute>} />
        <Route path="/lost-found/found/:foundId"   element={<ProtectedRoute roles={ALL_AUTH}><FoundReportDetailPage /></ProtectedRoute>} />
        <Route path="/lost-found/lost/:alertId"    element={<ProtectedRoute roles={ALL_AUTH}><LostAlertDetailPage /></ProtectedRoute>} />
        <Route path="/lost-found/matches/:alertId" element={<ProtectedRoute roles={ALL_AUTH}><MatchesPage /></ProtectedRoute>} />

        {/* Adopter */}
        <Route path="/adoption/apply/:catId"     element={<ProtectedRoute roles={['ADOPTER',...ADMIN]}><ApplicationFormPage /></ProtectedRoute>} />
        <Route path="/adoption/my-applications"  element={<ProtectedRoute roles={['ADOPTER',...ADMIN]}><MyApplicationsPage /></ProtectedRoute>} />

        {/* Super Admin - Create Shelter */}
        <Route path="/shelters/create"      element={<ProtectedRoute roles={ADMIN}><CreateShelterPage /></ProtectedRoute>} />

        {/* Shelter Admin */}
        <Route path="/shelter/dashboard"    element={<ProtectedRoute roles={SHELTER}><ShelterDashboardPage /></ProtectedRoute>} />
        <Route path="/shelter/:id"          element={<ProtectedRoute roles={ALL_AUTH}><ShelterDetailPage /></ProtectedRoute>} />
        <Route path="/shelter/intake"       element={<ProtectedRoute roles={SHELTER}><IntakePage /></ProtectedRoute>} />
        <Route path="/shelter/discharge"    element={<ProtectedRoute roles={SHELTER}><DischargePage /></ProtectedRoute>} />
        <Route path="/shelter/applications" element={<ProtectedRoute roles={SHELTER}><AdminApplicationsPage /></ProtectedRoute>} />
        <Route path="/cats/create"          element={<ProtectedRoute roles={[...MEDICAL, 'VOLUNTEER']}><CreateCatPage /></ProtectedRoute>} />
        <Route path="/cats/:id/edit"        element={<ProtectedRoute roles={MEDICAL}><EditCatPage /></ProtectedRoute>} />
        <Route path="/volunteers"           element={<ProtectedRoute roles={SHELTER}><VolunteerListPage /></ProtectedRoute>} />
        <Route path="/volunteers/:id"       element={<ProtectedRoute roles={SHELTER}><VolunteerProfilePage /></ProtectedRoute>} />
        <Route path="/foster"              element={<ProtectedRoute roles={SHELTER}><FosterListPage /></ProtectedRoute>} />
        <Route path="/foster/placements"   element={<ProtectedRoute roles={SHELTER}><FosterPlacementsPage /></ProtectedRoute>} />
        <Route path="/inventory"           element={<ProtectedRoute roles={SHELTER}><InventoryListPage /></ProtectedRoute>} />
        <Route path="/inventory/:id/history" element={<ProtectedRoute roles={SHELTER}><InventoryHistoryPage /></ProtectedRoute>} />
        <Route path="/finance/donations"        element={<ProtectedRoute roles={SHELTER}><DonationsPage /></ProtectedRoute>} />
        <Route path="/finance/donations/record" element={<ProtectedRoute roles={SHELTER}><DonationsPage recordMode /></ProtectedRoute>} />
        <Route path="/finance/expenses"    element={<ProtectedRoute roles={SHELTER}><ExpensesPage /></ProtectedRoute>} />
        <Route path="/reports"             element={<ProtectedRoute roles={SHELTER}><ReportsPage /></ProtectedRoute>} />

        {/* Volunteer */}
        <Route path="/volunteers/profile"     element={<ProtectedRoute roles={['VOLUNTEER',...ADMIN]}><VolunteerProfilePage /></ProtectedRoute>} />
        <Route path="/volunteers/assignments" element={<ProtectedRoute roles={['VOLUNTEER',...ADMIN]}><AssignmentsPage /></ProtectedRoute>} />

        {/* Medical */}
        <Route path="/medical"               element={<ProtectedRoute roles={SHELTER}><CatListPage /></ProtectedRoute>} />
        <Route path="/cats/:id/medical"      element={<ProtectedRoute roles={MEDICAL}><MedicalHistoryPage /></ProtectedRoute>} />
        <Route path="/cats/:id/medical/add"  element={<ProtectedRoute roles={MEDICAL}><AddMedicalRecordPage /></ProtectedRoute>} />
        <Route path="/cats/:id/vaccinations" element={<ProtectedRoute roles={MEDICAL}><VaccinationsPage /></ProtectedRoute>} />
        <Route path="/cats/:id/medications"  element={<ProtectedRoute roles={MEDICAL}><MedicationsPage /></ProtectedRoute>} />
        <Route path="/cats/:id/weight"       element={<ProtectedRoute roles={ALL_AUTH}><WeightTrackerPage /></ProtectedRoute>} />
        <Route path="/appointments"          element={<ProtectedRoute roles={ALL_AUTH}><AppointmentsPage /></ProtectedRoute>} />
        <Route path="/health-alerts"         element={<ProtectedRoute roles={ALL_AUTH}><HealthAlertsPage /></ProtectedRoute>} />

        {/* Analytics */}
        <Route path="/dashboard" element={<ProtectedRoute roles={SHELTER}><DashboardPage /></ProtectedRoute>} />

        {/* Maps */}
        <Route path="/maps" element={<ProtectedRoute roles={ALL_AUTH}><MapPage /></ProtectedRoute>} />

        {/* Audit */}
        <Route path="/audit" element={<ProtectedRoute roles={ADMIN}><AuditLogsPage /></ProtectedRoute>} />

        {/* Admin users (B1/B2) */}
        <Route path="/admin/users" element={<ProtectedRoute roles={ADMIN}><AdminUsersPage /></ProtectedRoute>} />
        <Route path="/admin/vet-approvals" element={<ProtectedRoute roles={SHELTER}><VetApprovalsPage /></ProtectedRoute>} />

        <Route path="/"  element={<Navigate to="/adoption" replace />} />
        <Route path="*"  element={<Navigate to="/adoption" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
