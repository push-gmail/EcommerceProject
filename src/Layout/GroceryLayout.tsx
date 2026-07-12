import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Outlet, useNavigate } from "react-router-dom";
import backendApi from "../api/backendApi";

import GroceryHeader from "../pages/user/grocery/GroceryHeader";
import GroceryMenuHeader from "../pages/user/grocery/GroceryMenuHeader";
import UserLoginPopup from "../pages/user/grocery/UserLoginPopup";

export type GroceryItem = {
  _id: string;
  name: string;
  slug?: string;
  categoryId?: string | { _id: string; name?: string };
  subCategoryId?: string | { _id: string; name?: string };
  subSubCategoryId?: string | { _id: string; name?: string };
};

export type GroceryCategory = {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  subCategories?: GrocerySubCategory[];
};

export type GrocerySubCategory = {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  categoryId?: string | { _id: string; name?: string };
  subSubCategories?: GrocerySubSubCategory[];
};

export type GrocerySubSubCategory = {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  categoryId?: string | { _id: string; name?: string };
  subCategoryId?: string | { _id: string; name?: string };
  items?: GroceryItem[];
};

type CatalogCache = {
  categories: GroceryCategory[];
  subCategories: GrocerySubCategory[];
  subSubCategories: GrocerySubSubCategory[];
  items: GroceryItem[];
};

export type GroceryLayoutOutletContext = {
  search: string;
  cartCount: number;
  setCartCount: Dispatch<SetStateAction<number>>;
  categories: GroceryCategory[];
  subCategories: GrocerySubCategory[];
  subSubCategories: GrocerySubSubCategory[];
  items: GroceryItem[];
};

let groceryLayoutCatalogCache: CatalogCache | null = null;
let groceryLayoutCatalogPromise: Promise<CatalogCache> | null = null;

const getParentId = (value: any) => {
  if (!value) return "";
  if (typeof value === "object") return value._id || "";
  return String(value);
};

const fetchPublicCatalogOnce = async (): Promise<CatalogCache> => {
  if (groceryLayoutCatalogCache) return groceryLayoutCatalogCache;
  if (groceryLayoutCatalogPromise) return groceryLayoutCatalogPromise;

  groceryLayoutCatalogPromise = backendApi
    .get("/user/shop-categories", {
      skipAuthRefresh: true,
    } as any)
    .then((response) => {
      const payload = response.data?.data || {};

      const tree: GroceryCategory[] = Array.isArray(payload.categories)
        ? payload.categories
        : [];

      const flatSubCategories: GrocerySubCategory[] = tree.flatMap(
        (category) =>
          (category.subCategories || []).map((subCategory) => ({
            ...subCategory,
            categoryId: category._id,
          }))
      );

      const flatSubSubCategories: GrocerySubSubCategory[] = tree.flatMap(
        (category) =>
          (category.subCategories || []).flatMap((subCategory) =>
            (subCategory.subSubCategories || []).map((subSubCategory) => ({
              ...subSubCategory,
              categoryId: category._id,
              subCategoryId: subCategory._id,
            }))
          )
      );

      const flatItems: GroceryItem[] = tree.flatMap((category) =>
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

      groceryLayoutCatalogCache = {
        categories: tree,
        subCategories: flatSubCategories,
        subSubCategories: flatSubSubCategories,
        items: flatItems,
      };

      return groceryLayoutCatalogCache;
    })
    .finally(() => {
      groceryLayoutCatalogPromise = null;
    });

  return groceryLayoutCatalogPromise;
};

export default function GroceryLayout() {
  const navigate = useNavigate();
  const isMountedRef = useRef(false);

  const [search, setSearch] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [loginPopupOpen, setLoginPopupOpen] = useState(false);

  const [categories, setCategories] = useState<GroceryCategory[]>(
    groceryLayoutCatalogCache?.categories || []
  );

  const [subCategories, setSubCategories] = useState<GrocerySubCategory[]>(
    groceryLayoutCatalogCache?.subCategories || []
  );

  const [subSubCategories, setSubSubCategories] = useState<
    GrocerySubSubCategory[]
  >(groceryLayoutCatalogCache?.subSubCategories || []);

  const [items, setItems] = useState<GroceryItem[]>(
    groceryLayoutCatalogCache?.items || []
  );

  const [catalogLoading, setCatalogLoading] = useState(
    !groceryLayoutCatalogCache
  );

  const [catalogError, setCatalogError] = useState("");

  const [hoveredCategoryId, setHoveredCategoryId] = useState("");
  const [hoveredSubCategoryId, setHoveredSubCategoryId] = useState("");

  useEffect(() => {
    isMountedRef.current = true;

    if (groceryLayoutCatalogCache) {
      setCategories(groceryLayoutCatalogCache.categories);
      setSubCategories(groceryLayoutCatalogCache.subCategories);
      setSubSubCategories(groceryLayoutCatalogCache.subSubCategories);
      setItems(groceryLayoutCatalogCache.items);
      setCatalogLoading(false);
      return;
    }

    setCatalogLoading(true);
    setCatalogError("");

    fetchPublicCatalogOnce()
      .then((catalog) => {
        if (!isMountedRef.current) return;

        setCategories(catalog.categories);
        setSubCategories(catalog.subCategories);
        setSubSubCategories(catalog.subSubCategories);
        setItems(catalog.items);
      })
      .catch((error) => {
        if (!isMountedRef.current) return;

        console.log("GROCERY LAYOUT CATALOG ERROR:", error);

        setCatalogError("Failed to load categories");
        setCategories([]);
        setSubCategories([]);
        setSubSubCategories([]);
        setItems([]);
      })
      .finally(() => {
        if (isMountedRef.current) {
          setCatalogLoading(false);
        }
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
    (category: GroceryCategory) => {
      closeMenu();
      navigate(`/grocery?categoryId=${category._id}`);
    },
    [closeMenu, navigate]
  );

  const handleSubCategoryClick = useCallback(
    (subCategory: GrocerySubCategory) => {
      closeMenu();
      navigate(`/grocery?subCategoryId=${subCategory._id}`);
    },
    [closeMenu, navigate]
  );

  const handleSubSubCategoryClick = useCallback(
    (subSubCategory: GrocerySubSubCategory) => {
      closeMenu();
      navigate(`/grocery?subSubCategoryId=${subSubCategory._id}`);
    },
    [closeMenu, navigate]
  );

  const handleItemClick = useCallback(
    (item: GroceryItem) => {
      closeMenu();
      navigate(`/grocery?itemId=${item._id}`);
    },
    [closeMenu, navigate]
  );

  const handleLoginSuccess = useCallback(() => {
    window.dispatchEvent(new CustomEvent("user-login-success"));
  }, []);

  const outletContext: GroceryLayoutOutletContext = {
    search,
    cartCount,
    setCartCount,
    categories,
    subCategories,
    subSubCategories,
    items,
  };

  return (
    <div className="min-h-screen bg-[#f1f3f6] text-[#212121]">
      <GroceryHeader
        search={search}
        setSearch={setSearch}
        cartCount={cartCount}
        onLoginClick={() => setLoginPopupOpen(true)}
      />

      <UserLoginPopup
        open={loginPopupOpen}
        onClose={() => setLoginPopupOpen(false)}
        onLoginSuccess={handleLoginSuccess}
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
        handleItemClick={handleItemClick}
      />

      {catalogLoading && categories.length === 0 && (
        <div className="border-b border-[#e0e0e0] bg-white py-2 text-center text-[13px] font-semibold text-[#212121]">
          Loading categories...
        </div>
      )}

      {catalogError && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-center text-sm font-semibold text-red-600">
          {catalogError}
        </div>
      )}

      <Outlet context={outletContext} />
    </div>
  );
}
