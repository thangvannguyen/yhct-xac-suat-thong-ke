/* =========================================================
   icons.js — BỘ ICON TỰ VẼ (SVG) cho cả trang
   - Cùng một phong cách: nét tròn 1.9px, nền tô nhạt cùng màu,
     điểm nhấn màu cam/vàng, vài icon có má hồng cho dễ thương.
   - Tự đổi màu theo chữ xung quanh (currentColor) và theo sáng/tối.
   - Viết emoji như bình thường trong HTML/JS: khi trang tải xong,
     emoji có trong bảng EMOJI sẽ tự đổi thành icon tương ứng.
   - Dùng trực tiếp trong JS: XSTK.icon("dice")  → chuỗi <svg …>
     hoặc trong HTML: <i class="ic-slot" data-ic="dice"></i>
   ========================================================= */
(function () {
  "use strict";
  var XSTK = (window.XSTK = window.XSTK || {});

  /* f = nền tô nhạt · s = tô đặc · a = nét màu nhấn · af = tô màu nhấn
     bg = tô màu nền trang (che nét phía sau) · ck = má hồng */
  var I = {
    /* ---------- khung hộp & chung ---------- */
    bolt: '<path class="f" d="M13.5 2.5 5 13.5h6.5L10.5 21.5 19 10.5h-6.5z"/><path d="M13.5 2.5 5 13.5h6.5L10.5 21.5 19 10.5h-6.5z"/>',
    pin: '<path class="f" d="M8.5 3h7l-1.2 5.5 3.2 3.5h-11l3.2-3.5z"/><path d="M8.5 3h7l-1.2 5.5 3.2 3.5h-11l3.2-3.5z"/><path d="M12 12v8.5"/><circle class="af" cx="12" cy="6" r="1"/>',
    home: '<path class="f" d="M5 10.5 12 4.5l7 6V20H5z"/><path d="M3.5 11.5 12 4.5l8.5 7"/><path d="M5.5 10v10h13V10"/><path d="M10 20v-4.5a2 2 0 0 1 4 0V20"/><circle class="af" cx="12" cy="10.5" r="1.2"/>',
    stetho: '<path d="M6 3.5v4.5a4.5 4.5 0 0 0 9 0V3.5"/><path d="M4.5 3.5H7.5M13.5 3.5h3"/><path d="M10.5 12.5v2.5a4.5 4.5 0 0 0 9 0v-1.5"/><circle class="f" cx="19.5" cy="11.5" r="2.3"/><circle cx="19.5" cy="11.5" r="2.3"/><circle class="af" cx="19.5" cy="11.5" r=".9"/>',
    bulb: '<path class="f" d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2h5c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2h5c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/><path d="M9.8 19h4.4M10.8 21.5h2.4"/><path class="a" d="M9.6 8.6a2.8 2.8 0 0 1 2.2-2.1"/>',
    warn: '<path class="f" d="M10.3 4.2a2 2 0 0 1 3.4 0l7.6 13.3a2 2 0 0 1-1.7 3H4.4a2 2 0 0 1-1.7-3z"/><path d="M10.3 4.2a2 2 0 0 1 3.4 0l7.6 13.3a2 2 0 0 1-1.7 3H4.4a2 2 0 0 1-1.7-3z"/><path d="M12 9.5v4.3"/><circle class="s" cx="12" cy="16.9" r="1.15"/>',
    memo: '<rect class="f" x="4" y="3" width="12.5" height="18" rx="2.5"/><rect x="4" y="3" width="12.5" height="18" rx="2.5"/><path d="M7.5 8h5.5M7.5 11.5h5.5M7.5 15h3"/><path class="a" d="m20.6 9.6-6.2 6.2-.9 2.8 2.8-.9 6.2-6.2a1.3 1.3 0 0 0-1.9-1.9z"/>',
    plus: '<circle class="f" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
    target: '<circle class="f" cx="11" cy="13" r="8.5"/><circle cx="11" cy="13" r="8.5"/><circle cx="11" cy="13" r="4.6"/><circle class="s" cx="11" cy="13" r="1.4"/><path class="a" d="m11 13 8.5-8.5M16.5 4.5h3v3"/>',
    flask: '<path class="f" d="M7.3 14h9.4l2.6 4.6a1.7 1.7 0 0 1-1.5 2.4H6.2a1.7 1.7 0 0 1-1.5-2.4z"/><path d="M9.5 3v5.6L4.7 18.1a2 2 0 0 0 1.8 2.9h11a2 2 0 0 0 1.8-2.9L14.5 8.6V3"/><path d="M8 3h8"/><circle class="af" cx="10.5" cy="17" r="1"/><circle class="af" cx="14" cy="18.3" r=".8"/>',
    sparkle: '<path class="f" d="M10 3.5 11.8 8.2l4.7 1.8-4.7 1.8L10 16.5 8.2 11.8 3.5 10l4.7-1.8z"/><path d="M10 3.5 11.8 8.2l4.7 1.8-4.7 1.8L10 16.5 8.2 11.8 3.5 10l4.7-1.8z"/><path class="a" d="M18 14v6M15 17h6"/>',
    star: '<path class="f" d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/><path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/>',
    fire: '<path class="f" d="M12 21.5c-4 0-7-2.7-7-6.6 0-3.3 2.3-5.4 3.6-7.6.4 1.6 1.4 2.7 2.4 3.1C11 7 12.5 4.5 14.5 2.5c.3 3 2.5 4.6 3.8 7 .8 1.4 1.2 2.9 1.2 4.6 0 4.6-3.5 7.4-7.5 7.4z"/><path d="M12 21.5c-4 0-7-2.7-7-6.6 0-3.3 2.3-5.4 3.6-7.6.4 1.6 1.4 2.7 2.4 3.1C11 7 12.5 4.5 14.5 2.5c.3 3 2.5 4.6 3.8 7 .8 1.4 1.2 2.9 1.2 4.6 0 4.6-3.5 7.4-7.5 7.4z"/><path class="a" d="M12 21.5c-1.9 0-3.2-1.3-3.2-3.1 0-1.9 1.6-3.1 2.4-4.6.7 1.1 1.4 1.3 2 1.2.9 1 2 2.1 2 3.5 0 1.8-1.3 3-3.2 3z"/>',
    party: '<path class="f" d="m3.5 20.5 4.2-11.2 7 7z"/><path d="m3.5 20.5 4.2-11.2 7 7z"/><path d="M10.5 13.5c.8-2.8 3-4.3 6-4.3"/><path class="a" d="M14.5 3.5v2.2M20.5 9.5h-2.2M18.2 5.8l1.6-1.6"/><circle class="af" cx="11" cy="5" r="1.1"/><circle class="af" cx="20" cy="15" r="1.1"/><circle class="s" cx="16.5" cy="12.8" r=".9"/>',
    thumb: '<rect class="f" x="3.5" y="10.5" width="4" height="10" rx="1"/><rect x="3.5" y="10.5" width="4" height="10" rx="1"/><path d="M7.5 11 11 3.8c1.4 0 2.5 1.1 2.3 2.6l-.5 3.3h5.3a2 2 0 0 1 2 2.4l-1.3 6.4a2.3 2.3 0 0 1-2.2 1.9H7.5"/>',
    muscle: '<rect class="f" x="3" y="8.5" width="4" height="7" rx="1.2"/><rect class="f" x="17" y="8.5" width="4" height="7" rx="1.2"/><rect x="3" y="8.5" width="4" height="7" rx="1.2"/><rect x="17" y="8.5" width="4" height="7" rx="1.2"/><path d="M7 12h10M1.5 12h1.5M21 12h1.5"/>',
    eye: '<path class="f" d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle class="bg" cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="3.2"/><circle class="s" cx="12" cy="12" r="1.3"/>',
    clipboard: '<rect class="f" x="5" y="4.5" width="14" height="17" rx="2.5"/><rect x="5" y="4.5" width="14" height="17" rx="2.5"/><rect class="bg" x="9" y="2.5" width="6" height="4" rx="1.3"/><rect x="9" y="2.5" width="6" height="4" rx="1.3"/><path d="M8.5 11h7M8.5 14.5h7M8.5 18h4"/>',
    list: '<rect class="f" x="4" y="3.5" width="16" height="17" rx="3"/><rect x="4" y="3.5" width="16" height="17" rx="3"/><path d="M10.5 8.5H16M10.5 12H16M10.5 15.5H16"/><circle class="af" cx="7.6" cy="8.5" r="1"/><circle class="af" cx="7.6" cy="12" r="1"/><circle class="af" cx="7.6" cy="15.5" r="1"/>',
    printer: '<path d="M7 8V3.5h10V8"/><rect class="f" x="3" y="8" width="18" height="9" rx="2.5"/><rect x="3" y="8" width="18" height="9" rx="2.5"/><rect class="bg" x="7" y="13.5" width="10" height="7" rx="1"/><rect x="7" y="13.5" width="10" height="7" rx="1"/><circle class="af" cx="17.5" cy="11" r="1"/>',
    file: '<path class="f" d="M6 4a1.5 1.5 0 0 1 1.5-1.5H14l5 5V20a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 20z"/><path d="M14 2.5H7.5A1.5 1.5 0 0 0 6 4v16a1.5 1.5 0 0 0 1.5 1.5h10A1.5 1.5 0 0 0 19 20V7.5z"/><path d="M14 2.5v5h5"/><path d="M9 13h6M9 16.5h4"/>',
    timer: '<circle class="f" cx="12" cy="13.5" r="7.5"/><circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V9.8M10 2.5h4M12 2.5V6M18.3 6.6l1.3-1.3"/><circle class="af" cx="12" cy="13.5" r="1.1"/>',
    hourglass: '<path d="M6.5 3h11M6.5 21h11"/><path d="M7.8 3v2.6c0 2.6 4.2 4.3 4.2 6.4s-4.2 3.8-4.2 6.4V21M16.2 3v2.6c0 2.6-4.2 4.3-4.2 6.4s4.2 3.8 4.2 6.4V21"/><path class="f" d="M8.8 20.5c0-2 3.2-3.4 3.2-3.4s3.2 1.4 3.2 3.4z"/><path class="af" d="M9.6 6.5h4.8c-.6 1-1.6 1.8-2.4 2.4-.8-.6-1.8-1.4-2.4-2.4z"/>',
    book: '<path class="f" d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z"/><path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z"/><path d="M12 6.5v13"/><path class="a" d="M6 8.5c1.5-.2 2.8 0 4 .5M6 11.5c1.5-.2 2.8 0 4 .5"/>',
    books: '<rect class="f" x="3.5" y="4" width="4.5" height="16.5" rx="1"/><rect x="3.5" y="4" width="4.5" height="16.5" rx="1"/><rect x="9" y="6.5" width="4.5" height="14" rx="1"/><path class="a" d="m14.8 7.6 4.2-1.1 3.2 13.2-4.2 1.1z"/><path d="M3.5 8h4.5M9 10h4.5"/>',
    brain: '<path class="f" d="M9.5 4.5A3 3 0 0 0 6.6 7 3 3 0 0 0 4.5 12a3 3 0 0 0 2 5 3 3 0 0 0 5.5 1.5V6a2 2 0 0 0-2.5-1.5zM14.5 4.5A3 3 0 0 1 17.4 7a3 3 0 0 1 2.1 5 3 3 0 0 1-2 5 3 3 0 0 1-5.5 1.5V6a2 2 0 0 1 2.5-1.5z"/><path d="M9.5 4.5A3 3 0 0 0 6.6 7 3 3 0 0 0 4.5 12a3 3 0 0 0 2 5 3 3 0 0 0 5.5 1.5V6a2 2 0 0 0-2.5-1.5zM14.5 4.5A3 3 0 0 1 17.4 7a3 3 0 0 1 2.1 5 3 3 0 0 1-2 5 3 3 0 0 1-5.5 1.5V6a2 2 0 0 1 2.5-1.5z"/><path class="a" d="M8 10.5c1 0 2 .6 2 1.8M16 10.5c-1 0-2 .6-2 1.8"/>',
    image: '<rect class="f" x="3" y="4.5" width="18" height="15" rx="3"/><rect x="3" y="4.5" width="18" height="15" rx="3"/><circle class="af" cx="8.5" cy="9.5" r="1.8"/><path d="m3.5 17.5 5-5 4 4 2.5-2.5 5.5 5"/>',
    gamepad: '<path class="f" d="M7 7.5h10a4.5 4.5 0 0 1 4.4 5.4l-.9 4.1a2.6 2.6 0 0 1-4.5 1.2l-1.7-1.9H9.7L8 18.2a2.6 2.6 0 0 1-4.5-1.2l-.9-4.1A4.5 4.5 0 0 1 7 7.5z"/><path d="M7 7.5h10a4.5 4.5 0 0 1 4.4 5.4l-.9 4.1a2.6 2.6 0 0 1-4.5 1.2l-1.7-1.9H9.7L8 18.2a2.6 2.6 0 0 1-4.5-1.2l-.9-4.1A4.5 4.5 0 0 1 7 7.5z"/><path d="M8 10.5v3.5M6.25 12.25h3.5"/><circle class="af" cx="15.5" cy="11" r="1.15"/><circle class="af" cx="17.6" cy="13.3" r="1.15"/>',
    phone: '<rect class="f" x="6.5" y="2.5" width="11" height="19" rx="2.8"/><rect x="6.5" y="2.5" width="11" height="19" rx="2.8"/><path d="M10.5 18.5h3"/><path class="a" d="M10.5 5.5h3"/>',
    rocket: '<path class="f" d="M12 2.5c3.5 2.5 5 6 4.5 10.5l-2 3h-5l-2-3C7 8.5 8.5 5 12 2.5z"/><path d="M12 2.5c3.5 2.5 5 6 4.5 10.5l-2 3h-5l-2-3C7 8.5 8.5 5 12 2.5z"/><circle class="bg" cx="12" cy="9" r="1.9"/><circle cx="12" cy="9" r="1.9"/><path d="M7.6 13 5 15.6V19l3.2-2M16.4 13l2.6 2.6V19l-3.2-2"/><path class="a" d="M10.5 19v2.5M13.5 19v2.5"/>',
    play: '<circle class="f" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path class="s" d="M10 8.3v7.4l5.8-3.7z"/><path d="M10 8.3v7.4l5.8-3.7z"/>',
    check: '<rect class="f" x="3" y="3" width="18" height="18" rx="5.5"/><rect x="3" y="3" width="18" height="18" rx="5.5"/><path d="m7.6 12.4 3 3 5.8-6.6"/>',
    checkmark: '<path d="m4.5 12.5 4.5 4.5 10.5-11"/>',
    box: '<rect class="f" x="3.5" y="3.5" width="17" height="17" rx="5"/><rect x="3.5" y="3.5" width="17" height="17" rx="5"/>',
    cross: '<rect class="f" x="3" y="3" width="18" height="18" rx="5.5"/><rect x="3" y="3" width="18" height="18" rx="5.5"/><path d="m8.5 8.5 7 7M15.5 8.5l-7 7"/>',
    noentry: '<circle class="f" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path d="m5.7 5.7 12.6 12.6"/>',
    question: '<circle class="f" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path d="M9.6 9.6a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1.1.9-1.1 1.6v.5"/><circle class="s" cx="12" cy="16.9" r="1.1"/>',
    info: '<circle class="f" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle class="s" cx="12" cy="7.8" r="1.15"/>',
    flag: '<path d="M5.5 21.5v-18"/><path class="f" d="M5.5 4h12l-2.6 4 2.6 4h-12z"/><path d="M5.5 4h12l-2.6 4 2.6 4h-12"/><path class="a" d="M9 4v8M12.5 4v8" stroke-dasharray="2 2"/>',
    refresh: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4v4h-4"/>',
    repeat: '<path d="M16.5 3.5 19.5 6.5l-3 3"/><path d="M4.5 11.5V10a3.5 3.5 0 0 1 3.5-3.5h11.5"/><path d="M7.5 20.5 4.5 17.5l3-3"/><path d="M19.5 12.5V14a3.5 3.5 0 0 1-3.5 3.5H4.5"/>',
    swap: '<path d="M3.5 12h17M7 8.5 3.5 12 7 15.5M17 8.5l3.5 3.5-3.5 3.5"/>',
    shuffle: '<path d="M3.5 7h3.2c3.6 0 5 10 8.6 10h5.2M3.5 17h3.2c1.4 0 2.4-1.5 3.3-3.4M14 10.4c.4-1.9 1.4-3.4 1.3-3.4h5.2"/><path d="m17.5 4 3 3-3 3M17.5 14l3 3-3 3"/>',
    arrowright: '<circle class="f" cx="12" cy="12" r="9"/><path d="M7 12h10M13 8l4 4-4 4"/>',
    point: '<path d="M4 12h12.5"/><path d="m12.5 7 5 5-5 5"/><circle class="af" cx="4" cy="12" r="1.5"/>',
    basket: '<path class="f" d="M3 10h18l-2 9.3a2 2 0 0 1-2 1.7H7a2 2 0 0 1-2-1.7z"/><path d="M3 10h18l-2 9.3a2 2 0 0 1-2 1.7H7a2 2 0 0 1-2-1.7z"/><path d="M7.5 10 10 4M16.5 10 14 4M9 13.5v4M12 13.5v4M15 13.5v4"/>',
    scissors: '<circle class="f" cx="6" cy="6.5" r="2.8"/><circle class="f" cx="6" cy="17.5" r="2.8"/><circle cx="6" cy="6.5" r="2.8"/><circle cx="6" cy="17.5" r="2.8"/><path d="M8.3 8.2 20 18M8.3 15.8 20 6"/>',
    tag: '<path class="f" d="M3 11.6V4.5A1.5 1.5 0 0 1 4.5 3h7.1l9 9-8.6 8.6z"/><path d="M3 11.6V4.5A1.5 1.5 0 0 1 4.5 3h7.1l9 9-8.6 8.6z"/><circle class="af" cx="7.6" cy="7.6" r="1.6"/>',
    ladder: '<path d="M7 3v18M17 3v18"/><path class="a" d="M7 7.5h10M7 12h10M7 16.5h10"/>',
    stairs: '<path class="f" d="M3.5 20.5v-4h5v-4.5h5V7.5h5V3.5h2v17z"/><path d="M3.5 20.5v-4h5v-4.5h5V7.5h5V3.5h2"/><path d="M3.5 20.5h17"/>',
    ruler: '<rect class="f" x="2.5" y="8" width="19" height="8" rx="1.8"/><rect x="2.5" y="8" width="19" height="8" rx="1.8"/><path d="M6.5 8v3.5M10 8v2.5M13.5 8v3.5M17 8v2.5"/>',
    calc: '<rect class="f" x="4.5" y="2.5" width="15" height="19" rx="3"/><rect x="4.5" y="2.5" width="15" height="19" rx="3"/><rect class="bg" x="7.5" y="5.5" width="9" height="4" rx="1"/><rect x="7.5" y="5.5" width="9" height="4" rx="1"/><circle class="s" cx="8.6" cy="13.2" r="1"/><circle class="s" cx="12" cy="13.2" r="1"/><circle class="af" cx="15.4" cy="13.2" r="1"/><circle class="s" cx="8.6" cy="17" r="1"/><circle class="s" cx="12" cy="17" r="1"/><circle class="af" cx="15.4" cy="17" r="1"/>',
    abacus: '<rect class="f" x="3" y="3.5" width="18" height="17" rx="3"/><rect x="3" y="3.5" width="18" height="17" rx="3"/><path d="M3 9h18M3 15h18"/><circle class="s" cx="7.5" cy="9" r="1.7"/><circle class="s" cx="11" cy="9" r="1.7"/><circle class="af" cx="16.5" cy="9" r="1.7"/><circle class="af" cx="9" cy="15" r="1.7"/><circle class="s" cx="15.5" cy="15" r="1.7"/>',
    numbers: '<rect class="f" x="3" y="3" width="18" height="18" rx="4"/><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M7 9.5 8.5 8v8M11.5 10a1.7 1.7 0 0 1 3.3.4c0 1.6-3.3 3.3-3.3 5.6h3.4"/><path class="a" d="M17 8.5v7.5"/>',
    dice: '<rect class="f" x="3.5" y="3.5" width="17" height="17" rx="4.5"/><rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><circle class="s" cx="8.5" cy="8.5" r="1.45"/><circle class="af" cx="12" cy="12" r="1.45"/><circle class="s" cx="15.5" cy="15.5" r="1.45"/>',
    coin: '<circle class="f" cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5.5"/><path class="a" d="M12 9.3v5.4"/>',
    card: '<rect class="f" x="5" y="2.5" width="14" height="19" rx="2.5"/><rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path class="af" d="M12 16s-3.2-2-3.2-4.2A1.8 1.8 0 0 1 12 10.6a1.8 1.8 0 0 1 3.2 1.2C15.2 14 12 16 12 16z"/><path d="M8 6h.01M16 18h.01"/>',
    chart: '<path d="M3.5 20.5h17"/><rect class="f" x="5" y="11" width="3.5" height="9.5" rx="1"/><rect x="5" y="11" width="3.5" height="9.5" rx="1"/><rect class="f" x="10.25" y="5" width="3.5" height="15.5" rx="1"/><rect x="10.25" y="5" width="3.5" height="15.5" rx="1"/><rect class="a" x="15.5" y="8.5" width="3.5" height="12" rx="1"/>',
    chartup: '<path d="M3.5 3.5v17h17"/><path class="f" d="M6.5 17 10 12l3 2.5 6-7.5V17z"/><path d="M6.5 16 10 11.5l3 2.5 6-7.5"/><path class="a" d="M15.5 6.5H19V10"/>',
    chartdown: '<path d="M3.5 3.5v17h17"/><path d="M6.5 7.5 10 12l3-2.5 6 7.5"/><path class="a" d="M15.5 17H19v-3.5"/>',
    scatter: '<path d="M3.5 3.5v17h17"/><circle class="s" cx="7.5" cy="16" r="1.2"/><circle class="s" cx="10" cy="13.5" r="1.2"/><circle class="af" cx="12.5" cy="12" r="1.2"/><circle class="s" cx="15" cy="9" r="1.2"/><circle class="af" cx="18" cy="6.5" r="1.2"/><circle class="s" cx="11" cy="16.5" r="1.2"/>',
    bell: '<path class="f" d="M6 10a6 6 0 0 1 12 0c0 4.5 2 6.5 2 6.5H4s2-2 2-6.5z"/><path d="M6 10a6 6 0 0 1 12 0c0 4.5 2 6.5 2 6.5H4s2-2 2-6.5z"/><path d="M10 19.5a2 2 0 0 0 4 0"/>',
    search: '<circle class="f" cx="10.5" cy="10.5" r="6.5"/><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/><path class="a" d="M7.8 9a3 3 0 0 1 2.4-2.2"/>',
    microscope: '<path d="M6 20.5h12M9 20.5c-2.8-1.4-3.6-4.8-2-7.5"/><path class="f" d="m9.5 3.5 3.5 2-4 7-3.5-2z"/><path d="m9.5 3.5 3.5 2-4 7-3.5-2z"/><path d="M12 16.5a4.5 4.5 0 0 0 1.4-8.6"/><circle class="af" cx="13" cy="16.5" r="1.4"/>',
    key: '<circle class="f" cx="8" cy="15" r="4.5"/><circle cx="8" cy="15" r="4.5"/><path d="m11.2 11.8 9-9M17 6l2.5 2.5M14.5 8.5l2 2"/><circle class="af" cx="8" cy="15" r="1.3"/>',
    lock: '<rect class="f" x="4.5" y="10.5" width="15" height="10.5" rx="2.5"/><rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/><circle class="af" cx="12" cy="15.5" r="1.5"/>',
    pencil: '<path class="f" d="m15 4.5 4.5 4.5L8.5 20H4v-4.5z"/><path d="m15 4.5 4.5 4.5L8.5 20H4v-4.5z"/><path d="m12.8 6.7 4.5 4.5"/><path class="a" d="M4 15.5 8.5 20"/>',
    gift: '<rect class="f" x="3.5" y="9" width="17" height="11.5" rx="2"/><rect x="3.5" y="9" width="17" height="11.5" rx="2"/><path d="M2.5 9h19M12 9v11.5"/><path class="a" d="M12 9C10 9 7.5 8 7.5 6.2S10.5 4 12 9zm0 0c2 0 4.5-1 4.5-2.8S13.5 4 12 9z"/>',
    calendar: '<rect class="f" x="3.5" y="5" width="17" height="15.5" rx="3"/><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/><circle class="af" cx="12" cy="15" r="1.4"/>',
    megaphone: '<path class="f" d="M4 10v4h3l9 5V5L7 10z"/><path d="M4 10v4h3l9 5V5L7 10H4z"/><path d="M7 14v4.5"/><path class="a" d="M19 9.5a3.5 3.5 0 0 1 0 5"/>',
    puzzle: '<path class="f" d="M5 7.5h3.5a2 2 0 1 1 4 0H16v3.5a2 2 0 1 1 0 4V19H5z"/><path d="M5 7.5h3.5a2 2 0 1 1 4 0H16v3.5a2 2 0 1 1 0 4V19H5z"/>',
    map: '<path class="f" d="m3.5 6 5.5-2.5 6 2.5 5.5-2.5v14.5L15 20.5 9 18l-5.5 2.5z"/><path d="m3.5 6 5.5-2.5 6 2.5 5.5-2.5v14.5L15 20.5 9 18l-5.5 2.5zM9 3.5V18M15 6v14.5"/>',
    globe: '<circle class="f" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',
    balance: '<path d="M12 3.5v16M7 20.5h10M4.5 7.5h15"/><circle class="af" cx="12" cy="4" r="1.3"/><path class="f" d="M2.5 14a3 3 0 0 0 6 0z"/><path d="M2.5 14a3 3 0 0 0 6 0zM5.5 7.5 2.5 14M5.5 7.5l3 6.5"/><path class="f" d="M15.5 14a3 3 0 0 0 6 0z"/><path d="M15.5 14a3 3 0 0 0 6 0zM18.5 7.5l-3 6.5M18.5 7.5l3 6.5"/>',
    seesaw: '<path class="f" d="m12 14 3.5 6.5h-7z"/><path d="m12 14 3.5 6.5h-7z"/><path d="M2.5 15.5 21.5 10"/><circle class="af" cx="5.5" cy="12.3" r="2"/><circle class="s" cx="18.5" cy="8.3" r="2"/>',
    sun: '<circle class="f" cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
    moon: '<path class="f" d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/><path class="a" d="M16.5 3.5v3M15 5h3"/>',
    menu: '<path d="M4.5 7h15M4.5 12h15M4.5 17h15"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    download: '<path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5"/><path class="f" d="M4 15.5v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3z"/><path d="M4 15.5v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.3 1.3"/><path class="a" d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.3-1.3"/>',
    dot: '<circle class="s" cx="12" cy="12" r="7"/><circle class="ck" cx="9.5" cy="9.5" r="2"/>',

    swords: '<path d="M4 4l9 9M4 4h4M4 4v4"/><path class="a" d="M20 4l-9 9M20 4h-4M20 4v4"/><path d="m10.5 15.5-3 3M7.5 15.5l3 3M6 20l-1.5 1.5"/><path class="a" d="m13.5 15.5 3 3M16.5 15.5l-3 3M18 20l1.5 1.5"/>',
    yinyang: '<circle class="f" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path class="s" d="M12 3a4.5 4.5 0 0 1 0 9 4.5 4.5 0 0 0 0 9 9 9 0 0 1 0-18z"/><circle class="bg" cx="12" cy="7.5" r="1.3"/><circle class="s" cx="12" cy="16.5" r="1.3"/>',
    handshake: '<path class="f" d="M3 12.5 7 8.5h4l2 1.5 2-1.5h4l2 4-6.5 6a1.6 1.6 0 0 1-2.2 0z"/><path d="M2.5 12 7 7.5h3.5M21.5 12 17 7.5h-3.8L9.5 11a1.4 1.4 0 0 0 2 2l2-1.5 4 4"/><path d="m4.5 14 6 5.5a1.6 1.6 0 0 0 2.2 0l.8-.7M13.5 17l1.5 1.3M15.5 15l1.5 1.3"/>',
    letters: '<rect class="f" x="3" y="5" width="18" height="14" rx="3"/><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m6.5 15.5 2.2-7 2.2 7M7.2 13.3h3"/><path class="a" d="M13.5 9.5h2.3a1.5 1.5 0 0 1 0 3h-2.3zm0 3h2.6a1.5 1.5 0 0 1 0 3h-2.6z"/>',

    pie: '<path class="f" d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5H12z"/><path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5H12z"/><path class="a" d="M14.5 2.5a7.5 7.5 0 0 1 7 7h-7z"/>',
    crystal: '<circle class="f" cx="12" cy="10.5" r="7"/><circle cx="12" cy="10.5" r="7"/><path d="M6.5 21.5h11l-1.5-3.5H8z"/><path class="a" d="M9 8.5a3.5 3.5 0 0 1 3-2.5"/><circle class="af" cx="14.5" cy="12" r="1"/>',
    next: '<circle class="f" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path class="s" d="M8 8.5v7l5-3.5z"/><path d="M8 8.5v7l5-3.5zM16 8.5v7"/>',
    pointdown: '<path d="M12 4v12.5"/><path d="m7 11.5 5 5 5-5"/><circle class="af" cx="12" cy="4" r="1.5"/>',
    divide: '<circle class="f" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path d="M7.5 12h9"/><circle class="s" cx="12" cy="8" r="1.2"/><circle class="s" cx="12" cy="16" r="1.2"/>',
    upright: '<circle class="f" cx="12" cy="12" r="9"/><path d="M8 16 16 8M10 8h6v6"/>',

    /* ---------- y khoa & YHCT ---------- */
    pill: '<g transform="rotate(-45 12 12)"><rect class="f" x="3.5" y="8.3" width="17" height="7.4" rx="3.7"/><path class="af" d="M12 8.3h4.8a3.7 3.7 0 0 1 0 7.4H12z"/><rect x="3.5" y="8.3" width="17" height="7.4" rx="3.7"/><path d="M12 8.3v7.4"/></g>',
    syringe: '<path class="f" d="m14.5 5.5 4 4-8 8-4 0 0-4z"/><path d="m14.5 5.5 4 4-8 8H6.5v-4z"/><path d="m17 3 4 4M19 5l-2.5 2.5M6.5 17.5 3 21M10.5 9.5l2 2M8.5 11.5l2 2"/>',
    hospital: '<rect class="f" x="4" y="6" width="16" height="15" rx="2"/><rect x="4" y="6" width="16" height="15" rx="2"/><path d="M8.5 6V3.5h7V6"/><path class="a" d="M12 9.3v5M9.5 11.8h5"/><path d="M10 21v-3.5h4V21"/>',
    heart: '<path class="f" d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/><path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/><path class="a" d="M7.6 10.2a2 2 0 0 1 1.6-1.7"/>',
    drop: '<path class="f" d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11z"/><path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11z"/><path class="a" d="M9.2 14.5a2.8 2.8 0 0 0 2.3 2.7"/>',
    thermo: '<path class="f" d="M10 13.5V5a2 2 0 0 1 4 0v8.5a4 4 0 1 1-4 0z"/><path d="M10 13.5V5a2 2 0 0 1 4 0v8.5a4 4 0 1 1-4 0z"/><circle class="af" cx="12" cy="17" r="1.8"/><path class="a" d="M12 15.2V9"/>',
    leaf: '<path class="f" d="M5 19C5 10 10.5 4.5 20 4c-.5 9.5-6 15-15 15z"/><path d="M5 19C5 10 10.5 4.5 20 4c-.5 9.5-6 15-15 15z"/><path class="a" d="M5 19c3-4.2 6.2-7.4 10.5-10.5"/>',
    herb: '<path d="M12 21V9"/><path class="f" d="M12 13C8 13 5.5 10.5 5.5 6.5 9.5 6.5 12 9 12 13zM12 11c0-4 2.5-6.5 6.5-6.5 0 4-2.5 6.5-6.5 6.5z"/><path d="M12 13C8 13 5.5 10.5 5.5 6.5 9.5 6.5 12 9 12 13zM12 11c0-4 2.5-6.5 6.5-6.5 0 4-2.5 6.5-6.5 6.5z"/><path class="a" d="M8.5 21h7"/>',
    tea: '<path class="f" d="M4 10h13v4.5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M4 10h13v4.5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 11.5h1.3a2.5 2.5 0 0 1 0 5H17"/><path class="a" d="M8.5 3.5c-1 1 1 2 0 3.5M12.5 3.5c-1 1 1 2 0 3.5"/>',
    bowl: '<path class="f" d="M3 11.5h18a9 9 0 0 1-18 0z"/><path d="M3 11.5h18a9 9 0 0 1-18 0z"/><path d="M14.5 11.5 20 3.5"/><path class="a" d="M7 3.5c-1 1 1 2 0 3.5M10.5 3.5c-1 1 1 2 0 3.5"/>',
    doctor: '<circle class="f" cx="12" cy="7.5" r="4"/><circle cx="12" cy="7.5" r="4"/><path class="f" d="M4.5 21a7.5 7.5 0 0 1 15 0z"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0z"/><path class="a" d="M12 15v4M10 17h4"/>',
    person: '<circle class="f" cx="12" cy="7.5" r="4"/><circle cx="12" cy="7.5" r="4"/><path class="f" d="M4.5 21a7.5 7.5 0 0 1 15 0z"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0z"/>',
    people: '<circle class="f" cx="9" cy="8" r="3.5"/><circle cx="9" cy="8" r="3.5"/><path class="f" d="M2.5 20a6.5 6.5 0 0 1 13 0z"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0z"/><circle class="a" cx="16.5" cy="8.5" r="2.8"/><path class="a" d="M16.3 13.6a5.5 5.5 0 0 1 5.2 6.4H18"/>',
    woman: '<path class="f" d="M7.5 12c-.5-1.5-.5-3-.5-4.5a5 5 0 0 1 10 0c0 1.5 0 3-.5 4.5z"/><path d="M7.5 12c-.5-1.5-.5-3-.5-4.5a5 5 0 0 1 10 0c0 1.5 0 3-.5 4.5"/><circle class="bg" cx="12" cy="8" r="3.2"/><circle cx="12" cy="8" r="3.2"/><path class="f" d="M5 21a7 7 0 0 1 14 0z"/><path d="M5 21a7 7 0 0 1 14 0z"/>',
    baby: '<circle class="f" cx="12" cy="11" r="7.5"/><circle cx="12" cy="11" r="7.5"/><path d="M12 3.5c-1.5 0-1.5 2 0 2"/><circle class="s" cx="9.4" cy="10.5" r=".9"/><circle class="s" cx="14.6" cy="10.5" r=".9"/><path d="M10.5 14a2 2 0 0 0 3 0"/><circle class="ck" cx="7.8" cy="13" r="1.2"/><circle class="ck" cx="16.2" cy="13" r="1.2"/><path d="M9 21h6"/>',
    student: '<path class="f" d="M12 4 2.5 9 12 14l9.5-5z"/><path d="M12 4 2.5 9 12 14l9.5-5z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/><path class="a" d="M21.5 9v6"/>',
    school: '<path class="f" d="M3 21V10l9-6 9 6v11z"/><path d="M3 21V10l9-6 9 6v11"/><path d="M2 21h20M10 21v-5h4v5"/><circle class="af" cx="12" cy="10.5" r="1.8"/>',
    family: '<circle cx="7" cy="6.5" r="2.5"/><circle cx="17" cy="6.5" r="2.5"/><circle class="af" cx="12" cy="12" r="2"/><path class="f" d="M3 19a4 4 0 0 1 8 0zM13 19a4 4 0 0 1 8 0z"/><path d="M3 19v-3a4 4 0 0 1 8 0v3M13 19v-3a4 4 0 0 1 8 0v3"/><path class="a" d="M9.5 21a2.5 2.5 0 0 1 5 0"/>',
    chair: '<path d="M7 3.5v9.5h10V3.5"/><path class="f" d="M5.5 13h13v2.5h-13z"/><path d="M5.5 13h13v2.5h-13zM7 15.5v5M17 15.5v5"/>',
    vote: '<rect class="f" x="3.5" y="12" width="17" height="8.5" rx="2"/><rect x="3.5" y="12" width="17" height="8.5" rx="2"/><path d="M8 15.5h8"/><path class="a" d="M8.5 3.5h7v9h-7z"/><path class="a" d="m10.3 7.8 1.4 1.4 2.5-2.7"/>',
    factory: '<path class="f" d="M3 21V11l5 3V11l5 3V5h4l1 16z"/><path d="M3 21V11l5 3V11l5 3V5h4l1 3v13H3z"/><path class="a" d="M7 17.5h2M11 17.5h2"/>',
    package: '<path class="f" d="M12 3 4 7v10l8 4 8-4V7z"/><path d="M12 3 4 7v10l8 4 8-4V7z"/><path d="m4 7 8 4 8-4M12 11v10"/><path class="a" d="m8 5 8 4"/>',
    car: '<path class="f" d="M3.5 16v-3.5l2-4.6a2 2 0 0 1 1.8-1.2h9.4a2 2 0 0 1 1.8 1.2l2 4.6V16z"/><path d="M3.5 16v-3.5l2-4.6a2 2 0 0 1 1.8-1.2h9.4a2 2 0 0 1 1.8 1.2l2 4.6V16z"/><path d="M3.5 12.5h17"/><circle class="bg" cx="7.5" cy="16.5" r="2.1"/><circle cx="7.5" cy="16.5" r="2.1"/><circle class="bg" cx="16.5" cy="16.5" r="2.1"/><circle cx="16.5" cy="16.5" r="2.1"/>',
    bus: '<rect class="f" x="4" y="3.5" width="16" height="15" rx="3"/><rect x="4" y="3.5" width="16" height="15" rx="3"/><path d="M4 11.5h16M4 7.5h16"/><path class="a" d="M7.5 15h.01M16.5 15h.01"/><path d="M7 18.5v2M17 18.5v2"/>',
    truck: '<path class="f" d="M2.5 5.5h11v10h-11z"/><path d="M2.5 5.5h11v10h-11zM13.5 9h4l3 3.5v3h-7"/><circle class="bg" cx="6.5" cy="16.5" r="2"/><circle cx="6.5" cy="16.5" r="2"/><circle class="bg" cx="17" cy="16.5" r="2"/><circle cx="17" cy="16.5" r="2"/>',
    money: '<rect class="f" x="2.5" y="6" width="19" height="12" rx="2.2"/><rect x="2.5" y="6" width="19" height="12" rx="2.2"/><circle cx="12" cy="12" r="2.8"/><path class="a" d="M6 9.5v5M18 9.5v5"/>',
    house: '<path class="f" d="M5 10.5 12 4.5l7 6V20H5z"/><path d="M3.5 11.5 12 4.5l8.5 7M5.5 10v10h13V10"/><rect class="a" x="10" y="13" width="4" height="4" rx=".6"/>',

    /* ---------- mặt cười dễ thương ---------- */
    smile: '<circle class="f" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><circle class="s" cx="9" cy="10.3" r="1.1"/><circle class="s" cx="15" cy="10.3" r="1.1"/><path d="M8.8 14.2a3.8 3.8 0 0 0 6.4 0"/><circle class="ck" cx="6.9" cy="13.4" r="1.3"/><circle class="ck" cx="17.1" cy="13.4" r="1.3"/>',
    oops: '<circle class="f" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path d="M7.8 10.5 9.3 9l1.5 1.5M13.2 10.5 14.7 9l1.5 1.5"/><path d="M9 15.2c1-.8 2-.8 3 0s2 .8 3 0"/><path class="a" d="M18.6 4.8s1.4 1.6 1.4 2.6a1.4 1.4 0 0 1-2.8 0c0-1 1.4-2.6 1.4-2.6z"/><circle class="ck" cx="6.9" cy="13.4" r="1.2"/><circle class="ck" cx="17.1" cy="13.4" r="1.2"/>',
    think: '<circle class="f" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><circle class="s" cx="9" cy="10" r="1.1"/><circle class="s" cx="15" cy="10" r="1.1"/><path d="M10 15.5h4"/><path class="a" d="M15 15.5c2 0 3 1 3 2.5"/>',
    cool: '<circle class="f" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path class="s" d="M5.5 9h5.5l-.5 2.2a1.8 1.8 0 0 1-1.8 1.3H7.5a1.8 1.8 0 0 1-1.8-1.3zM13 9h5.5l-.2 2.2a1.8 1.8 0 0 1-1.8 1.3h-1.2a1.8 1.8 0 0 1-1.8-1.3z"/><path d="M9 15.5a4 4 0 0 0 6 0"/>',

    /* ---------- linh vật: xúc xắc mặt cười ---------- */
    mascot: '<rect class="m-body" x="2.6" y="3.4" width="18.8" height="18" rx="5.6"/><circle class="m-eye" cx="8.9" cy="11.6" r="1.55"/><circle class="m-eye" cx="15.1" cy="11.6" r="1.55"/><circle class="m-shine" cx="9.4" cy="11.1" r=".5"/><circle class="m-shine" cx="15.6" cy="11.1" r=".5"/><path class="m-mouth" d="M10.3 15.2a2.2 2.2 0 0 0 3.4 0"/><ellipse class="ck" cx="6.4" cy="14.6" rx="1.4" ry=".95"/><ellipse class="ck" cx="17.6" cy="14.6" rx="1.4" ry=".95"/><circle class="af" cx="17.4" cy="6.9" r="1.25"/>'
  };
  I.mascotHappy = '<rect class="m-body" x="2.6" y="3.4" width="18.8" height="18" rx="5.6"/><path class="m-mouth" d="M7.4 12.2q1.5-1.9 3 0M13.6 12.2q1.5-1.9 3 0"/><path class="m-fill" d="M9.4 14.4h5.2a2.6 2.6 0 0 1-5.2 0z"/><path class="m-tongue" d="M10.9 16.4a1.2 1.2 0 0 1 2.2 0 2.5 2.5 0 0 1-2.2 0z"/><ellipse class="ck" cx="6.3" cy="14.8" rx="1.4" ry=".95"/><ellipse class="ck" cx="17.7" cy="14.8" rx="1.4" ry=".95"/><path class="a" d="M20.5 2.2v2.6M19.2 3.5h2.6"/><circle class="af" cx="3.4" cy="2.6" r=".9"/>';
  I.mascotSad = '<rect class="m-body" x="2.6" y="3.4" width="18.8" height="18" rx="5.6"/><circle class="m-eye" cx="8.9" cy="12" r="1.45"/><circle class="m-eye" cx="15.1" cy="12" r="1.45"/><circle class="m-shine" cx="9.4" cy="11.5" r=".45"/><circle class="m-shine" cx="15.6" cy="11.5" r=".45"/><path class="m-mouth" d="M10.2 16.6q1.8-1.5 3.6 0"/><path class="m-mouth" d="M7.3 9.2l2.6.9M16.7 9.2l-2.6.9"/><path class="m-drop" d="M19.6 6.2s1.3 1.5 1.3 2.4a1.3 1.3 0 0 1-2.6 0c0-.9 1.3-2.4 1.3-2.4z"/>';

  /* Bảng đổi emoji → icon (có thể thêm class màu sau dấu cách) */
  var EMOJI = {
    "⚡": "bolt", "📌": "pin", "📍": "pin", "🏠": "home", "🏡": "house", "🩺": "stetho", "💡": "bulb",
    "⚠️": "warn", "⚠": "warn", "🚨": "warn", "❗": "warn", "‼️": "warn", "📝": "memo", "✍️": "pencil", "✏️": "pencil", "🖊️": "pencil",
    "➕": "plus", "🆕": "plus", "🎯": "target", "🧪": "flask", "⚗️": "flask", "✨": "sparkle", "💯": "sparkle", "🌟": "star", "⭐": "star", "⭐️": "star",
    "🔥": "fire", "🎉": "party", "🥳": "party", "🎊": "party", "👍": "thumb", "👏": "thumb", "🙌": "thumb", "👌": "thumb", "💪": "muscle",
    "👀": "eye", "👁️": "eye", "👁": "eye", "📋": "clipboard", "📑": "list", "🗒️": "list", "🗂️": "list", "🧾": "list", "📃": "file", "📄": "file", "📜": "file",
    "🖨️": "printer", "🖨": "printer", "⏱️": "timer", "⏱": "timer", "⏰": "timer", "🕒": "timer", "⏳": "hourglass", "⌛": "hourglass",
    "📖": "book", "📘": "book", "📗": "book", "📙": "book", "📕": "book", "📚": "books", "🧠": "brain", "🖼️": "image", "🖼": "image",
    "🎮": "gamepad", "🕹️": "gamepad", "📱": "phone", "🚀": "rocket", "▶️": "play", "⏯️": "play",
    "✅": "check ic-ok", "✔️": "checkmark ic-ok", "☑️": "check ic-ok", "☐": "box", "⬜": "box", "🔲": "box", "❌": "cross ic-bad", "✖️": "cross ic-bad", "❎": "cross ic-bad",
    "🚫": "noentry", "⛔": "noentry", "❓": "question", "❔": "question", "🤔": "think", "ℹ️": "info", "🏁": "flag", "🚩": "flag",
    "🔄": "refresh", "🔃": "refresh", "🔁": "repeat", "↔️": "swap", "🔀": "shuffle", "➡️": "arrowright", "👉": "point", "👆": "point",
    "🧺": "basket", "🛒": "basket", "✂️": "scissors", "🏷️": "tag", "🏷": "tag", "🪜": "ladder", "📶": "stairs", "📏": "ruler", "📐": "ruler",
    "🧮": "abacus", "🔢": "numbers", "#️⃣": "numbers", "🎲": "dice", "🪙": "coin", "🃏": "card", "🂡": "card",
    "📊": "chart", "📈": "chartup", "📉": "chartdown", "🔔": "bell", "🔍": "search", "🔎": "search", "🔬": "microscope",
    "🔑": "key", "🔐": "lock", "🔒": "lock", "🎁": "gift", "📅": "calendar", "📆": "calendar", "📣": "megaphone", "📢": "megaphone",
    "🧩": "puzzle", "🗺️": "map", "🌍": "globe", "🌏": "globe", "🌎": "globe", "⚖️": "balance", "🎢": "seesaw",
    "☀️": "sun", "🌞": "sun", "🌙": "moon", "🌜": "moon", "☰": "menu", "⬇️": "download", "📥": "download", "🔗": "link",
    "🔴": "dot ic-red", "🟥": "dot ic-red", "🔵": "dot ic-blue", "🟦": "dot ic-blue", "🟢": "dot ic-green", "🟩": "dot ic-green",
    "🟡": "dot ic-yellow", "🟨": "dot ic-yellow", "🟠": "dot ic-orange", "🟧": "dot ic-orange", "🟣": "dot ic-purple", "🟪": "dot ic-purple",
    "⚪": "dot ic-gray", "⚫": "dot ic-dark",
    "💊": "pill", "💉": "syringe", "🏥": "hospital", "❤️": "heart ic-heart", "❤": "heart ic-heart", "🫀": "heart ic-heart", "💓": "heart ic-heart", "💗": "heart ic-heart",
    "🩸": "drop ic-heart", "💧": "drop", "🌡️": "thermo", "🌡": "thermo", "🌿": "leaf", "🍃": "leaf", "🌱": "herb", "🪴": "herb", "🍵": "tea", "🫖": "tea",
    "🍲": "bowl", "🥣": "bowl", "🥄": "bowl", "🧑‍⚕️": "doctor", "👨‍⚕️": "doctor", "👩‍⚕️": "doctor", "🧑": "person", "👤": "person", "🧍": "person", "🙋": "person",
    "👥": "people", "👫": "people", "🧑‍🤝‍🧑": "people", "👩": "woman", "👧": "woman", "🙋‍♀️": "woman", "👶": "baby", "🍼": "baby",
    "🎓": "student", "🧑‍🎓": "student", "👨‍🎓": "student", "👩‍🎓": "student", "🏫": "school", "👨‍👩‍👧": "family", "👪": "family",
    "🪑": "chair", "💺": "chair", "🗳️": "vote", "🏭": "factory", "📦": "package", "🚗": "car", "🚙": "car", "🚌": "bus", "🚐": "bus", "🚚": "truck", "🚛": "truck",
    "💰": "money", "💵": "money", "💸": "money", "🤑": "money",
    "😀": "smile", "😃": "smile", "😄": "smile", "😊": "smile", "🙂": "smile", "😁": "smile", "🤗": "smile", "😍": "smile",
    "😅": "oops", "😬": "oops", "😓": "oops", "🙈": "oops", "😢": "oops", "😟": "oops", "😮": "oops", "😲": "oops", "🤯": "oops", "😵": "oops",
    "😎": "cool", "⚔️": "swords", "⚔": "swords", "🆚": "swords", "☯️": "yinyang", "☯": "yinyang", "🤝": "handshake", "🔤": "letters", "🥧": "pie", "🍕": "pie", "🔮": "crystal", "⏭️": "next", "⏩": "next", "👇": "pointdown", "⬇": "pointdown", "➗": "divide", "↗️": "upright", "🎢": "chartup", "🔡": "letters", "🅰️": "letters", "🏆": "trophy", "🥇": "trophy", "🏅": "trophy"
  };
  /* trophy dùng chung cho 🏆 🥇 🏅 */
  I.trophy = '<path class="f" d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4.5a2.5 2.5 0 0 0 2.6 4M17 6h2.5a2.5 2.5 0 0 1-2.6 4"/><path d="M12 14v3.5M8.5 20.5h7M9.6 20.5l.5-3h3.8l.5 3"/><path class="af" d="m12 5.9.75 1.5 1.65.25-1.2 1.15.3 1.65-1.5-.8-1.5.8.3-1.65-1.2-1.15 1.65-.25z"/>';

  function icon(name, extra) {
    var parts = String(name).split(" ");
    var key = I[parts[0]] ? parts[0] : "sparkle";
    var cls = "ic ic-" + key + (parts.length > 1 ? " " + parts.slice(1).join(" ") : "") + (extra ? " " + extra : "");
    return '<svg class="' + cls + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + I[key] + "</svg>";
  }
  XSTK.icon = icon;
  XSTK.ICONS = I;
  XSTK.EMOJI = EMOJI;

  /* ---------- tự đổi emoji → icon ---------- */
  var keys = Object.keys(EMOJI).sort(function (a, b) { return b.length - a.length; });
  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  var RE = new RegExp(keys.map(function (k) {
    var base = k.replace(/️/g, "");
    var needsVS = k.charAt(k.length - 1) === "️" && (base === "↔" || base === "▶" || base === "➡" || base === "⬇" || base === "✔" || base === "✖" || base === "#⃣" || base === "↗" || base === "⏭");
    return esc(base) + (needsVS ? "️" : "️?");
  }).join("|"), "g");
  var LOOKUP = {};
  keys.forEach(function (k) { LOOKUP[k.replace(/️/g, "")] = EMOJI[k]; });
  var ANY_EMOJI = /\p{Extended_Pictographic}/u;
  var unmapped = (XSTK.unmappedEmoji = {});
  var SKIP = "script,style,textarea,select,option,code,pre,svg,.katex,.no-icon,title";

  function convertTextNode(node) {
    var t = node.nodeValue;
    if (!t || !ANY_EMOJI.test(t) && t.indexOf("☐") === -1 && t.indexOf("☰") === -1) return;
    var p = node.parentElement;
    if (!p || p.closest(SKIP)) return;
    RE.lastIndex = 0;
    if (!RE.test(t)) { noteUnmapped(t); return; }
    RE.lastIndex = 0;
    var frag = document.createDocumentFragment(), last = 0, m;
    while ((m = RE.exec(t))) {
      if (m.index > last) frag.appendChild(document.createTextNode(t.slice(last, m.index)));
      var span = document.createElement("span");
      span.className = "ic-wrap";
      span.innerHTML = icon(LOOKUP[m[0].replace(/️/g, "")]);
      frag.appendChild(span.firstChild);
      last = m.index + m[0].length;
    }
    if (last < t.length) {
      var rest = t.slice(last);
      frag.appendChild(document.createTextNode(rest));
      noteUnmapped(rest);
    }
    p.replaceChild(frag, node);
  }
  function noteUnmapped(t) {
    var g = t.match(/\p{Extended_Pictographic}/gu);
    if (g) g.forEach(function (e) { unmapped[e] = (unmapped[e] || 0) + 1; });
  }
  function convert(root) {
    if (!root) return;
    if (root.nodeType === 3) { convertTextNode(root); return; }
    if (root.nodeType !== 1 || root.closest && root.closest(SKIP)) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var list = [], n;
    while ((n = walker.nextNode())) list.push(n);
    list.forEach(convertTextNode);
    /* <i class="ic-slot" data-ic="tên"></i> */
    if (root.querySelectorAll) Array.prototype.forEach.call(root.querySelectorAll("i.ic-slot[data-ic]"), function (el) {
      var span = document.createElement("span");
      span.innerHTML = icon(el.getAttribute("data-ic"), el.className.replace("ic-slot", "").trim());
      el.parentNode.replaceChild(span.firstChild, el);
    });
    /* icon mặc định cho tiêu đề công cụ / trò chơi */
    if (root.querySelectorAll) Array.prototype.forEach.call(root.querySelectorAll(".widget-title, .game-title"), function (el) {
      if (el.querySelector(".ic")) return;
      el.insertAdjacentHTML("afterbegin", icon(el.classList.contains("game-title") ? "gamepad" : "flask"));
    });
  }
  XSTK.convertIcons = convert;

  function start() {
    convert(document.body);
    if (!("MutationObserver" in window)) return;
    var mo = new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        if (m.type === "characterData") convertTextNode(m.target);
        else Array.prototype.forEach.call(m.addedNodes, function (n) { convert(n); });
      });
    });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
