export class Context {
  private context: Record<string, any>;

  constructor() {
    this.context = {
      console: console,
    };
  }

  execute(code: string): void {
    try {
      // Parse variable/function names from code
      const declarations = code.match(/(?:const|let|var|function)\s+(\w+)/g) || [];
      const names = declarations.map(d => d.split(/\s+/)[1]);

      // Create a function that executes the code and returns defined variables
      const contextKeys = Object.keys(this.context);
      const contextValues = Object.values(this.context);

      const captureCode = names.map(name =>
        `if (typeof ${name} !== 'undefined') __result.${name} = ${name};`
      ).join('\n');

      const func = new Function(...contextKeys, `
        ${code}
        const __result = {};
        ${captureCode}
        return __result;
      `);

      const result = func(...contextValues);
      Object.assign(this.context, result);
    } catch (e) {
      throw new Error(`Error executing Frontmatter: ${e}`);
    }
  }

  get(name: string): any {
    return this.context[name];
  }

  callMacro(name: string, args: any[]): any {
    const macro = this.context[name];
    if (typeof macro !== 'function') {
      throw new Error(`Macro '${name}' is not defined or not a function.`);
    }
    try {
      return macro(...args);
    } catch (e) {
      throw new Error(`Error executing macro '${name}': ${e}`);
    }
  }
}
