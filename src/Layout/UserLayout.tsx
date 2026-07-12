import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import backendApi from "../api/backendApi";

import GroceryHeader from "../pages/user/grocery/GroceryHeader";
import GroceryMenuHeader from "../pages/user/grocery/GroceryMenuHeader";

type Item = {
  _id: string;
  name: string;
  slug?: string;
  categoryId?: string | { _id: string; name?: string };
  subCategoryId?: string | { _id: string; name?: string };
  subSubCategoryId?: string | { _id: string; name?: string };
};

type Category = {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  subCategories?: SubCategory[];
};

type SubCategory = {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  categoryId?: string | { _id: string; name?: string };
  subSubCategories?: SubSubCategory[];
};

type SubSubCategory = {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  categoryId?: string | { _id: string; name?: string };
  subCategoryId?: string | { _id: string; name?: string };
  items?: Item[];
};

type CatalogCache = {
  categories: Category[];
  subCategories: SubCategory[];
  subSubCategories: SubSubCategory[];
  items: Item[];
};

let userLayoutCatalogCache: CatalogCache | null = null;
let userLayoutCatalogPromise: Promise<CatalogCache> | null = null;

const getParentId = (value: unknown) => {
  if (!value) return "";

  if (typeof value === "object" && value !== null && "_id" in value) {
    return String((value as { _id?: string })._id || "");
  }

  return String(value);
};

const fetchPublicCatalogOnce = async (): Promise<CatalogCache> => {
  if (userLayoutCatalogCache) return userLayoutCatalogCache;
  if (userLayoutCatalogPromise) return userLayoutCatalogPromise;

  userLayoutCatalogPromise = backendApi
    .get("/user/shop-categories", {
      skipAuthRefresh: true,
    } as any)
    .then((response) => {
      const payload = response.data?.data || {};

      const tree: Category[] = Array.isArray(payload.categories)
        ? payload.categories
        : [];

      const flatSubCategories: SubCategory[] = tree.flatMap((category) =>
        (category.subCategories || []).map((subCategory) => ({
          ...subCategory,
          categoryId: category._id,
        }))
      );

      const flatSubSubCategories: SubSubCategory[] = tree.flatMap((category) =>
        (category.subCategories || []).flatMap((subCategory) =>
          (subCategory.subSubCategories || []).map((subSubCategory) => ({
            ...subSubCategory,
            categoryId: category._id,
            subCategoryId: subCategory._id,
          }))
        )
      );

      const flatItems: Item[] = tree.flatMap((category) =>
        (category.subCategories || []).flatMap((subCategory) =>
          (subCategory.subSubCategories || []).flatMap((subSubCategory) =>
            (subSubCategory.items || []).map((item) => ({
              ...item,
              categoryId: category._id,
              subCategoryId: subCategory._id,
              subSubCategoryId: subSubCategory._id,
            }))
          )
        )
      );

      userLayoutCatalogCache = {
        categories: tree,
        subCategories: flatSubCategories,
        subSubCategories: flatSubSubCategories,
        items: flatItems,
      };

      return userLayoutCatalogCache;
    })
    .finally(() => {
      userLayoutCatalogPromise = null;
    });

  return userLayoutCatalogPromise;
};

export default function UserLayout() {
  const navigate = useNavigate();
  const isMountedRef = useRef(false);

  const [search, setSearch] = useState("");
  const [cartCount, setCartCount] = useState(0);

  const [categories, setCategories] = useState<Category[]>(
    userLayoutCatalogCache?.categories || []
  );

  const [subCategories, setSubCategories] = useState<SubCategory[]>(
    userLayoutCatalogCache?.subCategories || []
  );

  const [subSubCategories, setSubSubCategories] = useState<SubSubCategory[]>(
    userLayoutCatalogCache?.subSubCategories || []
  );

  const [hoveredCategoryId, setHoveredCategoryId] = useState("");
  const [hoveredSubCategoryId, setHoveredSubCategoryId] = useState("");

  useEffect(() => {
    isMountedRef.current = true;

    if (userLayoutCatalogCache) {
      setCategories(userLayoutCatalogCache.categories);
      setSubCategories(userLayoutCatalogCache.subCategories);
      setSubSubCategories(userLayoutCatalogCache.subSubCategories);
      return;
    }

    fetchPublicCatalogOnce()
      .then((catalog) => {
        if (!isMountedRef.current) return;

        setCategories(catalog.categories);
        setSubCategories(catalog.subCategories);
        setSubSubCategories(catalog.subSubCategories);
      })
      .catch((error) => {
        if (!isMountedRef.current) return;

        console.log("USER LAYOUT CATALOG ERROR:", error);

        setCategories([]);
        setSubCategories([]);
        setSubSubCategories([]);
      });

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!hoveredCategoryId) {
      setHoveredSubCategoryId("");
      return;
    }

    const firstSubCategory = subCategories.find(
      (subCategory) => getParentId(subCategory.categoryId) === hoveredCategoryId
    );

    setHoveredSubCategoryId(firstSubCategory?._id || "");
  }, [hoveredCategoryId, subCategories]);

  const horizontalMenus = useMemo(() => {
    return categories.slice(0, 7);
  }, [categories]);

  const hoveredCategorySubCategories = useMemo(() => {
    if (!hoveredCategoryId) return [];

    return subCategories.filter(
      (subCategory) => getParentId(subCategory.categoryId) === hoveredCategoryId
    );
  }, [hoveredCategoryId, subCategories]);

  const hoveredSubSubCategories = useMemo(() => {
    if (!hoveredSubCategoryId) return [];

    return subSubCategories.filter(
      (subSubCategory) =>
        getParentId(subSubCategory.subCategoryId) === hoveredSubCategoryId
    );
  }, [hoveredSubCategoryId, subSubCategories]);

  const closeMenu = useCallback(() => {
    setHoveredCategoryId("");
    setHoveredSubCategoryId("");
  }, []);

  const handleCategoryClick = useCallback(
    (category: Category) => {
      closeMenu();
      navigate(`/grocery?categoryId=${category._id}`);
    },
    [closeMenu, navigate]
  );

  const handleSubCategoryClick = useCallback(
    (subCategory: SubCategory) => {
      closeMenu();
      navigate(`/grocery?subCategoryId=${subCategory._id}`);
    },
    [closeMenu, navigate]
  );

  const handleSubSubCategoryClick = useCallback(
    (subSubCategory: SubSubCategory) => {
      closeMenu();
      navigate(`/grocery?subSubCategoryId=${subSubCategory._id}`);
    },
    [closeMenu, navigate]
  );

  return (
    <div className="min-h-screen bg-[#f1f3f6] text-[#212121]">
      <GroceryHeader
        search={search}
        setSearch={setSearch}
        cartCount={cartCount}
      />

      <GroceryMenuHeader
        horizontalMenus={horizontalMenus}
        hoveredCategoryId={hoveredCategoryId}
        hoveredSubCategoryId={hoveredSubCategoryId}
        hoveredCategorySubCategories={hoveredCategorySubCategories}
        hoveredSubSubCategories={hoveredSubSubCategories}
        setHoveredCategoryId={setHoveredCategoryId}
        setHoveredSubCategoryId={setHoveredSubCategoryId}
        handleCategoryClick={handleCategoryClick}
        handleSubCategoryClick={handleSubCategoryClick}
        handleSubSubCategoryClick={handleSubSubCategoryClick}
      />

      <Outlet context={{ search, setSearch, cartCount, setCartCount }} />
    </div>
  );
}