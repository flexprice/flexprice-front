import { ENTITY_REGISTRY } from './entityRegistry';

const HIDDEN = new Set(['id', 'tenant_id', 'environment_id', 'status', 'created_at', 'updated_at', 'created_by', 'updated_by', 'metadata']);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const REDACTED = '[redacted]';

/** Fields holding ids minted by an external gateway (e.g. Razorpay `pay_…`), which can share a prefix with ours but are never Flexprice records. */
export const isGatewayField = (key: string): boolean => key.startsWith('gateway_');

const humanize = (k: string) => {
	const s = k.replace(/_/g, ' ');
	return s.charAt(0).toUpperCase() + s.slice(1);
};

const refType = (key: string): string | null => {
	if (!key.endsWith('_id')) return null;
	const base = key.slice(0, -3);
	const type = Object.keys(ENTITY_REGISTRY).find((t) => base === t || base.endsWith(`_${t}`));
	return type ?? null;
};

const formatOf = (key: string, v: string | number | boolean): string => {
	if (isGatewayField(key)) return typeof v === 'boolean' ? 'boolean' : 'text';
	if (typeof v === 'boolean') return 'boolean';
	if (v === REDACTED) return 'redacted';
	if (typeof v === 'string' && ISO_DATE.test(v)) return 'date';
	const ref = typeof v === 'string' ? refType(key) : null;
	return ref ? `ref:${ref}` : 'text';
};

/** The entity a row belongs to (a price's plan), from the snapshot's entity_type/entity_id pair. */
export const parentRef = (snapshot?: Record<string, unknown>): { type: string; id: string } | null => {
	const type = snapshot?.entity_type;
	const id = snapshot?.entity_id;
	if (typeof type !== 'string' || typeof id !== 'string' || !id) return null;
	const lower = type.toLowerCase();
	return ENTITY_REGISTRY[lower] ? { type: lower, id } : null;
};

export const snapshotRows = (snapshot?: Record<string, unknown>) => {
	const parent = parentRef(snapshot);
	return Object.entries(snapshot ?? {})
		.filter((e): e is [string, string | number | boolean] => {
			const [k, v] = e;
			if (HIDDEN.has(k)) return false;
			if (parent && k === 'entity_type') return false;
			if (v === '' || v === null || v === undefined) return false;
			return typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
		})
		.map(([key, value]) =>
			parent && key === 'entity_id'
				? { key, label: humanize(parent.type), value, format: `ref:${parent.type}` }
				: { key, label: humanize(key), value, format: formatOf(key, value) },
		)
		.sort((a, b) => a.label.localeCompare(b.label));
};
