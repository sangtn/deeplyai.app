// Static tables for the Vietnamese day almanac (lịch vạn niên).
// Sources: the Lịch Việt iOS app (Date+Extension.swift, GoodDayEngine.swift, HolidayData.swift)
// and, where the app's rule differs from the published tradition, the tables documented by
// xemlicham.com (taboo days, Trực by solar-term month). Each table notes which one it follows.

/** 12 day/hour gods. Six of them are hoàng đạo (auspicious). */
export const THAN = [
  { name: 'Thanh Long', good: true },
  { name: 'Minh Đường', good: true },
  { name: 'Thiên Hình', good: false },
  { name: 'Chu Tước', good: false },
  { name: 'Kim Quỹ', good: true },
  { name: 'Kim Đường', good: true },
  { name: 'Bạch Hổ', good: false },
  { name: 'Ngọc Đường', good: true },
  { name: 'Thiên Lao', good: false },
  { name: 'Huyền Vũ', good: false },
  { name: 'Tư Mệnh', good: true },
  { name: 'Câu Trần', good: false },
] as const;

export const HOUR_RANGES = ['23h–1h', '1h–3h', '3h–5h', '5h–7h', '7h–9h', '9h–11h', '11h–13h', '13h–15h', '15h–17h', '17h–19h', '19h–21h', '21h–23h'];

/** Thập nhị trực, with the app's meaning and suggested/avoided activities. */
export const TRUC = [
  { name: 'Kiến', meaning: 'Khởi đầu mới mẻ, tốt cho các việc bắt đầu.', nen: ['Khai trương', 'Cưới hỏi', 'Trồng cây', 'Nhập học', 'Tu sửa', 'Xuất hành'], kieng: ['Đào giếng', 'Động thổ', 'Lợp nhà', 'An táng', 'Tố tụng'] },
  { name: 'Trừ', meaning: 'Loại bỏ điều xấu, tốt cho việc thanh tẩy.', nen: ['Tẩy trừ', 'Dâng sao giải hạn', 'Tỉa chân nhang', 'Thay bát hương', 'Chữa bệnh', 'Xuất hành'], kieng: ['Ký hợp đồng lớn', 'Chi xuất tiền', 'Khai trương', 'Cưới hỏi', 'Viễn hành'] },
  { name: 'Mãn', meaning: 'Sung mãn, tốt cho việc tích lũy.', nen: ['Cúng lễ', 'Xuất hành', 'Sửa kho', 'Khai thương', 'Giao dịch', 'Cầu tài'], kieng: ['Chôn cất', 'Kiện tụng', 'Nhậm chức', 'Cưới hỏi'] },
  { name: 'Bình', meaning: 'Bình hòa, tốt cho việc ổn định.', nen: ['Di dời bếp', 'Giao thương', 'Mua bán', 'Sửa máy móc', 'Xây dựng nhỏ'], kieng: ['An táng', 'Động thổ', 'Khai trương lớn', 'Kê giường', 'Đào giếng'] },
  { name: 'Định', meaning: 'Ổn định, tốt cho việc lâu dài.', nen: ['Buôn bán', 'Giao thương', 'Họp bàn', 'Làm chuồng trại', 'Động thổ', 'Nhập học'], kieng: ['Kiện tụng', 'Xuất hành xa', 'Khám chữa bệnh', 'Mua súc vật mới'] },
  { name: 'Chấp', meaning: 'Giữ gìn, tốt cho việc bảo tồn.', nen: ['Tu sửa', 'Tuyển dụng', 'Tạo ốc', 'Đào mương', 'Lập khế ước', 'Chữa bệnh'], kieng: ['Xuất kho', 'Giao dịch tiền bạc', 'Mở cửa hiệu', 'Xuất hành', 'Kinh doanh lớn'] },
  { name: 'Phá', meaning: 'Phá bỏ, tốt cho việc thay đổi.', nen: ['Phá ốc', 'Phá thổ', 'Đi xa', 'Chữa bệnh', 'Tháo dỡ', 'Hốt thuốc'], kieng: ['Cưới hỏi', 'Khai trương', 'Hội họp', 'Tố tụng'] },
  { name: 'Nguy', meaning: 'Nguy hiểm, cần thận trọng.', nen: ['Lễ bái', 'Cầu tự', 'Tụng kinh', 'Huấn binh', 'Chuẩn bị ruộng vườn'], kieng: ['Cưới hỏi', 'Kinh doanh', 'Khai trương', 'Xuất hành', 'Xây dựng'] },
  { name: 'Thành', meaning: 'Thành công, tốt cho việc hoàn tất.', nen: ['Nhập học', 'Cưới hỏi', 'Dọn nhà', 'Kinh doanh', 'Giao dịch', 'Xuất hành'], kieng: ['Kiện tụng', 'Cãi vã', 'An táng'] },
  { name: 'Thâu', meaning: 'Thu hoạch, tốt cho việc thu lợi.', nen: ['Mở cửa hàng', 'Lập kho', 'Mua trâu', 'Săn bắn', 'Thu hoạch', 'Giao dịch'], kieng: ['Ma chay', 'An táng', 'Tảo mộ', 'Đóng giường', 'Đi xa'] },
  { name: 'Khai', meaning: 'Mở mang, tốt cho việc bắt đầu mới.', nen: ['Khai trương', 'Động thổ', 'Cưới hỏi', 'Nhập học', 'Làm nhà', 'Cúng tế'], kieng: ['An táng', 'Chôn cất', 'Đào đất', 'Kiện tụng'] },
  { name: 'Bế', meaning: 'Đóng kín, tốt cho việc bảo vệ.', nen: ['Đắp đập', 'Xây tường', 'Vá vách', 'Đặt táng', 'Tu sửa móng', 'Trồng cây'], kieng: ['Nhậm chức', 'Kiện tụng', 'Đào giếng', 'Chôn cất', 'Nhập học', 'Cưới hỏi'] },
];

/** Giờ xuất hành Lý Thuần Phong, in cycle order (descriptions from the app). */
export const LY_THUAN_PHONG = [
  { name: 'Đại An', good: true, text: 'Mọi việc đều tốt lành, cầu tài đi hướng Tây Nam. Nhà cửa yên lành, người xuất hành đều bình yên.' },
  { name: 'Tốc Hỷ', good: true, text: 'Tin vui sắp tới, cầu tài đi hướng Nam. Đi gặp gỡ may mắn, chăn nuôi thuận lợi, người đi có tin về.' },
  { name: 'Lưu Niên', good: false, text: 'Việc khó thành, cầu tài mờ mịt. Kiện cáo nên hoãn lại, người đi nên phòng ngừa cãi cọ.' },
  { name: 'Xích Khẩu', good: false, text: 'Hay cãi cọ gây chuyện, nên giữ miệng, tránh tranh chấp và tránh lây bệnh.' },
  { name: 'Tiểu Cát', good: true, text: 'Rất tốt lành. Xuất hành gặp may, buôn bán có lợi, phụ nữ có tin mừng, mọi việc hòa hợp.' },
  { name: 'Tuyệt Lộ', good: false, text: 'Cầu tài không lợi, ra đi dễ gặp trở ngại, việc quan nên hoãn.' },
];

/** Khổng Minh lục diệu for the whole day. */
export const LUC_DIEU = [
  { name: 'Đại An', good: true, text: 'Ngày bình yên, mọi việc thuận lợi.' },
  { name: 'Lưu Liên', good: false, text: 'Việc dễ dây dưa, chậm trễ, khó dứt điểm.' },
  { name: 'Tốc Hỷ', good: true, text: 'Có tin vui, việc làm nhanh chóng thuận lợi.' },
  { name: 'Xích Khẩu', good: false, text: 'Dễ xảy ra cãi vã, thị phi, nên thận trọng lời nói.' },
  { name: 'Tiểu Cát', good: true, text: 'Ngày tốt, có quý nhân giúp đỡ, việc nhỏ thành công.' },
  { name: 'Không Vong', good: false, text: 'Việc dễ hỏng, mất mát, không nên khởi sự việc lớn.' },
];

/** Bành Tổ bách kỵ: one line per Can and per Chi, with a plain-language note. */
export const BANH_TO_CAN = [
  ['Giáp bất khai thương', 'Ngày Giáp không nên mở kho, xuất tiền hàng, dễ hao tổn tài sản.'],
  ['Ất bất tài thực', 'Ngày Ất không nên gieo trồng, cây khó phát triển.'],
  ['Bính bất tu táo', 'Ngày Bính không nên sửa bếp, dễ gặp hỏa hoạn.'],
  ['Đinh bất thế đầu', 'Ngày Đinh không nên cắt tóc, cạo đầu.'],
  ['Mậu bất thụ điền', 'Ngày Mậu không nên nhận ruộng đất, mua bán nhà đất.'],
  ['Kỷ bất phá khoán', 'Ngày Kỷ không nên phá bỏ, hủy giao kèo, hợp đồng.'],
  ['Canh bất kinh lạc', 'Ngày Canh không nên dệt vải, lên khung cửi.'],
  ['Tân bất hợp tương', 'Ngày Tân không nên trộn tương, làm nước chấm.'],
  ['Nhâm bất ương thủy', 'Ngày Nhâm không nên tháo nước, đào mương, khơi dòng.'],
  ['Quý bất từ tụng', 'Ngày Quý không nên kiện tụng, tranh chấp.'],
] as const;

export const BANH_TO_CHI = [
  ['Tý bất vấn bốc', 'Ngày Tý không nên gieo quẻ, xem bói.'],
  ['Sửu bất đới quan', 'Ngày Sửu không nên nhậm chức, nhận quan tước.'],
  ['Dần bất tế tự', 'Ngày Dần không nên tế lễ, cúng bái lớn.'],
  ['Mão bất xuyên tỉnh', 'Ngày Mão không nên đào giếng.'],
  ['Thìn bất khốc khấp', 'Ngày Thìn không nên khóc lóc, kỵ tang sự.'],
  ['Tỵ bất viễn hành', 'Ngày Tỵ không nên đi xa.'],
  ['Ngọ bất thiêm cái', 'Ngày Ngọ không nên lợp mái, làm nóc nhà.'],
  ['Mùi bất phục dược', 'Ngày Mùi không nên uống thuốc lạ.'],
  ['Thân bất an sàng', 'Ngày Thân không nên kê, đặt giường mới.'],
  ['Dậu bất hội khách', 'Ngày Dậu không nên mời khách, tụ tập đông người.'],
  ['Tuất bất cật khuyển', 'Ngày Tuất không nên ăn thịt chó.'],
  ['Hợi bất giá thú', 'Ngày Hợi không nên cưới gả.'],
] as const;

// Taboo days (các ngày kỵ). A leap month uses the table of the month with the same number.
export const TAM_NUONG = [3, 7, 13, 18, 22, 27];
export const NGUYET_KY = [5, 14, 23];
/** Dương Công kỵ nhật: [lunar month, lunar day]. Tháng 7 has two dates in the common table. */
export const DUONG_CONG = [[1, 13], [2, 11], [3, 9], [4, 7], [5, 5], [6, 3], [7, 8], [7, 29], [8, 27], [9, 25], [10, 23], [11, 21], [12, 19]];
/** Day Chi index (0 = Tý) by lunar month 1–12. */
export const SAT_CHU_DUONG = [0, 1, 1, 10, 4, 4, 1, 4, 1, 4, 7, 4];
export const SAT_CHU_AM = [5, 0, 7, 3, 8, 10, 11, 1, 6, 9, 2, 4];
export const THO_TU = [10, 4, 11, 5, 0, 6, 1, 7, 2, 8, 3, 9];
/** Day Can index (0 = Giáp) by lunar month 1–12. */
export const TRUNG_TANG = [0, 1, 5, 2, 3, 5, 6, 7, 5, 8, 9, 5];
export const TRUNG_PHUC = [6, 7, 5, 8, 9, 4, 0, 1, 5, 8, 9, 5];
/** Kim thần thất sát: day Chi indexes by year Can (Giáp/Kỷ, Ất/Canh, Bính/Tân, Đinh/Nhâm, Mậu/Quý). */
export const KIM_THAN_THAT_SAT = [[6, 7], [4, 5], [0, 1, 2, 3], [10, 11], [8, 9]];

export const TABOO_TEXT: Record<string, string> = {
  'Tam Nương': 'Ngày xấu theo dân gian, kỵ khởi sự việc lớn như cưới hỏi, khai trương, xuất hành.',
  'Nguyệt Kỵ': 'Mùng 5, 14, 23 âm lịch. Dân gian có câu “mùng năm, mười bốn, hai ba, đi chơi cũng lỗ nữa là đi buôn”.',
  'Nguyệt Tận': 'Ngày cuối tháng âm lịch, khí suy, kỵ khởi sự việc mới.',
  'Dương Công Kỵ': 'Một trong 13 ngày kỵ trong năm theo Dương Công, tránh làm việc đại sự.',
  'Sát Chủ Dương': 'Kỵ xây dựng, cưới hỏi, nhập trạch.',
  'Sát Chủ Âm': 'Kỵ an táng, mai táng, sửa mộ.',
  'Thọ Tử': 'Trăm sự đều kỵ, nhất là cưới hỏi, khai trương.',
  'Trùng Tang': 'Kỵ an táng, cưới hỏi, xây nhà.',
  'Trùng Phục': 'Kỵ an táng, cưới hỏi, dễ gặp việc lặp lại không hay.',
  'Kim Thần Thất Sát': 'Kỵ động thổ, xây dựng, sửa nhà trong năm này.',
};

export interface HolidayDef { id: string; title: string; note: string; lunar: boolean; day: number; month: number; days?: number }

/** Holidays shown in the app's Ngày lễ screen. */
export const HOLIDAYS: HolidayDef[] = [
  { id: 'ong-tao', title: 'Ông Táo chầu trời', note: 'Tiễn Táo Quân về trời', lunar: true, day: 23, month: 12 },
  { id: 'giao-thua', title: 'Giao thừa', note: 'Đêm cuối năm âm lịch', lunar: true, day: 30, month: 12 },
  { id: 'tet-nguyen-dan', title: 'Tết Nguyên Đán', note: 'Tết cổ truyền, sum họp gia đình', lunar: true, day: 1, month: 1, days: 3 },
  { id: 'nguyen-tieu', title: 'Rằm tháng Giêng', note: 'Tết Nguyên Tiêu', lunar: true, day: 15, month: 1 },
  { id: 'han-thuc', title: 'Tết Hàn thực', note: 'Cúng bánh trôi, bánh chay', lunar: true, day: 3, month: 3 },
  { id: 'gio-to', title: 'Giỗ Tổ Hùng Vương', note: 'Tưởng nhớ các Vua Hùng', lunar: true, day: 10, month: 3 },
  { id: 'phat-dan', title: 'Lễ Phật Đản', note: 'Rằm tháng Tư', lunar: true, day: 15, month: 4 },
  { id: 'doan-ngo', title: 'Tết Đoan Ngọ', note: 'Tết diệt sâu bọ', lunar: true, day: 5, month: 5 },
  { id: 'that-tich', title: 'Lễ Thất tịch', note: 'Ngưu Lang – Chức Nữ', lunar: true, day: 7, month: 7 },
  { id: 'vu-lan', title: 'Lễ Vu Lan', note: 'Rằm tháng Bảy, báo hiếu cha mẹ', lunar: true, day: 15, month: 7 },
  { id: 'trung-thu', title: 'Tết Trung Thu', note: 'Rằm tháng Tám, Tết đoàn viên', lunar: true, day: 15, month: 8 },
  { id: 'trung-cuu', title: 'Tết Trùng Cửu', note: 'Mùng 9 tháng 9 âm lịch', lunar: true, day: 9, month: 9 },
  { id: 'trung-thap', title: 'Tết Trùng Thập', note: 'Tết Cơm mới', lunar: true, day: 10, month: 10 },
  { id: 'tet-duong', title: 'Tết Dương lịch', note: 'Năm mới dương lịch', lunar: false, day: 1, month: 1 },
  { id: 'thanh-lap-dang', title: 'Thành lập Đảng CSVN', note: '3/2/1930', lunar: false, day: 3, month: 2 },
  { id: 'valentine', title: 'Lễ Tình nhân', note: 'Valentine', lunar: false, day: 14, month: 2 },
  { id: 'thay-thuoc', title: 'Ngày Thầy thuốc Việt Nam', note: 'Tôn vinh y bác sĩ', lunar: false, day: 27, month: 2 },
  { id: 'quoc-te-phu-nu', title: 'Quốc tế Phụ nữ', note: 'Ngày 8/3', lunar: false, day: 8, month: 3 },
  { id: 'thanh-lap-doan', title: 'Thành lập Đoàn TNCS HCM', note: '26/3/1931', lunar: false, day: 26, month: 3 },
  { id: 'giai-phong', title: 'Giải phóng miền Nam', note: 'Thống nhất đất nước 30/4/1975', lunar: false, day: 30, month: 4 },
  { id: 'quoc-te-lao-dong', title: 'Quốc tế Lao động', note: 'Ngày 1/5', lunar: false, day: 1, month: 5 },
  { id: 'dien-bien-phu', title: 'Chiến thắng Điện Biên Phủ', note: '7/5/1954', lunar: false, day: 7, month: 5 },
  { id: 'sinh-nhat-bac', title: 'Sinh nhật Bác Hồ', note: '19/5/1890', lunar: false, day: 19, month: 5 },
  { id: 'thieu-nhi', title: 'Quốc tế Thiếu nhi', note: 'Ngày 1/6', lunar: false, day: 1, month: 6 },
  { id: 'gia-dinh', title: 'Ngày Gia đình Việt Nam', note: 'Ngày 28/6', lunar: false, day: 28, month: 6 },
  { id: 'thuong-binh', title: 'Ngày Thương binh – Liệt sĩ', note: 'Ngày 27/7', lunar: false, day: 27, month: 7 },
  { id: 'cach-mang-t8', title: 'Cách mạng Tháng Tám', note: '19/8/1945', lunar: false, day: 19, month: 8 },
  { id: 'quoc-khanh', title: 'Quốc khánh', note: 'Ngày Độc lập 2/9/1945', lunar: false, day: 2, month: 9 },
  { id: 'giai-phong-thu-do', title: 'Giải phóng Thủ đô', note: '10/10/1954', lunar: false, day: 10, month: 10 },
  { id: 'phu-nu-vn', title: 'Ngày Phụ nữ Việt Nam', note: 'Ngày 20/10', lunar: false, day: 20, month: 10 },
  { id: 'halloween', title: 'Halloween', note: 'Lễ hội hóa trang', lunar: false, day: 31, month: 10 },
  { id: 'nha-giao', title: 'Ngày Nhà giáo Việt Nam', note: 'Ngày 20/11', lunar: false, day: 20, month: 11 },
  { id: 'van-hoa-vn', title: 'Ngày Văn hóa Việt Nam', note: 'Ngày 24/11, nghỉ hưởng nguyên lương từ năm 2026', lunar: false, day: 24, month: 11 },
  { id: 'quan-doi', title: 'Thành lập QĐND Việt Nam', note: 'Ngày 22/12', lunar: false, day: 22, month: 12 },
  { id: 'giang-sinh', title: 'Lễ Giáng sinh', note: 'Noel 24–25/12', lunar: false, day: 24, month: 12, days: 2 },
];

/** Public days off per year, from the app's OfficialDayOff table. `confirmed` = Government approved. */
export const DAYS_OFF: { label: string; start: [number, number, number]; end: [number, number, number]; confirmed: boolean }[] = [
  { label: 'Ngày Văn hóa Việt Nam', start: [24, 11, 2026], end: [24, 11, 2026], confirmed: true },
  { label: 'Tết Dương lịch 2027', start: [1, 1, 2027], end: [3, 1, 2027], confirmed: false },
  { label: 'Tết Nguyên Đán Đinh Mùi', start: [4, 2, 2027], end: [10, 2, 2027], confirmed: true },
  { label: 'Giỗ Tổ Hùng Vương 2027', start: [16, 4, 2027], end: [18, 4, 2027], confirmed: false },
  { label: '30/4 và 1/5 năm 2027', start: [30, 4, 2027], end: [3, 5, 2027], confirmed: false },
  { label: 'Quốc khánh 2027', start: [2, 9, 2027], end: [5, 9, 2027], confirmed: true },
  { label: 'Ngày Văn hóa Việt Nam 2027', start: [24, 11, 2027], end: [24, 11, 2027], confirmed: false },
];

/** Cities used for sunrise and sunset. */
export const CITIES = [
  { id: 'ha-noi', name: 'Hà Nội', lat: 21.0285, lon: 105.8542 },
  { id: 'tp-hcm', name: 'TP. Hồ Chí Minh', lat: 10.7769, lon: 106.7009 },
];
