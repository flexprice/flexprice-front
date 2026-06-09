import { cn } from '@/lib/utils';

export const typography = {
	// Headings
	h1: 'text-2xl font-bold text-foreground',
	h2: 'text-xl font-semibold text-foreground',
	h3: 'text-lg font-semibold text-foreground',
	h4: 'text-base font-semibold text-foreground',

	// Card and Section Headers
	'card-title': 'text-base font-semibold text-foreground mb-4',
	'section-title': 'text-base font-semibold text-foreground',
	'form-title': 'text-[20px] font-bold text-foreground',
	'subsection-title': 'text-sm font-medium text-foreground',

	// Body Text
	'body-large': 'text-base text-foreground',
	'body-default': 'text-sm text-foreground',
	'body-small': 'text-xs text-foreground',

	// Labels and Supporting Text
	'label-default': 'text-sm text-muted-foreground font-normal',
	'label-semibold': 'text-sm text-muted-foreground font-semibold',
	'label-small': 'text-xs text-muted-foreground',
	'helper-text': 'text-xs text-muted-foreground',

	// Interactive Text
	'button-large': 'text-base font-medium',
	'button-default': 'text-sm font-medium',
	'button-small': 'text-xs font-medium',

	// Status and Metadata
	'status-default': 'text-sm text-foreground',
	'status-muted': 'text-sm text-muted-foreground',
	metadata: 'text-xs text-muted-foreground',

	// Special Cases
	'table-header': 'text-sm font-medium text-foreground',
	'table-cell': 'text-sm text-foreground',
	'nav-item': 'text-sm font-medium text-foreground',
	breadcrumb: 'text-sm text-muted-foreground',

	// card styles
	'card-header': 'text-[20px] font-medium text-foreground',
	'card-subtitle': 'text-sm text-muted-foreground',

	// modal styles
	'modal-title': 'text-2xl font-bold text-foreground',
	'modal-subtitle': 'text-sm text-muted-foreground',
} as const;

export type TypographyVariant = keyof typeof typography;

export const getTypographyClass = (variant: TypographyVariant, className?: string) => {
	return cn(typography[variant], className);
};

// Example usage:
// <p className={getTypographyClass('card-title', 'custom-class')}>Title</p>
