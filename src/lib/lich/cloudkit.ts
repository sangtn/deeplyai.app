// Read-only view of the Lịch Việt app's iCloud data (CloudKit JS), for the web.
// Never writes to iCloud: the app owns that data. Records are mapped to the web's local
// anniversary format so visitors can copy them into the browser-only tools.
//
// Record types and fields mirror the app (CloudSyncService.swift, FamilyCalendarService.swift):
//   private zone "LichVietZone":  Event { eventName, isLunar, lunarDay, lunarMonth, lunarYear, lunarLeap, eventDate, eventType, note }
//   shared zones "FamilyCalendar-*": FamilyInfo { title }, FamilyEvent { name, isLunar, lunarDay, lunarMonth, lunarYear, solarDate, eventType, assignee, note }

import type { EventKind, PersonalEvent } from './anniversary';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Fields = Record<string, { value: any } | undefined>;
export interface CkRecord { recordName: string; recordType: string; fields: Fields }

const v = (f: Fields, k: string) => f[k]?.value;
const KIND: Record<number, EventKind> = { 1: 'gio', 2: 'ky-niem', 3: 'sinh-nhat' };

export function toPersonalEvent(r: CkRecord): PersonalEvent | null {
  const f = r.fields;
  const title = String(v(f, 'eventName') ?? v(f, 'name') ?? '').trim();
  if (!title) return null;
  const lunar = Boolean(Number(v(f, 'isLunar') ?? 0));
  let day: number, month: number, year: number | undefined;
  if (lunar) {
    day = Number(v(f, 'lunarDay')); month = Number(v(f, 'lunarMonth')); year = Number(v(f, 'lunarYear')) || undefined;
  } else {
    const ts = Number(v(f, 'eventDate') ?? v(f, 'solarDate'));
    if (!ts) return null;
    // CloudKit timestamps are ms since epoch; read the date in Vietnam time.
    const d = new Date(ts + 7 * 3600 * 1000);
    day = d.getUTCDate(); month = d.getUTCMonth() + 1; year = d.getUTCFullYear();
  }
  if (!(day >= 1 && day <= 31 && month >= 1 && month <= 12)) return null;
  const note = [v(f, 'note'), v(f, 'assignee') ? `Phụ trách: ${v(f, 'assignee')}` : ''].filter(Boolean).join(' · ');
  return { id: `icloud-${r.recordName}`, title, kind: KIND[Number(v(f, 'eventType'))] ?? 'khac', calendar: lunar ? 'lunar' : 'solar', day, month, year, note: note || undefined, createdAt: new Date().toISOString() };
}

const SCRIPT = 'https://cdn.apple-cloudkit.com/ck/2/cloudkit.js';

export function loadCloudKit(): Promise<any> {
  const w = window as any;
  if (w.CloudKit) return Promise.resolve(w.CloudKit);
  return new Promise((resolve, reject) => {
    const s = Object.assign(document.createElement('script'), { src: SCRIPT, async: true });
    s.onload = () => resolve(w.CloudKit);
    s.onerror = () => reject(new Error('cloudkit.js'));
    document.head.append(s);
  });
}

async function zoneRecords(db: any, zoneName: string, ownerRecordName?: string): Promise<CkRecord[]> {
  const zoneID = ownerRecordName ? { zoneName, ownerRecordName } : { zoneName };
  const out: CkRecord[] = [];
  let syncToken: string | undefined;
  for (let i = 0; i < 20; i += 1) {
    const res = await db.fetchRecordZoneChanges({ zoneID, syncToken, resultsLimit: 200 });
    if (res.hasErrors) throw res.errors[0];
    const zone = res.zones?.[0];
    out.push(...(zone?.records ?? []).filter((r: any) => !r.deleted));
    if (!zone?.moreComing) break;
    syncToken = zone.syncToken;
  }
  return out;
}

/** Personal events (private zone) and family calendars shared with the signed-in user. */
export async function readAppData(container: any) {
  const personal = await zoneRecords(container.privateCloudDatabase, 'LichVietZone').catch(() => [] as CkRecord[]);
  const families: { title: string; events: CkRecord[] }[] = [];
  for (const db of [container.privateCloudDatabase, container.sharedCloudDatabase]) {
    const zones = await db.fetchAllRecordZones().catch(() => null);
    for (const z of zones?.zones ?? []) {
      if (!String(z.zoneID?.zoneName ?? '').startsWith('FamilyCalendar-')) continue;
      const recs = await zoneRecords(db, z.zoneID.zoneName, z.zoneID.ownerRecordName).catch(() => [] as CkRecord[]);
      const info = recs.find((r) => r.recordType === 'FamilyInfo');
      families.push({ title: String(info?.fields.title?.value ?? 'Lịch Nhà'), events: recs.filter((r) => r.recordType === 'FamilyEvent') });
    }
  }
  return { personal: personal.filter((r) => r.recordType === 'Event'), families };
}
