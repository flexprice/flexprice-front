/** Theme-aware color tokens for Recharts SVG props and inline tooltip styles. */
export const chartTheme = {
	gridStroke: 'hsl(var(--border))',
	axisLineStroke: 'hsl(var(--border))',
	tickFill: 'hsl(var(--muted-foreground))',
	tooltipBg: 'hsl(var(--popover))',
	tooltipBorder: 'hsl(var(--border))',
	tooltipTitle: 'hsl(var(--foreground))',
	tooltipSubtitle: 'hsl(var(--muted-foreground))',
	tooltipLabel: 'hsl(var(--muted-foreground))',
	tooltipValue: 'hsl(var(--foreground))',
	legendColor: 'hsl(var(--muted-foreground))',
	activeDotStroke: 'hsl(var(--background))',
	brushFill: 'hsl(var(--muted))',
	seriesStroke: 'hsl(var(--chart-1))',
	seriesFill: 'hsl(var(--chart-1) / 0.15)',
	emptyFill: 'hsl(var(--muted))',
} as const;
