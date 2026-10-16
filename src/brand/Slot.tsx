// src/brand/Slot.tsx
import { Suspense, type ComponentType, type ReactNode } from 'react';
import extensions from '@brand/extensions';
import type { SlotName, SlotProps } from './types';

type Props<K extends SlotName> = { name: K; fallback?: ReactNode } & SlotProps[K];

/**
 * A named point where the active brand pack may replace the default UI.
 * Renders `fallback` (the app's own UI) unless the pack overrides `name`.
 */
export function Slot<K extends SlotName>({ name, fallback = null, ...props }: Props<K>) {
	const Override = extensions.slots?.[name] as ComponentType<SlotProps[K]> | undefined;
	if (!Override) return <>{fallback}</>;
	return (
		<Suspense fallback={null}>
			<Override {...(props as unknown as SlotProps[K])} />
		</Suspense>
	);
}

/** Whether the active brand pack fills `name` — for layouts that change shape around a slot. */
export const hasSlot = (name: SlotName): boolean => !!extensions.slots?.[name];
