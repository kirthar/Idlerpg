// ─── Mini-helpers de DOM ─────────────────────────────────────────────────────

export function $(sel: string): HTMLElement {
  const el = document.querySelector<HTMLElement>(sel);
  if (!el) throw new Error(`No existe el elemento ${sel}`);
  return el;
}

export function el(tag: string, className = '', html = ''): HTMLElement {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (html) e.innerHTML = html;
  return e;
}
