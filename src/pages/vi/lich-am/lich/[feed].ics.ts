import type { APIRoute } from 'astro';
import { FEEDS, buildFeed, type FeedId } from '../../../../lib/lich/feeds';

export function getStaticPaths() {
  return FEEDS.map((f) => ({ params: { feed: f.id } }));
}

export const GET: APIRoute = ({ params }) =>
  new Response(buildFeed(params.feed as FeedId), { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
