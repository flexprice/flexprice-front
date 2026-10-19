import { brandConfig } from '@/config/branding';

/**
 * A link into the active brand's docs. Pass the Flexprice docs path ('/docs/customers/overview',
 * anchors allowed); a brand whose docs move or drop that page maps it in `links.docsPaths`.
 */
export function docsUrl(path = ''): string {
	const [page, anchor] = path.split('#');
	const mapped = brandConfig.links.docsPaths?.[page] ?? page;
	const base = brandConfig.links.docs.replace(/\/$/, '');
	// A mapped page drops the original anchor: it pointed into a page that is not there.
	const hash = mapped === page && anchor ? `#${anchor}` : '';
	return `${base}${mapped}${hash}`;
}
