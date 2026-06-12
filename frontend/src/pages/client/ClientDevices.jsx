import { useCallback, useEffect, useRef, useState } from "react";
import { api, formatErr } from "../../lib/api";
import PageHeader from "../../components/PageHeader";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";
import { Plus, MoreVertical, Pencil, Trash2, Monitor, ExternalLink, Copy, AlertCircle, Settings2 } from "lucide-react";
import { toast } from "sonner";
import StatusBadge from "../../components/StatusBadge";
import DeviceLiveBadge from "../../components/DeviceLiveBadge";

const empty = { name: "", location: "", pair_code: "", template_id: "", playlist_id: "", branch_id: "", orientation: "auto", brightness: 100 };

const ZONE_PLACEMENT_PRESETS = [
  { id: "auto", label: "Auto" },
  { id: "full", label: "Full" },
  { id: "left", label: "Left" },
  { id: "right", label: "Right" },
  { id: "top", label: "Top" },
  { id: "bottom", label: "Bottom" },
  { id: "center", label: "Center" },
];

const defaultPlayerSettings = () => ({
  hidden_zone_ids: [],
  fill_blank_spaces: true,
  custom_placement_enabled: false,
  zone_placements: {},
  zone_media_modes: {},
});

export default function ClientDevices() {
  const [items, setItems] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [branches, setBranches] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [stats, setStats] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsDevice, setSettingsDevice] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsZones, setSettingsZones] = useState([]);
  const [settingsForm, setSettingsForm] = useState({
    orientation: "auto",
    brightness: 100,
    player_settings: defaultPlayerSettings(),
  });
  const saveTimerRef = useRef(null);

  const load = async () => {
    try {
      const [d, t, p, b, s] = await Promise.all([
        api.get("/client/devices"),
        api.get("/client/templates"),
        api.get("/client/playlists"),
        api.get("/client/branches"),
        api.get("/client/stats"),
      ]);
      setItems(d.data); setTemplates(t.data); setPlaylists(p.data); setBranches(Array.isArray(b.data) ? b.data : []);
      setStats(s.data || null);
    } catch {}
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (d) => { setEditing(d); setForm({ ...empty, ...d, template_id: d.template_id || "", playlist_id: d.playlist_id || "", branch_id: d.branch_id || "", orientation: d.orientation || "auto", brightness: Number(d.brightness ?? 100) }); setOpen(true); };

  const openPlayerSettings = async (device) => {
    setSettingsDevice(device);
    setSettingsOpen(true);
    setSettingsLoading(true);
    try {
      const { data } = await api.get(`/client/devices/${device.id}/player-settings`);
      setSettingsZones(Array.isArray(data.zones) ? data.zones : []);
      setSettingsForm({
        orientation: data.orientation || "auto",
        brightness: Number(data.brightness ?? 100),
        player_settings: {
          ...defaultPlayerSettings(),
          ...(data.player_settings || {}),
        },
      });
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
      setSettingsOpen(false);
    } finally {
      setSettingsLoading(false);
    }
  };

  const savePlayerSettings = useCallback(async (deviceId, payload) => {
    if (!deviceId) return;
    setSettingsSaving(true);
    try {
      const body = {
        orientation: payload.orientation,
        brightness: Number(payload.brightness ?? 100),
        hidden_zone_ids: payload.player_settings?.hidden_zone_ids || [],
        fill_blank_spaces: payload.player_settings?.fill_blank_spaces !== false,
        custom_placement_enabled: payload.player_settings?.custom_placement_enabled === true,
        zone_placements: payload.player_settings?.zone_placements || {},
        zone_media_modes: payload.player_settings?.zone_media_modes || {},
      };
      const { data } = await api.put(`/client/devices/${deviceId}/player-settings`, body);
      setSettingsForm({
        orientation: data.orientation || "auto",
        brightness: Number(data.brightness ?? 100),
        player_settings: {
          ...defaultPlayerSettings(),
          ...(data.player_settings || {}),
        },
      });
      setSettingsZones(Array.isArray(data.zones) ? data.zones : []);
      toast.success("Player settings synced to screen");
      load();
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
    } finally {
      setSettingsSaving(false);
    }
  }, []);

  const queueSavePlayerSettings = useCallback((nextForm) => {
    if (!settingsDevice?.id) return;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      savePlayerSettings(settingsDevice.id, nextForm);
    }, 450);
  }, [settingsDevice, savePlayerSettings]);

  const patchSettingsForm = (patch) => {
    setSettingsForm((prev) => {
      const next = { ...prev, ...patch };
      queueSavePlayerSettings(next);
      return next;
    });
  };

  const patchPlayerSettings = (patch) => {
    setSettingsForm((prev) => {
      const next = {
        ...prev,
        player_settings: { ...prev.player_settings, ...patch },
      };
      queueSavePlayerSettings(next);
      return next;
    });
  };

  const toggleZoneHidden = (zoneId) => {
    const hidden = settingsForm.player_settings.hidden_zone_ids || [];
    const nextHidden = hidden.includes(zoneId)
      ? hidden.filter((id) => id !== zoneId)
      : [...hidden, zoneId];
    patchPlayerSettings({ hidden_zone_ids: nextHidden });
  };

  const setZonePlacement = (zoneId, placement) => {
    patchPlayerSettings({
      zone_placements: {
        ...(settingsForm.player_settings.zone_placements || {}),
        [zoneId]: placement,
      },
    });
  };

  const setZoneMediaMode = (zoneId, mode) => {
    patchPlayerSettings({
      zone_media_modes: {
        ...(settingsForm.player_settings.zone_media_modes || {}),
        [zoneId]: mode,
      },
    });
  };

  const resetPlayerSettings = () => {
    const next = {
      orientation: "auto",
      brightness: 100,
      player_settings: defaultPlayerSettings(),
    };
    setSettingsForm(next);
    queueSavePlayerSettings(next);
  };

  useEffect(() => () => {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, template_id: form.template_id || null, playlist_id: form.playlist_id || null, orientation: form.orientation || "auto", brightness: Number(form.brightness ?? 100) };
      if (editing) await api.put(`/client/devices/${editing.id}`, payload);
      else await api.post("/client/devices", payload);
      toast.success(editing ? "Device updated" : "Device added");
      setOpen(false); load();
    } catch (e) { toast.error(formatErr(e.response?.data?.detail)); }
  };

  const remove = async (id) => {
    if (!window.confirm("Remove this device?")) return;
    try { await api.delete(`/client/devices/${id}`); toast.success("Device removed"); load(); }
    catch (e) { toast.error(formatErr(e.response?.data?.detail)); }
  };

  const unpair = async (device) => {
    if (!window.confirm(`Unpair ${device.name}?`)) return;
    try {
      await api.post(`/client/devices/${device.id}/unpair`);
      toast.success("Device unpaired");
      load();
    } catch (e) {
      toast.error(formatErr(e.response?.data?.detail));
    }
  };

  const tplName = (id) => templates.find((t) => t.id === id)?.name || "—";
  const playlistName = (id) => playlists.find((p) => p.id === id)?.name || "—";
  const branchName = (id) => branches.find((b) => b.id === id)?.name || "Unassigned";
  const deviceLimit = Number(stats?.device_limit || 0);
  const deviceCount = Number(stats?.devices ?? items.length);
  const atDeviceLimit = deviceLimit > 0 && deviceCount >= deviceLimit;
  const hiddenZoneIds = settingsForm.player_settings?.hidden_zone_ids || [];
  const visibleZoneCount = settingsZones.filter((zone) => !hiddenZoneIds.includes(zone.id)).length;

  return (
    <div data-testid="client-devices-page">
      <PageHeader overline="Client / Devices" title="Signage screens." subtitle="Create screens here, then share the pair code with your admin so they can complete pairing.">
        <Button onClick={openCreate} disabled={atDeviceLimit} className="rounded-sm bg-[#111827] hover:bg-[#374151] text-white disabled:opacity-50" data-testid="create-device-btn">
          <Plus className="w-4 h-4 mr-2" /> Pair Screen
        </Button>
      </PageHeader>

      {deviceLimit > 0 && (
        <div className={`mb-4 flex items-start gap-2 rounded-sm border px-4 py-3 text-sm ${atDeviceLimit ? "border-amber-200 bg-amber-50 text-amber-900" : "border-[#E5E7EB] bg-white text-[#374151]"}`}>
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            {deviceCount} of {deviceLimit} screens used on {stats?.plan_name || "your plan"}.
            {atDeviceLimit ? " Remove a screen or ask your dealer to upgrade the subscription." : ` ${deviceLimit - deviceCount} remaining.`}
          </span>
        </div>
      )}

      <div className="bg-white border border-[#E5E7EB] rounded-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
              <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Device ID</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Device</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Pair Code</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Branch</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Template</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Playlist</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Orientation</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280] text-right">Brightness</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Status</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-[#6B7280]">Live</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && <TableRow><TableCell colSpan={11} className="text-center py-10 text-sm text-[#6B7280]">No devices yet.</TableCell></TableRow>}
            {items.map((d) => (
              <TableRow key={d.id} data-testid={`device-row-${d.id}`}>
                <TableCell className="font-mono text-xs font-semibold text-[#111827]">{d.device_code || d.id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-[#6B7280]" />
                    <div>
                      <div className="font-semibold">{d.name}</div>
                      {d.location && <div className="text-xs text-[#6B7280]">{d.location}</div>}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span>{d.pair_code}</span>
                    <button onClick={() => { navigator.clipboard.writeText(d.pair_code); toast.success("Pair code copied"); }} className="text-[#6B7280] hover:text-[#111827]" data-testid={`copy-pair-${d.id}`}><Copy className="w-3 h-3" /></button>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{branchName(d.branch_id)}</TableCell>
                <TableCell className="text-sm">{tplName(d.template_id)}</TableCell>
                <TableCell className="text-sm">{playlistName(d.playlist_id)}</TableCell>
                <TableCell className="text-sm capitalize">{d.orientation || "auto"}</TableCell>
                <TableCell className="text-right font-mono text-xs">{Number(d.brightness ?? 100)}%</TableCell>
                <TableCell><StatusBadge status={d.status} /></TableCell>
                <TableCell><DeviceLiveBadge status={d.status} lastSeen={d.last_seen} /></TableCell>
                <TableCell>
                  {d.status === "paired" ? (
                    <Button size="sm" variant="outline" className="rounded-sm mr-1" onClick={() => unpair(d)} data-testid={`unpair-device-${d.id}`}>
                      Unpair
                    </Button>
                  ) : null}
                  <Button size="sm" variant="outline" className="rounded-sm mr-1" onClick={() => openPlayerSettings(d)} data-testid={`player-settings-${d.id}`}>
                    <Settings2 className="w-3.5 h-3.5 mr-1" /> Settings
                  </Button>
                  <a href={`/play/${d.pair_code}`} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs px-2 py-1 border border-[#E5E7EB] rounded-sm hover:bg-[#F3F4F6] mr-1" data-testid={`open-player-${d.id}`}>
                    <ExternalLink className="w-3 h-3 mr-1" /> Player
                  </a>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-sm">
                        <DropdownMenuItem onClick={() => openEdit(d)} data-testid={`edit-device-${d.id}`}><Pencil className="w-3.5 h-3.5 mr-2" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openPlayerSettings(d)}><Settings2 className="w-3.5 h-3.5 mr-2" /> Player settings</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => remove(d.id)} className="text-red-600" data-testid={`delete-device-${d.id}`}><Trash2 className="w-3.5 h-3.5 mr-2" /> Remove</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-sm max-w-md" data-testid="device-dialog">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-extrabold tracking-tight">{editing ? "Edit Device" : "Pair New Screen"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-[#6B7280]">Device Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="rounded-sm" data-testid="device-name" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-[#6B7280]">Location</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Reception, Lobby..." className="rounded-sm" data-testid="device-location" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-[#6B7280]">Branch</Label>
              <Select value={form.branch_id || "none"} onValueChange={(v) => setForm({ ...form, branch_id: v === "none" ? "" : v })}>
                <SelectTrigger className="rounded-sm" data-testid="device-branch"><SelectValue placeholder="No branch" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No branch</SelectItem>
                  {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name || b.id}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {!editing && (
              <div>
                <Label className="text-xs uppercase tracking-wider text-[#6B7280]">Pair Code (optional)</Label>
                <Input value={form.pair_code} onChange={(e) => setForm({ ...form, pair_code: e.target.value })} placeholder="Auto-generate if blank" className="rounded-sm font-mono" data-testid="device-pair-code" />
              </div>
            )}
            <div>
              <Label className="text-xs uppercase tracking-wider text-[#6B7280]">Layout Template</Label>
              <Select value={form.template_id || "none"} onValueChange={(v) => setForm({ ...form, template_id: v === "none" ? "" : v })}>
                <SelectTrigger className="rounded-sm" data-testid="device-template"><SelectValue placeholder="No template" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No template</SelectItem>
                  {templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-[#6B7280]">Playlist</Label>
              <Select value={form.playlist_id || "none"} onValueChange={(v) => setForm({ ...form, playlist_id: v === "none" ? "" : v })}>
                <SelectTrigger className="rounded-sm" data-testid="device-playlist"><SelectValue placeholder="No playlist" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No playlist</SelectItem>
                  {playlists.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-[#6B7280]">Orientation</Label>
              <Select value={form.orientation || "auto"} onValueChange={(v) => setForm({ ...form, orientation: v })}>
                <SelectTrigger className="rounded-sm" data-testid="device-orientation"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                  <SelectItem value="portrait">Portrait</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-[#6B7280]">Brightness</Label>
              <Input type="number" min="0" max="100" value={form.brightness} onChange={(e) => setForm({ ...form, brightness: Number(e.target.value || 100) })} className="rounded-sm" data-testid="device-brightness" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-sm">Cancel</Button>
              <Button type="submit" className="rounded-sm bg-[#111827] hover:bg-[#374151] text-white" data-testid="device-submit">{editing ? "Save" : "Pair"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="rounded-sm max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-extrabold tracking-tight">
              Player settings{settingsDevice ? `: ${settingsDevice.name}` : ""}
            </DialogTitle>
          </DialogHeader>

          {settingsLoading ? (
            <div className="py-12 text-center text-sm text-[#6B7280]">Loading player settings…</div>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-[#6B7280]">
                These controls mirror the on-screen player menu. Changes sync to the paired screen immediately.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-[#6B7280]">Orientation</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {["auto", "landscape", "portrait"].map((mode) => (
                      <Button
                        key={mode}
                        type="button"
                        variant={settingsForm.orientation === mode ? "default" : "outline"}
                        className={`rounded-sm capitalize ${settingsForm.orientation === mode ? "bg-[#111827] hover:bg-[#374151]" : ""}`}
                        onClick={() => patchSettingsForm({ orientation: mode })}
                      >
                        {mode}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-[#6B7280]">Brightness ({settingsForm.brightness}%)</Label>
                  <Input
                    type="range"
                    min="0"
                    max="100"
                    value={settingsForm.brightness}
                    onChange={(e) => patchSettingsForm({ brightness: Number(e.target.value || 100) })}
                    className="mt-3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center justify-between gap-3 rounded-sm border border-[#E5E7EB] px-4 py-3">
                  <div>
                    <div className="font-medium text-sm">Fill blank space</div>
                    <div className="text-xs text-[#6B7280]">Compact layout when zones are hidden</div>
                  </div>
                  <Switch
                    checked={settingsForm.player_settings.fill_blank_spaces !== false}
                    onCheckedChange={(v) => patchPlayerSettings({ fill_blank_spaces: v === true })}
                  />
                </label>
                <label className="flex items-center justify-between gap-3 rounded-sm border border-[#E5E7EB] px-4 py-3">
                  <div>
                    <div className="font-medium text-sm">Custom placement</div>
                    <div className="text-xs text-[#6B7280]">Choose preset areas for each zone</div>
                  </div>
                  <Switch
                    checked={settingsForm.player_settings.custom_placement_enabled === true}
                    onCheckedChange={(v) => patchPlayerSettings({ custom_placement_enabled: v === true })}
                  />
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-[#6B7280]">Zone settings</div>
                    <div className="font-semibold">Hide, restore, or place zones</div>
                  </div>
                  <div className="text-xs text-[#6B7280]">{visibleZoneCount}/{settingsZones.length} visible</div>
                </div>

                {settingsZones.length === 0 ? (
                  <div className="rounded-sm border border-dashed border-[#D1D5DB] p-6 text-sm text-[#6B7280] text-center">
                    Assign a template or playlist with a layout to manage zone settings.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {settingsZones.map((zone) => {
                      const hidden = hiddenZoneIds.includes(zone.id);
                      const placement = settingsForm.player_settings.zone_placements?.[zone.id] || "auto";
                      const mediaMode = settingsForm.player_settings.zone_media_modes?.[zone.id] || "fit";
                      return (
                        <div key={zone.id} className="rounded-sm border border-[#E5E7EB] p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold">{zone.name || zone.id}</div>
                              <div className="text-xs uppercase tracking-wider text-[#6B7280]">{zone.role || "zone"}</div>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant={hidden ? "outline" : "default"}
                              className={`rounded-sm ${hidden ? "" : "bg-[#111827] hover:bg-[#374151]"}`}
                              onClick={() => toggleZoneHidden(zone.id)}
                            >
                              {hidden ? "Show zone" : "Hide zone"}
                            </Button>
                          </div>

                          {settingsForm.player_settings.custom_placement_enabled ? (
                            <div className="mt-3">
                              <div className="text-[10px] uppercase tracking-wider text-[#6B7280] mb-2">Placement</div>
                              <div className="flex flex-wrap gap-2">
                                {ZONE_PLACEMENT_PRESETS.map((preset) => (
                                  <Button
                                    key={preset.id}
                                    type="button"
                                    size="sm"
                                    variant={placement === preset.id ? "default" : "outline"}
                                    className={`rounded-sm ${placement === preset.id ? "bg-[#111827] hover:bg-[#374151]" : ""}`}
                                    onClick={() => setZonePlacement(zone.id, preset.id)}
                                  >
                                    {preset.label}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          <div className="mt-3">
                            <div className="text-[10px] uppercase tracking-wider text-[#6B7280] mb-2">Media fit</div>
                            <div className="flex flex-wrap gap-2">
                              {["fill", "fit", "stretch"].map((mode) => (
                                <Button
                                  key={mode}
                                  type="button"
                                  size="sm"
                                  variant={mediaMode === mode ? "default" : "outline"}
                                  className={`rounded-sm capitalize ${mediaMode === mode ? "bg-[#111827] hover:bg-[#374151]" : ""}`}
                                  onClick={() => setZoneMediaMode(zone.id, mode)}
                                >
                                  {mode}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" className="rounded-sm" onClick={resetPlayerSettings} disabled={settingsLoading || settingsSaving}>
              Restore defaults
            </Button>
            <Button type="button" className="rounded-sm bg-[#111827] hover:bg-[#374151] text-white" onClick={() => setSettingsOpen(false)}>
              {settingsSaving ? "Syncing…" : "Done"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
