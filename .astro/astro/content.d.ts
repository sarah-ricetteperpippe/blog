declare module 'astro:content' {
	interface Render {
		'.mdx': Promise<{
			Content: import('astro').MarkdownInstance<{}>['Content'];
			headings: import('astro').MarkdownHeading[];
			remarkPluginFrontmatter: Record<string, any>;
			components: import('astro').MDXInstance<{}>['components'];
		}>;
	}
}

declare module 'astro:content' {
	interface RenderResult {
		Content: import('astro/runtime/server/index.js').AstroComponentFactory;
		headings: import('astro').MarkdownHeading[];
		remarkPluginFrontmatter: Record<string, any>;
	}
	interface Render {
		'.md': Promise<RenderResult>;
	}

	export interface RenderedContent {
		html: string;
		metadata?: {
			imagePaths: Array<string>;
			[key: string]: unknown;
		};
	}
}

declare module 'astro:content' {
	type Flatten<T> = T extends { [K: string]: infer U } ? U : never;

	export type CollectionKey = keyof AnyEntryMap;
	export type CollectionEntry<C extends CollectionKey> = Flatten<AnyEntryMap[C]>;

	export type ContentCollectionKey = keyof ContentEntryMap;
	export type DataCollectionKey = keyof DataEntryMap;

	type AllValuesOf<T> = T extends any ? T[keyof T] : never;
	type ValidContentEntrySlug<C extends keyof ContentEntryMap> = AllValuesOf<
		ContentEntryMap[C]
	>['slug'];

	/** @deprecated Use `getEntry` instead. */
	export function getEntryBySlug<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		// Note that this has to accept a regular string too, for SSR
		entrySlug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;

	/** @deprecated Use `getEntry` instead. */
	export function getDataEntryById<C extends keyof DataEntryMap, E extends keyof DataEntryMap[C]>(
		collection: C,
		entryId: E,
	): Promise<CollectionEntry<C>>;

	export function getCollection<C extends keyof AnyEntryMap, E extends CollectionEntry<C>>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => entry is E,
	): Promise<E[]>;
	export function getCollection<C extends keyof AnyEntryMap>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => unknown,
	): Promise<CollectionEntry<C>[]>;

	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(entry: {
		collection: C;
		slug: E;
	}): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(entry: {
		collection: C;
		id: E;
	}): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		slug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(
		collection: C,
		id: E,
	): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;

	/** Resolve an array of entry references from the same collection */
	export function getEntries<C extends keyof ContentEntryMap>(
		entries: {
			collection: C;
			slug: ValidContentEntrySlug<C>;
		}[],
	): Promise<CollectionEntry<C>[]>;
	export function getEntries<C extends keyof DataEntryMap>(
		entries: {
			collection: C;
			id: keyof DataEntryMap[C];
		}[],
	): Promise<CollectionEntry<C>[]>;

	export function render<C extends keyof AnyEntryMap>(
		entry: AnyEntryMap[C][string],
	): Promise<RenderResult>;

	export function reference<C extends keyof AnyEntryMap>(
		collection: C,
	): import('astro/zod').ZodEffects<
		import('astro/zod').ZodString,
		C extends keyof ContentEntryMap
			? {
					collection: C;
					slug: ValidContentEntrySlug<C>;
				}
			: {
					collection: C;
					id: keyof DataEntryMap[C];
				}
	>;
	// Allow generic `string` to avoid excessive type errors in the config
	// if `dev` is not running to update as you edit.
	// Invalid collection names will be caught at build time.
	export function reference<C extends string>(
		collection: C,
	): import('astro/zod').ZodEffects<import('astro/zod').ZodString, never>;

	type ReturnTypeOrOriginal<T> = T extends (...args: any[]) => infer R ? R : T;
	type InferEntrySchema<C extends keyof AnyEntryMap> = import('astro/zod').infer<
		ReturnTypeOrOriginal<Required<ContentConfig['collections'][C]>['schema']>
	>;

	type ContentEntryMap = {
		"academy": {
"en/soffritto-perfetto.md": {
	id: "en/soffritto-perfetto.md";
  slug: "en/soffritto-perfetto";
  body: string;
  collection: "academy";
  data: InferEntrySchema<"academy">
} & { render(): Render[".md"] };
"fr/soffritto-perfetto.md": {
	id: "fr/soffritto-perfetto.md";
  slug: "fr/soffritto-perfetto";
  body: string;
  collection: "academy";
  data: InferEntrySchema<"academy">
} & { render(): Render[".md"] };
"it/soffritto-perfetto.md": {
	id: "it/soffritto-perfetto.md";
  slug: "it/soffritto-perfetto";
  body: string;
  collection: "academy";
  data: InferEntrySchema<"academy">
} & { render(): Render[".md"] };
};
"blog": {
"en/pasta-con-feta-al-forno-e-pomodorini.md": {
	id: "en/pasta-con-feta-al-forno-e-pomodorini.md";
  slug: "en/pasta-con-feta-al-forno-e-pomodorini";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"fr/pasta-con-feta-al-forno-e-pomodorini.md": {
	id: "fr/pasta-con-feta-al-forno-e-pomodorini.md";
  slug: "fr/pasta-con-feta-al-forno-e-pomodorini";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/alberelli-natalizi-di-brie-o-camembert.md": {
	id: "it/alberelli-natalizi-di-brie-o-camembert.md";
  slug: "it/alberelli-natalizi-di-brie-o-camembert";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/bistecche-di-funghi-strepitose.md": {
	id: "it/bistecche-di-funghi-strepitose.md";
  slug: "it/bistecche-di-funghi-strepitose";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/brodo-vegetale-base.md": {
	id: "it/brodo-vegetale-base.md";
  slug: "it/brodo-vegetale-base";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/cheesecake-alle-fragole.md": {
	id: "it/cheesecake-alle-fragole.md";
  slug: "it/cheesecake-alle-fragole";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/chocolate-chip-cookies.md": {
	id: "it/chocolate-chip-cookies.md";
  slug: "it/chocolate-chip-cookies";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/cotolette-di-funghi-cardoncelli.md": {
	id: "it/cotolette-di-funghi-cardoncelli.md";
  slug: "it/cotolette-di-funghi-cardoncelli";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/crema-base-per-cheesecake.md": {
	id: "it/crema-base-per-cheesecake.md";
  slug: "it/crema-base-per-cheesecake";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/crostata-morbida-al-cacao-con-ganache.md": {
	id: "it/crostata-morbida-al-cacao-con-ganache.md";
  slug: "it/crostata-morbida-al-cacao-con-ganache";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/curry-di-tofu-con-riso-basmati.md": {
	id: "it/curry-di-tofu-con-riso-basmati.md";
  slug: "it/curry-di-tofu-con-riso-basmati";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/finto-risotto-alla-parmigiana.md": {
	id: "it/finto-risotto-alla-parmigiana.md";
  slug: "it/finto-risotto-alla-parmigiana";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/fonduta-all-italiana-fantasiosa.md": {
	id: "it/fonduta-all-italiana-fantasiosa.md";
  slug: "it/fonduta-all-italiana-fantasiosa";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/frittata-alla-menta.md": {
	id: "it/frittata-alla-menta.md";
  slug: "it/frittata-alla-menta";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/funghi-trifolati.md": {
	id: "it/funghi-trifolati.md";
  slug: "it/funghi-trifolati";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/hummus-delicato.md": {
	id: "it/hummus-delicato.md";
  slug: "it/hummus-delicato";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/insalata-di-zucchine-feta-e-cipolla-rossa.md": {
	id: "it/insalata-di-zucchine-feta-e-cipolla-rossa.md";
  slug: "it/insalata-di-zucchine-feta-e-cipolla-rossa";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/pasta-con-feta-al-forno-e-pomodorini.md": {
	id: "it/pasta-con-feta-al-forno-e-pomodorini.md";
  slug: "it/pasta-con-feta-al-forno-e-pomodorini";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/pasta-e-lenticchie.md": {
	id: "it/pasta-e-lenticchie.md";
  slug: "it/pasta-e-lenticchie";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/pasta-svelta-alla-feta.md": {
	id: "it/pasta-svelta-alla-feta.md";
  slug: "it/pasta-svelta-alla-feta";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/pesto-di-rucola.md": {
	id: "it/pesto-di-rucola.md";
  slug: "it/pesto-di-rucola";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/pizzette-di-melanzane-al-forno.md": {
	id: "it/pizzette-di-melanzane-al-forno.md";
  slug: "it/pizzette-di-melanzane-al-forno";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/ragu-bianco-di-tempeh.md": {
	id: "it/ragu-bianco-di-tempeh.md";
  slug: "it/ragu-bianco-di-tempeh";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/red-velvet-cake.md": {
	id: "it/red-velvet-cake.md";
  slug: "it/red-velvet-cake";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/riso-per-sushi.md": {
	id: "it/riso-per-sushi.md";
  slug: "it/riso-per-sushi";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/risoni-cremosi-alla-zucca.md": {
	id: "it/risoni-cremosi-alla-zucca.md";
  slug: "it/risoni-cremosi-alla-zucca";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/risotto-al-brie-e-noci.md": {
	id: "it/risotto-al-brie-e-noci.md";
  slug: "it/risotto-al-brie-e-noci";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/spaghetti-alla-san-giuannidd.md": {
	id: "it/spaghetti-alla-san-giuannidd.md";
  slug: "it/spaghetti-alla-san-giuannidd";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/tamago-sando-aka-egg-sandwich-giappo.md": {
	id: "it/tamago-sando-aka-egg-sandwich-giappo.md";
  slug: "it/tamago-sando-aka-egg-sandwich-giappo";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/torta-creme-caramel-super-safe.md": {
	id: "it/torta-creme-caramel-super-safe.md";
  slug: "it/torta-creme-caramel-super-safe";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/torta-di-albumi-e-cacao.md": {
	id: "it/torta-di-albumi-e-cacao.md";
  slug: "it/torta-di-albumi-e-cacao";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/torta-di-zucca-morbidissima.md": {
	id: "it/torta-di-zucca-morbidissima.md";
  slug: "it/torta-di-zucca-morbidissima";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/torta-fit-alle-carote-per-colazione.md": {
	id: "it/torta-fit-alle-carote-per-colazione.md";
  slug: "it/torta-fit-alle-carote-per-colazione";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/torta-fredda-al-cioccolato.md": {
	id: "it/torta-fredda-al-cioccolato.md";
  slug: "it/torta-fredda-al-cioccolato";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/torta-salame-di-cioccolato.md": {
	id: "it/torta-salame-di-cioccolato.md";
  slug: "it/torta-salame-di-cioccolato";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/torta-salata-zucchine-e-patate.md": {
	id: "it/torta-salata-zucchine-e-patate.md";
  slug: "it/torta-salata-zucchine-e-patate";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/torta-soffice-al-latte-di-cocco.md": {
	id: "it/torta-soffice-al-latte-di-cocco.md";
  slug: "it/torta-soffice-al-latte-di-cocco";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/tortilla-spagnola.md": {
	id: "it/tortilla-spagnola.md";
  slug: "it/tortilla-spagnola";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"it/vellutata-di-funghi.md": {
	id: "it/vellutata-di-funghi.md";
  slug: "it/vellutata-di-funghi";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
};

	};

	type DataEntryMap = {
		
	};

	type AnyEntryMap = ContentEntryMap & DataEntryMap;

	export type ContentConfig = typeof import("../../src/content/config.js");
}
