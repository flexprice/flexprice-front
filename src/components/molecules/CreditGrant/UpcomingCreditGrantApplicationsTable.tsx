import React, { useMemo, useCallback } from 'react';
import { FormHeader, Chip, Tooltip } from '@/components/atoms';
import FlexpriceTable, { ColumnData, RedirectCell } from '../Table';
import { CreditGrantApplication, APPLICATION_STATUS } from '@/models';
import { formatDateShort } from '@/utils/common/helper_functions';
import { formatDateTimeWithSecondsAndTimezone } from '@/utils/common/format_date';
import { formatAmount } from '@/components/atoms/Input/inputFormatting';
import { Card } from '@/components/atoms';
import { useTranslation } from 'react-i18next';

interface UpcomingCreditGrantApplicationsTableProps {
	data: CreditGrantApplication[];
	customerId?: string;
}

const UpcomingCreditGrantApplicationsTable: React.FC<UpcomingCreditGrantApplicationsTableProps> = ({ data, customerId }) => {
	const { t } = useTranslation('billing');

	const getStatusChip = useCallback(
		(status: APPLICATION_STATUS) => {
			switch (status) {
				case APPLICATION_STATUS.PENDING:
					return <Chip variant='success' label={t('creditGrant.upcomingApplications.statusScheduled')} />;
				case APPLICATION_STATUS.APPLIED:
					return <Chip variant='success' label={t('creditGrant.upcomingApplications.statusApplied')} />;
				case APPLICATION_STATUS.FAILED:
					return <Chip variant='failed' label={t('creditGrant.upcomingApplications.statusFailed')} />;
				case APPLICATION_STATUS.SKIPPED:
					return <Chip variant='default' label={t('creditGrant.upcomingApplications.statusSkipped')} />;
				case APPLICATION_STATUS.CANCELLED:
					return <Chip variant='failed' label={t('creditGrant.upcomingApplications.statusCancelled')} />;
				default:
					return <Chip variant='default' label={status} />;
			}
		},
		[t],
	);

	const columns: ColumnData<CreditGrantApplication>[] = useMemo(
		() => [
			{
				title: t('creditGrant.upcomingApplications.columnCredits'),
				render: (row) => {
					return <span>{formatAmount(row.credits.toString())}</span>;
				},
			},
			{
				title: t('creditGrant.upcomingApplications.columnScheduledFor'),
				render: (row) => {
					return (
						<Tooltip content={formatDateTimeWithSecondsAndTimezone(row.scheduled_for)} delayDuration={0} sideOffset={5}>
							<span>{formatDateShort(row.scheduled_for)}</span>
						</Tooltip>
					);
				},
			},

			...(customerId
				? [
						{
							title: t('creditGrant.upcomingApplications.columnSubscription'),
							width: '100px',
							render: (row) => {
								if (row.subscription_id) {
									const redirectUrl = `/billing/customers/${customerId}/subscription/${row.subscription_id}`;
									return (
										<RedirectCell redirectUrl={redirectUrl} allowRedirect={!!row.subscription_id}>
											{row.subscription_id}
										</RedirectCell>
									);
								}
								return <span>{t('creditGrant.upcomingApplications.emptyCell')}</span>;
							},
						} as ColumnData<CreditGrantApplication>,
					]
				: []),
			{
				title: t('creditGrant.upcomingApplications.columnStatus'),
				render: (row) => {
					return getStatusChip(row.application_status);
				},
			},
		],
		[t, customerId, getStatusChip],
	);

	if (!data || data.length === 0) {
		return null;
	}

	return (
		<Card className='card mt-8'>
			<FormHeader title={t('creditGrant.upcomingApplications.sectionTitle')} variant='sub-header' titleClassName='font-semibold' />
			<div className='mt-4'>
				<FlexpriceTable data={data} columns={columns} showEmptyRow={false} />
			</div>
		</Card>
	);
};

export default UpcomingCreditGrantApplicationsTable;
