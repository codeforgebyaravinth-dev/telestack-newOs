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

const LIST_ROW_HEIGHT = "h-[140px]";

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
    <div className={`bg-white border border-[#D5D9D9] rounded-lg overflow-hidden hover:shadow-md transition-shadow ${LIST_ROW_HEIGHT}`}>
      <div className="flex h-full">
        <Link
          to={path}
          className="h-full w-[140px] shrink-0 overflow-hidden bg-[#F7F8F8] border-r border-[#E7E7E7]"
        >
          {img ? (
            <img src={img} alt={product.name} className="block w-full h-full object-cover" />
          ) : (
            <div className="block w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
          )}
        </Link>
        <div className="flex flex-1 min-w-0 h-full items-center gap-2 sm:gap-3 px-3 sm:px-4">
          <Link to={path} className="flex-1 min-w-0 overflow-hidden">
            <h3 className="font-semibold text-[#0F1111] text-sm sm:text-base line-clamp-2 leading-snug">{product.name}</h3>
            <p className="mt-0.5 text-xs sm:text-sm text-[#565959] line-clamp-2 leading-snug">
              {product.description || "Tap for full product details."}
            </p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0">
              <span className="text-base sm:text-lg font-bold text-[#0F1111]">₹{Number(product.price || 0).toLocaleString()}</span>
              {product.compare_at_price > product.price ? (
                <span className="text-xs sm:text-sm text-[#565959] line-through">₹{Number(product.compare_at_price).toLocaleString()}</span>
              ) : null}
              {!inStock ? (
                <span className="text-xs font-medium text-red-600">Out of stock</span>
              ) : null}
            </div>
          </Link>
          <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
            {inStock ? (
              <div className="flex items-center border border-[#D5D9D9] rounded-md bg-white">
                <button
                  type="button"
                  className="p-1.5 sm:p-2 hover:bg-gray-50 disabled:opacity-40"
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
                <span className="px-2 sm:px-3 min-w-[2rem] text-center font-medium text-sm">{qty}</span>
                <button
                  type="button"
                  className="p-1.5 sm:p-2 hover:bg-gray-50 disabled:opacity-40"
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
              className="rounded-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] border border-[#FCD200] px-3 sm:px-5 h-9 sm:h-10 text-sm font-semibold"
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

const HOME_PAGE_SIZE = 12;

function StorePagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  const addPage = (n) => {
    if (n >= 1 && n <= totalPages && !pages.includes(n)) pages.push(n);
  };
  addPage(1);
  if (page > 3) pages.push("…");
  for (let n = Math.max(2, page - 1); n <= Math.min(totalPages - 1, page + 1); n += 1) addPage(n);
  if (page < totalPages - 2) pages.push("…");
  if (totalPages > 1) addPage(totalPages);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded-md"
      >
        Previous
      </Button>
      {pages.map((n, i) =>
        n === "…" ? (
          <span key={`ellipsis-${i}`} className="px-2 text-[#565959]">…</span>
        ) : (
          <Button
            key={n}
            type="button"
            variant={n === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(n)}
            className={`min-w-9 rounded-md ${n === page ? "bg-[#232F3E] hover:bg-[#37475A]" : ""}`}
          >
            {n}
          </Button>
        )
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="rounded-md"
      >
        Next
      </Button>
    </div>
  );
}

function HomeProductList({ api, categories = [], clientRef, resolvedHost, onCartUpdate }) {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const totalPages = Math.max(1, Math.ceil(total / HOME_PAGE_SIZE));
  const selectedCategory = categories.find((c) => c.id === categoryId);


  const categorySortMap = useMemo(() => {
    const map = new Map();
    categories.forEach((cat) => {
      map.set(cat.id, cat.sort_order || 0);
    });
    return map;
  }, [categories]);

  // Sort products by category sort_order
  const sortedProducts = useMemo(() => {
    if (!products.length) return [];
    
    return [...products].sort((a, b) => {
      // Get sort_order for each product's category
      const sortA = categorySortMap.get(a.category_id) ?? 999;
      const sortB = categorySortMap.get(b.category_id) ?? 999;
      
      // First sort by category sort_order
      if (sortA !== sortB) {
        return sortA - sortB;
      }
      
      // If same category, sort by product name or created_at
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [products, categorySortMap]);


  useEffect(() => {
    setPage(1);
  }, [categoryId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/products", {
          params: {
            sort: "newest",
            page,
            limit: HOME_PAGE_SIZE,
            category_id: categoryId || undefined,
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
  }, [api, page, categoryId]);

  const goToPage = (next) => {
    const safe = Math.min(Math.max(1, next), totalPages);
    setPage(safe);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">All products</h2>
          <p className="text-sm text-[#565959] mt-0.5">{total} items</p>
        </div>
        {categories.length > 0 ? (
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="border border-[#D5D9D9] rounded-md px-3 py-2 text-sm bg-white min-w-[10rem]"
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        ) : null}
      </div>
      {loading ? (
        <div className="text-center py-16 text-[#565959]">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-lg p-10 text-center text-[#565959] border border-[#D5D9D9]">
          {selectedCategory
            ? `No products in "${selectedCategory.name}".`
            : "No products available yet."}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {sortedProducts.map((p) => (
              <ProductListRow
                key={p.id}
                product={p}
                clientRef={clientRef}
                resolvedHost={resolvedHost}
                onCartUpdate={onCartUpdate}
              />
            ))}
          </div>
          <StorePagination page={page} totalPages={totalPages} onPageChange={goToPage} />
        </>
      )}
    </section>
  );
}

export function StoreHome() {
  const { api, clientRef, resolvedHost } = useShopperAuth();
  const { setCartCount } = useOutletContext() || {};
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("");
        setStore(data);
      } catch {
        setStore(null);
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

      <HomeProductList
        api={api}
        categories={categories}
        clientRef={clientRef}
        resolvedHost={resolvedHost}
        onCartUpdate={setCartCount}
      />

      <ProductRow
        title="New arrivals"
        subtitle="Recently added to the store"
        products={recentProducts}
        clientRef={clientRef}
        resolvedHost={resolvedHost}
        viewAllTo={`${searchPath}?sort=newest&view=menu`}
      />

      <ProductRow
        title="Deals & offers"
        subtitle="Save on selected products"
        products={deals}
        clientRef={clientRef}
        resolvedHost={resolvedHost}
        viewAllTo={`${searchPath}?view=menu`}
      />
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
        <div className="space-y-3">
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
