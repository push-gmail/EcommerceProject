export type GroceryOrderNotificationType =
  | "success"
  | "confirmed"
  | "rejected"
  | "out_of_stock"
  | "info";

export type GroceryOrderNotificationPayload = {
  title: string;
  message: string;
  type?: GroceryOrderNotificationType;
  orderId?: string;
};

export const GROCERY_ORDER_NOTIFICATION_EVENT =
  "grocery-order-notification";

export const emitGroceryOrderNotification = (
  payload: GroceryOrderNotificationPayload
) => {
  window.dispatchEvent(
    new CustomEvent(GROCERY_ORDER_NOTIFICATION_EVENT, {
      detail: payload,
    })
  );
};