/* Trang chủ: sinh thẻ bài học + thanh tiến độ từ LESSONS */
(function () {
  "use strict";
  var LESSONS = window.LESSONS || [];
  var P = (window.XSTK && window.XSTK.progress) || { isDone: function () { return false; } };

  var wrap = document.getElementById("lesson-cards");
  if (wrap) {
    wrap.innerHTML = LESSONS.map(function (l) {
      var label = l.num === "★" ? "Tổng hợp" : "Bài " + l.num;
      if (l.status === "soon") {
        return '<a class="lesson-card is-soon" href="' + l.href + '"><span class="lc-icon">' + l.icon + '</span>' +
          '<span class="lc-num">' + label + '</span><span class="lc-title">Đang cập nhật</span>' +
          '<span class="lc-desc">' + l.desc + "</span></a>";
      }
      return '<a class="lesson-card" href="' + l.href + '">' +
        (P.isDone(l.id) ? '<span class="lc-done">✓ Đã học</span>' : "") +
        '<span class="lc-icon">' + l.icon + '</span><span class="lc-num">' + label + "</span>" +
        '<span class="lc-title">' + l.title + '</span><span class="lc-desc">' + l.desc + "</span></a>";
    }).join("");
  }

  var ready = LESSONS.filter(function (l) { return l.status === "ready" && !l.noProgress; });
  var done = ready.filter(function (l) { return P.isDone(l.id); });
  var hp = document.getElementById("hero-progress");
  if (hp) {
    var pctDone = ready.length ? Math.round(done.length / ready.length * 100) : 0;
    hp.innerHTML = "Tiến độ của bạn: <b>" + done.length + "/" + ready.length + "</b> bài đã học" +
      '<div class="progress"><span style="width:' + pctDone + '%"></span></div>';
  }
  /* Nút "Bắt đầu" → chuyển tới bài đầu tiên chưa học */
  var next = ready.filter(function (l) { return !P.isDone(l.id); })[0];
  var btn = document.getElementById("start-btn");
  if (btn && next && done.length) {
    btn.href = next.href;
    btn.textContent = "▶️ Học tiếp: Bài " + next.num + " – " + next.title;
  } else if (btn && !next && ready.length) {
    btn.href = "on-tap.html";
    btn.textContent = "🎉 Đã học hết! Vào ôn tập";
  }
})();
