# ハッカソン サンプル集

Claude Code を使った AI時代のプロダクトづくりを、限られた時間で体験するためのサンプル集です。

- 「課題を一言 + 解決策を一言」から180分で動くプロトタイプに到達する**思考プロセスと実装例**を示します
- 対話形式でスコープ設計と発表準備をサポートする Claude Skill を同梱しています

---

## このリポジトリの使い方

### 想定ディレクトリ構成

このリポジトリを `git clone` すると、以下のような配置になります。**自分のプロジェクトは、クローンしたリポジトリと並ぶ形で `projects/` に作成** されます（リポジトリ内ではなく隣）。

```
your-workspace/
├── academic-hackathon/        ← git clone で取得（このリポジトリ）
│   ├── README.md
│   └── samples/               ← サンプルプロジェクト
└── projects/                  ← あなたのプロジェクトはここに作成される
    └── <your-project-name>/   ← /scope-design を実行すると自動で作られる
```

### 推奨フロー

```
1. サンプル（samples/）を眺めて、完成イメージを掴む
        ↓
2. Claude Code で `/scope-design` を実行
   → プロジェクト名を聞かれるので答える
   → `projects/<名前>/` に input.md → idea.md → scope.md が作成される
        ↓
3. scope.md を元に実装
        ↓
4. Claude Code で `/presentation` を実行
   → `projects/<名前>/presentation.md` が作成される
        ↓
5. ペアフィードバック → ピッチ発表
```

---

## サンプルプロジェクト

サンプルは「同じ考え方で違う形のプロダクトに着地する」2パターンを用意しています。自分の課題に近い方を参考にしてください。

### [samples/01_bus-arrival-dashboard](samples/01_bus-arrival-dashboard/) — 博多→九大 通学時間ダッシュボード（Web）

- **課題**: バス通学の所要時間が読めず、いつ出発すべきか分からない
- **着地**: 国土交通省「道路交通センサス」を事前集計 → 静的Webダッシュボード
- **技術**: Python（集計）+ HTML/CSS/JS + Chart.js
- **ポイント**: 入力の解決策は「チャットで質問できるWebアプリ」だったが、設計段階で **静的UI + 事前計算** にピボット。実装時間とデータ信頼性の両方で得をした例

読む順番: `input.md` → `scope.md` → `report/introduction.md` → `prompts/conversation-log.md`（Claudeとの対話ログ）

### [samples/02_rishu_simulator](samples/02_rishu_simulator/) — 履修登録シミュレータ `jiji`（CLI）

- **課題**: 履修候補の時間割衝突・単位数を手作業で確認するのが大変
- **着地**: CSVを読み込み、衝突検出・週マップ・単位数サマリをターミナルに表示するCLI
- **技術**: Python + Click + Rich + uv
- **ポイント**: 外部APIもLLMも使わず、**CSV処理と整形出力だけで価値を出す** 最小構成の例

読む順番: `input.md` → `scope.md` → `README.md`（使い方）

---

## Claude Skills

対話形式で作業をガイドするスキルを同梱しています。`/<スキル名>` で呼び出します。

### `/scope-design` — スコープ設計を対話でサポート

**使いどころ**: 何を作るか決めたいとき（1コマ目）

やってくれること：

1. 「課題を一言」「解決策を一言」を聞き出して `input.md` を作成
2. 実装アプローチを **2〜4案** 提示して `idea.md` を作成（入力の実装形式に縛られない別案も必ず含む）
3. MVP / ストレッチ / スコープ外 / 技術 を1問ずつ対話で決定
4. 9セクション構成の `scope.md` を書き出し

→ 詳細: [`.claude/skills/scope-design/SKILL.md`](.claude/skills/scope-design/SKILL.md)

### `/presentation` — 検証 + 発表準備を対話でサポート

**使いどころ**: 実装が一段落したとき（3コマ目）

やってくれること：

1. 「まずプロダクトを触って、課題文と照らし合わせてください」と促す
2. ワンライナー / 課題と解決策の振り返り / デモシナリオ / 技術的な根拠 / 限界と次の一手 を1問ずつ聞く
3. ピッチ発表の原稿として使える `presentation.md` を書き出し

→ 詳細: [`.claude/skills/presentation/SKILL.md`](.claude/skills/presentation/SKILL.md)

**大原則**: Claude は代筆しません。学生自身の言葉を引き出し、整形を手伝います。

---

## サンプルを動かす

### 01_bus-arrival-dashboard（静的サイト）

```bash
cd samples/01_bus-arrival-dashboard

# データの事前集計（初回のみ）
python scripts/build_route_data.py

# ブラウザで開く
open app/index.html
```

詳細は [`samples/01_bus-arrival-dashboard/apps/a_static-site/README.md`](samples/01_bus-arrival-dashboard/apps/a_static-site/README.md) を参照。

### 02_rishu_simulator（CLIツール）

```bash
cd samples/02_rishu_simulator

# 依存インストール（uv を使用）
uv sync

# 実行
uv run jiji check samples/courses.csv
```

詳細は [`samples/02_rishu_simulator/README.md`](samples/02_rishu_simulator/README.md) を参照。

---

## このリポジトリのディレクトリ構成

```
academic-hackathon/
├── README.md                          # このファイル
├── .claude/
│   └── skills/
│       ├── scope-design/SKILL.md      # スコープ設計スキル
│       └── presentation/SKILL.md      # 検証+発表準備スキル
└── samples/
    ├── 01_bus-arrival-dashboard/      # Webダッシュボードのサンプル
    └── 02_rishu_simulator/            # CLIツールのサンプル
```

※ 自分のプロジェクトは、このリポジトリの**隣**（`../projects/<名前>/`）に作成されます。

---

## 前提環境

- [Claude Code](https://docs.claude.com/claude-code) がインストール済み
- Python 3.10+
- Node.js（サンプル01の一部アプリで使用）
- [uv](https://docs.astral.sh/uv/)（サンプル02で使用、任意）

ハッカソン本番では code-server 上に上記が用意されています。ローカルで試す場合は各自で準備してください。

---

## ライセンス

MIT License

## Credits

このリポジトリは、Claude Code を活用したハッカソン向け教材として制作されました。
