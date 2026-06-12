import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { resolveMediaUrl } from "../../lib/api";

export default function StoreBannerCarousel({ slides = [], resolveLink }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) return null;

  const go = (delta) => {
    setIndex((current) => (current + delta + slides.length) % slides.length);
  };

  const slide = slides[index];
  const imageUrl = resolveMediaUrl(slide.image_url);
  const href = slide.link_url ? (resolveLink ? resolveLink(slide.link_url) : slide.link_url) : null;

  const content = (
    <div className="relative w-full aspect-[21/7] min-h-[180px] md:min-h-[280px] overflow-hidden rounded-xl bg-[#232F3E]">
      <img
        src={imageUrl}
        alt={slide.title || "Store banner"}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" />
      {(slide.title || slide.subtitle) && (
        <div className="absolute inset-0 flex items-center">
          <div className="px-6 md:px-12 max-w-2xl text-white">
            {slide.title && (
              <h2 className="text-xl md:text-4xl font-bold tracking-tight drop-shadow-sm">{slide.title}</h2>
            )}
            {slide.subtitle && (
              <p className="mt-2 text-sm md:text-lg text-white/90 line-clamp-2">{slide.subtitle}</p>
            )}
            {href && (
              <span className="inline-block mt-4 px-4 py-2 rounded-md bg-[#FF9900] text-[#111827] text-sm font-bold">
                Shop now
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative group" data-testid="store-banner-carousel">
      {href ? (
        href.startsWith("http") ? (
          <a href={href} target="_blank" rel="noreferrer" className="block">{content}</a>
        ) : (
          <Link to={href} className="block">{content}</Link>
        )
      ) : content}

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/45 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/45 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Next banner"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((item, i) => (
              <button
                key={item.id || i}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-[#FF9900]" : "w-2 bg-white/60"}`}
                aria-label={`Show banner ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
