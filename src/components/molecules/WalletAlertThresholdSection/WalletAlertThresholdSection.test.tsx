import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WalletAlertLevel, type WalletAlertDraft } from '@/models/Wallet';
import { toWalletAlertDraft } from '@/utils/wallet/walletAlertUtils';
import WalletAlertThresholdSection, { type WalletAlertThresholdSectionLabels } from './WalletAlertThresholdSection';

const labels: WalletAlertThresholdSectionLabels = {
	thresholdType: 'Threshold type',
	thresholdTypeTooltip: 'Absolute or percentage',
	thresholdTypeAbsolute: 'Absolute',
	thresholdTypePercentage: 'Percentage',
	rowDescription: 'Balance below',
	amountPlaceholder: '0.00',
	levels: {
		[WalletAlertLevel.CRITICAL]: 'Critical',
		[WalletAlertLevel.WARNING]: 'Warning',
		[WalletAlertLevel.INFO]: 'Info',
	},
};

/** Drives the section the way both call sites do: the draft lives in the parent. */
const Harness = ({ initial, currency }: { initial?: WalletAlertDraft; currency?: string }) => {
	const [draft, setDraft] = useState(initial ?? toWalletAlertDraft({ alert_enabled: true }));
	return <WalletAlertThresholdSection draft={draft} labels={labels} currency={currency} onChange={setDraft} />;
};

const rowInput = (level: string) => screen.getByLabelText(`${level} — Balance below`) as HTMLInputElement;

describe('WalletAlertThresholdSection', () => {
	it('renders one row per severity with the fixed falls-below copy and no condition picker', () => {
		render(<Harness />);

		expect(screen.getByText('Critical')).toBeInTheDocument();
		expect(screen.getByText('Warning')).toBeInTheDocument();
		expect(screen.getByText('Info')).toBeInTheDocument();
		expect(screen.getAllByText('Balance below')).toHaveLength(3);
		// The Above/Below dropdown is gone — wallet alerts always fire on a falling balance.
		expect(screen.queryByText('Above')).not.toBeInTheDocument();
		expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
	});

	it('has no standalone Thresholds heading and keeps the type label beside its control', () => {
		render(<Harness />);

		expect(screen.queryByText('Thresholds')).not.toBeInTheDocument();
		// Label and segmented control share one row, so they have the same parent.
		const label = screen.getByText('Threshold type');
		const control = screen.getByRole('group', { name: 'Threshold type' });
		expect(label.parentElement?.parentElement).toBe(control.parentElement);
	});

	it('gives all three rows an identically sized severity and input column', () => {
		render(<Harness currency='USD' />);

		const inputWrappers = ['Critical', 'Warning', 'Info'].map((level) => rowInput(level).closest('div')?.parentElement);
		const widths = new Set(inputWrappers.map((el) => el?.className));
		expect(widths.size).toBe(1);

		const severityWidths = new Set(['Critical', 'Warning', 'Info'].map((level) => screen.getByText(level).className));
		expect(severityWidths.size).toBe(1);
	});

	it('shows the currency symbol in absolute mode and % in percentage mode', () => {
		render(<Harness currency='USD' />);
		expect(screen.getAllByText('$')).toHaveLength(3);
		expect(screen.queryByText('%')).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: 'Percentage' }));
		expect(screen.getAllByText('%')).toHaveLength(3);
		expect(screen.queryByText('$')).not.toBeInTheDocument();
	});

	it('keeps each threshold type’s values independent across a switch and back', () => {
		render(<Harness currency='USD' />);

		fireEvent.change(rowInput('Critical'), { target: { value: '10' } });
		fireEvent.change(rowInput('Warning'), { target: { value: '25' } });

		fireEvent.click(screen.getByRole('button', { name: 'Percentage' }));
		// Percentage starts empty rather than inheriting the absolute amounts.
		expect(rowInput('Critical').value).toBe('');
		fireEvent.change(rowInput('Critical'), { target: { value: '5' } });

		fireEvent.click(screen.getByRole('button', { name: 'Absolute' }));
		expect(rowInput('Critical').value).toBe('10');
		expect(rowInput('Warning').value).toBe('25');

		fireEvent.click(screen.getByRole('button', { name: 'Percentage' }));
		expect(rowInput('Critical').value).toBe('5');
	});

	it('mutes only the controls when disabled — severity labels stay readable', () => {
		const draft = toWalletAlertDraft({ alert_enabled: false });
		render(<WalletAlertThresholdSection draft={draft} labels={labels} disabled onChange={() => {}} />);

		// The row itself is not faded; the disabled input carries the muting.
		const row = screen.getByText('Critical').parentElement;
		expect(row?.className).not.toContain('opacity');
		expect(rowInput('Critical')).toBeDisabled();
	});

	it('omits the currency symbol when no currency applies (tenant-wide defaults)', () => {
		render(<Harness />);
		expect(screen.queryByText('$')).not.toBeInTheDocument();
	});
});
