/* =========================================================
   main.js — phần dùng chung cho mọi trang
   - Sinh thanh trên cùng, menu bài học, mục lục, chân trang
   - Nút sáng/tối, nút "Đã học xong" (lưu trong trình duyệt)
   - Hiển thị công thức (KaTeX)
   - Trắc nghiệm nhanh: <div class="quiz"> … </div>
   Các hàm dùng lại được gắn vào window.XSTK
   ========================================================= */
(function () {
  "use strict";

  var XSTK = (window.XSTK = window.XSTK || {});
  var LESSONS = window.LESSONS || [];
  var page = document.body.getAttribute("data-page") || "";

  /* ---------- lưu trữ an toàn (có thể bị chặn ở chế độ ẩn danh) ---------- */
  var store = {
    get: function (k, d) {
      try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    set: function (k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* bỏ qua */ }
    }
  };
  XSTK.store = store;

  /* ---------- tiện ích DOM ---------- */
  function h(tag, attrs, html) {
    var el = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === "class") el.className = attrs[k];
      else if (k === "text") el.textContent = attrs[k];
      else el.setAttribute(k, attrs[k]);
    }
    if (html != null) el.innerHTML = html;
    return el;
  }
  XSTK.h = h;

  function slugify(s) {
    return s.toString().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "muc";
  }
  XSTK.slugify = slugify;

  /* ---------- tiến độ học ---------- */
  function getDone() { return store.get("xstk-done", []); }
  function isDone(id) { return getDone().indexOf(id) !== -1; }
  function setDone(id, on) {
    var d = getDone().filter(function (x) { return x !== id; });
    if (on) d.push(id);
    store.set("xstk-done", d);
  }
  XSTK.progress = { getDone: getDone, isDone: isDone, setDone: setDone };
  function countable() { return LESSONS.filter(function (l) { return l.status === "ready" && !l.noProgress; }); }

  /* ---------- sáng / tối ---------- */
  function currentTheme() {
    var t = document.documentElement.getAttribute("data-theme");
    if (t) return t;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function ico(name, fallback) { return XSTK.icon ? XSTK.icon(name) : fallback; }
  function applyThemeIcon(btn) { btn.innerHTML = currentTheme() === "dark" ? ico("sun", "☀️") : ico("moon", "🌙"); }

  /* ---------- thanh trên cùng ---------- */
  function buildTopbar() {
    var top = document.getElementById("topbar");
    if (!top) return;
    top.className = "topbar";
    top.innerHTML =
      '<div class="topbar-inner">' +
      '<button class="icon-btn menu-btn" type="button" aria-label="Mở danh sách bài học">' + ico("menu", "☰") + '</button>' +
      '<a class="brand" href="index.html"><span class="brand-logo">' + ico("mascot", "🎲") + '</span>' +
      '<span>XSTK <b>YHCT</b><span class="brand-text-long muted" style="font-weight:500"> · Học Xác Suất Thống Kê</span></span></a>' +
      '<div class="topbar-spacer"></div>' +
      '<a class="top-link" href="index.html">Trang chủ</a>' +
      '<a class="top-link" href="on-tap.html">Ôn tập</a>' +
      '<button class="icon-btn theme-btn" type="button" aria-label="Đổi giao diện sáng/tối"></button>' +
      "</div>";
    var themeBtn = top.querySelector(".theme-btn");
    applyThemeIcon(themeBtn);
    themeBtn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("xstk-theme", next); } catch (e) { /* bỏ qua */ }
      applyThemeIcon(themeBtn);
      document.dispatchEvent(new CustomEvent("xstk:theme", { detail: next }));
    });
    top.querySelector(".menu-btn").addEventListener("click", function () {
      document.body.classList.toggle("nav-open");
    });
  }

  /* ---------- menu bài học bên trái ---------- */
  function buildSidebar() {
    var side = document.getElementById("sidebar");
    if (!side) return;
    var html = '<p class="sidebar-title">Bài học</p><ul class="lesson-nav">';
    html += '<li><a href="index.html"' + (page === "home" ? ' class="active"' : "") +
      '><span class="num">🏠</span><span>Trang chủ</span></a></li>';
    LESSONS.forEach(function (l) {
      var active = l.id === page ? " active" : "";
      if (l.status === "soon") {
        html += '<li><a class="' + active.trim() + '" href="' + l.href + '"><span class="num">' + l.num +
          '</span><span>' + l.title + '</span><span class="soon-pill">Sắp có</span></a></li>';
      } else {
        html += '<li><a class="' + active.trim() + '" href="' + l.href + '"><span class="num">' + l.num +
          '</span><span>' + l.title + "</span>" +
          (isDone(l.id) ? '<span class="done-mark" title="Đã học xong">✓</span>' : "") + "</a></li>";
      }
    });
    html += "</ul>";
    var total = countable().length;
    var done = countable().filter(function (l) { return isDone(l.id); }).length;
    html += '<div class="sidebar-progress">Tiến độ: <b>' + done + "/" + total + '</b> bài' +
      '<div class="progress"><span style="width:' + (total ? Math.round(done / total * 100) : 0) + '%"></span></div></div>';
    side.innerHTML = html;
    side.setAttribute("aria-label", "Danh sách bài học");

    var bd = document.querySelector(".backdrop");
    if (!bd) { bd = h("div", { class: "backdrop" }); document.body.appendChild(bd); }
    bd.addEventListener("click", function () { document.body.classList.remove("nav-open"); });
    side.addEventListener("click", function (e) {
      if (e.target.closest("a")) document.body.classList.remove("nav-open");
    });
  }

  /* ---------- mục lục (từ các thẻ h2 trong bài) ---------- */
  function buildToc() {
    var content = document.getElementById("content");
    if (!content) return;
    var heads = Array.prototype.slice.call(content.querySelectorAll("h2"))
      .filter(function (x) { return !x.closest(".box, .card, .widget, .game, .objectives, .lesson-hero"); });
    var used = {};
    heads.forEach(function (hd) {
      if (!hd.id) {
        var base = slugify(hd.textContent), id = base, i = 2;
        while (used[id] || document.getElementById(id)) id = base + "-" + i++;
        hd.id = id;
      }
      used[hd.id] = true;
    });
    var toc = document.getElementById("toc");
    if (heads.length < 2) {
      if (toc) { toc.remove(); document.querySelector(".layout").classList.add("no-toc"); }
      return;
    }
    var items = heads.map(function (hd) {
      return '<li><a href="#' + hd.id + '">' + hd.textContent.replace(/</g, "&lt;") + "</a></li>";
    }).join("");
    if (toc) toc.innerHTML = '<p class="toc-title">Trong bài này</p><ol>' + items + "</ol>";

    var hero = content.querySelector(".lesson-hero");
    var inline = h("details", { class: "toc-inline" }, "<summary>📑 Mục lục bài</summary><ol>" + items + "</ol>");
    if (hero) hero.insertAdjacentElement("afterend", inline);

    if (toc && "IntersectionObserver" in window) {
      var links = toc.querySelectorAll("a");
      var map = {};
      Array.prototype.forEach.call(links, function (a) { map[a.getAttribute("href").slice(1)] = a; });
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            Array.prototype.forEach.call(links, function (a) { a.classList.remove("active"); });
            var a = map[en.target.id]; if (a) a.classList.add("active");
          }
        });
      }, { rootMargin: "-10% 0px -75% 0px" });
      heads.forEach(function (hd) { obs.observe(hd); });
    }
  }

  /* ---------- cuối bài: tải PDF, đã học xong, bài trước/sau ---------- */
  function buildLessonEnd() {
    var content = document.getElementById("content");
    var idx = -1;
    LESSONS.forEach(function (l, i) { if (l.id === page) idx = i; });
    if (!content || idx === -1) return;
    var lesson = LESSONS[idx];
    var end = h("section", { class: "lesson-end", "aria-label": "Kết thúc bài" });
    var actions = h("div", { class: "lesson-actions" });
    if (lesson.pdf) {
      actions.appendChild(h("a", { class: "btn", href: lesson.pdf, download: "" }, "📄 Tải slide gốc (PDF)"));
      actions.appendChild(h("a", { class: "btn", href: lesson.pdf, target: "_blank", rel: "noopener" }, "👁️ Xem slide gốc"));
    }
    if (lesson.status === "ready" && !lesson.noProgress) {
      var doneBtn = h("button", { class: "btn done-btn", type: "button" });
      var paint = function () {
        var d = isDone(lesson.id);
        doneBtn.classList.toggle("is-done", d);
        doneBtn.textContent = d ? "✅ Đã học xong bài này" : "☐ Đánh dấu đã học xong";
      };
      paint();
      doneBtn.addEventListener("click", function () { setDone(lesson.id, !isDone(lesson.id)); paint(); buildSidebar(); });
      actions.appendChild(doneBtn);
    }
    end.appendChild(actions);

    var pager = h("nav", { class: "pager", "aria-label": "Chuyển bài" });
    var prev = LESSONS[idx - 1], next = LESSONS[idx + 1];
    if (prev) pager.appendChild(h("a", { class: "prev", href: prev.href },
      '<span class="dir">← Bài trước</span><span class="ttl">' + (prev.num === "★" ? "" : "Bài " + prev.num + ": ") + prev.title + "</span>"));
    if (next) pager.appendChild(h("a", { class: "next", href: next.href },
      '<span class="dir">Bài tiếp →</span><span class="ttl">' + (next.num === "★" ? "" : "Bài " + next.num + ": ") + next.title + "</span>"));
    end.appendChild(pager);
    content.appendChild(end);
  }

  function buildFooter() {
    var f = document.getElementById("footer");
    if (!f) return;
    f.className = "site-footer";
    f.innerHTML = "Tài liệu tự học môn Xác Suất Thống Kê · Lớp YHCT 2026 · Biên soạn lại từ slide bài giảng Trường Cao đẳng Y Dược Hồng Đức." +
      "<br>Trang web chỉ hỗ trợ ôn tập; khi có chỗ khác nhau, hãy theo bài giảng của thầy cô.";
  }

  /* ---------- công thức toán (KaTeX) ---------- */
  var KATEX_OPTS = {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "\\[", right: "\\]", display: true },
      { left: "$", right: "$", display: false },
      { left: "\\(", right: "\\)", display: false }
    ],
    ignoredClasses: ["no-math"],
    throwOnError: false,
    strict: false   /* cho phép chữ tiếng Việt trong \\text{…} mà không báo cảnh báo */
  };
  XSTK.math = function (el) {
    if (window.renderMathInElement) {
      try { window.renderMathInElement(el || document.body, KATEX_OPTS); } catch (e) { /* bỏ qua */ }
    }
  };
  /* Viết công thức trực tiếp bằng JS: XSTK.tex("C_n^k") → chuỗi HTML */
  XSTK.tex = function (src, display) {
    if (window.katex) {
      try { return window.katex.renderToString(src, { throwOnError: false, strict: false, displayMode: !!display }); } catch (e) { /* bỏ qua */ }
    }
    return src;
  };

  /* ---------- trắc nghiệm nhanh ----------
     <div class="quiz" data-title="Kiểm tra nhanh">
       <div class="q" data-answer="1">          ← chỉ số đáp án đúng (tính từ 0)
         <p class="q-text">Câu hỏi…</p>
         <div class="q-options"><button>A</button><button>B</button>…</div>
         <div class="q-explain">Giải thích…</div>
       </div>
     </div>
  */
  function initQuizzes(root) {
    Array.prototype.forEach.call((root || document).querySelectorAll(".quiz"), function (quiz) {
      if (quiz.dataset.ready) return;
      quiz.dataset.ready = "1";
      var qs = quiz.querySelectorAll(".q");
      var head = h("div", { class: "quiz-head" },
        "<strong>📝 " + (quiz.getAttribute("data-title") || "Trắc nghiệm nhanh") + "</strong>" +
        '<span class="quiz-score">0/' + qs.length + " đúng</span>");
      quiz.insertBefore(head, quiz.firstChild);
      var reset = h("button", { class: "btn small", type: "button" }, "↺ Làm lại");
      head.appendChild(reset);
      var scoreEl = head.querySelector(".quiz-score");
      function update() {
        var ok = quiz.querySelectorAll(".q.answered.right").length;
        var done = quiz.querySelectorAll(".q.answered").length;
        scoreEl.textContent = ok + "/" + qs.length + " đúng" + (done === qs.length ? (ok === qs.length ? " 🎉" : "") : "");
        if (done === qs.length && ok === qs.length && XSTK.anim) XSTK.anim.confetti(scoreEl, { count: 50, spread: 180 });
      }
      Array.prototype.forEach.call(qs, function (q, i) {
        var txt = q.querySelector(".q-text");
        if (txt && !txt.querySelector(".q-num")) txt.insertAdjacentHTML("afterbegin", '<span class="q-num">Câu ' + (i + 1) + ".</span>");
        var ans = parseInt(q.getAttribute("data-answer"), 10);
        var btns = q.querySelectorAll(".q-options button");
        Array.prototype.forEach.call(btns, function (b, j) {
          b.type = "button";
          b.addEventListener("click", function () {
            if (q.classList.contains("answered")) return;
            q.classList.add("answered");
            if (j === ans) { q.classList.add("right"); b.classList.add("is-correct"); if (XSTK.anim) XSTK.anim.confetti(b, { count: 12, spread: 80 }); }
            else { b.classList.add("is-wrong"); if (btns[ans]) btns[ans].classList.add("is-correct"); }
            Array.prototype.forEach.call(btns, function (x) { x.disabled = true; });
            update();
          });
        });
      });
      reset.addEventListener("click", function () {
        Array.prototype.forEach.call(qs, function (q) {
          q.classList.remove("answered", "right");
          Array.prototype.forEach.call(q.querySelectorAll(".q-options button"), function (b) {
            b.disabled = false; b.classList.remove("is-correct", "is-wrong");
          });
        });
        update();
      });
    });
  }
  XSTK.initQuizzes = initQuizzes;

  /* ---------- hàng thông tin ở đầu bài: thời gian đọc, số trò chơi… ---------- */
  function buildHeroStats() {
    var hero = document.querySelector(".lesson-hero");
    var content = document.getElementById("content");
    if (!hero || !content || hero.querySelector(".hero-stats")) return;
    var words = (content.innerText || "").split(/\s+/).length;
    var mins = Math.max(5, Math.round(words / 180 / 5) * 5);
    var nGame = content.querySelectorAll(".game").length;
    var nWidget = content.querySelectorAll(".widget").length;
    var nEx = content.querySelectorAll(".exercise").length;
    var nQ = content.querySelectorAll(".quiz .q").length;
    var nFig = content.querySelectorAll("figure.fig").length;
    if (nGame + nWidget + nEx + nQ === 0) return;
    var ic = function (n) { return XSTK.icon ? XSTK.icon(n) : ""; };
    var items = ['<span>' + ic("timer") + " ~" + mins + " phút</span>"];
    if (nFig) items.push("<span>" + ic("image") + " " + nFig + " hình minh hoạ</span>");
    if (nGame) items.push("<span>" + ic("gamepad") + " " + nGame + " trò chơi</span>");
    if (nWidget) items.push("<span>" + ic("flask") + " " + nWidget + " công cụ</span>");
    if (nEx || nQ) items.push("<span>" + ic("memo") + " " + (nEx ? nEx + " bài tập" : "") + (nEx && nQ ? " · " : "") + (nQ ? nQ + " câu trắc nghiệm" : "") + "</span>");
    var row = h("div", { class: "hero-stats" }, items.join(""));
    var lead = hero.querySelector(".lead");
    if (lead) lead.insertAdjacentElement("afterend", row); else hero.appendChild(row);
  }

  /* ---------- khởi động ---------- */
  function boot() {
    buildTopbar();
    buildSidebar();
    buildToc();
    buildLessonEnd();
    buildFooter();
    initQuizzes();
    XSTK.math(document.body);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") document.body.classList.remove("nav-open");
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  if (document.readyState === "complete") buildHeroStats();
  else document.addEventListener("DOMContentLoaded", buildHeroStats);
})();
