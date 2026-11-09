/* =========================================================
   on-tap.js — Sơ đồ chọn công thức đếm + Thi thử 20 câu
   ========================================================= */
(function () {
  "use strict";
  var XSTK = window.XSTK || {};
  var math = function (el) { if (XSTK.math) XSTK.math(el); };
  var shuffle = (XSTK.util && XSTK.util.shuffle) || function (a) { return a.slice().sort(function () { return Math.random() - 0.5; }); };

  /* ---------------------------------------------------------
     1) SƠ ĐỒ CHỌN CÔNG THỨC
     --------------------------------------------------------- */
  var TREE = {
    start: {
      q: "① Một phần tử có được chọn <b>lặp lại</b> nhiều lần không?",
      hint: "VD: mật khẩu có thể trùng số → có lặp; chọn người thì mỗi người chỉ chọn 1 lần → không lặp.",
      opts: [["🔁 Có, được lặp lại", "rep"], ["🚫 Không, mỗi phần tử chỉ chọn 1 lần", "norep"]]
    },
    rep: {
      q: "② Đổi chỗ các phần tử có tạo ra <b>một cách mới</b> không?",
      hint: "VD: mã PIN 1-2-3-4 khác 4-3-2-1 → có thứ tự.",
      opts: [["↔️ Có, thứ tự quan trọng", "R_rep_order"], ["🧺 Không, chỉ quan tâm lấy cái gì", "R_rep_noorder"]]
    },
    norep: {
      q: "② Đổi chỗ các phần tử có tạo ra <b>một cách mới</b> không?",
      hint: "VD: (lớp trưởng An, lớp phó Bình) khác (lớp trưởng Bình, lớp phó An) → có thứ tự. Chọn 3 vị thuốc vào 1 thang → không thứ tự.",
      opts: [["↔️ Có, thứ tự quan trọng", "norep_order"], ["🧺 Không, chỉ quan tâm lấy cái gì", "R_comb"]]
    },
    norep_order: {
      q: "③ Có lấy <b>hết tất cả</b> n phần tử ra để sắp xếp không (k = n)?",
      hint: "VD: xếp 4 bệnh nhân vào đúng 4 giường → lấy hết.",
      opts: [["✅ Có, sắp xếp tất cả (k = n)", "R_perm"], ["✂️ Không, chỉ lấy k < n phần tử", "R_arr"]]
    },
    R_rep_order: { name: "Chỉnh hợp lặp", f: "F_n^k = n^k", ex: "Mã PIN 4 chữ số (0–9, được trùng): $10^4 = 10\\,000$ mã. Xếp 5 bệnh nhân vào 3 khoa: $3^5 = 243$ cách." },
    R_rep_noorder: { name: "Tổ hợp lặp", f: "\\overline{C}_n^k = C_{n+k-1}^k", ex: "Mua 3 gói trà từ 4 loại (được mua trùng loại): $C_{6}^{3} = 20$ cách." },
    R_comb: { name: "Tổ hợp (không lặp)", f: "C_n^k = \\dfrac{n!}{k!\\,(n-k)!}", ex: "Chọn 5 người vào ban chấp hành từ 8 người: $C_8^5 = 56$ cách. Chọn 3 vị thuốc từ 5 vị: $C_5^3 = 10$ cách." },
    R_perm: { name: "Hoán vị", f: "P_n = n!", ex: "Xếp 4 bệnh nhân vào 4 giường: $4! = 24$ cách." },
    R_arr: { name: "Chỉnh hợp không lặp", f: "A_n^k = \\dfrac{n!}{(n-k)!}", ex: "Bầu 1 lớp trưởng và 1 lớp phó từ 30 SV: $A_{30}^2 = 30 \\cdot 29 = 870$ cách. Xếp 3 BN vào 5 khoa, mỗi khoa tối đa 1 người: $A_5^3 = 60$." }
  };

  function initChooser() {
    var body = document.getElementById("chooser-body");
    if (!body) return;
    var path = [];
    function render(nodeId) {
      var node = TREE[nodeId];
      var crumbs = path.length ? '<div class="chooser-path">' + path.map(function (p) { return '<span class="chip on">' + p + "</span>"; }).join("") + "</div>" : "";
      if (node.name) {
        body.innerHTML = crumbs +
          '<div class="chooser-result"><div class="r-name">👉 ' + node.name + '</div>' +
          '<div class="formula" style="margin:.6em 0">$$' + node.f + '$$</div>' +
          "<p style=\"margin:0\"><b>Ví dụ:</b> " + node.ex + "</p></div>" +
          '<div class="btn-row"><button type="button" class="btn">↺ Chọn lại từ đầu</button></div>';
        body.querySelector("button").addEventListener("click", function () { path = []; render("start"); });
      } else {
        body.innerHTML = crumbs + '<div class="chooser-step"><p class="chooser-q">' + node.q + '</p><p class="small muted" style="margin:0 0 8px">' + node.hint + '</p><div class="btn-row"></div></div>';
        var row = body.querySelector(".btn-row");
        node.opts.forEach(function (o) {
          var b = document.createElement("button");
          b.type = "button"; b.className = "btn"; b.innerHTML = o[0];
          b.addEventListener("click", function () { path.push(o[0].replace(/<[^>]+>/g, "")); render(o[1]); });
          row.appendChild(b);
        });
        if (path.length) {
          var back = document.createElement("button");
          back.type = "button"; back.className = "btn small"; back.textContent = "↺ Làm lại";
          back.addEventListener("click", function () { path = []; render("start"); });
          row.appendChild(back);
        }
      }
      math(body);
    }
    render("start");
  }

  /* ---------------------------------------------------------
     2) NGÂN HÀNG CÂU HỎI THI THỬ
     tag: b1 | b2 | b3 | b67 | b8 — answer: chỉ số đáp án đúng (từ 0)
     --------------------------------------------------------- */
  var BANK = [
    /* ----- Bài 1 ----- */
    { tag: "b1", q: "Có bao nhiêu số tự nhiên có 3 chữ số?", o: ["1000", "900", "648", "720"], a: 1,
      e: "Chữ số đầu có 9 cách (1–9), hai chữ số sau mỗi chữ số 10 cách (được lặp): $9 \\cdot 10^2 = 900$." },
    { tag: "b1", q: "Có bao nhiêu số tự nhiên có 3 chữ số <b>khác nhau</b>?", o: ["900", "720", "648", "504"], a: 2,
      e: "Chữ số đầu: 9 cách (bỏ số 0). Hai chữ số sau chọn có thứ tự, không lặp từ 9 số còn lại: $A_9^2 = 72$. Tổng: $9 \\cdot 72 = 648$." },
    { tag: "b1", q: "Xếp tuỳ ý 5 bệnh nhân vào 3 khoa (mỗi khoa nhận bao nhiêu người cũng được). Số cách xếp là:", o: ["$5^3 = 125$", "$3^5 = 243$", "$A_5^3 = 60$", "$C_5^3 = 10$"], a: 1,
      e: "Mỗi bệnh nhân có 3 lựa chọn khoa, các khoa được dùng lặp lại → chỉnh hợp lặp $3^5 = 243$." },
    { tag: "b1", q: "Chọn 5 người vào ban chấp hành chi đoàn từ 8 ứng cử viên (không phân chức vụ). Số cách chọn:", o: ["$A_8^5 = 6720$", "$8^5$", "$C_8^5 = 56$", "$5! = 120$"], a: 2,
      e: "Không lặp, không thứ tự → tổ hợp $C_8^5 = \\dfrac{8!}{5!\\,3!} = 56$." },
    { tag: "b1", q: "Bầu 1 lớp trưởng và 1 lớp phó từ 30 sinh viên. Số cách bầu:", o: ["$C_{30}^2 = 435$", "$A_{30}^2 = 870$", "$30^2 = 900$", "$2! = 2$"], a: 1,
      e: "Hai chức vụ khác nhau nên có thứ tự, một người không giữ 2 chức nên không lặp → $A_{30}^2 = 30 \\cdot 29 = 870$." },
    { tag: "b1", q: "Xếp 4 bệnh nhân vào 4 giường (mỗi giường 1 người). Số cách xếp:", o: ["16", "24", "256", "4"], a: 1,
      e: "Sắp xếp toàn bộ 4 người → hoán vị $P_4 = 4! = 24$." },
    { tag: "b1", q: "Chọn 3 vị thuốc từ 5 vị để bốc một thang (thứ tự cho vào không quan trọng). Số cách:", o: ["$A_5^3 = 60$", "$C_5^3 = 10$", "$5^3 = 125$", "$3! = 6$"], a: 1,
      e: "Đổi thứ tự vẫn là cùng một thang thuốc → không thứ tự, không lặp → $C_5^3 = 10$." },
    { tag: "b1", q: "Mẫu gồm k phần tử <b>không lặp, có thứ tự</b> lấy từ n phần tử gọi là:", o: ["Tổ hợp", "Chỉnh hợp lặp", "Chỉnh hợp không lặp", "Tổ hợp lặp"], a: 2,
      e: "Có thứ tự → chỉnh hợp; không lặp → chỉnh hợp không lặp $A_n^k$." },
    { tag: "b1", q: "Cho $A = \\{1, 2, 3, 4\\}$, $B = \\{3, 4, 5\\}$. Tập $A \\cap B$ là:", o: ["$\\{1, 2, 3, 4, 5\\}$", "$\\{3, 4\\}$", "$\\{1, 2\\}$", "$\\{5\\}$"], a: 1,
      e: "Giao gồm các phần tử <b>vừa thuộc A vừa thuộc B</b>: 3 và 4." },
    { tag: "b1", q: "Cho $A = \\{1, 2, 3, 4\\}$, $B = \\{3, 4, 5\\}$. Tập $A \\setminus B$ là:", o: ["$\\{1, 2\\}$", "$\\{5\\}$", "$\\{3, 4\\}$", "$\\varnothing$"], a: 0,
      e: "Hiệu $A \\setminus B$ gồm phần tử <b>chỉ thuộc A, không thuộc B</b>: 1 và 2." },
    { tag: "b1", q: "Mã PIN điện thoại gồm 4 chữ số (0–9, được trùng nhau). Có bao nhiêu mã?", o: ["$A_{10}^4 = 5040$", "$C_{10}^4 = 210$", "$10^4 = 10\\,000$", "$4^{10}$"], a: 2,
      e: "Có thứ tự (1234 ≠ 4321) và được lặp → chỉnh hợp lặp $10^4$." },

    /* ----- Bài 2 ----- */
    { tag: "b2", q: "Gieo một con xúc xắc cân đối 1 lần. Không gian mẫu là:", o: ["$\\Omega = \\{1, 2, 3, 4, 5, 6\\}$", "$\\Omega$ = {chẵn, lẻ}", "$\\Omega = \\{6\\}$", "$\\Omega = \\{0, 1\\}$"], a: 0,
      e: "Không gian mẫu là tập <b>mọi kết quả có thể</b> của phép thử: 6 mặt." },
    { tag: "b2", q: "Gieo 1 xúc xắc. Biến cố \"xuất hiện mặt 7 chấm\" là:", o: ["Biến cố chắc chắn", "Biến cố ngẫu nhiên", "Biến cố không thể", "Biến cố sơ cấp"], a: 2,
      e: "Xúc xắc không có mặt 7 nên biến cố này không bao giờ xảy ra → biến cố không thể ($\\varnothing$)." },
    { tag: "b2", q: "Gieo 1 xúc xắc. Biến cố \"số chấm nhỏ hơn hoặc bằng 6\" là:", o: ["Biến cố không thể", "Biến cố chắc chắn", "Biến cố ngẫu nhiên", "Biến cố đối lập"], a: 1,
      e: "Mặt nào cũng ≤ 6 nên biến cố luôn xảy ra → biến cố chắc chắn ($\\Omega$)." },
    { tag: "b2", q: "Gieo 1 xúc xắc. A = \"ra mặt chẵn\", B = \"ra mặt lẻ\". A và B là hai biến cố:", o: ["Không xung khắc", "Xung khắc nhưng không đối lập", "Đối lập", "A kéo theo B"], a: 2,
      e: "Không thể vừa chẵn vừa lẻ (xung khắc), và luôn có đúng một trong hai xảy ra → <b>đối lập</b> ($B = \\overline{A}$)." },
    { tag: "b2", q: "Gieo 1 xúc xắc. A = \"ra mặt 1\", B = \"ra mặt 2\". A và B là:", o: ["Đối lập", "Xung khắc nhưng không đối lập", "Không xung khắc", "Tương đương"], a: 1,
      e: "Không thể cùng xảy ra → xung khắc. Nhưng có thể cả hai cùng không xảy ra (ra mặt 3) → không đối lập." },
    { tag: "b2", q: "Gieo đồng thời 2 xúc xắc. C = \"con thứ nhất ra mặt 6\", D = \"con thứ hai ra mặt 6\". C và D:", o: ["Xung khắc", "Không xung khắc", "Đối lập", "Là biến cố không thể"], a: 1,
      e: "Cả hai con cùng ra mặt 6 là hoàn toàn có thể → C và D <b>không</b> xung khắc." },
    { tag: "b2", q: "Biến cố $A \\cup B$ xảy ra khi:", o: ["Cả A và B cùng xảy ra", "Ít nhất một trong hai biến cố A, B xảy ra", "A xảy ra nhưng B không xảy ra", "Cả A và B đều không xảy ra"], a: 1,
      e: "Hợp = \"hoặc\": chỉ cần ít nhất một biến cố xảy ra." },
    { tag: "b2", q: "Biến cố $A \\cap B$ (viết tắt $AB$) xảy ra khi:", o: ["Ít nhất một trong A, B xảy ra", "Cả A và B cùng xảy ra", "Chỉ A xảy ra", "A không xảy ra"], a: 1,
      e: "Giao = \"và\": cả hai cùng xảy ra." },
    { tag: "b2", q: "Đo thời gian chờ khám (phút) của một bệnh nhân. Không gian mẫu thuộc loại:", o: ["Rời rạc, hữu hạn", "Rời rạc, vô hạn đếm được", "Liên tục", "Không xác định được"], a: 2,
      e: "Thời gian có thể nhận mọi giá trị trong một khoảng (5,2 phút; 5,25 phút…) → vô hạn không đếm được → liên tục." },
    { tag: "b2", q: "Gieo xúc xắc liên tiếp cho đến khi ra mặt 6, đếm số lần gieo. Không gian mẫu $\\{1, 2, 3, \\dots\\}$ là:", o: ["Rời rạc, hữu hạn", "Rời rạc, vô hạn đếm được", "Liên tục", "Tập rỗng"], a: 1,
      e: "Số lần gieo là 1, 2, 3, … đếm được từng giá trị nhưng không có giới hạn trên → rời rạc vô hạn đếm được." },

    /* ----- Bài 3 ----- */
    { tag: "b3", q: "Gieo 1 xúc xắc cân đối. Xác suất ra mặt chẵn là:", o: ["$\\dfrac{1}{6}$", "$\\dfrac{1}{3}$", "$\\dfrac{1}{2}$", "$\\dfrac{2}{3}$"], a: 2,
      e: "Có 3 kết quả thuận lợi {2, 4, 6} trên 6 kết quả đồng khả năng: $P = \\dfrac{3}{6} = \\dfrac{1}{2}$." },
    { tag: "b3", q: "Giỏ có 4 sản phẩm loại 1 và 6 sản phẩm loại 2. Lấy ngẫu nhiên 1 sản phẩm. Xác suất được loại 1:", o: ["0,4", "0,6", "0,25", "4"], a: 0,
      e: "$P = \\dfrac{4}{10} = 0{,}4$." },
    { tag: "b3", q: "Định nghĩa xác suất cổ điển chỉ dùng được khi:", o: ["Số kết quả vô hạn", "Số kết quả hữu hạn và các kết quả đồng khả năng", "Có số liệu thống kê lớn", "Biến cố là biến cố chắc chắn"], a: 1,
      e: "Hai điều kiện bắt buộc: <b>hữu hạn</b> kết quả và <b>đồng khả năng</b> xảy ra." },
    { tag: "b3", q: "Khảo sát 10 000 người dân thấy 51 người bị cao huyết áp. Xác suất (ước lượng) một người bị cao huyết áp là:", o: ["0,51", "0,051", "0,0051", "51"], a: 2,
      e: "Định nghĩa thống kê: $P \\approx \\dfrac{k}{n} = \\dfrac{51}{10\\,000} = 0{,}0051$ (≈ 0,5%)." },
    { tag: "b3", q: "Xác suất của một biến cố bất kỳ luôn thoả mãn:", o: ["$P(A) > 0$", "$0 \\le P(A) \\le 1$", "$-1 \\le P(A) \\le 1$", "$P(A) \\le 100$"], a: 1,
      e: "Xác suất nằm từ 0 (không thể) đến 1 (chắc chắn)." },
    { tag: "b3", q: "Một điểm rơi ngẫu nhiên vào hình vuông cạnh 2 cm. Xác suất điểm rơi vào hình vuông nhỏ cạnh 1 cm nằm bên trong là:", o: ["$\\dfrac{1}{2}$", "$\\dfrac{1}{4}$", "$\\dfrac{1}{8}$", "1"], a: 1,
      e: "Định nghĩa hình học: $P = \\dfrac{S_A}{S} = \\dfrac{1^2}{2^2} = \\dfrac{1}{4}$." },
    { tag: "b3", q: "Khám 200 người, có 30 người mắc bệnh. Tần suất mắc bệnh là:", o: ["30", "0,15", "0,3", "6,67"], a: 1,
      e: "Tần suất $f = \\dfrac{m}{n} = \\dfrac{30}{200} = 0{,}15$ (tần số m = 30)." },
    { tag: "b3", q: "Trong bảng Hemoglobin của 70 phụ nữ, nhóm 11–11,9 g/dl có 19 người. Phần trăm của nhóm này là:", o: ["19%", "27,14%", "52,86%", "13,3%"], a: 1,
      e: "$\\dfrac{19}{70} \\times 100 \\approx 27{,}14\\%$. (52,86% là phần trăm <b>tích luỹ</b> tính đến nhóm này.)" },

    /* ----- Bài 6-7 ----- */
    { tag: "b67", q: "Bảng phân phối: $X$ nhận 0, 1, 2 với xác suất 0,2; 0,5; $p$. Giá trị của $p$ là:", o: ["0,2", "0,3", "0,5", "0,7"], a: 1,
      e: "Tổng xác suất phải bằng 1: $p = 1 - 0{,}2 - 0{,}5 = 0{,}3$." },
    { tag: "b67", q: "$X$ nhận 0, 1, 2 với xác suất 0,2; 0,5; 0,3. Kỳ vọng $E(X)$ bằng:", o: ["1", "1,1", "1,5", "0,8"], a: 1,
      e: "$E(X) = 0 \\cdot 0{,}2 + 1 \\cdot 0{,}5 + 2 \\cdot 0{,}3 = 1{,}1$." },
    { tag: "b67", q: "Trò chơi tung đồng xu: ra Sấp được 10.000đ, ra Ngửa mất 4.000đ (mỗi mặt xác suất 0,5). Kỳ vọng tiền nhận mỗi lần chơi:", o: ["6.000đ", "3.000đ", "7.000đ", "14.000đ"], a: 1,
      e: "$E = 10\\,000 \\cdot 0{,}5 + (-4\\,000) \\cdot 0{,}5 = 3\\,000$đ." },
    { tag: "b67", q: "Huyết áp tâm thu (mmHg) của 5 người: 120, 125, 130, 135, 150. Trung vị là:", o: ["130", "132", "135", "125"], a: 0,
      e: "Dãy đã xếp tăng, n = 5 lẻ → số đứng giữa (thứ 3) là 130. (132 là trung bình.)" },
    { tag: "b67", q: "Chiều cao (cm) của 6 người: 153, 155, 160, 162, 165, 161. Trung vị là:", o: ["160", "161", "160,5", "162"], a: 2,
      e: "Sắp xếp: 153, 155, <b>160, 161</b>, 162, 165. n = 6 chẵn → $(160 + 161)/2 = 160{,}5$." },
    { tag: "b67", q: "Điểm của 6 học sinh: 5, 5, 5, 6, 7, 9. Yếu vị là:", o: ["5", "6", "6,17", "9"], a: 0,
      e: "Yếu vị là giá trị xuất hiện nhiều nhất: 5 (3 lần)." },
    { tag: "b67", q: "Thu nhập của nhân viên một công ty có vài người thu nhập rất cao (số liệu lệch). Nên dùng số đo nào để mô tả \"mức điển hình\"?", o: ["Trung bình", "Trung vị", "Phương sai", "Độ lệch chuẩn"], a: 1,
      e: "Số liệu bị lệch thì trung bình bị kéo về phía giá trị cực đoan; <b>trung vị</b> phản ánh mức điển hình chính xác hơn." },
    { tag: "b67", q: "Biến \"dân tộc\" (Kinh, Hoa, Khmer…) dùng số đo trung tâm nào?", o: ["Trung bình", "Trung vị", "Yếu vị", "Độ lệch chuẩn"], a: 2,
      e: "Biến danh định không sắp xếp được, không tính trung bình được → chỉ dùng <b>yếu vị</b>." },
    { tag: "b67", q: "Phương sai mẫu $s^2 = 132{,}5$ (mmHg²). Độ lệch chuẩn SD xấp xỉ:", o: ["66,25", "11,5", "132,5", "17 556"], a: 1,
      e: "$SD = \\sqrt{s^2} = \\sqrt{132{,}5} \\approx 11{,}5$ mmHg." },
    { tag: "b67", q: "\"Số sinh viên vắng mặt trong một buổi học\" là đại lượng ngẫu nhiên:", o: ["Rời rạc", "Liên tục", "Không phải ĐLNN", "Định tính"], a: 0,
      e: "Chỉ nhận các giá trị đếm được 0, 1, 2, … → rời rạc." },
    { tag: "b67", q: "Phương sai mẫu $s^2$ được tính bằng tổng bình phương độ lệch chia cho:", o: ["n", "n − 1", "n + 1", "$\\sqrt{n}$"], a: 1,
      e: "$s^2 = \\dfrac{\\sum (x_i - \\bar{x})^2}{n - 1}$." },
    { tag: "b67", q: "X nhận 0, 1, 2 với xác suất $\\frac{2}{15}, \\frac{8}{15}, \\frac{1}{3}$. Hàm phân phối $F(1) = P(X \\le 1)$ bằng:", o: ["$\\dfrac{8}{15}$", "$\\dfrac{2}{3}$", "$\\dfrac{1}{3}$", "1"], a: 1,
      e: "$F(1) = P(X=0) + P(X=1) = \\dfrac{2}{15} + \\dfrac{8}{15} = \\dfrac{10}{15} = \\dfrac{2}{3}$." },

    /* ----- Bài 8 ----- */
    { tag: "b8", q: "Biến \"giới tính\" (nam / nữ) thuộc loại:", o: ["Danh định nhiều giá trị", "Nhị giá", "Thứ tự", "Định lượng"], a: 1,
      e: "Biến định tính chỉ có 2 giá trị → biến nhị giá." },
    { tag: "b8", q: "Phân độ tăng huyết áp (bình thường, tiền THA, độ 1, độ 2, độ 3) là biến:", o: ["Danh định", "Thứ tự", "Định lượng", "Nhị giá"], a: 1,
      e: "Định tính và <b>sắp xếp được</b> từ nhẹ đến nặng → biến thứ tự." },
    { tag: "b8", q: "Đường huyết (mmol/l) là biến:", o: ["Định lượng", "Danh định", "Thứ tự", "Nhị giá"], a: 0,
      e: "Giá trị là con số đo được → định lượng." },
    { tag: "b8", q: "Danh sách 1000 sinh viên, chọn ngẫu nhiên 1 người trong 10 người đầu rồi cứ cách 10 người chọn 1. Đây là cách chọn mẫu:", o: ["Ngẫu nhiên đơn", "Ngẫu nhiên hệ thống", "Phân tầng", "Cụm"], a: 1,
      e: "Chọn theo khoảng cách đều nhau → mẫu ngẫu nhiên hệ thống." },
    { tag: "b8", q: "Chia sinh viên theo từng khối lớp, rồi chọn ngẫu nhiên một số người <b>trong mỗi khối</b>. Đây là:", o: ["Mẫu cụm", "Mẫu phân tầng", "Mẫu thuận tiện", "Mẫu bóng tuyết"], a: 1,
      e: "Chia thành các tầng (nhóm đồng nhất) rồi chọn ngẫu nhiên trong từng tầng → phân tầng." },
    { tag: "b8", q: "Chọn ngẫu nhiên 3 lớp rồi khảo sát <b>tất cả</b> sinh viên trong 3 lớp đó. Đây là:", o: ["Mẫu cụm", "Mẫu phân tầng", "Mẫu hệ thống", "Mẫu quota"], a: 0,
      e: "Đơn vị được chọn là cả nhóm (lớp) → mẫu cụm." },
    { tag: "b8", q: "Phỏng vấn những người đầu tiên gặp ở cổng bệnh viện là cách chọn mẫu:", o: ["Ngẫu nhiên đơn", "Thuận tiện (phi ngẫu nhiên)", "Phân tầng", "Hệ thống"], a: 1,
      e: "Chọn ai dễ gặp nhất → mẫu thuận tiện, dễ bị sai lệch, không đại diện." },
    { tag: "b8", q: "Biểu đồ phù hợp nhất để trình bày phân phối của biến định lượng (vd: cân nặng sơ sinh) là:", o: ["Biểu đồ tròn", "Biểu đồ tần suất (histogram)", "Bảng 2 chiều", "Biểu đồ cột cho từng tên"], a: 1,
      e: "Biến định lượng: histogram hoặc biểu đồ hộp. Biểu đồ tròn/cột dành cho biến định tính." },
    { tag: "b8", q: "Biểu đồ chấm có các điểm xếp gần thành đường thẳng đi <b>lên</b> từ trái sang phải cho thấy:", o: ["Tương quan âm", "Tương quan dương mạnh", "Không tương quan", "Hai biến định tính"], a: 1,
      e: "x tăng thì y tăng, các điểm sát một đường thẳng → tương quan dương mạnh." },
    { tag: "b8", q: "Một con số tính được từ <b>mẫu</b> (vd: huyết áp trung bình của 100 người được khảo sát) gọi là:", o: ["Tham số", "Thống kê (statistic)", "Quần thể", "Biến số"], a: 1,
      e: "Số đo trên mẫu là <b>thống kê</b>; đặc trưng thật của quần thể là <b>tham số</b>." },
    { tag: "b8", q: "Khi chia khoảng cho biến định lượng liên tục, số khoảng nên vào khoảng:", o: ["1–2", "5–12", "20–30", "Càng nhiều càng tốt"], a: 1,
      e: "Theo bài giảng: 5–12 khoảng (thường 7–8), độ rộng khoảng là 1, 2, 5, 10, 0,5, 0,2…" }
  ];

  var TAG_NAME = { b1: "Bài 1", b2: "Bài 2", b3: "Bài 3", b67: "Bài 6-7", b8: "Bài 8" };
  var PER_TAG = { b1: 4, b2: 4, b3: 4, b67: 4, b8: 4 }; /* 20 câu */

  /* ---------------------------------------------------------
     3) THI THỬ
     --------------------------------------------------------- */
  function initExam() {
    var root = document.getElementById("exam");
    if (!root) return;
    var timer = null, t0 = 0, questions = [], picks = [];

    function fmtTime(s) { var m = Math.floor(s / 60), r = s % 60; return m + ":" + (r < 10 ? "0" : "") + r; }

    function startScreen() {
      clearInterval(timer);
      var best = XSTK.Game ? XSTK.Game.getBest("thi-thu") : 0;
      root.innerHTML =
        '<div class="game"><div class="game-head"><span class="game-title">Thi thử 20 câu</span>' +
        '<span class="game-stat">⭐ Điểm cao nhất: ' + (best ? (best / 10).toLocaleString("vi-VN") + "/10" : "chưa có") + "</span></div>" +
        '<div class="game-body exam-start"><div class="big">📝</div>' +
        "<p><b>20 câu · 4 câu mỗi bài · khoảng 25 phút</b></p>" +
        '<p class="muted small">Ngân hàng có ' + BANK.length + " câu; mỗi đề lấy ngẫu nhiên, thứ tự đáp án cũng được xáo trộn.</p>" +
        '<button type="button" class="btn primary">▶️ Bắt đầu làm bài</button></div></div>';
      root.querySelector("button").addEventListener("click", startExam);
    }

    function startExam() {
      questions = [];
      Object.keys(PER_TAG).forEach(function (tag) {
        var pool = BANK.filter(function (q) { return q.tag === tag; });
        questions = questions.concat(shuffle(pool).slice(0, PER_TAG[tag]));
      });
      questions = questions.map(function (q) {
        var order = shuffle(q.o.map(function (_, i) { return i; }));
        return { tag: q.tag, q: q.q, e: q.e, o: order.map(function (i) { return q.o[i]; }), a: order.indexOf(q.a) };
      });
      picks = questions.map(function () { return -1; });
      t0 = Date.now();

      var html = '<div class="exam-bar"><b>⏱️ <span id="exam-time">0:00</span></b>' +
        '<span class="grow">Đã làm <b id="exam-count">0</b>/' + questions.length +
        '<span class="progress" style="display:block;margin-top:4px"><span id="exam-prog" style="width:0%"></span></span></span>' +
        '<button type="button" class="btn primary small" id="exam-submit">Nộp bài</button></div>';
      questions.forEach(function (q, i) {
        html += '<div class="exam-q" data-i="' + i + '"><p class="q-text"><span class="q-num">Câu ' + (i + 1) + ".</span> " + q.q +
          '<span class="tag">' + TAG_NAME[q.tag] + '</span></p><div class="q-options">' +
          q.o.map(function (o, j) { return '<button type="button" data-j="' + j + '">' + o + "</button>"; }).join("") +
          "</div></div>";
      });
      html += '<div class="btn-row" style="justify-content:center"><button type="button" class="btn primary" id="exam-submit-2">✅ Nộp bài</button></div>';
      root.innerHTML = html;
      math(root);

      root.querySelectorAll(".exam-q").forEach(function (box) {
        var i = +box.getAttribute("data-i");
        box.querySelectorAll("button").forEach(function (b) {
          b.addEventListener("click", function () {
            picks[i] = +b.getAttribute("data-j");
            box.classList.remove("unanswered");
            box.querySelectorAll("button").forEach(function (x) { x.classList.toggle("is-picked", x === b); });
            var n = picks.filter(function (p) { return p >= 0; }).length;
            document.getElementById("exam-count").textContent = n;
            document.getElementById("exam-prog").style.width = Math.round(n / questions.length * 100) + "%";
          });
        });
      });
      var submit = function () {
        var miss = picks.filter(function (p) { return p < 0; }).length;
        if (miss) {
          root.querySelectorAll(".exam-q").forEach(function (box, i) { box.classList.toggle("unanswered", picks[i] < 0); });
          if (!window.confirm("Bạn còn " + miss + " câu chưa làm (đã tô viền cam). Vẫn nộp bài?")) return;
        }
        finish();
      };
      document.getElementById("exam-submit").addEventListener("click", submit);
      document.getElementById("exam-submit-2").addEventListener("click", submit);
      timer = setInterval(function () {
        var el = document.getElementById("exam-time");
        if (!el) { clearInterval(timer); return; }
        el.textContent = fmtTime(Math.floor((Date.now() - t0) / 1000));
      }, 1000);
      root.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function finish() {
      clearInterval(timer);
      var secs = Math.floor((Date.now() - t0) / 1000);
      var right = 0, byTag = {};
      questions.forEach(function (q, i) {
        byTag[q.tag] = byTag[q.tag] || { ok: 0, n: 0 };
        byTag[q.tag].n++;
        if (picks[i] === q.a) { right++; byTag[q.tag].ok++; }
      });
      var score10 = right * 0.5;
      var isBest = XSTK.Game ? XSTK.Game.setBest("thi-thu", Math.round(score10 * 10)) : false;
      var msg = score10 >= 9 ? "Xuất sắc! 🎉" : score10 >= 7 ? "Khá tốt! 👍" : score10 >= 5 ? "Đạt, cần ôn thêm một chút 💪" : "Cần ôn lại kỹ hơn 📚";
      var weak = Object.keys(byTag).filter(function (t) { return byTag[t].ok / byTag[t].n < 0.75; });

      var html = '<div class="card exam-result"><div class="score">' + score10.toLocaleString("vi-VN") + '<span class="muted" style="font-size:1.2rem">/10</span></div>' +
        "<p><b>" + msg + "</b>" + (isBest ? " · ⭐ Kỷ lục mới!" : "") + "</p>" +
        '<p class="muted small">Đúng ' + right + "/" + questions.length + " câu · Thời gian " + fmtTime(secs) + "</p>" +
        '<div class="breakdown">' + Object.keys(PER_TAG).map(function (t) {
          var b = byTag[t] || { ok: 0, n: 0 };
          return '<div class="stat"><span class="stat-label">' + TAG_NAME[t] + '</span><span class="stat-value">' + b.ok + "/" + b.n + "</span></div>";
        }).join("") + "</div>" +
        (weak.length ? '<p class="small">📖 Nên ôn lại: ' + weak.map(function (t) {
          var href = t === "b67" ? "bai-6-7.html" : "bai-" + t.slice(1) + ".html";
          return '<a href="' + href + '">' + TAG_NAME[t] + "</a>";
        }).join(", ") + "</p>" : "") +
        '<div class="btn-row" style="justify-content:center"><button type="button" class="btn primary" id="exam-new">↺ Làm đề mới</button>' +
        '<button type="button" class="btn" id="exam-wrong">👀 Chỉ xem câu sai</button></div></div>';

      questions.forEach(function (q, i) {
        var ok = picks[i] === q.a;
        html += '<div class="exam-q' + (ok ? " is-ok" : " is-bad") + '"><p class="q-text"><span class="q-num">Câu ' + (i + 1) + ".</span> " +
          (ok ? "✅ " : picks[i] < 0 ? "⬜ " : "❌ ") + q.q + '<span class="tag">' + TAG_NAME[q.tag] + '</span></p><div class="q-options">' +
          q.o.map(function (o, j) {
            var cls = j === q.a ? "is-correct" : (j === picks[i] ? "is-wrong" : "");
            return '<button type="button" disabled class="' + cls + '">' + o + "</button>";
          }).join("") + '</div><div class="q-explain">💡 ' + q.e + "</div></div>";
      });
      root.innerHTML = html;
      math(root);
      document.getElementById("exam-new").addEventListener("click", startExam);
      var onlyWrong = false;
      document.getElementById("exam-wrong").addEventListener("click", function () {
        onlyWrong = !onlyWrong;
        this.textContent = onlyWrong ? "📋 Xem tất cả câu" : "👀 Chỉ xem câu sai";
        root.querySelectorAll(".exam-q.is-ok").forEach(function (x) { x.style.display = onlyWrong ? "none" : ""; });
      });
      root.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    startScreen();
  }

  initChooser();
  initExam();

  /* cho phép kiểm tra ngân hàng câu hỏi trong console / node */
  window.XSTK_BANK = BANK;
})();
