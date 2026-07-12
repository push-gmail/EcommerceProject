import { Navigate, Route } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";





import EmployeeLogin from "../pages/Employee/EmployeeLogin";
import EmployeeLayout from "../Layout/EmployeeLayout";
import EmployeeDashboard from "../pages/Employee/EmployeeDashboard";
import EmployeeSupportTickets from "../pages/Employee/EmployeeSupportTickets";
import EmployeeSupportChat from "../pages/Employee/EmployeeSupportChat";

export default function EmployeeRoutes() {
  return (
    <>
      <Route path="/employee/login" element={<EmployeeLogin />} />

      <Route
        element={
          <ProtectedRoute role="employee" redirectTo="/employee/login" />
        }
      >
        <Route path="/employee" element={<EmployeeLayout />}>
          <Route index element={<Navigate to="/employee/dashboard" replace />} />
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="support" element={<EmployeeSupportTickets />} />
          <Route path="support/:ticketId/chat" element={<EmployeeSupportChat />} />
        </Route>
      </Route>
    </>
  );
}