import { useState } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useShopperAuth } from "../../context/ShopperAuthContext";
import { formatErr } from "../../lib/api";
import { storePath } from "../../lib/storeApi";

export default function StoreAuth() {
  const [params] = useSearchParams();
  const location = useLocation();
  const initialMode = location.pathname.endsWith("/signup") || params.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState(initialMode);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "", phone: "" });
  const { login, signup, clientRef, resolvedHost } = useShopperAuth();
  const navigate = useNavigate();
  const homePath = storePath(clientRef, "", resolvedHost);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        await signup(form);
        toast.success("Account created");
      } else {
        await login(form.email, form.password);
        toast.success("Signed in");
      }
      navigate(homePath);
    } catch (err) {
      toast.error(formatErr(err.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl border border-[#D5D9D9] p-6 md:p-8 shadow-sm">
      <h1 className="text-2xl font-bold mb-1">{mode === "signup" ? "Create account" : "Sign in"}</h1>
      <p className="text-sm text-[#565959] mb-6">Shop with this store using your email and password.</p>
      <form onSubmit={submit} className="space-y-4">
        {mode === "signup" && (
          <>
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1" /></div>
          </>
        )}
        <div><Label>Email</Label><Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" /></div>
        <div><Label>Password</Label><Input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1" /></div>
        <Button type="submit" disabled={busy} className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] rounded-full">
          {busy ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
        </Button>
      </form>
      <div className="mt-4 text-center text-sm">
        {mode === "signup" ? (
          <>Already have an account? <button type="button" className="text-[#007185] hover:text-[#C45500]" onClick={() => setMode("login")}>Sign in</button></>
        ) : (
          <>New customer? <button type="button" className="text-[#007185] hover:text-[#C45500]" onClick={() => setMode("signup")}>Create account</button></>
        )}
      </div>
      <Link to={homePath} className="block text-center text-sm text-[#565959] mt-4 hover:text-[#007185]">← Back to store</Link>
    </div>
  );
}
