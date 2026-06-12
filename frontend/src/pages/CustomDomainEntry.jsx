import { useEffect, useState } from "react";
import axios from "axios";
import PublicBooking from "./PublicBooking";
import PublicStore from "./store/PublicStore";

export default function CustomDomainEntry() {
  const [state, setState] = useState({ loading: true, vertical: null, slug: null });

  useEffect(() => {
    const host = window.location.hostname;
    axios
      .get(`${window.location.origin}/api/public/resolve-host`, { params: { host } })
      .then(({ data }) => {
        setState({
          loading: false,
          vertical: data.vertical || "general",
          slug: data.public_booking_slug || data.client_id,
        });
      })
      .catch(() => setState({ loading: false, vertical: null, slug: null }));
  }, []);

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-sm text-[#6B7280] font-mono uppercase tracking-widest animate-pulse">Loading...</div>
      </div>
    );
  }

  if (state.vertical === "retailer" && state.slug) {
    return <PublicStore resolvedHost={window.location.hostname} clientRef={state.slug} />;
  }

  return <PublicBooking resolvedHost={window.location.hostname} />;
}
