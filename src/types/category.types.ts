export type MasterStatus = "active" | "inactive";

export type CategoryStatus = MasterStatus;

export interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  displayOrder: number;
  status: CategoryStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryForm {
  name: string;
  image: string;
  displayOrder: number;
  status: CategoryStatus;
}

export interface CategoryListResponse {
  success: boolean;
  data: Category[];
  message?: string;
}

export interface SingleCategoryResponse {
  success: boolean;
  message: string;
  data: Category;
}

export interface ListResponse<T> {
  success: boolean;
  data: T[];
  count?: number;
  message?: string;
}

export interface SingleResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface RefData {
  _id: string;
  name: string;
  slug?: string;
  status?: MasterStatus;
}

export interface SubCategory {
  _id: string;
  categoryId: Category | string;
  name: string;
  slug: string;
  image?: string;
  displayOrder: number;
  status: MasterStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubCategoryForm {
  categoryId: string;
  name: string;
  image: string;
  displayOrder: number;
  status: MasterStatus;
}

export interface SubSubCategory {
  _id: string;
  categoryId: Category | string;
  subCategoryId: SubCategory | string;
  name: string;
  slug: string;
  image?: string;
  displayOrder: number;
  status: MasterStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubSubCategoryForm {
  categoryId: string;
  subCategoryId: string;
  name: string;
  image: string;
  displayOrder: number;
  status: MasterStatus;
}

export interface Item {
  _id: string;
  categoryId: Category | string;
  subCategoryId: SubCategory | string;
  subSubCategoryId: SubSubCategory | string;
  name: string;
  slug: string;
  image?: string;
  unitOptions: string[];
  requiredAttributes: string[];
  displayOrder: number;
  status: MasterStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface ItemForm {
  categoryId: string;
  subCategoryId: string;
  subSubCategoryId: string;
  name: string;
  image: string;
  unitOptions: string;
  requiredAttributes: string;
  displayOrder: number;
  status: MasterStatus;
}

export interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  displayOrder: number;
  status: MasterStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface BrandForm {
  name: string;
  logo: string;
  description: string;
  displayOrder: number;
  status: MasterStatus;
}