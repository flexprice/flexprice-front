import React from 'react';
import { useTranslation } from 'react-i18next';
import Dialog from '@/components/atoms/Dialog/Dialog';
import { Check } from 'lucide-react';

interface RegionInfoDialogProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
}

const RegionInfoDialog: React.FC<RegionInfoDialogProps> = ({ isOpen, onOpenChange }) => {
	const { t } = useTranslation('settings');
	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={t('region.dialogTitle')}
			description={t('region.dialogDescription')}
			className='max-w-2xl'>
			<div className='space-y-6'>
				<div>
					<h3 className='font-semibold text-base mb-3'>{t('region.sectionUs')}</h3>
					<ul className='space-y-2'>
						<li className='flex items-start gap-2'>
							<Check className='h-5 w-5 text-green-600 mt-0.5 flex-shrink-0' />
							<span className='text-sm text-gray-700'>{t('region.benefitUs1')}</span>
						</li>
						<li className='flex items-start gap-2'>
							<Check className='h-5 w-5 text-green-600 mt-0.5 flex-shrink-0' />
							<span className='text-sm text-gray-700'>{t('region.benefitUs2')}</span>
						</li>
						<li className='flex items-start gap-2'>
							<Check className='h-5 w-5 text-green-600 mt-0.5 flex-shrink-0' />
							<span className='text-sm text-gray-700'>{t('region.benefitUs3')}</span>
						</li>
					</ul>
				</div>

				<div>
					<h3 className='font-semibold text-base mb-3'>{t('region.sectionIndia')}</h3>
					<ul className='space-y-2'>
						<li className='flex items-start gap-2'>
							<Check className='h-5 w-5 text-green-600 mt-0.5 flex-shrink-0' />
							<span className='text-sm text-gray-700'>{t('region.benefitIn1')}</span>
						</li>
						<li className='flex items-start gap-2'>
							<Check className='h-5 w-5 text-green-600 mt-0.5 flex-shrink-0' />
							<span className='text-sm text-gray-700'>{t('region.benefitIn2')}</span>
						</li>
					</ul>
				</div>
			</div>
		</Dialog>
	);
};

export default RegionInfoDialog;
