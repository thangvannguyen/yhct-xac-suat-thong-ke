/* =========================================================
   DANH SÁCH BÀI HỌC — sửa ở đây là menu, trang chủ, nút
   "Bài trước / Bài sau" tự cập nhật.

   Khi có tài liệu Bài 4 hoặc Bài 5:
     1. Viết nội dung vào bai-4.html (hoặc bai-5.html)
     2. Đổi status: "soon" → "ready", sửa title / desc / icon
     3. Copy PDF vào tai-lieu/ rồi điền đường dẫn vào pdf
   ========================================================= */
window.LESSONS = [
  {
    id: "bai-1", num: "1", icon: "🧮", status: "ready",
    href: "bai-1.html",
    title: "Giải tích tổ hợp",
    desc: "Tập hợp, phép giao – hợp – trừ và 4 công thức đếm: chỉnh hợp, hoán vị, tổ hợp.",
    pdf: "tai-lieu/bai-1-giai-tich-to-hop.pdf"
  },
  {
    id: "bai-2", num: "2", icon: "🎲", status: "ready",
    href: "bai-2.html",
    title: "Phép thử & biến cố",
    desc: "Phép thử ngẫu nhiên, không gian mẫu Ω, các loại biến cố và quan hệ giữa chúng.",
    pdf: "tai-lieu/bai-2-phep-thu-va-bien-co.pdf"
  },
  {
    id: "bai-3", num: "3", icon: "🎯", status: "ready",
    href: "bai-3.html",
    title: "Định nghĩa xác suất",
    desc: "Xác suất cổ điển, thống kê (tần suất), hình học; thống kê là gì; tần số và tần suất.",
    pdf: "tai-lieu/bai-3-dinh-nghia-xac-suat.pdf"
  },
  {
    id: "bai-4", num: "4", icon: "⏳", status: "soon",
    href: "bai-4.html",
    title: "Bài 4",
    desc: "Đang chờ bổ sung tài liệu.",
    pdf: ""
  },
  {
    id: "bai-5", num: "5", icon: "⏳", status: "soon",
    href: "bai-5.html",
    title: "Bài 5",
    desc: "Đang chờ bổ sung tài liệu.",
    pdf: ""
  },
  {
    id: "bai-6-7", num: "6-7", icon: "📊", status: "ready",
    href: "bai-6-7.html",
    title: "Đại lượng ngẫu nhiên",
    desc: "Bảng phân phối, hàm phân phối, kỳ vọng, trung bình – trung vị – yếu vị, phương sai, độ lệch chuẩn.",
    pdf: "tai-lieu/bai-6-7-dai-luong-ngau-nhien.pdf"
  },
  {
    id: "bai-8", num: "8", icon: "👥", status: "ready",
    href: "bai-8.html",
    title: "Mẫu & thống kê mô tả",
    desc: "Quần thể và mẫu, các loại biến số, trình bày số liệu, phương pháp chọn mẫu, biểu đồ.",
    pdf: "tai-lieu/bai-8-mau-va-thong-ke-mo-ta.pdf"
  },
  {
    id: "on-tap", num: "★", icon: "🏆", status: "ready",
    href: "on-tap.html",
    title: "Ôn tập & thi thử",
    desc: "Tổng hợp công thức, sơ đồ chọn công thức và đề thi thử trắc nghiệm có chấm điểm.",
    pdf: "",
    noProgress: true
  }
];
