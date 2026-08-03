import Dialog from '@/components/atoms/Dialog/Dialog';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { FaFileExcel, FaFilePdf } from 'react-icons/fa';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

export interface InvoiceDownloadFormatDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSelectPdf: () => void | Promise<void>;
	onSelectCsv: () => void | Promise<void>;
	isPdfPending?: boolean;
	isCsvPending?: boolean;
}

const InvoiceDownloadFormatDialog: FC<InvoiceDownloadFormatDialogProps> = ({
	open,
	onOpenChange,
	onSelectPdf,
	onSelectCsv,
	isPdfPending = false,
	isCsvPending = false,
}) => {
	const { t } = useTranslation(['billing', 'common']);
	const busy = isPdfPending || isCsvPending;

	const handlePdf = async () => {
		try {
			await onSelectPdf();
		} finally {
			onOpenChange(false);
		}
	};

	const handleCsv = async () => {
		try {
			await onSelectCsv();
		} finally {
			onOpenChange(false);
		}
	};

	return (
		<Dialog
			isOpen={open}
			onOpenChange={onOpenChange}
			title={t('invoices.details.downloadInvoice')}
			description={t('invoices.details.chooseFormat')}
			className='sm:max-w-md'>
			<div className='grid grid-cols-2 gap-3 w-full'>
				<button
					type='button'
					disabled={busy}
					onClick={() => void handlePdf()}
					className={cn(
						'flex flex-col items-center justify-center gap-3 rounded-xl border border-line-zinc/90 bg-gradient-to-b from-surface to-accent-rose-muted/40 px-4 py-8 text-center transition-all',
						'hover:border-accent-rose-line hover:from-accent-rose-muted/30 hover:to-accent-rose-muted/60 hover:shadow-sm',
						'disabled:opacity-50 disabled:cursor-not-allowed',
					)}>
					<span
						className={cn(
							'flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-rose/25 via-danger-bright/20 to-danger/30 shadow-inner',
							'ring-1 ring-inset ring-danger-bright/15',
						)}>
						{isPdfPending ? (
							<Loader2 className='h-8 w-8 animate-spin text-danger' aria-hidden />
						) : (
							<FaFilePdf className='h-10 w-10 text-[#EC1C24] drop-shadow-sm' aria-hidden />
						)}
					</span>
					<span className='text-sm font-medium text-content-zinc-bold'>{t('invoices.details.downloadFormatPdf')}</span>
				</button>
				<button
					type='button'
					disabled={busy}
					onClick={() => void handleCsv()}
					className={cn(
						'flex flex-col items-center justify-center gap-3 rounded-xl border border-line-zinc/90 bg-gradient-to-b from-surface to-accent-emerald-bg/40 px-4 py-8 text-center transition-all',
						'hover:border-accent-emerald-line hover:from-accent-emerald-bg/30 hover:to-accent-emerald-bg/60 hover:shadow-sm',
						'disabled:opacity-50 disabled:cursor-not-allowed',
					)}>
					<span
						className={cn(
							'flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-emerald-soft/25 via-accent-teal/20 to-accent-teal-deep/30 shadow-inner',
							'ring-1 ring-inset ring-accent-emerald/15',
						)}>
						{isCsvPending ? (
							<Loader2 className='h-8 w-8 animate-spin text-accent-emerald-strong' aria-hidden />
						) : (
							<FaFileExcel className='h-10 w-10 text-[#217346] drop-shadow-sm' aria-hidden />
						)}
					</span>
					<span className='text-sm font-medium text-content-zinc-bold'>{t('invoices.details.downloadFormatCsv')}</span>
				</button>
			</div>
		</Dialog>
	);
};

export default InvoiceDownloadFormatDialog;
