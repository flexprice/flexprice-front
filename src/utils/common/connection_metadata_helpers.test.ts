import { describe, expect, it } from 'vitest';
import { mergeConnectionMetadata } from './connection_metadata_helpers';

describe('mergeConnectionMetadata', () => {
	it('sets a key when given a non-empty value', () => {
		expect(mergeConnectionMetadata({}, { success_url: 'https://app.com/ok' })).toEqual({
			success_url: 'https://app.com/ok',
		});
	});

	it('preserves keys that are not part of the update', () => {
		const existing = { cancel_url: 'https://app.com/cancel', some_other_provider_key: 'keep-me' };

		expect(mergeConnectionMetadata(existing, { success_url: 'https://app.com/ok' })).toEqual({
			cancel_url: 'https://app.com/cancel',
			some_other_provider_key: 'keep-me',
			success_url: 'https://app.com/ok',
		});
	});

	it('overwrites an existing key with the new value', () => {
		expect(mergeConnectionMetadata({ success_url: 'https://old.com' }, { success_url: 'https://new.com' })).toEqual({
			success_url: 'https://new.com',
		});
	});

	it('deletes the key when the value is blank rather than storing an empty string', () => {
		const merged = mergeConnectionMetadata(
			{ success_url: 'https://app.com/ok', cancel_url: 'https://app.com/cancel' },
			{ success_url: '' },
		);

		expect(merged).toEqual({ cancel_url: 'https://app.com/cancel' });
		expect('success_url' in merged).toBe(false);
	});

	it('deletes the key when the value is only whitespace', () => {
		expect(mergeConnectionMetadata({ success_url: 'https://app.com/ok', unrelated: 'keep' }, { success_url: '   ' })).toEqual({
			unrelated: 'keep',
		});
	});

	it('deletes the key when the value is undefined', () => {
		expect(mergeConnectionMetadata({ success_url: 'https://app.com/ok', unrelated: 'keep' }, { success_url: undefined })).toEqual({
			unrelated: 'keep',
		});
	});

	it('trims surrounding whitespace from stored values', () => {
		expect(mergeConnectionMetadata({}, { success_url: '  https://app.com/ok  ' })).toEqual({
			success_url: 'https://app.com/ok',
		});
	});

	it('treats an undefined existing map as empty', () => {
		expect(mergeConnectionMetadata(undefined, { success_url: 'https://app.com/ok' })).toEqual({
			success_url: 'https://app.com/ok',
		});
	});

	it('returns an empty map when clearing the only key', () => {
		expect(mergeConnectionMetadata({ success_url: 'https://app.com/ok' }, { success_url: '' })).toEqual({});
	});

	it('does not mutate the existing map', () => {
		const existing = { success_url: 'https://app.com/ok' };
		mergeConnectionMetadata(existing, { success_url: 'https://changed.com', cancel_url: 'https://app.com/cancel' });

		expect(existing).toEqual({ success_url: 'https://app.com/ok' });
	});

	it('applies several updates at once', () => {
		const existing = { success_url: 'https://old.com', cancel_url: 'https://app.com/cancel', unrelated: 'keep' };

		expect(mergeConnectionMetadata(existing, { success_url: 'https://new.com', cancel_url: '' })).toEqual({
			success_url: 'https://new.com',
			unrelated: 'keep',
		});
	});
});
