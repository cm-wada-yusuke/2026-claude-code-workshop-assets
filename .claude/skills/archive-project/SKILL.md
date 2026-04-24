---
name: archive-project
description: projects/<プロジェクト名>/ 配下のファイルをまとめて ZIP にして、成果物として持ち帰れるようにするスキル。node_modules / .venv / __pycache__ など再生成可能なビルド成果物は自動で除外する。/archive-project で明示起動。
---

# archive-project

ワークショップで作ったプロダクトを一式 ZIP に固めて、自分のマシンに持ち帰れる形にするスキル。

## 目的

- `code-server` 上で作業した成果物（`projects/<name>/` 配下）をダウンロード可能な単一ファイルにまとめる
- 再生成可能な重いファイル（`node_modules` 等）は自動除外してサイズを抑える
- 学生がターミナル操作に不慣れでも、スキル1回呼び出すだけで持ち帰りが完結する

## 起動時のふるまい

### 1. プロジェクト名を確認

ユーザーに聞く：

> 「どのプロジェクトを ZIP にしますか？」

ユーザーが覚えていなそうなら、`projects/` 配下のディレクトリを列挙して提示する：

```bash
ls projects/
```

### 2. 対象ディレクトリの存在確認

`projects/<name>/` が存在することを確認する。存在しない場合は再度候補を提示する。

### 3. 既存 ZIP の確認

`projects/<name>.zip` がすでにある場合は上書き可否を確認する。

### 4. ZIP 化を実行

以下のコマンドで ZIP を作成する（再生成可能なファイルは除外）：

```bash
cd <リポジトリのルート> && \
zip -r projects/<name>.zip projects/<name> \
  -x "projects/<name>/node_modules/*" \
  -x "projects/<name>/.venv/*" \
  -x "projects/<name>/venv/*" \
  -x "projects/<name>/__pycache__/*" \
  -x "projects/<name>/**/__pycache__/*" \
  -x "projects/<name>/.next/*" \
  -x "projects/<name>/.turbo/*" \
  -x "projects/<name>/dist/*" \
  -x "projects/<name>/build/*" \
  -x "projects/<name>/.DS_Store" \
  -x "projects/<name>/**/.DS_Store" \
  -x "projects/<name>/**/*.pyc"
```

### 5. 結果を報告

成功したら、ユーザーに場所と次のアクションを伝える：

> 「`projects/<name>.zip` を作成しました（XX MB）。
> code-server のエクスプローラ（左サイドバー）で該当ファイルを右クリック → **"Download..."** を選ぶと自分のPCに保存できます。」

サイズは `du -h projects/<name>.zip` か `ls -lh projects/<name>.zip` で確認して添える。

## 除外するもの（再生成可能なので含めない）

- `node_modules/` — `npm install` で復元可能
- `.venv/` / `venv/` — `uv sync` や `pip install -r requirements.txt` で復元可能
- `__pycache__/` / `*.pyc` — Python 実行時に自動生成
- `.next/` / `.turbo/` — Next.js / Turborepo のビルドキャッシュ
- `dist/` / `build/` — 各種ビルド成果物
- `.DS_Store` — macOS のメタファイル

## 注意

- **秘密情報の混入に注意**: `.env` などが除外対象に入っていない。もしユーザーが API キー等を `.env` に入れていた場合は事前に確認する（ワークショップでは有料API禁止なので通常は問題ないはず）
- **既存 ZIP の上書き**: 既に `projects/<name>.zip` がある場合は確認を取る
- **ZIP コマンドが無い環境**: `zip` コマンドが使えない場合はエラーが出る。その場合は `tar czf` などで代替を検討する

## 典型的なやり取り

```
ユーザー: /archive-project
Claude:   どのプロジェクトを ZIP にしますか？ 候補: my-dashboard, memo-app
ユーザー: my-dashboard
Claude:   projects/my-dashboard を ZIP 化します...
          ✅ projects/my-dashboard.zip を作成しました（2.3 MB）。
          code-server のエクスプローラから右クリック → Download でダウンロードできます。
```
