import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Trash2 } from 'lucide-react';
import { Button, FieldWithInfo, Input } from '@/components/atoms';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { CUSTOM_WORKFLOW_NAME_MAX_LENGTH, type CustomerOnboardingCustomWorkflowDraft } from '@/types/dto/CustomerOnboarding';
import OnboardingActionSetEditor, { type OnboardingActionSetEditorPlanOption } from './OnboardingActionSetEditor';

interface CustomWorkflowCardProps {
	value: CustomerOnboardingCustomWorkflowDraft;
	onChange: (next: CustomerOnboardingCustomWorkflowDraft) => void;
	onRemove: () => void;
	planOptions: OnboardingActionSetEditorPlanOption[];
	arePlansLoading?: boolean;
	disabled?: boolean;
	defaultOpen?: boolean;
}

const CustomWorkflowCard = ({
	value,
	onChange,
	onRemove,
	planOptions,
	arePlansLoading = false,
	disabled = false,
	defaultOpen = false,
}: CustomWorkflowCardProps) => {
	const { t } = useTranslation(['settings', 'common']);
	const [open, setOpen] = useState(defaultOpen);

	const summary = useMemo(() => {
		const parts: string[] = [];
		if (value.walletEnabled) parts.push(t('customerOnboarding.workflow.wallet.title'));
		if (value.subscriptionEnabled) parts.push(t('customerOnboarding.workflow.subscription.title'));
		if (value.advancedActions.length > 0) {
			parts.push(
				t('customerOnboarding.workflow.customWorkflows.advancedCount', {
					count: value.advancedActions.length,
				}),
			);
		}
		if (parts.length === 0) return t('customerOnboarding.workflow.customWorkflows.noActionsSummary');
		return parts.join(', ');
	}, [t, value.advancedActions.length, value.subscriptionEnabled, value.walletEnabled]);

	const nameField = t('customerOnboarding.workflow.customWorkflows.name');
	const displayName = value.label.trim() || t('customerOnboarding.workflow.customWorkflows.untitled');

	return (
		<Collapsible open={open} onOpenChange={setOpen} className='rounded-lg border border-line overflow-hidden'>
			<div className='flex items-center justify-between gap-3 bg-surface-subtle px-4 py-3'>
				<CollapsibleTrigger asChild>
					<button type='button' className='flex min-w-0 flex-1 items-center gap-2 text-start' disabled={disabled}>
						<ChevronDown className={cn('size-4 shrink-0 text-content-zinc-muted transition-transform', open && 'rotate-180')} />
						<div className='min-w-0'>
							<p className='truncate text-sm font-medium text-content-zinc-bold'>{displayName}</p>
							<p className='truncate text-xs text-content-zinc-muted'>{summary}</p>
						</div>
					</button>
				</CollapsibleTrigger>
				<Button
					type='button'
					variant='ghost'
					size='sm'
					className='h-8 shrink-0 px-2 text-content-zinc-muted hover:text-danger'
					onClick={onRemove}
					disabled={disabled}
					aria-label={t('customerOnboarding.workflow.customWorkflows.remove')}>
					<Trash2 className='size-4' />
				</Button>
			</div>
			<CollapsibleContent>
				<div className='space-y-4 border-t border-line px-4 pb-4 pt-4'>
					<FieldWithInfo
						label={nameField}
						description={t('customerOnboarding.workflow.customWorkflows.nameHint')}
						infoAriaLabel={t('info.ariaLabel', { field: nameField })}
						disabled={disabled}>
						<Input
							value={value.label}
							onChange={(next) => onChange({ ...value, label: next.slice(0, CUSTOM_WORKFLOW_NAME_MAX_LENGTH) })}
							placeholder={t('customerOnboarding.workflow.customWorkflows.namePlaceholder')}
							maxLength={CUSTOM_WORKFLOW_NAME_MAX_LENGTH}
							disabled={disabled}
						/>
					</FieldWithInfo>
					<OnboardingActionSetEditor
						value={value}
						onChange={(next) => onChange({ ...value, ...next, id: value.id, label: value.label })}
						planOptions={planOptions}
						arePlansLoading={arePlansLoading}
						disabled={disabled}
					/>
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
};

export default CustomWorkflowCard;
