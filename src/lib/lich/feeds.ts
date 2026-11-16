// Subscribable calendars (iCalendar feeds) built at deploy time from the almanac.
import { almanac, holidaysOfYear, lunarMonthName } from './engine';
import { fromJd, jdFromDate } from '../../components/lich-viet/lunar';
import { buildIcs, type IcsEvent } from './ics';
import { RAM_MUNG_MOT } from './vankhan';
import { dayUrl, hasDayPage, vanKhanUrl } from './urls';

const SITE = 'https://deeplyai.app';
export const FEEDS = [
  { id: 'ram-mung-1', name: 'Rằm và mùng 1 (Lịch Việt)', title: 'Rằm và mùng một', text: 'Nhắc mùng 1 và ngày rằm hằng tháng âm lịch, kèm bài văn khấn.' },
  { id: 'ngay-le', name: 'Ngày lễ Việt Nam (Lịch Việt)', title: 'Ngày lễ Việt Nam', text: 'Tết, lễ cổ truyền theo âm lịch và các ngày lễ dương lịch.' },
  { id: 'am-lich', name: 'Âm lịch hằng ngày (Lịch Việt)', title: 'Âm lịch mỗi ngày', text: 'Mỗi ngày hiện ngày âm lịch và can chi, như tờ lịch treo tường.' },
] as const;
export type FeedId = (typeof FEEDS)[number]['id'];
export const feedPath = (id: FeedId) => `/vi/lich-am/lich/${id}.ics`;

const link = (d: { day: number; month: number; year: number }) => (hasDayPage(d.year) ? `${SITE}${dayUrl(d.day, d.month, d.year)}` : undefined);

export function buildFeed(id: FeedId, now = new Date()) {
  const y = now.getFullYear();
  const start = jdFromDate(1, 1, id === 'am-lich' ? y - 1 : y - 1);
  const end = jdFromDate(31, 12, id === 'am-lich' ? y + 2 : y + 3);
  const meta = FEEDS.find((f) => f.id === id)!;
  const events: IcsEvent[] = [];
  if (id === 'ngay-le') {
    for (let yy = y - 1; yy <= y + 3; yy += 1) {
      for (const [jd, list] of holidaysOfYear(yy)) {
        const date = fromJd(jd);
        list.forEach((h, i) => events.push({ uid: `le-${jd}-${i}@deeplyai.app`, date, summary: h.title, description: h.note, url: link(date) }));
      }
    }
  } else {
    for (let jd = start; jd <= end; jd += 1) {
      const date = fromJd(jd);
      const a = almanac(date.day, date.month, date.year);
      const l = a.lunar;
      if (id === 'am-lich') {
        const good = a.hours.filter((h) => h.good).map((h) => h.chi).join(', ');
        events.push({
          uid: `al-${jd}@deeplyai.app`, date,
          summary: `${l.day}/${l.month}${l.leap ? 'N' : ''} ÂL · ${a.canChi}`,
          description: `Ngày ${l.day} ${lunarMonthName(l.month, l.leap).toLowerCase()} năm ${a.yearCanChi}. Ngày ${a.canChi}, tháng ${a.monthCanChi}. ${a.than} ${a.hoangDao ? 'hoàng đạo' : 'hắc đạo'}, trực ${a.truc.name}. Giờ hoàng đạo: ${good}.`,
          url: link(date),
        });
      } else if (l.day === 1 || l.day === 15) {
        events.push({
          uid: `rm-${jd}@deeplyai.app`, date,
          summary: `${l.day === 1 ? 'Mùng 1' : 'Rằm'} ${lunarMonthName(l.month, l.leap).toLowerCase()}`,
          description: `Ngày ${l.day}/${l.month} âm lịch năm ${a.yearCanChi}. Văn khấn: ${SITE}${vanKhanUrl(RAM_MUNG_MOT)}`,
          url: link(date),
          alarmMinutes: 720,
        });
      }
    }
  }
  return buildIcs({ name: meta.name, description: meta.text, events, refreshDays: 1 }, now);
}
