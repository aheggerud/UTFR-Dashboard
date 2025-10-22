"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Download, FilePlus2, Link as LinkIcon, Search, Upload, Pencil, Trash2, Filter, Edit, Play } from "lucide-react";
import RaceTracker from "./RaceTracker";
import LocalGoogleDriveSync from "./LocalGoogleDriveSync";
import XRKFileImporter from "./XRKFileImporter";

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
  setupGoal?: string; // Meta: Setup Goal / Notes
  
  // Mechanical
  aero?: {
    aeroSetup?: string; // Aero Setup (per master sheet reference)
    aeroConfigNotes?: string; // Aero configuration notes
  };
  
  tire?: {
    tireSetId?: string; // Tire Set ID
    coldPressureFront?: number; // Cold Tire Pressure – Front
    coldPressureRear?: number; // Cold Tire Pressure – Rear
    hotPressureFront?: number; // Hot Tire Pressure – Front
    hotPressureRear?: number; // Hot Tire Pressure – Rear
  };
  
  brakes?: {
    brakeBias?: number; // Brake Bias (%)
    hydraulicBrakeOnset?: string; // Hydraulic Brake Onset
    brakeBiasBar?: string; // Brake Bias Bar
    proportioningValve?: number; // Proportioning Valve (1 = fully front, 6 = fully rear)
  };
  
  weight?: {
    flLbs?: number; // Front Left (lbs, no driver)
    frLbs?: number; // Front Right (lbs, no driver)
    rlLbs?: number; // Rear Left (lbs, no driver)
    rrLbs?: number; // Rear Right (lbs, no driver)
    frontLbs?: number; // Front (lbs, no driver) - calculated
    rearLbs?: number; // Rear (lbs, no driver) - calculated
    totalLbs?: number; // Total (lbs, no driver) - calculated
    crossWeight?: number; // Cross Weight ( (FL+RR)/Total ) - calculated
  };
  
  rideHeight?: {
    frontCm?: number; // Front (cm)
    rearCm?: number; // Rear (cm)
    minGroundClearance?: number; // Minimum Ground Clearance
  };
  
  alignment?: {
    camberFront?: number; // Camber (deg) – Front
    camberRear?: number; // Camber (deg) – Rear
    toeFront?: number; // Toe at Rims – Front
    toeRear?: number; // Toe at Rims – Rear
  };
  
  springsDampers?: {
    springRateFront?: number; // Spring Rate (Roll/Heave) – Front
    springRateRear?: number; // Spring Rate (Roll/Heave) – Rear
    rollDamperFront?: string; // Roll Damper – Front (clicks or setting)
    rollDamperRear?: string; // Roll Damper – Rear (clicks or setting)
    heaveDamperFront?: string; // Heave Damper – Front (clicks or setting)
    heaveDamperRear?: string; // Heave Damper – Rear (clicks or setting)
  };
  
  drivetrain?: {
    diffPreload?: string; // Differential Preload
    gearRatio?: string; // Gear Ratio
  };
  
  // Electrical
  firmware?: {
    fcHash?: string; // FC (Front Controller) hash
    rcHash?: string; // RC (Rear Controller) hash
    acmHash?: string; // ACM hash
    inverterEeprom?: string; // Inverter EEPROM
  };
  
  limits?: {
    torqueLimit?: number; // Torque Limit
    currentLimit?: number; // Current Limit
    powerLimit?: number; // Power Limit
  };
  
  battery?: {
    initialPackSOC?: number; // Initial Pack SOC (%)
    finalPackSOC?: number; // Final Pack SOC (%)
  };
  
  // Legacy support
  kvs?: SetupKV[]; // flexible key-value store for backward compatibility
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
  socStartPct?: number; // SOC at start of run (0-100)
  socEndPct?: number; // SOC at end of run (0-100)
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
  driveFolderUrl?: string; // Google Drive folder containing XRK files for this test day
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
    setupGoal: "Aggressive setup for autocross with quick transitions",
    aero: {
      aeroSetup: "Aero-2025-01",
      aeroConfigNotes: "Standard autocross wing settings"
    },
    tire: {
      tireSetId: "TS-24-03-A",
      coldPressureFront: 10.5,
      coldPressureRear: 10.0,
      hotPressureFront: 11.5,
      hotPressureRear: 11.0
    },
    brakes: {
      brakeBias: 53,
      proportioningValve: 4
    },
    weight: {
      flLbs: 92,
      frLbs: 88,
      rlLbs: 82,
      rrLbs: 78,
      frontLbs: 180,
      rearLbs: 160,
      totalLbs: 340,
      crossWeight: 0.52
    },
    rideHeight: {
      frontCm: 10.0,
      rearCm: 9.0,
      minGroundClearance: 8.5
    },
    alignment: {
      camberFront: -2.5,
      camberRear: -1.8,
      toeFront: 0.1,
      toeRear: 0.2
    },
    springsDampers: {
      springRateFront: 650,
      springRateRear: 550,
      rollDamperFront: "5 clicks",
      rollDamperRear: "4 clicks",
      heaveDamperFront: "5 clicks",
      heaveDamperRear: "4 clicks"
    },
    drivetrain: {
      diffPreload: "1.5 turns from open",
      gearRatio: "3.73:1"
    },
    firmware: {
      fcHash: "abc123def",
      rcHash: "def456ghi",
      acmHash: "ghi789jkl"
    },
    limits: {
      torqueLimit: 250,
      currentLimit: 200,
      powerLimit: 80
    },
    battery: {
      initialPackSOC: 85,
      finalPackSOC: 75
    }
  },
  {
    id: "SET-2025-04-19-Endurance",
    name: "Good Endurance Damp Setup",
    basedOn: "SET-2025-04-18-Autocross",
    setupGoal: "Conservative setup for endurance racing",
    aero: {
      aeroSetup: "Aero-2025-02",
      aeroConfigNotes: "Endurance wing settings for stability"
    },
    tire: {
      tireSetId: "TS-24-03-B",
      coldPressureFront: 11.0,
      coldPressureRear: 10.5,
      hotPressureFront: 12.0,
      hotPressureRear: 11.5
    },
    brakes: {
      brakeBias: 52,
      proportioningValve: 3
    },
    springsDampers: {
      springRateFront: 600,
      springRateRear: 500,
      rollDamperFront: "3 clicks",
      rollDamperRear: "2 clicks",
      heaveDamperFront: "3 clicks",
      heaveDamperRear: "2 clicks"
    },
    limits: {
      torqueLimit: 230,
      currentLimit: 180,
      powerLimit: 75
    }
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
    driveFolderUrl: "https://drive.google.com/drive/folders/EXAMPLE_FOLDER_ID_AYR_2025_04_19",
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
    socStartPct: 85,
    socEndPct: 78,
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
    socStartPct: 78,
    socEndPct: 65,
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

const formatSetupSummary = (setup: SetupSnapshot) => {
  const parts: string[] = [];
  
  if (setup.setupGoal) parts.push(`Goal: ${setup.setupGoal}`);
  
  if (setup.aero?.aeroSetup) parts.push(`Aero: ${setup.aero.aeroSetup}`);
  
  if (setup.tire?.tireSetId) parts.push(`Tires: ${setup.tire.tireSetId}`);
  if (setup.tire?.coldPressureFront && setup.tire?.coldPressureRear) {
    parts.push(`Cold: ${setup.tire.coldPressureFront}/${setup.tire.coldPressureRear} PSI`);
  }
  
  if (setup.brakes?.brakeBias) parts.push(`Brake Bias: ${setup.brakes.brakeBias}%`);
  
  if (setup.weight?.totalLbs) parts.push(`Weight: ${setup.weight.totalLbs} lbs`);
  if (setup.weight?.flLbs && setup.weight?.frLbs && setup.weight?.rlLbs && setup.weight?.rrLbs) {
    parts.push(`Corners: ${setup.weight.flLbs}/${setup.weight.frLbs}/${setup.weight.rlLbs}/${setup.weight.rrLbs} lbs`);
  }
  
  if (setup.rideHeight?.frontCm && setup.rideHeight?.rearCm) {
    parts.push(`Ride Height: ${setup.rideHeight.frontCm}/${setup.rideHeight.rearCm} cm`);
  }
  
  if (setup.alignment?.camberFront && setup.alignment?.camberRear) {
    parts.push(`Camber: ${setup.alignment.camberFront}/${setup.alignment.camberRear}°`);
  }
  
  if (setup.springsDampers?.springRateFront && setup.springsDampers?.springRateRear) {
    parts.push(`Springs: ${setup.springsDampers.springRateFront}/${setup.springsDampers.springRateRear} lbs/in`);
  }
  
  if (setup.limits?.torqueLimit) parts.push(`Torque: ${setup.limits.torqueLimit} Nm`);
  
  if (setup.battery?.initialPackSOC) parts.push(`SOC: ${setup.battery.initialPackSOC}%`);
  
  // Fallback to legacy kvs if no structured data
  if (parts.length === 0 && setup.kvs && setup.kvs.length > 0) {
    return kvString(setup.kvs);
  }
  
  return parts.join(" • ");
};

// ---------- Main Component ----------
export default function UTFRDataDashboard() {
  // Initialize from localStorage if available
  const [days, setDays] = useState<TestDay[]>(() => {
    if (typeof window === "undefined") return initialDays;
    try {
      const raw = localStorage.getItem("utfr_days");
      return raw ? JSON.parse(raw) : initialDays;
    } catch {
      return initialDays;
    }
  });
  const [runs, setRuns] = useState<Run[]>(() => {
    if (typeof window === "undefined") return initialRuns;
    try {
      const raw = localStorage.getItem("utfr_runs");
      return raw ? JSON.parse(raw) : initialRuns;
    } catch {
      return initialRuns;
    }
  });
  const [setups, setSetups] = useState<SetupSnapshot[]>(() => {
    if (typeof window === "undefined") return initialSetups;
    try {
      const raw = localStorage.getItem("utfr_setups");
      return raw ? JSON.parse(raw) : initialSetups;
    } catch {
      return initialSetups;
    }
  });
  const [tires, setTires] = useState<TireSet[]>(() => {
    if (typeof window === "undefined") return initialTires;
    try {
      const raw = localStorage.getItem("utfr_tires");
      return raw ? JSON.parse(raw) : initialTires;
    } catch {
      return initialTires;
    }
  });

  // Persist to localStorage when data changes
  React.useEffect(() => {
    try { localStorage.setItem("utfr_days", JSON.stringify(days)); } catch {}
  }, [days]);
  React.useEffect(() => {
    try { localStorage.setItem("utfr_runs", JSON.stringify(runs)); } catch {}
  }, [runs]);
  React.useEffect(() => {
    try { localStorage.setItem("utfr_setups", JSON.stringify(setups)); } catch {}
  }, [setups]);
  React.useEffect(() => {
    try { localStorage.setItem("utfr_tires", JSON.stringify(tires)); } catch {}
  }, [tires]);
  
  // XRK Data Import Handler with de-duplication by id (placeholder for future implementation)
  const handleXRKDataImport = (importedData: any) => {
    // TODO: Implement XRK data import functionality
    console.log('XRK data import:', importedData);
  };

  // Handle data imported from Google Drive sync
  const handleDataImported = (importedData: any) => {
    try {
      // Merge imported test days
      if (importedData.testDays && importedData.testDays.length > 0) {
        setDays(prev => {
          const existing = new Set(prev.map(d => d.id));
          const newDays = importedData.testDays.filter((d: TestDay) => !existing.has(d.id));
          return [...prev, ...newDays];
        });
      }

      // Merge imported runs
      if (importedData.runs && importedData.runs.length > 0) {
        setRuns(prev => {
          const existing = new Set(prev.map(r => r.id));
          const newRuns = importedData.runs.filter((r: Run) => !existing.has(r.id));
          return [...prev, ...newRuns];
        });
      }

      // Merge imported setups
      if (importedData.setups && importedData.setups.length > 0) {
        setSetups(prev => {
          const existing = new Set(prev.map(s => s.id));
          const newSetups = importedData.setups.filter((s: SetupSnapshot) => !existing.has(s.id));
          return [...prev, ...newSetups];
        });
      }

      // Merge imported tire sets
      if (importedData.tireSets && importedData.tireSets.length > 0) {
        setTires(prev => {
          const existing = new Set(prev.map(t => t.id));
          const newTires = importedData.tireSets.filter((t: TireSet) => !existing.has(t.id));
          return [...prev, ...newTires];
        });
      }

      console.log('Data imported successfully:', importedData);
    } catch (error) {
      console.error('Error importing data:', error);
    }
  };

  // Export setup to Google Drive folder
  const exportSetupToGoogleDrive = (setup: SetupSnapshot) => {
    try {
      // Create a JSON blob with the setup data
      const setupData = {
        id: setup.id,
        name: setup.name,
        timestamp: new Date().toISOString(),
        setupGoal: setup.setupGoal,
        aero: setup.aero,
        tire: setup.tire,
        brakes: setup.brakes,
        weight: setup.weight,
        rideHeight: setup.rideHeight,
        alignment: setup.alignment,
        springsDampers: setup.springsDampers,
        drivetrain: setup.drivetrain,
        firmware: setup.firmware,
        limits: setup.limits,
        battery: setup.battery,
        kvs: setup.kvs
      };

      const blob = new Blob([JSON.stringify(setupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `setup-${setup.name.replace(/[^a-zA-Z0-9]/g, '-')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert(`Setup "${setup.name}" exported successfully! Save this file to your Google Drive test day folder.`);
    } catch (error) {
      console.error('Error exporting setup:', error);
      alert('Failed to export setup. Please try again.');
    }
  };

  // Auto-export setup to Setups/ if write access is granted via Drive Sync panel
  const tryAutoWriteSetup = async (setup: SetupSnapshot) => {
    const handle: any = (typeof window !== 'undefined') ? (window as any).utfrWriteHandle : null;
    if (!handle) return; // no write permission granted
    try {
      // @ts-ignore
      const setupsDir = await handle.getDirectoryHandle('Setups', { create: true });
      // @ts-ignore
      const fileHandle = await setupsDir.getFileHandle(`setup-${setup.name.replace(/[^a-zA-Z0-9]/g, '-')}.json`, { create: true });
      // @ts-ignore
      const writable = await fileHandle.createWritable();
      const setupData = {
        id: setup.id,
        name: setup.name,
        timestamp: new Date().toISOString(),
        setupGoal: setup.setupGoal,
        aero: setup.aero,
        tire: setup.tire,
        brakes: setup.brakes,
        weight: setup.weight,
        rideHeight: setup.rideHeight,
        alignment: setup.alignment,
        springsDampers: setup.springsDampers,
        drivetrain: setup.drivetrain,
        firmware: setup.firmware,
        limits: setup.limits,
        battery: setup.battery,
        kvs: setup.kvs
      };
      await writable.write(new Blob([JSON.stringify(setupData, null, 2)], { type: 'application/json' }));
      await writable.close();
    } catch (err) {
      console.warn('Auto write setup failed:', err);
    }
  };
  
  // Dialog state management
  const [newSetupOpen, setNewSetupOpen] = useState(false);
  const [editingSetup, setEditingSetup] = useState<SetupSnapshot | null>(null);

  const [activeDayId, setActiveDayId] = useState(days[0]?.id ?? "");
  const activeDay = useMemo(() => days.find(d => d.id === activeDayId), [days, activeDayId]);

  const [query, setQuery] = useState("");
  const [filterDriver, setFilterDriver] = useState<string | "">("");
  const [filterSetup, setFilterSetup] = useState<string>(ANY);
  const [filterTire, setFilterTire] = useState<string>(ANY);

  // Filtered runs for the main runs page (only current test day)
  const filteredRuns = useMemo(() => {
    return runs
      .filter(r => activeDayId ? r.testDayId === activeDayId : true)
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

  // Filtered runs for the lookup page (all test days)
  const filteredRunsForLookup = useMemo(() => {
    return runs
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
      .sort((a, b) => {
        // Sort by test day date first, then by run number
        const dayA = days.find(d => d.id === a.testDayId);
        const dayB = days.find(d => d.id === b.testDayId);
        if (dayA && dayB) {
          const dateCompare = dayA.date.localeCompare(dayB.date);
          if (dateCompare !== 0) return dateCompare;
        }
        return a.runNumber - b.runNumber;
      });
  }, [runs, days, filterDriver, filterSetup, filterTire, query]);

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
    // Try to ensure Data Dump subfolder exists and write a placeholder file for this run (if write access granted)
    try {
      const writeHandle: any = (typeof window !== 'undefined') ? (window as any).utfrWriteHandle : null;
      if (writeHandle) {
        const testDay = days.find(d => d.id === r.testDayId);
        if (testDay) {
          const folderName = `${testDay.date} - ${testDay.track}`;
          // @ts-ignore
          writeHandle.getDirectoryHandle(folderName, { create: true })
            .then(async (dayDir: any) => {
              // Ensure "Data Dump" exists
              // @ts-ignore
              const dataDumpDir = await dayDir.getDirectoryHandle('Data Dump', { create: true });
              // Write a small JSON file describing the run
              try {
                // @ts-ignore
                const fileHandle = await dataDumpDir.getFileHandle(`run-${String(r.runNumber).padStart(2,'0')}.json`, { create: true });
                // @ts-ignore
                const writable = await fileHandle.createWritable();
                const runMeta = {
                  id: r.id,
                  testDay: { id: testDay.id, date: testDay.date, track: testDay.track },
                  runNumber: r.runNumber,
                  timestamp: r.timestamp,
                  drivers: r.drivers,
                  notes: r.notes ?? ''
                };
                await writable.write(new Blob([JSON.stringify(runMeta, null, 2)], { type: 'application/json' }));
                await writable.close();
              } catch {}
            })
            .catch(()=>{});
        }
      }
    } catch {}
  };

  const deleteRun = (id: string) => setRuns(prev => prev.filter(r => r.id !== id));

  // Utility to construct a consistent Run ID
  const makeRunId = (td: TestDay, runNumber: number) =>
    `${td.track.substring(0,3).toUpperCase()}-${td.date}-R${String(runNumber).padStart(2, "0")}`;

  return (
    <div className="min-h-screen" style={{backgroundColor: '#0A0A0A'}}>
      {/* Racing Telemetry Header */}
      <header className="border-b" style={{borderColor: '#333333', backgroundColor: '#0A0A0A'}}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Image
                  src="/utfr-logo.png"
                  alt="UTFR Logo"
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
                <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse" style={{backgroundColor: '#00FF66'}}></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-wider" style={{color: '#EAEAEA', fontFamily: 'DIN Condensed, Eurostile Extended, sans-serif'}}>
                  UTFR RACING DASHBOARD
                </h1>
                <p className="text-xs font-mono tracking-widest uppercase" style={{color: '#00E5FF'}}>PERFORMANCE TRACKING & ENGINEERING</p>
              </div>
            </div>
            
            {/* Performance Metrics */}
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <div className="text-xl font-mono font-bold" style={{color: '#EAEAEA'}}>{days.length}</div>
                <div className="text-xs font-mono uppercase tracking-wider" style={{color: '#00E5FF'}}>TEST DAYS</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-mono font-bold" style={{color: '#EAEAEA'}}>{runs.length}</div>
                <div className="text-xs font-mono uppercase tracking-wider" style={{color: '#00E5FF'}}>TOTAL RUNS</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-mono font-bold" style={{color: '#EAEAEA'}}>{setups.length}</div>
                <div className="text-xs font-mono uppercase tracking-wider" style={{color: '#00E5FF'}}>SETUPS</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6 space-y-6">

      <Tabs defaultValue="runs" className="w-full">
        <TabsList className="grid grid-cols-7 max-w-4xl border-2" style={{backgroundColor: '#0A0A0A', borderColor: '#333333'}}>
          <TabsTrigger value="runs" className="data-[state=active]:border-2 data-[state=active]:border-[#00FF66] data-[state=active]:text-[#00FF66] data-[state=active]:bg-transparent font-mono text-sm font-bold tracking-wider transition-all" style={{color: '#EAEAEA'}} onMouseEnter={(e) => {if (!e.currentTarget.getAttribute('data-state')?.includes('active')) {e.currentTarget.style.color = '#00E5FF';}}} onMouseLeave={(e) => {if (!e.currentTarget.getAttribute('data-state')?.includes('active')) {e.currentTarget.style.color = '#EAEAEA';}}}>RUNS</TabsTrigger>
          <TabsTrigger value="setup" className="data-[state=active]:border-2 data-[state=active]:border-[#00FF66] data-[state=active]:text-[#00FF66] data-[state=active]:bg-transparent font-mono text-sm font-bold tracking-wider transition-all" style={{color: '#EAEAEA'}} onMouseEnter={(e) => {if (!e.currentTarget.getAttribute('data-state')?.includes('active')) {e.currentTarget.style.color = '#00E5FF';}}} onMouseLeave={(e) => {if (!e.currentTarget.getAttribute('data-state')?.includes('active')) {e.currentTarget.style.color = '#EAEAEA';}}}>SETUP</TabsTrigger>
          <TabsTrigger value="tires" className="data-[state=active]:border-2 data-[state=active]:border-[#00FF66] data-[state=active]:text-[#00FF66] data-[state=active]:bg-transparent font-mono text-sm font-bold tracking-wider transition-all" style={{color: '#EAEAEA'}} onMouseEnter={(e) => {if (!e.currentTarget.getAttribute('data-state')?.includes('active')) {e.currentTarget.style.color = '#00E5FF';}}} onMouseLeave={(e) => {if (!e.currentTarget.getAttribute('data-state')?.includes('active')) {e.currentTarget.style.color = '#EAEAEA';}}}>TIRES</TabsTrigger>
          <TabsTrigger value="drive" className="data-[state=active]:border-2 data-[state=active]:border-[#00FF66] data-[state=active]:text-[#00FF66] data-[state=active]:bg-transparent font-mono text-sm font-bold tracking-wider transition-all" style={{color: '#EAEAEA'}} onMouseEnter={(e) => {if (!e.currentTarget.getAttribute('data-state')?.includes('active')) {e.currentTarget.style.color = '#00E5FF';}}} onMouseLeave={(e) => {if (!e.currentTarget.getAttribute('data-state')?.includes('active')) {e.currentTarget.style.color = '#EAEAEA';}}}>DRIVE SYNC</TabsTrigger>
          <TabsTrigger value="lookup" className="data-[state=active]:border-2 data-[state=active]:border-[#00FF66] data-[state=active]:text-[#00FF66] data-[state=active]:bg-transparent font-mono text-sm font-bold tracking-wider transition-all" style={{color: '#EAEAEA'}} onMouseEnter={(e) => {if (!e.currentTarget.getAttribute('data-state')?.includes('active')) {e.currentTarget.style.color = '#00E5FF';}}} onMouseLeave={(e) => {if (!e.currentTarget.getAttribute('data-state')?.includes('active')) {e.currentTarget.style.color = '#EAEAEA';}}}>LOOKUP</TabsTrigger>
          <TabsTrigger value="admin" className="data-[state=active]:border-2 data-[state=active]:border-[#00FF66] data-[state=active]:text-[#00FF66] data-[state=active]:bg-transparent font-mono text-sm font-bold tracking-wider transition-all" style={{color: '#EAEAEA'}} onMouseEnter={(e) => {if (!e.currentTarget.getAttribute('data-state')?.includes('active')) {e.currentTarget.style.color = '#00E5FF';}}} onMouseLeave={(e) => {if (!e.currentTarget.getAttribute('data-state')?.includes('active')) {e.currentTarget.style.color = '#EAEAEA';}}}>ADMIN</TabsTrigger>
          <TabsTrigger value="race" className="data-[state=active]:border-2 data-[state=active]:border-[#00FF66] data-[state=active]:text-[#00FF66] data-[state=active]:bg-transparent font-mono text-sm font-bold tracking-wider transition-all" style={{color: '#EAEAEA'}} onMouseEnter={(e) => {if (!e.currentTarget.getAttribute('data-state')?.includes('active')) {e.currentTarget.style.color = '#00E5FF';}}} onMouseLeave={(e) => {if (!e.currentTarget.getAttribute('data-state')?.includes('active')) {e.currentTarget.style.color = '#EAEAEA';}}}>RACE</TabsTrigger>
        </TabsList>

        {/* Runs Tab */}
        <TabsContent value="runs" className="space-y-4">
          <Card className="border-2 shadow-lg" style={{backgroundColor: '#0A0A0A', borderColor: '#333333'}}>
            <CardHeader className="border-b" style={{borderColor: '#333333'}}>
              <CardTitle className="flex items-center gap-3 font-bold tracking-wider" style={{color: '#EAEAEA', fontFamily: 'DIN Condensed, Eurostile Extended, sans-serif'}}>
                <span style={{color: '#EAEAEA'}}>TEST DAY</span>
                <Select value={activeDayId} onValueChange={setActiveDayId}>
                  <SelectTrigger className="w-[300px] border-2 font-mono font-bold" style={{backgroundColor: '#0A0A0A', borderColor: '#00E5FF', color: '#EAEAEA'}}><SelectValue placeholder="Pick a day" /></SelectTrigger>
                  <SelectContent style={{backgroundColor: '#0A0A0A', borderColor: '#333333'}}>
                    {days.map(d => (
                      <SelectItem key={d.id} value={d.id} className="font-mono" style={{color: '#EAEAEA', backgroundColor: '#0A0A0A'}} onMouseEnter={(e) => {e.currentTarget.style.backgroundColor = '#1A1A1A';}} onMouseLeave={(e) => {e.currentTarget.style.backgroundColor = '#0A0A0A';}}>{`${d.date} • ${d.track}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="ml-auto border-2 font-mono font-bold tracking-wider transition-all hover:shadow-lg" style={{borderColor: '#00E5FF', color: '#00E5FF', backgroundColor: 'transparent'}} onMouseEnter={(e) => {e.currentTarget.style.backgroundColor = '#00E5FF'; e.currentTarget.style.color = '#0A0A0A';}} onMouseLeave={(e) => {e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#00E5FF';}}><FilePlus2 className="w-4 h-4 mr-2"/>NEW DAY</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[780px]">
                    <DialogHeader><DialogTitle>Create Test Day</DialogTitle></DialogHeader>
                    <NewDayForm onCreate={(d) => { setDays(prev => [...prev, d]); setActiveDayId(d.id); }} />
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            {activeDay && (
              <CardContent className="grid md:grid-cols-3 gap-4" style={{backgroundColor: '#0A0A0A'}}>
                <div>
                  <p className="text-sm font-mono" style={{color: '#EAEAEA'}}><b style={{color: '#00E5FF'}}>LEAD:</b> {activeDay.sessionLead ?? "—"}</p>
                  <p className="text-sm font-mono" style={{color: '#EAEAEA'}}><b style={{color: '#00E5FF'}}>WEATHER PLAN:</b> {activeDay.weatherPlan ?? "—"}</p>
                  <p className="text-sm font-mono" style={{color: '#EAEAEA'}}><b style={{color: '#00E5FF'}}>RUN PLAN:</b> {activeDay.runPlan ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-mono" style={{color: '#EAEAEA'}}><b style={{color: '#00E5FF'}}>CREW:</b> {activeDay.crew?.join(", ") ?? "—"}</p>
                  <p className="text-sm font-mono" style={{color: '#EAEAEA'}}><b style={{color: '#00E5FF'}}>NOTES:</b> {activeDay.notes ?? "—"}</p>
                  <p className="text-sm font-mono" style={{color: '#EAEAEA'}}>
                    <b style={{color: '#00E5FF'}}>DRIVE FOLDER:</b> {activeDay.driveFolderUrl ? (
                      <a href={activeDay.driveFolderUrl} target="_blank" rel="noreferrer" className="underline inline-flex items-center transition-all hover:shadow-lg" style={{color: '#00E5FF'}} onMouseEnter={(e) => {e.currentTarget.style.color = '#00FF66';}} onMouseLeave={(e) => {e.currentTarget.style.color = '#00E5FF';}}>
                        <LinkIcon className="w-3 h-3 mr-1"/>OPEN FOLDER
                      </a>
                    ) : "—"}
                  </p>
                </div>
              </CardContent>
            )}
          </Card>

          <Card className="border-2 shadow-lg" style={{backgroundColor: '#0A0A0A', borderColor: '#333333'}}>
            <CardHeader className="border-b" style={{borderColor: '#333333'}}>
              <CardTitle className="flex items-center gap-3 font-bold tracking-wider" style={{color: '#EAEAEA', fontFamily: 'DIN Condensed, Eurostile Extended, sans-serif'}}>
                <span style={{color: '#EAEAEA'}}>RUNS</span>
                <div className="ml-auto flex gap-2 items-center">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-2 top-2.5" style={{color: '#00E5FF'}} />
                    <Input className="pl-8 w-[260px] border-2 font-mono" style={{backgroundColor: '#0A0A0A', borderColor: '#333333', color: '#EAEAEA'}} placeholder="Search notes, tags, driver..." value={query} onChange={(e)=>setQuery(e.target.value)} />
                  </div>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="border-2 font-mono font-bold tracking-wider transition-all hover:shadow-lg" style={{borderColor: '#00E5FF', color: '#00E5FF', backgroundColor: 'transparent'}} onMouseEnter={(e) => {e.currentTarget.style.backgroundColor = '#00E5FF'; e.currentTarget.style.color = '#0A0A0A';}} onMouseLeave={(e) => {e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#00E5FF';}}><Filter className="w-4 h-4 mr-2"/>FILTERS</Button>
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
                        <Button size="sm" className="border-2 font-mono font-bold tracking-wider transition-all hover:shadow-lg" style={{borderColor: '#00FF66', color: '#00FF66', backgroundColor: 'transparent'}} onMouseEnter={(e) => {e.currentTarget.style.backgroundColor = '#00FF66'; e.currentTarget.style.color = '#0A0A0A';}} onMouseLeave={(e) => {e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#00FF66';}}><FilePlus2 className="w-4 h-4 mr-2"/>NEW RUN</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
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
            <CardContent className="overflow-x-auto" style={{backgroundColor: '#0A0A0A'}}>
              <table className="min-w-full text-sm font-mono">
                <thead>
                  <tr className="text-left border-b" style={{borderColor: '#333333', backgroundColor: '#111111'}}>
                    <th className="py-3 pr-4 font-bold tracking-wider uppercase" style={{color: '#00E5FF'}}>RUN</th>
                    <th className="py-3 pr-4 font-bold tracking-wider uppercase" style={{color: '#00E5FF'}}>TIME</th>
                    <th className="py-3 pr-4 font-bold tracking-wider uppercase" style={{color: '#00E5FF'}}>DRIVER(S)</th>
                    <th className="py-3 pr-4 font-bold tracking-wider uppercase" style={{color: '#00E5FF'}}>SETUP</th>
                    <th className="py-3 pr-4 font-bold tracking-wider uppercase" style={{color: '#00E5FF'}}>TIRES</th>
                    <th className="py-3 pr-4 font-bold tracking-wider uppercase" style={{color: '#00E5FF'}}>BIAS/REG</th>
                    <th className="py-3 pr-4 font-bold tracking-wider uppercase" style={{color: '#00E5FF'}}>SOC</th>
                    <th className="py-3 pr-4 font-bold tracking-wider uppercase" style={{color: '#00E5FF'}}>NOTES</th>
                    <th className="py-3 pr-4 font-bold tracking-wider uppercase" style={{color: '#00E5FF'}}>DATA FILE</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRuns.map((r, index) => (
                    <tr key={r.id} className="border-b transition-all duration-200 hover:shadow-lg" style={{borderColor: '#333333', backgroundColor: index % 2 === 0 ? '#0A0A0A' : '#111111'}} onMouseEnter={(e) => {e.currentTarget.style.backgroundColor = '#1A1A1A';}} onMouseLeave={(e) => {e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#0A0A0A' : '#111111';}}>
                      <td className="py-3 pr-4 font-mono font-bold" style={{color: '#B066FF'}}>R{String(r.runNumber).padStart(2,"0")}</td>
                      <td className="py-3 pr-4 font-mono font-bold" style={{color: '#EAEAEA'}}>{new Date(r.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</td>
                      <td className="py-3 pr-4 font-mono" style={{color: '#EAEAEA'}}>{r.drivers.join(", ")}</td>
                      <td className="py-3 pr-4 font-mono" style={{color: '#00FF66'}}>{setups.find(s=>s.id===r.setupId)?.name ?? "—"}</td>
                      <td className="py-3 pr-4 font-mono" style={{color: '#EAEAEA'}}>{r.tireSetId ?? "—"}</td>
                      <td className="py-3 pr-4 font-mono" style={{color: '#FFD633'}}>{r.brakeBiasPct ? `${r.brakeBiasPct}%` : "—"} / {r.regenPct ? `${r.regenPct}%` : "—"}</td>
                      <td className="py-3 pr-4 font-mono font-bold" style={{color: '#00E5FF'}}>
                        {r.socStartPct !== undefined && r.socEndPct !== undefined 
                          ? `${r.socStartPct}% → ${r.socEndPct}% (${r.socStartPct - r.socEndPct}%)`
                          : "—"
                        }
                      </td>
                      <td className="py-3 pr-4 max-w-[360px] truncate text-sm font-mono" style={{color: '#EAEAEA'}} title={r.notes}>{r.notes}</td>
                      <td className="py-3 pr-4">
                        {r.dataLinks?.[0] ? (
                          <a href={toDriveDownloadURL(r.dataLinks[0].url)} className="underline inline-flex items-center transition-all hover:shadow-lg font-mono" style={{color: '#00E5FF'}} onMouseEnter={(e) => {e.currentTarget.style.color = '#00FF66';}} onMouseLeave={(e) => {e.currentTarget.style.color = '#00E5FF';}} target="_blank" rel="noreferrer">
                            <LinkIcon className="w-3 h-3 mr-1"/>{r.dataLinks[0].kind}
                          </a>
                        ) : <span style={{color: '#333333'}}>—</span>}
                      </td>
                      <td className="py-2 pr-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (typeof window !== 'undefined' && window.utfr?.openInMotec) {
                              const first = r.dataLinks?.[0];
                              const payload = first?.url ? { url: first.url } : {};
                              try { void window.utfr.openInMotec(payload); } catch {}
                            }
                          }}
                          style={{color: '#00FF66'}}
                          title="Open in MoTeC"
                        >
                          <Play className="w-4 h-4"/>
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" style={{color: '#EAEAEA'}}><Pencil className="w-4 h-4"/></Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
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
                        <Button variant="ghost" size="icon" onClick={()=>deleteRun(r.id)} style={{color: '#EAEAEA'}}><Trash2 className="w-4 h-4"/></Button>
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
          <Card className="bg-gray-900 border border-gray-800 shadow-lg">
            <CardHeader className="border-b border-gray-800">
              <CardTitle className="text-xl font-light text-white tracking-wide">SETUP SNAPSHOTS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog open={newSetupOpen} onOpenChange={setNewSetupOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 hover:border-cyan-400/50 font-mono tracking-wider transition-all">
                    <FilePlus2 className="w-4 h-4 mr-2"/>NEW SETUP
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-7xl">
                  <DialogHeader><DialogTitle>Create Setup</DialogTitle></DialogHeader>
                  <SetupForm 
                    onSave={(s)=> {
                      setSetups(prev => [...prev, s]);
                      tryAutoWriteSetup(s);
                      setNewSetupOpen(false);
                    }} 
                    setups={setups} 
                    onClose={() => setNewSetupOpen(false)}
                  />
                </DialogContent>
              </Dialog>

              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {setups.map(s => (
                  <Card key={s.id} className="h-full bg-gray-900 border border-gray-800 hover:bg-gray-800 transition-all duration-300 hover:border-cyan-400/30 hover:shadow-lg hover:shadow-cyan-400/10">
                    <CardHeader className="border-b border-gray-800">
                      <div className="flex justify-between items-start">
                        <div>
                      <CardTitle className="text-base font-light text-white tracking-wide">{s.name}</CardTitle>
                      <div className="text-xs text-gray-400 font-mono">{s.id}{s.basedOn ? ` • Based on ${s.basedOn}`: ""}</div>
                        </div>
                        <div className="flex gap-2">
                          <Dialog open={editingSetup?.id === s.id} onOpenChange={(open) => {
                            if (!open) setEditingSetup(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setEditingSetup(s)} className="border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white hover:border-cyan-400/50 transition-all">
                                <Edit className="w-3 h-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-7xl">
                              <DialogHeader><DialogTitle>Edit Setup: {s.name}</DialogTitle></DialogHeader>
                            <SetupForm 
                              onSave={(updatedSetup) => {
                                setSetups(prev => prev.map(setup => 
                                  setup.id === s.id ? updatedSetup : setup
                                ));
                                tryAutoWriteSetup(updatedSetup);
                                setEditingSetup(null);
                              }} 
                                setups={setups.filter(setup => setup.id !== s.id)} 
                                existingSetup={s}
                                onClose={() => setEditingSetup(null)}
                              />
                            </DialogContent>
                          </Dialog>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white hover:border-green-400/50 transition-all"
                            onClick={() => exportSetupToGoogleDrive(s)}
                            title="Export to Google Drive"
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="bg-gray-950">
                      <p className="text-sm text-gray-300 font-mono leading-relaxed">{formatSetupSummary(s)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tire Tracker */}
        <TabsContent value="tires" className="space-y-4">
          <Card className="bg-gray-900 border border-gray-800 shadow-lg">
            <CardHeader className="border-b border-gray-800">
              <CardTitle className="text-xl font-light text-white tracking-wide">TIRE SETS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 hover:border-cyan-400/50 font-mono tracking-wider transition-all">
                    <FilePlus2 className="w-4 h-4 mr-2"/>NEW TIRE SET
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>Create Tire Set</DialogTitle></DialogHeader>
                  <TireForm onSave={(t)=> setTires(prev => [...prev, t])} />
                </DialogContent>
              </Dialog>

              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {tires.map(t => (
                  <Card key={t.id} className="bg-gray-900 border border-gray-800 hover:bg-gray-800 transition-all duration-300 hover:border-cyan-400/30 hover:shadow-lg hover:shadow-cyan-400/10">
                    <CardHeader className="border-b border-gray-800">
                      <CardTitle className="text-base font-light text-white tracking-wide">{t.id}</CardTitle>
                      <div className="text-xs text-gray-400 font-mono">{t.compound} • {t.size}</div>
                    </CardHeader>
                    <CardContent className="bg-gray-950">
                      <p className="text-sm text-gray-300 font-mono">{t.notes || "—"}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        

        {/* Google Drive Sync */}
        <TabsContent value="drive" className="space-y-4">
          <LocalGoogleDriveSync onDataImported={handleDataImported} />
        </TabsContent>

        {/* Lookup Tool */}
        <TabsContent value="lookup" className="space-y-4">
          <Card className="bg-gray-900 border border-gray-800 shadow-lg">
            <CardHeader className="border-b border-gray-800">
              <CardTitle className="text-xl font-light text-white tracking-wide">GLOBAL LOOKUP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-5 gap-3">
                <div className="md:col-span-2">
                  <Label>Free text</Label>
                  <Input placeholder="driver, tag, track, note..." value={query} onChange={(e)=>setQuery(e.target.value)} className="text-white bg-gray-800 border-gray-700" />
                </div>
                <div>
                  <Label>Driver</Label>
                  <Input placeholder="Aidan" value={filterDriver} onChange={(e)=>setFilterDriver(e.target.value)} className="text-white bg-gray-800 border-gray-700" />
                </div>
                <div>
                  <Label>Setup</Label>
                  <Select value={filterSetup} onValueChange={setFilterSetup}>
                    <SelectTrigger className="text-white bg-gray-800 border-gray-700"><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ANY}>Any</SelectItem>
                      {setups.map(s=> <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tires</Label>
                  <Select value={filterTire} onValueChange={setFilterTire}>
                    <SelectTrigger className="text-white bg-gray-800 border-gray-700"><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ANY}>Any</SelectItem>
                      {tires.map(t=> <SelectItem key={t.id} value={t.id}>{t.id}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="overflow-x-auto border border-gray-800 rounded-lg bg-gray-950">
                <table className="min-w-full text-sm font-mono">
                  <thead>
                    <tr className="text-left border-b border-gray-800 bg-gray-900">
                      <th className="py-3 pr-4 text-white font-light tracking-wider">DAY</th>
                      <th className="py-3 pr-4 text-white font-light tracking-wider">RUN</th>
                      <th className="py-3 pr-4 text-white font-light tracking-wider">TRACK</th>
                      <th className="py-3 pr-4 text-white font-light tracking-wider">DRIVERS</th>
                      <th className="py-3 pr-4 text-white font-light tracking-wider">SETUP</th>
                      <th className="py-3 pr-4 text-white font-light tracking-wider">SOC</th>
                      <th className="py-3 pr-4 text-white font-light tracking-wider">TAGS</th>
                      <th className="py-3 pr-4 text-white font-light tracking-wider">NOTES</th>
                      <th className="py-3 pr-4 text-white font-light tracking-wider">DATA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRunsForLookup.map(r => (
                      <tr key={r.id} className="border-b border-gray-800/50 hover:bg-gray-900/30 transition-all duration-200">
                        <td className="py-3 pr-4 text-gray-300">
                          {(() => {
                            const testDay = days.find(d => d.id === r.testDayId);
                            return testDay ? `${testDay.date} - ${testDay.track}` : r.testDayId;
                          })()}
                        </td>
                        <td className="py-3 pr-4 text-cyan-400 font-mono">R{String(r.runNumber).padStart(2,"0")}</td>
                        <td className="py-3 pr-4 text-gray-300">{r.track}</td>
                        <td className="py-3 pr-4 text-gray-300">{r.drivers.join(", ")}</td>
                        <td className="py-3 pr-4 text-gray-300">{setups.find(s=>s.id===r.setupId)?.name ?? "—"}</td>
                        <td className="py-3 pr-4 text-gray-300">
                          {r.socStartPct !== undefined && r.socEndPct !== undefined 
                            ? `${r.socStartPct}% → ${r.socEndPct}%`
                            : "—"
                          }
                        </td>
                        <td className="py-3 pr-4 text-gray-300">{r.tags?.join(", ") ?? "—"}</td>
                        <td className="py-3 pr-4 max-w-[440px] truncate text-gray-400" title={r.notes}>{r.notes}</td>
                        <td className="py-3 pr-4">
                          {r.dataLinks?.[0] ? (
                            <a href={toDriveDownloadURL(r.dataLinks[0].url)} className="text-cyan-400 hover:text-cyan-300 underline transition-colors" target="_blank" rel="noreferrer">{r.dataLinks[0].kind}</a>
                          ) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Race Tracker */}
        <TabsContent value="race" className="space-y-4">
          <RaceTracker />
        </TabsContent>

        {/* Admin (conventions + helpers) */}
        <TabsContent value="admin" className="space-y-4">
          <Card className="bg-gray-900 border border-gray-800 shadow-lg">
            <CardHeader className="border-b border-gray-800">
              <CardTitle className="text-xl font-light text-white tracking-wide">NAMING & ID CONVENTIONS</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3 bg-gray-950">
              <ul className="list-disc pl-5 space-y-2 text-gray-300 font-mono">
                <li><b className="text-white">Test Day ID</b>: <code className="text-cyan-400">TD-YYYY-MM-DD-TRACK</code> (e.g., <code className="text-gray-400">TD-2025-04-19-AYR</code>)</li>
                <li><b className="text-white">Run ID</b>: <code className="text-cyan-400">TRK-YYYY-MM-DD-R##</code> using track code (e.g., <code className="text-gray-400">AYR-2025-04-19-R07</code>)</li>
                <li><b className="text-white">Setup ID</b>: <code className="text-cyan-400">SET-YYYY-MM-DD-Name</code></li>
                <li><b className="text-white">Tire Set ID</b>: short code, e.g., <code className="text-gray-400">TS-24-03-A</code></li>
                <li><b className="text-white">XRK File Name</b>: <code className="text-cyan-400">TRK_YYYYMMDD_R##_Driver_SetupID.xrk</code></li>
              </ul>
              <p className="text-gray-400 font-mono text-xs">
                Store XRKs in a Google Drive folder per Test Day. Link each XRK to its Run via the <i className="text-cyan-400">Data Links</i> column.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border border-gray-800 shadow-lg">
            <CardHeader className="border-b border-gray-800">
              <CardTitle className="text-xl font-light text-white tracking-wide">BACKEND SCHEMA (SUGGESTED)</CardTitle>
            </CardHeader>
            <CardContent className="bg-gray-950">
              <pre className="text-xs whitespace-pre-wrap text-gray-300 font-mono bg-gray-900 p-4 rounded border border-gray-800">{`
-- Postgres (supabase/railway/fly.io friendly)
CREATE TABLE test_days (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  track TEXT NOT NULL,
  session_lead TEXT,
  weather_plan TEXT,
  run_plan TEXT,
  crew TEXT[],
  notes TEXT,
  drive_folder_url TEXT
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
  soc_start_pct INT,
  soc_end_pct INT,
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
  const [driveFolderUrl, setDriveFolderUrl] = useState("");

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
        <Label>Google Drive Folder (XRK Files)</Label>
        <Input placeholder="https://drive.google.com/drive/folders/..." value={driveFolderUrl} onChange={(e)=>setDriveFolderUrl(e.target.value)} />
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea value={notes} onChange={(e)=>setNotes(e.target.value)} />
      </div>
      <Button onClick={()=>{
        if(!date || !track) return;
        const id = `TD-${date}-${track.substring(0,3).toUpperCase()}`;
        onCreate({ id, date, track, sessionLead: lead, weatherPlan, runPlan, crew: crew? crew.split(",").map(s=>s.trim()): [], notes, driveFolderUrl: driveFolderUrl || undefined });
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
  const [socStart, setSocStart] = useState(run?.socStartPct?.toString() ?? "");
  const [socEnd, setSocEnd] = useState(run?.socEndPct?.toString() ?? "");
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
      socStartPct: socStart? parseInt(socStart): undefined,
      socEndPct: socEnd? parseInt(socEnd): undefined,
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
      <div className="grid grid-cols-2 gap-3">
      <div>
          <Label>SOC Start %</Label>
          <Input type="number" min="0" max="100" value={socStart} onChange={(e)=>setSocStart(e.target.value)} placeholder="0-100" />
        </div>
        <div>
          <Label>SOC End %</Label>
          <Input type="number" min="0" max="100" value={socEnd} onChange={(e)=>setSocEnd(e.target.value)} placeholder="0-100" />
        </div>
      </div>
      <div>
        <Label>Data File (XRK/MoTeC/CSV - Google Drive URL)</Label>
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

function SetupForm({ onSave, setups, existingSetup, onClose }:{ onSave:(s:SetupSnapshot)=>void, setups: SetupSnapshot[], existingSetup?: SetupSnapshot, onClose?: ()=>void }){
  const [name, setName] = useState(existingSetup?.name || "");
  const [baseSelectValue, setBaseSelectValue] = useState<string>(existingSetup?.basedOn || NONE);
  const [setupGoal, setSetupGoal] = useState(existingSetup?.setupGoal || "");
  
  // Mechanical
  const [aeroSetup, setAeroSetup] = useState(existingSetup?.aero?.aeroSetup || "");
  const [aeroConfigNotes, setAeroConfigNotes] = useState(existingSetup?.aero?.aeroConfigNotes || "");
  const [tireSetId, setTireSetId] = useState(existingSetup?.tire?.tireSetId || "");
  const [coldPressureFL, setColdPressureFL] = useState(existingSetup?.tire?.coldPressureFront?.toString() || "");
  const [coldPressureFR, setColdPressureFR] = useState(existingSetup?.tire?.coldPressureFront?.toString() || "");
  const [coldPressureRL, setColdPressureRL] = useState(existingSetup?.tire?.coldPressureRear?.toString() || "");
  const [coldPressureRR, setColdPressureRR] = useState(existingSetup?.tire?.coldPressureRear?.toString() || "");
  const [brakeBias, setBrakeBias] = useState(existingSetup?.brakes?.brakeBias?.toString() || "");
  const [hydraulicBrakeOnset, setHydraulicBrakeOnset] = useState(existingSetup?.brakes?.hydraulicBrakeOnset || "");
  const [brakeBiasBar, setBrakeBiasBar] = useState(existingSetup?.brakes?.brakeBiasBar || "");
  const [proportioningValve, setProportioningValve] = useState(existingSetup?.brakes?.proportioningValve?.toString() || "");
  const [flLbs, setFlLbs] = useState(existingSetup?.weight?.flLbs?.toString() || "");
  const [frLbs, setFrLbs] = useState(existingSetup?.weight?.frLbs?.toString() || "");
  const [rlLbs, setRlLbs] = useState(existingSetup?.weight?.rlLbs?.toString() || "");
  const [rrLbs, setRrLbs] = useState(existingSetup?.weight?.rrLbs?.toString() || "");
  const [frontLbs, setFrontLbs] = useState(existingSetup?.weight?.frontLbs?.toString() || "");
  const [rearLbs, setRearLbs] = useState(existingSetup?.weight?.rearLbs?.toString() || "");
  const [totalLbs, setTotalLbs] = useState(existingSetup?.weight?.totalLbs?.toString() || "");
  const [crossWeight, setCrossWeight] = useState(existingSetup?.weight?.crossWeight?.toString() || "");
  const [frontCm, setFrontCm] = useState(existingSetup?.rideHeight?.frontCm?.toString() || "");
  const [rearCm, setRearCm] = useState(existingSetup?.rideHeight?.rearCm?.toString() || "");
  const [minGroundClearance, setMinGroundClearance] = useState(existingSetup?.rideHeight?.minGroundClearance?.toString() || "");
  const [camberFront, setCamberFront] = useState(existingSetup?.alignment?.camberFront?.toString() || "");
  const [camberRear, setCamberRear] = useState(existingSetup?.alignment?.camberRear?.toString() || "");
  const [toeFront, setToeFront] = useState(existingSetup?.alignment?.toeFront?.toString() || "");
  const [toeRear, setToeRear] = useState(existingSetup?.alignment?.toeRear?.toString() || "");
  const [springRateFront, setSpringRateFront] = useState(existingSetup?.springsDampers?.springRateFront?.toString() || "");
  const [springRateRear, setSpringRateRear] = useState(existingSetup?.springsDampers?.springRateRear?.toString() || "");
  const [rollDamperFront, setRollDamperFront] = useState(existingSetup?.springsDampers?.rollDamperFront || "");
  const [rollDamperRear, setRollDamperRear] = useState(existingSetup?.springsDampers?.rollDamperRear || "");
  const [heaveDamperFront, setHeaveDamperFront] = useState(existingSetup?.springsDampers?.heaveDamperFront || "");
  const [heaveDamperRear, setHeaveDamperRear] = useState(existingSetup?.springsDampers?.heaveDamperRear || "");
  const [diffPreload, setDiffPreload] = useState(existingSetup?.drivetrain?.diffPreload || "");
  const [gearRatio, setGearRatio] = useState(existingSetup?.drivetrain?.gearRatio || "");
  
  // Electrical
  const [fcHash, setFcHash] = useState(existingSetup?.firmware?.fcHash || "");
  const [rcHash, setRcHash] = useState(existingSetup?.firmware?.rcHash || "");
  const [acmHash, setAcmHash] = useState(existingSetup?.firmware?.acmHash || "");
  const [inverterEeprom, setInverterEeprom] = useState(existingSetup?.firmware?.inverterEeprom || "");
  const [torqueLimit, setTorqueLimit] = useState(existingSetup?.limits?.torqueLimit?.toString() || "");
  const [currentLimit, setCurrentLimit] = useState(existingSetup?.limits?.currentLimit?.toString() || "");
  const [powerLimit, setPowerLimit] = useState(existingSetup?.limits?.powerLimit?.toString() || "");
  const [initialPackSOC, setInitialPackSOC] = useState(existingSetup?.battery?.initialPackSOC?.toString() || "");
  const [finalPackSOC, setFinalPackSOC] = useState(existingSetup?.battery?.finalPackSOC?.toString() || "");

  // Calculate weights from corner weights
  const calculateWeights = () => {
    const fl = parseFloat(flLbs) || 0;
    const fr = parseFloat(frLbs) || 0;
    const rl = parseFloat(rlLbs) || 0;
    const rr = parseFloat(rrLbs) || 0;
    
    const front = fl + fr;
    const rear = rl + rr;
    const total = front + rear;
    const cross = total > 0 ? (fl + rr) / total : 0;
    
    return { fl, fr, rl, rr, front, rear, total, cross };
  };

  const save = () => {
    if(!name) return;
    const id = existingSetup?.id || `SET-${new Date().toISOString().slice(0,10)}-${name.replace(/\s+/g,'')}`;
    const basedOn = baseSelectValue === NONE ? undefined : baseSelectValue;
    
    const setup: SetupSnapshot = {
      id,
      name,
      basedOn,
      setupGoal: setupGoal || undefined,
      aero: (aeroSetup || aeroConfigNotes) ? {
        aeroSetup: aeroSetup || undefined,
        aeroConfigNotes: aeroConfigNotes || undefined
      } : undefined,
      tire: (tireSetId || coldPressureFL || coldPressureFR || coldPressureRL || coldPressureRR) ? {
        tireSetId: tireSetId || undefined,
        coldPressureFront: (coldPressureFL || coldPressureFR) ? 
          ((parseFloat(coldPressureFL) || 0) + (parseFloat(coldPressureFR) || 0)) / 2 : undefined,
        coldPressureRear: (coldPressureRL || coldPressureRR) ? 
          ((parseFloat(coldPressureRL) || 0) + (parseFloat(coldPressureRR) || 0)) / 2 : undefined
      } : undefined,
      brakes: (brakeBias || hydraulicBrakeOnset || brakeBiasBar || proportioningValve) ? {
        brakeBias: brakeBias ? parseFloat(brakeBias) : undefined,
        hydraulicBrakeOnset: hydraulicBrakeOnset || undefined,
        brakeBiasBar: brakeBiasBar || undefined,
        proportioningValve: proportioningValve ? parseFloat(proportioningValve) : undefined
      } : undefined,
      weight: (flLbs || frLbs || rlLbs || rrLbs || frontLbs || rearLbs || totalLbs || crossWeight) ? {
        flLbs: flLbs ? parseFloat(flLbs) : undefined,
        frLbs: frLbs ? parseFloat(frLbs) : undefined,
        rlLbs: rlLbs ? parseFloat(rlLbs) : undefined,
        rrLbs: rrLbs ? parseFloat(rrLbs) : undefined,
        frontLbs: frontLbs ? parseFloat(frontLbs) : (flLbs || frLbs) ? calculateWeights().front : undefined,
        rearLbs: rearLbs ? parseFloat(rearLbs) : (rlLbs || rrLbs) ? calculateWeights().rear : undefined,
        totalLbs: totalLbs ? parseFloat(totalLbs) : (flLbs || frLbs || rlLbs || rrLbs) ? calculateWeights().total : undefined,
        crossWeight: crossWeight ? parseFloat(crossWeight) : (flLbs || frLbs || rlLbs || rrLbs) ? calculateWeights().cross : undefined
      } : undefined,
      rideHeight: (frontCm || rearCm || minGroundClearance) ? {
        frontCm: frontCm ? parseFloat(frontCm) : undefined,
        rearCm: rearCm ? parseFloat(rearCm) : undefined,
        minGroundClearance: minGroundClearance ? parseFloat(minGroundClearance) : undefined
      } : undefined,
      alignment: (camberFront || camberRear || toeFront || toeRear) ? {
        camberFront: camberFront ? parseFloat(camberFront) : undefined,
        camberRear: camberRear ? parseFloat(camberRear) : undefined,
        toeFront: toeFront ? parseFloat(toeFront) : undefined,
        toeRear: toeRear ? parseFloat(toeRear) : undefined
      } : undefined,
      springsDampers: (springRateFront || springRateRear || rollDamperFront || rollDamperRear || heaveDamperFront || heaveDamperRear) ? {
        springRateFront: springRateFront ? parseFloat(springRateFront) : undefined,
        springRateRear: springRateRear ? parseFloat(springRateRear) : undefined,
        rollDamperFront: rollDamperFront || undefined,
        rollDamperRear: rollDamperRear || undefined,
        heaveDamperFront: heaveDamperFront || undefined,
        heaveDamperRear: heaveDamperRear || undefined
      } : undefined,
      drivetrain: (diffPreload || gearRatio) ? {
        diffPreload: diffPreload || undefined,
        gearRatio: gearRatio || undefined
      } : undefined,
      firmware: (fcHash || rcHash || acmHash || inverterEeprom) ? {
        fcHash: fcHash || undefined,
        rcHash: rcHash || undefined,
        acmHash: acmHash || undefined,
        inverterEeprom: inverterEeprom || undefined
      } : undefined,
      limits: (torqueLimit || currentLimit || powerLimit) ? {
        torqueLimit: torqueLimit ? parseFloat(torqueLimit) : undefined,
        currentLimit: currentLimit ? parseFloat(currentLimit) : undefined,
        powerLimit: powerLimit ? parseFloat(powerLimit) : undefined
      } : undefined,
      battery: (initialPackSOC || finalPackSOC) ? {
        initialPackSOC: initialPackSOC ? parseFloat(initialPackSOC) : undefined,
        finalPackSOC: finalPackSOC ? parseFloat(finalPackSOC) : undefined
      } : undefined
    };
    
    onSave(setup);
    onClose?.(); // Close the dialog after successful save
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Setup Name</Label>
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
        <Label>Setup Goal / Notes</Label>
        <Textarea value={setupGoal} onChange={(e)=>setSetupGoal(e.target.value)} placeholder="Describe the setup goal and any notes..." />
      </div>

      {/* Mechanical Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">🔧 Mechanical</h3>
        
        {/* Aero */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Aero</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Aero Setup (Master Sheet Reference)</Label>
                <Input value={aeroSetup} onChange={(e)=>setAeroSetup(e.target.value)} placeholder="Aero-2025-01" />
              </div>
              <div>
                <Label>Aero Configuration Notes</Label>
                <Input value={aeroConfigNotes} onChange={(e)=>setAeroConfigNotes(e.target.value)} placeholder="Standard autocross wing settings" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tire */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tire</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Tire Set ID</Label>
              <Input value={tireSetId} onChange={(e)=>setTireSetId(e.target.value)} placeholder="TS-24-03-A" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cold Pressure - Front Left (PSI)</Label>
                <Input type="number" step="0.1" value={coldPressureFL} onChange={(e)=>setColdPressureFL(e.target.value)} placeholder="10.5" />
              </div>
              <div>
                <Label>Cold Pressure - Front Right (PSI)</Label>
                <Input type="number" step="0.1" value={coldPressureFR} onChange={(e)=>setColdPressureFR(e.target.value)} placeholder="10.5" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cold Pressure - Rear Left (PSI)</Label>
                <Input type="number" step="0.1" value={coldPressureRL} onChange={(e)=>setColdPressureRL(e.target.value)} placeholder="10.0" />
              </div>
              <div>
                <Label>Cold Pressure - Rear Right (PSI)</Label>
                <Input type="number" step="0.1" value={coldPressureRR} onChange={(e)=>setColdPressureRR(e.target.value)} placeholder="10.0" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Brakes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Brakes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Brake Bias (%)</Label>
                <Input type="number" value={brakeBias} onChange={(e)=>setBrakeBias(e.target.value)} placeholder="53" />
              </div>
              <div>
                <Label>Proportioning Valve (1=front, 6=rear)</Label>
                <Input type="number" min="1" max="6" value={proportioningValve} onChange={(e)=>setProportioningValve(e.target.value)} placeholder="4" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Hydraulic Brake Onset</Label>
                <Input value={hydraulicBrakeOnset} onChange={(e)=>setHydraulicBrakeOnset(e.target.value)} placeholder="Standard" />
              </div>
              <div>
                <Label>Brake Bias Bar</Label>
                <Input value={brakeBiasBar} onChange={(e)=>setBrakeBiasBar(e.target.value)} placeholder="Click 6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weight Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Weight Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Front Left (lbs)</Label>
                <Input type="number" value={flLbs} onChange={(e)=>setFlLbs(e.target.value)} placeholder="92" />
              </div>
              <div>
                <Label>Front Right (lbs)</Label>
                <Input type="number" value={frLbs} onChange={(e)=>setFrLbs(e.target.value)} placeholder="88" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Rear Left (lbs)</Label>
                <Input type="number" value={rlLbs} onChange={(e)=>setRlLbs(e.target.value)} placeholder="82" />
              </div>
              <div>
                <Label>Rear Right (lbs)</Label>
                <Input type="number" value={rrLbs} onChange={(e)=>setRrLbs(e.target.value)} placeholder="78" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 pt-2 border-t">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Front Total</Label>
                <div className="text-lg font-semibold">{calculateWeights().front || "—"}</div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Rear Total</Label>
                <div className="text-lg font-semibold">{calculateWeights().rear || "—"}</div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Total Weight</Label>
                <div className="text-lg font-semibold">{calculateWeights().total || "—"}</div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Cross Weight</Label>
                <div className="text-lg font-semibold">{calculateWeights().cross ? calculateWeights().cross.toFixed(3) : "—"}</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              <p>Corner weights are automatically calculated from individual corner inputs.</p>
            </div>
          </CardContent>
        </Card>

        {/* Ride Height */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ride Height / Ground Clearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Front (cm)</Label>
                <Input type="number" step="0.1" value={frontCm} onChange={(e)=>setFrontCm(e.target.value)} placeholder="10.0" />
              </div>
              <div>
                <Label>Rear (cm)</Label>
                <Input type="number" step="0.1" value={rearCm} onChange={(e)=>setRearCm(e.target.value)} placeholder="9.0" />
              </div>
              <div>
                <Label>Min Ground Clearance (cm)</Label>
                <Input type="number" step="0.1" value={minGroundClearance} onChange={(e)=>setMinGroundClearance(e.target.value)} placeholder="8.5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alignment */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Alignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Camber - Front (deg)</Label>
                <Input type="number" step="0.1" value={camberFront} onChange={(e)=>setCamberFront(e.target.value)} placeholder="-2.5" />
              </div>
              <div>
                <Label>Camber - Rear (deg)</Label>
                <Input type="number" step="0.1" value={camberRear} onChange={(e)=>setCamberRear(e.target.value)} placeholder="-1.8" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Toe at Rims - Front (deg)</Label>
                <Input type="number" step="0.01" value={toeFront} onChange={(e)=>setToeFront(e.target.value)} placeholder="0.1" />
              </div>
              <div>
                <Label>Toe at Rims - Rear (deg)</Label>
                <Input type="number" step="0.01" value={toeRear} onChange={(e)=>setToeRear(e.target.value)} placeholder="0.2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Springs & Dampers */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Springs & Dampers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Spring Rate - Front (lbs/in)</Label>
                <Input type="number" value={springRateFront} onChange={(e)=>setSpringRateFront(e.target.value)} placeholder="650" />
              </div>
              <div>
                <Label>Spring Rate - Rear (lbs/in)</Label>
                <Input type="number" value={springRateRear} onChange={(e)=>setSpringRateRear(e.target.value)} placeholder="550" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Roll Damper - Front</Label>
                <Input value={rollDamperFront} onChange={(e)=>setRollDamperFront(e.target.value)} placeholder="5 clicks" />
              </div>
              <div>
                <Label>Roll Damper - Rear</Label>
                <Input value={rollDamperRear} onChange={(e)=>setRollDamperRear(e.target.value)} placeholder="4 clicks" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Heave Damper - Front</Label>
                <Input value={heaveDamperFront} onChange={(e)=>setHeaveDamperFront(e.target.value)} placeholder="5 clicks" />
              </div>
              <div>
                <Label>Heave Damper - Rear</Label>
                <Input value={heaveDamperRear} onChange={(e)=>setHeaveDamperRear(e.target.value)} placeholder="4 clicks" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Drivetrain */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Drivetrain</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Differential Preload</Label>
                <Input value={diffPreload} onChange={(e)=>setDiffPreload(e.target.value)} placeholder="1.5 turns from open" />
              </div>
              <div>
                <Label>Gear Ratio</Label>
                <Input value={gearRatio} onChange={(e)=>setGearRatio(e.target.value)} placeholder="3.73:1" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Electrical Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">⚡ Electrical</h3>
        
        {/* Firmware */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Firmware / Versions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>FC (Front Controller) Hash</Label>
                <Input value={fcHash} onChange={(e)=>setFcHash(e.target.value)} placeholder="abc123def" />
              </div>
              <div>
                <Label>RC (Rear Controller) Hash</Label>
                <Input value={rcHash} onChange={(e)=>setRcHash(e.target.value)} placeholder="def456ghi" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>ACM Hash</Label>
                <Input value={acmHash} onChange={(e)=>setAcmHash(e.target.value)} placeholder="ghi789jkl" />
              </div>
              <div>
                <Label>Inverter EEPROM</Label>
                <Input value={inverterEeprom} onChange={(e)=>setInverterEeprom(e.target.value)} placeholder="v2.1.3" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Limits */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Torque Limit (Nm)</Label>
                <Input type="number" value={torqueLimit} onChange={(e)=>setTorqueLimit(e.target.value)} placeholder="250" />
              </div>
              <div>
                <Label>Current Limit (A)</Label>
                <Input type="number" value={currentLimit} onChange={(e)=>setCurrentLimit(e.target.value)} placeholder="200" />
              </div>
              <div>
                <Label>Power Limit (kW)</Label>
                <Input type="number" value={powerLimit} onChange={(e)=>setPowerLimit(e.target.value)} placeholder="80" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Battery SOC */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Battery SOC</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Initial Pack SOC (%)</Label>
                <Input type="number" min="0" max="100" value={initialPackSOC} onChange={(e)=>setInitialPackSOC(e.target.value)} placeholder="85" />
              </div>
              <div>
                <Label>Final Pack SOC (%)</Label>
                <Input type="number" min="0" max="100" value={finalPackSOC} onChange={(e)=>setFinalPackSOC(e.target.value)} placeholder="75" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={save} size="lg">Save Setup</Button>
      </div>
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
HOW TO SHIP THIS QUICKLY
=============================================================
1) Deploy the front-end on Vercel/Netlify as a Next.js app; keep this component as /app/page.tsx
2) Stand up Postgres on Supabase; paste the SQL from Admin tab. Generate Types with supabase-js.
3) Add Google auth (Supabase Auth) and use RLS policies to restrict edits by role.
4) Google Drive API service account with access to a UTFR drive root; implement "Import XRK" to scan a Test Day folder and auto-create Run rows based on filename pattern.
5) Add CSV import for legacy sheet; map columns to Run fields; validate; show dry-run before writing.
6) MoTeC i2 Pro: expose Download / Open in Drive; optional helper for auto-open on Windows.
*/
