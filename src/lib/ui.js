export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);

  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null) continue;
    if (k === "class") node.className = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2).toLowerCase(), v);
    else node.setAttribute(k, String(v));
  }

  for (const child of children.flat()) {
    if (child == null) continue;
    if (child.nodeType) node.append(child);
    else node.append(document.createTextNode(String(child)));
  }

  return node;
}

export function mount(root, node) {
  root.innerHTML = "";
  root.append(node);
}

export function setText(node, text) {
  if (!node) return;
  node.textContent = text ?? "";
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
