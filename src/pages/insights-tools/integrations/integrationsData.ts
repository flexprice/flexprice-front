export type Integration = {
	name: string;
	description: string;
	logo: string;
	tags: string[];
	premium?: boolean;
	info?: {
		title: string;
		description: string[];
	}[];
	type?: 'installed' | 'available' | 'comingsoon';
	accountId?: string;
	mode?: string;
	apiKey?: string;
	installedAt?: string;
};

export const integrations: Integration[] = [
	{
		name: 'Stripe',
		logo: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg',
		description: 'Send invoices, calculate tax, and collect payments using our native connector to Stripe.',
		tags: ['Payments', 'Invoices'],
		type: 'available',
		accountId: 'acct_1PloOLJiOrSZFKQm',
		mode: 'Test Mode',
		apiKey: 'sk_test_***HT1',

		installedAt: 'Feb 12, 2025, 4:17:30 PM',
		// comingSoon: true,
		info: [
			{
				title: 'Overview',
				description: ['The Flexprice Stripe app enables invoicing, tax collection, and payment via Stripe.'],
			},
			{
				title: 'Stripe Invoicing',
				description: ['Create and send invoices through Stripe Invoicing directly from Flexprice and automatically collect payments.'],
			},
			{
				title: 'Automatic Tax Calculations',
				description: [
					'Leverage Stripe Tax to handle complex tax rules and rates for any region. The integration ensures accurate, up-to-date tax calculations for each invoice, removing the guesswork and reducing compliance risks.',
				],
			},
			{
				title: 'Secure and Flexible Payments',
				description: [
					'Collect payments quickly and securely via Stripe’s trusted payment gateway. Your customers can choose from various payment methods—credit card, ACH, and more—to improve the overall customer experience and speed up cash flow.',
				],
			},
		],
	},
	{
		name: 'Razorpay',
		description: 'Accept, process and disburse payments using our native connector to Razorpay.',
		logo: 'https://upload.wikimedia.org/wikipedia/commons/7/77/Razorpay_logo.png',
		tags: ['Payments', 'Invoices'],
		info: [
			{
				title: 'Overview',
				description: [
					'The Flexprice Razorpay app enables invoicing, tax calculations, and payment collection directly through Razorpay. Integrate it seamlessly with Flexprice (or your billing engine) to streamline your payment workflows.',
				],
			},
			{
				title: 'Razorpay Invoicing',
				description: [
					'Create and send invoices with a few clicks—right from Flexprice—using Razorpay’s invoicing capabilities. Payment collection can be automated, reducing manual follow-ups.',
				],
			},
			{
				title: 'Automatic Tax Calculations',
				description: [
					'Leverage Razorpay’s support for regional tax rules (e.g., GST in India). This integration ensures accurate, up-to-date tax rates for each invoice, minimizing compliance risks and manual calculations.',
				],
			},
			{
				title: 'Secure and Flexible Payments',
				description: [
					'Collect payments quickly and securely via Razorpay’s trusted payment gateway. Your customers can choose from various methods—credit cards, debit cards, net banking, UPI, and wallets—enhancing the payment experience and accelerating cash flow.',
				],
			},
		],
		type: 'available',
	},
	{
		name: 'Hubspot',
		description: 'Hubspot is a CRM, sales, marketing and customer service platform.',
		logo: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDI2LjMuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCAzMzguNjU5NjEgOTYiIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDMzOC42NTk2MSA5NiIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxnPgoJPHBvbHlnb24gZmlsbD0iIzIxMzM0MyIgcG9pbnRzPSIzNi42NzcyNSw1NC4zMzIxOSAxMS44MDkxOCw1NC4zMzIxOSAxMS44MDkxOCw4MC41Mjg1OSAwLDgwLjUyODU5IDAsMTUuODkwODMgMTEuODA5MTgsMTUuODkwODMgCgkJMTEuODA5MTgsNDIuOTcxMDMgMzYuNjc3MjUsNDIuOTcxMDMgMzYuNjc3MjUsMTUuODkwODMgNDguNDgzNzgsMTUuODkwODMgNDguNDgzNzgsODAuNTI4NTkgMzYuNjc3MjUsODAuNTI4NTkgCSIvPgoJPHBhdGggZmlsbD0iIzIxMzM0MyIgZD0iTTg2LjI2OTM2LDU5LjYzNjM0YzAsNS4zODM0NC00LjM4NTMxLDkuNzYzNzUtOS43Njc1NSw5Ljc2Mzc1Yy01LjM4MzY4LDAtOS43NjYxNi00LjM4MDMxLTkuNzY2MTYtOS43NjM3NQoJCXYtMjcuNjg0OUg1NS41NTMzOXYyNy42ODQ5YzAsMTEuNTUwMjUsOS4zOTc2NCwyMC45NDU1OCwyMC45NDg0MiwyMC45NDU1OGMxMS41NDg0MiwwLDIwLjk0NjA1LTkuMzk1MzMsMjAuOTQ2MDUtMjAuOTQ1NTgKCQl2LTI3LjY4NDloLTExLjE3ODVWNTkuNjM2MzR6Ii8+Cgk8cGF0aCBmaWxsPSIjMjEzMzQzIiBkPSJNMTY5LjI0NTU2LDM0LjgwMTljMC01LjY3NjIxLDMuNzU2OTktNy40NzYxNSw3Ljg3MDI1LTcuNDc2MTVjMy4zMTIwMSwwLDcuNjk0NzIsMi41MjA2OSwxMC41NTQyNCw1LjU4MzYxCgkJbDcuMzMzMjUtOC42NDQ0Yy0zLjY2NDUxLTQuOTUxMi0xMS4wODc5MS04LjM3NDEzLTE3LjE3MDc1LTguMzc0MTNjLTEyLjE2NzMxLDAtMjAuOTMzODUsNy4xMTQyNC0yMC45MzM4NSwxOC45MTEwNgoJCWMwLDIxLjg4MDQ2LDI2Ljc0ODIsMTQuOTQ0NzksMjYuNzQ4MiwyNy4xOTQwNGMwLDMuNzc3NTMtMy42NjYzOCw3LjExMjM2LTcuODY5MzQsNy4xMTIzNgoJCWMtNi42MjE3LDAtOC43Njk2MS0zLjI0MTc0LTExLjgwOTg2LTYuNjY0bC04LjE0MTgyLDguNDYyNzJjNS4xOTEyMiw2LjM5MzczLDExLjYzMDA4LDkuNjM3MzYsMTkuMzIzNjUsOS42MzczNgoJCWMxMS41Mzk0OSwwLDIwLjg0MzI1LTcuMjA0MDUsMjAuODQzMjUtMTguNDYxNDlDMTk1Ljk5MjgsMzcuNzcxNDgsMTY5LjI0NTU2LDQ1LjMzNjI3LDE2OS4yNDU1NiwzNC44MDE5eiIvPgoJPHBhdGggZmlsbD0iIzIxMzM0MyIgZD0iTTMzNC43MjA0OSw3MC4yMDI3OGMtNi42MTY5NywwLTguNDk1MDYtMi44NjA5Ni04LjQ5NTA2LTcuMjQ1OThWNDMuNTQ2NThoMTAuMjg0ODJ2LTkuODM4OTJoLTEwLjI4NDgyCgkJVjIwLjczNTE1bC0xMS4zNTc3OSw1LjA5ODI2djM5LjUzOTMxYzAsMTAuMTA5Myw2Ljk3NDY0LDE1LjIwOTIsMTYuNTQyNjYsMTUuMjA5MmMxLjQzMTIxLDAsMy40MDEyMS0wLjA5MjQ4LDQuNDc1NjgtMC4zNTc2NgoJCWwyLjc3MzYyLTEwLjE5NzA2QzMzNy40MDc3NSw3MC4xMTM1NywzMzUuOTc3MDIsNzAuMjAyNzgsMzM0LjcyMDQ5LDcwLjIwMjc4eiIvPgoJPHBhdGggZmlsbD0iIzIxMzM0MyIgZD0iTTEyOC44OTMyMywzMi4yNzUzM2MtNS41NDY3MywwLTkuNDE4MjksMS42MTAwMi0xMy4xNTczNiw1LjI4MDAzVjE2LjI3Njg1aC0xMS4yMTgwOXYzOS40MzU0NgoJCWMwLDE0Ljc2MDQsMTAuNjcxNjEsMjQuODY5NjMsMjIuNjYyMzYsMjQuODY5NjNjMTMuMzI5MDYsMCwyNS4wMDc3Ny0xMC4yODg5OSwyNS4wMDc3Ny0yNC4xNTIzMgoJCUMxNTIuMTg3OTEsNDIuNzQxOTEsMTQxLjQxODY5LDMyLjI3NTMzLDEyOC44OTMyMywzMi4yNzUzM3ogTTEyOC44MjM1LDY5LjI5MTczYy03LjAyNzU0LDAtMTIuNzIzNzQtNS42OTY0Mi0xMi43MjM3NC0xMi43MjM1MwoJCWMwLTcuMDI2ODksNS42OTYyLTEyLjcyMzUzLDEyLjcyMzc0LTEyLjcyMzUzYzcuMDI2NjcsMCwxMi43MjMzMSw1LjY5NjY0LDEyLjcyMzMxLDEyLjcyMzUzCgkJQzE0MS41NDY4MSw2My41OTUzLDEzNS44NTAxNyw2OS4yOTE3MywxMjguODIzNSw2OS4yOTE3M3oiLz4KCTxwYXRoIGZpbGw9IiMyMTMzNDMiIGQ9Ik0yNTAuNjgzNDYsNTUuODQ3MjRjMC0xMy44NjMzMy0xMS42Nzg3My0yNC4xNTIzMi0yNS4wMDc3OC0yNC4xNTIzMgoJCWMtMTEuOTkwNzUsMC0yMi42NjIzNSwxMC4xMDkyMi0yMi42NjIzNSwyNC44Njk2M1Y5NmgxMS4yMTgwOVY3NC43MjE0OWMzLjczOTA2LDMuNjcwMDEsNy42MTA2Myw1LjI4MDAzLDEzLjE1NzM1LDUuMjgwMDMKCQlDMjM5LjkxNDIyLDgwLjAwMTUyLDI1MC42ODM0Niw2OS41MzQ5NCwyNTAuNjgzNDYsNTUuODQ3MjR6IE0yNDAuMDQyMzQsNTUuNzA4NjVjMCw3LjAyNjg5LTUuNjk2NjQsMTIuNzIzNTMtMTIuNzIzMzEsMTIuNzIzNTMKCQljLTcuMDI3NTQsMC0xMi43MjM3NC01LjY5NjY0LTEyLjcyMzc0LTEyLjcyMzUzYzAtNy4wMjcxLDUuNjk2Mi0xMi43MjM1MywxMi43MjM3NC0xMi43MjM1MwoJCUMyMzQuMzQ1Nyw0Mi45ODUxMywyNDAuMDQyMzQsNDguNjgxNTUsMjQwLjA0MjM0LDU1LjcwODY1eiIvPgoJPHBhdGggZmlsbD0iI0ZGNUMzNSIgZD0iTTI4Ni45MzI0NiwzMS4xNTE1NFYxOS44ODMxMmMyLjk0MTE2LTEuMzg5NTEsNS4wMDIwMS00LjM2NTA4LDUuMDAyMDEtNy44MTg1di0wLjI2MDM4CgkJYzAtNC43NjU1Ny0zLjg5OTQ0LTguNjY0OC04LjY2NDgzLTguNjY0OGgtMC4yNjAxNmMtNC43NjU3OCwwLTguNjY1MjIsMy44OTkyMy04LjY2NTIyLDguNjY0OHYwLjI2MDM4CgkJYzAsMy40NTM0MSwyLjA2MTI4LDYuNDI5NDIsNS4wMDI0MSw3LjgxODcydjExLjI2ODQyYy00LjM3OTI0LDAuNjc2NTYtOC4zODA2NSwyLjQ4MjY5LTExLjY4MjE5LDUuMTQwNzlsLTMwLjkzODg3LTI0LjA2NzU2CgkJYzAuMjAzNTEtMC43ODM3NywwLjM0NjQ1LTEuNTkxMjksMC4zNDczMi0yLjQzODY4YzAuMDA2OTctNS4zOTc5MS00LjM2MzEzLTkuNzc5MzMtOS43NjEyNS05Ljc4NjMxCgkJYy01LjM5ODEzLTAuMDA2NzUtOS43Nzk1Niw0LjM2MzU2LTkuNzg2NTMsOS43NjE0N2MtMC4wMDY1Myw1LjM5NzkxLDQuMzYzNTYsOS43NzkzMyw5Ljc2MTY5LDkuNzg2MDkKCQljMS43NTkyOCwwLjAwMjE4LDMuMzg3MzktMC40OTc0NSw0LjgxNDYxLTEuMzA5MTFsMzAuNDM0NjUsMjMuNjc1NzljLTIuNTg4NTksMy45MDY4NS00LjEwNDI1LDguNTg2OC00LjEwNDI1LDEzLjYyNDUyCgkJYzAsNS4yNzQ1OCwxLjY2NjAyLDEwLjE1MjgxLDQuNDgyMDksMTQuMTY1NzdsLTkuMjU1NzQsOS4yNTU3NGMtMC43MzE2OS0wLjIxOTQyLTEuNDkxMjctMC4zNzMwNC0yLjI5NDg2LTAuMzczMDQKCQljLTQuNDM1NDcsMC04LjAzMTYsMy41OTU5Mi04LjAzMTYsOC4wMzE2czMuNTk2MTMsOC4wMzE2LDguMDMxNiw4LjAzMTZjNC40MzU5LDAsOC4wMzE1OS0zLjU5NTkyLDguMDMxNTktOC4wMzE2CgkJYzAtMC44MDMxNi0wLjE1MzM4LTEuNTYyOTYtMC4zNzMwMi0yLjI5NDY1bDkuMTU1NDktOS4xNTUyOGM0LjE1NTcsMy4xNzI1NSw5LjMzMDY5LDUuMDc4MDMsMTQuOTYyODMsNS4wNzgwMwoJCWMxMy42NDU0NSwwLDI0LjcwNzUyLTExLjA2MjI5LDI0LjcwNzUyLTI0LjcwODE3QzMwNy44NDc3NSw0My4xODU4NywyOTguNzcyODYsMzIuOTgwMzMsMjg2LjkzMjQ2LDMxLjE1MTU0eiBNMjgzLjE0MDIzLDY4LjIwNjI4CgkJYy02Ljk5NjE1LDAtMTIuNjY4NC01LjY3MTM3LTEyLjY2ODQtMTIuNjY3NTNjMC02Ljk5NTk0LDUuNjcyMjQtMTIuNjY3NTMsMTIuNjY4NC0xMi42Njc1MwoJCWM2Ljk5NTMsMCwxMi42Njc1NCw1LjY3MTU4LDEyLjY2NzU0LDEyLjY2NzUzQzI5NS44MDc3Nyw2Mi41MzQ5MiwyOTAuMTM1NTMsNjguMjA2MjgsMjgzLjE0MDIzLDY4LjIwNjI4eiIvPgo8L2c+Cjwvc3ZnPgo=',
		tags: ['CRM', 'Sales', 'Marketing', 'Customer Service'],
		premium: true,
		type: 'available',
	},
	{
		name: 'Salesforce',
		description: 'Salesforce is a customer relationship management (CRM) platform.',
		logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg',
		tags: ['CRM'],
		premium: true,
		type: 'available',
	},
	{
		name: 'PayPal',
		description: 'PayPal is an online payment system that supports online money transfers.',
		logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg',
		tags: ['Payment', 'Invoice Customer'],
		premium: true,
		type: 'available',
	},
	{
		name: 'Zoho',
		logo: 'https://www.zohowebstatic.com/sites/zweb/images/commonroot/zoho-logo-web.svg',
		tags: ['CRM'],
		premium: true,
		type: 'available',
		description: 'The Zoho Books integration lets you manage critical accounting tasks directly from Flexprice. ',
		info: [
			{
				title: 'Create Customer in Zoho Books',
				description: ['Automatically create or update customers in Zoho Books whenever a new customer is added or modified in Flexprice.'],
			},
			{
				title: 'Create Invoice in Zoho Books',
				description: ['Generate Zoho Books invoices seamlessly from Flexprice usage data or billing triggers, reducing manual work.'],
			},
			{
				title: 'Transform Flexprice Invoice to Zoho Books Invoice',
				description: ["Convert a Flexprice invoice object into Zoho Books' invoice format—streamlining data flow and ensuring accuracy."],
			},
		],
	},
];

export const installedIntegrations = integrations.filter((integration) => integration.type === 'installed');
export const availableIntegrations = integrations.filter((integration) => integration.type === 'available');
export const comingSoonIntegrations = integrations.filter((integration) => integration.type === 'comingsoon' || integration.premium);
export const availableAndComingSoonIntegrations = [...availableIntegrations, ...comingSoonIntegrations];
