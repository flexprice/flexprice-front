import { FC } from 'react';
import { HighlightProps, Highlight, themes } from 'prism-react-renderer';
import { cn } from '@/lib/utils';
import { Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Button } from '../Button';
import { useThemeStore } from '@/store/useThemeStore';

const CodeHighlighter = Highlight as unknown as FC<HighlightProps>;

interface Props {
	code: string;
	language?: string;
	title?: string;
	className?: string;
}

const CodePreview: FC<Props> = ({ code, language, className: styles, title }) => {
	const { t } = useTranslation('common');
	const isDark = useThemeStore((s) => s.theme) === 'dark';
	const codeTheme = isDark ? themes.nightOwl : themes.nightOwlLight;

	return (
		<>
			<div className={cn('bg-muted border border-border rounded-[6px]')} dir='ltr'>
				<div className='flex justify-between py-2 px-6 items-center w-full'>
					<p className='font-semibold text-lg text-foreground'>{title}</p>
					<Button
						onClick={() => {
							navigator.clipboard.writeText(code);
							toast.success(t('toast.copySuccess'));
						}}
						className='text-muted-foreground cursor-pointer size-10'
						variant={'ghost'}
						dir='ltr'>
						<Copy className='text-muted-foreground' />
					</Button>
				</div>
				<div className='p-3 bg-muted' dir='ltr'>
					<CodeHighlighter theme={codeTheme} code={code} language={language ?? 'javascript'}>
						{({ className, style, tokens, getLineProps, getTokenProps }) => (
							<pre
								dir='ltr'
								className={cn(className, styles)}
								style={{ ...style, padding: '0.5rem', borderRadius: '6px', overflowX: 'auto', direction: 'ltr' }}>
								{tokens.map((line, i) => (
									<div key={i} {...getLineProps({ line })} dir='ltr'>
										{line.map((token, key) => (
											<span key={key} {...getTokenProps({ token })} className='font-fira-code text-xs' dir='ltr' />
										))}
									</div>
								))}
							</pre>
						)}
					</CodeHighlighter>
				</div>
			</div>
		</>
	);
};

export default CodePreview;
