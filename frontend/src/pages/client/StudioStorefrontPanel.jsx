import { useCallback, useEffect, useMemo, useState } from "react";
import { api, formatErr, resolveMediaUrl, API_BASE } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Switch } from "../../components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import {
  Camera, Video, Package, ShoppingCart, Calendar, Plus, Pencil, Trash2,
  Copy, ExternalLink, Image as ImageIcon, CheckCircle2, Clock, Phone,
  MessageSquare, Sparkles, FolderTree, ArrowUpRight, Upload, Loader2, X, RefreshCw,
  Star, Eye, Tag, Percent, Flame, BadgePercent, LayoutGrid, List
} from "lucide-react";
import { toast } from "sonner";

export default function StudioStorefrontPanel() {
  const [tab, setTab] = useState("services");
  const [me, setMe] = useState(null);

  // Services state
  const [services, setServices] = useState([]);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [serviceIndex, setServiceIndex] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    id: "",
    name: "",
    price: 0,
    duration_mins: 60,
    description: "",
    deliverables: "",
    image_url: "",
    active: true,
  });
  const [uploadingServiceImg, setUploadingServiceImg] = useState(false);

  // Products state
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [prodOpen, setProdOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [editingProd, setEditingProd] = useState(null);
  const [editingCat, setEditingCat] = useState(null);
  const [prodForm, setProdForm] = useState({
    name: "",
    price: 0,
    sku: "",
    description: "",
    image_url: "",
    image_urls: [],
    category_id: "cat-gifts",
    stock: 10,
    tags: "",
    is_published: true,
  });
  const [catForm, setCatForm] = useState({ name: "", sort_order: 0, is_active: true });
  const [uploadingProdImg, setUploadingProdImg] = useState(false);

  // Shoot Bookings state
  const [bookings, setBookings] = useState([]);
  const [manualBookingOpen, setManualBookingOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    patient_name: "",
    patient_phone: "",
    service_id: "",
    preferred_time: "",
    notes: "",
  });

  // Gallery state
  const [gallery, setGallery] = useState([]);
  const [galOpen, setGalOpen] = useState(false);
  const [uploadingGalImg, setUploadingGalImg] = useState(false);
  const [galFilter, setGalFilter] = useState("All");
  const [galForm, setGalForm] = useState({
    title: "",
    category: "Wedding",
    image_url: "",
    description: "",
    featured: false,
  });

  // Offers & Combos state
  const [offers, setOffers] = useState([]);
  const [offerOpen, setOfferOpen] = useState(false);
  const [offersViewMode, setOffersViewMode] = useState("cards");
  const [uploadingOfferImg, setUploadingOfferImg] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState(null);
  const [offerForm, setOfferForm] = useState({
    id: "",
    title: "",
    badge: "FESTIVE COMBO",
    original_price: 0,
    offer_price: 0,
    coupon_code: "",
    valid_until: "Limited Time Offer",
    description: "",
    deliverables: "",
    image_url: "",
    active: true,
    featured_banner: true,
  });

  // Studio profile state
  const [profile, setProfile] = useState({
    headline: "Capturing Moments • Creating Memories • Customising Gifts",
    tagline: "Your Moments Our Passion",
    description: "Professional photography, creative videography, premium photo printing and personalised gifts — all in one place.",
    hours: "09:00 AM - 09:00 PM",
    phone: "",
    whatsapp: "",
    image_url: "",
    banner_slides: [],
  });

  // Load client info & data
  const loadMe = useCallback(async () => {
    try {
      const { data } = await api.get("/client/me");
      setMe(data);
      const sp = data.studio_profile || {};
      setProfile({
        headline: sp.headline || "Capturing Moments • Creating Memories • Customising Gifts",
        tagline: sp.tagline || "Your Moments Our Passion",
        description: sp.description || "Professional photography, creative videography, premium photo printing and personalised gifts — all in one place.",
        hours: sp.hours || "09:00 AM - 09:00 PM",
        phone: data.phone || "",
        whatsapp: sp.whatsapp || data.phone || "",
        image_url: sp.image_url || "",
        banner_slides: Array.isArray(sp.banner_slides) ? sp.banner_slides : [],
      });
      setServices(Array.isArray(sp.services) ? sp.services : []);
    } catch (e) {
      console.error("Failed to load studio profile", e);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const { data } = await api.get("/client/products");
      setProducts(data || []);
    } catch {}
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const { data } = await api.get("/client/categories");
      setCategories(data || []);
    } catch {}
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const { data } = await api.get("/client/orders");
      setOrders(data || []);
    } catch {}
  }, []);

  const loadBookings = useCallback(async () => {
    try {
      const { data } = await api.get("/client/studio/appointments");
      setBookings(data || []);
    } catch {
      // Fallback
      try {
        const { data } = await api.get("/client/studio/appointments/board");
        setBookings(data?.live_queue || []);
      } catch {}
    }
  }, []);

  const loadGallery = useCallback(async () => {
    try {
      const { data } = await api.get("/client/studio/gallery");
      setGallery(Array.isArray(data) ? data : []);
    } catch {
      try {
        const { data } = await api.get("/client/me");
        setGallery(Array.isArray(data?.studio_profile?.gallery) ? data.studio_profile.gallery : []);
      } catch {}
    }
  }, []);

  const loadOffers = useCallback(async () => {
    try {
      const { data } = await api.get("/client/studio/offers");
      setOffers(Array.isArray(data) ? data : []);
    } catch {
      try {
        const { data } = await api.get("/client/me");
        setOffers(Array.isArray(data?.studio_profile?.offers) ? data.studio_profile.offers : []);
      } catch {}
    }
  }, []);

  useEffect(() => {
    loadMe();
    loadProducts();
    loadCategories();
    loadOrders();
    loadBookings();
    loadGallery();
    loadOffers();
  }, [loadMe, loadProducts, loadCategories, loadOrders, loadBookings, loadGallery, loadOffers]);

  // Gallery actions
  const uploadGalleryImage = async (file) => {
    if (!file) return;
    setUploadingGalImg(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "studio-gallery");
      fd.append("name", file.name);
      const { data } = await api.post("/client/media", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const url = data.id ? `${API_BASE}/media/serve/${data.id}` : resolveMediaUrl(data.public_url || data.url || "");
      setGalForm((prev) => ({ ...prev, image_url: url }));
      toast.success("Gallery photo uploaded successfully");
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
    } finally {
      setUploadingGalImg(false);
    }
  };

  const handleSaveGallery = async (e) => {
    e.preventDefault();
    if (!galForm.image_url) {
      toast.error("Please upload or provide a photo for the gallery");
      return;
    }
    try {
      const { data } = await api.post("/client/studio/gallery", {
        title: galForm.title.trim() || "Studio Shoot",
        category: galForm.category || "Wedding",
        image_url: galForm.image_url,
        description: galForm.description || "",
        featured: Boolean(galForm.featured),
      });
      setGallery((prev) => [data, ...prev]);
      setGalOpen(false);
      setGalForm({ title: "", category: "Wedding", image_url: "", description: "", featured: false });
      toast.success("Photo added to public gallery");
    } catch (err) {
      toast.error(formatErr(err.response?.data?.detail));
    }
  };

  const handleDeleteGallery = async (id) => {
    if (!confirm("Are you sure you want to remove this photo from your gallery?")) return;
    try {
      await api.delete(`/client/studio/gallery/${id}`);
      setGallery((prev) => prev.filter((item) => item.id !== id));
      toast.success("Photo removed from gallery");
    } catch (err) {
      toast.error(formatErr(err.response?.data?.detail));
    }
  };

  const handleToggleGalleryFeatured = async (item) => {
    const nextVal = !item.featured;
    try {
      await api.put(`/client/studio/gallery/${item.id}`, { featured: nextVal });
      setGallery((prev) => prev.map((g) => g.id === item.id ? { ...g, featured: nextVal } : g));
      toast.success(nextVal ? "Marked as Featured on Home" : "Removed from Featured");
    } catch (err) {
      toast.error(formatErr(err.response?.data?.detail));
    }
  };

  // Offers & Combos actions
  const uploadOfferImage = async (file) => {
    if (!file) return;
    setUploadingOfferImg(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "studio-offers");
      fd.append("name", file.name);
      const { data } = await api.post("/client/media", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const url = data.id ? `${API_BASE}/media/serve/${data.id}` : resolveMediaUrl(data.public_url || data.url || "");
      setOfferForm((prev) => ({ ...prev, image_url: url }));
      toast.success("Offer cover photo uploaded successfully");
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
    } finally {
      setUploadingOfferImg(false);
    }
  };

  const handleSaveOffer = async (e) => {
    e.preventDefault();
    if (!offerForm.title.trim()) {
      toast.error("Please enter a title for this combo offer");
      return;
    }
    try {
      if (editingOfferId) {
        await api.put(`/client/studio/offers/${editingOfferId}`, offerForm);
        setOffers((prev) => prev.map((o) => (o.id === editingOfferId ? { ...o, ...offerForm } : o)));
        toast.success("Offer updated successfully");
      } else {
        const { data } = await api.post("/client/studio/offers", offerForm);
        setOffers((prev) => [data, ...prev]);
        toast.success("New offer & combo published");
      }
      setOfferOpen(false);
      setEditingOfferId(null);
    } catch (err) {
      toast.error(formatErr(err.response?.data?.detail));
    }
  };

  const handleDeleteOffer = async (id) => {
    if (!confirm("Are you sure you want to remove this combo offer?")) return;
    try {
      await api.delete(`/client/studio/offers/${id}`);
      setOffers((prev) => prev.filter((o) => o.id !== id));
      toast.success("Offer removed from storefront");
    } catch (err) {
      toast.error(formatErr(err.response?.data?.detail));
    }
  };

  const handleToggleOfferActive = async (offer) => {
    const nextVal = !offer.active;
    try {
      await api.put(`/client/studio/offers/${offer.id}`, { active: nextVal });
      setOffers((prev) => prev.map((o) => (o.id === offer.id ? { ...o, active: nextVal } : o)));
      toast.success(nextVal ? "Offer activated on public site" : "Offer paused");
    } catch (err) {
      toast.error(formatErr(err.response?.data?.detail));
    }
  };

  const handleToggleOfferBanner = async (offer) => {
    const nextVal = !offer.featured_banner;
    try {
      await api.put(`/client/studio/offers/${offer.id}`, { featured_banner: nextVal });
      setOffers((prev) => prev.map((o) => (o.id === offer.id ? { ...o, featured_banner: nextVal } : o)));
      toast.success(nextVal ? "Added to hero banner auto-scroll" : "Removed from hero banner");
    } catch (err) {
      toast.error(formatErr(err.response?.data?.detail));
    }
  };

  // Public studio URL
  const publicSlug = me?.public_booking_slug || me?.id || "";
  const publicUrl = publicSlug ? `${window.location.origin}/book/${encodeURIComponent(publicSlug)}` : "";

  // Upload handler for service images
  const uploadServiceImage = async (file) => {
    if (!file) return;
    setUploadingServiceImg(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "studio-services");
      fd.append("name", file.name);
      const { data } = await api.post("/client/media", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const url = data.id ? `${API_BASE}/media/serve/${data.id}` : resolveMediaUrl(data.public_url || data.url || "");
      setServiceForm((prev) => ({ ...prev, image_url: url }));
      toast.success("Service image uploaded successfully");
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
    } finally {
      setUploadingServiceImg(false);
    }
  };

  // Upload handler for product images
  const uploadProductImage = async (file) => {
    if (!file) return;
    setUploadingProdImg(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "studio-products");
      fd.append("name", file.name);
      const { data } = await api.post("/client/media", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const url = data.id ? `${API_BASE}/media/serve/${data.id}` : resolveMediaUrl(data.public_url || data.url || "");
      setProdForm((prev) => ({
        ...prev,
        image_urls: [...(prev.image_urls || []), url].filter(Boolean),
        image_url: prev.image_url || url,
      }));
      toast.success("Product image uploaded");
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
    } finally {
      setUploadingProdImg(false);
    }
  };

  // Save Service
  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!serviceForm.name.trim()) {
      toast.error("Service name is required");
      return;
    }

    const nextServices = [...services];
    const item = {
      id: serviceForm.id || `srv-${Date.now()}`,
      name: serviceForm.name.trim(),
      price: Number(serviceForm.price) || 0,
      duration_mins: Number(serviceForm.duration_mins) || 60,
      description: serviceForm.description || "",
      deliverables: serviceForm.deliverables || "",
      image_url: serviceForm.image_url || "",
      active: serviceForm.active !== false,
    };

    if (serviceIndex !== null && serviceIndex >= 0) {
      nextServices[serviceIndex] = item;
    } else {
      nextServices.push(item);
    }

    try {
      await api.put("/client/studio/profile", {
        ...profile,
        services: nextServices,
      });
      setServices(nextServices);
      setServiceOpen(false);
      toast.success("Photography service saved");
    } catch (err) {
      toast.error(formatErr(err.response?.data?.detail));
    }
  };

  const handleDeleteService = async (idx) => {
    if (!confirm("Are you sure you want to remove this service?")) return;
    const nextServices = services.filter((_, i) => i !== idx);
    try {
      await api.put("/client/studio/profile", {
        ...profile,
        services: nextServices,
      });
      setServices(nextServices);
      toast.success("Service removed");
    } catch (err) {
      toast.error(formatErr(err.response?.data?.detail));
    }
  };

  // Save Product
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!prodForm.name.trim()) {
      toast.error("Product name is required");
      return;
    }

    const payload = {
      name: prodForm.name.trim(),
      price: Number(prodForm.price) || 0,
      sku: prodForm.sku.trim(),
      description: prodForm.description.trim(),
      image_url: prodForm.image_url,
      image_urls: prodForm.image_urls,
      category_id: prodForm.category_id || null,
      stock: Number(prodForm.stock) || 0,
      tags: String(prodForm.tags || "").split(",").map((s) => s.trim()).filter(Boolean),
      is_published: prodForm.is_published,
    };

    try {
      if (editingProd) {
        await api.put(`/client/products/${editingProd.id}`, payload);
        toast.success("Product updated");
      } else {
        await api.post("/client/products", payload);
        toast.success("Product added");
      }
      setProdOpen(false);
      loadProducts();
    } catch (err) {
      toast.error(formatErr(err.response?.data?.detail));
    }
  };

  const handleDeleteProduct = async (pid) => {
    if (!confirm("Delete this product?")) return;
    try {
      await api.delete(`/client/products/${pid}`);
      toast.success("Product deleted");
      loadProducts();
    } catch (err) {
      toast.error(formatErr(err.response?.data?.detail));
    }
  };

  // Update Shoot Booking status
  const handleBookingStatus = async (aid, status) => {
    try {
      await api.post(`/client/studio/appointments/${aid}/status?status=${status}`, { status });
      toast.success(`Booking status changed to ${status === "done" ? "completed" : status}`);
      loadBookings();
    } catch (err) {
      toast.error(formatErr(err.response?.data?.detail));
    }
  };

  // Update Order status
  const handleOrderStatus = async (oid, status) => {
    try {
      await api.put(`/client/orders/${oid}/status`, { status });
      toast.success(`Order marked as ${status}`);
      loadOrders();
    } catch (err) {
      toast.error(formatErr(err.response?.data?.detail));
    }
  };

  // Save Studio Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put("/client/studio/profile", {
        ...profile,
        services,
      });
      toast.success("Studio profile updated");
    } catch (err) {
      toast.error(formatErr(err.response?.data?.detail));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Studio Quick Link Card */}
      <div className="bg-gradient-to-r from-[#111827] via-[#1F2937] to-[#111827] text-white p-6 rounded-md shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#374151]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Photography & Merchandising Studio
            </span>
          </div>
          <h2 className="text-xl font-bold mt-1 tracking-tight text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" />
            {me?.name || "Your Studio Storefront"}
          </h2>
          <p className="text-xs text-gray-300 mt-1 max-w-xl">
            Accept shoot inquiries, showcase your photography packages, and sell personalized merchandise (mugs, pillows, frames) directly to customers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (publicUrl) {
                navigator.clipboard.writeText(publicUrl);
                toast.success("Public studio link copied!");
              }
            }}
            className="border-gray-600 bg-gray-800/80 text-gray-100 hover:bg-gray-700"
          >
            <Copy className="w-3.5 h-3.5 mr-1.5 text-amber-400" /> Copy Public Link
          </Button>

          {publicUrl && (
            <Button
              size="sm"
              onClick={() => window.open(publicUrl, "_blank")}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> View Public Site
            </Button>
          )}
        </div>
      </div>

      {/* Main Studio Navigation Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-gray-100 p-1 rounded-md border border-gray-200">
          <TabsTrigger value="services" className="rounded-sm data-[state=active]:bg-[#111827] data-[state=active]:text-white">
            <Camera className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
            Shoots & Services ({services.length})
          </TabsTrigger>
          <TabsTrigger value="products" className="rounded-sm data-[state=active]:bg-[#111827] data-[state=active]:text-white">
            <Package className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
            Gifts & Products ({products.length})
          </TabsTrigger>
          <TabsTrigger value="bookings" className="rounded-sm data-[state=active]:bg-[#111827] data-[state=active]:text-white">
            <Calendar className="w-3.5 h-3.5 mr-1.5 text-sky-400" />
            Shoot Bookings ({bookings.length})
          </TabsTrigger>
          <TabsTrigger value="orders" className="rounded-sm data-[state=active]:bg-[#111827] data-[state=active]:text-white">
            <ShoppingCart className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
            Product Orders ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="gallery" className="rounded-sm data-[state=active]:bg-[#111827] data-[state=active]:text-white">
            <ImageIcon className="w-3.5 h-3.5 mr-1.5 text-pink-400" />
            Gallery Portfolio ({gallery.length})
          </TabsTrigger>
          <TabsTrigger value="offers" className="rounded-sm data-[state=active]:bg-[#111827] data-[state=active]:text-white">
            <Tag className="w-3.5 h-3.5 mr-1.5 text-rose-400" />
            Offers & Combos ({offers.length})
          </TabsTrigger>
          <TabsTrigger value="profile" className="rounded-sm data-[state=active]:bg-[#111827] data-[state=active]:text-white">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
            Studio Branding
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: SERVICES & PACKAGES */}
        <TabsContent value="services" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">Photography & Videography Packages</h3>
              <p className="text-xs text-gray-500">Configure wedding, drone, cinematic, portrait, and passport photo services.</p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setServiceIndex(null);
                setServiceForm({
                  id: `srv-${Date.now()}`,
                  name: "",
                  price: 0,
                  duration_mins: 60,
                  description: "",
                  deliverables: "",
                  image_url: "",
                  active: true,
                });
                setServiceOpen(true);
              }}
              className="bg-[#111827] text-white hover:bg-gray-800"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add Package
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((srv, idx) => (
              <div key={srv.id || idx} className="border border-gray-200 rounded-md p-4 bg-white shadow-sm flex flex-col justify-between">
                <div>
                  {srv.image_url && (
                    <div className="h-36 w-full rounded overflow-hidden mb-3 bg-gray-100">
                      <img src={resolveMediaUrl(srv.image_url)} alt={srv.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-gray-900 text-sm">{srv.name}</h4>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      ₹{Number(srv.price || 0).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{srv.description || "No description provided."}</p>

                  {srv.deliverables && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <span className="text-[10px] uppercase font-bold text-gray-400">Includes:</span>
                      <p className="text-xs text-gray-600 mt-0.5">{srv.deliverables}</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{srv.duration_mins || 60} mins</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setServiceIndex(idx);
                        setServiceForm({
                          id: srv.id,
                          name: srv.name,
                          price: srv.price,
                          duration_mins: srv.duration_mins,
                          description: srv.description,
                          deliverables: srv.deliverables || "",
                          image_url: srv.image_url,
                          active: srv.active !== false,
                        });
                        setServiceOpen(true);
                      }}
                      className="h-8 px-2"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteService(idx)}
                      className="h-8 px-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {services.length === 0 && (
              <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 rounded-md">
                <Camera className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-600">No photography packages added yet.</p>
                <p className="text-xs text-gray-400 mt-1">Click "Add Package" to create packages like Wedding, Drone, or Studio Portraits.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB 2: PRODUCTS & CUSTOM GIFTS */}
        <TabsContent value="products" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">Custom Merchandise & Gifts</h3>
              <p className="text-xs text-gray-500">Products customers can order with their custom photos (Mugs, Pillows, Frames, T-Shirts).</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingCat(null);
                  setCatForm({ name: "", sort_order: 0, is_active: true });
                  setCatOpen(true);
                }}
              >
                <FolderTree className="w-3.5 h-3.5 mr-1" /> Categories
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditingProd(null);
                  setProdForm({
                    name: "",
                    price: 0,
                    sku: "",
                    description: "",
                    image_url: "",
                    image_urls: [],
                    category_id: categories[0]?.id || "cat-gifts",
                    stock: 20,
                    tags: "customized, gift",
                    is_published: true,
                  });
                  setProdOpen(true);
                }}
                className="bg-[#111827] text-white hover:bg-gray-800"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Add Product
              </Button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => {
                  const cat = categories.find((c) => c.id === p.category_id);
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden flex items-center justify-center">
                          {p.image_url ? (
                            <img src={resolveMediaUrl(p.image_url)} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-gray-900 text-sm">{p.name}</div>
                        <div className="text-xs text-gray-400 line-clamp-1">{p.description}</div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-600">{cat?.name || "General"}</TableCell>
                      <TableCell className="text-xs font-mono text-gray-500">{p.sku || "—"}</TableCell>
                      <TableCell className="text-right font-bold text-gray-900 text-sm">
                        ₹{Number(p.price || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                          {p.stock}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingProd(p);
                              setProdForm({
                                name: p.name,
                                price: p.price,
                                sku: p.sku || "",
                                description: p.description || "",
                                image_url: p.image_url || "",
                                image_urls: p.image_urls || [],
                                category_id: p.category_id || "cat-gifts",
                                stock: p.stock || 0,
                                tags: (p.tags || []).join(", "),
                                is_published: p.is_published !== false,
                              });
                              setProdOpen(true);
                            }}
                            className="h-8 px-2"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProduct(p.id)}
                            className="h-8 px-2 text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-gray-500 text-xs">
                      No merchandise products listed yet. Click "Add Product" to create Mugs, Pillows, or Frames.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* TAB 3: SHOOT BOOKINGS */}
        <TabsContent value="bookings" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">Shoot Inquiries & Bookings</h3>
              <p className="text-xs text-gray-500">Track incoming client session bookings and event coverage dates.</p>
            </div>
            <Button variant="outline" size="sm" onClick={loadBookings}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
          </div>

          <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Client Name</TableHead>
                  <TableHead>Phone / Contact</TableHead>
                  <TableHead>Requested Shoot</TableHead>
                  <TableHead>Date / Slot</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b) => (
                  <TableRow key={b.id || b.token}>
                    <TableCell className="font-semibold text-gray-900 text-sm">
                      {b.patient_name || b.customer_name || "Guest Client"}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-gray-600">
                      {b.patient_phone || b.customer_phone || "—"}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-gray-800">
                      {b.service_name || "General Shoot Inquiry"}
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">
                      {b.date ? `${b.date} ` : ""} {b.preferred_time || b.assigned_time || "Flexible"}
                    </TableCell>
                    <TableCell>
                      <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                        b.status === "called" ? "bg-amber-100 text-amber-800" :
                        b.status === "done" ? "bg-emerald-100 text-emerald-800" :
                        b.status === "cancelled" ? "bg-red-100 text-red-800" :
                        "bg-blue-100 text-blue-800"
                      }`}>
                        {b.status || "pending"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {b.status !== "done" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBookingStatus(b.id, "done")}
                            className="h-7 text-xs text-emerald-600"
                          >
                            Mark Completed
                          </Button>
                        )}
                        {b.status !== "cancelled" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleBookingStatus(b.id, "cancelled")}
                            className="h-7 text-xs text-red-600"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {bookings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-gray-500 text-xs">
                      No shoot bookings received yet. Share your public booking link to collect inquiries.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* TAB 4: PRODUCT ORDERS */}
        <TabsContent value="orders" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">Custom Gift & Frame Orders</h3>
              <p className="text-xs text-gray-500">Customer orders with customized printing details and delivery addresses.</p>
            </div>
            <Button variant="outline" size="sm" onClick={loadOrders}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh Orders
            </Button>
          </div>

          <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs font-bold text-gray-800">
                      {o.order_no || o.id?.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-gray-900 text-xs">{o.customer_name || o.shopper_name || "Customer"}</div>
                      <div className="text-[11px] text-gray-500">{o.customer_phone || o.phone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-gray-700">
                        {(o.items || []).map((it) => `${it.name} (x${it.quantity || 1})`).join(", ") || "Merchandise Items"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-gray-900 text-xs">
                      ₹{Number(o.total_amount || o.amount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                        o.status === "completed" ? "bg-emerald-100 text-emerald-800" :
                        o.status === "cancelled" ? "bg-red-100 text-red-800" :
                        "bg-amber-100 text-amber-800"
                      }`}>
                        {o.status || "pending"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {o.status !== "completed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOrderStatus(o.id, "completed")}
                          className="h-7 text-xs text-emerald-600"
                        >
                          Complete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}

                {orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-gray-500 text-xs">
                      No gift or frame orders yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* TAB 5: STUDIO BRANDING */}
        <TabsContent value="profile" className="mt-6 space-y-4">
          <form onSubmit={handleSaveProfile} className="bg-white border border-gray-200 rounded-md p-6 space-y-4 max-w-2xl">
            <h3 className="text-base font-bold text-gray-900">Studio Identity & Contact</h3>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">Headline</Label>
              <Input
                value={profile.headline}
                onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                placeholder="Capturing Moments • Creating Memories • Customising Gifts"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">Tagline / Slogan</Label>
              <Input
                value={profile.tagline}
                onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                placeholder="Your Moments Our Passion"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">Description</Label>
              <Textarea
                rows={3}
                value={profile.description}
                onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                placeholder="Professional photography, creative videography, premium photo printing and personalised gifts — all in one place."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-700">Phone</Label>
                <Input
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-700">WhatsApp for Quick Inquiries</Label>
                <Input
                  value={profile.whatsapp}
                  onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">Working Hours</Label>
              <Input
                value={profile.hours}
                onChange={(e) => setProfile({ ...profile, hours: e.target.value })}
                placeholder="09:00 AM - 09:00 PM"
              />
            </div>

            <Button type="submit" className="bg-[#111827] text-white hover:bg-gray-800">
              Save Studio Profile
            </Button>
          </form>
        </TabsContent>

        {/* TAB 6: GALLERY PORTFOLIO */}
        <TabsContent value="gallery" className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>Client Portfolio & Gallery</span>
                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {gallery.length} Photos
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Upload shoot photos, wedding highlights, drone stills, and customised gift samples. Changes show immediately on your public site.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setGalForm({
                  title: "",
                  category: "Wedding",
                  image_url: "",
                  description: "",
                  featured: false,
                });
                setGalOpen(true);
              }}
              className="bg-[#111827] text-white hover:bg-gray-800"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add Portfolio Photo
            </Button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 pb-2 border-b border-gray-100">
            {["All", "Wedding", "Candid", "Drone", "Studio", "Gifts", "Events"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setGalFilter(cat)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                  galFilter === cat
                    ? "bg-[#111827] text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Gallery Items Grid (Compact & Balanced) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {gallery
              .filter((item) => galFilter === "All" || (item.category || "").toLowerCase().includes(galFilter.toLowerCase()))
              .map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200/90 rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col group"
                >
                  <div className="relative aspect-square w-full bg-gray-100 overflow-hidden">
                    <img
                      src={resolveMediaUrl(item.image_url)}
                      alt={item.title || "Studio shoot"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-black/75 backdrop-blur-xs text-white px-1.5 py-0.5 rounded shadow-xs">
                        {item.category || "General"}
                      </span>
                      {item.featured && (
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500 text-black px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-black text-black" />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900 text-xs line-clamp-1">{item.title || "Studio Shoot"}</h4>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleToggleGalleryFeatured(item)}
                        title={item.featured ? "Remove from Home feature" : "Feature on Home page"}
                        className={`text-[11px] font-semibold flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
                          item.featured
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "text-gray-400 hover:text-amber-600 hover:bg-gray-50"
                        }`}
                      >
                        <Star className={`w-3 h-3 ${item.featured ? "fill-amber-500 text-amber-500" : ""}`} />
                        <span>{item.featured ? "Home" : "Feature"}</span>
                      </button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteGallery(item.id)}
                        className="h-6 px-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 text-[11px]"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

            {gallery.length === 0 && (
              <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">No photos in your gallery yet.</p>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  Upload wedding shoots, portraits, drone shots, or custom gift samples to showcase your work on the public storefront.
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    setGalForm({ title: "", category: "Wedding", image_url: "", description: "", featured: false });
                    setGalOpen(true);
                  }}
                  className="mt-4 bg-[#111827] text-white"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Upload First Photo
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB 7: OFFERS & COMBOS */}
        <TabsContent value="offers" className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>Studio Offers, Combos & Deals</span>
                <span className="text-xs font-normal text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                  {offers.length} Combos
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Create bundled packages (e.g. Wedding + Drone + Free Magic Mugs), seasonal discounts, and limited-time coupons.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                <button
                  type="button"
                  onClick={() => setOffersViewMode("cards")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${
                    offersViewMode === "cards"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                  title="Card Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOffersViewMode("table")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${
                    offersViewMode === "table"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                  title="Table View"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  setEditingOfferId(null);
                  setOfferForm({
                    id: `off-${Date.now().toString(36)}`,
                    title: "",
                    badge: "FESTIVE COMBO",
                    original_price: 0,
                    offer_price: 0,
                    coupon_code: "",
                    valid_until: "Limited Time Offer",
                    description: "",
                    deliverables: "",
                    image_url: "",
                    active: true,
                    featured_banner: true,
                  });
                  setOfferOpen(true);
                }}
                className="bg-[#111827] text-white hover:bg-gray-800 h-8"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Add Combo Offer
              </Button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 pb-1">
            <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between shadow-2xs">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-gray-500">Total Combos</span>
                <div className="text-lg font-black text-gray-900">{offers.length}</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                <Tag className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between shadow-2xs">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-gray-500">Live on Storefront</span>
                <div className="text-lg font-black text-emerald-600">{offers.filter((o) => o.active !== false).length}</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between shadow-2xs">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-gray-500">In Hero Banner</span>
                <div className="text-lg font-black text-amber-600">{offers.filter((o) => o.active !== false && o.featured_banner !== false).length}</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* VIEW MODE: COMPACT CARDS */}
          {offersViewMode === "cards" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {offers.map((offer) => {
                const hasDiscount = Number(offer.original_price || 0) > Number(offer.offer_price || 0);
                const savingsAmt = hasDiscount ? Number(offer.original_price) - Number(offer.offer_price) : 0;
                const savingsPct = hasDiscount ? Math.round((savingsAmt / Number(offer.original_price)) * 100) : 0;
                const deliverablesList = (offer.deliverables || "")
                  .split(/[\n,]+/)
                  .map((s) => s.trim())
                  .filter(Boolean);

                return (
                  <div
                    key={offer.id}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Thumbnail with overlay controls */}
                      <div className="relative h-36 w-full bg-gray-100 overflow-hidden">
                        {offer.image_url ? (
                          <img
                            src={resolveMediaUrl(offer.image_url)}
                            alt={offer.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                            <Tag className="w-7 h-7 mb-1 text-gray-300" />
                            <span className="text-[11px]">No cover image</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

                        {/* Top Left Badge */}
                        <div className="absolute top-2 left-2 flex items-center gap-1">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-black/85 text-amber-400 px-2 py-0.5 rounded shadow-xs">
                            {offer.badge || "FESTIVE COMBO"}
                          </span>
                        </div>

                        {/* Top Right Quick Switches */}
                        <div className="absolute top-2 right-2 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleOfferBanner(offer)}
                            title={offer.featured_banner ? "Included in Hero Banner (Click to toggle)" : "Not in Hero Banner (Click to toggle)"}
                            className={`p-1 rounded-md text-[10px] font-bold transition-all shadow-xs flex items-center gap-1 ${
                              offer.featured_banner
                                ? "bg-amber-500 text-black"
                                : "bg-black/60 text-gray-300 hover:text-white"
                            }`}
                          >
                            <Flame className={`w-3 h-3 ${offer.featured_banner ? "fill-black" : ""}`} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleOfferActive(offer)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold shadow-xs transition-all ${
                              offer.active !== false
                                ? "bg-emerald-600 text-white"
                                : "bg-gray-600 text-white"
                            }`}
                          >
                            {offer.active !== false ? "Active" : "Paused"}
                          </button>
                        </div>

                        {/* Bottom Thumbnail Expiry */}
                        {offer.valid_until && (
                          <div className="absolute bottom-1.5 left-2.5 text-[10px] text-gray-200 font-medium flex items-center gap-1 drop-shadow-xs">
                            <Clock className="w-3 h-3 text-amber-300" />
                            <span>{offer.valid_until}</span>
                          </div>
                        )}
                      </div>

                      {/* Card Content Body */}
                      <div className="p-3.5 space-y-2.5">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-gray-900 text-sm group-hover:text-amber-600 transition-colors line-clamp-1">
                              {offer.title}
                            </h4>
                          </div>
                          {offer.description && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                              {offer.description}
                            </p>
                          )}
                        </div>

                        {/* Deliverables preview chips */}
                        {deliverablesList.length > 0 && (
                          <div className="pt-1 flex flex-wrap gap-1">
                            {deliverablesList.slice(0, 3).map((d, dIdx) => (
                              <span
                                key={dIdx}
                                className="inline-flex items-center gap-1 text-[10px] font-medium bg-gray-50 text-gray-600 border border-gray-200 px-1.5 py-0.5 rounded"
                              >
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                                <span className="truncate max-w-[120px]">{d}</span>
                              </span>
                            ))}
                            {deliverablesList.length > 3 && (
                              <span className="text-[10px] text-amber-600 font-semibold px-1 py-0.5">
                                +{deliverablesList.length - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Pricing & Coupon Row */}
                        <div className="pt-1 border-t border-gray-100 flex items-center justify-between">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-black text-gray-900">
                              ₹{Number(offer.offer_price || 0).toLocaleString()}
                            </span>
                            {hasDiscount && (
                              <>
                                <span className="text-xs text-gray-400 line-through">
                                  ₹{Number(offer.original_price || 0).toLocaleString()}
                                </span>
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                                  {savingsPct}% OFF
                                </span>
                              </>
                            )}
                          </div>

                          {offer.coupon_code && (
                            <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded">
                              {offer.coupon_code}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Footer: Prominent Edit Button */}
                    <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingOfferId(offer.id);
                          setOfferForm({
                            id: offer.id,
                            title: offer.title || "",
                            badge: offer.badge || "FESTIVE COMBO",
                            original_price: offer.original_price || 0,
                            offer_price: offer.offer_price || 0,
                            coupon_code: offer.coupon_code || "",
                            valid_until: offer.valid_until || "",
                            description: offer.description || "",
                            deliverables: offer.deliverables || "",
                            image_url: offer.image_url || "",
                            active: offer.active !== false,
                            featured_banner: offer.featured_banner !== false,
                          });
                          setOfferOpen(true);
                        }}
                        className="flex-1 h-8 text-xs font-bold border-gray-300 hover:bg-white text-gray-800 flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Pencil className="w-3.5 h-3.5 text-gray-600" /> Edit Offer
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteOffer(offer.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
                        title="Delete offer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW MODE: TABLE VIEW */}
          {offersViewMode === "table" && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="w-16">Cover</TableHead>
                    <TableHead>Combo Details</TableHead>
                    <TableHead>Inclusions</TableHead>
                    <TableHead>Coupon</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-center w-24">Banner</TableHead>
                    <TableHead className="text-center w-24">Status</TableHead>
                    <TableHead className="text-right w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offers.map((offer) => {
                    const hasDiscount = Number(offer.original_price || 0) > Number(offer.offer_price || 0);
                    const savingsPct = hasDiscount ? Math.round(((Number(offer.original_price) - Number(offer.offer_price)) / Number(offer.original_price)) * 100) : 0;

                    return (
                      <TableRow key={offer.id}>
                        <TableCell>
                          <div className="w-12 h-10 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200">
                            {offer.image_url ? (
                              <img src={resolveMediaUrl(offer.image_url)} alt={offer.title} className="w-full h-full object-cover" />
                            ) : (
                              <Tag className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-xs sm:text-sm">{offer.title}</span>
                            <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                              {offer.badge || "COMBO"}
                            </span>
                          </div>
                          {offer.description && (
                            <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{offer.description}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-gray-600 max-w-[200px]">
                          <span className="line-clamp-1">{offer.deliverables || "—"}</span>
                        </TableCell>
                        <TableCell>
                          {offer.coupon_code ? (
                            <span className="font-mono text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded">
                              {offer.coupon_code}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="font-bold text-gray-900 text-xs sm:text-sm">
                            ₹{Number(offer.offer_price || 0).toLocaleString()}
                          </div>
                          {hasDiscount && (
                            <div className="text-[10px] text-gray-400 line-through">
                              ₹{Number(offer.original_price || 0).toLocaleString()} ({savingsPct}% off)
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={offer.featured_banner !== false}
                            onCheckedChange={() => handleToggleOfferBanner(offer)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={offer.active !== false}
                            onCheckedChange={() => handleToggleOfferActive(offer)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingOfferId(offer.id);
                                setOfferForm({
                                  id: offer.id,
                                  title: offer.title || "",
                                  badge: offer.badge || "FESTIVE COMBO",
                                  original_price: offer.original_price || 0,
                                  offer_price: offer.offer_price || 0,
                                  coupon_code: offer.coupon_code || "",
                                  valid_until: offer.valid_until || "",
                                  description: offer.description || "",
                                  deliverables: offer.deliverables || "",
                                  image_url: offer.image_url || "",
                                  active: offer.active !== false,
                                  featured_banner: offer.featured_banner !== false,
                                });
                                setOfferOpen(true);
                              }}
                              className="h-8 px-2"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteOffer(offer.id)}
                              className="h-8 px-2 text-red-600 hover:text-red-700"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {offers.length === 0 && (
            <div className="py-16 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
              <Tag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700">No combo offers published yet.</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                Create high-conversion combos like Grand Wedding Cinema Bundle, Pre-Wedding Special, or Personalised Gift Hampers with promotional coupons.
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setEditingOfferId(null);
                  setOfferForm({
                    id: `off-${Date.now().toString(36)}`,
                    title: "",
                    badge: "FESTIVE COMBO",
                    original_price: 0,
                    offer_price: 0,
                    coupon_code: "",
                    valid_until: "Limited Time Offer",
                    description: "",
                    deliverables: "",
                    image_url: "",
                    active: true,
                    featured_banner: true,
                  });
                  setOfferOpen(true);
                }}
                className="mt-4 bg-[#111827] text-white"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Create First Combo
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* DIALOG: ADD / EDIT SERVICE */}
      <Dialog open={serviceOpen} onOpenChange={setServiceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{serviceIndex !== null ? "Edit Photography Package" : "Add Photography Package"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveService} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Service / Package Name *</Label>
              <Input
                required
                value={serviceForm.name}
                onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                placeholder="e.g. Wedding Photography, Drone Videography"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Price (₹)</Label>
                <Input
                  type="number"
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                  placeholder="25000"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Duration (Mins)</Label>
                <Input
                  type="number"
                  value={serviceForm.duration_mins}
                  onChange={(e) => setServiceForm({ ...serviceForm, duration_mins: e.target.value })}
                  placeholder="60"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Description</Label>
              <Textarea
                rows={2}
                value={serviceForm.description}
                onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                placeholder="Beautifully capturing your special day with traditional and candid photography."
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Deliverables / Inclusions (Comma-separated)</Label>
              <Input
                value={serviceForm.deliverables}
                onChange={(e) => setServiceForm({ ...serviceForm, deliverables: e.target.value })}
                placeholder="Traditional Photography, Candid Photography, Pre-Wedding Shoot, Album Design"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Package Cover Image</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => uploadServiceImage(e.target.files?.[0])}
                  disabled={uploadingServiceImg}
                />
                {uploadingServiceImg && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
              </div>
              {serviceForm.image_url && (
                <div className="mt-2 h-20 w-32 rounded overflow-hidden border border-gray-200">
                  <img src={resolveMediaUrl(serviceForm.image_url)} alt="preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setServiceOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#111827] text-white">Save Package</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: ADD / EDIT PRODUCT */}
      <Dialog open={prodOpen} onOpenChange={setProdOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProd ? "Edit Merchandise Product" : "Add Merchandise Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveProduct} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Product Name *</Label>
              <Input
                required
                value={prodForm.name}
                onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                placeholder="e.g. Magic Photo Mug, Personalized Cushion, Wooden Frame"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Price (₹) *</Label>
                <Input
                  type="number"
                  required
                  value={prodForm.price}
                  onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                  placeholder="399"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">SKU / Code</Label>
                <Input
                  value={prodForm.sku}
                  onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value })}
                  placeholder="MUG-MAGIC-01"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Category *</Label>
              <Select value={prodForm.category_id || "cat-gifts"} onValueChange={(v) => setProdForm({ ...prodForm, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                  {!categories.some((c) => c.id === "cat-gifts") && (
                    <SelectItem value="cat-gifts">Customised Gifts</SelectItem>
                  )}
                  {!categories.some((c) => c.id === "cat-frames") && (
                    <SelectItem value="cat-frames">Photo Frames</SelectItem>
                  )}
                  <SelectItem value="general">General Merchandise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Description</Label>
              <Textarea
                rows={2}
                value={prodForm.description}
                onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                placeholder="Turn your photos into beautiful custom keepsakes."
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Product Mockup Photo</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => uploadProductImage(e.target.files?.[0])}
                  disabled={uploadingProdImg}
                />
                {uploadingProdImg && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
              </div>
              {prodForm.image_url && (
                <div className="mt-2 h-20 w-20 rounded overflow-hidden border border-gray-200">
                  <img src={resolveMediaUrl(prodForm.image_url)} alt="preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setProdOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#111827] text-white">Save Product</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: ADD GALLERY PHOTO */}
      <Dialog open={galOpen} onOpenChange={setGalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Photo to Gallery</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveGallery} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Photo Title / Shoot Name *</Label>
              <Input
                required
                value={galForm.title}
                onChange={(e) => setGalForm({ ...galForm, title: e.target.value })}
                placeholder="e.g. Arun & Priya Royal Wedding, Drone Sunset Shoot"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Category *</Label>
              <Select
                value={galForm.category}
                onValueChange={(v) => setGalForm({ ...galForm, category: v })}
              >
                <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Wedding">Wedding Photography</SelectItem>
                  <SelectItem value="Candid">Candid & Pre-Wedding</SelectItem>
                  <SelectItem value="Drone">Drone & Aerial Shoots</SelectItem>
                  <SelectItem value="Studio">Studio Portraits & Maternity</SelectItem>
                  <SelectItem value="Gifts">Customised Gifts Showcase</SelectItem>
                  <SelectItem value="Events">Corporate & Birthday Events</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Description / Notes (Optional)</Label>
              <Textarea
                rows={2}
                value={galForm.description}
                onChange={(e) => setGalForm({ ...galForm, description: e.target.value })}
                placeholder="e.g. Traditional muhurtham rituals captured with cinematic lighting."
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Upload Photo *</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => uploadGalleryImage(e.target.files?.[0])}
                  disabled={uploadingGalImg}
                />
                {uploadingGalImg && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[10px] text-gray-400">Or paste direct image URL:</span>
                <Input
                  type="url"
                  value={galForm.image_url}
                  onChange={(e) => setGalForm({ ...galForm, image_url: e.target.value })}
                  placeholder="https://..."
                  className="h-7 text-xs flex-1"
                />
              </div>
              {galForm.image_url && (
                <div className="mt-2 h-28 w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  <img
                    src={resolveMediaUrl(galForm.image_url)}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold text-gray-800">Feature on Home Page</Label>
                <p className="text-[11px] text-gray-400">Display this photo in the Signature Portfolio on your main landing page.</p>
              </div>
              <Switch
                checked={galForm.featured}
                onCheckedChange={(checked) => setGalForm({ ...galForm, featured: checked })}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setGalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={uploadingGalImg || !galForm.image_url} className="bg-[#111827] text-white">
                Save to Gallery
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: ADD / EDIT COMBO OFFER */}
      <Dialog open={offerOpen} onOpenChange={setOfferOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-rose-500" />
              <span>{editingOfferId ? "Edit Studio Combo Offer" : "Create New Combo Offer"}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveOffer} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Offer / Bundle Title *</Label>
              <Input
                required
                value={offerForm.title}
                onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                placeholder="e.g. Grand Royal Wedding Cinema Combo"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Promotional Badge</Label>
                <Input
                  value={offerForm.badge}
                  onChange={(e) => setOfferForm({ ...offerForm, badge: e.target.value })}
                  placeholder="e.g. FESTIVE COMBO, 25% OFF, BESTSELLER"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Coupon Code (Optional)</Label>
                <Input
                  value={offerForm.coupon_code}
                  onChange={(e) => setOfferForm({ ...offerForm, coupon_code: e.target.value.toUpperCase() })}
                  placeholder="e.g. STARROYAL, PREWEDDING"
                  className="font-mono uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Offer / Discounted Price (₹) *</Label>
                <Input
                  type="number"
                  required
                  min={0}
                  value={offerForm.offer_price}
                  onChange={(e) => setOfferForm({ ...offerForm, offer_price: e.target.value })}
                  placeholder="55000"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Original / Regular Price (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  value={offerForm.original_price}
                  onChange={(e) => setOfferForm({ ...offerForm, original_price: e.target.value })}
                  placeholder="75000"
                />
                <p className="text-[10px] text-gray-400">Shows strikethrough price and calculates savings percentage.</p>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Valid Until / Expiry Tag</Label>
              <Input
                value={offerForm.valid_until}
                onChange={(e) => setOfferForm({ ...offerForm, valid_until: e.target.value })}
                placeholder="e.g. Limited Slots This Month, Valid till Dec 31"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Included Perks & Deliverables</Label>
              <Textarea
                rows={3}
                value={offerForm.deliverables}
                onChange={(e) => setOfferForm({ ...offerForm, deliverables: e.target.value })}
                placeholder="e.g. 2 Full Days Photo & 4K Cinema Video, Dual Operator Drone, 40-Page Synthetic Album, 2 Personalized Magic Mugs"
              />
              <p className="text-[10px] text-gray-400">List what the customer receives in this combo bundle.</p>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Short Summary / Description</Label>
              <Textarea
                rows={2}
                value={offerForm.description}
                onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                placeholder="e.g. Full traditional and candid wedding coverage with drone aerial cinematography and free merchandise."
              />
            </div>

            {/* Offer Image */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Cover Photo</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => uploadOfferImage(e.target.files?.[0])}
                  disabled={uploadingOfferImg}
                />
                {uploadingOfferImg && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[10px] text-gray-400">Or paste image URL:</span>
                <Input
                  type="url"
                  value={offerForm.image_url}
                  onChange={(e) => setOfferForm({ ...offerForm, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="h-7 text-xs flex-1"
                />
              </div>
              {offerForm.image_url && (
                <div className="mt-2 h-32 w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  <img
                    src={resolveMediaUrl(offerForm.image_url)}
                    alt="offer preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Toggles */}
            <div className="pt-2 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold text-gray-800">Auto-Scrolling Hero Banner</Label>
                  <p className="text-[11px] text-gray-400">Rotate this combo in the high-impact hero banner on your public Offers tab.</p>
                </div>
                <Switch
                  checked={offerForm.featured_banner}
                  onCheckedChange={(checked) => setOfferForm({ ...offerForm, featured_banner: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold text-gray-800">Active & Published</Label>
                  <p className="text-[11px] text-gray-400">Controls whether customers can view and claim this offer.</p>
                </div>
                <Switch
                  checked={offerForm.active}
                  onCheckedChange={(checked) => setOfferForm({ ...offerForm, active: checked })}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setOfferOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={uploadingOfferImg || !offerForm.title} className="bg-[#111827] text-white">
                {editingOfferId ? "Update Offer" : "Publish Offer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
