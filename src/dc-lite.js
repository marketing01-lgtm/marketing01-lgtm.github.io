/* dc-lite: chạy các mẫu thiết kế .dc.html (sc-for, sc-if, {{ô}}, onClick...) ở Node (dựng sẵn HTML) và trong trình duyệt (gắn sự kiện, cập nhật từng phần).
   Chỉ hỗ trợ phần bản thiết kế Lenna thật sự dùng: {{đường.dẫn}}, <sc-for>, <sc-if>, onClick/onKeyDown/..., state + setState. */
(function (root, factory) { if (typeof module === 'object' && module.exports) module.exports = factory(); else root.DCLite = factory(); })(typeof self !== 'undefined' ? self : this, function () {
  const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
  const EVENTS = { onClick: 'click', onKeyDown: 'keydown', onKeyUp: 'keyup', onInput: 'input', onChange: 'change', onSubmit: 'submit', onFocus: 'focusin', onBlur: 'focusout' };

  class DCLogic {
    constructor(props) { this.props = props || {}; this.state = {}; this.__host = null; }
    setState(p, cb) { const n = typeof p === 'function' ? p(this.state, this.props) : p; this.state = Object.assign({}, this.state, n); if (this.__host) this.__host.schedule(cb); }
    forceUpdate(cb) { if (this.__host) this.__host.schedule(cb); }
  }

  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /* ---------- đọc mẫu ---------- */
  function parseAttrs(s) {
    const out = [], re = /([^\s=\/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g; let m;
    while ((m = re.exec(s))) out.push(m[2] !== undefined ? [m[1], m[2], '"'] : m[3] !== undefined ? [m[1], m[3], "'"] : m[4] !== undefined ? [m[1], m[4], '"'] : [m[1], null, '']);
    return out;
  }
  function parse(src) {
    const root = { tag: '#root', attrs: [], kids: [] }, stack = [root];
    const re = /<!--[\s\S]*?-->|<(\/?)([A-Za-z][\w:-]*)((?:\s+[^\s=\/>]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>|[^<]+|</g;
    let m;
    while ((m = re.exec(src))) {
      const s = m[0], top = stack[stack.length - 1];
      if (s.startsWith('<!--')) continue;
      if (m[2] === undefined) { top.kids.push({ text: s }); continue; }
      const tag = m[2];
      if (m[1] === '/') { for (let i = stack.length - 1; i > 0; i--) if (stack[i].tag === tag) { stack.length = i; break; } continue; }
      const el = { tag, attrs: parseAttrs(m[3]), kids: [] };
      top.kids.push(el);
      if (tag === 'style' || tag === 'script') { const end = src.indexOf('</' + tag, re.lastIndex); el.kids.push({ text: src.slice(re.lastIndex, end) }); re.lastIndex = src.indexOf('>', end) + 1; continue; }
      if (m[4] !== '/' && !VOID.has(tag.toLowerCase())) stack.push(el);
    }
    return root.kids;
  }

  /* ---------- vẽ ra chuỗi HTML ---------- */
  function get(scope, path) {
    path = path.trim();
    if (path === 'true') return true; if (path === 'false') return false; if (path === 'null' || path === 'undefined') return undefined;
    if (/^-?\d+(\.\d+)?$/.test(path)) return +path;
    const q = /^(['"])(.*)\1$/.exec(path); if (q) return q[2];
    const parts = path.split('.'); let v = scope[parts[0]];
    for (let i = 1; i < parts.length && v != null; i++) v = v[parts[i]];
    return v;
  }
  const HOLE = /\{\{\s*([^}]+?)\s*\}\}/g, WHOLE = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;
  const interp = (s, scope) => s.replace(HOLE, (_, p) => { const v = get(scope, p); return v == null || v === false ? '' : esc(v); });

  function render(nodes, scope, ctx) {
    let out = '';
    for (const n of nodes) {
      if (n.text !== undefined) { out += n.text.indexOf('{{') < 0 ? n.text : interp(n.text, scope); continue; }
      const tag = n.tag;
      if (tag === 'sc-for') {
        const list = get(scope, (WHOLE.exec(attr(n, 'list') || '') || [])[1] || 'x') || [], as = attr(n, 'as') || 'item';
        list.forEach((item, i) => { const s = Object.create(scope); s[as] = item; s.$index = i; out += render(n.kids, s, ctx); });
        continue;
      }
      if (tag === 'sc-if') { if (get(scope, (WHOLE.exec(attr(n, 'value') || '') || [])[1] || 'x')) out += render(n.kids, scope, ctx); continue; }
      let a = '', on = [];
      for (const [name, val, q] of n.attrs) {
        if (val === null) { a += ' ' + name; continue; }
        if (EVENTS[name]) { const w = WHOLE.exec(val), fn = w && get(scope, w[1]); if (typeof fn === 'function') on.push(EVENTS[name] + ':' + (ctx.reg.push(fn) - 1)); continue; }
        if (name.startsWith('hint-')) continue;
        const w = WHOLE.exec(val);
        if (w) { const v = get(scope, w[1]); if (v === true) a += ' ' + name; else if (v != null && v !== false) a += ' ' + name + '="' + esc(v) + '"'; continue; }
        a += val.indexOf('{{') < 0 ? ' ' + name + '=' + q + val + q : ' ' + name + '="' + interp(val, scope) + '"';
      }
      if (on.length) a += ' data-dc-on="' + on.join(' ') + '"';
      out += '<' + tag + a + '>';
      if (VOID.has(tag.toLowerCase())) continue;
      out += render(n.kids, scope, ctx) + '</' + tag + '>';
    }
    return out;
  }
  function attr(n, name) { const a = n.attrs.find(x => x[0] === name); return a ? a[1] : null; }

  // dựng sẵn HTML từ mẫu + lớp Component (dùng ở Node)
  function renderComponent(tpl, Component, props, extra) {
    const inst = new Component(props), ctx = { reg: [] };
    return render(tpl, Object.assign({}, extra, inst.renderVals()), ctx);
  }

  /* ---------- trình duyệt: gắn vào trang, cập nhật từng phần ---------- */
  function morph(o, n) {
    if (o.nodeType !== n.nodeType || o.nodeName !== n.nodeName) { o.replaceWith(n.cloneNode(true)); return; }
    if (o.nodeType === 3 || o.nodeType === 8) { if (o.nodeValue !== n.nodeValue) o.nodeValue = n.nodeValue; return; }
    for (let i = o.attributes.length - 1; i >= 0; i--) if (!n.hasAttribute(o.attributes[i].name)) o.removeAttribute(o.attributes[i].name);
    // o.__spin: linh vật đang được khách kéo xoay (site.js ghi style.rotate); không ghi đè style khi vẽ lại
    for (const a of n.attributes) if (o.getAttribute(a.name) !== a.value && !(a.name === 'style' && o.__spin)) o.setAttribute(a.name, a.value);
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(o.nodeName)) { if ('value' in n && o.value !== n.getAttribute('value') && o !== document.activeElement) o.value = n.getAttribute('value') || ''; }
    morphKids(o, n);
  }
  function morphKids(o, n) {
    const oc = o.childNodes, nc = n.childNodes;
    for (let i = 0; i < nc.length; i++) { if (i < oc.length) morph(oc[i], nc[i]); else o.appendChild(nc[i].cloneNode(true)); }
    while (oc.length > nc.length) o.removeChild(o.lastChild);
  }

  function mount(rootEl, tplSrc, Component, props, extra) {
    const tpl = parse(tplSrc), inst = new Component(props);
    const host = {
      reg: [], pending: false, cbs: [],
      schedule(cb) { if (cb) this.cbs.push(cb); if (this.pending) return; this.pending = true; Promise.resolve().then(() => { this.pending = false; draw(); const c = this.cbs; this.cbs = []; c.forEach(f => f()); }); }
    };
    inst.__host = host;
    function draw() {
      const ctx = { reg: [] }, html = render(tpl, Object.assign({}, extra, inst.renderVals()), ctx);
      host.reg = ctx.reg;
      const t = document.createElement('template'); t.innerHTML = html;
      morphKids(rootEl, t.content);
    }
    const listeners = {};
    Object.values(EVENTS).forEach(ev => { listeners[ev] = e => {
      for (let el = e.target; el && el !== rootEl.parentNode; el = el.parentNode) {
        const d = el.getAttribute && el.getAttribute('data-dc-on'); if (!d) continue;
        for (const p of d.split(' ')) { const [k, id] = p.split(':'); if (k === ev && host.reg[+id]) host.reg[+id].call(inst, e); }
        if (e.cancelBubble) break;
      }
    }; rootEl.addEventListener(ev, listeners[ev], ev === 'focusin' || ev === 'focusout'); });
    if (inst.componentDidMount) inst.componentDidMount();
    draw();
    return { instance: inst, destroy() { if (inst.componentWillUnmount) inst.componentWillUnmount(); Object.entries(listeners).forEach(([ev, f]) => rootEl.removeEventListener(ev, f)); } };
  }

  return { DCLogic, parse, render, renderComponent, mount, esc };
});
