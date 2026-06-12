import { useEffect, useState } from "react";
import { Route, Routes, useParams } from "react-router-dom";
import axios from "axios";
import { ShopperAuthProvider } from "../../context/ShopperAuthContext";
import { isCustomStoreHost, publicStoreBase } from "../../lib/storeApi";
import StoreLayout from "./StoreLayout";
import { StoreHome, StoreSearch } from "./StoreCatalog";
import StoreProductDetail from "./StoreProductDetail";
import StoreCart from "./StoreCart";
import StoreCheckout from "./StoreCheckout";
import StoreOrders from "./StoreOrders";
import StoreAuth from "./StoreAuth";
import StoreProfile from "./StoreProfile";

function StoreRoutes({ clientRef, resolvedHost, storeName, storeLogoUrl }) {
  return (
    <ShopperAuthProvider clientRef={clientRef} resolvedHost={resolvedHost}>
      <Routes>
        <Route element={<StoreLayout storeName={storeName} storeLogoUrl={storeLogoUrl} clientRef={clientRef} resolvedHost={resolvedHost} />}>
          <Route index element={<StoreHome />} />
          <Route path="search" element={<StoreSearch />} />
          <Route path="product/:productId" element={<StoreProductDetail />} />
          <Route path="cart" element={<StoreCart />} />
          <Route path="checkout" element={<StoreCheckout />} />
          <Route path="orders" element={<StoreOrders />} />
          <Route path="profile" element={<StoreProfile />} />
          <Route path="login" element={<StoreAuth />} />
          <Route path="signup" element={<StoreAuth />} />
        </Route>
      </Routes>
    </ShopperAuthProvider>
  );
}

export default function PublicStore({ resolvedHost = null, clientRef: propClientRef = null }) {
  const { clientRef: routeClientRef } = useParams();
  const [clientRef, setClientRef] = useState(propClientRef || routeClientRef || "");
  const [storeName, setStoreName] = useState("");
  const [storeLogoUrl, setStoreLogoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        let ref = propClientRef || routeClientRef || "";
        const host = resolvedHost || (typeof window !== "undefined" ? window.location.hostname : "");
        if (!ref && isCustomStoreHost(host)) {
          const base = `${window.location.origin}/api/public`;
          const { data } = await axios.get(`${base}/resolve-host`, { params: { host } });
          ref = data.public_booking_slug || data.client_id;
          if (data.vertical && data.vertical !== "retailer") {
            setError("This domain is not configured as a retail store.");
            setLoading(false);
            return;
          }
        }
        if (!ref) {
          setError("Store not found");
          setLoading(false);
          return;
        }
        setClientRef(ref);
        const apiBase = publicStoreBase(resolvedHost);
        const { data } = await axios.get(`${apiBase}/store/${encodeURIComponent(ref)}`);
        setStoreName(data.name || "");
        setStoreLogoUrl(data.profile?.image_url || "");
      } catch {
        setError("Store not found or unavailable.");
      } finally {
        setLoading(false);
      }
    })();
  }, [propClientRef, routeClientRef, resolvedHost]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EAEDED]">
        <div className="text-sm text-[#565959] font-mono uppercase tracking-widest animate-pulse">Loading store...</div>
      </div>
    );
  }

  if (error || !clientRef) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EAEDED]">
        <div className="text-center">
          <div className="text-lg font-bold text-[#111827]">{error || "Store not found"}</div>
        </div>
      </div>
    );
  }

  return <StoreRoutes clientRef={clientRef} resolvedHost={resolvedHost} storeName={storeName} storeLogoUrl={storeLogoUrl} />;
}
