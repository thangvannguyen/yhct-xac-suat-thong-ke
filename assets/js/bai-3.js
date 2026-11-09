/* =========================================================
   bai-3.js — hình vẽ, hình động, mô phỏng và trò chơi của Bài 3
   - Hình "trình chiếu từng bước" (anim.js, data-anim="steps"):
       thang xác suất (vòng tròn trượt), xúc xắc, giỏ sản phẩm,
       tần suất tiến về xác suất, thả hạt vào hình vuông, bảng Hb cộng dồn
   - Bảng Hb bấm được (đọc tần suất tích lũy)
   - Mô phỏng luật số lớn
   - Trò chơi: Hộp bốc viên thuốc, Ném phi tiêu
   ========================================================= */
(function () {
  "use strict";
  var X = window.XSTK || {};
  var U = X.util, S = X.svg, A = X.anim || null;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function math(el) { if (X.math) X.math(el); }
  function fmt(x, d) { return U.fmt(x, d); }
  /* bề rộng vẽ biểu đồ theo khung chứa: điện thoại vẽ hẹp lại để chữ không bị quá nhỏ */
  function chartW(el) { var w = el.clientWidth || 600; return Math.max(320, Math.min(600, Math.round(w))); }
  var onResize = [];
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { onResize.forEach(function (f) { f(); }); }, 200);
  });

  /* ---------- tiện ích cho hình động ---------- */
  /* true nếu người dùng tắt hiệu ứng (hoặc ?static=1): khi đó chỉ đổi trạng thái, không chạy chuyển động */
  function still() { return !A || A.reduced; }
  /* hình vẽ bằng JS chỉ dựng 1 lần (trình chiếu từng bước giữ tham chiếu tới các phần tử) → chọn bố cục hẹp/rộng lúc dựng */
  function isNarrow(host, limit) { return (host.clientWidth || 600) < (limit || 430); }
  function cancelAnims(el) {
    [el].concat($all("*", el)).forEach(function (n) {
      if (n.getAnimations) n.getAnimations().forEach(function (a) { a.cancel(); });
    });
  }
  /* cho các phần tử hiện lần lượt, như đang đếm 1, 2, 3… */
  function seq(els, gap, delay0) {
    if (still()) return;
    els.forEach(function (el, i) { cancelAnims(el); A.appear(el, (delay0 || 0) + i * gap); });
  }
  /* thanh/cột "mọc" ra: axis "y" mọc từ đáy lên, "x" mọc từ trái sang */
  function grow(el, axis, delay, dur) {
    if (still() || !el || !el.animate) return;
    cancelAnims(el);
    el.style.transformBox = "fill-box";
    el.style.transformOrigin = axis === "y" ? "50% 100%" : "0% 50%";
    el.animate([{ transform: axis === "y" ? "scaleY(0)" : "scaleX(0)" }, { transform: "none" }],
      { duration: dur || 650, delay: delay || 0, easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards" });
  }
  /* Gọi cb(k, prev) mỗi khi hình "trình chiếu từng bước" chuyển sang bước k.
     anim.js bật class .cap-on cho chú thích của bước hiện tại → theo dõi class đó.
     Lần gọi đầu (lúc khởi tạo) có prev = null. */
  function onStep(fig, cb) {
    if (!fig || !("MutationObserver" in window)) return;
    var caps = $all("[data-caption]", fig), last = null;
    if (!caps.length) return;
    var mo = new MutationObserver(function () {
      var on = caps.filter(function (c) { return c.classList.contains("cap-on"); })[0];
      if (!on) return;
      var k = parseInt(on.getAttribute("data-caption"), 10);
      if (k === last) return;
      var prev = last; last = k;
      cb(k, prev);
    });
    caps.forEach(function (c) { mo.observe(c, { attributes: true, attributeFilter: ["class"] }); });
  }
  /* số ngẫu nhiên "cố định" (cùng hạt giống → cùng dãy số) để số liệu trong chú thích luôn khớp hình */
  function seeded(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  /* một ô màu nhỏ đứng trước dòng chữ (chú giải) */
  function swatch(s, x, y, cls) { return S.el("rect", { x: x, y: y - 11, width: 12, height: 12, rx: 3, class: cls, "stroke-width": 1.5 }, s); }

  /* ---------- 1. Thang xác suất: vòng tròn trượt tới từng biến cố ---------- */
  function initScale() {
    var fig = $("#fig-scale"); if (!fig) return;
    var POS = [0, 0, 1 / 6, 1 / 2, 5 / 6, 1];   /* vị trí vòng đánh dấu ở bước k (bước 0: ẩn) */
    var marks = $all(".pmark", fig);
    onStep(fig, function (k, prev) {
      marks.forEach(function (m) {
        var d = POS[k] * parseFloat(m.getAttribute("data-len"));
        var jump = still() || prev === null || k === 0 || prev === 0;
        if (jump) m.style.transition = "none";
        m.style.transform = m.getAttribute("data-axis") === "y" ? "translate(0px," + (-d) + "px)" : "translate(" + d + "px,0px)";
        if (jump && !still()) { void m.getBoundingClientRect(); m.style.transition = ""; }
      });
    });
  }

  /* ---------- 2. Xúc xắc: đếm n, đếm k, chia ---------- */
  var PIPS = {
    1: [[.5, .5]],
    2: [[.27, .27], [.73, .73]],
    3: [[.27, .27], [.5, .5], [.73, .73]],
    4: [[.27, .27], [.73, .27], [.27, .73], [.73, .73]],
    5: [[.27, .27], [.73, .27], [.5, .5], [.27, .73], [.73, .73]],
    6: [[.27, .25], [.73, .25], [.27, .5], [.73, .5], [.27, .75], [.73, .75]]
  };
  function drawDie(parent, x, y, size, face) {
    var g = S.el("g", { transform: "translate(" + x + " " + y + ")" }, parent);
    S.el("rect", { x: 0, y: 0, width: size, height: size, rx: size * 0.18, class: "fill-surface stroke-muted", "stroke-width": 1.5 }, g);
    PIPS[face].forEach(function (p) {
      S.el("circle", { cx: p[0] * size, cy: p[1] * size, r: size * 0.085, class: "fill-text" }, g);
    });
    return g;
  }
  /* huy hiệu số thứ tự (đếm n) */
  function badge(parent, cx, cy, label) {
    var g = S.el("g", {}, parent);
    S.el("circle", { cx: cx, cy: cy, r: 10.5, class: "fill-primary" }, g);
    S.el("text", { x: cx, y: cy + 4, "text-anchor": "middle", class: "fill-surface svg-bold", "font-size": 12, text: label }, g);
    return g;
  }

  function figDice() {
    var host = $("#fig-dice"); if (!host) return;
    var fig = host.closest("figure");
    var narrow = isNarrow(host), size = 56;
    var W = narrow ? 300 : 440, cols = narrow ? 3 : 6, gapX = narrow ? 84 : 72, rowH = 92;
    var x0 = (W - ((cols - 1) * gapX + size)) / 2, rows = Math.ceil(6 / cols);
    var ty = 8 + (rows - 1) * rowH + size + 50, H = ty + 66;
    var s = S.create(W, H, "Sáu mặt xúc xắc: đếm n = 6, tô các mặt thuận lợi cho A (ra mặt 6) và B (ra mặt chẵn)");
    var pos = [];
    for (var f = 1; f <= 6; f++) pos.push([x0 + ((f - 1) % cols) * gapX, 8 + Math.floor((f - 1) / cols) * rowH]);
    pos.forEach(function (p, i) { drawDie(s, p[0], p[1], size, i + 1); });
    /* bước 2: khung cam quanh mặt 6 · bước 3: tô tím các mặt chẵn */
    S.el("rect", { "data-step-only": 2, x: pos[5][0] - 5, y: pos[5][1] - 5, width: size + 10, height: size + 10, rx: size * 0.24, class: "fill-accent op-15 stroke-accent", "stroke-width": 3 }, s);
    var gB = S.el("g", { "data-step-only": 3 }, s);
    var ringsB = [1, 3, 5].map(function (i) {
      return S.el("rect", { x: pos[i][0] - 5, y: pos[i][1] - 5, width: size + 10, height: size + 10, rx: size * 0.24, class: "fill-primary op-15 stroke-primary", "stroke-width": 3 }, gB);
    });
    /* bước 1: đánh số 1…6 dưới từng mặt */
    var gN = S.el("g", { "data-step": 1 }, s);
    var badges = pos.map(function (p, i) { return badge(gN, p[0] + size / 2, p[1] + size + 15, String(i + 1)); });
    /* kết quả: mỗi bước thêm 1 dòng */
    var fs = narrow ? 14 : 15, xL = narrow ? 34 : x0 + 22;
    var lines = narrow
      ? ["n = 6 mặt đồng khả năng", "A: k = 1 → P(A) = 1/6", "B: k = 3 → P(B) = 3/6 = 1/2"]
      : ["n = 6 kết quả đồng khả năng", "A = «ra mặt 6»: k = 1 → P(A) = 1/6", "B = «ra mặt chẵn»: k = 3 → P(B) = 3/6 = 1/2"];
    var sw = ["fill-primary", "fill-accent op-35 stroke-accent", "fill-primary op-35 stroke-primary"];
    lines.forEach(function (t, i) {
      var g = S.el("g", { "data-step": i + 1 }, s);
      var y = ty + i * 26;
      swatch(g, xL - 20, y, sw[i]);
      S.el("text", { x: xL, y: y, class: "svg-text" + (i ? " svg-bold" : ""), "font-size": fs, text: t }, g);
    });
    host.appendChild(s);
    onStep(fig, function (k, prev) {
      if (prev === null || k <= prev) return;
      if (k === 1) seq(badges, 170);
      if (k === 3) seq(ringsB, 260);
    });
  }

  /* ---------- 3. Giỏ sản phẩm: đếm n, đếm k, ghép thành 1 ---------- */
  function figBasket() {
    var host = $("#fig-basket"); if (!host) return;
    var fig = host.closest("figure");
    var narrow = isNarrow(host);
    var W = narrow ? 300 : 440, per = narrow ? 5 : 10;
    var iw = narrow ? 40 : 34, ih = narrow ? 46 : 50, gx = narrow ? 54 : 41, gy = ih + 34;
    var bx = narrow ? 22 : 20, by = 42;
    var rowsN = Math.ceil(10 / per), boxH = by + (rowsN - 1) * gy + ih + 14;
    var ty = boxH + 30, barY = ty + 66, H = barY + 50;
    var s = S.create(W, H, "Giỏ có 4 sản phẩm loại 1 và 6 sản phẩm loại 2: đếm n = 10, k = 4 và k = 6");
    S.el("rect", { x: 6, y: 6, width: W - 12, height: boxH, rx: 16, class: "fill-soft stroke-border", "stroke-width": 2 }, s);
    var pos = [];
    for (var i = 0; i < 10; i++) {
      var t = i < 4 ? 1 : 2, x = bx + (i % per) * gx, y = by + Math.floor(i / per) * gy;
      pos.push([x, y]);
      S.el("rect", { x: x, y: y, width: iw, height: ih, rx: 8, class: (t === 1 ? "fill-a stroke-a" : "fill-b stroke-b") + " op-50", "stroke-width": 2 }, s);
      S.el("text", { x: x + iw / 2, y: y + ih / 2 + 6, "text-anchor": "middle", class: "svg-text svg-bold", "font-size": 16, text: String(t) }, s);
    }
    /* bước 2, 3: khoanh từng sản phẩm thuận lợi */
    function rings(from, to, cls, step) {
      var g = S.el("g", { "data-step-only": step }, s), out = [];
      for (var j = from; j < to; j++) out.push(S.el("rect", { x: pos[j][0] - 4, y: pos[j][1] - 4, width: iw + 8, height: ih + 8, rx: 10, class: "fill-none " + cls, "stroke-width": 3 }, g));
      return out;
    }
    var ringsC = rings(0, 4, "stroke-a", 2), ringsD = rings(4, 10, "stroke-b", 3);
    /* bước 1: đánh số 1…10 */
    var gN = S.el("g", { "data-step": 1 }, s);
    var badges = pos.map(function (p, j) { return badge(gN, p[0] + iw / 2, p[1] - 14, String(j + 1)); });
    /* các dòng kết quả */
    var fs = narrow ? 14 : 15, xL = 34;
    var lines = narrow
      ? ["n = 10 sản phẩm", "Loại 1: k = 4 → P(C) = 4/10", "Loại 2: k = 6 → P(D) = 6/10"]
      : ["n = 10 sản phẩm đồng khả năng", "C = loại 1: k = 4 → P(C) = 4/10 = 0,4", "D = loại 2: k = 6 → P(D) = 6/10 = 0,6"];
    var sw = ["fill-primary", "fill-a op-50 stroke-a", "fill-b op-50 stroke-b"];
    lines.forEach(function (txt, j) {
      var g = S.el("g", { "data-step": j + 1 }, s), y = ty + j * 24;
      swatch(g, xL - 20, y, sw[j]);
      S.el("text", { x: xL, y: y, class: "svg-text" + (j ? " svg-bold" : ""), "font-size": fs, text: txt }, g);
    });
    /* thanh 0 → 1: phần loại 1 (0,4) rồi phần loại 2 (0,6) */
    var x0 = 20, tw = W - 40, bh = 22;
    var defs = S.el("defs", {}, s), cp = S.el("clipPath", { id: "basket-bar-clip" }, defs);
    S.el("rect", { x: x0, y: barY, width: tw, height: bh, rx: bh / 2 }, cp);
    S.el("rect", { x: x0, y: barY, width: tw, height: bh, rx: bh / 2, class: "fill-soft stroke-border", "stroke-width": 1.5 }, s);
    var clip = S.el("g", { "clip-path": "url(#basket-bar-clip)" }, s);
    var segC = S.el("rect", { "data-step": 2, x: x0, y: barY, width: tw * 0.4, height: bh, class: "fill-a op-50 stroke-surface", "stroke-width": 2 }, clip);
    var segD = S.el("rect", { "data-step": 3, x: x0 + tw * 0.4, y: barY, width: tw * 0.6, height: bh, class: "fill-b op-50 stroke-surface", "stroke-width": 2 }, clip);
    var labC = S.el("text", { "data-step": 2, x: x0 + tw * 0.2, y: barY + 16, "text-anchor": "middle", class: "svg-text svg-bold", "font-size": 13, text: "0,4" }, s);
    var labD = S.el("text", { "data-step": 3, x: x0 + tw * 0.7, y: barY + 16, "text-anchor": "middle", class: "svg-text svg-bold", "font-size": 13, text: "0,6" }, s);
    S.el("text", { x: x0, y: barY + bh + 18, "text-anchor": "middle", class: "svg-muted", text: "0" }, s);
    S.el("text", { x: x0 + tw, y: barY + bh + 18, "text-anchor": "middle", class: "svg-muted", text: "1" }, s);
    S.el("text", { "data-step": 4, x: W / 2, y: barY + bh + 20, "text-anchor": "middle", class: "fill-primary svg-bold", "font-size": 14, text: "P(C) + P(D) = 0,4 + 0,6 = 1" }, s);
    host.appendChild(s);
    onStep(fig, function (k, prev) {
      if (prev === null || k <= prev) return;
      if (k === 1) seq(badges, 120);
      /* khoanh xong từng sản phẩm thì phần tương ứng trên thanh mới mọc ra */
      if (k === 2) { seq(ringsC, 220); grow(segC, "x", 800); seq([labC], 0, 1300); }
      if (k === 3) { seq(ringsD, 170); grow(segD, "x", 950); seq([labD], 0, 1450); }
    });
  }

  /* ---------- 4. Tần suất tiến về xác suất: gieo 10 → 100 → 1000 lần ---------- */
  /* chọn m số khác nhau trong [from, to] */
  function pickDistinct(rnd, from, to, m) {
    var a = [];
    for (var i = from; i <= to; i++) a.push(i);
    for (var j = a.length - 1; j > 0; j--) { var r = Math.floor(rnd() * (j + 1)), t = a[j]; a[j] = a[r]; a[r] = t; }
    return a.slice(0, m);
  }
  function figFreq() {
    var host = $("#fig-freq"); if (!host) return;
    var fig = host.closest("figure");
    /* các lần ra mặt 6: 4 lần trong 10 lần đầu, tổng 19 lần sau 100 lần, tổng 170 lần sau 1000 lần */
    var rnd = seeded(37), hit = {};
    [2, 5, 6, 9].forEach(function (i) { hit[i] = 1; });
    pickDistinct(rnd, 11, 100, 15).forEach(function (i) { hit[i] = 1; });
    pickDistinct(rnd, 101, 1000, 151).forEach(function (i) { hit[i] = 1; });
    var f = [0], k = 0;
    for (var n = 1; n <= 1000; n++) { if (hit[n]) k++; f[n] = k / n; }

    var narrow = isNarrow(host);
    var W = narrow ? 330 : 560, H = narrow ? 250 : 280, P = { l: 44, r: narrow ? 14 : 22, t: 14, b: 46 };
    var iw = W - P.l - P.r, ih = H - P.t - P.b, YMAX = 0.6;
    function Xn(v) { return P.l + Math.log(v) / Math.LN10 / 3 * iw; }
    function Yv(v) { return P.t + ih - v / YMAX * ih; }
    var s = S.create(W, H, "Tần suất ra mặt 6 sau 10, 100 và 1000 lần gieo tiến dần về 1/6");
    [0, 0.2, 0.4, 0.6].forEach(function (v) {
      S.el("line", { x1: P.l, x2: W - P.r, y1: Yv(v), y2: Yv(v), class: "svg-grid" }, s);
      S.el("text", { x: P.l - 6, y: Yv(v) + 4, "text-anchor": "end", class: "svg-muted", text: fmt(v, 1) }, s);
    });
    [1, 10, 100, 1000].forEach(function (v) {
      S.el("line", { x1: Xn(v), x2: Xn(v), y1: Yv(0), y2: Yv(0) + 5, class: "svg-line" }, s);
      S.el("text", { x: Xn(v), y: Yv(0) + 19, "text-anchor": v === 1 ? "start" : (v === 1000 ? "end" : "middle"), class: "svg-muted", text: String(v) }, s);
    });
    S.el("line", { x1: P.l, x2: W - P.r, y1: Yv(0), y2: Yv(0), class: "svg-line" }, s);
    S.el("line", { x1: P.l, x2: P.l, y1: P.t, y2: Yv(0), class: "svg-line" }, s);
    S.el("text", { x: P.l + iw / 2, y: H - 8, "text-anchor": "middle", class: "svg-muted", text: "Số lần gieo n" }, s);
    S.el("text", { x: 12, y: P.t + ih / 2, "text-anchor": "middle", class: "svg-muted", transform: "rotate(-90 12 " + (P.t + ih / 2) + ")", text: "Tần suất k/n" }, s);
    /* xác suất thật 1/6 */
    S.el("line", { x1: P.l, x2: W - P.r, y1: Yv(1 / 6), y2: Yv(1 / 6), class: "stroke-danger svg-dash", "stroke-width": 2 }, s);
    S.el("text", { x: W - P.r - 2, y: Yv(1 / 6) + 18, "text-anchor": "end", class: "fill-danger svg-bold", "font-size": 13, text: "P = 1/6" }, s);
    /* bước 4: vạch đỏ đo độ lệch (đặt trước chấm để chấm nằm trên) */
    var gGap = S.el("g", { "data-step": 4, class: "stroke-danger", "stroke-width": 2.5, fill: "none", "stroke-linecap": "round" }, s);
    [10, 100, 1000].forEach(function (v) {
      var x = Xn(v) - 12, y1 = Yv(f[v]), y2 = Yv(1 / 6);
      S.el("path", { d: "M" + x + " " + y1 + "V" + y2 + "M" + (x - 4) + " " + y1 + "H" + (x + 4) + "M" + (x - 4) + " " + y2 + "H" + (x + 4) }, gGap);
    });
    /* bước 1–3: đường tần suất + chấm tại n = 10, 100, 1000 */
    var marks = [];
    [[1, 10], [10, 100], [100, 1000]].forEach(function (seg, i) {
      var d = "";
      for (var m = seg[0]; m <= seg[1]; m++) d += (m === seg[0] ? "M" : "L") + Xn(m).toFixed(1) + " " + Yv(f[m]).toFixed(1);
      S.el("path", { "data-step": i + 1, d: d, class: "stroke-a", fill: "none", "stroke-width": 2.4, "stroke-linejoin": "round", "stroke-linecap": "round" }, s);
    });
    [[10, "0,4", "start", 8, -8], [100, "0,19", "middle", 0, -12], [1000, "0,17", "end", -8, -12]].forEach(function (o, i) {
      var g = S.el("g", { "data-step": i + 1 }, s), x = Xn(o[0]), y = Yv(f[o[0]]);
      S.el("circle", { cx: x, cy: y, r: 5.5, class: "fill-a stroke-surface", "stroke-width": 2 }, g);
      S.el("text", { x: x + o[3], y: y + o[4], "text-anchor": o[2], class: "svg-text svg-bold", "font-size": 13, text: o[1] }, g);
      marks.push(g);
    });
    host.appendChild(s);
    /* chấm và số chỉ hiện sau khi đường đã vẽ tới nơi */
    onStep(fig, function (k, prev) {
      if (prev === null || k <= prev || k > 3 || still()) return;
      cancelAnims(marks[k - 1]);
      A.appear(marks[k - 1], 620);
    });
  }

  /* ---------- 5. Định nghĩa hình học: thả hạt ngẫu nhiên vào hình vuông ---------- */
  function initGeo() {
    var fig = $("#fig-geo"); if (!fig) return;
    var layer = $("#geo-dots", fig), nEl = $("#geo-n", fig), kEl = $("#geo-k", fig), cmp = $("#geo-cmp", fig);
    if (!layer || !nEl || !kEl || !cmp) return;
    var TARGET = [0, 0, 40, 400], P_TRUE = Math.PI / 4;
    var rnd = seeded(150), pts = [], hitsUpTo = [0];
    for (var i = 0; i < 400; i++) {
      var x = 20 + rnd() * 200, y = 20 + rnd() * 200;
      var h = (x - 120) * (x - 120) + (y - 120) * (y - 120) <= 10000;
      pts.push({ x: x, y: y, h: h });
      hitsUpTo.push(hitsUpTo[i] + (h ? 1 : 0));
    }
    var shown = 0, token = 0, step = 0;
    function stats(n) {
      var k = hitsUpTo[n];
      nEl.textContent = fmt(n, 0);
      kEl.textContent = fmt(k, 0);
      cmp.innerHTML = cmpRow("Tỉ lệ trúng k/n", n ? k / n : NaN) +
        cmpRow("S<sub>A</sub>/S = π/4", step >= 1 ? P_TRUE : NaN, "theory");
    }
    function radius(total) { return total > 100 ? 2.6 : 4; }
    function update(k, prev) {
      step = k; token++;
      var target = TARGET[k], r = radius(target);
      while (shown > target) { layer.removeChild(layer.lastChild); shown--; }
      $all("circle", layer).forEach(function (c) { c.setAttribute("r", r); });
      var from = shown, added = [];
      for (var j = from; j < target; j++) {
        added.push(S.el("circle", { cx: pts[j].x.toFixed(1), cy: pts[j].y.toFixed(1), r: r, class: pts[j].h ? "fill-danger" : "fill-muted" }, layer));
      }
      shown = target;
      if (!added.length || still() || prev === null) { stats(shown); return; }
      /* hạt rơi lần lượt, bộ đếm chạy theo số hạt đã chạm đất */
      var gap = added.length > 100 ? 6 : 45, dur = 420, my = token, t0 = performance.now();
      added.forEach(function (c, j) {
        c.animate([{ transform: "translateY(-18px)", opacity: 0 }, { transform: "none", opacity: 1 }],
          { duration: dur, delay: j * gap, easing: "cubic-bezier(.3,.7,.4,1)", fill: "backwards" });
      });
      (function tick(now) {
        if (my !== token) return;
        var landed = Math.max(0, Math.min(added.length, Math.floor((now - t0 - dur * 0.7) / gap) + 1));
        stats(from + landed);
        if (landed < added.length) requestAnimationFrame(tick);
      })(t0);
    }
    stats(0);
    onStep(fig, update);
  }

  /* ---------- 6. Bảng & biểu đồ Hemoglobin ---------- */
  var HB = {
    labels: ["8–8,9", "9–9,9", "10–10,9", "11–11,9", "12–12,9", "13–13,9", "14–14,9", "15–15,9"],
    names: ["8 – 8,9", "9 – 9,9", "10 – 10,9", "11 – 11,9", "12 – 12,9", "13 – 13,9", "14 – 14,9", "15 – 15,9"],
    counts: [1, 3, 14, 19, 14, 13, 5, 1],
    upper: [9, 10, 11, 12, 13, 14, 15, 16],
    n: 70
  };

  /* Bảng "xây" từng dòng: cột tần suất mọc lên, thanh tích lũy cộng dồn tới 100% */
  function figHb(table) {
    var host = $("#fig-hb"); if (!host) return;
    var fig = host.closest("figure");
    var narrow = isNarrow(host, 520);
    var W = narrow ? 340 : 600, PL = 44, PR = 12, PT = 26, ih = 150;
    var iw = W - PL - PR, bw = iw / 8, axisY = PT + ih;
    var cy = narrow ? 244 : 230, ch = 22, H = cy + ch + 56;
    var vals = HB.counts.map(function (c) { return c / HB.n * 100; });
    var cum = [0];
    HB.counts.forEach(function (c, i) { cum.push(cum[i] + c); });
    var s = S.create(W, H, "Biểu đồ cột tần suất hemoglobin của 70 phụ nữ và thanh tần suất tích lũy");
    [0, 10, 20, 30].forEach(function (v) {
      var y = axisY - v / 30 * ih;
      S.el("line", { x1: PL, x2: W - PR, y1: y, y2: y, class: "svg-grid" }, s);
      S.el("text", { x: PL - 6, y: y + 4, "text-anchor": "end", class: "svg-muted", text: v + "%" }, s);
    });
    var bars = [];
    vals.forEach(function (v, i) {
      var g = S.el("g", { "data-step": i + 1 }, s);
      var bh = v / 30 * ih, x = PL + i * bw + bw * 0.15, y = axisY - bh;
      var r = S.el("rect", { x: x, y: y, width: bw * 0.7, height: bh, rx: narrow ? 4 : 6, class: "fill-primary" }, g);
      S.el("title", { text: HB.names[i] + " g/dl: " + HB.counts[i] + " người" }, r);
      S.el("text", { x: x + bw * 0.35, y: y - 5, "text-anchor": "middle", class: "svg-text svg-bold", "font-size": narrow ? 11.5 : 13, text: narrow ? U.fmtFixed(v, 1) : U.fmtFixed(v, 2) + "%" }, g);
      bars.push(r);
    });
    S.el("line", { x1: PL, x2: W - PR, y1: axisY, y2: axisY, class: "svg-line" }, s);
    HB.labels.forEach(function (lab, i) {
      S.el("text", { x: PL + i * bw + bw / 2, y: axisY + 18, "text-anchor": "middle", class: "svg-text", "font-size": 13, text: narrow ? String(HB.upper[i] - 1) : lab }, s);
    });
    if (narrow) S.el("text", { x: W / 2, y: axisY + 36, "text-anchor": "middle", class: "svg-muted", text: "Hb (g/dl) · cột “11” = khoảng 11 – 11,9" }, s);
    /* thanh tích lũy */
    function CX(p) { return PL + p / 100 * iw; }
    S.el("text", { x: PL, y: cy - 9, class: "svg-muted", text: "Tần suất tích lũy (cộng dồn)" }, s);
    var defs = S.el("defs", {}, s), cp = S.el("clipPath", { id: "hb-cum-clip" }, defs);
    S.el("rect", { x: PL, y: cy, width: iw, height: ch, rx: ch / 2 }, cp);
    S.el("rect", { x: PL, y: cy, width: iw, height: ch, rx: ch / 2, class: "fill-soft stroke-border", "stroke-width": 1.5 }, s);
    var clip = S.el("g", { "clip-path": "url(#hb-cum-clip)" }, s), segs = [];
    HB.counts.forEach(function (c, i) {
      var a = cum[i] / HB.n * 100, b = cum[i + 1] / HB.n * 100;
      segs.push(S.el("rect", { "data-step": i + 1, x: CX(a), y: cy, width: CX(b) - CX(a), height: ch, class: "fill-primary stroke-surface", "stroke-width": 1.5 }, clip));
    });
    S.el("line", { x1: CX(50), x2: CX(50), y1: cy - 4, y2: cy + ch + 4, class: "stroke-text svg-dash", "stroke-width": 1.5 }, s);
    [[0, "start"], [50, "middle"], [100, "end"]].forEach(function (t) {
      S.el("text", { x: CX(t[0]), y: cy + ch + 16, "text-anchor": t[1], class: "svg-muted", text: t[0] + "%" }, s);
    });
    var ft = S.el("text", { x: W / 2, y: cy + ch + 42, "text-anchor": "middle", class: "svg-text svg-bold", "font-size": narrow ? 13 : 14 }, s);
    host.appendChild(s);

    var shownPct = 0;
    function formula(k, animate) {
      var pct = cum[k] / HB.n * 100;
      ft.textContent = "";
      if (!k) {
        S.el("tspan", { class: "svg-muted", text: "Tích lũy: " }, ft);
        S.el("tspan", { class: "fill-primary", text: "0%" }, ft);
      } else {
        var expr = (k === 1 ? "1" : cum[k - 1] + " + " + HB.counts[k - 1] + " = " + cum[k]) + " người → " + cum[k] + "/70 " + (k === 8 ? "=" : "≈") + " ";
        S.el("tspan", { text: (narrow ? "" : "Cộng dồn: ") + expr }, ft);
      }
      var p = k ? S.el("tspan", { class: "fill-primary", text: U.fmtFixed(pct, 2) + "%" }, ft) : null;
      if (p && animate && A) A.countUp(p, pct, { from: shownPct, decimals: 2, suffix: "%", duration: 800 });
      shownPct = pct;
    }
    onStep(fig, function (k, prev) {
      /* dòng đang xét tô cam, các dòng đã cộng tô tím (dùng classList để không xoá .step-off của anim.js) */
      bars.concat(segs).forEach(function (b, j) {
        var cur = j % 8 === k - 1;
        b.classList.toggle("fill-accent", cur);
        b.classList.toggle("fill-primary", !cur);
      });
      var anim = prev !== null && k > prev && !still();
      formula(k, anim);
      if (anim) {
        for (var i = prev; i < k; i++) {
          grow(bars[i], "y", (i - prev) * 160);
          grow(segs[i], "x", 350 + (i - prev) * 160, 600);
        }
      }
      if (prev !== null && table) { if (k) table.select(k - 1); else table.clear(); }
    });
  }

  function hbTable() {
    var table = $("#hb-table"), out = $("#hb-read");
    if (!table || !out) return null;
    var rows = $all("tbody tr[data-i]", table), hint = out.innerHTML;
    function select(i) {
      var cum = 0;
      for (var j = 0; j <= i; j++) cum += HB.counts[j];
      rows.forEach(function (r, j) {
        r.classList.toggle("sel", j <= i);
        r.classList.toggle("sel-last", j === i);
      });
      var p = cum / HB.n * 100;
      var head = i === 0 ? "Chỉ tính dòng đầu" : "Cộng dồn từ dòng đầu đến dòng <b>" + HB.names[i] + "</b>";
      out.innerHTML = "📊 " + head + ": " + cum + " người. Vậy $\\dfrac{" + cum + "}{70}\\approx " +
        U.fmtFixed(p, 2).replace(",", "{,}") + "\\%$ phụ nữ có Hb <b>dưới " + HB.upper[i] + " g/dl</b>." +
        (i === 3 ? " (Theo WHO đây là ngưỡng thiếu máu ở phụ nữ.)" : "") +
        (i === rows.length - 1 ? " Dòng cuối luôn là 100%." : "");
      math(out);
    }
    function clear() {
      rows.forEach(function (r) { r.classList.remove("sel", "sel-last"); });
      out.innerHTML = hint;
    }
    rows.forEach(function (r, i) {
      r.addEventListener("click", function () { select(i); });
      r.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(i); } });
    });
    return { select: select, clear: clear };
  }

  /* ---------- 7. Mô phỏng luật số lớn ---------- */
  function initLLN() {
    var root = $("#lln"); if (!root) return;
    var sel = $("#lln-exp", root), chart = $("#lln-chart", root), statsEl = $("#lln-stats", root),
      lastEl = $("#lln-last", root), noteEl = $("#lln-note", root);
    function die() { return U.randInt(1, 6); }
    var EXPS = {
      die6: { p: 1 / 6, pTxt: "1/6", roll: die, hit: function (r) { return r === 6; }, show: String },
      coin: { p: 1 / 2, pTxt: "1/2", roll: function () { return Math.random() < 0.5 ? "S" : "N"; }, hit: function (r) { return r === "S"; }, show: String },
      even: { p: 1 / 2, pTxt: "1/2", roll: die, hit: function (r) { return r % 2 === 0; }, show: String },
      ge5: { p: 1 / 3, pTxt: "1/3", roll: die, hit: function (r) { return r >= 5; }, show: String }
    };
    var MAX_N = 100000;
    var st;

    function reset() { st = { n: 0, k: 0, pts: [], last: [] }; render(); }

    function add(times) {
      var e = EXPS[sel.value];
      for (var i = 0; i < times && st.n < MAX_N; i++) {
        var r = e.roll(), h = e.hit(r);
        st.n++; if (h) st.k++;
        st.pts.push([st.n, st.k / st.n]);
        st.last.push({ r: e.show(r), h: h });
      }
      if (st.last.length > 24) st.last = st.last.slice(-24);
      render();
    }

    function render() {
      var e = EXPS[sel.value];
      var freq = st.n ? st.k / st.n : NaN;
      statsEl.innerHTML =
        stat("Số lần thử n", fmt(st.n, 0)) +
        stat("A xảy ra k", fmt(st.k, 0)) +
        stat("Tần suất k/n", st.n ? fmt(freq, 4) : "—") +
        stat("Xác suất lý thuyết", e.pTxt + " ≈ " + fmt(e.p, 4), true) +
        stat("Chênh lệch", st.n ? fmt(Math.abs(freq - e.p), 4) : "—");
      lastEl.innerHTML = st.last.length
        ? st.last.map(function (o) { return '<span class="chip' + (o.h ? " hit" : "") + '">' + o.r + "</span>"; }).join("")
        : '<span class="muted small">(chưa có)</span>';
      var pts = st.pts;
      if (pts.length > 600) {
        var step = Math.ceil(pts.length / 600), d = [];
        for (var i = 0; i < pts.length; i += step) d.push(pts[i]);
        if (d[d.length - 1] !== pts[pts.length - 1]) d.push(pts[pts.length - 1]);
        pts = d;
      }
      if (X.chart) X.chart.line(chart, {
        series: [{ points: pts, cls: "stroke-a" }],
        xMin: 0, xMax: Math.max(10, st.n), yMin: 0, yMax: 1, yTicks: 4,
        refY: e.p, refLabel: "P = " + e.pTxt,
        xTitle: "Số lần thử n", yTitle: "Tần suất k/n",
        yFmt: function (v) { return fmt(v, 2); },
        width: chartW(chart), height: chartW(chart) < 480 ? 240 : 280,
        label: "Đồ thị tần suất theo số lần thử"
      });
      var msg;
      if (!st.n) msg = "👆 Bấm một nút để bắt đầu. Gợi ý: bấm “+10” vài lần, rồi bấm “+1000”.";
      else if (st.n < 30) msg = "🎢 Khi <b>n còn nhỏ</b>, tần suất nhảy lên xuống thất thường và có thể lệch xa đường đỏ. Chưa tin được!";
      else if (st.n < 500) msg = "🙂 Tần suất bắt đầu <b>“bình tĩnh”</b> lại và dao động quanh đường đỏ. Hãy thử thêm nhiều lần nữa.";
      else msg = "🎯 <b>n đã lớn</b>: tần suất $k/n$ gần như trùng với xác suất lý thuyết. Đây chính là ý tưởng của <b>định nghĩa thống kê</b>: $P(A)\\approx \\frac{k}{n}$ khi $n$ đủ lớn. Người ta gọi đó là <i>luật số lớn</i>.";
      if (st.n >= MAX_N) msg += " (Đã đạt tối đa " + fmt(MAX_N, 0) + " lần. Bấm “Làm lại” để thử lại từ đầu.)";
      noteEl.innerHTML = msg;
      math(noteEl);
    }

    function stat(label, value, small) {
      return '<div class="stat"><span class="stat-label">' + label + '</span><span class="stat-value' + (small ? " small-v" : "") + '">' + value + "</span></div>";
    }

    $all("[data-add]", root).forEach(function (b) {
      b.addEventListener("click", function () { add(parseInt(b.getAttribute("data-add"), 10)); });
    });
    $("#lln-reset", root).addEventListener("click", reset);
    sel.addEventListener("change", reset);
    onResize.push(render);
    reset();
  }

  /* ---------- tiện ích cho trò chơi ---------- */
  function cmpRow(label, value, cls) {
    var w = Math.max(0, Math.min(1, value)) * 100;
    return '<div class="cmp-row"><span>' + label + '</span><span class="cmp-bar ' + (cls || "") + '"><span style="width:' + w.toFixed(1) + '%"></span></span>' +
      '<span class="cmp-val">' + (isFinite(value) ? fmt(value, 3) : "—") + "</span></div>";
  }
  function pickOne(a) { return a[Math.floor(Math.random() * a.length)]; }

  /* ---------- 8. Trò chơi: Hộp bốc viên thuốc ---------- */
  function initPills() {
    var host = $("#game-pills"); if (!host || !X.Game) return;
    var g = X.Game.frame(host, {
      id: "bai3-hop-thuoc",
      title: "Hộp bốc viên thuốc",
      intro: "<b>Bước 1:</b> chỉnh số viên 🔴 đỏ và 🔵 xanh (hoặc bấm “Hộp ngẫu nhiên”), rồi <b>đoán xác suất</b> để ghi điểm. " +
        "<b>Bước 2:</b> <b>bốc thử</b> thật nhiều lần (bốc xong bỏ lại vào hộp) để xem tần suất có tiến về $\\frac{k}{n}$ không."
    });
    var body = g.body, board = g.board;
    body.innerHTML =
      '<div class="split">' +
      '<div>' +
      '<div class="pill-box" id="pb-box"></div>' +
      '<div class="slider-row"><label for="pb-red">🔴 Viên đỏ</label><input type="range" id="pb-red" min="1" max="12" value="3"><b id="pb-red-v">3</b></div>' +
      '<div class="slider-row"><label for="pb-blue">🔵 Viên xanh</label><input type="range" id="pb-blue" min="1" max="12" value="5"><b id="pb-blue-v">5</b></div>' +
      '<div class="btn-row"><button type="button" class="btn small" id="pb-rand">🎲 Hộp ngẫu nhiên (ván mới)</button></div>' +
      "</div>" +
      "<div>" +
      '<p class="step-label">Bước 1: Đoán xác suất</p>' +
      '<p class="game-prompt" id="pb-q"></p>' +
      '<div class="game-options cols-2" id="pb-opts"></div>' +
      '<div class="game-feedback" id="pb-fb"></div>' +
      '<div id="pb-step2" class="locked" aria-disabled="true">' +
      '<p class="step-label gap">Bước 2: Bốc thử (có hoàn lại)</p>' +
      '<div class="btn-row">' +
      '<button type="button" class="btn small" data-draw="1">Bốc 1</button>' +
      '<button type="button" class="btn small" data-draw="10">Bốc 10</button>' +
      '<button type="button" class="btn small primary" data-draw="100">Bốc 100</button>' +
      '<button type="button" class="btn small primary" data-draw="1000">Bốc 1000</button>' +
      '<button type="button" class="btn small" id="pb-clear">↺ Xoá</button>' +
      "</div>" +
      '<div id="pb-stats" class="small"></div>' +
      '<div class="cmp" id="pb-cmp"></div>' +
      '<p class="small muted board-name" id="pb-note"></p>' +
      "</div>" +
      "</div>" +
      "</div>";

    var red = 3, blue = 5, layout = [], target = "đỏ", guessed = false, busy = false;
    var draws = 0, hits = 0;
    var redIn = $("#pb-red", body), blueIn = $("#pb-blue", body);

    function k() { return target === "đỏ" ? red : blue; }
    function other() { return target === "đỏ" ? blue : red; }
    function n() { return red + blue; }

    function makeLayout() {
      var a = [];
      for (var i = 0; i < red; i++) a.push("r");
      for (var j = 0; j < blue; j++) a.push("b");
      layout = U.shuffle(a);
    }

    function drawBox() {
      var host2 = $("#pb-box", body);
      var cols = 6, W = 300, H = 170;
      var s = S.create(W, H, "Hộp có " + red + " viên đỏ và " + blue + " viên xanh");
      S.el("rect", { x: 4, y: 4, width: W - 8, height: H - 8, rx: 16, class: "fill-soft stroke-border", "stroke-width": 2 }, s);
      layout.forEach(function (c, i) {
        var col = i % cols, row = Math.floor(i / cols);
        var x = 20 + col * 45, y = 18 + row * 37;
        var gg = S.el("g", { class: "pill", "data-i": i }, s);
        S.el("rect", { x: x, y: y, width: 38, height: 20, rx: 10, class: "pill-shape " + (c === "r" ? "fill-danger" : "fill-info") }, gg);
        S.el("rect", { x: x + 3, y: y + 3, width: 16, height: 6, rx: 3, class: "fill-surface op-50" }, gg);
      });
      host2.innerHTML = "";
      host2.appendChild(s);
    }

    function options() {
      var kk = k(), nn = n(), oo = other();
      var correct = { a: kk, b: nn };
      var cands = [[kk, oo], [oo, nn], [1, 2], [kk + 1, nn], [kk, nn + 1], [1, nn], [kk - 1, nn]];
      var used = [kk / nn], picked = [correct];
      cands.forEach(function (c) {
        if (picked.length >= 4) return;
        if (c[0] <= 0 || c[1] <= 0) return;
        var v = c[0] / c[1];
        if (used.some(function (u) { return Math.abs(u - v) < 1e-9; })) return;
        used.push(v); picked.push({ a: c[0], b: c[1] });
      });
      return U.shuffle(picked).map(function (o) { return { tex: U.texFrac(o.a, o.b), ok: o === correct, a: o.a, b: o.b }; });
    }

    function newQuestion() {
      guessed = false; draws = 0; hits = 0;
      target = Math.random() < 0.65 ? "đỏ" : "xanh";
      var q = $("#pb-q", body), opts = $("#pb-opts", body), fb = $("#pb-fb", body);
      q.innerHTML = "Bốc ngẫu nhiên 1 viên. Xác suất bốc được viên <b>" + (target === "đỏ" ? "🔴 đỏ" : "🔵 xanh") + "</b> là bao nhiêu?";
      fb.className = "game-feedback"; fb.innerHTML = "";
      opts.innerHTML = "";
      options().forEach(function (o) {
        var b = document.createElement("button");
        b.type = "button";
        b.innerHTML = "$" + o.tex.replace("\\frac", "\\dfrac") + "$";
        b._ok = o.ok; b._o = o;
        b.addEventListener("click", function () { answer(b); });
        opts.appendChild(b);
      });
      lockStep2(true);
      renderDraws();
      math(q); math(opts);
    }

    function answer(btn) {
      if (guessed) return;
      guessed = true;
      var btns = $all("#pb-opts button", body);
      btns.forEach(function (b) { b.disabled = true; if (b._ok) b.classList.add("is-correct"); });
      var fb = $("#pb-fb", body);
      var kk = k(), nn = n(), oo = other();
      var expl = "P(" + target + ") = $\\dfrac{\\text{số viên " + target + "}}{\\text{tổng số viên}} = \\dfrac{" + kk + "}{" + red + "+" + blue + "} = " +
        U.texFrac(kk, nn) + "\\approx " + U.fmtFixed(kk / nn, 3).replace(",", "{,}") + "$.";
      if (btn._ok) {
        board.right();
        fb.className = "game-feedback show ok";
        fb.innerHTML = '<div class="fb-title">' + pickOne(["Chính xác! 🎉", "Giỏi quá! 👏", "Đúng rồi! ✅"]) + "</div>" + expl;
      } else {
        btn.classList.add("is-wrong");
        board.wrong();
        var hint = "";
        if (btn._o.a === kk && btn._o.b === oo) hint = "<br>⚠️ Bạn đã chia số viên " + target + " cho số viên <b>màu kia</b>. Phải chia cho <b>tổng số viên</b> trong hộp!";
        else if (btn._o.a === oo && btn._o.b === nn) hint = "<br>⚠️ Đó là xác suất của <b>màu kia</b> (biến cố đối).";
        else if (btn._o.a === 1 && btn._o.b === 2) hint = "<br>⚠️ Có 2 màu không có nghĩa mỗi màu 1/2: số viên mỗi màu khác nhau nên không đồng khả năng!";
        fb.className = "game-feedback show bad";
        fb.innerHTML = '<div class="fb-title">Chưa đúng 😅</div>' + expl + hint;
      }
      fb.innerHTML += '<div class="game-actions"><button type="button" class="btn small primary" id="pb-next">🎲 Ván mới (hộp khác)</button></div>';
      $("#pb-next", fb).addEventListener("click", function () { randomBox(); });
      math(fb);
      lockStep2(false);
      renderDraws();
    }

    function lockStep2(lock) {
      var s2 = $("#pb-step2", body);
      s2.classList.toggle("locked", lock);
      s2.setAttribute("aria-disabled", lock ? "true" : "false");
      $all("button", s2).forEach(function (b) { b.disabled = lock; });
    }

    function renderDraws() {
      var kk = k(), nn = n(), p = kk / nn;
      var f = draws ? hits / draws : NaN;
      $("#pb-stats", body).innerHTML = "Đã bốc <b>" + fmt(draws, 0) + "</b> lần · ra viên " + target + " <b>" + fmt(hits, 0) + "</b> lần";
      $("#pb-cmp", body).innerHTML =
        cmpRow("Tần suất bốc được", f) +
        cmpRow("Xác suất " + (guessed ? kk + "/" + nn : "= ?"), guessed ? p : NaN, "theory");
      var note = $("#pb-note", body);
      if (!guessed) note.textContent = "Trả lời câu hỏi ở Bước 1 để mở khoá phần bốc thử.";
      else if (draws === 0) note.textContent = "Hãy bốc thử: 10 lần, rồi 100, rồi 1000 lần.";
      else if (draws < 100) note.textContent = "Mới bốc ít lần nên tần suất còn lệch nhiều so với xác suất. Bốc thêm nữa nhé!";
      else note.textContent = "Bốc càng nhiều, thanh xanh (tần suất) càng sát thanh đỏ (xác suất " + kk + "/" + nn + "). Đó là định nghĩa thống kê đang “gặp” định nghĩa cổ điển!";
    }

    function flash(i) {
      var el = $('.pill[data-i="' + i + '"]', body);
      if (!el) return;
      el.classList.add("picked");
      setTimeout(function () { el.classList.remove("picked"); }, 260);
    }

    function drawOnce() {
      var i = Math.floor(Math.random() * layout.length);
      var c = layout[i];
      draws++;
      if ((c === "r" && target === "đỏ") || (c === "b" && target === "xanh")) hits++;
      return i;
    }

    function doDraw(times) {
      if (busy || !guessed) return;
      if (times <= 10) {
        busy = true;
        var left = times;
        (function step() {
          flash(drawOnce()); renderDraws();
          left--;
          if (left > 0) setTimeout(step, 110); else busy = false;
        })();
      } else {
        var last = 0;
        for (var t = 0; t < times; t++) last = drawOnce();
        flash(last);
        renderDraws();
      }
    }

    function syncSliders() {
      redIn.value = red; blueIn.value = blue;
      $("#pb-red-v", body).textContent = red;
      $("#pb-blue-v", body).textContent = blue;
    }

    function onSlider() {
      red = parseInt(redIn.value, 10); blue = parseInt(blueIn.value, 10);
      syncSliders(); makeLayout(); drawBox(); newQuestion();
    }

    function randomBox() {
      var r, b;
      do { r = U.randInt(1, 10); b = U.randInt(1, 10); } while (r === red && b === blue);
      red = r; blue = b;
      syncSliders(); makeLayout(); drawBox(); newQuestion();
    }

    redIn.addEventListener("input", onSlider);
    blueIn.addEventListener("input", onSlider);
    $("#pb-rand", body).addEventListener("click", randomBox);
    $all("[data-draw]", body).forEach(function (b) {
      b.addEventListener("click", function () { doDraw(parseInt(b.getAttribute("data-draw"), 10)); });
    });
    $("#pb-clear", body).addEventListener("click", function () { draws = 0; hits = 0; renderDraws(); });

    syncSliders(); makeLayout(); drawBox(); newQuestion();
    math(host);
  }

  /* ---------- 9. Trò chơi: Ném phi tiêu ---------- */
  var SQ = { x: 10, y: 10, s: 200 };  /* hình vuông 200×200 trong khung 220×220 */
  var SHAPES = [
    {
      name: "Hình tròn nội tiếp", p: Math.PI / 4,
      draw: function (s, cls) { S.el("circle", { cx: 110, cy: 110, r: 100, class: cls }, s); },
      hit: function (x, y) { return (x - 110) * (x - 110) + (y - 110) * (y - 110) <= 10000; },
      explain: "Coi hình vuông có cạnh 2 thì $S=4$. Hình tròn có bán kính 1 nên $S_A=\\pi$. Vậy $P=\\dfrac{\\pi}{4}\\approx 0{,}785$."
    },
    {
      name: "Nửa hình vuông (tam giác)", p: 1 / 2,
      draw: function (s, cls) { S.el("polygon", { points: "10,210 210,10 210,210", class: cls }, s); },
      hit: function (x, y) { return x + y >= 220; },
      explain: "Đường chéo chia hình vuông thành 2 tam giác bằng nhau, nên $P=\\dfrac{S_A}{S}=\\dfrac12=0{,}5$."
    },
    {
      name: "Hình vuông nhỏ ở giữa", p: 1 / 4,
      draw: function (s, cls) { S.el("rect", { x: 60, y: 60, width: 100, height: 100, class: cls }, s); },
      hit: function (x, y) { return x >= 60 && x <= 160 && y >= 60 && y <= 160; },
      explain: "Cạnh hình nhỏ bằng $\\tfrac12$ cạnh hình lớn, nên diện tích bằng $\\left(\\tfrac12\\right)^2=\\tfrac14$ diện tích hình lớn. $P=0{,}25$."
    },
    {
      name: "Hồng tâm nhỏ", p: Math.PI / 16,
      draw: function (s, cls) { S.el("circle", { cx: 110, cy: 110, r: 50, class: cls }, s); },
      hit: function (x, y) { return (x - 110) * (x - 110) + (y - 110) * (y - 110) <= 2500; },
      explain: "Coi cạnh hình vuông là 2 thì $S=4$. Hồng tâm có bán kính $0{,}5$ nên $S_A=\\pi\\cdot0{,}5^2=0{,}25\\pi$. Vậy $P=\\dfrac{0{,}25\\pi}{4}=\\dfrac{\\pi}{16}\\approx 0{,}196$."
    },
    {
      name: "Dải ngang ở giữa", p: 1 / 3,
      draw: function (s, cls) { S.el("rect", { x: 10, y: 10 + 200 / 3, width: 200, height: 200 / 3, class: cls }, s); },
      hit: function (x, y) { return y >= 10 + 200 / 3 && y <= 10 + 400 / 3; },
      explain: "Dải có chiều rộng bằng hình vuông, chiều cao bằng $\\tfrac13$, nên $P=\\dfrac13\\approx 0{,}333$."
    },
    {
      name: "Tam giác nhỏ ở góc", p: 1 / 8,
      draw: function (s, cls) { S.el("polygon", { points: "10,10 110,10 10,110", class: cls }, s); },
      hit: function (x, y) { return (x - 10) + (y - 10) <= 100; },
      explain: "Coi cạnh hình vuông là 2 thì $S=4$. Tam giác vuông có 2 cạnh góc vuông bằng 1 nên $S_A=\\tfrac12$. Vậy $P=\\dfrac{1/2}{4}=\\dfrac18=0{,}125$."
    }
  ];

  function initDarts() {
    var host = $("#game-darts"); if (!host || !X.Game) return;
    var g = X.Game.frame(host, {
      id: "bai3-phi-tieu",
      title: "Ném phi tiêu",
      intro: "Phi tiêu rơi <b>ngẫu nhiên đều</b> trong hình vuông. <b>Bước 1:</b> nhìn hình và đoán xác suất rơi vào <b>vùng tô màu</b>. " +
        "<b>Bước 2:</b> ném thật nhiều phi tiêu (bấm nút hoặc chạm vào bảng) để xem tỉ lệ trúng có tiến về $\\dfrac{S_A}{S}$ không."
    });
    var body = g.body, board = g.board;
    body.innerHTML =
      '<div class="split">' +
      '<div><div class="dart-board" id="dt-board" title="Chạm để ném 1 phi tiêu"></div>' +
      '<p class="small muted center board-name" id="dt-name"></p></div>' +
      "<div>" +
      '<p class="step-label">Bước 1: Đoán xác suất</p>' +
      '<p class="game-prompt">Xác suất phi tiêu rơi vào <b>vùng tô màu</b> là khoảng bao nhiêu?</p>' +
      '<div class="game-options cols-2" id="dt-opts"></div>' +
      '<div class="game-feedback" id="dt-fb"></div>' +
      '<div id="dt-step2" class="locked" aria-disabled="true">' +
      '<p class="step-label gap">Bước 2: Ném thử</p>' +
      '<div class="btn-row">' +
      '<button type="button" class="btn small" data-throw="1">Ném 1</button>' +
      '<button type="button" class="btn small" data-throw="10">Ném 10</button>' +
      '<button type="button" class="btn small primary" data-throw="100">Ném 100</button>' +
      '<button type="button" class="btn small primary" data-throw="1000">Ném 1000</button>' +
      '<button type="button" class="btn small" id="dt-clear">↺ Xoá</button>' +
      "</div>" +
      '<div id="dt-stats" class="small"></div>' +
      '<div class="cmp" id="dt-cmp"></div>' +
      "</div>" +
      "</div>" +
      "</div>";

    var cur = -1, guessed = false, n = 0, k = 0, dotsLayer = null, drawn = 0, MAX_DOTS = 1500;

    function drawBoard() {
      var sh = SHAPES[cur];
      var s = S.create(220, 220, "Bảng phi tiêu: " + sh.name);
      S.el("rect", { x: SQ.x, y: SQ.y, width: SQ.s, height: SQ.s, class: "fill-soft stroke-text", "stroke-width": 2 }, s);
      sh.draw(s, "fill-primary op-35 stroke-primary");
      dotsLayer = S.el("g", {}, s);
      var hostB = $("#dt-board", body);
      hostB.innerHTML = "";
      hostB.appendChild(s);
      $("#dt-name", body).textContent = "Vùng tô màu: " + sh.name;
    }

    function guessOptions() {
      var p = SHAPES[cur].p;
      var pool = SHAPES.map(function (s) { return s.p; }).concat([0.6, 0.9, 0.05, 0.4, 0.7]);
      pool = U.shuffle(pool);
      var picked = [p];
      pool.forEach(function (v) {
        if (picked.length >= 4) return;
        if (picked.every(function (u) { return Math.abs(u - v) > 0.05; })) picked.push(v);
      });
      return U.shuffle(picked).map(function (v) { return { v: v, ok: v === p }; });
    }

    function newRound() {
      var next;
      do { next = Math.floor(Math.random() * SHAPES.length); } while (next === cur);
      cur = next; guessed = false; n = 0; k = 0; drawn = 0;
      drawBoard();
      var opts = $("#dt-opts", body), fb = $("#dt-fb", body);
      fb.className = "game-feedback"; fb.innerHTML = "";
      opts.innerHTML = "";
      guessOptions().forEach(function (o) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = "≈ " + U.fmtFixed(o.v, 2);
        b._ok = o.ok;
        b.addEventListener("click", function () { answer(b); });
        opts.appendChild(b);
      });
      lock(true);
      renderStats();
    }

    function answer(btn) {
      if (guessed) return;
      guessed = true;
      $all("#dt-opts button", body).forEach(function (b) { b.disabled = true; if (b._ok) b.classList.add("is-correct"); });
      var sh = SHAPES[cur], fb = $("#dt-fb", body);
      if (btn._ok) {
        board.right();
        fb.className = "game-feedback show ok";
        fb.innerHTML = '<div class="fb-title">' + pickOne(["Mắt tinh quá! 🎯", "Chính xác! 🎉", "Đúng rồi! ✅"]) + "</div>" + sh.explain;
      } else {
        btn.classList.add("is-wrong");
        board.wrong();
        fb.className = "game-feedback show bad";
        fb.innerHTML = '<div class="fb-title">Chưa đúng 😅</div>' + sh.explain;
      }
      fb.innerHTML += '<p class="small board-name">Giờ hãy ném thử để kiểm chứng 👇</p>' +
        '<div class="game-actions"><button type="button" class="btn small primary" id="dt-next">🎯 Hình mới</button></div>';
      $("#dt-next", fb).addEventListener("click", newRound);
      math(fb);
      lock(false);
      renderStats();
    }

    function lock(on) {
      var s2 = $("#dt-step2", body);
      s2.classList.toggle("locked", on);
      s2.setAttribute("aria-disabled", on ? "true" : "false");
      $all("button", s2).forEach(function (b) { b.disabled = on; });
    }

    function throwDarts(times) {
      if (!guessed) return;
      var sh = SHAPES[cur];
      for (var t = 0; t < times; t++) {
        var x = SQ.x + Math.random() * SQ.s, y = SQ.y + Math.random() * SQ.s;
        var h = sh.hit(x, y);
        n++; if (h) k++;
        if (drawn < MAX_DOTS) {
          S.el("circle", { cx: x.toFixed(1), cy: y.toFixed(1), r: times >= 1000 ? 1.6 : 2.4, class: h ? "fill-danger" : "fill-text op-50" }, dotsLayer);
          drawn++;
        }
      }
      renderStats();
    }

    function renderStats() {
      var sh = SHAPES[cur];
      $("#dt-stats", body).innerHTML = "Đã ném <b>" + fmt(n, 0) + "</b> phi tiêu · trúng vùng màu <b>" + fmt(k, 0) + "</b>" +
        (drawn >= MAX_DOTS ? ' <span class="muted">(chỉ vẽ ' + MAX_DOTS + " chấm đầu)</span>" : "");
      $("#dt-cmp", body).innerHTML =
        cmpRow("Tỉ lệ trúng k/n", n ? k / n : NaN) +
        cmpRow("Tỉ lệ diện tích thật", guessed ? sh.p : NaN, "theory");
    }

    $all("[data-throw]", body).forEach(function (b) {
      b.addEventListener("click", function () { throwDarts(parseInt(b.getAttribute("data-throw"), 10)); });
    });
    $("#dt-clear", body).addEventListener("click", function () {
      n = 0; k = 0; drawn = 0; if (dotsLayer) dotsLayer.innerHTML = ""; renderStats();
    });
    $("#dt-board", body).addEventListener("click", function () { throwDarts(1); });

    newRound();
    math(host);
  }

  /* ---------- khởi động ---------- */
  function init() {
    if (!U || !S) return;
    initScale();
    figDice();
    figBasket();
    figFreq();
    initGeo();
    figHb(hbTable());
    initLLN();
    initPills();
    initDarts();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
