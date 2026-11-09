/* =========================================================
   bai-2.js — Phép thử & biến cố ngẫu nhiên
   - Vẽ mặt xúc xắc (.dice-row, và <g class="sdie"> trong SVG) và Venn nhỏ (.venn)
   - Phần mở rộng cho hình chiếu từng bước (data-show, data-state, data-move, data-fx)
   - Công cụ "Khám phá biến cố với xúc xắc"
   - Lưới 36 kết quả khi gieo 2 xúc xắc (chiếu từng bước)
   - Trò chơi: "Xung khắc hay không?" và "Gieo xúc xắc săn biến cố"
   ========================================================= */
(function () {
  "use strict";
  var XSTK = window.XSTK || {};
  function math(el) { if (XSTK.math) XSTK.math(el); }
  function tex(s) { return XSTK.tex ? XSTK.tex(s) : s; }
  function shuffle(a) { return XSTK.util ? XSTK.util.shuffle(a) : a.slice(); }
  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

  /* ---------- mặt xúc xắc ---------- */
  var PIPS = {
    1: [[30, 30]],
    2: [[16, 16], [44, 44]],
    3: [[16, 16], [30, 30], [44, 44]],
    4: [[16, 16], [44, 16], [16, 44], [44, 44]],
    5: [[16, 16], [44, 16], [30, 30], [16, 44], [44, 44]],
    6: [[16, 15], [44, 15], [16, 30], [44, 30], [16, 45], [44, 45]]
  };
  /* n = 1..6, hoặc 0 để vẽ dấu "?" */
  function dieSVG(n, size, cls, title) {
    var s = '<span class="die ' + (cls || "") + '"' + (title ? ' title="' + title + '"' : "") + ">" +
      '<svg viewBox="0 0 60 60" width="' + size + '" height="' + size + '" role="img" aria-label="' +
      (n ? "Mặt " + n + " chấm" : "Xúc xắc chưa gieo") + '">' +
      '<rect class="die-bg" x="3" y="3" width="54" height="54" rx="11"/>';
    if (n) PIPS[n].forEach(function (p) { s += '<circle class="pip" cx="' + p[0] + '" cy="' + p[1] + '" r="5.6"/>'; });
    else s += '<text class="die-q" x="30" y="41" text-anchor="middle" font-size="30">?</text>';
    return s + "</svg></span>";
  }

  /* xúc xắc vẽ thẳng trong SVG của hình minh hoạ:
     <g class="sdie [on-p|on-a|on-b|on-x|dim]" data-die="3" data-xy="124,20" data-s="40"></g>
     (có data-move thì vị trí do data-move quyết định, xem stepHook) */
  function r2(v) { return Math.round(v * 100) / 100; }
  function pipsSVG(n, size) {
    var k = size / 60;
    if (!n) return '<text class="die-q" x="' + r2(30 * k) + '" y="' + r2(41 * k) + '" text-anchor="middle" font-size="' + r2(30 * k) + '">?</text>';
    return PIPS[n].map(function (p) {
      return '<circle class="pip" cx="' + r2(p[0] * k) + '" cy="' + r2(p[1] * k) + '" r="' + r2(5.6 * k) + '"/>';
    }).join("");
  }
  function fillSvgDie(g) {
    var n = parseInt(g.getAttribute("data-die"), 10) || 0, size = parseFloat(g.getAttribute("data-s")) || 40, k = size / 60;
    g.innerHTML = '<rect class="die-bg" x="' + r2(3 * k) + '" y="' + r2(3 * k) + '" width="' + r2(54 * k) + '" height="' + r2(54 * k) +
      '" rx="' + r2(11 * k) + '"/><g class="pips">' + pipsSVG(n, size) + "</g>";
    var xy = g.getAttribute("data-xy");
    if (xy && !g.hasAttribute("data-move")) g.setAttribute("transform", "translate(" + xy.split(",").join(" ") + ")");
  }

  function parseSet(str) {
    if (!str) return [];
    return str.split(",").map(function (x) { return parseInt(x, 10); }).filter(function (x) { return x >= 1 && x <= 6; });
  }

  /* <div class="dice-row" data-size="34" data-p="2,4" data-a="6" data-b="1" data-x="" data-dimrest="1"> */
  function renderDiceRow(el) {
    var size = parseInt(el.getAttribute("data-size"), 10) || 40;
    var p = parseSet(el.getAttribute("data-p"));
    var a = parseSet(el.getAttribute("data-a"));
    var b = parseSet(el.getAttribute("data-b"));
    var x = parseSet(el.getAttribute("data-x"));
    var dim = el.getAttribute("data-dimrest") === "1";
    var html = "";
    for (var n = 1; n <= 6; n++) {
      var cls = p.indexOf(n) !== -1 ? "on-p" : a.indexOf(n) !== -1 ? "on-a" : b.indexOf(n) !== -1 ? "on-b" : x.indexOf(n) !== -1 ? "on-x" : (dim ? "dim" : "");
      html += dieSVG(n, size, cls);
    }
    el.innerHTML = html;
  }

  /* ---------- biểu đồ Venn nhỏ ---------- */
  var vennId = 0;
  function vennSVG(rel) {
    vennId++;
    var id = "b2v" + vennId;
    var A = { cx: 82, cy: 66, r: 38 }, B = { cx: 118, cy: 66, r: 38 };
    function circ(c, cls, extra) { return '<circle cx="' + c.cx + '" cy="' + c.cy + '" r="' + c.r + '" class="' + cls + '"' + (extra || "") + "/>"; }
    function outline(c, stroke) { return circ(c, "fill-none " + stroke, ' stroke-width="2"'); }
    function label(x, y, t, over) {
      return '<text x="' + x + '" y="' + y + '" text-anchor="middle" class="svg-text svg-bold" font-size="15"' +
        (over ? ' style="text-decoration:overline"' : "") + ">" + t + "</text>";
    }
    var SH = ' fill-opacity="0.55"';
    var bg = '<rect x="3" y="3" width="194" height="118" rx="10" class="fill-surface"/>';
    var frame = '<rect x="3" y="3" width="194" height="118" rx="10" class="fill-none stroke-muted" stroke-width="1.5"/>' +
      '<text x="16" y="24" class="svg-text svg-bold" font-size="14">Ω</text>';
    var body = "", aria = "";
    switch (rel) {
      case "imply":
        var Bb = { cx: 104, cy: 64, r: 50 }, As = { cx: 92, cy: 72, r: 22 };
        body = circ(Bb, "fill-b", ' fill-opacity="0.25"') + outline(Bb, "stroke-b") +
          circ(As, "fill-a", ' fill-opacity="0.55"') + outline(As, "stroke-a") +
          label(92, 77, "A") + label(132, 40, "B");
        aria = "A nằm trọn trong B";
        break;
      case "equal":
        var E = { cx: 100, cy: 64, r: 42 };
        body = circ(E, "fill-primary", SH) + outline(E, "stroke-primary") + label(100, 69, "A = B");
        aria = "A và B trùng nhau";
        break;
      case "union":
        body = '<g opacity="0.55">' + circ(A, "fill-primary") + circ(B, "fill-primary") + "</g>" +
          outline(A, "stroke-a") + outline(B, "stroke-b") + label(64, 71, "A") + label(136, 71, "B");
        aria = "Tô cả hai hình tròn A và B";
        break;
      case "inter":
        body = '<defs><clipPath id="' + id + '">' + circ(A, "") + "</clipPath></defs>" +
          circ(B, "fill-primary", SH + ' clip-path="url(#' + id + ')"') +
          outline(A, "stroke-a") + outline(B, "stroke-b") + label(62, 71, "A") + label(138, 71, "B");
        aria = "Chỉ tô phần chung của A và B";
        break;
      case "complement":
        var C = { cx: 96, cy: 66, r: 36 };
        body = '<rect x="3" y="3" width="194" height="118" rx="10" class="fill-primary"' + SH + "/>" +
          circ(C, "fill-surface") + outline(C, "stroke-a") + label(96, 71, "A") + label(170, 30, "A", true);
        aria = "Tô phần bên ngoài A";
        break;
      case "disjoint":
        var D1 = { cx: 60, cy: 66, r: 32 }, D2 = { cx: 140, cy: 66, r: 32 };
        body = circ(D1, "fill-a", ' fill-opacity="0.3"') + outline(D1, "stroke-a") +
          circ(D2, "fill-b", ' fill-opacity="0.3"') + outline(D2, "stroke-b") +
          label(60, 71, "A") + label(140, 71, "B");
        aria = "A và B tách rời, không có phần chung";
        break;
      case "diff":
        body = circ(A, "fill-primary", SH) + circ(B, "fill-surface") +
          outline(A, "stroke-a") + outline(B, "stroke-b") + label(64, 71, "A") + label(136, 71, "B");
        aria = "Tô phần của A nằm ngoài B";
        break;
    }
    return '<svg viewBox="0 0 200 124" width="200" height="124" role="img" aria-label="' + aria + '">' + bg + body + frame + "</svg>";
  }

  /* ---------- hình chiếu từng bước: phần mở rộng riêng của bài ----------
     anim.js lo data-step / data-step-only / chú thích / nút bấm. Ở đây thêm:
       data-show="a-b"        chỉ hiện từ bước a đến bước b
       data-state="k:lớp|…"   đổi lớp màu theo bước (on-p, on-a, on-b, on-x, dim; "k:" = bỏ lớp)
       data-move="k:x,y|…"    trượt tới vị trí (x, y) từ bước k (xúc xắc "chạy" vào nhóm)
       data-fx="roll|drop|late"  khi phần tử vừa hiện: xúc xắc lăn / hòn bi rơi / chữ hiện sau
     Bước hiện tại đọc từ chú thích đang bật (.cap-on) nên không cần sửa anim.js. */
  function noMotion() { return !XSTK.anim || XSTK.anim.reduced; }
  function parseSteps(str) {
    return String(str || "").split("|").map(function (p) {
      var i = p.indexOf(":");
      return i < 0 ? null : [parseInt(p.slice(0, i), 10), p.slice(i + 1).trim()];
    }).filter(function (e) { return e && !isNaN(e[0]); }).sort(function (a, b) { return a[0] - b[0]; });
  }
  function valueAt(list, k, def) {
    var v = def;
    list.forEach(function (e) { if (e[0] <= k) v = e[1]; });
    return v;
  }
  var SHAPES = "path, line, polyline, polygon, circle, ellipse, rect, text";
  function reveal(el) {
    if (noMotion()) return;
    var kids = el.tagName.toLowerCase() === "g" ? el.querySelectorAll(SHAPES) : [el];
    Array.prototype.forEach.call(kids, function (c, j) { XSTK.anim.appear(c, j * 40); });
  }

  function rollFx(g) {
    var face = parseInt(g.getAttribute("data-die"), 10) || 0, size = parseFloat(g.getAttribute("data-s")) || 40;
    var pips = g.querySelector(".pips");
    if (!pips || !g.animate) return;
    clearInterval(g._roll);
    g.style.transformBox = "fill-box"; g.style.transformOrigin = "center";
    g.animate([
      { transform: "rotate(-320deg) scale(.45)", opacity: 0 },
      { transform: "rotate(24deg) scale(1.08)", opacity: 1, offset: 0.72 },
      { transform: "none", opacity: 1 }
    ], { duration: 820, easing: "cubic-bezier(.2,.8,.2,1)" });
    var t = 0, last = face;
    g._roll = setInterval(function () {
      if (++t >= 9) { clearInterval(g._roll); pips.innerHTML = pipsSVG(face, size); return; }
      var n; do { n = randInt(1, 6); } while (n === last);
      last = n; pips.innerHTML = pipsSVG(n, size);
    }, 80);
  }
  function dropFx(el) {
    if (!el.animate) return;
    el.animate([
      { transform: "translateY(-50px)", opacity: 0, easing: "linear" },
      { transform: "translateY(-50px)", opacity: 1, offset: 0.12, easing: "cubic-bezier(.55,0,1,.45)" },
      { transform: "translateY(0)", offset: 0.6, easing: "cubic-bezier(0,.55,.45,1)" },
      { transform: "translateY(-11px)", offset: 0.78, easing: "cubic-bezier(.55,0,1,.45)" },
      { transform: "translateY(0)" }
    ], { duration: 950 });
  }
  function runFx(el, kind) {
    if (kind === "roll") rollFx(el);
    else if (kind === "drop") dropFx(el);
    else if (kind === "late" && el.animate) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 350, delay: 760, fill: "backwards" });
  }

  function stepHook(fig) {
    var caps = fig.querySelectorAll(".step-captions [data-caption]");
    if (!caps.length) return;
    function all(sel) { return Array.prototype.slice.call(fig.querySelectorAll(sel)); }
    var shows = all("[data-show]").map(function (el) {
      var r = el.getAttribute("data-show").split("-");
      return { el: el, a: parseInt(r[0], 10), b: r[1] ? parseInt(r[1], 10) : 1e9 };
    });
    var states = all("[data-state]").map(function (el) {
      var list = parseSteps(el.getAttribute("data-state")), names = {};
      list.forEach(function (e) { e[1].split(/\s+/).forEach(function (c) { if (c) names[c] = 1; }); });
      return { el: el, list: list, names: Object.keys(names) };
    });
    var moves = all("[data-move]").map(function (el) { return { el: el, list: parseSteps(el.getAttribute("data-move")) }; });
    var fxs = all("[data-fx]").map(function (el) {
      var host = el.closest("[data-step], [data-show]");
      var at = host ? parseInt(host.getAttribute("data-step") || host.getAttribute("data-show"), 10) || 0 : 0;
      return { el: el, at: at, kind: el.getAttribute("data-fx") };
    });
    var first = Math.min.apply(null, Array.prototype.map.call(caps, function (c) { return parseInt(c.getAttribute("data-caption"), 10) || 0; }));
    var cur = -1;

    function apply(k, prev) {
      var animate = prev >= 0 && !noMotion();
      shows.forEach(function (o) {
        var on = k >= o.a && k <= o.b, was = !o.el.classList.contains("step-off");
        o.el.classList.toggle("step-off", !on);
        if (on && !was && animate) reveal(o.el);
      });
      states.forEach(function (o) {
        var want = valueAt(o.list, k, "").split(/\s+/);
        o.names.forEach(function (c) { o.el.classList.toggle(c, want.indexOf(c) !== -1); });
      });
      moves.forEach(function (o) {
        var p = valueAt(o.list, k, "0,0").split(",");
        o.el.style.transform = "translate(" + parseFloat(p[0]) + "px, " + parseFloat(p[1]) + "px)";
      });
      if (animate && k > prev) fxs.forEach(function (o) { if (o.at > prev && o.at <= k) runFx(o.el, o.kind); });
    }
    function sync() {
      var k = null;
      for (var i = 0; i < caps.length; i++) if (caps[i].classList.contains("cap-on")) k = parseInt(caps[i].getAttribute("data-caption"), 10);
      if (k == null || k === cur) return;
      var prev = cur; cur = k; apply(k, prev);
    }
    apply(first, -1); cur = first;
    if ("MutationObserver" in window) {
      var mo = new MutationObserver(sync);
      Array.prototype.forEach.call(caps, function (c) { mo.observe(c, { attributes: true, attributeFilter: ["class"] }); });
    }
    sync();
  }

  /* ---------- tập hợp ---------- */
  var ALL = [1, 2, 3, 4, 5, 6];
  function has(s, n) { return s.indexOf(n) !== -1; }
  function union(a, b) { return ALL.filter(function (n) { return has(a, n) || has(b, n); }); }
  function inter(a, b) { return ALL.filter(function (n) { return has(a, n) && has(b, n); }); }
  function minus(a, b) { return ALL.filter(function (n) { return has(a, n) && !has(b, n); }); }
  function comp(a) { return minus(ALL, a); }
  function subset(a, b) { return a.every(function (n) { return has(b, n); }); }
  function setText(s) { return s.length ? "{" + s.join(", ") + "}" : "∅"; }

  /* ---------- công cụ: khám phá biến cố ---------- */
  var EVENTS = [
    { name: "Ra mặt chẵn", set: [2, 4, 6] },
    { name: "Ra mặt lẻ", set: [1, 3, 5] },
    { name: "Ra mặt lớn hơn 4", set: [5, 6] },
    { name: "Ra mặt không quá 2", set: [1, 2] },
    { name: "Ra mặt 6", set: [6] },
    { name: "Ra mặt 1", set: [1] },
    { name: "Ra số nguyên tố (2, 3, 5)", set: [2, 3, 5] },
    { name: "Ra mặt chia hết cho 3", set: [3, 6] },
    { name: "Ra mặt nhỏ hơn 4", set: [1, 2, 3] },
    { name: "Ra mặt từ 4 trở lên", set: [4, 5, 6] },
    { name: "Không ra mặt 6", set: [1, 2, 3, 4, 5] },
    { name: "Ra mặt ≤ 6 (chắc chắn)", set: [1, 2, 3, 4, 5, 6] },
    { name: "Ra mặt 7 (không thể)", set: [] }
  ];

  function rowDice(set, cls) {
    var h = "";
    for (var n = 1; n <= 6; n++) h += dieSVG(n, 30, has(set, n) ? cls : "dim");
    return '<div class="dice-row">' + h + "</div>";
  }

  function initExplorer() {
    var root = document.getElementById("ee");
    if (!root) return;
    var selA = document.getElementById("ee-a"), selB = document.getElementById("ee-b");
    var vEl = document.getElementById("ee-verdicts"), rEl = document.getElementById("ee-rows");
    EVENTS.forEach(function (e, i) {
      selA.add(new Option(e.name + "  " + setText(e.set), i));
      selB.add(new Option(e.name + "  " + setText(e.set), i));
    });
    selA.value = "0"; selB.value = "2";

    function verdict(ok, yes, no) {
      return '<span class="verdict ' + (ok ? "yes" : "no") + '">' + (ok ? "✅ " + yes : "❌ " + no) + "</span>";
    }

    function update() {
      var A = EVENTS[+selA.value].set, B = EVENTS[+selB.value].set;
      var AB = inter(A, B), AuB = union(A, B);
      var xk = AB.length === 0;
      var dl = xk && AuB.length === 6;
      var ab = subset(A, B), ba = subset(B, A);
      var v = verdict(xk, "Xung khắc", "Không xung khắc") +
        verdict(dl, "Đối lập", "Không đối lập") +
        verdict(ab, "A kéo theo B", "A không kéo theo B") +
        verdict(ba, "B kéo theo A", "B không kéo theo A") +
        verdict(ab && ba, "A tương đương B", "A, B không tương đương");
      var note;
      if (dl) note = "A và B <b>đối lập</b>: không có mặt chung, và gộp lại thì phủ kín Ω, nên lần gieo nào cũng có đúng 1 trong 2 xảy ra.";
      else if (xk) note = "A và B <b>xung khắc nhưng không đối lập</b>: không có mặt chung, nhưng các mặt " + setText(comp(AuB)) + " không thuộc A cũng không thuộc B.";
      else note = "A và B <b>không xung khắc</b>: có thể cùng xảy ra khi gieo ra mặt " + setText(AB) + ".";
      if (!A.length || !B.length) note += " <i>(Lưu ý: biến cố không thể $\\varnothing$ kéo theo mọi biến cố và xung khắc với mọi biến cố.)</i>";
      vEl.innerHTML = v + '<p class="small" style="flex-basis:100%;margin:6px 0 0">' + note + "</p>";

      var rows = [
        ["A", "", A, "on-a"],
        ["B", "", B, "on-b"],
        ["A \\cup B", "A hoặc B", AuB, "on-p"],
        ["A \\cap B", "A và B", AB, "on-p"],
        ["\\overline{A}", "không A", comp(A), "on-p"],
        ["\\overline{B}", "không B", comp(B), "on-p"],
        ["A \\setminus B", "A nhưng không B", minus(A, B), "on-p"],
        ["B \\setminus A", "B nhưng không A", minus(B, A), "on-p"]
      ];
      rEl.innerHTML = rows.map(function (r) {
        return '<div class="ee-row"><span class="ee-name">' + tex(r[0]) + "</span>" +
          '<span class="ee-set">' + setText(r[2]) + (r[1] ? '<span class="ee-desc">' + r[1] + "</span>" : "") + "</span>" +
          rowDice(r[2], r[3]) + "</div>";
      }).join("");
      math(vEl);
    }
    selA.addEventListener("change", update);
    selB.addEventListener("change", update);
    update();
  }

  /* ---------- lưới 36 kết quả (Bài tập 2), chiếu từng bước ---------- */
  function renderGrid36() {
    var el = document.getElementById("grid36");
    if (!el) return;
    var c = 36, o = 40, W = o + 6 * c + 6, mid = o + 3 * c;
    function cell(i, j, cls, extra) {
      return '<rect x="' + (o + (j - 1) * c + 1.5) + '" y="' + (o + (i - 1) * c + 1.5) + '" width="' + (c - 3) + '" height="' + (c - 3) +
        '" rx="5" class="' + cls + '"' + (extra || "") + "/>";
    }
    var s = '<svg viewBox="0 0 ' + W + " " + W + '" width="300" height="300" role="img" aria-label="Lưới 36 kết quả khi gieo 2 xúc xắc: C là hàng 6, D là cột 6, hai biến cố chung nhau ô (6, 6)">';
    s += '<text x="' + mid + '" y="12" text-anchor="middle" class="svg-muted">Con thứ hai →</text>';
    s += '<text x="10" y="' + mid + '" text-anchor="middle" class="svg-muted" transform="rotate(-90 10 ' + mid + ')">Con thứ nhất →</text>';
    for (var k = 1; k <= 6; k++) {
      s += '<text x="' + (o + (k - 0.5) * c) + '" y="' + (o - 8) + '" text-anchor="middle" class="svg-text svg-bold">' + k + "</text>";
      s += '<text x="' + (o - 10) + '" y="' + (o + (k - 0.5) * c + 5) + '" text-anchor="middle" class="svg-text svg-bold">' + k + "</text>";
    }
    for (var i = 1; i <= 6; i++) for (var j = 1; j <= 6; j++) s += cell(i, j, "fill-soft");
    s += '<g data-step="1">';
    for (j = 1; j <= 6; j++) s += cell(6, j, "fill-a", ' fill-opacity="0.42"');
    s += '<text x="' + (o + 2.5 * c) + '" y="' + (o + 5.5 * c + 5) + '" text-anchor="middle" class="svg-text svg-bold" font-size="13">C (hàng 6)</text></g>';
    s += '<g data-step="2">';
    for (i = 1; i <= 6; i++) s += cell(i, 6, "fill-b", ' fill-opacity="0.5"');
    s += '<text x="' + (o + 5.5 * c) + '" y="' + (o + 2.5 * c) + '" text-anchor="middle" class="svg-text svg-bold" font-size="13" transform="rotate(-90 ' +
      (o + 5.5 * c) + " " + (o + 2.5 * c) + ')">D (cột 6)</text></g>';
    s += '<g data-step="3">' + cell(6, 6, "fill-primary", ' fill-opacity="0.85"') +
      '<circle cx="' + (o + 5.5 * c) + '" cy="' + (o + 5.5 * c) + '" r="21" class="fill-none stroke-text" stroke-width="2.5"/></g>';
    el.innerHTML = s + "</svg>";
  }

  /* ---------- trò chơi 1: Xung khắc hay không? ---------- */
  /* bọc trong 1 <span>: nút đáp án là flex, chữ đậm rời ra sẽ thành cột riêng */
  var OPTS = [
    "<span>⚔️ Xung khắc, nhưng <b>không</b> đối lập</span>",
    "<span>☯️ Đối lập (xung khắc <b>và</b> luôn có 1 trong 2 xảy ra)</span>",
    "<span>🤝 Không xung khắc (có thể cùng xảy ra)</span>"
  ];
  function card(trial, a, b, ans, why) {
    return {
      q: "<b>Phép thử:</b> " + trial + "<br>A: “" + a + "”<br>B: “" + b + "”",
      options: OPTS, answer: ans, explain: why
    };
  }
  var XK_QUESTIONS = [
    card("Gieo 1 xúc xắc.", "ra mặt chẵn", "ra mặt lẻ", 1, "{2,4,6} và {1,3,5} không có mặt chung và gộp lại đủ cả 6 mặt, nên là <b>đối lập</b>."),
    card("Gieo 1 xúc xắc.", "ra mặt 1", "ra mặt 6", 0, "Không thể vừa ra 1 vừa ra 6, nên xung khắc. Nhưng nếu ra mặt 3 thì cả A và B đều không xảy ra, nên <b>không đối lập</b>."),
    card("Gieo 1 xúc xắc.", "ra mặt chẵn", "ra mặt lớn hơn 4", 2, "Ra mặt <b>6</b> thì cả hai cùng xảy ra ($A \\cap B = \\{6\\}$), nên không xung khắc."),
    card("Tung 1 đồng xu.", "ra mặt sấp", "ra mặt ngửa", 1, "Chỉ có 2 kết quả S và N: không bao giờ cùng xảy ra và lần nào cũng có 1 trong 2, nên là <b>đối lập</b>."),
    card("Gieo đồng thời 2 xúc xắc (Bài tập 2 trong slide).", "con thứ nhất ra mặt 6", "con thứ hai ra mặt 6", 2, "Cả hai con có thể cùng ra 6, tức kết quả (6, 6). Vậy $CD \\neq \\varnothing$ nên <b>không xung khắc</b>."),
    card("Lấy 1 sản phẩm từ giỏ chỉ có loại 1 và loại 2 (Bài tập 1 trong slide).", "nhận được loại 1", "nhận được loại 2", 1, "Slide kết luận xung khắc, đúng. Nhưng vì giỏ <b>chỉ có 2 loại</b>, lấy ra cái gì cũng thuộc 1 trong 2, nên A, B còn là <b>đối lập</b>."),
    card("Làm xét nghiệm nhanh cho 1 người (chỉ có 2 kết quả).", "dương tính", "âm tính", 1, "Chỉ có 2 kết quả: không thể cùng xảy ra và luôn có 1, nên là <b>đối lập</b>."),
    card("Khám bệnh cho 1 người.", "bị tăng huyết áp", "bị tiểu đường", 2, "Một người có thể mắc <b>cả hai</b> bệnh, nên không xung khắc."),
    card("Rút 1 lá từ bộ bài 52 lá.", "rút được lá Cơ", "rút được lá Át", 2, "Lá <b>Át Cơ</b> thuộc cả hai biến cố, nên không xung khắc."),
    card("Rút 1 lá từ bộ bài 52 lá.", "rút được lá Cơ", "rút được lá Bích", 0, "Một lá không thể vừa Cơ vừa Bích, nên xung khắc. Nhưng còn Rô và Chuồn (rút lá Rô thì cả A lẫn B đều không xảy ra), nên <b>không đối lập</b>."),
    card("Rút 1 lá từ bộ bài 52 lá.", "rút được lá đỏ", "rút được lá đen", 1, "Mỗi lá chỉ đỏ hoặc đen, không có màu thứ ba, nên là <b>đối lập</b>."),
    card("Đo huyết áp 1 người và phân loại theo bảng phân độ.", "tăng huyết áp độ 1", "tăng huyết áp độ 2", 0, "Một lần đo chỉ thuộc đúng 1 độ, nên xung khắc. Nhưng còn “bình thường”, “tiền tăng huyết áp”, “độ 3”, nên <b>không đối lập</b>."),
    card("Điều trị cho 1 bệnh nhân.", "bệnh nhân khỏi bệnh", "bệnh nhân không khỏi bệnh", 1, "“Không khỏi” chính là phủ định của “khỏi”: $B = \\overline{A}$, nên là <b>đối lập</b>."),
    card("Gieo 1 xúc xắc.", "ra số nguyên tố", "ra mặt chẵn", 2, "Số nguyên tố là {2, 3, 5}, mặt chẵn là {2, 4, 6}. Hai biến cố có chung mặt <b>2</b> (2 vừa nguyên tố vừa chẵn), nên không xung khắc."),
    card("Gieo 1 xúc xắc.", "ra mặt nhỏ hơn 3", "ra mặt lớn hơn 4", 0, "{1, 2} và {5, 6} không có mặt chung, nên xung khắc. Nhưng ra 3 hoặc 4 thì cả hai đều không xảy ra, nên <b>không đối lập</b>."),
    card("Gieo 1 xúc xắc.", "ra mặt không quá 3", "ra mặt từ 4 trở lên", 1, "{1, 2, 3} và {4, 5, 6}: không có mặt chung và gộp lại đủ Ω, nên là <b>đối lập</b>."),
    card("Lấy 1 viên thuốc từ lọ có viên đỏ, xanh và vàng.", "lấy được viên đỏ", "lấy được viên xanh", 0, "Một viên không thể vừa đỏ vừa xanh, nên xung khắc. Nhưng còn viên vàng, nên <b>không đối lập</b>."),
    card("Hỏi ngẫu nhiên 1 sinh viên.", "có hút thuốc lá", "có uống rượu bia", 2, "Một người có thể vừa hút thuốc vừa uống rượu bia, nên không xung khắc."),
    card("Châm cứu cho 1 bệnh nhân đau lưng, đánh giá sau 1 liệu trình.", "hết đau hoàn toàn", "còn đau", 1, "Sau liệu trình, bệnh nhân hoặc hết đau hoàn toàn hoặc vẫn còn đau (dù ít hay nhiều): đúng 1 trong 2, nên là <b>đối lập</b>.")
  ];

  /* ---------- trò chơi 2: Gieo xúc xắc săn biến cố ---------- */
  var HUNT_EVENTS = [
    { name: "Ra mặt chẵn", set: [2, 4, 6] },
    { name: "Ra mặt lẻ", set: [1, 3, 5] },
    { name: "Ra mặt lớn hơn 4", set: [5, 6] },
    { name: "Ra mặt không quá 2", set: [1, 2] },
    { name: "Ra mặt 6", set: [6] },
    { name: "Ra số nguyên tố", set: [2, 3, 5] },
    { name: "Ra mặt chia hết cho 3", set: [3, 6] },
    { name: "Ra mặt nhỏ hơn 4", set: [1, 2, 3] },
    { name: "Ra mặt chẵn <b>VÀ</b> lớn hơn 3", set: [4, 6], tag: "giao" },
    { name: "Ra mặt lẻ <b>HOẶC</b> bằng 6", set: [1, 3, 5, 6], tag: "hợp" },
    { name: "<b>KHÔNG</b> ra mặt 1", set: [2, 3, 4, 5, 6], tag: "đối lập" },
    { name: "Ra mặt chẵn <b>nhưng KHÔNG</b> chia hết cho 3", set: [2, 4], tag: "hiệu" },
    { name: "Ra số lẻ <b>VÀ</b> chia hết cho 3", set: [3], tag: "giao" },
    { name: "Ra mặt 7 chấm", set: [], tag: "không thể" },
    { name: "Ra mặt có từ 1 đến 6 chấm", set: [1, 2, 3, 4, 5, 6], tag: "chắc chắn" }
  ];

  function initHunt() {
    var el = document.getElementById("game-san-bien-co");
    if (!el || !XSTK.Game) return;
    var g = XSTK.Game.frame(el, {
      id: "bai2-san-bien-co",
      title: "Gieo xúc xắc săn biến cố",
      intro: "Bấm gieo xúc xắc. Sau đó chọn <b>tất cả</b> các biến cố <b>đã xảy ra</b> với mặt vừa ra (có thể không có biến cố nào). Chọn đúng hết cả lượt được cộng điểm."
    });
    var body = g.body, board = g.board, ROUNDS = 8, round = 0;

    function pickEvents(face) {
      for (var t = 0; t < 30; t++) {
        var evs = shuffle(HUNT_EVENTS).slice(0, 4);
        var yes = evs.filter(function (e) { return has(e.set, face); }).length;
        if (yes >= 1 && yes <= 3) return evs;
      }
      return shuffle(HUNT_EVENTS).slice(0, 4);
    }

    function start() { board.reset(); round = 0; nextRound(); }

    function nextRound() {
      round++;
      body.innerHTML =
        '<div class="game-progress"><span style="width:' + Math.round((round - 1) / ROUNDS * 100) + '%"></span></div>' +
        '<p class="muted small" style="margin:0 0 6px">Lượt ' + round + " / " + ROUNDS + "</p>" +
        '<div class="hunt-stage"><div class="hunt-die">' + dieSVG(0, 96, "") + "</div>" +
        '<button type="button" class="btn primary hunt-roll">🎲 Gieo xúc xắc</button></div>' +
        '<div class="hunt-area"></div>';
      var btn = body.querySelector(".hunt-roll");
      btn.addEventListener("click", function () { roll(btn); });
      if (round > 1) btn.focus({ preventScroll: true });
    }

    function roll(btn) {
      btn.disabled = true;
      var dieBox = body.querySelector(".hunt-die");
      var face = randInt(1, 6), ticks = 0;
      dieBox.classList.remove("rolling"); void dieBox.offsetWidth; dieBox.classList.add("rolling");
      var timer = setInterval(function () {
        ticks++;
        dieBox.innerHTML = dieSVG(randInt(1, 6), 96, "");
        if (ticks >= 9) {
          clearInterval(timer);
          dieBox.innerHTML = dieSVG(face, 96, "on-p");
          btn.textContent = "Ra mặt " + face + "!";
          ask(face);
        }
      }, 70);
    }

    function ask(face) {
      var evs = pickEvents(face);
      var area = body.querySelector(".hunt-area");
      area.innerHTML =
        '<p class="game-prompt" style="margin-top:12px">Xúc xắc ra mặt <b>' + face + "</b>. Những biến cố nào <b>đã xảy ra</b>?</p>" +
        '<div class="game-options"></div>' +
        '<div class="game-feedback"></div>' +
        '<div class="game-actions"><button type="button" class="btn primary hunt-check-btn">Kiểm tra ✓</button></div>';
      var opts = area.querySelector(".game-options");
      var buttons = evs.map(function (e) {
        var b = document.createElement("button");
        b.type = "button";
        b._ev = e; b._picked = false;
        b.setAttribute("aria-pressed", "false");
        b.innerHTML = '<span class="hunt-check" aria-hidden="true"></span><span class="hunt-label">' + e.name + (e.tag ? ' <span class="kw">' + e.tag + "</span>" : "") + "</span>";
        b.addEventListener("click", function () {
          if (b.disabled) return;
          b._picked = !b._picked;
          b.classList.toggle("picked", b._picked);
          b.setAttribute("aria-pressed", b._picked ? "true" : "false");
        });
        opts.appendChild(b);
        return b;
      });
      var checkBtn = area.querySelector(".hunt-check-btn");
      checkBtn.addEventListener("click", function () {
        var allOk = true;
        buttons.forEach(function (b) {
          var occurred = has(b._ev.set, face);
          var ok = b._picked === occurred;
          if (!ok) allOk = false;
          b.disabled = true;
          b.classList.add(ok ? "is-correct" : "is-wrong");
          b.querySelector(".hunt-label").insertAdjacentHTML("beforeend", '<span class="hunt-why">' + setText(b._ev.set) + " " +
            (occurred ? "có chứa " + face + " → <b>xảy ra</b>" : "không chứa " + face + " → <b>không xảy ra</b>") +
            (ok ? "" : (b._picked ? " · bạn đã chọn nhầm" : " · bạn bỏ sót")) + "</span>");
        });
        if (allOk) board.right(); else board.wrong();
        var fb = area.querySelector(".game-feedback");
        fb.className = "game-feedback show " + (allOk ? "ok" : "bad");
        fb.innerHTML = '<div class="fb-title">' + (allOk ? "Chính xác cả lượt! 🎉" : "Chưa đúng hết 😅") + "</div>" +
          "Nhớ quy tắc: biến cố <b>xảy ra</b> khi mặt vừa ra <b>thuộc</b> tập kết quả thuận lợi của nó.";
        checkBtn.remove();
        var next = document.createElement("button");
        next.type = "button"; next.className = "btn primary";
        next.textContent = round < ROUNDS ? "Lượt tiếp →" : "Xem kết quả 🏁";
        next.addEventListener("click", function () { if (round < ROUNDS) nextRound(); else end(); });
        area.querySelector(".game-actions").appendChild(next);
        next.focus({ preventScroll: true });
      });
    }

    function end() {
      var ratio = board.correct / ROUNDS;
      var stars = ratio === 1 ? "⭐⭐⭐" : ratio >= 0.7 ? "⭐⭐" : ratio >= 0.4 ? "⭐" : "💪";
      var msg = ratio === 1 ? "Hoàn hảo! Bạn đọc biến cố rất chuẩn." :
        ratio >= 0.7 ? "Rất tốt! Chú ý các biến cố có “và”, “hoặc”, “không”." :
          "Xem lại mục 3 và 5 rồi chơi lại nhé!";
      body.innerHTML =
        '<div class="game-progress"><span style="width:100%"></span></div>' +
        '<div class="game-end"><div class="big">' + stars + "</div>" +
        "<p><b>Đúng " + board.correct + "/" + ROUNDS + " lượt</b> · Điểm: <b>" + board.score + "</b></p>" +
        '<p class="muted">' + msg + "</p>" +
        '<div class="game-actions" style="justify-content:center"><button type="button" class="btn primary">↺ Chơi lại</button></div></div>';
      body.querySelector("button").addEventListener("click", start);
    }

    start();
  }

  /* ---------- khởi động ---------- */
  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll(".dice-row[data-size]"), renderDiceRow);
    Array.prototype.forEach.call(document.querySelectorAll("g.sdie[data-die]"), fillSvgDie);
    Array.prototype.forEach.call(document.querySelectorAll(".venn[data-rel]"), function (el) {
      el.innerHTML = vennSVG(el.getAttribute("data-rel"));
    });
    renderGrid36();
    /* chạy trước anim.js (anim.js khởi động lúc DOMContentLoaded) */
    Array.prototype.forEach.call(document.querySelectorAll('figure[data-anim="steps"]'), stepHook);
    /* bật hiệu ứng trượt/đổi màu sau khi trang đã vẽ xong trạng thái ban đầu */
    if (!noMotion()) requestAnimationFrame(function () { requestAnimationFrame(function () { document.documentElement.classList.add("b2-motion"); }); });
    /* khi in: mỗi hình chiếu nhảy tới bước cuối (bức tranh đầy đủ nhất) */
    window.addEventListener("beforeprint", function () {
      Array.prototype.forEach.call(document.querySelectorAll('figure[data-anim="steps"]'), function (f) {
        if (f._steps) { f._steps.stop(); f._steps.show(f._steps.total, false); }
      });
    });
    initExplorer();
    var g1 = document.getElementById("game-xung-khac");
    if (g1 && XSTK.Game) {
      XSTK.Game.mcq(g1, {
        id: "bai2-xung-khac",
        title: "Xung khắc hay không?",
        intro: "Đọc phép thử và hai biến cố A, B rồi chọn quan hệ đúng. Mẹo: tìm xem A, B có <b>cùng xảy ra</b> được không, và có kết quả nào mà <b>cả hai đều không xảy ra</b> không.",
        rounds: 8,
        questions: XK_QUESTIONS
      });
    }
    initHunt();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
