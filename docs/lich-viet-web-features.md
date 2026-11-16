# Lịch Việt trên web: danh sách tính năng

Nguồn đối chiếu: mã nguồn iOS `Desktop/2025/LichViet_V1.2026.1` (nhánh V1.2026.1), `docs/Report_v11.2026.1.md`, và trang App Store id6749473194 với đủ 11 bản cập nhật (1.0 ngày 08/08/2025 → 11.2026.1 tháng 11/2026).

Ký hiệu:
- ✅ **Làm như app**: chỉ cần tính toán hoặc nội dung có sẵn, chạy được trên trình duyệt.
- 🟡 **Làm được, cách khác**: cần thay công nghệ của Apple bằng thứ tương đương trên web, hoặc cần một lớp proxy nhỏ.
- ❌ **Không làm trên web**: phụ thuộc phần cứng hoặc hệ điều hành Apple.

Cột "Premium trong app" lấy từ `Services/ProGate.swift` và `Services/DailyViewLimitManager.swift`.

---

## 1. Lõi lịch âm dương

Động cơ trong app: `VNLunar/VNLunar.m` (4.474 dòng, thuật toán Hồ Ngọc Đức, UTC+7, 1900–2100). Site đã có bản TypeScript `src/components/lich-viet/lunar.ts`. Cần chuyển phần sửa tháng nhuận của 11.2026.1 sang và chạy lại bộ kiểm tra 109.543 ngày (`scripts/lunar_regression`).

| # | Tính năng | Chi tiết trong app | Web | Premium trong app |
|---|---|---|---|---|
| 1.1 | Tờ lịch ngày | Ngày dương, thứ, ngày/tháng âm, tháng nhuận, can chi ngày/tháng/năm, tiết khí, câu nói mỗi ngày (`quotAtJdDay`) | ✅ | Không |
| 1.2 | Chi tiết ngày (8 khối) | Giờ hoàng đạo / hắc đạo, ngũ hành, sao tốt / sao xấu, hướng xuất hành (hỷ thần, tài thần, hạc thần), tiết khí, sự kiện trong ngày, thông tin khác (`MonthlyCalendar/Cells/*`) | ✅ | Không |
| 1.3 | Lịch tháng | Ô ngày có ngày âm, đánh dấu hoàng đạo, ngày lễ, ngày nghỉ, sự kiện; chạm ngày mở chi tiết | ✅ | Không |
| 1.4 | Lịch Tháng–Năm cuộn liên tục | Cuộn vô tận, ngày dương + âm, dấu lễ và sự kiện, chạm mở sheet chi tiết (`MonthYearList/*`) | ✅ | Không |
| 1.5 | Đổi ngày âm ↔ dương | Đổi hai chiều, có tháng nhuận, chọn thứ trong tuần (`SwitchDays/*`) | ✅ | Không |
| 1.6 | Đếm ngày | Khoảng cách giữa hai mốc, trộn âm và dương, hai chiều (`CountDays/*`) | ✅ | Không |
| 1.7 | Lịch tròn 24 giờ (Circle Calendar) | Cung mặt trời theo thời gian thực, gradient bình minh–hoàng hôn; xem Ngày / Tuần / Tháng / Năm (`CircleCalendar/*`, `AstroCalculator.swift`) | ✅ | Không |
| 1.8 | Lịch mặt trăng | Pha trăng và độ sáng từng ngày, mùng 1, rằm (`MoonPhaseEngine.swift`) | ✅ | Không |
| 1.9 | Giờ mặt trời, mặt trăng | Mọc, lặn theo vị trí (thẻ trên Trang chủ) | ✅ (vị trí lấy qua Geolocation, hoặc chọn tỉnh) | Không |
| 1.10 | Cài đặt giờ Việt Nam | Tính theo giờ VN khi ở nước ngoài (`VietnamTimeSettingsViewController`) | ✅ | Không |

## 2. Ngày tốt, ngày lễ

| # | Tính năng | Chi tiết trong app | Web | Premium trong app |
|---|---|---|---|---|
| 2.1 | Tìm ngày tốt | 10 việc: cưới hỏi, khai trương, động thổ, xuất hành, nhập trạch, ký kết, mua xe, an táng, cắt tóc, cầu tài. Chấm điểm theo Hoàng Đạo, 12 Trực, 28 Sao, lọc theo tuổi; 4 mức Rất tốt / Tốt / Bình thường / Xấu (`GoodDayEngine.swift`) | ✅ | 3 lượt/ngày miễn phí, Premium không giới hạn |
| 2.2 | Ngày lễ | Danh sách lễ dương và âm, Tết, lịch nghỉ đến 2027, Ngày Văn hoá Việt Nam 24/11; xem theo tuần / tháng / năm; ghim, sắp xếp; vòng đếm ngược 3 ngày lễ tới; thẻ chia sẻ (`Holidays/*`) | ✅ (chia sẻ = tạo ảnh hoặc Web Share) | Không |
| 2.3 | Nhắc ngày âm | Mùng 1, rằm, ngày chay, lễ lớn (`LunarReminderService`, `HolidayNotificationService`) | 🟡 Tải file `.ics` hoặc đăng ký lịch, Web Push cho PWA | Không |

## 3. Văn hoá Việt

Phần lớn nội dung nằm sẵn trong mã Swift hoặc JSON, xuất ra JSON cho web được.

| # | Tính năng | Chi tiết trong app | Web | Premium trong app |
|---|---|---|---|---|
| 3.1 | Văn khấn | Văn khấn theo dịp, có cấu trúc (`vankhan_structured.json`, 232 KB) | ✅ | Không |
| 3.2 | Lễ hội | Lễ hội lớn và lễ hội dân tộc thiểu số, có trang chi tiết và ảnh (`Festival/*`, dữ liệu viết trong Swift, ảnh từ nguồn ngoài) | ✅ (cần xem lại quyền dùng ảnh) | Không |
| 3.3 | Tử vi năm, tử vi trọn đời | Theo năm và 12 con giáp: sự nghiệp, gia đình, sức khoẻ (`Tuvi/*`) | ✅ | Không |
| 3.4 | Tử vi hằng ngày | Vận trong ngày theo tuổi (`DailyHoroscopeEngine.swift`, 393 dòng) | ✅ | 2 lượt/ngày miễn phí |
| 3.5 | Sao giải hạn | Sao chiếu mệnh theo tuổi và năm, cách giải hạn (`SaoHanCalculator.swift`, `SaoGiaiHan/*`) | ✅ | Không |
| 3.6 | Tuổi xông đất | Hợp tuổi gia chủ cho năm mới (`XongDat2026/*`, `ZodiacCompatibilityData.swift`) | ✅ | Không |
| 3.7 | Lời chúc Tết | Kho lời chúc, tự viết, lưu và chia sẻ (`LoiChucTetData.swift`, 515 dòng) | ✅ | Không |
| 3.8 | Thần số học | Số chủ đạo, đường đời, sứ mệnh (`NumerologyEngine.swift`) | ✅ | 2 lượt/ngày miễn phí |
| 3.9 | Bói số điện thoại | Ý nghĩa phong thuỷ của số điện thoại (`BoiSimViewController`) | ✅ | 2 lượt/ngày miễn phí |
| 3.10 | Lời Thiền mỗi ngày | Câu Thiền xoay vòng | ✅ | Không |

## 4. Phong thuỷ

| # | Tính năng | Chi tiết trong app | Web | Premium trong app |
|---|---|---|---|---|
| 4.1 | La bàn phong thuỷ (La Kinh) | Xoay theo hướng máy. Các vòng: Tiên Thiên Bát Quái, 24 tiết khí, Kiếp Sát, Hoàng Tuyền, Cửu Tinh, 24 Sơn (chính châm), 60 Thấu Địa, 72 Xuyên Sơn, 120 Phân Kim. 3 cách đo: Chính châm, Nhân bàn, Phùng châm (`FengShuiCompassEngine.swift`, `CompassManager.swift`) | 🟡 Trên điện thoại dùng cảm biến hướng của trình duyệt (iOS Safari phải bấm cho phép). Trên máy tính thì xoay bằng tay hoặc nhập số độ | Không |
| 4.2 | Hướng theo tuổi | Hướng nhà, cửa, bếp, bàn làm việc; màu, số, tuổi hợp theo năm sinh (`AgeCompassEngine.swift`) | ✅ | Không |

## 5. Kinh Phật và trình phát

| # | Tính năng | Chi tiết trong app | Web | Premium trong app |
|---|---|---|---|---|
| 5.1 | Thư viện kinh | Hơn 1.000 bài, chia theo bộ kinh (`37-kinh-phat.json`, 401 KB, đã có trên site) | ✅ | Không |
| 5.2 | Nghe kinh | Trình phát, mini player, nhớ vị trí đang nghe | ✅ (Media Session API cho màn khoá điện thoại) | Không |
| 5.3 | Tải về nghe sau | Tải từng bài | 🟡 PWA + Cache Storage, giới hạn dung lượng của trình duyệt | Không |
| 5.4 | Thêm nhạc/kinh của bạn | Nhập file, chuyển file qua Wi-Fi (`WifiTransferServer`) | 🟡 Chọn file trên máy và lưu trong trình duyệt. Bỏ chuyển qua Wi-Fi | Không |
| 5.5 | Trình duyệt media, tải từ YouTube/ZingMp3/Spotify/TikTok | `MediaBrowserViewController` | ❌ Không nên làm. Báo cáo 11.2026.1 cũng đã lưu ý rủi ro bản quyền ở tính năng này | Không |

Audio đặt trên host ngoài (phatphapungdung.com). Cần xác nhận được phép phát trên web.

## 6. Tiện ích cá nhân

App lưu dữ liệu bằng Realm, dùng chung qua App Group; đồng bộ iCloud thuộc Premium. Trên web, mặc định lưu trên trình duyệt (IndexedDB), có thêm nút xuất và nhập file.

| # | Tính năng | Chi tiết trong app | Web | Premium trong app |
|---|---|---|---|---|
| 6.1 | Sự kiện cá nhân | Cưới, giỗ, kỷ niệm… có phân loại; chọn ngày âm thật (cả tháng nhuận); lặp lại hằng năm theo âm lịch (`EventsCalendar/*`) | ✅ + xuất `.ics` | Không |
| 6.2 | Ghi chú | Danh sách việc, ảnh, ghim, tìm kiếm, thống kê (`Notes/*`) | ✅ | Ảnh: 1 ảnh/ghi chú miễn phí |
| 6.3 | Nhật ký | Tâm trạng (5 mức), chuỗi ngày, "ngày này năm xưa" | ✅ | Không |
| 6.4 | Khoá nhật ký | Face ID | 🟡 Passkey (WebAuthn) hoặc mã PIN | Có |
| 6.5 | Thu chi | 11 danh mục, tổng kết tháng, biểu đồ theo danh mục, xuất CSV (`Finance/*`) | ✅ | Không |
| 6.6 | Thai kỳ và tiêm chủng | Lịch khám, lịch tiêm, nhắc nhở (`PregnancyViewController`) | ✅ (nhắc bằng `.ics`) | Không |
| 6.7 | Lịch ca làm | Xếp ca theo chu kỳ, xem theo ngày/tháng (`ShiftSchedule.swift`) | ✅ | Không |
| 6.8 | Đồng bộ iCloud | Sự kiện, ghi chú, nhật ký, thu chi, ngày lễ đã ghim (`CloudSyncService`) | 🟡 CloudKit JS + đăng nhập Apple ID, đọc cùng dữ liệu với app | Có |

## 7. Lịch Nhà (Family Calendar)

| # | Tính năng | Chi tiết trong app | Web | Premium trong app |
|---|---|---|---|---|
| 7.1 | Lịch chung gia đình | Tạo lịch, mời bằng link, đồng bộ hai chiều qua CKShare (`FamilyCalendarService`) | 🟡 CloudKit JS hỗ trợ dữ liệu chia sẻ, nhưng cần làm thử trước. Người dùng phải đăng nhập Apple ID | Có |
| 7.2 | Giỗ và kỷ niệm theo âm lịch | Nhắc nhiều mốc, phân công người phụ trách, ghi chú mâm cúng | ✅ phần hiển thị, 🟡 phần nhắc (`.ics` / Web Push) | Có |

## 8. Thông tin trực tuyến (thẻ Trang chủ)

| # | Tính năng | Chi tiết trong app | Web | Premium trong app |
|---|---|---|---|---|
| 8.1 | Thời tiết | Nhiệt độ, độ ẩm, gió, UV, chất lượng không khí, khả năng mưa, dự báo 7 ngày có biểu đồ, cảnh báo nắng nóng/mưa lớn/bão (Apple WeatherKit) | 🟡 WeatherKit có REST API, nhưng cần máy chủ ký JWT (Cloudflare Worker) | Không |
| 8.2 | Nhắc thời tiết hằng ngày | Theo giờ người dùng chọn | 🟡 Web Push, cần máy chủ | Không |
| 8.3 | Thị trường | VN-Index, tỷ giá USD, vàng SJC/PNJ/BTMC, bạc (cafef, vndirect, vps, Vietcombank, BIDV, PNJ, Phú Quý, BTMC) | 🟡 Cần proxy vì trình duyệt bị chặn CORS; nên xin phép các nguồn trước | Cập nhật 10 phút với Premium, 30 phút khi miễn phí |
| 8.4 | Ghi chú hôm nay, ngày lễ tới | Thẻ trên Trang chủ | ✅ | Không |

## 9. Giao diện và tuỳ biến

| # | Tính năng | Chi tiết trong app | Web | Premium trong app |
|---|---|---|---|---|
| 9.1 | Ba kiểu Trang chủ | Hiện đại (mặc định), Tờ lịch, Sơn mài (`ClassicHome/*`) | ✅ CSS | Sơn mài: có |
| 9.2 | Hoạ tiết nền truyền thống | 6 hoạ tiết: 2 trống đồng, tranh Gà, Đám cưới chuột, Cá chép, Hoa sen (giấy phép ở `docs/Asset_Licenses.md`) | ✅ | Không |
| 9.3 | Sắp xếp, ẩn hiện thành phần Trang chủ | `HomeCustomizationViewController`, `HomeLayoutStore` | ✅ | Không |
| 9.4 | Màu, viền, kiểu chữ; ảnh nền riêng và xoay vòng; nền gradient ngẫu nhiên | `ThemeManager`, `CustomBackgroundStore` | ✅ | Một số theme: có |
| 9.5 | Bố cục hai trang (iPhone Duo, iPad) | Tờ lịch bên trái, lịch tháng bên phải | ✅ Responsive cho máy tính và máy tính bảng | Không |
| 9.6 | Song ngữ Việt–Anh | 1.484 khoá trong `Localizable.strings` | ✅ | Không |
| 9.7 | Hướng dẫn, Help Stories | `GuidelineViewController`, `HelpStoriesViewController` | ✅ | Không |

## 10. Chỉ có trên thiết bị Apple

Phần này không làm trên web. Đây cũng là lý do để người dùng tải app.

| Tính năng | Lý do |
|---|---|
| Widget màn hình chính và màn hình khoá (Tờ lịch, Sơn mài, Mặt trăng, Lịch tròn, Lời Thiền, Tết…) và trình tạo widget | WidgetKit. Trên web chỉ làm được bản xem trước kèm nút tải app |
| Live Activity đếm ngược ngày lễ trên Dynamic Island | ActivityKit |
| Apple Watch: lịch, ngày tốt, tiết khí, Lịch tròn | watchOS |
| CarPlay: lịch, widget lái xe, nghe kinh | CarPlay |
| Siri và Shortcuts | App Intents |
| Quảng cáo, gói Premium qua StoreKit | Nếu bán trên web thì phải có cổng thanh toán riêng; cần quyết định |

---

## Tổng hợp

Mục 1–9 có 51 tính năng:
- **✅ Làm như app: 39 tính năng.** Gồm toàn bộ lõi lịch, ngày tốt, văn hoá, nghe kinh và phần lớn tiện ích cá nhân.
- **🟡 Làm được, cách khác: 11 tính năng.** Nhắc nhở, la bàn, tải kinh nghe offline, nhập kinh/nhạc riêng, khoá nhật ký, đồng bộ iCloud, Lịch Nhà, thời tiết, thị trường.
- **❌ Không làm: 1 tính năng ở mục 1–9, cùng 6 nhóm ở mục 10.** Gồm tải media bên thứ ba, widget, Live Activity, Watch, CarPlay, Siri và StoreKit.

## Thứ tự làm đề xuất

1. **Lõi lịch:** mục 1 và 2.1–2.2. Không cần máy chủ, có nhiều trang tĩnh tốt cho SEO.
2. **Văn hoá và phong thuỷ:** mục 3, 4, 5.1–5.3. Cần xuất nội dung từ mã Swift ra JSON.
3. **Tiện ích cá nhân dạng PWA:** mục 6.1–6.7, 9, nhắc nhở bằng `.ics`.
4. **Dịch vụ:** mục 6.8, 7, 8. Cần Cloudflare Worker và CloudKit JS.

## Cần quyết định trước khi làm

1. Giữ giới hạn lượt xem miễn phí như app (ngày tốt 3 lượt, tử vi ngày, thần số học và bói số 2 lượt mỗi ngày), hay mở hết trên web để kéo người dùng?
2. Các tính năng Premium (Sơn mài, Lịch Nhà, đồng bộ) chỉ có trong app, hay bán cả trên web?
3. Quyền dùng: audio kinh Phật, ảnh lễ hội, dữ liệu giá vàng và chứng khoán.
4. Trong `MarketDataService.swift` có một khoá API BTMC viết thẳng trong code. Bản web không được đưa khoá này ra phía trình duyệt.

---

## Trạng thái: nhóm 1 (lõi lịch) đã dựng

Mục `/vi/lich-am/` gồm:

| Trang | URL | Số trang |
|---|---|---|
| Lịch âm hôm nay | `/vi/lich-am/` | 1 |
| Ngày | `/vi/lich-am/ngay-16-11-2026/` | Từ năm 2020 đến năm hiện tại + 5 |
| Tháng | `/vi/lich-am/thang-11-2026/` | 1900–2100 (2.412 trang) |
| Năm | `/vi/lich-am/nam-2026/` | 1900–2100 (201 trang) |
| Đổi ngày âm dương | `/vi/lich-am/doi-ngay-am-duong/` | 1 |
| Đếm ngày | `/vi/lich-am/dem-ngay/` | 1 |

**Độ chính xác:**
- Ngày âm, tháng nhuận, can chi, giờ hoàng đạo, sao Ngọc hạp, nạp âm, hướng xuất hành và câu nói mỗi ngày lấy từ engine của app.
- Kết quả được đối chiếu với app trên toàn bộ 73.414 ngày từ 1900 đến 2100: `LICHVIET_IOS=… scripts/lich-data/run.sh`.

**Chỗ web khác app (theo cách tính truyền thống, đối chiếu xemlicham.com):**
- Trực tính theo tháng tiết khí. App tính theo tháng âm lịch.
- Hoàng đạo/hắc đạo dùng 12 thần trực nhật, tức trường `HoroscopeDay` của app. Web không dùng trường `GoodDay` có giá trị "Ngày Thường" vì nó không nhất quán.
- Ngày kỵ (Tam Nương, Nguyệt Kỵ, Nguyệt Tận, Dương Công, Sát Chủ âm/dương, Thọ Tử, Trùng Tang, Trùng Phục, Kim Thần Thất Sát) dùng bảng truyền thống thay cho `VNBadDayChecker`.
- Thêm phần app chưa có: Bành Tổ bách kỵ, Khổng Minh lục diệu, can chi từng giờ, giờ mặt trời mọc/lặn ở Hà Nội và TP.HCM, pha trăng.
- App có vài mục sao Ngọc hạp tên rỗng; web bỏ qua các mục này.

**SEO:**
- Mỗi trang là HTML tĩnh, có title và description riêng, canonical, BreadcrumbList.
- Trang chính và hai công cụ có thêm FAQPage và WebApplication.
- Liên kết nội bộ: ngày ↔ tháng ↔ năm, ngày trước/ngày sau, cùng ngày ở các năm khác.
- Tất cả URL có trong `sitemap.xml`.
- Site build lại lúc 00:05 giờ Việt Nam mỗi ngày để trang "hôm nay" luôn đúng ngày.

## Trạng thái: nhóm 2 (ngày tốt và văn hóa) đã dựng

| Phần | URL | Ghi chú |
|---|---|---|
| Xem ngày tốt | `/vi/lich-am/xem-ngay-tot/`, `…/cuoi-hoi/`, `…/cuoi-hoi/thang-12-2026/` | 10 việc × mọi tháng có trang ngày. Chấm điểm theo cách của `GoodDayEngine.swift` nhưng dùng các quy tắc đã chuẩn hóa ở nhóm 1. Lọc theo năm sinh chạy trên trình duyệt. |
| Văn khấn | `/vi/lich-am/van-khan/…` | 74 bài, 5 nhóm. Trang ngày lễ, rằm, mùng 1 có link sang bài tương ứng. |
| Sao hạn | `/vi/lich-am/sao-han/nam-2027/tuoi-1990/` | Từ năm 2025 đến năm hiện tại + 2. Khớp app ở 1.344 trường hợp. |
| Tử vi 2027 | `/vi/lich-am/tu-vi-2027/tuoi-ngo/` | Nội dung năm Đinh Mùi của app. |
| Xông đất 2027 | `/vi/lich-am/xong-dat-2027/tuoi-ngo/` | Khớp app ở 76 năm sinh gia chủ. |
| Lễ hội | `/vi/lich-am/le-hoi/` | 23 lễ hội gộp một trang. Không dùng ảnh hotlink từ báo ngoài. |
| Lời chúc Tết | `/vi/lich-am/loi-chuc-tet/sep/` | 227 lời chúc, 8 nhóm. |
| Thần số học, bói số điện thoại, tử vi hôm nay | công cụ trên trình duyệt | Khớp app 100%. Riêng thần số học, web đọc Đ là D (app bỏ qua Đ). Tử vi hôm nay dùng hệ số 0 thay cho số ngẫu nhiên của app. |

**Chưa làm:**
- Tử vi trọn đời: app chọn sao ngẫu nhiên mỗi lần, giờ âm lệch một giờ, ngũ hành dùng công thức rút gọn.
- La bàn phong thủy.
- Nghe kinh Phật: audio nằm trên host bên ngoài, cần xác nhận quyền phát.
