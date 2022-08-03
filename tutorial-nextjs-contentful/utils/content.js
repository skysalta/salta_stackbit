import { createClient } from 'contentful';

const PAGE_CONTENT_TYPE_ID = 'page';
const IS_DEV = process.env.NODE_ENV === 'development';

async function getEntries(content_type, queryParams) {
  const client = createClient({
    accessToken: IS_DEV ? process.env.CONTENTFUL_PREVIEW_TOKEN : process.env.CONTENTFUL_DELIVERY_TOKEN,
    space: process.env.CONTENTFUL_SPACE_ID,
    host: IS_DEV ? 'preview.contentful.com' : 'cdn.contentful.com',
  });

  const entries = await client.getEntries({ content_type, ...queryParams, include: 10 });
  return entries;
}

export async function getPagePaths() {
  const { items } = await getEntries(PAGE_CONTENT_TYPE_ID);
  return items.map((page) => page.fields.slug);
}

export async function getPageFromSlug(slug) {
  const { items } = await getEntries(PAGE_CONTENT_TYPE_ID, { 'fields.slug': slug });
  const page = (items ?? [])[0];
  if (!page) throw new Error(`Page not found for slug: ${slug}`);
  return mapEntry(page);
}

function mapEntry(entry) {
  return {
    id: entry.sys?.id,
    type: entry.sys?.contentType?.sys?.id || entry.sys?.type,
    ...Object.fromEntries(Object.entries(entry.fields).map(([key, value]) => [key, parseField(value)])),
  };
}

function parseField(value) {
  if (typeof value === 'object' && value.sys) return mapEntry(value);
  if (Array.isArray(value)) return value.map(mapEntry);
  return value;
}
