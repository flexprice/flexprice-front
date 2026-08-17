import { useRef, type FC } from 'react';
import { flushSync } from 'react-dom';
import { Moon02Icon, Sun03Icon } from '@hugeicons/core-free-icons';
import { HugeIcon } from '@/components/atoms';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { useThemeStore } from '@/store/useThemeStore';

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/**
 * Header control that flips the theme with a circular wipe starting at the button.
 *
 * The wipe is done with the View Transitions API rather than by animating colours. Cross-fading a
 * whole app of tokens means every surface transitions independently and the page looks like it is
 * dissolving; a single clip-path reveal keeps it as one deliberate gesture, and costs one animation
 * instead of hundreds.
 *
 * Degrades rather than breaks in three ways: browsers without `startViewTransition` and users who
 * ask for reduced motion take a plain `toggleTheme()`, and a transition the browser refuses to run —
 * a hidden document aborts with InvalidStateError — still applies the theme, because the callback
 * has already run by the time it gives up.
 */
const ThemeToggle: FC<{ className?: string }> = ({ className }) => {
	const { t } = useTranslation('settings');
	const theme = useThemeStore((s) => s.theme);
	const toggleTheme = useThemeStore((s) => s.toggleTheme);
	const buttonRef = useRef<HTMLButtonElement>(null);

	const isDark = theme === 'dark';

	const handleClick = () => {
		const button = buttonRef.current;

		if (!button || typeof document.startViewTransition !== 'function' || prefersReducedMotion()) {
			toggleTheme();
			return;
		}

		// Hand the wipe its origin — the centre of this button — and let the CSS keyframe do the rest.
		//
		// Pixels, not percentages. Percentages have to divide by the viewport, and if that is ever zero
		// the result is `Infinity%`: still a *set* custom property, so `var(x, 50%)` does not fall back,
		// and the whole clip-path becomes invalid at computed-value time and resolves to `none`. The
		// wipe then does not clip at all and the theme appears to snap with no animation. A 480ms wipe
		// gains nothing from surviving a mid-flight resize, so there is no reason to take that risk.
		const { top, left, width, height } = button.getBoundingClientRect();
		if (width === 0 || height === 0) {
			toggleTheme();
			return;
		}

		const root = document.documentElement;
		root.style.setProperty('--theme-wipe-x', `${Math.round(left + width / 2)}px`);
		root.style.setProperty('--theme-wipe-y', `${Math.round(top + height / 2)}px`);

		// flushSync forces React to commit the class change inside the transition's capture window;
		// without it React may batch the update past the snapshot and nothing animates.
		const transition = document.startViewTransition(() => flushSync(() => toggleTheme()));

		// The theme is already committed by the time either of these can reject, so there is nothing to
		// recover — these handlers exist only to keep an aborted transition out of the console.
		transition.ready.catch(() => {});
		transition.finished.catch(() => {});
	};

	return (
		<button
			ref={buttonRef}
			type='button'
			onClick={handleClick}
			aria-label={t('appearance.theme.toggleAriaLabel')}
			aria-pressed={isDark}
			title={t('appearance.theme.toggleAriaLabel')}
			className={cn(
				'group relative inline-flex size-9 shrink-0 items-center justify-center rounded-full',
				'border border-line bg-surface text-content-tertiary',
				'transition-[background-color,border-color,color,transform] duration-200 ease-out',
				'hover:-translate-y-px hover:border-line-strong hover:bg-surface-subtle hover:text-content',
				'active:translate-y-0 active:scale-95',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-canvas',
				className,
			)}>
			{/*
			 * Both icons stay mounted and swap on opacity/rotation/scale. Mounting one at a time would
			 * give React nothing to animate between, and the swap would read as a flicker.
			 *
			 * motion-reduce drops the rotation and scale but keeps the fade, so the control still reads
			 * as changing state without any spin.
			 */}
			<HugeIcon
				icon={Sun03Icon}
				aria-hidden
				size={18}
				className={cn(
					'absolute transition-all duration-300 ease-out motion-reduce:transition-opacity',
					isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100',
					'group-hover:rotate-45 motion-reduce:group-hover:rotate-0',
				)}
			/>
			<HugeIcon
				icon={Moon02Icon}
				aria-hidden
				size={18}
				className={cn(
					'absolute transition-all duration-300 ease-out motion-reduce:transition-opacity',
					isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0',
					'group-hover:-rotate-12 motion-reduce:group-hover:rotate-0',
				)}
			/>
		</button>
	);
};

export default ThemeToggle;
