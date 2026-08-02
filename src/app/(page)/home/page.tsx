import WelcomeBanner from "./includes/welcome-banner";
import AdminNotifications from "./includes/admin-notifications";
import QuickActions from "./includes/quick-actions";
import ManagementModules from "./includes/management-modules";
import StudentExperience from "./includes/student-experience";

export default function Page() {
  return (
    <div className="flex flex-col gap-11">
      <WelcomeBanner />
      <AdminNotifications />
      <QuickActions />
      <ManagementModules />
      <StudentExperience />
    </div>
  );
}
