import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useGlobalLoading } from '@/core/services/tanstack/ReactQueryProvider';
import useUser from '@/hooks/useUser';
import { RouteNames } from '@/core/routes/Routes';
import { useEnvironment } from '@/hooks/useEnvironment';
import { useRestrictedEnvs, EnvRestrictionState } from '@/hooks/useRestrictedEnvs';
import { useCurrentUserPermissions } from '@/hooks/useCurrentUserPermissions';
import EnvironmentCreator from '@/components/molecules/EnvironmentCreator/EnvironmentCreator';
import EnvironmentCopier from '@/components/molecules/EnvironmentCopier/EnvironmentCopier';
import EnvironmentEditor from '@/components/molecules/EnvironmentEditor/EnvironmentEditor';
import ContactUsDialog from '@/components/molecules/ContactUsDialog/ContactUsDialog';
import Environment from '@/models/Environment';

/**
 * Everything an environment switcher does, without how it looks: the environment list, switching
 * (including the suspended-environment check), and the create / copy / rename dialogs. Render
 * `dialogs` once next to whatever control calls `openCreate` / `openCopy` / `openEdit`.
 */
export function useEnvironmentSwitcher() {
	const { t } = useTranslation('settings');
	const { loading, user } = useUser();
	const navigate = useNavigate();
	const { setLoading } = useGlobalLoading();
	const { environments, activeEnvironment, changeActiveEnvironment, refetchEnvironments, isDevelopment, isProduction } = useEnvironment();
	const { getRestriction } = useRestrictedEnvs();
	const { can } = useCurrentUserPermissions();
	const canWrite = can('environment', 'write');

	const [isCreatorOpen, setIsCreatorOpen] = useState(false);
	const [isCopierOpen, setIsCopierOpen] = useState(false);
	const [editingEnvironment, setEditingEnvironment] = useState<Environment | null>(null);
	const [isSuspendedDialogOpen, setIsSuspendedDialogOpen] = useState(false);

	// If activeEnvironment is null, use the first environment as a fallback
	const current = activeEnvironment || environments?.[0];
	const hasEnvironments = !!environments && environments.length > 0;

	/** Switches environment and returns home. Resolves false when the environment is suspended. */
	const select = async (environmentId: string): Promise<boolean> => {
		const restriction = getRestriction(environmentId, user?.tenant?.id);
		if (restriction.state === EnvRestrictionState.Suspended) {
			setIsSuspendedDialogOpen(true);
			return false;
		}
		setLoading(true);
		try {
			changeActiveEnvironment(environmentId);
			navigate(RouteNames.home);
		} catch (error) {
			console.error('Failed to change environment:', error);
		} finally {
			setLoading(false);
		}
		return true;
	};

	const dialogs: ReactNode = (
		<>
			<EnvironmentCreator
				isOpen={isCreatorOpen}
				onOpenChange={setIsCreatorOpen}
				onEnvironmentCreated={async (environmentId) => {
					await refetchEnvironments();
					if (!environmentId) return;
					if (hasEnvironments) {
						select(environmentId);
					} else {
						changeActiveEnvironment(environmentId);
						navigate(RouteNames.home);
					}
				}}
			/>
			{hasEnvironments && (
				<>
					<EnvironmentCopier
						isOpen={isCopierOpen}
						onOpenChange={setIsCopierOpen}
						sourceEnvironment={current}
						onEnvironmentCloned={async () => {
							await refetchEnvironments();
						}}
					/>
					<EnvironmentEditor
						isOpen={!!editingEnvironment}
						onOpenChange={(open) => {
							if (!open) setEditingEnvironment(null);
						}}
						environment={editingEnvironment}
						onEnvironmentUpdated={async () => {
							await refetchEnvironments();
						}}
					/>
					<ContactUsDialog
						isOpen={isSuspendedDialogOpen}
						onOpenChange={setIsSuspendedDialogOpen}
						title={t('environment.selector.suspendedTitle')}
						description={t('environment.selector.suspendedDescription')}
					/>
				</>
			)}
		</>
	);

	return {
		loading,
		tenantName: user?.tenant?.name,
		environments: environments ?? [],
		current,
		/** The explicitly active environment's id; `current` falls back to the first one. */
		activeId: activeEnvironment?.id,
		isDevelopment,
		isProduction,
		canWrite,
		select,
		openCreate: () => setIsCreatorOpen(true),
		openCopy: () => setIsCopierOpen(true),
		openEdit: (environment: Environment) => setEditingEnvironment(environment),
		dialogs,
	};
}
