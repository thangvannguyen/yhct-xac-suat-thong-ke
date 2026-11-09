/* =========================================================
   anim.js — HIỆU ỨNG CHUYỂN ĐỘNG giúp hình minh hoạ dễ hiểu hơn
   ---------------------------------------------------------
   TỰ ĐỘNG (không cần viết JS):
   1) <figure class="fig"> có <svg>: khi cuộn tới, hình được "vẽ dần"
      (nét được vẽ ra, hình khối nảy lên, chữ hiện dần) theo đúng thứ tự
      trong mã SVG. Có nút "↻ Xem lại" ở góc phải.
        - Tắt:   <figure class="fig" data-anim="none">
        - Chậm/nhanh: data-anim-speed="1.5" (lớn hơn = chậm hơn)
   2) TRÌNH CHIẾU TỪNG BƯỚC: <figure class="fig" data-anim="steps">
        - Gắn data-step="1", "2", … vào các phần tử SVG (hoặc HTML) bên trong.
          Phần tử có data-step="k" xuất hiện từ bước k trở đi.
          data-step-only="k": chỉ hiện đúng ở bước k (dùng để tô sáng tạm).
        - Chú thích từng bước: <div class="step-captions">
              <p data-caption="0">Bấm ▶ để xem…</p>   (bước 0 = hình gốc, tuỳ chọn)
              <p data-caption="1">Bước 1: …</p> …
          </div>
        - Tự chạy 1 lần khi cuộn tới (data-autoplay="false" để tắt),
          có nút ‹ ›, chấm tiến độ, ▶ Tự chạy, ↺.
        - Thời gian mỗi bước: data-step-ms="2600"
   3) Danh sách lời giải <ol class="steps"> có ≥ 3 bước: có nút
      "▶ Xem từng bước" để mở dần từng bước.
   4) Khối nội dung (.box, .card, .formula, .fig, .widget, .game…) hiện
      dần khi cuộn tới.
   5) <span data-count-to="243" data-decimals="0">0</span>: đếm số chạy lên.
   6) Thanh tiến độ đọc bài ở đầu trang.

   DÙNG TRONG JS (window.XSTK.anim):
     anim.build(figureOrSvg)          vẽ dần lại một hình
     anim.appear(el, delayMs)         cho 1 phần tử SVG/HTML xuất hiện có hiệu ứng
     anim.drawPath(el, ms, delay)     vẽ nét một path/line
     anim.countUp(el, to, {duration, decimals, suffix, prefix})
     anim.confetti(originEl | {x, y}, {count})
     anim.pulse(el)                   nháy sáng 1 lần để gây chú ý
     anim.onVisible(el, cb)           gọi cb khi el lần đầu xuất hiện trên màn hình
     anim.wait(ms)                    Promise chờ
     anim.reduced                     true nếu người dùng tắt hiệu ứng
   Mỗi lần hình đổi bước, figure phát sự kiện "xstk:step" (e.detail = {step, prev, total, animate}).
   Thêm ?static=1 vào URL để tắt mọi hiệu ứng (khi chụp ảnh, in ấn); hình chiếu từng bước
   khi đó hiện sẵn bước cuối.
   ========================================================= */
(function () {
  "use strict";
  var XSTK = (window.XSTK = window.XSTK || {});
  var staticMode = /[?&]static=1/.test(location.search);
  var reduced = (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) || staticMode;
  var EASE = "cubic-bezier(.2,.8,.2,1)";
  var BOUNCE = "cubic-bezier(.34,1.56,.64,1)";
  var SKIP_SEL = "defs, defs *, clipPath, clipPath *, mask, mask *, marker, marker *, pattern, pattern *, title, desc, symbol, symbol *, linearGradient, linearGradient *, radialGradient, radialGradient *, tspan, textPath";
  var SHAPES = "path, line, polyline, polygon, circle, ellipse, rect, text, image, use, foreignObject";

  function icon(n) { return XSTK.icon ? XSTK.icon(n) : ""; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function onVisible(el, cb, opts) {
    if (!("IntersectionObserver" in window)) { cb(el); return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { io.disconnect(); cb(el); } });
    }, { threshold: (opts && opts.threshold) || 0.25, rootMargin: "0px 0px -8% 0px" });
    io.observe(el);
  }

  function hasTransformAttr(el) {
    for (var n = el; n && n.tagName && n.tagName.toLowerCase() !== "svg"; n = n.parentNode) {
      if (n === el && n.getAttribute("transform")) return true;
    }
    return false;
  }
  function isStrokeOnly(el) {
    var tag = el.tagName.toLowerCase();
    if (tag === "text" || tag === "image" || tag === "use" || tag === "foreignobject") return false;
    if (tag === "line" || tag === "polyline") return true;
    var cs = getComputedStyle(el);
    return (cs.fill === "none" || cs.fillOpacity === "0") && cs.stroke && cs.stroke !== "none";
  }

  /* cho 1 phần tử xuất hiện có hiệu ứng (SVG hoặc HTML) */
  function appear(el, delay, dur) {
    if (reduced || !el.animate) return null;
    delay = delay || 0;
    var tag = el.tagName.toLowerCase();
    var isSvg = el instanceof SVGElement;
    if (isSvg && isStrokeOnly(el) && typeof el.getTotalLength === "function") {
      var cs = getComputedStyle(el);
      if (cs.strokeDasharray && cs.strokeDasharray !== "none") {
        return el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: dur || 450, delay: delay, fill: "backwards", easing: EASE });
      }
      return drawPath(el, dur || 650, delay);
    }
    if (isSvg && tag === "text") {
      return el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: dur || 420, delay: delay, fill: "backwards", easing: EASE });
    }
    if (isSvg && hasTransformAttr(el)) {
      return el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: dur || 420, delay: delay, fill: "backwards", easing: EASE });
    }
    if (isSvg) {
      el.style.transformBox = "fill-box";
      el.style.transformOrigin = "center";
    }
    return el.animate([
      { opacity: 0, transform: isSvg ? "scale(.6)" : "translateY(10px) scale(.98)" },
      { opacity: 1, transform: "none" }
    ], { duration: dur || 480, delay: delay, fill: "backwards", easing: isSvg ? BOUNCE : EASE });
  }

  function drawPath(el, dur, delay) {
    if (reduced || !el.animate || typeof el.getTotalLength !== "function") return null;
    var len;
    try { len = el.getTotalLength(); } catch (e) { len = 0; }
    if (!len || !isFinite(len)) return el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: dur || 400, delay: delay || 0, fill: "backwards" });
    var prevDash = el.style.strokeDasharray;
    el.style.strokeDasharray = len + " " + len;
    var a = el.animate([{ strokeDashoffset: len, opacity: .3 }, { strokeDashoffset: 0, opacity: 1 }],
      { duration: dur || 650, delay: delay || 0, fill: "backwards", easing: "cubic-bezier(.45,.05,.25,1)" });
    var done = function () { el.style.strokeDasharray = prevDash; };
    a.onfinish = done; a.oncancel = done;
    return a;
  }

  function collect(svg) {
    return Array.prototype.filter.call(svg.querySelectorAll(SHAPES), function (el) {
      return !el.matches(SKIP_SEL) && !el.closest(".ic") && !el.closest("[data-anim-skip]");
    });
  }

  /* "vẽ dần" toàn bộ hình */
  function build(target, opts) {
    if (reduced || !target) return;
    var speed = parseFloat((target.getAttribute && target.getAttribute("data-anim-speed")) || (opts && opts.speed) || 1) || 1;
    var svgs = target.tagName && target.tagName.toLowerCase() === "svg" ? [target] :
      Array.prototype.filter.call(target.querySelectorAll("svg"), function (s) { return !s.classList.contains("ic") && !s.closest(".ic"); });
    svgs.forEach(function (svg) {
      var els = collect(svg).filter(function (el) { return !el.closest(".step-off"); });
      if (!els.length) return;
      els.forEach(function (el) { if (el.getAnimations) el.getAnimations().forEach(function (a) { a.cancel(); }); });
      var total = Math.min(1700, 380 + els.length * 45) * speed;
      var stagger = els.length > 1 ? (total - 450) / (els.length - 1) : 0;
      stagger = Math.max(6, Math.min(110 * speed, stagger));
      els.forEach(function (el, i) { appear(el, i * stagger); });
    });
  }

  function countUp(el, to, o) {
    o = o || {};
    var dec = o.decimals != null ? o.decimals : (String(to).split(".")[1] || "").length;
    var fmt = function (v) {
      return (o.prefix || "") + Number(v).toLocaleString("vi-VN", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + (o.suffix || "");
    };
    if (reduced) { el.textContent = fmt(to); return; }
    var from = o.from || 0, dur = o.duration || 1100, t0 = performance.now();
    (function tick(now) {
      var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  var CONF_COLORS = ["#6d5efc", "#9b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#f97316"];
  function confetti(origin, o) {
    if (reduced || !document.body.animate) return;
    o = o || {};
    var x, y;
    if (origin && origin.getBoundingClientRect) { var r = origin.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; }
    else if (origin && origin.x != null) { x = origin.x; y = origin.y; }
    else { x = window.innerWidth / 2; y = window.innerHeight / 3; }
    var n = o.count || 26;
    for (var i = 0; i < n; i++) {
      var b = document.createElement("span");
      b.className = "confetti-bit";
      b.style.left = x + "px"; b.style.top = y + "px";
      b.style.background = CONF_COLORS[i % CONF_COLORS.length];
      if (i % 3 === 0) { b.style.borderRadius = "50%"; b.style.width = b.style.height = "8px"; }
      document.body.appendChild(b);
      var ang = Math.random() * Math.PI * 2, sp = (o.spread || 120) * (0.45 + Math.random() * 0.75);
      var dx = Math.cos(ang) * sp, up = -Math.abs(Math.sin(ang) * sp) - 40, fall = 120 + Math.random() * 160;
      var rot = (Math.random() * 720 - 360) | 0;
      var an = b.animate([
        { transform: "translate(-50%,-50%) rotate(0deg)", opacity: 1 },
        { transform: "translate(" + (dx * 0.7) + "px," + up + "px) rotate(" + (rot / 2) + "deg)", opacity: 1, offset: 0.45 },
        { transform: "translate(" + dx + "px," + (up + fall) + "px) rotate(" + rot + "deg)", opacity: 0 }
      ], { duration: 1000 + Math.random() * 600, easing: "cubic-bezier(.2,.7,.3,1)" });
      an.onfinish = (function (el) { return function () { el.remove(); }; })(b);
    }
  }

  function pulse(el) {
    if (reduced || !el || !el.animate) return;
    if (el instanceof SVGElement) { el.style.transformBox = "fill-box"; el.style.transformOrigin = "center"; }
    el.animate([{ transform: "scale(1)", filter: "brightness(1)" }, { transform: "scale(1.08)", filter: "brightness(1.15)" }, { transform: "scale(1)", filter: "brightness(1)" }],
      { duration: 520, easing: EASE });
  }

  /* ---------- trình chiếu từng bước ---------- */
  function initSteps(fig) {
    if (fig.dataset.stepsReady) return;
    fig.dataset.stepsReady = "1";
    var items = Array.prototype.slice.call(fig.querySelectorAll("[data-step], [data-step-only]"));
    var caps = Array.prototype.slice.call(fig.querySelectorAll("[data-caption]"));
    var N = 0;
    items.forEach(function (el) { N = Math.max(N, parseInt(el.getAttribute("data-step") || el.getAttribute("data-step-only"), 10) || 0); });
    caps.forEach(function (el) { N = Math.max(N, parseInt(el.getAttribute("data-caption"), 10) || 0); });
    if (!N) return;
    var hasZero = caps.some(function (c) { return c.getAttribute("data-caption") === "0"; });
    var minStep = hasZero ? 0 : 1;
    var ms = parseInt(fig.getAttribute("data-step-ms"), 10) || 2600;
    var cur = -1, timer = null;

    var ctrl = document.createElement("div");
    ctrl.className = "step-ctrl";
    ctrl.innerHTML =
      '<button type="button" class="btn small" data-act="prev" aria-label="Bước trước">‹</button>' +
      '<span class="step-dots"></span>' +
      '<button type="button" class="btn small primary" data-act="next">Bước tiếp ›</button>' +
      '<button type="button" class="btn small" data-act="play">' + icon("play") + " Tự chạy</button>";
    var dots = ctrl.querySelector(".step-dots");
    for (var i = minStep; i <= N; i++) {
      var d = document.createElement("i");
      d.setAttribute("data-k", i); d.title = "Bước " + i;
      dots.appendChild(d);
    }
    var capBox = fig.querySelector(".step-captions");
    var anchor = capBox || fig.querySelector("figcaption");
    if (anchor) fig.insertBefore(ctrl, anchor.nextSibling); else fig.appendChild(ctrl);

    var btnNext = ctrl.querySelector('[data-act="next"]'), btnPrev = ctrl.querySelector('[data-act="prev"]'), btnPlay = ctrl.querySelector('[data-act="play"]');

    function vis(el, k) {
      var only = el.getAttribute("data-step-only");
      if (only != null) return parseInt(only, 10) === k;
      return (parseInt(el.getAttribute("data-step"), 10) || 0) <= k;
    }
    function show(k, animate) {
      k = Math.max(minStep, Math.min(N, k));
      var prev = cur; cur = k;
      items.forEach(function (el) {
        var v = vis(el, k), was = !el.classList.contains("step-off");
        el.classList.toggle("step-off", !v);
        if (v && (!was || prev === -1) && animate && prev !== -1) {
          var kids = el instanceof SVGElement && el.tagName.toLowerCase() === "g" ? collect(el) : [el];
          kids.forEach(function (c, j) { appear(c, j * 40); });
        }
      });
      caps.forEach(function (c) { c.classList.toggle("cap-on", parseInt(c.getAttribute("data-caption"), 10) === k); });
      Array.prototype.forEach.call(dots.children, function (d) {
        var dk = +d.getAttribute("data-k");
        d.classList.toggle("on", dk === k); d.classList.toggle("done", dk < k);
      });
      btnPrev.disabled = k <= minStep;
      btnNext.textContent = k >= N ? "↺ Xem lại" : "Bước tiếp ›";
      if (XSTK.math) caps.forEach(function (c) { if (c.classList.contains("cap-on")) XSTK.math(c); });
      /* báo cho JS riêng của bài biết hình vừa đổi bước: fig.addEventListener("xstk:step", e => e.detail.step) */
      fig.dispatchEvent(new CustomEvent("xstk:step", { detail: { step: k, prev: prev, total: N, animate: !!animate }, bubbles: true }));
    }
    function stop() { clearInterval(timer); timer = null; btnPlay.innerHTML = icon("play") + " Tự chạy"; }
    function play() {
      if (timer) { stop(); return; }
      if (cur >= N) show(minStep, true);
      btnPlay.textContent = "❚❚ Dừng";
      timer = setInterval(function () { if (cur >= N) { stop(); return; } show(cur + 1, true); }, ms);
    }
    btnNext.addEventListener("click", function () { stop(); show(cur >= N ? minStep : cur + 1, true); });
    btnPrev.addEventListener("click", function () { stop(); show(cur - 1, true); });
    btnPlay.addEventListener("click", play);
    dots.addEventListener("click", function (e) { var k = e.target.getAttribute && e.target.getAttribute("data-k"); if (k != null) { stop(); show(+k, true); } });

    show(staticMode ? N : minStep, false);   /* ?static=1 (chụp ảnh, in): hiện trạng thái cuối */
    if (!reduced && fig.getAttribute("data-autoplay") !== "false") {
      onVisible(fig, function () { setTimeout(function () { if (cur === minStep && !timer) play(); }, 700); }, { threshold: 0.45 });
    }
    fig._steps = { show: show, play: play, stop: stop, get step() { return cur; }, total: N };
  }

  /* ---------- lời giải mở từng bước ---------- */
  function initStepLists(root) {
    Array.prototype.forEach.call((root || document).querySelectorAll("ol.steps"), function (ol) {
      if (ol.dataset.stepper || ol.closest(".game, .widget, [data-anim='steps']")) return;
      var lis = Array.prototype.filter.call(ol.children, function (x) { return x.tagName === "LI"; });
      if (lis.length < 3) return;
      ol.dataset.stepper = "1";
      var bar = document.createElement("div");
      bar.className = "steps-bar";
      bar.innerHTML = '<button type="button" class="btn small" data-act="mode">' + icon("play") + " Xem từng bước</button>";
      ol.parentNode.insertBefore(bar, ol);
      var mode = false, shown = lis.length;
      var bMode = bar.querySelector('[data-act="mode"]');
      var bNext = document.createElement("button");
      bNext.type = "button"; bNext.className = "btn small primary"; bNext.style.display = "none";
      bar.appendChild(bNext);
      function paint() {
        lis.forEach(function (li, i) { li.classList.toggle("step-hide", mode && i >= shown); });
        bNext.style.display = mode && shown < lis.length ? "" : "none";
        bNext.textContent = "Bước " + (shown + 1) + "/" + lis.length + " ›";
        bMode.innerHTML = mode ? "Hiện tất cả" : icon("play") + " Xem từng bước";
      }
      bMode.addEventListener("click", function () { mode = !mode; shown = mode ? 1 : lis.length; paint(); if (mode) lis[0].classList.add("step-new"); });
      bNext.addEventListener("click", function () {
        if (shown < lis.length) {
          var li = lis[shown]; shown++; paint();
          li.classList.remove("step-new"); void li.offsetWidth; li.classList.add("step-new");
          if (shown === lis.length) { mode = false; paint(); }
        }
      });
    });
  }

  /* ---------- tự động ---------- */
  function initFigures(root) {
    Array.prototype.forEach.call((root || document).querySelectorAll("figure.fig, .fig[data-anim]"), function (fig) {
      if (fig.dataset.animReady) return;
      if (fig.closest(".game, .widget") && !fig.hasAttribute("data-anim")) return;
      var mode = fig.getAttribute("data-anim");
      if (mode === "none") return;
      fig.dataset.animReady = "1";
      if (mode === "steps") { initSteps(fig); return; }
      if (!fig.querySelector("svg:not(.ic)")) return;
      var rb = document.createElement("button");
      rb.type = "button"; rb.className = "fig-replay"; rb.innerHTML = icon("refresh") + " Xem lại";
      rb.addEventListener("click", function () { build(fig); });
      fig.appendChild(rb);
      if (reduced) return;
      /* ẩn trước khi cuộn tới để lúc vẽ không bị "nháy" */
      var r = fig.getBoundingClientRect();
      if (r.top > window.innerHeight) {
        var svgs = fig.querySelectorAll("svg:not(.ic)");
        Array.prototype.forEach.call(svgs, function (s) { s.style.opacity = "0"; });
        onVisible(fig, function () {
          Array.prototype.forEach.call(svgs, function (s) { s.style.opacity = ""; });
          build(fig);
        });
      } else {
        onVisible(fig, function () { build(fig); });
      }
    });
  }

  var REVEAL = ".content > .box, .content > .card, .content > .grid-2, .content > .grid-3, .content > .grid-4, .content > .formula, .content > .fig, .content > .table-wrap, .content > .widget, .content > .game, .content > .quiz, .content > .exercise, .content > section > .box, .content > section > .grid-2, .content > section > .grid-3, .content > section > .fig, .content > section > .formula, .content > section > .widget, .content > section > .game, .content > section > .table-wrap, .lesson-cards > .lesson-card, .how-steps > .card";
  function initReveal() {
    if (reduced || !("IntersectionObserver" in window)) return;
    document.documentElement.classList.add("anim-on");
    var vh = window.innerHeight;
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
    var groupIdx = 0, lastParent = null;
    Array.prototype.forEach.call(document.querySelectorAll(REVEAL), function (el) {
      if (el.getBoundingClientRect().top < vh * 0.95) return; /* phần đang thấy: để nguyên, không nháy */
      if (el.parentNode === lastParent && el.matches(".lesson-card, .how-steps > .card")) groupIdx++; else groupIdx = 0;
      lastParent = el.parentNode;
      if (groupIdx) el.style.transitionDelay = Math.min(groupIdx, 6) * 60 + "ms";
      el.classList.add("rv");
      io.observe(el);
    });
  }

  function initCounters() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-count-to]"), function (el) {
      var to = parseFloat(el.getAttribute("data-count-to"));
      if (!isFinite(to)) return;
      onVisible(el, function () {
        countUp(el, to, { decimals: el.getAttribute("data-decimals") != null ? +el.getAttribute("data-decimals") : undefined, suffix: el.getAttribute("data-suffix") || "", prefix: el.getAttribute("data-prefix") || "" });
      });
    });
  }

  function initReadProgress() {
    if (!document.querySelector(".lesson-hero")) return;
    var bar = document.createElement("div");
    bar.className = "read-progress";
    document.body.appendChild(bar);
    var ticking = false;
    function upd() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? Math.min(100, window.scrollY / h * 100) : 0) + "%";
      ticking = false;
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  XSTK.anim = {
    reduced: reduced, build: build, appear: appear, drawPath: drawPath, countUp: countUp,
    confetti: confetti, pulse: pulse, onVisible: onVisible, wait: wait,
    initSteps: initSteps, initFigures: initFigures, initStepLists: initStepLists
  };

  /* trước khi in: mọi hình chiếu từng bước chuyển về bước cuối (hình đầy đủ) */
  window.addEventListener("beforeprint", function () {
    Array.prototype.forEach.call(document.querySelectorAll("[data-anim='steps']"), function (f) {
      if (f._steps) { f._steps.stop(); f._steps.show(f._steps.total, false); }
    });
  });

  function start() {
    initFigures(document);
    initStepLists(document);
    initCounters();
    initReveal();
    initReadProgress();
  }
  /* chạy sau khi JS riêng của từng bài đã vẽ xong nội dung */
  var started = false;
  function once() { if (!started) { started = true; start(); } }
  if (document.readyState === "complete") once();
  else { document.addEventListener("DOMContentLoaded", once); window.addEventListener("load", once); }
})();
