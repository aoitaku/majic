import { describe, it, expect } from 'vitest';
import { transform } from '../src/index';

describe('MaJic Transformer', () => {
  it('should parse simple JSON', () => {
    const input = `{
  key: "value",
  number: 123,
  bool: true
}`;
    const result = transform(input);
    expect(result).toEqual({
      key: "value",
      number: 123,
      bool: true
    });
  });

  it('should execute macros', () => {
    const input = `---
function Say(text) {
  return { type: "Say", text: text };
}
---
{
  event: @Say(Hello)
}`;
    const result = transform(input);
    expect(result).toEqual({
      event: { type: "Say", text: "Hello" }
    });
  });

  it('should erase undefined values', () => {
    const input = `---
function If(cond, val) {
  return cond ? val : undefined;
}
---
{
  a: 1,
  b: @If(false, 2),
  c: @If(true, 3)
}`;
    const result = transform(input);
    expect(result).toEqual({
      a: 1,
      c: 3
    });
  });

  it('should handle arrays with undefined erasure', () => {
    const input = `---
function If(cond, val) {
  return cond ? val : undefined;
}
---
[
  1,
  @If(false, 2),
  3
]`;
    const result = transform(input);
    expect(result).toEqual([1, 3]);
  });
});
