// Sunrise, sunset and moon phase for a calendar day in Vietnam (UTC+7).
// Sun: NOAA solar position algorithm (accurate to about a minute at these latitudes).
// Moon: mean synodic month from a reference new moon, accurate to a few hours, which is
// enough to name the phase and the illuminated fraction for a whole day.

const RAD = Math.PI / 180;
const TZ = 7;

/** Julian day number (noon UT) for a Gregorian date. */
function julianDay(d: number, m: number, y: number) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

/** Minutes after local midnight of sunrise (rise = true) or sunset, or null in polar day/night. */
function sunEvent(d: number, m: number, y: number, lat: number, lon: number, rise: boolean) {
  let minutes = 720;
  // Two passes: the second uses the time found by the first, as NOAA recommends.
  for (let pass = 0; pass < 2; pass += 1) {
    const jd = julianDay(d, m, y) - 0.5 + (minutes - TZ * 60) / 1440;
    const t = (jd - 2451545) / 36525;
    const l0 = (280.46646 + t * (36000.76983 + 0.0003032 * t)) % 360;
    const mAnom = 357.52911 + t * (35999.05029 - 0.0001537 * t);
    const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
    const c = Math.sin(mAnom * RAD) * (1.914602 - t * (0.004817 + 0.000014 * t)) + Math.sin(2 * mAnom * RAD) * (0.019993 - 0.000101 * t) + Math.sin(3 * mAnom * RAD) * 0.000289;
    const omega = 125.04 - 1934.136 * t;
    const lambda = l0 + c - 0.00569 - 0.00478 * Math.sin(omega * RAD);
    const eps0 = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
    const eps = eps0 + 0.00256 * Math.cos(omega * RAD);
    const decl = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD));
    const yv = Math.tan((eps / 2) * RAD) ** 2;
    const eqTime = 4 / RAD * (yv * Math.sin(2 * l0 * RAD) - 2 * e * Math.sin(mAnom * RAD) + 4 * e * yv * Math.sin(mAnom * RAD) * Math.cos(2 * l0 * RAD) - 0.5 * yv * yv * Math.sin(4 * l0 * RAD) - 1.25 * e * e * Math.sin(2 * mAnom * RAD));
    const cosH = (Math.cos(90.833 * RAD) - Math.sin(lat * RAD) * Math.sin(decl)) / (Math.cos(lat * RAD) * Math.cos(decl));
    if (cosH > 1 || cosH < -1) return null;
    const ha = Math.acos(cosH) / RAD;
    minutes = 720 - 4 * (lon + (rise ? ha : -ha)) - eqTime + TZ * 60;
  }
  return minutes;
}

const hhmm = (minutes: number) => {
  const total = Math.round(minutes);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

export interface SunTimes { rise: string; set: string; noon: string; length: string; riseMin: number; setMin: number }

export function sunTimes(d: number, m: number, y: number, lat: number, lon: number): SunTimes | null {
  const rise = sunEvent(d, m, y, lat, lon, true);
  const set = sunEvent(d, m, y, lat, lon, false);
  if (rise === null || set === null) return null;
  const len = set - rise;
  return { rise: hhmm(rise), set: hhmm(set), noon: hhmm((rise + set) / 2), length: `${Math.floor(len / 60)} giờ ${Math.round(len % 60)} phút`, riseMin: rise, setMin: set };
}

const SYNODIC = 29.530588853;
/** A new moon: 2000-01-06 18:14 UT. */
const NEW_MOON_REF = 2451550.25972;

export const MOON_PHASES = [
  'Trăng non', 'Trăng lưỡi liềm đầu tháng', 'Trăng bán nguyệt đầu tháng', 'Trăng khuyết đầu tháng',
  'Trăng tròn', 'Trăng khuyết cuối tháng', 'Trăng bán nguyệt cuối tháng', 'Trăng lưỡi liềm cuối tháng',
];

export interface MoonInfo { age: number; illumination: number; phase: number; name: string; waxing: boolean }

/** Moon at 21:00 Vietnam time, when people look for it in the evening sky. */
export function moonInfo(d: number, m: number, y: number): MoonInfo {
  const jd = julianDay(d, m, y) - 0.5 + (21 - TZ) / 24;
  const age = (((jd - NEW_MOON_REF) % SYNODIC) + SYNODIC) % SYNODIC;
  const illumination = (1 - Math.cos((2 * Math.PI * age) / SYNODIC)) / 2;
  const phase = Math.floor(((age / SYNODIC) * 8 + 0.5)) % 8;
  return { age, illumination, phase, name: MOON_PHASES[phase], waxing: age < SYNODIC / 2 };
}
