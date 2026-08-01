import { FC } from 'react';

export interface CheckboxRadioGroupItem {
	label: string;
	value: string;
	description?: string;
	disabled?: boolean;
}

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

export interface Props {
	checkboxItems: CheckboxRadioGroupItem[];
	defaultValue?: string;
	onChange?: (value: string) => void;
	value?: string;
	title?: string;
	error?: string;
}

const CheckboxRadioGroup: FC<Props> = ({ error, checkboxItems, defaultValue, onChange, title, value }) => {
	return (
		<div>
			{title && <p className='text-sm text-content-zinc font-medium  mb-2'>{title}</p>}
			<RadioGroup defaultValue={defaultValue} value={value}>
				{checkboxItems.map((item) => (
					<div
						key={item.value}
						onClick={() => {
							if (onChange && !item.disabled) {
								onChange(item.value);
							}
						}}
						className='flex items-center gap-2'>
						<RadioGroupItem id={item.value} value={item.value} className='peer' disabled={item.disabled} />

						<label htmlFor={item.value} className='cursor-pointer s'>
							<p
								className={cn(
									'font-medium text-sm text-content-zinc-bold peer-checked:text-content-black',
									item.disabled && 'text-content-zinc-subtle',
								)}>
								{item.label}
							</p>
							{item.description && (
								<p
									className={cn(
										'text-sm text-content-zinc-muted peer-checked:text-content-secondary',
										item.disabled && 'text-content-zinc-subtle',
									)}>
									{item.description}
								</p>
							)}
						</label>
					</div>
				))}
			</RadioGroup>
			{/* Error Message */}
			{error && <p className='text-sm text-destructive'>{error}</p>}
		</div>
	);
};

export default CheckboxRadioGroup;
