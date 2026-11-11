// Serves each extra page language as a flat { key: text } dictionary for the in-page
// language switcher, e.g. /apps/car-play-connect/i18n/fr.json.
import { TRANSLATIONS, flatten } from '../../../../components/car-connect/locales';

export function getStaticPaths() {
  return Object.keys(TRANSLATIONS).map((lang) => ({ params: { lang } }));
}

export function GET({ params }: { params: { lang: string } }) {
  const dict = flatten(TRANSLATIONS[params.lang]);
  return new Response(JSON.stringify(dict), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
