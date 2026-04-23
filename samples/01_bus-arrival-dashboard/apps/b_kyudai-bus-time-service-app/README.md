# b_kyudai-bus-time-service-app（Next.js 版）

博多→九大 バス通学時間ダッシュボードの **Next.js 実装サンプル**です。静的サイト版（`../a_static-site`）と同じ見た目ですが、以下の構成の違いがあります。

| 観点 | a_static-site | b_kyudai-bus-time-service-app |
|---|---|---|
| フレームワーク | 素の HTML + JS | Next.js 16 (App Router) |
| データ | `index.html` 内にハードコード | CSV を都度読み込んで集計 |
| アーキテクチャ | 1ファイル | フロント / API / データ層に分離 |
| データ更新 | ファイル書き換え | CSV を差し替えるだけ |

> 静的サイト版と比べて**あえてオーバーエンジニアリング**にしています。学生さんが「API と UI が分離した構成」を体感するためのサンプルです。

## 構成

```
b_kyudai-bus-time-service-app/
├── app/
│   ├── api/travel-time/route.ts   # API: CSV → JSON（都度集計）
│   ├── page.tsx                    # UI: API を fetch して描画（Client Component）
│   ├── layout.tsx
│   └── globals.css
├── lib/
│   └── aggregate.ts                # CSV 集計ロジック
├── data/                           # ローカルDB（CSV）
│   ├── kasyo40.csv
│   └── zkntrf40.csv
└── package.json
```

### データフロー

```
[data/*.csv]
    ↓ fs.readFileSync + TextDecoder('shift_jis')
[lib/aggregate.ts] 国道202号の抽出・混雑度計算・所要時間推定
    ↓ return JSON
[app/api/travel-time/route.ts]  → GET /api/travel-time
    ↓ fetch
[app/page.tsx] (Client Component) → recharts で描画
```

## 起動方法

開発モードで起動：

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開くと画面が表示されます。初回表示時に `GET /api/travel-time` が走り、CSV が集計されて結果が返ります（100ms 前後）。

code-server 上で動かす場合：ローカルPCから `http://<code-serverのIP>:3000` で開けます。停止は `Ctrl + C`。

## 本番ビルド

```bash
npm run build
npm start
```

API は `dynamic` なエンドポイントなので、ビルド時ではなくリクエスト時に CSV が読まれます。

## 使っているライブラリ

- [Next.js 16](https://nextjs.org/) App Router / Turbopack
- [React 19](https://react.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Recharts](https://recharts.org/) グラフ描画

## 既知の制約

- CSV は Shift_JIS。`TextDecoder('shift_jis')` で UTF-8 にデコードしています
- サンプル用途のため、対象区間は国道202号の先頭から総延長 25 km 分のみに絞っています（博多→九大伊都に近い範囲）
- `朝夕（混雑時）` と `昼間（非混雑時）` の 2 値しか観測値がないため、時間帯別の所要時間は「時間帯別の交通量比」を使った線形補間で推定しています
- 毎リクエストで CSV をパースするので本番では非効率。キャッシュや事前集計の題材にも使えます

## 次のステップ（拡張アイデア）

- 結果を `unstable_cache` / `Cache Components` でキャッシュする
- Server Component に寄せて API 層を不要にする
- `app/api/travel-time/route.ts` にクエリ（`?hour=10` など）を受け取らせて、必要な部分だけ返す
- CSV のかわりに SQLite や DuckDB 等を使う
