import { useTranslation } from 'react-i18next';

const ComingSoonTag = () => {
	const { t } = useTranslation('common');
	return (
		<div className=' top-2 right-2 bg-[#FEF08A] text-[#D97706] text-xs !font-semibold px-2 py-1 rounded-2xl !opacity-55'>
			{t('labels.comingSoon')}
		</div>
	);
};

export default ComingSoonTag;
