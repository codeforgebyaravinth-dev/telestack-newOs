import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Search } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { useShopperAuth } from "../../context/ShopperAuthContext";
import { storePath } from "../../lib/storeApi";
import { resolveMediaUrl } from "../../lib/api";

function useDebouncedValue(value, delay = 280) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function SearchSuggestion({ product, clientRef, resolvedHost, onSelect }) {
  const path = storePath(clientRef, `product/${product.id}`, resolvedHost);
  const img = resolveMediaUrl(product.image_urls?.[0] || product.image_url);
  const tags = Array.isArray(product.tags) ? product.tags.slice(0, 3) : [];
  return (
    <Link
      to={path}
      onClick={onSelect}
      className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#F7F8F8] border-b border-[#E3E6E6] last:border-0"
    >
      <div className="w-12 h-12 shrink-0 bg-white border border-[#E3E6E6] rounded overflow-hidden">
        {img ? <img src={img} alt="" className="w-full h-full object-contain p-0.5" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm text-[#0F1111] line-clamp-2">{product.name}</div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {tags.map((tag) => (
              <span key={tag} className="text-[10px] uppercase tracking-wide bg-[#F0F2F2] text-[#565959] px-1.5 py-0.5 rounded">{tag}</span>
            ))}
          </div>
        )}
      </div>
      <div className="text-sm font-bold text-[#B12704] shrink-0">₹{Number(product.price || 0).toLocaleString()}</div>
    </Link>
  );
}

export default function StoreSearchBox() {
  const { api, clientRef, resolvedHost } = useShopperAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const wrapperRef = useRef(null);
  const searchBase = storePath(clientRef, "search", resolvedHost);
  const onSearchPage = location.pathname === searchBase || location.pathname.endsWith("/search");
  const [query, setQuery] = useState(params.get("q") || "");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const debouncedQuery = useDebouncedValue(query.trim(), 280);

  useEffect(() => {
    if (onSearchPage) {
      setQuery(params.get("q") || "");
    }
  }, [params, onSearchPage]);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const { data } = await api.get("/products", {
          params: { q: debouncedQuery, sort: "relevance", limit: 8 },
        });
        if (cancelled) return;
        setResults(data.items || []);
        setTotal(data.total || 0);
      } catch {
        if (!cancelled) {
          setResults([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [api, debouncedQuery]);

  useEffect(() => {
    if (!onSearchPage || debouncedQuery === (params.get("q") || "")) return;
    const categoryId = params.get("category_id");
    const qs = new URLSearchParams();
    if (debouncedQuery) qs.set("q", debouncedQuery);
    if (categoryId) qs.set("category_id", categoryId);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    navigate(`${searchBase}${suffix}`, { replace: true });
  }, [debouncedQuery, onSearchPage, params, navigate, searchBase]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const goToSearch = useCallback((term) => {
    const q = (term ?? query).trim();
    if (!q) return;
    setOpen(false);
    navigate(`${searchBase}?q=${encodeURIComponent(q)}`);
  }, [navigate, query, searchBase]);

  const onSubmit = (e) => {
    e.preventDefault();
    goToSearch();
  };

  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={wrapperRef} className="relative flex-1 max-w-3xl">
      <form onSubmit={onSubmit} className="flex gap-0">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search by product name or tag..."
          autoComplete="off"
          className="rounded-none rounded-l-md border-0 h-10 bg-white text-[#111827] focus-visible:ring-[#FF9900]"
        />
        <Button type="submit" className="rounded-none rounded-r-md h-10 px-4 bg-[#FF9900] hover:bg-[#F08804] text-[#111827]">
          <Search className="w-4 h-4" />
        </Button>
      </form>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-[#D5D9D9] rounded-md shadow-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-[#565959]">
              <Loader2 className="w-4 h-4 animate-spin" /> Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 px-4 text-center text-sm text-[#565959]">
              No products matching &quot;{query.trim()}&quot;
            </div>
          ) : (
            <>
              <div className="max-h-[420px] overflow-y-auto">
                {results.map((product) => (
                  <SearchSuggestion
                    key={product.id}
                    product={product}
                    clientRef={clientRef}
                    resolvedHost={resolvedHost}
                    onSelect={() => setOpen(false)}
                  />
                ))}
              </div>
              {total > results.length && (
                <button
                  type="button"
                  onClick={() => goToSearch()}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-[#007185] hover:bg-[#F7F8F8] border-t border-[#E3E6E6]"
                >
                  See all {total} results for &quot;{query.trim()}&quot;
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
