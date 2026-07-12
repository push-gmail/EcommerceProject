import { ReactNode } from "react";
import { ChevronDown, Search, Star } from "lucide-react";

const brandFilters = [
  "Aadhar",
  "AASHIRVAAD",
  "Agro Fresh",
  "Amul",
  "Anik",
  "Annapurna",
];

export default function GrocerySidebar() {
  return (
    <aside className="hidden min-h-[calc(100vh-120px)] bg-white lg:block">
      <div className="border-b border-[#f0f0f0] px-4 py-[18px]">
        <h2 className="text-[20px] font-semibold text-[#212121]">Filters</h2>
      </div>

      <FilterSection title="BRAND">
        <div className="mb-[14px] flex h-8 items-center gap-2 border-b border-[#e0e0e0] text-[14px] text-[#878787]">
          <Search size={16} />
          <span>Search Brand</span>
        </div>

        <div className="space-y-[13px]">
          {brandFilters.map((brand) => (
            <label
              key={brand}
              className="flex cursor-pointer items-center gap-3 text-[14px] text-[#212121]"
            >
              <span className="flex h-[14px] w-[14px] border border-[#c2c2c2] bg-white" />
              {brand}
            </label>
          ))}
        </div>

        <button className="mt-[14px] text-[12px] font-semibold uppercase text-[#2874f0]">
          98 MORE
        </button>
      </FilterSection>

      <FilterSection title="CUSTOMER RATINGS">
        <div className="space-y-[13px]">
          {[4, 3, 2, 1].map((rating) => (
            <label
              key={rating}
              className="flex cursor-pointer items-center gap-3 text-[14px] text-[#212121]"
            >
              <span className="flex h-[14px] w-[14px] border border-[#c2c2c2] bg-white" />

              <span className="inline-flex items-center gap-[2px]">
                {rating}
                <Star size={12} fill="#212121" strokeWidth={0} />
                & above
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="OFFERS">
        <label className="flex cursor-pointer items-center gap-3 text-[14px] text-[#212121]">
          <span className="flex h-[14px] w-[14px] border border-[#c2c2c2] bg-white" />
          Special Price
        </label>
      </FilterSection>

      <CollapsedFilter title="DISCOUNT" />
      <CollapsedFilter title="QUANTITY" />
    </aside>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-[#f0f0f0] px-4 py-[18px]">
      <div className="mb-[14px] flex items-center justify-between">
        <h3 className="text-[13px] font-semibold uppercase text-[#212121]">
          {title}
        </h3>

        <ChevronDown size={18} />
      </div>

      {children}
    </div>
  );
}

function CollapsedFilter({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#f0f0f0] px-4 py-[18px]">
      <h3 className="text-[13px] font-semibold uppercase text-[#212121]">
        {title}
      </h3>

      <ChevronDown size={18} />
    </div>
  );
}