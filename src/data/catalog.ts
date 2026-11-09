import storeData from './apps.json';

export type GroupSlug = 'car-driving' | 'weather-sky' | 'watch-devices' | 'work-planning' | 'create-make' | 'life-travel';

export const GROUPS: Record<GroupSlug, { name: string; nameVi: string; blurb: string; blurbVi: string; title: string; description: string; intro: string }> = {
  'car-driving': {
    name: 'On the road', nameVi: 'Trên đường',
    blurb: 'Dash cams, truck routing, fuel prices and CarPlay tools.',
    blurbVi: 'Camera hành trình, định tuyến xe tải, giá nhiên liệu và công cụ CarPlay.',
    title: 'Car & Driving Apps for iPhone and CarPlay – DeeplyAi',
    description: 'DeeplyAi apps for drivers: dash cam recording, truck GPS routing, fuel prices, EV data, route weather and CarPlay widgets.',
    intro: 'Tools for people who spend real time behind the wheel, whether that means a daily commute, a long-haul truck, an electric car or a weekend away in an RV.',
  },
  'weather-sky': {
    name: 'Weather & sky', nameVi: 'Thời tiết & bầu trời',
    blurb: 'Forecast widgets, wind, sunsets, stars and satellites.',
    blurbVi: 'Widget dự báo, gió, hoàng hôn, các vì sao và vệ tinh.',
    title: 'Weather, Astronomy & Sky Apps for iPhone – DeeplyAi',
    description: 'DeeplyAi weather and sky apps: forecast widgets, wind compass, sunset predictions, aviation weather, star maps and satellite tracking.',
    intro: 'Apps for looking up, from what the next hour of weather holds to which planet is sitting above the horizon tonight.',
  },
  'watch-devices': {
    name: 'Watch & devices', nameVi: 'Đồng hồ & thiết bị',
    blurb: 'Apple Watch media, PDFs, headphones and call screening.',
    blurbVi: 'Đa phương tiện trên Apple Watch, PDF, tai nghe và lọc cuộc gọi.',
    title: 'Apple Watch & Device Utility Apps – DeeplyAi',
    description: 'DeeplyAi utilities for your devices: Apple Watch video and article playback, PDF reading on the wrist, headphone widgets and caller ID.',
    intro: 'Small utilities that get more out of the hardware you already own, especially the screen on your wrist.',
  },
  'work-planning': {
    name: 'Work & planning', nameVi: 'Công việc & kế hoạch',
    blurb: 'Planners, time tracking, estimates, contracts and scripts.',
    blurbVi: 'Lịch kế hoạch, theo dõi giờ làm, dự toán, hợp đồng và kịch bản.',
    title: 'Productivity & Business Apps for iPhone – DeeplyAi',
    description: 'DeeplyAi productivity apps: daily planners, hours tracking, cost estimates, contract drafting, teleprompter and subscription management.',
    intro: 'Focused apps for freelancers, small businesses and anyone trying to keep a day, a budget or a project under control.',
  },
  'create-make': {
    name: 'Create & make', nameVi: 'Sáng tạo & thủ công',
    blurb: 'Text on curves, paint previews, sewing and crochet.',
    blurbVi: 'Chữ theo đường cong, xem trước màu sơn, may vá và móc len.',
    title: 'Creative & Craft Apps for iPhone – DeeplyAi',
    description: 'DeeplyAi apps for making things: curved text on photos, wall and car paint previews, sewing lessons, crochet tools and kids art scanning.',
    intro: 'Apps that help you see an idea before committing to it, learn a craft from scratch or keep what you have made.',
  },
  'life-travel': {
    name: 'Life & travel', nameVi: 'Đời sống & du lịch',
    blurb: 'Lunar calendars, trip budgets, gardens and daily habits.',
    blurbVi: 'Lịch âm, ngân sách chuyến đi, làm vườn và thói quen hằng ngày.',
    title: 'Lifestyle & Travel Apps for iPhone – DeeplyAi',
    description: 'DeeplyAi lifestyle and travel apps: Vietnamese lunar calendar, trip budgets, country day tracking, garden planning and daily rituals.',
    intro: 'Everyday companions for home, health and time away, including a Vietnamese lunar calendar made for family traditions.',
  },
};

const G = {
  c: 'car-driving', s: 'weather-sky', d: 'watch-devices', w: 'work-planning', m: 'create-make', l: 'life-travel',
} as const;

// id: [group, display name, one-line description]
const ENTRIES: Record<number, [GroupSlug, string, string]> = {
  6755303976: [G.c, 'Car Play Connect', 'Turn your iPhone or iPad into a smart car dashboard.'],
  6788231631: [G.c, 'RoadCam', 'A dual-camera dash cam with map and speed on one screen.'],
  6761090999: [G.c, 'Fuel Finder', 'The cheapest fuel near you, with widgets and CarPlay.'],
  6798993599: [G.c, 'Truck GPS', 'Truck routes that show which bridges they avoid and why.'],
  6813466991: [G.c, 'EVPeek', 'A second instrument cluster for your electric car.'],
  6757487560: [G.c, 'CarWidget', 'Design and rotate your own CarPlay widgets.'],
  6796624138: [G.c, 'Drive Weather', 'The weather at each point of your route, when you reach it.'],
  6761839487: [G.c, 'Car Key Connect', 'Track fuel costs, maintenance and vehicle expenses.'],
  6814069808: [G.c, 'GapMeter', 'Measure your following distance with the iPhone camera.'],
  6761701772: [G.c, 'Boating Navigation', 'Plan routes and track your boat, even offline.'],
  6793785085: [G.c, 'RV Camping Planner', 'A trip planner built for RVers and van-lifers.'],
  6758051740: [G.c, 'Loc Saver', 'Explore, simulate and save locations.'],
  6759792594: [G.s, 'Weather Widgets', 'Live weather on your Home Screen, Lock Screen and CarPlay.'],
  6790243989: [G.s, 'Sky Map', 'Point your phone up to identify stars and planets offline.'],
  6789012110: [G.s, 'WindGlance', 'Wind direction across widgets and every Apple surface.'],
  6766157300: [G.s, 'Solara', 'Sunrise and sunset predictions with daily insights.'],
  6804917488: [G.s, 'Aviation Weather', 'Route weather for pilots, with the reasoning shown.'],
  6782777113: [G.s, 'Satellite Tracker', 'Follow the ISS and Starlink on a live 3D sky.'],
  6762106958: [G.d, 'WristNet', 'Hear articles and play videos on Apple Watch, offline.'],
  6761654564: [G.d, 'WristView', 'Read PDF, Word and Excel files on Apple Watch.'],
  6756883155: [G.d, 'Speakers & Headphones Connect', 'Widgets and controls for your audio devices.'],
  6751200315: [G.d, 'WhoCall', 'Identify and block spam calls.'],
  6760746720: [G.w, 'Text Export', 'Export message conversations from iPhone to PDF.'],
  6752650705: [G.w, 'Deeply AI Search', 'Research topics across the web with AI analysis.'],
  6762453773: [G.w, 'Hours Tracker', 'Privacy-first time and pay tracking for freelancers.'],
  6764017994: [G.w, 'Sendra', 'Schedule messages so you never miss a birthday.'],
  6771234038: [G.w, 'AI Contract Maker', 'Draft contracts for freelancers and small businesses.'],
  6768527600: [G.w, 'Teleprompter AI', 'A speaking studio for creators, coaches and educators.'],
  6769697833: [G.w, 'BuildWise', 'Cost estimating tools for building projects.'],
  6753096857: [G.w, 'SubMate', 'Keep every subscription and renewal in one place.'],
  6783215742: [G.w, 'Dayli', 'Plan your whole day on a simple grid.'],
  6744894638: [G.w, 'Days', 'Calendar, to-dos and habits in a single timeline.'],
  6777743758: [G.w, 'Dately', 'Your schedule and habits on the Lock Screen.'],
  6786546016: [G.w, 'TaskCam', 'Resume hands-on tasks right where they were interrupted.'],
  6796565605: [G.m, 'Kerve', 'Draw a line and your text follows it.'],
  6768212643: [G.m, 'Hueza', 'Preview paint colors on your walls before you buy.'],
  6790693691: [G.m, 'Car Paint Studio', 'See a repaint or wrap on your car first.'],
  6762716650: [G.m, 'ArtBox', 'Scan and organize your children’s artwork.'],
  6774539735: [G.m, 'YarnFlow', 'Learn and organize crochet and knitting.'],
  6761453914: [G.m, 'SewingTut', 'Learn sewing step by step from zero.'],
  6749473194: [G.l, 'Lịch Vạn Niên', 'A Vietnamese lunar calendar across all your Apple devices.'],
  6761303975: [G.l, 'Travel Spend', 'Track and budget your travel spending.'],
  6767432019: [G.l, 'Gardenio', 'A personal assistant for growing your garden.'],
  6773634164: [G.l, 'Tanly', 'Personalized UV insights and sun exposure tracking.'],
  6785721075: [G.l, 'Tourly', 'Track campus visits and compare colleges.'],
  6761172396: [G.l, 'Vibe Reset', 'Short daily rituals in place of long to-do lists.'],
  6779925086: [G.l, 'Hueva', 'Find your skin tone and personal color profile.'],
  6763552611: [G.l, 'ZenBlock', 'Mindful interruptions to reduce screen time.'],
  6780729603: [G.l, 'Chory', 'Explore patterns in your messaging habits.'],
  6775489025: [G.l, 'Stayy', 'Count days per country as a nomad or frequent traveler.'],
  6779493286: [G.l, 'Home Maintenance', 'Appliances, warranties and upkeep in one private place.'],
  6776571050: [G.l, 'SportVenture', 'A travel companion for matchday trips.'],
};

export type CatalogApp = (typeof storeData)[number] & { group: GroupSlug; name: string; line: string };

// Newly released apps appear automatically, under their App Store name, until catalogd above.
export const APPS: CatalogApp[] = storeData.map((app) => {
  const [group, name, line] = ENTRIES[app.id] ?? (['life-travel', app.storeName, `${app.genre} app for iPhone.`] as const);
  return { ...app, group, name, line };
});

export const GROUP_SLUGS = Object.keys(GROUPS) as GroupSlug[];
export const byId = new Map(APPS.map((app) => [app.id, app]));
export const inGroup = (group: GroupSlug) => APPS.filter((app) => app.group === group);

/** Ratings are shown, and declared as structured data, only with enough reviews to mean something. */
export const hasRating = (app: { ratingCount: number }) => app.ratingCount >= 3;
