import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Download, FilePlus2, Link as LinkIcon, Search, Upload, Pencil, Trash2, Filter } from "lucide-react";

/**
 * UTFR Data Management Dashboard (Prototype)
 * -------------------------------------------------------
 * Goals
 *  - One place to plan a test day, log runs, tie each run to a setup snapshot, tire set, and data file (XRK/MoTeC)
 *  - Quick lookup tool across seasons/tracks/drivers
 *  - Act as a single source of truth that can later sync to Google Drive / Sheets / MoTeC i2 Pro
 *
 * This is a front-end prototype with in-memory state.
 * Hook it to a backend later (see suggested schema at the bottom of the file).
 */

// ==========================================================
// Sentinels & Helpers (fixes <SelectItem value=""> crash)
// ==========================================================
const ANY = "__ANY__" as const;   // used for filters ("Any")
const NONE = "__NONE__" as const; // used for optional selects ("None")

const isAny = (v?: string | "") => v === ANY || v === undefined || v === null;

// Try to build a direct-download URL for Google Drive links when possible
// NOTE: previous version used a malformed RegExp like \/\/, which produced an
// "Invalid regular expression flag" error. Use a single backslash to escape "/"
// inside the regex literal.
const toDriveDownloadURL = (url: string) => {
  const idMatch = url.match(/(?:file\/d\/|id=)([A-Za-z0-9_-]{10,})/);
  //            correct:   ^ use \/ not \\/
  if (idMatch) return `https://drive.google.com/uc?export=download&id=${idMatch[1]}`;
  return url; // fall back to the same URL
};

// ---------- Types ----------
export type SetupKV = { key: string; value: string };
export type TireSet = {
  id: string; // e.g., TS-24-03-A
  compound?: string; // e.g., Hoosier R20
  size?: string; // e.g., 16x7.5
  notes?: string;
};

export type SetupSnapshot = {
  id: string; // e.g., SET-2025-04-19-GoodEndurance
  name: string;
  basedOn?: string; // optional parent setup id
  kvs: SetupKV[]; // flexible key-value store for damper clicks, spring rates, toe, camber, etc.
};

export type Run = {
  id: string; // unique (e.g., AYR-2025-04-19-R07)
  testDayId: string;
  runNumber: number;
  timestamp: string; // ISO
  track: string; // Ayrton / Brechin / Flamboro / Moslon ...
  drivers: string[];
  stintMins?: number;
  weather?: { tempC?: number; windKph?: number; conditions?: string };
  setupId?: string;
  tireSetId?: string;
  coldPressures?: { FL?: number; FR?: number; RL?: number; RR?: number };
  hotPressures?: { FL?: number; FR?: number; RL?: number; RR?: number };
  brakeBiasPct?: number; // front bias
  regenPct?: number; // if applicable
  fuelStartL?: number; // if applicable (hybrid/ice)
  notes?: string;
  tags?: string[]; // e.g., ["accel", "endurance", "aero-test"]
  dataLinks: { kind: "XRK" | "CSV" | "MoTeC" | "GoogleDrive" | "Other"; url: string }[];
};

export type TestDay = {
  id: string; // e.g., TD-2025-04-19-AYR
  date: string; // 2025-04-19
  track: string;
  sessionLead?: string;
  weatherPlan?: string;
  runPlan?: string; // plain-text.
  crew?: string[];
  notes?: string;
};

// ---------- Mock Data (replace with API calls later) ----------
const initialTires: TireSet[] = [
  { id: "TS-24-03-A", compound: "Hoosier R20", size: "16x7.5", notes: "Scrubbed x2" },
  { id: "TS-24-03-B", compound: "Hoosier R20", size: "16x7.5", notes: "New" },
];

const initialSetups: SetupSnapshot[] = [
  {
    id: "SET-2025-04-18-Autocross",
    name: "Good Autocross Damp Setup",
    kvs: [
      { key: "Damper F Comp", value: "5" },
      { key: "Damper F Reb", value: "5" },
      { key: "Damper R Comp", value: "4" },
      { key: "Damper R Reb", value: "4" },
      { key: "Spring F", value: "650" },
      { key: "Spring R", value: "550" },
      { key: "Ride Height F", value: "10.0" },
      { key: "Ride Height R", value: "9.0" },
      { key: "Brake Bias", value: "Click 6" },
      { key: "Weight Dist", value: "51.8/48.2" },
    ],
  },
  {
    id: "SET-2025-04-19-Endurance",
    name: "Good Endurance Damp Setup",
    basedOn: "SET-2025-04-18-Autocross",
    kvs: [
      { key: "Rear ARB", value: "Off" },
      { key: "Diff Preload", value: "1.5 turns from open" },
      { key: "Inverter Torque Limit", value: "230 Nm" },
    ],
  },
];

const initialDays: TestDay[] = [
  {
    id: "TD-2025-04-19-AYR",
    date: "2025-04-19",
    track: "Brechin",
    sessionLead: "Evan",
    weatherPlan: "10-12°C, overcast am, clearing pm",
    runPlan: "Shakedown → brake test → accel/regens → autocross sims",
    crew: ["Aidan", "Peter", "Evan"],
    notes: "Front got softer springs; check oversteer on entry vs 18th",
  },
];

const initialRuns: Run[] = [
  {
    id: "AYR-2025-04-19-R01",
    testDayId: "TD-2025-04-19-AYR",
    runNumber: 1,
    timestamp: "2025-04-19T09:22:00",
    track: "Brechin",
    drivers: ["Aidan"],
    weather: { tempC: 10, conditions: "overcast" },
    setupId: "SET-2025-04-19-Endurance",
    tireSetId: "TS-24-03-A",
    coldPressures: { FL: 10.5, FR: 10.5, RL: 10.0, RR: 10.0 },
    hotPressures: { FL: 11.5, FR: 11.5, RL: 11.0, RR: 11.0 },
    brakeBiasPct: 53,
    regenPct: 6,
    notes: "Oversteer on entry, calmer mid-corner",
    tags: ["brake-test"],
    dataLinks: [
      { kind: "XRK", url: "https://drive.google.com/file/d/EXAMPLE_XRK_01" },
    ],
  },
  {
    id: "AYR-2025-04-19-R02",
    testDayId: "TD-2025-04-19-AYR",
    runNumber: 2,
    timestamp: "2025-04-19T10:01:00",
    track: "Brechin",
    drivers: ["Evan"],
    weather: { tempC: 11, conditions: "clouds" },
    setupId: "SET-2025-04-19-Endurance",
    tireSetId: "TS-24-03-B",
    coldPressures: { FL: 10.5, FR: 10.5, RL: 10.0, RR: 10.0 },
    hotPressures: { FL: 11.5, FR: 11.5, RL: 11.0, RR: 11.0 },
    brakeBiasPct: 53,
    regenPct: 6,
    notes: "Neutral, slight push on power",
    tags: ["accel"],
    dataLinks: [
      { kind: "XRK", url: "https://drive.google.com/file/d/EXAMPLE_XRK_02" },
    ],
  },
];

// ---------- Helpers ----------
const emptyRun = (td: TestDay): Run => ({
  id: `${td.track.slice(0,3).toUpperCase()}-${td.date}-RXX`,
  testDayId: td.id,
  runNumber: 0,
  timestamp: new Date().toISOString(),
  track: td.track,
  drivers: [],
  dataLinks: [],
});

const kvString = (kvs: SetupKV[]) => kvs.map(k => `${k.key}: ${k.value}`).join(" • ");

// ---------- Main Component ----------
export default function UTFRDataDashboard() {
  const [days, setDays] = useState<TestDay[]>(initialDays);
  const [runs, setRuns] = useState<Run[]>(initialRuns);
  const [setups, setSetups] = useState<SetupSnapshot[]>(initialSetups);
  const [tires, setTires] = useState<TireSet[]>(initialTires);

  const [activeDayId, setActiveDayId] = useState(days[0]?.id ?? "");
  const activeDay = useMemo(() => days.find(d => d.id === activeDayId), [days, activeDayId]);

  const [query, setQuery] = useState("");
  const [filterDriver, setFilterDriver] = useState<string | "">("");
  const [filterSetup, setFilterSetup] = useState<string>(ANY);
  const [filterTire, setFilterTire] = useState<string>(ANY);

  const filteredRuns = useMemo(() => {
    return runs
      .filter(r => (activeDayId ? r.testDayId === activeDayId : true))
      .filter(r => (filterDriver ? r.drivers.includes(filterDriver) : true))
      .filter(r => (!isAny(filterSetup) ? r.setupId === filterSetup : true))
      .filter(r => (!isAny(filterTire) ? r.tireSetId === filterTire : true))
      .filter(r =>
        query
          ? [
              r.id,
              r.track,
              r.drivers.join(" "),
              r.tags?.join(" ") ?? "",
              r.notes ?? "",
            ]
              .join(" ")
              .toLowerCase()
              .includes(query.toLowerCase())
          : true
      )
      .sort((a, b) => a.runNumber - b.runNumber);
  }, [runs, activeDayId, filterDriver, filterSetup, filterTire, query]);

  // CRUD for Runs (local only)
  const upsertRun = (r: Run) => {
    setRuns(prev => {
      const i = prev.findIndex(x => x.id === r.id);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = r;
        return copy;
      }
      return [...prev, r];
    });
  };

  const deleteRun = (id: string) => setRuns(prev => prev.filter(r => r.id !== id));

  // Utility to construct a consistent Run ID
  const makeRunId = (td: TestDay, runNumber: number) =>
    `${td.track.substring(0,3).toUpperCase()}-${td.date}-R${String(runNumber).padStart(2, "0")}`;

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">UTFR Data Management Dashboard</h1>
        <div className="text-sm text-muted-foreground">Prototype • Local state only</div>
      </header>

      <Tabs defaultValue="runs" className="w-full">
        <TabsList className="grid grid-cols-5 max-w-xl">
          <TabsTrigger value="runs">Runs</TabsTrigger>
          <TabsTrigger value="setup">Setup Tracker</TabsTrigger>
          <TabsTrigger value="tires">Tire Tracker</TabsTrigger>
          <TabsTrigger value="lookup">Lookup</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
        </TabsList>

        {/* Runs Tab */}
        <TabsContent value="runs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span>Test Day</span>
                <Select value={activeDayId} onValueChange={setActiveDayId}>
                  <SelectTrigger className="w-[300px]"><SelectValue placeholder="Pick a day" /></SelectTrigger>
                  <SelectContent>
                    {days.map(d => (
                      <SelectItem key={d.id} value={d.id}>{`${d.date} • ${d.track}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="secondary" size="sm" className="ml-auto"><FilePlus2 className="w-4 h-4 mr-2"/>New Day</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader><DialogTitle>Create Test Day</DialogTitle></DialogHeader>
                    <NewDayForm onCreate={(d) => { setDays(prev => [...prev, d]); setActiveDayId(d.id); }} />
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            {activeDay && (
              <CardContent className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm"><b>Lead:</b> {activeDay.sessionLead ?? "—"}</p>
                  <p className="text-sm"><b>Weather plan:</b> {activeDay.weatherPlan ?? "—"}</p>
                  <p className="text-sm"><b>Run plan:</b> {activeDay.runPlan ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm"><b>Crew:</b> {activeDay.crew?.join(", ") ?? "—"}</p>
                  <p className="text-sm"><b>Notes:</b> {activeDay.notes ?? "—"}</p>
                </div>
                <div className="flex items-end justify-end gap-2">
                  <Button variant="outline" size="sm"><Upload className="w-4 h-4 mr-2"/>XRK Import (stub)</Button>
                  <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2"/>Export JSON</Button>
                </div>
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span>Runs</span>
                <div className="ml-auto flex gap-2 items-center">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-2 top-2.5" />
                    <Input className="pl-8 w-[260px]" placeholder="Search notes, tags, driver..." value={query} onChange={(e)=>setQuery(e.target.value)} />
                  </div>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-2"/>Filters</Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[360px]">
                      <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
                      <div className="space-y-4 mt-4">
                        <div>
                          <Label>Driver</Label>
                          <Input placeholder="e.g., Aidan" value={filterDriver} onChange={(e)=>setFilterDriver(e.target.value)} />
                        </div>
                        <div>
                          <Label>Setup</Label>
                          <Select value={filterSetup} onValueChange={setFilterSetup}>
                            <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value={ANY}>Any</SelectItem>
                              {setups.map(s=> <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Tire Set</Label>
                          <Select value={filterTire} onValueChange={setFilterTire}>
                            <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value={ANY}>Any</SelectItem>
                              {tires.map(t=> <SelectItem key={t.id} value={t.id}>{t.id}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                  {activeDay && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm"><FilePlus2 className="w-4 h-4 mr-2"/>New Run</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader><DialogTitle>New Run</DialogTitle></DialogHeader>
                        <RunForm
                          day={activeDay}
                          setups={setups}
                          tires={tires}
                          onSave={(r)=>{
                            const nr = { ...r, id: makeRunId(activeDay, r.runNumber) };
                            upsertRun(nr);
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">Run</th>
                    <th className="py-2 pr-4">Time</th>
                    <th className="py-2 pr-4">Driver(s)</th>
                    <th className="py-2 pr-4">Setup</th>
                    <th className="py-2 pr-4">Tires</th>
                    <th className="py-2 pr-4">Bias/Reg</th>
                    <th className="py-2 pr-4">Notes</th>
                    <th className="py-2 pr-4">Links</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRuns.map(r => (
                    <tr key={r.id} className="border-b hover:bg-muted/30">
                      <td className="py-2 pr-4 font-medium">R{String(r.runNumber).padStart(2,"0")}</td>
                      <td className="py-2 pr-4">{new Date(r.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</td>
                      <td className="py-2 pr-4">{r.drivers.join(", ")}</td>
                      <td className="py-2 pr-4">{setups.find(s=>s.id===r.setupId)?.name ?? "—"}</td>
                      <td className="py-2 pr-4">{r.tireSetId ?? "—"}</td>
                      <td className="py-2 pr-4">{r.brakeBiasPct ? `${r.brakeBiasPct}%` : "—"} / {r.regenPct ? `${r.regenPct}%` : "—"}</td>
                      <td className="py-2 pr-4 max-w-[360px] truncate" title={r.notes}>{r.notes}</td>
                      <td className="py-2 pr-4 flex gap-2">
                        {r.dataLinks?.map((dl, i) => (
                          <a key={i} href={toDriveDownloadURL(dl.url)} className="text-primary underline inline-flex items-center" target="_blank" rel="noreferrer">
                            <LinkIcon className="w-3 h-3 mr-1"/>{dl.kind}
                          </a>
                        ))}
                      </td>
                      <td className="py-2 pr-4 text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon"><Pencil className="w-4 h-4"/></Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader><DialogTitle>Edit Run</DialogTitle></DialogHeader>
                            <RunForm
                              day={activeDay!}
                              run={r}
                              setups={setups}
                              tires={tires}
                              onSave={upsertRun}
                            />
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="icon" onClick={()=>deleteRun(r.id)}><Trash2 className="w-4 h-4"/></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Setup Tracker */}
        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Setup Snapshots</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm"><FilePlus2 className="w-4 h-4 mr-2"/>New Setup</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader><DialogTitle>Create Setup</DialogTitle></DialogHeader>
                  <SetupForm onSave={(s)=> setSetups(prev => [...prev, s])} setups={setups} />
                </DialogContent>
              </Dialog>

              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {setups.map(s => (
                  <Card key={s.id} className="h-full">
                    <CardHeader>
                      <CardTitle className="text-base">{s.name}</CardTitle>
                      <div className="text-xs text-muted-foreground">{s.id}{s.basedOn ? ` • Based on ${s.basedOn}`: ""}</div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{kvString(s.kvs)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tire Tracker */}
        <TabsContent value="tires" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tire Sets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm"><FilePlus2 className="w-4 h-4 mr-2"/>New Tire Set</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>Create Tire Set</DialogTitle></DialogHeader>
                  <TireForm onSave={(t)=> setTires(prev => [...prev, t])} />
                </DialogContent>
              </Dialog>

              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {tires.map(t => (
                  <Card key={t.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{t.id}</CardTitle>
                      <div className="text-xs text-muted-foreground">{t.compound} • {t.size}</div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{t.notes || "—"}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lookup Tool */}
        <TabsContent value="lookup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Global Lookup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-5 gap-3">
                <div className="md:col-span-2">
                  <Label>Free text</Label>
                  <Input placeholder="driver, tag, track, note..." value={query} onChange={(e)=>setQuery(e.target.value)} />
                </div>
                <div>
                  <Label>Driver</Label>
                  <Input placeholder="Aidan" value={filterDriver} onChange={(e)=>setFilterDriver(e.target.value)} />
                </div>
                <div>
                  <Label>Setup</Label>
                  <Select value={filterSetup} onValueChange={setFilterSetup}>
                    <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ANY}>Any</SelectItem>
                      {setups.map(s=> <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tires</Label>
                  <Select value={filterTire} onValueChange={setFilterTire}>
                    <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ANY}>Any</SelectItem>
                      {tires.map(t=> <SelectItem key={t.id} value={t.id}>{t.id}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 pr-4">Day</th>
                      <th className="py-2 pr-4">Run</th>
                      <th className="py-2 pr-4">Track</th>
                      <th className="py-2 pr-4">Drivers</th>
                      <th className="py-2 pr-4">Setup</th>
                      <th className="py-2 pr-4">Tags</th>
                      <th className="py-2 pr-4">Notes</th>
                      <th className="py-2 pr-4">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRuns.map(r => (
                      <tr key={r.id} className="border-b hover:bg-muted/30">
                        <td className="py-2 pr-4">{r.testDayId}</td>
                        <td className="py-2 pr-4">R{String(r.runNumber).padStart(2,"0")}</td>
                        <td className="py-2 pr-4">{r.track}</td>
                        <td className="py-2 pr-4">{r.drivers.join(", ")}</td>
                        <td className="py-2 pr-4">{setups.find(s=>s.id===r.setupId)?.name ?? "—"}</td>
                        <td className="py-2 pr-4">{r.tags?.join(", ") ?? "—"}</td>
                        <td className="py-2 pr-4 max-w-[440px] truncate" title={r.notes}>{r.notes}</td>
                        <td className="py-2 pr-4">{r.dataLinks?.map((dl,i)=>(
                          <a key={i} href={toDriveDownloadURL(dl.url)} className="text-primary underline" target="_blank" rel="noreferrer">{dl.kind}</a>
                        ))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin (conventions + helpers) */}
        <TabsContent value="admin" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Naming & ID Conventions</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-3">
              <ul className="list-disc pl-5 space-y-1">
                <li><b>Test Day ID</b>: <code>TD-YYYY-MM-DD-TRACK</code> (e.g., <code>TD-2025-04-19-AYR</code>)</li>
                <li><b>Run ID</b>: <code>TRK-YYYY-MM-DD-R##</code> using track code (e.g., <code>AYR-2025-04-19-R07</code>)</li>
                <li><b>Setup ID</b>: <code>SET-YYYY-MM-DD-Name</code></li>
                <li><b>Tire Set ID</b>: short code, e.g., <code>TS-24-03-A</code></li>
                <li><b>XRK File Name</b>: <code>TRK_YYYYMMDD_R##_Driver_SetupID.xrk</code></li>
              </ul>
              <p>
                Store XRKs in a Google Drive folder per Test Day. Link each XRK to its Run via the <i>Data Links</i> column.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Backend Schema (suggested)</CardTitle></CardHeader>
            <CardContent>
              <pre className="text-xs whitespace-pre-wrap">{`
-- Postgres (supabase/railway/fly.io friendly)
CREATE TABLE test_days (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  track TEXT NOT NULL,
  session_lead TEXT,
  weather_plan TEXT,
  run_plan TEXT,
  crew TEXT[],
  notes TEXT
);

CREATE TABLE setups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  based_on TEXT REFERENCES setups(id),
  kvs JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE tire_sets (
  id TEXT PRIMARY KEY,
  compound TEXT,
  size TEXT,
  notes TEXT
);

CREATE TABLE runs (
  id TEXT PRIMARY KEY,
  test_day_id TEXT REFERENCES test_days(id) ON DELETE CASCADE,
  run_number INT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  track TEXT NOT NULL,
  drivers TEXT[] NOT NULL,
  weather JSONB,
  setup_id TEXT REFERENCES setups(id),
  tire_set_id TEXT REFERENCES tire_sets(id),
  cold_pressures JSONB,
  hot_pressures JSONB,
  brake_bias_pct INT,
  regen_pct INT,
  fuel_start_l NUMERIC,
  notes TEXT,
  tags TEXT[],
  data_links JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- Useful indexes
CREATE INDEX runs_test_day_idx ON runs(test_day_id);
CREATE INDEX runs_gin_tags ON runs USING GIN (tags);
CREATE INDEX runs_gin_notes ON runs USING GIN ((to_tsvector('english', notes)));
`}</pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Integrations (next steps)</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              <ul className="list-disc pl-5 space-y-1">
                <li>Google Drive API: choose a root folder per-season; auto-create subfolders per Test Day; upload XRKs; write back file IDs to <i>runs.data_links</i>.</li>
                <li>CSV/XLSX import/export for runs and setups. Map columns from your current sheet to <i>Run</i> fields.</li>
                <li>MoTeC i2 Pro: store log links and expose Download buttons (no special API required).</li>
                <li>User auth via Google OAuth; per-role permissions (driver/engineer/lead).</li>
                <li>Offline-first with IndexedDB; sync when online.</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------- Forms ----------
function NewDayForm({ onCreate }: { onCreate: (d: TestDay)=>void }) {
  const [date, setDate] = useState("");
  const [track, setTrack] = useState("");
  const [lead, setLead] = useState("");
  const [weatherPlan, setWeatherPlan] = useState("");
  const [runPlan, setRunPlan] = useState("");
  const [crew, setCrew] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e)=>setDate(e.target.value)} />
        </div>
        <div>
          <Label>Track</Label>
          <Input placeholder="Ayrton" value={track} onChange={(e)=>setTrack(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Session Lead</Label>
          <Input value={lead} onChange={(e)=>setLead(e.target.value)} />
        </div>
        <div>
          <Label>Crew (comma separated)</Label>
          <Input value={crew} onChange={(e)=>setCrew(e.target.value)} />
        </div>
      </div>
      <div>
        <Label>Weather Plan</Label>
        <Input value={weatherPlan} onChange={(e)=>setWeatherPlan(e.target.value)} />
      </div>
      <div>
        <Label>Run Plan</Label>
        <Input value={runPlan} onChange={(e)=>setRunPlan(e.target.value)} />
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea value={notes} onChange={(e)=>setNotes(e.target.value)} />
      </div>
      <Button onClick={()=>{
        if(!date || !track) return;
        const id = `TD-${date}-${track.substring(0,3).toUpperCase()}`;
        onCreate({ id, date, track, sessionLead: lead, weatherPlan, runPlan, crew: crew? crew.split(",").map(s=>s.trim()): [], notes });
      }}>Create</Button>
    </div>
  )
}

function RunForm({ day, run, setups, tires, onSave }:{ day: TestDay, run?: Run, setups: SetupSnapshot[], tires: TireSet[], onSave: (r: Run)=>void }) {
  const [runNumber, setRunNumber] = useState(run?.runNumber ?? 1);
  const [time, setTime] = useState(run ? run.timestamp.substring(11,16) : new Date().toISOString().substring(11,16));
  const [drivers, setDrivers] = useState(run?.drivers.join(", ") ?? "");
  const [setupId, setSetupId] = useState<string | undefined>(run?.setupId);
  const [tireSetId, setTireSetId] = useState<string | undefined>(run?.tireSetId);
  const [bias, setBias] = useState(run?.brakeBiasPct?.toString() ?? "");
  const [regen, setRegen] = useState(run?.regenPct?.toString() ?? "");
  const [notes, setNotes] = useState(run?.notes ?? "");
  const [tags, setTags] = useState(run?.tags?.join(", ") ?? "");
  const [xrk, setXrk] = useState(run?.dataLinks?.find(d=>d.kind==="XRK")?.url ?? "");

  const save = () => {
    const ts = `${day.date}T${time}:00`;
    const newRun: Run = {
      ...(run ?? emptyRun(day)),
      runNumber,
      timestamp: ts,
      drivers: drivers ? drivers.split(",").map(s=>s.trim()) : [],
      setupId,
      tireSetId,
      brakeBiasPct: bias? parseInt(bias): undefined,
      regenPct: regen? parseInt(regen): undefined,
      notes,
      tags: tags? tags.split(",").map(s=>s.trim()): [],
      dataLinks: xrk ? [{ kind: "XRK", url: xrk }] : [],
    };
    onSave(newRun);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Run #</Label>
          <Input type="number" min={1} value={runNumber} onChange={(e)=>setRunNumber(parseInt(e.target.value || "1"))} />
        </div>
        <div>
          <Label>Time</Label>
          <Input type="time" value={time} onChange={(e)=>setTime(e.target.value)} />
        </div>
        <div>
          <Label>Drivers</Label>
          <Input placeholder="Aidan, Evan" value={drivers} onChange={(e)=>setDrivers(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Setup</Label>
          <Select value={setupId} onValueChange={setSetupId}>
            <SelectTrigger><SelectValue placeholder="Select setup" /></SelectTrigger>
            <SelectContent>
              {setups.map(s=> <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tire Set</Label>
          <Select value={tireSetId} onValueChange={setTireSetId}>
            <SelectTrigger><SelectValue placeholder="Select tires" /></SelectTrigger>
            <SelectContent>
              {tires.map(t=> <SelectItem key={t.id} value={t.id}>{t.id}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Brake Bias %</Label>
            <Input value={bias} onChange={(e)=>setBias(e.target.value)} />
          </div>
          <div>
            <Label>Regen %</Label>
            <Input value={regen} onChange={(e)=>setRegen(e.target.value)} />
          </div>
        </div>
      </div>
      <div>
        <Label>XRK / Data Link (Google Drive URL)</Label>
        <Input placeholder="https://drive.google.com/file/d/..." value={xrk} onChange={(e)=>setXrk(e.target.value)} />
      </div>
      <div>
        <Label>Tags</Label>
        <Input placeholder="accel, endurance, brake-test" value={tags} onChange={(e)=>setTags(e.target.value)} />
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea value={notes} onChange={(e)=>setNotes(e.target.value)} />
      </div>
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button onClick={save}>Save</Button>
      </div>
    </div>
  );
}

function SetupForm({ onSave, setups }:{ onSave:(s:SetupSnapshot)=>void, setups: SetupSnapshot[] }){
  const [name, setName] = useState("");
  // store a derived value for the Select: either an id or NONE
  const [baseSelectValue, setBaseSelectValue] = useState<string>(NONE);
  const [raw, setRaw] = useState("Damper F Comp: 5\nDamper F Reb: 5\nDamper R Comp: 4\nDamper R Reb: 4");

  const save = () => {
    if(!name) return;
    const lines = raw.split("\n").map(l=>l.trim()).filter(Boolean);
    const kvs: SetupKV[] = lines.map(l=>{
      const [key, ...rest] = l.split(":");
      return { key: key.trim(), value: rest.join(":").trim() };
    });
    const id = `SET-${new Date().toISOString().slice(0,10)}-${name.replace(/\s+/g,'')}`;
    const basedOn = baseSelectValue === NONE ? undefined : baseSelectValue;
    onSave({ id, name, basedOn, kvs });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Good Endurance Damp Setup" />
        </div>
        <div>
          <Label>Based on (optional)</Label>
          <Select value={baseSelectValue} onValueChange={setBaseSelectValue}>
            <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>None</SelectItem>
              {setups.map(s=> <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Key-Values (one per line)</Label>
        <Textarea rows={8} value={raw} onChange={(e)=>setRaw(e.target.value)} />
        <p className="text-xs text-muted-foreground mt-1">Examples: "Brake Bias: Click 6", "Weight Dist: 51.8/48.2", "Ride Height F: 10.0"</p>
      </div>
      <div className="flex justify-end"><Button onClick={save}>Save</Button></div>
    </div>
  )
}

function TireForm({ onSave }:{ onSave:(t:TireSet)=>void }){
  const [id, setId] = useState("");
  const [compound, setCompound] = useState("Hoosier R20");
  const [size, setSize] = useState("16x7.5");
  const [notes, setNotes] = useState("");
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>ID</Label>
          <Input value={id} onChange={(e)=>setId(e.target.value)} placeholder="TS-24-03-C" />
        </div>
        <div>
          <Label>Compound</Label>
          <Input value={compound} onChange={(e)=>setCompound(e.target.value)} />
        </div>
        <div>
          <Label>Size</Label>
          <Input value={size} onChange={(e)=>setSize(e.target.value)} />
        </div>
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea value={notes} onChange={(e)=>setNotes(e.target.value)} />
      </div>
      <div className="flex justify-end"><Button onClick={()=> onSave({ id, compound, size, notes })}>Save</Button></div>
    </div>
  )
}

/*
=============================================================
DEV TESTS (light, runtime console checks)
=============================================================
These are sanity checks to ensure sentinels, filtering, and Drive URL parsing behave.
They will print to the browser console.
*/
(function devTests(){
  try {
    console.assert(ANY !== "", "ANY sentinel should not be empty");
    console.assert(NONE !== "", "NONE sentinel should not be empty");

    // makeRunId formatting
    const mockTD: TestDay = { id:"TD-2025-04-19-AYR", date:"2025-04-19", track:"Ayrton" };
    const id = `${mockTD.track.substring(0,3).toUpperCase()}-${mockTD.date}-R${String(7).padStart(2, "0")}`;
    console.assert(id === "AYR-2025-04-19-R07", "makeRunId format failed");

    // Filtering tests with ANY (should include both runs)
    const rs = initialRuns;
    const all = rs.filter(r => (!isAny(ANY) ? r.setupId === ANY : true));
    console.assert(all.length === rs.length, "Filter with ANY should not exclude runs");

    // Drive link transform tests
    const dl1 = toDriveDownloadURL("https://drive.google.com/file/d/ABC123456789/view");
    console.assert(dl1.includes("id=ABC123456789"), "Drive /file/d/ parser failed");

    const dl2 = toDriveDownloadURL("https://drive.google.com/open?id=ZYX987654321");
    console.assert(dl2.includes("id=ZYX987654321"), "Drive ?id= parser failed");

    const non = toDriveDownloadURL("https://example.com/other");
    console.assert(non === "https://example.com/other", "Non-Drive URL should be unchanged");

    console.info("DEV TESTS: all checks passed ✔");
  } catch (e) {
    console.warn("DEV TESTS: some checks failed", e);
  }
})();

/*
=============================================================
HOW TO SHIP THIS QUICKLY
=============================================================
1) Deploy the front-end on Vercel/Netlify as a Next.js app; keep this component as /app/page.tsx
2) Stand up Postgres on Supabase; paste the SQL from Admin tab. Generate Types with supabase-js.
3) Add Google auth (Supabase Auth) and use RLS policies to restrict edits by role.
4) Google Drive API service account with access to a UTFR drive root; implement "Import XRK" to scan a Test Day folder and auto-create Run rows based on filename pattern.
5) Add CSV import for legacy sheet; map columns to Run fields; validate; show dry-run before writing.
6) MoTeC i2 Pro: expose Download / Open in Drive; optional helper for auto-open on Windows.
*/
