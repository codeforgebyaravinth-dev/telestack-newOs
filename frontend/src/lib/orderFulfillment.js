export function orderFulfillmentType(order) {
  if (order?.fulfillment_type === "offline" || order?.fulfillment_type === "online") {
    return order.fulfillment_type;
  }
  return order?.table_number ? "offline" : "online";
}

export function formatOrderDelivery(order) {
  if (orderFulfillmentType(order) === "offline") {
    const table = String(order?.table_number || "").trim();
    return table ? `Table ${table}` : "In-store order";
  }
  const addr = order?.shipping_address || {};
  const parts = [addr.line1, addr.city, addr.pincode].map((x) => String(x || "").trim()).filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

export function orderDeliverySearchText(order) {
  const type = orderFulfillmentType(order);
  if (type === "offline") return String(order?.table_number || "");
  const addr = order?.shipping_address || {};
  return [addr.line1, addr.city, addr.pincode].join(" ");
}
