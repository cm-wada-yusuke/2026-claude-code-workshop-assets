"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TravelTimeResponse } from "@/lib/aggregate";
import { FROM_PRESETS } from "@/lib/presets";

export default function Page() {
  const [data, setData] = useState<TravelTimeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [arrivalHour, setArrivalHour] = useState(10);
  const [fromKey, setFromKey] = useState(FROM_PRESETS[0].key);

  useEffect(() => {
    setData(null);
    setError(null);
    fetch(`/api/travel-time?from=${encodeURIComponent(fromKey)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`API ${res.status}`);
        const json = (await res.json()) as TravelTimeResponse;
        setData(json);
      })
      .catch((e) => setError(String(e)));
  }, [fromKey]);

  const simulation = useMemo(() => {
    if (!data) return null;
    const drivingHour = Math.max(7, arrivalHour - 1);
    const target =
      data.hourly.find((h) => h.hour === drivingHour) ?? data.hourly[0];
    const travelMin = target.travelTimeDown;
    const departureMin = arrivalHour * 60 - travelMin;
    const depH = Math.floor(departureMin / 60);
    const depM = Math.max(0, departureMin % 60);
    return {
      travelMin,
      departure: `${String(depH).padStart(2, "0")}:${String(depM).padStart(2, "0")}`,
      drivingHour,
    };
  }, [data, arrivalHour]);

  if (error) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="text-red-700">データ取得に失敗しました: {error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="text-slate-700">読み込み中...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-5 p-6">
      <header className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white">
        <h1 className="text-xl font-semibold">
          {data.route.from} → {data.route.to} バス通学時間ダッシュボード
        </h1>
        <p className="mt-1 text-sm text-slate-200">
          {data.route.road} / 総延長 {data.route.totalDistanceKm} km
        </p>
      </header>

      {/* Simulator */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <label className="text-sm font-semibold text-slate-900">
            出発地
          </label>
          <select
            value={fromKey}
            onChange={(e) => setFromKey(e.target.value)}
            className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-indigo-600 focus:outline-none"
          >
            {FROM_PRESETS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
          <label className="text-sm font-semibold text-slate-900">
            到着希望時刻
          </label>
          <select
            value={arrivalHour}
            onChange={(e) => setArrivalHour(Number(e.target.value))}
            className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-indigo-600 focus:outline-none"
          >
            {Array.from({ length: 14 }, (_, i) => 8 + i).map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}:00
              </option>
            ))}
          </select>
        </div>
        {simulation && (
          <div className="mt-4 rounded-lg border-l-4 border-indigo-600 bg-indigo-50 p-5">
            <p className="text-2xl font-bold text-indigo-900">
              {simulation.departure} 頃に {data.route.from} を出発
            </p>
            <p className="mt-1 text-sm text-slate-800">
              推定所要時間: 約 {simulation.travelMin} 分（
              {simulation.drivingHour}時台の交通状況で算出）
            </p>
          </div>
        )}
      </section>

      {/* Chart */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          時間帯別の推定所要時間
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.hourly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis
                dataKey="hour"
                tickFormatter={(h) => `${h}時`}
                stroke="#0f172a"
                tick={{ fill: "#0f172a" }}
              />
              <YAxis
                stroke="#0f172a"
                tick={{ fill: "#0f172a" }}
                label={{
                  value: "分",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#0f172a",
                }}
              />
              <Tooltip
                formatter={(v) => [`${v} 分`, "所要時間"]}
                labelFormatter={(h) => `${h}時台`}
                contentStyle={{ color: "#0f172a" }}
              />
              <Line
                type="monotone"
                dataKey="travelTimeDown"
                stroke="#3730a3"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Section table */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          区間別の旅行速度（博多→糸島方向）
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-slate-900">
            <thead>
              <tr className="border-b-2 border-slate-300 text-left text-slate-700">
                <th className="py-2 font-semibold">区間名</th>
                <th className="py-2 font-semibold">距離</th>
                <th className="py-2 font-semibold">混雑時</th>
                <th className="py-2 font-semibold">非混雑時</th>
              </tr>
            </thead>
            <tbody>
              {data.route.sections.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-slate-200 last:border-0"
                >
                  <td className="py-2">{s.name}</td>
                  <td className="py-2">{s.distanceKm.toFixed(1)} km</td>
                  <td className="py-2">{s.speedCongested.toFixed(1)} km/h</td>
                  <td className="py-2">{s.speedFree.toFixed(1)} km/h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="text-center text-xs text-slate-600">
        データ出典: 国土交通省「令和3年度 全国道路・街路交通情勢調査」福岡県データ
        {" / "}
        生成時刻: {new Date(data.generatedAt).toLocaleString("ja-JP")}
      </footer>
    </main>
  );
}
