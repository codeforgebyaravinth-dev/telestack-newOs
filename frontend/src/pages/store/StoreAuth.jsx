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
  const [signupStep, setSignupStep] = useState("form");
  const [loginMethod, setLoginMethod] = useState("email");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "", phone: "", code: "", identifier: "" });
  const { login, requestSignup, verifySignup, resendSignupCode, clientRef, resolvedHost } = useShopperAuth();
  const navigate = useNavigate();
  const homePath = storePath(clientRef, "", resolvedHost);

  const switchToLogin = () => {
    setMode("login");
    setSignupStep("form");
  };

  const switchToSignup = () => {
    setMode("signup");
    setSignupStep("form");
  };

  const submitSignup = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await requestSignup({
        email: form.email,
        password: form.password,
        name: form.name,
        phone: form.phone,
      });
      setSignupStep("verify");
      toast.success("Verification code sent to your email");
    } catch (err) {
      toast.error(formatErr(err.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  const submitVerify = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await verifySignup(form.email, form.code);
      toast.success("Email verified — welcome!");
      navigate(homePath);
    } catch (err) {
      toast.error(formatErr(err.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  const resendCode = async () => {
    setBusy(true);
    try {
      await resendSignupCode(form.email);
      toast.success("New code sent");
    } catch (err) {
      toast.error(formatErr(err.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { password: form.password };
      if (loginMethod === "email") {
        payload.email = form.identifier.trim();
      } else {
        payload.phone = form.identifier.trim();
      }
      await login(payload);
      toast.success("Signed in");
      navigate(homePath);
    } catch (err) {
      toast.error(formatErr(err.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  if (mode === "signup" && signupStep === "verify") {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl border border-[#D5D9D9] p-6 md:p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-1">Verify your email</h1>
        <p className="text-sm text-[#565959] mb-6">
          Enter the 6-digit code sent to <span className="font-medium text-[#0F1111]">{form.email}</span>
        </p>
        <form onSubmit={submitVerify} className="space-y-4">
          <div>
            <Label>Verification code</Label>
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={6}
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.replace(/\D/g, "").slice(0, 6) })}
              className="mt-1 tracking-[0.3em] text-center text-lg font-semibold"
              placeholder="000000"
            />
          </div>
          <Button type="submit" disabled={busy || form.code.length < 6} className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] rounded-full">
            {busy ? "Verifying..." : "Verify & create account"}
          </Button>
        </form>
        <div className="mt-4 flex flex-col gap-2 text-center text-sm">
          <button type="button" className="text-[#007185] hover:text-[#C45500]" disabled={busy} onClick={resendCode}>
            Resend code
          </button>
          <button type="button" className="text-[#565959] hover:text-[#007185]" onClick={() => setSignupStep("form")}>
            ← Change signup details
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl border border-[#D5D9D9] p-6 md:p-8 shadow-sm">
      <h1 className="text-2xl font-bold mb-1">{mode === "signup" ? "Create account" : "Sign in"}</h1>
      <p className="text-sm text-[#565959] mb-6">
        {mode === "signup"
          ? "Sign up with email verification to shop at this store."
          : "Sign in with your email or phone number and password."}
      </p>

      {mode === "login" && (
        <div className="inline-flex rounded-lg border border-[#D5D9D9] bg-[#F7F8F8] p-0.5 mb-4 w-full">
          <button
            type="button"
            onClick={() => setLoginMethod("email")}
            className={`flex-1 py-2 text-sm font-medium rounded-md ${loginMethod === "email" ? "bg-white shadow-sm" : "text-[#565959]"}`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod("phone")}
            className={`flex-1 py-2 text-sm font-medium rounded-md ${loginMethod === "phone" ? "bg-white shadow-sm" : "text-[#565959]"}`}
          >
            Phone
          </button>
        </div>
      )}

      <form onSubmit={mode === "signup" ? submitSignup : submitLogin} className="space-y-4">
        {mode === "signup" && (
          <>
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1" placeholder="10-digit mobile" /></div>
            <div><Label>Email</Label><Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" /></div>
          </>
        )}
        {mode === "login" && (
          <div>
            <Label>{loginMethod === "email" ? "Email" : "Phone"}</Label>
            <Input
              type={loginMethod === "email" ? "email" : "tel"}
              required
              value={form.identifier}
              onChange={(e) => setForm({ ...form, identifier: e.target.value })}
              className="mt-1"
              placeholder={loginMethod === "email" ? "you@example.com" : "9876543210"}
            />
          </div>
        )}
        <div><Label>Password</Label><Input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1" /></div>
        <Button type="submit" disabled={busy} className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] rounded-full">
          {busy ? "Please wait..." : mode === "signup" ? "Send verification code" : "Sign in"}
        </Button>
      </form>
      <div className="mt-4 text-center text-sm">
        {mode === "signup" ? (
          <>Already have an account? <button type="button" className="text-[#007185] hover:text-[#C45500]" onClick={switchToLogin}>Sign in</button></>
        ) : (
          <>New customer? <button type="button" className="text-[#007185] hover:text-[#C45500]" onClick={switchToSignup}>Create account</button></>
        )}
      </div>
      <Link to={homePath} className="block text-center text-sm text-[#565959] mt-4 hover:text-[#007185]">← Back to store</Link>
    </div>
  );
}
