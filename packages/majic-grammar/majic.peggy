{
  function makeMacro(name, args) {
    return { type: "MacroCall", name: name, args: args || [] };
  }
  
  function makeTaggedString(tag, value) {
    // AST上ではタグ情報を保持する（エディタやツールのため）
    // JSON変換時は単純に value を返せばOK
    return { type: "TaggedString", tag: tag, value: value };
  }

  function join(chars) { return chars.flat(Infinity).join(""); }
  
  function buildObject(members) {
    return members.reduce((acc, m) => { acc[m.key] = m.value; return acc; }, {});
  }

  function dedent(str) {
    const lines = str.split(/\r?\n/);
    if (lines.length > 0 && lines[0].trim() === "") lines.shift();
    let minIndent = Infinity;
    for (const line of lines) {
      if (line.trim().length === 0) continue;
      const match = line.match(/^[ \t]*/);
      const indent = match ? match[0].length : 0;
      if (indent < minIndent) minIndent = indent;
    }
    if (minIndent === Infinity) minIndent = 0;
    return lines.map(line => {
      if (line.length >= minIndent) return line.slice(minIndent);
      return "";
    }).join("\n");
  }
}

// ==========================================
// Entry Point
// ==========================================
Start
  = (Comment / [ \t\n\r])* v:Value (Comment / [ \t\n\r])* !. { return v; }

// ==========================================
// Value Dispatcher
// ==========================================
Value
  = MacroCall
  / TaggedString
  / MultilineString
  / QuotedString
  / Object
  / Array
  / QuotelessString

// ==========================================
// 🏷️ Tagged String
// ==========================================
// 例: md'''...''' または sql"..."
TaggedString
  = tag:Identifier str:(MultilineString / QuotedString) {
      return makeTaggedString(tag, str);
    }

// ==========================================
// 🧙‍♂️ Macro
// ==========================================
MacroCall
  = "@" name:Identifier "(" (Comment / [ \t\n\r])* args:ArgumentList? (Comment / [ \t\n\r])* ")" {
      return makeMacro(name, args);
    }

ArgumentList
  = head:Value tail:(Separator v:Value { return v; })* {
      return [head, ...tail];
    }

Identifier
  = chars:([a-zA-Z0-9_]+) { return join(chars); }

// ==========================================
// 📦 Object & Array
// ==========================================
Object
  = "{" (Comment / [ \t\n\r])* members:MemberList? (Comment / [ \t\n\r])* "}" { return buildObject(members || []); }

MemberList
  = head:Member tail:(Separator m:Member { return m; })* Separator? {
      return [head, ...tail];
    }

Member
  = key:ObjectKey _ ":" _ value:Value {
      return { key: key, value: value };
    }

ObjectKey
  = QuotelessString

Array
  = "[" (Comment / [ \t\n\r])* elements:ElementList? (Comment / [ \t\n\r])* "]" { return elements || []; }

ElementList
  = head:Value tail:(Separator v:Value { return v; })* Separator? {
      return [head, ...tail];
    }

// ♻️ Separator
Separator
  = _ "," (Comment / [ \t\n\r])*

// ==========================================
// 🛡️ Quoteless String
// ==========================================
QuotelessString
  = !ReservedStartChar
    chars:QuotelessChar+
    {
      const str = join(chars).trim();
      if (!isNaN(Number(str)) && !isNaN(parseFloat(str))) return Number(str);
      if (str === "true") return true;
      if (str === "false") return false;
      if (str === "null") return null;
      return str;
    }

ReservedStartChar
  = "@" / '"' / "'" / "[" / "{" / "]" / "}" / ","

QuotelessChar
  = !Terminator . 

Terminator
  = "," / "]" / "}" / ")" / ":" / [\n\r]

// ==========================================
// 🧱 Strings
// ==========================================
MultilineString
  = "'''" chars:(!"'''" .)* "'''" {
      return dedent(join(chars));
    }

QuotedString
  = '"' chars:([^"\\\n] / Escape)* '"' { return join(chars); }

Escape
  = '\\' char:[bfnrt"\\/] { return char; }
  / '\\u' code:([0-9a-fA-F]|4|) { 
      return String.fromCharCode(parseInt(join(code), 16)); 
    }

// ==========================================
// 🧹 Whitespace & Comments
// ==========================================
_ = (Whitespace / Comment)*

Whitespace = [ \t]

Comment
  = "#" [^\n]* [\n\r]?
  / "//" [^\n]* [\n\r]?
  / "/*" (!"*/" .)* "*/"
  