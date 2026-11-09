/* =========================================================
   widgets.js — hàm tiện ích dùng chung cho các công cụ tương tác
   Gắn vào window.XSTK.util và window.XSTK.chart
   ========================================================= */
(function () {
  "use strict";
  var XSTK = (window.XSTK = window.XSTK || {});

  /* ---------- định dạng số kiểu Việt Nam (dấu phẩy thập phân) ---------- */
  function fmt(x, digits) {
    if (typeof x === "bigint") return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    if (!isFinite(x)) return "—";
    var d = digits == null ? 4 : digits;
    return Number(x).toLocaleString("vi-VN", { maximumFractionDigits: d, minimumFractionDigits: 0 });
  }
  function fmtFixed(x, digits) {
    return Number(x).toLocaleString("vi-VN", { maximumFractionDigits: digits, minimumFractionDigits: digits });
  }
  function pct(x, digits) { return fmtFixed(x * 100, digits == null ? 1 : digits) + "%"; }

  /* ---------- phân số ---------- */
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }
  function frac(a, b) {
    if (b === 0) return "—";
    var g = gcd(a, b); a /= g; b /= g;
    if (b < 0) { a = -a; b = -b; }
    return b === 1 ? String(a) : a + "/" + b;
  }
  /* phân số dạng TeX: \frac{a}{b} (đã rút gọn) */
  function texFrac(a, b) {
    var g = gcd(a, b); a /= g; b /= g;
    return b === 1 ? String(a) : "\\frac{" + a + "}{" + b + "}";
  }

  /* ---------- tổ hợp (BigInt để không bị tràn số) ---------- */
  function factorial(n) { var r = 1n; for (var i = 2n; i <= BigInt(n); i++) r *= i; return r; }
  function nAk(n, k) { if (k < 0 || k > n) return 0n; var r = 1n; for (var i = 0; i < k; i++) r *= BigInt(n - i); return r; }
  function nCk(n, k) { if (k < 0 || k > n) return 0n; k = Math.min(k, n - k); var r = 1n; for (var i = 1; i <= k; i++) { r = r * BigInt(n - k + i) / BigInt(i); } return r; }
  function nPowK(n, k) { return BigInt(n) ** BigInt(k); }
  function nCkRep(n, k) { return nCk(n + k - 1, k); }

  /* ---------- thống kê mô tả ---------- */
  function sorted(a) { return a.slice().sort(function (x, y) { return x - y; }); }
  function sum(a) { return a.reduce(function (s, x) { return s + x; }, 0); }
  function mean(a) { return a.length ? sum(a) / a.length : NaN; }
  function median(a) {
    if (!a.length) return NaN;
    var s = sorted(a), m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }
  /* trả về mảng các yếu vị; mảng rỗng nếu mọi giá trị xuất hiện như nhau (không có yếu vị) */
  function modes(a) {
    var c = {}, max = 0;
    a.forEach(function (x) { c[x] = (c[x] || 0) + 1; if (c[x] > max) max = c[x]; });
    var keys = Object.keys(c);
    if (keys.length === 1) return [Number(keys[0])];   /* mọi giá trị giống nhau → chính giá trị đó là yếu vị */
    if (max <= 1 || keys.every(function (k) { return c[k] === max; })) return [];
    return keys.filter(function (k) { return c[k] === max; }).map(Number).sort(function (x, y) { return x - y; });
  }
  function variance(a) { /* phương sai mẫu, chia n − 1 */
    if (a.length < 2) return NaN;
    var m = mean(a);
    return sum(a.map(function (x) { return (x - m) * (x - m); })) / (a.length - 1);
  }
  function sd(a) { return Math.sqrt(variance(a)); }
  function quantile(a, p) { /* nội suy tuyến tính */
    var s = sorted(a), pos = (s.length - 1) * p, lo = Math.floor(pos), hi = Math.ceil(pos);
    return s[lo] + (s[hi] - s[lo]) * (pos - lo);
  }
  /* Đọc dãy số người dùng gõ: "120 125 130", "120; 125; 130", "120, 125, 130", "11,5 12,3" (dấu phẩy thập phân) */
  function parseNumbers(str) {
    var out = [];
    (str || "").split(/[\s;]+|,\s+/).forEach(function (tok) {
      tok = tok.replace(/,$/, "");
      if (!tok) return;
      var parts = (tok.match(/,/g) || []).length > 1 ? tok.split(",") : [tok.replace(",", ".")];
      parts.forEach(function (p) { if (p !== "" && isFinite(Number(p))) out.push(Number(p)); });
    });
    return out;
  }

  /* ---------- ngẫu nhiên ---------- */
  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function sample(arr, k) { return shuffle(arr).slice(0, k); }

  XSTK.util = {
    fmt: fmt, fmtFixed: fmtFixed, pct: pct, gcd: gcd, frac: frac, texFrac: texFrac,
    factorial: factorial, nAk: nAk, nCk: nCk, nPowK: nPowK, nCkRep: nCkRep,
    sorted: sorted, sum: sum, mean: mean, median: median, modes: modes, variance: variance, sd: sd, quantile: quantile,
    parseNumbers: parseNumbers, randInt: randInt, shuffle: shuffle, sample: sample
  };

  /* ---------- SVG ---------- */
  var NS = "http://www.w3.org/2000/svg";
  function svgEl(tag, attrs, parent) {
    var el = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) {
      if (k === "text") el.textContent = attrs[k];
      else el.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(el);
    return el;
  }
  function newSvg(w, h, label) {
    var s = svgEl("svg", { viewBox: "0 0 " + w + " " + h, width: w, height: h, role: "img" });
    if (label) s.setAttribute("aria-label", label);
    s.style.maxWidth = "100%"; s.style.height = "auto";
    return s;
  }

  /* Biểu đồ cột
     XSTK.chart.bar(container, {
       labels: ["0","1","2"], values: [0.13,0.53,0.33],
       valueLabels: ["2/15","8/15","1/3"],   (tuỳ chọn)
       yMax: 1, colorClass: "fill-primary", highlight: 1 (tuỳ chọn), xTitle, yTitle,
       width: 520, height: 280
     }) */
  function bar(container, o) {
    var W = o.width || 520, H = o.height || 280, P = { l: 46, r: 14, t: 18, b: o.xTitle ? 52 : 34 };
    var s = newSvg(W, H, o.label || "Biểu đồ cột");
    var vmax = o.yMax || Math.max.apply(null, o.values.concat([0])) * 1.15 || 1;
    var iw = W - P.l - P.r, ih = H - P.t - P.b, n = o.values.length;
    var ticks = o.yTicks || 4;
    for (var t = 0; t <= ticks; t++) {
      var yv = vmax * t / ticks, y = P.t + ih - ih * t / ticks;
      svgEl("line", { x1: P.l, x2: W - P.r, y1: y, y2: y, class: "svg-grid" }, s);
      svgEl("text", { x: P.l - 6, y: y + 4, "text-anchor": "end", class: "svg-muted", text: o.yFmt ? o.yFmt(yv) : fmt(yv, 2) }, s);
    }
    var bw = iw / n;
    o.values.forEach(function (v, i) {
      var bh = vmax ? ih * v / vmax : 0, x = P.l + i * bw + bw * 0.15, y = P.t + ih - bh;
      var cls = (o.highlight === i ? "fill-accent" : (o.colorClass || "fill-primary"));
      var r = svgEl("rect", { x: x, y: y, width: bw * 0.7, height: Math.max(bh, 0), rx: 6, class: cls }, s);
      if (o.animate && r.animate && !(XSTK.anim && XSTK.anim.reduced)) {
        r.style.transformBox = "fill-box"; r.style.transformOrigin = "50% 100%";
        r.animate([{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }], { duration: 700, delay: i * 90, easing: "cubic-bezier(.34,1.56,.64,1)", fill: "backwards" });
      }
      if (o.titles) svgEl("title", { text: o.titles[i] }, r);
      var lab = o.valueLabels ? o.valueLabels[i] : fmt(v, 3);
      if (lab !== "") svgEl("text", { x: x + bw * 0.35, y: y - 5, "text-anchor": "middle", class: "svg-text svg-bold", "font-size": 13, text: lab }, s);
      svgEl("text", { x: x + bw * 0.35, y: P.t + ih + 18, "text-anchor": "middle", class: "svg-text", "font-size": 13, text: o.labels[i] }, s);
    });
    svgEl("line", { x1: P.l, x2: W - P.r, y1: P.t + ih, y2: P.t + ih, class: "svg-line" }, s);
    if (o.xTitle) svgEl("text", { x: P.l + iw / 2, y: H - 8, "text-anchor": "middle", class: "svg-muted", text: o.xTitle }, s);
    if (o.yTitle) svgEl("text", { x: 12, y: P.t + ih / 2, "text-anchor": "middle", class: "svg-muted", transform: "rotate(-90 12 " + (P.t + ih / 2) + ")", text: o.yTitle }, s);
    container.innerHTML = "";
    container.appendChild(s);
    return s;
  }

  /* Biểu đồ đường
     XSTK.chart.line(container, {
       series: [{ points: [[x,y],...], cls: "stroke-a" }],
       xMin, xMax, yMin, yMax, refY: 1/6, refLabel: "1/6", xTitle, yTitle, width, height, yFmt
     }) */
  function line(container, o) {
    var W = o.width || 560, H = o.height || 280, P = { l: 50, r: 16, t: 16, b: o.xTitle ? 50 : 32 };
    var s = newSvg(W, H, o.label || "Biểu đồ đường");
    var iw = W - P.l - P.r, ih = H - P.t - P.b;
    var xMin = o.xMin != null ? o.xMin : 0, xMax = o.xMax != null ? o.xMax : 1;
    var yMin = o.yMin != null ? o.yMin : 0, yMax = o.yMax != null ? o.yMax : 1;
    function X(x) { return P.l + (x - xMin) / ((xMax - xMin) || 1) * iw; }
    function Y(y) { return P.t + ih - (y - yMin) / ((yMax - yMin) || 1) * ih; }
    var ticks = o.yTicks || 4;
    for (var t = 0; t <= ticks; t++) {
      var yv = yMin + (yMax - yMin) * t / ticks;
      svgEl("line", { x1: P.l, x2: W - P.r, y1: Y(yv), y2: Y(yv), class: "svg-grid" }, s);
      svgEl("text", { x: P.l - 6, y: Y(yv) + 4, "text-anchor": "end", class: "svg-muted", text: o.yFmt ? o.yFmt(yv) : fmt(yv, 2) }, s);
    }
    svgEl("text", { x: X(xMin), y: P.t + ih + 18, "text-anchor": "start", class: "svg-muted", text: fmt(xMin, 0) }, s);
    svgEl("text", { x: X(xMax), y: P.t + ih + 18, "text-anchor": "end", class: "svg-muted", text: fmt(xMax, 0) }, s);
    if (o.refY != null) {
      svgEl("line", { x1: P.l, x2: W - P.r, y1: Y(o.refY), y2: Y(o.refY), class: "stroke-danger svg-dash", "stroke-width": 2 }, s);
      if (o.refLabel) svgEl("text", { x: W - P.r - 4, y: Y(o.refY) - 6, "text-anchor": "end", class: "fill-danger", "font-size": 13, "font-weight": 700, text: o.refLabel }, s);
    }
    (o.series || []).forEach(function (se) {
      if (!se.points.length) return;
      var d = se.points.map(function (p, i) { return (i ? "L" : "M") + X(p[0]).toFixed(1) + " " + Y(Math.max(yMin, Math.min(yMax, p[1]))).toFixed(1); }).join(" ");
      var pth = svgEl("path", { d: d, class: (se.cls || "stroke-primary"), fill: "none", "stroke-width": se.width || 2.6, "stroke-linejoin": "round", "stroke-linecap": "round" }, s);
      if (o.animate && XSTK.anim) setTimeout(function () { XSTK.anim.drawPath(pth, 900); }, 0);
    });
    svgEl("line", { x1: P.l, x2: W - P.r, y1: P.t + ih, y2: P.t + ih, class: "svg-line" }, s);
    svgEl("line", { x1: P.l, x2: P.l, y1: P.t, y2: P.t + ih, class: "svg-line" }, s);
    if (o.xTitle) svgEl("text", { x: P.l + iw / 2, y: H - 8, "text-anchor": "middle", class: "svg-muted", text: o.xTitle }, s);
    if (o.yTitle) svgEl("text", { x: 12, y: P.t + ih / 2, "text-anchor": "middle", class: "svg-muted", transform: "rotate(-90 12 " + (P.t + ih / 2) + ")", text: o.yTitle }, s);
    container.innerHTML = "";
    container.appendChild(s);
    return s;
  }

  XSTK.svg = { el: svgEl, create: newSvg, NS: NS };
  XSTK.chart = { bar: bar, line: line };
})();
