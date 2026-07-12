import { ChevronDown, ChevronRight } from "lucide-react";

type Category = {
  _id: string;
  name: string;
  slug?: string;
};

type SubCategory = {
  _id: string;
  name: string;
  slug?: string;
  categoryId?: string | { _id: string; name?: string };
};

type SubSubCategory = {
  _id: string;
  name: string;
  slug?: string;
  categoryId?: string | { _id: string; name?: string };
  subCategoryId?: string | { _id: string; name?: string };
};

type GroceryMenuHeaderProps = {
  horizontalMenus: Category[];

  hoveredCategoryId: string;
  hoveredSubCategoryId: string;

  hoveredCategorySubCategories: SubCategory[];
  hoveredSubSubCategories: SubSubCategory[];

  setHoveredCategoryId: (value: string) => void;
  setHoveredSubCategoryId: (value: string) => void;

  handleCategoryClick: (category: Category) => void;
  handleSubCategoryClick: (subCategory: SubCategory) => void;
  handleSubSubCategoryClick: (subSubCategory: SubSubCategory) => void;
};

export default function GroceryMenuHeader({
  horizontalMenus,
  hoveredCategoryId,
  hoveredSubCategoryId,
  hoveredCategorySubCategories,
  hoveredSubSubCategories,
  setHoveredCategoryId,
  setHoveredSubCategoryId,
  handleCategoryClick,
  handleSubCategoryClick,
  handleSubSubCategoryClick,
}: GroceryMenuHeaderProps) {
  const activeSubCategory = hoveredCategorySubCategories.find(
    (sub) => sub._id === hoveredSubCategoryId
  );

  const closeMegaMenu = () => {
    setHoveredCategoryId("");
    setHoveredSubCategoryId("");
  };

  return (
    <nav
      className="sticky top-[56px] z-40 border-b border-[#dfe3e8] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.08)]"
      onMouseLeave={closeMegaMenu}
    >
      <div className="mx-auto flex h-[44px] max-w-[1536px] items-center justify-around px-4">
        {horizontalMenus.map((category, index) => {
          const isActive = hoveredCategoryId === category._id;

          return (
            <div
              key={category._id}
              className="relative flex h-full items-center"
              onMouseEnter={() => {
                setHoveredCategoryId(category._id);
              }}
            >
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleCategoryClick(category);
                }}
                className={`flex h-full items-center gap-1 whitespace-nowrap px-3 text-[14px] font-semibold transition ${
                  isActive
                    ? "text-[#2874f0]"
                    : "text-[#212121] hover:text-[#2874f0]"
                }`}
              >
                {category.name}

                <ChevronDown
                  size={15}
                  className={`transition ${
                    isActive ? "rotate-180 text-[#2874f0]" : ""
                  }`}
                />
              </button>

              {isActive && (
                <div
                  className={`absolute top-[44px] z-[9999] flex min-h-[430px] w-[480px] border border-[#eeeeee] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.18)] ${
                    index === 0
                      ? "left-0 translate-x-0"
                      : "left-1/2 -translate-x-1/2"
                  }`}
                  onMouseEnter={() => {
                    setHoveredCategoryId(category._id);
                  }}
                >
                  <div className="w-[240px] border-r border-[#f0f0f0] bg-white py-2">
                    {hoveredCategorySubCategories.length > 0 ? (
                      hoveredCategorySubCategories.map((subCategory) => {
                        const isSubActive =
                          hoveredSubCategoryId === subCategory._id;

                        return (
                          <button
                            key={subCategory._id}
                            type="button"
                            onMouseEnter={() => {
                              setHoveredSubCategoryId(subCategory._id);
                            }}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              handleSubCategoryClick(subCategory);
                            }}
                            className={`flex h-[44px] w-full cursor-pointer items-center justify-between px-6 text-left text-[14px] transition ${
                              isSubActive
                                ? "bg-[#f5f5f5] font-semibold text-[#2874f0]"
                                : "text-[#212121] hover:bg-[#f9f9f9] hover:text-[#2874f0]"
                            }`}
                          >
                            <span className="truncate">
                              {subCategory.name}
                            </span>

                            <ChevronRight size={16} />
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-6 py-5 text-[14px] text-[#878787]">
                        No sub categories found
                      </div>
                    )}
                  </div>

                  <div className="w-[240px] bg-white px-6 py-4">
                    <p className="mb-4 text-[12px] font-semibold uppercase text-[#878787]">
                      More in {activeSubCategory?.name || "Category"}
                    </p>

                    <div className="space-y-5">
                      {activeSubCategory && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handleSubCategoryClick(activeSubCategory);
                          }}
                          className="block w-full cursor-pointer text-left text-[14px] text-[#212121] hover:text-[#2874f0]"
                        >
                          All
                        </button>
                      )}

                      {hoveredSubSubCategories.length > 0 ? (
                        hoveredSubSubCategories.map((subSubCategory) => (
                          <button
                            key={subSubCategory._id}
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              handleSubSubCategoryClick(subSubCategory);
                            }}
                            className="block w-full cursor-pointer text-left text-[14px] text-[#212121] hover:text-[#2874f0]"
                          >
                            {subSubCategory.name}
                          </button>
                        ))
                      ) : (
                        <p className="text-[14px] text-[#878787]">
                          No sub-sub categories found
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}