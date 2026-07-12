import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Search,
  ShoppingCart,
  User,
  Package,
  Heart,
  Gift,
  Bell,
  LogOut,
} from "lucide-react";
import backendApi from "../../../api/backendApi";

type UserData = {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
};

type Props = {
  user: UserData | null;
  cartCount?: number;
  onLogout?: () => void;
};

export default function UserAccountHeader({
  user,
  cartCount = 0,
  onLogout,
}: Props) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await backendApi.post("/user/logout");
    } catch {
      // ignore
    } finally {
      onLogout?.();
      navigate("/user/grocery", { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#2874f0] text-white">
      <div className="mx-auto flex h-[56px] max-w-[1248px] items-center px-4">
        <button
          type="button"
          onClick={() => navigate("/user/grocery")}
          className="mr-4 flex w-[120px] flex-col items-start leading-none"
        >
          <span className="text-[22px] font-black italic leading-[20px]">
            Flipkart
          </span>

          <span className="mt-[2px] text-[11px] italic text-white/90">
            Explore <span className="font-bold text-[#ffe500]">Plus ✦</span>
          </span>
        </button>

        <div className="flex h-[36px] max-w-[560px] flex-1 items-center rounded-[2px] bg-white shadow-sm">
          <input
            placeholder="Search for products, brands and more"
            className="h-full min-w-0 flex-1 rounded-[2px] px-4 text-[14px] text-[#212121] outline-none placeholder:text-[#878787]"
          />

          <button
            type="button"
            className="flex h-full w-[48px] items-center justify-center text-[#2874f0]"
          >
            <Search size={21} strokeWidth={3} />
          </button>
        </div>

        <div className="group relative ml-8 hidden h-[56px] items-center md:flex">
          <button
            type="button"
            className="flex h-full items-center gap-1 text-[16px] font-semibold"
          >
            {user?.name || "My Account"}
            <ChevronDown size={15} />
          </button>

          <div className="invisible absolute right-0 top-[56px] z-[999] w-[250px] rounded-sm bg-white py-2 text-[#212121] opacity-0 shadow-[0_4px_16px_rgba(0,0,0,0.22)] transition group-hover:visible group-hover:opacity-100">
            <DropdownItem
              icon={<User size={18} />}
              label="My Profile"
              onClick={() => navigate("/user/my-account")}
            />
            <DropdownItem
              icon={<Package size={18} />}
              label="Orders"
              onClick={() => navigate("/user/orders")}
            />
            <DropdownItem
              icon={<Heart size={18} />}
              label="Wishlist"
              onClick={() => navigate("/user/wishlist")}
            />
            <DropdownItem
              icon={<Gift size={18} />}
              label="Gift Cards"
              onClick={() => navigate("/user/gift-cards")}
            />
            <DropdownItem
              icon={<Bell size={18} />}
              label="Notifications"
              onClick={() => navigate("/user/notifications")}
            />
            <DropdownItem
              icon={<LogOut size={18} />}
              label="Logout"
              danger
              onClick={handleLogout}
            />
          </div>
        </div>

        <button
          type="button"
          className="ml-8 hidden h-[56px] items-center text-[16px] font-semibold lg:flex"
        >
          Become a Seller
        </button>

        <button
          type="button"
          className="ml-8 hidden h-[56px] items-center gap-1 text-[16px] font-semibold md:flex"
        >
          More
          <ChevronDown size={15} />
        </button>

        <button
          type="button"
          className="relative ml-8 flex h-[56px] items-center gap-2 text-[16px] font-semibold"
        >
          <ShoppingCart size={22} fill="white" />

          {cartCount > 0 && (
            <span className="absolute -left-2 top-[8px] flex h-[18px] min-w-[18px] items-center justify-center rounded-full border border-white bg-[#ff6161] px-[5px] text-[11px] font-bold leading-none">
              {cartCount}
            </span>
          )}

          Cart
        </button>
      </div>
    </header>
  );
}

function DropdownItem({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[46px] w-full items-center gap-4 border-b border-[#f0f0f0] px-5 text-left text-[14px] transition last:border-b-0 hover:bg-[#f5f5f5] ${
        danger ? "text-[#ff6161]" : "text-[#424242]"
      }`}
    >
      <span className={danger ? "text-[#ff6161]" : "text-[#2874f0]"}>
        {icon}
      </span>

      <span>{label}</span>
    </button>
  );
}