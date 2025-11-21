import { parse } from 'majic-grammar';
import { Context } from './context';
import { Transformer } from './transformer';

export interface TransformOptions {
  // Future options
}

export function transform(input: string, _options?: TransformOptions): any {
  // 1. Split Frontmatter
  const parts = input.split(/^---$/m);
  let frontmatter = '';
  let content = input;

  if (parts.length >= 3) {
    // Has frontmatter
    frontmatter = parts[1].trim();
    content = parts.slice(2).join('---').trim();
  }

  // 2. Setup Context
  const context = new Context();
  if (frontmatter.trim()) {
    context.execute(frontmatter);
  }

  // 3. Parse
  let ast;
  try {
    ast = parse(content);
  } catch (e) {
    throw new Error(`Parse Error: ${e}`);
  }

  // 4. Transform
  const transformer = new Transformer(context);
  return transformer.transform(ast);
}
