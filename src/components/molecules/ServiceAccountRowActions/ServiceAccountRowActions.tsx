import { FC, useState } from 'react';
import { BsThreeDots } from 'react-icons/bs';
import { Copy, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { copyToClipboard } from '@/utils/common/helper_functions';
import { User } from '@/models';

interface Props {
	account: User;
	onEdit: (account: User) => void;
	onDelete: (account: User) => void;
}

const ServiceAccountRowActions: FC<Props> = ({ account, onEdit, onDelete }) => {
	const { t } = useTranslation('common');
	const [isOpen, setIsOpen] = useState(false);

	const handleClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsOpen(!isOpen);
	};

	return (
		<div data-interactive='true' onClick={handleClick}>
			<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
				<DropdownMenuTrigger asChild>
					<button>
						<BsThreeDots className='text-base size-4' />
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end'>
					<DropdownMenuItem
						onSelect={(event) => {
							event.preventDefault();
							setIsOpen(false);
							void copyToClipboard(account.id, t('copyId.toastWithType', { type: 'Service Account' }));
						}}
						className='flex gap-2 items-center w-full cursor-pointer'>
						<Copy />
						<span>{t('copyId.genericLabel')}</span>
					</DropdownMenuItem>
					<DropdownMenuItem
						onSelect={(event) => {
							event.preventDefault();
							setIsOpen(false);
							onEdit(account);
						}}
						className='flex gap-2 items-center w-full cursor-pointer'>
						<Pencil />
						<span>{t('actions.edit')}</span>
					</DropdownMenuItem>
					<DropdownMenuItem
						onSelect={(event) => {
							event.preventDefault();
							setIsOpen(false);
							onDelete(account);
						}}
						className='flex gap-2 items-center w-full cursor-pointer'>
						<Trash2 className='h-4 w-4' />
						<span>{t('actions.delete')}</span>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};

export default ServiceAccountRowActions;
