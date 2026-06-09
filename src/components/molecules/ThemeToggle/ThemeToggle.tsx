import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/atoms';
import { useThemeStore } from '@/store/useThemeStore';
import { useTranslation } from 'react-i18next';

const ThemeToggle = () => {
	const { t } = useTranslation('common');
	const { theme, toggleTheme } = useThemeStore();
	const isDark = theme === 'dark';

	return (
		<Button
			type='button'
			size='sm'
			variant='outline'
			onClick={toggleTheme}
			aria-label={isDark ? t('chrome.switchToLight') : t('chrome.switchToDark')}
			title={isDark ? t('chrome.switchToLight') : t('chrome.switchToDark')}>
			{isDark ? <Sun absoluteStrokeWidth className='size-4' /> : <Moon absoluteStrokeWidth className='size-4' />}
		</Button>
	);
};

export default ThemeToggle;
