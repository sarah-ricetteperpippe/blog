type EntryWithHeroImage = {
  id: string;
  data: {
    heroImage?: string;
    translationKey?: string;
  };
};

export function createHeroImageResolver<T extends EntryWithHeroImage>(entries: readonly T[]) {
  const entriesByTranslationKey = new Map<string, T[]>();

  for (const entry of entries) {
    const key = entry.data.translationKey;
    if (!key) continue;
    const group = entriesByTranslationKey.get(key);
    if (group) {
      group.push(entry);
    } else {
      entriesByTranslationKey.set(key, [entry]);
    }
  }

  return (entry: T): string | undefined => {
    if (entry.data.heroImage) return entry.data.heroImage;

    const key = entry.data.translationKey;
    if (!key) return undefined;

    const siblings = entriesByTranslationKey.get(key) ?? [];

    for (const langPrefix of ['it/', 'en/', 'fr/']) {
      const match = siblings.find(candidate => candidate.data.heroImage && candidate.id.startsWith(langPrefix));
      if (match?.data.heroImage) return match.data.heroImage;
    }

    return siblings.find(candidate => candidate.data.heroImage)?.data.heroImage;
  };
}
