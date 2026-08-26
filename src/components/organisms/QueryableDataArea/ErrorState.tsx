import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface ErrorStateProps {
	error: any;
	onError?: (error: any) => void;
}

const ErrorState = ({ error, onError }: ErrorStateProps) => {
	const { t } = useTranslation('common');
	useEffect(() => {
		const err = error as { error?: { message?: string }; message?: string } | undefined;
		const message = err?.error?.message ?? err?.message ?? t('queryableDataArea.errorFetching');
		toast.error(message);

		if (onError) {
			onError(error);
		}
	}, [error, onError, t]);

	return (
		<div className='flex justify-center items-center min-h-[12.5rem]'>
			<div>{t('queryableDataArea.errorFetching')}</div>
		</div>
	);
};

export default ErrorState;
