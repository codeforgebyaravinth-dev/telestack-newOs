import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Package, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useShopperAuth } from "../../context/ShopperAuthContext";
import { formatErr } from "../../lib/api";
import { storePath } from "../../lib/storeApi";

export default function StoreProfile() {
  const { api, shopper, loading: authLoading, logout, refresh, clientRef, resolvedHost } = useShopperAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [busy, setBusy] = useState(false);

  const loginPath = storePath(clientRef, "login", resolvedHost);
  const homePath = storePath(clientRef, "", resolvedHost);
  const ordersPath = storePath(clientRef, "orders", resolvedHost);

  useEffect(() => {
    if (!authLoading && shopper && shopper !== false) {
      setForm({
        name: shopper.name || "",
        phone: shopper.phone || "",
        email: shopper.email || "",
      });
    }
  }, [shopper, authLoading]);

  if (authLoading) {
    return <div className="text-center py-20 text-[#565959]">Loading profile...</div>;
  }

  if (!shopper || shopper === false) {
    return (
      <div className="bg-white rounded-xl border border-[#D5D9D9] p-10 text-center max-w-lg mx-auto">
        <User className="w-10 h-10 mx-auto text-[#565959] mb-3" />
        <p className="mb-4 text-[#565959]">Sign in to view and edit your profile.</p>
        <Button onClick={() => navigate(loginPath)} className="bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111]">
          Sign in
        </Button>
      </div>
    );
  }

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put("/auth/me", { name: form.name, phone: form.phone });
      await refresh();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(formatErr(err.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Signed out");
    navigate(homePath);
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="bg-white rounded-xl border border-[#D5D9D9] p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-[#232F3E] text-white flex items-center justify-center font-bold text-lg">
            {(form.name || form.email || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">My profile</h1>
            <p className="text-sm text-[#565959]">Manage your account details</p>
          </div>
        </div>

        <form onSubmit={save} className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1"
              placeholder="Your name"
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1"
              placeholder="Mobile number"
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={form.email} readOnly disabled className="mt-1 bg-[#F7F8F8]" />
            <p className="text-xs text-[#565959] mt-1">Email cannot be changed here.</p>
          </div>
          <Button
            type="submit"
            disabled={busy}
            className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] rounded-full"
          >
            {busy ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-[#D5D9D9] p-4 flex flex-wrap gap-3">
        <Link
          to={ordersPath}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#007185] hover:text-[#C45500]"
        >
          <Package className="w-4 h-4" />
          Your orders
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#565959] hover:text-red-600 ml-auto"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>

      <Link to={homePath} className="block text-center text-sm text-[#565959] hover:text-[#007185]">
        ← Back to store
      </Link>
    </div>
  );
}
