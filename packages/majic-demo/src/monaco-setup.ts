import * as monaco from 'monaco-editor';
import { Registry } from 'monaco-textmate';
import { wireTmGrammars } from 'monaco-editor-textmate';
import { loadWASM } from 'onigasm';

// Import the grammar file
import majicGrammar from '../../majic-vscode/syntaxes/majic.tmLanguage.json';

let isSetup = false;

export async function setupMonaco() {
  if (isSetup) return;

  // Load onigasm WASM
  try {
    // Load from public directory
    await loadWASM('/onigasm.wasm');
  } catch (e) {
    console.warn('Failed to load onigasm.wasm, syntax highlighting might not work', e);
  }

  setupMonacoSync();
}

export function setupMonacoSync() {
  if (isSetup) {
    console.log('Monaco already setup, skipping...');
    return;
  }

  console.log('Setting up Monaco synchronously...');

  // Register the language
  monaco.languages.register({ id: 'majic' });

  // 基本的なMonacoトークナイザーを定義（TextMateの代替）
  console.log('Setting up Monarch tokenizer for majic...');
  monaco.languages.setMonarchTokensProvider('majic', {
    // デバッグ用
    defaultToken: 'text',
    ignoreCase: false,

    tokenizer: {
      root: [
        // 最も基本的なルールから開始（デバッグ用）
        [/const/, 'keyword'],
        [/function/, 'keyword'],
        [/@\w+/, 'type'],
        [/".*?"/, 'string'],
        [/\d+/, 'number'],
        [/#.*$/, 'comment'],

        // JavaScript section between ---
        [/^---$/, 'delimiter', '@javascript'],

        // その他のルール
        [/[{}[\](),:]/, 'delimiter'],
        [/./, 'text'],
      ],

      javascript: [
        [/^---$/, 'delimiter', '@pop'],
        [/\b(const|let|var|function|if|else|for|while|return|true|false|null|undefined)\b/, 'keyword'],
        [/"([^"\\]|\\.)*"/, 'string'],
        [/'([^'\\]|\\.)*'/, 'string'],
        [/\/\/.*$/, 'comment'],
        [/\/\*/, 'comment', '@jscomment'],
        [/\d+/, 'number'],
        [/[a-zA-Z_$]\w*/, 'identifier'],
        [/[{}[\]();,.]/, 'delimiter'],
      ],

      jscomment: [
        [/\*\//, 'comment', '@pop'],
        [/./, 'comment']
      ],

      comment: [
        [/\*\//, 'comment', '@pop'],
        [/./, 'comment']
      ],

      string: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop']
      ],

      triplestring: [
        [/'''/, 'string', '@pop'],
        [/./, 'string']
      ]
    }
  });

  monaco.languages.setLanguageConfiguration('majic', {
    comments: {
      lineComment: '#',
      blockComment: ['/*', '*/']
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')']
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
      { open: "'''", close: "'''" }
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" }
    ]
  });

  // Define custom theme tokens for majic
  monaco.editor.defineTheme('majic-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      // JavaScript tokens
      { token: 'keyword.control.js', foreground: '569cd6' },
      { token: 'string.quoted.double.js', foreground: 'ce9178' },
      { token: 'string.quoted.single.js', foreground: 'ce9178' },
      { token: 'comment.line.double-slash.js', foreground: '6a9955' },
      { token: 'comment.block.js', foreground: '6a9955' },
      { token: 'constant.numeric.js', foreground: 'b5cea8' },
      { token: 'entity.name.function.js', foreground: 'dcdcaa' },

      // Majic specific tokens
      { token: 'entity.name.function.macro.majic', foreground: '4ec9b0' },
      { token: 'string.quoted.double.majic', foreground: 'ce9178' },
      { token: 'string.quoted.other.multiline.majic', foreground: 'ce9178' },
      { token: 'constant.language.majic', foreground: '569cd6' },
      { token: 'constant.numeric.majic', foreground: 'b5cea8' },
      { token: 'support.type.property-name.majic', foreground: '9cdcfe' },
      { token: 'punctuation.separator.majic', foreground: 'd4d4d4' },
      { token: 'punctuation.separator.dictionary.key-value.majic', foreground: 'd4d4d4' },
      { token: 'comment.line.number-sign.majic', foreground: '6a9955' },
      { token: 'comment.line.double-slash.majic', foreground: '6a9955' },
      { token: 'comment.block.majic', foreground: '6a9955' },

      // Markdown tokens
      { token: 'markup.heading.markdown', foreground: '569cd6' },
      { token: 'markup.bold.markdown', foreground: 'd7ba7d', fontStyle: 'bold' },
      { token: 'markup.italic.markdown', foreground: 'd7ba7d', fontStyle: 'italic' },
      { token: 'markup.inline.raw.string.markdown', foreground: 'ce9178' },
      { token: 'markup.raw.block.markdown', foreground: 'ce9178' },

      // HTML tokens
      { token: 'entity.name.tag.html', foreground: '569cd6' },
      { token: 'entity.other.attribute-name.html', foreground: '9cdcfe' },
      { token: 'string.quoted.double.html', foreground: 'ce9178' },

      // CSS tokens
      { token: 'entity.name.tag.css', foreground: 'd7ba7d' },
      { token: 'support.type.property-name.css', foreground: '9cdcfe' },
      { token: 'string.quoted.double.css', foreground: 'ce9178' },
      { token: 'constant.numeric.css', foreground: 'b5cea8' },
      { token: 'comment.block.css', foreground: '6a9955' },

      // SQL tokens
      { token: 'keyword.other.sql', foreground: '569cd6' },
      { token: 'string.quoted.single.sql', foreground: 'ce9178' },
      { token: 'comment.line.double-dash.sql', foreground: '6a9955' },
      { token: 'constant.numeric.sql', foreground: 'b5cea8' }
    ],
    colors: {}
  });

  isSetup = true;
}

export async function wireMonacoGrammar(editor: monaco.editor.IStandaloneCodeEditor) {
  const registry = new Registry({
    getGrammarDefinition: async (scopeName) => {
      console.log('Requested grammar for:', scopeName);
      if (scopeName === 'source.majic') {
        return {
          format: 'json',
          content: majicGrammar
        };
      }
      if (scopeName === 'source.js') {
        // Monaco Editor標準のJavaScriptを使用
        return {
          format: 'json',
          content: {
            scopeName: 'source.js',
            patterns: [
              { include: '#comment' },
              { include: '#keyword' },
              { include: '#string' },
              { include: '#number' },
              { include: '#identifier' }
            ],
            repository: {
              comment: {
                patterns: [
                  { name: 'comment.line.double-slash.js', match: '//.*$' },
                  { name: 'comment.block.js', begin: '/\\*', end: '\\*/' }
                ]
              },
              keyword: {
                name: 'keyword.control.js',
                match: '\\b(const|let|var|function|if|else|for|while|return|true|false|null|undefined)\\b'
              },
              string: {
                patterns: [
                  { name: 'string.quoted.double.js', begin: '"', end: '"' },
                  { name: 'string.quoted.single.js', begin: "'", end: "'" }
                ]
              },
              number: {
                name: 'constant.numeric.js',
                match: '\\b\\d+(\\.\\d+)?\\b'
              },
              identifier: {
                name: 'variable.other.js',
                match: '\\b[a-zA-Z_$][a-zA-Z0-9_$]*\\b'
              }
            }
          }
        };
      }
      if (scopeName === 'text.html.markdown') {
        return {
          format: 'json',
          content: {
            scopeName: 'text.html.markdown',
            patterns: [
              { name: 'markup.heading.markdown', match: '^#{1,6}\\s+.*$' },
              { name: 'markup.bold.markdown', match: '\\*\\*[^*]+\\*\\*' },
              { name: 'markup.italic.markdown', match: '\\*[^*]+\\*' },
              { name: 'markup.inline.raw.markdown', match: '`[^`]+`' },
              { name: 'markup.raw.block.markdown', begin: '```', end: '```' }
            ]
          }
        };
      }
      if (scopeName === 'text.html.basic') {
        return {
          format: 'json',
          content: {
            scopeName: 'text.html.basic',
            patterns: [
              { name: 'entity.name.tag.html', match: '</?\\w+' },
              { name: 'entity.other.attribute-name.html', match: '\\w+(?==)' },
              { name: 'string.quoted.double.html', begin: '"', end: '"' },
              { name: 'meta.tag.html', begin: '<', end: '>' }
            ]
          }
        };
      }
      if (scopeName === 'source.css') {
        return {
          format: 'json',
          content: {
            scopeName: 'source.css',
            patterns: [
              { name: 'entity.name.tag.css', match: '[a-zA-Z0-9_-]+(?=\\s*\\{)' },
              { name: 'support.type.property-name.css', match: '[a-zA-Z-]+(?=\\s*:)' },
              { name: 'string.quoted.double.css', begin: '"', end: '"' },
              { name: 'constant.numeric.css', match: '\\d+(\\.\\d+)?(px|em|rem|%)?' },
              { name: 'comment.block.css', begin: '/\\*', end: '\\*/' }
            ]
          }
        };
      }
      if (scopeName === 'source.sql') {
        return {
          format: 'json',
          content: {
            scopeName: 'source.sql',
            patterns: [
              { name: 'keyword.other.sql', match: '\\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|TABLE|INDEX|DATABASE)\\b' },
              { name: 'string.quoted.single.sql', begin: "'", end: "'" },
              { name: 'comment.line.double-dash.sql', match: '--.*$' },
              { name: 'constant.numeric.sql', match: '\\d+(\\.\\d+)?' }
            ]
          }
        };
      }
      // その他の埋め込み言語は一旦無視
      console.warn(`Grammar not available for: ${scopeName}`);
      throw new Error(`Grammar not available for: ${scopeName}`);
    }
  });

  const grammars = new Map();
  grammars.set('majic', 'source.majic');

  try {
    console.log('Starting wireTmGrammars...');
    console.log('Registry:', registry);
    console.log('Grammars map:', grammars);
    console.log('Editor:', editor);

    await wireTmGrammars(monaco, registry, grammars, editor);
    console.log('TextMate grammars wired successfully');

    // 実際にTextMateがアクティブかチェック
    setTimeout(() => {
      const model = editor.getModel();
      if (model) {
        console.log('Checking if TextMate is active...');
        // MonacoのデフォルトトークナイザーではなくTextMateが使われているかチェック
        const tokenizationSupport = (monaco.languages as any)._getLanguageTokenizationProvider?.('majic');
        console.log('Tokenization provider:', tokenizationSupport);
      }
    }, 1000);
  } catch (e) {
    // Ignore errors from missing embedded language grammars
    console.error('TextMate grammar error:', e);
  }
}

