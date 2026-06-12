import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { useShopperAuth } from "../../context/ShopperAuthContext";
import { formatErr } from "../../lib/api";
import { storePath } from "../../lib/storeApi";

export default function StoreCheckout() {
  const { api, clientRef, resolvedHost, shopper, loading: authLoading } = useShopperAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    shipping_name: "",
    shipping_phone: "",
    shipping_line1: "",
    shipping_city: "",
    shipping_pincode: "",
    payment_method: "cod",
    notes: "",
  });

  const loginPath = storePath(clientRef, "login", resolvedHost);
  const ordersPath = storePath(clientRef, "orders", resolvedHost);
  const cartPath = storePath(clientRef, "cart", resolvedHost);

  useEffect(() => {
    if (authLoading) return;
    if (!shopper || shopper === false) return;
    setForm((prev) => ({
      ...prev,
      shipping_name: prev.shipping_name || shopper.name || "",
      shipping_phone: prev.shipping_phone || shopper.phone || "",
    }));
    (async () => {
      try {
        const { data } = await api.get("/cart");
        setCart(data);
      } catch {
        setCart(null);
      }
    })();
  }, [shopper, authLoading, api]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post("/orders", form);
      toast.success(`Order ${data.order_no} placed successfully`);
      navigate(ordersPath);
    } catch (err) {
      toast.error(formatErr(err.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  if (authLoading) return <div className="text-center py-20">Loading...</div>;
  if (!shopper || shopper === false) {
    return (
      <div className="bg-white rounded-xl border p-10 text-center max-w-lg mx-auto">
        <p className="mb-4">Sign in to checkout.</p>
        <Button onClick={() => navigate(loginPath)}>Sign in</Button>
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <div className="bg-white rounded-xl border p-10 text-center">
        <p>Your cart is empty.</p>
        <Link to={cartPath} className="text-[#007185] text-sm mt-2 inline-block">Back to cart</Link>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <form onSubmit={submit} className="lg:col-span-2 bg-white rounded-xl border border-[#D5D9D9] p-6 space-y-4">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Full name</Label><Input required value={form.shipping_name} onChange={(e) => setForm({ ...form, shipping_name: e.target.value })} className="mt-1" /></div>
          <div><Label>Phone</Label><Input required value={form.shipping_phone} onChange={(e) => setForm({ ...form, shipping_phone: e.target.value })} className="mt-1" /></div>
          <div className="sm:col-span-2"><Label>Address</Label><Input required value={form.shipping_line1} onChange={(e) => setForm({ ...form, shipping_line1: e.target.value })} className="mt-1" /></div>
          <div><Label>City</Label><Input required value={form.shipping_city} onChange={(e) => setForm({ ...form, shipping_city: e.target.value })} className="mt-1" /></div>
          <div><Label>Pincode</Label><Input required value={form.shipping_pincode} onChange={(e) => setForm({ ...form, shipping_pincode: e.target.value })} className="mt-1" /></div>
        </div>
        <div>
          <Label>Payment method</Label>
          <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className="mt-1 w-full border border-[#D5D9D9] rounded-md px-3 py-2">
            <option value="cod">Cash on Delivery</option>
            <option value="upi">UPI (pay on delivery)</option>
          </select>
        </div>
        <div><Label>Order notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="mt-1" /></div>
        <Button type="submit" disabled={busy} className="bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] rounded-full px-8">
          {busy ? "Placing order..." : "Place order"}
        </Button>
      </form>
      <div className="bg-white rounded-xl border border-[#D5D9D9] p-6 h-fit">
        <div className="font-bold mb-4">Order summary</div>
        {cart.items.map((item) => (
          <div key={item.product_id} className="flex justify-between text-sm py-2 border-b border-[#EEE]">
            <span className="line-clamp-1 flex-1 mr-2">{item.name} × {item.qty}</span>
            <span>₹{Number(item.line_total || 0).toLocaleString()}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold text-lg mt-4 pt-2">
          <span>Total</span>
          <span>₹{Number(cart.subtotal || 0).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
