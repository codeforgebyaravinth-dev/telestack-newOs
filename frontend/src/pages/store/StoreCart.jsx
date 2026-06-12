import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { useShopperAuth } from "../../context/ShopperAuthContext";
import { formatErr, resolveMediaUrl } from "../../lib/api";
import { storePath } from "../../lib/storeApi";

export default function StoreCart() {
  const { api, clientRef, resolvedHost, shopper, loading: authLoading } = useShopperAuth();
  const { setCartCount } = useOutletContext() || {};
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  const loginPath = storePath(clientRef, "login", resolvedHost);
  const checkoutPath = storePath(clientRef, "checkout", resolvedHost);
  const homePath = storePath(clientRef, "", resolvedHost);

  const load = async () => {
    try {
      const { data } = await api.get("/cart");
      setCart(data);
      if (setCartCount) setCartCount(data.item_count || 0);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!shopper || shopper === false) {
      setLoading(false);
      return;
    }
    load();
  }, [shopper, authLoading]);

  const updateQty = async (productId, qty) => {
    try {
      const { data } = await api.put(`/cart/items/${productId}`, { qty });
      setCart(data);
      if (setCartCount) setCartCount(data.item_count || 0);
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
    }
  };

  const removeItem = async (productId) => {
    try {
      const { data } = await api.delete(`/cart/items/${productId}`);
      setCart(data);
      if (setCartCount) setCartCount(data.item_count || 0);
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
    }
  };

  if (authLoading || loading) return <div className="text-center py-20">Loading cart...</div>;
  if (!shopper || shopper === false) {
    return (
      <div className="bg-white rounded-xl border border-[#D5D9D9] p-10 text-center max-w-lg mx-auto">
        <p className="text-[#565959] mb-4">Sign in to view your cart.</p>
        <Button onClick={() => navigate(loginPath)} className="bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111]">Sign in</Button>
      </div>
    );
  }

  const items = cart?.items || [];

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <h1 className="text-2xl font-bold">Shopping Cart</h1>
        {items.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#D5D9D9] p-10 text-center">
            <p className="text-[#565959]">Your cart is empty.</p>
            <Link to={homePath} className="text-[#007185] hover:text-[#C45500] text-sm mt-2 inline-block">Continue shopping</Link>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.product_id} className="bg-white rounded-xl border border-[#D5D9D9] p-4 flex gap-4">
              <div className="w-24 h-24 shrink-0 bg-[#F7F8F8] rounded-lg overflow-hidden">
                {item.image_url && <img src={resolveMediaUrl(item.image_url)} alt={item.name} className="w-full h-full object-contain" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{item.name}</div>
                <div className="text-lg font-bold mt-1">₹{Number(item.unit_price || 0).toLocaleString()}</div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center border border-[#D5D9D9] rounded-md">
                    <button type="button" className="p-1.5" onClick={() => updateQty(item.product_id, Math.max(1, item.qty - 1))}><Minus className="w-3.5 h-3.5" /></button>
                    <span className="px-3 text-sm">{item.qty}</span>
                    <button type="button" className="p-1.5" onClick={() => updateQty(item.product_id, Math.min(item.stock, item.qty + 1))}><Plus className="w-3.5 h-3.5" /></button>
                  </div>
                  <button type="button" onClick={() => removeItem(item.product_id)} className="text-red-600 text-sm flex items-center gap-1">
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
              <div className="font-bold">₹{Number(item.line_total || 0).toLocaleString()}</div>
            </div>
          ))
        )}
      </div>
      {items.length > 0 && (
        <div className="bg-white rounded-xl border border-[#D5D9D9] p-6 h-fit sticky top-24">
          <div className="text-lg font-bold mb-4">Order summary</div>
          <div className="flex justify-between text-sm mb-2">
            <span>Subtotal ({cart.item_count} items)</span>
            <span>₹{Number(cart.subtotal || 0).toLocaleString()}</span>
          </div>
          <div className="border-t border-[#D5D9D9] pt-3 mt-3 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>₹{Number(cart.subtotal || 0).toLocaleString()}</span>
          </div>
          <Button onClick={() => navigate(checkoutPath)} className="w-full mt-4 bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] rounded-full">
            Proceed to checkout
          </Button>
        </div>
      )}
    </div>
  );
}
