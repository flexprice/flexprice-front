import { FC } from 'react';
import { Cog, KeyRound, Store, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActivityItem } from '@/types/dto/ActivityLog';

const ICONS = { user: User, api_key: KeyRound, system: Cog, customer_portal: Store } as const;
const TONES = {
	user: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
	api_key: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
	system: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
	customer_portal: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
} as const;

const ActorBadge: FC<{ actor: ActivityItem['actor']; showLabel?: boolean }> = ({ actor, showLabel = true }) => {
	const Icon = ICONS[actor.type] ?? Cog;
	return (
		<span className='inline-flex items-center gap-2'>
			<span
				className={cn('h-5 w-5 rounded-full grid place-items-center shrink-0', TONES[actor.type] ?? TONES.system)}
				aria-label={actor.type}>
				<Icon className='h-3 w-3' />
			</span>
			{showLabel && <span className='font-medium text-content'>{actor.label || actor.type}</span>}
		</span>
	);
};

export default ActorBadge;
