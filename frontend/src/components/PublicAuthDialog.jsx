import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { formatErr } from "../lib/api";

export default function PublicAuthDialog({
  open,
  onOpenChange,
  initialMode = "login",
  onLogin,
  onRequestSignup,
  onVerifySignup,
  onResendSignupCode,
}) {
  const [mode, setMode] = useState(initialMode);
  const [signupStep, setSignupStep] = useState("form");
  const [loginMethod, setLoginMethod] = useState("email");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "", phone: "", code: "", identifier: "" });

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setSignupStep("form");
    }
  }, [open, initialMode]);

  const close = () => onOpenChange(false);

  const submitSignup = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onRequestSignup({
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
      await onVerifySignup(form.email, form.code);
      toast.success("Email verified — welcome!");
      close();
    } catch (err) {
      toast.error(formatErr(err.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  const resendCode = async () => {
    setBusy(true);
    try {
      await onResendSignupCode(form.email);
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
      if (loginMethod === "email") payload.email = form.identifier.trim();
      else payload.phone = form.identifier.trim();
      await onLogin(payload);
      toast.success("Signed in");
      close();
    } catch (err) {
      toast.error(formatErr(err.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  if (mode === "signup" && signupStep === "verify") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Verify your email</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitVerify} className="space-y-4">
            <p className="text-sm text-[#565959]">
              Enter the 6-digit code sent to <span className="font-medium text-[#0F1111]">{form.email}</span>
            </p>
            <div>
              <Label>Verification code</Label>
              <Input
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={6}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                className="mt-1 tracking-[0.3em] text-center text-lg font-semibold rounded-xl"
              />
            </div>
            <DialogFooter className="flex-col sm:flex-col gap-2">
              <Button type="submit" disabled={busy || form.code.length < 6} className="w-full rounded-xl">
                {busy ? "Verifying..." : "Verify & create account"}
              </Button>
              <button type="button" className="text-sm text-[#007185]" disabled={busy} onClick={resendCode}>Resend code</button>
              <button type="button" className="text-sm text-[#565959]" onClick={() => setSignupStep("form")}>← Change signup details</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "signup" ? "Create account" : "Sign in"}</DialogTitle>
        </DialogHeader>
        {mode === "login" && (
          <div className="inline-flex rounded-lg border border-[#D5D9D9] bg-[#F7F8F8] p-0.5 w-full mb-1">
            <button type="button" onClick={() => setLoginMethod("email")} className={`flex-1 py-2 text-sm font-medium rounded-md ${loginMethod === "email" ? "bg-white shadow-sm" : "text-[#565959]"}`}>Email</button>
            <button type="button" onClick={() => setLoginMethod("phone")} className={`flex-1 py-2 text-sm font-medium rounded-md ${loginMethod === "phone" ? "bg-white shadow-sm" : "text-[#565959]"}`}>Phone</button>
          </div>
        )}
        <form onSubmit={mode === "signup" ? submitSignup : submitLogin} className="space-y-4">
          {mode === "signup" && (
            <>
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl mt-1" /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-xl mt-1" /></div>
              <div><Label>Email</Label><Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl mt-1" /></div>
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
                className="rounded-xl mt-1"
              />
            </div>
          )}
          <div><Label>Password</Label><Input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="rounded-xl mt-1" /></div>
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button type="submit" disabled={busy} className="w-full rounded-xl bg-[#111827] text-white">
              {busy ? "Please wait..." : mode === "signup" ? "Send verification code" : "Sign in"}
            </Button>
            <button type="button" className="text-sm text-[#007185]" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setSignupStep("form"); }}>
              {mode === "signup" ? "Already have an account? Sign in" : "New here? Create account"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
