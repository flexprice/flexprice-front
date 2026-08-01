import { cn } from '@/lib/utils';
import { FC } from 'react';
import { IconType } from 'react-icons/lib';

interface Props {
	title?: string;
	items: RadioMenuItem[];
	selected?: RadioMenuItem;
	disabled?: boolean;
	onChange?: (value: RadioMenuItem) => void;
}

interface RadioMenuItem {
	value?: string;
	label?: string;
	icon?: FC | IconType;
	description?: string;
}

const RadioGroup: FC<Props> = ({ items, onChange, selected, title, disabled }) => {
	return (
		<div>
			{title && <p className=' block text-sm font-medium mb-2'>{title}</p>}
			<div className='space-y-2'>
				{items.map((item) => {
					const isSelected = selected?.value === item.value;

					return (
						<div
							className={cn(
								'w-full items-center flex gap-4 p-2  cursor-pointer rounded-lg border',
								// isSelected ? 'bg-surface-muted' : 'bg-surface',
								disabled ? 'opacity-50 cursor-not-allowed  ' : '',
								isSelected && 'border-line-zinc-tertiary border bg-surface',
							)}
							key={item.value}
							onClick={() => {
								if (onChange && !disabled) {
									onChange(item);
								}
							}}>
							{item.icon && (
								<div className='ps-2'>
									<item.icon className={'size-5'} />
								</div>
							)}

							<div>
								<p className='font-medium  text-sm'>{item.label}</p>
								<p className='font-normal  text-sm text-content-zinc-muted '>{item.description}</p>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default RadioGroup;
export type { RadioMenuItem };
