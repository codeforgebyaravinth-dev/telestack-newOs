import { useEffect, useMemo, useState } from "react";
import { api, formatErr } from "../../lib/api";
import PageHeader from "../../components/PageHeader";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Search, Monitor, Pencil, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import StatusBadge from "../../components/StatusBadge";
import DeviceLiveBadge from "../../components/DeviceLiveBadge";

export default function AdminDevices() {
  const [devices, setDevices] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [clients, setClients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState("");
  const [filterDealer, setFilterDealer] = useState("all");
  const [filterClient, setFilterClient] = useState("all");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", location: "", template_id: "" });

  const load = async () => {
    try {
      const params = {};
      if (filterClient !== "all") params.client_id = filterClient;
      else if (filterDealer !== "all") params.dealer_id = filterDealer;
      const [d, dealersRes, clientsRes, templatesRes] = await Promise.all([
        api.get("/admin/devices", { params }),
        api.get("/admin/dealers"),
        api.get("/admin/clients"),
        api.get("/admin/templates"),
      ]);
      setDevices(d.data || []);
      setDealers(dealersRes.data || []);
      setClients(clientsRes.data || []);
      setTemplates(templatesRes.data || []);
    } catch {}
  };

  useEffect(() => { load(); }, [filterDealer, filterClient]);

  const dealerClients = useMemo(() => {
    if (filterDealer === "all") return clients;
    return clients.filter((c) => c.dealer_id === filterDealer);
  }, [clients, filterDealer]);

  const clientTemplates = (clientId) => {
    const c = clients.find((cc) => cc.id === clientId);
    const ids = c?.assigned_template_ids || [];
    return templates.filter((t) => ids.includes(t.id));
  };

  const openEdit = (d) => {
    setEditing(d);
    setForm({ name: d.name, location: d.location || "", template_id: d.template_id || "" });
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/devices/${editing.id}`, { ...form, template_id: form.template_id || null });
      toast.success("Device updated");
      setEditing(null);
      load();
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Remove this device?")) return;
    try {
      await api.delete(`/admin/devices/${id}`);
      toast.success("Device removed");
      load();
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
    }
  };

  const completePairing = async (device) => {
    const code = window.prompt("Enter the pair code from the physical screen:");
    if (!code) return;
    try {
      await api.post("/admin/pair/complete", { pair_code: code.trim(), device_id: device.id });
      toast.success("Device paired successfully");
      load();
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
    }
  };

  const unpairDevice = async (device) => {
    if (!window.confirm(`Unpair ${device.name}?`)) return;
    try {
      await api.post(`/admin/devices/${device.id}/unpair`);
      toast.success("Device unpaired");
      load();
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
    }
  };

  const tplName = (id) => templates.find((t) => t.id === id)?.name || "—";

  const filtered = devices.filter((d) => {
    const dm = filterDealer === "all" || d.dealer_id === filterDealer;
    const cm = filterClient === "all" || d.client_id === filterClient;
    const sm = !search || `${d.name} ${d.location} ${d.client_name} ${d.dealer_name} ${d.pair_code}`.toLowerCase().includes(search.toLowerCase());
    return dm && cm && sm;
  });

  return (
    <div data-testid="admin-devices-page">
      <PageHeader
        overline="Admin / Devices"
        title="Network screens."
        subtitle="Filter by dealer and client, complete screen pairing, and manage devices across the platform."
      />

      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search devices..."
            className="pl-9 rounded-sm border-[#E5E7EB]"
            data-testid="search-device"
          />
        </div>
        <Select
          value={filterDealer}
          onValueChange={(v) => {
            setFilterDealer(v);
            setFilterClient("all");
          }}
        >
          <SelectTrigger className="w-56 rounded-sm border-[#E5E7EB]" data-testid="filter-dealer">
            <SelectValue placeholder="All dealers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All dealers</SelectItem>
            {dealers.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="w-56 rounded-sm border-[#E5E7EB]" data-testid="filter-client">
            <SelectValue placeholder="All clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All clients</SelectItem>
            {dealerClients.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
              <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Device</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Client</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Dealer</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Pair Code</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Template</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Status</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Live</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-sm text-[#6B7280]">No devices found.</TableCell>
              </TableRow>
            )}
            {filtered.map((d) => (
              <TableRow key={d.id} data-testid={`admin-device-row-${d.id}`}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-[#6B7280]" />
                    <div>
                      <div className="font-semibold">{d.name}</div>
                      <div className="text-[11px] font-mono text-[#6B7280]">{d.device_code || d.id}</div>
                      {d.location && <div className="text-xs text-[#6B7280]">{d.location}</div>}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{d.client_name || "—"}</TableCell>
                <TableCell className="text-sm">{d.dealer_name || "—"}</TableCell>
                <TableCell className="font-mono text-xs">{d.pair_code}</TableCell>
                <TableCell className="text-sm">{tplName(d.template_id)}</TableCell>
                <TableCell><StatusBadge status={d.status} /></TableCell>
                <TableCell><DeviceLiveBadge status={d.status} lastSeen={d.last_seen} /></TableCell>
                <TableCell className="text-right">
                  {d.status === "paired" ? (
                    <Button size="sm" variant="outline" className="rounded-sm mr-1" onClick={() => unpairDevice(d)} data-testid={`unpair-device-${d.id}`}>
                      Unpair
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="rounded-sm mr-1" onClick={() => completePairing(d)} data-testid={`pair-device-${d.id}`}>
                      Pair
                    </Button>
                  )}
                  <a
                    href={`/play/${d.pair_code}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-xs px-2 py-1 border border-[#E5E7EB] rounded-sm hover:bg-[#F3F4F6] mr-1"
                    data-testid={`open-player-${d.id}`}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" /> Player
                  </a>
                  <Button size="icon" variant="ghost" onClick={() => openEdit(d)} data-testid={`edit-device-${d.id}`}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(d.id)} className="text-red-600" data-testid={`delete-device-${d.id}`}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="rounded-sm max-w-md" data-testid="admin-device-dialog">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-extrabold tracking-tight">Edit Device</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-[#6B7280]">Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="rounded-sm" data-testid="device-name" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-[#6B7280]">Location</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="rounded-sm" data-testid="device-location" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-[#6B7280]">Template</Label>
              <Select value={form.template_id || "none"} onValueChange={(v) => setForm({ ...form, template_id: v === "none" ? "" : v })}>
                <SelectTrigger className="rounded-sm" data-testid="device-template"><SelectValue placeholder="No template" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No template</SelectItem>
                  {clientTemplates(editing?.client_id).map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)} className="rounded-sm">Cancel</Button>
              <Button type="submit" className="rounded-sm bg-[#111827] hover:bg-[#374151] text-white" data-testid="device-save">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
