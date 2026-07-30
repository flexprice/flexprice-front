'use client';

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { defaultFilter } from 'cmdk';
import { CommandPaletteDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command-palette';

import { commandPaletteCommands, COMMAND_PALETTE_INITIAL_SUGGESTED_IDS, CommandPaletteGroup } from '@/config/command-palette';
import { isIntercomMessengerAvailable } from '@/config/intercom';
import {
	dispatchCommandPaletteAction,
	getCommandPaletteActionEventName,
	CommandPaletteActionId,
	isCommandPaletteActionDevOnly,
} from '@/core/actions';
import useEnvironment from '@/hooks/useEnvironment';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const GROUPS_ORDER = [
	CommandPaletteGroup.Actions,
	CommandPaletteGroup.GoTo,
	CommandPaletteGroup.Help,
	CommandPaletteGroup.Documentation,
] as const;

const CommandPalette = () => {
	const { t } = useTranslation('common');
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState('');
	const navigate = useNavigate();
	const { isDevelopment } = useEnvironment();

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault();
				setOpen((prev) => !prev);
			}
		};
		const handleOpenPalette = () => setOpen(true);
		document.addEventListener('keydown', handleKeyDown);
		window.addEventListener('open-command-palette', handleOpenPalette);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('open-command-palette', handleOpenPalette);
		};
	}, []);

	// Show toast when user selects "Keyboard shortcuts" from the palette
	useEffect(() => {
		const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
		const shortcut = isMac ? '⌘K' : 'Ctrl+K';
		const eventName = getCommandPaletteActionEventName(CommandPaletteActionId.ShowKeyboardShortcutsHint);
		const handler = () => {
			toast.success(t('commandPalette.shortcutToast', { shortcut }));
		};
		window.addEventListener(eventName, handler);
		return () => window.removeEventListener(eventName, handler);
	}, [t]);

	const handleOpenChange = (next: boolean) => {
		setOpen(next);
		if (!next) setSearch('');
	};

	const visibleCommands = useMemo(() => {
		return commandPaletteCommands.filter((cmd) => {
			if (cmd.actionId && isCommandPaletteActionDevOnly(cmd.actionId)) return isDevelopment;
			if (cmd.actionId === CommandPaletteActionId.OpenIntercom && !isIntercomMessengerAvailable()) {
				return false;
			}
			return true;
		});
	}, [isDevelopment]);

	const commandsByGroup = useMemo(() => {
		const map = new Map<string, typeof visibleCommands>();
		for (const cmd of visibleCommands) {
			const list = map.get(cmd.group) ?? [];
			list.push(cmd);
			map.set(cmd.group, list);
		}
		return map;
	}, [visibleCommands]);

	const suggestedIdsSet = useMemo(() => new Set(COMMAND_PALETTE_INITIAL_SUGGESTED_IDS), []);

	const suggestedValues = useMemo(() => {
		const set = new Set<string>();
		for (const cmd of visibleCommands) {
			if (suggestedIdsSet.has(cmd.id)) {
				const value = [cmd.label, cmd.group, ...(cmd.keywords ?? [])].join(' ');
				set.add(value);
			}
		}
		return set;
	}, [suggestedIdsSet, visibleCommands]);

	const filter = useMemo(
		() => (value: string, searchTerm: string) => {
			const trimmed = searchTerm?.trim() ?? '';
			if (trimmed === '') {
				return suggestedValues.has(value) ? 1 : 0;
			}
			return defaultFilter(value, trimmed);
		},
		[suggestedValues],
	);

	/** When search is empty, only show the minimal suggested commands. */
	// const commandsToShow = useMemo(() => {
	// 	const trimmed = search?.trim() ?? '';
	// 	if (trimmed === '') {
	// 		return commandPaletteCommands.filter((cmd) => suggestedIdsSet.has(cmd.id));
	// 	}
	// 	return commandPaletteCommands;
	// }, [search, suggestedIdsSet]);

	const handleSelect = (command: (typeof visibleCommands)[number]) => {
		if (command.externalUrl) {
			window.open(command.externalUrl, '_blank', 'noopener,noreferrer');
		}
		if (command.actionId) {
			dispatchCommandPaletteAction(command.actionId);
		}
		if (command.path) {
			navigate(command.path);
		}
		setOpen(false);
	};

	const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
	const shortcutHint = isMac ? '⌘K' : 'Ctrl+K';

	return (
		<CommandPaletteDialog open={open} onOpenChange={handleOpenChange} value={search} onValueChange={setSearch} filter={filter}>
			<CommandInput placeholder={t('commandPalette.searchPlaceholderExtended')} aria-label={t('commandPalette.searchCommandsAriaLabel')} />
			<CommandList>
				<CommandEmpty>{t('selectUi.noResultsFound')}</CommandEmpty>
				{GROUPS_ORDER.map((groupName) => {
					const items = commandsByGroup.get(groupName);
					if (!items?.length) return null;
					return (
						<CommandGroup className='!font-normal' key={groupName} heading={groupName}>
							{items.map((command) => {
								const Icon = command.icon;
								const searchValue = [command.label, command.group, ...(command.keywords ?? [])].join(' ');
								return (
									<CommandItem
										key={command.id}
										value={searchValue}
										onSelect={() => handleSelect(command)}
										className='my-1 mx-2 p-2 !rounded-xl'>
										{Icon && <Icon className='!size-[11px] shrink-0 text-muted-foreground mx-2' />}
										<span className='!text-[13px] text-black/70 !font-normal'>{command.label}</span>
									</CommandItem>
								);
							})}
						</CommandGroup>
					);
				})}
			</CommandList>
			<p className='px-3 py-2 text-[11px] text-muted-foreground/80 border-t border-border/80 bg-muted/30'>
				<span className='sr-only'>{t('commandPalette.keyboardShortcutsSrOnly')} </span>
				{t('commandPalette.keyboardShortcutsHint', { shortcut: shortcutHint })}
			</p>
		</CommandPaletteDialog>
	);
};

export default CommandPalette;
