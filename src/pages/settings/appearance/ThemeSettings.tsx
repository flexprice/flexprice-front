import { useTranslation } from 'react-i18next';
import { Card } from '@/components/atoms';
import { SettingsCardHeader } from '@/components/molecules';
import { Switch } from '@/components/ui/switch';
import { useThemeStore } from '@/store';

/**
 * The only user-facing entry point into dark mode.
 *
 * Classes here use the `--fp-*` tokens rather than raw palette classes, since this file is new —
 * writing `bg-surface` would just create work for a later migration step. Light values are identical
 * either way (`bg-surface` is #ffffff, `border-line` is #e5e7eb).
 */
const ThemeSettings = () => {
	const { t } = useTranslation(['settings', 'common']);
	const theme = useThemeStore((state) => state.theme);
	const setTheme = useThemeStore((state) => state.setTheme);

	const title = t('appearance.theme.title');

	return (
		<Card variant='default' noPadding className='rounded-xl border-line bg-surface shadow-sm'>
			<div className='px-6 pt-6'>
				<SettingsCardHeader
					title={title}
					infoDescription={t('appearance.theme.description')}
					infoAriaLabel={t('info.ariaLabel', { field: title })}
					titleClassName='text-lg font-medium text-content-zinc-strong'
					className='mb-2'
					cta={
						<Switch
							checked={theme === 'dark'}
							onCheckedChange={(enabled) => setTheme(enabled ? 'dark' : 'light')}
							aria-label={t('appearance.theme.toggleAriaLabel')}
						/>
					}
				/>
			</div>
			<div className='px-6 pb-6'>
				<p className='text-sm text-content-muted'>{t('appearance.theme.rolloutNote')}</p>
			</div>
		</Card>
	);
};

export default ThemeSettings;
