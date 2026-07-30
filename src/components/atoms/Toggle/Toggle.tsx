import { Label } from '@/components/ui/label';
import { FormHeader, Spacer } from '..';
import { Switch } from '@/components/ui/switch';
import { FC, useId } from 'react';
interface Props {
	onChange: (value: boolean) => void;
	checked: boolean;
	title?: string;
	label?: string;
	description?: string;
	error?: string;
	disabled?: boolean;
	className?: string;
}

const Toggle: FC<Props> = ({ onChange, checked, description, error, label, title, disabled, className }) => {
	const switchId = useId();

	return (
		<div>
			<FormHeader title={title} variant='form-component-title' />
			<div className='flex items-start space-x-4 s'>
				<Switch id={switchId} checked={checked} onCheckedChange={onChange} disabled={disabled} className={className} />
				<Label htmlFor={switchId}>
					<p className='font-medium text-sm text-[#18181B] peer-checked:text-black'>{label}</p>
					<Spacer height={'4px'} />
					<p className='text-sm font-normal text-[#71717A] peer-checked:text-gray-700'>{description}</p>
				</Label>
			</div>
			{error && <p className='text-sm text-destructive'>{error}</p>}
		</div>
	);
};

export default Toggle;
