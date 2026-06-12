import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { useShopperAuth } from "../../context/ShopperAuthContext";
import { formatErr } from "../../lib/api";
import { storePath } from "../../lib/storeApi";

export default function StoreCheckout() {
  const { api, clientRef, resolvedHost, shopper, loading: authLoading } = useShopperAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [fulfillmentMode, setFulfillmentMode] = useState("online");
  const [form, setForm] = useState({
    shipping_name: "",
    shipping_phone: "",
    shipping_line1: "",
    shipping_city: "",
    shipping_pincode: "",
    table_number: "",
    payment_method: "cod",
    notes: "",
  });

  const loginPath = storePath(clientRef, "login", resolvedHost);
  const ordersPath = storePath(clientRef, "orders", resolvedHost);
  const cartPath = storePath(clientRef, "cart", resolvedHost);
  const isOffline = fulfillmentMode === "offline";

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

  const buildOrderPayload = () => ({
    ...form,
    order_fulfillment: fulfillmentMode,
    table_number: isOffline ? form.table_number : "",
    shipping_line1: isOffline ? "" : form.shipping_line1,
    shipping_city: isOffline ? "" : form.shipping_city,
    shipping_pincode: isOffline ? "" : form.shipping_pincode,
  });

  const validateForm = () => {
    if (!form.shipping_name.trim() || !form.shipping_phone.trim()) {
      toast.error("Name and phone are required");
      return false;
    }
    if (isOffline) {
      if (!form.table_number.trim()) {
        toast.error("Table number is required for in-store orders");
        return false;
      }
    } else if (!form.shipping_line1.trim() || !form.shipping_city.trim() || !form.shipping_pincode.trim()) {
      toast.error("Complete delivery address is required");
      return false;
    }
    return true;
  };

  const openConfirm = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setConfirmOpen(true);
  };

  const placeOrder = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/orders", buildOrderPayload());
      toast.success(`Order ${data.order_no} placed successfully`);
      setConfirmOpen(false);
      navigate(ordersPath);
    } catch (err) {
      toast.error(formatErr(err.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  const deliverySummary = isOffline
    ? `Table ${form.table_number.trim()}`
    : [form.shipping_line1, form.shipping_city, form.shipping_pincode].filter(Boolean).join(", ");

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
    <>
      <div className="grid lg:grid-cols-3 gap-6">
        <form onSubmit={openConfirm} className="lg:col-span-2 bg-white rounded-xl border border-[#D5D9D9] p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold">Checkout</h1>
            <div className="inline-flex rounded-lg border border-[#D5D9D9] bg-[#F7F8F8] p-0.5">
              <button
                type="button"
                onClick={() => setFulfillmentMode("online")}
                className={`px-4 py-2 text-sm font-medium rounded-md ${!isOffline ? "bg-white shadow-sm text-[#0F1111]" : "text-[#565959]"}`}
              >
                Online delivery
              </button>
              <button
                type="button"
                onClick={() => setFulfillmentMode("offline")}
                className={`px-4 py-2 text-sm font-medium rounded-md ${isOffline ? "bg-white shadow-sm text-[#0F1111]" : "text-[#565959]"}`}
              >
                In-store
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Full name</Label><Input required value={form.shipping_name} onChange={(e) => setForm({ ...form, shipping_name: e.target.value })} className="mt-1" /></div>
            <div><Label>Phone</Label><Input required value={form.shipping_phone} onChange={(e) => setForm({ ...form, shipping_phone: e.target.value })} className="mt-1" /></div>
            {isOffline ? (
              <div className="sm:col-span-2">
                <Label>Table number</Label>
                <Input required placeholder="e.g. 12" value={form.table_number} onChange={(e) => setForm({ ...form, table_number: e.target.value })} className="mt-1" />
              </div>
            ) : (
              <>
                <div className="sm:col-span-2"><Label>Address</Label><Input required value={form.shipping_line1} onChange={(e) => setForm({ ...form, shipping_line1: e.target.value })} className="mt-1" /></div>
                <div><Label>City</Label><Input required value={form.shipping_city} onChange={(e) => setForm({ ...form, shipping_city: e.target.value })} className="mt-1" /></div>
                <div><Label>Pincode</Label><Input required value={form.shipping_pincode} onChange={(e) => setForm({ ...form, shipping_pincode: e.target.value })} className="mt-1" /></div>
              </>
            )}
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
            Review & place order
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

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm your order</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-[#565959]">Order type</span>
              <span className="font-medium">{isOffline ? "In-store" : "Online delivery"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#565959]">{isOffline ? "Table" : "Delivery address"}</span>
              <span className="font-medium text-right">{deliverySummary}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#565959]">Contact</span>
              <span className="font-medium text-right">{form.shipping_name} · {form.shipping_phone}</span>
            </div>
            <div className="flex justify-between gap-4 pt-2 border-t border-[#EEE] font-bold">
              <span>Total</span>
              <span>₹{Number(cart.subtotal || 0).toLocaleString()}</span>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setConfirmOpen(false)} disabled={busy}>
              Back
            </Button>
            <Button type="button" className="rounded-xl bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111]" disabled={busy} onClick={placeOrder}>
              {busy ? "Placing order..." : "Place order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
