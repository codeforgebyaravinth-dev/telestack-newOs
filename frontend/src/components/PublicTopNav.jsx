import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LogOut, QrCode, Smartphone, User } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

function NavIconButton({ label, Icon, onClick, variant = "dark" }) {
  const cls = variant === "dark"
    ? "flex flex-col items-center justify-center gap-0.5 min-w-[44px] px-1 py-1 rounded-md hover:bg-white/10 hover:text-[#FF9900] text-white"
    : "flex flex-col items-center justify-center gap-0.5 min-w-[44px] px-1 py-1 rounded-md hover:bg-[#F3F4F6] text-[#374151]";
  return (
    <button type="button" onClick={onClick} className={cls} aria-label={label}>
      <Icon className="w-5 h-5 shrink-0" />
      <span className="text-[10px] font-semibold leading-none">{label}</span>
    </button>
  );
}

function NavIconLink({ to, label, Icon, variant = "dark" }) {
  const cls = variant === "dark"
    ? "flex flex-col items-center justify-center gap-0.5 min-w-[44px] px-1 py-1 rounded-md hover:bg-white/10 hover:text-[#FF9900] text-white"
    : "flex flex-col items-center justify-center gap-0.5 min-w-[44px] px-1 py-1 rounded-md hover:bg-[#F3F4F6] text-[#374151]";
  return (
    <Link to={to} className={cls} aria-label={label}>
      <Icon className="w-5 h-5 shrink-0" />
      <span className="text-[10px] font-semibold leading-none">{label}</span>
    </Link>
  );
}

function QrCodeDialog({ open, onOpenChange, siteUrl, siteName }) {
  const qrSrc = useMemo(
    () => `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeURIComponent(siteUrl || "")}`,
    [siteUrl]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[#FF9900]" />
            Scan to open on mobile
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
            <img src={qrSrc} alt={`QR code for ${siteName || "site"}`} width={200} height={200} className="w-[200px] h-[200px] block" />
          </div>
          <p className="text-sm text-[#565959] leading-relaxed">
            Point your phone camera at this code to open {siteName || "this page"} in the browser.
          </p>
          <p className="inline-flex items-center gap-1.5 text-xs text-[#6B7280]">
            <Smartphone className="w-3.5 h-3.5" />
            Works on iPhone and Android
          </p>
          <p className="text-xs text-[#007185] break-all font-mono w-full">{siteUrl}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AccountDialog({ open, onOpenChange, user, onLogout }) {
  if (!user || user === false) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle>My account</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#232F3E] text-white flex items-center justify-center font-bold text-lg">
              {(user.name || user.email || "?").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-semibold truncate">{user.name || "Customer"}</div>
              <div className="text-sm text-[#6B7280] truncate">{user.email}</div>
              {user.phone ? <div className="text-sm text-[#6B7280]">{user.phone}</div> : null}
            </div>
          </div>
          {onLogout ? (
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => {
                onLogout();
                onOpenChange(false);
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PublicTopNav({
  title,
  subtitle,
  homeHref,
  brandIcon,
  siteUrl,
  siteName,
  variant = "light",
  user = null,
  profileHref = "",
  loginHref = "",
  onSignIn,
  onLogout,
  trailing = null,
  children = null,
}) {
  const [qrOpen, setQrOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const isDark = variant === "dark";
  const shell = isDark
    ? "sticky top-0 z-40 bg-[#131921] text-white shadow-md"
    : "sticky top-0 z-40 backdrop-blur-md bg-white/90 border-b border-[#E5E7EB]/80 shadow-sm text-[#111827]";
  const subText = isDark ? "text-white/60" : "text-[#6B7280]";

  const accountControl = (() => {
    if (user && user !== false) {
      if (profileHref) return <NavIconLink to={profileHref} label="Account" Icon={User} variant={variant} />;
      return <NavIconButton label="Account" Icon={User} variant={variant} onClick={() => setAccountOpen(true)} />;
    }
    if (loginHref) return <NavIconLink to={loginHref} label="Sign in" Icon={User} variant={variant} />;
    if (onSignIn) return <NavIconButton label="Sign in" Icon={User} variant={variant} onClick={onSignIn} />;
    return null;
  })();

  const brand = homeHref ? (
    <Link to={homeHref} className="flex items-center gap-2 shrink-0 min-w-0">
      {brandIcon}
      <div className="min-w-0">
        <div className="font-bold text-sm leading-tight truncate">{title}</div>
        {subtitle ? <div className={`text-[10px] uppercase tracking-wider truncate ${subText}`}>{subtitle}</div> : null}
      </div>
    </Link>
  ) : (
    <div className="flex items-center gap-2 shrink-0 min-w-0">
      {brandIcon}
      <div className="min-w-0">
        <div className={`font-bold text-sm leading-tight truncate ${isDark ? "" : "font-display font-extrabold text-lg tracking-tight"}`}>{title}</div>
        {subtitle ? <div className={`text-[10px] uppercase tracking-wider truncate ${subText}`}>{subtitle}</div> : null}
      </div>
    </div>
  );

  return (
    <>
      <header className={shell}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          {brand}
          {children ? <div className="flex-1 min-w-0">{children}</div> : null}
          <div className="flex items-center justify-end gap-1 sm:gap-2 shrink-0">
            <NavIconButton label="QR" Icon={QrCode} variant={variant} onClick={() => setQrOpen(true)} />
            {accountControl}
            {trailing}
          </div>
        </div>
      </header>
      <QrCodeDialog open={qrOpen} onOpenChange={setQrOpen} siteUrl={siteUrl} siteName={siteName || title} />
      <AccountDialog open={accountOpen} onOpenChange={setAccountOpen} user={user} onLogout={onLogout} />
    </>
  );
}
