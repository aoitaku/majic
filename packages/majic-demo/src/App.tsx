import { useState, useEffect, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { transform } from 'majic';
import { setupMonaco, setupMonacoSync, wireMonacoGrammar } from './monaco-setup';

const DEFAULT_CODE = `---
const IS_DEBUG = true;
function Say(text) {
  return { type: "Say", text: text };
}
function Var(name) {
  return name;
}
function If(cond, val) {
  return cond ? val : undefined;
}
---
{
  title: "MaJic Demo",
  debug: @Var(IS_DEBUG),
  events: [
    @Say(Hello World),
    @If(@Var(IS_DEBUG), { type: "DebugLog", msg: "Debug Mode On" })
  ]
}`;

function App() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    setupMonaco();
  }, []);

  useEffect(() => {
    try {
      const result = transform(code);
      setOutput(JSON.stringify(result, null, 2));
      setError(null);
    } catch (e: any) {
      console.error('Transform error:', e);
      setError(e.toString() + (e.stack ? '\n\n' + e.stack : ''));
    }
  }, [code]);

  const handleEditorDidMount: OnMount = async (editor, _monaco) => {
    editorRef.current = editor;

    // デバッグ: Language IDを確認
    const model = editor.getModel();
    console.log('Editor mounted - Language ID:', model?.getLanguageId());

    try {
      await wireMonacoGrammar(editor);

      // 基本的なデバッグ情報
      setTimeout(() => {
        console.log('=== Debug Info ===');
        console.log('Registered languages:', _monaco.languages.getLanguages().map(l => l.id));
        console.log('Model language:', model?.getLanguageId());

        // エディタの見た目で確認
        console.log('Editor has syntax highlighting?',
          editor.getDomNode()?.querySelector('.mtk1, .mtk2, .mtk3, .mtk4, .mtk5') !== null
        );
      }, 2000);
    } catch (error) {
      console.error('Grammar wiring failed:', error);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      <header style={{ padding: '10px 20px', background: '#333', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.2rem' }}>MaJic Demo</h1>
        <a href="https://github.com/aoitaku/majic" style={{ color: 'white', textDecoration: 'none' }}>GitHub</a>
      </header>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, borderRight: '1px solid #444', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '5px 10px', background: '#252526', fontSize: '0.9rem' }}>Input (.mj)</div>
          <Editor
            height="100%"
            defaultLanguage="majic"
            defaultValue={DEFAULT_CODE}
            theme="vscode-dark-custom"
            onChange={(value) => setCode(value || '')}
            onMount={handleEditorDidMount}
            beforeMount={(monaco) => {
              console.log('Before mount - Registering majic language');
              // Majic言語を登録
              if (!monaco.languages.getLanguages().find(lang => lang.id === 'majic')) {
                monaco.languages.register({ id: 'majic' });

                // Monarchトークナイザーを設定（VSCodeのTextMateと同等の機能）
                monaco.languages.setMonarchTokensProvider('majic', {
                  tokenizer: {
                    root: [
                      // JavaScript section
                      [/^---$/, 'delimiter', '@javascript'],

                      // Comments
                      [/#.*$/, 'comment'],
                      [/\/\/.*$/, 'comment'],
                      [/\/\*/, 'comment', '@comment'],

                      // Macros (@Say, @Var, etc.)
                      [/@[a-zA-Z_]\w*/, 'type'],


                      // Strings (quoted)
                      [/"([^"\\]|\\.)*"/, 'string'],
                      [/'''/, 'string', '@triplestring'],

                      // Numbers
                      [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
                      [/\d+/, 'number'],

                      // Booleans and null
                      [/\b(true|false|null)\b/, 'keyword'],

                      // Property names (keys)
                      [/[a-zA-Z_]\w*(?=\s*:)/, 'key'],

                      // Punctuation
                      [/[{}]/, 'delimiter.bracket'],
                      [/[\[\]]/, 'delimiter.array'],
                      [/[()]/, 'delimiter.parenthesis'],
                      [/[,:]/, 'delimiter'],
                    ],

                    javascript: [
                      [/^---$/, 'delimiter', '@pop'],
                      // Return statement (特別扱い)
                      [/\breturn\b/, 'keyword.control.return'],
                      // Control flow keywords
                      [/\b(if|else|for|while|do|switch|case|break|continue)\b/, 'keyword.control'],
                      // Declaration keywords
                      [/\b(const|let|var|function|class|import|export|from|default)\b/, 'keyword.declaration'],
                      // Literals
                      [/\b(true|false|null|undefined)\b/, 'keyword.literal'],
                      // Function declarations
                      [/\bfunction\s+([a-zA-Z_$]\w*)/, ['keyword.declaration', 'entity.name.function']],
                      // Function names in calls
                      [/\b([a-zA-Z_$]\w*)(?=\s*\()/, 'entity.name.function'],
                      // Strings
                      [/"([^"\\]|\\.)*"/, 'string'],
                      [/'([^'\\]|\\.)*'/, 'string'],
                      [/`/, 'string', '@template'],
                      // Comments
                      [/\/\/.*$/, 'comment'],
                      [/\/\*/, 'comment', '@comment'],
                      // Numbers
                      [/\d+/, 'number'],
                      // Identifiers
                      [/[a-zA-Z_$]\w*/, 'identifier'],
                      // Punctuation
                      [/[{}]/, 'delimiter.bracket'],
                      [/[\[\]]/, 'delimiter.array'],
                      [/[()]/, 'delimiter.parenthesis'],
                      [/[;,.]/, 'delimiter'],
                    ],

                    template: [
                      [/[^`$\\]+/, 'string'],
                      [/\$\{/, 'delimiter', '@templateExpression'],
                      [/\\`/, 'string.escape'],
                      [/`/, 'string', '@pop']
                    ],

                    templateExpression: [
                      [/\}/, 'delimiter', '@pop'],
                      { include: '@javascript' }
                    ],

                    comment: [
                      [/\*\//, 'comment', '@pop'],
                      [/./, 'comment']
                    ],

                    triplestring: [
                      [/'''/, 'string', '@pop'],
                      [/./, 'string']
                    ]
                  }
                });

                // VSCodeライクなテーマを定義
                monaco.editor.defineTheme('vscode-dark-custom', {
                  base: 'vs-dark',
                  inherit: true,
                  rules: [
                    // JavaScript keywords (細分化)
                    { token: 'keyword', foreground: '569cd6' }, // 青（基本）
                    { token: 'keyword.control', foreground: 'c586c0' }, // 紫（制御文）
                    { token: 'keyword.control.return', foreground: 'c586c0' }, // 紫（return特別扱い）
                    { token: 'keyword.declaration', foreground: '569cd6' }, // 青（宣言）
                    { token: 'keyword.literal', foreground: '569cd6' }, // 青（リテラル）
                    // Function names
                    { token: 'entity.name.function', foreground: 'dcdcaa' }, // 黄色
                    // Strings
                    { token: 'string', foreground: 'ce9178' }, // オレンジ
                    { token: 'string.unquoted', foreground: 'd69d85' }, // 薄いオレンジ
                    // Comments
                    { token: 'comment', foreground: '6a9955' }, // 緑
                    // Numbers
                    { token: 'number', foreground: 'b5cea8' }, // 薄緑
                    { token: 'number.float', foreground: 'b5cea8' },
                    // Majic macros
                    { token: 'type', foreground: '4ec9b0' }, // 青緑
                    // Property keys
                    { token: 'key', foreground: '9cdcfe' }, // 薄青
                    // Delimiters
                    { token: 'delimiter', foreground: 'd4d4d4' }, // 白
                    { token: 'delimiter.bracket', foreground: 'ffd700' }, // 金色 {}
                    { token: 'delimiter.array', foreground: 'ffd700' }, // 金色 []
                    { token: 'delimiter.parenthesis', foreground: 'ffd700' }, // 金色 ()
                    // Identifiers
                    { token: 'identifier', foreground: '9cdcfe' }, // 薄青
                  ],
                  colors: {}
                });

                console.log('Majic language and Monarch tokenizer registered');
              } else {
                console.log('Majic language already registered');
              }
            }}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              scrollBeyondLastLine: false,
            }}
          />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#1e1e1e' }}>
          <div style={{ padding: '5px 10px', background: '#252526', fontSize: '0.9rem' }}>Output (JSON)</div>
          <div style={{ flex: 1, padding: '10px', overflow: 'auto', fontFamily: 'monospace', whiteSpace: 'pre' }}>
            {error ? (
              <div style={{ color: '#f48771' }}>{error}</div>
            ) : (
              <div style={{ color: '#ce9178' }}>{output}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
