/* =========================================================
   bai-6-7.js — công cụ & trò chơi riêng của Bài 6-7
   - Hiệu ứng thêm cho các hình "từng bước" (data-d, data-grow, data-move-from)
   - Máy tính bảng phân phối (E, V, σ, biểu đồ cột, bậc thang F(x))
   - Mô tả dãy số liệu (TB, trung vị, yếu vị, s², SD, bảng từng bước, biểu đồ chấm)
   - Trò chơi "Chơi 1 lần hay 1000 lần?" và "Bập bênh trung bình"
   ========================================================= */
(function () {
  "use strict";
  var X = window.XSTK || {};
  var U = X.util, SV = X.svg;
  if (!U || !SV) return;
  var el = SV.el;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function math(node) { if (X.math) X.math(node); }
  function near(a, b) { return Math.abs(a - b) < 1e-9; }
  function clean(v) { return Math.round(v * 1e10) / 1e10; }
  /* số dạng TeX với dấu phẩy thập phân */
  function texNum(v, d) { return U.fmt(clean(v), d == null ? 4 : d).replace(/,/g, "{,}"); }
  /* tìm phân số đúng (mẫu ≤ 500) cho số có nhiều chữ số thập phân */
  function toFrac(v) {
    if (Math.abs(v * 1e4 - Math.round(v * 1e4)) < 1e-7) return null; /* đã gọn ≤ 4 chữ số thập phân */
    for (var b = 2; b <= 500; b++) {
      var a = Math.round(v * b);
      if (Math.abs(v * b - a) < 1e-7) return U.frac(a, b);
    }
    return null;
  }
  function tx(src) { return X.tex ? X.tex(src) : src; }
  function niceStep(r) {
    var p = Math.pow(10, Math.floor(Math.log10(r || 1))), m = r / p;
    return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
  }
  /* đọc số: "0,2"  "2/15"  "-4000"  "10.000" */
  function parseVal(s) {
    s = String(s == null ? "" : s).trim().replace(/\s+/g, "").replace(/[−–]/g, "-");
    if (!s) return NaN;
    if (s.indexOf("/") > -1) {
      var p = s.split("/");
      if (p.length !== 2) return NaN;
      var a = parseVal(p[0]), b = parseVal(p[1]);
      return b ? a / b : NaN;
    }
    if (/^-?[1-9]\d{0,2}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
    else if (s.indexOf(",") > -1) s = s.replace(/\./g, "").replace(",", ".");
    var v = Number(s);
    return isFinite(v) ? v : NaN;
  }

  /* =====================================================
     1. Hiệu ứng thêm cho hình "từng bước" (<figure data-anim="steps">)
        anim.js lo việc hiện/ẩn theo bước. Ở đây chỉ thêm 3 thuộc tính
        để chuyển động KỂ LẠI QUÁ TRÌNH (đúng thứ tự, đúng hướng):
        - data-d="600"           chờ 600 ms rồi mới hiện (xếp thứ tự trong cùng 1 bước;
                                 cộng dồn theo các thẻ cha nằm trong phần tử của bước)
        - data-grow="bottom"     cột/thanh "mọc" ra từ cạnh đó (bottom | left | right | center)
        - data-move-from="dx,dy" trượt từ chỗ cũ (lệch dx, dy) về chỗ mới
        - data-pan="sweep|end|start" (hình rộng trong .scroll-x, trên điện thoại):
                                 cuộn ngang theo nét đang vẽ: sweep = từ gốc rồi lướt sang phải
     ===================================================== */
  var A = X.anim;
  var SHAPES = "path,line,polyline,polygon,circle,ellipse,rect,text";
  var GROW = { bottom: ["50% 100%", "scaleY(0)"], left: ["0% 50%", "scaleX(0)"], right: ["100% 50%", "scaleX(0)"], center: ["50% 50%", "scaleX(0)"] };
  function isG(n) { return n.tagName.toLowerCase() === "g"; }
  /* css = true: chỉ lấy CSS transition; ngược lại: chỉ lấy hiệu ứng do JS tạo */
  function anims(n, css) {
    if (!n.getAnimations) return [];
    return n.getAnimations().filter(function (a) { return css ? !!a.transitionProperty : !a.transitionProperty && !a.animationName; });
  }
  function delayOf(node, root) {
    var d = 0;
    for (var n = node; n && n.nodeType === 1; n = n.parentNode) {
      d += parseFloat(n.getAttribute("data-d")) || 0;
      if (n === root) break;
    }
    return d;
  }
  function pan(t) {
    var sx = t.closest(".scroll-x"), mode = t.getAttribute("data-pan");
    if (!sx || sx.scrollWidth <= sx.clientWidth + 4) return;   /* màn hình rộng: không cần cuộn */
    var end = sx.scrollWidth - sx.clientWidth;
    clearTimeout(sx._panT);
    if (mode === "start") { sx.scrollTo({ left: 0, behavior: "smooth" }); return; }
    if (mode === "sweep") {
      sx.scrollTo({ left: 0, behavior: "smooth" });
      sx._panT = setTimeout(function () { sx.scrollTo({ left: end, behavior: "smooth" }); }, 750);
    } else sx.scrollTo({ left: end, behavior: "smooth" });
  }
  /* t: phần tử vừa được anim.js cho hiện ở bước mới */
  function stepFx(t) {
    if (t.hasAttribute("data-pan")) pan(t);
    var done = [];
    var special = (t.matches("[data-grow],[data-move-from]") ? [t] : []).concat($$("[data-grow],[data-move-from]", t));
    special.forEach(function (n) {
      var d = delayOf(n, t);
      [n].concat(isG(n) ? $$(SHAPES, n) : []).forEach(function (k) { anims(k).forEach(function (a) { a.cancel(); }); done.push(k); });
      if (n === t) anims(n, true).forEach(function (a) { a.cancel(); });
      var g = GROW[n.getAttribute("data-grow")];
      if (g) {
        n.style.transformBox = "fill-box"; n.style.transformOrigin = g[0];
        n.animate([{ transform: g[1] }, { transform: "none" }], { duration: 750, delay: d, fill: "backwards", easing: "cubic-bezier(.3,1.25,.6,1)" });
      }
      var mv = n.getAttribute("data-move-from");
      if (mv) {
        var p = mv.split(",").map(parseFloat);
        n.animate([{ transform: "translate(" + (p[0] || 0) + "px," + (p[1] || 0) + "px)" }, { transform: "none" }],
          { duration: 1100, delay: d, fill: "backwards", easing: "cubic-bezier(.65,0,.3,1)" });
      }
    });
    (isG(t) ? $$(SHAPES, t) : [t]).forEach(function (k) {
      if (done.indexOf(k) > -1) return;
      var d = delayOf(k, t);
      if (!d) return;
      if (k === t) anims(k, true).forEach(function (a) { a.cancel(); });
      anims(k).forEach(function (a) { a.effect.updateTiming({ delay: (a.effect.getTiming().delay || 0) + d }); });
    });
  }
  function initStepFx() {
    if (!A || A.reduced || !window.MutationObserver) return;
    $$('figure[data-anim="steps"]').forEach(function (fig) {
      if (!fig.querySelector("[data-d],[data-grow],[data-move-from],[data-pan]")) return;
      new MutationObserver(function (list) {
        var seen = [];
        list.forEach(function (m) {
          var t = m.target;
          /* chỉ xử lý phần tử vừa bỏ lớp step-off, tức là vừa hiện ra */
          if (seen.indexOf(t) > -1 || t.classList.contains("step-off") || (" " + (m.oldValue || "") + " ").indexOf(" step-off ") < 0) return;
          seen.push(t);
          try { stepFx(t); } catch (e) { /* trình duyệt cũ: vẫn còn hiệu ứng mặc định của anim.js */ }
        });
      }).observe(fig, { subtree: true, attributes: true, attributeFilter: ["class"], attributeOldValue: true });
    });
  }

  /* =====================================================
     2. Đồ thị bậc thang F(x) (dùng trong máy tính bảng phân phối)
     ===================================================== */
  function drawStair(box, xs, Fs) {
    var W = 420, H = 250, P = { l: 46, r: 16, t: 16, b: 36 };
    var s = SV.create(W, H, "Đồ thị bậc thang của hàm phân phối F(x)");
    var n = xs.length;
    var xmin = xs[0], xmax = xs[n - 1], span = xmax - xmin || 1, pad = span * 0.28;
    var d0 = xmin - pad, d1 = xmax + pad;
    var iw = W - P.l - P.r, ih = H - P.t - P.b;
    function XX(v) { return P.l + (v - d0) / (d1 - d0) * iw; }
    function YY(v) { return P.t + ih - v * ih; }
    [0, 0.5, 1].forEach(function (v) {
      el("line", { x1: P.l, x2: W - P.r, y1: YY(v), y2: YY(v), class: "svg-grid" }, s);
      el("text", { x: P.l - 6, y: YY(v) + 4, "text-anchor": "end", class: "svg-muted", text: U.fmt(v, 1) }, s);
    });
    el("line", { x1: P.l, x2: W - P.r, y1: YY(0), y2: YY(0), class: "svg-line" }, s);
    var showAll = n <= 7;
    xs.forEach(function (x, i) {
      if (showAll || i === 0 || i === n - 1) {
        el("text", { x: XX(x), y: YY(0) + 18, "text-anchor": "middle", class: "svg-text", "font-size": 12, text: U.fmt(x, 2) }, s);
      }
    });
    el("text", { x: W - P.r, y: H - 4, "text-anchor": "end", class: "svg-muted", text: "x" }, s);
    /* bậc đầu tiên: F = 0 */
    var prevF = 0, startX = P.l;
    for (var i = 0; i < n; i++) {
      var xi = XX(xs[i]);
      el("line", { x1: startX, x2: xi - 5, y1: YY(prevF), y2: YY(prevF), class: "stroke-primary", "stroke-width": 3, "stroke-linecap": "round" }, s);
      el("line", { x1: xi, x2: xi, y1: YY(prevF), y2: YY(Fs[i]), class: "stroke-muted svg-dash", "stroke-width": 1.2 }, s);
      el("circle", { cx: xi, cy: YY(prevF), r: 4.5, class: "fill-surface stroke-primary sw-2" }, s);
      prevF = Fs[i]; startX = xi;
    }
    el("line", { x1: startX, x2: W - P.r, y1: YY(prevF), y2: YY(prevF), class: "stroke-primary", "stroke-width": 3, "stroke-linecap": "round" }, s);
    xs.forEach(function (x, i) { el("circle", { cx: XX(x), cy: YY(Fs[i]), r: 5, class: "fill-primary" }, s); });
    box.innerHTML = "";
    box.appendChild(s);
  }

  /* =====================================================
     3. Máy tính bảng phân phối
     ===================================================== */
  var PRESETS = {
    vd3: { name: "Ví dụ 3 (sản phẩm)", rows: [["0", "2/15"], ["1", "8/15"], ["2", "1/3"]] },
    vd4: { name: "Ví dụ 4 (ba xe)", rows: [["0", "0,012"], ["1", "0,164"], ["2", "0,536"], ["3", "0,288"]] },
    coin: { name: "Trò chơi đồng xu", rows: [["10000", "0,5"], ["-4000", "0,5"]] },
    dice: { name: "Xúc xắc", rows: [["1", "1/6"], ["2", "1/6"], ["3", "1/6"], ["4", "1/6"], ["5", "1/6"], ["6", "1/6"]] },
    two: { name: "2 đồng xu (Bài 1)", rows: [["0", "1/4"], ["1", "1/2"], ["2", "1/4"]] }
  };

  function initDist() {
    var w = $("#w-dist");
    if (!w) return;
    var rows = PRESETS.vd3.rows.map(function (r) { return { x: r[0], p: r[1] }; });
    var wrap = document.createElement("div");
    var presetBtns = Object.keys(PRESETS).map(function (k) {
      return '<button type="button" class="btn small" data-preset="' + k + '">' + PRESETS[k].name + "</button>";
    }).join("");
    wrap.innerHTML =
      '<div class="btn-row"><span class="small muted" style="align-self:center">Mẫu có sẵn:</span>' + presetBtns + "</div>" +
      '<div class="table-wrap"><table class="tbl dist-table"><thead><tr><th>#</th><th>Giá trị x</th><th>Xác suất p = P(X = x)</th><th><span class="visually-hidden">Xoá</span></th></tr></thead><tbody></tbody></table></div>' +
      '<div class="btn-row"><button type="button" class="btn small" data-act="add">＋ Thêm dòng</button></div>' +
      '<div class="dist-check" aria-live="polite"></div>' +
      '<div class="stat-row">' +
      '<div class="stat"><span class="stat-label nt">E(X)</span><span class="stat-value" data-o="e">—</span></div>' +
      '<div class="stat"><span class="stat-label nt">E(X²)</span><span class="stat-value" data-o="e2">—</span></div>' +
      '<div class="stat"><span class="stat-label nt">V(X)</span><span class="stat-value" data-o="v">—</span></div>' +
      '<div class="stat"><span class="stat-label nt">σ(X)</span><span class="stat-value" data-o="sd">—</span></div>' +
      "</div>" +
      '<div class="calc-line" data-o="calc-e"></div>' +
      '<div class="calc-line" data-o="calc-v"></div>' +
      '<div class="w-figs"><div><p class="w-cap">Biểu đồ cột P(X = x)</p><div data-o="bar"></div></div>' +
      '<div><p class="w-cap">Hàm phân phối F(x) = P(X ≤ x)</p><div data-o="stair"></div></div></div>';
    w.appendChild(wrap);
    var tbody = $("tbody", wrap);
    var check = $(".dist-check", wrap);
    function out(k) { return $('[data-o="' + k + '"]', wrap); }

    function renderRows() {
      tbody.innerHTML = "";
      rows.forEach(function (r, i) {
        var tr = document.createElement("tr");
        tr.innerHTML = "<td>" + (i + 1) + "</td>" +
          '<td><input type="text" inputmode="decimal" data-i="' + i + '" data-k="x" aria-label="Giá trị x dòng ' + (i + 1) + '"></td>' +
          '<td><input type="text" inputmode="decimal" data-i="' + i + '" data-k="p" aria-label="Xác suất dòng ' + (i + 1) + '"></td>' +
          '<td><button type="button" class="btn small" data-del="' + i + '" aria-label="Xoá dòng ' + (i + 1) + '">✕</button></td>';
        $('[data-k="x"]', tr).value = r.x;
        $('[data-k="p"]', tr).value = r.p;
        tbody.appendChild(tr);
      });
      compute();
    }

    function pTex(raw, v) {
      var m = String(raw).trim().match(/^(\d+)\s*\/\s*(\d+)$/);
      return m ? "\\tfrac{" + m[1] + "}{" + m[2] + "}" : texNum(v);
    }
    function xTex(v) { var t = texNum(v); return v < 0 ? "(" + t + ")" : t; }
    function withFrac(v) { var f = toFrac(v); return U.fmt(clean(v), 4) + (f ? '<span class="frac-note">= ' + f + "</span>" : ""); }

    function compute() {
      var data = [], bad = false;
      rows.forEach(function (r) {
        var x = parseVal(r.x), p = parseVal(r.p);
        if (r.x === "" && r.p === "") return;
        if (isNaN(x) || isNaN(p)) { bad = true; return; }
        data.push({ x: x, p: p, raw: r.p });
      });
      data.sort(function (a, b) { return a.x - b.x; });
      var dup = data.some(function (d, i) { return i && near(d.x, data[i - 1].x); });
      var outRange = data.some(function (d) { return d.p < 0 || d.p > 1; });
      var sum = clean(data.reduce(function (s, d) { return s + d.p; }, 0));
      var ok = !bad && !dup && !outRange && data.length > 0 && Math.abs(sum - 1) < 1e-6;

      if (bad) { check.className = "dist-check bad"; check.textContent = "✗ Có ô chưa đúng định dạng số (ví dụ hợp lệ: 0,2 hoặc 2/15)."; }
      else if (!data.length) { check.className = "dist-check bad"; check.textContent = "Hãy nhập ít nhất một dòng."; }
      else if (dup) { check.className = "dist-check bad"; check.textContent = "✗ Có giá trị x bị lặp. Mỗi giá trị chỉ ghi một lần (gộp xác suất lại)."; }
      else if (outRange) { check.className = "dist-check bad"; check.textContent = "✗ Mỗi xác suất phải nằm trong khoảng từ 0 đến 1."; }
      else if (!ok) { check.className = "dist-check bad"; check.textContent = "✗ Tổng xác suất = " + U.fmt(sum, 4) + " ≠ 1. Kiểm tra lại, có thể bạn đã tính sai hoặc thiếu trường hợp."; }
      else { check.className = "dist-check ok"; check.textContent = "✓ Tổng xác suất = 1. Đây là một bảng phân phối hợp lệ."; }

      if (!ok) {
        ["e", "e2", "v", "sd"].forEach(function (k) { out(k).textContent = "—"; });
        out("calc-e").innerHTML = ""; out("calc-v").innerHTML = "";
        out("bar").innerHTML = '<p class="small muted">Sửa bảng cho hợp lệ để xem biểu đồ.</p>';
        out("stair").innerHTML = "";
        return;
      }
      var E = clean(data.reduce(function (s, d) { return s + d.x * d.p; }, 0));
      var E2 = clean(data.reduce(function (s, d) { return s + d.x * d.x * d.p; }, 0));
      var V = clean(Math.max(0, E2 - E * E));
      var sd = Math.sqrt(V);
      out("e").innerHTML = withFrac(E);
      out("e2").innerHTML = withFrac(E2);
      out("v").innerHTML = withFrac(V);
      out("sd").textContent = U.fmt(clean(sd), 4);

      var terms = data.map(function (d) { return xTex(d.x) + "\\cdot " + pTex(d.raw, d.p); });
      if (terms.length > 6) terms = terms.slice(0, 3).concat(["\\dots"], terms.slice(-2));
      var big = Math.abs(E) >= 1000 ? 0 : 4;
      if (X.tex) {
        out("calc-e").innerHTML = X.tex("E(X) = \\sum x_i p_i = " + terms.join(" + ") + " = " + texNum(E, big));
        out("calc-v").innerHTML = X.tex("V(X) = E(X^2) - [E(X)]^2 = " + texNum(E2, big) + " - " + (E < 0 ? "(" + texNum(E, big) + ")" : texNum(E, big)) + "^2 = " + texNum(V, big) + ",\\quad \\sigma = \\sqrt{V(X)} \\approx " + texNum(sd, big ? 4 : 2));
      }

      var labels = data.map(function (d) { return U.fmt(d.x, 2); });
      var pmax = Math.max.apply(null, data.map(function (d) { return d.p; }));
      var ymax = Math.min(1, Math.ceil(pmax * 1.18 * 10) / 10) || 0.1, yt = Math.round(ymax * 10);
      if (yt > 5 && yt % 2 === 0) yt = yt / 2;
      X.chart.bar(out("bar"), {
        yMax: ymax, yTicks: yt, animate: animNext,
        labels: labels, values: data.map(function (d) { return d.p; }),
        valueLabels: data.map(function (d) { var r = String(d.raw).trim(); return r.length <= 6 ? r : U.fmt(d.p, 3); }),
        width: 420, height: 250, yFmt: function (v) { return U.fmt(v, 2); }, label: "Biểu đồ cột của bảng phân phối"
      });
      var acc = 0, Fs = data.map(function (d) { acc = clean(acc + d.p); return acc; });
      drawStair(out("stair"), data.map(function (d) { return d.x; }), Fs);
      /* chỉ vẽ dần khi người học chọn một mẫu mới, không vẽ lại theo từng phím gõ */
      if (animNext && A) A.build(out("stair"));
      animNext = false;
    }
    var animNext = false;

    wrap.addEventListener("input", function (e) {
      var t = e.target;
      if (t.matches("input[data-k]")) { rows[+t.getAttribute("data-i")][t.getAttribute("data-k")] = t.value; compute(); }
    });
    wrap.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.hasAttribute("data-preset")) {
        rows = PRESETS[b.getAttribute("data-preset")].rows.map(function (r) { return { x: r[0], p: r[1] }; });
        animNext = true;
        renderRows();
      } else if (b.getAttribute("data-act") === "add") {
        rows.push({ x: "", p: "" }); renderRows();
        var ins = $$('input[data-k="x"]', tbody); if (ins.length) ins[ins.length - 1].focus();
      } else if (b.hasAttribute("data-del")) {
        rows.splice(+b.getAttribute("data-del"), 1);
        if (!rows.length) rows.push({ x: "", p: "" });
        renderRows();
      }
    });
    renderRows();
  }

  /* =====================================================
     4. Mô tả dãy số liệu
     ===================================================== */
  var DATASETS = {
    ha: { name: "Huyết áp (slide)", text: "120 125 130 135 150", unit: "mmHg" },
    cc: { name: "Chiều cao (slide)", text: "153 155 160 162 165 161", unit: "cm" },
    luong: { name: "Lương công ty", text: "7 7 8 8 8 9 9 10 10 120", unit: "triệu" },
    dh: { name: "Đường huyết (Bài 5)", text: "5,0; 5,2; 5,6; 5,2; 6,0", unit: "mmol/L" },
    nhomB: { name: "Nhóm B (mục 6)", text: "110 120 132 144 154", unit: "mmHg" }
  };

  function initData() {
    var w = $("#w-data");
    if (!w) return;
    var wrap = document.createElement("div");
    var presetBtns = Object.keys(DATASETS).map(function (k) {
      return '<button type="button" class="btn small" data-ds="' + k + '">' + DATASETS[k].name + "</button>";
    }).join("");
    wrap.innerHTML =
      '<div class="btn-row"><span class="small muted" style="align-self:center">Mẫu có sẵn:</span>' + presetBtns + "</div>" +
      '<textarea class="data-input" aria-label="Dãy số liệu" spellcheck="false"></textarea>' +
      '<div class="btn-row"><button type="button" class="btn" data-act="outlier">➕ Thêm giá trị ngoại lai</button>' +
      '<button type="button" class="btn" data-act="sort">↕ Sắp xếp tăng dần</button></div>' +
      '<div class="stat-row">' +
      '<div class="stat"><span class="stat-label">Số quan sát N</span><span class="stat-value" data-o="n">—</span></div>' +
      '<div class="stat"><span class="stat-label">Trung bình</span><span class="stat-value" data-o="mean">—</span></div>' +
      '<div class="stat"><span class="stat-label">Trung vị</span><span class="stat-value" data-o="median" style="color:var(--accent)">—</span></div>' +
      '<div class="stat"><span class="stat-label">Yếu vị</span><span class="stat-value" data-o="mode" style="color:var(--set-d)">—</span></div>' +
      '<div class="stat"><span class="stat-label">Phương sai s²</span><span class="stat-value" data-o="var">—</span></div>' +
      '<div class="stat"><span class="stat-label">Độ lệch chuẩn SD</span><span class="stat-value" data-o="sd">—</span></div>' +
      "</div>" +
      '<div class="box tip" data-o="note" style="margin:10px 0"></div>' +
      '<figure class="fig" style="margin:10px 0"><div data-o="dots"></div><figcaption>Biểu đồ chấm: mỗi chấm là một giá trị (các giá trị trùng nhau xếp chồng lên).</figcaption></figure>' +
      '<details class="solution" open><summary>Bảng tính từng bước</summary><div class="sol-body" data-o="steps"></div></details>';
    w.appendChild(wrap);
    var ta = $("textarea", wrap);
    var unit = DATASETS.ha.unit;
    ta.value = DATASETS.ha.text;
    function out(k) { return $('[data-o="' + k + '"]', wrap); }

    function compute() {
      var a = U.parseNumbers(ta.value);
      var n = a.length;
      out("n").textContent = n || "—";
      if (!n) {
        ["mean", "median", "mode", "var", "sd"].forEach(function (k) { out(k).textContent = "—"; });
        out("note").innerHTML = "Hãy nhập ít nhất 1 số."; out("dots").innerHTML = ""; out("steps").innerHTML = "";
        return;
      }
      var m = U.mean(a), med = U.median(a), mo = U.modes(a), v = U.variance(a), sd = Math.sqrt(v);
      out("mean").textContent = U.fmt(clean(m), 2);
      out("median").textContent = U.fmt(clean(med), 2);
      out("mode").textContent = mo.length ? mo.map(function (x) { return U.fmt(x, 2); }).join("; ") : "Không có";
      out("var").textContent = n > 1 ? U.fmt(clean(v), 4) : "—";
      out("sd").textContent = n > 1 ? U.fmt(clean(sd), 2) : "—";

      /* nhận xét */
      var note;
      if (n < 3) note = "Cần ít nhất 3 giá trị để nhận xét hình dạng số liệu.";
      else {
        var diff = m - med, k = sd > 0 ? 3 * diff / sd : 0;
        if (Math.abs(k) < 0.6) note = "<b>Trung bình ≈ trung vị</b>: số liệu khá cân đối. Có thể báo cáo <b>trung bình ± SD</b> = " + U.fmt(clean(m), 2) + " ± " + U.fmt(clean(sd), 2) + (unit ? " " + unit : "") + ".";
        else if (Math.abs(k) < 0.9) note = "Trung bình (" + U.fmt(clean(m), 2) + ") " + (diff > 0 ? "hơi lớn hơn" : "hơi nhỏ hơn") + " trung vị (" + U.fmt(clean(med), 2) + "): số liệu <b>hơi lệch " + (diff > 0 ? "phải" : "trái") + "</b>. Nên báo cáo cả trung bình và trung vị.";
        else if (diff > 0) note = "<b>Trung bình (" + U.fmt(clean(m), 2) + ") &gt; trung vị (" + U.fmt(clean(med), 2) + ")</b>: có giá trị lớn kéo trung bình lên, tức số liệu <b>lệch phải</b>. Nên dùng <b>trung vị</b> làm giá trị tiêu biểu.";
        else note = "<b>Trung bình (" + U.fmt(clean(m), 2) + ") &lt; trung vị (" + U.fmt(clean(med), 2) + ")</b>: có giá trị nhỏ kéo trung bình xuống, tức số liệu <b>lệch trái</b>. Nên dùng <b>trung vị</b> làm giá trị tiêu biểu.";
      }
      out("note").innerHTML = '<p class="box-title">💡 Nhận xét</p><p>' + note + "</p>";

      drawDots(out("dots"), a, m, med);

      /* bảng từng bước */
      var rowsHtml = "", ssum = 0, maxRows = 40;
      a.forEach(function (x, i) {
        var d = x - m, d2 = d * d; ssum += d2;
        if (i < maxRows) rowsHtml += "<tr><td>" + (i + 1) + "</td><td>" + U.fmt(x, 4) + "</td><td>" + U.fmt(clean(d), 4) + "</td><td>" + U.fmt(clean(d2), 4) + "</td></tr>";
      });
      if (n > maxRows) rowsHtml += '<tr><td colspan="4" class="muted">… và ' + (n - maxRows) + " dòng nữa</td></tr>";
      var sorted = U.sorted(a);
      var medExplain = n % 2
        ? "N = " + n + " (lẻ) nên trung vị là số đứng thứ " + ((n + 1) / 2) + " = <b>" + U.fmt(med, 4) + "</b>."
        : "N = " + n + " (chẵn) nên trung vị = (số thứ " + (n / 2) + " + số thứ " + (n / 2 + 1) + ") / 2 = (" + U.fmt(sorted[n / 2 - 1], 4) + " + " + U.fmt(sorted[n / 2], 4) + ") / 2 = <b>" + U.fmt(clean(med), 4) + "</b>.";
      var html =
        "<p><b>Bước 1. Sắp xếp:</b> " + sorted.slice(0, 60).map(function (x) { return U.fmt(x, 4); }).join(" · ") + (n > 60 ? " …" : "") + "<br>" + medExplain + "</p>" +
        "<p><b>Bước 2. Trung bình:</b> " + (X.tex ? X.tex("\\bar x = \\frac{\\sum x_i}{N} = \\frac{" + texNum(U.sum(a)) + "}{" + n + "} = " + texNum(m, 4)) : "") + "</p>" +
        '<div class="dev-table-wrap table-wrap"><table class="tbl"><thead><tr><th>i</th><th>' + tx("x_i") + '</th><th>' + tx("x_i - \\bar x") + '</th><th>' + tx("(x_i - \\bar x)^2") + '</th></tr></thead><tbody>' + rowsHtml +
        '<tr class="total"><td colspan="3">Tổng bình phương độ lệch</td><td>' + U.fmt(clean(ssum), 4) + "</td></tr></tbody></table></div>";
      if (n > 1 && X.tex) {
        html += "<p><b>Bước 3. Phương sai:</b> " + X.tex("s^2 = \\frac{\\sum (x_i - \\bar x)^2}{N - 1} = \\frac{" + texNum(ssum) + "}{" + (n - 1) + "} = " + texNum(v, 4)) + "</p>" +
          "<p><b>Bước 4. Độ lệch chuẩn:</b> " + X.tex("SD = \\sqrt{" + texNum(v, 4) + "} \\approx " + texNum(sd, 2)) + "</p>";
      }
      out("steps").innerHTML = html;
    }

    function drawDots(box, a, m, med) {
      var counts = {}, maxC = 1;
      a.forEach(function (v) { var k = String(clean(v)); counts[k] = (counts[k] || 0) + 1; if (counts[k] > maxC) maxC = counts[k]; });
      var gap = Math.min(13, 78 / maxC);
      var W = Math.max(300, Math.min(620, Math.round(box.clientWidth || 620))), P = { l: 22, r: 22 };
      var base = Math.round(Math.max(36, 16 + maxC * gap)), H = base + 70;
      var s = SV.create(W, H, "Biểu đồ chấm của dãy số liệu");
      var mn = Math.min.apply(null, a), mx = Math.max.apply(null, a);
      if (mn === mx) { mn -= 1; mx += 1; }
      var pad = (mx - mn) * 0.06; mn -= pad; mx += pad;
      function XX(v) { return P.l + (v - mn) / (mx - mn) * (W - P.l - P.r); }
      var step = niceStep((mx - mn) / 6), t0 = Math.ceil(mn / step) * step;
      el("line", { x1: P.l, x2: W - P.r, y1: base, y2: base, class: "svg-line" }, s);
      for (var t = t0; t <= mx + 1e-9; t += step) {
        el("line", { x1: XX(t), x2: XX(t), y1: base, y2: base + 5, class: "svg-line" }, s);
        el("text", { x: XX(t), y: base + 18, "text-anchor": "middle", class: "svg-muted", text: U.fmt(clean(t), 3) }, s);
      }
      var used = {};
      a.forEach(function (v) {
        var k = String(clean(v)); used[k] = (used[k] || 0) + 1;
        el("circle", { cx: XX(v), cy: base - 8 - (used[k] - 1) * gap, r: 6, class: "fill-a stroke-a", "fill-opacity": 0.75 }, s);
      });
      /* vạch trung bình & trung vị */
      var xm = XX(m), xd = XX(med), close = Math.abs(xm - xd) < 110;
      function cx(x) { return Math.min(Math.max(x, 60), W - 60); }
      el("path", { d: "M" + xm + " " + (base + 26) + " l-7 12 h14 Z", class: "fill-primary" }, s);
      el("text", { x: cx(xm), y: base + 54, "text-anchor": "middle", class: "fill-primary svg-bold", "font-size": 13, text: "TB = " + U.fmt(clean(m), 2) }, s);
      el("path", { d: "M" + xd + " " + (base + 26) + " l-7 12 h14 Z", class: "fill-accent" }, s);
      el("text", { x: cx(xd), y: base + (close ? 70 : 54), "text-anchor": "middle", class: "fill-accent svg-bold", "font-size": 13, text: "Trung vị = " + U.fmt(clean(med), 2) }, s);
      s.setAttribute("viewBox", "0 0 " + W + " " + (close ? H + 6 : H));
      box.innerHTML = "";
      box.appendChild(s);
    }

    ta.addEventListener("input", compute);
    var rT;
    window.addEventListener("resize", function () { clearTimeout(rT); rT = setTimeout(compute, 200); });
    wrap.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.hasAttribute("data-ds")) {
        var ds = DATASETS[b.getAttribute("data-ds")];
        ta.value = ds.text; unit = ds.unit; compute();
      } else if (b.getAttribute("data-act") === "outlier") {
        var a = U.parseNumbers(ta.value);
        if (!a.length) return;
        var mn = Math.min.apply(null, a), mx = Math.max.apply(null, a);
        var o = mx + 3 * ((mx - mn) || Math.abs(mx) || 10);
        var allInt = a.every(function (x) { return Math.round(x) === x; });
        o = allInt ? Math.round(o) : Math.round(o * 10) / 10;
        ta.value = ta.value.replace(/[\s;,]+$/, "") + (ta.value.indexOf(";") > -1 ? "; " : " ") + U.fmt(o, 2).replace(/\./g, "");
        compute();
      } else if (b.getAttribute("data-act") === "sort") {
        var s = U.sorted(U.parseNumbers(ta.value));
        var sep = ta.value.indexOf(";") > -1 ? "; " : " ";
        ta.value = s.map(function (x) { return U.fmt(x, 4).replace(/\./g, ""); }).join(sep);
        compute();
      }
    });
    compute();
  }

  /* =====================================================
     5. Trò chơi: Chơi 1 lần hay 1000 lần?
     ===================================================== */
  function initCoinGame() {
    var box = $("#g-coin");
    if (!box || !X.Game) return;
    var g = X.Game.frame(box, {
      id: "bai67-dong-xu",
      title: "Chơi 1 lần hay 1000 lần?",
      intro: "Luật chơi: tung đồng xu, ra <b>Sấp được +10.000đ</b>, ra <b>Ngửa mất 4.000đ</b> (mỗi mặt xác suất 0,5). Trả lời câu dự đoán để ghi điểm, rồi bấm chơi thật nhiều ván để xem <b>tiền lãi trung bình mỗi ván</b> tiến về đâu."
    });
    var body = g.body, board = g.board;
    var QS = [
      { q: "Trước khi chơi: nếu chơi <b>thật nhiều ván</b>, trung bình mỗi ván bạn lãi khoảng bao nhiêu?", options: ["10.000đ", "6.000đ", "3.000đ", "0đ"], answer: 2,
        explain: "$E(X) = 10.000 \\times 0{,}5 + (-4.000) \\times 0{,}5 = 3.000$đ. Bấm <b>×1000</b> để kiểm chứng: đường xanh sẽ tiến sát vạch đỏ 3.000đ." },
      { q: "Chơi <b>đúng 1 ván</b>, bạn có thể nhận được đúng 3.000đ không?", options: ["Có, vì đó là kỳ vọng", "Không, mỗi ván chỉ có thể +10.000đ hoặc −4.000đ"], answer: 1,
        explain: "Kỳ vọng là <b>trung bình về lâu dài</b>, không phải kết quả của một ván. Một ván chỉ có thể ra +10.000đ hoặc −4.000đ." },
      { q: "Chơi <b>1.000 ván</b>, tổng tiền lãi của bạn có khả năng gần nhất với:", options: ["3.000đ", "300.000đ", "3.000.000đ", "10.000.000đ"], answer: 2,
        explain: "Mỗi ván trung bình lãi 3.000đ, nên 1.000 ván lãi khoảng $1.000 \\times 3.000 = 3.000.000$đ (thực tế có thể chênh vài trăm nghìn)." },
      { q: "Nếu đổi luật: Ngửa <b>mất 10.000đ</b> (Sấp vẫn +10.000đ), kỳ vọng bằng:", options: ["0đ", "5.000đ", "−5.000đ", "10.000đ"], answer: 0,
        explain: "$E = 10.000(0{,}5) + (-10.000)(0{,}5) = 0$, tức là trò chơi <b>công bằng</b>: về lâu dài không ai lời, không ai lỗ." },
      { q: "Vì sao sau 10 ván, tiền lãi trung bình có thể lệch xa 3.000đ, còn sau 1.000 ván thì rất gần?", options: ["Vì đồng xu bị mòn dần", "Vì càng chơi nhiều, may và rủi càng bù trừ cho nhau (luật số lớn)", "Vì máy tính cố tình chỉnh kết quả"], answer: 1,
        explain: "Đây là <b>luật số lớn</b> (giống định nghĩa thống kê của xác suất ở Bài 3): càng nhiều lần thử, trung bình thực tế càng sát kỳ vọng." }
    ];
    body.innerHTML =
      '<div class="pred-box"><p class="muted small" data-o="qn" style="margin:0 0 4px"></p><div class="game-prompt" data-o="q"></div>' +
      '<div class="game-options" data-o="opts"></div><div class="game-feedback" data-o="fb"></div><div class="game-actions" data-o="qact"></div></div>' +
      '<div class="btn-row">' +
      '<button type="button" class="btn primary" data-play="1">Chơi 1 ván</button>' +
      '<button type="button" class="btn" data-play="10">×10 ván</button>' +
      '<button type="button" class="btn" data-play="100">×100 ván</button>' +
      '<button type="button" class="btn" data-play="1000">×1000 ván</button>' +
      '<button type="button" class="btn" data-act="reset">↺ Làm lại</button></div>' +
      '<div class="stat-row">' +
      '<div class="stat"><span class="stat-label">Số ván đã chơi</span><span class="stat-value" data-o="n">0</span></div>' +
      '<div class="stat"><span class="stat-label">Ván vừa rồi</span><span class="stat-value" data-o="last">—</span></div>' +
      '<div class="stat"><span class="stat-label">Tổng tiền lãi</span><span class="stat-value" data-o="total">0đ</span></div>' +
      '<div class="stat"><span class="stat-label">Trung bình / ván</span><span class="stat-value" data-o="avg">—</span></div>' +
      "</div>" +
      '<p class="small muted" style="margin:6px 0 2px"><b class="c-a">Đường xanh</b>: tiền lãi trung bình mỗi ván sau n ván · <b class="c-danger">vạch đỏ</b>: kỳ vọng E(X) = 3.000đ</p>' +
      '<div data-o="chart"></div>' +
      '<p class="sim-log" data-o="log"></p>';
    function out(k) { return $('[data-o="' + k + '"]', body); }

    /* --- câu hỏi dự đoán --- */
    var qi = 0;
    function showQ() {
      var fb = out("fb"), opts = out("opts"), act = out("qact");
      fb.className = "game-feedback"; fb.innerHTML = ""; act.innerHTML = ""; opts.innerHTML = "";
      if (qi >= QS.length) {
        out("qn").textContent = "";
        out("q").innerHTML = "🎉 Bạn đã trả lời hết câu dự đoán (đúng " + board.correct + "/" + QS.length + "). Tiếp tục bấm chơi để tự kiểm chứng nhé!";
        var again = document.createElement("button");
        again.type = "button"; again.className = "btn small"; again.textContent = "↺ Trả lời lại từ đầu";
        again.addEventListener("click", function () { qi = 0; board.reset(); showQ(); });
        act.appendChild(again);
        return;
      }
      var item = QS[qi];
      out("qn").textContent = "Câu dự đoán " + (qi + 1) + "/" + QS.length;
      out("q").innerHTML = item.q;
      opts.className = "game-options" + (item.options.length > 3 ? " cols-2" : "");
      var btns = item.options.map(function (o, i) {
        var b = document.createElement("button");
        b.type = "button"; b.innerHTML = o;
        b.addEventListener("click", function () {
          btns.forEach(function (x) { x.disabled = true; });
          var ok = i === item.answer;
          if (ok) { b.classList.add("is-correct"); board.right(); }
          else { b.classList.add("is-wrong"); btns[item.answer].classList.add("is-correct"); board.wrong(); }
          fb.className = "game-feedback show " + (ok ? "ok" : "bad");
          fb.innerHTML = '<div class="fb-title">' + (ok ? "Chính xác! 🎉" : "Chưa đúng 😅") + "</div>" + item.explain;
          math(fb);
          var nx = document.createElement("button");
          nx.type = "button"; nx.className = "btn primary small";
          nx.textContent = qi + 1 < QS.length ? "Câu tiếp →" : "Hoàn thành 🏁";
          nx.addEventListener("click", function () { qi++; showQ(); });
          act.appendChild(nx);
        });
        opts.appendChild(b);
        return b;
      });
      math(body);
    }

    /* --- mô phỏng --- */
    var n = 0, total = 0, avgs = [], log = [];
    function play(k) {
      var lastWin = null;
      for (var i = 0; i < k; i++) {
        var win = Math.random() < 0.5;
        total += win ? 10000 : -4000;
        n++;
        avgs.push(total / n);
        log.push(win ? "S" : "N");
        lastWin = win;
      }
      if (log.length > 40) log = log.slice(-40);
      render(lastWin);
    }
    function render(lastWin) {
      out("n").textContent = U.fmt(n, 0);
      out("last").innerHTML = lastWin == null ? "—" : (lastWin ? '<span class="c-success">Sấp +10.000đ</span>' : '<span class="c-danger">Ngửa −4.000đ</span>');
      out("total").textContent = U.fmt(total, 0) + "đ";
      out("avg").textContent = n ? U.fmt(Math.round(total / n), 0) + "đ" : "—";
      var pts = [], stepK = Math.max(1, Math.ceil(avgs.length / 400));
      for (var i = 0; i < avgs.length; i += stepK) pts.push([i + 1, avgs[i]]);
      if (avgs.length && pts[pts.length - 1][0] !== avgs.length) pts.push([avgs.length, avgs[avgs.length - 1]]);
      X.chart.line(out("chart"), {
        series: [{ points: pts, cls: "stroke-a", width: 2.4 }],
        xMin: 0, xMax: Math.max(10, n), yMin: -4000, yMax: 10000, yTicks: 7,
        refY: 3000, refLabel: "E(X) = 3.000đ", yFmt: function (v) { return U.fmt(v, 0); },
        xTitle: "Số ván đã chơi", width: 600, height: 280,
        label: "Đường tiền lãi trung bình mỗi ván theo số ván đã chơi"
      });
      out("log").textContent = log.length ? "Các ván gần nhất (S = sấp, N = ngửa): " + log.join(" ") : "Chưa chơi ván nào.";
    }
    body.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.hasAttribute("data-play")) play(+b.getAttribute("data-play"));
      else if (b.getAttribute("data-act") === "reset") { n = 0; total = 0; avgs = []; log = []; render(null); }
    });
    showQ();
    render(null);
  }

  /* =====================================================
     6. Trò chơi: Bập bênh trung bình
     ===================================================== */
  function initSeesaw() {
    var box = $("#g-seesaw");
    if (!box || !X.Game) return;
    var g = X.Game.frame(box, {
      id: "bai67-bap-benh",
      title: "Bập bênh trung bình",
      intro: "Mỗi quả bóng là một số liệu (0 → 10). <b>Kéo bóng</b> sang trái/phải (hoặc chọn bóng rồi bấm phím ← →). Điểm tựa <b class=\"c-primary\">▲</b> luôn nằm ở <b>trung bình</b>, vì chỉ ở đó tấm ván mới thăng bằng. Hãy hoàn thành các thử thách!"
    });
    var body = g.body, board = g.board;
    var CH = [
      { text: "Kéo các bóng sao cho <b>trung bình = 5</b> (điểm tựa ▲ nằm đúng số 5).", start: [1, 2, 2, 4, 6],
        ok: function (s) { return near(s.mean, 5); },
        win: "Trung bình = tổng / số bóng = 25 / 5 = 5. Tổng các khoảng cách bên trái điểm tựa đúng bằng tổng bên phải, nên ván thăng bằng!" },
      { text: "Làm cho <b>trung bình lớn hơn trung vị ít nhất 2</b>. Gợi ý: dồn phần lớn bóng về bên trái, kéo 1–2 bóng thật xa sang phải (giống lương giám đốc!).", start: [3, 4, 4, 5, 6],
        ok: function (s) { return s.mean - s.median >= 2 - 1e-9; },
        win: "Vài giá trị rất lớn kéo trung bình sang phải, còn trung vị (bóng ở giữa) gần như đứng yên. Đó là số liệu <b>lệch phải</b>." },
      { text: "Làm cho <b>trung bình = trung vị = yếu vị</b> (phân phối đối xứng).", start: [1, 3, 4, 8, 9],
        ok: function (s) { return s.modes.length === 1 && near(s.mean, s.median) && near(s.median, s.modes[0]); },
        win: "Khi số liệu đối xứng quanh một đỉnh, cả 3 số đo trùng nhau, giống đường cong hình chuông." },
      { text: "Làm cho <b>trung bình nhỏ hơn trung vị ít nhất 1,5</b> (lệch trái: đuôi dài bên trái).", start: [4, 5, 5, 6, 7],
        ok: function (s) { return s.median - s.mean >= 1.5 - 1e-9; },
        win: "Giá trị nhỏ bất thường kéo trung bình sang trái, nên trung bình &lt; trung vị: <b>lệch trái</b>." },
      { text: "Giữ <b>trung bình = 4</b> nhưng phải có 1 bóng ở <b>0</b> và 1 bóng ở <b>8 trở lên</b>.", start: [3, 4, 4, 4, 5],
        ok: function (s) { return near(s.mean, 4) && s.min === 0 && s.max >= 8; },
        win: "Cùng trung bình 4 nhưng số liệu trải rộng hơn hẳn, tức là <b>độ lệch chuẩn lớn hơn</b>. Vì vậy chỉ báo cáo trung bình là chưa đủ!" },
      { text: "6 bóng (số chẵn): trung vị là trung bình của 2 bóng ở giữa. Làm cho <b>trung vị = 5,5</b>.", start: [1, 2, 3, 4, 8, 9],
        ok: function (s) { return near(s.median, 5.5); },
        win: "Với N chẵn, trung vị = (bóng thứ 3 + bóng thứ 4) / 2, chẳng hạn (5 + 6) / 2 = 5,5." },
      { text: "Đặt bóng sao cho <b>trung vị = 7</b> nhưng <b>trung bình nhỏ hơn 6</b>.", start: [5, 6, 7, 8, 9],
        ok: function (s) { return near(s.median, 7) && s.mean < 6 - 1e-9; },
        win: "Ví dụ 0, 0, 7, 7, 7: trung vị 7 nhưng trung bình chỉ 4,2. Hai số đo trung tâm có thể khác nhau rất xa!" }
    ];
    body.innerHTML =
      '<div class="challenge" data-o="ch" aria-live="polite"></div>' +
      '<div data-o="svgbox"></div>' +
      '<div class="stat-row">' +
      '<div class="stat"><span class="stat-label">Trung bình (▲)</span><span class="stat-value" data-o="mean">—</span></div>' +
      '<div class="stat"><span class="stat-label">Trung vị</span><span class="stat-value" data-o="median" style="color:var(--accent)">—</span></div>' +
      '<div class="stat"><span class="stat-label">Yếu vị</span><span class="stat-value" data-o="mode" style="color:var(--set-d)">—</span></div>' +
      '<div class="stat"><span class="stat-label">Số liệu (đã xếp)</span><span class="stat-value" data-o="data" style="font-size:1rem">—</span></div>' +
      "</div>" +
      '<div class="game-actions" data-o="acts"></div>';
    function out(k) { return $('[data-o="' + k + '"]', body); }

    /* hình học co giãn: màn hình hẹp dùng khung nhỏ hơn để bóng to, dễ kéo bằng ngón tay */
    var G = null;
    function layout() {
      var wbox = out("svgbox").clientWidth || 640;
      var compact = wbox < 520;
      if (G && G.compact === compact) return false;
      G = compact
        ? { compact: true, W: 380, X0: 24, STEP: 33.2, R: 15, GAP: 29, FS: 14, FW: 18, PL: 10, PR: 370 }
        : { compact: false, W: 640, X0: 40, STEP: 56, R: 14, GAP: 27, FS: 13, FW: 24, PL: 22, PR: 618 };
      G.PLANK = 185; G.GROUND = 251; G.H = 305;
      svg.setAttribute("viewBox", "0 0 " + G.W + " " + G.H);
      return true;
    }
    var svg = SV.create(640, 305, "Bập bênh: kéo các quả bóng để thay đổi số liệu");
    svg.setAttribute("class", "seesaw-svg");
    svg.removeAttribute("width"); svg.removeAttribute("height");
    out("svgbox").appendChild(svg);
    function XX(v) { return G.X0 + v * G.STEP; }
    function clampX(x, m) { return Math.min(Math.max(x, m), G.W - m); }

    var ci = 0, pts = CH[0].start.slice(), solved = false, dragIdx = -1, focusIdx = -1;

    function stats() {
      var s = { mean: U.mean(pts), median: U.median(pts), modes: U.modes(pts) };
      s.min = Math.min.apply(null, pts); s.max = Math.max.apply(null, pts);
      return s;
    }

    function draw() {
      if (!G) layout();
      var s = stats(), P = G.PLANK, GR = G.GROUND;
      svg.innerHTML = "";
      /* phần tĩnh: mặt đất + số */
      el("line", { x1: G.PL - 4, x2: G.PR + 4, y1: GR, y2: GR, class: "svg-line" }, svg);
      for (var t = 0; t <= 10; t++) {
        el("text", { x: XX(t), y: GR + 20, "text-anchor": "middle", class: "svg-muted", "font-size": G.FS, text: String(t) }, svg);
      }
      var mx = XX(s.mean);
      /* vạch dẫn trung vị / yếu vị */
      el("line", { x1: XX(s.median), x2: XX(s.median), y1: 40, y2: P, class: "stroke-accent svg-dash", "stroke-width": 1.5 }, svg);
      s.modes.forEach(function (m) {
        el("line", { x1: XX(m), x2: XX(m), y1: 40, y2: P, class: "stroke-d svg-dash", "stroke-width": 1.5 }, svg);
      });
      /* tấm ván + điểm tựa */
      el("rect", { x: G.PL, y: P, width: G.PR - G.PL, height: 9, rx: 4, class: "fill-muted" }, svg);
      for (t = 0; t <= 10; t++) el("line", { x1: XX(t), x2: XX(t), y1: P + 2, y2: P + 7, class: "stroke-border", "stroke-width": 1.5 }, svg);
      el("path", { d: "M" + mx + " " + (P + 9) + " L" + (mx - G.FW) + " " + GR + " L" + (mx + G.FW) + " " + GR + " Z", class: "fill-primary" }, svg);
      el("text", { x: clampX(mx, 80), y: GR + 44, "text-anchor": "middle", class: "fill-primary svg-bold", "font-size": G.FS + 1, text: "▲ Trung bình = " + U.fmt(clean(s.mean), 2) }, svg);
      /* nhãn trung vị & yếu vị ở trên cùng */
      var medX = XX(s.median);
      el("path", { d: "M" + medX + " 40 l-7 -11 h14 Z", class: "fill-accent" }, svg);
      var modeLabels = s.modes.filter(function (m) { return !near(m, s.median); });
      el("text", { x: clampX(medX, 50), y: 20, "text-anchor": "middle", class: "fill-accent svg-bold", "font-size": G.FS, text: "Trung vị " + U.fmt(clean(s.median), 2) }, svg);
      s.modes.forEach(function (m) {
        var x = XX(m), sameAsMed = near(m, s.median);
        el("path", { d: "M" + x + " " + (sameAsMed ? 52 : 40) + " l-7 -11 h14 Z", class: "fill-d" }, svg);
      });
      if (modeLabels.length) {
        var lx = XX(modeLabels[0]), tooClose = Math.abs(lx - medX) < (G.compact ? 95 : 110);
        el("text", { x: clampX(lx, 45), y: tooClose ? 4 + G.FS : 20, dy: tooClose ? -G.FS - 2 : 0, "text-anchor": "middle", class: "fill-d svg-bold", "font-size": G.FS,
          text: "Yếu vị " + modeLabels.map(function (m) { return U.fmt(m, 2); }).join("; ") }, svg);
        if (tooClose) svg.setAttribute("viewBox", "0 -" + (G.FS + 4) + " " + G.W + " " + (G.H + G.FS + 4));
        else svg.setAttribute("viewBox", "0 0 " + G.W + " " + G.H);
      } else svg.setAttribute("viewBox", "0 0 " + G.W + " " + G.H);
      /* bóng */
      var used = {};
      pts.forEach(function (v, i) {
        used[v] = (used[v] || 0) + 1;
        var cy = P - G.R - 1 - (used[v] - 1) * G.GAP;
        var gb = el("g", {
          class: "ball", "data-i": i, tabindex: 0, role: "slider",
          "aria-label": "Bóng " + (i + 1), "aria-valuemin": 0, "aria-valuemax": 10, "aria-valuenow": v
        }, svg);
        el("circle", { cx: XX(v), cy: cy, r: G.R, class: "fill-a", "stroke-width": 2, style: "stroke:var(--surface)" }, gb);
        el("text", { x: XX(v), y: cy + 5, "text-anchor": "middle", class: "fill-surface svg-bold", "font-size": G.FS, style: "pointer-events:none", text: String(v) }, gb);
      });
      if (focusIdx >= 0) { var f = svg.querySelector('.ball[data-i="' + focusIdx + '"]'); if (f) f.focus({ preventScroll: true }); }
      out("mean").textContent = U.fmt(clean(s.mean), 2);
      out("median").textContent = U.fmt(clean(s.median), 2);
      out("mode").textContent = s.modes.length ? s.modes.map(function (m) { return U.fmt(m, 2); }).join("; ") : "Không có";
      out("data").textContent = U.sorted(pts).join(" · ");
    }
    var rsT;
    window.addEventListener("resize", function () { clearTimeout(rsT); rsT = setTimeout(function () { if (layout()) draw(); }, 150); });

    function showChallenge() {
      var c = CH[ci];
      var chEl = out("ch");
      chEl.className = "challenge";
      chEl.innerHTML = "🎯 Thử thách " + (ci + 1) + "/" + CH.length + ": " + c.text;
      var acts = out("acts");
      acts.innerHTML = '<button type="button" class="btn small" data-act="reset">↺ Đặt lại bóng</button>' +
        '<button type="button" class="btn small" data-act="skip">Bỏ qua thử thách →</button>';
    }

    function checkWin() {
      if (solved || ci >= CH.length) return;
      if (CH[ci].ok(stats())) {
        solved = true;
        board.right();
        var chEl = out("ch");
        chEl.className = "challenge done";
        chEl.innerHTML = "✅ Hoàn thành thử thách " + (ci + 1) + "! " + CH[ci].win;
        var acts = out("acts");
        acts.innerHTML = "";
        var nx = document.createElement("button");
        nx.type = "button"; nx.className = "btn primary small";
        nx.textContent = ci + 1 < CH.length ? "Thử thách tiếp →" : "Xem kết quả 🏁";
        nx.addEventListener("click", next);
        acts.appendChild(nx);
      }
    }

    function next() {
      ci++;
      solved = false; focusIdx = -1;
      if (ci >= CH.length) {
        var chEl = out("ch");
        chEl.className = "challenge done";
        chEl.innerHTML = "🏁 Bạn đã hoàn thành " + board.correct + "/" + CH.length + " thử thách · Điểm: " + board.score + ". Giờ bạn có thể kéo bóng tự do để khám phá thêm.";
        var acts = out("acts");
        acts.innerHTML = "";
        var again = document.createElement("button");
        again.type = "button"; again.className = "btn primary small"; again.textContent = "↺ Chơi lại từ đầu";
        again.addEventListener("click", function () { ci = 0; solved = false; board.reset(); pts = CH[0].start.slice(); showChallenge(); draw(); });
        acts.appendChild(again);
        return;
      }
      pts = CH[ci].start.slice();
      showChallenge();
      draw();
    }

    out("acts").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-act]");
      if (!b) return;
      if (b.getAttribute("data-act") === "reset") { pts = CH[ci].start.slice(); focusIdx = -1; draw(); }
      else if (b.getAttribute("data-act") === "skip") { board.wrong(); next(); }
    });

    /* kéo thả (chuột + cảm ứng) */
    function toSvgX(e) {
      var p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
      var m = svg.getScreenCTM();
      return m ? p.matrixTransform(m.inverse()).x : 0;
    }
    svg.addEventListener("pointerdown", function (e) {
      var b = e.target.closest(".ball");
      if (!b) return;
      dragIdx = +b.getAttribute("data-i");
      focusIdx = -1;
      try { svg.setPointerCapture(e.pointerId); } catch (err) { /* bỏ qua */ }
      e.preventDefault();
    });
    svg.addEventListener("pointermove", function (e) {
      if (dragIdx < 0) return;
      var v = Math.round((toSvgX(e) - G.X0) / G.STEP);
      v = Math.max(0, Math.min(10, v));
      if (v !== pts[dragIdx]) { pts[dragIdx] = v; draw(); }
    });
    function endDrag() { if (dragIdx < 0) return; dragIdx = -1; draw(); checkWin(); }
    svg.addEventListener("pointerup", endDrag);
    svg.addEventListener("pointercancel", endDrag);
    /* bàn phím */
    svg.addEventListener("keydown", function (e) {
      var b = e.target.closest && e.target.closest(".ball");
      if (!b) return;
      var i = +b.getAttribute("data-i"), d = 0;
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") d = -1;
      else if (e.key === "ArrowRight" || e.key === "ArrowUp") d = 1;
      if (!d) return;
      e.preventDefault();
      pts[i] = Math.max(0, Math.min(10, pts[i] + d));
      focusIdx = i;
      draw();
      checkWin();
    });

    showChallenge();
    draw();
  }

  function boot() {
    initStepFx();
    initDist();
    initData();
    initCoinGame();
    initSeesaw();
    math(document.getElementById("content"));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
