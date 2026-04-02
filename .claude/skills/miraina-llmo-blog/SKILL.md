---
name: miraina-llmo-blog
description: LLMO原則を適用したAIニュース記事ブログ自動生成スキル。「LLMOブログして」「LLMO記事作成」など、LLMOナレッジの7原則（裁定可能な主張・トレードオフ解決・ラベル付け・引用ユニット・境界例・テキスト情報・中立性）を組み込んだSEO最適化記事の自動生成で使用する。miraina-ai-blogのフロー をベースに、記事作成ステップにLLMO品質基準を統合したスキル。
---

# MIRAINA LLMO ブログ自動生成スキル

プロジェクトルート: `/Users/shibayuusaku/Downloads/work/MIRAINA-Website/`

## ワークフロー（全7ステップ）

### Step 1: 最新AIニュースの収集

以下のクエリで **WebSearch を5〜7回** 実行し、直近7日以内のトピックを収集する。

```
"AI news" site:openai.com OR site:anthropic.com OR site:deepmind.google
"生成AI" "2026" 最新
"LLM" OR "ChatGPT" OR "Claude" 新機能 発表
"AI活用" OR "AI導入" ビジネス 事例 最新
"LLMO" OR "AI検索" 対策 最新
"生成AI" 中小企業 OR マーケティング 2026
```

収集後、**MIRAINAの読者層（AI活用中〜初心者の日本の経営者・マーケター）** に最も刺さるトピックを1つ選定する。

選定基準（優先順）:
1. MIRAINA が提供するサービスと関連性が高い（LLMO・AI導入・研修・自動化）
2. 直近72時間以内のホットトピック
3. 検索ボリュームが見込めるキーワードを含む
4. まだ `data/data.json` の既存記事で扱っていないテーマ

### Step 2: トピックの深掘り調査（LLMO情報収集重視）

選定トピックに対して **WebSearch を3〜5回** 追加実行。

**標準調査項目:**
- 公式発表・一次情報ソースを取得
- 数値・データ・具体事例を収集
- 日本語での反応・解説記事を確認

**LLMO原則に基づく追加調査項目:**

次の4点を意識的に収集することで、後のHTML作成でLLMO品質を確保する。

#### (1) トレードオフになる対立軸
- 「A ツールと B ツールの違い」「導入時のメリット/デメリット」など、選択肢が複数ある場面を探す
- **「どちらが良いか」ではなく「どの条件でどちらを選ぶか」まで判断できる情報** を集める
- 例: ChatGPT vs Claude の場合 → コスト、応答速度、カスタマイズ性、サポート体制などの比較軸

#### (2) 失敗事例・境界例
- 成功事例だけでなく、「AI導入に失敗した企業」「期待値と現実のズレがあった事例」を探す
- 「この条件では効果があるが、この条件では効果がない」という判断基準を含む事例

#### (3) 数値・出典付き事実
- 「精度 XX%」「導入後 YY% コスト削減」など、具体的な数値を含む情報源を確認
- 出典が明記されているか、公式発表か第三者機関の調査か、根拠の強さを分類

#### (4) 公式情報・解釈・仮説の分類
- 調査しながら、収集した情報を次の3段階で事前分類しておく
  - 【公式情報】OpenAI / Anthropic の正式発表、API仕様書
  - 【解釈】複数メディアの報道から論理的に導き出した推論
  - 【仮説】業界トレンドから推測した将来予測（確度が低い）

**出力**:
Step 2 を終える時点で、以下の情報カテゴリ別にメモを整理しておく:

```
【公式情報】
- [発表内容、数値、日付、出典]

【解釈】
- [複数情報から導き出した分析、メリット/デメリット軸]

【仮説】
- [将来予測、業界トレンド]

【トレードオフ軸】
- [選択肢A: 特徴、最適な条件]
- [選択肢B: 特徴、最適な条件]
- [判断基準: この場合はA、この場合はB]

【失敗事例・境界例】
- [企業名、内容、失敗の理由]
```

---

### Step 2.5: 参照ページ スクリーンショット撮影・ハルシネーションチェック・挿入画像作成

**目的**:
- ① Step 2 で取得した一次情報ソースを実際にレンダリングし、記事内容のファクトチェック（ハルシネーション防止）
- ② スクリーンショットをブログ本文への挿入画像として活用する

#### 2.5-0. スクリーンショット取得の要否判断（必須）

以下の基準で **「取得する / スキップ」** を判断する。
どの条件も満たさない場合は **Step 3 へ進む**（スクリーンショットは不要）。

| # | 取得すべき条件 |
|---|--------------|
| A | 記事内に具体的な数値・統計（例: 「精度が30%向上」「ユーザー数1億人突破」）を引用している |
| B | 製品・機能の正式名称や発表日を記事に明記しており、誤記のリスクがある |
| C | 公式発表ページが存在し、ビジュアルとして記事の理解を助ける図・表・UIがある |
| D | WebSearch の結果だけでは情報の正確性に自信が持てない箇所がある |

**判断結果を明示してから次のサブステップへ進むこと。**
例: `→ 条件 A・C に該当するためスクリーンショットを取得する`
例: `→ 記事内容は概念説明が中心で具体的な数値引用がないためスキップ（Step 3 へ）`

#### 2.5-1. 参照URLの選定

Step 2 で収集したソースから **最重要 1〜3件** を選ぶ。

選定基準（優先順）:
1. 公式プレスリリース・発表ページ
2. 数値・統計データが含まれるページ
3. 日本語公式ページ（あれば英語ページより優先）

#### 2.5-2. スクリーンショット撮影スクリプトを生成・実行

以下の内容を `/tmp/miraina_capture_refs.mjs` に **Write** してから Bash で実行する。
`REF_URLS` は 2.5-1 で選定した実際の URL に置き換える。

```js
import { chromium } from 'playwright';

const REF_URLS = [
  'https://example.com/news1',  // ← 実際のURLに変更
  // 'https://example.com/news2',  // 必要なら追加（最大3件）
];

const browser = await chromium.launch();

for (let i = 0; i < REF_URLS.length; i++) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  try {
    await page.goto(REF_URLS[i], { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: `/tmp/miraina_ref_${i + 1}.png`,
      clip: { x: 0, y: 0, width: 1280, height: 720 },
    });
    console.log(`✓ Saved: /tmp/miraina_ref_${i + 1}.png  (${REF_URLS[i]})`);
  } catch (e) {
    console.warn(`✗ Failed: ${REF_URLS[i]} — ${e.message}`);
  } finally {
    await page.close();
  }
}

await browser.close();
```

```bash
npx playwright@latest --yes install chromium 2>/dev/null; node /tmp/miraina_capture_refs.mjs
```

> **Playwright が未インストールの場合**: `npm install -g playwright && playwright install chromium` を先に実行してから再試行する。
> 読み込みに失敗したURLはスキップし、取得できた分だけ次のステップへ進む。

#### 2.5-3. スクリーンショットを Read してハルシネーションチェック

```
Read /tmp/miraina_ref_1.png
Read /tmp/miraina_ref_2.png  # 取得できた分だけ実行
```

スクリーンショットを参照しながら、Step 2 で収集した情報を照合する:

| チェック項目 | 確認方法 |
|------------|--------|
| 数値・統計データ | ページ内の数字と一致しているか |
| 発表日・時系列 | 日付が正確か |
| 製品名・機能名 | 正式名称が正しいか |
| 発表主体（企業名等） | 誰が発表したか正確か |
| 引用文・キャプション | 実際の文章と齟齬がないか |

**不一致が見つかった場合**: 続くステップで使用する情報を即座に修正する。修正内容を記録しておく。

#### 2.5-4. 挿入画像の選定・WebP 変換

スクリーンショットのうち、**記事内容を最もよく補完する 1〜2 枚** を選び WebP に変換して保存する。

```bash
python3 /Users/shibayuusaku/Downloads/work/MIRAINA-Website/.claude/skills/miraina-llmo-blog/convert_screenshot.py <blog_num> /tmp/miraina_ref_1.png 2
# 2枚目がある場合:
python3 /Users/shibayuusaku/Downloads/work/MIRAINA-Website/.claude/skills/miraina-llmo-blog/convert_screenshot.py <blog_num> /tmp/miraina_ref_2.png 3
```

生成される画像:

| ファイル名 | サイズ | 用途 |
|-----------|--------|------|
| `blogXXX-2.webp` | 800×450 | 本文第1挿入画像 |
| `blogXXX-3.webp` | 800×450 | 本文第2挿入画像（任意）|

#### 2.5-5. 挿入位置の決定

- **1枚目**: 最も重要な発表内容・データを解説する H2 の直下
- **2枚目**（任意）: 活用事例・機能紹介の H2 の直下
- Step 4 の HTML 作成時に以下の形式で組み込む:

```html
<figure class="article-figure">
  <img src="/images/blogs_images/blogXXX-2.webp" alt="[一次キーワードを含む画像説明]" width="800" height="450" loading="lazy">
  <figcaption>[出典・説明。例: OpenAI 公式発表ページのスクリーンショット]</figcaption>
</figure>
```

---

### Step 3: SEO設計（既存ブログからパターン抽出）

Glob で `blogs/blog*.html` を取得し、**番号が最も大きい3件** を Read する。
既存記事のパターンを忠実に踏襲して以下を設計する。

抽出・踏襲するポイント:
- タイトルの書き方（年号・記号・文字数）
- meta description のフォーマットと文字数
- H2見出しの構成パターン・本数
- タグの種類と個数
- 冒頭要約の書き方
- CTAテキストのトーン

#### タイトル設計ルール（重要・LLMO品質基準）

**「〜〜とは？」構成の使用基準:**

✅ **使用すべきケース**（新しい概念・機能・トレンド）:
- 新しい概念 → 「LLMO対策とは？」「AIO（AI検索最適化）とは？」
- 新機能 → 「Claude 3.5とは？」「Google Workspace Geminiとは？」
- 新サービス → 「OpenAI Frontierとは？」
- 新トレンド → 「AIエージェントとは？」「物理AIとは？」
- 新ツール → 「Agent 365とは？」

❌ **避けるべきケース**（事実的な出来事・撤退・廃止）:
- 単純な終了・廃止・撤退 → 「Sora終了とは？」❌
- 既知の製品の廃止 → 「X廃止とは？」❌
- 企業の決定・政策変更 → 「GPT-4o終了とは？」❌

**改善例:**
- ❌ 「Sora終了とは？」
- ✅ 「Sora提供終了の背景と企業が学ぶべきAIツール選定の教訓」
- ✅ 「OpenAI動画生成AI撤退で見えた...」

**タイトル構成の判断基準:**
記事の中心が「何かを説明する（概念・機能）」なら「〜〜とは？」を使う。
記事の中心が「なぜこういう決定がされたのか・どう対応すべきか」なら、具体的な構成を使う。

**LLMO品質との関連性:**
「〜〜とは？」の誤用は、主張の曖昧性につながり、LLMO原則の「裁定可能な主張」に違反する。
記事の中心テーマを明確にすることで、読者が「何を学べるのか」を正確に理解できる。

設計出力物:
- 一次キーワード（記事の主軸ワード）
- 記事タイトル（既存タイトルのフォーマットに揃え、上記ルール準拠）
- meta description（既存のフォーマットに揃える）
- H2構成案（4〜6セクション）
- タグ 2〜4個

補足ルールは `references/seo-rules.md` を参照。

### Step 4: ブログHTML作成（LLMO品質基準統合）

`blogs/blog_template.html` を Read し、Step 3 で設計した構成に従って新規ファイルを Write する。
**テンプレート準拠 ＋ 既存記事のSEOパターンを反映 ＋ LLMO品質基準の確認** で品質を担保する。

- 次の番号: `Glob blogs/blog*.html` で最大値+1を確認
- ファイル: `blogs/blogXXX.html`
- 文字数目安: **2000〜4000字**（SEO評価に直結）
- Step 2.5 で生成した挿入画像（`blogXXX-2.webp` 等）を `<figure class="article-figure">` で 2.5-5 で決めた位置に配置する

#### 4-1. 本文作成時のLLMO品質チェック

Step 2 で収集した情報カテゴリと、各H2セクション書き込み直後、以下の5点を確認してから次のセクションに進むこと。

`references/llmo-rules.md` を常に参照。

**各H2セクション毎に確認する項目:**

1. **ラベル付け**
   - [ ] 最初の主張に【公式情報】【解釈】【仮説】いずれかが付いているか
   - [ ] 根拠の強さが適切に区別されているか

2. **引用可能ユニット**
   - [ ] 1〜3文で独立した意味をなす「引用可能な主張」があるか
   - [ ] その文だけを抜き出してもわかるか

3. **トレードオフ解決**
   - [ ] 2つ以上の選択肢がある場合、「どちらが良いか」で終わっていないか
   - [ ] 「この条件ではA、この条件ではB」という条件付き結論を書いているか

4. **境界例・失敗例**
   - [ ] 成功例だけでなく、失敗例や中途半端な事例を1つ以上含むか
   - [ ] 企業名・業界名、具体的な数値、失敗理由が明記されているか

5. **テキスト情報の充実**
   - [ ] このセクションの主要な数値が本文テキストに記述されているか
   - [ ] 画像内だけに数値があってテキストにはないケースがないか

**チェック結果を記録して進む（全H2セクション完了まで繰り返す）**

例:
```
[H2: Claude 3.5 の新機能]
 ✓ ラベル付け: 【公式情報】OpenAI発表から
 ✓ 引用ユニット: 「Context Window が 200K に拡張」は独立している
 ✓ トレードオフ: GPT-4o との使い分けを「速度重視ならGPT-4o、精度重視ならClaude」と記述
 ✗ 境界例: 成功事例のみ → 失敗例を追加検討
 ✓ テキスト情報: "200K トークン" をテキストに記載

→ 修正: 失敗事例の段落を追加してから次へ
```

---

### Step 4.5: サムネイル・カード画像の自動生成

ブログ番号（XXX）と記事タイトルが確定した時点で以下を実行する。

```bash
python3 /Users/shibayuusaku/Downloads/work/MIRAINA-Website/.claude/skills/miraina-llmo-blog/generate_thumbnail.py <blog_num> "<title>"
```

**例:**
```bash
python3 /Users/shibayuusaku/Downloads/work/MIRAINA-Website/.claude/skills/miraina-llmo-blog/generate_thumbnail.py 24 "AIエージェント最新動向2026：Claude・GPT-4o進化まとめ"
```

生成される画像:

| ファイル名 | サイズ | 用途 |
|-----------|--------|------|
| `blogXXX-1.webp` | 800×450 | ブログページ `article-thumbnail` / `og:image` |
| `blog-cardXXX.webp` | 800×380 | `data.json` thumbnail / `index.html` カード |

パターン自動選択:
- blog番号 % 3 == 0 → Pattern A（パープル）
- blog番号 % 3 == 1 → Pattern B（グリーン）
- blog番号 % 3 == 2 → Pattern C（ブルー）

生成後、Step 4 で作成したブログ HTML の以下2箇所が正しいパスになっているか確認・修正する:
```html
<!-- og:image -->
<meta property="og:image" content="https://miraina-ai.com/images/blogs_images/blogXXX-1.webp">

<!-- article-thumbnail -->
<img src="/images/blogs_images/blogXXX-1.webp" alt="..." width="800" height="450">
```

---

### Step 5: 5点セット更新

`references/publish-checklist.md` の手順通りに全ファイルを更新する。漏れは不可。

| # | ファイル |
|---|---------|
| 1 | `data/data.json` |
| 2 | `index.html`（ブログカード最新3件） |
| 3 | `sitemap.xml` |
| 4 | `llms.txt` |
| 5 | HTML本体（Step 4 で作成済み） |

### Step 5.5: 整合性チェック

**目的**: 5点セット更新と画像生成がすべて正しく完了しているかをコマンドで機械的に確認する。
1件でも失敗していたら **その場で修正してから Step 6 へ進む**。

以下のコマンドを1つのBash呼び出しでまとめて実行する（`XXX` は実際のblog番号に置き換える）:

```bash
NUM=XXX
ROOT="/Users/shibayuusaku/Downloads/work/MIRAINA-Website"

echo "=== [1] HTMLファイル存在確認 ==="
ls "$ROOT/blogs/blog${NUM}.html" && echo "OK" || echo "NG: ファイルがない"

echo "=== [2] og:image パス確認 ==="
grep "og:image" "$ROOT/blogs/blog${NUM}.html" | grep -q "blog${NUM}-1.webp" \
  && echo "OK" || echo "NG: og:image が blog${NUM}-1.webp を指していない → 修正必要"

echo "=== [3] article-thumbnail パス確認 ==="
grep "article-thumbnail" -A2 "$ROOT/blogs/blog${NUM}.html" | grep -q "blog${NUM}-1.webp" \
  && echo "OK" || echo "NG: article-thumbnail が blog${NUM}-1.webp を指していない → 修正必要"

echo "=== [4] サムネ画像存在確認 ==="
ls "$ROOT/images/blogs_images/blog${NUM}-1.webp" && echo "OK" || echo "NG: サムネ画像がない → generate_thumbnail.py を再実行"

echo "=== [5] カード画像存在確認 ==="
ls "$ROOT/images/blogs_images/blog-card${NUM}.webp" && echo "OK" || echo "NG: カード画像がない → generate_thumbnail.py を再実行"

echo "=== [6] data.json エントリ確認 ==="
grep -q "\"id\": ${NUM}" "$ROOT/data/data.json" \
  && echo "OK" || echo "NG: data.json に id:${NUM} がない"

echo "=== [7] data.json カード画像パス確認 ==="
grep -A5 "\"id\": ${NUM}" "$ROOT/data/data.json" | grep -q "blog-card${NUM}.webp" \
  && echo "OK" || echo "NG: data.json の thumbnail パスが違う"

echo "=== [8] index.html ブログカード確認 ==="
grep -q "blog${NUM}.html" "$ROOT/index.html" \
  && echo "OK" || echo "NG: index.html にリンクがない"

echo "=== [9] sitemap.xml 確認 ==="
grep -q "blog${NUM}.html" "$ROOT/sitemap.xml" \
  && echo "OK" || echo "NG: sitemap.xml にURLがない"

echo "=== [10] llms.txt 確認 ==="
grep -q "blog${NUM}.html" "$ROOT/llms.txt" \
  && echo "OK" || echo "NG: llms.txt にエントリがない"

echo "=== 完了 ==="
```

すべて `OK` であれば Step 6 へ進む。`NG` が出た項目は即座に修正する。

---

### Step 6: UIビジュアル確認

**目的**: 作成したブログページをブラウザで実際にレンダリングし、デザイン崩れがないことを確認する。
確認項目の詳細は `references/ui-check.md` を参照。

#### 6-1. ローカルサーバー起動

```bash
cd /Users/shibayuusaku/Downloads/work/MIRAINA-Website && python3 -m http.server 8899 &
sleep 2
```

#### 6-2. Playwright スクリプトを生成・実行

以下の内容を `/tmp/miraina_ui_check.mjs` に **Write** してから Bash で実行する。
`BLOG_PATH` は今回作成したファイル（例: `blogs/blog022.html`）に置き換える。

```js
import { chromium } from 'playwright';

const BLOG_PATH = 'blogs/blogXXX.html'; // ← 実際のパスに変更
const BASE = 'http://localhost:8899';

const browser = await chromium.launch();

// --- PC (1280px) ---
const pc = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await pc.goto(`${BASE}/${BLOG_PATH}`, { waitUntil: 'networkidle' });
await pc.screenshot({ path: '/tmp/miraina_check_pc.png', fullPage: true });

// --- SP (390px) ---
const sp = await browser.newPage({ viewport: { width: 390, height: 844 } });
await sp.goto(`${BASE}/${BLOG_PATH}`, { waitUntil: 'networkidle' });
await sp.screenshot({ path: '/tmp/miraina_check_sp.png', fullPage: true });

await browser.close();
console.log('Screenshots saved: /tmp/miraina_check_pc.png  /tmp/miraina_check_sp.png');
```

```bash
npx playwright@latest --yes install chromium 2>/dev/null; node /tmp/miraina_ui_check.mjs
```

> **Playwright が未インストールの場合**: `npm install -g playwright && playwright install chromium` を先に実行してから再試行する。

#### 6-3. スクリーンショットを Read して目視確認

```
Read /tmp/miraina_check_pc.png
Read /tmp/miraina_check_sp.png
```

`references/ui-check.md` のチェックリストに従い、各項目をスクリーンショットで確認する。
問題があれば HTML / CSS を修正し、再度 6-2 を実行してスクリーンショットを再取得する。

#### 6-4. サーバー停止

```bash
kill $(lsof -ti:8899) 2>/dev/null || true
```

---

### Step 7: 完了レポート

以下を出力する:
- 作成した記事タイトル・ファイルパス
- 一次キーワード・想定検索意図
- 更新した5点セットのファイル一覧
- UIビジュアル確認の結果（OK / 修正箇所があった場合はその内容）
- 生成したサムネイル画像パス（`blogXXX-1.webp` / `blog-cardXXX.webp`）
- ハルシネーションチェック結果（参照URL一覧・確認した事実・修正点があればその内容）
- 挿入画像パス（`blogXXX-2.webp` / `blogXXX-3.webp`、スクショ取得不可の場合はスキップ）
- **LLMO品質確認結果** （各H2で実施したチェック項目の結果、修正履歴）
