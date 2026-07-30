import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CodeBlock, Sheet } from '@/components/atoms';
import { ApiDocsSnippet } from '@/store/useApiDocsStore';

export type SupportedLanguage = 'cURL' | 'Python' | 'JavaScript' | 'PHP' | 'Go' | 'Java' | 'Ruby' | 'Swift' | 'C#';

interface Props {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	snippets: ApiDocsSnippet[];
	trigger?: React.ReactNode;
}

interface SnippetBlockProps {
	snippet: ApiDocsSnippet;
}

const languageMap: Record<SupportedLanguage, string> = {
	// cURL: 'bash',
	cURL: 'javascript',
	Python: 'python',
	JavaScript: 'javascript',
	PHP: 'php',
	Go: 'go',
	Java: 'java',
	Ruby: 'ruby',
	Swift: 'swift',
	'C#': 'csharp',
};

export const SnippetBlock: FC<SnippetBlockProps> = ({ snippet }) => {
	const availableLanguages = Object.entries(snippet)
		.filter(([key, value]) => {
			// Filter out non-language properties and empty code snippets
			if (key === 'label' || key === 'description') return false;
			return value && value.trim() !== '';
		})
		.map(([key]) => (key === 'curl' ? 'cURL' : key)) as SupportedLanguage[];

	const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(availableLanguages[0] || 'cURL');

	const getCode = () => {
		return selectedLanguage === 'cURL' ? snippet.curl : snippet[selectedLanguage as keyof ApiDocsSnippet] || '';
	};

	return (
		<div className='mb-8 last:mb-0'>
			<h3 className='text-lg font-normal text-foreground'>{snippet.label}</h3>
			{snippet.description && <p className='text-sm text-gray-400'>{snippet.description}</p>}
			<div className='rounded-lg overflow-hidden border border-gray-200 mt-3'>
				{/* Language Tabs */}
				<div className='flex overflow-x-auto bg-gray-50 border-b border-gray-200'>
					{availableLanguages.map((lang) => (
						<button
							key={lang}
							onClick={() => setSelectedLanguage(lang)}
							className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
								selectedLanguage === lang
									? 'text-blue-600 border-b-2 border-blue-600 bg-white'
									: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
							}`}>
							{lang}
						</button>
					))}
				</div>

				{/* Code Block */}
				<CodeBlock code={getCode()} language={languageMap[selectedLanguage]} />
			</div>
		</div>
	);
};

const DocsDrawer: FC<Props> = ({ isOpen, onOpenChange, snippets, trigger }) => {
	const { t } = useTranslation('common');
	return (
		<Sheet isOpen={isOpen} onOpenChange={onOpenChange} title={t('labels.apiReference')} trigger={trigger} size='lg'>
			<div className='flex flex-col h-full'>
				{snippets.length === 0 && <p className='text-sm text-gray-400'>{t('labels.noDocumentationFound')}</p>}

				{/* Code Snippets Section */}
				<div className='my-6 px-1 pb-8'>
					{snippets.map((snippet, index) => (
						<SnippetBlock key={index} snippet={snippet} />
					))}
				</div>
			</div>
		</Sheet>
	);
};

export default DocsDrawer;
