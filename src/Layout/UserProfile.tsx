import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Gift,
  Package,
  User,
  WalletCards,
} from "lucide-react";
import backendApi from "../api/backendApi";   

type UserData = {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  profileImage?: string;
  walletBalance?: number;
  gender?: string;
  role?: string;
};

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:3000";

const toImageSrc = (value?: string) => {
  if (!value) return "";

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:image")
  ) {
    return value;
  }

  if (value.startsWith("/uploads")) {
    return `${API_ORIGIN}${value}`;
  }

  if (value.startsWith("uploads")) {
    return `${API_ORIGIN}/${value}`;
  }

  return `data:image/jpeg;base64,${value}`;
};

export default function UserProfileLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState<UserData | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const fetchMe = async () => {
    try {
      setLoadingUser(true);

      const res = await backendApi.get("/user/me", {
        skipAuthRefresh: true,
      } as any);

      const data = res.data?.data || null;

      if (!data) {
        navigate("/grocery", { replace: true });
        return;
      }

      setUser(data);
    } catch {
      setUser(null);
      navigate("/grocery", { replace: true });
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const activeKey = useMemo(() => {
    const pathname = location.pathname;

    if (pathname.includes("/grocery/myprofile/deposit")) return "deposit";
    if (pathname.includes("/grocery/myprofile/orders")) return "orders";
    if (pathname.includes("/grocery/myprofile/addresses")) return "addresses";
    if (pathname.includes("/grocery/myprofile/pan-card")) return "pan-card";
    if (pathname.includes("/grocery/myprofile/gift-cards")) return "gift-cards";
    if (pathname.includes("/grocery/myprofile/saved-upi")) return "saved-upi";
    if (pathname.includes("/grocery/myprofile/saved-cards"))
      return "saved-cards";
    if (pathname.includes("/grocery/myprofile/coupons")) return "coupons";
    if (pathname.includes("/grocery/myprofile/reviews")) return "reviews";
    if (pathname.includes("/grocery/myprofile/support")) return "support";

    if (pathname.includes("/grocery/myprofile/notifications")) {
      return "notifications";
    }

    if (pathname.includes("/grocery/myprofile/wishlist")) return "wishlist";

    return "account";
  }, [location.pathname]);

  return (
    <main className="mx-auto grid max-w-[1248px] grid-cols-1 items-start gap-4 px-4 py-4 lg:grid-cols-[310px_minmax(0,1fr)]">
      <ProfileSidebar user={user} loading={loadingUser} activeKey={activeKey} />

      <section className="min-w-0">
        <Outlet
          context={{
            user,
            setUser,
            loadingUser,
            refreshUser: fetchMe,
          }}
        />
      </section>
    </main>
  );
}

function ProfileSidebar({
  user,
  loading,
  activeKey,
}: {
  user: UserData | null;
  loading: boolean;
  activeKey: string;
}) {
  const profileImage = toImageSrc(user?.profileImage);

  const displayName =
    user?.name || user?.email?.split("@")[0] || user?.phone || "User";

  return (
    <aside className="space-y-4 lg:sticky lg:top-[126px] lg:max-h-[calc(100vh-142px)] lg:overflow-y-auto lg:pr-1">
      <div className="flex min-h-[74px] items-center gap-4 bg-white px-4 shadow-sm">
        {loading ? (
          <>
            <div className="h-[50px] w-[50px] animate-pulse rounded-full bg-[#f1f3f6]" />

            <div className="min-w-0 flex-1">
              <div className="h-3 w-12 animate-pulse rounded bg-[#f1f3f6]" />
              <div className="mt-2 h-4 w-32 animate-pulse rounded bg-[#f1f3f6]" />
            </div>
          </>
        ) : (
          <>
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="h-[50px] w-[50px] rounded-full object-cover"
              />
            ) : (
              <div className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-[#ffe500]">
                <User size={28} className="text-[#2874f0]" />
              </div>
            )}

            <div className="min-w-0">
              <p className="text-[13px] text-[#212121]">Hello</p>

              <p className="truncate text-[16px] font-semibold text-[#212121]">
                {displayName}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="bg-white shadow-sm">
        <TopNavLink
          to="/grocery/myprofile/orders"
          icon={<Package size={20} />}
          label="MY ORDERS"
          active={activeKey === "orders"}
        />

        <SectionTitle icon={<User size={20} />} title="ACCOUNT SETTINGS" />

        <SideNavLink
          to="/grocery/myprofile"
          label="Profile Information"
          active={activeKey === "account"}
        />

        <SideNavLink
          to="/grocery/myprofile/addresses"
          label="Manage Addresses"
          active={activeKey === "addresses"}
        />

        <SideNavLink
          to="/grocery/myprofile/pan-card"
          label="PAN Card Information"
          active={activeKey === "pan-card"}
        />

        <SectionTitle icon={<WalletCards size={20} />} title="PAYMENTS" />

        <SideNavLink
          to="/grocery/myprofile/gift-cards"
          label="Gift Cards"
          active={activeKey === "gift-cards"}
          rightText="₹0"
          green
        />

        <SideNavLink
          to="/grocery/myprofile/saved-upi"
          label="Saved UPI"
          active={activeKey === "saved-upi"}
        />

        <SideNavLink
          to="/grocery/myprofile/saved-cards"
          label="Saved Cards"
          active={activeKey === "saved-cards"}
        />

        <SideNavLink
          to="/grocery/myprofile/deposit"
          label="Deposit"
          active={activeKey === "deposit"}
        />

        <SectionTitle icon={<Gift size={20} />} title="MY STUFF" />

        <SideNavLink
          to="/grocery/myprofile/coupons"
          label="My Coupons"
          active={activeKey === "coupons"}
        />

        <SideNavLink
          to="/grocery/myprofile/reviews"
          label="My Reviews & Ratings"
          active={activeKey === "reviews"}
        />

        <SideNavLink
          to="/grocery/myprofile/notifications"
          label="All Notifications"
          active={activeKey === "notifications"}
        />
        <SideNavLink
  to="/grocery/myprofile/support"
  label="Customer Support"
  active={activeKey === "support"}
/>

        <SideNavLink
          to="/grocery/myprofile/wishlist"
          label="My Wishlist"
          active={activeKey === "wishlist"}
        />
        
      </div>
    </aside>
  );
}

function TopNavLink({
  to,
  icon,
  label,
  active,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <NavLink
      to={to}
      className={`flex h-[60px] w-full items-center gap-5 border-b border-[#f0f0f0] px-6 text-left text-[16px] font-semibold transition ${
        active
          ? "bg-[#f5faff] text-[#2874f0]"
          : "text-[#878787] hover:text-[#2874f0]"
      }`}
    >
      <span className="text-[#2874f0]">{icon}</span>
      <span className="flex-1">{label}</span>
      <ChevronRight size={22} />
    </NavLink>
  );
}

function SectionTitle({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex h-[60px] items-center gap-5 border-b border-[#f0f0f0] px-6 text-[16px] font-semibold text-[#878787]">
      <span className="text-[#2874f0]">{icon}</span>
      <span>{title}</span>
    </div>
  );
}

function SideNavLink({
  to,
  label,
  active,
  rightText,
  green = false,
}: {
  to: string;
  label: string;
  active?: boolean;
  rightText?: string;
  green?: boolean;
}) {
  return (
    <NavLink
      to={to}
      className={`flex h-[44px] w-full items-center justify-between px-[66px] text-left text-[14px] transition ${
        active
          ? "bg-[#f5faff] font-semibold text-[#2874f0]"
          : "text-[#212121] hover:bg-[#f5faff] hover:text-[#2874f0]"
      }`}
    >
      <span>{label}</span>

      {rightText && (
        <span className={`font-semibold ${green ? "text-[#26a541]" : ""}`}>
          {rightText}
        </span>
      )}
    </NavLink>
  );
}