# **MaJic 🧙‍♂️**

**Macro JSON Interface for Configuration**

MaJic は、HJSON のような「人間にとっての書きやすさ」と、JavaScript の強力な「マクロ機能」を融合させた、新しい設定記述言語です。  
RPGツクールのイベントデータから、Terraform のインフラ定義まで、あらゆる複雑な JSON を「魔法のように」簡潔に記述できます。

## **✨ 特徴 (Features)**

* **Strict Comma**: カンマを必須とすることで、曖昧さを排除し、堅牢なパースを実現。  
* **Quoteless Japanese**: 日本語もクォートなしで記述可能。「データ入力」のストレスをゼロに。  
* **Macro System**: @Macro(args) 構文でロジックを注入。DRY原則を徹底できます。  
* **Polyglot Literals**: js'''...''' や md'''...''' で、エディタのシンタックスハイライトを維持したまま他言語を埋め込めます。  
* **Undefined Erasure**: マクロが undefined を返すと要素が消滅。条件分岐が驚くほどシンプルに。

## **🚀 記述例 (Example)**

**入力 (game\_event.mj):**

```majic
---
const IS_DEBUG = process.env.DEBUG === 'true';
const { Say, GiveItem } = require('./macros');
---
{
  # 日本語もクォートなしでOK！
  イベント名: 始まりの町_入口,
  リスト: [
    # マクロで複雑なJSON構造を隠蔽
    @Say(
      勇者よ、
      よくぞ参った。
    ),

    # Markdownハイライトが効くリテラル
    @Log(md'''
      ## イベントログ
      - プレイヤーが町に到達
      - **デバッグモード**: ${IS_DEBUG}
    '''),

    # 条件付きアイテム付与 (falseならこの要素ごと消える)
    @If(@Var(IS_DEBUG), @GiveItem(ポーション, 10))
  ]
}
```

**出力 (game_event.json):**

```json
{
  "イベント名": "始まりの町_入口",
  "リスト": [
    {
      "code": 401,
      "parameters": ["勇者よ、\\nよくぞ参った。"]
    },
    {
      "type": "Log",
      "message": "## イベントログ\\n- プレイヤーが町に到達\\n- **デバッグモード**: true"
    },
    {
      "code": 126,
      "parameters": [1, 0, 0, 10]
    }
  ]
}
```
## **📦 インストール**

TBD

## **🔧 VS Code 拡張機能**

シンタックスハイライトと、タグ付きリテラル（js, ts, html, sql, markdown 等）の埋め込み言語サポートを提供する拡張機能を用意しています。

## **📄 ライセンス**

MIT License

## **🛠️ ビルドと開発 (Build & Development)**

このプロジェクトは `pnpm` ワークスペースを使用しています。

### **前提条件 (Prerequisites)**

*   Node.js (v18 or later)
*   pnpm

### **セットアップ (Setup)**

```bash
# 依存関係のインストール
pnpm install
```

### **ビルド (Build)**

```bash
# 全パッケージのビルド
pnpm run -r build

# VS Code 拡張機能のコンパイル
pnpm run -C packages/majic-vscode compile
```

### **デバッグ (Debug)**

VS Code でこのプロジェクトを開き、F5 キーを押すと拡張機能のデバッグを開始できます（`Launch Client` 設定が選択されていることを確認してください）。
