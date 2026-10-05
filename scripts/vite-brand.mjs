// scripts/vite-brand.mjs
//
// Brand-pack wiring for Vite. A build picks its brand pack with `BRAND_DIR`; without it the app
// builds with `src/brand/default` (Flexprice). See src/brand/types.ts for the pack contract.
//
//   BRAND_DIR=../my-brand npm run dev
//
// A pack usually lives outside this checkout (a private repo), so two things need help:
//   - its bare imports ('react', 'lucide-react', …) must resolve from THIS app's node_modules,
//     not from the pack's own folder, or React would load twice;
//   - the dev server must be allowed to serve its files.
import path from 'path';
import { searchForWorkspaceRoot } from 'vite';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

/** Absolute path of the active brand pack. */
export function resolveBrandDir() {
	const dir = process.env.BRAND_DIR?.trim();
	return dir ? path.resolve(process.cwd(), dir) : path.join(ROOT, 'src/brand/default');
}

/** @returns {import('vite').Plugin} */
export function brandPack() {
	const brandDir = resolveBrandDir();
	const external = !brandDir.startsWith(path.join(ROOT, 'src') + path.sep);
	const appEntry = path.join(ROOT, 'src/main.tsx');

	return {
		name: 'flexprice:brand-pack',
		enforce: 'pre',
		config() {
			return { server: { fs: { allow: [searchForWorkspaceRoot(process.cwd()), brandDir] } } };
		},
		async resolveId(source, importer, options) {
			if (!external || !importer || !importer.startsWith(brandDir + path.sep)) return null;
			const bare =
				!source.startsWith('.') &&
				!source.startsWith('/') &&
				!source.startsWith('@/') &&
				!source.startsWith('@brand/') &&
				!source.startsWith('\0');
			if (!bare) return null;
			// Resolve as if the app's own entry imported it.
			return this.resolve(source, appEntry, { ...options, skipSelf: true });
		},
	};
}
