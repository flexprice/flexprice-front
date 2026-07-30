import animatePlugin from 'tailwindcss-animate';

export default {
	darkMode: ['class'],
	content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
	theme: {
		extend: {
			fontSize: {
				xs: '12px',
				sm: '14px',
			},
			fontFamily: {
				sans: ['var(--font-sans)'],
				geist: ['Geist', 'sans-serif'],
				'fira-code': ['Fira Code', 'monospace'],
			},
			borderRadius: {
				DEFAULT: '6px',
				sm: '6px',
				md: '6px',
				lg: '6px',
				xl: '6px',
				'2xl': '6px',
				'3xl': '6px',
				full: '9999px',
			},
			colors: {
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				blue: {
					DEFAULT: '#3293D9',
					light: '#E5F0FF',
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: '#64748B',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					1: 'hsl(var(--chart-1))',
					2: 'hsl(var(--chart-2))',
					3: 'hsl(var(--chart-3))',
					4: 'hsl(var(--chart-4))',
					5: 'hsl(var(--chart-5))',
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))',
					'text-accent-foreground': '#18181B',
				},
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0',
					},
					to: {
						height: 'var(--radix-accordion-content-height)',
					},
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)',
					},
					to: {
						height: '0',
					},
				},
				'spin-once': {
					'0%': { transform: 'rotate(0deg)' },
					'100%': { transform: 'rotate(360deg)' },
				},
				'command-palette-in': {
					from: { opacity: '0', transform: 'translateX(-50%) scale(0.92)' },
					to: { opacity: '1', transform: 'translateX(-50%) scale(1)' },
				},
				'command-palette-out': {
					from: { opacity: '1', transform: 'translateX(-50%) scale(1)' },
					to: { opacity: '0', transform: 'translateX(-50%) scale(0.92)' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'spin-once': 'spin-once 0.6s ease-in-out',
				'command-palette-in': 'command-palette-in 0.22s ease-in both',
				'command-palette-out': 'command-palette-out 0.18s ease-in both',
			},
		},
	},
	plugins: [animatePlugin],
};
