import { CirclePlus } from 'lucide-react';

interface Props {
	onClick: () => void;
	label: string;
}

const AddActionButton = ({ onClick, label }: Props) => (
	<button onClick={onClick} className='p-4 h-7 cursor-pointer flex gap-2 items-center bg-[#F4F4F5] rounded-md'>
		<CirclePlus size={16} />
		<p className='text-[#18181B] text-sm font-medium'>{label}</p>
	</button>
);

export default AddActionButton;
