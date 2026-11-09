/* =========================================================
   games.js — bộ khung trò chơi dùng chung
   1) XSTK.Game.frame(container, {id, title, intro})
        → tạo khung trò chơi có bảng điểm; trả về { body, board }
          board.right(points?) / board.wrong() / board.reset() / board.score
   2) XSTK.Game.mcq(container, {
        id, title, intro, rounds, cols,
        questions: [{ q: "html", options: ["html",...], answer: 0, explain: "html" }]
      })
        → trò chơi trắc nghiệm nhiều lượt, có điểm, chuỗi đúng, kỷ lục
   ========================================================= */
(function () {
  "use strict";
  var XSTK = (window.XSTK = window.XSTK || {});
  var store = XSTK.store || {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* bỏ qua */ } }
  };
  function math(el) { if (XSTK.math) XSTK.math(el); }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  function getBest(id) { return (store.get("xstk-best", {}) || {})[id] || 0; }
  function setBest(id, v) { var b = store.get("xstk-best", {}) || {}; if (v > (b[id] || 0)) { b[id] = v; store.set("xstk-best", b); return true; } return false; }

  function frame(container, o) {
    container.classList.add("game");
    container.innerHTML =
      '<div class="game-head">' +
      '<span class="game-title"></span>' +
      '<span class="game-stat" data-k="score">Điểm: 0</span>' +
      '<span class="game-stat" data-k="streak">🔥 0</span>' +
      '<span class="game-stat" data-k="best">⭐ Kỷ lục: 0</span>' +
      "</div>" +
      '<div class="game-body"></div>';
    container.querySelector(".game-title").textContent = o.title || "Trò chơi";
    var body = container.querySelector(".game-body");
    if (o.intro) {
      var p = document.createElement("p"); p.className = "game-intro"; p.innerHTML = o.intro;
      container.insertBefore(p, body); p.style.padding = "12px 16px 0"; p.style.margin = "0";
    }
    var els = {
      score: container.querySelector('[data-k="score"]'),
      streak: container.querySelector('[data-k="streak"]'),
      best: container.querySelector('[data-k="best"]')
    };
    var board = {
      score: 0, streak: 0, correct: 0, total: 0,
      paint: function () {
        els.score.textContent = "Điểm: " + board.score;
        els.streak.textContent = "🔥 " + board.streak;
        els.best.textContent = "⭐ Kỷ lục: " + getBest(o.id);
      },
      right: function (pts) {
        board.streak++; board.correct++; board.total++;
        board.score += (pts || 10) + Math.max(0, board.streak - 1) * 2;   /* thưởng chuỗi đúng */
        if (setBest(o.id, board.score)) { /* kỷ lục mới */ }
        board.paint();
        els.score.classList.remove("pop"); void els.score.offsetWidth; els.score.classList.add("pop");
        if (XSTK.anim) XSTK.anim.confetti(els.score, { count: board.streak >= 3 ? 26 : 14, spread: board.streak >= 3 ? 140 : 90 });
      },
      wrong: function () {
        board.streak = 0; board.total++;
        board.paint();
        container.classList.remove("shake"); void container.offsetWidth; container.classList.add("shake");
      },
      reset: function () { board.score = 0; board.streak = 0; board.correct = 0; board.total = 0; board.paint(); }
    };
    board.paint();
    math(container);
    return { body: body, board: board, root: container };
  }

  function mcq(container, o) {
    var g = frame(container, o);
    var body = g.body, board = g.board;
    var rounds = Math.min(o.rounds || o.questions.length, o.questions.length);
    var list, idx;

    function start() {
      board.reset();
      list = o.noShuffle ? o.questions.slice(0, rounds) : shuffle(o.questions).slice(0, rounds);
      idx = 0;
      show();
    }

    function show() {
      var item = list[idx];
      var order = item.options.map(function (_, i) { return i; });
      if (o.shuffleOptions) order = shuffle(order);
      body.innerHTML =
        '<div class="game-progress"><span style="width:' + Math.round(idx / rounds * 100) + '%"></span></div>' +
        '<p class="muted small" style="margin:0 0 6px">Câu ' + (idx + 1) + " / " + rounds + "</p>" +
        '<div class="game-prompt"></div>' +
        '<div class="game-options' + (o.cols === 2 ? " cols-2" : "") + '"></div>' +
        '<div class="game-feedback"></div>' +
        '<div class="game-actions"></div>';
      body.querySelector(".game-prompt").innerHTML = item.q;
      var opts = body.querySelector(".game-options");
      var fb = body.querySelector(".game-feedback");
      var actions = body.querySelector(".game-actions");
      var buttons = [];
      order.forEach(function (oi) {
        var b = document.createElement("button");
        b.type = "button";
        b.innerHTML = item.options[oi];
        b.addEventListener("click", function () {
          buttons.forEach(function (x) { x.disabled = true; });
          var ok = oi === item.answer;
          if (ok) { b.classList.add("is-correct"); board.right(); }
          else {
            b.classList.add("is-wrong"); board.wrong();
            buttons.forEach(function (x) { if (x._oi === item.answer) x.classList.add("is-correct"); });
          }
          fb.className = "game-feedback show " + (ok ? "ok" : "bad");
          var mas = XSTK.icon ? XSTK.icon(ok ? "mascotHappy" : "mascotSad") : "";
          fb.innerHTML = '<div class="fb-title">' + mas + (ok ? pick(["Chính xác!", "Giỏi quá!", "Đúng rồi!", "Tuyệt vời!"]) + (board.streak >= 3 ? " Chuỗi " + board.streak + " câu đúng 🔥" : "") : pick(["Chưa đúng rồi", "Tiếc quá", "Sai mất rồi"]) + " — xem giải thích nhé") + "</div>" + (item.explain || "");
          var next = document.createElement("button");
          next.type = "button"; next.className = "btn primary";
          next.textContent = idx + 1 < rounds ? "Câu tiếp →" : "Xem kết quả 🏁";
          next.addEventListener("click", function () { idx++; if (idx < rounds) show(); else end(); });
          actions.appendChild(next);
          math(fb);
          next.focus({ preventScroll: true });
        });
        b._oi = oi;
        buttons.push(b);
        opts.appendChild(b);
      });
      math(body);
    }

    function end() {
      var ratio = board.correct / rounds;
      var stars = ratio === 1 ? "⭐⭐⭐" : ratio >= 0.7 ? "⭐⭐" : ratio >= 0.4 ? "⭐" : "💪";
      var endMascot = XSTK.icon ? '<div class="end-mascot">' + XSTK.icon(ratio >= 0.4 ? "mascotHappy" : "mascotSad") + "</div>" : "";
      var msg = ratio === 1 ? "Hoàn hảo! Bạn đã nắm chắc phần này." :
        ratio >= 0.7 ? "Rất tốt! Xem lại vài câu sai là ổn." :
          ratio >= 0.4 ? "Khá rồi! Đọc lại phần lý thuyết rồi chơi lại nhé." :
            "Đừng nản! Đọc lại phần tóm tắt cốt lõi rồi thử lại.";
      body.innerHTML =
        '<div class="game-progress"><span style="width:100%"></span></div>' +
        '<div class="game-end">' + endMascot + '<div class="big">' + stars + "</div>" +
        "<p><b>Đúng " + board.correct + "/" + rounds + " câu</b> · Điểm: <b>" + board.score + "</b></p>" +
        '<p class="muted">' + msg + "</p>" +
        '<div class="game-actions" style="justify-content:center"><button type="button" class="btn primary">↺ Chơi lại (câu hỏi mới)</button></div></div>';
      body.querySelector("button").addEventListener("click", start);
      if (ratio >= 0.7 && XSTK.anim) XSTK.anim.confetti(body.querySelector(".game-end"), { count: 70, spread: 220 });
    }

    function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
    start();
    return { restart: start, board: board };
  }

  XSTK.Game = { frame: frame, mcq: mcq, getBest: getBest, setBest: setBest };
})();
