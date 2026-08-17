import { Page, Spacer, Loader, ShortPagination } from '@/components/atoms';
import { CreditNoteTable, ApiDocsContent } from '@/components/molecules';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import usePagination from '@/hooks/usePagination';
import CreditNoteApi from '@/api/CreditNoteApi';
import { EmptyPage } from '@/components/organisms';
import { buildGuides } from '@/constants/guides';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

const CreditNotesPage = () => {
	const { t } = useTranslation('billing');
	const { t: tGuide } = useTranslation('guides');
	const guides = useMemo(() => buildGuides(tGuide), [tGuide]);
	const { limit, offset, page } = usePagination();

	const fetchCreditNotes = async () => {
		return await CreditNoteApi.getCreditNotes({
			limit,
			offset,
			expand: 'invoice,customer',
		});
	};

	const {
		data: creditNoteData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['fetchCreditNotes', page],
		queryFn: fetchCreditNotes,
	});

	if (isLoading) {
		return <Loader />;
	}

	if (isError) {
		toast.error(t('creditNotes.toast.fetchListError'));
	}

	if ((creditNoteData?.items ?? []).length === 0) {
		return (
			<EmptyPage
				heading={t('creditNotes.title')}
				tags={API_DOCS_TAGS.CreditNotes}
				tutorials={guides.creditNotes.tutorials}
				emptyStateCard={{
					heading: t('creditNotes.list.emptyHeading'),
					description: t('creditNotes.list.emptyDescription'),
				}}
			/>
		);
	}

	return (
		<Page heading={t('creditNotes.title')}>
			<ApiDocsContent tags={API_DOCS_TAGS.CreditNotes} />
			<div className='px-0'>
				<CreditNoteTable data={creditNoteData?.items || []} />
				<Spacer className='!h-4' />
				<ShortPagination unit={t('creditNotes.list.paginationUnit')} totalItems={creditNoteData?.pagination.total ?? 0} />
			</div>
		</Page>
	);
};

export default CreditNotesPage;
