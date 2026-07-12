export type MerchantProductApprovalStatus =
  | "pending"
  | "approved"
  | "rejected";

export type MerchantProductStatus = "active" | "inactive";

export interface MerchantProduct {
  _id: string;
  merchantId: any;

  categoryId: any;
  subCategoryId: any;
  subSubCategoryId: any;
  itemId: any;
  brandId: any;

  productName: string;
  images: string[];
  specifications: Record<string, any>;

  packets: number;
  quantityInPackets: string;
  unit: string;

  // Product pincode backend se aayega.
  // Backend merchant profile ke assigned pincode se set karega.
  pincode: string;

  mrp: number;
  sellingPrice: number;
  discountPercent: number;

  description: string;

  approvalStatus: MerchantProductApprovalStatus;
  rejectionReason?: string;
  status: MerchantProductStatus;

  createdAt?: string;
  updatedAt?: string;
}

export interface MerchantProductForm {
  categoryId: string;
  subCategoryId: string;
  subSubCategoryId: string;
  itemId: string;
  brandId: string;

  productName: string;
  images: string[];
  specifications: Record<string, any>;

  packets: number;
  quantityInPackets: string;
  unit: string;

  // Important:
  // pincode yahan nahi hoga.
  // Merchant product form se pincode send nahi hoga.

  mrp: number;
  sellingPrice: number;
  discountPercent: number;

  description: string;
  status: MerchantProductStatus;
}