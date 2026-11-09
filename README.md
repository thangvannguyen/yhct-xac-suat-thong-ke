# 🎲 Học Xác Suất Thống Kê — YHCT 2026

Website tự học môn **Xác Suất Thống Kê**, viết lại từ slide bài giảng (Trường Cao đẳng Y Dược Hồng Đức) cho dễ hiểu hơn:

- ⚡ **Tóm tắt 30 giây** và khung **cốt lõi phải nhớ** cho từng bài
- 🏠 **Ví dụ đời thường / y khoa / YHCT** trước mỗi định nghĩa
- 🖼️ **Hình minh hoạ** tự vẽ (biểu đồ Venn, cây xác suất, đồ thị…)
- 🎮 **Trò chơi tương tác**: đoán công thức, tô vùng Venn, gieo xúc xắc, bốc viên thuốc, bập bênh trung bình, thử chọn mẫu…
- 📝 **Bài tập có lời giải từng bước**, trắc nghiệm chấm ngay, **đề thi thử 20 câu**
- 📝 Ghi chú những chỗ **slide gốc in sai**
- 📄 Link tải **slide gốc (PDF)** ở cuối mỗi bài
- 🌙 Giao diện sáng/tối, dùng tốt trên điện thoại, in được bảng công thức
- 🎨 **Bộ icon tự vẽ** cùng một phong cách, kèm linh vật **xúc xắc mặt cười** làm logo

Trang web là HTML/CSS/JS thuần: **không cần cài đặt, không cần build**.

---

## 🚀 Đưa lên GitHub Pages (miễn phí)

1. Tạo repository mới trên GitHub, ví dụ `yhct-xac-suat-thong-ke` (chọn **Public**).
2. Đẩy code lên (chạy trong thư mục này):
   ```bash
   git add .
   git commit -m "Website học Xác Suất Thống Kê"
   git branch -M main
   git remote add origin https://github.com/<tên-github-của-bạn>/yhct-xac-suat-thong-ke.git
   git push -u origin main
   ```
3. Trên GitHub, vào **Settings → Pages**:
   - *Source*: **Deploy from a branch**
   - *Branch*: **main**, thư mục **/ (root)** → **Save**
4. Đợi 1–2 phút, web sẽ có địa chỉ:
   `https://<tên-github-của-bạn>.github.io/yhct-xac-suat-thong-ke/`

Gửi link này cho các bạn trong lớp là xong. Mỗi lần sửa nội dung, chỉ cần `git add . && git commit -m "..." && git push`, web sẽ tự cập nhật sau khoảng 1 phút.

> 💡 File `.nojekyll` giúp GitHub phục vụ nguyên các file như hiện có. File `.gitignore` bỏ qua 5 file PDF gốc ở thư mục ngoài cùng, vì đã có bản copy (tên không dấu) trong `tai-lieu/`.

## 💻 Xem thử trên máy

Mở thẳng file `index.html` bằng trình duyệt là được. Nếu muốn giống hệt khi chạy trên mạng thì chạy:

```bash
python3 -m http.server 8000
```

rồi mở <http://localhost:8000>.

---

## ➕ Thêm Bài 4, Bài 5 khi có tài liệu

1. Copy file PDF vào `tai-lieu/`, đặt tên không dấu, không khoảng trắng, ví dụ `tai-lieu/bai-4-cong-thuc-xac-suat.pdf`.
2. Mở `assets/js/lessons.js`, sửa mục `bai-4`:
   ```js
   { id: "bai-4", num: "4", icon: "➕", status: "ready",
     href: "bai-4.html",
     title: "Tên bài 4",
     desc: "Mô tả ngắn 1–2 câu.",
     pdf: "tai-lieu/bai-4-cong-thuc-xac-suat.pdf" },
   ```
   Menu, trang chủ, nút "Bài trước / Bài sau" và thanh tiến độ sẽ tự cập nhật.
3. Viết nội dung vào `bai-4.html`. Trang **`mau-bai-hoc.html`** có sẵn mọi thành phần (khung tóm tắt, bẫy hay nhầm, công thức, hình, bảng, lời giải, trắc nghiệm, trò chơi) để copy.
   - Công thức toán viết kiểu LaTeX: `$C_n^k$` (trong dòng) hoặc `$$P(A)=\frac{k}{n}$$` (riêng dòng).
   - Mỗi tiêu đề `<h2>` tự động thành một mục trong "Mục lục".
4. (Tuỳ chọn) Thêm câu hỏi thi thử của bài mới vào `assets/js/on-tap.js` (mảng `BANK`, đặt `tag` mới và khai báo trong `TAG_NAME`, `PER_TAG`).

## 🎨 Icon tự vẽ

Mọi icon trên trang đều là hình SVG tự vẽ trong `assets/js/icons.js`, cùng một phong cách (nét tròn, nền tô nhạt, điểm nhấn màu cam, vài icon có má hồng) và tự đổi màu theo chế độ sáng/tối.

- Khi viết nội dung, cứ gõ **emoji như bình thường** (⚡ 💡 ⚠️ 🎲 💊…). Lúc trang tải, emoji nào có trong bảng `EMOJI` của `icons.js` sẽ tự đổi thành icon tương ứng.
- Muốn chèn icon trực tiếp: `<i class="ic-slot" data-ic="pill"></i>`. Tên icon xem trong `icons.js`.
- Trong JS: `XSTK.icon("dice")` trả về chuỗi `<svg …>`.
- Không đặt emoji trong `<text>` của hình SVG, trong `<option>` hay trong thuộc tính (title, aria-label), vì những chỗ đó không đổi được thành icon.

## 🎬 Hình minh hoạ chuyển động

Toàn bộ nằm trong `assets/js/anim.js` (đầu file có hướng dẫn chi tiết):

- Mọi `<figure class="fig">` có hình SVG sẽ **tự vẽ dần** khi cuộn tới, kèm nút **"Xem lại"**. Muốn tắt thì thêm `data-anim="none"`.
- **Chiếu từng bước:** thêm `data-anim="steps"` vào `<figure>`, gắn `data-step="1"`, `data-step="2"`… vào các phần của hình, rồi viết chú thích cho từng bước:
  ```html
  <figure class="fig framed" data-anim="steps">
    <svg>… <circle data-step="1" …/> <path data-step="2" …/> …</svg>
    <div class="step-captions">
      <p data-caption="1">Bước 1: …</p>
      <p data-caption="2">Bước 2: …</p>
    </div>
  </figure>
  ```
  Trang sẽ tự thêm các nút ‹ Bước tiếp ›, Tự chạy và chấm tiến độ. Xem ví dụ trong `mau-bai-hoc.html`.
- Lời giải `<ol class="steps">` có từ 3 bước trở lên sẽ có nút **"Xem từng bước"**.
- Thêm `?static=1` vào cuối địa chỉ trang để tắt hiệu ứng (khi cần in hoặc chụp ảnh). Người dùng bật chế độ "giảm chuyển động" trên máy cũng sẽ không thấy hiệu ứng.

## 📁 Cấu trúc thư mục

```
index.html            Trang chủ
bai-1.html … bai-8.html   Các bài học (bai-4, bai-5: đang chờ tài liệu)
on-tap.html           Tổng hợp công thức + thi thử
mau-bai-hoc.html      Trang mẫu để viết bài mới (không hiện trong menu)
assets/css/style.css  Giao diện chung (màu sắc, sáng/tối, điện thoại, in ấn)
assets/js/lessons.js  Danh sách bài học (sửa ở đây khi thêm bài)
assets/js/icons.js    Bộ icon tự vẽ + tự đổi emoji thành icon
assets/js/anim.js     Hiệu ứng: vẽ dần, chiếu từng bước, pháo giấy, thanh tiến độ đọc
assets/img/favicon.svg  Logo linh vật (biểu tượng trên tab trình duyệt)
assets/js/main.js     Menu, mục lục, sáng/tối, "Đã học xong", trắc nghiệm
assets/js/widgets.js  Hàm tính toán (tổ hợp, trung bình, phương sai…) và vẽ biểu đồ
assets/js/games.js    Bộ khung trò chơi (điểm, chuỗi đúng, kỷ lục)
assets/js/bai-*.js    Công cụ và trò chơi riêng của từng bài
assets/js/on-tap.js   Sơ đồ chọn công thức + ngân hàng câu hỏi thi thử
tai-lieu/             Slide gốc (PDF)
```

Tiến độ học và điểm trò chơi chỉ lưu trong trình duyệt của mỗi người (localStorage), không gửi đi đâu.

## ⚠️ Lưu ý

Trang web là tài liệu **hỗ trợ ôn tập**. Khi có chỗ khác với bài giảng, hãy theo bài giảng của thầy cô. Slide gốc thuộc về Trường Cao đẳng Y Dược Hồng Đức.
