import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Check, Loader2, X } from 'lucide-react';
import { RouteNames } from '@/core/routes/Routes';
import { queryClient } from '@/core/services/tanstack/ReactQueryProvider';
import { SIDEBAR_PRICING_PROMO_QUERY_KEY } from '@/hooks/useShouldShowSidebarPricingPromo';
import { parsePricingWithLLM } from '@/api/ai/llm';
import { orchestrateSetup } from '@/api/ai/orchestrator';
import { getSetupProgressSteps } from '@/api/ai/setupProgress';
import { schemaToPricingCardProps } from '@/api/ai/preview';
import { PRICING_TEMPLATES, type TemplateDefinition } from '@/api/ai/templates';
import type { SetupStep, PricingSchema } from '@/api/ai/types';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/utils/errorMessage';
import { PricingCard } from '@/components/molecules';
import { Button } from '@/components/ui';
/** Dark counterpart of /assets/v4bgagentic.png — the light grid glared on a dark page. */
import promptToPlanDarkBg from '../../../assets/ptpdark.png';

// ============================================
// Progress step labels
// ============================================

const STEP_LABELS: Record<SetupStep, string> = {
	parsing: 'Parsing your pricing...',
	creating_features: 'Setting up features',
	creating_plans: 'Creating plans',
	creating_prices: 'Adding prices',
	creating_entitlements: 'Applying limits',
	creating_credit_grants: 'Adding credits',
	done: 'Finishing up…',
};

/** Template previews skip the API but show a longer “working” moment before cards (custom prompt stays LLM-paced). */
const TEMPLATE_PREVIEW_DELAY_MS = 6000;

/** Preview canvas shimmer: custom prompt (LLM) — shorter reveal. */
const PREVIEW_SHIMMER_FADE_MS = 2400;
const PREVIEW_SHIMMER_END_MS = 3050;

/** Template path — longer shimmer so the reveal feels earned. */
const PREVIEW_SHIMMER_FADE_TEMPLATE_MS = 3800;
const PREVIEW_SHIMMER_END_TEMPLATE_MS = 5200;

/** After setup succeeds, brief pause so the toast is visible before navigating to Plans. */
const POST_SETUP_NAVIGATE_DELAY_MS = 1000;

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

type Phase = 'input' | 'preview' | 'creating';

// ============================================
// Component
// ============================================

const PricingSetupPage = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const { t } = useTranslation('common');
	const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition | null>(null);
	/** Seed for remounting the uncontrolled textarea (template pick, clear, back from preview). */
	const [promptInputSeed, setPromptInputSeed] = useState('');
	const [promptFieldKey, setPromptFieldKey] = useState(0);
	const [hasPromptText, setHasPromptText] = useState(false);
	const promptRef = useRef<HTMLTextAreaElement | null>(null);
	const lastPromptDraftRef = useRef('');
	/** When true, next preview mount skips shimmer (e.g. returning from failed Create). */
	const skipNextPreviewShimmerRef = useRef(false);
	const [phase, setPhase] = useState<Phase>('input');
	const [schema, setSchema] = useState<PricingSchema | null>(null);
	const [isParsing, setIsParsing] = useState(false);
	const [showPreviewShimmer, setShowPreviewShimmer] = useState(false);
	const [fadePreviewShimmer, setFadePreviewShimmer] = useState(false);
	/** Longer preview shimmer only when preview came from a template (not custom LLM parse). */
	const [previewEnteredViaTemplate, setPreviewEnteredViaTemplate] = useState(false);
	const [currentStep, setCurrentStep] = useState<SetupStep | null>(null);
	const [completedSteps, setCompletedSteps] = useState<Set<SetupStep>>(new Set());

	const fromPlans = location.state?.from === 'plans';

	const previewCards = useMemo(() => (schema ? schemaToPricingCardProps(schema) : []), [schema]);

	/** Steps shown during Create — omits limits/credits when the schema has none (matches orchestrator). */
	const setupProgressSteps = useMemo(() => (schema ? getSetupProgressSteps(schema) : []), [schema]);

	const previewSummaryLine = useMemo(() => {
		if (!schema) return '';
		const featurePart = t('pricingSetupPage.schemaFeatureCount', { count: schema.features.length });
		const planPart = t('pricingSetupPage.schemaPlanCount', { count: schema.plans.length });
		const cg = schema.credit_grants ?? [];
		const creditPart = cg.length > 0 ? t('pricingSetupPage.schemaCreditGrantCount', { count: cg.length }) : '';
		return [featurePart, planPart, creditPart].filter(Boolean).join(' · ');
	}, [schema, t]);

	useEffect(() => {
		if (phase !== 'preview') {
			setShowPreviewShimmer(false);
			setFadePreviewShimmer(false);
			return;
		}

		if (skipNextPreviewShimmerRef.current) {
			skipNextPreviewShimmerRef.current = false;
			setShowPreviewShimmer(false);
			setFadePreviewShimmer(false);
			return;
		}

		const fadeMs = previewEnteredViaTemplate ? PREVIEW_SHIMMER_FADE_TEMPLATE_MS : PREVIEW_SHIMMER_FADE_MS;
		const endMs = previewEnteredViaTemplate ? PREVIEW_SHIMMER_END_TEMPLATE_MS : PREVIEW_SHIMMER_END_MS;

		// Shimmer + dissolve before reveal (intentional delay)
		setShowPreviewShimmer(true);
		setFadePreviewShimmer(false);
		const t1 = window.setTimeout(() => setFadePreviewShimmer(true), fadeMs);
		const t2 = window.setTimeout(() => {
			setShowPreviewShimmer(false);
			setFadePreviewShimmer(false);
		}, endMs);
		return () => {
			window.clearTimeout(t1);
			window.clearTimeout(t2);
		};
	}, [phase, schema, previewEnteredViaTemplate]);

	// After remounting the uncontrolled prompt field, sync draft ref + send button state.
	useEffect(() => {
		const el = promptRef.current;
		if (!el) return;
		lastPromptDraftRef.current = el.value;
		setHasPromptText(el.value.trim().length > 0);
	}, [promptFieldKey, promptInputSeed]);

	const handleTemplateClick = (tpl: TemplateDefinition) => {
		const text = tpl.displayPrompt ?? '';
		lastPromptDraftRef.current = text;
		setSelectedTemplate(tpl);
		setPromptInputSeed(text);
		setPromptFieldKey((k) => k + 1);
	};

	const handleClearTemplate = () => {
		lastPromptDraftRef.current = '';
		setSelectedTemplate(null);
		setPromptInputSeed('');
		setPromptFieldKey((k) => k + 1);
	};

	/** Uncontrolled textarea: use onInput so typing works reliably across browsers; mirror draft to ref for parse/back. */
	const handlePromptInput = () => {
		const el = promptRef.current;
		if (!el) return;
		const next = el.value;
		lastPromptDraftRef.current = next;
		setHasPromptText(next.trim().length > 0);
		const templateText = (selectedTemplate?.displayPrompt ?? '').trim();
		if (selectedTemplate && next.trim() !== templateText) {
			setSelectedTemplate(null);
		}
	};

	const handleParseAndPreview = async () => {
		const raw = promptRef.current?.value ?? lastPromptDraftRef.current;
		const promptText = raw.trim();
		if (!promptText) {
			toast.error('Please enter a pricing description first.');
			return;
		}
		lastPromptDraftRef.current = raw;
		if (selectedTemplate) {
			setIsParsing(true);
			try {
				setPreviewEnteredViaTemplate(true);
				skipNextPreviewShimmerRef.current = false;
				await delay(TEMPLATE_PREVIEW_DELAY_MS);
				setSchema(selectedTemplate.schema);
				setFadePreviewShimmer(false);
				setShowPreviewShimmer(true);
				setPhase('preview');
			} finally {
				setIsParsing(false);
			}
			return;
		}
		setIsParsing(true);
		try {
			setPreviewEnteredViaTemplate(false);
			skipNextPreviewShimmerRef.current = false;
			const parsed = await parsePricingWithLLM(promptText);
			setSchema(parsed);
			setFadePreviewShimmer(false);
			setShowPreviewShimmer(true);
			setPhase('preview');
		} catch (err) {
			toast.error(getErrorMessage(err));
		} finally {
			setIsParsing(false);
		}
	};

	const handleConfirmCreate = async () => {
		if (!schema) return;
		const stepOrder: SetupStep[] = [...getSetupProgressSteps(schema), 'done'];
		setPhase('creating');
		setCompletedSteps(new Set());
		setCurrentStep(stepOrder[0]);
		try {
			await orchestrateSetup(schema, (step) => {
				const stepIndex = stepOrder.indexOf(step);
				if (stepIndex < 0) return;
				setCompletedSteps(() => {
					const next = new Set<SetupStep>();
					for (let i = 0; i < stepIndex; i++) next.add(stepOrder[i]);
					return next;
				});
				setCurrentStep(step);
			});
			setCompletedSteps(new Set(stepOrder));
			toast.success('Your pricing has been set up!');
			void queryClient.invalidateQueries({ queryKey: [SIDEBAR_PRICING_PROMO_QUERY_KEY], exact: false });
			window.setTimeout(() => navigate(RouteNames.plan), POST_SETUP_NAVIGATE_DELAY_MS);
		} catch (err) {
			toast.error(getErrorMessage(err));
			skipNextPreviewShimmerRef.current = true;
			setPhase('preview');
			setCurrentStep(null);
		}
	};

	const handleBack = () => {
		const draft = lastPromptDraftRef.current;
		setPhase('input');
		setSchema(null);
		setPreviewEnteredViaTemplate(false);
		setPromptInputSeed(draft);
		setPromptFieldKey((k) => k + 1);
	};

	const handleSkip = () => {
		navigate(fromPlans ? RouteNames.plan : RouteNames.homeDashboard);
	};

	const activeStepIdx = currentStep && currentStep !== 'done' ? setupProgressSteps.indexOf(currentStep) : -1;

	const creatingStatusLabel =
		currentStep === 'done'
			? STEP_LABELS.done
			: activeStepIdx >= 0 && setupProgressSteps[activeStepIdx]
				? STEP_LABELS[setupProgressSteps[activeStepIdx]]
				: null;

	return (
		<div className='fixed inset-0 z-50 overflow-y-auto overflow-x-hidden'>
			{/*
			 * One layer per theme. The grid art is a baked PNG so it cannot follow a token, and the light
			 * export read as a near-white sheet behind a dark page. `hidden` also keeps the browser from
			 * fetching the layer it will not show.
			 */}
			<div
				className='pointer-events-none absolute inset-0 z-0 bg-cover bg-center dark:hidden'
				style={{ backgroundImage: `url("/assets/v4bgagentic.png")` }}
				aria-hidden
			/>
			<div
				className='pointer-events-none absolute inset-0 z-0 hidden bg-cover bg-center dark:block'
				style={{ backgroundImage: `url(${promptToPlanDarkBg})` }}
				aria-hidden
			/>

			{(phase === 'input' || phase === 'preview') && (
				<button
					type='button'
					onClick={handleSkip}
					aria-label={t('pricingSetupPage.closeReturnDashboardAria')}
					className={cn(
						'absolute right-3 top-3 z-[55] flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
						'border border-line/90 bg-surface/85 text-content-muted shadow-sm backdrop-blur-sm',
						'transition-all hover:scale-105 hover:border-line-strong hover:bg-surface hover:text-content-heading hover:shadow-md',
						'active:scale-95 sm:right-5 sm:top-5 sm:h-10 sm:w-10',
					)}>
					<X className='h-4 w-4 sm:h-[18px] sm:w-[18px]' strokeWidth={2.25} aria-hidden />
				</button>
			)}

			<div
				className={cn(
					'relative z-10 flex w-full flex-col items-center px-4 sm:px-6',
					phase === 'preview' ? 'min-h-screen justify-center py-10 sm:py-12' : 'min-h-screen justify-center py-16',
				)}>
				{phase === 'input' && isParsing && (
					<div className='fixed inset-0 z-[60] flex items-center justify-center bg-surface/50' role='status' aria-live='polite'>
						<div className='flex items-center gap-3 rounded-xl bg-surface px-5 py-3 shadow-md ring-1 ring-line/80'>
							<Loader2 className='h-5 w-5 shrink-0 animate-spin text-accent-indigo' aria-hidden />
							<span className='analyzing-prompt-shimmer text-sm font-medium'>{t('pricingSetupPage.analyzingPrompt')}</span>
						</div>
					</div>
				)}

				{/* ── Phase: input ─────────────────────────────────────── */}
				{phase === 'input' && (
					<div className='relative z-10 w-full min-w-0 max-w-3xl'>
						{/* Header */}
						<div className='mb-8 text-center'>
							<h1 className='text-[2rem] font-medium tracking-tight text-content'>{t('pricingSetupPage.title')}</h1>
							<p className='mt-2.5 text-[15px] text-content-tertiary'>{t('pricingSetupPage.subtitle')}</p>
						</div>

						{/* Template badge */}
						{selectedTemplate && (
							<div className='mb-3 flex items-center justify-between rounded-xl border border-line bg-surface/80 px-4 py-2.5 backdrop-blur-sm'>
								<span className='text-sm text-content-secondary'>
									{selectedTemplate.iconSrc ? (
										<img
											src={selectedTemplate.iconSrc}
											alt={t('pricingSetupPage.templateLogoAlt', { label: selectedTemplate.label })}
											className={cn(
												'mr-2 inline-block h-4 w-4 object-contain align-[-2px]',
												selectedTemplate.iconIsMonochromeDark && 'dark:brightness-0 dark:invert',
											)}
										/>
									) : (
										<span className='mr-1.5 text-base'>{selectedTemplate.icon}</span>
									)}
									{t('pricingSetupPage.usingTemplate', { name: selectedTemplate.label })}
								</span>
								<button
									type='button'
									onClick={handleClearTemplate}
									aria-label={t('pricingSetupPage.clearTemplateAria')}
									className='ml-3 rounded-lg p-1 text-content-muted transition-colors hover:text-content'>
									<X className='h-3.5 w-3.5' />
								</button>
							</div>
						)}

						{/* Textarea card */}
						<div className='relative z-10 rounded-2xl border border-line-strong bg-surface shadow-sm focus-within:border-line-inverse focus-within:ring-2 focus-within:ring-line-inverse/10'>
							<textarea
								key={promptFieldKey}
								ref={promptRef}
								placeholder={t('pricingSetupPage.promptPlaceholder')}
								defaultValue={promptInputSeed}
								onInput={handlePromptInput}
								autoComplete='off'
								autoCorrect='off'
								spellCheck
								rows={5}
								disabled={isParsing}
								className='relative z-10 w-full resize-none rounded-t-2xl bg-transparent px-5 pt-3 text-[15px] leading-relaxed text-content-heading outline-none placeholder:text-content-subtle disabled:cursor-not-allowed disabled:opacity-60'
							/>
							<div className='flex items-center justify-end border-t border-line-subtle px-4 py-3'>
								<button
									type='button'
									onClick={handleParseAndPreview}
									disabled={!hasPromptText || isParsing}
									className={cn(
										'flex h-9 w-9 items-center justify-center rounded-xl bg-brand-fill text-content-on-brand transition-all',
										'hover:opacity-90 active:scale-95',
										'disabled:cursor-not-allowed disabled:opacity-30',
									)}
									aria-label={t('pricingSetupPage.generatePreviewAria')}>
									{isParsing ? (
										<Loader2 className='h-4 w-4 animate-spin' aria-hidden />
									) : (
										<ArrowRight className='h-4 w-4' strokeWidth={2} />
									)}
								</button>
							</div>
						</div>

						{/* Templates row */}
						<div className='mt-7'>
							<div className='mb-5 flex items-center gap-3'>
								<div className='h-px flex-1 bg-surface-strong' />
								<span className='text-xs font-medium text-content-muted'>{t('pricingSetupPage.templatesHeading')}</span>
								<div className='h-px flex-1 bg-surface-strong' />
							</div>
							<div className='flex justify-center gap-2.5 flex-wrap'>
								{PRICING_TEMPLATES.map((tpl) => (
									<button
										type='button'
										key={tpl.label}
										onClick={() => handleTemplateClick(tpl)}
										className={cn(
											'flex shrink-0 items-center gap-3 rounded-xl border bg-surface px-4 py-2.5 text-left text-sm shadow-sm',
											'transition-all hover:border-line-bold hover:shadow active:scale-95',
											selectedTemplate?.label === tpl.label
												? 'border-line-inverse text-content shadow-md'
												: 'border-line-strong text-content-secondary',
										)}>
										{tpl.iconSrc ? (
											<img
												src={tpl.iconSrc}
												alt={t('pricingSetupPage.templateLogoAlt', { label: tpl.label })}
												className={cn(
													'h-4 w-4 object-contain',
													tpl.iconIsMonochromeDark && 'dark:brightness-0 dark:invert',
													selectedTemplate?.label === tpl.label ? 'opacity-100' : 'opacity-70',
												)}
											/>
										) : (
											<span
												className={cn('text-[15px] leading-none', selectedTemplate?.label === tpl.label ? 'opacity-100' : 'opacity-60')}>
												{tpl.icon}
											</span>
										)}
										<span
											className={cn('font-medium leading-none', selectedTemplate?.label === tpl.label ? 'text-content' : 'text-content')}>
											{tpl.label}
										</span>
									</button>
								))}
							</div>
						</div>

						{/* Skip */}
						<div className='mt-6 text-center'>
							<button type='button' onClick={handleSkip} className='text-sm text-content-muted transition-colors hover:text-content'>
								{t('pricingSetupPage.skipToDashboard')}
							</button>
						</div>
					</div>
				)}

				{/* ── Phase: preview ───────────────────────────────────── */}
				{phase === 'preview' && schema && (
					<div className='relative z-10 flex w-full min-w-0 max-w-[1420px] flex-col'>
						{/* Header */}
						<div className='mb-8 shrink-0 text-center sm:mb-9'>
							<p className='text-[13px] font-semibold leading-relaxed text-content-secondary'>{previewSummaryLine}</p>
						</div>

						{/* Canvas: comfortable vertical padding + cap so 4+ cards can still scroll inside */}
						<div className='flex flex-col px-2 sm:px-6'>
							<div className='mx-auto w-full max-w-[1320px]'>
								{/* min-h keeps the frame visibly tall when plans are few; max-h + overflow when many. Inner py is unmistakable breathing room. */}
								<div className='relative min-h-[min(56vh,44rem)] max-h-[min(72vh,52rem)] w-full overflow-x-hidden overflow-y-auto rounded-2xl border border-line-bold pricing-preview-canvas sm:max-h-[min(74vh,54rem)]'>
									<div className='px-6 py-20 sm:px-8 sm:py-24 md:px-10 md:py-32'>
										<div className='relative z-0 mx-auto w-full max-w-[1220px]'>
											<div
												className={cn(
													'grid gap-5 justify-items-stretch transition-opacity duration-500 sm:gap-6',
													showPreviewShimmer && !fadePreviewShimmer ? 'pointer-events-none opacity-0' : 'opacity-100',
													previewCards.length === 1
														? 'grid-cols-1 max-w-sm mx-auto'
														: previewCards.length === 2
															? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto'
															: previewCards.length === 3
																? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
																: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
												)}>
												{previewCards.map((card) => (
													<PricingCard key={card.id} {...card} className='w-full' isPreview />
												))}
											</div>
										</div>
									</div>

									{showPreviewShimmer && (
										<div
											className={cn('pricing-shimmer-overlay pointer-events-none z-10', fadePreviewShimmer && 'pricing-shimmer-fadeout')}
										/>
									)}
								</div>
							</div>

							<div className='mx-auto mt-9 flex w-full max-w-[1320px] shrink-0 items-center justify-end gap-6 sm:mt-10'>
								<button type='button' onClick={handleBack} className='text-sm text-content-heading transition-colors hover:text-content'>
									{t('actions.back')}
								</button>
								<Button
									type='button'
									onClick={() => void handleConfirmCreate()}
									className='rounded-xl px-5 py-2.5 shadow-sm active:scale-95'>
									{t('actions.create')}
								</Button>
							</div>
						</div>
					</div>
				)}

				{/* ── Phase: creating ──────────────────────────────────── */}
				{phase === 'creating' && (
					<div className='w-full max-w-2xl'>
						<div className='rounded-2xl border border-line bg-surface p-10 shadow-sm sm:p-11'>
							<h2 className='text-center text-xl font-semibold text-content'>{t('pricingSetupPage.buildingPricing')}</h2>
							<p className='mt-2.5 text-center text-sm text-content-muted'>{t('pricingSetupPage.creatingSubtitle')}</p>

							<div className='mt-10 flex flex-col items-center'>
								<div
									className='flex w-full min-w-0 max-w-[36rem] items-center justify-center gap-0 px-2 sm:px-6'
									role='list'
									aria-label={t('pricingSetupPage.setupProgressAria')}>
									{setupProgressSteps.map((step, idx) => {
										const isCompleted = completedSteps.has(step);
										const isActive = activeStepIdx === idx;
										const prevCompleted = idx > 0 && completedSteps.has(setupProgressSteps[idx - 1]);

										return (
											<Fragment key={step}>
												{idx > 0 && (
													<div
														className={cn(
															'mx-2 h-0.5 min-w-[2rem] flex-1 rounded-full transition-colors duration-500 ease-out sm:mx-3 sm:min-w-[3.5rem]',
															prevCompleted ? 'bg-accent-emerald' : 'bg-surface-strong',
														)}
														aria-hidden
													/>
												)}
												<div
													role='listitem'
													className={cn(
														'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-300 sm:h-10 sm:w-10',
														isCompleted && 'bg-accent-emerald text-content-inverse shadow-sm shadow-accent-emerald/25',
														!isCompleted &&
															isActive &&
															'bg-surface text-accent-emerald-strong ring-2 ring-accent-emerald-soft/60 ring-offset-2 ring-offset-surface',
														!isCompleted && !isActive && 'border border-line bg-surface-subtle text-content-subtle',
													)}
													aria-current={isActive ? 'step' : undefined}>
													{isCompleted ? (
														<Check className='h-[18px] w-[18px] sm:h-5 sm:w-5' strokeWidth={2.5} aria-hidden />
													) : isActive ? (
														<span className='h-2 w-2 animate-pulse rounded-full bg-accent-emerald' aria-hidden />
													) : (
														<span aria-hidden>{idx + 1}</span>
													)}
												</div>
											</Fragment>
										);
									})}
								</div>

								{creatingStatusLabel && (
									<div className='mt-8 flex min-h-[2.75rem] flex-col items-center text-center' role='status' aria-live='polite'>
										<p
											className={cn(
												'text-[15px] font-medium leading-relaxed transition-colors duration-300 sm:text-base',
												currentStep === 'done' ? 'text-content-muted' : 'text-content',
											)}>
											{creatingStatusLabel}
										</p>
									</div>
								)}
							</div>

							{currentStep === 'done' && (
								<div className='mt-8 flex justify-center'>
									<div className='flex items-center gap-2 text-sm font-medium text-content-tertiary'>
										<Loader2 className='h-4 w-4 animate-spin' aria-hidden />
										{t('pricingSetupPage.redirectingToPlans')}
									</div>
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default PricingSetupPage;
