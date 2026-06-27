import { FC, useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { BsThreeDotsVertical } from 'react-icons/bs';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Button, Card, CardHeader, Dialog, Input } from '@/components/atoms';
import Label from '@/components/atoms/Label';
import FlexpriceTable, { ColumnData } from '@/components/molecules/Table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import IntegrationMappingApi, { IntegrationConfigItem, IntegrationMappingItem } from '@/api/IntegrationMappingApi';
import { integrationCatalogSpecs } from '@/pages/insights-tools/integrations/integrationsData';
import formatDate from '@/utils/common/format_date';
import { CONNECTION_PROVIDER_TYPE } from '@/models/Connection';
import PaymentApi from '@/api/PaymentApi';
import { IntegrationEntityType } from '@/types/dto';

const PROVIDER_ID_MAP: Record<string, string> = {
	zoho_books: 'zoho',
};

const providerLogoMap = new Map(integrationCatalogSpecs.map((spec) => [spec.id, spec.logo]));

const getProviderLogo = (providerType: string): string | undefined => {
	const mappedId = PROVIDER_ID_MAP[providerType] ?? providerType;
	return providerLogoMap.get(mappedId);
};

const isSafeExternalUrl = (value: string): boolean => {
	try {
		const parsed = new URL(value);
		return parsed.protocol === 'https:' || parsed.protocol === 'http:';
	} catch {
		return false;
	}
};

const formatProviderName = (providerType: string): string => {
	return providerType
		.split('_')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
};

interface IntegrationRow {
	provider_type: string;
	mapping: IntegrationMappingItem | null;
	syncOutboundEnabled: boolean;
	syncInboundEnabled: boolean;
}

interface IntegrationMappingCardProps {
	entityType: IntegrationEntityType;
	entityId: string;
	entityIdColumnTitle?: string;
	isActionDisabled?: boolean;
}

const IntegrationMappingCard: FC<IntegrationMappingCardProps> = ({
	entityType,
	entityId,
	entityIdColumnTitle,
	isActionDisabled = false,
}) => {
	const { t } = useTranslation('common');
	const queryClient = useQueryClient();
	const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
	const [linkDialogOpen, setLinkDialogOpen] = useState(false);
	const [linkTarget, setLinkTarget] = useState<IntegrationRow | null>(null);
	const [providerEntityId, setProviderEntityId] = useState('');
	const [delinkDialogOpen, setDelinkDialogOpen] = useState(false);
	const [delinkTarget, setDelinkTarget] = useState<IntegrationRow | null>(null);

	const { data: integrationConfigData } = useQuery({
		queryKey: ['integrationConfig'],
		queryFn: () => IntegrationMappingApi.getIntegrationConfig(),
	});

	const hasIntegrationConfig = (integrationConfigData?.integrations?.length ?? 0) > 0;

	const { data: integrationMappingsData, isPending: isMappingsPending } = useQuery({
		queryKey: ['integrationMappings', entityType, entityId],
		queryFn: () => IntegrationMappingApi.getIntegrationMappings(entityType, entityId),
		enabled: !!entityId && hasIntegrationConfig,
	});

	const integrationRows = useMemo<IntegrationRow[]>(() => {
		const configs = integrationConfigData?.integrations ?? [];
		const mappings = integrationMappingsData?.items ?? [];
		const mappingByProvider = new Map(mappings.map((m) => [m.provider_type, m]));
		return configs.map((cfg: IntegrationConfigItem) => ({
			provider_type: cfg.provider,
			mapping: mappingByProvider.get(cfg.provider) ?? null,
			syncOutboundEnabled: !!cfg.current_config?.[entityType]?.outbound,
			syncInboundEnabled: !!cfg.current_config?.[entityType]?.inbound,
		}));
	}, [integrationConfigData?.integrations, integrationMappingsData?.items, entityType]);

	const { mutate: syncIntegration, isPending: isSyncing } = useMutation({
		mutationFn: (method: 'push' | 'pull') =>
			IntegrationMappingApi.syncIntegration({
				entity_type: entityType,
				entity_id: entityId,
				method,
			}),
		onSuccess: () => {
			toast.success(t('common:toast.integrationSyncTriggered'));
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to trigger sync');
		},
	});

	const { mutate: linkIntegration, isPending: isLinking } = useMutation({
		mutationFn: () =>
			IntegrationMappingApi.linkIntegration({
				entity_type: entityType,
				entity_id: entityId,
				provider_type: linkTarget!.provider_type,
				provider_entity_id: providerEntityId,
			}),
		onSuccess: () => {
			toast.success(t('common:toast.integrationLinked'));
			setLinkDialogOpen(false);
			setProviderEntityId('');
			setLinkTarget(null);
			queryClient.invalidateQueries({ queryKey: ['integrationMappings', entityType, entityId] });
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to link integration');
		},
	});

	const { mutate: delinkIntegration, isPending: isDelinking } = useMutation({
		mutationFn: () =>
			IntegrationMappingApi.delinkIntegration({
				entity_type: entityType,
				entity_id: entityId,
				provider_type: delinkTarget!.provider_type,
			}),
		onSuccess: () => {
			toast.success(t('common:toast.integrationUnlinked'));
			setDelinkDialogOpen(false);
			setDelinkTarget(null);
			queryClient.invalidateQueries({ queryKey: ['integrationMappings', entityType, entityId] });
		},
		onError: (error: Error) => {
			toast.error(error.message || t('common:toast.integrationUnlinkFailed'));
		},
	});

	const { mutate: setupMoyasarAutopay } = useMutation({
		mutationFn: () => PaymentApi.getMoyasarSetupIntent(entityId, window.location.href),
		onSuccess: (res) => window.open(res.checkout_url, '_blank'),
		onError: (error: Error) => toast.error(error.message || t('integrations.autopaySetupFailed')),
	});

	const handleLinkClick = useCallback((row: IntegrationRow) => {
		setLinkTarget(row);
		setProviderEntityId('');
		setLinkDialogOpen(true);
		setDropdownOpen(null);
	}, []);

	const handleSyncClick = useCallback(
		(method: 'push' | 'pull') => {
			setDropdownOpen(null);
			syncIntegration(method);
		},
		[syncIntegration],
	);

	const handleDelinkClick = useCallback((row: IntegrationRow) => {
		setDelinkTarget(row);
		setDelinkDialogOpen(true);
		setDropdownOpen(null);
	}, []);

	const handleLinkSubmit = () => {
		if (!linkTarget) {
			return;
		}
		if (!providerEntityId.trim()) {
			toast.error(t('common:toast.providerEntityIdRequired'));
			return;
		}
		linkIntegration();
	};

	const resolvedColumnTitle =
		entityIdColumnTitle ??
		t(`integrations.entityIdColumn.${entityType}`, {
			defaultValue: `Integration ${entityType.charAt(0).toUpperCase() + entityType.slice(1)} ID`,
		});

	const integrationColumns: ColumnData<IntegrationRow>[] = useMemo(
		() => [
			{
				title: t('tableColumns.integration'),
				render: (row: IntegrationRow) => {
					const logo = getProviderLogo(row.provider_type);
					return (
						<div className='flex items-center gap-2'>
							{logo && <img src={logo} alt={row.provider_type} className='size-5 object-contain' />}
							<span className='font-medium text-foreground'>{formatProviderName(row.provider_type)}</span>
						</div>
					);
				},
			},
			{
				title: resolvedColumnTitle,
				render: (row: IntegrationRow) => <span className='text-muted-foreground'>{row.mapping?.provider_entity_id || '—'}</span>,
			},
			{
				title: t('tableColumns.createdAt'),
				render: (row: IntegrationRow) => (
					<span className='text-muted-foreground'>{row.mapping?.created_at ? formatDate(row.mapping.created_at) : '—'}</span>
				),
			},
			{
				title: t('tableColumns.updatedAt'),
				render: (row: IntegrationRow) => (
					<span className='text-muted-foreground'>{row.mapping?.updated_at ? formatDate(row.mapping.updated_at) : '—'}</span>
				),
			},
			{
				title: '',
				width: 60,
				align: 'center' as const,
				fieldVariant: 'interactive' as const,
				render: (row: IntegrationRow) =>
					row.mapping?.provider_url && isSafeExternalUrl(row.mapping.provider_url) ? (
						<a
							href={row.mapping.provider_url}
							target='_blank'
							rel='noopener noreferrer'
							data-interactive='true'
							className='inline-flex items-center text-primary hover:text-primary/80'>
							<ExternalLink className='size-4' />
						</a>
					) : null,
			},
			{
				title: '',
				width: 40,
				fieldVariant: 'interactive' as const,
				render: (row: IntegrationRow) => {
					const hasProviderEntity = !!row.mapping?.provider_entity_id;
					return (
						<div data-interactive='true'>
							<DropdownMenu
								open={dropdownOpen === row.provider_type}
								onOpenChange={(open) => setDropdownOpen(open ? row.provider_type : null)}>
								<DropdownMenuTrigger asChild>
									<button
										type='button'
										aria-label={t('integrations.actions')}
										className='rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
										<BsThreeDotsVertical className='text-base text-muted-foreground hover:text-foreground transition-colors' />
									</button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align='end'>
									<DropdownMenuItem
										disabled={isMappingsPending || hasProviderEntity || isActionDisabled}
										onSelect={(e) => {
											e.preventDefault();
											handleLinkClick(row);
										}}
										className='cursor-pointer'>
										{t('actions.link')}
									</DropdownMenuItem>
									<DropdownMenuItem
										disabled={isMappingsPending || isDelinking || !hasProviderEntity || isActionDisabled}
										onSelect={(e) => {
											e.preventDefault();
											handleDelinkClick(row);
										}}
										className='cursor-pointer text-destructive focus:text-destructive'>
										{t('actions.unlink')}
									</DropdownMenuItem>
									{entityType === 'customer' && row.provider_type === CONNECTION_PROVIDER_TYPE.MOYASAR && (
										<DropdownMenuItem
											disabled={isActionDisabled}
											onSelect={(e) => {
												e.preventDefault();
												setDropdownOpen(null);
												setupMoyasarAutopay();
											}}
											className='cursor-pointer'>
											{t('integrations.setupAutopayMoyasar')}
										</DropdownMenuItem>
									)}
									<DropdownMenuItem
										disabled={isMappingsPending || isSyncing || !row.syncOutboundEnabled || isActionDisabled}
										onSelect={(e) => {
											e.preventDefault();
											handleSyncClick('push');
										}}
										className='cursor-pointer'>
										{t('integrations.syncPush')}
									</DropdownMenuItem>
									{entityType === 'invoice' && (
										<DropdownMenuItem
											disabled={isMappingsPending || isSyncing || !row.syncInboundEnabled || isActionDisabled}
											onSelect={(e) => {
												e.preventDefault();
												handleSyncClick('pull');
											}}
											className='cursor-pointer'>
											{t('integrations.syncPull')}
										</DropdownMenuItem>
									)}
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					);
				},
			},
		],
		[
			dropdownOpen,
			isMappingsPending,
			isSyncing,
			isDelinking,
			isActionDisabled,
			resolvedColumnTitle,
			entityType,
			setupMoyasarAutopay,
			handleLinkClick,
			handleSyncClick,
			handleDelinkClick,
			t,
		],
	);

	if (!hasIntegrationConfig) {
		return null;
	}

	return (
		<>
			<Card variant='notched'>
				<CardHeader title={t('integrations.title')} titleClassName='font-semibold' />
				<FlexpriceTable data={integrationRows} columns={integrationColumns} showEmptyRow variant='no-bordered' />
			</Card>

			<Dialog
				isOpen={linkDialogOpen}
				onOpenChange={(open) => {
					setLinkDialogOpen(open);
					if (!open) {
						setProviderEntityId('');
						setLinkTarget(null);
					}
				}}
				title={`${t('actions.link')} ${linkTarget ? formatProviderName(linkTarget.provider_type) : t('integrations.integration')}`}>
				<div className='space-y-4'>
					<div className='space-y-1'>
						<Label label={t('integrations.providerEntityId')} />
						<Input
							value={providerEntityId}
							onChange={(val) => setProviderEntityId(val)}
							placeholder={t('integrations.enterProviderEntityId')}
						/>
					</div>
					<div className='flex justify-end gap-2'>
						<Button
							variant='outline'
							onClick={() => {
								setLinkDialogOpen(false);
								setProviderEntityId('');
								setLinkTarget(null);
							}}>
							{t('actions.cancel')}
						</Button>
						<Button onClick={handleLinkSubmit} disabled={isLinking || !providerEntityId.trim()}>
							{isLinking ? t('actions.linking') : t('actions.link')}
						</Button>
					</div>
				</div>
			</Dialog>

			<Dialog
				isOpen={delinkDialogOpen}
				onOpenChange={(open) => {
					setDelinkDialogOpen(open);
					if (!open) {
						setDelinkTarget(null);
					}
				}}
				title={t('integrations.unlinkConfirmTitle')}>
				<div className='space-y-4'>
					<p className='text-sm text-muted-foreground'>
						{t('integrations.unlinkConfirmDescription', {
							provider: delinkTarget ? formatProviderName(delinkTarget.provider_type) : t('integrations.integration'),
						})}
					</p>
					<div className='flex justify-end gap-2'>
						<Button
							variant='outline'
							onClick={() => {
								setDelinkDialogOpen(false);
								setDelinkTarget(null);
							}}>
							{t('actions.cancel')}
						</Button>
						<Button variant='destructive' onClick={() => delinkIntegration()} disabled={isDelinking}>
							{isDelinking ? t('actions.unlinking') : t('actions.unlink')}
						</Button>
					</div>
				</div>
			</Dialog>
		</>
	);
};

export default IntegrationMappingCard;
