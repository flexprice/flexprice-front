import { describe, expect, it } from 'vitest';
import {
	Copy01Icon,
	File01Icon,
	FileSpreadsheetIcon,
	Invoice01Icon,
	Layers01Icon,
	Link01Icon,
	PuzzleIcon,
	User03Icon,
	UserGroupIcon,
} from '@hugeicons/core-free-icons';
import { iconForTutorial, resolveTutorialIcon } from './TutorialCards';

describe('tutorial nudge icons', () => {
	it('uses a chain link for linking features to plans, not an external-link square', () => {
		expect(iconForTutorial('How to link features to plans?')).toBe(Link01Icon);
	});

	it('uses a sheet for listing add-ons', () => {
		expect(iconForTutorial('How to list all Addons?')).toBe(FileSpreadsheetIcon);
	});

	it('does not reuse plus for customer vs subscription create', () => {
		expect(iconForTutorial('How to create a customer')).toBe(User03Icon);
		expect(iconForTutorial('How to create a subscription')).toBe(File01Icon);
	});

	it('gives groups, plans, and features distinct icons', () => {
		expect(iconForTutorial('Explore how groups work in Flexprice.')).toBe(UserGroupIcon);
		expect(iconForTutorial('Explore how plans work in Flexprice.')).toBe(Layers01Icon);
		expect(iconForTutorial('Explore how features work in Flexprice.')).toBe(PuzzleIcon);
	});

	it('keeps billing-model nudges on the invoice icon', () => {
		expect(iconForTutorial('How to choose between advance and arrear billing?')).toBe(Invoice01Icon);
	});

	it('prefers an explicit icon over the title guess', () => {
		expect(resolveTutorialIcon({ title: 'How to create a feature?', icon: Copy01Icon })).toBe(Copy01Icon);
	});
});
