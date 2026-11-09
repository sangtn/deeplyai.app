import { APPS, type CatalogApp } from './catalog';

export type SurfaceSlug =
  | 'iphone' | 'ipad' | 'apple-watch' | 'carplay' | 'mac' | 'apple-vision'
  | 'widgets' | 'live-activities' | 'standby' | 'siri-shortcuts' | 'icloud';

// Curated from each app's own App Store listing. Check a claim there before adding an id:
// a name or marketing image is not evidence. Car Play Connect and RoadCam are driver apps confirmed not to be on CarPlay.
const CARPLAY = [6759792594, 6798993599, 6757487560, 6796624138, 6761090999, 6749473194, 6813466991, 6783215742];
const WIDGETS = [6759792594, 6798993599, 6757487560, 6790243989, 6789012110, 6756883155, 6796624138, 6761090999, 6749473194, 6793785085, 6777743758, 6761303975, 6804917488, 6813466991, 6782777113, 6788231631, 6764017994, 6753096857, 6766157300, 6761839487, 6773634164, 6783215742, 6779925086, 6775489025, 6762716650, 6779493286, 6776571050];
const LIVE = [6749473194, 6798993599, 6790243989, 6789012110, 6796624138, 6762453773, 6793785085, 6777743758, 6804917488, 6813466991, 6782777113, 6788231631, 6768527600, 6773634164, 6786546016, 6776571050];
const STANDBY = [6790243989, 6789012110, 6796624138, 6783215742];
const SIRI = [6749473194, 6761303975, 6804917488, 6813466991, 6782777113, 6788231631, 6786546016];
const ICLOUD = [6749473194, 6798993599, 6790243989, 6762453773, 6793785085, 6777743758, 6761303975, 6804917488, 6782777113, 6768527600, 6761839487, 6785721075, 6786546016, 6783215742, 6775489025];

const inList = (ids: number[]) => (app: CatalogApp) => ids.includes(app.id);

export interface Surface {
  slug: SurfaceSlug;
  kind: 'device' | 'experience';
  name: string;
  nameVi: string;
  line: string;
  lineVi: string;
  title: string;
  description: string;
  intro: string;
  detail: string;
  note?: string;
  matches: (app: CatalogApp) => boolean;
}

export const SURFACES: Surface[] = [
  {
    slug: 'iphone', kind: 'device', name: 'iPhone', nameVi: 'iPhone',
    line: 'Where every DeeplyAi app begins.', lineVi: 'Nơi mọi ứng dụng DeeplyAi bắt đầu.',
    title: 'iPhone Apps by DeeplyAi',
    description: 'Every DeeplyAi app runs on iPhone, from dash cams and truck routing to weather, planners and creative tools.',
    intro: 'iPhone is the home of the whole catalog. It is where you set things up, and the camera, GPS and sensors make many of these apps possible at all.',
    detail: 'Features that need the hardware, such as dual-camera recording or pointing your phone at the night sky, are designed for the device in your pocket first.',
    matches: () => true,
  },
  {
    slug: 'ipad', kind: 'device', name: 'iPad', nameVi: 'iPad',
    line: 'More room to plan and create.', lineVi: 'Thêm không gian để lập kế hoạch và sáng tạo.',
    title: 'iPad Apps by DeeplyAi',
    description: 'All DeeplyAi apps support iPad, giving more room for trip planning, documents, estimates and creative work.',
    intro: 'Every app in the catalog is available on iPad, where a larger canvas helps with work that benefits from seeing more at once.',
    detail: 'RV Camping Planner includes an iPad planning desk with drag-and-drop itinerary building, and Kerve has a dedicated iPad layout.',
    matches: () => true,
  },
  {
    slug: 'apple-watch', kind: 'device', name: 'Apple Watch', nameVi: 'Apple Watch',
    line: 'Glanceable, on your wrist.', lineVi: 'Xem nhanh ngay trên cổ tay.',
    title: 'Apple Watch Apps by DeeplyAi',
    description: 'DeeplyAi apps for Apple Watch: media and PDF readers, weather and wind, ISS spotting, row counters, fuel prices and more.',
    intro: 'A watch app has seconds to be useful. These apps put one piece of information or one action on your wrist.',
    detail: 'WristNet reads articles aloud and plays videos offline, WristView opens documents, Sky Map guides you to the ISS and YarnFlow counts your rows.',
    matches: (app) => Boolean(app.compatibility.watchOS),
  },
  {
    slug: 'carplay', kind: 'device', name: 'CarPlay', nameVi: 'CarPlay',
    line: 'Information sized for the road.', lineVi: 'Thông tin vừa đủ khi bạn lái xe.',
    title: 'CarPlay Apps & Widgets by DeeplyAi',
    description: 'DeeplyAi apps that work with CarPlay: truck navigation, fuel prices, route weather, EV charging, custom widgets and the lunar calendar.',
    intro: 'A car screen should ask for as little attention as possible. These apps show what matters on the display you already glance at.',
    detail: 'Truck GPS brings navigation to the dashboard, Fuel Finder shows the cheapest station, EVPeek adds a charging tab and CarWidget lets you design the screen.',
    note: 'Keep your attention on the road. Set up apps while parked.',
    matches: inList(CARPLAY),
  },
  {
    slug: 'mac', kind: 'device', name: 'Mac', nameVi: 'Mac',
    line: 'On Macs with Apple silicon.', lineVi: 'Trên máy Mac dùng chip Apple.',
    title: 'DeeplyAi Apps on Mac with Apple Silicon',
    description: 'DeeplyAi apps are available on Macs with Apple silicon through the App Store. Check each listing for the macOS version required.',
    intro: 'The App Store lists these apps as compatible with Macs that have an M1 chip or later, so you can use them on a larger screen.',
    detail: 'They are iPhone and iPad apps running on Mac, so features that rely on phone hardware, such as GPS or specific cameras, may differ or be unavailable.',
    note: 'Requires a Mac with Apple silicon. The macOS version varies by app.',
    matches: (app) => Boolean(app.compatibility.macOS),
  },
  {
    slug: 'apple-vision', kind: 'device', name: 'Apple Vision', nameVi: 'Apple Vision',
    line: 'Compatible on Apple Vision Pro.', lineVi: 'Tương thích với Apple Vision Pro.',
    title: 'DeeplyAi Apps Compatible with Apple Vision',
    description: 'Many DeeplyAi apps are listed on the App Store as compatible with Apple Vision, running as iPad apps in your space.',
    intro: 'The App Store lists these apps as compatible with Apple Vision, where they run in a window in your space.',
    detail: 'They are compatible iPhone and iPad apps, and are not built specifically for visionOS. Features that depend on phone sensors may differ.',
    matches: (app) => Boolean(app.compatibility.visionOS),
  },
  {
    slug: 'widgets', kind: 'experience', name: 'Widgets', nameVi: 'Widget',
    line: 'Answers without opening an app.', lineVi: 'Có câu trả lời mà không cần mở ứng dụng.',
    title: 'iPhone Widget Apps by DeeplyAi',
    description: 'DeeplyAi apps with Home Screen and Lock Screen widgets for weather, wind, stars, fuel prices, EVs, planners and more.',
    intro: 'The best widget means you never have to open the app. These extensions put live information on your Home Screen and Lock Screen.',
    detail: 'Weather Widgets offers more than 50 styles, Sky Map has 13 widgets, and CarWidget gives you 316 templates for your Home Screen and CarPlay.',
    matches: inList(WIDGETS),
  },
  {
    slug: 'live-activities', kind: 'experience', name: 'Live Activities & Dynamic Island', nameVi: 'Live Activities & Dynamic Island',
    line: 'Things in progress, always in view.', lineVi: 'Việc đang diễn ra, luôn trong tầm mắt.',
    title: 'Live Activities & Dynamic Island Apps | DeeplyAi',
    description: 'DeeplyAi apps using Live Activities and the Dynamic Island for routes, ISS passes, EV charging, work timers and match scores.',
    intro: 'Some things unfold over minutes or hours. Live Activities keep them on your Lock Screen and in the Dynamic Island while they happen.',
    detail: 'Follow an ISS pass in Sky Map, a charging session in EVPeek, your earnings in Hours Tracker or the current script line in Teleprompter AI.',
    matches: inList(LIVE),
  },
  {
    slug: 'standby', kind: 'experience', name: 'StandBy', nameVi: 'StandBy',
    line: 'For the nightstand and the mount.', lineVi: 'Cho đầu giường và giá đỡ.',
    title: 'iPhone StandBy Apps by DeeplyAi',
    description: 'DeeplyAi apps designed for iPhone StandBy, including a red nightstand sky view, wind readouts, route weather and your day plan.',
    intro: 'Turn a charging iPhone on its side and it becomes a small display. These apps have something worth showing there.',
    detail: 'Sky Map has a red Nightstand mode, while Drive Weather works on a nightstand or a car mount.',
    matches: inList(STANDBY),
  },
  {
    slug: 'siri-shortcuts', kind: 'experience', name: 'Siri & Shortcuts', nameVi: 'Siri & Phím tắt',
    line: 'Hands-free when your hands are busy.', lineVi: 'Rảnh tay khi bạn đang bận.',
    title: 'Siri & Shortcuts Apps by DeeplyAi',
    description: 'DeeplyAi apps that work with Siri and Shortcuts: save a dash cam clip, log an expense, check a METAR or resume a task by voice.',
    intro: 'Sometimes speaking is the only practical option. These apps offer actions you can trigger by voice or build into an automation.',
    detail: 'Save a moment in RoadCam, add an expense in Travel Spend, or ask TaskCam what you were doing.',
    matches: inList(SIRI),
  },
  {
    slug: 'icloud', kind: 'experience', name: 'iCloud sync', nameVi: 'Đồng bộ iCloud',
    line: 'Your data, across your devices.', lineVi: 'Dữ liệu của bạn, trên mọi thiết bị.',
    title: 'Apps with iCloud Sync by DeeplyAi',
    description: 'DeeplyAi apps that sync through your own iCloud account, including truck profiles, trip plans, schedules and tasks.',
    intro: 'These apps keep your data in step across your devices through your own iCloud account.',
    detail: 'Your trucks in Truck GPS, trips in RV Camping Planner and scripts in Teleprompter AI follow you from one device to the next.',
    matches: inList(ICLOUD),
  },
];

export const surfaceApps = (surface: Surface) => APPS.filter(surface.matches);
export const surfacesOf = (app: CatalogApp) => SURFACES.filter((surface) => surface.matches(app));
export const surfaceBySlug = new Map(SURFACES.map((surface) => [surface.slug, surface]));
