export const sizes = {
	xs: {
		height: 'h-6',
		padding: 'px-2 py-1',
		text: 'text-xs',
		display: '',
	},
	sm: {
		height: 'h-8',
		padding: 'px-2 py-1.5',
		text: 'text-xs',
		display: '',
	},
	default: {
		height: 'h-10',
		padding: 'px-3 py-2',
		text: 'text-sm',
		display: '',
	},
	lg: {
		height: 'h-12',
		padding: 'px-4 py-2.5',
		text: 'text-base',
		display: '',
	},
	icon: {
		height: 'h-9 w-9',
		padding: 'p-2',
		text: 'text-sm',
		display: 'flex items-center justify-center',
	},
} as const;

export type SizeConfig = {
	height: string;
	padding: string;
	text: string;
	display: string;
};

export type SizeVariant = keyof typeof sizes;
