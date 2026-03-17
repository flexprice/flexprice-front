import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

export interface UseJsonEditorOptions<T> {
	initialValue: T;
	onSave?: (changedValues: Partial<T> | T) => void;
	validate?: (value: T) => string | null;
	sendCompleteConfig?: boolean; // New option to control whether to send complete config or just changes
}

export function useJsonEditor<T>({ initialValue, onSave, validate, sendCompleteConfig = false }: UseJsonEditorOptions<T>) {
	const [showJsonEditor, setShowJsonEditor] = useState(false);
	const [jsonValue, setJsonValue] = useState('');
	const [jsonError, setJsonError] = useState('');
	const originalValueRef = useRef<T | null>(null);

	// Store original value for comparison
	useEffect(() => {
		originalValueRef.current = initialValue;
	}, [initialValue]);

	// Update JSON editor content when form value changes
	useEffect(() => {
		if (showJsonEditor) {
			setJsonValue(JSON.stringify(initialValue, null, 2));
		}
	}, [initialValue, showJsonEditor]);

	const getChangedValues = (original: T, updated: T): Partial<T> => {
		const changes: Partial<T> = {};

		for (const key in updated) {
			const typedKey = key as keyof T;
			if (JSON.stringify(original[typedKey]) !== JSON.stringify(updated[typedKey])) {
				(changes as any)[typedKey] = updated[typedKey];
			}
		}

		return changes;
	};

	const validateJson = (): boolean => {
		try {
			JSON.parse(jsonValue);
			setJsonError('');
			return true;
		} catch (err) {
			setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
			return false;
		}
	};

	const handleJsonSave = () => {
		if (!validateJson()) return;

		try {
			const parsedValue = JSON.parse(jsonValue) as T;

			// Run custom validation if provided
			if (validate) {
				const validationError = validate(parsedValue);
				if (validationError) {
					setJsonError(validationError);
					return;
				}
			}

			// Get only changed values for comparison
			const originalValue = originalValueRef.current || initialValue;
			const changedValues = getChangedValues(originalValue, parsedValue);

			// If no changes, show message
			if (Object.keys(changedValues).length === 0) {
				toast('No changes detected');
				return;
			}

			// Send complete config or just changes based on the flag
			const dataToSend = sendCompleteConfig ? parsedValue : changedValues;

			// Call custom save handler
			if (onSave) {
				onSave(dataToSend);
			}

			return dataToSend;
		} catch (err) {
			setJsonError('Failed to parse JSON configuration');
			return null;
		}
	};

	const toggleEditor = () => {
		setShowJsonEditor(!showJsonEditor);
		setJsonError('');
	};

	return {
		showJsonEditor,
		jsonValue,
		setJsonValue,
		jsonError,
		toggleEditor,
		handleJsonSave,
		validateJson,
	};
}
