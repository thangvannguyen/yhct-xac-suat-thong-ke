/* =========================================================
   bai-1.js — công cụ, trò chơi & hình động của Bài 1: Giải tích tổ hợp
   1) Máy tính đếm n, k (+ liệt kê từng mẫu khi n ≤ 5, k ≤ 3)
   2) Trò chơi "Đoán công thức"
   3) Trò chơi "Tô vùng Venn"
   4) Bổ sung cho các hình chạy từng bước (data-anim="steps", xem anim.js):
      - .bank: vẽ hàng chữ số 0–9 / 30 bạn (data-off = bị gạch, data-pick = đang chọn)
      - .slot-fig: số kết quả "đếm chạy lên" khi tới bước nhân
      - .flow-fig: tô đường đi trên sơ đồ (data-path / data-dim / data-show = các bước)
      - .herb-fig: 6 cách xếp "bay" vào 1 túi thuốc; 60 chấm gộp thành 10 túi
   ========================================================= */
(function () {
  "use strict";
  var XSTK = window.XSTK || {};
  var U = XSTK.util;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function math(el) { if (XSTK.math) XSTK.math(el); }
  function big(x) { return U.fmt(x); }

  /* =====================================================
     1) MÁY TÍNH ĐẾM
     ===================================================== */
  var LETTERS = ["a", "b", "c", "d", "e"];

  /* mọi dãy độ dài k lấy từ {0..n-1}, có lặp, có thứ tự */
  function seqRep(n, k) {
    var out = [[]];
    for (var i = 0; i < k; i++) {
      var nx = [];
      out.forEach(function (s) { for (var j = 0; j < n; j++) nx.push(s.concat(j)); });
      out = nx;
    }
    return out;
  }
  function seqNoRep(n, k) { return seqRep(n, k).filter(function (s) { return new Set(s).size === s.length; }); }
  function combos(n, k) {
    return seqRep(n, k).filter(function (s) { for (var i = 1; i < s.length; i++) if (s[i] <= s[i - 1]) return false; return true; });
  }
  function multisets(n, k) {
    return seqRep(n, k).filter(function (s) { for (var i = 1; i < s.length; i++) if (s[i] < s[i - 1]) return false; return true; });
  }
  function label(s) { return s.length ? s.map(function (i) { return LETTERS[i]; }).join("") : "∅"; }
  function keyOf(s) { return s.slice().sort().map(function (i) { return LETTERS[i]; }).join(""); }

  function clampInt(v, lo, hi) {
    v = parseInt(v, 10);
    if (!isFinite(v)) v = lo;
    return Math.max(lo, Math.min(hi, v));
  }

  /* tích n(n-1)...(n-k+1) dạng TeX */
  function fallingTex(n, k) {
    if (k === 0) return "1";
    var terms = [];
    if (k <= 5) { for (var i = 0; i < k; i++) terms.push(n - i); return terms.join(" \\cdot "); }
    return n + " \\cdot " + (n - 1) + " \\cdot " + (n - 2) + " \\cdots " + (n - k + 1);
  }

  function initCalc() {
    var nEl = $("#calc-n"), kEl = $("#calc-k"), out = $("#calc-out"), en = $("#calc-enum");
    if (!nEl || !kEl || !out) return;

    function render() {
      var n = clampInt(nEl.value, 1, 50), k = clampInt(kEl.value, 0, 50);
      var F = U.nPowK(n, k), A = U.nAk(n, k), C = U.nCk(n, k), P = U.factorial(k), CR = U.nCkRep(n, k);
      var ok = k <= n;
      var cards = [
        { name: "Chỉnh hợp lặp", tag: "có lặp · có thứ tự",
          tex: "F_{" + n + "}^{" + k + "} = " + n + "^{" + k + "}", val: big(F) },
        { name: "Chỉnh hợp không lặp", tag: "không lặp · có thứ tự",
          tex: ok ? "A_{" + n + "}^{" + k + "} = " + fallingTex(n, k) : "A_{" + n + "}^{" + k + "}",
          val: ok ? big(A) : "0", note: ok ? "" : "Không chọn được " + k + " phần tử khác nhau khi chỉ có " + n + " phần tử (cần k ≤ n)." },
        { name: "Hoán vị k phần tử", tag: "xếp k phần tử đã chọn",
          tex: "P_{" + k + "} = " + k + "!", val: big(P) },
        { name: "Tổ hợp", tag: "không lặp · không thứ tự",
          tex: ok ? "C_{" + n + "}^{" + k + "} = \\dfrac{A_{" + n + "}^{" + k + "}}{" + k + "!} = \\dfrac{" + big(A) + "}{" + big(P) + "}" : "C_{" + n + "}^{" + k + "}",
          val: ok ? big(C) : "0", note: ok ? "" : "Cần k ≤ n." },
        { name: "Tổ hợp lặp (bổ sung)", tag: "có lặp · không thứ tự",
          tex: "\\overline{C}_{" + n + "}^{" + k + "} = C_{" + (n + k - 1) + "}^{" + k + "}", val: big(CR) }
      ];
      out.innerHTML = '<div class="calc-grid">' + cards.map(function (c) {
        return '<div class="calc-card"><span class="calc-name">' + c.name + '</span>' +
          '<span class="calc-tag">' + c.tag + "</span>" +
          '<div class="calc-tex">$' + c.tex + "$</div>" +
          '<span class="calc-val">= ' + c.val + "</span>" +
          (c.note ? '<span class="calc-note">' + c.note + "</span>" : "") + "</div>";
      }).join("") + "</div>" +
        (ok && k >= 1 ? '<p class="calc-check">🔗 Kiểm tra mối liên hệ $A_{' + n + "}^{" + k + "} = C_{" + n + "}^{" + k + "} \\times " + k + "!$ : &nbsp;<b>" +
          big(A) + " = " + big(C) + " × " + big(P) + "</b> ✓</p>" : "");
      math(out);
      renderEnum(n, k);
    }

    function group(title, list, cls, note) {
      return '<div class="enum-group"><p class="enum-title">' + title + ' <span class="enum-count">' + list.length + " mẫu</span></p>" +
        (note ? '<p class="enum-note">' + note + "</p>" : "") +
        '<div class="chip-list ' + cls + '">' + list.map(function (s) {
          return '<span class="chip" data-key="' + keyOf(s) + '">' + label(s) + "</span>";
        }).join("") + "</div></div>";
    }

    function renderEnum(n, k) {
      if (!en) return;
      if (n > 5 || k > 3 || k < 1) {
        en.innerHTML = '<p class="muted small">📋 Danh sách từng mẫu chỉ hiện khi <b>n ≤ 5</b> và <b>1 ≤ k ≤ 3</b> (để không quá dài). Thử bấm nút “Bốc thang: 5 vị chọn 3”.</p>';
        return;
      }
      var set = LETTERS.slice(0, n).join(", ");
      var html = '<p class="small enum-intro">📋 Lấy <b>k = ' + k + "</b> phần tử từ tập <b>{" + set +
        "}</b> (mỗi chữ cái có thể là 1 vị thuốc, 1 bệnh nhân…):</p>";
      html += group("① Chỉnh hợp lặp — được lặp, có thứ tự", seqRep(n, k), "enum-F", "Ví dụ “aa…” được phép vì có lặp.");
      if (k <= n) {
        html += group("② Chỉnh hợp không lặp — không lặp, có thứ tự", seqNoRep(n, k), "enum-A", "“ab” và “ba” là 2 mẫu khác nhau vì có thứ tự.");
        html += group("③ Tổ hợp — không lặp, không thứ tự", combos(n, k), "enum-C clickable",
          "👆 Bấm vào một tổ hợp để thấy nó ứng với " + Number(U.factorial(k)) + " chỉnh hợp ở danh sách ②.");
      } else {
        html += '<p class="muted small">② và ③ không có mẫu nào vì k &gt; n.</p>';
      }
      html += group("④ Tổ hợp lặp — được lặp, không thứ tự", multisets(n, k), "enum-R", "Chỉ quan tâm mỗi chữ xuất hiện mấy lần: “ab” và “ba” coi là một.");
      html += '<p class="enum-hint small" aria-live="polite"></p>';
      en.innerHTML = html;
    }

    if (en) en.addEventListener("click", function (e) {
      var chip = e.target.closest(".enum-C .chip");
      if (!chip) return;
      var key = chip.getAttribute("data-key");
      var already = chip.classList.contains("hit");
      Array.prototype.forEach.call(en.querySelectorAll(".chip.hit"), function (c) { c.classList.remove("hit"); });
      var hint = en.querySelector(".enum-hint");
      if (already) { if (hint) hint.textContent = ""; return; }
      var hits = en.querySelectorAll('.enum-A .chip[data-key="' + key + '"]');
      chip.classList.add("hit");
      Array.prototype.forEach.call(hits, function (c) { c.classList.add("hit"); });
      if (hint) hint.innerHTML = "Tổ hợp <b>{" + key.split("").join(", ") + "}</b> ứng với <b>" + hits.length +
        "</b> cách sắp thứ tự (tô màu cam ở ②). Mỗi tổ hợp đều như vậy ⇒ số chỉnh hợp = số tổ hợp × " + hits.length + ".";
    });

    nEl.addEventListener("input", render);
    kEl.addEventListener("input", render);
    Array.prototype.forEach.call(document.querySelectorAll("[data-preset]"), function (b) {
      b.addEventListener("click", function () {
        var p = b.getAttribute("data-preset").split(",");
        nEl.value = p[0]; kEl.value = p[1]; render();
      });
    });
    render();
  }

  /* =====================================================
     2) TRÒ CHƠI "ĐOÁN CÔNG THỨC"
     ===================================================== */
  var OPTS = [
    "🔁 Chỉnh hợp lặp $\\;n^k$",
    "🥇 Chỉnh hợp không lặp $\\;A_n^k$",
    "🪑 Hoán vị $\\;k!$",
    "🌿 Tổ hợp $\\;C_n^k$"
  ];
  var FORMULA_QS = [
    { q: "Mật khẩu điện thoại gồm <b>4 chữ số</b> (0–9), các chữ số <b>được trùng nhau</b>. Có bao nhiêu mật khẩu?", a: 0,
      ex: "Được lặp (1111 hợp lệ), có thứ tự (1234 ≠ 4321) ⇒ chỉnh hợp lặp: $10^4 = 10.000$." },
    { q: "Bầu <b>1 lớp trưởng và 1 lớp phó</b> từ 30 sinh viên (một người không giữ 2 chức).", a: 1,
      ex: "Không lặp, có thứ tự (An trưởng – Bình phó ≠ Bình trưởng – An phó) ⇒ $A_{30}^2 = 30 \\cdot 29 = 870$." },
    { q: "Xếp <b>5 bệnh nhân</b> vào <b>5 giường</b>, mỗi giường đúng 1 người.", a: 2,
      ex: "Xếp hết 5 người vào 5 chỗ ⇒ hoán vị: $5! = 120$." },
    { q: "Chọn <b>3 vị thuốc</b> trong 5 vị để bốc <b>một thang</b>.", a: 3,
      ex: "Không lặp, đổi thứ tự vẫn là cùng một thang ⇒ tổ hợp: $C_5^3 = 10$." },
    { q: "Xếp <b>tuỳ ý 5 bệnh nhân vào 3 khoa</b> (một khoa nhận bao nhiêu người cũng được).", a: 0,
      ex: "Mỗi bệnh nhân có 3 lựa chọn khoa, khoa được dùng lặp lại ⇒ $3^5 = 243$ (ví dụ trong slide)." },
    { q: "Chọn <b>5 người vào ban chấp hành</b> chi đoàn từ 8 ứng cử viên.", a: 3,
      ex: "Chỉ chọn nhóm, không phân chức ⇒ $C_8^5 = 56$ (ví dụ trong slide)." },
    { q: "Phân công trực <b>Thứ 2, Thứ 3, Thứ 4</b> cho 3 trong 7 bác sĩ (mỗi ngày 1 người, không ai trực 2 ngày).", a: 1,
      ex: "Không lặp, ngày khác nhau nên có thứ tự ⇒ $A_7^3 = 7 \\cdot 6 \\cdot 5 = 210$." },
    { q: "Tung một đồng xu <b>6 lần</b> và ghi lại dãy sấp/ngửa. Có bao nhiêu dãy?", a: 0,
      ex: "Mỗi lần có 2 khả năng, được lặp, thứ tự lần tung quan trọng ⇒ $2^6 = 64$." },
    { q: "Chọn <b>4 huyệt</b> trong 10 huyệt để châm (thứ tự châm không quan trọng).", a: 3,
      ex: "Không lặp, không thứ tự ⇒ $C_{10}^4 = 210$." },
    { q: "Xếp <b>4 lọ thuốc khác nhau</b> thành một hàng trên kệ.", a: 2,
      ex: "Sắp xếp toàn bộ 4 phần tử ⇒ $4! = 24$." },
    { q: "Từ 6 sinh viên, chọn 3 bạn làm 3 việc <b>khác nhau</b>: đo huyết áp, cân, ghi hồ sơ.", a: 1,
      ex: "Việc khác nhau ⇒ đổi người là ra cách mới ⇒ $A_6^3 = 6 \\cdot 5 \\cdot 4 = 120$." },
    { q: "Từ 6 sinh viên, chọn <b>2 bạn đi trực cùng một việc</b>.", a: 3,
      ex: "Cùng một việc ⇒ không thứ tự ⇒ $C_6^2 = 15$." },
    { q: "Phiếu trắc nghiệm <b>10 câu</b>, mỗi câu tô 1 trong 4 đáp án A, B, C, D. Có bao nhiêu cách tô?", a: 0,
      ex: "Mỗi câu 4 lựa chọn, được trùng đáp án ⇒ $4^{10} = 1.048.576$." },
    { q: "Xếp <b>6 người</b> ngồi vào <b>6 ghế</b> kê thành một hàng.", a: 2,
      ex: "$6! = 720$ cách." },
    { q: "Lập số có <b>3 chữ số khác nhau</b> từ các chữ số 1, 2, 3, 4, 5.", a: 1,
      ex: "Không lặp, có thứ tự (123 ≠ 321) ⇒ $A_5^3 = 5 \\cdot 4 \\cdot 3 = 60$." },
    { q: "Từ 10 bệnh nhân, chọn <b>3 người làm cùng một xét nghiệm</b>.", a: 3,
      ex: "Chỉ chọn nhóm ⇒ $C_{10}^3 = 120$." },
    { q: "Trao giải <b>Nhất, Nhì, Ba</b> cho 3 trong 10 thí sinh.", a: 1,
      ex: "Giải khác nhau ⇒ có thứ tự, một người không nhận 2 giải ⇒ $A_{10}^3 = 720$." },
    { q: "Mã số tủ thuốc gồm <b>3 chữ số</b> từ 0–9, <b>được lặp</b>.", a: 0,
      ex: "$10^3 = 1.000$ mã." },
    { q: "Có bao nhiêu cách xếp <b>thứ tự khám</b> cho 4 bệnh nhân đang chờ?", a: 2,
      ex: "Sắp thứ tự cả 4 người ⇒ $4! = 24$." },
    { q: "Gia đình có 3 con, có bao nhiêu khả năng <b>có đúng 2 con gái</b>?", a: 3,
      ex: "Chọn 2 trong 3 lần sinh là gái: $C_3^2 = 3$ (GGT, GTG, TGG) — ví dụ trong slide." }
  ];

  function initFormulaGame() {
    var host = $("#game-formula");
    if (!host || !XSTK.Game) return;
    XSTK.Game.mcq(host, {
      id: "bai1-doan-cong-thuc",
      title: "Đoán công thức",
      intro: "Đọc tình huống, tự hỏi <b>“Có lặp không? Đổi chỗ có ra cách mới không?”</b> rồi chọn công thức. 8 câu mỗi lượt, đúng liên tiếp được thưởng thêm điểm.",
      rounds: 8,
      cols: 2,
      questions: FORMULA_QS.map(function (x) { return { q: x.q, options: OPTS, answer: x.a, explain: x.ex }; })
    });
  }

  /* =====================================================
     3) TRÒ CHƠI "TÔ VÙNG VENN"
     Vùng: a = chỉ A · ab = A∩B · b = chỉ B · o = ngoài A và B
     ===================================================== */
  var PATHS = {
    a: "M175,50 A75,75 0 1 0 175,170 A75,75 0 0 1 175,50 Z",
    ab: "M175,50 A75,75 0 0 1 175,170 A75,75 0 0 1 175,50 Z",
    b: "M175,50 A75,75 0 1 1 175,170 A75,75 0 0 0 175,50 Z",
    o: "M10,10 H340 V210 H10 Z M175,50 A75,75 0 1 0 175,170 A75,75 0 1 0 175,50 Z"
  };
  var REGION_NAME = { a: "chỉ A", ab: "phần chung A∩B", b: "chỉ B", o: "ngoài cả A và B" };
  var ORDER = ["a", "ab", "b", "o"];

  var VENN_QS = [
    { e: "A \\cap B", w: "vừa thuộc A <b>vừa</b> thuộc B", s: ["ab"] },
    { e: "A \\cup B", w: "thuộc <b>ít nhất một</b> trong hai tập", s: ["a", "ab", "b"] },
    { e: "A \\setminus B", w: "thuộc A nhưng <b>không</b> thuộc B", s: ["a"] },
    { e: "B \\setminus A", w: "thuộc B nhưng <b>không</b> thuộc A", s: ["b"] },
    { e: "A", w: "toàn bộ tập A", s: ["a", "ab"] },
    { e: "B", w: "toàn bộ tập B", s: ["ab", "b"] },
    { e: "\\Omega \\setminus A", w: "những phần tử <b>không</b> thuộc A", s: ["b", "o"] },
    { e: "\\Omega \\setminus B", w: "những phần tử <b>không</b> thuộc B", s: ["a", "o"] },
    { e: "\\Omega \\setminus (A \\cup B)", w: "không thuộc tập nào cả", s: ["o"] },
    { e: "\\Omega \\setminus (A \\cap B)", w: "<b>không</b> đồng thời thuộc cả hai", s: ["a", "b", "o"] },
    { e: "(A \\setminus B) \\cup (B \\setminus A)", w: "thuộc <b>đúng một</b> tập", s: ["a", "b"] },
    { e: "", w: "🩺 Bệnh nhân bị <b>cả</b> tăng huyết áp <b>và</b> tiểu đường", s: ["ab"] },
    { e: "", w: "🩺 Bệnh nhân bị tăng huyết áp nhưng <b>không</b> bị tiểu đường", s: ["a"] },
    { e: "", w: "🩺 Bệnh nhân bị <b>ít nhất một</b> trong hai bệnh", s: ["a", "ab", "b"] },
    { e: "", w: "🩺 Bệnh nhân <b>không mắc</b> bệnh nào trong hai bệnh", s: ["o"] },
    { e: "", w: "🩺 Bệnh nhân <b>chỉ</b> bị tiểu đường", s: ["b"] },
    { e: "", w: "🩺 Bệnh nhân <b>không</b> bị tăng huyết áp", s: ["b", "o"] },
    { e: "", w: "🩺 Bệnh nhân bị tiểu đường (có thể kèm tăng huyết áp hoặc không)", s: ["ab", "b"] }
  ];

  function buildVennSvg(onToggle) {
    var S = XSTK.svg;
    var svg = S.create(350, 220, "Biểu đồ Venn: bấm vào từng vùng để tô");
    svg.classList.add("venn-svg");
    var regions = {};
    ORDER.forEach(function (r) {
      var p = S.el("path", {
        d: PATHS[r], class: "region " + (r === "o" ? "fill-soft" : "fill-surface"),
        "fill-rule": "evenodd", tabindex: "0", role: "button",
        "aria-label": "Vùng " + REGION_NAME[r], "aria-pressed": "false", "data-r": r
      }, svg);
      p.addEventListener("click", function () { onToggle(r); });
      p.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(r); }
      });
      regions[r] = p;
    });
    S.el("rect", { x: 10, y: 10, width: 330, height: 200, rx: 0, class: "fill-none stroke-border deco" }, svg);
    S.el("circle", { cx: 130, cy: 110, r: 75, class: "fill-none stroke-a sw-3 deco" }, svg);
    S.el("circle", { cx: 220, cy: 110, r: 75, class: "fill-none stroke-b sw-3 deco" }, svg);
    S.el("text", { x: 92, y: 27, "text-anchor": "middle", class: "svg-text svg-bold deco", text: "A · Tăng huyết áp" }, svg);
    S.el("text", { x: 262, y: 27, "text-anchor": "middle", class: "svg-text svg-bold deco", text: "B · Tiểu đường" }, svg);
    S.el("text", { x: 88, y: 116, "text-anchor": "middle", class: "svg-muted deco", text: "chỉ A" }, svg);
    S.el("text", { x: 175, y: 116, "text-anchor": "middle", class: "svg-muted deco", text: "A∩B" }, svg);
    S.el("text", { x: 262, y: 116, "text-anchor": "middle", class: "svg-muted deco", text: "chỉ B" }, svg);
    S.el("text", { x: 24, y: 200, class: "svg-text svg-bold deco", text: "Ω" }, svg);
    return { svg: svg, regions: regions };
  }

  function initVennGame() {
    var host = $("#game-venn");
    if (!host || !XSTK.Game || !XSTK.svg) return;
    var g = XSTK.Game.frame(host, {
      id: "bai1-to-vung-venn",
      title: "Tô vùng Venn",
      intro: "Khoa Nội: <b>Ω</b> = tất cả bệnh nhân, <b>A</b> = bệnh nhân tăng huyết áp, <b>B</b> = bệnh nhân tiểu đường. " +
        "Bấm (chạm) vào các vùng để tô cho đúng yêu cầu, rồi bấm <b>Kiểm tra</b>. Bấm lần nữa để bỏ tô."
    });
    var body = g.body, board = g.board, ROUNDS = 8;
    var list, idx, sel, locked, vs;

    function start() {
      board.reset();
      list = U.shuffle(VENN_QS).slice(0, ROUNDS);
      idx = 0;
      show();
    }

    function toggle(r) {
      if (locked) return;
      sel[r] = !sel[r];
      vs.regions[r].classList.toggle("sel", !!sel[r]);
      vs.regions[r].setAttribute("aria-pressed", sel[r] ? "true" : "false");
    }

    function show() {
      sel = {}; locked = false;
      var q = list[idx];
      body.innerHTML =
        '<div class="game-progress"><span style="width:' + Math.round(idx / ROUNDS * 100) + '%"></span></div>' +
        '<p class="muted small game-count">Câu ' + (idx + 1) + " / " + ROUNDS + "</p>" +
        '<div class="game-prompt">Tô vùng: ' + (q.e ? "$" + q.e + "$ — " : "") + q.w + "</div>" +
        '<div class="venn-wrap"></div>' +
        '<div class="game-feedback"></div>' +
        '<div class="game-actions">' +
        '<button type="button" class="btn primary" data-act="check">✔️ Kiểm tra</button>' +
        '<button type="button" class="btn" data-act="clear">↺ Xoá tô</button></div>';
      vs = buildVennSvg(toggle);
      body.querySelector(".venn-wrap").appendChild(vs.svg);
      body.querySelector('[data-act="check"]').addEventListener("click", check);
      body.querySelector('[data-act="clear"]').addEventListener("click", function () {
        ORDER.forEach(function (r) { if (sel[r]) toggle(r); });
      });
      math(body);
    }

    function check() {
      if (locked) return;
      locked = true;
      var q = list[idx];
      var want = {};
      q.s.forEach(function (r) { want[r] = true; });
      var right = ORDER.every(function (r) { return !!want[r] === !!sel[r]; });
      var missing = [], extra = [];
      ORDER.forEach(function (r) {
        var p = vs.regions[r];
        p.classList.remove("sel");
        p.setAttribute("tabindex", "-1");
        if (want[r]) p.classList.add("ok");
        else if (sel[r]) p.classList.add("bad");
        if (want[r] && !sel[r]) missing.push(REGION_NAME[r]);
        if (!want[r] && sel[r]) extra.push(REGION_NAME[r]);
      });
      if (right) board.right(); else board.wrong();
      var fb = body.querySelector(".game-feedback");
      fb.className = "game-feedback show " + (right ? "ok" : "bad");
      fb.innerHTML = '<div class="fb-title">' + (right ? "Chính xác! 🎉" : "Chưa đúng 😅") + "</div>" +
        "Đáp án (màu xanh): tô vùng <b>" + q.s.map(function (r) { return REGION_NAME[r]; }).join("</b>, <b>") + "</b>." +
        (missing.length ? "<br>Bạn tô <b>thiếu</b>: " + missing.join(", ") + "." : "") +
        (extra.length ? "<br>Bạn tô <b>thừa</b> (màu đỏ): " + extra.join(", ") + "." : "");
      var actions = body.querySelector(".game-actions");
      actions.innerHTML = "";
      var next = document.createElement("button");
      next.type = "button"; next.className = "btn primary";
      next.textContent = idx + 1 < ROUNDS ? "Câu tiếp →" : "Xem kết quả 🏁";
      next.addEventListener("click", function () { idx++; if (idx < ROUNDS) show(); else end(); });
      actions.appendChild(next);
      math(fb);
      next.focus({ preventScroll: true });
    }

    function end() {
      var ratio = board.correct / ROUNDS;
      var stars = ratio === 1 ? "⭐⭐⭐" : ratio >= 0.7 ? "⭐⭐" : ratio >= 0.4 ? "⭐" : "💪";
      var msg = ratio === 1 ? "Hoàn hảo! Bạn đã thành thạo giao – hợp – trừ." :
        ratio >= 0.7 ? "Rất tốt! Chú ý chữ “và” (giao) với “hoặc” (hợp) nhé." :
          "Xem lại mục 2 (ba phép toán) rồi chơi lại nhé!";
      body.innerHTML =
        '<div class="game-progress"><span style="width:100%"></span></div>' +
        '<div class="game-end"><div class="big">' + stars + "</div>" +
        "<p><b>Đúng " + board.correct + "/" + ROUNDS + " câu</b> · Điểm: <b>" + board.score + "</b></p>" +
        '<p class="muted">' + msg + "</p>" +
        '<div class="game-actions centered"><button type="button" class="btn primary">↺ Chơi lại</button></div></div>';
      body.querySelector("button").addEventListener("click", start);
    }

    start();
  }

  /* =====================================================
     4) BỔ SUNG CHO HÌNH CHẠY TỪNG BƯỚC
     ===================================================== */
  function isReduced() { return !XSTK.anim || !!XSTK.anim.reduced; }
  function vnNum(x) { return Number(x).toLocaleString("vi-VN"); }

  /* gọi cb(k, kTrước) mỗi khi hình data-anim="steps" đổi bước.
     anim.js đổi class (step-off, cap-on…) khi chuyển bước → theo dõi bằng MutationObserver. */
  function onStep(fig, cb) {
    var last = null;
    function check() {
      var st = fig._steps;
      if (!st || st.step === last) return;
      var prev = last;
      last = st.step;
      cb(last, prev);
    }
    if (window.MutationObserver) new MutationObserver(check).observe(fig, { subtree: true, attributes: true, attributeFilter: ["class"] });
    check();
  }

  /* "0:A 1:B" → { "0": "A", "1": "B" };  "5 0" → { "5": null, "0": null } */
  function parseMarks(str) {
    var map = {};
    (str || "").split(/[\s,]+/).forEach(function (t) {
      if (!t) return;
      var p = t.split(":");
      map[p[0]] = p.length > 1 ? p[1] : null;
    });
    return map;
  }

  /* kho lựa chọn: chữ số 0..n-1 (mặc định) hoặc n chấm = n người (.bank.people) */
  function fillBanks() {
    $$(".bank").forEach(function (b) {
      if (b.querySelector(".bank-items")) return;
      var people = b.classList.contains("people");
      var n = parseInt(b.getAttribute("data-n"), 10) || 10;
      var off = parseMarks(b.getAttribute("data-off")), pick = parseMarks(b.getAttribute("data-pick"));
      var lab = b.getAttribute("data-label");
      var html = lab ? '<span class="bank-label">' + lab + "</span>" : "";
      html += '<span class="bank-items">';
      for (var i = 0; i < n; i++) {
        var k = String(i), cls = people ? "p" : "d", txt = people ? "" : k;
        if (k in off) { cls += " off"; if (off[k]) txt = off[k]; }
        if (k in pick) { cls += " pick"; if (pick[k]) txt = pick[k]; }
        html += '<span class="' + cls + '">' + txt + "</span>";
      }
      b.innerHTML = html + "</span>";
    });
  }

  /* ô trống: tới bước nhân thì kết quả đếm chạy lên (vd 0 → 900) */
  function initSlotFigs() {
    $$(".slot-fig").forEach(function (fig) {
      var counters = $$("[data-count]", fig).map(function (el) {
        var host = el.closest("[data-step]");
        return { el: el, to: parseFloat(el.getAttribute("data-count")), at: host ? parseInt(host.getAttribute("data-step"), 10) : 0 };
      });
      onStep(fig, function (k, prev) {
        counters.forEach(function (c) {
          if (k === c.at && prev != null && prev < k && !isReduced()) XSTK.anim.countUp(c.el, c.to, { duration: 900 });
          else c.el.textContent = vnNum(c.to);
        });
      });
    });
  }

  /* sơ đồ chọn công thức: tô sáng / làm mờ / hiện chữ theo bước hiện tại */
  function initFlowFig() {
    $$(".flow-fig").forEach(function (fig) {
      var els = $$("[data-path], [data-dim], [data-show]", fig);
      function has(el, attr, k) {
        var v = el.getAttribute(attr);
        return v != null && (" " + v + " ").indexOf(" " + k + " ") !== -1;
      }
      onStep(fig, function (k, prev) {
        fig.setAttribute("data-cur", k);
        els.forEach(function (el) {
          var wasShow = el.classList.contains("is-show"), wasPath = el.classList.contains("is-path");
          var path = has(el, "data-path", k), show = has(el, "data-show", k);
          el.classList.toggle("is-path", path);
          el.classList.toggle("is-dim", has(el, "data-dim", k));
          el.classList.toggle("is-show", show);
          if (prev == null || isReduced()) return;
          if (show && !wasShow) XSTK.anim.appear(el, 0, 380);
          if (path && !wasPath && el.classList.contains("flow-leaf")) setTimeout(function () { XSTK.anim.pulse(el); }, 250);
        });
      });
    });
  }

  /* cho bản sao của các phần tử SVG "bay" tới đích rồi biến mất */
  function flyInto(layer, nodes, targetOf, o) {
    nodes.forEach(function (node, i) {
      var t = targetOf(node), bb;
      try { bb = node.getBBox(); } catch (e) { return; }
      if (!t || !bb.width) return;
      var c = node.cloneNode(true);
      c.removeAttribute("data-col");
      layer.appendChild(c);
      c.style.transformBox = "fill-box";
      c.style.transformOrigin = "center";
      var dx = t.x - (bb.x + bb.width / 2), dy = t.y - (bb.y + bb.height / 2);
      var a = c.animate([
        { transform: "translate(0px, 0px) scale(1)", opacity: 1 },
        { transform: "translate(" + dx + "px, " + dy + "px) scale(" + o.scale + ")", opacity: 0.1 }
      ], { duration: o.duration, delay: o.stagger * i, easing: "cubic-bezier(.55,0,.25,1)", fill: "forwards" });
      a.onfinish = a.oncancel = function () { c.remove(); };
    });
  }
  function centerOf(el) {
    var b = el.getBBox();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  }

  /* chọn 3 trong 5 vị: 6 cách xếp → 1 thang; 60 cách xếp → 10 thang */
  function initHerbFig() {
    $$(".herb-fig").forEach(function (fig) {
      var layer = fig.querySelector(".fly");
      var bagBody = fig.querySelector(".bag path:nth-of-type(2)");
      if (!layer || !bagBody) return;
      onStep(fig, function (k, prev) {
        layer.textContent = "";
        if (isReduced() || prev == null || k !== prev + 1 || !layer.animate) return;
        if (k === 3) {
          var target = centerOf(bagBody);
          flyInto(layer, $$(".strip", fig), function () { return target; }, { duration: 850, stagger: 90, scale: 0.25 });
        } else if (k === 5) {
          var bags = {};
          $$(".bag10", fig).forEach(function (r) { bags[r.getAttribute("data-col")] = centerOf(r); });
          flyInto(layer, $$(".dot", fig), function (d) { return bags[d.getAttribute("data-col")]; }, { duration: 750, stagger: 9, scale: 0.6 });
        }
      });
    });
  }

  function boot() {
    fillBanks();
    initSlotFigs();
    initFlowFig();
    initHerbFig();
    initCalc();
    initFormulaGame();
    initVennGame();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
