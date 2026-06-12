import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { useShopperAuth } from "../../context/ShopperAuthContext";
import { storePath } from "../../lib/storeApi";

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  completed: "bg-slate-100 text-slate-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function StoreOrders() {
  const { api, clientRef, resolvedHost, shopper, loading: authLoading } = useShopperAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const loginPath = storePath(clientRef, "login", resolvedHost);
  const homePath = storePath(clientRef, "", resolvedHost);

  useEffect(() => {
    if (authLoading || !shopper || shopper === false) return;
    (async () => {
      try {
        const { data } = await api.get("/orders");
        setOrders(data);
      } catch {
        setOrders([]);
      }
    })();
  }, [shopper, authLoading, api]);

  if (authLoading) return <div className="text-center py-20">Loading...</div>;
  if (!shopper || shopper === false) {
    return (
      <div className="bg-white rounded-xl border p-10 text-center max-w-lg mx-auto">
        <p className="mb-4">Sign in to view your orders.</p>
        <Button onClick={() => navigate(loginPath)}>Sign in</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Your Orders</h1>
      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#D5D9D9] p-10 text-center">
          <p className="text-[#565959]">No orders yet.</p>
          <Link to={homePath} className="text-[#007185] text-sm mt-2 inline-block">Start shopping</Link>
        </div>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl border border-[#D5D9D9] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <div className="font-bold">{order.order_no}</div>
                <div className="text-xs text-[#565959]">{new Date(order.created_at).toLocaleString()}</div>
              </div>
              <span className={`text-xs font-semibold uppercase px-2 py-1 rounded ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}>
                {order.status}
              </span>
            </div>
            <div className="space-y-2">
              {(order.items || []).map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{item.name} × {item.qty}</span>
                  <span>₹{Number(item.line_total || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-[#EEE] mt-3 pt-3 flex justify-between font-bold">
              <span>Total</span>
              <span>₹{Number(order.total || 0).toLocaleString()}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
