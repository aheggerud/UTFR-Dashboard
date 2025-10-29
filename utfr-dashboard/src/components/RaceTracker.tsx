import React, { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Lap = {
  lapNumber: number;
  timeSec?: number; // lap time in seconds
  cones?: number;
  socStartPct?: number;
  socEndPct?: number;
  targetWh?: number; // per-lap energy target (Wh)
  notes?: string;
};

function formatLapTime(sec?: number) {
  if (sec === undefined || Number.isNaN(sec)) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toFixed(2).padStart(5, "0")}`; // m:ss.ff
}

export default function RaceTracker() {
  const [driver, setDriver] = useState("");
  const [track, setTrack] = useState("");
  const [ambientTempC, setAmbientTempC] = useState<string>("");
  const [stintName, setStintName] = useState("Stint 1");
  const [targetSocPct, setTargetSocPct] = useState<string>("");
  const [initialSocPct, setInitialSocPct] = useState<string>("");
  const [kwhPack, setKwhPack] = useState<string>("");
  const [lapTargetWh, setLapTargetWh] = useState<string>("");

  const [laps, setLaps] = useState<Lap[]>([]);
  const [nextLapNum, setNextLapNum] = useState(1);
  type Stint = {
    id: string;
    driver: string;
    track: string;
    name: string;
    driverSwapSec?: number;
    kwhActual?: number; // manually entered
    laps: Lap[]; // preserve laps from this stint
    totals: { numLaps: number; totalCones: number; avgLap?: number; bestLap?: number; kwhUsedEst?: number };
  };
  const [stints, setStints] = useState<Stint[]>([]);
  const [selectedStintId, setSelectedStintId] = useState<string>("current");

  // Write a stint JSON to Google Drive if write access is granted via LocalGoogleDriveSync
  const exportStintToDrive = async (stint: Stint) => {
    try {
      const writeHandle: any = (typeof window !== 'undefined') ? (window as any).utfrWriteHandle : null;
      if (!writeHandle) return; // silently no-op if no write access

      // Derive folder name: use today's date and provided track name
      const today = new Date();
      const yyyy = today.getFullYear();
      const m = today.getMonth() + 1;
      const d = today.getDate();
      const trackName = (stint.track || 'Unknown').trim() || 'Unknown';
      const folderName = `${yyyy}-${m}-${d} - ${trackName}`;

      // Ensure day directory and Data Dump subfolder exist
      // @ts-ignore
      const dayDir = await writeHandle.getDirectoryHandle(folderName, { create: true });
      // @ts-ignore
      const dataDumpDir = await dayDir.getDirectoryHandle('Data Dump', { create: true });

      // Compose a stable, readable filename
      const safeName = stint.name.replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 40) || 'stint';
      const shortId = stint.id.slice(-6);
      const fileName = `stint-${safeName}-${shortId}.json`;

      const payload = {
        exportedAt: new Date().toISOString(),
        driver: stint.driver,
        track: stint.track,
        name: stint.name,
        totals: stint.totals,
        laps: stint.laps,
      };

      // @ts-ignore
      const fileHandle = await dataDumpDir.getFileHandle(fileName, { create: true });
      // @ts-ignore
      const writable = await fileHandle.createWritable();
      await writable.write(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
      await writable.close();
    } catch (err) {
      // Swallow errors to avoid interrupting UI flow; export is best-effort
      console.warn('Failed to export stint to Drive:', err);
    }
  };

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [running, setRunning] = useState(false);
  const [lapStartTs, setLapStartTs] = useState<number | null>(null);
  const [liveLapSec, setLiveLapSec] = useState<number>(0);

  const startLap = () => {
    if (running) return;
    setLapStartTs(performance.now());
    setRunning(true);
    if (timerRef.current) clearInterval(timerRef.current as any);
    timerRef.current = setInterval(() => {
      setLiveLapSec(prev => {
        if (!running && lapStartTs == null) return 0;
        const now = performance.now();
        const base = lapStartTs ?? now;
        return (now - base) / 1000;
      });
      return undefined as any;
    }, 50) as any;
  };

  const endLap = () => {
    if (!running || lapStartTs == null) return;
    const elapsedMs = performance.now() - lapStartTs;
    const timeSec = elapsedMs / 1000;
    setLaps(prev => [...prev, { lapNumber: nextLapNum, timeSec }]);
    setNextLapNum(n => n + 1);
    setRunning(false);
    setLapStartTs(null);
    setLiveLapSec(0);
    if (timerRef.current) { clearInterval(timerRef.current as any); timerRef.current = null; }
  };

  const markLap = () => {
    if (!running || lapStartTs == null) return;
    const elapsedMs = performance.now() - lapStartTs;
    const timeSec = elapsedMs / 1000;
    setLaps(prev => [...prev, { lapNumber: nextLapNum, timeSec }]);
    setNextLapNum(n => n + 1);
    // immediately start next lap
    setLapStartTs(performance.now());
    setLiveLapSec(0);
  };

  const addManualLap = (timeStr: string) => {
    const t = parseFloat(timeStr);
    if (!Number.isFinite(t)) return;
    setLaps(prev => [...prev, { lapNumber: nextLapNum, timeSec: t }]);
    setNextLapNum(n => n + 1);
  };

  const updateLap = (lapNumber: number, patch: Partial<Lap>) => {
    if (selectedStintId === "current") {
      setLaps(prev => prev.map(l => (l.lapNumber === lapNumber ? { ...l, ...patch } : l)));
    } else {
      // Update lap in a previous stint
      setStints(prev => prev.map(stint => 
        stint.id === selectedStintId 
          ? { ...stint, laps: stint.laps.map(l => (l.lapNumber === lapNumber ? { ...l, ...patch } : l)) }
          : stint
      ));
    }
  };

  // Get the laps to display (either current laps or laps from selected stint)
  const displayLaps = useMemo(() => {
    if (selectedStintId === "current") {
      return laps;
    } else {
      const selectedStint = stints.find(s => s.id === selectedStintId);
      return selectedStint?.laps || [];
    }
  }, [selectedStintId, laps, stints]);

  const totals = useMemo(() => {
    const totalCones = displayLaps.reduce((acc, l) => acc + (l.cones ?? 0), 0);
    const numLaps = displayLaps.length;
    const validTimes = displayLaps.map(l => l.timeSec).filter((x): x is number => typeof x === "number");
    const avgLap = validTimes.length ? validTimes.reduce((a, b) => a + b, 0) / validTimes.length : undefined;
    const bestLap = validTimes.length ? Math.min(...validTimes) : undefined;

    // Simple SOC/kWh model: if initial SOC and pack kWh known, estimate used kWh
    const initSoc = parseFloat(initialSocPct || "");
    const finalSoc = displayLaps.at(-1)?.socEndPct;
    const pack = parseFloat(kwhPack || "");
    const kwhUsed = Number.isFinite(initSoc) && Number.isFinite(pack) && Number.isFinite(finalSoc ?? NaN)
      ? (Math.max(0, initSoc - (finalSoc as number)) / 100) * pack
      : undefined;

    return { totalCones, numLaps, avgLap, bestLap, kwhUsed };
  }, [displayLaps, initialSocPct, kwhPack]);

  const endStintAndAppend = () => {
    // close running lap if any
    if (running) {
      markLap();
      setRunning(false);
      setLapStartTs(null);
      if (timerRef.current) { clearInterval(timerRef.current as any); timerRef.current = null; }
    }
    const est = totals.kwhUsed;
    const stint: Stint = {
      id: `${stintName}-${Date.now()}`,
      driver,
      track,
      name: stintName,
      laps: [...laps], // preserve the laps from this stint
      totals: { numLaps: totals.numLaps, totalCones: totals.totalCones, avgLap: totals.avgLap, bestLap: totals.bestLap, kwhUsedEst: est },
    };
    setStints(prev => [...prev, stint]);
    // Best-effort auto-export to Google Drive if write access granted
    exportStintToDrive(stint);
    // reset for next stint
    setLaps([]); setNextLapNum(1); setStintName(`Stint ${stints.length + 2}`);
  };

  return (
    <Card className="bg-gray-900 border border-gray-800 shadow-lg">
      <CardHeader className="border-b border-gray-800">
        <CardTitle className="text-xl font-light text-white tracking-wide">Race Tracker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-white">
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <Label>Stint</Label>
            <Input value={stintName} onChange={(e)=>setStintName(e.target.value)} className="text-white bg-gray-800 border-gray-700" />
          </div>
          <div>
            <Label>Driver</Label>
            <Input value={driver} onChange={(e)=>setDriver(e.target.value)} className="text-white bg-gray-800 border-gray-700" />
          </div>
          <div>
            <Label>Track</Label>
            <Input value={track} onChange={(e)=>setTrack(e.target.value)} className="text-white bg-gray-800 border-gray-700" />
          </div>
          <div>
            <Label>Ambient °C</Label>
            <Input value={ambientTempC} onChange={(e)=>setAmbientTempC(e.target.value)} className="text-white bg-gray-800 border-gray-700" />
          </div>
          <div>
            <Label>Target SOC % (lap)</Label>
            <Input value={targetSocPct} onChange={(e)=>setTargetSocPct(e.target.value)} className="text-white bg-gray-800 border-gray-700" />
          </div>
          <div>
            <Label>Initial SOC %</Label>
            <Input value={initialSocPct} onChange={(e)=>setInitialSocPct(e.target.value)} className="text-white bg-gray-800 border-gray-700" />
          </div>
          <div>
            <Label>Pack Energy (kWh)</Label>
            <Input value={kwhPack} onChange={(e)=>setKwhPack(e.target.value)} className="text-white bg-gray-800 border-gray-700" />
          </div>
          <div>
            <Label>Lap Target (Wh)</Label>
            <Input value={lapTargetWh} onChange={(e)=>setLapTargetWh(e.target.value)} className="text-white bg-gray-800 border-gray-700" />
          </div>
        </div>

        {/* Stint Selector */}
        <div className="flex items-center gap-3">
          <Label className="text-white">View Stint:</Label>
          <Select value={selectedStintId} onValueChange={setSelectedStintId}>
            <SelectTrigger className="w-[200px] text-white bg-gray-800 border-gray-700">
              <SelectValue placeholder="Select stint" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Current Stint
                </div>
              </SelectItem>
              {stints.map(stint => (
                <SelectItem key={stint.id} value={stint.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    {stint.name} - {stint.driver}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedStintId !== "current" ? (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-blue-300">Editing completed stint</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-300">Live tracking</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 items-center">
          <Button onClick={startLap} disabled={running || selectedStintId !== "current"}>Start Lap</Button>
          <Button onClick={markLap} disabled={!running || selectedStintId !== "current"}>Mark Lap</Button>
          <Button onClick={endStintAndAppend} disabled={selectedStintId !== "current"}>{running ? 'End Stint' : 'Save Stint'}</Button>
          {selectedStintId === "current" && (
            <div className="ml-4 text-sm opacity-80">Live: <b>{formatLapTime(liveLapSec)}</b></div>
          )}
        </div>

        <div className="overflow-x-auto border border-gray-800 rounded-lg bg-gray-950">
          <div className="bg-gray-900 px-4 py-2 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">
                {selectedStintId === "current" ? "Current Stint Laps" : "Completed Stint Laps"}
              </h3>
              {selectedStintId !== "current" && (
                <div className="text-xs text-blue-300 bg-blue-900/30 px-2 py-1 rounded">
                  All fields editable
                </div>
              )}
            </div>
          </div>
          <table className="min-w-full text-sm font-mono text-white">
            <thead className="bg-gray-900">
              <tr className="text-left border-b border-gray-800">
                <th className="py-2 px-3">Lap</th>
                <th className="py-2 px-3">Time</th>
                <th className="py-2 px-3">Cones</th>
                <th className="py-2 px-3">SOC Start %</th>
                <th className="py-2 px-3">SOC End %</th>
                <th className="py-2 px-3">Target (Wh)</th>
                <th className="py-2 px-3">Consumption (Wh)</th>
                <th className="py-2 px-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {displayLaps.map(l => {
                const pack = parseFloat(kwhPack || "");
                const start = l.socStartPct;
                const end = l.socEndPct;
                const consWh = Number.isFinite(pack) && start !== undefined && end !== undefined
                  ? Math.max(0, (start - end)) / 100 * pack * 1000
                  : undefined;
                const targetWh = l.targetWh ?? (parseFloat(lapTargetWh || "") || undefined);
                const over = targetWh !== undefined && consWh !== undefined ? consWh > targetWh : false;
                const bg = consWh === undefined || targetWh === undefined ? "" : (over ? "bg-red-900/40" : "bg-green-900/30");
                return (
                  <tr key={l.lapNumber} className="border-b border-gray-800">
                    <td className="py-2 px-3">{l.lapNumber}</td>
                    <td className="py-2 px-3">
                      {selectedStintId === "current" ? (
                        formatLapTime(l.timeSec)
                      ) : (
                        <Input 
                          value={l.timeSec ? l.timeSec.toString() : ""} 
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            updateLap(l.lapNumber, { timeSec: Number.isFinite(val) ? val : undefined });
                          }} 
                          placeholder="Time (sec)"
                          className="w-24 text-white bg-gray-800 border-gray-700" 
                        />
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <Input 
                        value={l.cones !== undefined ? l.cones.toString() : ""} 
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            updateLap(l.lapNumber, { cones: undefined });
                          } else {
                            const num = parseInt(val);
                            if (!isNaN(num)) {
                              updateLap(l.lapNumber, { cones: num });
                            }
                          }
                        }} 
                        placeholder="0"
                        className="w-24 text-white bg-gray-800 border-gray-700" 
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Input 
                        value={l.socStartPct !== undefined ? l.socStartPct.toString() : ""} 
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            updateLap(l.lapNumber, { socStartPct: undefined });
                          } else {
                            const num = parseFloat(val);
                            if (!isNaN(num)) {
                              updateLap(l.lapNumber, { socStartPct: num });
                            }
                          }
                        }} 
                        placeholder="0"
                        className="w-28 text-white bg-gray-800 border-gray-700" 
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Input 
                        value={l.socEndPct !== undefined ? l.socEndPct.toString() : ""} 
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            updateLap(l.lapNumber, { socEndPct: undefined });
                          } else {
                            const num = parseFloat(val);
                            if (!isNaN(num)) {
                              updateLap(l.lapNumber, { socEndPct: num });
                            }
                          }
                        }} 
                        placeholder="0"
                        className="w-28 text-white bg-gray-800 border-gray-700" 
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Input 
                        value={l.targetWh !== undefined ? l.targetWh.toString() : (lapTargetWh || "")} 
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            updateLap(l.lapNumber, { targetWh: undefined });
                          } else {
                            const num = parseFloat(val);
                            if (!isNaN(num)) {
                              updateLap(l.lapNumber, { targetWh: num });
                            }
                          }
                        }} 
                        placeholder={lapTargetWh || "0"}
                        className="w-28 text-white bg-gray-800 border-gray-700" 
                      />
                    </td>
                    <td className={`py-2 px-3 ${bg}`}>{consWh?.toFixed(0) ?? "—"}</td>
                    <td className="py-2 px-3">
                      <Input value={l.notes ?? ""} onChange={(e)=>updateLap(l.lapNumber, { notes: e.target.value })} className="text-white bg-gray-800 border-gray-700" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="grid md:grid-cols-4 gap-3 text-white">
          <div className="p-3 bg-gray-800 rounded">Laps: <b>{totals.numLaps}</b></div>
          <div className="p-3 bg-gray-800 rounded">Cones: <b>{totals.totalCones}</b></div>
          <div className="p-3 bg-gray-800 rounded">Avg: <b>{formatLapTime(totals.avgLap)}</b></div>
          <div className="p-3 bg-gray-800 rounded">Best: <b>{formatLapTime(totals.bestLap)}</b></div>
          <div className="p-3 bg-gray-800 rounded md:col-span-2">kWh Used (est): <b>{totals.kwhUsed?.toFixed(2) ?? "—"}</b></div>
        </div>

        {/* Stints Summary */}
        {stints.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm text-gray-400 bg-gray-800 p-3 rounded border border-gray-700">
              <strong>💡 Tip:</strong> You can switch to any completed stint above to edit lap times, SOC values, cones, and notes. 
              Changes are saved automatically and will update the stint totals.
            </div>
            {stints.map((s, i) => {
              const [actual, setActual] = [s.kwhActual, (v:number | undefined)=>setStints(prev=>prev.map(x=>x.id===s.id?{...x,kwhActual:v}:x))];
              const [swap, setSwap] = [s.driverSwapSec, (v:number | undefined)=>setStints(prev=>prev.map(x=>x.id===s.id?{...x,driverSwapSec:v}:x))];
              const over = s.kwhActual !== undefined && s.totals.kwhUsedEst !== undefined ? s.kwhActual > s.totals.kwhUsedEst : false;
              const bg = s.kwhActual === undefined ? "bg-gray-900" : (over ? "bg-red-900/40" : "bg-green-900/30");
              const isSelected = selectedStintId === s.id;
              return (
                <div key={s.id} className={`p-3 rounded border ${isSelected ? 'border-blue-500 bg-blue-900/20' : 'border-gray-800'} ${bg}`}>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="font-mono flex items-center gap-2">
                      {isSelected && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                      {s.name} • {s.driver} @ {s.track}
                      {isSelected && <span className="text-xs text-blue-300 bg-blue-800/50 px-2 py-1 rounded">Currently Viewing</span>}
                    </div>
                    <div className="text-sm opacity-80">Laps: {s.totals.numLaps}, Cones: {s.totals.totalCones}, Avg: {formatLapTime(s.totals.avgLap)}, Best: {formatLapTime(s.totals.bestLap)}</div>
                    <div className="ml-auto flex gap-3 items-center">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Driver Swap (s)</Label>
                        <Input 
                          value={swap !== undefined && !isNaN(swap) ? swap.toString() : ""} 
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "") {
                              setSwap(undefined);
                            } else {
                              const num = parseFloat(val);
                              if (!isNaN(num)) {
                                setSwap(num);
                              }
                            }
                          }} 
                          placeholder="0"
                          className="w-28 text-white bg-gray-800 border-gray-700" 
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Actual kWh</Label>
                        <Input 
                          value={actual !== undefined && !isNaN(actual) ? actual.toString() : ""} 
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "") {
                              setActual(undefined);
                            } else {
                              const num = parseFloat(val);
                              if (!isNaN(num)) {
                                setActual(num);
                              }
                            }
                          }} 
                          placeholder="0"
                          className="w-28 text-white bg-gray-800 border-gray-700" 
                        />
                      </div>
                      <div className="text-sm">Est: {s.totals.kwhUsedEst?.toFixed(2) ?? "—"}</div>
                      <Button 
                        variant="outline" 
                        className="text-xs border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                        onClick={() => exportStintToDrive(s)}
                      >
                        Export JSON
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


