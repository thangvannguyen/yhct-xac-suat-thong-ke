/* =========================================================
   bai-8.js — Bài 8: Mẫu và thống kê mô tả
   - Hình chiếu từng bước (anim.js, data-anim="steps"):
       Hình 1 quần thể → mẫu → suy luận, Hình 2 cây biến số,
       Hình 3 gạch đếm → tần số → histogram, Hình 4 dựng boxplot,
       Hình 5 biểu đồ chấm.
   - Hình nhỏ cho 9 cách chọn mẫu: tự diễn lại THỨ TỰ chọn.
   - Histogram Hb tương tác và 3 trò chơi.
   ========================================================= */
(function () {
  "use strict";
  var X = window.XSTK || {};
  var U = X.util, SV = X.svg;
  var el = SV.el;
  var EASE = "cubic-bezier(.2,.8,.2,1)";

  /* ---------- tiện ích ---------- */
  function byId(id) { return document.getElementById(id); }
  /* số ngẫu nhiên có "hạt giống" → hình vẽ giống nhau mỗi lần tải trang */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(R) {
    var u = 1 - R(), v = R();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function seededShuffle(arr, R) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(R() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function addMarker(svg, id, cls, size) {
    var defs = el("defs", null, svg);
    var m = el("marker", { id: id, viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: size || 7, markerHeight: size || 7, orient: "auto-start-reverse" }, defs);
    el("path", { d: "M0,0 L10,5 L0,10 z", class: cls || "fill-text" }, m);
  }
  /* chữ trong SVG. Cỡ chữ đặt bằng style (lớp .svg-text/.svg-muted có font-size trong CSS sẽ đè thuộc tính font-size) */
  function txt(svg, x, y, s, cls, extra) {
    var a = { x: x, y: y, class: cls || "svg-text", text: s };
    if (extra) for (var k in extra) {
      if (k === "font-size") a.style = "font-size:" + extra[k] + "px";
      else a[k] = extra[k];
    }
    return el("text", a, svg);
  }
  function mount(container, svg) { container.innerHTML = ""; container.appendChild(svg); }

  /* ---------- hỗ trợ hiệu ứng ---------- */
  /* có được chạy chuyển động không (tôn trọng "giảm chuyển động" và ?static=1) */
  function moving() { return !!(X.anim && !X.anim.reduced && document.body.animate); }
  function pulse(e) { if (moving() && X.anim.pulse) X.anim.pulse(e); }
  function stopAnims(list) {
    list.forEach(function (e) { if (e && e.getAnimations) e.getAnimations().forEach(function (a) { a.cancel(); }); });
  }
  /* gọi cb(k, prev) mỗi khi hình chiếu từng bước đổi sang bước k (prev = null ở lần đầu) */
  function onStep(fig, cb) {
    if (!fig || !("MutationObserver" in window)) return;
    var last = null;
    var mo = new MutationObserver(function () {
      var c = fig.querySelector("[data-caption].cap-on");
      var k = c ? parseInt(c.getAttribute("data-caption"), 10) : null;
      if (k === null || k === last) return;
      var prev = last; last = k;
      cb(k, prev);
    });
    Array.prototype.forEach.call(fig.querySelectorAll("[data-caption]"), function (c) {
      mo.observe(c, { attributes: true, attributeFilter: ["class"] });
    });
  }
  /* bước s vừa được "đi tới" (tiến lên) */
  function entered(s, k, prev) { return prev !== null && prev < s && k >= s; }
  /* cho 1 con số "bay" từ phần tử này sang phần tử khác (dùng được giữa 2 hình SVG khác nhau) */
  function flyLabel(fig, fromEl, toEl, text, delay, dur) {
    var fr = fig.getBoundingClientRect(), a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
    if (!a.width || !b.width) return;
    var sp = document.createElement("span");
    sp.className = "b8-fly"; sp.textContent = text;
    sp.style.fontSize = Math.max(12, Math.round(a.height * 0.9)) + "px";
    sp.style.left = "0"; sp.style.top = "0"; sp.style.visibility = "hidden";
    fig.appendChild(sp);
    var w = sp.offsetWidth, h = sp.offsetHeight;
    var x0 = a.left - fr.left + a.width / 2 - w / 2, y0 = a.top - fr.top + a.height / 2 - h / 2;
    var dx = (b.left + b.width / 2) - (a.left + a.width / 2), dy = (b.top + b.height / 2) - (a.top + a.height / 2);
    sp.style.left = x0 + "px"; sp.style.top = y0 + "px"; sp.style.visibility = "";
    var an = sp.animate([
      { transform: "translate(0,0) scale(.6)", opacity: 0 },
      { transform: "translate(0,0) scale(1.15)", opacity: 1, offset: 0.18 },
      { transform: "translate(" + dx + "px," + dy + "px) scale(1)", opacity: 1, offset: 0.88 },
      { transform: "translate(" + dx + "px," + dy + "px) scale(.9)", opacity: 0 }
    ], { duration: dur, delay: delay, easing: "cubic-bezier(.45,.05,.25,1)", fill: "both" });
    an.onfinish = an.oncancel = function () { sp.remove(); };
  }
  /* 1 chấm chạy dọc theo đường path (chỉ hướng đi của mũi tên) */
  function travel(path, svg, dur, delay, then) {
    var len = path.getTotalLength ? path.getTotalLength() : 0;
    if (!len) return;
    setTimeout(function () {
      var dot = el("circle", { r: 5.5, cx: -20, cy: -20, class: "fill-primary" }, svg), t0 = null;
      requestAnimationFrame(function step(now) {
        if (t0 === null) t0 = now;
        var p = Math.min(1, (now - t0) / dur), e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        var pt = path.getPointAtLength(e * len);
        dot.setAttribute("cx", pt.x); dot.setAttribute("cy", pt.y);
        if (p < 1) requestAnimationFrame(step);
        else { dot.remove(); if (then) pulse(then); }
      });
    }, delay);
  }

  /* =====================================================
     Hình 1. Quần thể → mẫu → suy luận (chiếu từng bước)
     B1 bốc thăm 10 người · B2 họ "bay" vào mẫu · B3 thống kê · B4 suy luận ngược lại
     ===================================================== */
  function drawPopSample() {
    var box = byId("fig-pop-sample");
    if (!box) return;
    var W = 380, H = 378;
    var s = SV.create(W, H, "Quần thể và mẫu: bốc thăm ngẫu nhiên một mẫu, rồi suy luận ngược lại cho quần thể");
    addMarker(s, "b8-arr-pop", "fill-text");
    addMarker(s, "b8-arr-inf", "fill-primary");

    el("rect", { x: 10, y: 10, width: 360, height: 215, rx: 18, class: "fill-primary-soft stroke-primary", "stroke-width": 2 }, s);
    txt(s, 28, 38, "QUẦN THỂ – N người", "svg-text svg-bold", { "font-size": 16 });

    var R = rng(8), pts = [], tries = 0;
    while (pts.length < 64 && tries < 6000) {
      tries++;
      var x = 32 + R() * 316, y = 62 + R() * 148;
      var ok = pts.every(function (p) { return (p[0] - x) * (p[0] - x) + (p[1] - y) * (p[1] - y) > 17 * 17; });
      if (ok) pts.push([x, y]);
    }
    pts.forEach(function (p) { el("circle", { cx: p[0], cy: p[1], r: 6, class: "fill-a op-50" }, s); });
    var chosen = seededShuffle(pts.map(function (_, i) { return i; }), rng(3)).slice(0, 10);

    /* B1: 10 người trúng thăm */
    var gPick = el("g", { "data-step": "1" }, s);
    chosen.forEach(function (i) { el("circle", { cx: pts[i][0], cy: pts[i][1], r: 7, class: "fill-accent stroke-text", "stroke-width": 2 }, gPick); });

    /* B2: mẫu */
    var gS = el("g", { "data-step": "2" }, s);
    el("line", { x1: 190, y1: 228, x2: 190, y2: 268, class: "svg-line", "marker-end": "url(#b8-arr-pop)" }, gS);
    txt(gS, 182, 253, "chọn mẫu ngẫu nhiên", "svg-muted", { "font-size": 14, "text-anchor": "end" });
    el("rect", { x: 105, y: 274, width: 170, height: 94, rx: 16, class: "fill-surface stroke-accent", "stroke-width": 2 }, gS);
    txt(gS, 190, 297, "MẪU – n người", "svg-text svg-bold", { "text-anchor": "middle", "font-size": 15 });
    var order = chosen.slice().sort(function (a, b) { return pts[a][0] - pts[b][0]; });
    var flights = order.map(function (pi, k) {
      var fx = 140 + Math.floor(k / 2) * 25, fy = 321 + (k % 2) * 26;
      var c = el("circle", { cx: fx, cy: fy, r: 7, class: "fill-accent stroke-text", "stroke-width": 2 }, gS);
      return { el: c, dx: pts[pi][0] - fx, dy: pts[pi][1] - fy };
    });

    /* B3: thống kê tính trên mẫu */
    var gT = el("g", { "data-step": "3" }, s);
    txt(gT, 97, 316, "thống kê", "fill-accent svg-bold", { "font-size": 15, "text-anchor": "end" });
    txt(gT, 97, 336, "(tính được)", "svg-muted", { "font-size": 14, "text-anchor": "end" });

    /* B4: suy luận ngược lại cho quần thể */
    var gI = el("g", { "data-step": "4" }, s);
    var inf = el("path", { d: "M277 320 C 345 320 352 292 352 232", class: "stroke-primary", fill: "none", "stroke-width": 2, "stroke-dasharray": "5 4", "marker-end": "url(#b8-arr-inf)" }, gI);
    txt(gI, 306, 254, "suy luận", "fill-primary svg-bold", { "font-size": 14, "text-anchor": "middle" });
    var param = txt(gI, 352, 38, "tham số: chưa biết", "fill-primary svg-bold", { "font-size": 14, "text-anchor": "end" });
    mount(box, s);

    onStep(box.closest("figure"), function (k, prev) {
      if (!moving()) return;
      if (entered(2, k, prev)) {
        flights.forEach(function (f, i) {
          stopAnims([f.el]);
          f.el.animate([{ transform: "translate(" + f.dx + "px," + f.dy + "px)" }, { transform: "translate(0,0)" }],
            { duration: 800, delay: 300 + i * 110, easing: "cubic-bezier(.5,0,.2,1)", fill: "backwards" });
        });
      }
      if (entered(4, k, prev)) travel(inf, s, 950, 250, param);
    });
  }

  /* =====================================================
     Hình 2. Cây phân loại biến số: viền sáng lá vừa xuất hiện
     ===================================================== */
  function treeFocus() {
    var fig = document.querySelector("figure.vtree");
    if (!fig) return;
    onStep(fig, function (k, prev) {
      Array.prototype.forEach.call(fig.querySelectorAll(".vt-leaf"), function (l) {
        l.classList.toggle("vt-now", prev !== null && parseInt(l.getAttribute("data-step"), 10) === k);
      });
    });
  }

  /* =====================================================
     Hình 3. Gạch đếm → tần số → histogram (Hb của 70 phụ nữ)
     ===================================================== */
  var HB = [1, 3, 14, 19, 14, 13, 5, 1], HB_N = 70;
  function hbLabel(i) { return (8 + i) + " – " + (8 + i) + ",9"; }

  function hbBuild() {
    var tBox = byId("hb-tally"), hBox = byId("hb-build");
    if (!tBox || !hBox) return;
    var fig = tBox.closest("figure");

    /* --- bảng: khoảng | gạch đếm | tần số --- */
    var TW = 262, TH = 280, s1 = SV.create(TW, TH, "Bảng gạch đếm và tần số Hemoglobin của 70 phụ nữ");
    function rowY(i) { return 48 + i * 26; }
    txt(s1, 8, 20, "Hb (g/dl)", "svg-muted svg-bold", { "font-size": 13 });
    txt(s1, 84, 20, "Gạch đếm", "svg-muted svg-bold", { "font-size": 13 });
    txt(s1, 256, 20, "Tần số", "svg-muted svg-bold", { "font-size": 13, "text-anchor": "end", "data-step": "2" });
    el("line", { x1: 0, x2: TW, y1: 31, y2: 31, class: "svg-grid" }, s1);
    var hl = [];
    HB.forEach(function (f, i) {
      if (i % 2 === 0) el("rect", { x: 0, y: rowY(i) - 13, width: TW, height: 26, rx: 7, class: "fill-soft" }, s1);
      hl.push(el("rect", { x: 0, y: rowY(i) - 13, width: TW, height: 26, rx: 7, class: "fill-primary op-25", style: "opacity:0" }, s1));
      txt(s1, 8, rowY(i) + 5, hbLabel(i), "svg-text", { "font-size": 13 });
    });
    /* gạch đếm theo đúng thứ tự "đọc từng số liệu": các vạch hiện lần lượt, nhảy qua lại giữa các dòng */
    var reading = [];
    HB.forEach(function (f, i) { for (var k = 0; k < f; k++) reading.push(i); });
    reading = seededShuffle(reading, rng(70));
    var gT = el("g", { "data-step": "1" }, s1), seen = HB.map(function () { return 0; });
    reading.forEach(function (i) {
      var k = seen[i]++, x0 = 86 + Math.floor(k / 5) * 26, m = k % 5, y = rowY(i);
      if (m < 4) el("line", { x1: x0 + m * 5, x2: x0 + m * 5, y1: y - 7, y2: y + 7, class: "stroke-text", "stroke-width": 2, "stroke-linecap": "round" }, gT);
      else el("line", { x1: x0 - 3, x2: x0 + 18, y1: y + 6, y2: y - 6, class: "stroke-danger", "stroke-width": 2, "stroke-linecap": "round" }, gT);
    });
    var gC = el("g", { "data-step": "2" }, s1);
    var cnt = HB.map(function (f, i) { return txt(gC, 232, rowY(i) + 5, String(f), "fill-primary svg-bold", { "font-size": 15, "text-anchor": "middle" }); });
    el("line", { x1: 0, x2: TW, y1: rowY(7) + 17, y2: rowY(7) + 17, class: "svg-line-muted" }, gC);
    txt(gC, 8, rowY(7) + 38, "Tổng", "svg-text svg-bold", { "font-size": 14 });
    txt(gC, 232, rowY(7) + 38, String(HB_N), "svg-text svg-bold", { "font-size": 15, "text-anchor": "middle" });
    mount(tBox, s1);

    /* --- histogram --- */
    var HW = 300, HH = 280, L = 36, Rr = 10, base = 230, UH = 9.4, bw = (HW - L - Rr) / 8;
    var s2 = SV.create(HW, HH, "Histogram Hemoglobin dựng từ bảng tần số");
    function Yc(c) { return base - c * UH; }
    function Xb(i) { return L + i * bw; }
    [0, 5, 10, 15, 20].forEach(function (t) {
      el("line", { x1: L, x2: HW - Rr, y1: Yc(t), y2: Yc(t), class: "svg-grid" }, s2);
      txt(s2, L - 6, Yc(t) + 4, String(t), "svg-muted", { "text-anchor": "end", "font-size": 12 });
    });
    var ym = (Yc(20) + base) / 2;
    txt(s2, 11, ym, "Số phụ nữ", "svg-muted", { "text-anchor": "middle", "font-size": 12, transform: "rotate(-90 11 " + ym + ")" });
    var gB = el("g", { "data-step": "3" }, s2);
    var bars = HB.map(function (f, i) {
      return el("rect", { x: Xb(i), y: Yc(f), width: bw, height: f * UH, class: "fill-primary", style: "stroke:var(--surface);stroke-width:1.5" }, gB);
    });
    /* B5: cộng dồn 4 cột đầu */
    var gCum = el("g", { "data-step-only": "5" }, s2);
    for (var c = 0; c < 4; c++) el("rect", { x: Xb(c), y: Yc(HB[c]), width: bw, height: HB[c] * UH, class: "fill-accent", style: "stroke:var(--surface);stroke-width:1.5" }, gCum);
    el("path", { d: "M" + (Xb(0) + 2) + " " + (base + 22) + " V" + (base + 27) + " H" + (Xb(4) - 2) + " V" + (base + 22), class: "stroke-accent", fill: "none", "stroke-width": 2 }, gCum);
    txt(gCum, (Xb(0) + Xb(4)) / 2, base + 44, "37 người = 52,86%", "fill-accent svg-bold", { "font-size": 13, "text-anchor": "middle" });
    /* trục */
    el("line", { x1: L, x2: HW - Rr, y1: base, y2: base, class: "svg-line" }, s2);
    el("line", { x1: L, x2: L, y1: Yc(20), y2: base, class: "svg-line" }, s2);
    for (var v = 8; v <= 16; v++) txt(s2, Xb(v - 8), base + 17, String(v), "svg-text", { "text-anchor": "middle", "font-size": 12 });
    txt(s2, HW - Rr, base + 44, "Hb (g/dl)", "svg-muted", { "text-anchor": "end", "font-size": 12 });
    var gL = el("g", { "data-step": "3" }, s2);
    var bl = HB.map(function (f, i) { return txt(gL, Xb(i) + bw / 2, Yc(f) - 6, String(f), "svg-text svg-bold", { "font-size": 13, "text-anchor": "middle" }); });
    /* B4: cột cao nhất + dáng hình chuông */
    var g4 = el("g", { "data-step-only": "4" }, s2);
    el("rect", { x: Xb(3) + 1.5, y: Yc(19) + 1.5, width: bw - 3, height: 19 * UH - 3, rx: 3, class: "fill-none stroke-accent", "stroke-width": 3 }, g4);
    var d = "";
    for (var hx = 8; hx <= 16.001; hx += 0.1) {
      var z = (hx - 11.98) / 1.416, dens = HB_N * Math.exp(-z * z / 2) / (1.416 * Math.sqrt(2 * Math.PI));
      d += (d ? " L" : "M") + (L + (hx - 8) * bw).toFixed(1) + " " + Yc(dens).toFixed(1);
    }
    el("path", { d: d, class: "stroke-accent", fill: "none", "stroke-width": 2.5, "stroke-linecap": "round" }, g4);
    txt(g4, Xb(6.5), 80, "gần hình chuông", "fill-accent svg-bold", { "font-size": 12, "text-anchor": "middle" });
    mount(hBox, s2);

    onStep(fig, function (k, prev) {
      if (!moving() || !entered(3, k, prev)) return;
      stopAnims(bars.concat(bl));
      HB.forEach(function (f, i) {
        var t = 250 + i * 300;
        hl[i].animate([{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], { duration: 800, delay: t });
        flyLabel(fig, cnt[i], bl[i], String(f), t, 800);
        bars[i].style.transformBox = "fill-box"; bars[i].style.transformOrigin = "50% 100%";
        bars[i].animate([{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }], { duration: 520, delay: t + 560, easing: EASE, fill: "backwards" });
        bl[i].animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: t + 700, fill: "backwards" });
      });
    });
  }

  /* =====================================================
     Histogram Hb tương tác (công cụ)
     ===================================================== */
  function hbWidget() {
    var box = byId("hb-hist"), info = byId("hb-info");
    if (!box) return;
    var mode = "count", cum = false, sel = -1;
    var CUM = [], acc = 0;
    HB.forEach(function (f) { acc += f; CUM.push(acc); });

    function draw() {
      /* bề rộng hình theo khung chứa → chữ không bị quá nhỏ trên điện thoại */
      var W = Math.max(340, Math.min(560, box.clientWidth || 520)), H = 320, P = { l: 52, r: cum ? 56 : 18, t: 24, b: 58 };
      var s = SV.create(W, H, "Histogram Hemoglobin của 70 phụ nữ");
      var iw = W - P.l - P.r, ih = H - P.t - P.b;
      var yMax = mode === "count" ? 20 : 30, step = mode === "count" ? 5 : 10;
      function Xs(v) { return P.l + (v - 8) / 8 * iw; }
      function Ys(v) { return P.t + ih - v / yMax * ih; }
      for (var t = 0; t <= yMax; t += step) {
        el("line", { x1: P.l, x2: W - P.r, y1: Ys(t), y2: Ys(t), class: "svg-grid" }, s);
        txt(s, P.l - 6, Ys(t) + 5, mode === "count" ? String(t) : t + "%", "svg-muted", { "text-anchor": "end", "font-size": 13 });
      }
      HB.forEach(function (f, i) {
        var v = mode === "count" ? f : f / HB_N * 100;
        var rect = el("rect", {
          x: Xs(8 + i), y: Ys(v), width: Xs(9 + i) - Xs(8 + i), height: P.t + ih - Ys(v),
          class: "bar " + (i === sel ? "fill-accent" : "fill-primary"), style: "stroke:var(--surface);stroke-width:1.5"
        }, s);
        el("title", { text: hbLabel(i) + " g/dl: " + f + " người" }, rect);
        rect.addEventListener("click", function () { sel = i; draw(); showInfo(i); });
        txt(s, (Xs(8 + i) + Xs(9 + i)) / 2, Ys(v) - 6, mode === "count" ? String(f) : U.fmtFixed(v, 1),
          "svg-text svg-bold", { "text-anchor": "middle", "font-size": 13 });
      });
      for (var v = 8; v <= 16; v++) txt(s, Xs(v), P.t + ih + 19, String(v), "svg-text", { "text-anchor": "middle", "font-size": 13 });
      el("line", { x1: P.l, x2: W - P.r, y1: P.t + ih, y2: P.t + ih, class: "svg-line" }, s);
      el("line", { x1: P.l, x2: P.l, y1: P.t, y2: P.t + ih, class: "svg-line" }, s);
      txt(s, P.l + iw / 2, H - 12, "Hemoglobin (g/dl)", "svg-muted", { "text-anchor": "middle", "font-size": 13 });
      var yt = mode === "count" ? "Số phụ nữ" : "Phần trăm";
      txt(s, 14, P.t + ih / 2, yt, "svg-muted", { "text-anchor": "middle", "font-size": 13, transform: "rotate(-90 14 " + (P.t + ih / 2) + ")" });

      if (cum) {
        var Yc = function (p) { return P.t + ih - p / 100 * ih; };
        [0, 25, 50, 75, 100].forEach(function (p) {
          txt(s, W - P.r + 6, Yc(p) + 5, p + "%", "fill-danger", { "font-size": 12 });
        });
        var pts = [[8, 0]].concat(CUM.map(function (c, i) { return [9 + i, c / HB_N * 100]; }));
        var d = pts.map(function (p, i) { return (i ? "L" : "M") + Xs(p[0]).toFixed(1) + " " + Yc(p[1]).toFixed(1); }).join(" ");
        el("path", { d: d, class: "stroke-danger", fill: "none", "stroke-width": 2.5, "stroke-linejoin": "round" }, s);
        pts.forEach(function (p) { el("circle", { cx: Xs(p[0]), cy: Yc(p[1]), r: 3.5, class: "fill-danger" }, s); });
        txt(s, Xs(15.6), Yc(100) - 8, "% tích luỹ", "fill-danger svg-bold", { "text-anchor": "end", "font-size": 13 });
      }
      mount(box, s);
    }

    function showInfo(i) {
      var pct = HB[i] / HB_N * 100, cp = CUM[i] / HB_N * 100;
      info.innerHTML = "Khoảng <b>" + hbLabel(i) + " g/dl</b>: <b>" + HB[i] + "</b> người = " + HB[i] + "/70 = <b>" +
        U.fmtFixed(pct, 2) + "%</b>. Cộng dồn từ khoảng đầu đến hết khoảng này: <b>" + CUM[i] + "</b> người = <b>" +
        U.fmtFixed(cp, 2) + "%</b>.";
    }

    Array.prototype.forEach.call(document.querySelectorAll("[data-hbmode]"), function (b) {
      b.addEventListener("click", function () {
        mode = b.getAttribute("data-hbmode");
        Array.prototype.forEach.call(document.querySelectorAll("[data-hbmode]"), function (x) { x.classList.toggle("is-on", x === b); });
        draw();
      });
    });
    var lastW = box.clientWidth, rt = 0;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () { if (Math.abs(box.clientWidth - lastW) > 30) { lastW = box.clientWidth; draw(); } }, 200);
    });
    var cb = byId("hb-cum");
    if (cb) cb.addEventListener("click", function () { cum = !cum; cb.classList.toggle("is-on", cum); draw(); });
    draw();
  }

  /* =====================================================
     Hình nhỏ cho từng phương pháp chọn mẫu
     Mỗi hình tự diễn lại THỨ TỰ chọn (1 lần khi cuộn tới, bấm nút tròn để xem lại),
     kèm 1 dòng lời kể ngay dưới hình.
     ===================================================== */
  var MG = { cols: 8, rows: 5, W: 200, H: 132 };
  function mgPos(i) { return [22 + (i % MG.cols) * 22, 18 + Math.floor(i / MG.cols) * 24]; }
  function starPath(cx, cy, R, r) {
    var d = "";
    for (var k = 0; k < 10; k++) {
      var rad = k % 2 ? r : R, a = -Math.PI / 2 + k * Math.PI / 5;
      d += (k ? "L" : "M") + (cx + rad * Math.cos(a)).toFixed(1) + " " + (cy + rad * Math.sin(a)).toFixed(1);
    }
    return d + "Z";
  }
  var SMP_SUMMARY = {
    simple: "8 người được bốc thăm, rải khắp danh sách. Ai cũng có cơ hội như nhau.",
    systematic: "Chọn số 2, 7, 12, …, 37: cứ cách đều <b>k = 5</b> người chọn 1.",
    stratified: "Tầng nào cũng có người: <b>mọi tầng, mỗi tầng một ít</b>.",
    cluster: "Chỉ 2 cụm trúng thăm, nhưng <b>cụm nào trúng thì lấy hết</b>.",
    multistage: "Chọn qua 2 bậc: chọn <b>cụm</b> trước, rồi chọn <b>người</b> trong cụm.",
    purposive: "5 người do người nghiên cứu <b>tự chọn</b>, không bốc thăm.",
    convenience: "Toàn người ngồi gần cửa: nhanh, nhưng <b>mẫu lệch</b>.",
    quota: "Đủ 4 xanh + 4 hồng, nhưng là người <b>gặp trước</b>, không bốc thăm.",
    snowball: "Người này giới thiệu người kia: mẫu lớn dần như <b>hòn tuyết lăn</b>."
  };

  function miniGrid(container, pattern, slot) {
    var s = SV.create(MG.W, MG.H, "Minh hoạ cách chọn mẫu");
    var N = MG.cols * MG.rows, sel = {}, color = function () { return "fill-a"; };
    var shape = function () { return "circle"; };
    var clusters = [], clusterOn = {}, bands = [], arrows = [], door = null, list = [];
    function mark(l) { list = l.slice(); l.forEach(function (i) { sel[i] = true; }); }
    function clusterRect(k, chosen) {
      clusterOn[k] = chosen;
      clusters[k] = el("rect", { x: 22 + 2 * k * 22 - 11, y: 5, width: 44, height: 122, rx: 9, fill: "none", "stroke-width": 2 }, s);
    }
    function paintCluster(k, on) {
      var dashed = pattern === "multistage" || !on;
      clusters[k].setAttribute("class", on ? "stroke-accent" : "stroke-muted");
      if (dashed) clusters[k].setAttribute("stroke-dasharray", "4 3"); else clusters[k].removeAttribute("stroke-dasharray");
    }

    switch (pattern) {
      case "simple":
        mark([3, 9, 12, 18, 22, 29, 33, 38]);
        break;
      case "systematic":
        mark([1, 6, 11, 16, 21, 26, 31, 36]);
        break;
      case "stratified":
        color = function (i) { var r = Math.floor(i / MG.cols); return r < 2 ? "fill-a" : r < 4 ? "fill-b" : "fill-c"; };
        bands.push(el("rect", { x: 8, y: 4, width: 184, height: 46, rx: 8, class: "fill-a op-15" }, s));
        bands.push(el("rect", { x: 8, y: 52, width: 184, height: 46, rx: 8, class: "fill-b op-15" }, s));
        bands.push(el("rect", { x: 8, y: 100, width: 184, height: 28, rx: 8, class: "fill-c op-15" }, s));
        mark([1, 6, 12, 18, 23, 29, 34, 38]);
        break;
      case "cluster":
        for (var k = 0; k < 4; k++) clusterRect(k, k === 1 || k === 3);
        for (var i = 0; i < N; i++) { var c = Math.floor((i % MG.cols) / 2); if (c === 1 || c === 3) sel[i] = true; }
        break;
      case "multistage":
        for (var k2 = 0; k2 < 4; k2++) clusterRect(k2, k2 === 0 || k2 === 2);
        mark([1, 16, 33, 12, 29, 36]);
        break;
      case "purposive":
        var stars = [5, 11, 20, 26, 33];
        shape = function (i) { return stars.indexOf(i) !== -1 ? "star" : "circle"; };
        mark(stars);
        break;
      case "convenience":
        door = el("rect", { x: 1, y: 6, width: 7, height: 40, rx: 2, class: "fill-accent" }, s);
        mark([0, 1, 2, 8, 9, 10, 16, 17]);
        /* ai gần cửa hơn thì được hỏi trước */
        list.sort(function (a, b) {
          var pa = mgPos(a), pb = mgPos(b);
          return Math.hypot(pa[0] - 4, pa[1] - 26) - Math.hypot(pb[0] - 4, pb[1] - 26);
        });
        break;
      case "quota":
        var R = rng(21), sex = [];
        for (var q = 0; q < N; q++) sex.push(R() < 0.5 ? "fill-a" : "fill-d");
        color = function (i) { return sex[i]; };
        var na = 0, nd = 0;
        for (var q2 = 0; q2 < N && (na < 4 || nd < 4); q2++) {
          if (sex[q2] === "fill-a" && na < 4) { sel[q2] = true; na++; }
          else if (sex[q2] === "fill-d" && nd < 4) { sel[q2] = true; nd++; }
          list.push(q2); /* thứ tự "đi qua" từng người */
        }
        break;
      case "snowball":
        var chain = [9, 12, 21, 27, 30, 36];
        var mid = "b8-snow-" + pattern + "-" + slot;
        addMarker(s, mid, "fill-accent", 4.5);
        for (var c2 = 0; c2 < chain.length - 1; c2++) {
          var p1 = mgPos(chain[c2]), p2 = mgPos(chain[c2 + 1]);
          var dx = p2[0] - p1[0], dy = p2[1] - p1[1], Ln = Math.sqrt(dx * dx + dy * dy);
          arrows.push(el("line", {
            x1: p1[0] + dx / Ln * 9, y1: p1[1] + dy / Ln * 9, x2: p2[0] - dx / Ln * 10, y2: p2[1] - dy / Ln * 10,
            class: "stroke-accent", "stroke-width": 2, "marker-end": "url(#" + mid + ")"
          }, s));
        }
        mark(chain);
        break;
    }

    var dots = [];
    for (var j = 0; j < N; j++) {
      var p = mgPos(j);
      if (shape(j) === "star") dots.push(el("path", { d: starPath(p[0], p[1], 9, 4) }, s));
      else dots.push(el("circle", { cx: p[0], cy: p[1] }, s));
    }
    function setOn(i, on) {
      var d = dots[i], star = d.tagName.toLowerCase() === "path";
      d.setAttribute("class", color(i) + (on ? " stroke-text" : " op-25"));
      d.setAttribute("stroke-width", on ? (star ? 1.5 : 2) : 0);
      if (!star) d.setAttribute("r", on ? 7 : 6);
    }
    var cursor = el("circle", { cx: 0, cy: 0, r: 11, class: "fill-none stroke-primary smp-cursor", "stroke-width": 2.5, style: "opacity:0" }, s);
    function cursorTo(i) {
      var p = mgPos(i), hidden = cursor.style.opacity === "0";
      if (hidden) { cursor.style.transition = "none"; }
      cursor.style.transform = "translate(" + p[0] + "px," + p[1] + "px)";
      if (hidden) { cursor.getBoundingClientRect(); cursor.style.transition = ""; }
      cursor.style.opacity = "1";
    }
    function hideCursor() { cursor.style.opacity = "0"; }
    function pick(i) { setOn(i, true); pulse(dots[i]); }

    /* phần điều khiển: nút xem lại + lời kể */
    mount(container, s);
    var run = document.createElement("div");
    run.className = "smp-run";
    run.innerHTML = '<button type="button" class="btn small smp-btn" aria-label="Xem cách chọn" title="Xem cách chọn">' +
      (X.icon ? X.icon("play") : "›") + '</button><span class="smp-say"></span>';
    container.appendChild(run);
    var sayEl = run.querySelector(".smp-say");
    function say(h) { sayEl.innerHTML = h; }

    var timers = [], T = 0;
    function at(dt, fn) { T += dt; timers.push(setTimeout(fn, T)); }
    function finalState() {
      for (var i = 0; i < N; i++) setOn(i, !!sel[i]);
      clusters.forEach(function (_, k) { paintCluster(k, clusterOn[k]); });
      arrows.forEach(function (a) { a.style.opacity = ""; });
      hideCursor();
      say(SMP_SUMMARY[pattern]);
    }
    function play() {
      timers.forEach(clearTimeout); timers = []; T = 0;
      for (var i = 0; i < N; i++) setOn(i, false);
      clusters.forEach(function (_, k) { paintCluster(k, false); });
      arrows.forEach(function (a) { a.style.opacity = "0"; });
      hideCursor();
      SCRIPT[pattern]();
      at(900, finalState);
    }

    var SCRIPT = {
      simple: function () {
        say("Có danh sách 40 người. <b>Bốc thăm</b> lần lượt từng người.");
        var picks = seededShuffle(list, rng(5)), H = rng(9);
        picks.forEach(function (i, n) {
          at(n ? 260 : 900, function () { cursorTo(Math.floor(H() * N)); });
          at(160, function () { cursorTo(Math.floor(H() * N)); });
          at(160, function () { cursorTo(i); pick(i); say("Bốc thăm lần " + (n + 1) + ": trúng <b>người số " + (i + 1) + "</b>."); });
        });
      },
      systematic: function () {
        say("Đánh số 1 → 40. Bốc ngẫu nhiên 1 người trong 5 người đầu: trúng <b>số 2</b>.");
        at(900, function () { cursorTo(0); });
        at(240, function () { cursorTo(1); pick(1); });
        for (var i = 2; i < N; i++) (function (i) {
          var hit = (i - 1) % 5 === 0;
          at(hit ? 150 : 105, function () {
            cursorTo(i);
            if (hit) { pick(i); say("Đếm thêm k = 5 người → chọn <b>số " + (i + 1) + "</b>."); }
          });
          if (hit) T += 260;
        })(i);
      },
      stratified: function () {
        say("Chia quần thể thành <b>3 tầng</b> theo màu (vd: năm 1, 2, 3).");
        bands.forEach(function (b, k) { at(k ? 200 : 300, function () { flash(b); }); });
        [[1, 6, 12], [18, 23, 29], [34, 38]].forEach(function (g, b) {
          at(900, function () { flash(bands[b]); say("Tầng " + (b + 1) + ": bốc thăm <b>" + g.length + " người</b> trong tầng này."); });
          g.forEach(function (i, n) { at(n ? 360 : 450, function () { cursorTo(i); pick(i); }); });
        });
      },
      cluster: function () {
        say("Chia 40 người thành <b>4 cụm</b> (vd: 4 lớp).");
        clusters.forEach(function (r, k) { at(k ? 240 : 400, function () { pulse(r); }); });
        at(800, function () { paintCluster(1, true); paintCluster(3, true); pulse(clusters[1]); pulse(clusters[3]); say("Bốc thăm 2 cụm: trúng <b>cụm 2</b> và <b>cụm 4</b>."); });
        at(1200, function () { say("Lấy <b>tất cả</b> mọi người trong 2 cụm đó."); });
        [1, 3].forEach(function (k) {
          for (var r = 0; r < MG.rows; r++) for (var c = 0; c < 2; c++) (function (i) { at(65, function () { pick(i); }); })(r * MG.cols + 2 * k + c);
        });
      },
      multistage: function () {
        say("<b>Bậc 1:</b> bốc thăm 2 cụm lớn (vd: 2 xã trong 4 xã).");
        at(800, function () { paintCluster(0, true); pulse(clusters[0]); });
        at(400, function () { paintCluster(2, true); pulse(clusters[2]); });
        at(1000, function () { say("<b>Bậc 2:</b> trong mỗi cụm đã chọn, bốc thăm tiếp vài người."); });
        list.forEach(function (i, n) { at(n ? 420 : 700, function () { cursorTo(i); pick(i); }); });
      },
      purposive: function () {
        say("Người nghiên cứu xem cả danh sách và <b>tự chọn</b> người phù hợp (hình sao).");
        list.forEach(function (i, n) { at(n ? 520 : 900, function () { cursorTo(i); pick(i); }); });
      },
      convenience: function () {
        say("Đứng ở cửa (thanh cam): <b>ai ngồi gần nhất thì hỏi trước</b>.");
        at(200, function () { pulse(door); });
        list.forEach(function (i, n) { at(n ? 380 : 700, function () { cursorTo(i); pick(i); say("Người thứ " + (n + 1) + " gần cửa nhất còn lại → chọn."); }); });
      },
      quota: function () {
        say("Chỉ tiêu: <b>4 xanh + 4 hồng</b>. Đi từ đầu danh sách, gặp ai lấy nấy.");
        var a = 0, d = 0;
        T += 600;
        list.forEach(function (i) {
          var blue = color(i) === "fill-a", take = !!sel[i];
          if (take) { if (blue) a++; else d++; }
          var msg = take ? "Lấy! Xanh <b>" + a + "/4</b> · Hồng <b>" + d + "/4</b>" :
            "Đủ 4 " + (blue ? "xanh" : "hồng") + " rồi → <b>bỏ qua</b> người này.";
          at(take ? 380 : 330, function () { cursorTo(i); if (take) pick(i); say(msg); });
        });
      },
      snowball: function () {
        var chain = list;
        say("Bắt đầu từ <b>1 người</b> tham gia nghiên cứu.");
        at(700, function () { cursorTo(chain[0]); pick(chain[0]); });
        arrows.forEach(function (ar, c) {
          at(800, function () {
            ar.style.opacity = "";
            if (moving() && X.anim.drawPath) X.anim.drawPath(ar, 420);
            cursorTo(chain[c + 1]); pick(chain[c + 1]);
            say("Người " + (c + 1) + " giới thiệu <b>người " + (c + 2) + "</b>.");
          });
        });
      }
    };
    function flash(r) {
      if (!moving()) return;
      r.animate([{ fillOpacity: 0.15 }, { fillOpacity: 0.55 }, { fillOpacity: 0.15 }], { duration: 700, easing: EASE });
    }

    finalState();
    run.querySelector(".smp-btn").addEventListener("click", play);
    if (moving() && X.anim.onVisible) {
      X.anim.onVisible(container, function () { setTimeout(play, (slot % 3) * 450); }, { threshold: 0.7 });
    }
  }

  /* =====================================================
     Bốn biểu đồ nhỏ
     ===================================================== */
  var AGE = { labels: ["< 30", "30–34", "35–39", "≥ 40"], values: [90, 255, 260, 40], cls: ["fill-a", "fill-b", "fill-c", "fill-d"] };

  function miniHist() {
    var box = byId("mini-hist"); if (!box) return;
    var W = 260, H = 150, P = { l: 14, r: 14, t: 12, b: 32 }, iw = W - P.l - P.r, ih = H - P.t - P.b;
    var s = SV.create(W, H, "Histogram Hb");
    HB.forEach(function (f, i) {
      var h = ih * f / 20;
      el("rect", { x: P.l + i * iw / 8, y: P.t + ih - h, width: iw / 8, height: h, class: "fill-primary", style: "stroke:var(--surface);stroke-width:1" }, s);
    });
    el("line", { x1: P.l, x2: W - P.r, y1: P.t + ih, y2: P.t + ih, class: "svg-line" }, s);
    txt(s, P.l, H - 14, "8", "svg-muted", { "font-size": 12, "text-anchor": "middle" });
    txt(s, W - P.r, H - 14, "16", "svg-muted", { "font-size": 12, "text-anchor": "middle" });
    txt(s, W / 2, H - 4, "Hb (g/dl)", "svg-muted", { "font-size": 12, "text-anchor": "middle" });
    mount(box, s);
  }

  function miniBox() {
    var box = byId("mini-box"); if (!box) return;
    var W = 260, H = 150, s = SV.create(W, H, "Biểu đồ hộp");
    function Xs(v) { return 20 + (v - 1000) / 4000 * 220; }
    var y0 = 48, y1 = 92, ym = 70;
    el("line", { x1: Xs(2000), x2: Xs(2900), y1: ym, y2: ym, class: "svg-line" }, s);
    el("line", { x1: Xs(3500), x2: Xs(4400), y1: ym, y2: ym, class: "svg-line" }, s);
    [2000, 4400].forEach(function (v) { el("line", { x1: Xs(v), x2: Xs(v), y1: ym - 12, y2: ym + 12, class: "svg-line" }, s); });
    el("rect", { x: Xs(2900), y: y0, width: Xs(3500) - Xs(2900), height: y1 - y0, class: "fill-primary-soft stroke-primary", "stroke-width": 2 }, s);
    el("line", { x1: Xs(3200), x2: Xs(3200), y1: y0, y2: y1, class: "stroke-accent", "stroke-width": 3 }, s);
    [1200, 1500, 1800, 4650].forEach(function (v) { el("circle", { cx: Xs(v), cy: ym, r: 4, class: "fill-danger" }, s); });
    el("line", { x1: 20, x2: 240, y1: 118, y2: 118, class: "svg-line-muted" }, s);
    [1000, 3000, 5000].forEach(function (v) { txt(s, Xs(v), 136, String(v), "svg-muted", { "font-size": 12, "text-anchor": "middle" }); });
    txt(s, W / 2, 26, "Cân nặng sơ sinh (g)", "svg-muted", { "font-size": 12, "text-anchor": "middle" });
    mount(box, s);
  }

  function miniBar() {
    var box = byId("mini-bar"); if (!box) return;
    var W = 260, H = 150, P = { l: 14, r: 14, t: 20, b: 26 }, iw = W - P.l - P.r, ih = H - P.t - P.b;
    var s = SV.create(W, H, "Biểu đồ cột");
    var bw = iw / 4;
    AGE.values.forEach(function (v, i) {
      var h = ih * v / 300, x = P.l + i * bw + bw * 0.2;
      el("rect", { x: x, y: P.t + ih - h, width: bw * 0.6, height: h, rx: 3, class: AGE.cls[i] }, s);
      txt(s, x + bw * 0.3, P.t + ih - h - 5, String(v), "svg-text svg-bold", { "font-size": 12, "text-anchor": "middle" });
      txt(s, x + bw * 0.3, H - 8, AGE.labels[i], "svg-muted", { "font-size": 12, "text-anchor": "middle" });
    });
    el("line", { x1: P.l, x2: W - P.r, y1: P.t + ih, y2: P.t + ih, class: "svg-line" }, s);
    mount(box, s);
  }

  function miniPie() {
    var box = byId("mini-pie"); if (!box) return;
    var W = 260, H = 150, s = SV.create(W, H, "Biểu đồ tròn");
    var cx = 72, cy = 75, r = 60, total = U.sum(AGE.values), a0 = -Math.PI / 2;
    AGE.values.forEach(function (v, i) {
      var a1 = a0 + v / total * 2 * Math.PI, large = a1 - a0 > Math.PI ? 1 : 0;
      var d = "M" + cx + " " + cy + " L" + (cx + r * Math.cos(a0)).toFixed(2) + " " + (cy + r * Math.sin(a0)).toFixed(2) +
        " A" + r + " " + r + " 0 " + large + " 1 " + (cx + r * Math.cos(a1)).toFixed(2) + " " + (cy + r * Math.sin(a1)).toFixed(2) + " Z";
      el("path", { d: d, class: AGE.cls[i], style: "stroke:var(--surface);stroke-width:2" }, s);
      el("rect", { x: 150, y: 30 + i * 26, width: 12, height: 12, rx: 3, class: AGE.cls[i] }, s);
      txt(s, 168, 41 + i * 26, AGE.labels[i] + ": " + Math.round(v / total * 100) + "%", "svg-text", { "font-size": 13 });
      a0 = a1;
    });
    mount(box, s);
  }

  /* =====================================================
     Hình 4. Dựng biểu đồ hộp từ số liệu (chiếu từng bước)
     40 trẻ (minh hoạ), xếp sao cho: Q1 = 2900, trung vị = 3200, Q3 = 3500,
     râu 2000 / 4400 (đúng bằng hàng rào 1,5 × IQR), ngoại lai 1200, 1500, 1800, 4650.
     ===================================================== */
  var BIRTH = [1200, 1500, 1800, 2000, 2300, 2500, 2650, 2750, 2800, 2880, 2920, 2950, 3000, 3050, 3080, 3100, 3120, 3150, 3170, 3190,
    3210, 3230, 3260, 3290, 3320, 3350, 3380, 3420, 3450, 3480, 3520, 3580, 3650, 3720, 3800, 3900, 4000, 4150, 4400, 4650];

  function drawBoxplot() {
    var box = byId("fig-boxplot"); if (!box) return;
    var W = 350, H = 428, s = SV.create(W, H, "Dựng biểu đồ hộp từ cân nặng của 40 trẻ sơ sinh");
    function Ys(v) { return 372 - (v - 1000) / 4000 * 340; }
    var cx = 122, bx0 = 88, bx1 = 156, LX = 188;

    /* trục */
    el("line", { x1: 61, x2: 61, y1: Ys(1000), y2: Ys(5000), class: "svg-line-muted" }, s);
    [1000, 2000, 3000, 4000, 5000].forEach(function (v) {
      el("line", { x1: 57, x2: 61, y1: Ys(v), y2: Ys(v), class: "svg-line-muted" }, s);
      txt(s, 54, Ys(v) + 4, String(v), "svg-muted", { "text-anchor": "end", "font-size": 13 });
    });
    txt(s, 11, 200, "Cân nặng (g)", "svg-muted", { "text-anchor": "middle", "font-size": 13, transform: "rotate(-90 11 200)" });

    /* B0: mỗi chấm 1 trẻ (xếp kiểu "bầy ong" để không chồng lên nhau) */
    var placed = [], OFF = [0, 8, -8, 16, -16, 24, -24];
    BIRTH.forEach(function (v) {
      var y = Ys(v), x = cx;
      for (var t = 0; t < OFF.length; t++) {
        var xx = cx + OFF[t];
        if (placed.every(function (p) { return (p[0] - xx) * (p[0] - xx) + (p[1] - y) * (p[1] - y) >= 7.6 * 7.6; })) { x = xx; break; }
      }
      placed.push([x, y, v]);
      el("circle", { cx: x, cy: y, r: 3.6, class: "fill-a op-70" }, s);
    });

    function lead(g, v, label, cls) {
      el("line", { x1: bx1 + 6, x2: LX - 6, y1: Ys(v), y2: Ys(v), class: "svg-line-muted svg-dash" }, g);
      txt(g, LX, Ys(v) + 5, label, cls, { "font-size": 14 });
    }
    /* B4: râu (vẽ trước hộp để hộp che phần trong) */
    var g4 = el("g", { "data-step": "4" }, s);
    el("line", { x1: cx, x2: cx, y1: Ys(4400), y2: Ys(3500), class: "svg-line", "stroke-width": 2 }, g4);
    el("line", { x1: cx, x2: cx, y1: Ys(2900), y2: Ys(2000), class: "svg-line", "stroke-width": 2 }, g4);
    [2000, 4400].forEach(function (v) { el("line", { x1: cx - 18, x2: cx + 18, y1: Ys(v), y2: Ys(v), class: "svg-line", "stroke-width": 2 }, g4); });
    /* B2: hộp Q1–Q3 */
    var g2 = el("g", { "data-step": "2" }, s);
    el("rect", { x: bx0, y: Ys(3500), width: bx1 - bx0, height: Ys(2900) - Ys(3500), rx: 3, class: "fill-primary op-15 stroke-primary", "stroke-width": 2.5 }, g2);
    /* B1: trung vị */
    var g1 = el("g", { "data-step": "1" }, s);
    el("line", { x1: bx0, x2: bx1, y1: Ys(3200), y2: Ys(3200), class: "stroke-accent", "stroke-width": 4, "stroke-linecap": "round" }, g1);
    lead(g1, 3200, "Trung vị = 3200", "fill-accent svg-bold");
    var g1o = el("g", { "data-step-only": "1" }, s);
    txt(g1o, LX, Ys(3900) + 5, "20 trẻ nặng hơn", "svg-muted", { "font-size": 13 });
    txt(g1o, LX, Ys(2500) + 5, "20 trẻ nhẹ hơn", "svg-muted", { "font-size": 13 });
    /* B2: nhãn Q1, Q3, ngoặc 50%, IQR */
    lead(g2, 3500, "Q3 = 3500 (75%)", "svg-text");
    lead(g2, 2900, "Q1 = 2900 (25%)", "svg-text");
    txt(g2, W / 2, 402, "Chiều dài hộp: IQR = Q3 − Q1 = 600 g", "svg-text svg-bold", { "text-anchor": "middle", "font-size": 13 });
    var g2o = el("g", { "data-step-only": "2" }, s);
    el("path", { d: "M" + (bx0 - 6) + " " + Ys(3500) + " H" + (bx0 - 11) + " V" + Ys(2900) + " H" + (bx0 - 6), class: "stroke-primary", fill: "none", "stroke-width": 1.8 }, g2o);
    var ymid = (Ys(3500) + Ys(2900)) / 2;
    txt(g2o, bx0 - 18, ymid, "50%", "fill-primary svg-bold", { "font-size": 12, "text-anchor": "middle", transform: "rotate(-90 " + (bx0 - 18) + " " + ymid + ")" });
    /* B3: hàng rào 1,5 × IQR */
    var g3 = el("g", { "data-step-only": "3" }, s);
    [[2000, "Q1 − 1,5×IQR = 2000"], [4400, "Q3 + 1,5×IQR = 4400"]].forEach(function (f) {
      el("line", { x1: 65, x2: LX - 6, y1: Ys(f[0]), y2: Ys(f[0]), class: "stroke-danger svg-dash", "stroke-width": 1.6 }, g3);
      txt(g3, LX, Ys(f[0]) + 5, f[1], "fill-danger svg-bold", { "font-size": 13 });
    });
    txt(g3, W / 2, 421, "1,5 × IQR = 1,5 × 600 = 900 g", "fill-danger svg-bold", { "text-anchor": "middle", "font-size": 13 });
    lead(g4, 4400, "Râu trên: 4400", "svg-text");
    lead(g4, 2000, "Râu dưới: 2000", "svg-text");
    /* B5: ngoại lai */
    var g5 = el("g", { "data-step": "5" }, s);
    placed.forEach(function (p) { if (p[2] < 2000 || p[2] > 4400) el("circle", { cx: p[0], cy: p[1], r: 4.8, class: "fill-danger" }, g5); });
    lead(g5, 4650, "Ngoại lai: 4650", "fill-danger svg-bold");
    lead(g5, 1500, "Ngoại lai: 1200–1800", "fill-danger svg-bold");
    mount(box, s);
  }

  /* =====================================================
     Biểu đồ chấm (tương quan)
     ===================================================== */
  var CORR = {
    strong: { name: "Tương quan dương mạnh", short: "điểm bám sát 1 đường đi lên" },
    weak: { name: "Tương quan dương (yếu hơn)", short: "có xu hướng đi lên nhưng khá tản mát" },
    neg: { name: "Tương quan âm", short: "x tăng thì y giảm (đi xuống)" },
    none: { name: "Không có tương quan", short: "các điểm rải lung tung" }
  };
  function corr(pts) {
    var n = pts.length, mx = 0, my = 0;
    pts.forEach(function (p) { mx += p[0]; my += p[1]; });
    mx /= n; my /= n;
    var sxy = 0, sxx = 0, syy = 0;
    pts.forEach(function (p) { sxy += (p[0] - mx) * (p[1] - my); sxx += (p[0] - mx) * (p[0] - mx); syy += (p[1] - my) * (p[1] - my); });
    return sxy / Math.sqrt(sxx * syy);
  }
  function genPoints(type, R) {
    var best = null;
    for (var attempt = 0; attempt < 300; attempt++) {
      var n = 14 + Math.floor(R() * 6), pts = [];
      for (var i = 0; i < n; i++) {
        var x = 0.04 + R() * 0.92, y;
        if (type === "strong") y = 0.1 + 0.8 * x + gauss(R) * 0.045;
        else if (type === "weak") y = 0.15 + 0.7 * x + gauss(R) * 0.17;
        else if (type === "neg") y = 0.9 - 0.75 * x + gauss(R) * 0.09;
        else y = 0.06 + R() * 0.88;
        pts.push([x, Math.max(0.03, Math.min(0.97, y))]);
      }
      var r = corr(pts);
      var ok = type === "strong" ? r > 0.92 : type === "weak" ? (r > 0.45 && r < 0.75) : type === "neg" ? r < -0.75 : Math.abs(r) < 0.12;
      best = { pts: pts, r: r };
      if (ok) return best;
    }
    return best;
  }
  /* o: { W, H, fs (cỡ chữ trục), r (bán kính chấm), under(svg, px) vẽ thêm phía dưới các chấm } */
  function scatterSvg(pts, label, o) {
    o = o || {};
    var W = o.W || 240, H = o.H || 180, fs = o.fs || 13, s = SV.create(W, H, label || "Biểu đồ chấm");
    var id = "b8-ax-" + Math.random().toString(36).slice(2, 8);
    addMarker(s, id, "fill-text");
    var ox = 28, oy = H - 28, sx = W - 60, sy = H - 52;
    el("line", { x1: ox, y1: oy, x2: W - 12, y2: oy, class: "svg-line", "marker-end": "url(#" + id + ")" }, s);
    el("line", { x1: ox, y1: oy, x2: ox, y2: 10, class: "svg-line", "marker-end": "url(#" + id + ")" }, s);
    txt(s, ox - 12, oy + 16, "O", "svg-text", { "font-size": fs });
    txt(s, W - 14, oy + 18, "x", "svg-text svg-bold", { "font-size": fs + 1 });
    txt(s, ox - 16, 18, "y", "svg-text svg-bold", { "font-size": fs + 1 });
    function px(p) { return [ox + 10 + p[0] * sx, oy - 6 - p[1] * sy]; }
    if (o.under) o.under(s, px);
    pts.forEach(function (p) { var q = px(p); el("circle", { cx: q[0].toFixed(1), cy: q[1].toFixed(1), r: o.r || 4.5, class: "fill-danger" }, s); });
    return s;
  }
  /* đường thẳng "đi giữa đám chấm" (bình phương nhỏ nhất) */
  function fitLine(pts) {
    var n = pts.length, mx = 0, my = 0, sxy = 0, sxx = 0;
    pts.forEach(function (p) { mx += p[0] / n; my += p[1] / n; });
    pts.forEach(function (p) { sxy += (p[0] - mx) * (p[1] - my); sxx += (p[0] - mx) * (p[0] - mx); });
    var b = sxy / sxx;
    return { a: my - b * mx, b: b };
  }
  function scatterExamples() {
    var box = byId("scatter-examples"); if (!box) return;
    var seeds = { strong: 11, weak: 22, neg: 33, none: 44 };
    ["strong", "weak", "neg", "none"].forEach(function (t) {
      var g = genPoints(t, rng(seeds[t])), f = fitLine(g.pts);
      var svg = scatterSvg(g.pts, CORR[t].name, {
        W: 180, H: 150, fs: 15, r: 4,
        under: function (s, px) {
          /* B2: khoảng cách từ mỗi chấm đến đường */
          var gr = el("g", { "data-step-only": "2" }, s);
          g.pts.forEach(function (p) {
            var a = px(p), b = px([p[0], f.a + f.b * p[0]]);
            if (Math.abs(a[1] - b[1]) > 1) el("line", { x1: a[0], x2: b[0], y1: a[1], y2: b[1], class: "stroke-accent", "stroke-width": 2 }, gr);
          });
          /* B1: đường xu hướng (cắt cho nằm trong khung) */
          var xa = 0.02, xb = 0.98;
          function clip(x) { var y = f.a + f.b * x; if (y > 0.99) return (0.99 - f.a) / f.b; if (y < 0.01) return (0.01 - f.a) / f.b; return x; }
          xa = clip(xa); xb = clip(xb);
          var A = px([xa, f.a + f.b * xa]), B = px([xb, f.a + f.b * xb]);
          el("line", { x1: A[0].toFixed(1), y1: A[1].toFixed(1), x2: B[0].toFixed(1), y2: B[1].toFixed(1), class: "stroke-primary", "stroke-width": 3, "stroke-linecap": "round", "data-step": "1" }, s);
        }
      });
      var card = document.createElement("div");
      card.className = "sc-panel";
      card.appendChild(svg);
      var p = document.createElement("p");
      p.setAttribute("data-step", "3");
      p.innerHTML = "<b>" + CORR[t].name + "</b><br><span class=\"muted\">" + CORR[t].short + "</span><br><span class=\"nowrap c-primary\">r ≈ " + U.fmt(g.r, 2) + "</span>";
      card.appendChild(p);
      box.appendChild(card);
    });
  }

  /* =====================================================
     Trò chơi 1: Phân loại biến số
     ===================================================== */
  var VAR_OPTS = ["🏷️ Danh định", "📶 Thứ tự", "⚖️ Nhị giá", "🔢 Định lượng"];
  var VARS = [
    ["Nhóm máu (A, B, AB, O)", 0, "Chỉ là tên gọi, không nhóm nào “cao hơn” nhóm nào → danh định."],
    ["Giới tính (nam / nữ)", 2, "Chỉ có đúng 2 giá trị → nhị giá."],
    ["Đường huyết lúc đói (mmol/L)", 3, "Là con số đo được (vd 5,6 mmol/L) → định lượng (liên tục)."],
    ["Phân độ tăng huyết áp (bình thường, tiền THA, độ 1, độ 2, độ 3)", 1, "Các mức xếp được từ nhẹ đến nặng → thứ tự."],
    ["Dân tộc (Kinh, Hoa, Khmer, Chăm…)", 0, "Tên gọi, không xếp thứ tự → danh định."],
    ["Có hút thuốc lá hay không", 2, "Có / không: 2 giá trị → nhị giá."],
    ["Cân nặng (kg)", 3, "Con số đo được → định lượng."],
    ["Mức độ đau (không đau, đau nhẹ, đau vừa, đau nặng)", 1, "Xếp được từ không đau đến đau nặng → thứ tự."],
    ["Tình trạng hôn nhân (độc thân, có gia đình, li dị, goá)", 0, "Tên gọi, không có thứ tự cao – thấp → danh định."],
    ["Số lần tái khám trong năm", 3, "Đếm được 0, 1, 2, 3… → định lượng (rời rạc)."],
    ["Học lực (giỏi, khá, trung bình, kém)", 1, "Các mức xếp được → thứ tự."],
    ["Kết quả xét nghiệm nhanh (dương tính / âm tính)", 2, "Chỉ 2 kết quả → nhị giá."],
    ["Nghề nghiệp (CBVC, kinh doanh, nông dân, khác)", 0, "Tên gọi các nghề, không xếp thứ tự → danh định."],
    ["Chiều cao (cm)", 3, "Con số đo được → định lượng."],
    ["Thể bệnh theo YHCT (khí hư, huyết hư, âm hư, dương hư)", 0, "Các thể là tên gọi khác nhau, không thể nào “cao hơn” thể nào → danh định."],
    ["Mức độ hài lòng (rất không hài lòng → rất hài lòng)", 1, "5 mức xếp được từ thấp đến cao → thứ tự."],
    ["Nhiệt độ cơ thể (°C)", 3, "Con số đo được (37,5 °C) → định lượng."],
    ["Tình trạng sau 5 năm (còn sống / tử vong)", 2, "2 giá trị → nhị giá."],
    ["Giai đoạn ung thư (I, II, III, IV)", 1, "Giai đoạn xếp từ sớm đến muộn → thứ tự (dù viết bằng số La Mã, đó không phải phép đo)."],
    ["Nhịp tim (lần/phút)", 3, "Con số đếm/đo được → định lượng."],
    ["Khoa điều trị (Nội, Ngoại, Châm cứu, PHCN)", 0, "Tên các khoa, không xếp thứ tự → danh định."],
    ["Mức độ suy dinh dưỡng (độ 1, độ 2, độ 3)", 1, "Các độ xếp từ nhẹ đến nặng → thứ tự."],
    ["Số con trong gia đình", 3, "Đếm được → định lượng (rời rạc)."],
    ["Có tiền sử dị ứng thuốc hay không", 2, "Có / không → nhị giá."]
  ];
  function gameVariables() {
    var box = byId("game-bien-so"); if (!box || !X.Game) return;
    X.Game.mcq(box, {
      id: "bai8-bien-so",
      title: "Phân loại biến số",
      intro: "Mỗi câu là 1 biến số trên phiếu nghiên cứu. Hãy chọn đúng loại biến. Mẹo: con số đo/đếm → định lượng; 2 giá trị → nhị giá; xếp được mức → thứ tự; còn lại → danh định.",
      rounds: 10,
      cols: 2,
      questions: VARS.map(function (v) {
        return {
          q: "Biến <b>“" + v[0] + "”</b> thuộc loại nào?",
          options: VAR_OPTS,
          answer: v[1],
          explain: v[2]
        };
      })
    });
  }

  /* =====================================================
     Trò chơi 2: Thử chọn mẫu
     ===================================================== */
  var GROUPS = [
    { name: "Y sĩ YHCT", n: 40, cls: "fill-a", color: "var(--set-a)" },
    { name: "Điều dưỡng", n: 30, cls: "fill-b", color: "var(--set-b)" },
    { name: "Dược", n: 20, cls: "fill-c", color: "var(--set-c)" },
    { name: "PHCN", n: 10, cls: "fill-d", color: "var(--set-d)" }
  ];
  function groupOf(i) { var r = Math.floor(i / 10); return r < 4 ? 0 : r < 7 ? 1 : r < 9 ? 2 : 3; }
  var METHODS = [
    { id: "simple", name: "Ngẫu nhiên đơn" },
    { id: "systematic", name: "Hệ thống" },
    { id: "stratified", name: "Phân tầng" },
    { id: "cluster", name: "Cụm (theo hàng)" },
    { id: "convenience", name: "Thuận tiện (gần cửa)" }
  ];
  var ALL = []; for (var ii = 0; ii < 100; ii++) ALL.push(ii);

  function drawSample(method, n) {
    var pick = [];
    if (method === "simple") pick = U.sample(ALL, n);
    else if (method === "systematic") {
      var k = Math.floor(100 / n), st = U.randInt(0, k - 1);
      for (var j = 0; j < n; j++) pick.push(st + j * k);
    } else if (method === "stratified") {
      GROUPS.forEach(function (g, gi) {
        var members = ALL.filter(function (i) { return groupOf(i) === gi; });
        pick = pick.concat(U.sample(members, Math.round(n * g.n / 100)));
      });
    } else if (method === "cluster") {
      U.sample([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], n / 10).forEach(function (r) {
        for (var c = 0; c < 10; c++) pick.push(r * 10 + c);
      });
    } else {
      for (var c2 = 0; c2 < n; c2++) pick.push(c2);
    }
    return pick;
  }
  function deviation(pick) {
    var cnt = [0, 0, 0, 0];
    pick.forEach(function (i) { cnt[groupOf(i)]++; });
    var dev = 0;
    GROUPS.forEach(function (g, gi) { dev += Math.abs(cnt[gi] / pick.length * 100 - g.n); });
    return { cnt: cnt, dev: dev / 2 };
  }
  var METHOD_NOTE = {
    simple: "Mỗi bạn có cơ hội được chọn như nhau. Mẫu thường khá giống hội trường, nhưng mỗi lần bốc lại hơi khác (do may rủi). Cỡ mẫu càng lớn thì càng sát.",
    systematic: "Cứ cách đều k người chọn 1. Vì hàng nào cũng có người được chọn nên tỷ lệ các ngành rất sát. (Cẩn thận nếu danh sách có quy luật lặp lại trùng với k.)",
    stratified: "Mỗi ngành (tầng) được bốc thăm đúng theo tỷ lệ, nên tỷ lệ trong mẫu khớp hoàn toàn với hội trường.",
    cluster: "Bốc thăm vài hàng (lớp) rồi lấy hết người trong hàng. Rẻ, dễ làm; nhưng ở đây mỗi lớp chỉ có 1 ngành, nên bốc trúng hàng nào thì mẫu chỉ có ngành đó, dễ bị lệch.",
    convenience: "Chỉ chọn các bạn ngồi gần cửa (hàng đầu): toàn là ngành Y sĩ YHCT! Mẫu thuận tiện là kiểu dễ lệch nhất."
  };

  var CHALLENGE = [
    { q: "Dùng cách <b>Thuận tiện</b> (chọn các bạn ngồi gần cửa) với cỡ mẫu 20. Mẫu có đại diện cho 4 ngành không?",
      o: ["Có, vì 20 người là đủ nhiều", "Không: cả 20 bạn đều là ngành Y sĩ YHCT", "Có, vì ai cũng có cơ hội được chọn"], a: 1,
      e: "Hai hàng gần cửa toàn là lớp Y sĩ YHCT, nên mẫu có 100% YHCT trong khi cả hội trường chỉ có 40%. Bấm thử để thấy!" },
    { q: "Muốn chắc chắn mẫu có <b>đủ cả 4 ngành, đúng theo tỷ lệ</b>, nên chọn cách nào?",
      o: ["Ngẫu nhiên đơn", "Phân tầng", "Cụm", "Thuận tiện"], a: 1,
      e: "Phân tầng: mỗi ngành là 1 tầng, bốc thăm trong từng tầng theo tỷ lệ → khớp hoàn toàn." },
    { q: "Bốc thăm ngẫu nhiên 2 hàng rồi lấy <b>tất cả</b> các bạn trong 2 hàng đó là cách chọn mẫu gì?",
      o: ["Phân tầng", "Hệ thống", "Cụm", "Quota"], a: 2,
      e: "Chọn vài cụm, cụm nào được chọn thì lấy hết → chọn mẫu cụm." },
    { q: "Đánh số các bạn từ 1 đến 100, chọn bạn số 3, 13, 23, …, 93. Đây là cách nào?",
      o: ["Hệ thống (k = 10)", "Ngẫu nhiên đơn", "Cụm", "Bóng tuyết"], a: 0,
      e: "Cách đều k = 10 người chọn 1 người → chọn mẫu hệ thống." },
    { q: "Trong hội trường này, vì sao chọn mẫu <b>cụm</b> (theo hàng) dễ bị lệch?",
      o: ["Vì mỗi cụm có quá ít người", "Vì mỗi hàng chỉ gồm 1 ngành, bốc trúng hàng nào thì mẫu chỉ có ngành đó", "Vì chọn cụm không hề ngẫu nhiên"], a: 1,
      e: "Chọn cụm vẫn là ngẫu nhiên, nhưng khi các cụm khác nhau nhiều (mỗi lớp 1 ngành) thì vài cụm không đại diện được cho cả hội trường." },
    { q: "Cách nào dưới đây <b>không phải</b> chọn mẫu ngẫu nhiên?",
      o: ["Hệ thống", "Phân tầng", "Thuận tiện", "Cụm"], a: 2,
      e: "Thuận tiện là “ai dễ gặp thì chọn”, nên là phi ngẫu nhiên." },
    { q: "Chọn ngẫu nhiên đơn 2 lần liên tiếp với cùng cỡ mẫu, kết quả có giống hệt nhau không?",
      o: ["Luôn giống hệt nhau", "Thường khác nhau một chút, do may rủi khi bốc thăm", "Khác hoàn toàn, không dùng được"], a: 1,
      e: "Sự khác nhau do may rủi gọi là <b>sai số chọn mẫu</b>. Mẫu càng lớn thì dao động càng nhỏ." }
  ];

  function gameSampling() {
    var box = byId("game-chon-mau"); if (!box || !X.Game) return;
    var g = X.Game.frame(box, {
      id: "bai8-chon-mau",
      title: "Thử chọn mẫu",
      intro: "Hội trường có <b>100 sinh viên</b> của 4 ngành, ngồi theo lớp: mỗi hàng là 1 lớp (1 cụm), hàng đầu ở gần cửa. Chọn phương pháp và cỡ mẫu, bấm <b>“Chọn mẫu”</b>, rồi so sánh tỷ lệ các ngành trong mẫu với cả hội trường. Bên dưới có <b>thử thách ghi điểm</b>."
    });
    var body = g.body, board = g.board;
    var method = "simple", size = 20, anim = 0;

    body.innerHTML =
      '<div class="smp-controls">' +
      '<div class="btn-row" data-role="methods"><span class="lbl">Phương pháp:</span></div>' +
      '<div class="btn-row" data-role="sizes"><span class="lbl">Cỡ mẫu:</span></div>' +
      '<div class="btn-row"><button type="button" class="btn primary" data-role="go">🎲 Chọn mẫu</button>' +
      '<button type="button" class="btn" data-role="sim">📊 So sánh cả 5 cách (mỗi cách 500 lần)</button></div>' +
      "</div>" +
      '<div class="smp-layout">' +
      '<div><div class="smp-grid" data-role="grid"></div><div class="smp-legend" data-role="legend"></div></div>' +
      '<div data-role="cmp"></div>' +
      "</div>" +
      '<div class="smp-sim" data-role="simout"></div>' +
      '<div class="smp-challenge" data-role="ch"></div>';
    function q(role) { return body.querySelector('[data-role="' + role + '"]'); }

    METHODS.forEach(function (m) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "btn small" + (m.id === method ? " is-on" : ""); b.textContent = m.name;
      b.addEventListener("click", function () {
        method = m.id;
        Array.prototype.forEach.call(q("methods").querySelectorAll("button"), function (x) { x.classList.toggle("is-on", x === b); });
      });
      q("methods").appendChild(b);
    });
    [10, 20, 30].forEach(function (n) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "btn small" + (n === size ? " is-on" : ""); b.textContent = n + " người";
      b.addEventListener("click", function () {
        size = n;
        Array.prototype.forEach.call(q("sizes").querySelectorAll("button"), function (x) { x.classList.toggle("is-on", x === b); });
      });
      q("sizes").appendChild(b);
    });
    q("legend").innerHTML = GROUPS.map(function (gr) {
      return '<span><i style="background:' + gr.color + '"></i>' + gr.name + " (" + gr.n + ")</span>";
    }).join("");

    /* lưới 10 × 10 */
    var W = 320, H = 326, s = SV.create(W, H, "Hội trường 100 sinh viên");
    el("rect", { x: 4, y: 26, width: 8, height: 40, rx: 2, class: "fill-accent" }, s);
    txt(s, 4, 18, "Cửa", "svg-text svg-bold", { "font-size": 13 });
    var dots = [];
    for (var i = 0; i < 100; i++) {
      var r = Math.floor(i / 10), c = i % 10;
      dots.push(el("circle", { cx: 34 + c * 28, cy: 44 + r * 28, r: 10, class: "p " + GROUPS[groupOf(i)].cls }, s));
    }
    for (var rr = 0; rr < 10; rr++) txt(s, 312, 48 + rr * 28, String(rr + 1), "svg-muted", { "text-anchor": "end", "font-size": 12 });
    q("grid").appendChild(s);

    function renderCmp(pick, m) {
      var res = deviation(pick), n = pick.length;
      var html = '<p class="cmp-head"><b>' + METHODS.filter(function (x) { return x.id === m; })[0].name + "</b> · cỡ mẫu " + n + "</p>";
      GROUPS.forEach(function (gr, gi) {
        var sp = res.cnt[gi] / n * 100;
        html += '<div class="cmp-row"><div class="cmp-name"><i style="background:' + gr.color + '"></i>' + gr.name + "</div>" +
          '<div class="cmp-bar"><span class="small muted">Hội trường</span><div class="track"><div class="fillbar pop" style="width:' + gr.n + "%;background:" + gr.color + '"></div></div><span class="v">' + gr.n + "%</span></div>" +
          '<div class="cmp-bar"><span class="small"><b>Mẫu</b></span><div class="track"><div class="fillbar" style="width:' + sp + "%;background:" + gr.color + '"></div></div><span class="v">' + U.fmt(sp, 0) + "%</span></div></div>";
      });
      var dv = res.dev, cls = dv <= 15 ? "good" : dv <= 30 ? "mid" : "bad";
      var verdict = dv <= 15 ? "Đại diện tốt 👍" : dv <= 30 ? "Hơi lệch 🤔" : "Lệch nhiều ⚠️";
      html += '<div class="cmp-verdict ' + cls + '"><b>Độ lệch so với hội trường: ' + U.fmt(dv, 0) + " điểm % → " + verdict + "</b><br>" + METHOD_NOTE[m] + "</div>";
      q("cmp").innerHTML = html;
    }

    function run() {
      var pick = drawSample(method, size), m = method, token = ++anim;
      var picked = {}; pick.forEach(function (i) { picked[i] = true; });
      dots.forEach(function (d) { d.classList.remove("sel"); d.classList.add("dim"); });
      q("cmp").innerHTML = '<p class="muted">Đang chọn…</p>';
      var order = pick.slice().sort(function (a, b) { return a - b; });
      var k = 0;
      (function step() {
        if (token !== anim) return;
        if (k < order.length) {
          var d = dots[order[k++]]; d.classList.remove("dim"); d.classList.add("sel");
          setTimeout(step, 28);
        } else renderCmp(pick, m);
      })();
    }

    function simulate() {
      var rows = METHODS.map(function (m) {
        var tot = 0, T = 500;
        for (var t = 0; t < T; t++) tot += deviation(drawSample(m.id, size)).dev;
        return { name: m.name, v: tot / T };
      });
      var max = Math.max.apply(null, rows.map(function (r) { return r.v; })) || 1;
      q("simout").innerHTML =
        '<div class="box tip"><p class="box-title">📊 Độ lệch trung bình sau 500 lần chọn (cỡ mẫu ' + size + ")</p>" +
        rows.map(function (r) {
          var cls = r.v <= 15 ? "var(--success)" : r.v <= 30 ? "var(--accent)" : "var(--danger)";
          return '<div class="cmp-bar wide"><span class="small"><b>' + r.name +
            '</b></span><div class="track"><div class="fillbar" style="width:' + Math.max(2, r.v / max * 100) + "%;background:" + cls +
            '"></div></div><span class="v">' + U.fmt(r.v, 1) + "</span></div>";
        }).join("") +
        '<p class="small">Số càng nhỏ, mẫu càng giống hội trường. Phân tầng và hệ thống gần như không lệch; ngẫu nhiên đơn lệch ít (do may rủi); cụm dao động mạnh vì mỗi lớp chỉ 1 ngành; thuận tiện lệch nặng nhất.</p></div>';
    }

    q("go").addEventListener("click", run);
    q("sim").addEventListener("click", simulate);

    /* thử thách ghi điểm */
    var chList, chIdx, chOk;
    function chStart() { board.reset(); chList = U.shuffle(CHALLENGE); chIdx = 0; chOk = 0; chShow(); }
    function chShow() {
      var ch = q("ch"), item = chList[chIdx];
      ch.innerHTML = '<p class="ch-title">🏅 Thử thách ghi điểm – câu ' + (chIdx + 1) + "/" + chList.length + "</p>" +
        '<div class="game-progress"><span style="width:' + Math.round(chIdx / chList.length * 100) + '%"></span></div>' +
        '<p class="game-prompt">' + item.q + "</p>" +
        '<div class="game-options"></div><div class="game-feedback"></div><div class="game-actions"></div>';
      var opts = ch.querySelector(".game-options"), fb = ch.querySelector(".game-feedback"), act = ch.querySelector(".game-actions");
      var btns = item.o.map(function (o, oi) {
        var b = document.createElement("button"); b.type = "button"; b.innerHTML = o;
        b.addEventListener("click", function () {
          btns.forEach(function (x) { x.disabled = true; });
          var ok = oi === item.a;
          if (ok) { b.classList.add("is-correct"); board.right(); chOk++; }
          else { b.classList.add("is-wrong"); btns[item.a].classList.add("is-correct"); board.wrong(); }
          fb.className = "game-feedback show " + (ok ? "ok" : "bad");
          fb.innerHTML = '<div class="fb-title">' + (ok ? "Chính xác! 🎉" : "Chưa đúng 😅") + "</div>" + item.e;
          var nx = document.createElement("button"); nx.type = "button"; nx.className = "btn primary";
          nx.textContent = chIdx + 1 < chList.length ? "Câu tiếp →" : "Xem kết quả 🏁";
          nx.addEventListener("click", function () { chIdx++; if (chIdx < chList.length) chShow(); else chEnd(); });
          act.appendChild(nx);
        });
        opts.appendChild(b);
        return b;
      });
    }
    function chEnd() {
      var ch = q("ch"), n = chList.length;
      var stars = chOk === n ? "⭐⭐⭐" : chOk >= n * 0.7 ? "⭐⭐" : chOk >= n * 0.4 ? "⭐" : "💪";
      ch.innerHTML = '<div class="game-end"><div class="big">' + stars + "</div><p><b>Đúng " + chOk + "/" + n +
        " câu</b> · Điểm: <b>" + board.score + '</b></p><div class="game-actions" style="justify-content:center"><button type="button" class="btn primary">↺ Làm lại thử thách</button></div></div>';
      ch.querySelector("button").addEventListener("click", chStart);
    }

    run();
    chStart();
  }

  /* =====================================================
     Trò chơi 3: Nhận dạng tương quan
     ===================================================== */
  var CORR_OPTS = ["📈 Tương quan dương mạnh", "↗️ Tương quan dương (yếu hơn)", "📉 Tương quan âm", "🔀 Không có tương quan"];
  var CORR_IDX = { strong: 0, weak: 1, neg: 2, none: 3 };
  var CORR_EXPLAIN = {
    strong: "Các điểm <b>bám sát một đường thẳng đi lên</b>: x tăng thì y tăng rõ rệt. VD: chiều cao và sải tay.",
    weak: "Các điểm <b>có xu hướng đi lên</b> nhưng tản mát khá rộng. VD: tuổi và huyết áp tâm thu.",
    neg: "Các điểm <b>đi xuống</b> từ trái sang phải: x tăng thì y giảm. VD: số giờ vận động/tuần và vòng bụng.",
    none: "Các điểm <b>rải lung tung</b>, không có hướng lên hay xuống. VD: ngày sinh trong tháng và đường huyết."
  };
  function gameCorrelation() {
    var box = byId("game-tuong-quan"); if (!box || !X.Game) return;
    var types = ["strong", "weak", "neg", "none"], pool = [];
    types.forEach(function (t) {
      for (var k = 0; k < 4; k++) {
        var gp = genPoints(t, Math.random);
        pool.push({
          q: "Biểu đồ chấm này cho thấy mối quan hệ nào giữa x và y?<div class=\"corr-plot\">" + scatterSvg(gp.pts, "Biểu đồ chấm cần nhận dạng").outerHTML + "</div>",
          options: CORR_OPTS,
          answer: CORR_IDX[t],
          explain: CORR_EXPLAIN[t] + " <span class=\"muted\">(Hệ số tương quan của hình này r ≈ " + U.fmt(gp.r, 2) +
            "; r càng gần 1 hoặc −1 thì càng chặt, gần 0 là không tương quan.)</span>"
        });
      }
    });
    X.Game.mcq(box, {
      id: "bai8-tuong-quan",
      title: "Nhận dạng tương quan",
      intro: "Nhìn biểu đồ chấm và đoán kiểu tương quan giữa 2 biến định lượng. 8 câu, mỗi câu 1 hình khác nhau.",
      rounds: 8,
      cols: 2,
      questions: pool
    });
  }

  /* ---------- khởi động (chạy trước anim.js để hình chiếu từng bước có sẵn nội dung) ---------- */
  function init() {
    drawPopSample();
    treeFocus();
    hbBuild();
    hbWidget();
    Array.prototype.forEach.call(document.querySelectorAll(".smp-fig[data-pattern]"), function (c, i) {
      miniGrid(c, c.getAttribute("data-pattern"), i);
    });
    miniHist(); miniBox(); miniBar(); miniPie();
    drawBoxplot();
    scatterExamples();
    gameVariables();
    gameSampling();
    gameCorrelation();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
