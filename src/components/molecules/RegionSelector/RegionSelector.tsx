// src/components/molecules/RegionSelector/RegionSelector.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Tooltip from '@/components/atoms/Tooltip/Tooltip';
import RegionInfoDialog from './RegionInfoDialog';
import { RegionOption } from '@/config/authTemplates';
import { detectCurrentRegion, switchRegion } from '@/utils/region/regionUtils';
import { getFlagComponent } from '@/utils/region/flagMap';
import { Info } from 'lucide-react';
import { config } from '@/config/config';

const RegionSelectorImpl: React.FC = () => {
	const { t } = useTranslation('settings');
	const { regions } = config.regions;
	const [selectedRegion, setSelectedRegion] = useState<RegionOption | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	useEffect(() => {
		setSelectedRegion(detectCurrentRegion(regions));
	}, [regions]);

	const handleRegionChange = (key: string) => {
		const region = regions.find((r) => r.key === key);
		if (!region) return;
		setSelectedRegion(region);
		switchRegion(region);
	};

	return (
		<div className='space-y-2'>
			<div className='flex items-center gap-1'>
				<label className='block text-sm font-medium text-gray-700'>{t('region.dataRegion')}</label>
				<Tooltip content={t('region.tooltipLearnMore')}>
					<button type='button' onClick={() => setIsDialogOpen(true)} className='text-sm text-[#0E5AC9] cursor-pointer'>
						<Info size={16} className='text-grey' />
					</button>
				</Tooltip>
			</div>
			<Select value={selectedRegion?.key ?? ''} onValueChange={handleRegionChange} disabled={regions.length === 0}>
				<SelectTrigger className='w-full'>
					{selectedRegion ? (
						(() => {
							const FlagIcon = getFlagComponent(selectedRegion.countryCode);
							return (
								<div className='flex items-center gap-2'>
									{FlagIcon && <FlagIcon className='h-4 w-5' />}
									<span>{selectedRegion.label}</span>
								</div>
							);
						})()
					) : (
						<SelectValue placeholder={t('region.selectPlaceholder')} />
					)}
				</SelectTrigger>
				<SelectContent>
					{regions.map((region) => {
						const FlagIcon = getFlagComponent(region.countryCode);
						return (
							<SelectItem key={region.key} value={region.key}>
								<div className='flex items-center gap-2'>
									{FlagIcon && <FlagIcon className='h-4 w-5' />}
									<span>{region.label}</span>
								</div>
							</SelectItem>
						);
					})}
				</SelectContent>
			</Select>
			<RegionInfoDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} />
		</div>
	);
};

const RegionSelector: React.FC = () => {
	if (!config.regions.enabled) return null;
	return <RegionSelectorImpl />;
};

export default RegionSelector;
