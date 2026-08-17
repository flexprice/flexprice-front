import { cn } from '@/lib/utils';
import { FC } from 'react';

/** Six separated primaries — one hue each, then the hash wraps. */
const AVATAR_TONES = ['bg-[#2563eb]', 'bg-[#059669]', 'bg-[#d97706]', 'bg-[#e11d48]', 'bg-[#7c3aed]', 'bg-[#0891b2]'] as const;

const AVATAR_SIZE = {
	sm: 'size-6 text-[10px] leading-3',
	md: 'size-7 text-[11px] leading-3',
} as const;

export function getTableAvatarInitials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return '?';
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function getTableAvatarToneIndex(name: string): number {
	let hash = 2166136261;
	for (let i = 0; i < name.length; i += 1) {
		hash ^= name.charCodeAt(i);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0) % AVATAR_TONES.length;
}

export interface TableAvatarProps {
	name: string;
	size?: keyof typeof AVATAR_SIZE;
	className?: string;
}

/** Initials tile used in Figma list tables. `sm` is 24px; `md` is 32px. */
const TableAvatar: FC<TableAvatarProps> = ({ name, size = 'sm', className }) => {
	const initials = getTableAvatarInitials(name);
	return (
		<span
			className={cn(
				'inline-flex shrink-0 items-center justify-center overflow-clip rounded-[var(--fp-radius-sm)] text-white',
				AVATAR_SIZE[size],
				AVATAR_TONES[getTableAvatarToneIndex(name || initials)],
				className,
			)}
			aria-hidden>
			{initials}
		</span>
	);
};

export default TableAvatar;
