import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_ORIGIN || "http://localhost:3000/api";

const backendApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

type AuthRole = "master" | "merchant" | "user" | "employee";

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
};

let isRefreshingMaster = false;
let isRefreshingMerchant = false;
let isRefreshingUser = false;
let isRefreshingEmployee = false;

let masterQueue: Array<{
  resolve: () => void;
  reject: (error: any) => void;
}> = [];

let merchantQueue: Array<{
  resolve: () => void;
  reject: (error: any) => void;
}> = [];

let userQueue: Array<{
  resolve: () => void;
  reject: (error: any) => void;
}> = [];

let employeeQueue: Array<{
  resolve: () => void;
  reject: (error: any) => void;
}> = [];

const PUBLIC_API_URLS = [
  "/user/shop-categories",
  "/user/shop-products",
  "/user/check-login-identifier",
  "/user/request-login-otp",
  "/user/verify-login-otp",
  "/user/signup",
  "/user/location/pincode",

  "/merchant/merchant-login",
  "/merchant/merchant/logout-public",

  "/employee/login",
  "/employee/logout-public",
];

const isPublicApiUrl = (url?: string) => {
  if (!url) return false;

  return PUBLIC_API_URLS.some((publicUrl) => {
    return (
      url === publicUrl ||
      url.startsWith(`${publicUrl}/`) ||
      url.startsWith(`${publicUrl}?`) ||
      url.includes(`${publicUrl}?`)
    );
  });
};

const processMasterQueue = (error: any = null) => {
  masterQueue.forEach((promise) => {
    if (error) promise.reject(error);
    else promise.resolve();
  });

  masterQueue = [];
};

const processMerchantQueue = (error: any = null) => {
  merchantQueue.forEach((promise) => {
    if (error) promise.reject(error);
    else promise.resolve();
  });

  merchantQueue = [];
};

const processUserQueue = (error: any = null) => {
  userQueue.forEach((promise) => {
    if (error) promise.reject(error);
    else promise.resolve();
  });

  userQueue = [];
};

const processEmployeeQueue = (error: any = null) => {
  employeeQueue.forEach((promise) => {
    if (error) promise.reject(error);
    else promise.resolve();
  });

  employeeQueue = [];
};

const getAuthRoleFromUrl = (url?: string): AuthRole | null => {
  if (!url) return null;

  if (isPublicApiUrl(url)) return null;

  if (url.includes("/auth/master")) return "master";
  if (url.startsWith("/master/") || url.includes("/master/")) return "master";

  if (url.startsWith("/merchant/") || url.includes("/merchant/")) {
    return "merchant";
  }

  if (url.startsWith("/employee/") || url.includes("/employee/")) {
    return "employee";
  }

  if (
    url.startsWith("/user/me") ||
    url.startsWith("/user/logout") ||
    url.startsWith("/user/refresh") ||
    url.startsWith("/user/dashboard") ||
    url.startsWith("/user/deposit") ||
    url.startsWith("/user/my-account") ||
    url.startsWith("/user/orders") ||
    url.startsWith("/user/wishlist") ||
    url.startsWith("/user/profile") ||
    url.startsWith("/user/cart") ||
    url.startsWith("/user/addresses") ||
    url.startsWith("/user/support")
  ) {
    return "user";
  }

  return null;
};

const getRefreshUrlByRole = (role: AuthRole) => {
  const urls: Record<AuthRole, string> = {
    master: "/auth/master/refresh",
    merchant: "/merchant/merchant/refresh",
    user: "/user/refresh",
    employee: "/employee/refresh",
  };

  return urls[role];
};

const getLoginUrlByRole = (role: AuthRole) => {
  const urls: Record<AuthRole, string> = {
    master: "/master/login",
    merchant: "/merchant/login",
    user: "/grocery",
    employee: "/employee/login",
  };

  return urls[role];
};

const shouldSkipRefresh = (originalRequest?: RetryConfig) => {
  const url = originalRequest?.url || "";

  if (!originalRequest) return true;
  if (originalRequest.skipAuthRefresh) return true;
  if (isPublicApiUrl(url)) return true;
  if (url.includes("/login")) return true;
  if (url.includes("/signup")) return true;
  if (url.includes("/refresh")) return true;

  return false;
};

backendApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;

    if (shouldSkipRefresh(originalRequest)) {
      return Promise.reject(error);
    }

    const role = getAuthRoleFromUrl(originalRequest?.url);

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      role
    ) {
      originalRequest._retry = true;

      if (role === "master") {
        if (isRefreshingMaster) {
          return new Promise((resolve, reject) => {
            masterQueue.push({
              resolve: () => resolve(backendApi(originalRequest)),
              reject,
            });
          });
        }

        isRefreshingMaster = true;

        try {
          await backendApi.post(getRefreshUrlByRole(role), undefined, {
            skipAuthRefresh: true,
            withCredentials: true,
          } as any);

          processMasterQueue();
          return backendApi(originalRequest);
        } catch (refreshError) {
          processMasterQueue(refreshError);
          window.location.href = getLoginUrlByRole(role);
          return Promise.reject(refreshError);
        } finally {
          isRefreshingMaster = false;
        }
      }

      if (role === "merchant") {
        if (isRefreshingMerchant) {
          return new Promise((resolve, reject) => {
            merchantQueue.push({
              resolve: () => resolve(backendApi(originalRequest)),
              reject,
            });
          });
        }

        isRefreshingMerchant = true;

        try {
          await backendApi.post(getRefreshUrlByRole(role), undefined, {
            skipAuthRefresh: true,
            withCredentials: true,
          } as any);

          processMerchantQueue();
          return backendApi(originalRequest);
        } catch (refreshError) {
          processMerchantQueue(refreshError);
          window.location.href = getLoginUrlByRole(role);
          return Promise.reject(refreshError);
        } finally {
          isRefreshingMerchant = false;
        }
      }

      if (role === "user") {
        if (isRefreshingUser) {
          return new Promise((resolve, reject) => {
            userQueue.push({
              resolve: () => resolve(backendApi(originalRequest)),
              reject,
            });
          });
        }

        isRefreshingUser = true;

        try {
          await backendApi.post(getRefreshUrlByRole(role), undefined, {
            skipAuthRefresh: true,
            withCredentials: true,
          } as any);

          processUserQueue();
          return backendApi(originalRequest);
        } catch (refreshError) {
          processUserQueue(refreshError);
          window.location.href = getLoginUrlByRole(role);
          return Promise.reject(refreshError);
        } finally {
          isRefreshingUser = false;
        }
      }

      if (role === "employee") {
        if (isRefreshingEmployee) {
          return new Promise((resolve, reject) => {
            employeeQueue.push({
              resolve: () => resolve(backendApi(originalRequest)),
              reject,
            });
          });
        }

        isRefreshingEmployee = true;

        try {
          await backendApi.post(getRefreshUrlByRole(role), undefined, {
            skipAuthRefresh: true,
            withCredentials: true,
          } as any);

          processEmployeeQueue();
          return backendApi(originalRequest);
        } catch (refreshError) {
          processEmployeeQueue(refreshError);
          window.location.href = getLoginUrlByRole(role);
          return Promise.reject(refreshError);
        } finally {
          isRefreshingEmployee = false;
        }
      }
    }

    return Promise.reject(error);
  }
);

export default backendApi;