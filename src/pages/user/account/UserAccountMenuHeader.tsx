import { ChevronDown } from "lucide-react";

const menus = [
  "Electronics",
  "TVs & Appliances",
  "Men",
  "Women",
  "Baby & Kids",
  "Home & Furniture",
  "Sports, Books & More",
  "Flights",
  "Offer Zone",
];

export default function UserAccountMenuHeader() {
  return (
    <nav className="sticky top-[56px] z-40 border-b border-[#dfe3e8] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex h-[40px] max-w-[1248px] items-center justify-between overflow-x-auto px-4">
        {menus.map((menu) => (
          <button
            key={menu}
            type="button"
            className="flex shrink-0 items-center gap-1 whitespace-nowrap px-3 text-[14px] font-semibold text-[#212121] hover:text-[#2874f0]"
          >
            {menu}

            {!["Flights", "Offer Zone"].includes(menu) && (
              <ChevronDown size={13} />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}