import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const LoadingElapsed = () => {
	const { t } = useTranslation('settings');
	const [ms, setMs] = useState(0);
	useEffect(() => {
		const start = Date.now();
		const id = setInterval(() => setMs(Date.now() - start), 100);
		return () => clearInterval(id);
	}, []);
	if (ms < 1000) return null;
	return (
		<span className='text-xs tabular-nums text-content-zinc-tertiary'>
			{t('insightsTools.revenue.dashboard.stillLoading', { seconds: (ms / 1000).toFixed(1) })}
		</span>
	);
};

export default LoadingElapsed;
