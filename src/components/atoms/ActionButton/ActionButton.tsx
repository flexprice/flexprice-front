import { BsThreeDots } from 'react-icons/bs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FC, useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button, Dialog } from '@/components/atoms';
import { EyeOff, Pencil } from 'lucide-react';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';

interface EditActionConfig {
	enabled?: boolean;
	path?: string;
	onClick?: () => void;
	text?: string;
	icon?: React.ReactNode;
}

interface ArchiveActionConfig {
	enabled?: boolean;
	text?: string;
	icon?: React.ReactNode;
}

interface CustomAction {
	text: string;
	icon?: React.ReactNode;
	onClick: () => void;
	enabled?: boolean;
}

interface ActionProps {
	id: string;
	deleteMutationFn: (id: string) => Promise<void>;
	refetchQueryKey: string;
	entityName: string;
	triggerIcon?: React.ReactNode;
	edit?: EditActionConfig;
	archive?: ArchiveActionConfig;
	customActions?: CustomAction[];
	disableToast?: boolean;
	// Legacy props for backward compatibility
	row?: unknown;
	editPath?: string;
	onEdit?: () => void;
	isArchiveDisabled?: boolean;
	isEditDisabled?: boolean;
	archiveText?: string;
	editText?: string;
	archiveIcon?: React.ReactNode;
	editIcon?: React.ReactNode;
}

const ActionButton: FC<ActionProps> = ({
	id,
	deleteMutationFn,
	refetchQueryKey,
	entityName,
	triggerIcon,
	edit,
	archive,
	customActions,
	disableToast = false,
	// Legacy props
	editPath,
	onEdit,
	isArchiveDisabled,
	isEditDisabled,
	archiveText,
	editText,
	archiveIcon,
	editIcon,
	row: _row,
}) => {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const navigate = useNavigate();

	// Consolidate props: use new config objects if provided, otherwise fall back to legacy props
	const editConfig: EditActionConfig = edit || {
		enabled: !isEditDisabled,
		path: editPath,
		onClick: onEdit,
		text: editText,
		icon: editIcon,
	};

	const archiveConfig: ArchiveActionConfig = archive || {
		enabled: !isArchiveDisabled,
		text: archiveText,
		icon: archiveIcon,
	};

	const archiveActionText = archiveConfig.text || 'Archive';
	const editActionText = editConfig.text || 'Edit';

	const { mutate: deleteEntity } = useMutation({
		mutationFn: deleteMutationFn,
		onSuccess: async () => {
			if (!disableToast) {
				toast.success(`Successfully ${archiveActionText.toLowerCase()}d ${entityName}`);
			}
			await refetchQueries(refetchQueryKey);
		},
		onError: (err: ServerError) => {
			if (!disableToast) {
				toast.error(err.error.message || `Failed to ${archiveActionText.toLowerCase()} ${entityName}. Please try again.`);
			}
		},
	});

	const handleClick = (e: React.MouseEvent) => {
		// Prevent event from bubbling up to parent elements
		e.preventDefault();
		e.stopPropagation();
		setIsOpen(!isOpen);
	};

	const defaultTriggerIcon = <BsThreeDots className='text-base size-4' />;
	const trigger = triggerIcon || defaultTriggerIcon;

	return (
		<>
			<div data-interactive='true' onClick={handleClick}>
				<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
					<DropdownMenuTrigger asChild>
						<button>{trigger}</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align='end'>
						{editConfig.enabled !== false && (
							<DropdownMenuItem
								onSelect={(event) => {
									event.preventDefault();
									setIsOpen(false);
									if (editConfig.onClick) {
										editConfig.onClick();
									} else if (editConfig.path) {
										navigate(editConfig.path);
									}
								}}
								className='flex gap-2 items-center w-full cursor-pointer'>
								{editConfig.icon || <Pencil />}
								<span>{editActionText}</span>
							</DropdownMenuItem>
						)}
						{archiveConfig.enabled !== false && (
							<DropdownMenuItem
								onSelect={(event) => {
									event.preventDefault();
									setIsOpen(false);
									setIsDialogOpen(true);
								}}
								className='flex gap-2 items-center w-full cursor-pointer'>
								{archiveConfig.icon || <EyeOff />}
								<span>{archiveActionText}</span>
							</DropdownMenuItem>
						)}
						{customActions?.map(
							(action, index) =>
								action.enabled !== false && (
									<DropdownMenuItem
										key={index}
										onSelect={(event) => {
											event.preventDefault();
											setIsOpen(false);
											action.onClick();
										}}
										className='flex gap-2 items-center w-full cursor-pointer'>
										{action.icon}
										<span>{action.text}</span>
									</DropdownMenuItem>
								),
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<Dialog
				title={`Are you sure you want to ${archiveActionText.toLowerCase()} this ${entityName}?`}
				titleClassName='text-lg font-normal text-gray-800 w-[90%]'
				isOpen={isDialogOpen}
				onOpenChange={setIsDialogOpen}
				showCloseButton={false}>
				<div className='flex flex-col gap-4 items-end justify-center'>
					<div className='flex gap-4'>
						<Button variant='outline' onClick={() => setIsDialogOpen(false)}>
							Cancel
						</Button>
						<Button
							onClick={() => {
								setIsDialogOpen(false);
								deleteEntity(id);
							}}>
							{archiveActionText}
						</Button>
					</div>
				</div>
			</Dialog>
		</>
	);
};

export default ActionButton;
