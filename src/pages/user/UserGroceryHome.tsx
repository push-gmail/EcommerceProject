import { useMemo } from "react";
import { useSearchParams, useOutletContext } from "react-router-dom";

import GrocerySidebar from "./grocery/GrocerySidebar";
import GroceryProductListing from "./grocery/GroceryProductListing";
import type { GroceryLayoutOutletContext } from "../../Layout/GroceryLayout";

const getParentId = (value: any) => {
  if (!value) return "";
  if (typeof value === "object") return value._id || "";
  return String(value);
};

export default function UserGroceryHome() {
  const [searchParams] = useSearchParams();

  const {
    search,
    setCartCount,
    categories,
    subCategories,
    subSubCategories,
    items,
  } = useOutletContext<GroceryLayoutOutletContext>();

  const selectedCategoryId = searchParams.get("categoryId") || "";
  const selectedSubCategoryId = searchParams.get("subCategoryId") || "";
  const selectedSubSubCategoryId = searchParams.get("subSubCategoryId") || "";
  const selectedItemId = searchParams.get("itemId") || "";

  const selectedCategory = useMemo(() => {
    if (selectedCategoryId) {
      return categories.find((category) => category._id === selectedCategoryId);
    }

    if (selectedSubCategoryId) {
      const subCategory = subCategories.find(
        (item) => item._id === selectedSubCategoryId
      );

      return categories.find(
        (category) => category._id === getParentId(subCategory?.categoryId)
      );
    }

    if (selectedSubSubCategoryId) {
      const subSubCategory = subSubCategories.find(
        (item) => item._id === selectedSubSubCategoryId
      );

      return categories.find(
        (category) => category._id === getParentId(subSubCategory?.categoryId)
      );
    }

    if (selectedItemId) {
      const item = items.find((item) => item._id === selectedItemId);

      return categories.find(
        (category) => category._id === getParentId(item?.categoryId)
      );
    }

    return undefined;
  }, [
    categories,
    subCategories,
    subSubCategories,
    items,
    selectedCategoryId,
    selectedSubCategoryId,
    selectedSubSubCategoryId,
    selectedItemId,
  ]);

  const selectedSubCategory = useMemo(() => {
    if (selectedSubCategoryId) {
      return subCategories.find(
        (subCategory) => subCategory._id === selectedSubCategoryId
      );
    }

    if (selectedSubSubCategoryId) {
      const subSubCategory = subSubCategories.find(
        (item) => item._id === selectedSubSubCategoryId
      );

      return subCategories.find(
        (subCategory) =>
          subCategory._id === getParentId(subSubCategory?.subCategoryId)
      );
    }

    if (selectedItemId) {
      const item = items.find((item) => item._id === selectedItemId);

      return subCategories.find(
        (subCategory) => subCategory._id === getParentId(item?.subCategoryId)
      );
    }

    return undefined;
  }, [
    subCategories,
    subSubCategories,
    items,
    selectedSubCategoryId,
    selectedSubSubCategoryId,
    selectedItemId,
  ]);

  const selectedSubSubCategory = useMemo(() => {
    if (selectedSubSubCategoryId) {
      return subSubCategories.find(
        (subSubCategory) => subSubCategory._id === selectedSubSubCategoryId
      );
    }

    if (selectedItemId) {
      const item = items.find((item) => item._id === selectedItemId);

      return subSubCategories.find(
        (subSubCategory) =>
          subSubCategory._id === getParentId(item?.subSubCategoryId)
      );
    }

    return undefined;
  }, [subSubCategories, items, selectedSubSubCategoryId, selectedItemId]);

  const selectedItem = useMemo(() => {
    return items.find((item) => item._id === selectedItemId);
  }, [items, selectedItemId]);

  const pageTitle =
    selectedItem?.name ||
    selectedSubSubCategory?.name ||
    selectedSubCategory?.name ||
    selectedCategory?.name ||
    "Grocery";

  const breadcrumbCategory = selectedCategory?.name || "All Categories";

  const handleAddProduct = () => {
    setCartCount((prev) => prev + 1);
  };

  return (
    <main className="mx-auto max-w-[1536px] p-[8px]">
      <div className="grid grid-cols-1 gap-[12px] lg:grid-cols-[270px_1fr]">
        <GrocerySidebar />

        <GroceryProductListing
          selectedCategoryId={selectedCategoryId}
          selectedSubCategoryId={selectedSubCategoryId}
          selectedSubSubCategoryId={selectedSubSubCategoryId}
          selectedItemId={selectedItemId}
          searchValue={search}
          pageTitle={pageTitle}
          breadcrumbCategory={breadcrumbCategory}
          selectedSubCategoryName={selectedSubCategory?.name || ""}
          selectedSubSubCategoryName={selectedSubSubCategory?.name || ""}
          onAdd={handleAddProduct}
        />
      </div>
    </main>
  );
}