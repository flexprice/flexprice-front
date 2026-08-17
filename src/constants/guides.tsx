import { TutorialItem } from '@/pages';
import type { TFunction } from 'i18next';
import {
	Archive02Icon,
	BookOpen01Icon,
	Copy01Icon,
	CouponPercentIcon,
	CreditCardIcon,
	Delete02Icon,
	File01Icon,
	FileImportIcon,
	FileSpreadsheetIcon,
	Invoice01Icon,
	Key01Icon,
	Layers01Icon,
	Link01Icon,
	ListViewIcon,
	PencilEdit01Icon,
	PercentCircleIcon,
	PlayCircleIcon,
	PlusSignIcon,
	PuzzleIcon,
	User03Icon,
	UserGroupIcon,
} from '@hugeicons/core-free-icons';

/** Doc deep links opened from tutorial cards */
export enum DOCS_LINKS {
	FEATURE_CREATE = 'https://docs.flexprice.io/docs/product-catalogue/features/create',
	FEATURE_PLANS = 'https://docs.flexprice.io/docs/product-catalogue/features/linking-to-plans',
	FEATURE_USECASE = 'https://docs.flexprice.io/docs/product-catalogue/features/use-cases',

	PLANS_OVERVIEW = 'https://docs.flexprice.io/docs/product-catalogue/plans/overview',
	PLANS_CREATE = 'https://docs.flexprice.io/docs/product-catalogue/plans/create',
	PLANS_CHARGES = 'https://docs.flexprice.io/docs/product-catalogue/plans/charges/advance-vs-arrear',

	CUSTOMER_OVERVIEW = 'https://docs.flexprice.io/docs/customers/overview',
	CUSTOMER_ARCHIVE = 'https://docs.flexprice.io/docs/customers/archive',
	SUBSCRIPTION_CREATE = 'https://docs.flexprice.io/docs/subscriptions/customers-create-subscription',

	INVOICE_CREATE = 'https://docs.flexprice.io/api-reference/invoices/create-one-off-invoice',
	INVOICE_MANAGE = 'https://docs.flexprice.io/api-reference/invoices/update-an-invoice',
	INVOICE_PARTIAL = 'https://docs.flexprice.io/api-reference/invoices/update-invoice-payment-status',

	PAYMENT_CREATE = 'https://docs.flexprice.io/api-reference/payments/create-payment',
	PAYMENT_UPDATE = 'https://docs.flexprice.io/api-reference/payments/update-payment',
	PAYMENT_DELETE = 'https://docs.flexprice.io/api-reference/payments/delete-payment',

	SECRET_LIST = 'https://docs.flexprice.io/api-reference/secrets/list-api-keys',
	SECRET_CREATE = 'https://docs.flexprice.io/api-reference/secrets/create-a-new-api-key',
	SECRET_DELETE = 'https://docs.flexprice.io/api-reference/secrets/delete-an-api-key',

	CREDIT_CREATE = 'https://docs.flexprice.io/api-reference/credit-notes/create-a-new-credit-note',
	CREDIT_PROCESS = 'https://docs.flexprice.io/api-reference/credit-notes/finalize-credit-note',
	CREDIT_VOID = 'https://docs.flexprice.io/api-reference/credit-notes/void-a-credit-note',

	TASK_LIST = 'https://docs.flexprice.io/api-reference/tasks/list-tasks',
	TASK_CREATE = 'https://docs.flexprice.io/api-reference/tasks/create-a-new-task',
	TASK_PROCESS = 'https://docs.flexprice.io/api-reference/tasks/get-task-processing-result',

	TAX_OVERVIEW = 'https://docs.flexprice.io/api-reference/tax-associations/create-tax-association',
	TAX_TYPES = 'https://docs.flexprice.io/api-reference/tax-associations/get-tax-association',
	TAX_ASSOCIATIONS = 'https://docs.flexprice.io/api-reference/tax-associations/list-tax-associations',

	GROUPS = 'https://docs.flexprice.io/docs/product-catalogue/groups/overview',

	ADDON_CREATE = 'https://docs.flexprice.io/api-reference/addons/create-addon',
	ADDON_LIST = 'https://docs.flexprice.io/api-reference/addons/list-addons',
	ADDON_DELETE = 'https://docs.flexprice.io/api-reference/addons/delete-addon',

	COUPON_CREATE = 'https://docs.flexprice.io/api-reference/coupons/create-coupon',
	COUPON_UPDATE = 'https://docs.flexprice.io/api-reference/coupons/update-coupon',
	COUPON_DELETE = 'https://docs.flexprice.io/api-reference/coupons/delete-coupon',
}

export enum IMAGE_URLS {
	FEATURE_1 = 'https://res.cloudinary.com/daospvham/image/upload/v1753180993/FEATURES1_veomrd.svg',
	FEATURE_2 = 'https://res.cloudinary.com/daospvham/image/upload/v1753180989/Features2_fbd39s.svg',
	FEATURE_3 = 'https://res.cloudinary.com/daospvham/image/upload/v1753180994/FEATURES_3_drkhb7.svg',

	PLAN_1 = 'https://res.cloudinary.com/daospvham/image/upload/v1753180993/PLAN_1_j6tdqv.svg',
	PLAN_2 = 'https://res.cloudinary.com/daospvham/image/upload/v1753180993/PLAN_2_oxi9ld.svg',
	PLAN_3 = 'https://res.cloudinary.com/daospvham/image/upload/v1753180995/PLAN_3_lfh1mi.svg',

	CUSTOMER_1 = 'https://res.cloudinary.com/daospvham/image/upload/v1753180990/Customer_1_kf0ena.svg',
	CUSTOMER_2 = 'https://res.cloudinary.com/daospvham/image/upload/v1753180991/Customer_2_ifiaof.svg',
	CUSTOMER_3 = 'https://res.cloudinary.com/daospvham/image/upload/v1753180987/Customer_3_triyiv.svg',

	INVOICE_1 = 'https://res.cloudinary.com/daospvham/image/upload/v1753180993/Invoice_1_lh9ved.svg',
	INVOICE_2 = 'https://res.cloudinary.com/daospvham/image/upload/v1753180991/invoice_2_v8fa71.svg',
	INVOICE_3 = 'https://res.cloudinary.com/daospvham/image/upload/v1753180989/iNvoice_3_glq1xo.svg',

	PAYMENT_1 = 'https://res.cloudinary.com/daospvham/image/upload/v1753182361/PAYMENTS_1_dgx00f.svg',
	PAYMENT_2 = 'https://res.cloudinary.com/daospvham/image/upload/v1753182361/PAYMENTS_2_ugsdxt.svg',
	PAYMENT_3 = 'https://res.cloudinary.com/daospvham/image/upload/v1753203616/PAYMENTS_3_erwdgn_gxkrxv.svg',

	SECRET_1 = 'https://res.cloudinary.com/daospvham/image/upload/v1753189165/api1_egeb4f.svg',
	SECRET_2 = 'https://res.cloudinary.com/daospvham/image/upload/v1753204234/api2_gxkyqw.svg',
	SECRET_3 = 'https://res.cloudinary.com/daospvham/image/upload/v1753184051/api3_ahcbx.svg',

	CREDIT_1 = 'https://res.cloudinary.com/daospvham/image/upload/v1753180987/CN1_vkg2kh.svg',
	CREDIT_2 = 'https://res.cloudinary.com/daospvham/image/upload/v1753180988/CN2_gpeaqi.svg',
	CREDIT_3 = 'https://res.cloudinary.com/daospvham/image/upload/v1753180987/CN3_kpsfpv.svg',

	TASK_1 = 'https://res.cloudinary.com/daospvham/image/upload/v1753189165/TASK1_cpgjla.svg',
	TASK_2 = 'https://res.cloudinary.com/daospvham/image/upload/v1753182361/TASKS_2_emkpmn.svg',
	TASK_3 = 'https://res.cloudinary.com/daospvham/image/upload/v1753189166/TASKS_3_k2nkyu.svg',
}

const openGuide = (url: string) => {
	window.open(url, '_blank');
};

export type GuidesMap = Record<string, { tutorials: TutorialItem[] }>;

/**
 * Localized empty-state / tutorial cards. Pass `t` from `useTranslation('guides')`
 * (or a combined hook where `guides` is loaded).
 */
export function buildGuides(t: TFunction<'guides'>): GuidesMap {
	return {
		features: {
			tutorials: [
				{
					imageUrl: IMAGE_URLS.FEATURE_1,
					title: t('features.createFeature.title'),
					description: t('features.createFeature.description'),
					onClick: () => openGuide(DOCS_LINKS.FEATURE_CREATE),
					icon: PlusSignIcon,
				},
				{
					imageUrl: IMAGE_URLS.FEATURE_2,
					title: t('features.linkToPlans.title'),
					description: t('features.linkToPlans.description'),
					onClick: () => openGuide(DOCS_LINKS.FEATURE_PLANS),
					icon: Link01Icon,
				},
				{
					imageUrl: IMAGE_URLS.FEATURE_3,
					title: t('features.clonePricing.title'),
					description: t('features.clonePricing.description'),
					onClick: () => openGuide(DOCS_LINKS.FEATURE_USECASE),
					icon: Copy01Icon,
				},
			],
		},
		addons: {
			tutorials: [
				{
					imageUrl: IMAGE_URLS.PLAN_1,
					title: t('addons.create.title'),
					description: t('addons.create.description'),
					onClick: () => openGuide(DOCS_LINKS.ADDON_CREATE),
					icon: PlusSignIcon,
				},
				{
					imageUrl: IMAGE_URLS.PLAN_2,
					title: t('addons.list.title'),
					description: t('addons.list.description'),
					onClick: () => openGuide(DOCS_LINKS.ADDON_LIST),
					icon: FileSpreadsheetIcon,
				},
				{
					imageUrl: IMAGE_URLS.PLAN_3,
					title: t('addons.delete.title'),
					description: t('addons.delete.description'),
					onClick: () => openGuide(DOCS_LINKS.ADDON_DELETE),
					icon: Delete02Icon,
				},
			],
		},
		coupons: {
			tutorials: [
				{
					imageUrl: IMAGE_URLS.PLAN_1,
					title: t('coupons.create.title'),
					description: t('coupons.create.description'),
					onClick: () => openGuide(DOCS_LINKS.COUPON_CREATE),
					icon: CouponPercentIcon,
				},
				{
					imageUrl: IMAGE_URLS.PLAN_2,
					title: t('coupons.update.title'),
					description: t('coupons.update.description'),
					onClick: () => openGuide(DOCS_LINKS.COUPON_UPDATE),
					icon: PencilEdit01Icon,
				},
				{
					imageUrl: IMAGE_URLS.PLAN_3,
					title: t('coupons.delete.title'),
					description: t('coupons.delete.description'),
					onClick: () => openGuide(DOCS_LINKS.COUPON_DELETE),
					icon: Delete02Icon,
				},
			],
		},
		plans: {
			tutorials: [
				{
					imageUrl: IMAGE_URLS.PLAN_1,
					title: t('plans.overview.title'),
					description: t('plans.overview.description'),
					onClick: () => openGuide(DOCS_LINKS.PLANS_OVERVIEW),
					icon: BookOpen01Icon,
				},
				{
					title: t('plans.create.title'),
					imageUrl: IMAGE_URLS.PLAN_2,
					description: t('plans.create.description'),
					onClick: () => openGuide(DOCS_LINKS.PLANS_CREATE),
					icon: PlusSignIcon,
				},
				{
					imageUrl: IMAGE_URLS.PLAN_3,
					title: t('plans.billingModels.title'),
					description: t('plans.billingModels.description'),
					onClick: () => openGuide(DOCS_LINKS.PLANS_CHARGES),
					icon: Invoice01Icon,
				},
			],
		},
		groups: {
			tutorials: [
				{
					imageUrl: IMAGE_URLS.PLAN_3,
					title: t('groups.overview.title'),
					description: t('groups.overview.description'),
					onClick: () => openGuide(DOCS_LINKS.GROUPS),
					icon: UserGroupIcon,
				},
				{
					imageUrl: IMAGE_URLS.PLAN_1,
					title: t('groups.plansContext.title'),
					description: t('groups.plansContext.description'),
					onClick: () => openGuide(DOCS_LINKS.PLANS_OVERVIEW),
					icon: Layers01Icon,
				},
				{
					imageUrl: IMAGE_URLS.FEATURE_1,
					title: t('groups.featuresContext.title'),
					description: t('groups.featuresContext.description'),
					onClick: () => openGuide(DOCS_LINKS.FEATURE_CREATE),
					icon: PuzzleIcon,
				},
			],
		},
		customers: {
			tutorials: [
				{
					title: t('customers.create.title'),
					description: t('customers.create.description'),
					imageUrl: IMAGE_URLS.CUSTOMER_1,
					onClick: () => openGuide(DOCS_LINKS.CUSTOMER_OVERVIEW),
					icon: User03Icon,
				},
				{
					title: t('customers.archive.title'),
					imageUrl: IMAGE_URLS.CUSTOMER_2,
					description: t('customers.archive.description'),
					onClick: () => openGuide(DOCS_LINKS.CUSTOMER_ARCHIVE),
					icon: Archive02Icon,
				},
				{
					title: t('customers.subscription.title'),
					imageUrl: IMAGE_URLS.CUSTOMER_3,
					description: t('customers.subscription.description'),
					onClick: () => openGuide(DOCS_LINKS.SUBSCRIPTION_CREATE),
					icon: File01Icon,
				},
			],
		},
		invoices: {
			tutorials: [
				{
					title: t('invoices.create.title'),
					description: t('invoices.create.description'),
					imageUrl: IMAGE_URLS.INVOICE_1,
					onClick: () => openGuide(DOCS_LINKS.INVOICE_CREATE),
					icon: Invoice01Icon,
				},
				{
					title: t('invoices.manage.title'),
					description: t('invoices.manage.description'),
					imageUrl: IMAGE_URLS.INVOICE_2,
					onClick: () => openGuide(DOCS_LINKS.INVOICE_MANAGE),
					icon: PencilEdit01Icon,
				},
				{
					title: t('invoices.partialPayments.title'),
					description: t('invoices.partialPayments.description'),
					imageUrl: IMAGE_URLS.INVOICE_3,
					onClick: () => openGuide(DOCS_LINKS.INVOICE_PARTIAL),
					icon: CreditCardIcon,
				},
			],
		},
		payments: {
			tutorials: [
				{
					title: t('payments.create.title'),
					imageUrl: IMAGE_URLS.PAYMENT_1,
					description: t('payments.create.description'),
					onClick: () => openGuide(DOCS_LINKS.PAYMENT_CREATE),
					icon: CreditCardIcon,
				},
				{
					title: t('payments.update.title'),
					imageUrl: IMAGE_URLS.PAYMENT_2,
					description: t('payments.update.description'),
					onClick: () => openGuide(DOCS_LINKS.PAYMENT_UPDATE),
					icon: PencilEdit01Icon,
				},
				{
					title: t('payments.delete.title'),
					imageUrl: IMAGE_URLS.PAYMENT_3,
					description: t('payments.delete.description'),
					onClick: () => openGuide(DOCS_LINKS.PAYMENT_DELETE),
					icon: Delete02Icon,
				},
			],
		},
		secrets: {
			tutorials: [
				{
					title: t('secrets.list.title'),
					imageUrl: IMAGE_URLS.SECRET_1,
					description: t('secrets.list.description'),
					onClick: () => openGuide(DOCS_LINKS.SECRET_LIST),
					icon: ListViewIcon,
				},
				{
					title: t('secrets.create.title'),
					imageUrl: IMAGE_URLS.SECRET_2,
					description: t('secrets.create.description'),
					onClick: () => openGuide(DOCS_LINKS.SECRET_CREATE),
					icon: Key01Icon,
				},
				{
					title: t('secrets.delete.title'),
					imageUrl: IMAGE_URLS.SECRET_3,
					description: t('secrets.delete.description'),
					onClick: () => openGuide(DOCS_LINKS.SECRET_DELETE),
					icon: Delete02Icon,
				},
			],
		},
		creditNotes: {
			tutorials: [
				{
					title: t('creditNotes.create.title'),
					imageUrl: IMAGE_URLS.CREDIT_1,
					description: t('creditNotes.create.description'),
					onClick: () => openGuide(DOCS_LINKS.CREDIT_CREATE),
					icon: File01Icon,
				},
				{
					title: t('creditNotes.process.title'),
					description: t('creditNotes.process.description'),
					imageUrl: IMAGE_URLS.CREDIT_2,
					onClick: () => openGuide(DOCS_LINKS.CREDIT_PROCESS),
					icon: PlayCircleIcon,
				},
				{
					title: t('creditNotes.void.title'),
					description: t('creditNotes.void.description'),
					imageUrl: IMAGE_URLS.CREDIT_3,
					onClick: () => openGuide(DOCS_LINKS.CREDIT_VOID),
					icon: Delete02Icon,
				},
			],
		},
		importExport: {
			tutorials: [
				{
					title: t('importExport.overview.title'),
					imageUrl: IMAGE_URLS.TASK_1,
					description: t('importExport.overview.description'),
					onClick: () => openGuide(DOCS_LINKS.TASK_LIST),
					icon: BookOpen01Icon,
				},
				{
					title: t('importExport.importFile.title'),
					imageUrl: IMAGE_URLS.TASK_2,
					description: t('importExport.importFile.description'),
					onClick: () => openGuide(DOCS_LINKS.TASK_CREATE),
					icon: FileImportIcon,
				},
				{
					title: t('importExport.processTask.title'),
					imageUrl: IMAGE_URLS.TASK_3,
					description: t('importExport.processTask.description'),
					onClick: () => openGuide(DOCS_LINKS.TASK_PROCESS),
					icon: PlayCircleIcon,
				},
			],
		},
		taxes: {
			tutorials: [
				{
					title: t('taxes.createRate.title'),
					description: t('taxes.createRate.description'),
					onClick: () => openGuide(DOCS_LINKS.TAX_OVERVIEW),
					icon: PercentCircleIcon,
				},
				{
					title: t('taxes.types.title'),
					description: t('taxes.types.description'),
					onClick: () => openGuide(DOCS_LINKS.TAX_TYPES),
					icon: BookOpen01Icon,
				},
				{
					title: t('taxes.associations.title'),
					description: t('taxes.associations.description'),
					onClick: () => openGuide(DOCS_LINKS.TAX_ASSOCIATIONS),
					icon: Link01Icon,
				},
			],
		},
	};
}
