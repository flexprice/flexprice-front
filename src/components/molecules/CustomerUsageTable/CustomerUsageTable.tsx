import { Progress, Tooltip } from '@/components/atoms';
import { ColumnData, FlexpriceTable, RedirectCell } from '@/components/molecules';
import GrantWindowLedger from './GrantWindowLedger';
import { RouteNames } from '@/core/routes/Routes';
import { FEATURE_TYPE } from '@/models/Feature';
import { FC, useMemo, useState } from 'react';
import CustomerUsage, { EntitlementBudget, EntitlementSource, ENTITLEMENT_SOURCE_ENTITY_TYPE } from '@/models/CustomerUsage';
import { GrantAllowanceState } from '@/models/Entitlement';
import { formatAmount } from '@/components/atoms/Input/Input';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { getFeatureTypeChips } from './getFeatureTypeChips';
import { formatGrantPeriod } from '@/utils/entitlement/allowanceLabel';

interface Props {
	data: CustomerUsage[];
	allowRedirect?: boolean;
}

const CUSTOMERS_NS = 'customers';

const getRedirectUrl = (source: EntitlementSource | undefined): string | undefined => {
	if (!source) {
		return undefined;
	}

	if (source.entity_type && source.entity_id) {
		if (source.entity_type === ENTITLEMENT_SOURCE_ENTITY_TYPE.PLAN) {
			return `${RouteNames.plan}/${source.entity_id}`;
		} else if (source.entity_type === ENTITLEMENT_SOURCE_ENTITY_TYPE.ADDON) {
			return `${RouteNames.addonDetails}/${source.entity_id}`;
		}
	}

	if (source.plan_id) {
		return `${RouteNames.plan}/${source.plan_id}`;
	}

	return undefined;
};

const getEntityName = (source: EntitlementSource | undefined): string => {
	return source?.entity_name || source?.plan_name || i18n.t('usageTable.fallback', { ns: CUSTOMERS_NS });
};

/**
 * One table row. A parallel feature has several independent budgets and no single pair
 * of numbers describes them, so each gets its own row; every other feature is one row
 * with no budget attached.
 */
interface UsageRow {
	usage: CustomerUsage;
	budget?: EntitlementBudget;
	/** Only the first row of a feature repeats its name, so the group reads as one thing. */
	leadsFeature: boolean;
}

/** The windows behind a row: one budget's, or the whole feature's. */
const allowancesOf = (row: UsageRow): GrantAllowanceState[] => {
	const all = row.usage.grant_state?.allowances ?? [];
	if (!row.budget) return all;
	return all.filter((a) => a.entitlement_id === row.budget!.entitlement_id);
};

/** A row is worth opening only when there are windows behind it. */
const hasAllowances = (row: UsageRow) => allowancesOf(row).length > 0;

/** The source that funds a budget, so its row can name and link to it. */
const sourceOf = (row: UsageRow): EntitlementSource | undefined => {
	if (!row.budget) return row.usage.sources?.[0];
	return (row.usage.sources ?? []).find((s) => s.entity_id === row.budget!.source_entity_id);
};

const CustomerUsageTable: FC<Props> = ({ data, allowRedirect = true }) => {
	const { t } = useTranslation('customers');
	// The cadence words ('day', 'billing period') live in the catalog bundle.
	const { t: tCatalog } = useTranslation('catalog');
	const [ledgerRow, setLedgerRow] = useState<UsageRow | null>(null);
	// Sampled on the click rather than during render, so the ledger's rows all agree
	// on which window is current.
	const [ledgerOpenedAt, setLedgerOpenedAt] = useState(0);

	const rows: UsageRow[] = useMemo(
		() =>
			data.flatMap<UsageRow>((usage) =>
				usage.buckets?.length
					? usage.buckets.map((budget, i) => ({ usage, budget, leadsFeature: i === 0 }))
					: [{ usage, leadsFeature: true }],
			),
		[data],
	);

	const columnData: ColumnData<UsageRow>[] = useMemo(() => {
		// "50" alone does not say what it renews against; the cadence is half the rule.
		const withPeriod = (amount: string, cfg: Pick<EntitlementBudget, 'grant_duration_value' | 'grant_duration_unit'>) =>
			cfg.grant_duration_unit ? tCatalog('entitlements.allowance.perPeriod', { amount, period: formatGrantPeriod(cfg, tCatalog) }) : amount;

		const getFeatureValue = (usageRow: CustomerUsage) => {
			switch (usageRow.feature.type) {
				case FEATURE_TYPE.STATIC:
					return usageRow.sources?.[0]?.static_value ?? t('usageTable.fallback');
				case FEATURE_TYPE.METERED: {
					if (usageRow.is_unlimited || !usageRow.total_limit) return <span>{t('usageTable.unlimitedLabel')}</span>;
					return <span>{withPeriod(formatAmount(usageRow.total_limit.toString()), usageRow)}</span>;
				}
				case FEATURE_TYPE.BOOLEAN:
					return usageRow.is_enabled ? t('usageTable.booleanTrue') : t('usageTable.booleanFalse');
				case FEATURE_TYPE.CONFIG: {
					const configVal = usageRow.sources?.[0]?.config_value;
					if (!configVal || Object.keys(configVal).length === 0) return t('usageTable.fallback');
					return <span className='font-mono text-xs text-muted-foreground truncate max-w-[200px] block'>{JSON.stringify(configVal)}</span>;
				}
				default:
					return t('usageTable.fallback');
			}
		};

		return [
			{
				title: t('usageTable.columns.feature'),

				render(row) {
					// A budget below the first repeats nothing: the group reads as one feature
					// with several budgets rather than several features sharing a name.
					if (!row.leadsFeature) return null;

					const feature = row.usage.feature;
					return (
						<RedirectCell allowRedirect={allowRedirect} redirectUrl={`${RouteNames.featureDetails}/${feature?.id}`}>
							{getFeatureTypeChips({
								type: feature?.type || '',
								showIcon: true,
							})}
							{feature?.name}
						</RedirectCell>
					);
				},
			},
			{
				title: t('usageTable.columns.plan'),
				render(row) {
					// A budget names the one source that funds it; only a folded row has several.
					if (row.budget) {
						const source = sourceOf(row);
						const redirectUrl = getRedirectUrl(source);
						const entityName = getEntityName(source);
						return redirectUrl ? (
							<RedirectCell allowRedirect={allowRedirect} redirectUrl={redirectUrl}>
								{entityName}
							</RedirectCell>
						) : (
							<span>{entityName}</span>
						);
					}

					const sources = row.usage.sources || [];

					if (sources.length === 0) {
						return t('usageTable.fallback');
					}

					if (sources.length === 1) {
						const source = sources[0];
						const redirectUrl = getRedirectUrl(source);
						const entityName = getEntityName(source);

						if (redirectUrl) {
							return (
								<RedirectCell allowRedirect={allowRedirect} redirectUrl={redirectUrl}>
									{entityName}
								</RedirectCell>
							);
						}

						return <span>{entityName}</span>;
					}

					const primarySource = sources[0];
					const entityName = getEntityName(primarySource);
					const additionalCount = sources.length - 1;

					const displayContent = (
						<span>
							{entityName}
							{additionalCount > 0 && <span className='text-content-slate-muted text-sm ms-1'>+{additionalCount}</span>}
						</span>
					);

					const tooltipContent = (
						<div className='flex flex-col gap-2 max-w-xs'>
							{sources.map((source, index) => {
								const sourceName = getEntityName(source);
								const sourceRedirectUrl = getRedirectUrl(source);

								return (
									<div key={source.entitlement_id || index} className='flex items-center gap-2'>
										{sourceRedirectUrl && allowRedirect ? (
											<RedirectCell allowRedirect={allowRedirect} redirectUrl={sourceRedirectUrl}>
												<span className='text-sm'>{sourceName}</span>
											</RedirectCell>
										) : (
											<span className='text-sm'>{sourceName}</span>
										)}
									</div>
								);
							})}
						</div>
					);

					return (
						<Tooltip delayDuration={0} sideOffset={15} content={tooltipContent}>
							<span className='cursor-pointer'>{displayContent}</span>
						</Tooltip>
					);
				},
			},
			{
				title: t('usageTable.columns.value'),
				render(row) {
					if (row.budget) {
						if (row.budget.grant_unlimited || !row.budget.grant_quota) return <span>{t('usageTable.unlimitedLabel')}</span>;
						return <span>{withPeriod(formatAmount(row.budget.grant_quota), row.budget)}</span>;
					}
					return getFeatureValue(row.usage);
				},
			},
			{
				title: t('usageTable.columns.mode'),
				render(row) {
					if (row.usage.feature?.type !== FEATURE_TYPE.METERED) return t('usageTable.fallback');
					// Only a parallel feature is sent as buckets; anything else pools into one figure.
					return row.usage.buckets?.length ? t('usageTable.modeParallel') : t('usageTable.modeAdditive');
				},
			},
			{
				title: t('usageTable.columns.measure'),
				render(row) {
					// What the number counts: the feature's own units, or money. The value
					// column carries no unit word, so this is what tells them apart.
					if (row.usage.feature?.type !== FEATURE_TYPE.METERED) return t('usageTable.fallback');
					const measure = row.budget?.grant_measure ?? row.usage.grant_state?.allowances?.[0]?.measure;
					if (!measure) return t('usageTable.fallback');
					return measure === 'amount' ? t('usageTable.measureAmount') : t('usageTable.measureQuantity');
				},
			},
			{
				title: t('usageTable.columns.usage'),
				render(row) {
					if (row.usage.feature?.type != FEATURE_TYPE.METERED) {
						return t('usageTable.fallback');
					}

					// A budget reports its own live allowance, since the feature's scalars
					// describe a pool this budget is not part of.
					const live = allowancesOf(row).find((a) => a.is_active);
					const usage = row.budget ? Number(live?.usage ?? 0) : Number(row.usage.current_usage);
					const limit = row.budget
						? row.budget.grant_unlimited
							? null
							: Number(live?.quota ?? row.budget.grant_quota ?? 0) || null
						: row.usage.is_unlimited || !row.usage.total_limit
							? null
							: Number(row.usage.total_limit);

					// The ledger belongs on every grant-backed row, including unlimited ones —
					// it was previously stranded after this early return.
					if (!limit) {
						return (
							<Progress
								label={t('usageTable.featureTypes.usageProgressUnlimited', {
									usage: formatAmount(usage.toString()),
								})}
								value={0}
								className='h-[6px]'
								indicatorColor='bg-info'
								backgroundColor='bg-info-line'
							/>
						);
					}

					const value = Math.ceil((usage / limit) * 100);
					const indicatorColor =
						value >= 100 ? 'bg-gradient-to-r from-danger to-danger-soft' : 'bg-gradient-to-r from-accent-indigo-soft to-info';

					const backgroundColor = value >= 100 ? 'bg-danger-muted' : 'bg-info-line';

					return (
						<Progress
							label={`${formatAmount(usage.toString())} / ${formatAmount(limit.toString())}`}
							value={value}
							className='h-[6px]'
							indicatorColor={indicatorColor}
							backgroundColor={backgroundColor}
						/>
					);
				},
			},
		];
	}, [allowRedirect, t, tCatalog]);

	return (
		<div>
			<FlexpriceTable
				showEmptyRow
				data={rows}
				columns={columnData}
				variant='no-bordered'
				isRowClickable={hasAllowances}
				onRowClick={(row) => {
					setLedgerOpenedAt(Date.now());
					setLedgerRow(row);
				}}
			/>
			<GrantWindowLedger
				allowances={ledgerRow ? allowancesOf(ledgerRow) : []}
				now={ledgerOpenedAt}
				isOpen={Boolean(ledgerRow)}
				onOpenChange={(open) => !open && setLedgerRow(null)}
			/>
		</div>
	);
};

// Re-export for callers that import from CustomerUsageTable (legacy path).
// eslint-disable-next-line react-refresh/only-export-components -- shared helper, not a component
export { getFeatureTypeChips } from './getFeatureTypeChips';
export default CustomerUsageTable;
