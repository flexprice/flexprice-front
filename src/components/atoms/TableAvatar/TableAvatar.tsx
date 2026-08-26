import { cn } from '@/lib/utils';
import { FC } from 'react';

const AVATAR_SIZE = {
	sm: 'size-6 text-[0.625rem] leading-3',
	md: 'size-8 text-[0.6875rem] leading-3',
} as const;

export function getTableAvatarInitials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return '?';
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export interface TableAvatarProps {
	name: string;
	size?: keyof typeof AVATAR_SIZE;
	className?: string;
}

/**
 * Initials disc used in list tables. Outline-only: a full circle, a hairline border and the
 * initials — no fill. The six hashed `--fp-avatar-*` tones this used to carry were dropped
 * because they read as loud next to a borderless ferry-style row; the disc is now chrome, not
 * a colour signal, so nothing depends on the name hash any more.
 */
const TableAvatar: FC<TableAvatarProps> = ({ name, size = 'sm', className }) => {
	const initials = getTableAvatarInitials(name);
	return (
		<span
			className={cn(
				'inline-flex shrink-0 items-center justify-center overflow-clip rounded-full border border-line-zinc font-medium text-content-muted',
				AVATAR_SIZE[size],
				className,
			)}
			aria-hidden>
			{initials}
		</span>
	);
};

export default TableAvatar;
