import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Tooltip from '@/components/atoms/Tooltip/Tooltip';
import RegionInfoDialog from './RegionInfoDialog';
import { Region } from '@/types/enums/Region';
import { detectCurrentRegion, switchRegion, getDashboardUrls } from '@/utils/region/regionUtils';
import { IN, US } from 'country-flag-icons/react/3x2';
import { Info } from 'lucide-react';
import { config } from '@/config/config';

const RegionSelectorImpl: React.FC = () => {
	const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isDisabled, setIsDisabled] = useState(false);

	// Detect current region on mount
	useEffect(() => {
		const currentRegion = detectCurrentRegion();
		setSelectedRegion(currentRegion);

		// Check if both URLs are configured
		const urls = getDashboardUrls();
		if (!urls.india && !urls.us) {
			setIsDisabled(true);
		}
	}, []);

	const handleRegionChange = (value: string) => {
		const newRegion = value as Region;
		setSelectedRegion(newRegion);
		switchRegion(newRegion);
	};

	const regionOptions = [
		{ value: Region.INDIA, label: 'India', icon: IN },
		{ value: Region.US, label: 'United States', icon: US },
	];

	// Filter options based on available URLs
	const availableOptions = regionOptions.filter((option) => {
		const urls = getDashboardUrls();
		if (option.value === Region.INDIA) return !!urls.india;
		if (option.value === Region.US) return !!urls.us;
		return false;
	});

	return (
		<div className='space-y-2'>
			{/* Label with tooltip */}
			<div className='flex items-center gap-1'>
				<label className='block text-sm font-medium text-gray-700'>Data region</label>
				<Tooltip content='Click to learn more about regions'>
					<button
						type='button'
						onClick={() => setIsDialogOpen(true)}
						className='text-sm text-[#0E5AC9] hover:text-[#0E5AC9] hover:underline cursor-pointer'>
						<Info size={16} className='text-grey' />
					</button>
				</Tooltip>
			</div>

			{/* Select dropdown */}
			<Select value={selectedRegion || undefined} onValueChange={handleRegionChange} disabled={isDisabled || availableOptions.length === 0}>
				<SelectTrigger className='w-full'>
					{selectedRegion ? (
						(() => {
							const selectedOption = regionOptions.find((opt) => opt.value === selectedRegion);
							const IconComponent = selectedOption?.icon;
							return selectedOption && IconComponent ? (
								<div className='flex items-center gap-2'>
									<IconComponent className='h-4 w-5' />
									<span>{selectedOption.label}</span>
								</div>
							) : (
								<SelectValue placeholder='Select a region' />
							);
						})()
					) : (
						<SelectValue placeholder='Select a region' />
					)}
				</SelectTrigger>
				<SelectContent>
					{availableOptions.map((option) => {
						const fullOption = regionOptions.find((opt) => opt.value === option.value);
						const IconComponent = fullOption?.icon;
						return (
							<SelectItem key={option.value} value={option.value}>
								<div className='flex items-center gap-2'>
									{IconComponent && <IconComponent className='h-4 w-5' />}
									<span>{option.label}</span>
								</div>
							</SelectItem>
						);
					})}
				</SelectContent>
			</Select>

			{/* Region Info Dialog */}
			<RegionInfoDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} />
		</div>
	);
};

const RegionSelector: React.FC = () => {
	if (!config.region.dataRegionSelectionEnabled) {
		return null;
	}
	return <RegionSelectorImpl />;
};

export default RegionSelector;
