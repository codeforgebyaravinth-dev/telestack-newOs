import { useMemo, useState, useEffect } from "react";
import {
  Camera, Video, Plane, Sparkles, CheckCircle2, Phone, MessageSquare,
  ShoppingCart, Search, User, ArrowRight, ShieldCheck, Award, Users,
  Cpu, Headphones, Heart, X, Upload, Calendar, Clock, ChevronRight,
  MapPin, Star, Zap, Building, Briefcase, HelpCircle, FileText,
  CreditCard, Printer, Lightbulb, TrendingUp, Target, Plus, Minus,
  Trash2, ExternalLink, Menu, Eye, Gift, Image as ImageIcon,
  Tag, Flame, ChevronLeft, Copy, Check
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { resolveMediaUrl } from "../lib/api";
import { toast } from "sonner";
import axios from "axios";
import { motion } from "framer-motion";

export default function PublicStudio({
  doc,
  clientId,
  apiBase = "/api/public",
  resolvedHost = null,
  customer = null,
  onLoginOpen,
  onLogout
}) {
  const [activeTab, setActiveTab] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const profile = doc?.profile || {};
  const studioProfile = doc?.studio_profile || profile;

  const [galleryFilter, setGalleryFilter] = useState("All");
  const [lightboxItem, setLightboxItem] = useState(null);

  const galleryItems = useMemo(() => {
    const raw = Array.isArray(studioProfile?.gallery) && studioProfile.gallery.length
      ? studioProfile.gallery
      : Array.isArray(profile?.gallery) && profile.gallery.length
      ? profile.gallery
      : [];
    return raw;
  }, [studioProfile?.gallery, profile?.gallery]);

  // Real backend services or authentic fallbacks matching reference
  const services = useMemo(() => {
    const raw = Array.isArray(profile.services) && profile.services.length
      ? profile.services
      : Array.isArray(studioProfile.services) && studioProfile.services.length
      ? studioProfile.services
      : [];
    if (raw.length) return raw.filter((s) => s.active !== false);
    return [
      {
        id: "srv-wedding",
        name: "Wedding Photography",
        category_label: "Traditional • Candid Outdoor",
        price: 45000,
        duration_mins: 480,
        description: "Beautifully capturing your special day with traditional and candid photography.",
        deliverables: "Traditional Photography, Candid Photography, Pre & Post Wedding Shoots, Album Design & Printing",
        image_url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "srv-video",
        name: "Videography & Cinematography",
        category_label: "Traditional • Cinematic Events",
        price: 35000,
        duration_mins: 360,
        description: "Cinematic storytelling to make your moments last forever.",
        deliverables: "Traditional Video, Cinematic Video, Event Coverage, LED Wall Live Streaming",
        image_url: "https://images.unsplash.com/photo-1533038590840-1cde6e668a91?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "srv-drone",
        name: "Drone Videography",
        category_label: "Aerial • Events Weddings",
        price: 15000,
        duration_mins: 180,
        description: "Aerial shots to give a stunning view of your events.",
        deliverables: "Wedding Drone Shoot, Event Coverage, Aerial Cinematic Shots, Professional Drone Team",
        image_url: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "srv-studio",
        name: "Studio Services",
        category_label: "Passport • Printing Restoration",
        price: 500,
        duration_mins: 30,
        description: "All your photo and printing needs with professional quality.",
        deliverables: "Passport Size Photos, Photo Printing, Photo Restoration, Lamination & Toner Refilling",
        image_url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "srv-gifts",
        name: "Customised Gifts",
        category_label: "Mugs • Pillows Keychains • T-Shirts",
        price: 399,
        duration_mins: 60,
        description: "Turn your photos into beautiful and personalised gifts.",
        deliverables: "Mugs & Magic Mugs, Pillows & Magic Pillows, Key Chains & T-Shirts, Caps & More",
        image_url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "srv-frames",
        name: "Photo Frames & Printing",
        category_label: "Premium Frames Album Printing",
        price: 899,
        duration_mins: 60,
        description: "Premium quality frames and printing services for all occasions.",
        deliverables: "Photo Frames (All Sizes), Album Printing, Invitation Cards, Digital Printing Services",
        image_url: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }, [profile.services, studioProfile.services]);

  // Real backend products added from client dashboard only
  const products = useMemo(() => {
    return Array.isArray(doc?.products) ? doc.products : [];
  }, [doc?.products]);

  // Sourced and categorized products for Gifts and Frames
  const giftProducts = useMemo(() => {
    return products.filter((p) => {
      const cat = (p.category_id || p.category || "").toLowerCase();
      const name = (p.name || "").toLowerCase();
      const tags = Array.isArray(p.tags) ? p.tags.join(" ").toLowerCase() : "";
      if (cat === "cat-frames" || (!cat.includes("gift") && (name.includes("frame") || name.includes("wall art") || tags.includes("frame")))) {
        return false;
      }
      return true;
    });
  }, [products]);

  const frameProducts = useMemo(() => {
    return products.filter((p) => {
      const cat = (p.category_id || p.category || "").toLowerCase();
      const name = (p.name || "").toLowerCase();
      const tags = Array.isArray(p.tags) ? p.tags.join(" ").toLowerCase() : "";
      return cat === "cat-frames" || cat.includes("frame") || name.includes("frame") || name.includes("wall") || tags.includes("frame");
    });
  }, [products]);

  // Authentic studio offers & packages
  const defaultOffers = useMemo(() => [
    {
      id: "off-37352865",
      title: "Grand Royal Wedding Cinema Combo",
      badge: "BESTSELLER • 25% OFF",
      original_price: 75000,
      offer_price: 55000,
      coupon_code: "STARWEDDING",
      valid_until: "Valid for 2026-2027 Wedding Bookings",
      description: "Full 2-Day Traditional & Candid Coverage + 4K Drone Aerial Shoot + LED Wall Live Streaming + 2 Magic Mugs Free!",
      deliverables: "2 Full Days Photo & 4K Cinema Video\nDual Operator 4K Drone\n40-Page Teakwood Synthetic Album\n2 Personalized Magic Mugs\nFull HD Pen Drive",
      image_url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80",
      active: true,
      featured_banner: true,
      category: "Wedding"
    },
    {
      id: "off-c1fd040c",
      title: "Candid Sunset Pre-Wedding Special",
      badge: "POPULAR • SAVE ₹8,000",
      original_price: 28000,
      offer_price: 19999,
      coupon_code: "PREWEDDING",
      valid_until: "Limited Slots This Month",
      description: "1 Full Day Outdoor Destination Shoot + 1-Minute Cinematic Instagram Reel + 12x18 Acrylic Floating Wall Frame.",
      deliverables: "1 Full Day Outdoor Shoot\n50 Retouched High-Res Images\n60s Cinematic Reel\n12x18 Acrylic Floating Frame",
      image_url: "https://images.unsplash.com/photo-1533038590840-1cde6e668a91?auto=format&fit=crop&w=1200&q=80",
      active: true,
      featured_banner: true,
      category: "Pre-Wedding"
    },
    {
      id: "off-8a39b201",
      title: "Birthday & Baby Shower Keepsake Combo",
      badge: "FAMILY PACK • 30% OFF",
      original_price: 21500,
      offer_price: 14999,
      coupon_code: "STARBABY",
      valid_until: "Instant Booking Available",
      description: "Candid Photography + 4K Highlight Reel + Custom Photo Tee + Magic Colour Reveal Mug for the family.",
      deliverables: "3 Hours Candid Event Coverage\nFull HD Highlight Video\nCustom Printed Family T-Shirt\nPersonalised Magic Mug\nOnline Gallery Link",
      image_url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
      active: true,
      featured_banner: true,
      category: "Birthday"
    },
    {
      id: "off-91f82c44",
      title: "Customised Gifts Mega Hamper",
      badge: "GIFT HAMPER • SAVE ₹1,000",
      original_price: 2999,
      offer_price: 1999,
      coupon_code: "LOVEGIFT",
      valid_until: "All Season Gift Box",
      description: "Heart Sequins Magic Pillow + 2 Custom Magic Mugs + 12x18 Matte Wooden Wall Frame with gift wrapping.",
      deliverables: "1 Heart Sequins Magic Pillow\n2 Photo Reveal Magic Mugs\n1 12x18 Teakwood Photo Frame\nComplimentary Premium Gift Box",
      image_url: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80",
      active: true,
      featured_banner: true,
      category: "Gifts"
    }
  ], []);

  // Studio offers sourced dynamically from Client Studio Dashboard
  const studioOffers = useMemo(() => {
    const raw = Array.isArray(studioProfile?.offers) && studioProfile.offers.length
      ? studioProfile.offers
      : Array.isArray(profile?.offers) && profile.offers.length
      ? profile.offers
      : [];
    if (raw.length) {
      return raw.filter((o) => o.active !== false);
    }
    return defaultOffers;
  }, [studioProfile?.offers, profile?.offers, defaultOffers]);

  // Offers hero auto-scrolling banner state
  const [activeOfferIndex, setActiveOfferIndex] = useState(0);
  const [isOfferCarouselPaused, setIsOfferCarouselPaused] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState("");
  const [offersCategoryFilter, setOffersCategoryFilter] = useState("All");

  const bannerOffers = useMemo(() => {
    const filtered = studioOffers.filter((o) => o.featured_banner !== false && o.active !== false);
    return filtered.length > 0 ? filtered : studioOffers;
  }, [studioOffers]);

  // Auto-rotate hero offers banner every 4 seconds
  useEffect(() => {
    if (activeTab !== "offers" || bannerOffers.length <= 1 || isOfferCarouselPaused) return;
    const timer = setInterval(() => {
      setActiveOfferIndex((prev) => (prev + 1) % bannerOffers.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [activeTab, bannerOffers.length, isOfferCarouselPaused]);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    name: "",
    phone: "",
    date: new Date().toISOString().split("T")[0],
    time: "10:00 AM",
    notes: ""
  });
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // Cart & Order Drawer state
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [customizingProduct, setCustomizingProduct] = useState(null);
  const [customPhotoFile, setCustomPhotoFile] = useState(null);
  const [customPhotoPreview, setCustomPhotoPreview] = useState("");
  const [customNote, setCustomNote] = useState("");

  // Search Dialog
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const mainPhone = studioProfile.phone || doc?.phone || "8489809605";
  const whatsappNum = (studioProfile.whatsapp || mainPhone).replace(/[^0-9]/g, "");

  const handleOpenBooking = (srv) => {
    setSelectedService(srv);
    setBookingModalOpen(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!bookingForm.name || !bookingForm.phone) {
      toast.error("Please enter your name and phone number");
      return;
    }
    setSubmittingBooking(true);
    try {
      const payload = {
        patient_name: bookingForm.name,
        patient_phone: bookingForm.phone,
        service_id: selectedService?.id || "",
        service_name: selectedService?.name || "General Studio Shoot",
        preferred_time: `${bookingForm.date} ${bookingForm.time}`,
        notes: bookingForm.notes || "",
        service_price: Number(selectedService?.price || 0),
        source: "public"
      };

      const bookingEndpoint = `${apiBase}/providers/${doc.id}/book`;
      await axios.post(bookingEndpoint, payload);
      toast.success("Shoot booking confirmed! Our team will contact you shortly.");
      setBookingModalOpen(false);
      setBookingForm({ name: "", phone: "", date: new Date().toISOString().split("T")[0], time: "10:00 AM", notes: "" });
    } catch (err) {
      // Direct WhatsApp fallback
      const msg = `Hi ${doc.name || "Star Digital Studios"}, I want to book *${selectedService?.name || "Studio Session"}* on ${bookingForm.date} at ${bookingForm.time}.\nName: ${bookingForm.name}\nPhone: ${bookingForm.phone}\nNotes: ${bookingForm.notes || "None"}`;
      window.open(`https://wa.me/${whatsappNum}?text=${encodeURIComponent(msg)}`, "_blank");
      setBookingModalOpen(false);
      toast.success("Booking request sent via WhatsApp!");
    } finally {
      setSubmittingBooking(false);
    }
  };

  const openWhatsApp = (phoneTarget = whatsappNum, customMessage = "") => {
    const text = customMessage || `Hello ${doc.name || "Star Digital Studios"}, I am inquiring about your photography services and customized gifts.`;
    window.open(`https://wa.me/${phoneTarget}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const openCall = (phoneNumber) => {
    window.open(`tel:${phoneNumber}`, "_self");
  };

  const handleAddToCart = (product, photoPreviewUrl = null, notes = "") => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1, photoPreview: photoPreviewUrl || item.photoPreview }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, photoPreview: photoPreviewUrl, customNote: notes }];
    });
    toast.success(`Added ${product.name} to cart!`);
    setCustomizingProduct(null);
    setCustomPhotoFile(null);
    setCustomPhotoPreview("");
    setCustomNote("");
  };

  const updateCartQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);
  }, [cart]);

  const handleCheckoutViaWhatsApp = () => {
    if (!cart.length) return;
    const itemsList = cart.map((item) => `• ${item.name} (x${item.quantity}) - ₹${item.price * item.quantity}${item.customNote ? ` [Note: ${item.customNote}]` : ""}`).join("\n");
    const msg = `Hi Star Digital Studios, I would like to place an order for Customized Gifts:\n\n${itemsList}\n\n*Total Amount: ₹${cartTotal.toLocaleString()}*\n\nPlease confirm my order.`;
    window.open(`https://wa.me/919787515273?text=${encodeURIComponent(msg)}`, "_blank");
    setCartOpen(false);
  };

  // 12 Departments Data from Contact Us image
  const contactDepartments = [
    {
      id: "dept-founder",
      title: "Founder",
      person: "VK. BOOPATHI",
      desc: "Business Enquiries, Partnership & Overall Support",
      phone: "8489809605",
      photo: "/studio/founder.jpg"
    },
    {
      id: "dept-photo",
      title: "Photography & Videography",
      desc: "Wedding, Events, Candid, Cinematic",
      phone: "8489809605",
      photo: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=300&q=80"
    },
    {
      id: "dept-design",
      title: "Design & Editing",
      desc: "Photo Editing, Album Design, Video Editing, Invitations",
      phone: "8489809605",
      photo: "https://images.unsplash.com/photo-1581291518655-9523c932deb4?auto=format&fit=crop&w=300&q=80"
    },
    {
      id: "dept-gifts",
      title: "Customised Gifts",
      desc: "Mugs, Pillows, Keychains, T-Shirts, Caps & More",
      phone: "9787515273",
      photo: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=300&q=80"
    },
    {
      id: "dept-tracking",
      title: "Order Status / Tracking",
      desc: "Order Updates, Tracking, Delivery Support",
      phone: "7305270702",
      icon: Briefcase
    },
    {
      id: "dept-accounts",
      title: "Accounts / Payment",
      desc: "Payments, Invoices, Bills & Account Queries",
      phone: "7530030097",
      icon: CreditCard
    },
    {
      id: "dept-wholesale",
      title: "Wholesale / B2B Enquiry",
      desc: "Bulk Orders, Retailers, Business Enquiries",
      phone: "7639590930",
      icon: Building
    },
    {
      id: "dept-franchise",
      title: "Franchise Enquiry",
      desc: "New Branch, Franchise Opportunities",
      phone: "8489809605",
      icon: Award
    },
    {
      id: "dept-jobs",
      title: "Jobs / Careers",
      desc: "Job Enquiries, Work Opportunities, Freelance & Team Hiring",
      phone: "7397589105",
      icon: Users
    },
    {
      id: "dept-emergency",
      title: "24/7 Emergency Contact",
      desc: "Urgent Support & Emergency Assistance",
      phone: "7530030087",
      icon: Zap
    },
    {
      id: "dept-care",
      title: "Customer Care",
      desc: "General Enquiries, Customer Support",
      phone: "9787515273",
      icon: Headphones
    },
    {
      id: "dept-printing",
      title: "Printing - Retailers & Studio Owners",
      desc: "Printing Support, Toner Refilling, Bulk Printing",
      phone: "7530030087",
      icon: Printer
    }
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827] font-sans antialiased selection:bg-amber-500 selection:text-black">
      {/* ============================================================== */}
      {/* 1. TOP GLOBAL NAVBAR                                           */}
      {/* ============================================================== */}
      {/* 1. TOP GLOBAL NAVBAR (Clean White Background Matching Reference)*/}
      {/* ============================================================== */}
      <header className="sticky top-0 z-50 bg-white text-gray-900 border-b border-gray-200/90 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo brand matching reference */}
          <div
            onClick={() => setActiveTab("home")}
            className="flex items-center gap-3 cursor-pointer group flex-shrink-0"
          >
            <div className="relative">
              <div className="w-11 h-11 rounded-full overflow-hidden border border-amber-400 shadow-sm bg-black flex items-center justify-center">
                <img
                  src="/studio/emblem.jpg"
                  alt="Star Digital Studios"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
                <Sparkles className="w-5 h-5 text-amber-500 absolute" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-display text-base sm:text-lg font-black tracking-tight leading-none text-gray-900">
                <span className="text-[#D97706]">STAR</span>
                <span>DIGITAL STUDIOS VIDEOS</span>
              </div>
              <div className="text-[10px] uppercase font-bold tracking-[0.22em] text-gray-600 mt-0.5">
                CUSTOMISED GIFTS
              </div>
            </div>
          </div>

          {/* Clean Desktop Navigation Links with Proper Spacing */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7 2xl:gap-8 text-[13px] xl:text-[14px] font-semibold text-[#1F2937] whitespace-nowrap">
            {[
              { id: "home", label: "Home" },
              { id: "about", label: "About Us" },
              { id: "services", label: "Services" },
              { id: "gifts", label: "Customised Gifts" },
              { id: "frames", label: "Photo Frames" },
              { id: "gallery", label: "Gallery" },
              { id: "offers", label: "Offers" },
              { id: "contact", label: "Contact" }
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative py-1.5 transition-colors ${
                    active ? "text-[#D97706] font-bold" : "text-[#374151] hover:text-[#D97706]"
                  }`}
                >
                  {tab.label}
                  {active && (
                    <span className="absolute -bottom-1 left-0 right-0 h-[2.5px] bg-[#D97706] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Utility Right Bar: Search, User, Cart, Order Now Button */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 flex-shrink-0">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-9 h-9 rounded-full hover:bg-gray-100 text-gray-700 hover:text-black flex items-center justify-center transition-colors"
              title="Search Services & Products"
            >
              <Search className="w-[18px] h-[18px]" />
            </button>

            {customer ? (
              <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full text-xs">
                <User className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-gray-800 font-semibold truncate max-w-[80px] sm:max-w-[100px]">{customer.name || "Customer"}</span>
                <button onClick={onLogout} className="text-[10px] text-gray-500 hover:text-black underline ml-1">Exit</button>
              </div>
            ) : (
              <button
                onClick={onLoginOpen}
                className="w-9 h-9 rounded-full hover:bg-gray-100 text-gray-700 hover:text-black flex items-center justify-center transition-colors"
                title="Customer Login / Register"
              >
                <User className="w-[18px] h-[18px]" />
              </button>
            )}

            <button
              onClick={() => setCartOpen(true)}
              className="relative w-9 h-9 rounded-full hover:bg-gray-100 text-gray-700 hover:text-black flex items-center justify-center transition-colors"
              title="View Cart"
            >
              <ShoppingCart className="w-[18px] h-[18px]" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E59819] text-white font-black text-[9px] flex items-center justify-center shadow-sm">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </button>

            <button
              onClick={() => handleOpenBooking({ name: "General Shoot & Order Consultation" })}
              className="hidden sm:inline-flex items-center gap-1.5 bg-[#E59819] hover:bg-[#D48806] text-white font-bold text-xs sm:text-[13px] px-5 py-2.5 rounded-full shadow-sm hover:shadow transition-all whitespace-nowrap"
            >
              Order Now <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Mobile / Tablet Menu Button (shown below lg: 1024px) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-9 h-9 rounded-lg hover:bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer (Clean White Background) */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-4 space-y-1 shadow-lg">
            {[
              { id: "home", label: "Home" },
              { id: "about", label: "About Us" },
              { id: "services", label: "Services" },
              { id: "gifts", label: "Customised Gifts" },
              { id: "frames", label: "Photo Frames" },
              { id: "gallery", label: "Gallery" },
              { id: "offers", label: "Offers" },
              { id: "contact", label: "Contact" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold ${
                  activeTab === tab.id ? "bg-amber-50 text-[#D97706] font-bold" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
            <div className="pt-3 flex gap-2 border-t border-gray-100 mt-2">
              <button
                onClick={() => {
                  handleOpenBooking({ name: "Quick Consultation" });
                  setMobileMenuOpen(false);
                }}
                className="flex-1 bg-[#E59819] text-white text-center py-2.5 rounded-full font-bold text-xs"
              >
                Order Now →
              </button>
              <button
                onClick={() => {
                  openWhatsApp();
                  setMobileMenuOpen(false);
                }}
                className="bg-emerald-600 text-white px-4 py-2.5 rounded-full flex items-center justify-center"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ============================================================== */}
      {/* 2. TAB: HOME (Exact replica of media_1791877595681_b52eedd7)   */}
      {/* ============================================================== */}
      {activeTab === "home" && (
        <div>
          {/* Main Hero Section with Founder & Bio - Clean White Editorial Studio */}
          <section className="relative bg-white border-b border-gray-100 py-14 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 text-gray-900">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Left Column: Founder Title, Bio, 4 Pillars, Vision with Framer Motion */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.1, delayChildren: 0.05 }
                  }
                }}
                className="lg:col-span-7 space-y-6"
              >
                {/* Eyebrow & Name */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
                  }}
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-[11px] font-black uppercase tracking-[0.25em] mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    FOUNDER & CEO
                  </div>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-gray-900 font-display leading-tight">
                    VK. BOOPATHI
                  </h1>
                  <div className="flex items-center gap-2.5 mt-2">
                    <span className="w-8 h-[2.5px] bg-amber-500 rounded-full" />
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.18em] text-amber-700 font-mono">
                      FOUNDER & CEO STAR GROUPS
                    </span>
                  </div>
                </motion.div>

                {/* Biography Narrative */}
                <motion.p
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
                  }}
                  className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-xl font-normal"
                >
                  <strong className="text-gray-900 font-semibold">VK. BOOPATHI</strong> is the visionary Founder &amp; CEO of <strong className="text-amber-700 font-semibold">STAR GROUPS</strong> and <strong className="text-gray-900 font-semibold">STAR DIGITAL STUDIOS VIDEOS – CUSTOMISED GIFTS</strong>. With an unwavering dedication to photography excellence and modern technology, he built this platform to bring together premium wedding photography, 4K videography, personalized gifts, photo frames, and digital printing under one seamless roof.
                </motion.p>

                {/* 4 Feature Pillar Boxes: Structured & Professional */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
                  }}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl"
                >
                  {[
                    { icon: Camera, title: "Creative Vision", desc: "Artistic Direction" },
                    { icon: Users, title: "Customer Delight", desc: "1000+ Happy Families" },
                    { icon: Lightbulb, title: "Modern Tech", desc: "4K Cine & Drone" },
                    { icon: TrendingUp, title: "Brand Growth", desc: "Across Tamil Nadu" },
                  ].map((pillar, pIdx) => {
                    const Icon = pillar.icon;
                    return (
                      <motion.div
                        key={pIdx}
                        whileHover={{ y: -3, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-gray-50/80 hover:bg-white border border-gray-200/90 hover:border-amber-400/80 rounded-2xl p-4 text-center transition-all shadow-2xs hover:shadow-md group cursor-default"
                      >
                        <div className="w-10 h-10 mx-auto rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-amber-700 transition-colors">
                          {pillar.title}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5 font-medium">
                          {pillar.desc}
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>

                {/* OUR VISION Card: Structured & Elegant */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
                  }}
                  className="bg-gradient-to-r from-amber-50/60 via-amber-50/30 to-white border border-amber-200/80 rounded-2xl p-5 shadow-2xs max-w-xl flex items-start gap-4"
                >
                  <div className="w-11 h-11 rounded-xl bg-amber-500 text-black flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <Target className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-800 mb-1 flex items-center gap-2">
                      <span>OUR VISION</span>
                      <span className="w-6 h-[1.5px] bg-amber-400" />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700 italic font-serif leading-relaxed">
                      “To build a trusted creative brand that combines photography, technology, personalised products and professional customer service under one platform.”
                    </p>
                  </div>
                </motion.div>
              </motion.div>

              {/* Right Column: Clean Professional Founder Portrait without card enclosure */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                className="lg:col-span-5 relative flex flex-col items-center justify-end"
              >
                {/* Subtle soft warm studio backlight glow behind founder */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-tr from-amber-200/35 via-orange-100/20 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

                {/* Floating "Your Moments Our Passion" cursive stamp on canvas */}
                <div className="absolute top-0 right-2 sm:right-6 text-right select-none pointer-events-none z-10">
                  <div className="font-serif italic text-amber-600/90 text-xl sm:text-2xl drop-shadow-sm font-semibold">
                    Your Moments
                  </div>
                  <div className="font-serif italic text-gray-800 text-lg sm:text-xl font-semibold">
                    Our Passion <span className="text-amber-500">♡</span>
                  </div>
                </div>

                {/* Founder Cutout standing directly on the white canvas with NO card box */}
                <div className="relative w-full max-w-sm sm:max-w-md flex flex-col items-center">
                  <img
                    src="/studio/founder_nobg.png"
                    alt="VK. Boopathi - Founder & CEO"
                    className="w-full max-h-[520px] object-contain object-bottom drop-shadow-[0_20px_35px_rgba(0,0,0,0.18)] hover:scale-102 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.src = "/studio/founder.jpg";
                    }}
                  />

                  {/* Clean grounded credentials pill under the figure */}
                  <div className="w-full mt-3 bg-white/95 backdrop-blur-md border border-gray-200/80 rounded-2xl p-3 sm:p-3.5 shadow-xl shadow-gray-200/50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500 text-black font-serif font-black flex items-center justify-center text-sm shadow-md">
                        VB
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-900">
                          VK. BOOPATHI
                        </div>
                        <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-amber-700 font-bold font-mono">
                          FOUNDER & CEO • STAR GROUPS
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => openWhatsApp("8489809605", "Hello VK. Boopathi, I would like to connect regarding Star Digital Studios.")}
                      className="bg-amber-500 hover:bg-amber-600 text-black font-black text-xs rounded-xl h-9 px-4 shadow-md transition-all hover:scale-105 shrink-0"
                    >
                      Connect →
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Stats Bar (Dark) matching reference image */}
          <section className="bg-[#111625] text-white py-4 px-4 sm:px-8 border-y border-gray-800">
            <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="flex items-center justify-center gap-3">
                <Calendar className="w-6 h-6 text-amber-400" />
                <div className="text-left">
                  <div className="text-sm font-extrabold text-white">2023</div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-400">Established</div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Users className="w-6 h-6 text-amber-400" />
                <div className="text-left">
                  <div className="text-sm font-extrabold text-white">1000+</div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-400">Happy Customers</div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Award className="w-6 h-6 text-amber-400" />
                <div className="text-left">
                  <div className="text-sm font-extrabold text-white">Quality</div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-400">Services</div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3">
                <TrendingUp className="w-6 h-6 text-amber-400" />
                <div className="text-left">
                  <div className="text-sm font-extrabold text-white">Expanding</div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-400">Across Tamil Nadu</div>
                </div>
              </div>
            </div>
          </section>

          {/* Yellow Banner Strip: STAR GROUPS A CREATIVE BUSINESS PLATFORM */}
          <section className="bg-amber-500 text-black py-3 px-4 sm:px-8">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-black" />
                <span className="font-extrabold text-xs uppercase tracking-widest">
                  STAR GROUPS · A CREATIVE BUSINESS PLATFORM
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-bold tracking-wider uppercase text-black/90">
                <span onClick={() => setActiveTab("services")} className="cursor-pointer hover:underline">PHOTOGRAPHY & VIDEOGRAPHY</span>
                <span>•</span>
                <span onClick={() => setActiveTab("gifts")} className="cursor-pointer hover:underline">CUSTOMISED GIFTS</span>
                <span>•</span>
                <span onClick={() => setActiveTab("frames")} className="cursor-pointer hover:underline">PHOTO FRAMES & PRINTING</span>
                <span>•</span>
                <span onClick={() => setActiveTab("services")} className="cursor-pointer hover:underline">STUDIO SERVICES</span>
              </div>
            </div>
          </section>

          {/* Quick Hub Navigation Cards */}
          <section className="py-12 px-4 sm:px-8 max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 font-display">
                Everything for Your <span className="text-amber-600">Visual Memories</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-2">
                Explore our full spectrum of professional shoots, customized gifts, bespoke framing, and printing solutions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div
                onClick={() => setActiveTab("services")}
                className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-gray-900">Photography & Shoots</h3>
                <p className="text-xs text-gray-600 mt-1">Wedding, pre-wedding, maternity, event shoots, and cinema drone videography.</p>
                <div className="mt-4 text-xs font-bold text-amber-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Explore Services <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              <div
                onClick={() => setActiveTab("gifts")}
                className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Gift className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-gray-900">Customised Gifts Store</h3>
                <p className="text-xs text-gray-600 mt-1">Magic mugs, photo pillows, laser engraved keychains, custom tees with instant photo upload.</p>
                <div className="mt-4 text-xs font-bold text-amber-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Shop Personalised Gifts <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              <div
                onClick={() => setActiveTab("contact")}
                className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Phone className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-gray-900">Department Contacts</h3>
                <p className="text-xs text-gray-600 mt-1">Direct WhatsApp and call support for orders, wedding bookings, tracking and B2B wholesale.</p>
                <div className="mt-4 text-xs font-bold text-amber-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Contact Right Team <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </section>

          {/* Signature Portfolio Highlights on Home */}
          <section className="py-10 px-4 sm:px-8 max-w-7xl mx-auto border-t border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-600">
                  OUR RECENT WORK
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 font-display mt-1">
                  Signature <span className="text-amber-600">Portfolio</span>
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  A glimpse of authentic moments, wedding rituals, drone views and custom keepsakes.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("gallery")}
                className="border-amber-500 text-amber-700 hover:bg-amber-50 font-bold text-xs rounded-full self-start sm:self-auto"
              >
                View Full Gallery ({galleryItems.length}) →
              </Button>
            </div>

            {galleryItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {galleryItems.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setLightboxItem(item)}
                    className="group relative rounded-xl overflow-hidden aspect-square bg-gray-100 cursor-pointer shadow-xs hover:shadow-md transition-all"
                  >
                    <img
                      src={resolveMediaUrl(item.image_url)}
                      alt={item.title || "Studio Shoot"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5 text-white">
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-xs text-white px-1.5 py-0.5 rounded self-start">
                        {item.category}
                      </span>
                      <div>
                        <p className="text-[11px] font-bold line-clamp-1">{item.title}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500 font-medium">Gallery photos will appear here once uploaded from the client dashboard.</p>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. TAB: SERVICES (Exact replica of media_1791873049924_11b45032)*/}
      {/* ============================================================== */}
      {activeTab === "services" && (
        <div>
          {/* Services White Header Hero */}
          <section className="bg-white text-gray-900 py-10 sm:py-12 px-4 sm:px-8 border-b border-gray-100">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="text-xs font-mono text-gray-400 flex items-center gap-2">
                  <span onClick={() => setActiveTab("home")} className="cursor-pointer hover:text-gray-900 transition-colors">Home</span>
                  <span className="text-gray-400">&gt;</span>
                  <span className="text-amber-600 font-bold">Services</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-gray-900 font-display uppercase leading-tight">
                  OUR <span className="text-amber-600">SERVICES</span>
                </h1>
                <div className="text-xs font-bold tracking-widest uppercase text-gray-500">
                  CAPTURING MOMENTS • CREATING MEMORIES • CUSTOMISING GIFTS
                </div>
                <p className="text-xs sm:text-sm text-gray-600 max-w-xl leading-relaxed">
                  Professional photography, creative videography, premium photo printing, and personalised gifts — all in one place with quality and dedication.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => handleOpenBooking({ name: "Photography & Cinema Package" })}
                    className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-full px-6 py-2.5 h-auto shadow-xs"
                  >
                    Book a Service <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => openWhatsApp()}
                    className="border-gray-300 bg-gray-50 text-gray-800 hover:bg-gray-100 text-xs rounded-full px-5 py-2.5 h-auto flex items-center gap-2"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> Instant Quote on WhatsApp
                  </Button>
                </div>
              </div>

              {/* Right Canon Camera Visual & Cursive */}
              <div className="lg:col-span-5 relative flex justify-center">
                <div className="relative w-full max-w-md h-64 sm:h-72 rounded-2xl overflow-hidden shadow-md border border-gray-200 group bg-black">
                  <img
                    src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80"
                    alt="Canon Pro Optics"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-5">
                    <div className="font-serif italic text-amber-300 text-xl font-normal tracking-wide drop-shadow-sm">
                      Your Moments Our Passion ♡
                    </div>
                    <div className="text-[10px] text-gray-300 uppercase tracking-widest mt-0.5 drop-shadow-sm">
                      Canon Pro Cinema Optics & High-Res 4K Sensors
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Six Trust Badges Strip (White background) matching reference */}
          <section className="bg-white text-gray-900 py-6 border-y border-gray-200 px-4 sm:px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
              <div className="flex flex-col items-center">
                <Camera className="w-6 h-6 text-gray-900 mb-1.5" />
                <div className="font-bold text-xs">Professional Equipment</div>
              </div>
              <div className="flex flex-col items-center">
                <Award className="w-6 h-6 text-gray-900 mb-1.5" />
                <div className="font-bold text-xs">High Quality Output</div>
              </div>
              <div className="flex flex-col items-center">
                <Users className="w-6 h-6 text-gray-900 mb-1.5" />
                <div className="font-bold text-xs">Experienced Team</div>
              </div>
              <div className="flex flex-col items-center">
                <Cpu className="w-6 h-6 text-gray-900 mb-1.5" />
                <div className="font-bold text-xs">Modern Technology</div>
              </div>
              <div className="flex flex-col items-center">
                <Headphones className="w-6 h-6 text-gray-900 mb-1.5" />
                <div className="font-bold text-xs">Customer Support</div>
              </div>
              <div className="flex flex-col items-center">
                <ShieldCheck className="w-6 h-6 text-gray-900 mb-1.5" />
                <div className="font-bold text-xs">Trusted Service</div>
              </div>
            </div>
          </section>

          {/* Service Categories Quick Row (White / Light Background) */}
          <section className="py-12 px-4 sm:px-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 font-display">
                Our <span className="text-amber-600">Service Categories</span>
              </h2>
              <span className="text-[10px] tracking-widest uppercase font-mono text-gray-500">
                EXPLORE OUR PROFESSIONAL SERVICES
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {services.slice(0, 6).map((srv, idx) => (
                <div
                  key={srv.id || idx}
                  onClick={() => handleOpenBooking(srv)}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer transition-all transform hover:-translate-y-1 shadow-sm hover:shadow-md group text-left"
                >
                  <div className="h-28 w-full overflow-hidden bg-gray-100 relative">
                    <img
                      src={srv.image_url ? resolveMediaUrl(srv.image_url) : "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=400&q=80"}
                      alt={srv.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-3">
                    <div className="font-bold text-xs text-gray-900 truncate group-hover:text-amber-600 transition-colors">
                      {srv.name}
                    </div>
                    <div className="text-[10px] text-gray-500 truncate mt-0.5">
                      {srv.category_label || srv.deliverables?.split(",")[0] || "Custom Package"}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-amber-700">
                        ₹{Number(srv.price || 0).toLocaleString()}
                      </span>
                      <div className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center text-[10px] font-bold">
                        →
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Featured Detailed Showcase Grid (2 Columns x 3 Rows) matching reference */}
          <section className="py-6 px-4 sm:px-8 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map((srv, idx) => (
                <div
                  key={srv.id || idx}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all grid grid-cols-1 sm:grid-cols-12 text-left"
                >
                  {/* Card Image */}
                  <div className="sm:col-span-5 h-48 sm:h-auto overflow-hidden bg-gray-100 relative">
                    <img
                      src={srv.image_url ? resolveMediaUrl(srv.image_url) : "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80"}
                      alt={srv.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Card Content */}
                  <div className="sm:col-span-7 p-5 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base font-display">{srv.name}</h3>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        {srv.description}
                      </p>

                      {/* Checklist deliverables */}
                      <div className="mt-3 space-y-1">
                        {(srv.deliverables ? srv.deliverables.split(",") : [
                          "Traditional Coverage", "Candid Moments", "Professional Output", "Express Delivery"
                        ]).map((del, dIdx) => (
                          <div key={dIdx} className="flex items-center gap-2 text-xs text-gray-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                            <span className="truncate">{del.trim()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-sm font-extrabold text-gray-900">
                        ₹{Number(srv.price || 0).toLocaleString()}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleOpenBooking(srv)}
                        className="bg-black hover:bg-gray-800 text-white text-xs rounded-full px-4 h-8"
                      >
                        View Details →
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 5-Step Working Process matching reference */}
          <section className="py-16 px-4 sm:px-8 border-t border-gray-200 bg-[#F8FAFC]">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 font-display">
                  Our <span className="text-amber-600">Working Process</span>
                </h2>
                <span className="text-[10px] tracking-widest uppercase font-mono text-gray-500">
                  SIMPLE • FAST • PROFESSIONAL
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { num: "01", title: "Consultation", desc: "Tell us your requirements", icon: MessageSquare },
                  { num: "02", title: "Service Selection", desc: "Choose your service", icon: Camera },
                  { num: "03", title: "Book / Confirm", desc: "Fix date & details", icon: Calendar },
                  { num: "04", title: "Shoot / Design", desc: "We capture / design", icon: Sparkles },
                  { num: "05", title: "Delivery", desc: "Get your final output", icon: Heart },
                ].map((step, idx) => {
                  const IconComp = step.icon;
                  return (
                    <div key={idx} className="bg-white border border-gray-200 p-4 rounded-xl text-center shadow-sm relative group">
                      <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mb-2">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div className="text-[11px] font-mono text-amber-600 font-bold">{step.num}</div>
                      <div className="font-bold text-sm text-gray-900 mt-1">{step.title}</div>
                      <div className="text-xs text-gray-500 mt-1">{step.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Bottom CTA Banner matching reference */}
          <section className="bg-gradient-to-r from-black via-[#161C2A] to-black py-12 px-4 sm:px-8 border-t border-gray-800 text-white">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <div className="text-xs uppercase font-bold tracking-widest text-gray-400">
                  LET'S CREATE
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-500 font-display">
                  SOMETHING SPECIAL
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  Book your photography, videography or customised gifts today.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => handleOpenBooking({ name: "Special Studio Session" })}
                  className="bg-white hover:bg-gray-100 text-black font-bold text-xs rounded-full px-6 py-2.5 h-auto"
                >
                  Book a Service →
                </Button>
                <Button
                  onClick={() => openWhatsApp()}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold text-xs rounded-full px-5 py-2.5 h-auto flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" /> Chat on WhatsApp
                </Button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. TAB: ABOUT US (Exact replica of media_1791875322650_7e32fed7)*/}
      {/* ============================================================== */}
      {activeTab === "about" && (
        <div>
          {/* Header */}
          <section className="bg-white text-gray-900 py-10 px-4 sm:px-8 border-b border-gray-100">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-gray-400 flex items-center gap-2">
                  <span onClick={() => setActiveTab("home")} className="cursor-pointer hover:text-gray-900 transition-colors">Home</span>
                  <span className="text-gray-400">&gt;</span>
                  <span className="text-amber-600 font-bold">About Us</span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display mt-2 uppercase text-gray-900">
                  ABOUT <span className="text-amber-600">US</span>
                </h1>
                <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1.5">
                  CAPTURING MOMENTS • CREATING MEMORIES • CUSTOMISING GIFTS
                </div>
              </div>
              <div className="font-serif italic text-amber-600 text-2xl sm:text-3xl">
                Your Moments Our Passion ♡
              </div>
            </div>
          </section>

          {/* OUR STORY & Founder Section */}
          <section className="py-12 px-4 sm:px-8 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Founder Image */}
              <div className="lg:col-span-4">
                <div className="rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-black">
                  <img
                    src="/studio/founder.jpg"
                    alt="VK. Boopathi"
                    className="w-full h-auto object-cover"
                    onError={(e) => { e.currentTarget.src = "/studio/home_hero.jpg"; }}
                  />
                </div>
              </div>

              {/* Story Content & Badges */}
              <div className="lg:col-span-8 space-y-6">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.25em] text-gray-500">
                    OUR STORY
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-gray-900 font-display mt-1">
                    STAR DIGITAL STUDIOS VIDEOS — CUSTOMISED GIFTS
                  </h2>
                </div>

                <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
                  <p>
                    STAR DIGITAL STUDIOS VIDEOS – CUSTOMISED GIFTS is a creative studio providing professional photography, videography, personalised gifts, photo frames and printing services with quality, creativity and customer satisfaction.
                  </p>
                  <p>
                    We aim to turn your special moments into beautiful memories and meaningful gifts through modern technology and creative designs.
                  </p>
                </div>

                {/* 5 Badges matching reference */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                  <div className="bg-white border border-gray-200 rounded-xl p-3 text-center shadow-sm">
                    <Award className="w-5 h-5 text-gray-800 mx-auto mb-1" />
                    <div className="text-[11px] font-bold text-gray-900">High Quality Services</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-3 text-center shadow-sm">
                    <Users className="w-5 h-5 text-gray-800 mx-auto mb-1" />
                    <div className="text-[11px] font-bold text-gray-900">Customer Satisfaction</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-3 text-center shadow-sm">
                    <Lightbulb className="w-5 h-5 text-gray-800 mx-auto mb-1" />
                    <div className="text-[11px] font-bold text-gray-900">Creative Designs</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-3 text-center shadow-sm">
                    <Cpu className="w-5 h-5 text-gray-800 mx-auto mb-1" />
                    <div className="text-[11px] font-bold text-gray-900">Modern Technology</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-3 text-center shadow-sm">
                    <TrendingUp className="w-5 h-5 text-gray-800 mx-auto mb-1" />
                    <div className="text-[11px] font-bold text-gray-900">Growing Brand</div>
                  </div>
                </div>

                {/* Founder Quote Card */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
                  <div className="inline-block bg-amber-500 text-black text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full mb-2">
                    FOUNDER & CEO
                  </div>
                  <div className="font-extrabold text-base text-gray-900">VK. BOOPATHI</div>
                  <div className="text-[11px] uppercase tracking-wider text-gray-600 font-semibold mb-3">
                    FOUNDER & CEO STAR GROUPS
                  </div>
                  <p className="text-xs sm:text-sm text-gray-800 italic font-serif leading-relaxed">
                    “To build a trusted creative brand that combines photography, technology, personalised products and professional customer service under one platform.”
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="mt-10 bg-white border border-gray-200 rounded-2xl p-6 grid grid-cols-2 sm:grid-cols-4 gap-6 shadow-sm text-center">
              <div>
                <Calendar className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                <div className="text-xl font-black text-gray-900">2023</div>
                <div className="text-xs text-gray-500 uppercase">Established</div>
              </div>
              <div>
                <Users className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                <div className="text-xl font-black text-gray-900">1000+</div>
                <div className="text-xs text-gray-500 uppercase">Happy Customers</div>
              </div>
              <div>
                <Award className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                <div className="text-xl font-black text-gray-900">Quality</div>
                <div className="text-xs text-gray-500 uppercase">Services</div>
              </div>
              <div>
                <MapPin className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                <div className="text-sm font-black text-gray-900">Kai Kalathur</div>
                <div className="text-xs text-gray-500">Perambalur District, Tamil Nadu</div>
              </div>
            </div>
          </section>

          {/* 4 Strategic Pillars: Vision, Mission, Values, Team */}
          <section className="py-10 px-4 sm:px-8 max-w-7xl mx-auto border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <Target className="w-8 h-8 text-amber-500 mb-3" />
                <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">OUR VISION</h3>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  To build a trusted creative brand that combines photography, technology, personalised products and professional customer service under one platform.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <Sparkles className="w-8 h-8 text-amber-500 mb-3" />
                <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">OUR MISSION</h3>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  To deliver high-quality photography, videography, customised gifts and printing services with creativity, innovation and customer satisfaction.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <Award className="w-8 h-8 text-amber-500 mb-3" />
                <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">OUR VALUES</h3>
                <ul className="text-xs text-gray-600 mt-2 space-y-1">
                  <li>• Quality</li>
                  <li>• Creativity</li>
                  <li>• Customer Satisfaction</li>
                  <li>• Modern Technology</li>
                  <li>• Trust & Transparency</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <Users className="w-8 h-8 text-amber-500 mb-3" />
                <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">OUR TEAM</h3>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  Behind STAR DIGITAL STUDIOS VIDEOS is a passionate and dedicated team working together to provide creative designs, quality products and the best customer experience.
                </p>
              </div>
            </div>
          </section>

          {/* OUR JOURNEY Timeline */}
          <section className="py-12 px-4 sm:px-8 max-w-7xl mx-auto border-t border-gray-200">
            <div className="text-left mb-8">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 font-display">
                OUR <span className="text-amber-600">JOURNEY</span>
              </h2>
              <div className="text-xs text-gray-500">
                From a small beginning to a growing creative brand.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              {[
                { year: "2023", title: "STAR GROUPS", sub: "Established" },
                { year: "2024", title: "Studio Development", sub: "Equipment & Space" },
                { year: "2025", title: "Service Expansion", sub: "Customised Gifts" },
                { year: "2026", title: "New Branches", sub: "& Rapid Growth" },
                { year: "2027", title: "Bigger Vision", sub: "Across Tamil Nadu" }
              ].map((item, idx) => (
                <div key={idx} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm text-center relative group">
                  <div className="w-10 h-10 mx-auto rounded-full bg-amber-500 text-black font-extrabold text-xs flex items-center justify-center mb-2">
                    {item.year}
                  </div>
                  <div className="font-bold text-xs text-gray-900">{item.title}</div>
                  <div className="text-[10px] text-gray-500">{item.sub}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. TAB: CONTACT (Exact replica of media_1791875322668_4f2fbeeb) */}
      {/* ============================================================== */}
      {activeTab === "contact" && (
        <div>
          {/* Header */}
          <section className="bg-white text-gray-900 py-10 px-4 sm:px-8 border-b border-gray-100">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-gray-400 flex items-center gap-2">
                  <span onClick={() => setActiveTab("home")} className="cursor-pointer hover:text-gray-900 transition-colors">Home</span>
                  <span className="text-gray-400">&gt;</span>
                  <span className="text-amber-600 font-bold">Contact Us</span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display mt-2 uppercase text-gray-900">
                  CONTACT <span className="text-amber-600">US</span>
                </h1>
                <div className="text-xs font-bold uppercase tracking-widest text-amber-600 mt-1.5">
                  CONTACT THE RIGHT TEAM
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-xl">
                  Choose a department below to connect directly with our specialized teams via Call or WhatsApp.
                </p>
              </div>

              {/* 3 Badges */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-800 shadow-2xs">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Fast Response</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-800 shadow-2xs">
                  <Users className="w-3.5 h-3.5 text-amber-500" />
                  <span>Professional Support</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-800 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  <span>Customer First</span>
                </div>
              </div>
            </div>
          </section>

          {/* 12 Departments Grid matching reference */}
          <section className="py-12 px-4 sm:px-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 font-display">
                  OUR <span className="text-amber-600">CONTACT DETAILS</span>
                </h2>
                <div className="text-xs text-gray-500 mt-0.5">
                  Department wise contact numbers for your convenience.
                </div>
              </div>

              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl text-xs font-semibold text-amber-900">
                <Headphones className="w-4 h-4 text-amber-600" />
                <span>Need Help? Call or WhatsApp the relevant department directly.</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {contactDepartments.map((dept) => {
                const IconC = dept.icon || Camera;
                return (
                  <div
                    key={dept.id}
                    className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        {dept.photo ? (
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                            <img src={dept.photo} alt={dept.title} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
                            <IconC className="w-6 h-6" />
                          </div>
                        )}
                        <div>
                          <div className="font-extrabold text-sm text-gray-900 leading-snug">{dept.title}</div>
                          {dept.person && (
                            <div className="text-[11px] font-bold text-amber-700">{dept.person}</div>
                          )}
                        </div>
                      </div>

                      <p className="text-[11px] text-gray-600 line-clamp-2 mt-1">
                        {dept.desc}
                      </p>

                      <div className="mt-3 flex items-center gap-2 text-sm font-black text-gray-900">
                        <Phone className="w-3.5 h-3.5 text-gray-600" />
                        <span>{dept.phone}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        onClick={() => openCall(dept.phone)}
                        className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-xl h-8 flex items-center justify-center gap-1.5"
                      >
                        <Phone className="w-3 h-3" /> Call Now
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openWhatsApp(dept.phone, `Hi, I am contacting ${dept.title} department.`)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-8 flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare className="w-3 h-3" /> WhatsApp
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Professional Studio Location & Working Hours Section */}
          <section className="py-12 px-4 sm:px-8 max-w-7xl mx-auto border-t border-gray-200">
            <div className="mb-8">
              <span className="text-[11px] font-mono uppercase tracking-widest font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/80">
                STUDIO HEADQUARTERS & TIMINGS
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 font-display mt-2">
                Visit Our Studio & <span className="text-amber-600">Working Hours</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
                Experience our studio in person. Walk in for photo shoots, bespoke album reviews, sample gift prints, and frame consultations.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Card 1: Executive Location Card (6 cols) */}
              <div className="lg:col-span-6 bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-400/10 via-amber-500/5 to-transparent rounded-bl-full pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" /> OUR LOCATION
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Walk-ins Welcome
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-gray-900 font-display flex items-center gap-2">
                    <span>STAR DIGITAL STUDIOS & VIDEOS</span>
                  </h3>
                  <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mt-0.5">
                    Creative Production • Personalised Gifts • Frame Studio
                  </div>

                  {/* Structured Address */}
                  <div className="mt-5 p-4 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-black flex items-center justify-center flex-shrink-0 shadow-2xs mt-0.5">
                      <Building className="w-4 h-4 text-black" />
                    </div>
                    <div className="text-xs sm:text-sm text-gray-800 leading-relaxed font-medium">
                      <div className="font-bold text-gray-900">Kai Kalathur, Perambalur Main Road,</div>
                      <div>Near INDIA 1 ATM, Kai Kalathur,</div>
                      <div className="text-gray-600">Perambalur District, Tamil Nadu — 621117</div>
                    </div>
                  </div>

                  {/* Landmark Alert */}
                  <div className="mt-3.5 flex items-center gap-2 text-xs text-gray-600 bg-amber-50/60 border border-amber-200/60 px-3 py-2 rounded-xl">
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-500 text-black px-1.5 py-0.5 rounded">
                      Landmark
                    </span>
                    <span className="font-semibold text-gray-800">Directly adjacent to INDIA 1 ATM on Main Road</span>
                  </div>

                  {/* Quick Telephones */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                      <Phone className="w-3.5 h-3.5 text-amber-600" />
                      <span>Primary:</span>
                      <a href="tel:8489809605" className="font-bold text-gray-900 hover:text-amber-600">8489809605</a>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                      <Phone className="w-3.5 h-3.5 text-amber-600" />
                      <span>Alternate:</span>
                      <a href="tel:9787515273" className="font-bold text-gray-900 hover:text-amber-600">9787515273</a>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <Button
                    onClick={() => window.open("https://maps.google.com/?q=Kai+Kalathur+Perambalur", "_blank")}
                    className="bg-[#111827] hover:bg-gray-800 text-white font-bold text-xs rounded-xl h-10 px-5 shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <span>Get Directions on Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => openWhatsApp("8489809605", "Hi Star Digital Studios, could you please send your exact studio location pin on WhatsApp?")}
                    className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs rounded-xl h-10 px-4 flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Send Location Pin</span>
                  </Button>
                </div>
              </div>

              {/* Card 2: Executive Working Hours Card (6 cols) */}
              <div className="lg:col-span-6 bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-400/10 via-emerald-500/5 to-transparent rounded-bl-full pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                      <Clock className="w-3.5 h-3.5 text-amber-600" /> WORKING HOURS
                    </span>
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest font-semibold">
                      IST · GMT +5:30
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-gray-900 font-display">
                    Operating Schedule & Break Timings
                  </h3>
                  <div className="text-[11px] text-gray-500 mt-0.5 font-medium">
                    Open 7 days a week for shoots, order pickups, and creative consultations.
                  </div>

                  {/* Schedule Timetable */}
                  <div className="mt-5 space-y-3">
                    {/* Row 1: Mon-Sat */}
                    <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gray-900 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                          M-S
                        </div>
                        <div>
                          <div className="font-bold text-xs sm:text-sm text-gray-900">Monday – Saturday</div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Regular Studio & Lab Hours</div>
                        </div>
                      </div>
                      <span className="font-black text-xs sm:text-sm text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-2xs">
                        9:15 AM – 9:45 PM
                      </span>
                    </div>

                    {/* Row 2: Lunch Break */}
                    <div className="p-3.5 rounded-2xl bg-amber-50/40 border border-amber-100 flex items-center justify-between gap-3 hover:bg-amber-50/70 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shadow-2xs">
                          <Clock className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <div className="font-bold text-xs sm:text-sm text-gray-900">Lunch Break</div>
                          <div className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider">Midday Break Everyday</div>
                        </div>
                      </div>
                      <span className="font-bold text-xs sm:text-sm text-amber-800 bg-amber-100/60 border border-amber-200/80 px-3 py-1.5 rounded-xl shadow-2xs">
                        1:45 PM – 3:45 PM
                      </span>
                    </div>

                    {/* Row 3: Sunday */}
                    <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between gap-3 hover:bg-emerald-50/80 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                          SUN
                        </div>
                        <div>
                          <div className="font-bold text-xs sm:text-sm text-gray-900 flex items-center gap-2">
                            <span>Sunday</span>
                            <span className="text-[9px] uppercase font-bold tracking-wider bg-emerald-600 text-white px-1.5 py-0.2 rounded-full">
                              Shop Open
                            </span>
                          </div>
                          <div className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider">Full Day Weekend Service</div>
                        </div>
                      </div>
                      <span className="font-black text-xs sm:text-sm text-emerald-800 bg-white border border-emerald-200 px-3 py-1.5 rounded-xl shadow-2xs">
                        9:15 AM – 9:45 PM
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Assurance Note */}
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className="font-medium text-gray-700">Urgent passport photos & framing delivered same-day.</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openWhatsApp()}
                    className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 text-xs font-bold h-8 px-2"
                  >
                    Check Live Status →
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. TAB: CUSTOMISED GIFTS STOREFRONT                           */}
      {/* ============================================================== */}
      {activeTab === "gifts" && (
        <div className="py-10 px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="text-left mb-8">
            <div className="text-xs font-mono text-gray-400 flex items-center gap-2">
              <span onClick={() => setActiveTab("home")} className="cursor-pointer hover:text-gray-900">Home</span>
              <span className="text-gray-400">&gt;</span>
              <span className="text-amber-600 font-bold">Customised Gifts</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 font-display mt-2">
              Personalised <span className="text-amber-600">Gifts Collection</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl">
              Upload your photo, personalize your message, and receive high-definition photo printed magic mugs, pillows, keychains and apparel.
            </p>
          </div>

          {giftProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {giftProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div className="h-44 bg-gray-100 relative overflow-hidden group">
                    <img
                      src={p.image_url ? resolveMediaUrl(p.image_url) : "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80"}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-2.5 right-2.5 bg-amber-500 text-black text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-md">
                      Custom Photo Ready
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">
                        {p.category || "Personalised Gift"}
                      </div>
                      <h3 className="font-extrabold text-sm text-gray-900 mt-0.5 line-clamp-1">{p.name}</h3>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed line-clamp-2">
                        {p.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase">Starting at</div>
                        <div className="text-base font-black text-gray-900">₹{Number(p.price || 0).toLocaleString()}</div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setCustomizingProduct(p)}
                        className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs rounded-xl h-8 px-3"
                      >
                        Customise & Order →
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/70 p-8 max-w-xl mx-auto">
              <Gift className="w-12 h-12 text-amber-500/80 mx-auto mb-3" />
              <h3 className="font-extrabold text-lg text-gray-900 font-display">No Customised Gift Products Added Yet</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed">
                Products added from your client dashboard with category &ldquo;Customised Gifts&rdquo; will automatically appear here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. TAB: PHOTO FRAMES                                          */}
      {/* ============================================================== */}
      {activeTab === "frames" && (
        <div className="py-10 px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="text-left mb-8">
            <div className="text-xs font-mono text-gray-400 flex items-center gap-2">
              <span onClick={() => setActiveTab("home")} className="cursor-pointer hover:text-gray-900">Home</span>
              <span className="text-gray-400">&gt;</span>
              <span className="text-amber-600 font-bold">Photo Frames</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 font-display mt-2">
              Premium <span className="text-amber-600">Photo Frames & Wall Art</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl">
              Archival printing, matte & gloss lamination, solid teakwood framing, acrylic floating frames and collage albums.
            </p>
          </div>

          {frameProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {frameProducts.map((f) => (
                <div
                  key={f.id}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div className="h-44 bg-gray-100 relative overflow-hidden group">
                    <img
                      src={f.image_url ? resolveMediaUrl(f.image_url) : "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80"}
                      alt={f.name || f.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-2.5 right-2.5 bg-black/80 backdrop-blur-xs text-amber-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-md">
                      Custom Framing
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">
                        {f.category || "Photo Frame"}
                      </div>
                      <h3 className="font-extrabold text-sm text-gray-900 mt-0.5 line-clamp-1">{f.name || f.title}</h3>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed line-clamp-2">
                        {f.description || f.desc}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase">Starting at</div>
                        <div className="text-base font-black text-gray-900">₹{Number(f.price || 0).toLocaleString()}</div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setCustomizingProduct(f)}
                        className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs rounded-xl h-8 px-3"
                      >
                        Customise & Order →
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/70 p-8 max-w-xl mx-auto">
              <Camera className="w-12 h-12 text-amber-500/80 mx-auto mb-3" />
              <h3 className="font-extrabold text-lg text-gray-900 font-display">No Photo Frame Products Added Yet</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed">
                Products added from your client dashboard with category &ldquo;Photo Frames&rdquo; will automatically appear here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. TAB: GALLERY                                               */}
      {/* ============================================================== */}
      {activeTab === "gallery" && (
        <div className="py-10 px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="text-xs font-mono text-gray-400 flex items-center gap-2 mb-2">
                <span onClick={() => setActiveTab("home")} className="cursor-pointer hover:text-gray-900">Home</span>
                <span className="text-gray-400">&gt;</span>
                <span className="text-amber-600 font-bold">Portfolio Gallery</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 font-display">
                Studio Portfolio <span className="text-amber-600">Gallery</span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl">
                Explore real wedding captures, candid outdoor romances, cinematic drone perspectives, studio portraits and customized gifts.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                onClick={() => openWhatsApp(whatsappNum, "Hi Star Digital Studios, I would like to book a photography session.")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full px-5 h-9 flex items-center gap-2"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Enquire Shoot
              </Button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pb-6 mb-2 border-b border-gray-100">
            {["All", "Wedding", "Candid", "Drone", "Studio", "Gifts", "Events"].map((cat) => {
              const count = cat === "All"
                ? galleryItems.length
                : galleryItems.filter((g) => (g.category || "").toLowerCase().includes(cat.toLowerCase())).length;
              return (
                <button
                  key={cat}
                  onClick={() => setGalleryFilter(cat)}
                  className={`text-xs px-4 py-2 rounded-full font-bold transition-all flex items-center gap-1.5 ${
                    galleryFilter === cat
                      ? "bg-[#111827] text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${galleryFilter === cat ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-3.5 mt-5">
            {galleryItems
              .filter((item) => galleryFilter === "All" || (item.category || "").toLowerCase().includes(galleryFilter.toLowerCase()))
              .map((item) => (
                <div
                  key={item.id}
                  onClick={() => setLightboxItem(item)}
                  className="rounded-xl overflow-hidden shadow-2xs hover:shadow-lg bg-gray-100 group relative aspect-square cursor-pointer transition-all duration-300 border border-gray-200/80"
                >
                  <img
                    src={resolveMediaUrl(item.image_url)}
                    alt={item.title || "Studio Portfolio"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Category Pill Tag */}
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-black/75 backdrop-blur-xs text-white px-2 py-0.5 rounded shadow-xs">
                      {item.category || "General"}
                    </span>
                    {item.featured && (
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500 text-black px-1.5 py-0.5 rounded shadow-xs flex items-center">
                        <Star className="w-2.5 h-2.5 fill-black text-black" />
                      </span>
                    )}
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5 text-white">
                    <h4 className="font-bold text-xs leading-tight line-clamp-1">{item.title}</h4>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-amber-300 font-medium">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> Zoom</span>
                      <span className="text-gray-300">Preview</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {galleryItems.filter((item) => galleryFilter === "All" || (item.category || "").toLowerCase().includes(galleryFilter.toLowerCase())).length === 0 && (
            <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/60 mt-6">
              <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700">No photos found under category "{galleryFilter}"</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGalleryFilter("All")}
                className="mt-3 text-xs"
              >
                Reset Filter
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 9. TAB: OFFERS & COMBOS (Dynamic with Auto-scrolling Hero)    */}
      {/* ============================================================== */}
      {activeTab === "offers" && (
        <div className="space-y-12">
          {/* Offers White Header Hero */}
          <section className="bg-white text-gray-900 py-10 sm:py-12 px-4 sm:px-8 border-b border-gray-100">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="text-xs font-mono text-gray-400 flex items-center gap-2">
                  <span onClick={() => setActiveTab("home")} className="cursor-pointer hover:text-gray-900 transition-colors">Home</span>
                  <span className="text-gray-400">&gt;</span>
                  <span className="text-amber-600 font-bold">Offers & Combos</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-gray-900 font-display uppercase leading-tight">
                  SPECIAL <span className="text-amber-600">OFFERS & COMBOS</span>
                </h1>
                <div className="text-xs font-bold tracking-widest uppercase text-gray-500">
                  CAPTURING MOMENTS • CREATING MEMORIES • CUSTOMISING GIFTS
                </div>
                <p className="text-xs sm:text-sm text-gray-600 max-w-xl leading-relaxed">
                  Celebrate life's grandest milestones with bundled photography, 4K aerial cinematography, and personalised gift keepsakes.
                  Save more with our limited-time festival and wedding season combo packages.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => {
                      const firstOffer = bannerOffers[0] || studioOffers[0];
                      if (firstOffer) {
                        handleOpenBooking({
                          name: firstOffer.title,
                          price: firstOffer.offer_price,
                          description: firstOffer.description || firstOffer.deliverables
                        });
                      }
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-full px-6 py-2.5 h-auto shadow-xs"
                  >
                    Book A Combo Package <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                  <a
                    href={`https://wa.me/91${whatsappNum || "8489809605"}?text=${encodeURIComponent("Hello Star Digital Studios! I want to enquire about current special offers and combo packages.")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full px-4 py-2.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Enquire on WhatsApp
                  </a>
                </div>
              </div>

              {/* Quick Summary Pill Box */}
              <div className="lg:col-span-5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-600" />
                  <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                    Why Book Our Combo Packages?
                  </span>
                </div>
                <ul className="text-xs text-gray-700 space-y-2.5">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Massive Savings:</strong> Save up to 30% compared to booking individual shoots and albums.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Free Merchandise:</strong> Magic color mugs, custom T-shirts, and teakwood frames included.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Priority Editing:</strong> Fast-track 4K cinematic teaser delivery within 7 working days.</span>
                  </li>
                </ul>
                <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-amber-900 font-semibold">
                  <span>⚡ Instant Booking Available</span>
                  <span>🔒 100% Date Guarantee</span>
                </div>
              </div>
            </div>
          </section>

          {/* MAIN CONTENT AREA */}
          <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
            {/* HERO SECTION: AUTO-SCROLLING ROTATING OFFERS CAROUSEL */}
            {bannerOffers.length > 0 && (() => {
              const currentOffer = bannerOffers[activeOfferIndex] || bannerOffers[0];
              const hasDiscount = Number(currentOffer.original_price || 0) > Number(currentOffer.offer_price || 0);
              const savingsAmt = hasDiscount ? Number(currentOffer.original_price) - Number(currentOffer.offer_price) : 0;
              const savingsPct = hasDiscount ? Math.round((savingsAmt / Number(currentOffer.original_price)) * 100) : 0;
              const deliverablesList = (currentOffer.deliverables || "")
                .split(/[\n,]+/)
                .map((s) => s.trim())
                .filter(Boolean);

              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                      <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                        Spotlight Deals & Combo Specials
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span>{activeOfferIndex + 1} of {bannerOffers.length}</span>
                      {isOfferCarouselPaused && (
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          Paused on hover
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    onMouseEnter={() => setIsOfferCarouselPaused(true)}
                    onMouseLeave={() => setIsOfferCarouselPaused(false)}
                    className="relative rounded-3xl overflow-hidden shadow-2xl bg-[#0b0f19] text-white min-h-[340px] md:min-h-[380px] flex flex-col justify-between border border-gray-800 group"
                  >
                    {/* Background Backdrop Image with Gradient Scrim */}
                    <div className="absolute inset-0 z-0">
                      {currentOffer.image_url ? (
                        <img
                          src={resolveMediaUrl(currentOffer.image_url)}
                          alt={currentOffer.title}
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-35"
                        />
                      ) : (
                        <div className="w-full h-full bg-linear-to-br from-[#111827] via-[#1f2937] to-[#0f172a]" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/40" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
                    </div>

                    {/* Banner Content */}
                    <div className="relative z-10 p-6 sm:p-8 lg:p-10 max-w-3xl space-y-4">
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 fill-white" />
                          {currentOffer.badge || "FESTIVE COMBO"}
                        </span>
                        {currentOffer.valid_until && (
                          <span className="bg-white/10 backdrop-blur-md text-amber-300 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-amber-300/20 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {currentOffer.valid_until}
                          </span>
                        )}
                        {hasDiscount && (
                          <span className="bg-emerald-500 text-black text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                            SAVE ₹{savingsAmt.toLocaleString()} ({savingsPct}% OFF)
                          </span>
                        )}
                      </div>

                      {/* Main Title & Description */}
                      <div className="space-y-1.5">
                        <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-white font-display tracking-tight leading-tight">
                          {currentOffer.title}
                        </h2>
                        {currentOffer.description && (
                          <p className="text-xs sm:text-sm text-gray-300 max-w-xl leading-relaxed">
                            {currentOffer.description}
                          </p>
                        )}
                      </div>

                      {/* Deliverables Pills */}
                      {deliverablesList.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {deliverablesList.slice(0, 4).map((item, idx) => (
                            <span
                              key={idx}
                              className="text-xs font-medium bg-white/10 backdrop-blur-xs text-gray-200 border border-white/15 px-3 py-1 rounded-lg flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>{item}</span>
                            </span>
                          ))}
                          {deliverablesList.length > 4 && (
                            <span className="text-xs text-amber-400 font-semibold px-2 py-1">
                              +{deliverablesList.length - 4} more perks
                            </span>
                          )}
                        </div>
                      )}

                      {/* Pricing & Coupon Section */}
                      <div className="pt-2 flex flex-wrap items-baseline gap-4">
                        <div className="flex items-baseline gap-2.5">
                          <span className="text-3xl sm:text-5xl font-black text-amber-400 font-display">
                            ₹{Number(currentOffer.offer_price || 0).toLocaleString()}
                          </span>
                          {hasDiscount && (
                            <span className="text-sm sm:text-lg text-gray-400 line-through">
                              ₹{Number(currentOffer.original_price || 0).toLocaleString()}
                            </span>
                          )}
                        </div>

                        {currentOffer.coupon_code && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(currentOffer.coupon_code);
                              setCopiedCoupon(currentOffer.coupon_code);
                              toast.success(`Coupon code ${currentOffer.coupon_code} copied!`);
                              setTimeout(() => setCopiedCoupon(""), 2500);
                            }}
                            className="bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/50 text-amber-300 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer"
                            title="Click to copy coupon code"
                          >
                            <Tag className="w-3.5 h-3.5 text-amber-400" />
                            <span>CODE: {currentOffer.coupon_code}</span>
                            {copiedCoupon === currentOffer.coupon_code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-amber-400" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 flex flex-wrap items-center gap-3">
                        <Button
                          onClick={() =>
                            handleOpenBooking({
                              name: currentOffer.title,
                              price: currentOffer.offer_price,
                              description: currentOffer.description || currentOffer.deliverables
                            })
                          }
                          className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs sm:text-sm px-6 py-3 h-auto rounded-xl shadow-lg transition-transform hover:scale-102"
                        >
                          Book Combo Package <ArrowRight className="w-4 h-4 ml-1.5" />
                        </Button>

                        <a
                          href={`https://wa.me/91${whatsappNum || "8489809605"}?text=${encodeURIComponent(
                            `Hello Star Digital Studios! I want to claim the *${currentOffer.title}* combo package for ₹${Number(currentOffer.offer_price || 0).toLocaleString()}${currentOffer.coupon_code ? ` (Code: ${currentOffer.coupon_code})` : ""}. Please confirm shoot availability.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-md transition-all"
                        >
                          <MessageSquare className="w-4 h-4" /> Claim on WhatsApp
                        </a>
                      </div>
                    </div>

                    {/* Bottom Controls Bar */}
                    <div className="relative z-10 px-6 sm:px-10 py-4 bg-black/40 backdrop-blur-md border-t border-white/10 flex items-center justify-between">
                      {/* Carousel Indicator Dots */}
                      <div className="flex items-center gap-2">
                        {bannerOffers.map((b, idx) => (
                          <button
                            key={b.id || idx}
                            type="button"
                            onClick={() => setActiveOfferIndex(idx)}
                            className={`h-2 transition-all rounded-full ${
                              idx === activeOfferIndex
                                ? "w-8 bg-amber-400 shadow-xs"
                                : "w-2 bg-white/30 hover:bg-white/60"
                            }`}
                            title={`Slide ${idx + 1}: ${b.title}`}
                          />
                        ))}
                      </div>

                      {/* Prev / Next Arrows */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveOfferIndex((prev) => (prev - 1 + bannerOffers.length) % bannerOffers.length)
                          }
                          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                          title="Previous Offer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveOfferIndex((prev) => (prev + 1) % bannerOffers.length)
                          }
                          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                          title="Next Offer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* TRUST & GUARANTEE STRIP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-gray-900">Zero Hidden Charges</h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Transparent combo quotes include equipment, shooting crew, and standard post-production.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-gray-900">Free Custom Keepsakes</h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Personalised magic mugs, synthetic albums, or custom photo tees bundled in select combos.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-gray-900">Ultra-HD 4K Cinematic</h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Licensed 4K drone cinematography and prime lens photography color-graded by experts.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-gray-900">Fast Date Reservation</h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Lock in auspicious wedding muhurtham and event dates instantly via online booking.
                  </p>
                </div>
              </div>
            </div>

            {/* CATEGORY FILTER PILLS */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-gray-100">
              <div>
                <h3 className="text-xl font-black text-gray-900 font-display">
                  All Active <span className="text-amber-600">Combos & Bundles</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Showing {studioOffers.length} studio deals available for immediate booking.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {["All", "Wedding", "Pre-Wedding", "Birthday", "Gifts"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setOffersCategoryFilter(cat)}
                    className={`text-xs px-3.5 py-1.5 rounded-full font-bold transition-all ${
                      offersCategoryFilter === cat
                        ? "bg-[#111827] text-white shadow-xs"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* OFFERS GRID (Modern Compact & Balanced Layout) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {studioOffers
                .filter((o) => {
                  if (offersCategoryFilter === "All") return true;
                  const text = `${o.title || ""} ${o.badge || ""} ${o.category || ""} ${o.description || ""}`.toLowerCase();
                  return text.includes(offersCategoryFilter.toLowerCase());
                })
                .map((offer) => {
                  const hasDiscount = Number(offer.original_price || 0) > Number(offer.offer_price || 0);
                  const savingsAmt = hasDiscount ? Number(offer.original_price) - Number(offer.offer_price) : 0;
                  const savingsPct = hasDiscount ? Math.round((savingsAmt / Number(offer.original_price)) * 100) : 0;
                  const deliverables = (offer.deliverables || "")
                    .split(/[\n,]+/)
                    .map((s) => s.trim())
                    .filter(Boolean);

                  return (
                    <div
                      key={offer.id}
                      className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
                    >
                      <div>
                        {/* Offer Image */}
                        <div className="relative h-40 w-full bg-gray-100 overflow-hidden">
                          {offer.image_url ? (
                            <img
                              src={resolveMediaUrl(offer.image_url)}
                              alt={offer.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                              <Tag className="w-7 h-7 mb-1 text-gray-300" />
                              <span className="text-[11px] font-semibold">Star Digital Studios</span>
                            </div>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

                          {/* Badge */}
                          <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider bg-black/90 text-amber-400 px-2.5 py-0.5 rounded shadow-xs">
                              {offer.badge || "FESTIVE COMBO"}
                            </span>
                            {hasDiscount && (
                              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded shadow-xs">
                                {savingsPct}% OFF
                              </span>
                            )}
                          </div>

                          {/* Valid Until Pill */}
                          {offer.valid_until && (
                            <div className="absolute bottom-1.5 left-2.5 text-[10px] text-gray-200 font-medium flex items-center gap-1 drop-shadow-md">
                              <Clock className="w-3 h-3 text-amber-300" />
                              <span>{offer.valid_until}</span>
                            </div>
                          )}
                        </div>

                        {/* Body Details */}
                        <div className="p-4 space-y-2.5">
                          <div>
                            <h3 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-amber-600 transition-colors line-clamp-1 leading-snug">
                              {offer.title}
                            </h3>
                            {offer.description && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                                {offer.description}
                              </p>
                            )}
                          </div>

                          {/* Deliverables List: Compact 2-column micro-grid */}
                          {deliverables.length > 0 && (
                            <div className="pt-2 border-t border-gray-100">
                              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                {deliverables.slice(0, 4).map((d, i) => (
                                  <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    <span className="truncate">{d}</span>
                                  </div>
                                ))}
                              </div>
                              {deliverables.length > 4 && (
                                <span className="text-[11px] text-amber-600 font-semibold mt-1 inline-block">
                                  +{deliverables.length - 4} more perks
                                </span>
                              )}
                            </div>
                          )}

                          {/* Price & Coupon row */}
                          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-base sm:text-lg font-black text-gray-900 font-display">
                                ₹{Number(offer.offer_price || 0).toLocaleString()}
                              </span>
                              {hasDiscount && (
                                <>
                                  <span className="text-xs text-gray-400 line-through">
                                    ₹{Number(offer.original_price || 0).toLocaleString()}
                                  </span>
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                                    Save ₹{savingsAmt.toLocaleString()}
                                  </span>
                                </>
                              )}
                            </div>

                            {offer.coupon_code && (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(offer.coupon_code);
                                  setCopiedCoupon(offer.coupon_code);
                                  toast.success(`Coupon code ${offer.coupon_code} copied!`);
                                  setTimeout(() => setCopiedCoupon(""), 2500);
                                }}
                                className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer"
                                title="Click to copy coupon code"
                              >
                                <Tag className="w-2.5 h-2.5 text-amber-600" />
                                <span>{offer.coupon_code}</span>
                                {copiedCoupon === offer.coupon_code ? (
                                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5 text-amber-600" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Buttons */}
                      <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                        <Button
                          onClick={() =>
                            handleOpenBooking({
                              name: offer.title,
                              price: offer.offer_price,
                              description: offer.description || offer.deliverables
                            })
                          }
                          className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-lg h-9 shadow-2xs"
                        >
                          Book Combo →
                        </Button>

                        <a
                          href={`https://wa.me/91${whatsappNum || "8489809605"}?text=${encodeURIComponent(
                            `Hello Star Digital Studios! I want to enquire about the *${offer.title}* offer (₹${Number(offer.offer_price || 0).toLocaleString()})${offer.coupon_code ? ` with code *${offer.coupon_code}*` : ""}.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg h-9 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                        </a>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* CUSTOM COMBO BANNER */}
            <div className="bg-gradient-to-r from-gray-900 to-[#111827] text-white rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl text-center md:text-left">
                <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">
                  Need a Tailored Experience?
                </span>
                <h3 className="text-2xl sm:text-3xl font-black font-display">
                  Build Your Own Custom Photography & Cinema Combo
                </h3>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  Have a destination wedding, multi-day village festival, or corporate convention? Contact Boopathi directly to customize hours, drone units, LED walls, and gift hampers.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
                <a
                  href={`tel:${mainPhone}`}
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs px-6 py-3 rounded-full shadow-md transition-all"
                >
                  <Phone className="w-4 h-4" /> Call {mainPhone}
                </a>
                <a
                  href={`https://wa.me/91${whatsappNum || "8489809605"}?text=${encodeURIComponent("Hello Boopathi! I need a custom photography and cinema package tailored for my upcoming event.")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-6 py-3 rounded-full border border-white/20 transition-all"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" /> WhatsApp Custom Request
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* GLOBAL FOOTER                                                  */}
      {/* ============================================================== */}
      <footer className="bg-white text-gray-900 border-t border-gray-200/90 py-12 px-4 sm:px-8 mt-16 shadow-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Col 1: Studio Brand */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-xs">
                <Star className="w-4 h-4 fill-white text-white" />
              </div>
              <div className="leading-tight">
                <div className="font-extrabold text-sm tracking-tight text-gray-900 font-display flex items-center gap-1">
                  <span className="text-amber-600 font-black">STAR</span> DIGITAL STUDIOS
                </div>
                <div className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">
                  VIDEOS • CUSTOMISED GIFTS
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2.5 leading-relaxed">
              Capturing authentic moments, creating cinematic memories, and crafting personalized gifts across Tamil Nadu.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-gray-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Open Today · 9:15 AM – 9:45 PM</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3.5 font-display flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Quick Links
            </div>
            <ul className="text-xs space-y-2 text-gray-600">
              <li onClick={() => setActiveTab("home")} className="cursor-pointer hover:text-amber-600 transition-colors">Home</li>
              <li onClick={() => setActiveTab("services")} className="cursor-pointer hover:text-amber-600 transition-colors">Our Services</li>
              <li onClick={() => setActiveTab("gifts")} className="cursor-pointer hover:text-amber-600 transition-colors">Customised Gifts Store</li>
              <li onClick={() => setActiveTab("frames")} className="cursor-pointer hover:text-amber-600 transition-colors">Photo Frames & Wall Art</li>
              <li onClick={() => setActiveTab("gallery")} className="cursor-pointer hover:text-amber-600 transition-colors">Portfolio Gallery</li>
              <li onClick={() => setActiveTab("offers")} className="cursor-pointer hover:text-amber-600 transition-colors">Offers & Packages</li>
              <li onClick={() => setActiveTab("about")} className="cursor-pointer hover:text-amber-600 transition-colors">About VK. Boopathi</li>
              <li onClick={() => setActiveTab("contact")} className="cursor-pointer hover:text-amber-600 transition-colors">Department Contacts</li>
            </ul>
          </div>

          {/* Col 3: Location */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3.5 font-display flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Studio Location
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Kai Kalathur, Perambalur Main Road,<br />
              Near INDIA 1 ATM, Kai Kalathur,<br />
              Perambalur District, Tamil Nadu – 621117
            </p>
            <div className="mt-3 text-xs font-semibold text-gray-900 space-y-1">
              <div>Phone: <a href="tel:8489809605" className="text-amber-600 hover:underline">8489809605</a></div>
              <div>Alt: <a href="tel:9787515273" className="text-amber-600 hover:underline">9787515273</a></div>
            </div>
          </div>

          {/* Col 4: Shop Hours & WhatsApp */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3.5 font-display flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Working Hours
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              <span className="font-semibold text-gray-800">Mon – Sat:</span> 9:15 AM – 9:45 PM<br />
              <span className="font-semibold text-gray-800">Lunch:</span> 1:45 PM – 3:45 PM<br />
              <span className="font-semibold text-gray-800">Sunday:</span> 9:15 AM – 9:45 PM (Shop Open)
            </p>
            <Button
              size="sm"
              onClick={() => openWhatsApp()}
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full px-4 h-9 shadow-xs flex items-center gap-2"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Chat on WhatsApp
            </Button>
          </div>
        </div>

        {/* Bottom Sub-Footer with Powered by Telestack */}
        <div className="max-w-7xl mx-auto border-t border-gray-200 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <div>
            © {new Date().getFullYear()} <span className="font-bold text-gray-800">STAR DIGITAL STUDIOS VIDEOS</span>. All rights reserved.
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">Powered by</span>
            <span className="inline-flex items-center gap-1 font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              Telestack
            </span>
          </div>
        </div>
      </footer>

      {/* ============================================================== */}
      {/* MODAL: INTERACTIVE SHOOT BOOKING                               */}
      {/* ============================================================== */}
      <Dialog open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
        <DialogContent className="max-w-md bg-[#131722] text-white border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-400" />
              Book: {selectedService?.name || "Session"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleBookingSubmit} className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs text-gray-300">Your Full Name *</Label>
              <Input
                required
                value={bookingForm.name}
                onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                className="bg-gray-900 border-gray-700 text-white text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-300">WhatsApp Phone Number *</Label>
              <Input
                required
                value={bookingForm.phone}
                onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                placeholder="8489809605"
                className="bg-gray-900 border-gray-700 text-white text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-300">Shoot Date</Label>
                <Input
                  type="date"
                  value={bookingForm.date}
                  onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                  className="bg-gray-900 border-gray-700 text-white text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-300">Preferred Time</Label>
                <Input
                  value={bookingForm.time}
                  onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                  placeholder="10:00 AM"
                  className="bg-gray-900 border-gray-700 text-white text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-300">Event Details / Shoot Notes</Label>
              <Input
                value={bookingForm.notes}
                onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                placeholder="e.g. Pre-wedding outdoor shoot or passport photo"
                className="bg-gray-900 border-gray-700 text-white text-xs"
              />
            </div>

            {selectedService?.price && (
              <div className="p-3 rounded-lg bg-gray-900/80 border border-gray-800 flex items-center justify-between text-xs">
                <span className="text-gray-400">Package Starting From:</span>
                <span className="font-bold text-amber-400 text-sm">₹{Number(selectedService.price).toLocaleString()}</span>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setBookingModalOpen(false)} className="text-gray-400">
                Cancel
              </Button>
              <Button type="submit" disabled={submittingBooking} className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs">
                {submittingBooking ? "Confirming..." : "Confirm Booking"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* MODAL: PRODUCT CUSTOMIZATION & ORDERING                        */}
      {/* ============================================================== */}
      <Dialog open={!!customizingProduct} onOpenChange={() => setCustomizingProduct(null)}>
        <DialogContent className="max-w-md bg-[#131722] text-white border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-400" />
              Customise: {customizingProduct?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="flex gap-3 items-center bg-gray-900 p-3 rounded-xl border border-gray-800">
              <img
                src={customizingProduct?.image_url}
                alt={customizingProduct?.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div>
                <div className="font-bold text-sm text-white">{customizingProduct?.name}</div>
                <div className="text-xs text-amber-400 font-extrabold mt-0.5">₹{customizingProduct?.price}</div>
              </div>
            </div>

            {/* Photo Uploader */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300">Upload Your Photo to Print *</Label>
              <div className="border-2 border-dashed border-gray-700 hover:border-amber-500 rounded-xl p-4 text-center cursor-pointer transition-colors relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCustomPhotoFile(file);
                      setCustomPhotoPreview(URL.createObjectURL(file));
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {customPhotoPreview ? (
                  <div className="flex flex-col items-center">
                    <img src={customPhotoPreview} alt="Preview" className="w-20 h-20 rounded-lg object-cover mb-2 border border-amber-400" />
                    <span className="text-[11px] text-emerald-400 font-bold">Photo attached! Click to change</span>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-6 h-6 text-amber-400 mx-auto mb-1" />
                    <div className="text-xs text-gray-300 font-semibold">Click or drag photo here</div>
                    <div className="text-[10px] text-gray-500">JPG, PNG, WebP up to 25MB</div>
                  </div>
                )}
              </div>
            </div>

            {/* Custom Notes */}
            <div className="space-y-1">
              <Label className="text-xs text-gray-300">Custom Text / Message / Names</Label>
              <Input
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="e.g. Happy Birthday Rahul or Name to print"
                className="bg-gray-900 border-gray-700 text-white text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setCustomizingProduct(null)} className="text-gray-400">
                Cancel
              </Button>
              <Button
                onClick={() => handleAddToCart(customizingProduct, customPhotoPreview, customNote)}
                className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs"
              >
                Add to Cart (₹{customizingProduct?.price})
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* DRAWER: SHOPPING CART & CHECKOUT                               */}
      {/* ============================================================== */}
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="max-w-lg bg-[#131722] text-white border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-400" /> Your Order Cart
              </span>
              <span className="text-xs text-gray-400 font-normal">{cart.length} unique items</span>
            </DialogTitle>
          </DialogHeader>

          {cart.length === 0 ? (
            <div className="py-12 text-center text-gray-400 space-y-3">
              <Gift className="w-12 h-12 text-gray-600 mx-auto" />
              <div className="text-sm font-semibold">Your gift cart is empty</div>
              <Button
                size="sm"
                onClick={() => { setCartOpen(false); setActiveTab("gifts"); }}
                className="bg-amber-500 text-black font-bold text-xs rounded-full"
              >
                Browse Custom Gifts
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {cart.map((item) => (
                  <div key={item.id} className="bg-gray-900 p-3 rounded-xl border border-gray-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.photoPreview || item.image_url}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover border border-amber-400/50"
                      />
                      <div>
                        <div className="font-bold text-xs text-white">{item.name}</div>
                        {item.customNote && (
                          <div className="text-[10px] text-amber-300">Note: {item.customNote}</div>
                        )}
                        <div className="text-xs text-gray-400 mt-0.5">₹{item.price} each</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button onClick={() => updateCartQty(item.id, -1)} className="w-6 h-6 rounded bg-gray-800 text-gray-200 flex items-center justify-center text-xs">-</button>
                      <span className="text-xs font-bold text-white">{item.quantity}</span>
                      <button onClick={() => updateCartQty(item.id, 1)} className="w-6 h-6 rounded bg-gray-800 text-gray-200 flex items-center justify-center text-xs">+</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-sm">
                <span className="text-gray-400">Total Order Amount:</span>
                <span className="font-black text-amber-400 text-lg">₹{cartTotal.toLocaleString()}</span>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  onClick={handleCheckoutViaWhatsApp}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" /> Place Order via WhatsApp
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* SEARCH MODAL                                                   */}
      {/* ============================================================== */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-md bg-[#131722] text-white border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-amber-400" /> Search Studio & Gifts
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. Wedding, Magic Mug, Boopathi, Drone, Frame..."
              className="bg-gray-900 border-gray-700 text-white text-xs"
            />
            {searchQuery && (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {services
                  .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        handleOpenBooking(s);
                        setSearchOpen(false);
                      }}
                      className="p-2.5 rounded-lg bg-gray-900 hover:bg-gray-800 cursor-pointer text-xs flex items-center justify-between"
                    >
                      <span>{s.name} (Service)</span>
                      <span className="text-amber-400 font-bold">₹{s.price}</span>
                    </div>
                  ))}
                {products
                  .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setCustomizingProduct(p);
                        setSearchOpen(false);
                      }}
                      className="p-2.5 rounded-lg bg-gray-900 hover:bg-gray-800 cursor-pointer text-xs flex items-center justify-between"
                    >
                      <span>{p.name} (Gift)</span>
                      <span className="text-amber-400 font-bold">₹{p.price}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* GALLERY LIGHTBOX MODAL */}
      <Dialog open={Boolean(lightboxItem)} onOpenChange={() => setLightboxItem(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black/95 text-white border-gray-800">
          {lightboxItem && (
            <div className="flex flex-col md:flex-row">
              <div className="relative md:w-3/5 bg-black flex items-center justify-center min-h-[300px] max-h-[70vh]">
                <img
                  src={resolveMediaUrl(lightboxItem.image_url)}
                  alt={lightboxItem.title}
                  className="max-h-[70vh] w-auto max-w-full object-contain"
                />
              </div>
              <div className="p-6 md:w-2/5 flex flex-col justify-between bg-[#111827] text-white">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-black px-2.5 py-1 rounded-full">
                      {lightboxItem.category || "Studio Shoot"}
                    </span>
                    {lightboxItem.featured && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 text-amber-400 px-2 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Featured
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold font-display text-white">
                    {lightboxItem.title || "Studio Shoot"}
                  </h3>
                  {lightboxItem.description && (
                    <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                      {lightboxItem.description}
                    </p>
                  )}
                  <div className="mt-4 pt-3 border-t border-gray-800 space-y-1.5 text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                      <Camera className="w-3.5 h-3.5 text-amber-400" />
                      <span>Professional Grade Equipment & Lighting</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Colour Graded & Hand Retouched</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-gray-800 space-y-2">
                  <Button
                    onClick={() => {
                      const msg = `Hi Star Digital Studios, I saw your portfolio photo '${lightboxItem.title}' (${lightboxItem.category}) on your website and would like to enquire about this service/package.`;
                      openWhatsApp(whatsappNum, msg);
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 rounded-xl flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" /> Enquire on WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setLightboxItem(null);
                      setActiveTab("services");
                    }}
                    className="w-full border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 text-xs h-9 rounded-xl"
                  >
                    View All Service Packages
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
