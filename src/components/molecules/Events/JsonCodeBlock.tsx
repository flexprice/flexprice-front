import { FC, useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/atoms';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface JsonCodeBlockProps {
	value: unknown;
	title?: string;
	onCopy?: () => void;
	className?: string;
}

const JsonCodeBlock: FC<JsonCodeBlockProps> = ({ value, title, onCopy, className }) => {
	const { t } = useTranslation(['developers', 'common']);
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		if (onCopy) {
			onCopy();
		} else {
			navigator.clipboard.writeText(JSON.stringify(value ?? {}, null, 2));
			toast.success(t('common:toast.copySuccess'));
		}
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className={cn('rounded-lg overflow-hidden border border-border bg-muted', className)}>
			<div className='px-4 py-2 border-b border-border bg-card flex items-center justify-between'>
				<p className='text-xs font-medium text-foreground'>{title || t('common:labels.payload')}</p>
				<Button onClick={handleCopy} variant='ghost' size='sm' className={cn('h-7 transition-colors', copied && 'text-green-500')}>
					{copied ? <Check size={12} className='me-1 text-green-500' /> : <Copy size={12} className='me-1' />}
					<span className='text-xs'>{copied ? t('common:actions.copied') : t('common:actions.copy')}</span>
				</Button>
			</div>
			<div className='relative'>
				<Highlight theme={themes.nightOwl} code={JSON.stringify(value ?? {}, null, 2)} language='json'>
					{({ className, style, tokens, getLineProps, getTokenProps }) => (
						<pre className={cn(className, 'p-4 overflow-x-auto')} style={style}>
							{tokens.map((line, i) => (
								<div key={i} {...getLineProps({ line })}>
									{line.map((token, key) => (
										<span key={key} {...getTokenProps({ token })} className='text-sm font-normal font-fira-code' />
									))}
								</div>
							))}
						</pre>
					)}
				</Highlight>
			</div>
		</div>
	);
};

export default JsonCodeBlock;
