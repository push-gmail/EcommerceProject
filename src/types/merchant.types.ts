export type MerchantStatus = "active" | "inactive" | "blocked";

export interface Merchant {
  _id: string;
  merchantId: string;
  name: string;
  email: string;
  phone?: string;
  shopName: string;
  pincode: string;
  status: MerchantStatus;
  isPasswordChanged: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MerchantForm {
  name: string;
  email: string;
  phone: string;
  shopName: string;
  pincode: string;
  status: MerchantStatus;
}

export interface ListResponse<T> {
  success: boolean;
  data: T[];
  message?: string;
}

export interface SingleResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}