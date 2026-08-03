import { Progress, Tooltip } from '@/components/atoms';
import { ColumnData, FlexpriceTable, RedirectCell } from '@/components/molecules';
import { RouteNames } from '@/core/routes/Routes';
import { FEATURE_TYPE } from '@/models/Feature';
import { FC, useMemo } from 'react';
import CustomerUsage, { EntitlementSource, ENTITLEMENT_SOURCE_ENTITY_TYPE } from '@/models/CustomerUsage';
import { formatAmount } from '@/components/atoms/Input/Input';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { getFeatureTypeChips } from './getFeatureTypeChips';

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

const CustomerUsageTable: FC<Props> = ({ data, allowRedirect = true }) => {
	const { t } = useTranslation('customers');

	const columnData: ColumnData<CustomerUsage>[] = useMemo(() => {
		const getFeatureValue = (usageRow: CustomerUsage) => {
			switch (usageRow.feature.type) {
				case FEATURE_TYPE.STATIC:
					return usageRow.sources?.[0]?.static_value ?? t('usageTable.fallback');
				case FEATURE_TYPE.METERED:
					return (
						<span className='flex items-end gap-1'>
							{usageRow.is_unlimited
								? t('usageTable.unlimitedLabel')
								: usageRow.total_limit
									? formatAmount(usageRow.total_limit?.toString())
									: t('usageTable.unlimitedLabel')}
							<span className='text-content-slate-muted text-sm font-normal font-sans'>{t('usageTable.units')}</span>
						</span>
					);
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
					return (
						<RedirectCell allowRedirect={allowRedirect} redirectUrl={`${RouteNames.featureDetails}/${row?.feature?.id}`}>
							{getFeatureTypeChips({
								type: row?.feature?.type || '',
								showIcon: true,
							})}
							{row?.feature?.name}
						</RedirectCell>
					);
				},
			},
			{
				title: t('usageTable.columns.plan'),
				render(row) {
					const sources = row?.sources || [];

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
					return getFeatureValue(row);
				},
			},
			{
				title: t('usageTable.columns.usage'),
				render(row) {
					if (row?.feature?.type != FEATURE_TYPE.METERED) {
						return t('usageTable.fallback');
					}
					const usage = Number(row?.current_usage);
					const limit = row?.is_unlimited ? null : row?.total_limit ? Number(row.total_limit) : null;

					if (row?.is_unlimited || !limit) {
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
	}, [allowRedirect, t]);

	return (
		<div>
			<FlexpriceTable showEmptyRow data={data} columns={columnData} variant='no-bordered' />
		</div>
	);
};

// Re-export for callers that import from CustomerUsageTable (legacy path).
// eslint-disable-next-line react-refresh/only-export-components -- shared helper, not a component
export { getFeatureTypeChips } from './getFeatureTypeChips';
export default CustomerUsageTable;
