// Helpers to read/write per-recipe stats in Supabase.
// All functions degrade gracefully (return 0 / no-op) if Supabase is not
// configured or the network call fails — the static site keeps rendering.

import { getSupabase } from './supabase';

export async function incrementView(slug: string): Promise<number> {
  const supa = getSupabase();
  if (!supa) return 0;
  const { data, error } = await supa.rpc('increment_view', { recipe_slug: slug });
  if (error) {
    console.error('incrementView failed', error);
    return 0;
  }
  return Number(data) || 0;
}

export async function incrementLike(slug: string): Promise<number> {
  const supa = getSupabase();
  if (!supa) return 0;
  const { data, error } = await supa.rpc('increment_like', { recipe_slug: slug });
  if (error) {
    console.error('incrementLike failed', error);
    return 0;
  }
  return Number(data) || 0;
}

export async function decrementLike(slug: string): Promise<number> {
  const supa = getSupabase();
  if (!supa) return 0;
  const { data, error } = await supa.rpc('decrement_like', { recipe_slug: slug });
  if (error) {
    console.error('decrementLike failed', error);
    return 0;
  }
  return Number(data) || 0;
}

export async function getViewCounts(slugs: string[]): Promise<Record<string, number>> {
  if (slugs.length === 0) return {};
  const supa = getSupabase();
  if (!supa) return {};
  const { data, error } = await supa
    .from('recipe_views')
    .select('slug, count')
    .in('slug', slugs);
  if (error || !data) {
    if (error) console.error('getViewCounts failed', error);
    return {};
  }
  return Object.fromEntries(data.map((r: { slug: string; count: number }) => [r.slug, Number(r.count)]));
}

export async function getViewCount(slug: string): Promise<number> {
  const counts = await getViewCounts([slug]);
  return counts[slug] ?? 0;
}

export async function getCommentCount(slug: string): Promise<number> {
  const supa = getSupabase();
  if (!supa) return 0;
  const { count, error } = await supa
    .from('recipe_comments')
    .select('id', { count: 'exact', head: true })
    .eq('slug', slug)
    .eq('approved', true);
  if (error) {
    console.error('getCommentCount failed', error);
    return 0;
  }
  return count ?? 0;
}
