import { Button } from '@/components/atoms';
import { Input } from '@/components/atoms';
import { Plus, Trash2 } from 'lucide-react';
import { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { JsonObject } from '@/types/common';

interface KVPairRaw {
	key: string;
	value: string;
}

interface ConfigKeyValueEditorProps {
	value: JsonObject;
	onChange: (value: JsonObject, rawPairs: KVPairRaw[]) => void;
}

type KVPair = KVPairRaw;

const toKVPairs = (obj: JsonObject): KVPair[] => {
	const pairs = Object.entries(obj).map(([key, val]) => ({
		key,
		value: typeof val === 'string' ? val : JSON.stringify(val),
	}));
	return pairs.length > 0 ? pairs : [{ key: '', value: '' }];
};

const fromKVPairs = (pairs: KVPair[]): JsonObject => {
	const result: JsonObject = {};
	for (const { key, value } of pairs) {
		if (key.trim() === '') continue;
		try {
			result[key.trim()] = JSON.parse(value);
		} catch {
			result[key.trim()] = value;
		}
	}
	return result;
};

export const ConfigKeyValueEditor: FC<ConfigKeyValueEditorProps> = ({ value, onChange }) => {
	const { t } = useTranslation('catalog');
	const [pairs, setPairs] = useState<KVPair[]>(() => toKVPairs(value));

	useEffect(() => {
		setPairs(toKVPairs(value));
	}, [value]);

	const updatePairs = (updated: KVPair[]) => {
		setPairs(updated);
		onChange(fromKVPairs(updated), updated);
	};

	const addRow = () => updatePairs([...pairs, { key: '', value: '' }]);

	const removeRow = (index: number) => {
		const updated = pairs.filter((_, i) => i !== index);
		updatePairs(updated.length > 0 ? updated : [{ key: '', value: '' }]);
	};

	return (
		<div className='space-y-3'>
			<div className='flex items-center justify-between'>
				<span className='text-sm font-medium text-foreground'>{t('configKeyValueEditor.title')}</span>
				<Button type='button' variant='outline' size='sm' onClick={addRow} className='h-7 gap-1 text-xs'>
					<Plus className='size-3' />
					{t('configKeyValueEditor.addRow')}
				</Button>
			</div>

			<div className='rounded-md border overflow-hidden'>
				<div className='flex items-center bg-muted/50 px-3 py-2 border-b'>
					<span className='flex-1 text-xs font-medium text-muted-foreground uppercase tracking-wide pl-1'>
						{t('configKeyValueEditor.keyHeader')}
					</span>
					<span className='w-6' />
					<span className='flex-1 text-xs font-medium text-muted-foreground uppercase tracking-wide pl-1'>
						{t('configKeyValueEditor.valueHeader')}
					</span>
					<span className='w-8' />
				</div>

				<div className='divide-y'>
					{pairs.map((pair, index) => (
						<div key={index} className='flex items-center px-3 py-1 gap-0'>
							<div className='flex-1'>
								<Input
									value={pair.key}
									onChange={(v) => updatePairs(pairs.map((p, i) => (i === index ? { ...p, key: v } : p)))}
									placeholder={t('configKeyValueEditor.keyPlaceholder')}
									className='h-8 text-sm font-mono border-0 shadow-none focus-visible:ring-0 pl-1 pr-0'
								/>
							</div>
							<span className='w-6 text-center text-muted-foreground text-sm font-mono flex-shrink-0'>:</span>
							<div className='flex-1'>
								<Input
									value={pair.value}
									onChange={(v) => updatePairs(pairs.map((p, i) => (i === index ? { ...p, value: v } : p)))}
									placeholder={t('configKeyValueEditor.valuePlaceholder')}
									className='h-8 text-sm font-mono border-0 shadow-none focus-visible:ring-0 pl-1 pr-0'
								/>
							</div>
							<button
								type='button'
								aria-label={t('configKeyValueEditor.removeRow')}
								onClick={() => removeRow(index)}
								className='w-8 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0'>
								<Trash2 className='size-3.5' />
							</button>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default ConfigKeyValueEditor;
