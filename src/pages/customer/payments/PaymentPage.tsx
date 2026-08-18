import { ApiDocsContent, FlatTabs } from '@/components/molecules';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import { Page } from '@/components/atoms';
import PaymentList from './PaymentList';
import WalletTransactionList from './WalletTransactionList';
import { useTranslation } from 'react-i18next';

const PaymentPage = () => {
	const { t } = useTranslation('billing');

	return (
		<Page className='max-w-none' heading={t('payments.title')}>
			<ApiDocsContent tags={API_DOCS_TAGS.Payments} />
			<div className='space-y-6'>
				<FlatTabs
					tabs={[
						{
							value: 'payments',
							label: t('payments.tabPayments'),
							content: <PaymentList />,
						},
						{
							value: 'wallet-transactions',
							label: t('payments.tabWalletTransactions'),
							content: <WalletTransactionList />,
						},
					]}
				/>
			</div>
		</Page>
	);
};

export default PaymentPage;
