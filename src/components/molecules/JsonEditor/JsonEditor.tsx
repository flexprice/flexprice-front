import { FC, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { themes } from 'prism-react-renderer';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/atoms';
import { cn } from '@/lib/utils';
import { JsonObject } from '@/types/common';

interface JsonEditorProps {
	value: JsonObject | null | undefined;
	onChange: (value: JsonObject | null, raw: string) => void;
}

const EMPTY_TEMPLATE = '{\n  \n}';

const formatJson = (obj: JsonObject): string => JSON.stringify(obj, null, 2);

type ParseResult = { ok: true; value: JsonObject } | { ok: false; invalidJson: boolean };

const tryParse = (text: string): ParseResult => {
	try {
		const parsed = JSON.parse(text);
		if (typeof parsed === 'object' && !Array.isArray(parsed) && parsed !== null) {
			return { ok: true, value: parsed as JsonObject };
		}
		return { ok: false, invalidJson: false };
	} catch {
		return { ok: false, invalidJson: true };
	}
};

// Night Owl palette — exact values from prism-react-renderer's nightOwl theme,
// matching what the read-only JsonCodeBlock renders.
const COLORS = {
	key: '#7fdbca',
	string: '#addb67',
	number: '#addb67',
	boolean: '#addb67',
	null: '#addb67',
	punctuation: '#c792ea',
};

const escapeHtml = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Build colored HTML for a JSON string. textContent of the result equals the
// original text exactly, so caret offsets map 1:1 onto rawText indices.
const highlightJson = (text: string): string => {
	const tokenRe = /("(?:\\.|[^"\\])*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false)\b|\b(null)\b|([{}[\]:,])/g;
	const span = (color: string, content: string) => `<span style="color:${color}">${escapeHtml(content)}</span>`;
	let result = '';
	let last = 0;
	let m: RegExpExecArray | null;
	while ((m = tokenRe.exec(text)) !== null) {
		if (m.index > last) result += escapeHtml(text.slice(last, m.index));
		const tok = m[0];
		if (m[1] !== undefined) {
			const isKey = /^\s*:/.test(text.slice(m.index + tok.length));
			result += span(isKey ? COLORS.key : COLORS.string, tok);
		} else if (m[2] !== undefined) {
			result += span(COLORS.number, tok);
		} else if (m[3] !== undefined) {
			result += span(COLORS.boolean, tok);
		} else if (m[4] !== undefined) {
			result += span(COLORS.null, tok);
		} else {
			result += span(COLORS.punctuation, tok);
		}
		last = m.index + tok.length;
	}
	result += escapeHtml(text.slice(last));
	return result;
};

// Character offset of the caret within the editable element.
const getCaretOffset = (root: HTMLElement): number => {
	const sel = window.getSelection();
	if (!sel || sel.rangeCount === 0) return 0;
	const range = sel.getRangeAt(0);
	const pre = range.cloneRange();
	pre.selectNodeContents(root);
	pre.setEnd(range.endContainer, range.endOffset);
	return pre.toString().length;
};

// Start and end character offsets of the current selection within the editable element.
const getSelectionOffsets = (root: HTMLElement): { start: number; end: number } => {
	const sel = window.getSelection();
	if (!sel || sel.rangeCount === 0) return { start: 0, end: 0 };
	const range = sel.getRangeAt(0);
	const startRange = document.createRange();
	startRange.selectNodeContents(root);
	startRange.setEnd(range.startContainer, range.startOffset);
	const start = startRange.toString().length;
	const endRange = document.createRange();
	endRange.selectNodeContents(root);
	endRange.setEnd(range.endContainer, range.endOffset);
	const end = endRange.toString().length;
	return { start, end };
};

// Place the caret at the given character offset within the editable element.
const setCaretOffset = (root: HTMLElement, offset: number): void => {
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
	let remaining = offset;
	let node = walker.nextNode();
	let target: Text | null = null;
	let targetOffset = 0;
	while (node) {
		const len = node.textContent?.length ?? 0;
		if (remaining <= len) {
			target = node as Text;
			targetOffset = remaining;
			break;
		}
		remaining -= len;
		node = walker.nextNode();
	}
	const sel = window.getSelection();
	if (!sel) return;
	const range = document.createRange();
	if (target) {
		range.setStart(target, targetOffset);
	} else {
		range.selectNodeContents(root);
		range.collapse(false);
	}
	range.collapse(true);
	sel.removeAllRanges();
	sel.addRange(range);
};

export const JsonEditor: FC<JsonEditorProps> = ({ value, onChange }) => {
	const { t } = useTranslation(['catalog', 'common']);
	// rawText is the single source of truth, seeded ONCE on mount. Switching to a
	// different entitlement remounts this component (key=feature.id), so there is
	// no need to sync from the value prop — that only fights the user's typing.
	const [rawText, setRawText] = useState<string>(() => (value && Object.keys(value).length > 0 ? formatJson(value) : EMPTY_TEMPLATE));
	const [error, setError] = useState<string>('');
	const [copied, setCopied] = useState(false);
	const editorRef = useRef<HTMLDivElement>(null);
	const caretRef = useRef<number>(0);

	// Re-paint the highlighted HTML whenever the text changes, then restore the
	// caret to where the user left it (only when the editor is focused, so the
	// initial mount and prop-driven renders don't steal focus).
	useLayoutEffect(() => {
		const el = editorRef.current;
		if (!el) return;
		// Only syntax-color when the JSON is valid. While the user is mid-edit and
		// it's temporarily invalid, show plain neutral text so the broken regex
		// coloring doesn't produce garbled output.
		const isValid = tryParse(rawText).ok;
		el.innerHTML = isValid ? highlightJson(rawText) : `<span style="color:#d6deeb">${escapeHtml(rawText)}</span>`;
		if (document.activeElement === el) {
			setCaretOffset(el, caretRef.current);
		}
	}, [rawText]);

	const applyText = (text: string, caret: number) => {
		caretRef.current = caret;
		setRawText(text);
		const result = tryParse(text);
		if (result.ok) {
			setError('');
			onChange(result.value, text);
		} else if (text.trim() === '' || text.trim() === '{}') {
			setError('');
			onChange(null, text);
		} else if (result.invalidJson) {
			setError(t('catalog:jsonEditor.errorInvalidJson'));
			onChange(null, text);
		} else {
			setError(t('catalog:jsonEditor.errorMustBeObject'));
			onChange(null, text);
		}
	};

	const handleInput = () => {
		const el = editorRef.current;
		if (!el) return;
		applyText(el.textContent ?? '', getCaretOffset(el));
	};

	const insertAtCaret = (insert: string) => {
		const el = editorRef.current;
		if (!el) return;
		const current = el.textContent ?? '';
		const { start, end } = getSelectionOffsets(el);
		const next = current.slice(0, start) + insert + current.slice(end);
		applyText(next, start + insert.length);
	};

	// Keep Enter and Tab as plain text instead of letting the browser inject <div>/<br>.
	const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			insertAtCaret('\n');
		} else if (e.key === 'Tab') {
			e.preventDefault();
			insertAtCaret('  ');
		}
	};

	const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
		e.preventDefault();
		insertAtCaret(e.clipboardData.getData('text/plain'));
	};

	const handleCopy = () => {
		navigator.clipboard.writeText(rawText);
		toast.success(t('common:toast.copySuccess'));
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const lineCount = rawText.split('\n').length;

	return (
		<div className='rounded-lg overflow-hidden border border-line' style={{ background: themes.nightOwl.plain.backgroundColor }}>
			{/* Header sits on the nightOwl background set above, which is dark in light mode too, so
			    its border-white/10, text-slate-300 and hover:bg-surface/10 stay literal. Only the outer
			    ring above is on the page and tokenized. */}
			{/* Header — title + copy only */}
			<div className='px-4 py-2 border-b border-white/10 flex items-center justify-between'>
				<p className='text-xs font-medium text-slate-300'>{t('catalog:jsonEditor.title')}</p>
				<Button
					onClick={handleCopy}
					variant='ghost'
					size='sm'
					className={cn(
						'h-7 text-slate-300 hover:text-content-inverse hover:bg-surface/10',
						copied && 'text-success-soft hover:text-success-soft',
					)}>
					{copied ? <Check size={12} className='me-1 text-success-soft' /> : <Copy size={12} className='me-1' />}
					<span className='text-xs'>{copied ? t('common:actions.copied') : t('common:actions.copy')}</span>
				</Button>
			</div>

			{/* Single editable + highlighted layer */}
			<div
				ref={editorRef}
				contentEditable
				suppressContentEditableWarning
				onInput={handleInput}
				onKeyDown={handleKeyDown}
				onPaste={handlePaste}
				spellCheck={false}
				autoCorrect='off'
				autoCapitalize='off'
				className='block w-full outline-none overflow-auto min-h-[320px] max-h-[500px] p-4 font-fira-code text-sm text-[#d6deeb]'
				style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: '20px', caretColor: '#c5e4fd', tabSize: 2 }}
			/>

			{/* Status bar — error or valid + line count */}
			<div className='px-4 py-1.5 border-t border-white/10 flex items-center justify-between'>
				<span className={error ? 'text-xs text-danger-soft' : 'text-xs text-content-slate-subtle'}>
					{error || t('catalog:jsonEditor.validJson')}
				</span>
				<span className='text-xs text-content-slate-muted'>
					{lineCount} {t('catalog:jsonEditor.lines')}
				</span>
			</div>
		</div>
	);
};

export default JsonEditor;
