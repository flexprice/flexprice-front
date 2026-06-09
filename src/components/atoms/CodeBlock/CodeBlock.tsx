import { Copy } from 'lucide-react';
import { Highlight, PrismTheme, themes } from 'prism-react-renderer';
import toast from 'react-hot-toast';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/store/useThemeStore';

interface CodeBlockProps {
	code: string;
	language: string;
	theme?: PrismTheme | undefined;
	className?: string;
}

const CodeBlock: FC<CodeBlockProps> = ({ code, language, theme, className }) => {
	const { t } = useTranslation('common');
	const isDark = useThemeStore((s) => s.theme) === 'dark';
	const activeTheme = theme ?? (isDark ? themes.nightOwl : themes.nightOwlLight);

	const handleCopyCode = () => {
		navigator.clipboard.writeText(code);
		toast.success(t('toast.codeCopied'));
	};

	return (
		<div className={cn('relative', className)}>
			<Highlight theme={activeTheme} code={code} language={language}>
				{({ className: preClassName, style, tokens, getLineProps, getTokenProps }) => (
					<pre dir='ltr' className={`${preClassName} p-4 overflow-x-auto rounded-md`} style={style}>
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
				className='absolute top-3 right-3 p-2 bg-muted hover:bg-accent rounded-md text-foreground transition-colors'
				title={t('labels.copyToClipboard')}>
				<Copy size={16} />
			</button>
		</div>
	);
};

export default CodeBlock;
