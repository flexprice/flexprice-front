export const timeOf = (iso: string): string =>
	new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

export const dayStart = (iso: string): number => {
	const d = new Date(iso);
	return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

export const dayHeading = (iso: string, now: Date = new Date()): { kind: 'today' | 'yesterday' | 'date'; date: string } => {
	const d = new Date(iso);
	const diffDays = Math.round((dayStart(now.toISOString()) - dayStart(iso)) / 86_400_000);
	const sameYear = d.getFullYear() === now.getFullYear();
	const date = d.toLocaleDateString(
		undefined,
		sameYear ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' },
	);
	return { kind: diffDays === 0 ? 'today' : diffDays === 1 ? 'yesterday' : 'date', date };
};
