import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { ArrowLeft, Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { useShopperAuth } from "../../context/ShopperAuthContext";
import { formatErr, resolveMediaUrl } from "../../lib/api";
import { storePath } from "../../lib/storeApi";

export default function StoreProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { api, clientRef, resolvedHost, shopper } = useShopperAuth();
  const { setCartCount } = useOutletContext() || {};
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/products/${productId}`);
        setProduct(data);
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [api, productId]);

  const images = (product?.image_urls?.length ? product.image_urls : product?.image_url ? [product.image_url] : [])
    .map(resolveMediaUrl)
    .filter(Boolean);
  const loginPath = storePath(clientRef, "login", resolvedHost);
  const cartPath = storePath(clientRef, "cart", resolvedHost);
  const homePath = storePath(clientRef, "", resolvedHost);

  const addToCart = async () => {
    if (!shopper || shopper === false) {
      toast.error("Please sign in to add items to cart");
      navigate(loginPath);
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post("/cart/items", { product_id: product.id, qty });
      if (setCartCount) setCartCount(data.item_count || 0);
      toast.success("Added to cart");
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="text-center py-20">Loading...</div>;
  if (!product) return <div className="text-center py-20">Product not found.</div>;

  const inStock = Number(product.stock || 0) > 0;

  return (
    <div>
      <Link to={homePath} className="inline-flex items-center text-sm text-[#007185] hover:text-[#C45500] mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to store
      </Link>
      <div className="bg-white rounded-xl border border-[#D5D9D9] overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="p-4 md:p-6 bg-[#F7F8F8]">
            <div className="aspect-square relative bg-white rounded-lg border border-[#D5D9D9]">
              {images[activeImg] ? (
                <img src={images[activeImg]} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gray-100" />
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {images.map((url, i) => (
                  <button
                    key={url + i}
                    type="button"
                    onClick={() => setActiveImg(i)}
                    className={`w-16 h-16 shrink-0 rounded border-2 overflow-hidden ${activeImg === i ? "border-[#FF9900]" : "border-[#D5D9D9]"}`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="p-4 md:p-8">
            <h1 className="text-2xl md:text-3xl font-medium">{product.name}</h1>
            {product.category?.name && <div className="text-sm text-[#565959] mt-1">{product.category.name}</div>}
            {product.sku && <div className="text-xs text-[#565959] mt-1 font-mono">SKU: {product.sku}</div>}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-normal">₹{Number(product.price || 0).toLocaleString()}</span>
              {product.compare_at_price > product.price && (
                <span className="text-lg text-[#565959] line-through">₹{Number(product.compare_at_price).toLocaleString()}</span>
              )}
            </div>
            <p className="mt-4 text-sm text-[#0F1111] leading-relaxed">{product.description || "No description provided."}</p>
            <div className={`mt-3 text-sm font-medium ${inStock ? "text-[#007600]" : "text-red-600"}`}>
              {inStock ? `${product.stock} in stock` : "Currently unavailable"}
            </div>
            {inStock && (
              <div className="mt-6 flex items-center gap-3">
                <span className="text-sm">Qty:</span>
                <div className="flex items-center border border-[#D5D9D9] rounded-md">
                  <button type="button" className="p-2 hover:bg-gray-50" onClick={() => setQty((n) => Math.max(1, n - 1))}><Minus className="w-4 h-4" /></button>
                  <span className="px-4 font-medium">{qty}</span>
                  <button type="button" className="p-2 hover:bg-gray-50" onClick={() => setQty((n) => Math.min(product.stock, n + 1))}><Plus className="w-4 h-4" /></button>
                </div>
              </div>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <Button disabled={!inStock || busy} onClick={addToCart} className="bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] border border-[#FCD200] rounded-full px-8">
                <ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart
              </Button>
              <Button variant="outline" disabled={!inStock} onClick={() => navigate(cartPath)} className="rounded-full">
                Go to Cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
