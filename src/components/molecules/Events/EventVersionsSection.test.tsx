import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { createInstance } from 'i18next';
import type { i18n as I18nInstance } from 'i18next';
import { EventLookupItem } from '@/types/dto';
import EventVersionsSection from './EventVersionsSection';

const latestRow: EventLookupItem = {
	id: 'evt_dup',
	external_customer_id: 'cust_ext',
	customer_id: 'cust_1',
	event_name: 'pageviews',
	timestamp: '2026-08-31T00:00:00Z',
	ingested_at: '2026-09-14T03:52:16Z',
	properties: { credits: 4975355 },
	source: 'publicapi',
	environment_id: 'env_1',
};

const earlierRow: EventLookupItem = {
	...latestRow,
	ingested_at: '2026-09-14T03:52:14Z',
	properties: { credits: 0 },
};

const duplicateHint =
	'This event id was ingested more than once. Stored meter usage is from the first processed ingest, not necessarily the latest version.';

let testI18n: I18nInstance;

beforeAll(async () => {
	const instance = createInstance();
	await instance.use(initReactI18next).init({
		lng: 'en',
		fallbackLng: 'en',
		ns: ['developers', 'common'],
		defaultNS: 'developers',
		resources: {
			en: {
				developers: {
					events: {
						debugger: {
							ingestedVersionsTitle: 'Ingested versions',
							ingestedVersionNumber: 'Version {{n}}',
							duplicateEventIdHint: duplicateHint,
						},
					},
					labels: {
						ingestedAt: 'Ingested at',
						eventDetails: 'Event Details',
						missingValue: '—',
					},
				},
				common: {
					actions: { copy: 'Copy', copied: 'Copied' },
					toast: { copySuccess: 'Copied' },
				},
			},
		},
		interpolation: { escapeValue: false },
	});
	testI18n = instance;
});

const renderSection = (events: EventLookupItem[]) =>
	render(
		<I18nextProvider i18n={testI18n}>
			<EventVersionsSection events={events} />
		</I18nextProvider>,
	);

describe('EventVersionsSection', () => {
	it('lists every ingested version with properties and a duplicate-id hint', () => {
		renderSection([latestRow, earlierRow]);

		expect(screen.getByText('Version 2')).toBeInTheDocument();
		expect(screen.getByText('Version 1')).toBeInTheDocument();
		expect(screen.queryByText('Version 1 of 2')).not.toBeInTheDocument();
		expect(screen.getByText('4975355')).toBeInTheDocument();
		expect(screen.getByText('0')).toBeInTheDocument();
		expect(screen.queryByText('Used for processing')).not.toBeInTheDocument();
		expect(screen.getByText(duplicateHint)).toBeInTheDocument();
	});

	it('labels the newest ingest with the highest version number', () => {
		renderSection([latestRow, earlierRow]);

		const version2 = screen.getByText('Version 2');
		const version1 = screen.getByText('Version 1');
		expect(version2.compareDocumentPosition(version1) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});

	it('does not show the duplicate-id hint for a single version', () => {
		renderSection([earlierRow]);

		expect(screen.queryByText('Used for processing')).not.toBeInTheDocument();
		expect(screen.queryByText(duplicateHint)).not.toBeInTheDocument();
	});

	it('renders nothing when there are no versions', () => {
		const { container } = renderSection([]);
		expect(container).toBeEmptyDOMElement();
	});
});
