import { Context } from './context';

// Types from majic-grammar (approximated as we don't have d.ts yet)
interface Node {
  type: string;
  [key: string]: any;
}

export class Transformer {
  private context: Context;

  constructor(context: Context) {
    this.context = context;
  }

  transform(ast: Node): any {
    return this.visit(ast);
  }

  private visit(node: any): any {
    if (!node) return node;

    if (Array.isArray(node)) {
      return this.visitArray(node);
    }

    if (typeof node === 'object') {
      switch (node.type) {
        case 'MacroCall':
          return this.visitMacroCall(node);
        case 'TaggedString':
          return node.value; // Drop the tag
        case 'QuotelessString': // Should be handled by parser, but just in case
          return node;
        default:
          // Plain object or other node types
          if (node.key !== undefined && node.value !== undefined) {
            // It's a Member { key: ..., value: ... } - usually handled in Object visit
            return { [node.key]: this.visit(node.value) };
          }
          // If it's a plain object from the parser (like the root object)
          return this.visitObject(node);
      }
    }

    return node;
  }

  private visitArray(arr: any[]): any[] {
    const result: any[] = [];
    for (const item of arr) {
      const transformed = this.visit(item);
      // Undefined Erasure: if undefined, skip it
      if (transformed !== undefined) {
        result.push(transformed);
      }
    }
    return result;
  }

  private visitObject(obj: any): any {
    // The parser returns an object where keys are properties
    // We need to traverse values
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        const transformed = this.visit(value);
        // Undefined Erasure: if undefined, remove the key
        if (transformed !== undefined) {
          result[key] = transformed;
        }
      }
    }
    return result;
  }

  private visitMacroCall(node: any): any {
    const args = node.args.map((arg: any) => this.visit(arg));
    return this.context.callMacro(node.name, args);
  }
}
