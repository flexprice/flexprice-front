import { ComingSoonTag, FormHeader } from '@/components/atoms';
import { cn } from '@/lib/utils';
import { LucideProps } from 'lucide-react';
import React, { FC } from 'react';
import PremiumFeature, { PremiumFeatureTag } from '../PremiumFeature';
export interface RectangleRadiogroupOption {
	value: string;
	label: string;
	icon?: React.ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>>;
	disabled?: boolean;
	comingSoon?: boolean;
	premium?: boolean;
	description?: string;
}

interface Props {
	options: RectangleRadiogroupOption[];
	value?: string;
	onChange: (value: string) => void;
	title?: string;
	description?: string;
}

const RectangleRadiogroup: FC<Props> = ({ onChange, options, value, description, title }) => {
	return (
		<div>
			{title && <FormHeader title={title} variant='form-component-title' />}
			<div className='w-full grid grid-cols-2 gap-4'>
				{options.map((option, index) => {
					return (
						<PremiumFeature key={index} isPremiumFeature={option.premium}>
							<button
								onClick={() => {
									if (!option.disabled) {
										if (option.value === value) {
											onChange('');
										} else {
											onChange(option.value);
										}
									}
								}}
								className={cn(
									'relative p-3 py-6 border-2 w-full flex flex-col justify-center items-center rounded-xl',
									option.value === value ? 'border-[#0F172A]' : 'border-[#E2E8F0]',
									option.disabled && !option.premium ? 'cursor-default text-zinc-500 ' : 'cursor-pointer',
								)}>
								{option.icon && <option.icon size={24} className={cn(option.disabled ? '  ' : 'text-[#020617]')} />}
								{option.comingSoon && (
									<div className='absolute top-2 right-2'>
										<ComingSoonTag />
									</div>
								)}
								{option.premium && (
									<div className='absolute top-2 right-2'>
										<PremiumFeatureTag />
									</div>
								)}
								<p className={cn(option.disabled ? '' : 'text-[#18181B] font-medium')}>{option.label}</p>
								{option.description && <p className='text-sm text-[#64748B] font-sans '>{option.description}</p>}
							</button>
						</PremiumFeature>
					);
				})}
			</div>
			{description && <p className='text-sm text-[#64748B] font-sans '>{description}</p>}
		</div>
	);
};

export default RectangleRadiogroup;
