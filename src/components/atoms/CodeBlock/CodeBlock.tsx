import { Copy } from 'lucide-react';
import { Highlight, PrismTheme, themes } from 'prism-react-renderer';
import toast from 'react-hot-toast';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
	code: string;
	language: string;
	theme?: PrismTheme | undefined;
	className?: string;
}

const CodeBlock: FC<CodeBlockProps> = ({ code, language, theme = themes.nightOwl, className }) => {
	const { t } = useTranslation('common');
	const handleCopyCode = () => {
		navigator.clipboard.writeText(code);
		toast.success(t('toast.codeCopied'));
	};

	return (
		<div className={cn('relative', className)}>
			<Highlight theme={theme} code={code} language={language}>
				{({ className, style, tokens, getLineProps, getTokenProps }) => (
					<pre dir='ltr' className={`${className} p-4 overflow-x-auto`} style={style}>
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
			<button
				onClick={handleCopyCode}
				className='absolute top-3 right-3 p-2 bg-gray-800/30 hover:bg-gray-800/50 rounded-md text-white transition-colors'
				title={t('labels.copyToClipboard')}>
				<Copy size={16} />
			</button>
		</div>
	);
};

export default CodeBlock;
