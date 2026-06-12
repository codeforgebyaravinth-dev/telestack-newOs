import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import { Clock, LayoutGrid, List, MapPin, Minus, Phone, Plus, ShoppingCart, Sparkles, Tag, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { useShopperAuth } from "../../context/ShopperAuthContext";
import { storePath } from "../../lib/storeApi";
import { formatErr, resolveMediaUrl } from "../../lib/api";
import StoreBannerCarousel from "./StoreBannerCarousel";

const CATALOG_VIEW_KEY = "store_catalog_view";

function CatalogViewToggle({ view, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-[#D5D9D9] bg-white p-0.5 shrink-0">
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          view === "grid" ? "bg-[#232F3E] text-white" : "text-[#565959] hover:bg-[#F7F8F8]"
        }`}
        aria-pressed={view === "grid"}
      >
        <LayoutGrid className="w-4 h-4" />
        <span className="hidden sm:inline">Grid</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("menu")}
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          view === "menu" ? "bg-[#232F3E] text-white" : "text-[#565959] hover:bg-[#F7F8F8]"
        }`}
        aria-pressed={view === "menu"}
      >
        <List className="w-4 h-4" />
        <span className="hidden sm:inline">Menu</span>
      </button>
    </div>
  );
}

export function ProductListRow({ product, clientRef, resolvedHost, onCartUpdate }) {
  const { api, shopper } = useShopperAuth();
  const navigate = useNavigate();
  const path = storePath(clientRef, `product/${product.id}`, resolvedHost);
  const loginPath = storePath(clientRef, "login", resolvedHost);
  const img = resolveMediaUrl(product.image_urls?.[0] || product.image_url);
  const inStock = Number(product.stock || 0) > 0;
  const maxQty = Math.max(1, Number(product.stock || 1));
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);

  const addToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!shopper || shopper === false) {
      toast.error("Please sign in to add items to cart");
      navigate(loginPath);
      return;
    }
    if (!inStock) return;
    setBusy(true);
    try {
      const { data } = await api.post("/cart/items", { product_id: product.id, qty });
      if (onCartUpdate) onCartUpdate(data.item_count || 0);
      toast.success("Added to cart");
    } catch (err) {
      toast.error(formatErr(err.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white border border-[#D5D9D9] rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex items-stretch gap-0">
        <Link to={path} className="w-24 sm:w-28 md:w-32 shrink-0 bg-[#F7F8F8] border-r border-[#E7E7E7]">
          <div className="h-full relative">
            {img ? (
              <img src={img} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
            )}
          </div>
        </Link>
        <div className="flex flex-1 min-w-0 items-center gap-3 p-3 sm:p-4">
          <Link to={path} className="flex-1 min-w-0">
            <h3 className="font-semibold text-[#0F1111] line-clamp-2 leading-snug">{product.name}</h3>
            <p className="mt-1 text-sm text-[#565959] line-clamp-2 leading-relaxed">
              {product.description || "Tap for full product details."}
            </p>
            <div className="mt-2 flex flex-wrap items-baseline gap-2">
              <span className="text-lg font-bold text-[#0F1111]">₹{Number(product.price || 0).toLocaleString()}</span>
              {product.compare_at_price > product.price ? (
                <span className="text-sm text-[#565959] line-through">₹{Number(product.compare_at_price).toLocaleString()}</span>
              ) : null}
              {!inStock ? (
                <span className="text-xs font-medium text-red-600">Out of stock</span>
              ) : null}
            </div>
          </Link>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            {inStock ? (
              <div className="flex items-center border border-[#D5D9D9] rounded-md bg-white self-center sm:self-auto">
                <button
                  type="button"
                  className="p-2 hover:bg-gray-50 disabled:opacity-40"
                  disabled={qty <= 1 || busy}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setQty((n) => Math.max(1, n - 1));
                  }}
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-3 min-w-[2.5rem] text-center font-medium text-sm">{qty}</span>
                <button
                  type="button"
                  className="p-2 hover:bg-gray-50 disabled:opacity-40"
                  disabled={qty >= maxQty || busy}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setQty((n) => Math.min(maxQty, n + 1));
                  }}
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : null}
            <Button
              type="button"
              disabled={!inStock || busy}
              onClick={addToCart}
              className="rounded-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] border border-[#FCD200] px-4 sm:px-5 h-10 text-sm font-semibold"
            >
              <ShoppingCart className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">{busy ? "Adding..." : "Add to cart"}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductCard({ product, clientRef, resolvedHost, compact = false }) {
  const path = storePath(clientRef, `product/${product.id}`, resolvedHost);
  const img = resolveMediaUrl(product.image_urls?.[0] || product.image_url);
  const discount = product.compare_at_price > product.price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  return (
    <Link
      to={path}
      className={`bg-white rounded-lg border border-[#D5D9D9] overflow-hidden hover:shadow-lg transition-shadow flex flex-col ${
        compact ? "w-[180px] shrink-0" : "h-full"
      }`}
    >
      <div className="aspect-square w-full bg-[#F7F8F8] relative shrink-0">
        {img ? (
          <img src={img} alt={product.name} className="absolute inset-0 w-full h-full object-contain p-2" style={{ objectFit: "cover" }} />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
        )}
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-[#CC0C39] text-white text-[10px] font-bold px-2 py-0.5 rounded">
            {discount}% off
          </span>
        )}
      </div>
      <div className={`${compact ? "p-2 min-h-[104px]" : "p-3"} flex flex-col flex-1`}>
        <div className={`${compact ? "text-xs h-10" : "text-sm"} line-clamp-2`}>{product.name}</div>
        <div className={`mt-2 flex items-baseline gap-2 ${compact ? "h-5" : ""}`}>
          <span className={`${compact ? "text-base" : "text-lg"} font-bold`}>₹{Number(product.price || 0).toLocaleString()}</span>
          {product.compare_at_price > product.price ? (
            <span className="text-xs text-[#565959] line-through">₹{Number(product.compare_at_price).toLocaleString()}</span>
          ) : compact ? (
            <span className="text-xs invisible select-none" aria-hidden="true">—</span>
          ) : null}
        </div>
        <div className={compact ? "h-4 mt-1" : "mt-1"}>
          {product.stock <= 0 ? (
            <div className="text-xs text-red-600">Out of stock</div>
          ) : compact ? (
            <span className="text-xs invisible select-none" aria-hidden="true">.</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function ProductRow({ title, subtitle, products, clientRef, resolvedHost, viewAllTo }) {
  if (!products?.length) return null;
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          {subtitle && <p className="text-sm text-[#565959] mt-0.5">{subtitle}</p>}
        </div>
        {viewAllTo && (
          <Link to={viewAllTo} className="text-sm text-[#007185] hover:text-[#C45500] hover:underline shrink-0">
            See all
          </Link>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin items-start">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} clientRef={clientRef} resolvedHost={resolvedHost} compact />
        ))}
      </div>
    </section>
  );
}

function CategoryGrid({ categories, clientRef, resolvedHost }) {
  if (!categories.length) return null;
  const searchBase = storePath(clientRef, "search", resolvedHost);
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold">Shop by category</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {categories.map((cat, i) => (
          <Link
            key={cat.id}
            to={`${searchBase}?category_id=${encodeURIComponent(cat.id)}`}
            className="bg-white border border-[#D5D9D9] rounded-lg p-4 text-center hover:border-[#FF9900] hover:shadow-md transition-all"
          >
            <div
              className="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-white font-bold text-lg mb-2"
              style={{ background: `hsl(${(i * 47) % 360} 55% 42%)` }}
            >
              {(cat.name || "?").charAt(0).toUpperCase()}
            </div>
            <div className="text-sm font-medium line-clamp-2">{cat.name}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function StoreHome() {
  const { api, clientRef, resolvedHost } = useShopperAuth();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [homeRes, prodRes] = await Promise.all([
          api.get(""),
          api.get("/products", { params: { limit: 24, sort: "newest" } }),
        ]);
        setStore(homeRes.data);
        setProducts(prodRes.data.items || []);
      } catch {
        setStore(null);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [api]);

  if (loading) {
    return <div className="text-center py-20 text-[#565959]">Loading store...</div>;
  }

  const profile = store?.profile || {};
  const categories = store?.categories || [];
  const banners = store?.banner_slides?.length ? store.banner_slides : profile.banner_slides || [];
  const recentProducts = store?.recent_products || [];
  const deals = store?.deals || [];
  const searchPath = storePath(clientRef, "search", resolvedHost);

  const resolveBannerLink = (link) => {
    const text = String(link || "").trim();
    if (!text) return null;
    if (text.startsWith("http://") || text.startsWith("https://")) return text;
    if (text.startsWith("/")) return text;
    if (text.startsWith("product/")) return storePath(clientRef, text, resolvedHost);
    if (text.startsWith("search")) return storePath(clientRef, text, resolvedHost);
    return storePath(clientRef, `search?q=${encodeURIComponent(text)}`, resolvedHost);
  };

  const hasHero = banners.length > 0;

  return (
    <div className="space-y-8">
      {hasHero ? (
        <StoreBannerCarousel slides={banners} resolveLink={resolveBannerLink} />
      ) : (
        <div className="rounded-xl overflow-hidden bg-gradient-to-r from-[#232F3E] to-[#37475A] text-white p-6 md:p-10">
          <div className="max-w-2xl">
            <h1 className="text-2xl md:text-4xl font-bold">{profile.specialty || store?.name || "Welcome"}</h1>
            <p className="mt-2 text-white/80 text-sm md:text-base">{profile.description || "Browse our products and order online."}</p>
            {profile.hours && <p className="mt-2 text-xs text-white/60 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {profile.hours}</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-[#D5D9D9] rounded-lg px-4 py-3 flex items-center gap-3">
          <Truck className="w-5 h-5 text-[#FF9900]" />
          <div>
            <div className="text-xs font-bold uppercase tracking-wide">Fast delivery</div>
            <div className="text-[11px] text-[#565959]">Order online anytime</div>
          </div>
        </div>
        <div className="bg-white border border-[#D5D9D9] rounded-lg px-4 py-3 flex items-center gap-3">
          <Tag className="w-5 h-5 text-[#FF9900]" />
          <div>
            <div className="text-xs font-bold uppercase tracking-wide">Best prices</div>
            <div className="text-[11px] text-[#565959]">Deals updated regularly</div>
          </div>
        </div>
        <div className="bg-white border border-[#D5D9D9] rounded-lg px-4 py-3 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-[#FF9900]" />
          <div>
            <div className="text-xs font-bold uppercase tracking-wide">New arrivals</div>
            <div className="text-[11px] text-[#565959]">Fresh products weekly</div>
          </div>
        </div>
        <div className="bg-white border border-[#D5D9D9] rounded-lg px-4 py-3 flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${profile.is_open !== false ? "bg-emerald-500" : "bg-red-500"}`} />
          <div>
            <div className="text-xs font-bold uppercase tracking-wide">{profile.is_open !== false ? "Store open" : "Store closed"}</div>
            <div className="text-[11px] text-[#565959]">{profile.hours || "Check hours below"}</div>
          </div>
        </div>
      </div>

      {(store?.phone || store?.address || profile.description) && (
        <div className="bg-white border border-[#D5D9D9] rounded-lg p-4 flex flex-wrap gap-4 text-sm text-[#565959]">
          {store?.phone && (
            <span className="inline-flex items-center gap-1.5"><Phone className="w-4 h-4" /> {store.phone}</span>
          )}
          {store?.address && (
            <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {store.address}</span>
          )}
          {profile.description && !hasHero && (
            <span className="w-full md:w-auto">{profile.description}</span>
          )}
        </div>
      )}

      <CategoryGrid categories={categories} clientRef={clientRef} resolvedHost={resolvedHost} />

      <ProductRow
        title="New arrivals"
        subtitle="Recently added to the store"
        products={recentProducts}
        clientRef={clientRef}
        resolvedHost={resolvedHost}
        viewAllTo={`${searchPath}?sort=newest`}
      />

      <ProductRow
        title="Deals & offers"
        subtitle="Save on selected products"
        products={deals}
        clientRef={clientRef}
        resolvedHost={resolvedHost}
        viewAllTo={searchPath}
      />

      <section>
        <div className="flex items-end justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold">All products</h2>
          <Link to={`${searchPath}?view=menu`} className="text-sm text-[#007185] hover:text-[#C45500] hover:underline">Browse catalog</Link>
        </div>
        {products.length === 0 ? (
          <div className="bg-white rounded-lg p-10 text-center text-[#565959] border border-[#D5D9D9]">No products available yet.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} clientRef={clientRef} resolvedHost={resolvedHost} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export function StoreSearch() {
  const { api, clientRef, resolvedHost } = useShopperAuth();
  const { setCartCount } = useOutletContext() || {};
  const [params, setSearchParams] = useSearchParams();
  const q = params.get("q") || "";
  const categoryId = params.get("category_id") || "";
  const viewParam = params.get("view");
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState(q ? "relevance" : "newest");
  const [view, setView] = useState(() => {
    if (viewParam === "menu" || viewParam === "grid") return viewParam;
    try {
      const stored = localStorage.getItem(CATALOG_VIEW_KEY);
      if (stored === "menu" || stored === "grid") return stored;
    } catch {}
    return "grid";
  });

  const setCatalogView = (next) => {
    setView(next);
    try {
      localStorage.setItem(CATALOG_VIEW_KEY, next);
    } catch {}
    const nextParams = new URLSearchParams(params);
    if (next === "grid") nextParams.delete("view");
    else nextParams.set("view", next);
    setSearchParams(nextParams, { replace: true });
  };

  useEffect(() => {
    if (viewParam === "menu" || viewParam === "grid") {
      setView(viewParam);
    }
  }, [viewParam]);

  useEffect(() => {
    if (q) setSort((prev) => (prev === "newest" ? "relevance" : prev));
  }, [q]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/products", {
          params: {
            q: q || undefined,
            category_id: categoryId || undefined,
            sort: q ? sort : (sort === "relevance" ? "newest" : sort),
            limit: 48,
          },
        });
        setProducts(data.items || []);
        setTotal(data.total || 0);
      } catch {
        setProducts([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    })();
  }, [api, q, categoryId, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">
          {q ? (
            <>Results for &quot;{q}&quot;</>
          ) : categoryId ? (
            "Category"
          ) : (
            "Browse catalog"
          )}
          <span className="text-[#565959] font-normal text-base ml-2">({total})</span>
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <CatalogViewToggle view={view} onChange={setCatalogView} />
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="border border-[#D5D9D9] rounded-md px-3 py-2 text-sm bg-white">
            {q && <option value="relevance">Featured</option>}
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>
      {loading ? (
        <div className="text-center py-16 text-[#565959]">Searching...</div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-lg p-10 text-center border border-[#D5D9D9]">
          {q ? `No products found for "${q}". Try another name or tag.` : "No products found."}
        </div>
      ) : view === "menu" ? (
        <div className="">
          {products.map((p) => (
            <ProductListRow
              key={p.id}
              product={p}
              clientRef={clientRef}
              resolvedHost={resolvedHost}
              onCartUpdate={setCartCount}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} clientRef={clientRef} resolvedHost={resolvedHost} />
          ))}
        </div>
      )}
    </div>
  );
}
