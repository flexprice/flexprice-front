import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface Props {
	open: boolean;
	title: string;
	initialName: string;
	error?: string;
	pending: boolean;
	onSubmit: (name: string) => void;
	onClose: () => void;
}

// Remount resets the name.
const NameForm = ({ initialName, error, pending, onSubmit, onClose }: Omit<Props, 'open' | 'title'>) => {
	const { t } = useTranslation('settings');
	const [name, setName] = useState(initialName);
	const trimmed = name.trim();
	return (
		<form
			className='flex flex-col gap-4'
			onSubmit={(e) => {
				e.preventDefault();
				if (trimmed && !pending) onSubmit(trimmed);
			}}>
			<label className='flex flex-col gap-1.5 text-sm'>
				<span className='font-medium'>{t('insightsTools.revenue.reports.nameLabel')}</span>
				<Input autoFocus value={name} onChange={(e) => setName(e.target.value)} />
			</label>
			{error && (
				<span role='alert' className='text-sm text-red-600'>
					{error}
				</span>
			)}
			<DialogFooter>
				<Button type='button' variant='outline' onClick={onClose}>
					{t('insightsTools.revenue.reports.cancel')}
				</Button>
				<Button type='submit' disabled={!trimmed || pending}>
					{t('insightsTools.revenue.reports.save')}
				</Button>
			</DialogFooter>
		</form>
	);
};

const SaveReportDialog = ({ open, title, onClose, ...rest }: Props) => (
	<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
		<DialogContent aria-describedby={undefined} className='w-full max-w-md bg-surface'>
			<DialogHeader>
				<DialogTitle>{title}</DialogTitle>
			</DialogHeader>
			<NameForm onClose={onClose} {...rest} />
		</DialogContent>
	</Dialog>
);

export default SaveReportDialog;
