import React, { useState, useEffect } from 'react';
import { Dialog, Button, Input, Textarea, AddActionButton } from '@/components/atoms';
import { Trash2 } from 'lucide-react';

interface MetadataModalProps {
	open: boolean;
	data: Record<string, string>;
	onChange: (data: Record<string, string>) => void;
	onSave: (data: Record<string, string>) => void;
	onClose: () => void;
}

const MetadataModal: React.FC<MetadataModalProps> = ({ open, data, onChange, onSave, onClose }) => {
	const [localData, setLocalData] = useState<{ key: string; value: string }[]>([]);

	// Sync local state with prop
	useEffect(() => {
		const entries = Object.entries(data);
		const keys = entries.length > 0 ? entries.map(([key]) => key) : [''];
		setLocalData(keys.map((key) => ({ key, value: data[key] })));
	}, [data, open]);

	// Call onChange whenever localData changes
	useEffect(() => {
		const obj: Record<string, string> = {};
		localData.forEach(({ key, value }) => {
			if (key) obj[key] = value;
		});
		onChange(obj);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [localData]);

	const handleKeyChange = (idx: number, newKey: string) => {
		setLocalData((prev) => {
			const arr = [...prev];
			arr[idx] = { ...arr[idx], key: newKey };
			return arr;
		});
	};

	const handleValueChange = (idx: number, newValue: string) => {
		setLocalData((prev) => {
			const arr = [...prev];
			arr[idx] = { ...arr[idx], value: newValue };
			return arr;
		});
	};

	const handleAdd = () => {
		setLocalData((prev) => [...prev, { key: '', value: '' }]);
	};

	const handleRemove = (idx: number) => {
		setLocalData((prev) => prev.filter((_, i) => i !== idx));
	};

	const handleSave = () => {
		const obj: Record<string, string> = {};
		localData.forEach(({ key, value }) => {
			if (key) obj[key] = value;
		});
		onSave(obj);
	};

	return (
		<Dialog
			className='min-w-max'
			isOpen={open}
			onOpenChange={(isOpen) => {
				if (!isOpen) onClose();
			}}
			title='Edit Metadata'
			showCloseButton>
			<div className='flex flex-col gap-4 min-w-[600px]'>
				{localData.map((item, idx) => (
					<div key={idx} className='flex gap-2 items-start'>
						<div className='flex-[3] min-w-0'>
							<Input placeholder='Key' value={item.key} onChange={(v) => handleKeyChange(idx, v)} className='rounded-lg' />
						</div>

						<div className='flex-[5] min-w-0'>
							<Textarea
								placeholder='Value'
								value={item.value}
								onChange={(v) => handleValueChange(idx, v)}
								textAreaClassName='min-h-6 h-6 rounded-md'
								className='rounded-md'
							/>
						</div>
						<Button variant='ghost' className='size-10' onClick={() => handleRemove(idx)} aria-label='Remove'>
							<Trash2 className='size-6' />
						</Button>
					</div>
				))}
				<div>
					<AddActionButton onClick={handleAdd} label='Add another item' />
				</div>
				<div className='flex justify-end gap-2 mt-4'>
					<Button variant='outline' onClick={onClose}>
						Cancel
					</Button>
					<Button onClick={handleSave}>Save</Button>
				</div>
			</div>
		</Dialog>
	);
};

export default MetadataModal;
