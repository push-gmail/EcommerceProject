export const GROCERY_CART_CHANGED_EVENT = "grocery-cart-changed";

export const emitGroceryCartChanged = () => {
  window.dispatchEvent(new CustomEvent(GROCERY_CART_CHANGED_EVENT));
};