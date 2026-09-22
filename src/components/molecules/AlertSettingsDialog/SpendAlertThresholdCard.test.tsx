import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SpendAlertThresholdCard from './SpendAlertThresholdCard';

const labels = {
	title: 'Critical',
	description: 'Alert at critical level',
	add: 'Add',
	remove: 'Remove',
	thresholdValue: 'Spend is above',
	condition: 'Condition',
	conditionBelow: 'Below',
	conditionAbove: 'Above',
	amountPlaceholder: '0.00',
};

const threshold = { threshold: '10', condition: 'above' as const };

const noop = {
	onAdd: vi.fn(),
	onRemove: vi.fn(),
	onThresholdChange: vi.fn(),
	onConditionChange: vi.fn(),
};

describe('SpendAlertThresholdCard', () => {
	it('offers Add and hides the value input when no threshold is set', () => {
		render(<SpendAlertThresholdCard threshold={null} labels={labels} {...noop} />);

		expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
		expect(screen.queryByDisplayValue('10')).not.toBeInTheDocument();
	});

	it('shows the stored value as a bare number once a threshold is set', () => {
		render(<SpendAlertThresholdCard threshold={threshold} labels={labels} {...noop} />);

		expect(screen.getByDisplayValue('10')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
	});

	it('keeps the condition picker present but locked — spend alerts are always "above"', () => {
		render(<SpendAlertThresholdCard threshold={threshold} labels={labels} conditionDisabled {...noop} />);

		expect(screen.getByText('Condition')).toBeInTheDocument();
		expect(screen.getByText('Above')).toBeInTheDocument();
	});
});
