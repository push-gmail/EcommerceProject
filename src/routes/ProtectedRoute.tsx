import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import backendApi from "../api/backendApi";

type AuthRole = "master" | "merchant" | "user" | "employee";

interface ProtectedRouteProps {
  role: AuthRole;
  redirectTo: string;
}

const getMeEndpointByRole = (role: AuthRole) => {
  const endpoints: Record<AuthRole, string> = {
    master: "/auth/master/me",
    merchant: "/merchant/merchant/me",
    user: "/user/me",
    employee: "/employee/me",
  };

  return endpoints[role];
};

const extractRole = (data: any) => {
  return (
    data?.data?.role ||
    data?.data?.user?.role ||
    data?.data?.merchant?.role ||
    data?.data?.employee?.role ||
    data?.data?.auth?.role ||
    data?.role ||
    data?.user?.role ||
    data?.merchant?.role ||
    data?.employee?.role ||
    data?.auth?.role
  );
};

const isAllowedByRole = (role: AuthRole, data: any) => {
  const responseRole = extractRole(data);

  if (responseRole) {
    return responseRole === role;
  }

  return Boolean(data?.success && data?.data);
};

export default function ProtectedRoute({
  role,
  redirectTo,
}: ProtectedRouteProps) {
  const location = useLocation();

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        setChecking(true);

        const endpoint = getMeEndpointByRole(role);

        const res = await backendApi.get(endpoint, {
          withCredentials: true,
        });

        if (isMounted) {
          setAllowed(isAllowedByRole(role, res.data));
        }
      } catch (error: any) {
        console.log(
          `${role} auth check failed:`,
          error?.response?.data || error?.message
        );

        if (isMounted) {
          setAllowed(false);
        }
      } finally {
        if (isMounted) {
          setChecking(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [role]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        Checking session...
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return <Outlet />;
}