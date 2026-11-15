// The old Recruiter Dashboard URL now opens the Overview (recruiter admin 4.2).
import { Navigate } from "react-router-dom";
import { PATHS } from "@/routes/paths";

const RecruitersDashboardRedirect = () => (
  <Navigate to={PATHS.ADMIN.RECRUITERS_ADMIN.OVERVIEW} replace />
);

export default RecruitersDashboardRedirect;
