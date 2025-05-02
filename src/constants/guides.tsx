import { TutorialItem } from '@/pages/onboarding/onboarding';

const openGuide = (url: string) => {
	window.open(url, '_blank');
};

const GUIDES: Record<
	string,
	{
		tutorials: TutorialItem[];
	}
> = {
	features: {
		tutorials: [
			{
				title: 'Overview',
				description: 'Explore how features work in Flexprice.',
				onClick: () => openGuide('https://docs.flexprice.io/docs/Product%20catalogue/Features/Overview'),
			},
			{
				title: 'Creating a feature',
				description: 'Create a new feature in Flexprice.',
				onClick: () => openGuide('https://docs.flexprice.io/docs/Product%20catalogue/Features/Creating%20a%20feature'),
			},
			{
				title: 'Link features to plans',
				description: 'Link features to plans in Flexprice.',
				onClick: () => openGuide('https://docs.flexprice.io/docs/Product%20catalogue/Features/Link%20features%20to%20plans'),
			},
			{
				title: 'Use case: Usage based pricing',
				description: 'Use features to implement usage-based pricing.',
				onClick: () => openGuide('https://docs.flexprice.io/docs/Product%20catalogue/Features/Use%20cases'),
			},
			{
				title: 'Use case: Open AI pricing',
				description: 'Model OpenAI-style pricing in Flexprice.',
				onClick: () => openGuide('https://docs.flexprice.io/docs/Product%20catalogue/Plans/Use%20cases/Clone%20Open%20AI%20pricing'),
			},
			{
				title: 'Use case: Clone Cursor pricing',
				description: 'Model Cursor-style pricing in Flexprice.',
				onClick: () => openGuide('https://docs.flexprice.io/docs/Product%20catalogue/Plans/Use%20cases/Clone%20Cursor%20pricing'),
			},
		],
	},
	plans: {
		tutorials: [
			{
				title: 'Overview',
				description: 'Explore how plans work in Flexprice.',
				onClick: () => openGuide('https://docs.flexprice.io/docs/Product%20catalogue/Plans/Overview'),
			},
			{
				title: 'Creating a plan',
				description: 'Create a new plan in Flexprice.',
				onClick: () => openGuide('https://docs.flexprice.io/docs/Product%20catalogue/Plans/Creating%20a%20plan'),
			},
			{
				title: 'Billing Models in plans',
				description: 'Understand billing models used in plans.',
				onClick: () => openGuide('https://docs.flexprice.io/docs/Product%20catalogue/Plans/Charges%20in%20plans/Flat%20fee'),
			},
			{
				title: 'Use case: Open AI pricing',
				description: 'Model OpenAI-style pricing in Flexprice.',
				onClick: () => openGuide('https://docs.flexprice.io/docs/Product%20catalogue/Plans/Use%20cases/Clone%20Open%20AI%20pricing'),
			},
			{
				title: 'Use case: Clone Cursor pricing',
				description: 'Model Cursor-style pricing in Flexprice.',
				onClick: () => openGuide('https://docs.flexprice.io/docs/Product%20catalogue/Plans/Use%20cases/Clone%20Cursor%20pricing'),
			},
			{
				title: 'Link features to plans',
				description: 'Link features to plans in Flexprice.',
				onClick: () => openGuide('https://docs.flexprice.io/docs/Product%20catalogue/Features/Link%20features%20to%20plans'),
			},
		],
	},
	customers: {
		tutorials: [
			{
				title: 'Overview',
				description: 'Explore how customers work in Flexprice.',
				onClick: () => openGuide('https://docs.flexprice.io/docs/Customers/Overview'),
			},
			{
				title: 'Creating a customer',
				description: 'Create a new customer in Flexprice.',
				onClick: () => openGuide('https://docs.flexprice.io/docs/Customers/Creating%20a%20customer'),
			},
			{
				title: 'Archive a customer',
				description: 'Archive a customer in Flexprice.',
				onClick: () => openGuide('https://docs.flexprice.io/docs/Customers/Archive%20a%20customer'),
			},
		],
	},
	invoices: {
		tutorials: [
			{
				title: 'Overview',
				description: 'Explore how invoices work in Flexprice.',
				onClick: () => openGuide('https://docs.flexprice.io/docs/Invoices/Overview'),
			},
			{
				title: 'Managing Invoices',
				description: 'Manage invoices in Flexprice.',
				onClick: () => openGuide('https://docs.flexprice.io/docs/Invoices/Managing%20Invoices'),
			},
			{
				title: 'Partial payments',
				description: 'Handle partial payments in Flexprice.',
				onClick: () => openGuide('https://docs.flexprice.io/docs/Invoices/partial_payments'),
			},
		],
	},
	payments: {
		tutorials: [
			{
				title: 'Overview',
				description: 'Explore how payments work in Flexprice.',
				onClick: () => openGuide('https://docs.flexprice.io/api-reference/payments/list-payments'),
			},
			{
				title: 'Create a new payment',
				description: 'Create a payment in Flexprice.',
				onClick: () => openGuide('https://docs.flexprice.io/api-reference/payments/create-a-new-payment'),
			},
			{
				title: 'Update a payment',
				description: 'Update an existing payment in Flexprice.',
				onClick: () => openGuide('https://docs.flexprice.io/api-reference/payments/update-a-payment'),
			},
			{
				title: 'Delete a payment',
				description: 'Delete a payment in Flexprice.',
				onClick: () => openGuide('https://docs.flexprice.io/api-reference/payments/delete-a-payment'),
			},
			{
				title: 'Process a payment',
				description: 'Process a payment in Flexprice.',
				onClick: () => openGuide('https://docs.flexprice.io/api-reference/payments/process-a-payment'),
			},
		],
	},
	secrets: {
		tutorials: [
			{
				title: 'List API keys',
				description: 'View all API keys in Flexprice.',
				onClick: () => openGuide('https://docs.flexprice.io/api-reference/secrets/list-api-keys'),
			},
			{
				title: 'Create a new API key',
				description: 'Generate a new API key in Flexprice.',
				onClick: () => openGuide('https://docs.flexprice.io/api-reference/secrets/create-a-new-api-key'),
			},
			{
				title: 'Delete an API key',
				description: 'Delete an API key in Flexprice.',
				onClick: () => openGuide('https://docs.flexprice.io/api-reference/secrets/delete-an-api-key'),
			},
		],
	},
	importExport: {
		tutorials: [
			{
				title: 'Overview',
				description: 'Explore import and export options in Flexprice.',
				onClick: () => openGuide('https://docs.flexprice.io/api-reference/tasks/list-tasks'),
			},
			{
				title: 'Import a file',
				description: 'Import a file into Flexprice.',
				onClick: () => openGuide('https://docs.flexprice.io/api-reference/tasks/create-a-new-task'),
			},
			{
				title: 'Process import task',
				description: 'Process an import task in Flexprice.',
				onClick: () => openGuide('https://docs.flexprice.io/api-reference/tasks/process-a-task'),
			},
			{
				title: 'Update import task',
				description: 'Update an import task in Flexprice.',
				onClick: () => openGuide('https://docs.flexprice.io/api-reference/tasks/update-task-status'),
			},
		],
	},
};

export default GUIDES;
