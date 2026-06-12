import { Link, Outlet } from "react-router-dom";
import { ShoppingBag, ShoppingCart, User, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { useShopperAuth } from "../../context/ShopperAuthContext";
import { storePath } from "../../lib/storeApi";
import StoreSearchBox from "./StoreSearchBox";

export default function StoreLayout({ storeName, clientRef, resolvedHost }) {
  const { shopper, logout, api } = useShopperAuth();
  const [cartCount, setCartCount] = useState(0);
  const [announcement, setAnnouncement] = useState("");

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
  const loginPath = storePath(clientRef, "login", resolvedHost);

  return (
    <div className="min-h-screen bg-[#EAEDED] text-[#111827]">
      <header className="sticky top-0 z-40 bg-[#131921] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <Link to={homePath} className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 bg-[#FF9900] rounded flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-[#131921]" />
            </div>
            <div>
              <div className="font-bold text-sm leading-tight">{storeName || "Store"}</div>
              <div className="text-[10px] text-white/60 uppercase tracking-wider">Online shop</div>
            </div>
          </Link>

          <StoreSearchBox />

          <div className="flex items-center gap-2 shrink-0">
            {shopper && shopper !== false ? (
              <>
                <Link to={ordersPath} className="hidden sm:flex flex-col text-xs px-2 hover:text-[#FF9900]">
                  <span className="text-white/60">Hello, {shopper.name || "there"}</span>
                  <span className="font-semibold">Your orders</span>
                </Link>
                <Button variant="ghost" size="sm" onClick={logout} className="text-white hover:bg-white/10">
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Link to={loginPath} className="flex items-center gap-1 text-sm px-2 hover:text-[#FF9900]">
                <User className="w-4 h-4" /> Sign in
              </Link>
            )}
            <Link to={cartPath} className="flex items-center gap-2 bg-[#232F3E] hover:bg-[#37475A] px-3 py-2 rounded-md">
              <ShoppingCart className="w-5 h-5" />
              <span className="font-bold text-sm">{cartCount}</span>
            </Link>
          </div>
        </div>
      </header>
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
