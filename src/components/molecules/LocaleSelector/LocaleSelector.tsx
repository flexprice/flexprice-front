// src/components/molecules/LocaleSelector/LocaleSelector.tsx
import React from 'react';
import { Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocaleStore } from '@/store/useLocaleStore';
import { Locale } from '@/config/branding';

const LOCALE_LABELS: Record<Locale, string> = {
	[Locale.En]: 'English',
	[Locale.Ar]: 'العربية',
	[Locale.He]: 'עברית',
	[Locale.Fa]: 'فارسی',
	[Locale.Ur]: 'اردو',
};

const LocaleSelector: React.FC = () => {
	const { locale, allowedLocales, setLocale } = useLocaleStore();

	if (allowedLocales.length <= 1) return null;

	return (
		<Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
			<SelectTrigger className='w-auto gap-1.5 border-none shadow-none text-sm text-gray-500 hover:text-gray-700 px-0'>
				<Globe size={14} />
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{allowedLocales.map((l) => (
					<SelectItem key={l} value={l}>
						{LOCALE_LABELS[l] ?? l}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
};

export default LocaleSelector;
