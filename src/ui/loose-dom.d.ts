/**
 * The UI layer was ported from plain JavaScript and leans on a few DOM
 * conveniences (expando props, `.focus()` on query results, `e.target.value`).
 * These declarations keep that code type-checking without rewriting it all at
 * once. New code should prefer proper element types; src/lib and src/data are
 * checked with `strict` and don't rely on this file.
 */
export {};
declare global {
  interface Element {
    focus(options?: FocusOptions): void;
    blur(): void;
    click(): void;
    dataset: DOMStringMap;
    inert: boolean;
    hidden: boolean;
    style: CSSStyleDeclaration;
    offsetParent: Element | null;
    offsetWidth: number;
    clientWidth: number;
    [key: `_${string}`]: any;
  }
  interface Node {
    matches(selectors: string): boolean;
    querySelector(selectors: string): any;
    _release?: any;
  }
  interface EventTarget {
    value?: any;
    checked?: boolean;
    files?: any;
  }
}
