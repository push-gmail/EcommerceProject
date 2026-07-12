import {

  ChevronRight,
  
  Gift,
  
  Package,
  
  User,
  WalletCards,
} from "lucide-react";

type UserData = {
  name?: string;
  email?: string;
  phone?: string;
  profileImage?: string;
};

type Props = {
  user: UserData | null;
  active?: string;
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

export default function UserAccountSidebar({
  user,
  active = "profile",
}: Props) {
  const profileImage = toImageSrc(user?.profileImage);

  return (
    <aside className="space-y-4">
      <div className="flex min-h-[74px] items-center gap-4 bg-white px-4 shadow-sm">
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
            {user?.name || user?.email?.split("@")[0] || "User"}
          </p>
        </div>
      </div>

      <div className="bg-white shadow-sm">
        <TopLink icon={<Package size={20} />} label="MY ORDERS" />

        <SectionTitle icon={<User size={20} />} title="ACCOUNT SETTINGS" />

        <SideLink
          label="Profile Information"
          active={active === "profile"}
        />
        <SideLink label="Manage Addresses" />
        <SideLink label="PAN Card Information" />

        <SectionTitle icon={<WalletCards size={20} />} title="PAYMENTS" />

        <SideLink label="Gift Cards" rightText="₹0" green />
        <SideLink label="Saved UPI" />
        <SideLink label="Saved Cards" />

        <SectionTitle icon={<Gift size={20} />} title="MY STUFF" />

        <SideLink label="My Coupons" />
        <SideLink label="My Reviews & Ratings" />
        <SideLink label="All Notifications" />
        <SideLink label="My Wishlist" />
      </div>
    </aside>
  );
}

function TopLink({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="flex h-[60px] w-full items-center gap-5 border-b border-[#f0f0f0] px-6 text-left text-[16px] font-semibold text-[#878787] hover:text-[#2874f0]"
    >
      <span className="text-[#2874f0]">{icon}</span>
      <span className="flex-1">{label}</span>
      <ChevronRight size={22} />
    </button>
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

function SideLink({
  label,
  active = false,
  rightText,
  green = false,
}: {
  label: string;
  active?: boolean;
  rightText?: string;
  green?: boolean;
}) {
  return (
    <button
      type="button"
      className={`flex h-[44px] w-full items-center justify-between px-[66px] text-left text-[14px] transition ${
        active
          ? "bg-[#f5faff] font-semibold text-[#2874f0]"
          : "text-[#212121] hover:bg-[#f5faff] hover:text-[#2874f0]"
      }`}
    >
      <span>{label}</span>

      {rightText && (
        <span
          className={`font-semibold ${green ? "text-[#26a541]" : ""}`}
        >
          {rightText}
        </span>
      )}
    </button>
  );
}