import { Link, Outlet } from "react-router-dom";
import { Package, ShoppingBag, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import PublicTopNav from "../../components/PublicTopNav";
import { useShopperAuth } from "../../context/ShopperAuthContext";
import { resolveMediaUrl } from "../../lib/api";
import { usePublicPageBranding } from "../../hooks/usePublicPageBranding";
import { storePath, storePublicUrl } from "../../lib/storeApi";
import StoreSearchBox from "./StoreSearchBox";

export default function StoreLayout({ storeName, storeLogoUrl, clientRef, resolvedHost }) {
  const { shopper, logout, api } = useShopperAuth();
  const [cartCount, setCartCount] = useState(0);
  const [announcement, setAnnouncement] = useState("");

  usePublicPageBranding(storeName, storeLogoUrl);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("");
        setAnnouncement(data?.profile?.announcement || "");
      } catch {
        setAnnouncement("");
      }
    })();
  }, [api]);

  useEffect(() => {
    if (!shopper || shopper === false) {
      setCartCount(0);
      return;
    }
    (async () => {
      try {
        const { data } = await api.get("/cart");
        setCartCount(data.item_count || 0);
      } catch {
        setCartCount(0);
      }
    })();
  }, [shopper, api]);

  const homePath = storePath(clientRef, "", resolvedHost);
  const cartPath = storePath(clientRef, "cart", resolvedHost);
  const ordersPath = storePath(clientRef, "orders", resolvedHost);
  const profilePath = storePath(clientRef, "profile", resolvedHost);
  const loginPath = storePath(clientRef, "login", resolvedHost);

  return (
    <div className="min-h-screen bg-[#EAEDED] text-[#111827]">
      <PublicTopNav
        variant="dark"
        title={storeName || "Store"}
        subtitle="Online shop"
        homeHref={homePath}
        siteUrl={storePublicUrl(clientRef, resolvedHost)}
        siteName={storeName || "Store"}
        user={shopper}
        profileHref={shopper && shopper !== false ? profilePath : ""}
        loginHref={!shopper || shopper === false ? loginPath : ""}
        onLogout={logout}
        brandIcon={storeLogoUrl ? (
          <img src={resolveMediaUrl(storeLogoUrl)} alt="" className="w-9 h-9 rounded object-cover shrink-0 bg-white" />
        ) : (
          <div className="w-9 h-9 bg-[#FF9900] rounded flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5 text-[#131921]" />
          </div>
        )}
        trailing={(
          <>
            {shopper && shopper !== false ? (
              <Link to={ordersPath} className="flex flex-col items-center gap-0.5 min-w-[44px] px-1 py-1 rounded-md hover:bg-white/10 hover:text-[#FF9900] text-white">
                <Package className="w-5 h-5" />
                <span className="text-[10px] font-semibold">Orders</span>
              </Link>
            ) : null}
            <Link to={cartPath} className="flex items-center gap-2 bg-[#232F3E] hover:bg-[#37475A] px-3 py-2 rounded-md ml-1">
              <ShoppingCart className="w-5 h-5" />
              <span className="font-bold text-sm">{cartCount}</span>
            </Link>
          </>
        )}
      >
        <StoreSearchBox />
      </PublicTopNav>
      {announcement && (
        <div className="bg-[#FF9900] text-[#111827] text-sm font-medium text-center py-2 px-4">
          {announcement}
        </div>
      )}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet context={{ setCartCount }} />
      </main>
    </div>
  );
}
