const fs = require('fs');
const path = require('path');

const stubs = [
  'src/pages/profile/ProfilePage.jsx',
  'src/pages/profile/EditProfilePage.jsx',
  'src/pages/cats/CatListPage.jsx',
  'src/pages/cats/CatDetailPage.jsx',
  'src/pages/cats/CreateCatPage.jsx',
  'src/pages/cats/EditCatPage.jsx',
  'src/pages/shelters/ShelterListPage.jsx',
  'src/pages/shelters/ShelterDetailPage.jsx',
  'src/pages/shelters/ShelterDashboardPage.jsx',
  'src/pages/shelters/IntakePage.jsx',
  'src/pages/shelters/DischargePage.jsx',
  'src/pages/volunteers/VolunteerListPage.jsx',
  'src/pages/volunteers/VolunteerProfilePage.jsx',
  'src/pages/volunteers/AssignmentsPage.jsx',
  'src/pages/rescue/RescueListPage.jsx',
  'src/pages/rescue/RescueDetailPage.jsx',
  'src/pages/rescue/SubmitRescuePage.jsx',
  'src/pages/lost_found/LostAlertsPage.jsx',
  'src/pages/lost_found/FoundReportsPage.jsx',
  'src/pages/lost_found/CreateLostAlertPage.jsx',
  'src/pages/lost_found/MatchesPage.jsx',
  'src/pages/adoption/CatAdoptionDetailPage.jsx',
  'src/pages/adoption/ApplicationFormPage.jsx',
  'src/pages/adoption/MyApplicationsPage.jsx',
  'src/pages/adoption/AdminApplicationsPage.jsx',
  'src/pages/medical/MedicalHistoryPage.jsx',
  'src/pages/medical/AddMedicalRecordPage.jsx',
  'src/pages/medical/VaccinationsPage.jsx',
  'src/pages/medical/MedicationsPage.jsx',
  'src/pages/wellness/WeightTrackerPage.jsx',
  'src/pages/wellness/AppointmentsPage.jsx',
  'src/pages/wellness/HealthAlertsPage.jsx',
  'src/pages/foster/FosterListPage.jsx',
  'src/pages/foster/FosterPlacementsPage.jsx',
  'src/pages/inventory/InventoryListPage.jsx',
  'src/pages/inventory/InventoryHistoryPage.jsx',
  'src/pages/finance/DonationsPage.jsx',
  'src/pages/finance/CampaignsPage.jsx',
  'src/pages/finance/ExpensesPage.jsx',
  'src/pages/notifications/NotificationsPage.jsx',
  'src/pages/messaging/ConversationsPage.jsx',
  'src/pages/messaging/ChatPage.jsx',
  'src/pages/analytics/DashboardPage.jsx',
  'src/pages/analytics/ReportsPage.jsx',
  'src/pages/maps/MapPage.jsx',
  'src/pages/audit/AuditLogsPage.jsx',
];

let created = 0;
stubs.forEach(function(rel) {
  const full = path.join(process.cwd(), rel);
  const exists = fs.existsSync(full) && fs.statSync(full).size > 50;
  if (!exists) {
    const name = path.basename(rel, '.jsx');
    const lines = [
      'export default function ' + name + '() {',
      '  return (',
      '    <div style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>',
      '      <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-default)", borderRadius: 16, padding: "3rem", textAlign: "center", boxShadow: "var(--shadow-sm)" }}>',
      '        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🚧</div>',
      '        <h2 style={{ color: "var(--text-primary)", margin: "0 0 0.5rem" }}>' + name + '</h2>',
      '        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>This page is being built — check back shortly!</p>',
      '      </div>',
      '    </div>',
      '  );',
      '}',
    ];
    const content = lines.join('\n');
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
    created++;
    console.log('Created:', rel);
  } else {
    console.log('Skip (exists):', rel);
  }
});
console.log('Done! Created ' + created + ' stubs.');
