import fs from "fs";
import path from "path";
import { findPreset } from "./presets";

export type SectionInfo = {
  id: string;
  name: string;
  distanceKm: number;
  speedCongested: number;
  speedFree: number;
};

export type HourlyData = {
  hour: number;
  travelTimeUp: number;
  travelTimeDown: number;
  traffic: number;
};

export type TravelTimeResponse = {
  route: {
    from: string;
    to: string;
    road: string;
    totalDistanceKm: number;
    sections: SectionInfo[];
  };
  hourly: HourlyData[];
  generatedAt: string;
};

type RawSection = {
  id: string;
  name: string;
  distanceKm: number;
  speedCongestedUp: number;
  speedCongestedDown: number;
  speedFreeUp: number;
  speedFreeDown: number;
};

function readShiftJis(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  return new TextDecoder("shift_jis").decode(buf);
}

function parseCsv(text: string): string[][] {
  return text
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(","));
}

function safeNumber(v: string | undefined): number {
  if (!v) return NaN;
  const n = parseFloat(v);
  return isNaN(n) ? NaN : n;
}

function pickSpeed(...vals: number[]): number {
  for (const v of vals) {
    if (!isNaN(v) && v > 0) return v;
  }
  return NaN;
}

export function aggregateTravelTime(fromKey?: string): TravelTimeResponse {
  const preset = findPreset(fromKey);
  const dataDir = path.join(process.cwd(), "data");
  const kasyoRows = parseCsv(readShiftJis(path.join(dataDir, "kasyo40.csv"))).slice(1);
  const zkntrfRows = parseCsv(readShiftJis(path.join(dataDir, "zkntrf40.csv"))).slice(1);

  // --- 1. Build section list from kasyo40 (一般国道202号のみ) ---
  // 0-based column index
  const COL = {
    roadType: 3,
    roadNumber: 4,
    distance: 23,
    prefCode: 30,
    sectionNum: 31,
    nameUp: 33,
    nameDown: 45,
    speedCongestedUp: 75,
    speedCongestedDown: 82,
    speedFreeUp: 89,
    speedFreeDown: 96,
  };

  const sections: RawSection[] = [];
  const seen = new Set<string>();

  for (const r of kasyoRows) {
    if (r[COL.roadType] !== "3" || r[COL.roadNumber] !== "202") continue;

    const prefCode = r[COL.prefCode];
    const sectionNum = r[COL.sectionNum];
    if (!prefCode || !sectionNum) continue;

    const distance = safeNumber(r[COL.distance]);
    if (isNaN(distance) || distance <= 0) continue;

    const spCongestUp = safeNumber(r[COL.speedCongestedUp]);
    const spCongestDown = safeNumber(r[COL.speedCongestedDown]);
    const spFreeUp = safeNumber(r[COL.speedFreeUp]);
    const spFreeDown = safeNumber(r[COL.speedFreeDown]);

    const speedCongestedUp = pickSpeed(spCongestUp, spFreeUp);
    const speedCongestedDown = pickSpeed(spCongestDown, spFreeDown, spCongestUp);
    const speedFreeUp = pickSpeed(spFreeUp, spCongestUp);
    const speedFreeDown = pickSpeed(spFreeDown, spCongestDown, spFreeUp);

    if (
      isNaN(speedCongestedUp) ||
      isNaN(speedCongestedDown) ||
      isNaN(speedFreeUp) ||
      isNaN(speedFreeDown)
    ) {
      continue;
    }

    const key = `${prefCode}-${sectionNum}`;
    if (seen.has(key)) continue;
    seen.add(key);

    sections.push({
      id: key,
      name: r[COL.nameDown] || r[COL.nameUp] || `区間${sectionNum}`,
      distanceKm: distance,
      speedCongestedUp,
      speedCongestedDown,
      speedFreeUp,
      speedFreeDown,
    });
  }

  // 調査単位区間番号で並べる（= 博多側から糸島側への物理順）
  sections.sort((a, b) => a.id.localeCompare(b.id));

  // プリセットで指定された始点セクションから、最大 25 km 相当の区間のみを採用する。
  // 始点が見つからない場合は先頭（博多側）から。
  const startIdx = sections.findIndex((s) => s.id === preset.fromSectionId);
  const effective = startIdx >= 0 ? sections.slice(startIdx) : sections;

  const MAX_KM = 25;
  let accumulated = 0;
  const trimmed: RawSection[] = [];
  for (const s of effective) {
    if (accumulated >= MAX_KM) break;
    trimmed.push(s);
    accumulated += s.distanceKm;
  }
  sections.length = 0;
  sections.push(...trimmed);

  // --- 2. Build traffic map from zkntrf40 ---
  // 0-based column index
  const Z = {
    prefCode: 0,
    sectionNum: 1,
    direction: 9, // 1=上り, 2=下り
    hourStart: 11, // 7時台〜翌6時台 (24 values)
  };

  // key (pref-section) -> hourly traffic (24 values, index 0 = 7時)
  const trafficMap = new Map<string, number[]>();

  for (const r of zkntrfRows) {
    const key = `${r[Z.prefCode]}-${r[Z.sectionNum]}`;
    let arr = trafficMap.get(key);
    if (!arr) {
      arr = new Array(24).fill(0);
      trafficMap.set(key, arr);
    }
    for (let i = 0; i < 24; i++) {
      arr[i] += safeNumber(r[Z.hourStart + i]) || 0;
    }
  }

  // --- 3. Compute hourly travel times ---
  // hour index 0 = 7時, 1 = 8時, ..., 15 = 22時
  const DISPLAY_HOURS = 16; // 7時〜22時

  // 時間帯マスク: 朝夕のラッシュのみ「混雑時速度」を使い、それ以外は「非混雑時速度」を使う。
  // データ側の混雑時/非混雑時の速度差が小さいので、ピーク感を出すために境界を明示化している。
  // 7–9時 と 17–19時 を混雑時扱い (rate=1.0)、他はすべて非混雑時扱い (rate=0.0)。
  const congestionRate = (hour: number): number => {
    if (hour >= 7 && hour <= 9) return 1.0;
    if (hour >= 17 && hour <= 19) return 1.0;
    return 0.0;
  };

  const hourlyUp = new Array(DISPLAY_HOURS).fill(0);
  const hourlyDown = new Array(DISPLAY_HOURS).fill(0);
  const hourlyTraffic = new Array(DISPLAY_HOURS).fill(0);

  for (const sec of sections) {
    const traffic = trafficMap.get(sec.id) || new Array(24).fill(0);

    for (let h = 0; h < DISPLAY_HOURS; h++) {
      const hour = 7 + h;
      const rate = congestionRate(hour);
      const spUp = sec.speedFreeUp * (1 - rate) + sec.speedCongestedUp * rate;
      const spDown =
        sec.speedFreeDown * (1 - rate) + sec.speedCongestedDown * rate;

      hourlyUp[h] += (sec.distanceKm / Math.max(spUp, 1)) * 60;
      hourlyDown[h] += (sec.distanceKm / Math.max(spDown, 1)) * 60;
      hourlyTraffic[h] += traffic[h];
    }
  }

  const hourly: HourlyData[] = [];
  for (let i = 0; i < DISPLAY_HOURS; i++) {
    hourly.push({
      hour: 7 + i,
      travelTimeUp: Math.round(hourlyUp[i]),
      travelTimeDown: Math.round(hourlyDown[i]),
      traffic: Math.round(hourlyTraffic[i]),
    });
  }

  const totalDistance = sections.reduce((sum, s) => sum + s.distanceKm, 0);

  return {
    route: {
      from: preset.label,
      to: "九大伊都",
      road: "一般国道202号",
      totalDistanceKm: Math.round(totalDistance * 10) / 10,
      sections: sections.map((s) => ({
        id: s.id,
        name: s.name,
        distanceKm: s.distanceKm,
        speedCongested: s.speedCongestedDown,
        speedFree: s.speedFreeDown,
      })),
    },
    hourly,
    generatedAt: new Date().toISOString(),
  };
}
