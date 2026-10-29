# Components, forms and response-field candidates

Extracted controls include drawers, modal editors, table renderers and page forms. Property reads are lexical candidates, not a complete data-flow proof. Cross-reference API-CONTRACTS.md, data/contracts.json and live network shapes.

## src/components/ui/sidebar.tsx

645 lines. Query keys:

Response/domain field candidates:

- Line 235: `Button`

```tsx
ref={ref}
				data-sidebar='trigger'
				variant='ghost'
				size='icon'
				className={cn('h-7 w-7', className)}
				onClick={(event) => {
					onClick?.(event);
					toggleSidebar();
				}}
				{...props}
```

- Line 300: `Input`

```tsx
ref={ref}
				data-sidebar='input'
				className={cn('h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring', className)}
				{...props}
```

## src/components/ui/select.tsx

132 lines. Query keys:

Response/domain field candidates:

- Line 17: `SelectPrimitive.Trigger`

```tsx
ref={ref}
		className={cn(
			'flex h-10 w-full items-center justify-between rounded-[6px] border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
			className,
		)}
		{...props}
```

- Line 25: `SelectPrimitive.Icon`

```tsx
asChild
```

- Line 37: `SelectPrimitive.ScrollUpButton`

```tsx
ref={ref} className={cn('flex cursor-default items-center justify-center py-1', className)} {...props}
```

- Line 47: `SelectPrimitive.ScrollDownButton`

```tsx
ref={ref} className={cn('flex cursor-default items-center justify-center py-1', className)} {...props}
```

- Line 57: `SelectPrimitive.Portal`

```tsx

```

- Line 58: `SelectPrimitive.Content`

```tsx
ref={ref}
			className={cn(
				'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-[6px] border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
				position === 'popper' &&
					'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
				className,
			)}
			position={position}
			{...props}
```

- Line 68: `SelectScrollUpButton`

```tsx

```

- Line 69: `SelectPrimitive.Viewport`

```tsx
className={cn(
					'p-1',
					position === 'popper' && 'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
				)}
```

- Line 76: `SelectScrollDownButton`

```tsx

```

- Line 86: `SelectPrimitive.Label`

```tsx
ref={ref} className={cn('py-1.5 ps-8 pe-2 text-sm font-semibold', className)} {...props}
```

- Line 94: `SelectPrimitive.Item`

```tsx
ref={ref}
		className={cn(
			'relative flex w-full cursor-default select-none items-center rounded-[6px] py-1.5 ps-6 pe-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
			className,
		)}
		{...props}
```

- Line 102: `SelectPrimitive.ItemIndicator`

```tsx

```

- Line 107: `SelectPrimitive.ItemText`

```tsx

```

- Line 116: `SelectPrimitive.Separator`

```tsx
ref={ref} className={cn('-mx-1 my-1 h-px bg-muted', className)} {...props}
```

## src/components/ui/calendar.tsx

132 lines. Query keys:

Response/domain field candidates:

- Line 100: `Select`

```tsx
value={currentTz} onValueChange={(value) => onTimezoneChange(value as CalendarTimezone)}
```

- Line 101: `SelectTrigger`

```tsx
className='h-8 min-w-[84px] w-[84px] border-border bg-background px-2.5 text-xs font-normal shadow-none focus:ring-2 focus:ring-ring focus:ring-offset-1 [&>svg]:h-3.5 [&>svg]:w-3.5'
```

- Line 102: `SelectValue`

```tsx

```

- Line 104: `SelectContent`

```tsx
align='end' side='top' className='z-[70]'
```

- Line 105: `SelectItem`

```tsx
value='local' className='text-xs'
```

- Line 108: `SelectItem`

```tsx
value='utc' className='text-xs'
```

## src/components/ui/chart.tsx

282 lines. Query keys:

Response/domain field candidates: `item.dataKey`, `item.name`, `item.payload.fill`, `item.color`, `item?.value`, `item.value`, `item.payload`, `item.value.toLocaleString`

## src/components/ui/checkbox.tsx

26 lines. Query keys:

Response/domain field candidates:

- Line 11: `CheckboxPrimitive.Root`

```tsx
ref={ref}
		className={cn(
			'peer h-4 w-4 shrink-0 rounded-[6px] border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
			className,
		)}
		{...props}
```

- Line 18: `CheckboxPrimitive.Indicator`

```tsx
className={cn('flex items-center justify-center text-current')}
```

## src/components/ui/dialog.tsx

105 lines. Query keys:

Response/domain field candidates:

- Line 45: `DialogPortal`

```tsx

```

- Line 46: `DialogOverlay`

```tsx

```

- Line 47: `DialogPrimitive.Content`

```tsx
ref={ref}
				className={cn(
					'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-[10px]',
					className,
				)}
				{...props}
```

- Line 56: `DialogPrimitive.Close`

```tsx
className=' mb-3 absolute right-4 top-4 rounded-[10px] opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground'
```

- Line 81: `DialogPrimitive.Title`

```tsx
ref={ref} className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props}
```

- Line 89: `DialogPrimitive.Description`

```tsx
ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props}
```

## src/components/ui/command.tsx

111 lines. Query keys:

Response/domain field candidates:

- Line 22: `Dialog`

```tsx
{...props}
```

- Line 23: `DialogContent`

```tsx
className='overflow-hidden p-0'
```

- Line 38: `CommandPrimitive.Input`

```tsx
ref={ref}
			className={cn(
				'flex h-10 w-full rounded-[6px] bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
				className,
			)}
			{...props}
```

## src/components/ui/dropdown-menu.tsx

173 lines. Query keys:

Response/domain field candidates:

- Line 94: `DropdownMenuPrimitive.CheckboxItem`

```tsx
ref={ref}
		className={cn(
			'relative flex cursor-default select-none items-center rounded-[6px] py-1.5 ps-8 pe-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
			className,
		)}
		checked={checked}
		{...props}
```

## src/components/ui/multi-select.tsx

302 lines. Query keys:

Response/domain field candidates:

- Line 167: `Button`

```tsx
ref={ref}
						{...props}
						onClick={handleTogglePopover}
						className={cn(
							'flex w-full p-1 rounded-[6px] border min-h-10 h-auto items-center justify-between bg-inherit hover:bg-inherit [&_svg]:pointer-events-auto',
							className,
						)}
```

- Line 239: `CommandInput`

```tsx
placeholder={t('multiSelect.searchPlaceholder')} onKeyDown={handleInputKeyDown}
```

## src/components/ui/sortable.tsx

489 lines. Query keys:

Response/domain field candidates: `item.id`, `data.current?.sortable.index`

## src/components/ui/switch.tsx

36 lines. Query keys:

Response/domain field candidates:

- Line 10: `SwitchPrimitives.Root`

```tsx
ref={ref}
		className={cn(
			'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 border-2 border-transparent',
			'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
			'disabled:cursor-not-allowed disabled:opacity-50',
			// Track: primary when on; surface-track when off (light track in light, light track in dark — token-driven).
			'data-[state=checked]:bg-primary data-[state=unchecked]:bg-surface-track',
			className,
		)}
		{...props}
```

- Line 25: `SwitchPrimitives.Thumb`

```tsx
className={cn(
				'pointer-events-none block size-4 rounded-full bg-content-inverse shadow-lg ring-0 transition-transform duration-200',
				'data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-[1px]',
			)}
```

## src/components/molecules/Sidebar/SidebarItem.tsx

183 lines. Query keys:

Response/domain field candidates: `item.isOpen`, `item.items`, `item.items.length`, `item.icon`, `item.isActive`, `item.onToggle?.`, `item.url`, `item.title`, `item.disabled`, `item.items?.map`

- Line 106: `SidebarMenuButton`

```tsx
asChild
					disabled={item.disabled}
					tooltip={item.title}
					isActive={isMainItemActive}
					className={cn(
						'flex items-center gap-2 h-10 px-2 py-[10px] rounded-[6px] text-[14px] cursor-pointer font-normal transition-all duration-200 ease-in-out',
						isMainItemActive ? 'bg-surface-selected border border-line-zinc-strong shadow-sm font-medium' : 'font-thin',
						item.disabled && 'cursor-not-allowed opacity-50',
					)}
```

- Line 129: `SidebarMenuButton`

```tsx
asChild
						disabled={item.disabled}
						tooltip={item.title}
						isActive={isMainItemActive}
						className={cn(
							'flex items-center gap-2 h-10 px-2 py-[10px] rounded-[6px] text-[14px] cursor-pointer font-normal transition-all duration-200 ease-in-out',
							isMainItemActive ? 'bg-surface-selected border border-line-zinc-strong shadow-sm font-medium' : 'font-thin',
							item.disabled && 'cursor-not-allowed opacity-50',
						)}
```

- Line 157: `SidebarMenuSubButton`

```tsx
asChild
											isActive={subActive}
											className={cn('w-full font-light text-content-black transition-colors duration-200')}
```

## src/components/molecules/Sidebar/SidebarMenu.tsx

107 lines. Query keys:

Response/domain field candidates: `item.items`, `item.items.length`, `item.url`, `item.items?.some`, `item.title`, `item.isActive`

## src/components/atoms/Select/SearchableSelect.tsx

209 lines. Query keys:

Response/domain field candidates:

- Line 178: `CommandInput`

```tsx
placeholder={searchPlaceholder} value={searchQuery} onValueChange={setSearchQuery} className='h-9'
```

## src/components/atoms/Button/AddButton.tsx

24 lines. Query keys:

Response/domain field candidates:

- Line 17: `Button`

```tsx
prefixIcon={<Plus />} className={cn('gap-1', className)} {...props}
```

## src/components/atoms/SectionHeader/SectionHeader.tsx

70 lines. Query keys:

Response/domain field candidates:

- Line 58: `Button`

```tsx
onClick={onButtonClick}
```

## src/components/atoms/WalletAlertStatusBadge/WalletAlertStatusBadge.tsx

58 lines. Query keys:

Response/domain field candidates: `wallet.alerts.conditionAbove`, `wallet.alerts.conditionBelow`, `wallet.alerts.statusBadgeLabel`

## src/components/atoms/Select/Select.tsx

202 lines. Query keys:

Response/domain field candidates:

- Line 50: `SelectPrimitive.Item`

```tsx
ref={ref}
		className={cn(
			'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 ps-8 pe-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
			className,
		)}
		{...props}
```

- Line 59: `SelectPrimitive.ItemIndicator`

```tsx
className='flex items-center justify-center w-full h-full'
```

- Line 66: `SelectPrimitive.ItemText`

```tsx

```

- Line 105: `Select`

```tsx
defaultOpen={defaultOpen}
				onValueChange={(newValue) => {
					if (onChange) {
						onChange(newValue === value ? '' : newValue);
					}
				}}
				value={value ?? ''}
				disabled={disabled}
```

- Line 114: `SelectTrigger`

```tsx
id={triggerId}
					aria-label={label ? undefined : ariaLabel}
					className={cn(disabled && 'cursor-not-allowed', className)}
```

- Line 126: `SelectContent`

```tsx
className={cn('w-[var(--radix-select-trigger-width)]', contentClassName)}
```

- Line 127: `SelectGroup`

```tsx

```

- Line 132: `RadioSelectItem`

```tsx
className={cn(option.disabled && 'select-none cursor-not-allowed')}
											disabled={option.disabled}
											key={option.value}
											value={option.value}
```

- Line 149: `ShadcnSelect`

```tsx
className={cn(
												'w-full',
												'cursor-pointer',
												option.disabled && 'select-none cursor-not-allowed',
												'flex items-center space-x-2 justify-between w-full',
											)}
											disabled={option.disabled}
											key={option.value}
											value={option.value}
```

- Line 181: `ShadcnSelect`

```tsx
value='no-items' disabled
```

## src/components/atoms/Select/AsyncSearchableSelect.tsx

377 lines. Query keys: `['async-searchable-select', ...queryKeyPrefix, debouncedQuery],`

Response/domain field candidates: `item.value`, `item.data`, `item.label`, `item.description`, `item.disabled`, `item.prefixIcon`, `item.suffixIcon`

- Line 328: `CommandInput`

```tsx
placeholder={searchPlaceholder} value={searchQuery} onValueChange={setSearchQuery} className='h-9'
```

## src/components/atoms/Select/AsyncMultiSearchableSelect.tsx

377 lines. Query keys: `['async-multi-searchable-select', debouncedQuery, fetchOnEmptyQuery],`

Response/domain field candidates: `row.value`, `row.disabled`, `row.data`

- Line 214: `Button`

```tsx
type='button'
						variant='outline'
						disabled={disabled}
						className={cn(
							'flex w-full px-3 py-2 rounded-md border h-10 min-h-10 items-center justify-between bg-inherit hover:bg-inherit [&_svg]:pointer-events-auto',
							triggerClassName,
						)}
```

- Line 285: `CommandInput`

```tsx
placeholder={searchPlaceholder}
							value={searchQuery}
							onValueChange={setSearchQuery}
							onKeyDown={handleInputKeyDown}
							className='h-9'
```

## src/components/atoms/RadioGroup/RadioGroup.tsx

62 lines. Query keys:

Response/domain field candidates: `item.value`, `item.icon`, `item.label`, `item.description`

## src/components/atoms/Dialog/Dialog.tsx

85 lines. Query keys:

Response/domain field candidates:

- Line 65: `ShadcnDialog`

```tsx
open={isOpen} onOpenChange={onOpenChange} modal={false}
```

- Line 66: `DialogContent`

```tsx
className={cn('bg-surface rounded-[10px] max-h-[80vh] overflow-y-auto', className)}
				showCloseButton={showCloseButton}
				data-interactive={interactiveContent ? 'true' : undefined}
				onClick={interactiveContent ? (e: React.MouseEvent) => e.stopPropagation() : undefined}
				{...outsideDismissGuards}
```

- Line 72: `DialogHeader`

```tsx
className=''
```

- Line 73: `DialogTitle`

```tsx
className={cn('font-medium text-xl', titleClassName)}
```

- Line 76: `DialogDescription`

```tsx
className={cn('mt-6', descriptionClassName)}
```

## src/components/atoms/CheckboxRadioGroup/CheckboxRadioGroup.tsx

66 lines. Query keys:

Response/domain field candidates: `item.value`, `item.disabled`, `item.label`, `item.description`

## src/components/atoms/ActionButton/ActionButton.tsx

305 lines. Query keys:

Response/domain field candidates:

- Line 274: `Dialog`

```tsx
title={
					<span className='text-lg font-normal text-content-heading'>
						{t('actionButton.confirmActionOnEntityPrefix', { action: confirmArchiveVerb })}{' '}
						<span className='font-semibold text-content'>{entityName}</span>?
					</span>
				}
				titleClassName='w-[90%]'
				isOpen={isDialogOpen}
				onOpenChange={setIsDialogOpen}
				showCloseButton={false}
```

- Line 287: `Button`

```tsx
variant='outline' onClick={() => setIsDialogOpen(false)}
```

- Line 290: `Button`

```tsx
onClick={() => {
								setIsDialogOpen(false);
								deleteEntity(id);
							}}
```

## src/components/atoms/DatePicker/DatePicker.tsx

158 lines. Query keys:

Response/domain field candidates:

- Line 110: `Button`

```tsx
variant='outline'
							className={cn(
								'h-10 w-full min-w-0 justify-start text-start font-normal py-1',
								!date && 'text-muted-foreground',
								showClear && 'pe-9',
								triggerClassName,
							)}
							disabled={disabled}
							type='button'
```

## src/components/atoms/Modal/Modal.tsx

45 lines. Query keys:

Response/domain field candidates:

- Line 23: `Button`

```tsx
variant={'ghost'}
					className='absolute top-4 right-4 z-[60]'
					onClick={(e) => {
						e.stopPropagation();
						onOpenChange(false);
					}}
```

## src/components/atoms/DateTimePicker/DateTimePicker.tsx

178 lines. Query keys:

Response/domain field candidates:

- Line 157: `Select`

```tsx
value={timezone} onValueChange={(v) => handleTimezoneChange(v as CalendarTimezone)}
```

- Line 158: `SelectTrigger`

```tsx
className='h-8 w-[80px] text-xs border-input'
```

- Line 159: `SelectValue`

```tsx

```

- Line 161: `SelectContent`

```tsx
align='end'
```

- Line 162: `SelectItem`

```tsx
value='local' className='text-xs'
```

- Line 165: `SelectItem`

```tsx
value='utc' className='text-xs'
```

## src/components/atoms/DateRangePicker/DateRangePicker.tsx

171 lines. Query keys:

Response/domain field candidates:

- Line 129: `Button`

```tsx
variant='outline'
							className={cn(
								' justify-start text-start font-normal !h-10',
								!selectedRange?.from || !selectedRange?.to
									? 'text-muted-foreground opacity-70 hover:text-muted-foreground'
									: 'text-content-black',
								!className && 'w-[240px]',
								'transition-all duration-300 ease-in-out',
								className,
							)}
```

## src/components/atoms/CodePreview/CodePreview.tsx

70 lines. Query keys:

Response/domain field candidates:

- Line 25: `Button`

```tsx
onClick={() => {
							navigator.clipboard.writeText(code);
							toast.success(t('toast.copySuccess'));
						}}
						className='text-muted-foreground cursor-pointer size-10'
						variant={'ghost'}
						dir='ltr'
```

## src/components/atoms/Toggle/Toggle.tsx

36 lines. Query keys:

Response/domain field candidates:

- Line 21: `FormHeader`

```tsx
title={title} variant='form-component-title'
```

- Line 23: `Switch`

```tsx
id={switchId} checked={checked} onCheckedChange={onChange} disabled={disabled} className={className}
```

## src/components/atoms/MultiSelect/MultiSelect.tsx

356 lines. Query keys:

Response/domain field candidates:

- Line 196: `Button`

```tsx
ref={ref}
						{...props}
						onClick={handleTogglePopover}
						className={cn(
							'flex w-full px-3 py-2 rounded-md border h-10 items-center justify-between bg-inherit hover:bg-inherit [&_svg]:pointer-events-auto',
							triggerClassName,
							className,
						)}
```

- Line 286: `CommandInput`

```tsx
placeholder={t('search.placeholderShort')} onKeyDown={handleInputKeyDown}
```

## src/components/atoms/SelectFeature/SelectFeature.tsx

151 lines. Query keys: `['fetchFeatureById', value],`

Response/domain field candidates: `response.items.filter`, `feature.type`, `feature.id`, `feature.name`, `feature.description`

- Line 115: `AsyncSearchableSelect`

```tsx
search={{
					searchFn: searchFeatures,
					queryKeyPrefix: ['feature', featureTypes.slice().sort().join(','), (disabledFeatures ?? []).slice().sort().join(',')],
					debounceTime: 300,
					placeholder: t('features.searchPlaceholder'),
				}}
				extractors={extractors}
				display={{
					placeholder,
					label,
					description,
					error,
					className,
					side: popoverSide,
					align: popoverAlign,
				}}
				options={{
					noOptionsText: t('features.noFeaturesAddedYet'),
					emptyText: t('features.noneFound'),
					hideSelectedTick: true,
				}}
				value={currentValue}
				onChange={(feature) => {
					if (feature) {
						onChange(feature);
					}
					// If feature is undefined (deselected), we don't call onChange
					// to maintain backward compatibility with the original behavior
				}}
```

## src/components/atoms/FeatureMultiSelect/FeatureMultiSelect.tsx

148 lines. Query keys: `['fetchFeatures2'],`

Response/domain field candidates: `feature.id`, `feature.name`, `feature.type`

- Line 114: `MultiSelect`

```tsx
options={options}
				onValueChange={(selectedValues) => {
					setSelectedCount(selectedValues.length);
					// Filter out any disabled options from selectedValues
					const enabledSelectedValues = selectedValues.filter((value) => {
						const option = options.find((o) => o.value === value);
						return !option?.disabled;
					});
					const selectedFeatures = featuresData.items.filter((feature: Feature) => enabledSelectedValues.includes(feature.id));
					onChange(selectedFeatures);
				}}
				defaultValue={values}
				placeholder={selectedCount > 0 ? selectedSummary(selectedCount) : resolvedPlaceholder}
				maxCount={maxCount}
				className={cn('h-10', className)}
				triggerClassName='gap-2'
				customDisplay={(count) => {
					if (count === 0) return null;
					return (
						<div className='flex items-center justify-between w-full'>
							<span className='text-sm text-content font-normal'>{selectedSummary(count)}</span>
							<ChevronDown className='h-4 w-4 text-content-muted shrink-0' />
						</div>
					);
				}}
```

## src/components/atoms/Checkbox/Checkbox.tsx

51 lines. Query keys:

Response/domain field candidates:

- Line 11: `CheckboxPrimitive.Root`

```tsx
ref={ref}
		className={cn(
			'peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
			className,
		)}
		{...props}
```

- Line 18: `CheckboxPrimitive.Indicator`

```tsx
className={cn('flex items-center justify-center text-current')}
```

- Line 37: `ShadcnCheckbox`

```tsx
checked={checked} onCheckedChange={onCheckedChange} id={id} disabled={disabled}
```

## src/components/atoms/ShortPagination/ShortPaginationControls.tsx

80 lines. Query keys:

Response/domain field candidates:

- Line 53: `Button`

```tsx
type='button'
					variant='outline'
					size='icon'
					aria-label={t('pagination.previous')}
					onClick={() => handlePageChange(clampedPage - 1)}
					disabled={clampedPage === 1}
					className={cn('size-8', clampedPage === 1 && 'cursor-not-allowed text-content-disabled')}
```

- Line 66: `Button`

```tsx
type='button'
					variant='outline'
					size='icon'
					aria-label={t('pagination.next')}
					onClick={() => handlePageChange(clampedPage + 1)}
					disabled={clampedPage === totalPages}
					className={cn('size-8', clampedPage === totalPages && 'cursor-not-allowed text-content-disabled')}
```

## src/components/atoms/Combobox/Combobox.tsx

128 lines. Query keys:

Response/domain field candidates:

- Line 86: `Button`

```tsx
variant='outline'
					size='sm'
					role='combobox'
					aria-expanded={open}
					disabled={disabled}
					className={cn('justify-between', typeof width === 'number' ? `w-[${width}px]` : `w-[${width}]`, triggerClassName)}
```

- Line 103: `CommandInput`

```tsx
placeholder={searchPh} value={searchQuery} onValueChange={setSearchQuery}
```

## src/components/atoms/PaymentUrlSuccessDialog/PaymentUrlSuccessDialog.tsx

68 lines. Query keys:

Response/domain field candidates:

- Line 26: `Dialog`

```tsx
isOpen={isOpen}
			onOpenChange={onClose}
			title={t('paymentLink.dialogTitle')}
			titleClassName='text-lg font-semibold text-content-zinc-bold'
			className='sm:max-w-[500px]'
			showCloseButton={false}
```

- Line 45: `Button`

```tsx
onClick={onGoToLink} className='flex-1' prefixIcon={<ExternalLink className='w-4 h-4' />}
```

- Line 48: `Button`

```tsx
variant='outline'
						onClick={onCopyUrl}
						className='flex-1'
						prefixIcon={isCopied ? <CheckCircle className='w-4 h-4' /> : <Copy className='w-4 h-4' />}
```

- Line 58: `Button`

```tsx
variant='outline' onClick={onClose}
```

## src/components/atoms/DecimalUsageInput/DecimalUsageInput.tsx

103 lines. Query keys:

Response/domain field candidates:

- Line 84: `Input`

```tsx
id={id}
			className={className}
			aria-label={ariaLabel}
			label={label}
			value={value}
			onChange={handleChange}
			placeholder={placeholder}
			disabled={disabled}
			error={error}
			description={description}
			suffix={suffix}
			inputPrefix={inputPrefix}
			variant='formatted-number'
```

## src/components/atoms/ErrorBoundary/ErrorBoundary.tsx

327 lines. Query keys:

Response/domain field candidates:

- Line 129: `Button`

```tsx
onClick={handleRefresh} className='flex-1 w-full' size='lg'
```

- Line 136: `Button`

```tsx
variant='outline' className='w-full' size='lg'
```

- Line 142: `Button`

```tsx
variant='outline'
								onClick={() => window.history.back()}
								className='flex-1'
								size='lg'
								aria-label={t('errorPage.goBackAria')}
```

## src/components/atoms/CopyIdButton/CopyIdButton.tsx

44 lines. Query keys:

Response/domain field candidates:

- Line 33: `Button`

```tsx
variant='ghost'
			size='icon'
			onClick={handleCopy}
			className={cn('h-6 w-6 p-0 hover:bg-surface-shell', className)}
			title={t('copyId.titleWithType', { type: entityType ?? t('copyId.defaultEntityType') })}
			{...buttonProps}
```

## src/components/molecules/ApiDocs/fetch_api_docs.ts

112 lines. Query keys:

Response/domain field candidates: `response.json`, `response.body`, `response.Content.ReadAsStringAsync`

## src/components/molecules/ApiDocs/ApiDocs.tsx

74 lines. Query keys: `['openapi-json'],`

Response/domain field candidates:

- Line 16: `DocsDrawer`

```tsx
isOpen={isDocsOpen}
			onOpenChange={setIsDocsOpen}
			snippets={snippets}
			trigger={
				<Button variant='outline' className='outline-none text-sm flex items-center gap-2' size='sm'>
					<Code2 className='w-4 h-4' />
					Api
				</Button>
			}
```

- Line 21: `Button`

```tsx
variant='outline' className='outline-none text-sm flex items-center gap-2' size='sm'
```

## src/components/molecules/LocaleSelector/LocaleSelector.tsx

39 lines. Query keys:

Response/domain field candidates:

- Line 22: `Select`

```tsx
value={locale} onValueChange={(v) => setLocale(v as Locale)}
```

- Line 23: `SelectTrigger`

```tsx
className='h-auto w-auto gap-1.5 border-none bg-transparent px-0 py-0 shadow-none text-sm text-content-muted hover:text-content-secondary'
```

- Line 25: `SelectValue`

```tsx

```

- Line 27: `SelectContent`

```tsx

```

- Line 29: `SelectItem`

```tsx
key={l} value={l}
```

## src/components/molecules/BreadCrumbs/BreadCrumbs.tsx

111 lines. Query keys:

Response/domain field candidates:

- Line 24: `Button`

```tsx
type='button'
			onClick={handleClick}
			variant='outline'
			size='sm'
			className='flex w-auto min-w-0 sm:min-w-[180px] md:min-w-[220px] items-center border-line bg-surface hover:bg-surface-subtle hover:border-line !ps-2 sm:!ps-3 !pe-1 [&>div]:w-full [&>div]:min-w-0 [&>div]:gap-2'
			aria-label={t('commandPalette.searchAriaLabel')}
```

- Line 100: `LocaleSelector`

```tsx

```

## src/components/molecules/ContactUsDialog/ContactUsDialog.tsx

77 lines. Query keys:

Response/domain field candidates:

- Line 27: `Dialog`

```tsx
isOpen={isOpen} onOpenChange={onOpenChange} title={dialogTitle} className='max-w-[550px]' description={dialogDescription}
```

## src/components/molecules/RestrictedEnvBanner/RestrictedEnvBanner.tsx

154 lines. Query keys:

Response/domain field candidates:

- Line 117: `ContactUsDialog`

```tsx
isOpen={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}
```

- Line 145: `ContactUsDialog`

```tsx
isOpen={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}
```

## src/components/molecules/Table/Table.tsx

331 lines. Query keys:

Response/domain field candidates: `data.length`, `data.map`

- Line 206: `TableHeader`

```tsx
className={cn(
				variant === 'default' ? 'h-8 bg-muted border-b border-line-slate rounded-t-[6px]' : 'h-8',
				variant === 'no-bordered' && 'bg-transparent',
			)}
```

- Line 211: `TableRow`

```tsx
className={cn(
					variant === 'default' ? 'rounded-t-[6px] border-b border-line-slate' : '',
					variant === 'no-bordered' && 'border-b-0',
				)}
```

- Line 218: `TableHead`

```tsx
variant={variant}
							key={index}
							style={{ flex: width ? undefined : flex }}
							width={width}
							align={align}
							className={cn(
								color ? `text-[${color}] !text-content-black` : 'text-content-black',
								'font-sans font-medium px-3',
								variant === 'default' && index === 0 ? 'rounded-ss-[6px]' : '',
								variant === 'default' && index === columns.length - 1 ? 'rounded-se-[6px]' : '',
								variant === 'no-bordered' && 'border-b-0',
								className,
							)}
```

- Line 244: `TableRow`

```tsx
onClick={(e) => handleRowClick(row, e)}
				className={cn(
					'transition-colors hover:bg-muted/50',
					variant === 'default' && !lastRow && 'border-b border-line-slate',
					onRowClick && 'cursor-pointer hover:bg-muted/50',
					lastRow && hideBottomBorder && 'border-b-0',
					'!py-1',
				)}
				key={rowIndex}
```

- Line 258: `TableCell`

```tsx
onClick={(e) => handleCellClick(e, row, onCLick)}
							key={colIndex}
							data-interactive={fieldVariant === 'interactive'}
							className={cn(
								textColor ? `text-[${textColor}]` : 'text-content-secondary',
								variant === 'default' ? 'font-normal' : 'font-light',
								'!max-h-8 px-3 py-3 text-[14px]',
								onCLick && 'cursor-pointer hover:bg-muted/50',
								fieldVariant === 'title' ? 'font-regular text-foreground' : '!font-light text-content-secondary',
								fieldVariant === 'link' && 'cursor-pointer text-primary dark:text-info hover:underline',
								fieldVariant === 'icon' && 'w-10',
								fieldVariant === 'interactive' && 'cursor-default',
							)}
							style={{ flex: width ? undefined : flex }}
							width={width}
							align={align}
```

- Line 287: `TableRow`

```tsx
className={cn(hideBottomBorder && 'border-b-0', variant === 'no-bordered' && 'border-b-0')}
```

- Line 291: `TableCell`

```tsx
key={colIndex}
							className={cn(
								textColor ? `text-[${textColor}]` : 'text-content-zinc w-full ',
								'font-normal',
								'!max-h-8 px-4 py-2 text-[14px]',
								lastRow ? 'text-center' : '',
							)}
							style={{ flex: width ? undefined : flex }}
							width={width}
							align={align}
```

- Line 318: `Table`

```tsx
className={tableClassName}
```

- Line 320: `TableBody`

```tsx

```

## src/components/molecules/Table/Toolbar.tsx

106 lines. Query keys:

Response/domain field candidates:

- Line 63: `Button`

```tsx
variant='outline' size='xs' className='text-content-secondary hover:bg-surface-subtle border-line-strong'
```

- Line 71: `Button`

```tsx
size='xs'
										key={sort.key}
										variant={filters.sortBy === sort.key ? 'secondary' : 'ghost'}
										className='w-full justify-start text-content-secondary
                                            hover:bg-surface-shell
                                            data-[state=open]:bg-surface-shell'
										onClick={() => handleSortChange(sort.key)}
```

- Line 92: `Input`

```tsx
suffix={<Search className='size-[14px] text-content-muted' />}
						placeholder={resolvedPlaceholder}
						value={filters.searchQuery}
						onChange={(e) => onFilterChange({ searchQuery: e })}
						size='xs'
```

## src/components/molecules/CustomerUsageChart.tsx

536 lines. Query keys:

Response/domain field candidates: `item.source`, `item.feature_id`, `item.name`, `item.event_name`, `item.points?.forEach`, `data.items`, `item.date`

## src/components/molecules/CustomerCostChart.tsx

97 lines. Query keys:

Response/domain field candidates: `data.total_cost`, `data.currency`, `data.total_quantity`, `data.total_events?.toLocaleString`, `data.start_time`, `data.end_time`, `data.cost_analytics`, `data.cost_analytics.length`, `data.cost_analytics.slice`, `item.meter_name`, `item.meter?.name`, `item.meter_id`, `item.total_cost`, `item.currency`

## src/components/molecules/EventsMonitoringChart.tsx

233 lines. Query keys:

Response/domain field candidates: `response.points`, `response.points.length`

- Line 218: `Button`

```tsx
onClick={onViewLatestData} className='mt-4'
```

## src/components/molecules/CostDataTable.tsx

53 lines. Query keys:

Response/domain field candidates: `row.meter_name`, `row.meter?.name`, `row.meter_id`, `row.total_quantity`, `row.total_cost`, `row.currency`, `item.meter_name`, `item.source`, `item.customer_id`, `item.external_customer_id`, `item.price_id`, `item.meter_id`

- Line 49: `FlexpriceTable`

```tsx
columns={columns} data={tableData} showEmptyRow
```

## src/components/molecules/Dashboard/DashboardControls.tsx

73 lines. Query keys:

Response/domain field candidates:

- Line 51: `Select`

```tsx
value={timePeriod}
						options={timePeriodOptions}
						onChange={(value) => onTimePeriodChange(value as TIME_PERIOD)}
						className='min-w-[150px]'
```

- Line 60: `Select`

```tsx
value={windowSize}
						options={windowSizeOptions}
						onChange={(value) => onWindowSizeChange(value as WindowSize)}
						className='min-w-[150px]'
```

## src/components/molecules/Dashboard/RecentSubscriptionsCard.tsx

141 lines. Query keys:

Response/domain field candidates: `item.plan_name`, `item.count`, `item.plan_id`

## src/components/molecules/Dashboard/RevenueTrendCard.tsx

165 lines. Query keys:

Response/domain field candidates: `item.currency`

- Line 98: `Select`

```tsx
value={selectedCurrency}
								options={currencySelectOptions}
								onChange={setSelectedCurrency}
								placeholder={t('dashboardHome.revenueSelectCurrencyPlaceholder')}
								disabled={isLoading}
```

## src/components/molecules/Customer/CreateCustomerDrawer.tsx

369 lines. Query keys:

Response/domain field candidates: `data.address_country`, `data.address_state`, `data?.id`, `data.id`

- Line 247: `Input`

```tsx
label={t('form.drawer.nameLabel')}
								placeholder={t('form.drawer.namePlaceholder')}
								value={formData.name || ''}
								onChange={(e) => handleChange('name', e)}
								error={errors.name}
```

- Line 254: `Input`

```tsx
label={t('form.drawer.externalIdLabel')}
								placeholder={t('form.drawer.externalIdPlaceholder')}
								value={formData.external_id || ''}
								onChange={(e) => handleChange('external_id', e)}
								error={errors.external_id}
								disabled={isEdit}
```

- Line 262: `Input`

```tsx
label={t('form.drawer.emailOptionalLabel')}
								placeholder={t('form.drawer.emailPlaceholder')}
								type='email'
								value={formData.email || ''}
								onChange={(e) => handleChange('email', e)}
								error={errors.email}
```

- Line 274: `Button`

```tsx
variant='outline' onClick={() => updateUIState({ showBillingDetails: true })}
```

- Line 285: `Select`

```tsx
label={t('form.billingFields.country')}
									placeholder={t('form.billingFields.selectCountry')}
									options={countriesOptions}
									value={formData.address_country}
									noOptionsText={t('form.billingFields.noCountries')}
									onChange={(e) => {
										setFormData((prev) => ({
											...prev,
											address_country: e,
											address_city: '',
											address_state: '',
											address_postal_code: '',
										}));
										updateUIState({ activeState: undefined });
									}}
```

- Line 302: `Input`

```tsx
label={t('form.billingFields.addressLine1')}
									placeholder={t('form.billingFields.addressLine1Placeholder')}
									value={formData.address_line1 || ''}
									onChange={(e) => handleChange('address_line1', e)}
									error={errors.address_line1}
									maxLength={255}
```

- Line 310: `Input`

```tsx
label={t('form.billingFields.addressLine2')}
									placeholder={t('form.billingFields.addressLine2Placeholder')}
									value={formData.address_line2 || ''}
									onChange={(e) => handleChange('address_line2', e)}
									error={errors.address_line2}
									maxLength={255}
```

- Line 320: `Select`

```tsx
label={t('form.billingFields.state')}
										placeholder={t('form.billingFields.selectState')}
										options={statesOptions}
										value={formData.address_state}
										onChange={(e) => {
											setFormData({
												...formData,
												address_city: '',
												address_state: e,
											});
											const selectedState = e ? State.getStateByCodeAndCountry(e, formData.address_country || '') : undefined;
											updateUIState({ activeState: selectedState || undefined });
										}}
										noOptionsText={t('form.billingFields.noStates')}
```

- Line 336: `Select`

```tsx
label={t('form.billingFields.city')}
										options={citiesOptions}
										value={formData.address_city || undefined}
										placeholder={t('form.billingFields.selectCity')}
										noOptionsText={t('form.billingFields.noCities')}
										onChange={(e) => handleChange('address_city', e)}
```

- Line 346: `Input`

```tsx
label={t('form.billingFields.postalCode')}
									placeholder={t('form.billingFields.postalCodePlaceholder')}
									value={formData.address_postal_code || ''}
									onChange={(e) => handleChange('address_postal_code', e)}
									error={errors.address_postal_code}
									maxLength={20}
```

- Line 359: `Button`

```tsx
isLoading={isPending} disabled={isPending || isCtaDisabled} onClick={handleSubmit}
```

## src/components/molecules/Customer/CustomerCard.tsx

97 lines. Query keys: `['fetchCustomerCard', customerId],`

Response/domain field candidates: `customer?.name`, `customer?.email`, `customer?.external_id`

- Line 67: `FormHeader`

```tsx
title={t('overview.cardTitle')} variant='sub-header'
```

## src/components/molecules/Customer/CustomerTable.tsx

93 lines. Query keys:

Response/domain field candidates: `customer.external_id`, `customer.id`, `customer.status`, `data?.map`, `row.status`, `row.updated_at`, `row?.id`

- Line 20: `ActionButton`

```tsx
id={customer.id}
			copyId={{ entityType: 'Customer' }}
			deleteMutationFn={(id) => CustomerApi.deleteCustomerById(id)}
			refetchQueryKey='fetchCustomers'
			entityName={t('list.entityName')}
			edit={{
				enabled: customer.status === ENTITY_STATUS.PUBLISHED,
				path: `/billing/customers/edit-customer?id=${customer.id}`,
				onClick: () => onEdit(customer),
			}}
			archive={{
				enabled: customer.status === ENTITY_STATUS.PUBLISHED,
			}}
			customActions={[
				{
					text: t('list.openPortal'),
					icon: <ExternalLink className='h-4 w-4' />,
					onClick: openInNewTab,
				},
			]}
```

- Line 76: `ActionButtonWithPortal`

```tsx
customer={row} onEdit={onEdit}
```

- Line 81: `FlexpriceTable`

```tsx
showEmptyRow
			columns={columns}
			data={mappedData}
			onRowClick={(row) => {
				navigate(RouteNames.customers + `/${row?.id}`);
			}}
```

## src/components/molecules/Customer/CustomerSearchSelect.tsx

121 lines. Query keys:

Response/domain field candidates: `response.items.filter`, `customer.id`, `customer.name`

- Line 105: `AsyncSearchableSelect`

```tsx
{...props}
			search={{
				searchFn,
				queryKeyPrefix: ['customer', limit, excludeIdsForKey.slice().sort().join(','), selfCustomer?.id, includeNoneOption, i18n.language],
				placeholder: resolvedPlaceholder,
			}}
			extractors={{
				valueExtractor: (customer) => customer.id,
				labelExtractor: (customer) => (selfCustomer && customer.id === selfCustomer.id ? selfLabel : customer.name),
			}}
```

## src/components/molecules/Customer/CustomerMultiSearchSelect.tsx

60 lines. Query keys:

Response/domain field candidates: `response.items.filter`, `customer.id`, `customer.name`

- Line 44: `AsyncMultiSearchableSelect`

```tsx
{...props}
			search={{
				searchFn,
				placeholder: resolvedPlaceholder,
				fetchOnEmptyQuery,
			}}
			extractors={{
				valueExtractor: (c) => c.id,
				labelExtractor: (c) => c.name,
			}}
```

## src/components/molecules/Customer/InheritedCustomersTable.tsx

138 lines. Query keys:

Response/domain field candidates: `data.map`, `data.filter`, `row.name`, `row.external_id`, `row.id`

- Line 89: `Dialog`

```tsx
isOpen={dialogOpen}
				onOpenChange={setDialogOpen}
				title={t('inheritanceTable.addDialogTitle')}
				className='max-w-2xl sm:max-w-[42rem] w-[calc(100vw-2rem)]'
				descriptionClassName='mt-3'
```

- Line 96: `CustomerMultiSearchSelect`

```tsx
value={selectedCustomers}
						onChange={setSelectedCustomers}
						excludeId={excludeIds}
						limit={50}
						searchPlaceholder={t('select.searchByName')}
						display={{
							label: t('select.customersLabel'),
							placeholder: t('select.selectCustomers'),
							className: 'min-w-0',
							triggerClassName: 'min-h-11',
						}}
						options={{ modalPopover: true }}
						disabled={disabled}
```

- Line 112: `Button`

```tsx
type='button' variant='outline' onClick={() => setDialogOpen(false)}
```

- Line 115: `Button`

```tsx
type='button' onClick={handleAdd} disabled={disabled || selectedCustomers.length === 0}
```

- Line 126: `FormHeader`

```tsx
className='mb-0' title={t('inheritanceTable.sectionTitle')} variant='sub-header'
```

- Line 127: `AddButton`

```tsx
onClick={() => setDialogOpen(true)} disabled={disabled}
```

- Line 130: `FlexpriceTable`

```tsx
data={data} columns={columns} showEmptyRow
```

## src/components/molecules/Customer/CustomerHeader.tsx

62 lines. Query keys: `['fetchCustomerDetails', customerId],`

Response/domain field candidates: `customer?.name`, `customer?.id`, `customer.id`

- Line 53: `CopyIdButton`

```tsx
id={customer.id} entityType={t('list.entityName')}
```

## src/components/molecules/CustomerUsageTable/CustomerUsageTable.tsx

214 lines. Query keys:

Response/domain field candidates: `feature.type`, `row?.feature?.id`, `row?.feature?.type`, `row?.feature?.name`, `row?.sources`, `row?.current_usage`, `row?.is_unlimited`, `row?.total_limit`, `row.total_limit`

- Line 205: `FlexpriceTable`

```tsx
showEmptyRow data={data} columns={columnData} variant='no-bordered'
```

## src/components/molecules/SubscriptionCancelDialog/SubscriptionCancelDialog.tsx

201 lines. Query keys:

Response/domain field candidates:

- Line 89: `FormHeader`

```tsx
title={t('subscriptions.cancelSubscription')}
					variant='sub-header'
					subtitle={t('subscriptions.cancelDialog.subtitle')}
					titleClassName='!mb-1'
					subtitleClassName='!text-sm !max-w-[440px] !leading-6'
```

- Line 100: `Select`

```tsx
label={t('subscriptions.cancellationType')}
							value={cancellationType}
							options={[
								{
									label: t('subscriptions.cancelDialog.immediateLabel'),
									value: SUBSCRIPTION_CANCELLATION_TYPE.IMMEDIATE,
									description: t('subscriptions.cancelDialog.immediateDescription'),
								},
								{
									label: t('subscriptions.cancelDialog.endOfPeriodLabel'),
									value: SUBSCRIPTION_CANCELLATION_TYPE.END_OF_PERIOD,
									description: t('subscriptions.cancelDialog.endOfPeriodDescription'),
								},
								{
									label: t('subscriptions.cancelDialog.scheduledDateLabel'),
									value: SUBSCRIPTION_CANCELLATION_TYPE.SCHEDULED_DATE,
									description: t('subscriptions.cancelDialog.scheduledDateDescription'),
								},
							]}
							onChange={(value) => {
								const next = value as SUBSCRIPTION_CANCELLATION_TYPE;
								setCancellationType(next);
								if (next !== SUBSCRIPTION_CANCELLATION_TYPE.SCHEDULED_DATE) {
									setCancelAtDate(undefined);
								}
							}}
```

- Line 128: `Select`

```tsx
label={t('subscriptions.prorationBehavior')}
							value={prorationBehavior}
							options={[
								{
									label: t('subscriptions.cancelDialog.prorationNoneLabel'),
									value: SUBSCRIPTION_PRORATION_BEHAVIOR.NONE,
									description: t('subscriptions.cancelDialog.prorationNoneDescription'),
								},
								{
									label: t('subscriptions.cancelDialog.prorationCreateLabel'),
									value: SUBSCRIPTION_PRORATION_BEHAVIOR.CREATE_PRORATIONS,
									description: t('subscriptions.cancelDialog.prorationCreateDescription'),
								},
							]}
							onChange={(value) => setProrationBehavior(value as SUBSCRIPTION_PRORATION_BEHAVIOR)}
```

- Line 175: `Input`

```tsx
label={t('subscriptions.reasonOptional')}
						value={reason}
						onChange={setReason}
						description={t('subscriptions.reasonHint')}
						placeholder={t('subscriptions.internalNote')}
```

- Line 185: `Button`

```tsx
variant='outline' onClick={() => onOpenChange(false)} disabled={isPending}
```

- Line 188: `Button`

```tsx
variant='destructive'
						onClick={() => cancelSubscription()}
						disabled={isPending || !subscriptionId || scheduledCancelInvalid}
```

## src/components/molecules/SubscriptionTable/SubscriptionTable.tsx

135 lines. Query keys:

Response/domain field candidates: `row.customer_id`, `row.customer?.name`, `row.plan_id`, `row.plan?.name`, `row.subscription_status`, `row.start_date`, `row.current_period_end`, `row.id`, `row.current_period_start`, `row?.customer_id`, `row?.id`

- Line 80: `ActionButton`

```tsx
id={row.id}
							copyId={{ entityType: 'Subscription' }}
							deleteMutationFn={async () => Promise.resolve()}
							refetchQueryKey='fetchSubscriptions'
							entityName={t('subscriptions.listPage.entityNameForActions')}
							edit={{
								path: `${RouteNames.subscriptions}/${row.id}/edit`,
								onClick: () => onEdit?.(row),
							}}
							archive={{
								enabled: false,
							}}
							customActions={[
								{
									text: t('subscriptions.listPage.cancelAction'),
									icon: <Trash2 />,
									enabled: row.subscription_status !== SUBSCRIPTION_STATUS.CANCELLED,
									onClick: () => setCancelSubscription({ id: row.id, currentPeriodStart: row.current_period_start }),
								},
							]}
```

- Line 111: `FlexpriceTable`

```tsx
showEmptyRow
				columns={columns}
				data={data}
				onRowClick={(row) => {
					navigate(`${RouteNames.customers}/${row?.customer_id}/subscription/${row?.id}`);
				}}
```

- Line 119: `SubscriptionCancelDialog`

```tsx
isOpen={!!cancelSubscription}
				onOpenChange={(open) => {
					if (!open) {
						setCancelSubscription(null);
					}
				}}
				subscriptionId={cancelSubscription?.id}
				currentPeriodStart={cancelSubscription?.currentPeriodStart}
				refetchQueryKeys={['fetchSubscriptions']}
```

## src/components/molecules/TaxAssociationDialog/TaxAssociationDialog.tsx

211 lines. Query keys: `['fetchPublishedTaxRates'],`

Response/domain field candidates: `data?.tax_rate_code`, `data?.priority`, `data?.currency`, `data?.auto_apply`

- Line 145: `Dialog`

```tsx
isOpen={open} onOpenChange={onOpenChange} title={t('taxAssociation.dialogTitle')} className='sm:max-w-[500px]'
```

- Line 149: `Select`

```tsx
label={t('taxAssociation.labelTaxRate')}
							value={formData.tax_rate_code}
							onChange={(value: string) => handleFieldChange('tax_rate_code', value)}
							options={taxRateOptions}
							placeholder={t('taxAssociation.placeholderTaxRate')}
							disabled={isLoadingTaxRates}
							noOptionsText={t('taxAssociation.noTaxRatesFound')}
							error={errors.tax_rate_code}
```

- Line 163: `Input`

```tsx
label={t('taxAssociation.labelPriority')}
							id='priority'
							type='number'
							min='1'
							value={formData.priority.toString()}
							onChange={(value) => handleFieldChange('priority', parseInt(value) || 1)}
							placeholder={t('taxAssociation.placeholderPriority')}
							error={errors.priority}
```

- Line 177: `Select`

```tsx
label={t('taxAssociation.labelCurrency')}
							value={formData.currency}
							onChange={(value: string) => handleFieldChange('currency', value)}
							options={currencyOptions}
							placeholder={t('taxAssociation.placeholderCurrency')}
							error={errors.currency}
```

- Line 198: `Button`

```tsx
type='button' variant='outline' onClick={handleCancel}
```

- Line 201: `Button`

```tsx
type='submit' disabled={!formData.tax_rate_code || isLoadingTaxRates}
```

## src/components/molecules/SubscriptionTaxAssociationTable/SubscriptionTaxAssociationTable.tsx

132 lines. Query keys:

Response/domain field candidates: `data.map`, `data.filter`, `row.tax_rate_code`, `row.priority`, `row.auto_apply`, `row.currency`

- Line 72: `ActionButton`

```tsx
id={row.tax_rate_code}
					copyId={{ entityType: 'Tax Rate' }}
					deleteMutationFn={() => handleDelete(row.tax_rate_code)}
					refetchQueryKey='subscription_tax_overrides'
					entityName={`Tax Override ${row.tax_rate_code}`}
					edit={{
						enabled: !disabled,
						onClick: () => handleEdit(row),
					}}
					archive={{
						enabled: !disabled,
						text: t('actions.delete'),
					}}
```

- Line 93: `TaxAssociationDialog`

```tsx
open={isOpen}
				onOpenChange={setIsOpen}
				entityType={TAXRATE_ENTITY_TYPE.SUBSCRIPTION}
				entityId='temp'
				onSave={handleSave}
				data={{
					tax_rate_code: selectedTaxOverride?.tax_rate_code || '',
					entity_type: TAXRATE_ENTITY_TYPE.SUBSCRIPTION,
					entity_id: 'temp',
					priority: selectedTaxOverride?.priority || 1,
					currency: selectedTaxOverride?.currency || 'usd',
					auto_apply: selectedTaxOverride?.auto_apply || true,
				}}
				onCancel={() => {
					setIsOpen(false);
					setSelectedTaxOverride(null);
				}}
```

- Line 114: `FormHeader`

```tsx
className='mb-0' title={t('labels.taxes')} variant='sub-header'
```

- Line 115: `AddButton`

```tsx
onClick={() => {
							setSelectedTaxOverride(null);
							setIsOpen(true);
						}}
						disabled={disabled}
```

- Line 124: `FlexpriceTable`

```tsx
data={data} columns={columns} showEmptyRow
```

## src/components/molecules/SubscriptionCoupon/SubscriptionCoupon.tsx

154 lines. Query keys: `['availableCoupons'],`

Response/domain field candidates: `response.items`

- Line 99: `FormHeader`

```tsx
className='mb-0' title={t('subscriptions.subscriptionCoupon')} variant='sub-header'
```

- Line 101: `AddButton`

```tsx
label={t('subscriptions.addCoupon')}
						onClick={() => {
							setEditingCouponId(null);
							setIsOpen(true);
						}}
						disabled={disabled}
```

## src/components/molecules/SubscriptionDiscountTable/SubscriptionDiscountTable.tsx

185 lines. Query keys: `['coupons'],`

Response/domain field candidates: `data?.items`, `row?.name`, `row?.type`, `row.currency?.trim`, `row.currency`, `row.amount_off`, `row.percentage_off`, `row.type`, `row.currency.toUpperCase`, `row.id`

- Line 141: `ActionButton`

```tsx
id={row.id}
					copyId={{ entityType: 'Discount' }}
					deleteMutationFn={handleDelete}
					refetchQueryKey='subscription_discount'
					entityName={`Discount ${formatCouponName(row)}`}
					edit={{
						enabled: !disabled,
						onClick: handleEdit,
					}}
					archive={{
						enabled: !disabled,
						text: 'Remove',
					}}
```

- Line 173: `FormHeader`

```tsx
className='mb-0' title={t('subscriptions.discounts')} variant='sub-header'
```

- Line 174: `AddButton`

```tsx
onClick={() => setIsModalOpen(true)} disabled={disabled} label={t('common:actions.add')}
```

- Line 177: `FlexpriceTable`

```tsx
data={tableData} columns={columns} showEmptyRow
```

## src/components/molecules/Events/JsonCodeBlock.tsx

60 lines. Query keys:

Response/domain field candidates:

- Line 35: `Button`

```tsx
onClick={handleCopy} variant='ghost' size='sm' className={cn('h-7 transition-colors', copied && 'text-success-bright')}
```

## src/components/molecules/SubscriptionEntitlementsSection/SubscriptionEntitlementsSection.tsx

567 lines. Query keys: `['subscriptionEntitlements', subscriptionId] });`, `['subscriptionRawEntitlements', subscriptionId] });`, `['subscriptionEntitlements', subscriptionId],`, `['subscriptionRawEntitlements', subscriptionId],`, `['planEntitlements', planId],`

Response/domain field candidates: `row.isOverrideOfParent`, `row.hasSubscriptionOverride`, `row.sources`, `row.feature_type`, `row.entitlement`, `row.originalUsageLimit`, `row.originalStaticValue`, `row.originalIsEnabled`, `row.feature?.name`, `row.subscriptionEntitlementId`, `row.feature_id`, `feature?.name`

- Line 504: `Button`

```tsx
prefixIcon={<Plus />} onClick={() => setAddDrawerOpen(true)} disabled={readOnly || !canWriteEntitlement}
```

- Line 509: `FlexpriceTable`

```tsx
showEmptyRow data={entitlements} columns={columns} variant='no-bordered'
```

- Line 516: `Button`

```tsx
prefixIcon={<Plus />} onClick={() => setAddDrawerOpen(true)} disabled={readOnly || !canWriteEntitlement}
```

- Line 523: `AddEntitlementDrawer`

```tsx
isOpen={addDrawerOpen}
				onOpenChange={handleAddDrawerClose}
				entityType={ENTITLEMENT_ENTITY_TYPE.SUBSCRIPTION}
				entityId={subscriptionId}
				entitlements={entitlements as never}
```

- Line 531: `EditSubscriptionEntitlementDrawer`

```tsx
isOpen={editDrawerOpen}
				onOpenChange={setEditDrawerOpen}
				subscriptionId={subscriptionId}
				entitlement={selectedEntitlement}
				onSuccess={invalidateEntitlements}
				onReset={handleResetOverride}
```

- Line 540: `Dialog`

```tsx
title={deleteDialogTitle}
				description={deleteDialogDescription}
				titleClassName='text-lg font-normal text-content-heading'
				isOpen={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
				showCloseButton={false}
```

- Line 549: `Button`

```tsx
variant='outline' onClick={cancelDelete} disabled={isDeletingEntitlement}
```

- Line 552: `Button`

```tsx
variant='destructive' onClick={confirmDelete} disabled={isDeletingEntitlement}
```

## src/components/organisms/PlanForm/SelectGroup.tsx

112 lines. Query keys: `['fetchGroups', { entity_type: entityType }],`

Response/domain field candidates:

- Line 95: `SearchableSelect`

```tsx
error={error}
				value={value || ''}
				onChange={handleGroupChange}
				options={groupOptions}
				placeholder={placeholder}
				label={label}
				description={description}
				searchPlaceholder='Search groups...'
				emptyText='No groups found'
				noOptionsText='No groups available'
```

## src/components/organisms/EntityChargesPage/SubscriptionCalculator.tsx

156 lines. Query keys:

Response/domain field candidates:

- Line 95: `Input`

```tsx
label={t('entityChargesPage.subscriptionCalculator.contractAmount')}
					placeholder='0'
					value={amountStr}
					onChange={setAmountStr}
					variant='formatted-number'
					inputPrefix={<span className='text-muted-foreground'>{currencySymbol}</span>}
```

- Line 103: `Select`

```tsx
label={t('entityChargesPage.subscriptionCalculator.contractTerm')}
					value={contractTerms}
					options={selectOptions}
					onChange={(value) => setContractTerms(value as ContractTermValue)}
					contentClassName='z-[200]'
```

- Line 129: `Button`

```tsx
type='button' onClick={() => onApply(displayValue.toFixed(2), contractTerms)}
```

## src/components/organisms/PlanForm/RecurringChargesForm.tsx

661 lines. Query keys:

Response/domain field candidates: `price.billing_model`, `price.amount`, `price.price_unit_config?.amount`, `price.transform_quantity?.divide_by?.toString`, `price.tiers`, `price.tiers.length`, `price.price_unit_config?.price_unit_tiers`, `price.tier_mode`, `price.start_date`, `price.internal_state`, `price.display_name`, `price.type`, `price.min_quantity`, `price.price_unit_type`, `price.price_unit_config`, `data.code`, `data.base_currency`

- Line 400: `Input`

```tsx
onChange={(value) => setLocalPrice({ ...localPrice, display_name: value })}
				value={localPrice.display_name || ''}
				variant='text'
				label={t('catalog:plans.organisms.priceForm.displayName')}
				placeholder={entityName || t('catalog:plans.organisms.priceForm.enterDisplayName')}
				error={errors.display_name}
```

- Line 409: `CurrencyPriceUnitSelector`

```tsx
value={currencyPriceUnitValue}
				onChange={handleCurrencyPriceUnitChange}
				label={t('catalog:plans.organisms.priceForm.currency')}
				error={errors.currency || errors.price_unit_config}
```

- Line 416: `Select`

```tsx
value={localPrice.billing_period}
				options={billlingPeriodOptions}
				onChange={(value) => setLocalPrice({ ...localPrice, billing_period: value as BILLING_PERIOD })}
				label={t('catalog:plans.organisms.priceForm.billingPeriod')}
				error={errors.billing_period}
```

- Line 424: `Select`

```tsx
value={billingModel}
				options={billingModels}
				onChange={setBillingModel}
				label={t('catalog:plans.organisms.usageForm.billingModel')}
				placeholder={t('catalog:plans.organisms.usageForm.billingModelPlaceholder')}
```

- Line 434: `Input`

```tsx
onChange={(value) => setLocalPrice({ ...localPrice, amount: value })}
					value={localPrice.amount}
					variant='formatted-number'
					label={t('catalog:plans.organisms.priceForm.price')}
					placeholder={t('catalog:plans.organisms.priceForm.amountPlaceholderShort')}
					error={errors.amount}
					inputPrefix={displayCurrencySymbol}
					suffix={
						<div className='flex items-center gap-1.5'>
							<span className='text-content-slate-muted'>
								{t('catalog:plans.organisms.recurringForm.perBilling', {
									period: formatBillingPeriodForPrice(localPrice.billing_period || ''),
								})}
							</span>
							<Popover open={calculatorOpen} onOpenChange={setCalculatorOpen}>
								<PopoverTrigger asChild>
									<button
										type='button'
										aria-label={t('catalog:plans.organisms.recurringForm.calculatorAria')}
										className='inline-flex items-center justify-center rounded p-0.5 text-content-muted hover:bg-surface-shell hover:text-content-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1'
										onClick={(e) => {
											e.stopPropagation();
											setCalculatorOpen(true);
										}}>
										<Calculator className='size-4' />
									</button>
								</PopoverTrigger>
								<PopoverContent className='w-[360px]' align='end' sideOffset={8} onOpenAutoFocus={(e) => e.preventDefault()}>
									<SubscriptionCalculatorContent
										currency={localPrice.currency || 'USD'}
										initialAmount={localPrice.amount ?? ''}
										initialContractTerms='ANNUAL'
										planPeriod={(localPrice.billing_period as any) || 'ANNUAL'}
										onApply={(displayAmount) => {
											setLocalPrice((prev) => ({ ...prev, amount: displayAmount }));
											setCalculatorOpen(false);
										}}
									/>
								</PopoverContent>
							</Popover>
						</div>
					}
```

- Line 482: `Input`

```tsx
onChange={(value) => {
							const decimalRegex = /^\d*\.?\d*$/;
							if (decimalRegex.test(value) || value === '') {
								setPercentageFee(value);
							}
						}}
						value={percentageFee}
						variant='formatted-number'
						label={t('catalog:plans.organisms.priceForm.price')}
						placeholder={t('catalog:plans.organisms.usageForm.percentagePlaceholder')}
						error={modelErrors.percentageModelError}
						suffix={<span className='text-content-slate-muted'>%</span>}
```

- Line 502: `Input`

```tsx
variant='formatted-number'
							label={t('catalog:plans.organisms.priceForm.price')}
							placeholder={t('catalog:plans.organisms.usageForm.amountPlaceholder')}
							value={packagedFee.price}
							inputPrefix={displayCurrencySymbol}
							onChange={(e) => {
								const decimalRegex = /^\d*\.?\d*$/;
								if (decimalRegex.test(e) || e === '') {
									setPackagedFee({ ...packagedFee, price: e });
								}
							}}
```

- Line 518: `Input`

```tsx
value={packagedFee.unit}
							variant='integer'
							placeholder='0'
							onChange={(e) => {
								const integerRegex = /^\d*$/;
								if (integerRegex.test(e) || e === '') {
									setPackagedFee({ ...packagedFee, unit: e });
								}
							}}
							suffix={`/ units / ${formatBillingPeriodForPrice(localPrice.billing_period || '')}`}
```

- Line 537: `VolumeTieredPricingForm`

```tsx
setTieredPrices={setTieredPrices}
						tieredPrices={tieredPrices}
						currency={isCustomUnit ? localPrice.price_unit_config?.price_unit || localPrice.currency : localPrice.currency}
						tierMode={billingModel === 'SLAB_TIERED' ? TIER_MODE.SLAB : TIER_MODE.VOLUME}
```

- Line 547: `SelectGroup`

```tsx
value={localPrice.group_id}
				onChange={handleGroupChange}
				label={t('catalog:plans.organisms.priceForm.group')}
				placeholder={t('catalog:plans.organisms.priceForm.groupPlaceholder')}
				description={t('catalog:plans.organisms.priceForm.groupDescription')}
				showLookupKey={false}
				hiddenIfEmpty
```

- Line 568: `FormHeader`

```tsx
title={t('catalog:plans.organisms.recurringForm.billingTiming')} variant='form-component-title'
```

- Line 571: `CheckboxRadioGroup`

```tsx
title='	'
				value={localPrice.invoice_cadence}
				checkboxItems={[
					{
						label: t('catalog:plans.organisms.recurringForm.invoiceCadenceAdvance'),
						value: INVOICE_CADENCE.ADVANCE,
						description: t('catalog:plans.organisms.recurringForm.invoiceCadenceAdvanceDesc'),
					},
					{
						label: t('catalog:plans.organisms.recurringForm.invoiceCadenceArrear'),
						value: INVOICE_CADENCE.ARREAR,
						description: t('catalog:plans.organisms.recurringForm.invoiceCadenceArrearDesc'),
					},
				]}
				onChange={(value) => {
					setLocalPrice({ ...localPrice, invoice_cadence: value as INVOICE_CADENCE });
					if (value === BILLING_CADENCE.ONETIME) {
						setLocalPrice({ ...localPrice, isTrialPeriod: false, trial_period_days: 0 });
					}
				}}
				error={errors.invoice_cadence}
```

- Line 597: `Input`

```tsx
variant='number'
						error={errors.min_quantity}
						value={localPrice.min_quantity?.toString() || ''}
						onChange={(value) => {
							const numValue = value === '' ? undefined : Math.floor(Number(value));
							setLocalPrice({ ...localPrice, min_quantity: numValue });
						}}
						label={t('catalog:plans.organisms.recurringForm.minQuantity')}
						placeholder='1'
```

- Line 612: `FormHeader`

```tsx
title={t('catalog:plans.organisms.recurringForm.trialPeriodTitle')} variant='form-component-title'
```

- Line 614: `Switch`

```tsx
id='airplane-mode'
						checked={localPrice.isTrialPeriod}
						onCheckedChange={(value) => {
							setLocalPrice({ ...localPrice, isTrialPeriod: value });
						}}
```

- Line 635: `Input`

```tsx
variant='number'
						error={errors.trial_period_days}
						value={localPrice.trial_period_days}
						onChange={(value) => {
							setLocalPrice({ ...localPrice, trial_period_days: Number(value) });
						}}
						suffix='days'
						placeholder={t('catalog:plans.organisms.recurringForm.trialDaysPlaceholder')}
```

- Line 649: `Button`

```tsx
onClick={onDeleteClicked} variant='secondary' className='me-4 text-content-zinc-bold' disabled={isSaving}
```

- Line 652: `Button`

```tsx
onClick={handleSubmit} variant='default' className='me-4 font-normal' isLoading={isSaving} disabled={isSaving}
```

## src/components/organisms/PlanForm/SetupChargesSection.tsx

309 lines. Query keys:

Response/domain field candidates: `price.type`, `plan.id`, `plan.name`

- Line 140: `FormHeader`

```tsx
title={t('plans.organisms.setupCharges.planCharges')}
						subtitle={t('plans.organisms.setupCharges.subtitle')}
						variant='sub-header'
```

- Line 145: `FormHeader`

```tsx
title={t('plans.organisms.setupCharges.choosePricingModel')} variant='form-component-title'
```

- Line 168: `FormHeader`

```tsx
title={t('plans.organisms.setupCharges.fixedChargesTitle')} variant='form-component-title'
```

- Line 170: `RecurringChargesForm`

```tsx
key={index}
							price={price}
							entityType={PRICE_ENTITY_TYPE.PLAN}
							entityId={plan.id}
							entityName={plan.name}
							onAdd={(newPrice) => {
								setRecurringCharges((prevCharges) => {
									const newCharges = prevCharges.map((p, i) => {
										if (index === i) {
											const updatedPrice = {
												...newPrice,
												internal_state: PriceInternalState.SAVED,
												amount: newPrice.amount || '', // Ensure amount is never undefined
											};
											return updatedPrice;
										}
										return p;
									});

									updatePlanPrices(newCharges, usageCharges);
									return newCharges;
								});
							}}
							onUpdate={(newPrice) => {
								const newCharges = recurringCharges.map((p, i) => {
									if (index === i) {
										const updatedPrice = {
											...newPrice,
											internal_state: PriceInternalState.SAVED,
											amount: newPrice.amount || '', // Ensure amount is never undefined
										};
										return updatedPrice;
									}
									return p;
								});

								setRecurringCharges(newCharges);
								updatePlanPrices(newCharges, usageCharges);
							}}
							onEditClicked={() => {
								const newCharges = recurringCharges.map((p, i) => {
									if (index === i) {
										const updatedPrice = {
											...p,
											internal_state: PriceInternalState.EDIT,
										};
										return updatedPrice;
									}
									return p;
								});

								setRecurringCharges(newCharges);
							}}
							onDeleteClicked={() => {
								const newCharges = recurringCharges.filter((_, i) => i !== index);

								setRecurringCharges(newCharges);
								updatePlanPrices(newCharges, usageCharges);
							}}
```

- Line 238: `FormHeader`

```tsx
title={t('plans.organisms.setupCharges.usageBasedChargesTitle')} variant='form-component-title'
```

- Line 240: `UsagePricingForm`

```tsx
key={index}
							price={price}
							entityType={PRICE_ENTITY_TYPE.PLAN}
							entityId={plan.id}
							onAdd={(newPrice) => {
								const newCharges = usageCharges.map((p, i) => {
									if (index === i) {
										return { ...newPrice, internal_state: PriceInternalState.SAVED };
									}
									return p;
								});
								setUsageCharges(newCharges);
								updatePlanPrices(recurringCharges, newCharges);
							}}
							onUpdate={(newPrice) => {
								const newCharges = usageCharges.map((p, i) => {
									if (index === i) {
										return { ...newPrice, internal_state: PriceInternalState.SAVED };
									}
									return p;
								});
								setUsageCharges(newCharges);
								updatePlanPrices(recurringCharges, newCharges);
							}}
							onEditClicked={() => {
								const newCharges = usageCharges.map((p, i) => {
									if (index === i) {
										return { ...p, internal_state: PriceInternalState.EDIT };
									}
									return p;
								});
								setUsageCharges(newCharges);
							}}
							onDeleteClicked={() => {
								const newCharges = usageCharges.filter((_, i) => i !== index);
								setUsageCharges(newCharges);
								updatePlanPrices(recurringCharges, newCharges);
							}}
```

- Line 288: `AddChargesButton`

```tsx
onClick={() => handleAddNewPrice(SubscriptionType.FIXED)}
							label={t('plans.organisms.setupCharges.addFixedCharge')}
```

- Line 296: `AddChargesButton`

```tsx
onClick={() => handleAddNewPrice(SubscriptionType.USAGE)}
								label={t('plans.organisms.setupCharges.addUsageBasedCharges')}
```

## src/components/organisms/PlanForm/UsageChargePreview.tsx

62 lines. Query keys:

Response/domain field candidates: `price.price_unit_type`, `price.price_unit_config?.price_unit`, `price.currency`, `price.display_name`, `price.meter?.name`, `price.billing_period`, `price.billing_model`

## src/components/organisms/PlanForm/UsagePricingForm.tsx

817 lines. Query keys: `['fetchFeatureByMeterId', price.meter_id],`

Response/domain field candidates: `price.billing_model`, `price.currency`, `price.price_unit_type`, `price.price_unit_config`, `price.group_id`, `price.display_name`, `price.billing_period`, `price.amount`, `price.start_date`, `price.bucket_size`, `price.meter_id`, `price.internal_state`, `data.code`, `data.base_currency`, `price.transform_quantity?.divide_by?.toString`, `price.tiers`, `price.tier_mode`, `price.metadata`, `price.meter`, `feature.name`

- Line 587: `SelectFeature`

```tsx
featureTypes={[FEATURE_TYPE.METERED]}
				error={errors.meter_id}
				onChange={(feature) => {
					if (feature) {
						setSelectedFeature(feature);
						onMeterChange?.(feature);
						// Auto-fill display_name with feature name if empty
						if (!displayName) {
							setDisplayName(feature.name);
						}
					} else {
						setSelectedFeature(undefined);
						onMeterChange?.(null);
					}
				}}
				value={selectedFeature?.id}
				label={t('catalog:plans.organisms.usageForm.feature')}
				placeholder={t('catalog:plans.organisms.usageForm.selectMeteredFeature')}
```

- Line 608: `Input`

```tsx
onChange={(value) => setDisplayName(value)}
				value={displayName}
				variant='text'
				label={t('catalog:plans.organisms.priceForm.displayName')}
				placeholder={selectedFeature?.name || t('catalog:plans.organisms.priceForm.enterDisplayName')}
				error={errors.display_name}
```

- Line 618: `CurrencyPriceUnitSelector`

```tsx
value={currencyPriceUnitValue}
				onChange={handleCurrencyPriceUnitChange}
				label={t('catalog:plans.organisms.priceForm.currency')}
				error={errors.currency}
```

- Line 625: `Select`

```tsx
value={billingPeriod}
				options={billlingPeriodOptions.filter((option) => option.value !== BILLING_PERIOD.ONETIME)}
				onChange={(value) => {
					setBillingPeriod(value as BILLING_PERIOD);
				}}
				label={t('catalog:plans.organisms.priceForm.billingPeriod')}
				placeholder={t('catalog:plans.organisms.usageForm.selectBillingPeriod')}
				error={errors.billing_period}
```

- Line 637: `Select`

```tsx
value={billingModel}
				options={billingModels}
				onChange={setBillingModel}
				label={t('catalog:plans.organisms.usageForm.billingModel')}
				error={errors.billing_model}
				placeholder={t('catalog:plans.organisms.usageForm.billingModelPlaceholder')}
```

- Line 647: `Select`

```tsx
value={bucketSize}
				options={priceBucketSizeOptions}
				onChange={(value) => setBucketSize(value as PriceBucketSize)}
				label={t('catalog:plans.organisms.usageForm.bucketSize')}
				placeholder={t('catalog:plans.organisms.usageForm.bucketSizePlaceholder')}
				disabled={!!meterBucketSize}
				description={
					meterBucketSize
						? t('catalog:priceDialogs.bucketSizeSetOnMeter', { bucketSize: meterBucketSize })
						: t('catalog:plans.organisms.usageForm.bucketSizeDescription')
				}
```

- Line 664: `Input`

```tsx
placeholder={t('catalog:plans.organisms.usageForm.amountPlaceholder')}
						variant='formatted-number'
						error={inputErrors.flatModelError}
						label={t('catalog:plans.organisms.priceForm.price')}
						value={flatFee}
						inputPrefix={displayCurrencySymbol}
						onChange={(e) => {
							// Validate decimal input
							const decimalRegex = /^\d*\.?\d*$/;
							if (decimalRegex.test(e) || e === '') {
								setFlatFee(e);
							}
						}}
						suffix={<span className='text-content-slate-muted'>{`/ unit / ${formatBillingPeriodForPrice(billingPeriod)}`}</span>}
```

- Line 685: `Input`

```tsx
placeholder={t('catalog:plans.organisms.usageForm.percentagePlaceholder')}
						variant='formatted-number'
						error={inputErrors.percentageModelError}
						label={t('catalog:plans.organisms.priceForm.price')}
						value={percentageFee}
						onChange={(e) => {
							// Validate decimal input
							const decimalRegex = /^\d*\.?\d*$/;
							if (decimalRegex.test(e) || e === '') {
								setPercentageFee(e);
							}
						}}
						suffix={<span className='text-content-slate-muted'>%</span>}
```

- Line 706: `Input`

```tsx
variant='formatted-number'
							label={t('catalog:plans.organisms.priceForm.price')}
							placeholder={t('catalog:plans.organisms.usageForm.amountPlaceholder')}
							value={packagedFee.price}
							inputPrefix={displayCurrencySymbol}
							onChange={(e) => {
								// Validate decimal input
								const decimalRegex = /^\d*\.?\d*$/;
								if (decimalRegex.test(e) || e === '') {
									setPackagedFee({ ...packagedFee, price: e });
								}
							}}
```

- Line 723: `Input`

```tsx
value={packagedFee.unit}
							variant='integer'
							placeholder='0'
							onChange={(e) => {
								// Validate integer input
								const integerRegex = /^\d*$/;
								if (integerRegex.test(e) || e === '') {
									setPackagedFee({
										...packagedFee,
										unit: e,
									});
								}
							}}
							suffix={`/ units / ${formatBillingPeriodForPrice(billingPeriod)}`}
```

- Line 747: `VolumeTieredPricingForm`

```tsx
setTieredPrices={setTieredPrices}
						tieredPrices={tieredPrices}
						currency={priceUnitType === PRICE_UNIT_TYPE.CUSTOM ? priceUnitConfig?.price_unit || currency : currency}
						tierMode={billingModel === billingModels[2].value ? TIER_MODE.VOLUME : TIER_MODE.SLAB}
```

- Line 757: `SelectGroup`

```tsx
value={groupId}
				onChange={(group: Group | null) => setGroupId(group?.id)}
				label={t('catalog:plans.organisms.priceForm.group')}
				placeholder={t('catalog:plans.organisms.priceForm.groupPlaceholder')}
				description={t('catalog:plans.organisms.priceForm.groupDescription')}
				showLookupKey={false}
				hiddenIfEmpty
```

- Line 805: `Button`

```tsx
onClick={handleCancel} variant='secondary' className='me-4 text-content-zinc-bold' disabled={isSaving}
```

- Line 808: `Button`

```tsx
onClick={handleSubmit} variant='default' className='me-4 font-normal' isLoading={isSaving} disabled={isSaving}
```

## src/components/organisms/PlanForm/VolumeTieredPricingForm.tsx

237 lines. Query keys:

Response/domain field candidates:

- Line 171: `Input`

```tsx
disabled
											className='h-9 w-full min-w-0'
											// onChange={(e) => updateTier(index, 'from', e)}
											value={tier.from.toString()}
```

- Line 179: `DecimalUsageInput`

```tsx
label=''
											className='h-9 w-full min-w-0'
											value={tier.up_to === null ? '' : tier.up_to.toString()}
											onChange={(e) => updateTier(index, 'up_to', e)}
											precision={3}
											min={0}
											placeholder='∞'
```

- Line 190: `Input`

```tsx
className='h-9 w-full min-w-0'
											onChange={(e) => {
												if (validateDecimal(e)) {
													updatePrice(index, 'unit_amount', e);
												}
											}}
											value={tier.unit_amount?.toString() || ''}
											inputPrefix={currency ? getDisplaySymbol(currency) : undefined}
											placeholder={t('plans.organisms.volumeTier.zeroPlaceholder')}
```

- Line 203: `Input`

```tsx
className='h-9 w-full min-w-0'
											onChange={(e) => {
												if (validateDecimal(e)) {
													updatePrice(index, 'flat_amount', e);
												}
											}}
											value={tier.flat_amount?.toString() ?? '0'}
											inputPrefix={currency ? getDisplaySymbol(currency) : undefined}
											placeholder={t('plans.organisms.volumeTier.zeroPlaceholder')}
```

- Line 230: `AddChargesButton`

```tsx
onClick={addTieredPrice} label={t('plans.organisms.volumeTier.addTier')}
```

## src/components/molecules/CommitmentTimeBucketsEditor/CommitmentTimeBucketsEditor.tsx

547 lines. Query keys:

Response/domain field candidates: `row.start.hour`, `row.start.minute`, `row.end.hour`, `row.end.minute`, `row.bucket_tiers?.length`, `row.bucket_tiers`, `row.transform_quantity_divide_by`, `row.billing_model`, `row.start`, `row.end`, `row.overage_factor`, `row.bucket_tiers?.some`, `row.commitment_value?.trim`, `row.bucket_amount?.trim`, `row.commitment_value`, `row.true_up_enabled`, `row.bucket_amount`, `row.overage_factor?.trim`

- Line 96: `Select`

```tsx
value={isUnset ? undefined : String(value)}
			onValueChange={(next) => onChange(parseInt(next, 10))}
			disabled={disabled}
			open={openId === id}
			onOpenChange={(open) => onOpenIdChange(open ? id : null)}
```

- Line 102: `SelectTrigger`

```tsx
aria-label={ariaLabel}
				className={cn(
					'h-8 w-12 shrink-0 justify-center gap-0 px-1 text-center text-xs font-medium tabular-nums [&>svg]:size-3.5',
					disabled && 'cursor-not-allowed opacity-60',
					hasError && 'border-danger-bright focus:ring-danger-bright',
					isUnset && 'text-muted-foreground',
				)}
```

- Line 110: `SelectValue`

```tsx
placeholder={placeholder}
```

- Line 112: `SelectContent`

```tsx
className='max-h-52'
```

- Line 114: `SelectItem`

```tsx
key={unitValue} value={String(unitValue)} className='justify-center tabular-nums'
```

- Line 158: `TimeUnitSelect`

```tsx
id={`${idPrefix}-hour`}
				openId={openId}
				onOpenIdChange={onOpenIdChange}
				value={value.hour}
				allowedValues={hourValues}
				placeholder={hourPlaceholder}
				onChange={(hour) => onChange({ ...value, hour })}
				disabled={disabled}
				ariaLabel={`${label} hour`}
				hasError={hasError}
```

- Line 171: `TimeUnitSelect`

```tsx
id={`${idPrefix}-minute`}
				openId={openId}
				onOpenIdChange={onOpenIdChange}
				value={minutesEnabled ? value.minute : value.hour === UNSET_TIME_VALUE ? UNSET_TIME_VALUE : 0}
				allowedValues={minuteValues}
				placeholder={minutePlaceholder}
				onChange={(minute) => onChange({ ...value, minute })}
				disabled={disabled || !minutesEnabled}
				ariaLabel={`${label} minute`}
				hasError={hasError}
```

- Line 270: `Button`

```tsx
type='button' variant='outline' size='sm' onClick={handleAddBucket} disabled={disabled} className='shrink-0 gap-1.5'
```

- Line 346: `TimePointInput`

```tsx
idPrefix={`${index}-start`}
										openId={openTimeDropdownId}
										onOpenIdChange={setOpenTimeDropdownId}
										label={t('billing:commitmentConfig.timeBuckets.startLabel')}
										value={row.start}
										onChange={(start) => updateRow(index, { start })}
										hourValues={hourValues}
										minuteValues={minuteValues}
										minutesEnabled={minutesEnabled}
										hourPlaceholder={hourPlaceholder}
										minutePlaceholder={minutePlaceholder}
										disabled={disabled}
										hasError={startTimeError}
```

- Line 361: `TimePointInput`

```tsx
idPrefix={`${index}-end`}
										openId={openTimeDropdownId}
										onOpenIdChange={setOpenTimeDropdownId}
										label={t('billing:commitmentConfig.timeBuckets.endLabel')}
										value={row.end}
										onChange={(end) => updateRow(index, { end })}
										hourValues={hourValues}
										minuteValues={minuteValues}
										minutesEnabled={minutesEnabled}
										hourPlaceholder={hourPlaceholder}
										minutePlaceholder={minutePlaceholder}
										disabled={disabled}
										hasError={endTimeError}
```

- Line 389: `CommitmentTypeSelect`

```tsx
size='compact'
										value={rowCommitmentType}
										onChange={(commitment_type) => updateRow(index, { commitment_type })}
										disabled={disabled}
```

- Line 400: `Input`

```tsx
type={rowCommitmentType === CommitmentType.QUANTITY ? 'number' : 'formatted-number'}
											value={row.commitment_value ?? ''}
											onChange={(value) => updateRow(index, { commitment_value: value })}
											placeholder={t('billing:commitmentConfig.timeBuckets.commitmentValuePlaceholder')}
											suffix={rowCommitmentType === CommitmentType.AMOUNT ? currencySymbol : undefined}
											disabled={disabled}
											className='w-full'
											error={commitmentValueError}
```

- Line 424: `Switch`

```tsx
checked={row.true_up_enabled ?? false}
												onCheckedChange={(checked) => updateRow(index, { true_up_enabled: checked })}
												disabled={disabled}
```

- Line 437: `Input`

```tsx
type='number'
										value={row.overage_factor ?? ''}
										onChange={(value) => updateRow(index, { overage_factor: value })}
										placeholder={overagePlaceholder}
										disabled={disabled}
										className='w-full'
										error={overageFactorError}
```

- Line 453: `AtomSelect`

```tsx
value={billingModel}
										options={billingModelOptions}
										onChange={(value) => handleBillingModelChange(index, value as BillingModelSelectValue)}
										disabled={disabled}
										placeholder={t('billing:commitmentConfig.timeBuckets.billingModelPlaceholder')}
```

- Line 477: `Input`

```tsx
type='formatted-number'
												value={row.bucket_amount ?? ''}
												onChange={(value) =>
													updateRow(index, {
														bucket_amount: value,
														// Default overage to 1 the first time a price override is entered, so
														// users aren't blocked by "incomplete" validation on a field that
														// would otherwise silently default to 1 at save time anyway.
														...(value.trim() && !row.overage_factor?.trim() ? { overage_factor: '1' } : {}),
													})
												}
												placeholder={t('billing:commitmentConfig.timeBuckets.bucketAmountPlaceholder')}
												suffix={currencySymbol}
												disabled={disabled}
												className='w-full'
												error={bucketAmountError}
```

- Line 509: `Input`

```tsx
type='integer'
												value={row.transform_quantity_divide_by ?? ''}
												onChange={(value) => updateRow(index, { transform_quantity_divide_by: value })}
												placeholder='1'
												disabled={disabled}
												className='w-full'
```

- Line 524: `VolumeTieredPricingForm`

```tsx
tieredPrices={tierFormRows}
										setTieredPrices={(setter) => {
											const newTiers = typeof setter === 'function' ? setter(tierFormRows) : setter;
											updateRow(index, {
												bucket_tiers: mapFormTiersToBucketTiers(newTiers),
												...(row.billing_model ? {} : { billing_model: billingModel }),
											});
										}}
										currency={displayCurrency}
										tierMode={isSlabBillingModel(billingModel) ? TIER_MODE.SLAB : TIER_MODE.VOLUME}
```

## src/components/molecules/CommitmentConfigDialog/CommitmentConfigDialog.tsx

356 lines. Query keys:

Response/domain field candidates: `price.currency`, `price.meter?.name`, `price.display_name`, `price.id`

- Line 198: `Dialog`

```tsx
isOpen={isOpen}
			onOpenChange={handleDialogOpenChange}
			title={t('commitmentConfig.title')}
			description={t('commitmentConfig.description', { name: meterDisplayName })}
			className='w-full max-w-4xl'
```

- Line 205: `CommitmentTypeSelect`

```tsx
value={commitmentType}
					onChange={(value) => {
						setCommitmentType(value);
						clearValidation();
					}}
```

- Line 220: `Input`

```tsx
type='formatted-number'
									value={commitmentAmount}
									onChange={(value) => {
										setCommitmentAmount(value);
										clearValidation();
									}}
									placeholder={t('commitmentConfig.commitmentAmountPlaceholder')}
									suffix={currencySymbol}
									className='w-full'
									error={showAmountError}
```

- Line 237: `Input`

```tsx
type='number'
									value={commitmentQuantity}
									onChange={(value) => {
										setCommitmentQuantity(value);
										clearValidation();
									}}
									placeholder={t('commitmentConfig.commitmentQuantityPlaceholder')}
									className='w-full'
									error={showQuantityError}
```

- Line 254: `Select`

```tsx
value={commitmentDuration}
							options={commitmentDurationOptions}
							onChange={(value) => {
								setCommitmentDuration(value);
								clearValidation();
							}}
							placeholder={t('commitmentConfig.sameAsBillingPlaceholder')}
```

- Line 269: `Input`

```tsx
type='number'
						value={overageFactor}
						onChange={(value) => {
							setOverageFactor(value);
							clearValidation();
						}}
						placeholder={t('commitmentConfig.overageFactorPlaceholder')}
						className='w-full'
						error={commitmentErrorTarget === 'overageField' ? (validationError ?? undefined) : undefined}
```

- Line 288: `Switch`

```tsx
checked={enableTrueUp} onCheckedChange={setEnableTrueUp}
```

- Line 299: `Switch`

```tsx
checked={isWindowCommitment}
							onCheckedChange={(checked) => {
								setIsWindowCommitment(checked);
								if (!checked) setTimeBuckets([]);
							}}
```

- Line 338: `Button`

```tsx
variant='outline' onClick={handleCancel} className='flex-1' disabled={isSaving}
```

- Line 342: `Button`

```tsx
variant='outline' onClick={handleClear} className='flex-1 text-danger hover:bg-danger-muted' disabled={isSaving}
```

- Line 346: `Button`

```tsx
onClick={handleSave} className='flex-1' isLoading={isSaving} disabled={isSaving}
```

## src/components/molecules/PriceQuantityCell/PriceQuantityCell.tsx

119 lines. Query keys:

Response/domain field candidates: `price.min_quantity`, `price.type`, `price.id`

- Line 84: `DecimalUsageInput`

```tsx
value={displayQuantity}
				ariaLabel={ariaLabel}
				onChange={(value) => {
					if (value === '') {
						setDraft('');
						return;
					}
					const quantity = resolveQuantityFromInput(value, minQuantity);

					if (quantity === minQuantity) {
						if (isOnlyQuantityOverride(override)) {
							onResetOverride(price.id);
						} else if (override) {
							const { quantity: _q, ...rest } = override;
							onPriceOverride(price.id, { ...rest, quantity: undefined });
						}
						setDraft(isControlled && value !== quantity.toString() ? value : null);
						return;
					}

					if (lineItemCoupon) onClearCoupon?.(price.id);
					onPriceOverride(price.id, { quantity });
					setDraft(quantity.toString());
				}}
				placeholder={minQuantity.toString()}
				disabled={disabled}
				precision={0}
				min={0}
```

## src/components/molecules/PremiumFeature/PremiumFeature.tsx

93 lines. Query keys:

Response/domain field candidates:

- Line 57: `Dialog`

```tsx
isOpen={isOpen}
				onOpenChange={setIsOpen}
				title={t('premiumFeature.dialogTitle')}
				description={t('premiumFeature.dialogDescription')}
				descriptionClassName='text-sm w-[90%]'
```

- Line 64: `Button`

```tsx

```

## src/components/organisms/Subscription/SubscriptionChargeCommitmentSection.tsx

208 lines. Query keys:

Response/domain field candidates:

- Line 77: `CommitmentTypeSelect`

```tsx
value={value.commitmentType}
				onChange={(commitmentType) => updateValue({ commitmentType })}
				disabled={disabled}
```

- Line 90: `Input`

```tsx
type='formatted-number'
								value={value.commitmentAmount}
								onChange={(commitmentAmount) => updateValue({ commitmentAmount })}
								placeholder={t('commitmentConfig.commitmentAmountPlaceholder')}
								suffix={currencySymbol}
								className='w-full'
								disabled={disabled}
```

- Line 104: `Input`

```tsx
type='number'
								value={value.commitmentQuantity}
								onChange={(commitmentQuantity) => updateValue({ commitmentQuantity })}
								placeholder={t('commitmentConfig.commitmentQuantityPlaceholder')}
								className='w-full'
								disabled={disabled}
```

- Line 118: `Select`

```tsx
value={value.commitmentDuration || billingPeriod?.toUpperCase() || ''}
						options={commitmentDurationOptions}
						onChange={(commitmentDuration) => updateValue({ commitmentDuration })}
						placeholder={t('commitmentConfig.sameAsBillingPlaceholder')}
						disabled={disabled}
```

- Line 131: `Input`

```tsx
type='number'
					value={value.overageFactor}
					onChange={(overageFactor) => updateValue({ overageFactor })}
					placeholder={t('commitmentConfig.overageFactorPlaceholder')}
					className='w-full'
					disabled={disabled}
```

- Line 147: `Switch`

```tsx
checked={value.enableTrueUp} onCheckedChange={(enableTrueUp) => updateValue({ enableTrueUp })} disabled={disabled}
```

- Line 173: `Switch`

```tsx
checked={value.windowCommitment}
							onCheckedChange={(windowCommitment) =>
								updateValue({
									windowCommitment,
									timeBuckets: windowCommitment ? value.timeBuckets : [],
								})
							}
							disabled={disabled}
```

## src/components/molecules/PriceOverrideDialog/PriceOverrideDialog.tsx

808 lines. Query keys:

Response/domain field candidates: `price?.meter_id`, `price.meter_id`, `price.meter`, `price?.meter`, `price.billing_model`, `price.tier_mode`, `price.bucket_size`, `price.meter?.aggregation?.bucket_size`, `price.price_unit_type`, `price.id`, `price.price_unit_amount`, `price.price_unit_config?.amount`, `price.price_unit_tiers`, `price.amount`, `price.tiers`, `price.price_unit_tiers.length`, `price.price_unit_tiers.map`, `price.tiers.length`, `price.tiers.map`, `price.transform_quantity`, `price.price_unit_config`, `price.type`, `price?.bucket_size`, `price.price_unit_config?.price_unit`, `price.price_unit`, `price.currency`, `price.meter?.name`, `price.description`, `price.transform_quantity.divide_by`

- Line 597: `Dialog`

```tsx
isOpen={isOpen}
			onOpenChange={handleDialogOpenChange}
			title={
				<div className='flex items-center gap-2'>
					<span>{t('priceDialogs.overrideTitle')}</span>
					<PremiumFeatureIcon side='right' align='center' sideOffset={10} />
				</div>
			}
			description={t('priceDialogs.modifyPricingDescription', { name: chargeDisplayName })}
			className={lineItem ? 'w-full max-w-4xl overflow-x-hidden ' : 'w-full max-w-lg sm:max-w-[32rem]'}
```

- Line 620: `Select`

```tsx
value={overrideBillingModel}
								onChange={(value) => setOverrideBillingModel(value as BILLING_MODEL)}
								options={billingModelOptions}
								placeholder={t('priceDialogs.selectBillingModel')}
```

- Line 633: `Select`

```tsx
value={overrideBucketSize}
								onChange={(value) => setOverrideBucketSize(value as PriceBucketSize)}
								options={priceBucketSizeOptions}
								placeholder={t('priceDialogs.bucketSizePlaceholder')}
								disabled={!!meterBucketSize}
								description={meterBucketSize ? t('priceDialogs.bucketSizeSetOnMeter', { bucketSize: meterBucketSize }) : undefined}
```

- Line 652: `Input`

```tsx
type='formatted-number'
								value={overrideAmount}
								onChange={setOverrideAmount}
								placeholder={showAsPercentage ? t('priceDialogs.enterNewPercentageOptional') : t('priceDialogs.enterNewAmountOptional')}
								suffix={showAsPercentage ? '%' : displaySymbol}
								className='w-full'
```

- Line 667: `VolumeTieredPricingForm`

```tsx
tieredPrices={
									overrideTiers.length > 0
										? overrideTiers.map((tier, index) => {
												// Calculate proper from and up_to values
												let from: number;
												let up_to: number | null;

												if (index === 0) {
													from = 0;
													up_to = overrideTiers[0]?.up_to || null;
												} else {
													from = overrideTiers[index - 1]?.up_to || 0;
													up_to = overrideTiers[index]?.up_to || null;
												}

												return {
													from,
													up_to,
													unit_amount: tier.unit_amount || '',
													flat_amount: tier.flat_amount || '0',
												};
											})
										: [{ from: 0, up_to: null, unit_amount: '', flat_amount: '0' }]
								}
								setTieredPrices={(setter) => {
									// Handle both function and direct value cases
									const newTiers =
										typeof setter === 'function'
											? setter(
													overrideTiers.length > 0
														? overrideTiers.map((tier, index) => ({
																from: index === 0 ? 0 : overrideTiers[index - 1]?.up_to || 0,
																up_to: tier.up_to || null,
																unit_amount: tier.unit_amount || '',
																flat_amount: tier.flat_amount || '0',
															}))
														: [{ from: 0, up_to: null, unit_amount: '', flat_amount: '0' }],
												)
											: setter;

									// Convert the PriceTier format to CreatePriceTier format
									// and properly handle the from/up_to values
									const convertedTiers = newTiers.map((tier) => {
										// Use the tier's own up_to value directly
										return {
											unit_amount: tier.unit_amount || '',
											flat_amount: tier.flat_amount || '0',
											up_to: tier.up_to,
										};
									});
									setOverrideTiers(convertedTiers);
								}}
								currency={isCustomPriceUnit ? displaySymbol : price.currency}
								tierMode={overrideBillingModel === BILLING_MODEL.TIERED ? TIER_MODE.VOLUME : TIER_MODE.SLAB}
```

- Line 732: `Input`

```tsx
type='number'
									value={overrideTransformQuantity?.divide_by || ''}
									onChange={(value) =>
										setOverrideTransformQuantity({
											...overrideTransformQuantity,
											divide_by: Number(value) || 1,
										})
									}
									placeholder={t('priceDialogs.enterUnitsPerPackage')}
									className='w-full'
```

- Line 786: `Button`

```tsx
variant='outline' onClick={handleCancel} className='flex-1' disabled={isSaving}
```

- Line 790: `Button`

```tsx
variant='outline' onClick={handleReset} className='flex-1' disabled={isSaving}
```

- Line 794: `Button`

```tsx
onClick={handleOverride}
						className='flex-1'
						disabled={isSaving || (!hasChanges() && !hasCommitmentChanges())}
						isLoading={isSaving}
```

## src/components/molecules/SubscriptionAddonsSection/AddAddonDialog.tsx

556 lines. Query keys: `['subscriptionDetailsForAddAddonDialog', subscriptionId],`, `['subaddons', subscriptionId],`

Response/domain field candidates: `price.type`, `row.price.display_name`, `row.price.meter?.name`, `row.price.type`, `row.price`, `row.price.id`

- Line 394: `Dialog`

```tsx
isOpen={isOpen}
			showCloseButton={false}
			onOpenChange={handleDialogOpenChange}
			title={t('common:actions.add')}
			className='sm:max-w-[900px]'
```

- Line 402: `Select`

```tsx
label={t('billing:subscriptions.addon')}
						placeholder={t('billing:subscriptions.selectAddon')}
						options={filteredAddonOptions}
						value={formData.addon_id || ''}
						onChange={handleAddonSelect}
						error={errors.addon_id}
```

- Line 422: `FlexpriceTable`

```tsx
columns={addonChargeColumns} data={selectedAddonPrices.map((p) => ({ price: p }))}
```

- Line 461: `Select`

```tsx
label={t('billing:subscriptions.cadenceOptional')}
												placeholder={t('common:labels.default')}
												options={[
													{
														label: t('billing:subscriptions.addAddonDialog.cadence.recurring'),
														value: ADDON_CADENCE.RECURRING,
														description: t('billing:subscriptions.addAddonDialog.cadence.recurringDescription'),
													},
													{
														label: t('billing:subscriptions.addAddonDialog.cadence.onetime'),
														value: ADDON_CADENCE.ONETIME,
														description: t('billing:subscriptions.addAddonDialog.cadence.onetimeDescription'),
													},
												]}
												value={cadence}
												onChange={(v) => setCadence(v as ADDON_CADENCE)}
```

- Line 479: `Select`

```tsx
label={t('billing:subscriptions.prorationOptional')}
												placeholder={t('common:labels.default')}
												options={[
													{
														label: t('billing:subscriptions.addAddonDialog.proration.prorate'),
														value: ADDON_PRORATION_BEHAVIOR.CREATE_PRORATIONS,
														description: t('billing:subscriptions.addAddonDialog.proration.prorateDescription'),
													},
													{
														label: t('billing:subscriptions.addAddonDialog.proration.none'),
														value: ADDON_PRORATION_BEHAVIOR.NONE,
														description: t('billing:subscriptions.addAddonDialog.proration.noneDescription'),
													},
												]}
												value={prorationBehavior}
												onChange={(v) => setProrationBehavior(v as ADDON_PRORATION_BEHAVIOR)}
```

- Line 520: `PriceOverrideDialog`

```tsx
isOpen={isOverrideDialogOpen}
					onOpenChange={setIsOverrideDialogOpen}
					price={selectedOverridePrice}
					onPriceOverride={overridePrice}
					onResetOverride={resetOverride}
					overriddenPrices={overriddenPrices}
```

- Line 532: `CommitmentConfigDialog`

```tsx
isOpen={isCommitmentDialogOpen}
					onOpenChange={setIsCommitmentDialogOpen}
					price={selectedCommitmentPrice}
					onSave={handleCommitmentSave}
					currentConfig={lineItemCommitments[selectedCommitmentPrice.id]}
					currentTimeBuckets={lineItemCommitments[selectedCommitmentPrice.id]?.commitment_time_buckets}
					billingPeriod={billingPeriod}
```

- Line 544: `Button`

```tsx
variant='outline' onClick={handleCancel} disabled={isAddingAddon}
```

- Line 547: `Button`

```tsx
onClick={handleSave} isLoading={isAddingAddon} disabled={isAddingAddon}
```

## src/components/molecules/PriceTooltip/PriceTooltip.tsx

395 lines. Query keys:

Response/domain field candidates: `price.entity_type`

## src/components/molecules/Subscription/LineItemWindowCommitmentViewDialog.tsx

66 lines. Query keys:

Response/domain field candidates: `price?.meter_id`, `price?.meter`

- Line 35: `Dialog`

```tsx
isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={t('commitmentConfig.lineItemTitle', { defaultValue: 'Window commitment' })}
			description={lineItem.display_name}
			className='w-full max-w-4xl overflow-x-hidden'
```

## src/components/molecules/SubscriptionLineItemTable/SubscriptionLineItemTable.tsx

724 lines. Query keys:

Response/domain field candidates: `row.price_type`, `row.quantity`, `row.id`, `row.price_id`, `row.subscription_id`, `data.length`, `data.map`, `data?.length`, `item.entity_type`, `row.display_name?.trim`, `row.subscription_phase_id`, `row.billing_period`, `row.price`, `row.entity_type`, `row.price.entity_type`, `row.status`, `row.end_date`, `row.end_date.trim`

- Line 242: `AlertSettingsDialog`

```tsx
open={showAlertDialog}
				onClose={() => setShowAlertDialog(false)}
				entityType={ALERT_ENTITY_TYPE.SUBSCRIPTION_LINE_ITEM}
				entityId={row.id}
				parentEntityId={row.subscription_id}
```

- Line 692: `LineItemWindowCommitmentViewDialog`

```tsx
isOpen={!!viewCommitmentLineItem}
					onOpenChange={(open) => !open && setViewCommitmentLineItem(null)}
					lineItem={viewCommitmentLineItem}
```

- Line 700: `FlexpriceTable`

```tsx
showEmptyRow={isEmpty}
					data={processedLineItems ?? []}
					columns={columns}
					variant='no-bordered'
					tableClassName='table-fixed'
```

- Line 710: `FlexpriceTable`

```tsx
showEmptyRow={isEmpty}
						data={processedLineItems ?? []}
						columns={columns}
						variant='no-bordered'
						tableClassName='table-fixed'
```

## src/components/molecules/SubscriptionAddonsSection/ConfigureAddonDialog.tsx

232 lines. Query keys: `['addonAssociationLineItems', subscriptionId, association?.id],`

Response/domain field candidates:

- Line 172: `Dialog`

```tsx
isOpen={isOpen && !singleLineItem && !isLoading}
				onOpenChange={onOpenChange}
				title={t('billing:subscriptions.configureAddonDialog.title')}
				description={association?.addon?.name}
				showCloseButton
				className='sm:max-w-4xl'
```

- Line 184: `Button`

```tsx
variant='outline' onClick={() => void refetch()}
```

- Line 189: `SubscriptionLineItemTable`

```tsx
data={lineItems}
							isLoading={isLoading}
							hideCardWrapper
							readOnly={readOnly}
							onEdit={readOnly ? undefined : handleEditLineItem}
							onTerminate={readOnly ? undefined : handleTerminateLineItem}
							noDataSubtitle={t('billing:subscriptions.configureAddonDialog.empty')}
```

- Line 203: `PriceOverrideDialog`

```tsx
isOpen={true}
					onOpenChange={(open: boolean) => !open && closeEditor()}
					price={lineItemToPrice(editingLineItem.lineItem)}
					onPriceOverride={() => {}}
					onResetOverride={handleResetOverride}
					overriddenPrices={overriddenPrices}
					showEffectiveFrom={true}
					lineItem={editingLineItem.lineItem}
					onLineItemUpdate={handleUsageLineItemUpdate}
					isSaving={isUpdatingLineItem}
```

- Line 218: `SubscriptionLineItemQuantityModifyDialog`

```tsx
isOpen={true}
					onOpenChange={(open: boolean) => !open && closeEditor()}
					subscriptionId={subscriptionId}
					lineItem={editingLineItem.lineItem}
					currentPeriodStart={currentPeriodStart ?? ''}
					currentPeriodEnd={currentPeriodEnd ?? ''}
```

## src/components/molecules/SubscriptionAddonsSection/SubscriptionAddonsSection.tsx

465 lines. Query keys: `['subscriptionDetails', subscriptionId],`, `['subscriptionActiveAddons', subscriptionId],`, `['subscriptionAddonLineItems', subscriptionId],`, `['subscriptionActiveAddons', subscriptionId] });`, `['subscriptionEntitlements', subscriptionId] });`

Response/domain field candidates: `response.items`, `item.addon_association_id`, `item.price`, `item.price_type`, `item.price.type`, `item.quantity`, `item.start_date`, `item.end_date`, `row.addon?.name`, `row.addon_id`, `row.end_date`, `row.end_date.trim`, `row.id`

- Line 342: `AddButton`

```tsx
onClick={() => setIsAddDialogOpen(true)}
```

- Line 346: `AddButton`

```tsx
disabled
```

- Line 371: `FlexpriceTable`

```tsx
showEmptyRow data={addonAssociations} columns={columns} variant='no-bordered'
```

- Line 378: `AddAddonDialog`

```tsx
isOpen={isAddDialogOpen}
					onOpenChange={setIsAddDialogOpen}
					subscriptionId={subscriptionId}
					billingPeriod={subscriptionDetails?.billing_period}
					billingPeriodCount={
						subscriptionBillingPeriodCount ??
						(subscriptionContextResolved
							? undefined
							: (subscriptionDetailsFetched as SubscriptionResponse | undefined)?.billing_period_count)
					}
					currency={subscriptionDetails?.currency}
					currentPeriodEndIso={subscriptionDetails?.current_period_end}
```

- Line 394: `ConfigureAddonDialog`

```tsx
isOpen={!!addonToConfigure}
				onOpenChange={(open) => {
					if (!open) setAddonToConfigure(null);
				}}
				subscriptionId={subscriptionId}
				association={addonToConfigure}
				currentPeriodStart={subscriptionDetails?.current_period_start}
				currentPeriodEnd={subscriptionDetails?.current_period_end}
				readOnly={readOnly}
```

- Line 407: `Dialog`

```tsx
title={`Cancel "${addonNameToCancel}"?`}
				description={t('labels.cancelAddonDescription')}
				titleClassName='text-lg font-normal text-content-heading'
				isOpen={isCancelDialogOpen}
				onOpenChange={(open) => {
					setIsCancelDialogOpen(open);
					if (!open) {
						closeCancelDialog();
					}
				}}
				showCloseButton={false}
```

- Line 432: `Select`

```tsx
label={t('labels.proration')}
								placeholder={t('labels.default')}
								options={[
									{
										label: 'Create prorations',
										value: ADDON_PRORATION_BEHAVIOR.CREATE_PRORATIONS,
										description: 'Creates proration credits/charges.',
									},
									{ label: 'None', value: ADDON_PRORATION_BEHAVIOR.NONE, description: 'No proration adjustments.' },
								]}
								value={cancelProrationBehavior}
								onChange={(v) => setCancelProrationBehavior(v as ADDON_PRORATION_BEHAVIOR)}
```

- Line 451: `Button`

```tsx
variant='outline' onClick={closeCancelDialog} disabled={isCancellingAddon}
```

- Line 454: `Button`

```tsx
variant='destructive' onClick={confirmCancel} disabled={isCancellingAddon}
```

## src/components/organisms/Subscription/SubscriptionActionButton.tsx

381 lines. Query keys:

Response/domain field candidates: `subscription.subscription_status.toUpperCase`, `subscription.subscription_status`, `subscription.id`, `subscription.currency`

- Line 232: `FormHeader`

```tsx
title={t('customers:organisms.subscriptionAction.cancelTitle')}
						variant='sub-header'
						subtitle={t('customers:organisms.subscriptionAction.cancelSubtitle')}
						titleClassName='!mb-1'
						subtitleClassName='!text-sm !max-w-[440px] !leading-6'
```

- Line 240: `Select`

```tsx
label={t('customers:organisms.subscriptionAction.cancellationType')}
							value={state.cancelCancellationType}
							options={[
								{
									label: t('customers:organisms.subscriptionAction.cancellationImmediate'),
									value: SUBSCRIPTION_CANCELLATION_TYPE.IMMEDIATE,
								},
								{
									label: t('customers:organisms.subscriptionAction.cancellationEndOfPeriod'),
									value: SUBSCRIPTION_CANCELLATION_TYPE.END_OF_PERIOD,
								},
								{
									label: t('customers:organisms.subscriptionAction.cancellationScheduled'),
									value: SUBSCRIPTION_CANCELLATION_TYPE.SCHEDULED_DATE,
								},
							]}
							onChange={(value) => {
								const next = value as SUBSCRIPTION_CANCELLATION_TYPE;
								setState((prev) => ({
									...prev,
									cancelCancellationType: next,
									...(next !== SUBSCRIPTION_CANCELLATION_TYPE.SCHEDULED_DATE ? { cancelScheduledAt: undefined } : {}),
								}));
							}}
```

- Line 282: `Select`

```tsx
label={t('customers:organisms.subscriptionAction.prorationBehavior')}
							value={state.cancelProrationBehavior}
							options={[
								{ label: t('customers:organisms.subscriptionAction.prorationNone'), value: SUBSCRIPTION_PRORATION_BEHAVIOR.NONE },
								{
									label: t('customers:organisms.subscriptionAction.prorationCreate'),
									value: SUBSCRIPTION_PRORATION_BEHAVIOR.CREATE_PRORATIONS,
								},
							]}
							onChange={(value) =>
								setState((prev) => ({
									...prev,
									cancelProrationBehavior: value as SUBSCRIPTION_PRORATION_BEHAVIOR,
								}))
							}
```

- Line 306: `Input`

```tsx
label={t('customers:organisms.subscriptionAction.reasonOptional')}
							value={state.cancelReason}
							onChange={(value) => setState((prev) => ({ ...prev, cancelReason: value }))}
							placeholder={t('customers:organisms.subscriptionAction.cancelReasonPlaceholder')}
```

- Line 314: `Button`

```tsx
variant='outline' onClick={() => resetCancelState()} disabled={isCancelLoading}
```

- Line 317: `Button`

```tsx
variant='destructive'
							onClick={() => cancelSubscription(subscription.id)}
							disabled={isCancelLoading || cancelScheduledInvalid}
```

- Line 335: `FormHeader`

```tsx
title={t('customers:organisms.subscriptionAction.activateTitle')}
						variant='sub-header'
						subtitle={t('customers:organisms.subscriptionAction.activateSubtitle')}
```

- Line 351: `Button`

```tsx
variant='outline'
							onClick={() => setState((prev) => ({ ...prev, isActivateModalOpen: false }))}
							disabled={isActivating}
							className='px-6'
```

- Line 358: `Button`

```tsx
onClick={() => activateSubscription(subscription.id)}
							disabled={isActivating || !state.activateStartDate}
							className='px-6'
```

- Line 369: `AlertSettingsDialog`

```tsx
open={state.isAlertSettingsOpen}
				onClose={() => setState((prev) => ({ ...prev, isAlertSettingsOpen: false }))}
				entityType={ALERT_ENTITY_TYPE.SUBSCRIPTION}
				entityId={subscription.id}
				currency={subscription.currency}
```

## src/components/organisms/Subscription/SubscriptionTable.tsx

211 lines. Query keys:

Response/domain field candidates: `row.subscription_type?.toLowerCase`, `data.some`, `row.id`, `row.plan?.name`, `row.plan_id`, `row.billing_period`, `row.subscription_status`, `row.start_date`, `row.current_period_end`

- Line 190: `SubscriptionActionButton`

```tsx
subscription={row}
```

- Line 198: `FlexpriceTable`

```tsx
onRowClick={(row) => {
				onRowClick?.(row);
			}}
			columns={columns}
			showEmptyRow
			data={data}
			variant='no-bordered'
```

## src/components/molecules/Subscription/SubscriptionEditDetailsHeader.tsx

127 lines. Query keys:

Response/domain field candidates: `subscription?.plan?.name`, `subscription?.subscription_status`, `subscription?.subscription_type`, `subscription?.billing_cycle`, `subscription?.start_date`, `subscription?.current_period_end`, `subscription?.timezone?.trim`, `subscription.timezone`, `subscription?.commitment_amount`, `subscription?.currency`, `subscription?.overage_factor`, `subscription?.overage_factor.toString`, `subscription?.parent_subscription_id`, `subscription.parent_subscription_id`

- Line 95: `Button`

```tsx
variant='outline'
								size='icon'
								disabled={subscriptionReadOnly}
								onClick={() => !subscriptionReadOnly && onUpdateDrawerOpenChange(true)}
								title={
									subscriptionReadOnly
										? t('subscriptions.editDetailsHeader.inheritedReadOnlyTitle')
										: t('subscriptions.editDetailsHeader.updateTitle')
								}
```

- Line 113: `UpdateSubscriptionDrawer`

```tsx
open={updateDrawerOpen}
				onOpenChange={onUpdateDrawerOpenChange}
				subscriptionId={subscriptionId}
				subscription={subscription}
				onSave={onUpdate}
				isSaving={isUpdating}
				readOnly={subscriptionReadOnly}
```

## src/components/molecules/Subscription/SubscriptionEditChargesSection.tsx

173 lines. Query keys: `subscriptionEditLineItemsQueryKey(`

Response/domain field candidates:

- Line 128: `AddButton`

```tsx
onClick={onAddCharge} disabled={addDisabled}
```

- Line 148: `AddButton`

```tsx
onClick={onAddCharge} disabled={addDisabled}
```

- Line 152: `SubscriptionLineItemTable`

```tsx
data={lineItems}
				isLoading={isLoading}
				onEdit={onEditLineItem}
				onTerminate={onTerminateLineItem}
				hideCardWrapper={true}
				commitmentInfo={commitmentInfo}
				readOnly={readOnly}
				phaseLabelsById={phaseLabelsById}
				showNoDataCard={false}
				onApplyCoupon={onApplyCouponToLineItem}
				onRemoveCoupon={onRemoveCouponFromLineItem}
				lineItemIdsWithCoupon={lineItemIdsWithCoupon}
```

## src/components/molecules/Subscription/SubscriptionDetailChargesSection.tsx

120 lines. Query keys: `[`

Response/domain field candidates:

- Line 102: `SubscriptionLineItemTable`

```tsx
data={lineItems}
					isLoading={isLoading}
					commitmentInfo={commitmentInfo}
					readOnly
					showCommitmentColumn
					hideCardWrapper
					showNoDataCard={false}
					noDataSubtitle={t('labels.noChargesFound')}
```

## src/components/molecules/RectangleRadiogroup/RectangleRadiogroup.tsx

71 lines. Query keys:

Response/domain field candidates:

- Line 27: `FormHeader`

```tsx
title={title} variant='form-component-title'
```

## src/components/molecules/CreditGrant/EditSubscriptionCreditGrantModal.tsx

435 lines. Query keys:

Response/domain field candidates: `data.cadence`, `data.name?.trim`, `data.credits`, `data.period`, `data.period_count`, `data.expiration_type`, `data.expiration_duration`, `data.expiration_duration_unit`, `data.priority`, `data.metadata`, `data.conversion_rate`, `data.topup_conversion_rate`, `data.start_date`

- Line 252: `Dialog`

```tsx
isOpen={isOpen}
			showCloseButton={false}
			onOpenChange={onOpenChange}
			title={t('creditGrant.subscriptionModal.title')}
			className='sm:max-w-[600px]'
```

- Line 273: `Input`

```tsx
label={t('creditGrant.modal.creditName')}
						placeholder={t('creditGrant.modal.creditNamePlaceholder')}
						value={formData.name || ''}
						onChange={(value) => handleFieldChange('name', value)}
						error={errors.name}
```

- Line 310: `Input`

```tsx
label={t('creditGrant.modal.credits')}
						error={errors.credits}
						placeholder={t('creditGrant.modal.creditsPlaceholder')}
						variant='formatted-number'
						formatOptions={{
							allowDecimals: true,
							allowNegative: false,
							decimalSeparator: '.',
							thousandSeparator: ',',
						}}
						value={formData.credits?.toString() || ''}
						onChange={(value) => handleFieldChange('credits', value)}
```

- Line 330: `Input`

```tsx
className='w-full' value={'1'} disabled suffix='credit'
```

- Line 332: `Input`

```tsx
className='w-full'
							variant='number'
							value={formData.conversion_rate || 1}
							onChange={(value) => {
								handleFieldChange('conversion_rate', parseFloat(value) || 1);
							}}
```

- Line 349: `Input`

```tsx
className='w-full' value={'1'} disabled suffix='credit'
```

- Line 351: `Input`

```tsx
className='w-full'
							variant='number'
							value={formData.topup_conversion_rate || formData.conversion_rate || 1}
							onChange={(value) => {
								handleFieldChange('topup_conversion_rate', parseFloat(value) || formData.conversion_rate || 1);
							}}
```

- Line 366: `Select`

```tsx
label={t('creditGrant.modal.grantPeriod')}
							error={errors.period}
							options={creditGrantPeriodOptions}
							value={formData.period}
							onChange={(value) => handleFieldChange('period', value as CREDIT_GRANT_PERIOD)}
```

- Line 377: `Select`

```tsx
label={t('creditGrant.modal.expiryType')}
						error={errors.expiration_type}
						options={expirationTypeOptions}
						value={formData.expiration_type}
						onChange={(value) => handleFieldChange('expiration_type', value as CREDIT_GRANT_EXPIRATION_TYPE)}
```

- Line 388: `Input`

```tsx
label={t('creditGrant.modal.expiryDays')}
							error={errors.expiration_duration}
							placeholder={t('creditGrant.modal.expiryDaysPlaceholder')}
							variant='formatted-number'
							formatOptions={{
								allowDecimals: false,
								allowNegative: false,
								decimalSeparator: '.',
								thousandSeparator: ',',
							}}
							suffix='days'
							value={formData.expiration_duration?.toString() || ''}
							onChange={(value) => handleFieldChange('expiration_duration', parseInt(value) || undefined)}
```

- Line 407: `Input`

```tsx
label={t('creditGrant.modal.priority')}
						error={errors.priority}
						placeholder={t('creditGrant.modal.priorityPlaceholder')}
						variant='formatted-number'
						formatOptions={{
							allowDecimals: false,
							allowNegative: false,
							decimalSeparator: '.',
							thousandSeparator: ',',
						}}
						value={formData.priority?.toString() || ''}
						onChange={(value) => handleFieldChange('priority', parseInt(value) || 0)}
```

- Line 425: `Button`

```tsx
variant='outline' onClick={onCancel}
```

- Line 428: `Button`

```tsx
onClick={handleSave}
```

## src/components/molecules/CreditGrant/CancelCreditGrantModal.tsx

86 lines. Query keys:

Response/domain field candidates:

- Line 43: `Dialog`

```tsx
isOpen={isOpen}
			showCloseButton={false}
			onOpenChange={onOpenChange}
			title={t('creditGrant.cancelModal.title')}
			className='sm:max-w-[500px]'
```

- Line 74: `Button`

```tsx
variant='outline' onClick={handleCancel}
```

- Line 77: `Button`

```tsx
variant='destructive' onClick={handleConfirm}
```

## src/components/molecules/Subscription/SubscriptionEditCreditGrantsSection.tsx

149 lines. Query keys:

Response/domain field candidates: `row.name`, `row.credits.toString`, `row.priority`, `row.cadence.toLowerCase`, `row.period`, `row.period_count`, `row.id`

- Line 85: `ActionButton`

```tsx
id={row.id}
						copyId={{ entityType: 'Credit Grant' }}
						deleteMutationFn={async () => {}}
						refetchQueryKey='creditGrants'
						entityName={row.name}
						edit={{ enabled: false }}
						archive={{ enabled: false }}
						customActions={[
							{
								text: t('actions.delete'),
								onClick: () => onRequestCancel(row),
								enabled: !readOnly,
							},
						]}
```

- Line 112: `FormHeader`

```tsx
title={t('labels.creditGrants')} variant='sub-header' titleClassName='font-semibold' className='mb-0'
```

- Line 113: `AddButton`

```tsx
onClick={onAddClick} disabled={addDisabled}
```

- Line 116: `FlexpriceTable`

```tsx
showEmptyRow={false} data={creditGrants} columns={columns} variant='no-bordered'
```

- Line 123: `AddButton`

```tsx
onClick={onAddClick} disabled={addDisabled}
```

## src/components/molecules/Subscription/SubscriptionEditInheritingCustomersSection.tsx

231 lines. Query keys:

Response/domain field candidates: `row.customer_id`, `row.customer?.name`, `row.id`, `row.plan?.name`, `row.start_date`, `row.current_period_end`, `customer?.name`

- Line 135: `FormHeader`

```tsx
title={t('subscriptions.inheritingCustomers')}
				variant='sub-header'
				titleClassName='text-lg font-semibold text-content'
				className='mb-0'
```

- Line 141: `AddButton`

```tsx
onClick={handleAddClick} disabled={isAddDisabled}
```

- Line 147: `Dialog`

```tsx
isOpen={addDialogOpen}
				onOpenChange={(open) => {
					setAddDialogOpen(open);
					if (!open) setSelectedCustomers([]);
				}}
				title={t('subscriptions.addCustomersToInherit')}
				className='max-w-2xl sm:max-w-[42rem] w-[calc(100vw-2rem)]'
				descriptionClassName='mt-3'
				showCloseButton={!isAddingInheritance}
```

- Line 158: `CustomerMultiSearchSelect`

```tsx
value={selectedCustomers}
						onChange={setSelectedCustomers}
						excludeId={excludeCustomerIds}
						limit={50}
						searchPlaceholder={t('subscriptions.inheritanceEdit.searchPlaceholder')}
						display={{
							label: t('subscriptions.inheritanceEdit.multiSelectLabel'),
							placeholder: t('subscriptions.inheritanceEdit.multiSelectPlaceholder'),
							className: 'min-w-0',
							triggerClassName: 'min-h-11',
						}}
						options={{ modalPopover: true }}
						disabled={isAddDisabled || isAddingInheritance}
```

- Line 174: `Button`

```tsx
type='button' variant='outline' onClick={() => setAddDialogOpen(false)} disabled={isAddingInheritance}
```

- Line 177: `Button`

```tsx
type='button'
							onClick={handleConfirmAdd}
							disabled={isAddDisabled || isAddingInheritance || selectedCustomers.length === 0}
```

- Line 200: `FlexpriceTable`

```tsx
showEmptyRow={false} data={inheritingSubscriptions} columns={columns} variant='no-bordered'
```

- Line 210: `Dialog`

```tsx
isOpen={childToDetach !== null}
				onOpenChange={(open) => !open && setChildToDetach(null)}
				title={detachTitle}
				description={t('subscriptions.inheritanceNote')}
				titleClassName='text-lg font-normal text-content-heading'
				showCloseButton={!isDetaching}
```

- Line 218: `Button`

```tsx
variant='outline' onClick={() => setChildToDetach(null)} disabled={isDetaching}
```

- Line 221: `Button`

```tsx
onClick={() => childToDetach && removeInheritance(childToDetach.id)} disabled={isDetaching || !childToDetach}
```

## src/components/molecules/Subscription/SubscriptionModifyPreviewSummary.tsx

121 lines. Query keys:

Response/domain field candidates: `data.changed_resources?.line_items`, `data.changed_resources?.subscriptions`, `data.changed_resources?.invoices`, `data.subscription?.latest_invoice`, `row.id`, `row.label`, `row.quantityDisplay`, `row.periodDisplay`

## src/components/molecules/Subscription/SubscriptionLineItemQuantityModifyDialog.tsx

227 lines. Query keys:

Response/domain field candidates:

- Line 139: `Dialog`

```tsx
isOpen={isOpen}
			onOpenChange={handleOpenChange}
			title={step === 'form' ? t('subscriptions.changeQuantity') : t('subscriptions.reviewChanges')}
			description={
				step === 'form' ? (
					<span className='text-sm text-content-tertiary'>
						<Trans
							ns='billing'
							i18nKey='subscriptions.quantityModify.updatingDescription'
							values={{ name: lineItem.display_name }}
							components={{ highlight: <span className='font-medium text-content' /> }}
						/>
					</span>
				) : undefined
			}
			className='sm:max-w-[560px]'
			showCloseButton={!busy}
```

- Line 162: `Input`

```tsx
label={t('subscriptions.quantity')}
									variant='text'
									value={quantityInput}
									onChange={(e) => setQuantityInput(e)}
									placeholder={t('subscriptions.quantityPlaceholder')}
									disabled={busy}
```

- Line 190: `Button`

```tsx
variant='outline' onClick={() => handleOpenChange(false)} disabled={busy}
```

- Line 193: `Button`

```tsx
onClick={() => void handlePreview()} isLoading={isPreviewPending} disabled={busy}
```

- Line 212: `Button`

```tsx
variant='outline' onClick={handleBack} disabled={busy}
```

- Line 215: `Button`

```tsx
onClick={() => void handleApply()} isLoading={isExecutePending} disabled={busy || !confirmedPayload}
```

## src/components/molecules/UpdateSubscriptionDrawer/UpdateSubscriptionDrawer.tsx

119 lines. Query keys: `['updateSubscriptionDrawer', 'activeSubscriptions', open, subscriptionId],`

Response/domain field candidates: `plan?.name`, `subscription.parent_subscription_id`, `subscription?.customer_id`, `subscription?.parent_subscription_id`

- Line 93: `Select`

```tsx
label={t('updateSubscription.parentSubscription')}
						placeholder={t('updateSubscription.selectParent')}
						options={parentOptions}
						value={parentId}
						onChange={(value) => setParentId(value)}
						noOptionsText={t('updateSubscription.noSubscriptionsFound')}
						disabled={readOnly}
```

- Line 106: `Button`

```tsx
variant='outline' onClick={() => onOpenChange(false)}
```

- Line 109: `Button`

```tsx
onClick={handleSave} disabled={readOnly || !hasChanges || isSaving}
```

## src/components/molecules/InvoiceDownloadFormatDialog/InvoiceDownloadFormatDialog.tsx

102 lines. Query keys:

Response/domain field candidates:

- Line 45: `Dialog`

```tsx
isOpen={open}
			onOpenChange={onOpenChange}
			title={t('invoices.details.downloadInvoice')}
			description={t('invoices.details.chooseFormat')}
			className='sm:max-w-md'
```

## src/components/molecules/InvoiceTable/InvoiceStatusModal.tsx

217 lines. Query keys:

Response/domain field candidates: `invoice?.invoice_status`, `invoice?.payment_status`, `invoice.payment_status`, `invoice?.id`, `invoice.invoice_status`, `item.key`, `item.value`

- Line 138: `FormHeader`

```tsx
title={t('invoices.details.updateInvoiceStatus')}
					variant='sub-header'
					subtitle={t('invoices.details.updateInvoiceStatusSubtitle')}
```

- Line 144: `Select`

```tsx
value={status.value}
					options={statusOptions}
					onChange={(e) => setStatus(statusOptions.find((option) => option.value === e) || statusOptions[0])}
					isRadio={true}
```

- Line 160: `Input`

```tsx
placeholder={t('common:form.key')}
												value={item.key}
												onChange={(v) => handleKeyChange(idx, v)}
												className='rounded-lg h-10'
```

- Line 168: `Textarea`

```tsx
placeholder={t('common:form.value')}
												value={item.value}
												onChange={(v) => handleValueChange(idx, v)}
												textAreaClassName='min-h-6 h-6'
												className='rounded-lg'
```

- Line 177: `Button`

```tsx
variant='ghost'
												size='sm'
												className='h-10 w-10 flex-shrink-0'
												onClick={() => handleRemoveMetadata(idx)}
												aria-label={t('common:form.remove')}
```

- Line 189: `AddChargesButton`

```tsx
onClick={handleAddMetadata} label={t('invoices.details.addMore')}
```

- Line 198: `Button`

```tsx
onClick={() => onOpenChange(false)} variant={'outline'} className='btn btn-primary'
```

- Line 201: `Button`

```tsx
disabled={isPending}
						onClick={() => {
							onOpenChange(false);
							updateStatus(status.value);
						}}
						className='btn btn-primary'
```

## src/components/molecules/InvoiceTable/InvoicePaymentStatusModal.tsx

128 lines. Query keys:

Response/domain field candidates: `invoice?.payment_status`, `invoice?.invoice_status`, `invoice?.id`

- Line 88: `FormHeader`

```tsx
title={t('invoices.details.updatePaymentStatus')}
					variant='sub-header'
					subtitle={t('invoices.details.paymentStatusModal.subtitle')}
```

- Line 94: `Select`

```tsx
value={status.value}
					options={paymentOptions}
					isRadio={true}
					onChange={(e) => setstatus(paymentOptions.find((option) => option.value === e) || paymentOptions[0])}
```

- Line 103: `Button`

```tsx
onClick={() => {
							onOpenChange(false);
						}}
						variant={'outline'}
						className='btn btn-primary'
```

- Line 112: `Button`

```tsx
disabled={isPending}
						onClick={() => {
							onOpenChange(false);
							updatePayment({ invoiceId: invoice?.id || '', status: status.value });
						}}
						className='btn btn-primary'
```

## src/components/molecules/InvoiceTable/InvoiceTableMenu.tsx

268 lines. Query keys:

Response/domain field candidates: `data.invoice_status`, `invoice.line_items?.length`, `invoice.id`, `data.id`, `data?.payment_status`, `data?.invoice_status`, `data?.amount_remaining`, `data?.customer_id`, `data?.id`, `data?.invoice_type`, `data?.recalculated_invoice_id`, `data.customer_id`, `data.subscription_id`, `data.currency`

- Line 217: `InvoiceDownloadFormatDialog`

```tsx
open={isDownloadFormatOpen}
				onOpenChange={setIsDownloadFormatOpen}
				isPdfPending={isPdfDownloadPending}
				onSelectPdf={() => downloadInvoicePdfAsync(data.id)}
				onSelectCsv={() => {
					void downloadInvoiceCsvAsync(data).catch(() => undefined);
				}}
				isCsvPending={isCsvDownloadPending}
```

## src/components/molecules/InvoiceTable/InvoiceTable.tsx

123 lines. Query keys:

Response/domain field candidates: `row.invoice_status?.toUpperCase`, `row.invoice_number`, `row.currency`, `row.amount_due`, `row.invoice_status`, `row.customer?.name`, `row.customer?.id`, `row.customer.id`, `row.customer.name`, `row.billing_period`, `row.payment_status`, `row.due_date`, `row.id`

- Line 101: `InvoiceTableMenu`

```tsx
data={row}
```

- Line 110: `FlexpriceTable`

```tsx
showEmptyRow={true}
				onRowClick={(row) => {
					navigate(`/billing/invoices/${row.id}`);
				}}
				columns={columns}
				data={data}
```

## src/components/molecules/InvoiceTable/CustomerInvoiceTable.tsx

109 lines. Query keys:

Response/domain field candidates: `invoice.invoice_type`, `invoice.line_items?.find`, `item.plan_display_name`, `data.some`, `row.invoice_status?.toUpperCase`, `row.invoice_number`, `row.invoice_status`, `row.payment_status`, `row.subscription_customer_id`, `row.customer_id`, `row.subscription_customer`, `row.period_start`, `row.period_end`, `row.currency`, `row.total`, `row.amount_due`

- Line 94: `InvoiceTableMenu`

```tsx
data={row}
```

- Line 103: `FlexpriceTable`

```tsx
showEmptyRow onRowClick={onRowClick} columns={columnData} data={data ?? []}
```

## src/components/molecules/InvoiceLineItemTable/InvoiceLineItemTable.tsx

224 lines. Query keys:

Response/domain field candidates: `item.amount`, `item.display_name`, `item.price_type`, `item.period_start`, `item.period_end`, `item.quantity`, `item.currency`

- Line 58: `FormHeader`

```tsx
variant='sub-header'
						className='!mb-0'
						titleClassName='font-semibold text-content'
						subtitleClassName='text-sm text-content-muted !mb-0 !mt-1'
						title={title}
						subtitle={subtitle}
```

- Line 68: `Button`

```tsx
onClick={() => {
									const icon = document.querySelector('.refresh-icon');
									icon?.classList.add('animate-spin');
									refetch();
									icon?.classList.remove('animate-spin');
								}}
								variant='outline'
								size='sm'
```

## src/components/molecules/InvoiceLineItemTable/SubscriptionPreviewLineItemTable.tsx

168 lines. Query keys:

Response/domain field candidates: `item.display_name`, `item.price_type`, `item.period_start`, `item.period_end`, `item.quantity`, `item.amount`, `item.currency`

- Line 50: `FormHeader`

```tsx
variant='sub-header'
					className='!mb-0'
					titleClassName='font-semibold text-content'
					subtitleClassName='text-sm text-content-muted !mb-0 !mt-1'
					title={title}
					subtitle={subtitle}
```

- Line 60: `Button`

```tsx
onClick={() => {
								const icon = document.querySelector('.refresh-icon');
								icon?.classList.add('animate-spin');
								refetch();
								icon?.classList.remove('animate-spin');
							}}
							variant='outline'
							size='sm'
```

## src/components/molecules/InvoiceCreditLineItemTable/InvoiceCreditLineItemTable.tsx.tsx

86 lines. Query keys:

Response/domain field candidates: `data.length`, `data?.map`, `item.display_name`, `item.quantity`, `item.amount`, `item.currency`

- Line 33: `FormHeader`

```tsx
className='!mb-0' title={title} variant='form-component-title' titleClassName='font-semibold'
```

## src/components/molecules/InvoicePaymentsTable/InvoicePaymentsTable.tsx

200 lines. Query keys:

Response/domain field candidates: `data?.length`

- Line 177: `PaymentTableMenu`

```tsx
payment={payment}
```

- Line 194: `FlexpriceTable`

```tsx
showEmptyRow columns={columns} data={data}
```

## src/components/molecules/CreditNoteTable/CreditNoteTable.tsx

107 lines. Query keys:

Response/domain field candidates: `row.credit_note_number`, `row.id.slice`, `row.currency`, `row.total_amount`, `row.credit_note_status`, `row.credit_note_type`, `row.invoice_id`, `row.invoice?.invoice_number`, `row.invoice_id.slice`, `row.customer?.id`, `row.customer?.name`, `row.customer?.external_id`, `row.created_at`, `row.id`

- Line 94: `FlexpriceTable`

```tsx
showEmptyRow={true}
				onRowClick={(row) => {
					navigate(`${RouteNames.creditNotes}/${row.id}`);
				}}
				columns={columns}
				data={data}
```

## src/components/molecules/CreditNoteTable/CreditNoteLineItemTable.tsx

83 lines. Query keys:

Response/domain field candidates: `data.length`, `data?.map`, `item.id`, `item.display_name`, `item.amount`, `item.currency`

- Line 32: `FormHeader`

```tsx
className='!mb-0' title={title} variant='form-component-title' titleClassName='font-medium'
```

## src/components/molecules/CreditGrant/CreditGrantModal.tsx

388 lines. Query keys:

Response/domain field candidates: `data.conversion_rate`, `data.id`, `data.name?.trim`, `data.scope`, `data.cadence`, `data.credits`, `data.plan_id`, `data.subscription_id`, `data.period`, `data.period_count`, `data.expiration_type`, `data.expiration_duration`, `data.expiration_duration_unit`, `data.priority`, `data.metadata`, `data.topup_conversion_rate`

- Line 236: `Dialog`

```tsx
isOpen={isOpen}
			showCloseButton={false}
			onOpenChange={onOpenChange}
			title={isEdit ? t('creditGrant.modal.titleEdit') : t('creditGrant.modal.titleAdd')}
			className='sm:max-w-[600px]'
```

- Line 258: `Input`

```tsx
placeholder={t('creditGrant.modal.creditNamePlaceholder')}
						value={formData.name || ''}
						onChange={(value) => handleFieldChange('name', value)}
						error={errors.name}
```

- Line 268: `Input`

```tsx
error={errors.credits}
						placeholder={t('creditGrant.modal.creditsPlaceholder')}
						variant='number'
						formatOptions={{
							allowDecimals: true,
							allowNegative: false,
							decimalSeparator: '.',
							thousandSeparator: ',',
						}}
						value={formData.credits?.toString() || ''}
						onChange={(value) => handleFieldChange('credits', value)}
```

- Line 287: `Input`

```tsx
className='w-full' value={'1'} disabled suffix='credit'
```

- Line 289: `Input`

```tsx
className='w-full'
							variant='number'
							value={formData.conversion_rate?.toString() || ''}
							onChange={(value) => handleFieldChange('conversion_rate', value)}
```

- Line 304: `Input`

```tsx
className='w-full' value={'1'} disabled suffix='credit'
```

- Line 306: `Input`

```tsx
className='w-full'
							variant='number'
							value={formData.topup_conversion_rate?.toString() || formData.conversion_rate?.toString() || ''}
							onChange={(value) => handleFieldChange('topup_conversion_rate', value)}
```

- Line 320: `Select`

```tsx
error={errors.period}
							options={creditGrantPeriodOptions}
							value={formData.period}
							onChange={(value) => handleFieldChange('period', value as CREDIT_GRANT_PERIOD)}
```

- Line 331: `Select`

```tsx
error={errors.expiration_type}
						options={expirationTypeOptions}
						value={formData.expiration_type}
						onChange={(value) => handleFieldChange('expiration_type', value as CREDIT_GRANT_EXPIRATION_TYPE)}
```

- Line 342: `Input`

```tsx
error={errors.expiration_duration}
							placeholder={t('creditGrant.modal.expiryDaysPlaceholder')}
							variant='formatted-number'
							formatOptions={{
								allowDecimals: false,
								allowNegative: false,
								decimalSeparator: '.',
								thousandSeparator: ',',
							}}
							suffix='days'
							value={formData.expiration_duration?.toString() || ''}
							onChange={(value) => handleFieldChange('expiration_duration', parseInt(value) || undefined)}
```

- Line 361: `Input`

```tsx
error={errors.priority}
						placeholder={t('creditGrant.modal.priorityPlaceholder')}
						variant='formatted-number'
						formatOptions={{
							allowDecimals: false,
							allowNegative: false,
							decimalSeparator: '.',
							thousandSeparator: ',',
						}}
						value={formData.priority?.toString() || ''}
						onChange={(value) => handleFieldChange('priority', parseInt(value) || 0)}
```

- Line 378: `Button`

```tsx
variant='outline' onClick={handleCancel}
```

- Line 381: `Button`

```tsx
onClick={handleSave}
```

## src/components/molecules/CreditGrant/SubscriptionCreditGrantTable.tsx

158 lines. Query keys:

Response/domain field candidates: `data.map`, `data.filter`, `row.credits`, `row.priority?.toString`, `row.cadence.toLowerCase`, `row.period`, `row.period_count`, `row.id`, `row.name`

- Line 114: `ActionButton`

```tsx
id={row.id}
						copyId={{ entityType: 'Credit Grant' }}
						deleteMutationFn={() => handleDelete(row.id)}
						refetchQueryKey='credit_grants'
						entityName={row.name}
						edit={{
							enabled: !disabled,
							onClick: () => handleEdit(row),
						}}
						archive={{
							enabled: !disabled,
							text: t('actions.delete'),
						}}
```

- Line 146: `FormHeader`

```tsx
className='mb-0' title={t('labels.creditGrants')} variant='sub-header'
```

- Line 147: `AddButton`

```tsx
onClick={() => setIsOpen(true)} disabled={disabled}
```

- Line 150: `FlexpriceTable`

```tsx
data={data} columns={columns} showEmptyRow
```

## src/components/molecules/CreditGrant/CreditGrantsTable.tsx

102 lines. Query keys:

Response/domain field candidates: `row.name`, `row.credits.toString`, `row.priority`, `row.cadence.toLowerCase`, `row.period`, `row.period_count`, `row.id`

- Line 74: `ActionButton`

```tsx
id={row.id}
						copyId={{ entityType: 'Credit Grant' }}
						deleteMutationFn={async () => {
							await handleDelete(row);
						}}
						refetchQueryKey='creditGrants'
						entityName={row.name}
						edit={{
							enabled: false,
						}}
						archive={{
							enabled: true,
							text: t('common:actions.delete'),
							icon: <Trash2 />,
							disabled: !canWriteCreditGrant,
							disabledReason: !canWriteCreditGrant ? t('catalog:plans.creditGrantsTab.writeDeniedTooltip') : undefined,
						}}
```

- Line 98: `FlexpriceTable`

```tsx
showEmptyRow={showEmptyRow} data={data} columns={columns}
```

## src/components/molecules/CreditGrant/AddonCreditGrantsSection.tsx

156 lines. Query keys: `['addonCreditGrants', addonId],`

Response/domain field candidates:

- Line 114: `Button`

```tsx
prefixIcon={<Plus />} onClick={() => setCreditGrantModalOpen(true)} disabled={isCreatingCreditGrant}
```

- Line 120: `Button`

```tsx
disabled prefixIcon={<Plus />}
```

- Line 140: `CreditGrantsTable`

```tsx
data={creditGrants}
						onDelete={() => {
							refetchQueries(['addonCreditGrants', addonId]);
						}}
						showEmptyRow
```

## src/components/molecules/CreditGrant/UpcomingCreditGrantApplicationsTable.tsx

102 lines. Query keys:

Response/domain field candidates: `row.credits.toString`, `row.scheduled_for`, `row.subscription_id`, `row.application_status`, `data.length`

- Line 93: `FormHeader`

```tsx
title={t('creditGrant.upcomingApplications.sectionTitle')} variant='sub-header' titleClassName='font-semibold'
```

- Line 95: `FlexpriceTable`

```tsx
data={data} columns={columns} showEmptyRow={false}
```

## src/components/molecules/RecordPaymentTopup/RecordPaymentTopup.tsx

436 lines. Query keys: `['customerWallets', customer_id],`, `['connections', 'published'],`

Response/domain field candidates: `wallet.currency`, `wallet.wallet_type`, `wallet.name`, `wallet.balance`, `wallet.id`

- Line 283: `Textarea`

```tsx
label={t('payments.description')}
				placeholder={t('payments.descriptionPlaceholder')}
				value={formData.description || ''}
				onChange={(value) => setFormData({ ...formData, description: value })}
				error={errors.description}
```

- Line 296: `Input`

```tsx
label={t('payments.referenceId')}
							placeholder={t('payments.referenceIdPlaceholder')}
							value={formData.reference_id || ''}
							onChange={(value) => setFormData({ ...formData, reference_id: value })}
							error={errors.reference_id}
							description={t('payments.referenceIdHint')}
```

- Line 323: `Select`

```tsx
label={t('payments.wallet')}
							placeholder={
								filteredWallets.length === 0
									? t('payments.noPostPaidWallets')
									: filteredWallets.length === 1
										? t('payments.walletAutoSelected')
										: t('payments.chooseWallet')
							}
							options={selectOptions}
							value={formData.wallet_id || (filteredWallets.length > 1 ? '__auto_select__' : '')}
							onChange={(value) => setFormData({ ...formData, wallet_id: value === '__auto_select__' ? '' : value })}
							error={errors.wallet_id}
							description={t('payments.walletHint')}
							disabled={filteredWallets.length === 0}
```

- Line 362: `Dialog`

```tsx
isOpen={isOpen}
				onOpenChange={onOpenChange}
				title={t('payments.recordPayment')}
				className='sm:max-w-[500px]'
				titleClassName='text-lg font-semibold text-content-zinc-bold'
```

- Line 369: `Input`

```tsx
label={t('payments.amount')}
						placeholder={t('payments.amountPlaceholder')}
						variant='formatted-number'
						inputPrefix={getCurrencySymbol(currency)}
						value={formData.amount.toString()}
						onChange={(value) => setFormData({ ...formData, amount: Number(value) || 0 })}
						error={errors.amount}
						description={max_amount ? t('payments.amountDueInline', { amount: `${getCurrencySymbol(currency)}${max_amount}` }) : undefined}
```

- Line 380: `Select`

```tsx
label={t('payments.paymentMethod')}
						placeholder={t('payments.selectPaymentMethod')}
						options={paymentMethodOptions}
						value={formData.payment_method_type}
						onChange={(value) => {
							setFormData({
								...formData,
								payment_method_type: value as PAYMENT_METHOD_TYPE,
								selected_connection_id: '',
								reference_id: '',
								description: '',
								wallet_id: '',
								recorded_at: undefined,
							});
						}}
						error={errors.payment_method_type}
```

- Line 400: `Select`

```tsx
label={t('payments.paymentProvider')}
							placeholder={t('payments.selectPaymentProvider')}
							options={providerOptions}
							value={formData.selected_connection_id}
							onChange={(connectionId) => setFormData({ ...formData, selected_connection_id: connectionId })}
							error={errors.selected_connection_id}
```

- Line 413: `Button`

```tsx
variant='outline' onClick={() => onOpenChange(false)} className='me-2'
```

- Line 416: `Button`

```tsx
onClick={handleSubmit} disabled={isPending || !formData.payment_method_type} isLoading={isPending}
```

- Line 423: `PaymentUrlSuccessDialog`

```tsx
isOpen={paymentUrlPopup.isOpen}
				paymentUrl={paymentUrlPopup.paymentUrl}
				isCopied={paymentUrlPopup.isCopied}
				onClose={handleCloseUrlPopup}
				onCopyUrl={handleCopyUrl}
				onGoToLink={handleGoToLink}
```

## src/components/molecules/Wallet/CustomerWalletTransactionsTable.tsx

119 lines. Query keys:

Response/domain field candidates: `wallet.table.emptyCell`, `wallet.table.columnTransactions`, `wallet.table.columnPaymentDate`, `wallet.table.columnExpiryDate`, `wallet.table.columnPriority`, `wallet.table.columnAmount`

- Line 115: `FlexpriceTable`

```tsx
columns={columnData} data={data}
```

## src/components/molecules/Wallet/AllWalletTransactionsTable.tsx

144 lines. Query keys:

Response/domain field candidates: `wallet.table.emptyCell`, `wallet.table.columnCustomer`, `customer?.name`, `customer?.email`, `wallet.table.columnTransactionReason`, `wallet.table.columnDate`, `wallet.table.columnCreatedBy`, `wallet.table.columnAmount`

- Line 140: `FlexpriceTable`

```tsx
showEmptyRow columns={columnData} data={data}
```

## src/components/molecules/WalletTopupCard/WalletTopupCard.tsx

416 lines. Query keys: `['topupWallet', walletId],`

Response/domain field candidates: `wallet.topup.typeFree`, `wallet.topup.typeFreeDesc`, `wallet.topup.typePurchased`, `wallet.topup.typePurchasedDesc`, `response?.checkout_session?.payment_action?.redirect_url`, `response?.checkout_session?.payment_url`, `wallet.topup.dialogTitle`, `wallet.topup.creditTypeTitle`, `wallet.topup.typeHintPurchased`, `wallet.topup.typeHintFree`, `wallet.topup.creditsLabel`, `wallet.topup.creditsPlaceholder`, `wallet.topup.creditPreviewSuffix`, `wallet.topup.expiryDate`, `wallet.topup.priority`, `wallet.topup.priorityPlaceholder`, `wallet.topup.referenceId`, `wallet.topup.referenceIdPlaceholder`, `wallet.topup.referenceIdDescription`, `wallet.topup.descriptionOptional`, `wallet.topup.descriptionPlaceholder`, `wallet.topup.descriptionHint`, `wallet.topup.skipInvoice`, `wallet.topup.generateInvoiceAction`, `wallet.topup.checkoutLink`, `wallet.topup.addCredits`

- Line 248: `DialogContent`

```tsx
className='bg-surface sm:max-w-[600px]'
```

- Line 249: `PaymentUrlSuccessDialog`

```tsx
isOpen={checkoutPopup.isOpen}
				paymentUrl={checkoutPopup.paymentUrl}
				isCopied={checkoutPopup.isCopied}
				onClose={() => setCheckoutPopup({ isOpen: false, paymentUrl: '', isCopied: false })}
				onCopyUrl={handleCopyCheckoutUrl}
				onGoToLink={() => openPaymentUrl(checkoutPopup.paymentUrl)}
```

- Line 257: `DialogHeader`

```tsx

```

- Line 258: `DialogTitle`

```tsx

```

- Line 290: `Input`

```tsx
variant='formatted-number'
					onChange={(e) => updateTopupPayload({ credits_to_add: e as unknown as number })}
					value={topupPayload.credits_to_add ?? ''}
					suffix={t('payments.transactions.creditsSuffix')}
					label={t('wallet.topup.creditsLabel')}
					placeholder={t('wallet.topup.creditsPlaceholder')}
					description={
						<>
							{topupPayload.credits_to_add && topupPayload.credits_to_add > 0 && (
								<span>
									{getCurrencySymbol(currency!)}
									{getCurrencyAmountFromCredits(conversion_rate, topupPayload.credits_to_add ?? 0)}
									{t('wallet.topup.creditPreviewSuffix')}
								</span>
							)}
						</>
					}
```

- Line 332: `Input`

```tsx
label={t('wallet.topup.priority')}
					className='w-full'
					placeholder={t('wallet.topup.priorityPlaceholder')}
					// Guarded like the sibling fields: priority starts undefined, which makes
					// the input uncontrolled until the first keystroke and warns on the switch.
					value={topupPayload.priority ?? ''}
					onChange={(e) => {
						if (e) {
							updateTopupPayload({ priority: Number(e) });
						} else {
							updateTopupPayload({ priority: undefined });
						}
					}}
```

- Line 353: `Input`

```tsx
label={t('wallet.topup.referenceId')}
						className='w-full'
						placeholder={t('wallet.topup.referenceIdPlaceholder')}
						value={topupPayload.reference_id || ''}
						onChange={(e) => updateTopupPayload({ reference_id: e as string })}
						description={t('wallet.topup.referenceIdDescription')}
```

- Line 362: `Input`

```tsx
label={t('wallet.topup.descriptionOptional')}
						className='w-full'
						placeholder={t('wallet.topup.descriptionPlaceholder')}
						value={topupPayload.description || ''}
						onChange={(e) => updateTopupPayload({ description: e as string })}
						description={t('wallet.topup.descriptionHint')}
```

- Line 381: `Button`

```tsx
variant='outline'
							isLoading={isPending && pendingMode === TopupMode.SkipInvoice}
							onClick={() => handleTopup(TopupMode.SkipInvoice)}
							disabled={isPending}
```

- Line 388: `Button`

```tsx
variant='outline'
							isLoading={isPending && pendingMode === TopupMode.Invoice}
							onClick={() => handleTopup(TopupMode.Invoice)}
							disabled={isPending}
```

- Line 395: `Button`

```tsx
isLoading={isPending && pendingMode === TopupMode.Checkout}
							onClick={() => handleTopup(TopupMode.Checkout)}
							disabled={isPending}
```

- Line 403: `Button`

```tsx
isLoading={isPending}
						onClick={() => handleTopup(TopupMode.SkipInvoice)}
						disabled={isPending || !topupPayload.credits_type}
```

## src/components/molecules/WalletDebitCard/WalletDebitCard.tsx

145 lines. Query keys: `['debitWallet', walletId],`

Response/domain field candidates: `wallet.debit.preview`, `wallet.debit.title`, `wallet.debit.description`, `wallet.debit.creditsToDeduct`, `wallet.debit.creditsPlaceholder`, `wallet.debit.referenceIdOptional`, `wallet.debit.referenceIdPlaceholder`, `wallet.debit.referenceIdDescription`, `wallet.debit.submit`

- Line 106: `Dialog`

```tsx
isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={t('wallet.debit.title')}
			description={t('wallet.debit.description')}
			className='sm:max-w-[600px]'
```

- Line 113: `Input`

```tsx
variant='formatted-number'
					onChange={(e) => updateDebitPayload({ credits: e as unknown as number })}
					value={debitPayload.credits ?? ''}
					suffix={t('payments.transactions.creditsSuffix')}
					label={t('wallet.debit.creditsToDeduct')}
					placeholder={t('wallet.debit.creditsPlaceholder')}
					description={getDescriptionText()}
```

- Line 123: `Input`

```tsx
label={t('wallet.debit.referenceIdOptional')}
					className='w-full'
					placeholder={t('wallet.debit.referenceIdPlaceholder')}
					value={debitPayload.reference_id || ''}
					onChange={(e) => updateDebitPayload({ reference_id: e as string })}
					description={t('wallet.debit.referenceIdDescription')}
```

- Line 135: `Button`

```tsx
isLoading={isPending} onClick={handleDebit} disabled={isPending || !debitPayload.credits}
```

## src/components/molecules/WalletAlertThresholdSection/WalletAlertThresholdRow.tsx

61 lines. Query keys:

Response/domain field candidates:

- Line 44: `Input`

```tsx
aria-label={`${title} — ${description}`}
				placeholder={placeholder}
				value={value}
				onChange={onChange}
				variant='number'
				formatOptions={THRESHOLD_FORMAT_OPTIONS}
				inputMode='decimal'
				disabled={disabled}
				inputPrefix={symbol ? <span className='text-sm text-content-secondary'>{symbol}</span> : undefined}
				suffix={unit}
```

## src/components/molecules/WalletAlertThresholdSection/WalletAlertThresholdSection.tsx

83 lines. Query keys:

Response/domain field candidates:

- Line 51: `ThresholdTypeSelector`

```tsx
value={draft.alert_threshold_type}
				labels={{
					thresholdType: labels.thresholdType,
					thresholdTypeTooltip: labels.thresholdTypeTooltip,
					absolute: labels.thresholdTypeAbsolute,
					percentage: labels.thresholdTypePercentage,
				}}
				disabled={disabled}
				onChange={handleTypeChange}
```

## src/components/molecules/WalletAlertDialog/WalletAlertDialog.tsx

131 lines. Query keys:

Response/domain field candidates: `wallet.alerts.thresholdTypeLabel`, `wallet.alerts.thresholdTypeTooltipAbsolute`, `wallet.alerts.thresholdTypeTooltipPercentage`, `wallet.alerts.thresholdTypeAbsolute`, `wallet.alerts.thresholdTypePercentage`, `wallet.alerts.rowDescription`, `wallet.alerts.amountPlaceholder`, `wallet.alerts.criticalTitle`, `wallet.alerts.warningTitle`, `wallet.alerts.infoTitle`, `wallet.alerts.validation.`, `wallet.alerts.dialogTitle`, `wallet.alerts.enableTitle`, `wallet.alerts.enableDescription`, `wallet.alerts.cancel`, `wallet.alerts.saving`, `wallet.alerts.saveChanges`

- Line 82: `Dialog`

```tsx
className='min-w-max'
			isOpen={open}
			onOpenChange={(isOpen) => {
				if (!isOpen) handleClose();
			}}
			title={t('wallet.alerts.dialogTitle')}
			showCloseButton
```

- Line 99: `Switch`

```tsx
checked={draft.alert_enabled}
							onCheckedChange={(enabled) => setDraft((prev) => setWalletAlertDraftEnabled(prev, enabled))}
							disabled={isSaving}
							aria-label={t('wallet.alerts.enableTitle')}
```

- Line 118: `Button`

```tsx
variant='outline' onClick={handleClose} disabled={isSaving}
```

- Line 121: `Button`

```tsx
onClick={handleSave} disabled={isSaving}
```

## src/components/molecules/AlertSettingsDialog/SpendAlertThresholdCard.tsx

96 lines. Query keys:

Response/domain field candidates:

- Line 57: `Button`

```tsx
variant='ghost' size='sm' onClick={onRemove} disabled={disabled}
```

- Line 61: `Button`

```tsx
variant='outline' size='sm' onClick={onAdd} disabled={disabled}
```

- Line 71: `Input`

```tsx
placeholder={labels.amountPlaceholder}
							value={threshold.threshold}
							onChange={onThresholdChange}
							type='number'
							step='0.01'
							disabled={disabled}
```

- Line 82: `Select`

```tsx
options={conditionOptions}
							value={threshold.condition}
							onChange={(value) => onConditionChange(value as 'above' | 'below')}
							disabled={disabled || conditionDisabled}
```

## src/components/molecules/AlertSettingsDialog/AlertSettingsDialog.tsx

220 lines. Query keys: `['alertSettings', entityType, entityId],`

Response/domain field candidates: `wallet.alerts.validation.`

- Line 165: `Dialog`

```tsx
className='min-w-max'
			isOpen={open}
			onOpenChange={(isOpen) => {
				if (!isOpen) handleClose();
			}}
			title={t(isLineItem ? 'spendAlerts.lineItemDialogTitle' : 'spendAlerts.subscriptionDialogTitle')}
			showCloseButton
			// Rendered inside interactive subscription/line-item table rows; without this, in-dialog
			// clicks bubble through the React tree to the row's onClick and navigate away.
			interactiveContent
```

- Line 207: `Button`

```tsx
variant='outline' onClick={handleClose} disabled={isSaving}
```

- Line 210: `Button`

```tsx
onClick={handleSave} disabled={isSaving || isLoading}
```

## src/components/molecules/WalletAutoTopup/WalletAutoTopup.tsx

284 lines. Query keys:

Response/domain field candidates: `wallet.autoTopup.cooldownUnits.`, `wallet.autoTopup.errors.invalidThreshold`, `wallet.autoTopup.errors.invalidAmount`, `wallet.autoTopup.errors.cooldownIncomplete`, `wallet.autoTopup.errors.cooldownInvalidValue`, `wallet.autoTopup.cooldownDescription`, `wallet.autoTopup.cooldownBurstDescription`, `wallet.autoTopup.cooldownOptionalDescription`, `wallet.autoTopup.dialogTitle`, `wallet.autoTopup.enableTitle`, `wallet.autoTopup.enableLabel`, `wallet.autoTopup.enableDescription`, `wallet.autoTopup.thresholdLabel`, `wallet.autoTopup.thresholdPlaceholder`, `wallet.autoTopup.thresholdDescription`, `wallet.autoTopup.amountLabel`, `wallet.autoTopup.amountPlaceholder`, `wallet.autoTopup.amountDescription`, `wallet.autoTopup.cooldownTitle`, `wallet.autoTopup.cooldownLabel`, `wallet.autoTopup.cooldownValueLabel`, `wallet.autoTopup.cooldownValuePlaceholder`, `wallet.autoTopup.cooldownUnitLabel`, `wallet.autoTopup.cooldownUnitPlaceholder`, `wallet.autoTopup.invoiceTitle`, `wallet.autoTopup.invoiceLabel`, `wallet.autoTopup.invoiceDescriptionWhenInvoiced`, `wallet.autoTopup.invoiceDescriptionImmediate`, `wallet.autoTopup.cancel`, `wallet.autoTopup.saveChanges`

- Line 167: `Dialog`

```tsx
className='min-w-max'
			isOpen={open}
			onOpenChange={(isOpen) => {
				if (!isOpen) handleClose();
			}}
			title={
				<div className='flex items-center gap-2'>
					<span className='text-lg font-medium'>{t('wallet.autoTopup.dialogTitle')}</span>
					<PremiumFeatureIcon />
				</div>
			}
			showCloseButton
```

- Line 195: `Input`

```tsx
label={t('wallet.autoTopup.thresholdLabel')}
								placeholder={t('wallet.autoTopup.thresholdPlaceholder')}
								value={localConfig.threshold}
								onChange={(value) => setLocalConfig({ ...localConfig, threshold: value })}
								type='number'
								step='0.01'
								description={t('wallet.autoTopup.thresholdDescription')}
```

- Line 208: `Input`

```tsx
label={t('wallet.autoTopup.amountLabel')}
								placeholder={t('wallet.autoTopup.amountPlaceholder')}
								value={localConfig.amount}
								onChange={(value) => setLocalConfig({ ...localConfig, amount: value })}
								type='number'
								step='0.01'
								min='0'
								description={t('wallet.autoTopup.amountDescription')}
```

- Line 233: `Input`

```tsx
label={t('wallet.autoTopup.cooldownValueLabel', { defaultValue: 'Duration' })}
									placeholder={t('wallet.autoTopup.cooldownValuePlaceholder', { defaultValue: 'e.g. 1' })}
									value={cooldownValue}
									onChange={setCooldownValue}
									variant='integer'
									formatOptions={{
										allowDecimals: false,
										allowNegative: false,
										decimalSeparator: '.',
										thousandSeparator: ',',
									}}
```

- Line 246: `Select`

```tsx
label={t('wallet.autoTopup.cooldownUnitLabel', { defaultValue: 'Unit' })}
									options={cooldownUnitOptions}
									value={cooldownUnit || undefined}
									placeholder={t('wallet.autoTopup.cooldownUnitPlaceholder', { defaultValue: 'Select unit' })}
									onChange={(value) => setCooldownUnit((value as DurationUnit) || '')}
```

- Line 273: `Button`

```tsx
variant='outline' onClick={handleClose}
```

- Line 276: `Button`

```tsx
onClick={handleSave}
```

## src/components/molecules/TerminateWalletModal/TerminateWalletModal.tsx

58 lines. Query keys:

Response/domain field candidates: `wallet?.id`, `wallet.terminate.title`, `wallet.terminate.subtitle`, `wallet.terminate.cancel`, `wallet.terminate.confirm`

- Line 36: `FormHeader`

```tsx
title={t('wallet.terminate.title')} variant='sub-header' subtitle={t('wallet.terminate.subtitle')}
```

- Line 39: `Button`

```tsx
onClick={() => onOpenChange(false)} variant={'outline'} className='btn btn-primary'
```

- Line 42: `Button`

```tsx
disabled={isPending}
						onClick={() => {
							onOpenChange(false);
							terminateWallet();
						}}
						className='btn btn-primary'
```

## src/components/molecules/PlansTable/PlansTable.tsx

80 lines. Query keys:

Response/domain field candidates: `data?.map`, `row.status`, `row.updated_at`, `row.id`

- Line 47: `ActionButton`

```tsx
id={row.id}
						copyId={{ entityType: 'Plan' }}
						deleteMutationFn={(id) => PlanApi.deletePlan(id)}
						refetchQueryKey='fetchPlans'
						entityName={t('plans.listPage.entityName')}
						edit={{
							path: `${RouteNames.plan}/edit-plan?id=${row.id}`,
							onClick: () => onEdit(row),
						}}
						archive={{
							enabled: row.status === ENTITY_STATUS.PUBLISHED,
						}}
```

- Line 68: `FlexpriceTable`

```tsx
columns={columns}
			data={mappedData}
			showEmptyRow
			onRowClick={(row) => {
				navigate(RouteNames.plan + `/${row.id}`);
			}}
```

## src/components/molecules/PlanDrawer/PlanDrawer.tsx

224 lines. Query keys: `[SIDEBAR_PRICING_PROMO_QUERY_KEY], exact: false });`

Response/domain field candidates: `data?.name`, `data?.description`, `data?.lookup_key`, `data?.metadata`, `data?.id`, `data.metadata`, `data.id`, `data.name`, `data.description`, `data.lookup_key`

- Line 164: `Input`

```tsx
placeholder={t('catalog:plans.drawer.namePlaceholder')}
				description={t('catalog:plans.drawer.nameHelp')}
				label={t('catalog:plans.drawer.planName')}
				value={formData.name}
				error={errors.name}
				onChange={(e) => {
					setFormData({ ...formData, name: e });
				}}
```

- Line 176: `Input`

```tsx
label={t('catalog:shared.lookupKey')}
				error={errors.lookup_key}
				onChange={(e) => {
					setFormData({ ...formData, lookup_key: e });
				}}
				value={formData.lookup_key}
				placeholder={t('catalog:plans.drawer.lookupPlaceholder')}
				description={t('catalog:shared.lookupKeyDescription')}
```

- Line 188: `Textarea`

```tsx
value={formData.description}
				onChange={(e) => {
					setFormData({ ...formData, description: e });
				}}
				className='min-h-[100px]'
				placeholder={t('catalog:shared.enterDescription')}
				label={t('catalog:features.drawer.descriptionLabel')}
				description={t('catalog:plans.drawer.purposeDescription')}
```

- Line 200: `Textarea`

```tsx
value={metadataString}
				onChange={(e) => {
					setMetadataString(e);
					if (errors.metadata) {
						setErrors({ ...errors, metadata: undefined });
					}
				}}
				error={errors.metadata}
				className='min-h-[100px]'
				placeholder={t('catalog:shared.metadataPlaceholder')}
				label={t('catalog:shared.metadataOptional')}
				description={t('catalog:shared.metadataJsonStringsOnly')}
```

- Line 216: `Button`

```tsx
isLoading={isPending} disabled={isPending || !formData.name?.trim() || !formData.lookup_key?.trim()} onClick={handleSave}
```

## src/components/molecules/DuplicatePlanDialog/DuplicatePlanDialog.tsx

185 lines. Query keys:

Response/domain field candidates: `plan.name`, `plan.lookup_key`, `data.id`

- Line 120: `Dialog`

```tsx
isOpen={open}
			onOpenChange={onOpenChange}
			title={t('catalog:plans.duplicate.title')}
			description={t('catalog:plans.duplicate.description')}
			showCloseButton={true}
```

- Line 126: `Input`

```tsx
label={t('catalog:plans.drawer.planName')}
				placeholder={t('catalog:plans.drawer.namePlaceholder')}
				description={t('catalog:plans.drawer.nameHelp')}
				value={name}
				error={errors.name}
				onChange={(e) => {
					setName(e);
					if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
				}}
```

- Line 138: `Input`

```tsx
label={t('catalog:shared.lookupKey')}
				placeholder={t('catalog:plans.drawer.lookupPlaceholder')}
				description={t('catalog:shared.lookupKeyDescription')}
				value={lookupKey}
				error={errors.lookup_key}
				onChange={(e) => {
					setLookupKey(e);
					if (errors.lookup_key) setErrors((prev) => ({ ...prev, lookup_key: undefined }));
				}}
```

- Line 150: `Textarea`

```tsx
value={description}
				onChange={(e) => setDescription(e)}
				className='min-h-[100px]'
				placeholder={t('catalog:shared.enterDescription')}
				label={t('catalog:features.drawer.descriptionLabel')}
				description={t('catalog:plans.drawer.purposeDescription')}
```

- Line 159: `Textarea`

```tsx
value={metadataString}
				onChange={(e) => {
					setMetadataString(e);
					if (errors.metadata) setErrors((prev) => ({ ...prev, metadata: undefined }));
				}}
				error={errors.metadata}
				className='min-h-[100px]'
				placeholder={t('catalog:shared.metadataPlaceholder')}
				label={t('catalog:shared.metadataOptional')}
				description={t('catalog:shared.metadataJsonStringsOnly')}
```

- Line 173: `Button`

```tsx
variant='outline' onClick={() => onOpenChange(false)} disabled={isPending}
```

- Line 176: `Button`

```tsx
onClick={handleSubmit} disabled={isPending || !name?.trim() || !lookupKey?.trim()} isLoading={isPending}
```

## src/components/molecules/Plan/PlanHeader.tsx

60 lines. Query keys: `['fetchPlan', planId],`

Response/domain field candidates: `plan?.name`, `plan?.id`, `plan.id`

- Line 51: `CopyIdButton`

```tsx
id={plan.id} entityType='Plan'
```

## src/components/molecules/PricingCard/PricingCard.tsx

671 lines. Query keys:

Response/domain field candidates: `price.displayType`, `price.is_percentage`, `price.amount`, `price.currency`, `price.billingPeriod`

- Line 441: `Button`

```tsx
onClick={() => {
							onSelectPlan(id);
						}}
						className={cn(
							'w-full py-3 text-sm font-medium transition-colors',
							visualModern
								? 'rounded-xl border border-line-slate bg-surface text-content-slate shadow-sm hover:bg-surface-cool'
								: 'rounded-2xl bg-surface-subtle text-content hover:bg-surface-shell',
						)}
						variant='outline'
```

## src/components/molecules/UpdatePriceDialog/UpdatePriceDialog.tsx

518 lines. Query keys:

Response/domain field candidates: `price.billing_model`, `price.tier_mode`, `price.bucket_size`, `price.meter_id`, `price.meter`, `price.meter?.aggregation?.bucket_size`, `price.price_unit_type`, `price.price_unit_amount`, `price.price_unit_config?.amount`, `price.price_unit_tiers`, `price.price_unit_tiers.length`, `price.price_unit_tiers.map`, `price.amount`, `price.tiers`, `price.tiers.length`, `price.tiers.map`, `price.transform_quantity`, `price.metadata`, `price.id`, `price.meter?.name`, `price.price_unit_config?.price_unit`, `price.price_unit`, `price.currency`, `price.description`, `price.type`, `price.transform_quantity.divide_by`

- Line 347: `Dialog`

```tsx
isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={
				<div className='flex items-center gap-2'>
					<span>{t('priceDialogs.updateTitle')}</span>
					<PremiumFeatureIcon side='right' align='center' sideOffset={10} />
				</div>
			}
			description={t('priceDialogs.updatePricingDescription', { name: chargeDisplayName })}
			className='w-auto min-w-[32rem] max-w-[90vw]'
```

- Line 368: `Select`

```tsx
value={overrideBillingModel}
								onChange={(value) => setOverrideBillingModel(value as BILLING_MODEL)}
								options={billingModelOptions}
								placeholder={t('priceDialogs.selectBillingModel')}
```

- Line 380: `Select`

```tsx
value={overrideBucketSize}
								onChange={(value) => setOverrideBucketSize(value as PriceBucketSize)}
								options={priceBucketSizeOptions}
								placeholder={t('priceDialogs.bucketSizePlaceholder')}
								disabled={!!meterBucketSize}
								description={meterBucketSize ? t('priceDialogs.bucketSizeSetOnMeter', { bucketSize: meterBucketSize }) : undefined}
```

- Line 398: `Input`

```tsx
type='formatted-number'
								value={overrideAmount}
								onChange={setOverrideAmount}
								placeholder={showAsPercentage ? t('priceDialogs.enterNewPercentageOptional') : t('priceDialogs.enterNewAmountOptional')}
								suffix={showAsPercentage ? '%' : displaySymbol}
								className='w-full'
```

- Line 412: `VolumeTieredPricingForm`

```tsx
tieredPrices={
									overrideTiers.length > 0
										? overrideTiers.map((tier, index) => {
												let from: number;
												let up_to: number | null;

												if (index === 0) {
													from = 0;
													up_to = overrideTiers[0]?.up_to || null;
												} else {
													from = overrideTiers[index - 1]?.up_to || 0;
													up_to = overrideTiers[index]?.up_to || null;
												}

												return {
													from,
													up_to,
													unit_amount: tier.unit_amount || '',
													flat_amount: tier.flat_amount || '0',
												};
											})
										: [{ from: 0, up_to: null, unit_amount: '', flat_amount: '0' }]
								}
								setTieredPrices={(setter) => {
									const newTiers =
										typeof setter === 'function'
											? setter(
													overrideTiers.length > 0
														? overrideTiers.map((tier, index) => ({
																from: index === 0 ? 0 : overrideTiers[index - 1]?.up_to || 0,
																up_to: tier.up_to || null,
																unit_amount: tier.unit_amount || '',
																flat_amount: tier.flat_amount || '0',
															}))
														: [{ from: 0, up_to: null, unit_amount: '', flat_amount: '0' }],
												)
											: setter;

									const convertedTiers = newTiers.map((tier) => ({
										unit_amount: tier.unit_amount || '',
										flat_amount: tier.flat_amount || '0',
										up_to: tier.up_to,
									}));
									setOverrideTiers(convertedTiers);
								}}
								currency={isCustomPriceUnit ? displaySymbol : price.currency}
								tierMode={overrideBillingModel === BILLING_MODEL.TIERED ? TIER_MODE.VOLUME : TIER_MODE.SLAB}
```

- Line 469: `Input`

```tsx
type='number'
									value={overrideTransformQuantity?.divide_by || ''}
									onChange={(value) =>
										setOverrideTransformQuantity({
											...overrideTransformQuantity,
											divide_by: Number(value) || 1,
										})
									}
									placeholder={t('priceDialogs.enterUnitsPerPackage')}
									className='w-full'
```

- Line 505: `Button`

```tsx
variant='outline' onClick={handleCancel} disabled={isLoading} className='flex-1'
```

- Line 508: `Button`

```tsx
onClick={handleUpdate} className='flex-1' disabled={!hasChanges() || isLoading} isLoading={isLoading}
```

## src/components/molecules/UpdatePriceDetailsDrawer/UpdatePriceDetailsDrawer.tsx

184 lines. Query keys:

Response/domain field candidates: `price?.display_name`, `price?.description`, `price?.lookup_key`, `price?.metadata`, `price.metadata`, `price?.group_id`, `price.id`, `price.display_name`, `price.description`, `price.lookup_key`, `price.group_id`

- Line 122: `Input`

```tsx
label={t('catalog:prices.updateDrawer.displayName')}
					placeholder={t('catalog:prices.updateDrawer.displayNamePlaceholder')}
					value={formData.display_name || ''}
					onChange={(e) => {
						setFormData({ ...formData, display_name: e });
					}}
```

- Line 131: `Textarea`

```tsx
label={t('catalog:prices.updateDrawer.descriptionLabel')}
					placeholder={t('catalog:shared.enterDescription')}
					value={formData.description || ''}
					onChange={(e) => {
						setFormData({ ...formData, description: e });
					}}
					className='min-h-[100px]'
```

- Line 141: `Input`

```tsx
label={t('catalog:prices.updateDrawer.lookupKey')}
					placeholder={t('catalog:prices.updateDrawer.lookupKeyPlaceholder')}
					value={formData.lookup_key || ''}
					onChange={(e) => {
						setFormData({ ...formData, lookup_key: e });
					}}
```

- Line 150: `Textarea`

```tsx
value={formData.metadata}
					onChange={(e) => {
						setFormData({ ...formData, metadata: e });
						if (errors.metadata) {
							setErrors({ ...errors, metadata: undefined });
						}
					}}
					error={errors.metadata}
					className='min-h-[100px]'
					placeholder={t('catalog:shared.metadataPlaceholder')}
					label={t('catalog:shared.metadataOptional')}
					description={t('catalog:shared.metadataJsonStringsOnly')}
```

- Line 165: `SelectGroup`

```tsx
label={t('catalog:prices.updateDrawer.group')}
					placeholder={t('catalog:prices.updateDrawer.groupPlaceholder')}
					value={formData.group_id}
					onChange={(group) => setFormData({ ...formData, group_id: group?.id ?? '' })}
					entityType={GROUP_ENTITY_TYPE.PRICE}
					showLookupKey={false}
```

- Line 175: `Button`

```tsx
isLoading={isPending} disabled={isPending} onClick={handleSave}
```

## src/components/molecules/PriceUnitDrawer/PriceUnitDrawer.tsx

277 lines. Query keys:

Response/domain field candidates: `data?.name`, `data?.code`, `data?.symbol`, `data?.base_currency`, `data?.conversion_rate`, `data?.metadata`, `data?.id`, `data.metadata`, `data.id`, `data.name`, `data.code`, `data.symbol`, `data.base_currency`, `data.conversion_rate`

- Line 186: `Input`

```tsx
placeholder={t('catalog:priceUnits.drawer.namePlaceholder')}
				description={t('catalog:priceUnits.drawer.nameHelp')}
				label={t('catalog:priceUnits.drawer.name')}
				value={formData.name}
				error={errors.name}
				onChange={(e) => {
					setFormData({ ...formData, name: e });
				}}
```

- Line 198: `Input`

```tsx
label={t('catalog:priceUnits.drawer.code')}
				error={errors.code}
				onChange={(e) => {
					setFormData({ ...formData, code: e });
				}}
				value={formData.code}
				placeholder={t('catalog:priceUnits.drawer.codePlaceholder')}
				disabled={isEdit}
```

- Line 210: `Input`

```tsx
label={t('catalog:priceUnits.drawer.symbol')}
				error={errors.symbol}
				onChange={(e) => {
					setFormData({ ...formData, symbol: e });
				}}
				value={formData.symbol}
				placeholder={t('catalog:priceUnits.drawer.symbolPlaceholder')}
				description={t('catalog:priceUnits.drawer.symbolHelp')}
```

- Line 222: `Select`

```tsx
label={t('catalog:priceUnits.drawer.baseCurrency')}
				error={errors.base_currency}
				onChange={(value) => {
					setFormData({ ...formData, base_currency: value });
				}}
				value={formData.base_currency}
				options={currencyOptions}
				placeholder={t('catalog:priceUnits.drawer.selectBaseCurrency')}
				description={t('catalog:priceUnits.drawer.baseCurrencyHelp')}
```

- Line 235: `Input`

```tsx
label={t('catalog:priceUnits.drawer.conversionRate')}
				error={errors.conversion_rate}
				onChange={(e) => {
					setFormData({ ...formData, conversion_rate: e });
				}}
				value={formData.conversion_rate}
				placeholder={t('catalog:priceUnits.drawer.conversionPlaceholder')}
				description={t('catalog:priceUnits.drawer.conversionHelp')}
				type='number'
				step='any'
```

- Line 251: `Textarea`

```tsx
value={metadataString}
						onChange={(e) => {
							setMetadataString(e);
							if (errors.metadata) {
								setErrors({ ...errors, metadata: undefined });
							}
						}}
						error={errors.metadata}
						className='min-h-[100px]'
						placeholder={t('catalog:shared.metadataPlaceholder')}
						label={t('catalog:shared.metadataOptional')}
						description={t('catalog:shared.metadataJsonStringsOnly')}
```

- Line 269: `Button`

```tsx
isLoading={isPending} disabled={isPending || !isFormValid} onClick={handleSave}
```

## src/components/molecules/PriceUnitTable/PriceUnitTable.tsx

104 lines. Query keys:

Response/domain field candidates: `row?.base_currency?.toUpperCase`, `row?.conversion_rate`, `row?.status`, `row?.updated_at`, `row?.id`, `row?.name`

- Line 75: `ActionButton`

```tsx
id={row?.id}
						copyId={{ entityType: 'Price Unit' }}
						deleteMutationFn={async () => {
							return await PriceUnitApi.DeletePriceUnit(row?.id);
						}}
						refetchQueryKey='fetchPriceUnits'
						entityName={row?.name}
						edit={{
							enabled: false,
							onClick: () => onEdit?.(row),
						}}
						archive={{
							enabled: row?.status !== ENTITY_STATUS.ARCHIVED,
						}}
```

- Line 98: `FlexpriceTable`

```tsx
data={data} columns={columnData} showEmptyRow
```

## src/components/molecules/CurrencyPriceUnitSelector/CurrencyPriceUnitSelector.tsx

197 lines. Query keys: `['fetchPriceUnitsForSelector'],`

Response/domain field candidates:

- Line 103: `Select`

```tsx
value={value || ''} onValueChange={handleValueChange} disabled={disabled || isLoading}
```

- Line 104: `SelectTrigger`

```tsx
className={cn(disabled && 'cursor-not-allowed')}
```

- Line 109: `SelectContent`

```tsx

```

- Line 115: `SelectItem`

```tsx
value='error' disabled
```

- Line 121: `SelectGroup`

```tsx

```

- Line 122: `SelectLabel`

```tsx

```

- Line 127: `SelectItem`

```tsx
key={option.value} value={option.value}
```

- Line 143: `SelectItem`

```tsx
key={option.value} value={option.value}
```

- Line 160: `SelectGroup`

```tsx

```

- Line 161: `SelectLabel`

```tsx

```

- Line 163: `SelectItem`

```tsx
key={option.value} value={option.value}
```

- Line 173: `SelectItem`

```tsx
key={option.value} value={option.value}
```

- Line 180: `SelectItem`

```tsx
value='no-options' disabled
```

## src/components/molecules/AddonTable/AddonTable.tsx

84 lines. Query keys:

Response/domain field candidates: `row?.status`, `row?.updated_at`, `row?.id`, `row?.name`

- Line 48: `ActionButton`

```tsx
id={row?.id}
						copyId={{ entityType: 'Addon' }}
						deleteMutationFn={async () => {
							return await AddonApi.Delete(row?.id);
						}}
						refetchQueryKey='fetchAddons'
						entityName={row?.name}
						edit={{
							enabled: false,
							onClick: () => onEdit?.(row),
						}}
						archive={{
							enabled: row?.status !== ENTITY_STATUS.ARCHIVED,
						}}
```

- Line 71: `FlexpriceTable`

```tsx
data={data}
				columns={columnData}
				showEmptyRow
				onRowClick={(row) => {
					navigate(RouteNames.addonDetails + `/${row?.id}`);
				}}
```

## src/components/molecules/AddonTable/AddonModal.tsx

121 lines. Query keys: `['addons'],`

Response/domain field candidates: `response.items`

- Line 93: `Select`

```tsx
label={t('addons.subscriptionSheet.addonRequired')}
					placeholder={t('addons.subscriptionSheet.selectAddon')}
					options={addonOptions}
					value={formData.addon_id || ''}
					onChange={(value) => setFormData({ ...formData, addon_id: value })}
					error={errors.addon_id}
```

- Line 110: `Button`

```tsx
variant='outline' onClick={handleCancel}
```

- Line 113: `Button`

```tsx
onClick={handleSave}
```

## src/components/molecules/AddonDrawer/AddonDrawer.tsx

141 lines. Query keys:

Response/domain field candidates: `data.id`

- Line 95: `Input`

```tsx
placeholder={t('addons.drawer.namePlaceholder')}
				description={t('addons.drawer.nameHelp')}
				label={t('addons.drawer.addonName')}
				value={formData.name}
				error={errors.name}
				onChange={(e) => {
					setFormData({
						...formData,
						name: e,
						lookup_key: isEdit ? formData.lookup_key : 'addon-' + e.replace(/\s/g, '-').toLowerCase(),
					});
				}}
```

- Line 111: `Input`

```tsx
label={t('shared.lookupKey')}
				disabled={isEdit}
				error={errors.lookup_key}
				onChange={(e) => setFormData({ ...formData, lookup_key: e })}
				value={formData.lookup_key}
				placeholder={t('addons.drawer.lookupPlaceholder')}
				description={t('shared.lookupKeyDescription')}
```

- Line 122: `Textarea`

```tsx
value={formData.description}
				onChange={(e) => {
					setFormData({ ...formData, description: e });
				}}
				className='min-h-[100px]'
				placeholder={t('shared.enterDescription')}
				label={t('shared.description')}
				description={t('addons.drawer.purposeDescription')}
```

- Line 133: `Button`

```tsx
isLoading={isPending} disabled={isPending || !formData.name?.trim() || !formData.lookup_key?.trim()} onClick={handleSave}
```

## src/components/molecules/FeatureTable/FeatureTable.tsx

146 lines. Query keys:

Response/domain field candidates: `row?.type`, `row?.status`, `row?.updated_at`, `row?.id`, `row?.name`

- Line 108: `ActionButton`

```tsx
id={row?.id}
							copyId={{ entityType: 'Feature' }}
							deleteMutationFn={async () => {
								return await FeatureApi.deleteFeature(row?.id);
							}}
							refetchQueryKey='fetchFeatures'
							entityName={row?.name}
							archive={{
								enabled: row?.status !== ENTITY_STATUS.ARCHIVED,
							}}
							edit={{
								enabled: !!onEdit,
								onClick: onEdit ? () => onEdit(row) : undefined,
							}}
```

- Line 133: `FlexpriceTable`

```tsx
data={data}
				columns={columnData}
				showEmptyRow
				onRowClick={(row) => {
					navigate(RouteNames.featureDetails + `/${row?.id}`);
				}}
```

## src/components/molecules/FeatureAlertDialog/FeatureAlertDialog.tsx

298 lines. Query keys:

Response/domain field candidates:

- Line 200: `Button`

```tsx
variant='ghost' size='sm' onClick={() => handleRemoveThreshold(level)} disabled={isSaving}
```

- Line 204: `Button`

```tsx
variant='outline' size='sm' onClick={() => handleAddThreshold(level)} disabled={isSaving}
```

- Line 214: `Input`

```tsx
placeholder={t('catalog:features.alerts.thresholdPlaceholder')}
								value={threshold.threshold}
								onChange={(value) => handleThresholdChange(level, 'threshold', value)}
								type='number'
								step='0.01'
								disabled={isSaving}
```

- Line 225: `Select`

```tsx
options={[
									{ label: t('catalog:features.alerts.below'), value: 'below' },
									{ label: t('catalog:features.alerts.above'), value: 'above' },
								]}
								value={threshold.condition}
								onChange={(value) => handleThresholdChange(level, 'condition', value)}
								disabled={conditionDisabled || isSaving}
```

- Line 247: `Dialog`

```tsx
className='min-w-max'
			isOpen={open}
			onOpenChange={(isOpen) => {
				if (!isOpen) handleClose();
			}}
			title={t('catalog:features.alerts.dialogTitle')}
			showCloseButton
```

- Line 285: `Button`

```tsx
variant='outline' onClick={handleClose} disabled={isSaving}
```

- Line 288: `Button`

```tsx
onClick={handleSave} disabled={isSaving}
```

## src/components/molecules/FeatureDrawer/FeatureDrawer.tsx

223 lines. Query keys:

Response/domain field candidates: `data?.reporting_unit`, `data.reporting_unit.unit_singular`, `data.reporting_unit.unit_plural`, `data.reporting_unit.conversion_rate`, `data?.name`, `data?.description`, `data?.group_id`, `data?.group?.id`, `data?.unit_singular`, `data?.unit_plural`, `data.id`, `data.name`, `data.description`, `data.group_id`, `data.group?.id`, `data.unit_singular`, `data.unit_plural`

- Line 117: `Input`

```tsx
label={t('catalog:features.drawer.name')}
					placeholder={t('catalog:features.drawer.namePlaceholder')}
					value={formData.name || ''}
					error={errors.name}
					onChange={(e) => {
						setFormData({ ...formData, name: e });
					}}
```

- Line 127: `Textarea`

```tsx
label={t('catalog:features.drawer.descriptionLabel')}
					placeholder={t('catalog:shared.enterDescription')}
					value={formData.description || ''}
					onChange={(e) => {
						setFormData({ ...formData, description: e });
					}}
					className='min-h-[100px]'
```

- Line 137: `SelectGroup`

```tsx
entityType={GROUP_ENTITY_TYPE.FEATURE}
					label={t('catalog:features.drawer.group')}
					placeholder={t('catalog:features.drawer.groupPlaceholder')}
					value={formData.group_id ?? ''}
					onChange={(group) => setFormData({ ...formData, group_id: group?.id ?? '' })}
					showLookupKey={false}
```

- Line 146: `Input`

```tsx
label={t('catalog:features.drawer.unitSingular')}
					placeholder={t('catalog:features.drawer.unitSingularPh')}
					value={formData.unit_singular || ''}
					onChange={(e) => {
						setFormData({ ...formData, unit_singular: e });
					}}
```

- Line 155: `Input`

```tsx
label={t('catalog:features.drawer.unitPlural')}
					placeholder={t('catalog:features.drawer.unitPluralPh')}
					value={formData.unit_plural || ''}
					onChange={(e) => {
						setFormData({ ...formData, unit_plural: e });
					}}
```

- Line 164: `Input`

```tsx
label={t('catalog:features.drawer.displayUnitSingular')}
					placeholder={t('catalog:features.drawer.unitSingularPh')}
					value={formData.reporting_unit?.unit_singular ?? ''}
					onChange={(e) => {
						const pluralSuffix = t('catalog:features.drawer.displayUnitPluralAutoSuffix');
						setFormData({
							...formData,
							reporting_unit: {
								unit_singular: e,
								unit_plural: e ? `${e}${pluralSuffix}` : '',
								conversion_rate: formData.reporting_unit?.conversion_rate ?? '0.01',
							},
						});
					}}
```

- Line 181: `Input`

```tsx
label={t('catalog:features.drawer.displayUnitPlural')}
					placeholder={t('catalog:features.drawer.unitPluralPh')}
					value={formData.reporting_unit?.unit_plural ?? ''}
					onChange={(e) => {
						setFormData({
							...formData,
							reporting_unit: {
								unit_singular: formData.reporting_unit?.unit_singular ?? '',
								unit_plural: e,
								conversion_rate: formData.reporting_unit?.conversion_rate ?? '0.01',
							},
						});
					}}
```

- Line 197: `Input`

```tsx
label={t('catalog:features.drawer.conversionFactor')}
					placeholder={t('catalog:features.drawer.conversionFactorPh')}
					value={formData.reporting_unit?.conversion_rate ?? ''}
					onChange={(e) => {
						setFormData({
							...formData,
							reporting_unit: {
								unit_singular: formData.reporting_unit?.unit_singular ?? '',
								unit_plural: formData.reporting_unit?.unit_plural ?? '',
								conversion_rate: e,
							},
						});
					}}
```

- Line 214: `Button`

```tsx
isLoading={isPending} disabled={isCtaDisabled} onClick={handleSave}
```

## src/components/molecules/JsonEditor/JsonEditor.tsx

269 lines. Query keys:

Response/domain field candidates: `feature.id`

- Line 227: `Button`

```tsx
onClick={handleCopy}
					variant='ghost'
					size='sm'
					className={cn(
						'h-7 text-slate-300 hover:text-content-inverse hover:bg-surface/10',
						copied && 'text-success-soft hover:text-success-soft',
					)}
```

## src/components/molecules/AddEntitlementDrawer/AddEntitlementDrawer.tsx

727 lines. Query keys: `['fetchFeatureById', activeFeature?.id],`, `['createBulkEntitlements', entitlements],`

Response/domain field candidates: `feature.id`, `feature?.name`, `feature?.id`, `feature.type`

- Line 186: `Dialog`

```tsx
isOpen={isOpen} onOpenChange={onOpenChange} title={t('entitlements.displayCalculator.titleFallback')}
```

- Line 196: `Dialog`

```tsx
isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={t('entitlements.displayCalculator.title')}
			description={
				<Trans
					ns='catalog'
					i18nKey='entitlements.displayCalculator.description'
					values={{ displayUnit: displayUnitPlural, baseUnit: resolvedBasePlural }}
					components={{
						strongDisplay: <span className='font-semibold' />,
						strongBase: <span className='font-semibold' />,
					}}
				/>
			}
```

- Line 212: `Input`

```tsx
label={t('entitlements.displayCalculator.valueInDisplayUnitLabel')}
					placeholder={t('entitlements.displayCalculator.enterValuePlaceholder')}
					value={displayValueInput}
					onChange={setDisplayValueInput}
					variant='formatted-number'
					suffix={<span className='text-muted-foreground text-xs'>{displayUnitPlural}</span>}
```

- Line 241: `Button`

```tsx
type='button'
						onClick={() => {
							if (computedUnitValue != null && onConfirm) onConfirm(computedUnitValue);
							onOpenChange(false);
						}}
```

- Line 499: `SelectFeature`

```tsx
disabledFeatures={alreadyAddedFeatureIds}
								onChange={(feature) => {
									// Seed cache so SelectFeature can show the selected label immediately
									// (it resolves display value via ['fetchFeatureById', id]).
									queryClient.setQueryData(['fetchFeatureById', feature.id], feature);

									if (feature.type === FEATURE_TYPE.BOOLEAN) {
										// Automatically add boolean features
										const booleanEntitlement: Partial<Entitlement> = {
											feature: feature,
											feature_id: feature.id,
											feature_type: feature.type,
											is_enabled: true,
										};
										setEntitlements((prev) => [...prev, booleanEntitlement]);
										setSelectedFeatures((prev) => [...prev, feature]);
										setShowSelect(true);
										setErrors({});
									} else {
										// For non-boolean features, show the configuration form
										setActiveFeature(feature);
										setSelectedFeatures((prev) => [...prev, feature]);
										setShowSelect(false);
										setErrors({});
									}
								}}
								label={t('entitlements.addDrawer.featuresLabel')}
								placeholder={t('entitlements.addDrawer.selectFeaturePlaceholder')}
								value={activeFeature?.id}
```

- Line 536: `FormHeader`

```tsx
title={activeFeature?.name} variant='sub-header'
```

- Line 550: `Input`

```tsx
error={errors.usage_limit}
											label={t('entitlements.addDrawer.valueLabel')}
											placeholder={t('entitlements.addDrawer.enterValuePlaceholder')}
											disabled={tempEntitlement.usage_limit === null}
											variant='formatted-number'
											value={
												tempEntitlement.usage_limit === null
													? t('entitlements.addDrawer.unlimitedDisplay')
													: tempEntitlement.usage_limit?.toString() || ''
											}
											onChange={(value) => {
												const numValue = value === '' ? undefined : Number(value);
												setTempEntitlement((prev) => ({
													...prev,
													usage_limit: numValue,
												}));
											}}
											suffix={
												<div className='flex items-center gap-1.5'>
													<span className='text-muted-foreground text-xs font-sans'>
														{featureForForm?.unit_plural?.trim() || t('entitlements.addDrawer.unitsFallback')}
													</span>
													{featureForForm?.reporting_unit != null && (
														<Button
															type='button'
															variant='ghost'
															size='icon'
															className='size-7 shrink-0 text-muted-foreground hover:text-foreground'
															onClick={() => setIsCalculatorOpen(true)}
															aria-label={t('entitlements.addDrawer.calculatorAriaLabel')}>
															<Calculator className='size-4' />
														</Button>
													)}
												</div>
											}
```

- Line 574: `Button`

```tsx
type='button'
															variant='ghost'
															size='icon'
															className='size-7 shrink-0 text-muted-foreground hover:text-foreground'
															onClick={() => setIsCalculatorOpen(true)}
															aria-label={t('entitlements.addDrawer.calculatorAriaLabel')}
```

- Line 588: `Checkbox`

```tsx
id='set-infinite'
											label={t('entitlements.addDrawer.setInfiniteLabel')}
											checked={tempEntitlement.usage_limit === null}
											onCheckedChange={(e) => {
												setTempEntitlement((prev) => ({
													...prev,
													usage_limit: e ? null : undefined,
													usage_reset_period: e ? null : undefined,
												}));
											}}
```

- Line 601: `Select`

```tsx
disabled={tempEntitlement.usage_limit === null || activeFeature.meter?.reset_usage === METER_USAGE_RESET_PERIOD.NEVER}
											error={errors.usage_reset_period}
											label={t('entitlements.addDrawer.usageResetLabel')}
											placeholder={t('entitlements.addDrawer.usageResetPlaceholder')}
											options={entitlementUsageResetOptions}
											description={t('entitlements.addDrawer.usageResetDescription')}
											value={tempEntitlement.usage_reset_period ?? ''}
											onChange={(value) => {
												setTempEntitlement((prev) => ({
													...prev,
													usage_reset_period: value as ENTITLEMENT_USAGE_RESET_PERIOD,
												}));
											}}
```

- Line 649: `Input`

```tsx
error={errors.static_value}
											label={t('entitlements.addDrawer.valueLabel')}
											value={tempEntitlement.static_value === undefined ? '' : tempEntitlement.static_value.toString()}
											placeholder={t('entitlements.addDrawer.enterValuePlaceholder')}
											onChange={(value) => {
												setTempEntitlement((prev) => ({
													...prev,
													static_value: value === '' ? undefined : value,
												}));
											}}
											suffix={
												featureForForm?.reporting_unit != null ? (
													<Button
														type='button'
														variant='ghost'
														size='icon'
														className='size-7 shrink-0 text-muted-foreground hover:text-foreground'
														onClick={() => setIsCalculatorOpen(true)}
														aria-label={t('entitlements.addDrawer.calculatorAriaLabel')}>
														<Calculator className='size-4' />
													</Button>
												) : undefined
											}
```

- Line 662: `Button`

```tsx
type='button'
														variant='ghost'
														size='icon'
														className='size-7 shrink-0 text-muted-foreground hover:text-foreground'
														onClick={() => setIsCalculatorOpen(true)}
														aria-label={t('entitlements.addDrawer.calculatorAriaLabel')}
```

- Line 678: `Button`

```tsx
onClick={handleCancel} variant={'outline'}
```

- Line 681: `Button`

```tsx
onClick={handleAdd}
```

- Line 689: `AddChargesButton`

```tsx
onClick={() => setShowSelect(true)} label={t('entitlements.addDrawer.addAnotherFeature')}
```

- Line 691: `Button`

```tsx
isLoading={isPending} onClick={handleSubmit} disabled={isPending || (!showSelect && !!activeFeature)}
```

- Line 698: `DisplayValueCalculatorDialog`

```tsx
isOpen={isCalculatorOpen}
				onOpenChange={setIsCalculatorOpen}
				unitValue={(() => {
					if (activeFeature?.type === FEATURE_TYPE.METERED) return tempEntitlement.usage_limit ?? undefined;
					if (activeFeature?.type === FEATURE_TYPE.STATIC && tempEntitlement.static_value != null) {
						const n =
							typeof tempEntitlement.static_value === 'string'
								? parseFloat(tempEntitlement.static_value)
								: Number(tempEntitlement.static_value);
						return Number.isFinite(n) ? n : undefined;
					}
					return undefined;
				})()}
				reportingUnit={featureForForm?.reporting_unit}
				baseUnitPlural={featureForForm?.unit_plural?.trim() || t('entitlements.addDrawer.unitsFallback')}
				onConfirm={(unitValue) => {
					if (activeFeature?.type === FEATURE_TYPE.METERED) {
						setTempEntitlement((prev) => ({ ...prev, usage_limit: unitValue }));
					} else if (activeFeature?.type === FEATURE_TYPE.STATIC) {
						setTempEntitlement((prev) => ({ ...prev, static_value: String(unitValue) }));
					}
				}}
```

## src/components/molecules/EntitlementOverrides/EditEntitlementDrawer.tsx

252 lines. Query keys:

Response/domain field candidates: `feature?.name`

- Line 163: `Input`

```tsx
id='edit-entitlement-usage-limit'
							label={t('entitlements.editDrawer.usageLimit')}
							type={isInfinite ? 'text' : 'number'}
							value={isInfinite ? t('entitlements.addDrawer.unlimitedDisplay') : usageLimit}
							onChange={(value) => setUsageLimit(value)}
							placeholder={t('entitlements.editDrawer.enterUsageLimitPlaceholder')}
							disabled={isInfinite}
							description={`${t('entitlements.editDrawer.originalPrefix')} ${originalUsageLabel}`}
```

- Line 179: `Checkbox`

```tsx
id='set-infinite'
								label={t('entitlements.editDrawer.setInfiniteLabel')}
								checked={isInfinite}
								onCheckedChange={(checked) => {
									setIsInfinite(checked);
									if (checked) {
										setUsageLimit('');
									}
								}}
```

- Line 195: `Input`

```tsx
id='edit-entitlement-static-value'
						label={t('entitlements.editDrawer.staticValue')}
						value={staticValue}
						onChange={(value) => setStaticValue(value)}
						placeholder={t('entitlements.editDrawer.enterStaticPlaceholder')}
						description={`${t('entitlements.editDrawer.originalPrefix')} ${entitlement.static_value || t('entitlements.editDrawer.notSet')}`}
```

- Line 209: `Switch`

```tsx
checked={isEnabled} onCheckedChange={setIsEnabled}
```

- Line 236: `Button`

```tsx
variant='outline' onClick={handleCancel}
```

- Line 240: `Button`

```tsx
variant='outline' onClick={handleReset}
```

- Line 244: `Button`

```tsx
onClick={handleSave}
```

## src/components/molecules/EntitlementOverrides/EntitlementOverridesTable.tsx

350 lines. Query keys:

Response/domain field candidates: `feature?.name`, `row.feature?.name`, `row.entity_type?.toLowerCase`, `row.feature_type`, `row.id`

- Line 334: `FlexpriceTable`

```tsx
showEmptyRow columns={columns} data={enrichedEntitlements}
```

- Line 335: `EditEntitlementDrawer`

```tsx
isOpen={drawerOpen}
				onOpenChange={handleCloseDrawer}
				entitlement={selectedEntitlement}
				onSave={handleSaveOverride}
				onReset={handleResetOverride}
```

## src/components/molecules/EntitlementOverrides/EditSubscriptionEntitlementDrawer.tsx

290 lines. Query keys:

Response/domain field candidates: `feature?.name`

- Line 188: `Input`

```tsx
id='subscription-edit-entitlement-usage-limit'
							label={t('entitlements.editDrawer.usageLimit')}
							type={isInfinite ? 'text' : 'number'}
							value={isInfinite ? t('entitlements.addDrawer.unlimitedDisplay') : usageLimit}
							onChange={(value) => setUsageLimit(value)}
							placeholder={t('entitlements.editDrawer.enterUsageLimitPlaceholder')}
							disabled={isInfinite}
							description={
								originalLimit !== undefined || entitlement.isOverrideOfParent
									? `${t('entitlements.editDrawer.originalPrefix')} ${
											originalLimit === null ? t('entitlements.addDrawer.unlimitedDisplay') : (originalLimit ?? '—')
										}${resetPeriod ? t('entitlements.editDrawer.resetsSuffix', { period: resetPeriod.toLowerCase() }) : ''}`
									: undefined
							}
```

- Line 210: `Checkbox`

```tsx
id='subscription-set-infinite'
								label={t('entitlements.editDrawer.setInfiniteLabel')}
								checked={isInfinite}
								onCheckedChange={(checked) => {
									setIsInfinite(checked);
									if (checked) {
										setUsageLimit('');
									}
								}}
```

- Line 228: `Input`

```tsx
value={staticValue}
							onChange={(value) => setStaticValue(value)}
							placeholder={t('entitlements.editDrawer.enterStaticPlaceholder')}
```

- Line 245: `Switch`

```tsx
checked={isEnabled} onCheckedChange={setIsEnabled}
```

- Line 272: `Button`

```tsx
variant='outline' onClick={handleCancel} disabled={isSaving}
```

- Line 276: `Button`

```tsx
variant='outline' onClick={handleReset} disabled={isSaving}
```

- Line 280: `Button`

```tsx
onClick={handleSave} isLoading={isSaving} disabled={isSaving}
```

## src/components/molecules/CouponDrawer/CouponDrawer.tsx

321 lines. Query keys:

Response/domain field candidates: `data.id`, `data?.id`

- Line 167: `Input`

```tsx
placeholder={t('coupons.drawer.namePlaceholder')}
					description={t('coupons.drawer.nameHelp')}
					label={t('coupons.drawer.couponName')}
					value={formData.name}
					error={errors.name}
					onChange={(e) => {
						setFormData({
							...formData,
							name: e,
						});
					}}
```

- Line 182: `Input`

```tsx
id='coupon_code'
						label={t('coupons.drawer.couponCode')}
						placeholder={t('coupons.drawer.couponCodePlaceholder')}
						value={formData.coupon_code}
						error={errors.coupon_code as string | undefined}
						onChange={(e) => setFormData({ ...formData, coupon_code: e })}
						description={t('coupons.drawer.couponCodeHelp')}
```

- Line 193: `Select`

```tsx
label={t('coupons.drawer.couponType')}
					placeholder={t('coupons.drawer.selectCouponType')}
					options={typeOptions}
					value={formData.type}
					onChange={(e) => setFormData({ ...formData, type: e as COUPON_TYPE })}
					error={errors.type}
					description={t('coupons.drawer.couponTypeHelp')}
```

- Line 205: `Input`

```tsx
label={t('coupons.drawer.amountOff')}
							placeholder={t('coupons.drawer.amountPlaceholder')}
							type='number'
							step='0.01'
							value={formData.amount_off}
							error={errors.amount_off}
							onChange={(e) => setFormData({ ...formData, amount_off: e })}
							description={t('coupons.drawer.amountHelp')}
```

- Line 215: `Select`

```tsx
label={t('coupons.drawer.currency')}
							placeholder={t('coupons.drawer.selectCurrency')}
							options={currencyOptions}
							value={formData.currency}
							onChange={(e) => setFormData({ ...formData, currency: e })}
							error={errors.currency}
```

- Line 225: `Input`

```tsx
label={t('coupons.drawer.percentageOff')}
						placeholder={t('coupons.drawer.percentagePlaceholder')}
						type='number'
						step='0.01'
						max='100'
						value={formData.percentage_off}
						error={errors.percentage_off}
						onChange={(e) => setFormData({ ...formData, percentage_off: e })}
						description={t('coupons.drawer.percentageHelp')}
```

- Line 238: `Select`

```tsx
label={t('coupons.drawer.cadence')}
					placeholder={t('coupons.drawer.selectCadence')}
					options={cadenceOptions}
					value={formData.cadence}
					onChange={(e) => setFormData({ ...formData, cadence: e as COUPON_CADENCE })}
					error={errors.cadence}
					description={t('coupons.drawer.cadenceHelp')}
```

- Line 270: `Input`

```tsx
label={t('coupons.drawer.maxRedemptions')}
					placeholder={t('coupons.drawer.maxRedemptionsPlaceholder')}
					type='number'
					value={formData.max_redemptions?.toString()}
					onChange={(e) => setFormData({ ...formData, max_redemptions: e ? parseInt(e) : undefined })}
					description={t('coupons.drawer.maxRedemptionsHelp')}
```

- Line 280: `Input`

```tsx
label={t('coupons.drawer.durationInPeriods')}
						placeholder={t('coupons.drawer.durationPlaceholder')}
						type='number'
						value={formData.duration_in_periods?.toString()}
						onChange={(e) => setFormData({ ...formData, duration_in_periods: e ? parseInt(e) : undefined })}
						error={errors.duration_in_periods}
						description={t('coupons.drawer.durationHelp')}
```

- Line 291: `Textarea`

```tsx
value={formData.metadata ? JSON.stringify(formData.metadata, null, 2) : ''}
					onChange={(e) => {
						try {
							const metadata = e ? JSON.parse(e) : undefined;
							setFormData({ ...formData, metadata });
						} catch {
							setErrors({ ...errors, metadata: t('coupons.drawer.invalidMetadata') });
						}
					}}
					className='min-h-[100px]'
					placeholder={t('shared.metadataPlaceholder')}
					label={t('shared.metadataOptional')}
					description={t('shared.metadataJsonAdditional')}
```

- Line 307: `Button`

```tsx
isLoading={isPending}
					disabled={
						isPending || !formData.name?.trim() || !formData.type || !formData.cadence || (!isEdit && !formData.coupon_code?.trim())
					}
					onClick={handleSave}
```

## src/components/molecules/CouponTable/CouponTable.tsx

117 lines. Query keys:

Response/domain field candidates: `data?.map`, `row.type`, `row.amount_off`, `row.currency`, `row.percentage_off`, `row.max_redemptions`, `row.total_redemptions`, `row.status`, `row.updated_at`, `row.id`

- Line 83: `ActionButton`

```tsx
id={row.id}
					copyId={{ entityType: 'Coupon' }}
					deleteMutationFn={(id) => CouponApi.deleteCoupon(id)}
					refetchQueryKey='fetchCoupons'
					entityName={t('coupons.table.entityName')}
					edit={{
						path: `${RouteNames.couponDetails}/${row.id}`,
						onClick: () => handleEdit(row),
					}}
					archive={{
						enabled: row.status === ENTITY_STATUS.PUBLISHED,
					}}
```

- Line 103: `FlexpriceTable`

```tsx
columns={columns}
				data={mappedData}
				showEmptyRow
				onRowClick={(row) => {
					navigate(`${RouteNames.couponDetails}/${row.id}`);
				}}
```

- Line 111: `CouponDrawer`

```tsx
data={selectedCoupon} open={isDrawerOpen} onOpenChange={setIsDrawerOpen} refetchQueryKeys={['fetchCoupons']}
```

## src/components/molecules/CouponModal/CouponModal.tsx

113 lines. Query keys:

Response/domain field candidates:

- Line 83: `Dialog`

```tsx
isOpen={isOpen}
			showCloseButton={false}
			onOpenChange={onOpenChange}
			title={t('coupons.modal.title')}
			className='sm:max-w-[500px]'
```

- Line 91: `Select`

```tsx
label={t('coupons.modal.selectCoupon')}
						placeholder={t('coupons.modal.chooseACoupon')}
						options={couponOptions}
						value={selectedCoupon}
						onChange={handleCouponChange}
						error={errors.couponId}
```

- Line 103: `Button`

```tsx
variant='outline' onClick={handleCancel}
```

- Line 106: `Button`

```tsx
onClick={handleSave}
```

## src/components/molecules/LineItemCoupon/LineItemCoupon.tsx

186 lines. Query keys: `['availableCoupons'],`

Response/domain field candidates: `response.items`

## src/components/molecules/TaxTable/TaxTable.tsx

125 lines. Query keys:

Response/domain field candidates: `row.code`, `row.tax_rate_type`, `row.status`, `row.created_at`, `row?.id`, `row?.name`, `row?.status`, `row.id`

- Line 91: `ActionButton`

```tsx
id={row?.id}
							copyId={{ entityType: 'Tax Rate' }}
							deleteMutationFn={async () => {
								return await TaxApi.deleteTaxRate(row?.id);
							}}
							refetchQueryKey='fetchTaxRates'
							entityName={row?.name}
							edit={{
								enabled: true,
								onClick: () => onEdit?.(row),
								disabled: !canWriteTax,
								disabledReason: canWriteTax ? undefined : t('taxes.writeDeniedTooltip'),
							}}
							archive={{
								enabled: row?.status !== ENTITY_STATUS.ARCHIVED,
								disabled: !canWriteTax,
								disabledReason: canWriteTax ? undefined : t('taxes.writeDeniedTooltip'),
							}}
```

- Line 119: `FlexpriceTable`

```tsx
onRowClick={(row) => navigate(`${RouteNames.taxes}/${row.id}`)} showEmptyRow={true} columns={columns} data={data}
```

## src/components/molecules/TaxDrawer/TaxDrawer.tsx

247 lines. Query keys:

Response/domain field candidates: `data.id`, `data.name`, `data.code`, `data.description`, `data.tax_rate_type`, `data.scope`, `data.percentage_value`, `data.fixed_value`, `data.metadata`

- Line 165: `Input`

```tsx
placeholder={t('taxes.drawer.namePlaceholder')}
					description={t('taxes.drawer.nameHint')}
					label={t('taxes.drawer.nameLabel')}
					value={formData.name}
					error={errors.name}
					onChange={handleNameChange}
```

- Line 174: `Input`

```tsx
label={t('taxes.drawer.codeLabel')}
					disabled={isEdit}
					error={errors.code}
					onChange={(e) => setFormData({ ...formData, code: e })}
					value={formData.code}
					placeholder={t('taxes.drawer.codePlaceholder')}
					description={isEdit ? t('taxes.drawer.codeHintEdit') : t('taxes.drawer.codeHintCreate')}
```

- Line 184: `Select`

```tsx
label={t('taxes.drawer.taxTypeLabel')}
					options={taxTypeOptions}
					value={formData.tax_rate_type}
					onChange={(e) => setFormData({ ...formData, tax_rate_type: e as TAX_RATE_TYPE })}
					description={isEdit ? t('taxes.drawer.taxTypeHintEdit') : t('taxes.drawer.taxTypeHintCreate')}
					disabled={isEdit}
```

- Line 194: `Input`

```tsx
label={t('taxes.drawer.percentageLabel')}
						type='number'
						placeholder={t('taxes.drawer.numericPlaceholder')}
						value={formData.percentage_value?.toString() || ''}
						onChange={(e) => {
							const parsed = parseFloat(e);
							setFormData({ ...formData, percentage_value: Number.isFinite(parsed) ? parsed : undefined });
						}}
						error={errors.percentage_value}
						description={isEdit ? t('taxes.drawer.percentageHintEdit') : t('taxes.drawer.percentageHintCreate')}
						suffix={t('taxes.drawer.percentSuffix')}
						disabled={isEdit}
```

- Line 209: `Input`

```tsx
label={t('taxes.drawer.fixedAmountLabel')}
						type='number'
						placeholder={t('taxes.drawer.numericPlaceholder')}
						value={formData.fixed_value?.toString() || ''}
						onChange={(e) => {
							const parsed = parseFloat(e);
							setFormData({ ...formData, fixed_value: Number.isFinite(parsed) ? parsed : undefined });
						}}
						error={errors.fixed_value}
						description={isEdit ? t('taxes.drawer.fixedHintEdit') : t('taxes.drawer.fixedHintCreate')}
						inputPrefix={t('taxes.drawer.fixedAmountPrefix')}
						disabled={isEdit}
```

- Line 225: `Textarea`

```tsx
value={formData.description}
					onChange={(e) => {
						setFormData({ ...formData, description: e });
					}}
					className='min-h-[100px]'
					placeholder={t('taxes.drawer.descriptionPlaceholder')}
					label={t('taxes.drawer.descriptionLabel')}
					description={t('taxes.drawer.descriptionHint')}
```

- Line 235: `Button`

```tsx
isLoading={isPending}
					disabled={isPending || !formData.name?.trim() || (!isEdit && !formData.code?.trim())}
					onClick={handleSave}
```

## src/components/molecules/TaxAssociationTable/TaxAssociationTable.tsx

147 lines. Query keys:

Response/domain field candidates: `row.id`, `data.filter`, `row.tax_rate_id`, `row.tax_rate?.name`, `row.priority`, `row.auto_apply`, `row.valid_from`, `row.valid_to`, `row?.id`, `row?.tax_rate?.name`, `row?.entity_type`

- Line 71: `AddButton`

```tsx
onClick={onAdd}
```

- Line 75: `AddButton`

```tsx
disabled
```

- Line 112: `ActionButton`

```tsx
id={row?.id}
						copyId={{ entityType: 'Tax Association' }}
						deleteMutationFn={async () => {
							return await TaxApi.deleteTaxAssociation(row?.id);
						}}
						refetchQueryKey={refetchQueryKey}
						entityName={`${row?.tax_rate?.name} Tax for ${row?.entity_type}`}
						edit={{ enabled: false }}
						archive={{
							enabled: showDelete,
							icon: <TrashIcon className='h-4 w-4' />,
							text: t('actions.delete'),
							disabled: !canWriteTax,
							disabledReason: canWriteTax ? undefined : t('labels.taxWriteDeniedTooltip'),
						}}
```

- Line 141: `FlexpriceTable`

```tsx
columns={columns} data={rows} variant='no-bordered'
```

## src/components/molecules/AppliedTaxesTable/AppliedTaxesTable.tsx

129 lines. Query keys: `['fetchTaxRatesForApplied', taxRateIds],`

Response/domain field candidates: `data.map`, `row.tax_rate_id`, `row.taxable_amount`, `row.currency`, `row.tax_amount`, `row.applied_at`, `data?.length`

- Line 123: `FlexpriceTable`

```tsx
variant='no-bordered' showEmptyRow={false} columns={columns} data={data}
```

## src/components/molecules/CostSheetDrawer/CostSheetDrawer.tsx

150 lines. Query keys:

Response/domain field candidates: `data?.id`, `data.id`

- Line 104: `Input`

```tsx
placeholder={t('catalog:costSheets.drawer.namePlaceholder')}
				description={t('catalog:costSheets.drawer.nameHelp')}
				label={t('catalog:costSheets.drawer.costSheetName')}
				value={formData.name}
				error={errors.name}
				onChange={(e) => {
					setFormData({
						...formData,
						name: e,
						lookup_key: isEdit ? formData.lookup_key : 'cost-sheet-' + (e || '').replace(/\s/g, '-').toLowerCase(),
					});
				}}
```

- Line 120: `Input`

```tsx
label={t('catalog:shared.lookupKey')}
				disabled={isEdit}
				error={errors.lookup_key}
				onChange={(e) => setFormData({ ...formData, lookup_key: e })}
				value={formData.lookup_key}
				placeholder={t('catalog:costSheets.drawer.lookupPlaceholder')}
				description={t('catalog:shared.lookupKeyDescription')}
```

- Line 131: `Textarea`

```tsx
value={formData.description}
				onChange={(e) => {
					setFormData({ ...formData, description: e });
				}}
				className='min-h-[100px]'
				placeholder={t('catalog:shared.enterDescription')}
				label={t('catalog:shared.description')}
				description={t('catalog:costSheets.drawer.purposeDescription')}
```

- Line 142: `Button`

```tsx
isLoading={isPending} disabled={isPending || !formData.name?.trim() || !formData.lookup_key?.trim()} onClick={handleSave}
```

## src/components/molecules/CostSheetTable/CostSheetTable.tsx

88 lines. Query keys:

Response/domain field candidates: `row?.status`, `row?.updated_at`, `row?.id`, `row?.name`

- Line 52: `ActionButton`

```tsx
id={row?.id}
						copyId={{ entityType: 'Cost Sheet' }}
						deleteMutationFn={async () => {
							return await CostSheetApi.DeleteCostSheet(row?.id);
						}}
						refetchQueryKey='fetchCostSheets'
						entityName={row?.name}
						edit={{
							enabled: !!onEdit,
							onClick: () => onEdit?.(row),
						}}
						archive={{
							enabled: row?.status !== ENTITY_STATUS.ARCHIVED,
						}}
```

- Line 75: `FlexpriceTable`

```tsx
data={data}
				columns={columnData}
				showEmptyRow
				onRowClick={(row) => {
					navigate(RouteNames.costSheetDetails + `/${row?.id}`);
				}}
```

## src/components/molecules/GroupsTable/GroupsTable.tsx

70 lines. Query keys:

Response/domain field candidates: `data?.map`, `row.entity_type`, `row.updated_at`, `row.id`, `row.status`

- Line 49: `ActionButton`

```tsx
id={row.id}
					copyId={{ entityType: 'Group' }}
					deleteMutationFn={(id) => GroupApi.deleteGroup(id)}
					refetchQueryKey='fetchGroups'
					entityName={t('catalog:groups.table.entityName')}
					edit={{
						onClick: () => onEdit(row),
					}}
					archive={{
						enabled: row.status === ENTITY_STATUS.PUBLISHED,
					}}
```

- Line 66: `FlexpriceTable`

```tsx
columns={columns} data={mappedData} showEmptyRow
```

## src/components/molecules/GroupDrawer/GroupDrawer.tsx

167 lines. Query keys:

Response/domain field candidates: `data?.name`, `data?.lookup_key`, `data?.entity_type`, `data?.id`, `data.id`, `data.name`, `data.lookup_key`, `data.entity_type`

- Line 121: `Input`

```tsx
placeholder={t('catalog:groups.drawer.namePlaceholder')}
				description={t('catalog:groups.drawer.nameHelp')}
				label={t('catalog:groups.drawer.groupName')}
				value={formData.name}
				error={errors.name}
				onChange={(e) => {
					setFormData({
						...formData,
						name: e,
						lookup_key: isEdit ? formData.lookup_key : 'group-' + e.replace(/\s/g, '-').toLowerCase(),
					});
				}}
```

- Line 137: `Input`

```tsx
label={t('catalog:shared.lookupKey')}
				disabled={isEdit}
				error={errors.lookup_key}
				onChange={(e) => setFormData({ ...formData, lookup_key: e })}
				value={formData.lookup_key}
				placeholder={t('catalog:groups.drawer.lookupPlaceholder')}
				description={t('catalog:shared.lookupKeyDescription')}
```

- Line 148: `Select`

```tsx
label={t('catalog:groups.drawer.entityType')}
				value={formData.entity_type}
				onChange={(value) => setFormData({ ...formData, entity_type: value as GROUP_ENTITY_TYPE })}
				options={entityTypeOptions}
				disabled={isEdit}
				placeholder={t('catalog:groups.drawer.selectEntityType')}
				description={t('catalog:groups.drawer.entityTypeHelp')}
```

- Line 159: `Button`

```tsx
isLoading={isPending} disabled={isPending || !formData.name?.trim() || !formData.lookup_key?.trim()} onClick={handleSave}
```

## src/components/molecules/Events/EventPropertiesDrawer.tsx

162 lines. Query keys: `['eventDebug', event?.id],`, `['eventCustomerNames', customerIds.slice().sort().join(',')],`, `['eventFeatureNames', featureIds.slice().sort().join(',')],`

Response/domain field candidates: `customer?.id`

## src/components/molecules/Events/EventsTable.tsx

66 lines. Query keys:

Response/domain field candidates:

- Line 59: `FlexpriceTable`

```tsx
showEmptyRow columns={columns} data={data} onRowClick={handleRowClick}
```

- Line 60: `EventPropertiesDrawer`

```tsx
isOpen={isDrawerOpen} onOpenChange={setIsDrawerOpen} event={selectedEvent}
```

## src/components/molecules/EventFilter/EventFilter.tsx

121 lines. Query keys:

Response/domain field candidates:

- Line 46: `Input`

```tsx
type='text'
										label={t('common:form.key')}
										placeholder={t('labels.placeholders.key')}
										value={eventFilter.key || ''}
										onChange={(e) => {
											const newEventFilters = [...safeEventFilters];
											if (newEventFilters[index]) {
												newEventFilters[index].key = e;
												setEventFilters(newEventFilters);
											}
										}}
```

- Line 71: `MultiChipInput`

```tsx
type='text'
									label={t('labels.values')}
									placeholder={t('labels.placeholders.value')}
									value={eventFilter.values || []}
									onChange={(e) => {
										const newEventFilters = [...safeEventFilters];
										if (newEventFilters[index]) {
											newEventFilters[index].values = e;
											setEventFilters(newEventFilters);
										}
									}}
```

- Line 104: `Button`

```tsx
disabled={disabled}
					variant='outline'
					onClick={() => {
						setEventFilters([...safeEventFilters, { key: '', values: [] }]);
					}}
```

## src/components/molecules/TerminatePriceModal/TerminatePriceModal.tsx

84 lines. Query keys:

Response/domain field candidates: `price.meter?.name`, `price.description`, `price.fallbackName`, `price.scheduledMessage`, `price.immediateMessage`, `price?.id`, `price.title`, `price.effectiveDateOptional`, `price.selectTerminationDate`, `price.hint`, `price.cancel`, `price.terminatePrice`

- Line 48: `DialogContent`

```tsx
className='bg-surface sm:max-w-[600px]'
```

- Line 49: `DialogHeader`

```tsx

```

- Line 50: `DialogTitle`

```tsx

```

- Line 72: `Button`

```tsx
variant='outline' onClick={handleCancel} disabled={isLoading}
```

- Line 75: `Button`

```tsx
onClick={handleConfirm} isLoading={isLoading}
```

## src/components/molecules/TerminateLineItemModal/TerminateLineItemModal.tsx

75 lines. Query keys:

Response/domain field candidates:

- Line 42: `Dialog`

```tsx
isOpen={isOpen}
			onOpenChange={handleOpenChange}
			title={t('termination.lineItem.title')}
			className='sm:max-w-[600px]'
			showCloseButton={true}
```

- Line 62: `Button`

```tsx
variant='outline' onClick={handleCancel} disabled={isLoading}
```

- Line 65: `Button`

```tsx
onClick={handleConfirm} isLoading={isLoading}
```

## src/components/molecules/SaveCardModal/SaveCardModal.tsx

169 lines. Query keys:

Response/domain field candidates: `response.checkout_url`

- Line 100: `Dialog`

```tsx
open={isOpen} onOpenChange={onOpenChange}
```

- Line 101: `DialogContent`

```tsx
className='bg-surface sm:max-w-[500px]'
```

- Line 102: `DialogHeader`

```tsx

```

- Line 103: `DialogTitle`

```tsx
className='text-lg font-semibold text-content-zinc-bold flex items-center gap-2'
```

- Line 117: `Switch`

```tsx
checked={setAsDefault} onCheckedChange={setSetAsDefault}
```

- Line 121: `Button`

```tsx
variant='outline' onClick={() => onOpenChange(false)} disabled={isPending}
```

- Line 124: `Button`

```tsx
onClick={handleGetLink} disabled={isPending} isLoading={isPending} className='flex items-center gap-2'
```

- Line 134: `Dialog`

```tsx
open={setupUrlPopup.isOpen} onOpenChange={handleCloseUrlPopup}
```

- Line 135: `DialogContent`

```tsx
className='bg-surface sm:max-w-[500px]'
```

- Line 136: `DialogHeader`

```tsx

```

- Line 137: `DialogTitle`

```tsx
className='text-lg font-semibold text-content-zinc-bold'
```

- Line 146: `Button`

```tsx
onClick={handleGoToLink} className='flex-1 flex items-center gap-2'
```

- Line 150: `Button`

```tsx
variant='outline' onClick={handleCopyUrl} className='flex-1 flex items-center gap-2'
```

- Line 157: `Button`

```tsx
variant='outline' onClick={handleCloseUrlPopup}
```

## src/components/molecules/MoyasarSaveCardModal/MoyasarSaveCardModal.tsx

51 lines. Query keys:

Response/domain field candidates:

- Line 30: `Dialog`

```tsx
isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={
				<span className='flex items-center gap-2'>
					<CreditCard className='size-5' />
					{t('moyasarAutopay.title')}
				</span>
			}
			className='sm:max-w-[420px]'
```

- Line 42: `Button`

```tsx
className='w-full' onClick={() => setupAutopay()} isLoading={isPending} disabled={isPending}
```

## src/components/molecules/MetadataModal/MetadataModal.tsx

104 lines. Query keys:

Response/domain field candidates: `item.key`, `item.value`

- Line 60: `Dialog`

```tsx
className='min-w-max'
			isOpen={open}
			onOpenChange={(isOpen) => {
				if (!isOpen) onClose();
			}}
			title={t('labels.editMetadata')}
			showCloseButton
```

- Line 72: `Input`

```tsx
placeholder={t('form.key')} value={item.key} onChange={(v) => handleKeyChange(idx, v)} className='rounded-lg'
```

- Line 76: `Textarea`

```tsx
placeholder={t('form.value')}
								value={item.value}
								onChange={(v) => handleValueChange(idx, v)}
								textAreaClassName='min-h-6 h-6 rounded-md'
								className='rounded-md'
```

- Line 84: `Button`

```tsx
variant='ghost' className='size-10' onClick={() => handleRemove(idx)} aria-label={t('form.remove')}
```

- Line 90: `AddChargesButton`

```tsx
onClick={handleAdd} label={t('form.addAnotherItem')}
```

- Line 93: `Button`

```tsx
variant='outline' onClick={onClose}
```

- Line 96: `Button`

```tsx
onClick={handleSave}
```

## src/components/molecules/InfiniteScroll/InfiniteScroll.tsx

64 lines. Query keys:

Response/domain field candidates: `response.data`, `response.hasMore`, `response.nextPageKey`

## src/components/molecules/DetailsCard/DetailsCard.tsx

154 lines. Query keys:

Response/domain field candidates: `data.map`

- Line 113: `FormHeader`

```tsx
titleClassName={detail.className} title={detail.label} variant='form-component-title'
```

## src/components/molecules/SettingsToggleRow/SettingsToggleRow.tsx

36 lines. Query keys:

Response/domain field candidates:

- Line 30: `Switch`

```tsx
checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} aria-label={label}
```

## src/components/molecules/OptionFilterPopover/OptionFilterPopover.tsx

67 lines. Query keys:

Response/domain field candidates:

- Line 29: `Button`

```tsx
variant='outline' size='icon' aria-label={ariaLabel} className='relative h-9 w-9'
```

## src/components/molecules/EnvironmentCreator/EnvironmentCreator.tsx

210 lines. Query keys: `['environments'] });`

Response/domain field candidates:

- Line 102: `Dialog`

```tsx
isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={t('environment.creator.title')}
			className='max-w-[550px]'
			description={t('environment.creator.description')}
```

- Line 109: `Input`

```tsx
label={t('environment.creator.nameLabel')}
					placeholder={t('environment.creator.namePlaceholder')}
					value={name}
					onChange={setName}
					disabled={isPending || (isProduction && !productionEnabled)}
```

- Line 117: `Select`

```tsx
label={t('environment.creator.typeLabel')}
					placeholder={t('environment.creator.typePlaceholder')}
					options={environmentTypeOptions}
					value={type}
					onChange={(value) => setType(value as ENVIRONMENT_TYPE)}
					disabled={isPending}
```

- Line 196: `Button`

```tsx
variant='outline' onClick={handleCancel} disabled={isPending}
```

- Line 199: `Button`

```tsx
onClick={handleCreate} disabled={isPending || !name.trim()}
```

## src/components/molecules/EnvironmentCopier/EnvironmentCopier.tsx

231 lines. Query keys: `['environments'],`, `['environments'] });`

Response/domain field candidates:

- Line 114: `Dialog`

```tsx
isOpen={isOpen}
			onOpenChange={handleOpenChange}
			title={t('environment.copy.title')}
			className='max-w-[520px]'
			description={
				sourceEnvironment ? (
					<span className='text-sm text-muted-foreground'>
						{t('environment.copy.introBeforeBadge')}{' '}
						<span className='inline-flex items-center font-semibold text-content bg-surface-shell border border-line rounded px-1.5 py-0.5 text-[12px] leading-none'>
							{sourceEnvironment.name}
						</span>{' '}
						{isNewEnvironment ? t('environment.copy.intoNew') : t('environment.copy.intoSelected')}
					</span>
				) : (
					t('environment.copy.fallbackDescription')
				)
			}
```

- Line 149: `Select`

```tsx
label={t('environment.copy.copyIntoLabel')}
					placeholder={t('environment.copy.selectTargetPlaceholder')}
					options={targetEnvironmentOptions}
					value={targetEnvironmentId}
					onChange={(value) => setTargetEnvironmentId(value)}
					disabled={isPending}
```

- Line 161: `Input`

```tsx
label={t('environment.copy.newEnvironmentName')}
							placeholder={t('environment.copy.namePlaceholder')}
							value={name}
							onChange={setName}
							disabled={isPending}
```

- Line 168: `Select`

```tsx
label={t('environment.copy.typeLabel')}
							placeholder={t('environment.copy.typePlaceholder')}
							options={environmentTypeOptions}
							value={type}
							onChange={(value) => setType(value as ENVIRONMENT_TYPE.DEVELOPMENT | ENVIRONMENT_TYPE.PRODUCTION)}
							disabled={isPending}
```

- Line 217: `Button`

```tsx
variant='outline' onClick={handleCancel} disabled={isPending}
```

- Line 220: `Button`

```tsx
onClick={handleClone} disabled={isSubmitDisabled}
```

## src/components/molecules/EnvironmentEditor/EnvironmentEditor.tsx

95 lines. Query keys: `['environments'] });`

Response/domain field candidates:

- Line 67: `Dialog`

```tsx
isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={t('environment.editor.title')}
			className='max-w-[480px]'
			description={t('environment.editor.description')}
```

- Line 74: `Input`

```tsx
label={t('environment.editor.nameLabel')}
					placeholder={t('environment.editor.namePlaceholder')}
					value={name}
					onChange={setName}
					disabled={isPending}
```

- Line 82: `Button`

```tsx
variant='outline' onClick={handleCancel} disabled={isPending}
```

- Line 85: `Button`

```tsx
onClick={handleSave} disabled={isPending || !name.trim()}
```

## src/components/molecules/EnvironmentSelector/EnvironmentSelector.tsx

353 lines. Query keys:

Response/domain field candidates:

- Line 31: `SelectPrimitive.Trigger`

```tsx
ref={ref}
		className={cn(
			'w-full outline-none ring-0 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
			className,
		)}
		{...props}
```

- Line 46: `SelectPrimitive.Item`

```tsx
ref={ref}
		className={cn(
			'relative flex w-full cursor-default select-none items-center rounded-[6px] py-1.5 px-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
			className,
		)}
		{...props}
```

- Line 53: `SelectPrimitive.ItemText`

```tsx

```

- Line 99: `Button`

```tsx
onClick={() => setIsCreatorOpen(true)} size='sm' className='w-full text-center rounded-[6px] justify-center items-center'
```

- Line 106: `Button`

```tsx
disabled size='sm' className='w-full text-center rounded-[6px] justify-center items-center'
```

- Line 184: `Select`

```tsx
open={isOpen} onOpenChange={setIsOpen} value={activeEnvironment?.id} onValueChange={handleChange} disabled={disabled}
```

- Line 185: `SelectTrigger`

```tsx
className={cn(sidebarOpen ? '' : 'hidden')}
```

- Line 213: `SelectContent`

```tsx
className='mt-2 w-[calc(var(--radix-select-trigger-width)+8px)] max-w-[calc(var(--radix-select-trigger-width)+8px)] border-line bg-surface text-content'
```

- Line 218: `SelectItem`

```tsx
value={option.value} className='flex-1 pr-9'
```

- Line 256: `Button`

```tsx
onClick={() => {
									setIsOpen(false);
									setIsCreatorOpen(true);
								}}
								key='create'
								value='create'
								size='sm'
								className='w-full text-center rounded-[6px] justify-center items-center'
```

- Line 271: `Button`

```tsx
disabled key='create' size='sm' className='w-full text-center rounded-[6px] justify-center items-center'
```

- Line 279: `Button`

```tsx
onClick={() => {
									setIsOpen(false);
									setIsCopierOpen(true);
								}}
								key='copy'
								size='sm'
								variant='outline'
								className='w-full text-center rounded-[6px] justify-center items-center'
```

- Line 294: `Button`

```tsx
disabled
										key='copy'
										size='sm'
										variant='outline'
										className='w-full text-center rounded-[6px] justify-center items-center'
```

- Line 342: `ContactUsDialog`

```tsx
isOpen={isSuspendedDialogOpen}
				onOpenChange={setIsSuspendedDialogOpen}
				title={t('environment.selector.suspendedTitle')}
				description={t('environment.selector.suspendedDescription')}
```

## src/components/molecules/SecretKeyDrawer/SecretKeyDrawer.tsx

337 lines. Query keys: `['service-accounts'],`

Response/domain field candidates: `data?.api_key`

- Line 195: `Input`

```tsx
placeholder={t('developers:labels.placeholders.secretKeyName')}
						value={formData.name}
						label={t('developers:labels.name')}
						onChange={(value) => handleChange('name', value)}
```

- Line 202: `Select`

```tsx
label={t('developers:labels.accountType')}
						options={accountTypeOptions}
						onChange={(value) => handleChange('accountType', value as AccountType)}
						value={formData.accountType}
```

- Line 247: `Select`

```tsx
label={t('developers:labels.mappedToIdentity')}
										options={serviceAccountOptions}
										onChange={(value) => handleChange('serviceAccountId', value)}
										value={formData.serviceAccountId}
										placeholder={t('developers:labels.placeholders.selectServiceAccount')}
										disabled={isLoadingServiceAccounts}
```

- Line 285: `Select`

```tsx
label={t('developers:labels.expiration')}
						options={expirationOptions}
						onChange={(value) => handleChange('expirationType', value)}
						value={formData.expirationType}
```

- Line 293: `Button`

```tsx
isLoading={isPending} disabled={!isFormValid} onClick={() => createApiKey()}
```

- Line 311: `Input`

```tsx
value={showApiKey ? data?.api_key || '' : maskApiKey(data?.api_key || '')}
								readOnly
								className='pr-16 border-none text-content-tertiary'
```

- Line 328: `Button`

```tsx
onClick={() => setIsModalOpen(false)}
```

## src/components/molecules/Tenant/UpdateTenantDrawer.tsx

401 lines. Query keys:

Response/domain field candidates: `data?.tenant?.id`

- Line 310: `Input`

```tsx
label={t('tenant.drawer.organizationName')}
						placeholder={t('tenant.drawer.organizationNamePlaceholder')}
						value={formData.name}
						onChange={(e) => handleChange('name', e)}
						error={errors['name']}
```

- Line 323: `Select`

```tsx
label={t('tenant.drawer.country')}
								placeholder={t('tenant.drawer.selectCountry')}
								options={countriesOptions}
								value={formData.billing_details?.address?.address_country}
								noOptionsText={t('tenant.drawer.noCountries')}
								onChange={(e) => {
									handleChange('billing_details.address.address_country', e);
									handleChange('billing_details.address.address_state', '');
									handleChange('billing_details.address.address_city', '');
									setActiveState(undefined);
								}}
								error={errors['billing_details.address.address_country']}
```

- Line 337: `Input`

```tsx
label={t('tenant.drawer.addressLine1')}
								placeholder={t('tenant.drawer.addressLine1Placeholder')}
								value={formData.billing_details?.address?.address_line1}
								onChange={(e) => handleChange('billing_details.address.address_line1', e)}
								error={errors['billing_details.address.address_line1']}
```

- Line 344: `Input`

```tsx
label={t('tenant.drawer.addressLine2')}
								placeholder={t('tenant.drawer.addressLine2Placeholder')}
								value={formData.billing_details?.address?.address_line2}
								onChange={(e) => handleChange('billing_details.address.address_line2', e)}
								error={errors['billing_details.address.address_line2']}
```

- Line 353: `Select`

```tsx
label={t('tenant.drawer.state')}
									placeholder={t('tenant.drawer.selectState')}
									options={statesOptions}
									value={formData.billing_details?.address?.address_state}
									onChange={(e) => {
										handleChange('billing_details.address.address_state', e);
										handleChange('billing_details.address.address_city', '');
										const selectedState = e
											? State.getStateByCodeAndCountry(e, formData.billing_details?.address?.address_country)
											: undefined;
										setActiveState(selectedState || undefined);
									}}
									noOptionsText={t('tenant.drawer.noStates')}
									error={errors['billing_details.address.address_state']}
```

- Line 369: `Select`

```tsx
label={t('tenant.drawer.city')}
									options={citiesOptions}
									value={formData.billing_details?.address?.address_city}
									placeholder={t('tenant.drawer.selectCity')}
									noOptionsText={t('tenant.drawer.noCities')}
									onChange={(e) => handleChange('billing_details.address.address_city', e)}
									error={errors['billing_details.address.address_city']}
```

- Line 380: `Input`

```tsx
label={t('tenant.drawer.postalCode')}
								placeholder={t('tenant.drawer.postalCodePlaceholder')}
								value={formData.billing_details?.address?.address_postal_code}
								onChange={(e) => handleChange('billing_details.address.address_postal_code', e)}
								error={errors['billing_details.address.address_postal_code']}
```

- Line 391: `Button`

```tsx
isLoading={isPending} disabled={isPending || isCtaDisabled} onClick={handleSubmit}
```

## src/components/molecules/IntegrationMappingCard/IntegrationMappingCard.tsx

461 lines. Query keys: `['integrationConfig'],`, `['publishedConnections'],`, `['integrationMappings', entityType, entityId],`, `['integrationMappings', entityType, entityId] });`, `['integrationMappings', entityType, entityId] });`

Response/domain field candidates: `row.provider_type`, `row.mapping?.provider_entity_id`, `row.mapping?.created_at`, `row.mapping.created_at`, `row.mapping?.updated_at`, `row.mapping.updated_at`, `row.mapping?.provider_url`, `row.mapping.provider_url`, `row.syncOutboundEnabled`, `row.syncInboundEnabled`

- Line 387: `FlexpriceTable`

```tsx
data={integrationRows} columns={integrationColumns} showEmptyRow variant='no-bordered'
```

- Line 390: `Dialog`

```tsx
isOpen={linkDialogOpen}
				onOpenChange={(open) => {
					setLinkDialogOpen(open);
					if (!open) {
						setProviderEntityId('');
						setLinkTarget(null);
					}
				}}
				title={`${t('actions.link')} ${linkTarget ? formatProviderName(linkTarget.provider_type) : t('integrations.integration')}`}
```

- Line 403: `Input`

```tsx
value={providerEntityId}
							onChange={(val) => setProviderEntityId(val)}
							placeholder={t('integrations.enterProviderEntityId')}
```

- Line 410: `Button`

```tsx
variant='outline'
							onClick={() => {
								setLinkDialogOpen(false);
								setProviderEntityId('');
								setLinkTarget(null);
							}}
```

- Line 419: `Button`

```tsx
onClick={handleLinkSubmit} disabled={isLinking || !providerEntityId.trim()}
```

- Line 426: `Dialog`

```tsx
isOpen={delinkDialogOpen}
				onOpenChange={(open) => {
					setDelinkDialogOpen(open);
					if (!open) {
						setDelinkTarget(null);
					}
				}}
				title={t('integrations.unlinkConfirmTitle')}
```

- Line 442: `Button`

```tsx
variant='outline'
							onClick={() => {
								setDelinkDialogOpen(false);
								setDelinkTarget(null);
							}}
```

- Line 450: `Button`

```tsx
variant='destructive' onClick={() => delinkIntegration()} disabled={isDelinking}
```

## src/components/molecules/HubSpotConnectionDrawer/HubSpotConnectionDrawer.tsx

473 lines. Query keys:

Response/domain field candidates: `invoice?.outbound`

- Line 319: `Input`

```tsx
label={t('integrationDrawer.connectionName')}
					placeholder={t('connection.hubSpot.connectionNamePlaceholder')}
					value={formData.name}
					onChange={(value) => handleChange('name', value)}
					error={errors.name}
					description={t('connection.hubSpot.connectionNameHint')}
```

- Line 330: `Input`

```tsx
label={t('connection.hubSpot.accessToken')}
						placeholder={t('connection.hubSpot.accessTokenPlaceholder')}
						type='password'
						value={formData.access_token}
						onChange={(value) => handleChange('access_token', value)}
						error={errors.access_token}
						description={t('connection.hubSpot.accessTokenHint')}
```

- Line 343: `Input`

```tsx
label={t('connection.hubSpot.clientSecret')}
						placeholder={t('connection.hubSpot.clientSecretPlaceholder')}
						type='password'
						value={formData.client_secret}
						onChange={(value) => handleChange('client_secret', value)}
						error={errors.client_secret}
						description={t('connection.hubSpot.clientSecretHint')}
```

- Line 366: `Switch`

```tsx
checked={formData.sync_config.invoice} onCheckedChange={(checked) => handleSyncConfigChange('invoice', checked)}
```

- Line 375: `Switch`

```tsx
checked={formData.sync_config.deal} onCheckedChange={(checked) => handleSyncConfigChange('deal', checked)}
```

- Line 384: `Switch`

```tsx
checked={formData.sync_config.quote} onCheckedChange={(checked) => handleSyncConfigChange('quote', checked)}
```

- Line 424: `Button`

```tsx
size='xs' variant='outline' onClick={handleCopyWebhookUrl} className='flex items-center gap-1'
```

- Line 460: `Button`

```tsx
variant='outline' onClick={() => onOpenChange(false)} className='flex-1' disabled={isPending}
```

- Line 463: `Button`

```tsx
onClick={handleSave} className='flex-1' isLoading={isPending} disabled={isPending}
```

## src/components/molecules/NomodConnectionDrawer/NomodConnectionDrawer.tsx

303 lines. Query keys:

Response/domain field candidates: `invoice?.outbound`

- Line 215: `Input`

```tsx
label={t('integrationDrawer.connectionName')}
					placeholder={t('connection.nomod.connectionPlaceholder')}
					value={formData.name}
					onChange={(value) => handleChange('name', value)}
					error={errors.name}
					description={t('connection.nomod.connectionHint')}
```

- Line 226: `Input`

```tsx
label={t('connection.nomod.apiKey')}
						placeholder={t('connection.nomod.apiKeyPlaceholder')}
						type='password'
						value={formData.api_key}
						onChange={(value) => handleChange('api_key', value)}
						error={errors.api_key}
						description={t('connection.nomod.apiKeyHint')}
```

- Line 249: `Switch`

```tsx
checked={formData.sync_config.invoice} onCheckedChange={(checked) => handleSyncConfigChange('invoice', checked)}
```

- Line 261: `Input`

```tsx
label={t('connection.nomod.webhookSecret')}
								placeholder={t('connection.nomod.webhookSecretPlaceholder')}
								type='password'
								value={formData.webhook_secret}
								onChange={(value) => handleChange('webhook_secret', value)}
								error={errors.webhook_secret}
								description={t('connection.nomod.webhookSecretHint')}
```

- Line 279: `Button`

```tsx
size='xs' variant='outline' onClick={handleCopyWebhookUrl} className='flex items-center gap-1'
```

- Line 290: `Button`

```tsx
variant='outline' onClick={() => onOpenChange(false)} className='flex-1' disabled={isPending}
```

- Line 293: `Button`

```tsx
onClick={handleSave} className='flex-1' isLoading={isPending} disabled={isPending}
```

## src/components/molecules/MoyasarConnectionDrawer/MoyasarConnectionDrawer.tsx

359 lines. Query keys:

Response/domain field candidates:

- Line 229: `Input`

```tsx
label={t('integrationDrawer.connectionName')}
					placeholder={t('connection.moyasar.connectionPlaceholder')}
					value={formData.name}
					onChange={(value) => handleChange('name', value)}
					error={errors.name}
					description={t('connection.moyasar.connectionHint')}
```

- Line 240: `Input`

```tsx
label={t('connection.labels.secretKey')}
						placeholder={t('connection.moyasar.secretKeyPlaceholder')}
						type='password'
						value={formData.secret_key}
						onChange={(value) => handleChange('secret_key', value)}
						error={errors.secret_key}
						description={t('connection.moyasar.secretKeyHint')}
```

- Line 253: `Input`

```tsx
label={t('connection.moyasar.publishableKey')}
						placeholder={t('connection.moyasar.publishableKeyPlaceholder')}
						type='password'
						value={formData.publishable_key}
						onChange={(value) => handleChange('publishable_key', value)}
						error={errors.publishable_key}
						description={t('connection.moyasar.publishableKeyHint')}
```

- Line 265: `Input`

```tsx
id='moyasar-success-url'
					label={t('connection.moyasar.successUrl')}
					placeholder={t('connection.moyasar.successUrlPlaceholder')}
					value={formData.success_url}
					onChange={(value) => handleChange('success_url', value)}
					error={errors.success_url}
					description={t('connection.moyasar.successUrlHint')}
```

- Line 275: `Input`

```tsx
id='moyasar-cancel-url'
					label={t('connection.moyasar.cancelUrl')}
					placeholder={t('connection.moyasar.cancelUrlPlaceholder')}
					value={formData.cancel_url}
					onChange={(value) => handleChange('cancel_url', value)}
					error={errors.cancel_url}
					description={t('connection.moyasar.cancelUrlHint')}
```

- Line 292: `Input`

```tsx
label={t('connection.webhook.secretLabel')}
								placeholder={t('connection.webhook.secretPlaceholder')}
								type='password'
								value={formData.webhook_secret}
								onChange={(value) => handleChange('webhook_secret', value)}
								error={errors.webhook_secret}
								description={t('connection.webhook.secretDescription')}
```

- Line 310: `Button`

```tsx
size='xs' variant='outline' onClick={handleCopyWebhookUrl} className='flex items-center gap-1'
```

- Line 346: `Button`

```tsx
variant='outline' onClick={() => onOpenChange(false)} className='flex-1' disabled={isPending}
```

- Line 349: `Button`

```tsx
onClick={handleSave} className='flex-1' isLoading={isPending} disabled={isPending}
```

## src/components/molecules/PaddleConnectionDrawer/PaddleConnectionDrawer.tsx

330 lines. Query keys:

Response/domain field candidates:

- Line 209: `Input`

```tsx
label={t('integrationDrawer.connectionName')}
					placeholder={t('connection.paddle.connectionPlaceholder')}
					value={formData.name}
					onChange={(value) => handleChange('name', value)}
					error={errors.name}
					description={t('connection.paddle.connectionHint')}
```

- Line 220: `Input`

```tsx
label={t('connection.labels.apiKey')}
							placeholder={t('connection.paddle.apiKeyPlaceholder')}
							type='password'
							value={formData.api_key}
							onChange={(value) => handleChange('api_key', value)}
							error={errors.api_key}
							description={t('connection.paddle.apiKeyHint')}
```

- Line 230: `Input`

```tsx
label={t('connection.paddle.clientSideToken')}
							placeholder={t('connection.paddle.clientSidePlaceholder')}
							type='password'
							value={formData.client_side_token}
							onChange={(value) => handleChange('client_side_token', value)}
							error={errors.client_side_token}
							description={t('connection.paddle.clientSideHint')}
```

- Line 242: `Input`

```tsx
label={t('connection.paddle.redirectUrl')}
					placeholder={t('connection.paddle.redirectUrlPlaceholder')}
					value={formData.redirect_url}
					onChange={(value) => handleChange('redirect_url', value)}
					error={errors.redirect_url}
					description={t('connection.paddle.redirectUrlHint')}
```

- Line 256: `Input`

```tsx
label={t('connection.webhook.secretLabel')}
								placeholder={t('connection.paddle.webhookSecretPlaceholder')}
								type='password'
								value={formData.webhook_secret}
								onChange={(value) => handleChange('webhook_secret', value)}
								error={errors.webhook_secret}
								description={t('connection.webhook.secretDescription')}
```

- Line 273: `Button`

```tsx
type='button' size='xs' variant='outline' onClick={handleCopyWebhookUrl} className='flex items-center gap-1'
```

- Line 308: `Button`

```tsx
type='button' variant='outline' onClick={() => onOpenChange(false)} className='flex-1' disabled={isPending}
```

- Line 311: `Button`

```tsx
type='button'
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							handleSave();
						}}
						className='flex-1'
						isLoading={isPending}
						disabled={isPending}
```

## src/components/molecules/TabsConnectionDrawer/TabsConnectionDrawer.tsx

242 lines. Query keys:

Response/domain field candidates: `invoice?.outbound`

- Line 187: `Input`

```tsx
label={t('integrationDrawer.connectionName')}
					placeholder={t('connection.tabs.connectionPlaceholder')}
					value={formData.name}
					onChange={(value) => handleChange('name', value)}
					error={errors.name}
					description={t('connection.tabs.connectionHint')}
```

- Line 198: `Input`

```tsx
label={t('connection.labels.apiKey')}
						placeholder={t('connection.tabs.apiKeyPlaceholder')}
						type='password'
						value={formData.api_key}
						onChange={(value) => handleChange('api_key', value)}
						error={errors.api_key}
						description={t('connection.tabs.apiKeyHint')}
```

- Line 221: `Switch`

```tsx
checked={formData.sync_config.invoice} onCheckedChange={handleSyncConfigChange}
```

- Line 229: `Button`

```tsx
variant='outline' onClick={() => onOpenChange(false)} className='flex-1' disabled={isPending}
```

- Line 232: `Button`

```tsx
onClick={handleSave} className='flex-1' isLoading={isPending} disabled={isPending}
```

## src/components/molecules/AwsMarketplaceConnectionDrawer/AwsMarketplaceConnectionDrawer.tsx

398 lines. Query keys:

Response/domain field candidates:

- Line 108: `Button`

```tsx
type='button' variant='ghost' size='sm' className='h-7' onClick={() => copyToClipboard(clipboardText, copyToast)}
```

- Line 152: `Button`

```tsx
type='button'
				variant='ghost'
				size='sm'
				className='h-7 shrink-0'
				disabled={!value}
				onClick={() => copyToClipboard(value, copyToast)}
```

- Line 293: `Input`

```tsx
placeholder={t('connection.awsMarketplace.connectionNamePlaceholder')}
						value={formData.name}
						onChange={(value) => handleChange('name', value)}
						error={errors.name}
						description={t('connection.awsMarketplace.connectionNameHint')}
```

- Line 358: `Input`

```tsx
placeholder={t('connection.awsMarketplace.roleArnPlaceholder')}
									type='password'
									value={formData.role_arn}
									onChange={(value) => handleChange('role_arn', value)}
									error={errors.role_arn}
									description={t('connection.awsMarketplace.roleArnHint')}
```

- Line 371: `Input`

```tsx
placeholder={t('connection.awsMarketplace.regionPlaceholder')}
									value={formData.region}
									onChange={(value) => handleChange('region', value)}
									error={errors.region}
									description={t('connection.awsMarketplace.regionHint')}
```

- Line 385: `Button`

```tsx
variant='outline' onClick={() => onOpenChange(false)} className='flex-1'
```

- Line 388: `Button`

```tsx
onClick={handleSave} className='flex-1' isLoading={isPending}
```

## src/components/molecules/GcpMarketplaceConnectionDrawer/GcpMarketplaceConnectionDrawer.tsx

376 lines. Query keys:

Response/domain field candidates:

- Line 111: `Button`

```tsx
type='button' variant='ghost' size='sm' className='h-7' onClick={() => copyToClipboard(clipboardText, copyToast)}
```

- Line 155: `Button`

```tsx
type='button'
				variant='ghost'
				size='sm'
				className='h-7 shrink-0'
				disabled={!value}
				onClick={() => copyToClipboard(value, copyToast)}
```

- Line 287: `Input`

```tsx
placeholder={t('connection.gcpMarketplace.connectionNamePlaceholder')}
						value={formData.name}
						onChange={(value) => handleChange('name', value)}
						error={errors.name}
						description={t('connection.gcpMarketplace.connectionNameHint')}
```

- Line 348: `Textarea`

```tsx
placeholder={t('connection.gcpMarketplace.credentialsJsonPlaceholder')}
									value={formData.credentials_json}
									onChange={(value) => handleChange('credentials_json', value)}
									error={errors.credentials_json}
									description={t('connection.gcpMarketplace.credentialsJsonHint')}
									textAreaClassName='font-fira-code text-xs min-h-[10rem]'
```

- Line 363: `Button`

```tsx
variant='outline' onClick={() => onOpenChange(false)} className='flex-1'
```

- Line 366: `Button`

```tsx
onClick={handleSave} className='flex-1' isLoading={isPending}
```

## src/components/molecules/AzureMarketplaceConnectionDrawer/AzureMarketplaceConnectionDrawer.tsx

217 lines. Query keys:

Response/domain field candidates:

- Line 135: `Input`

```tsx
placeholder={t('connection.azureMarketplace.connectionNamePlaceholder')}
						value={formData.name}
						onChange={(value) => handleChange('name', value)}
						error={errors.name}
						description={t('connection.azureMarketplace.connectionNameHint')}
```

- Line 163: `Input`

```tsx
placeholder={t('connection.azureMarketplace.tenantIdPlaceholder')}
									type='password'
									value={formData.tenant_id}
									onChange={(value) => handleChange('tenant_id', value)}
									error={errors.tenant_id}
									description={t('connection.azureMarketplace.tenantIdHint')}
```

- Line 176: `Input`

```tsx
placeholder={t('connection.azureMarketplace.clientIdPlaceholder')}
									type='password'
									value={formData.client_id}
									onChange={(value) => handleChange('client_id', value)}
									error={errors.client_id}
									description={t('connection.azureMarketplace.clientIdHint')}
```

- Line 189: `Input`

```tsx
placeholder={t('connection.azureMarketplace.clientSecretPlaceholder')}
									type='password'
									value={formData.client_secret}
									onChange={(value) => handleChange('client_secret', value)}
									error={errors.client_secret}
									description={t('connection.azureMarketplace.clientSecretHint')}
```

- Line 204: `Button`

```tsx
variant='outline' onClick={() => onOpenChange(false)} className='flex-1'
```

- Line 207: `Button`

```tsx
onClick={handleSave} className='flex-1' isLoading={isPending}
```

## src/components/molecules/ImportFileDrawer/ImportFileDrawer.tsx

537 lines. Query keys: `['task', taskId ?? task?.id],`

Response/domain field candidates:

- Line 296: `Select`

```tsx
error={errors.entity_type}
							options={importTypeOptions}
							value={entityType?.value}
							label={t('common:labels.importType')}
							onChange={(value) => {
								setEntityType(importTypeOptions.find((option) => option.value === value));
							}}
							description={t('common:labels.selectImportType')}
```

- Line 353: `CSVBoxButton`

```tsx
key={csvBoxKey}
										// Object form matches CSV Box's docs. The bare-string form is accepted by
										// their postMessage bridge but stalls the destination-push stage on staging
										// (the "Uploading Data (n/n)" screen never advances). Object form works.
										user={{ user_id: csvBoxCustomerId }}
										onImport={(data: boolean, meta: ImportMeta) => {
											setUploadedFile(meta);
											if (data) {
												handleImport(meta);
												toast.success(t('import.toast.uploadSuccess', { filename: meta.original_filename }));
											} else {
												toast.error(t('import.toast.uploadFailed', { filename: meta.original_filename }));
											}
										}}
										licenseKey={getLicenseKey(entityType?.value || '')}
										render={(launch, isLoading) => {
											const disabled = isLoading || !csvBoxCustomerId;
											return (
												<div
													onClick={() => {
														if (disabled) return;
														launch();
													}}
													className={cn(!csvBoxCustomerId ? 'cursor-not-allowed' : 'cursor-pointer')}>
													<div className='space-y-1 w-full flex flex-col'>
														{/* Label */}
														<label className={cn(' block text-sm font-medium', 'text-content-zinc')}>{t('import.importFileLabel')}</label>
														<div aria-disabled={disabled} className={cn(disabled && 'text-content-zinc-muted')}>
															<button disabled={disabled} className={'p-2 border border-line-zinc rounded-lg py-2 px-4 w-full'}>
																<p className='font-medium text-sm flex gap-2 items-center justify-start'>{t('import.chooseFile')}</p>
															</button>
														</div>
														<p className={cn('text-sm', 'text-muted-foreground')}>{t('import.maxFileSizeHint')}</p>
														{!csvBoxCustomerId && <p className='text-sm text-destructive'>{t('import.errors.missingTenantOrEnv')}</p>}
														{errors.file && <p className='text-sm text-destructive'>{errors.file}</p>}
													</div>
												</div>
											);
										}}
```

- Line 399: `FormHeader`

```tsx
title={t('common:labels.compareFileFormatting')}
												variant='form-component-title'
												className='mb-0'
												titleClassName='mb-0'
												subtitle={t('common:labels.maxFileSizeSubtitle')}
```

- Line 426: `FormHeader`

```tsx
title={t('common:labels.importDetails')} variant='form-component-title'
```

- Line 450: `Button`

```tsx
disabled={isPending || isLoading}
									onClick={() => {
										refreshTaskStatus();
									}}
									className='flex gap-2 items-center'
```

- Line 468: `Button`

```tsx
disabled={isPending || isLoading}
								onClick={() => {
									onOpenChange(false);
								}}
								className='flex gap-2 items-center'
```

- Line 489: `Button`

```tsx
onClick={() => {
												window.open(uploadedTaskDetails.file_url || uploadedFile?.raw_file, '_blank');
											}}
											variant={'outline'}
											className='flex gap-2 items-center'
```

- Line 498: `Button`

```tsx
onClick={() => {
											// Reset local state so the CSV Box widget re-opens for a fresh upload.
											// The backend derives the S3 key from upload_id, so we can't blindly
											// resubmit a failed task's file_url like the legacy flow did.
											setuploadedTaskDetails(undefined);
											setUploadedFile(undefined);
											setEntityType(importTypeOptions.find((option) => option.value === uploadedTaskDetails.entity_type));
										}}
										className='flex gap-2 items-center'
```

- Line 522: `Button`

```tsx
disabled={isPending || isLoading || !uploadedFile || !entityType}
							onClick={() => {
								handleImport();
							}}
```

## src/components/molecules/DebugMenu/DebugMenu.tsx

291 lines. Query keys: `['debug-customers', activeEnvironment?.id],`, `['debug-subscriptions', customerData?.items[0]?.id, activeEnvironment?.id],`

Response/domain field candidates: `plan?.name`

- Line 148: `Button`

```tsx
variant='outline'
							className={`fixed bottom-6 ${anchorClass} size-10 z-[100] shadow-sm hover:shadow-md transition-all bg-surface`}
							onClick={() => setIsOpen(!isOpen)}
```

- Line 201: `Button`

```tsx
variant='ghost' size='sm' className='size-6 p-0 opacity-60 hover:opacity-100' onClick={handleClose}
```

- Line 213: `AddButton`

```tsx
onClick={handleCreateCustomer} className='w-full'
```

- Line 223: `AddButton`

```tsx
onClick={handleCreateSubscription} className='w-full !mt-6'
```

- Line 240: `Button`

```tsx
variant='outline' size='sm' className='w-full'
```

- Line 244: `Button`

```tsx
variant='outline' size='sm' className='flex-1' onClick={handleStartStreaming}
```

- Line 272: `Button`

```tsx
className='w-full bg-info-bright hover:bg-info text-content-inverse shadow-sm hover:shadow transition-all duration-200'
										size='sm'
										onClick={handleStartStreaming}
										disabled={isLoading || isStreaming}
```

## src/components/molecules/Webhooks/EventTypePicker.tsx

112 lines. Query keys:

Response/domain field candidates: `item.name`

- Line 68: `Input`

```tsx
placeholder={t('webhooks.endpoints.form.searchEventsPlaceholder')} value={search} onChange={setSearch}
```

- Line 80: `Checkbox`

```tsx
id={`group-${group.name}`}
									checked={allSelected}
									onCheckedChange={() => toggleGroup(groupEventNames, allSelected)}
									label={group.name}
```

- Line 88: `Checkbox`

```tsx
key={eventType.name}
											id={`event-${eventType.name}`}
											checked={selected.includes(eventType.name)}
											onCheckedChange={() => toggleEvent(eventType.name)}
											label={eventType.name}
```

## src/components/molecules/Webhooks/AddEndpointForm.tsx

124 lines. Query keys:

Response/domain field candidates:

- Line 70: `Input`

```tsx
label={t('webhooks.endpoints.form.urlLabel')}
					placeholder={t('webhooks.endpoints.form.urlPlaceholder')}
					value={url}
					onChange={setUrl}
```

- Line 92: `Textarea`

```tsx
label={t('webhooks.endpoints.form.descriptionLabel')}
				placeholder={t('webhooks.endpoints.form.descriptionPlaceholder')}
				value={description}
				onChange={setDescription}
```

- Line 112: `Button`

```tsx
isLoading={submitting} disabled={submitting || !url} onClick={handleSubmit}
```

- Line 115: `Button`

```tsx
variant='outline' disabled={submitting} onClick={onBack}
```

## src/components/molecules/Webhooks/EndpointOverviewTab.tsx

130 lines. Query keys:

Response/domain field candidates: `data?.success`, `data?.fail`, `data?.pending`

- Line 100: `Textarea`

```tsx
value={description} onChange={setDescription} placeholder={t('webhooks.endpoints.form.descriptionPlaceholder')}
```

- Line 102: `Button`

```tsx
size='sm' isLoading={isSaving} onClick={handleSave}
```

- Line 105: `Button`

```tsx
size='sm'
								variant='outline'
								disabled={isSaving}
								onClick={() => {
									setDescription(endpoint.description);
									setIsEditing(false);
								}}
```

## src/components/molecules/Webhooks/EndpointAdvancedTab.tsx

166 lines. Query keys:

Response/domain field candidates: `data?.headers`, `data.headers`, `row.key`, `row.value`

- Line 58: `Input`

```tsx
type='number' placeholder={t('webhooks.endpoints.detail.throttlePlaceholder')} value={rateLimit} onChange={setRateLimit}
```

- Line 60: `Button`

```tsx
size='sm' isLoading={isSaving} onClick={handleSave}
```

- Line 63: `Button`

```tsx
size='sm'
							variant='outline'
							disabled={isSaving}
							onClick={() => {
								setRateLimit(endpoint.rateLimit ? String(endpoint.rateLimit) : '');
								setIsEditing(false);
							}}
```

- Line 139: `Button`

```tsx
variant='outline' size='sm' disabled={isSaving} onClick={() => handleRemove(row.key)}
```

- Line 145: `Input`

```tsx
placeholder={t('webhooks.endpoints.detail.headerKeyPlaceholder')} value={newKey} onChange={setNewKey}
```

- Line 146: `Input`

```tsx
placeholder={t('webhooks.endpoints.detail.headerValuePlaceholder')} value={newValue} onChange={setNewValue}
```

- Line 147: `Button`

```tsx
variant='outline' size='sm' disabled={!newKey || isSaving} isLoading={isSaving} onClick={handleAdd}
```

## src/components/molecules/Webhooks/AttemptStatus.tsx

84 lines. Query keys:

Response/domain field candidates:

- Line 63: `Button`

```tsx
variant='outline'
			size='sm'
			isLoading={isResending}
			onClick={async (e) => {
				e.stopPropagation();
				setIsResending(true);
				try {
					await resendAttempt();
					toast.success(t('webhooks.endpoints.attempts.replaySuccess'));
					onReplayed();
				} catch {
					toast.error(t('webhooks.endpoints.attempts.replayFailed'));
				} finally {
					setIsResending(false);
				}
			}}
```

## src/components/molecules/Webhooks/MessageAttemptsSection.tsx

78 lines. Query keys:

Response/domain field candidates: `row.status`, `row.eventType`, `row.id`, `row.timestamp`, `data?.length`

- Line 69: `FlexpriceTable`

```tsx
columns={columns} data={attempts.data} onRowClick={(row) => onSelectMessage(row.id)}
```

## src/components/molecules/Webhooks/MessageDetail.tsx

165 lines. Query keys:

Response/domain field candidates: `data.payload`, `data.eventType`, `data.timestamp`, `data?.length`, `data.map`

- Line 139: `Button`

```tsx
variant='outline' size='icon' aria-label={t('common:actions.refresh')} onClick={() => attempts.reload()}
```

## src/components/molecules/Webhooks/EndpointDetail.tsx

293 lines. Query keys:

Response/domain field candidates: `data?.key`, `data?.url`, `data.url`, `data.description`, `data.filterTypes`, `data.rateLimit`, `data.disabled`, `data.id`, `data.createdAt`, `data.updatedAt`

- Line 62: `Button`

```tsx
size='sm' isLoading={isSaving} onClick={handleSave}
```

- Line 65: `Button`

```tsx
size='sm' variant='outline' disabled={isSaving} onClick={handleCancel}
```

- Line 114: `Button`

```tsx
variant='outline'
					size='icon'
					className='h-7 w-7 shrink-0'
					aria-label={revealed ? t('webhooks.endpoints.secret.hide') : t('webhooks.endpoints.secret.reveal')}
					onClick={() => {
						setRevealed((r) => !r);
						if (!secret.data) secret.reload();
					}}
```

- Line 126: `Button`

```tsx
variant='outline'
						size='icon'
						className='h-7 w-7 shrink-0'
						aria-label={t('webhooks.endpoints.secret.copy')}
						onClick={() => copyToClipboard(secret.data!.key, t('webhooks.endpoints.secret.copied'))}
```

- Line 229: `Button`

```tsx
variant='outline' size='icon'
```

## src/components/molecules/Webhooks/EndpointsTable.tsx

144 lines. Query keys:

Response/domain field candidates: `data.success`, `data.fail`, `row.url`, `row.description`, `row.id`, `data?.length`

- Line 34: `AddEndpointForm`

```tsx
onBack={() => setView('list')}
				onCreated={() => {
					endpoints.reload();
					setView('list');
				}}
				onViewEventCatalog={onViewEventCatalog}
```

- Line 99: `AddButton`

```tsx
label={t('webhooks.endpoints.addEndpoint')} onClick={() => setView('new')}
```

- Line 104: `FlexpriceTable`

```tsx
columns={columns} data={endpoints.data!} onRowClick={(row) => openDetail(row.id)}
```

- Line 125: `AddButton`

```tsx
className='mt-6' label={t('webhooks.endpoints.addEndpoint')} onClick={() => setView('new')}
```

- Line 131: `Button`

```tsx
variant='outline' disabled={!endpoints.hasPrevPage} onClick={endpoints.prevPage}
```

- Line 134: `Button`

```tsx
variant='outline' disabled={!endpoints.hasNextPage} onClick={endpoints.nextPage}
```

## src/components/molecules/Webhooks/EventCatalogBrowser.tsx

81 lines. Query keys:

Response/domain field candidates:

- Line 42: `Input`

```tsx
placeholder={t('webhooks.eventCatalog.filterPlaceholder')} value={search} onChange={setSearch}
```

## src/components/molecules/Webhooks/MessageLogsTable.tsx

72 lines. Query keys:

Response/domain field candidates: `row.id`, `row.timestamp`, `data?.length`

- Line 40: `Button`

```tsx
variant='outline' prefixIcon={<RefreshCw className='w-4 h-4' />} onClick={() => messages.reload()}
```

- Line 52: `FlexpriceTable`

```tsx
columns={columns} data={messages.data} onRowClick={(row) => setSelectedMessageId(row.id)}
```

- Line 59: `Button`

```tsx
variant='outline' disabled={!messages.hasPrevPage} onClick={messages.prevPage}
```

- Line 62: `Button`

```tsx
variant='outline' disabled={!messages.hasNextPage} onClick={messages.nextPage}
```

## src/components/molecules/Webhooks/ActivityOverview.tsx

89 lines. Query keys: `['webhooks', 'activity', appId, endpointIds],`

Response/domain field candidates: `data?.successfulAttempts`, `data?.failedAttempts`, `data?.points`

## src/components/molecules/QueryBuilder/FilterMultiSelect.tsx

109 lines. Query keys:

Response/domain field candidates:

- Line 58: `Button`

```tsx
variant='outline' size='sm' className={cn(className, 'h-9 rounded-sm text-xs w-full justify-start font-normal')}
```

- Line 71: `CommandInput`

```tsx
placeholder={resolvedSearchPlaceholder}
```

- Line 78: `Checkbox`

```tsx
id='select-all-multi' checked={isAllSelected} onCheckedChange={handleSelectAll} className='h-4 w-4'
```

## src/components/molecules/QueryBuilder/FilterAsyncSelect.tsx

190 lines. Query keys: `['filter-async-select', debouncedQuery],`

Response/domain field candidates: `item.value`, `item.label`, `item.description`, `item.disabled`

- Line 127: `Button`

```tsx
variant='outline' size='sm' className={cn(className, 'h-9 rounded-sm text-xs w-full justify-between font-normal')}
```

- Line 136: `CommandInput`

```tsx
placeholder={searchPlaceholder} value={searchQuery} onValueChange={setSearchQuery} className='h-9'
```

## src/components/molecules/QueryBuilder/FilterAsyncMultiSelect.tsx

230 lines. Query keys: `['filter-async-multi-select', debouncedQuery],`

Response/domain field candidates: `item.value`, `item.label`, `item.description`, `item.disabled`

- Line 151: `Button`

```tsx
variant='outline' size='sm' className={cn(className, 'h-9 rounded-sm text-xs w-full justify-start font-normal')}
```

- Line 163: `CommandInput`

```tsx
placeholder={searchPlaceholder} value={searchQuery} onValueChange={setSearchQuery} className='h-9'
```

- Line 198: `Checkbox`

```tsx
id='select-all-async-multi' checked={isAllSelected} onCheckedChange={handleSelectAll} className='h-4 w-4'
```

## src/components/molecules/QueryBuilder/PropertyFilterPopover.tsx

518 lines. Query keys:

Response/domain field candidates: `item.id`, `row.id`, `row.key`, `row.value`

- Line 152: `Input`

```tsx
value={filter.valueString || ''}
						onChange={(e) => handleFilterUpdate(filter.id, { valueString: e.target.value })}
						{...inputProps}
						className={cn(inputProps.className, 'h-9 text-sm')}
```

- Line 160: `Select`

```tsx
options={field.options?.map((opt) => ({ value: opt.value, label: opt.label })) || []}
						value={filter.valueString}
						onChange={(value) => handleFilterUpdate(filter.id, { valueString: value })}
						className={cn(inputProps.className, 'h-9 text-sm')}
						placeholder={commonProps.placeholder}
						contentClassName='!z-[110]'
```

- Line 188: `Select`

```tsx
options={field.options?.map((opt) => ({ value: opt.value, label: opt.label })) || []}
						value={filter.valueString}
						onChange={(value) => handleFilterUpdate(filter.id, { valueString: value })}
						isRadio
						className={cn(inputProps.className, 'h-9 text-sm')}
						placeholder={commonProps.placeholder}
						contentClassName='!z-[110]'
```

- Line 210: `Switch`

```tsx
checked={filter.valueBoolean || false}
						onCheckedChange={(checked) => handleFilterUpdate(filter.id, { valueBoolean: checked })}
						className={cn(inputProps.className, 'h-9 text-sm')}
```

- Line 217: `FilterMultiSelect`

```tsx
options={field.options?.map((opt) => ({ value: opt.value, label: opt.label })) || []}
						value={filter.valueArray || []}
						onChange={(value) => handleFilterUpdate(filter.id, { valueArray: value })}
						placeholder={t('queryBuilder.selectOptions')}
						className={cn(inputProps.className, 'h-9 text-sm overflow-hidden')}
```

- Line 230: `FilterAsyncSelect`

```tsx
value={filter.valueString || ''}
						searchFn={field.asyncConfig.searchFn}
						onChange={(value) => handleFilterUpdate(filter.id, { valueString: value })}
						placeholder={t('queryBuilder.searchShort')}
						initialOptions={field.asyncConfig.initialOptions}
						debounceTime={field.asyncConfig.debounceTime}
						className={cn(inputProps.className, 'h-9 text-sm')}
```

- Line 244: `FilterAsyncMultiSelect`

```tsx
value={filter.valueArray || []}
						searchFn={field.asyncConfig.searchFn}
						onChange={(value) => handleFilterUpdate(filter.id, { valueArray: value })}
						placeholder={t('queryBuilder.searchShort')}
						initialOptions={field.asyncConfig.initialOptions}
						debounceTime={field.asyncConfig.debounceTime}
						className={cn(inputProps.className, 'h-9 text-sm overflow-hidden')}
```

- Line 292: `Button`

```tsx
variant='outline' size='default' className={cn('flex items-center gap-2', className)}
```

- Line 314: `Button`

```tsx
variant='ghost' size='icon' className='h-7 w-7 -me-1' onClick={() => setIsOpen(false)}
```

- Line 319: `Button`

```tsx
size='sm' onClick={handleAddFilter} className='w-fit h-9 text-sm px-2.5'
```

- Line 323: `Button`

```tsx
variant='outline'
										size='sm'
										onClick={() => propertyFilters.setRows((prev) => [...prev, propertyFilters.createEmpty()])}
										className='h-9 text-sm px-2.5'
```

- Line 332: `Button`

```tsx
variant='outline'
										size='sm'
										onClick={() => {
											if (onResetCallback) {
												onResetCallback();
											} else {
												onChange([]);
											}
											if (propertyFilters) propertyFilters.setRows([]);
										}}
										className='h-9 text-sm px-2.5'
```

- Line 353: `Button`

```tsx
variant='ghost' size='icon' className='h-7 w-7 -me-1' onClick={() => setIsOpen(false)}
```

- Line 389: `Select`

```tsx
options={field.operators
																.filter((operator) => operator != null)
																.map((operator) => ({
																	value: operator,
																	label: getOperatorDisplayLabel(t, operator),
																}))}
															value={filter.operator}
															onChange={(value) => handleFilterUpdate(filter.id, { operator: value as FilterOperator })}
															placeholder={t('queryBuilder.selectOperator')}
															className='h-9 text-sm'
															contentClassName='!z-[110]'
```

- Line 406: `Button`

```tsx
variant='ghost'
																size='icon'
																className='h-7 w-7 shrink-0 hover:bg-destructive/10 hover:text-destructive'
																onClick={() => handleRemoveFilter(filter.id)}
```

- Line 416: `Button`

```tsx
variant='ghost' size='icon' className='h-7 w-7 shrink-0'
```

- Line 447: `Input`

```tsx
placeholder={t('queryBuilder.metadataKey')}
															value={row.key}
															onChange={(e) =>
																propertyFilters.setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, key: e.target.value } : r)))
															}
															className='h-9 text-sm'
```

- Line 457: `Input`

```tsx
placeholder={t('queryBuilder.metadataValue')}
															value={row.value}
															onChange={(e) =>
																propertyFilters.setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, value: e.target.value } : r)))
															}
															className='h-9 text-sm'
```

- Line 466: `Button`

```tsx
variant='ghost'
														size='icon'
														className='h-7 w-7 shrink-0 hover:bg-destructive/10 hover:text-destructive'
														onClick={() => propertyFilters.setRows((prev) => prev.filter((r) => r.id !== row.id))}
														aria-label={t('queryBuilder.removePropertyFilterAria')}
```

- Line 482: `Button`

```tsx
size='sm' onClick={handleAddFilter} className='h-9 text-sm px-2.5 flex items-center gap-1'
```

- Line 486: `Button`

```tsx
variant='outline'
										size='sm'
										className='h-9 text-sm px-2.5 flex items-center gap-1'
										onClick={() => propertyFilters.setRows((prev) => [...prev, propertyFilters.createEmpty()])}
```

- Line 494: `Button`

```tsx
variant='outline'
									size='sm'
									onClick={() => {
										if (onResetCallback) {
											onResetCallback();
										} else {
											onChange([]);
										}
										if (propertyFilters) propertyFilters.setRows([]);
									}}
									className='h-9 text-sm px-2.5'
```

## src/components/molecules/QueryBuilder/FilterPopover.tsx

553 lines. Query keys:

Response/domain field candidates: `item.id`

- Line 152: `Input`

```tsx
value={filter.valueString || ''}
						onChange={(e) => handleFilterUpdate(filter.id, { valueString: e.target.value })}
						{...inputProps}
						className={cn(inputProps.className, 'h-9 text-sm')}
```

- Line 160: `Select`

```tsx
options={field.options?.map((opt) => ({ value: opt.value, label: opt.label })) || []}
						value={filter.valueString}
						onChange={(value) => handleFilterUpdate(filter.id, { valueString: value })}
						className={cn(inputProps.className, 'h-9 text-sm')}
						placeholder={commonProps.placeholder}
						contentClassName='!z-[110]'
```

- Line 188: `Select`

```tsx
options={field.options?.map((opt) => ({ value: opt.value, label: opt.label })) || []}
						value={filter.valueString}
						onChange={(value) => handleFilterUpdate(filter.id, { valueString: value })}
						isRadio
						className={cn(inputProps.className, 'h-9 text-sm')}
						placeholder={commonProps.placeholder}
						contentClassName='!z-[110]'
```

- Line 210: `Switch`

```tsx
checked={filter.valueBoolean || false}
						onCheckedChange={(checked) => handleFilterUpdate(filter.id, { valueBoolean: checked })}
						className={cn(inputProps.className, 'h-9 text-sm')}
```

- Line 217: `FilterMultiSelect`

```tsx
options={field.options?.map((opt) => ({ value: opt.value, label: opt.label })) || []}
						value={filter.valueArray || []}
						onChange={(value) => handleFilterUpdate(filter.id, { valueArray: value })}
						placeholder={t('queryBuilder.selectOptions')}
						className={cn(inputProps.className, 'h-9 text-sm overflow-hidden')}
```

- Line 230: `FilterAsyncSelect`

```tsx
value={filter.valueString || ''}
						searchFn={field.asyncConfig.searchFn}
						onChange={(value) => handleFilterUpdate(filter.id, { valueString: value })}
						placeholder={t('queryBuilder.searchShort')}
						initialOptions={field.asyncConfig.initialOptions}
						debounceTime={field.asyncConfig.debounceTime}
						className={cn(inputProps.className, 'h-9 text-sm')}
```

- Line 244: `FilterAsyncMultiSelect`

```tsx
value={filter.valueArray || []}
						searchFn={field.asyncConfig.searchFn}
						onChange={(value) => handleFilterUpdate(filter.id, { valueArray: value })}
						placeholder={t('queryBuilder.searchShort')}
						initialOptions={field.asyncConfig.initialOptions}
						debounceTime={field.asyncConfig.debounceTime}
						className={cn(inputProps.className, 'h-9 text-sm overflow-hidden')}
```

- Line 302: `Button`

```tsx
variant='outline' size='default' className={cn('flex items-center gap-2', className)}
```

- Line 324: `Button`

```tsx
variant='ghost' size='icon' className='h-7 w-7 -me-1' onClick={() => setIsOpen(false)}
```

- Line 329: `Button`

```tsx
size='sm' onClick={handleAddFilter} className='w-fit h-9 text-sm px-2.5'
```

- Line 338: `Button`

```tsx
variant='ghost' size='icon' className='h-7 w-7 -me-1' onClick={() => setIsOpen(false)}
```

- Line 380: `Input`

```tsx
value={first.key}
																onChange={(e) => setMetaPairs(updateMetadataPairAt(metaPairs, 0, 'key', e.target.value))}
																placeholder={t('queryBuilder.metadataKey')}
																className='h-9 text-sm min-w-0'
```

- Line 386: `Input`

```tsx
value={first.value}
																onChange={(e) => setMetaPairs(updateMetadataPairAt(metaPairs, 0, 'value', e.target.value))}
																placeholder={t('queryBuilder.metadataValue')}
																className='h-9 text-sm min-w-0'
```

- Line 393: `Button`

```tsx
variant='ghost'
																	size='icon'
																	className='h-7 w-7 shrink-0 hover:bg-destructive/10 hover:text-destructive'
																	onClick={() => handleRemoveFilter(filter.id)}
```

- Line 402: `Button`

```tsx
variant='ghost' size='icon' className='h-7 w-7 shrink-0'
```

- Line 423: `Input`

```tsx
value={pair.key}
																		onChange={(e) => setMetaPairs(updateMetadataPairAt(metaPairs, i, 'key', e.target.value))}
																		placeholder={t('queryBuilder.metadataKey')}
																		className='h-9 text-sm min-w-0'
```

- Line 429: `Input`

```tsx
value={pair.value}
																		onChange={(e) => setMetaPairs(updateMetadataPairAt(metaPairs, i, 'value', e.target.value))}
																		placeholder={t('queryBuilder.metadataValue')}
																		className='h-9 text-sm min-w-0'
```

- Line 436: `Button`

```tsx
variant='ghost'
																			size='icon'
																			className='h-7 w-7 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
																			onClick={() => setMetaPairs(removeMetadataPairAt(metaPairs, i))}
```

- Line 450: `Button`

```tsx
variant='ghost'
																	size='sm'
																	className='h-8 w-fit px-2 text-xs text-muted-foreground hover:text-foreground gap-1'
																	onClick={() => setMetaPairs([...metaPairs, { key: '', value: '' }])}
```

- Line 485: `Select`

```tsx
options={field.operators
															.filter((operator) => operator != null)
															.map((operator) => ({
																value: operator,
																label: getOperatorDisplayLabel(t, operator),
															}))}
														value={filter.operator}
														onChange={(value) => handleFilterUpdate(filter.id, { operator: value as FilterOperator })}
														placeholder={t('queryBuilder.selectOperator')}
														className='h-9 text-sm'
														contentClassName='!z-[110]'
```

- Line 502: `Button`

```tsx
variant='ghost'
															size='icon'
															className='h-7 w-7 shrink-0 hover:bg-destructive/10 hover:text-destructive'
															onClick={() => handleRemoveFilter(filter.id)}
```

- Line 512: `Button`

```tsx
variant='ghost' size='icon' className='h-7 w-7 shrink-0'
```

- Line 537: `Button`

```tsx
size='sm' onClick={handleAddFilter} className='h-9 text-sm px-2.5 flex items-center gap-1'
```

- Line 540: `Button`

```tsx
variant='outline' size='sm' onClick={() => onChange([])} className='h-9 text-sm px-2.5'
```

## src/components/molecules/QueryBuilder/SortDropdown.tsx

223 lines. Query keys:

Response/domain field candidates: `item.field`

- Line 91: `Button`

```tsx
variant='outline' size='default' className={cn('flex items-center gap-2 text-xs', className)}
```

- Line 113: `Button`

```tsx
variant='ghost' size='icon' className='h-7 w-7 -me-1' onClick={() => setIsOpen(false)}
```

- Line 118: `Button`

```tsx
size='sm' onClick={handleSortAdd} className='w-fit h-9 text-sm px-2.5'
```

- Line 127: `Button`

```tsx
variant='ghost' size='icon' className='h-7 w-7 -me-1' onClick={() => setIsOpen(false)}
```

- Line 153: `Select`

```tsx
options={[
														{
															value: SortDirection.ASC,
															label: t('queryBuilder.directionAsc'),
														},
														{
															value: SortDirection.DESC,
															label: t('queryBuilder.directionDesc'),
														},
													]}
													value={sort.direction}
													onChange={(value) => handleSortUpdate(index, { direction: value as SortDirection })}
													className='h-9 text-sm'
													placeholder={t('queryBuilder.selectDirection')}
													contentClassName='!z-[110]'
```

- Line 172: `Button`

```tsx
variant='ghost'
														size='icon'
														className='h-7 w-7 shrink-0 hover:bg-destructive/10 hover:text-destructive'
														onClick={() => handleSortRemove(index)}
```

- Line 181: `Button`

```tsx
variant='ghost' size='icon' className='h-7 w-7 shrink-0'
```

- Line 203: `Button`

```tsx
size='sm'
									onClick={handleSortAdd}
									disabled={value.length >= maxSorts || allFieldsAdded}
									className='h-9 text-sm px-2.5 flex items-center gap-1'
```

- Line 210: `Button`

```tsx
variant='outline' size='sm' onClick={handleSortingReset} className='h-9 text-sm px-2.5'
```

## src/components/molecules/Sidebar/SidebarPricingPromoCard.tsx

71 lines. Query keys:

Response/domain field candidates:

- Line 52: `Button`

```tsx
type='button'
					variant='outline'
					size='sm'
					onClick={onCreateWithAI}
					className={cn(
						'h-10 w-full rounded-md border-line-strong bg-surface px-3.5 text-xs font-medium text-brand-navy',
						'shadow-none hover:bg-surface-subtle hover:text-brand-navy',
						'inline-flex items-center justify-center gap-1.5',
					)}
```

## src/components/molecules/Sidebar/SidebarFooter.tsx

100 lines. Query keys:

Response/domain field candidates: `item.label`, `item.onClick`, `item.icon`

- Line 55: `SidebarMenuButton`

```tsx
onClick={() => {
					window.open('https://docs.flexprice.io', '_blank');
				}}
				tooltip={t('labels.documentation')}
				className={cn(`flex items-center justify-between gap-2 hover:bg-muted transition-colors my-0 py-1 `)}
```

## src/components/molecules/Sidebar/Sidebar.tsx

172 lines. Query keys:

Response/domain field candidates:

- Line 159: `EnvironmentSelector`

```tsx

```

## src/components/ui/command-palette.tsx

140 lines. Query keys:

Response/domain field candidates:

- Line 33: `Dialog`

```tsx
open={open} {...props}
```

- Line 34: `DialogPrimitive.Portal`

```tsx

```

- Line 35: `DialogPrimitive.Overlay`

```tsx
className={cn(
						'fixed inset-0 z-50 bg-surface-scrim/25',
						'data-[state=open]:animate-in data-[state=closed]:animate-out',
						'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
						'duration-200 ease-out',
					)}
```

- Line 43: `DialogPrimitive.Content`

```tsx
aria-label={t('commandPalette.searchAndRunCommandsAriaLabel')}
					role='dialog'
					aria-modal='true'
					className={cn(
						'fixed left-[50%] top-[18%] z-50 w-full max-w-[720px] translate-x-[-50%]',
						'bg-surface dark:bg-background/90 backdrop-blur-xl',
						'shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_4px_6px_rgba(0,0,0,0.04),0_16px_32px_rgba(0,0,0,0.08)]',
						'overflow-hidden p-0 rounded-xl origin-center',
						open && 'animate-command-palette-in',
					)}
```

- Line 75: `CommandPrimitive.Input`

```tsx
ref={ref}
			className={cn(
				'flex h-12 w-full rounded-md bg-transparent text-base font-normal outline-none placeholder:text-muted-foreground/80 disabled:cursor-not-allowed disabled:opacity-50',
				className,
			)}
			{...props}
```

## src/components/organisms/CommandPalette/CommandPalette.tsx

200 lines. Query keys:

Response/domain field candidates:

- Line 148: `CommandPaletteDialog`

```tsx
open={open} onOpenChange={handleOpenChange} value={search} onValueChange={setSearch} filter={filter}
```

- Line 149: `CommandInput`

```tsx
placeholder={t('commandPalette.searchPlaceholderExtended')} aria-label={t('commandPalette.searchCommandsAriaLabel')}
```

## src/components/molecules/RegionSelector/RegionInfoDialog.tsx

58 lines. Query keys:

Response/domain field candidates:

- Line 14: `Dialog`

```tsx
isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={t('region.dialogTitle')}
			description={t('region.dialogDescription')}
			className='max-w-2xl'
```

## src/components/molecules/RegionSelector/RegionSelector.tsx

81 lines. Query keys:

Response/domain field candidates:

- Line 40: `Select`

```tsx
value={selectedRegion?.key ?? ''} onValueChange={handleRegionChange} disabled={regions.length === 0}
```

- Line 41: `SelectTrigger`

```tsx
className='w-full'
```

- Line 53: `SelectValue`

```tsx
placeholder={t('region.selectPlaceholder')}
```

- Line 56: `SelectContent`

```tsx

```

- Line 60: `SelectItem`

```tsx
key={region.key} value={region.key}
```

- Line 70: `RegionInfoDialog`

```tsx
isOpen={isDialogOpen} onOpenChange={setIsDialogOpen}
```

- Line 77: `RegionSelectorImpl`

```tsx

```

## src/pages/auth/GoogleSignin.tsx

87 lines. Query keys:

Response/domain field candidates: `data?.url`, `data.url`

- Line 57: `Button`

```tsx
onClick={handleGoogleAuth}
				variant='outline'
				className='w-full mb-6 flex items-center justify-center gap-2 h-11'
				isLoading={googleAuthMutation.isPending}
```

## src/pages/auth/SamlSignin.tsx

131 lines. Query keys:

Response/domain field candidates:

- Line 119: `Button`

```tsx
onClick={handleSamlLogin}
				variant='outline'
				isLoading={isStarting}
				className='w-full mb-6 flex items-center justify-center gap-2 h-11'
```

## src/pages/auth/LoginForm.tsx

205 lines. Query keys:

Response/domain field candidates: `data.token`, `data.user_id`, `data.tenant_id`

- Line 116: `Input`

```tsx
id='email'
					name='email'
					type='email'
					autoComplete='username'
					label={t('fields.email')}
					placeholder={t('fields.emailPlaceholder')}
					required
					onChange={(s) => setEmail(s)}
					value={email}
```

- Line 137: `Input`

```tsx
id='password'
						name='password'
						autoComplete='current-password'
						type={showPassword ? 'text' : 'password'}
						suffix={
							<span onClick={() => setShowPassword(!showPassword)} className='cursor-pointer'>
								{showPassword ? <EyeIcon className='w-5 h-5' /> : <EyeOff className='w-5 h-5' />}
							</span>
						}
						placeholder={t('fields.passwordPlaceholder')}
						required
						onChange={(s) => setPassword(s)}
						value={password}
```

- Line 153: `Button`

```tsx
onClick={handleLogin} className='w-full !mt-6 h-11' isLoading={loading}
```

## src/pages/auth/SignupForm.tsx

229 lines. Query keys:

Response/domain field candidates: `data.token`, `data.user_id`, `data.tenant_id`

- Line 153: `Input`

```tsx
id='email'
					name='email'
					type='email'
					autoComplete='email'
					label={t('fields.email')}
					placeholder={t('fields.emailPlaceholder')}
					required
					onChange={(s) => setSignupData({ ...signupData, email: s })}
					value={signupData.email}
					error={errors.email}
```

- Line 166: `Input`

```tsx
id='password'
					name='password'
					autoComplete='new-password'
					label={t('fields.password')}
					placeholder={t('fields.passwordPlaceholder')}
					required
					onChange={(s) => setSignupData({ ...signupData, password: s })}
					value={signupData.password}
					error={errors.password}
					type={showPassword ? 'text' : 'password'}
					suffix={
						<span onClick={() => setShowPassword(!showPassword)} className='cursor-pointer'>
							{showPassword ? <EyeIcon className='w-5 h-5' /> : <EyeOff className='w-5 h-5' />}
						</span>
					}
```

- Line 184: `Input`

```tsx
id='confirmPassword'
					name='confirmPassword'
					autoComplete='new-password'
					label={t('fields.confirmPassword')}
					placeholder={t('fields.confirmPasswordPlaceholder')}
					required
					onChange={(s) => setSignupData({ ...signupData, confirmPassword: s })}
					value={signupData.confirmPassword}
					error={errors.confirmPassword}
					type={showPassword ? 'text' : 'password'}
					suffix={
						<span onClick={() => setShowPassword(!showPassword)} className='cursor-pointer'>
							{showPassword ? <EyeIcon className='w-5 h-5' /> : <EyeOff className='w-5 h-5' />}
						</span>
					}
```

- Line 201: `Button`

```tsx
onClick={handleSignup} className='w-full !mt-6 h-11' isLoading={isSignupPending || isLoading}
```

## src/pages/auth/ForgotPasswordForm.tsx

82 lines. Query keys:

Response/domain field candidates:

- Line 55: `Input`

```tsx
id='email'
						name='email'
						type='email'
						autoComplete='email'
						placeholder={t('fields.emailPlaceholder')}
						required
						onChange={(s) => setEmail(s)}
						value={email}
```

- Line 66: `Button`

```tsx
type='button' onClick={handleForgotPassword} className='w-full !mt-6 h-11' isLoading={forgotPasswordMutation.isPending}
```

## src/pages/auth/ResetPasswordForm.tsx

161 lines. Query keys:

Response/domain field candidates:

- Line 82: `Button`

```tsx
type='button' onClick={() => switchTab(AuthTab.FORGOT_PASSWORD)} className='mt-5 w-full h-11'
```

- Line 103: `Input`

```tsx
id='new-password'
						name='new-password'
						type={showPassword ? 'text' : 'password'}
						placeholder={t('fields.newPasswordPlaceholder')}
						required
						onChange={(s) => setPassword(s)}
						value={password}
						suffix={
							<button
								type='button'
								onClick={() => setShowPassword(!showPassword)}
								className='cursor-pointer text-content-muted hover:text-content-secondary focus:outline-none'
								aria-label={showPassword ? 'Hide password' : 'Show password'}>
								{showPassword ? <EyeOff className='h-5 w-5' /> : <EyeIcon className='h-5 w-5' />}
							</button>
						}
```

- Line 126: `Input`

```tsx
id='confirm-password'
						name='confirm-password'
						type={showConfirmPassword ? 'text' : 'password'}
						placeholder={t('fields.confirmNewPasswordPlaceholder')}
						required
						onChange={(s) => setConfirmPassword(s)}
						value={confirmPassword}
						suffix={
							<button
								type='button'
								onClick={() => setShowConfirmPassword(!showConfirmPassword)}
								className='cursor-pointer text-content-muted hover:text-content-secondary focus:outline-none'
								aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
								{showConfirmPassword ? <EyeOff className='h-5 w-5' /> : <EyeIcon className='h-5 w-5' />}
							</button>
						}
```

- Line 145: `Button`

```tsx
type='button' onClick={handleSubmit} className='w-full !mt-6 h-11' isLoading={updatePasswordMutation.isPending}
```

## src/pages/auth/templates/FlexpriceDefault/FlexpriceDefault.tsx

114 lines. Query keys:

Response/domain field candidates:

- Line 31: `SignupForm`

```tsx
switchTab={switchTab}
```

- Line 31: `LoginForm`

```tsx
switchTab={switchTab}
```

- Line 33: `ForgotPasswordForm`

```tsx
switchTab={switchTab}
```

- Line 35: `ResetPasswordForm`

```tsx
switchTab={switchTab}
```

- Line 37: `LoginForm`

```tsx
switchTab={switchTab}
```

- Line 74: `RegionSelector`

```tsx

```

- Line 83: `RegionSelector`

```tsx

```

- Line 101: `LocaleSelector`

```tsx

```

## src/pages/auth/templates/Template2/Template2.tsx

108 lines. Query keys:

Response/domain field candidates:

- Line 29: `SignupForm`

```tsx
switchTab={switchTab}
```

- Line 29: `LoginForm`

```tsx
switchTab={switchTab}
```

- Line 31: `ForgotPasswordForm`

```tsx
switchTab={switchTab}
```

- Line 33: `ResetPasswordForm`

```tsx
switchTab={switchTab}
```

- Line 35: `LoginForm`

```tsx
switchTab={switchTab}
```

- Line 57: `RegionSelector`

```tsx

```

- Line 66: `RegionSelector`

```tsx

```

- Line 84: `LocaleSelector`

```tsx

```

## src/pages/auth/EmailVerification.tsx

102 lines. Query keys:

Response/domain field candidates:

- Line 82: `Button`

```tsx
onClick={handleResend} className='h-10 w-full rounded-lg' isLoading={isPending}
```

- Line 85: `Button`

```tsx
onClick={handleGoToLogin} variant='outline' className='h-10 w-full rounded-lg'
```

## src/pages/auth/ResendVerification.tsx

126 lines. Query keys:

Response/domain field candidates:

- Line 66: `Button`

```tsx
onClick={handleGoToLogin} className='w-full' variant='outline'
```

- Line 96: `Input`

```tsx
id='email'
						name='email'
						type='email'
						label={t('fields.email')}
						placeholder={t('fields.emailPlaceholder')}
						required
						onChange={(value) => setEmail(value)}
						value={email}
```

- Line 107: `Button`

```tsx
onClick={handleResend} className='w-full !mt-6' isLoading={isPending}
```

## src/pages/auth/SignupConfirmation.tsx

100 lines. Query keys:

Response/domain field candidates: `data.user`, `data.user?.app_metadata.tenant_id`, `data.user?.email`

## src/pages/customer/creditnotes/CreditNote.tsx

78 lines. Query keys: `['customerCreditNotes', customerId],`

Response/domain field candidates: `invoice.customer`, `data.items.filter`, `invoice?.customer?.id`, `data?.items?.length`, `data?.items`

- Line 53: `AddButton`

```tsx
label={t('creditNotes.addCreditNote')} onClick={goToInvoiceTab}
```

- Line 57: `AddButton`

```tsx
label={t('creditNotes.addCreditNote')} disabled
```

- Line 71: `CreditNoteTable`

```tsx
data={data?.items ?? []}
```

## src/pages/customer/creditnotes/CreditNoteDetails.tsx

134 lines. Query keys: `['fetchCreditNote', credit_note_id],`

Response/domain field candidates: `data?.credit_note_number`, `data?.credit_note_status`, `data?.id?.slice`, `data?.created_at`, `data?.invoice`, `data.invoice.id`, `data.invoice.invoice_number`, `data.invoice.id.slice`, `data?.credit_note_type`, `data?.line_items`, `data?.total_amount`, `data?.currency`, `data?.memo`

- Line 111: `CreditNoteLineItemTable`

```tsx
title={t('creditNotes.lineItems')}
					data={data?.line_items ?? []}
					total_amount={data?.total_amount}
					currency={data?.currency}
					total_label={t('creditNotes.totalCreditAmount')}
```

## src/pages/customer/creditnotes/CreditNotesPage.tsx

72 lines. Query keys: `['fetchCreditNotes', page],`

Response/domain field candidates:

- Line 63: `CreditNoteTable`

```tsx
data={creditNoteData?.items || []}
```

## src/pages/customer/customers/CreateCustomerWalletModal.tsx

331 lines. Query keys: `['createWallet', customerId],`

Response/domain field candidates: `wallet.toast.createError`, `wallet.toast.createSuccess`, `data.id`, `wallet.errors.expiryAfterSubscription`, `wallet.errors.currencyRequired`, `wallet.errors.conversionRatePositive`, `wallet.errors.topupConversionPositive`, `wallet.id`, `wallet.createTitle`, `wallet.description`, `wallet.labelPrePaid`, `wallet.typePrepaidDesc`, `wallet.labelPostPaid`, `wallet.typePostpaidDesc`, `wallet.typeLabel`, `wallet.typePlaceholder`, `data.value`, `wallet.currencyLabel`, `wallet.customCurrencyHint`, `wallet.selectCurrencyHint`, `wallet.conversionRate`, `wallet.suffixCredit`, `wallet.topupConversionRate`, `wallet.topupConversionDescription`, `wallet.freeCredits`, `wallet.creditsPluralSuffix`, `wallet.freeCreditsPlaceholder`, `wallet.freeCreditsExpiry`, `wallet.expiryPlaceholder`, `wallet.addTopupRate`, `wallet.addFreeCredits`, `wallet.saveWallet`

- Line 177: `Dialog`

```tsx
open={open} onOpenChange={onOpenChange}
```

- Line 178: `DialogContent`

```tsx
className='bg-surface sm:max-w-[600px] max-h-[80vh] overflow-y-auto'
```

- Line 179: `DialogHeader`

```tsx

```

- Line 180: `DialogTitle`

```tsx

```

- Line 181: `DialogDescription`

```tsx

```

- Line 184: `Select`

```tsx
value={walletPayload.wallet_type || WALLET_TYPE.PRE_PAID}
						options={[
							{
								label: t('customers:wallet.labelPrePaid'),
								value: WALLET_TYPE.PRE_PAID,
								description: t('customers:wallet.typePrepaidDesc'),
							},
							{
								label: t('customers:wallet.labelPostPaid'),
								value: WALLET_TYPE.POST_PAID,
								description: t('customers:wallet.typePostpaidDesc'),
							},
						]}
						label={t('customers:wallet.typeLabel')}
						onChange={(value) =>
							setwalletPayload({
								...walletPayload,
								wallet_type: value as WALLET_TYPE,
							})
						}
						placeholder={t('customers:wallet.typePlaceholder')}
```

- Line 208: `CurrencyPriceUnitSelector`

```tsx
value={selectedPriceUnitOrCurrency?.data.value || walletPayload.currency || walletPayload.price_unit}
						onChange={handlePriceUnitOrCurrencyChange}
						label={t('customers:wallet.currencyLabel')}
						error={errors.currency}
						description={isPriceUnitSelected ? t('customers:wallet.customCurrencyHint') : t('customers:wallet.selectCurrencyHint')}
```

- Line 221: `Input`

```tsx
className='w-full' value={'1'} disabled suffix={t('customers:wallet.suffixCredit')}
```

- Line 223: `Input`

```tsx
className='w-full'
									variant='number'
									suffix={getCurrencySymbol(walletPayload.currency || '')}
									value={walletPayload.conversion_rate}
									onChange={(e) => {
										setwalletPayload({ ...walletPayload, conversion_rate: e as unknown as number });
									}}
```

- Line 242: `Input`

```tsx
className='w-full' value={'1'} disabled suffix={t('customers:wallet.suffixCredit')}
```

- Line 244: `Input`

```tsx
className='w-full'
									variant='number'
									suffix={getCurrencySymbol(walletPayload.currency || '')}
									value={walletPayload.topup_conversion_rate ?? walletPayload.conversion_rate}
									onChange={(e) => {
										setwalletPayload({
											...walletPayload,
											topup_conversion_rate: e as unknown as number,
										});
									}}
```

- Line 266: `Input`

```tsx
label={t('customers:wallet.freeCredits')}
									suffix={t('customers:wallet.creditsPluralSuffix')}
									variant='formatted-number'
									placeholder={t('customers:wallet.freeCreditsPlaceholder')}
									value={walletPayload.initial_credits_to_load}
									onChange={(e) => {
										setwalletPayload({ ...walletPayload, initial_credits_to_load: e as unknown as number });
									}}
```

- Line 314: `AddButton`

```tsx
onClick={() => setShowTopupConversionRate(true)} label={t('customers:wallet.addTopupRate')}
```

- Line 316: `AddButton`

```tsx
onClick={() => setShowFreeCredits(true)} label={t('customers:wallet.addFreeCredits')}
```

- Line 320: `Button`

```tsx
isLoading={isPending} disabled={isPending} onClick={handleCreateWallet}
```

## src/pages/customer/customers/CustomerProfilePage.tsx

132 lines. Query keys: `['fetchCustomerDetails', customerId],`

Response/domain field candidates: `customer?.status`, `customer?.external_id`, `customer.external_id`

## src/pages/customer/customers/invoice/CustomerInvoiceDetail.tsx

323 lines. Query keys: `['fetchInvoice', invoice_id],`, `['subscriptionCustomer', data?.subscription_customer_id],`

Response/domain field candidates: `response.items`, `data?.subscription_customer_id`, `data.subscription_customer_id`, `data.customer_id`, `data?.invoice_number`, `data.metadata`, `data?.customer?.address_line1`, `data?.customer?.address_line2`, `data?.customer?.address_city`, `data?.customer?.address_state`, `data?.customer?.address_postal_code`, `data?.customer?.address_country`, `data?.invoice_type`, `data?.issue_date`, `data?.created_at`, `data?.due_date`, `data?.payment_status`, `data?.customer?.id`, `data?.customer?.name`, `data?.customer?.email`, `data?.subtotal`, `data?.total`, `data?.total_prepaid_credits_applied`, `data?.total_discount`, `data?.total_tax`, `data?.amount_paid`, `data?.overpaid_amount`, `data?.amount_remaining`, `data?.line_items`, `data?.amount_due`, `data?.currency`, `data?.taxes?.length`, `data.taxes`, `data?.invoice_status`

- Line 162: `InvoiceDownloadFormatDialog`

```tsx
open={isDownloadFormatOpen}
					onOpenChange={setIsDownloadFormatOpen}
					isPdfPending={isPdfDownloadPending}
					onSelectPdf={() => downloadInvoicePdfAsync()}
					onSelectCsv={() => {
						const rows = InvoiceApi.downloadInvoiceCsv(data);
						if (rows === 0) {
							toast.error('No billable line items to export');
						} else {
							toast.success('Invoice CSV downloaded');
						}
					}}
```

- Line 181: `Button`

```tsx
data-html2canvas-ignore='true' onClick={() => setIsDownloadFormatOpen(true)}
```

- Line 185: `InvoiceTableMenu`

```tsx
data={data}
```

- Line 208: `FormHeader`

```tsx
className='!mb-2' title={user?.tenant.name} variant='sub-header' titleClassName='font-semibold'
```

- Line 215: `FormHeader`

```tsx
className='!mb-2'
								title={hasSubscriptionCustomer ? t('invoices.detailLabels.billingEntity') : t('createInvoice.billTo')}
								variant='sub-header'
								titleClassName='font-semibold'
```

- Line 230: `FormHeader`

```tsx
className='!mb-2'
									title={t('invoices.detailLabels.subscriptionCustomer')}
									variant='sub-header'
									titleClassName='font-semibold'
```

- Line 257: `InvoiceLineItemTable`

```tsx
title={t('createInvoice.orderDetails')}
						subtotal={data?.subtotal}
						total={data?.total}
						total_prepaid_credits_applied={data?.total_prepaid_credits_applied}
						discount={data?.total_discount}
						total_tax={data?.total_tax}
						amount_paid={data?.amount_paid}
						overpaid_amount={data?.overpaid_amount}
						amount_remaining={Number(data?.amount_remaining)}
						data={data?.line_items ?? []}
						amount_due={data?.amount_due}
						currency={data?.currency}
						invoiceType={invoiceType as INVOICE_TYPE}
```

- Line 280: `AppliedTaxesTable`

```tsx
data={data.taxes}
```

## src/pages/customer/customers/CustomerInvoiceDetailsPage.tsx

91 lines. Query keys: `['payments', invoice_id],`, `['creditNotes', invoice_id],`

Response/domain field candidates:

- Line 53: `InvoicePaymentsTable`

```tsx
data={payments?.items ?? []}
```

- Line 71: `CreditNoteTable`

```tsx
data={creditNotes?.items ?? []}
```

## src/pages/customer/customers/CustomerListPage.tsx

328 lines. Query keys: `'fetchCustomers',`

Response/domain field candidates: `customer.external_id`, `customer.id`, `customer.status`, `row.status`, `row.updated_at`, `row?.id`

- Line 39: `ActionButton`

```tsx
id={customer.id}
			copyId={{ entityType: 'Customer' }}
			deleteMutationFn={(id) => CustomerApi.deleteCustomerById(id)}
			refetchQueryKey='fetchCustomers'
			entityName={t('list.entityName')}
			edit={{
				enabled: customer.status === ENTITY_STATUS.PUBLISHED,
				path: `/billing/customers/edit-customer?id=${customer.id}`,
				onClick: () => onEdit(customer),
				disabled: !canWriteCustomer,
				disabledReason: canWriteCustomer ? undefined : t('list.writeDeniedTooltip'),
			}}
			archive={{
				enabled: customer.status === ENTITY_STATUS.PUBLISHED,
				disabled: !canWriteCustomer,
				disabledReason: canWriteCustomer ? undefined : t('list.writeDeniedTooltip'),
			}}
			customActions={[
				{
					text: t('list.openPortal'),
					icon: <ExternalLink className='h-4 w-4' />,
					onClick: openInNewTab,
				},
			]}
```

- Line 226: `ActionButtonWithPortal`

```tsx
customer={row} onEdit={handleEdit}
```

- Line 239: `CreateCustomerDrawer`

```tsx
trigger={
							canWriteCustomer ? (
								<AddButton
									onClick={() => {
										setactiveCustomer(undefined);
									}}
								/>
							) : (
								<Tooltip content={t('list.writeDeniedTooltip')}>
									<span tabIndex={0} className='inline-block'>
										<AddButton disabled />
									</span>
								</Tooltip>
							)
						}
						open={customerDrawerOpen}
						onOpenChange={setcustomerDrawerOpen}
						data={activeCustomer}
```

- Line 242: `AddButton`

```tsx
onClick={() => {
										setactiveCustomer(undefined);
									}}
```

- Line 250: `AddButton`

```tsx
disabled
```

## src/components/organisms/PlanForm/PlanDetailsSection.tsx

66 lines. Query keys:

Response/domain field candidates: `plan.name`, `plan.lookup_key`, `plan.description`

- Line 24: `Input`

```tsx
placeholder={t('catalog:plans.drawer.namePlaceholder')}
				description={t('catalog:plans.drawer.nameHelp')}
				label={t('catalog:plans.drawer.planName')}
				value={plan.name}
				error={errors.name}
				onChange={(e) => {
					setPlanField('name', e);
					// Auto-generate lookup key from plan name, but only if user hasn't manually edited it
					if (!isLookupKeyManuallyEdited) {
						setPlanField('lookup_key', 'plan-' + e.replace(/\s/g, '-').toLowerCase());
					}
				}}
```

- Line 40: `Input`

```tsx
label={t('catalog:shared.lookupKey')}
				error={errors.lookup_key}
				onChange={(e) => {
					setPlanField('lookup_key', e);
					// Mark that user manually edited the lookup key, stop auto-generation
					setIsLookupKeyManuallyEdited(true);
				}}
				value={plan.lookup_key}
				placeholder={t('catalog:plans.drawer.lookupPlaceholder')}
				description={t('catalog:shared.lookupKeyDescription')}
```

- Line 53: `Textarea`

```tsx
value={plan.description}
				onChange={(e) => setPlanField('description', e)}
				className='min-h-[100px]'
				placeholder={t('catalog:shared.enterDescription')}
				label={t('catalog:shared.description')}
				description={t('catalog:plans.drawer.purposeDescription')}
```

## src/components/organisms/Subscription/AddSubscriptionChargeDialog.tsx

287 lines. Query keys:

Response/domain field candidates: `price?.type`, `price.meter_id`, `price.bucket_size`, `price?.meter_id`, `price.meter`, `feature?.meter_id`, `price.currency`

- Line 235: `Dialog`

```tsx
isOpen={isOpen}
			onOpenChange={handleOpenChange}
			title={getTitle()}
			description={getDescription()}
			className='w-full max-w-4xl overflow-x-hidden'
```

- Line 247: `RecurringChargesForm`

```tsx
price={price}
					onAdd={handleAdd}
					onUpdate={handleUpdate}
					onEditClicked={() => {}}
					onDeleteClicked={() => onOpenChange(false)}
					entityName=''
					isSaving={isSaving}
```

- Line 258: `UsagePricingForm`

```tsx
price={price}
					onAdd={handleAdd}
					onUpdate={handleUpdate}
					onEditClicked={() => {}}
					onDeleteClicked={() => onOpenChange(false)}
					entityType={PRICE_ENTITY_TYPE.SUBSCRIPTION}
					entityId={subscriptionId}
					onMeterChange={(feature) => setSelectedMeterId(feature?.meter_id)}
					isSaving={isSaving}
					formFooter={
						<SubscriptionChargeCommitmentSection
							meterId={meterId}
							currency={price.currency ?? defaultCurrency}
							billingPeriod={defaultBillingPeriod}
							value={commitmentState}
							onChange={setCommitmentState}
							sourcePrice={price}
							sourceBucketSize={effectiveBucketSize}
							disabled={isSaving}
						/>
					}
```

## src/components/organisms/Subscription/SubscriptionPriceTable.tsx

477 lines. Query keys:

Response/domain field candidates: `price.billing_period`, `price.billing_period_count`, `item.price`, `price.id`, `data.invoice_cadence`, `price.display_name`, `price.meter?.name`, `price.invoice_cadence`, `item.tempId`, `item.display_name`, `item.price?.display_name`, `item.quantity`, `item.price?.invoice_cadence`

- Line 402: `FormHeader`

```tsx
title={t('organisms.subscriptionPriceTable.charges')} variant='sub-header'
```

- Line 403: `AddButton`

```tsx
onClick={onAddCharge} disabled={disabled} className='w-fit'
```

- Line 407: `FlexpriceTable`

```tsx
columns={chargesTableColumns} data={displayedData}
```

- Line 433: `PriceOverrideDialog`

```tsx
isOpen={isDialogOpen}
					onOpenChange={setIsDialogOpen}
					price={selectedPrice}
					onPriceOverride={onPriceOverride}
					onResetOverride={onResetOverride}
					overriddenPrices={overriddenPrices}
```

- Line 444: `CommitmentConfigDialog`

```tsx
isOpen={isCommitmentDialogOpen}
					onOpenChange={setIsCommitmentDialogOpen}
					price={selectedCommitmentPrice}
					onSave={(priceId, config, timeBuckets) => onCommitmentChange?.(priceId, config, timeBuckets)}
					currentConfig={overriddenPrices[selectedCommitmentPrice.id]?.commitment}
					currentTimeBuckets={overriddenPrices[selectedCommitmentPrice.id]?.commitment_time_buckets}
					billingPeriod={billingPeriod}
```

## src/components/organisms/Subscription/PhaseForm.tsx

195 lines. Query keys:

Response/domain field candidates:

- Line 136: `SubscriptionDiscountTable`

```tsx
coupon={formState.coupons.length > 0 ? formState.coupons[0] : null}
					onChange={(coupon) => {
						updateFormState({
							coupons: coupon ? [coupon] : [],
						});
					}}
					disabled={disabled}
					currency={currency}
					allLineItemCoupons={formState.line_item_coupons}
```

- Line 152: `SubscriptionPriceTable`

```tsx
data={prices}
						billingPeriod={billingPeriod}
						billingPeriodCount={1}
						currency={currency}
						onPriceOverride={overridePrice}
						onResetOverride={resetOverride}
						overriddenPrices={overriddenPrices}
						lineItemCoupons={formState.line_item_coupons}
						onLineItemCouponsChange={(priceId, coupon) => {
							updateFormState({
								line_item_coupons: {
									...formState.line_item_coupons,
									...(coupon
										? { [priceId]: coupon }
										: (() => {
												const updated = { ...formState.line_item_coupons };
												delete updated[priceId];
												return updated;
											})()),
								},
							});
						}}
						disabled={disabled}
						subscriptionLevelCoupon={formState.coupons.length > 0 ? formState.coupons[0] : null}
```

- Line 183: `Button`

```tsx
variant='outline' onClick={onCancel} disabled={disabled}
```

- Line 186: `Button`

```tsx
onClick={handleSave} disabled={disabled}
```

## src/pages/customer/customers/CreateCustomerSubscriptionPage.tsx

966 lines. Query keys: `['plans'],`, `['customerSubscription', customerId],`, `['subscription', subscription_id],`, `['addons', addonIds],`, `['planDetails', planId],`, `['customerTaxAssociations', effectiveCustomerId],`, `['coupons'],`, `['createSubscription'],`

Response/domain field candidates: `response.items.filter`, `response.items`, `item.tax_rate?.status`, `item.tax_rate_id`, `item.tax_rate?.code`, `item.currency.toLowerCase`, `item.auto_apply`, `item.priority`, `item.tax_rate?.name`, `price.start_date`, `customer.id`, `price.billing_period.toLowerCase`, `price.currency`, `item.price`

- Line 895: `UsageTable`

```tsx
data={subscriptionData.usage}
```

- Line 899: `SubscriptionForm`

```tsx
state={subscriptionState}
					setState={setSubscriptionState}
					plans={plans}
					plansLoading={plansLoading}
					plansError={plansError}
					isLoadingPlanDetails={isLoadingPlanDetails}
					isPlanDetailsError={isPlanDetailsError}
					isDisabled={!!subscription_id}
					phases={subscriptionState.phases}
					onPhasesChange={(newPhases) => {
						setSubscriptionState((prev) => ({
							...prev,
							phases: newPhases,
						}));
					}}
					allCoupons={allCouponsData}
					subscriberCustomer={customerData}
					customerPicker={
						showCustomerPicker
							? {
									value: selectedCustomer,
									onChange: handleCustomerChange,
									hint: t('subscriptionCreate.selectCustomerHint'),
								}
							: undefined
					}
```

- Line 946: `Button`

```tsx
onClick={navigateBack} variant={'outline'} disabled={isCreating}
```

- Line 949: `Button`

```tsx
onClick={handleDraftSubmit} isLoading={isCreating && isDraft} variant={'outline'} disabled={isCreating}
```

- Line 953: `Button`

```tsx
onClick={handleRegularSubmit} isLoading={isCreating && !isDraft} disabled={isCreating}
```

## src/components/molecules/CouponAssociationTable/CouponAssociationTable.tsx

163 lines. Query keys: `['couponAssociations', subscriptionId],`

Response/domain field candidates: `row.id`, `data?.items`, `row.coupon`, `row.coupon_id`, `row.coupon.name`, `row.coupon?.coupon_code`, `row.coupon.coupon_code`, `row.subscription_line_item_id`, `row.start_date`, `row.end_date`

- Line 89: `AddButton`

```tsx
onClick={onAdd}
```

- Line 93: `AddButton`

```tsx
disabled
```

- Line 157: `FlexpriceTable`

```tsx
columns={columns} data={rows} variant='no-bordered'
```

## src/pages/customer/customers/CustomerSubscriptionDetailsPage.tsx

634 lines. Query keys: `['subscriptionDetails', subscription_id],`, `['fetchCustomerDetails', customerId],`, `['invoicingCustomer', subscriptionDetails?.invoicing_customer_id],`, `['parentSubscription', parentSubscriptionId],`, `['parentSubscriptionCustomer', parentCustomerId],`, `[`, `['subscriptionTaxAssociations', subscription_id],`, `['upcomingCreditGrantApplications', subscription_id],`, `['inheritedSubscriptions', subscription_id, 'plan+customer'],`

Response/domain field candidates: `subscription?.commitment_duration`, `subscription?.billing_period_count`, `row.customer_id`, `row.customer?.name`, `row.subscription_type`, `row.id`, `row.plan?.name`, `row.start_date`, `row.current_period_end`, `plan?.name`, `plan.name`, `customer?.external_id`, `customer.external_id`, `data?.line_items?.length`, `data?.total_discount`, `data?.subtotal`, `data?.invoice_type`, `data?.currency`, `data?.amount_due`, `data?.total_tax`, `data?.line_items`

- Line 335: `FormHeader`

```tsx
title={t('subscriptionDetail.sectionTitle')} variant='sub-header' titleClassName='font-semibold'
```

- Line 336: `SubscriptionActionButton`

```tsx
subscription={subscriptionDetails!}
```

- Line 476: `FormHeader`

```tsx
title={t('subscriptionDetail.subscriptionPhases')} variant='sub-header' titleClassName='font-semibold'
```

- Line 525: `FormHeader`

```tsx
variant='sub-header'
									titleClassName='font-semibold text-content'
									subtitleClassName='text-sm text-content-muted !mb-0 !mt-1'
									title={t('subscriptionDetail.upcomingInvoicesTitle')}
									subtitle={t('subscriptionDetail.upcomingInvoicesSubtitle', {
										date: formatDateShort(subscriptionDetails?.current_period_end ?? ''),
									})}
```

- Line 542: `SubscriptionPreviewLineItemTable`

```tsx
discount={data?.total_discount}
								subtotal={data?.subtotal}
								invoiceType={data?.invoice_type as INVOICE_TYPE}
								refetch={refetch}
								currency={data?.currency}
								amount_due={data?.amount_due}
								tax={data?.total_tax}
								title={t('subscriptionDetail.upcomingInvoicesTitle')}
								subtitle={t('subscriptionDetail.upcomingInvoicesSubtitle', {
									date: formatDateShort(subscriptionDetails?.current_period_end ?? ''),
								})}
								data={data?.line_items ?? []}
								showZeroCharges={showZeroCharges}
								onShowZeroChargesChange={setShowZeroCharges}
```

- Line 560: `FormHeader`

```tsx
variant='sub-header'
									titleClassName='font-semibold text-content'
									title={t('subscriptionDetail.upcomingInvoicesTitle')}
									subtitle={t('subscriptionDetail.upcomingInvoicesEmpty', {
										date: formatDateShort(subscriptionDetails?.current_period_end ?? ''),
									})}
```

- Line 573: `UpcomingCreditGrantApplicationsTable`

```tsx
data={upcomingCreditGrantApplications?.items ?? []} customerId={customerId}
```

- Line 606: `FormHeader`

```tsx
className='mb-0'
						title={t('subscriptionDetail.subscriptionsInheritance')}
						variant='sub-header'
						titleClassName='font-semibold'
```

- Line 613: `FlexpriceTable`

```tsx
data={inheritedSubscriptionRows} columns={inheritedSubscriptionsColumns}
```

- Line 620: `CouponAssociationTable`

```tsx
subscriptionId={subscription_id}
```

- Line 626: `TaxAssociationTable`

```tsx
data={subscriptionTaxAssociations.items} refetchQueryKey='subscriptionTaxAssociations'
```

## src/components/molecules/ApplyCouponDialog/ApplyCouponDialog.tsx

197 lines. Query keys:

Response/domain field candidates: `item.id`, `item.display_name`, `item.value`, `item.label`

- Line 116: `Dialog`

```tsx
open={open} onOpenChange={handleOpenChange}
```

- Line 117: `DialogContent`

```tsx
className='w-full max-w-lg bg-surface'
```

- Line 118: `DialogHeader`

```tsx

```

- Line 119: `DialogTitle`

```tsx

```

- Line 123: `AsyncSearchableSelect`

```tsx
search={{
							searchFn: couponSearchFn,
							queryKeyPrefix: ['coupon'],
							placeholder: t('subscriptions.applyCouponDialog.couponCodePlaceholder', 'Search by name or code…'),
						}}
						extractors={{
							valueExtractor: (c: Coupon) => c.coupon_code ?? '',
							labelExtractor: (c: Coupon) => c.name,
							descriptionExtractor: (c: Coupon) => c.coupon_code ?? '',
						}}
						display={{
							label: t('subscriptions.applyCouponDialog.couponCodeLabel'),
							placeholder: t('subscriptions.applyCouponDialog.couponCodePlaceholder', 'Search by name or code…'),
							side: 'bottom',
							align: 'start',
						}}
						options={{ hideSelectedTick: false }}
						value={selectedCoupon}
						onChange={setSelectedCoupon}
```

- Line 145: `Select`

```tsx
label={t('subscriptions.applyCouponDialog.applyToLabel')}
						options={SCOPE_OPTIONS}
						value={scope}
						onChange={(val) => setScope(val as CouponScope)}
						disabled={!!prefilledLineItemId}
```

- Line 156: `ShadcnSelect`

```tsx
value={selectedLineItemId} onValueChange={setSelectedLineItemId} disabled={!!prefilledLineItemId}
```

- Line 157: `SelectTrigger`

```tsx

```

- Line 158: `SelectValue`

```tsx
placeholder={t('subscriptions.applyCouponDialog.selectLineItemPlaceholder')}
```

- Line 160: `SelectContent`

```tsx

```

- Line 162: `SelectItem`

```tsx
key={item.value} value={item.value}
```

- Line 183: `DialogFooter`

```tsx

```

- Line 184: `Button`

```tsx
variant='outline' onClick={() => handleOpenChange(false)} className='flex-1'
```

- Line 187: `Button`

```tsx
onClick={handleApply} isLoading={isApplying} disabled={!canApply} className='flex-1'
```

## src/components/molecules/RemoveCouponDialog/RemoveCouponDialog.tsx

86 lines. Query keys:

Response/domain field candidates:

- Line 53: `Dialog`

```tsx
open={open} onOpenChange={onOpenChange}
```

- Line 54: `DialogContent`

```tsx
className='w-full max-w-md bg-surface'
```

- Line 55: `DialogHeader`

```tsx

```

- Line 56: `DialogTitle`

```tsx

```

- Line 72: `DialogFooter`

```tsx

```

- Line 73: `Button`

```tsx
variant='outline' onClick={() => onOpenChange(false)} className='flex-1'
```

- Line 76: `Button`

```tsx
variant='destructive' onClick={handleRemove} isLoading={isRemoving} className='flex-1'
```

## src/components/molecules/ApplyTaxDialog/ApplyTaxDialog.tsx

153 lines. Query keys: `['tax-rates', 'list'],`, `['subscriptionTaxAssociations', subscriptionId],`

Response/domain field candidates:

- Line 107: `Dialog`

```tsx
open={open} onOpenChange={handleOpenChange}
```

- Line 108: `DialogContent`

```tsx
className='w-full max-w-md bg-surface'
```

- Line 109: `DialogHeader`

```tsx

```

- Line 110: `DialogTitle`

```tsx

```

- Line 120: `Select`

```tsx
label={t('subscriptions.applyTaxDialog.taxRateLabel')}
								options={taxRateOptions}
								value={taxRateId}
								onChange={setTaxRateId}
								placeholder={t('subscriptions.applyTaxDialog.selectTaxRatePlaceholder')}
								required
```

- Line 137: `DialogFooter`

```tsx

```

- Line 138: `Button`

```tsx
variant='outline' onClick={() => handleOpenChange(false)} className='flex-1'
```

- Line 142: `Button`

```tsx
onClick={handleApply} isLoading={isApplying} disabled={!taxRateId} className='flex-1'
```

## src/components/molecules/RemoveTaxDialog/RemoveTaxDialog.tsx

83 lines. Query keys:

Response/domain field candidates:

- Line 52: `Dialog`

```tsx
open={open} onOpenChange={onOpenChange}
```

- Line 53: `DialogContent`

```tsx
className='w-full max-w-md bg-surface'
```

- Line 54: `DialogHeader`

```tsx

```

- Line 55: `DialogTitle`

```tsx

```

- Line 69: `DialogFooter`

```tsx

```

- Line 70: `Button`

```tsx
variant='outline' onClick={() => onOpenChange(false)} className='flex-1'
```

- Line 73: `Button`

```tsx
variant='destructive' onClick={handleRemove} isLoading={isRemoving} className='flex-1'
```

## src/pages/customer/customers/CustomerSubscriptionEditPage.tsx

603 lines. Query keys: `subscriptionId`, `subscriptionId`, `subscriptionId ? subscriptionEditInheritedQueryKey(subscriptionId) : ['subscriptionEdit', 'no-inherit'],`, `subscriptionId ? [...subscriptionEditScopeQueryKey(subscriptionId), 'lineItemsForDialog'] : ['disabled'],`, `subscriptionId ? ['subscriptionTaxAssociations', subscriptionId] : ['disabled'],`, `subscriptionId ? ['couponAssociations', subscriptionId] : ['disabled'],`, `['couponAssociations', subscriptionId] });`

Response/domain field candidates: `plan?.name`, `customer?.id`, `customer?.external_id`, `customer.external_id`, `customer.id`

- Line 484: `CouponAssociationTable`

```tsx
subscriptionId={subscriptionId}
									onAdd={() => setApplyCouponOpen(true)}
									onRemove={(assoc) => setRemoveCouponAssociation(assoc)}
```

- Line 495: `TaxAssociationTable`

```tsx
data={taxAssociationsData?.items ?? []}
									showDelete={false}
									onAdd={() => setApplyTaxOpen(true)}
									onRemove={(assoc) => setRemoveTaxAssociation(assoc)}
```

- Line 507: `ApplyCouponDialog`

```tsx
subscriptionId={subscriptionId}
									lineItems={lineItemsForDialog?.items ?? []}
									prefilledLineItemId={applyCouponLineItemId}
									open={applyCouponOpen}
									onOpenChange={(o) => {
										setApplyCouponOpen(o);
										if (!o) setApplyCouponLineItemId(undefined);
									}}
									onSuccess={invalidateCouponAssociations}
```

- Line 519: `RemoveCouponDialog`

```tsx
subscriptionId={subscriptionId}
										association={removeCouponAssociation}
										open={!!removeCouponAssociation}
										onOpenChange={(o) => {
											if (!o) setRemoveCouponAssociation(null);
										}}
										onSuccess={() => {
											setRemoveCouponAssociation(null);
											invalidateCouponAssociations();
										}}
```

- Line 532: `ApplyTaxDialog`

```tsx
subscriptionId={subscriptionId}
									open={applyTaxOpen}
									onOpenChange={setApplyTaxOpen}
									onSuccess={invalidateTaxAssociations}
```

- Line 539: `RemoveTaxDialog`

```tsx
subscriptionId={subscriptionId}
										association={removeTaxAssociation}
										open={!!removeTaxAssociation}
										onOpenChange={(o) => {
											if (!o) setRemoveTaxAssociation(null);
										}}
										onSuccess={() => {
											setRemoveTaxAssociation(null);
											invalidateTaxAssociations();
										}}
```

- Line 556: `PriceOverrideDialog`

```tsx
isOpen={true}
								onOpenChange={(open: boolean) => !open && setEditingLineItem(null)}
								price={lineItemToPrice(editingLineItem.lineItem)}
								onPriceOverride={() => {}}
								onResetOverride={handleResetOverride}
								overriddenPrices={overriddenPrices}
								showEffectiveFrom={true}
								lineItem={editingLineItem.lineItem}
								onLineItemUpdate={handleUsageLineItemUpdate}
								isSaving={isUpdatingLineItem}
```

- Line 571: `SubscriptionLineItemQuantityModifyDialog`

```tsx
isOpen={true}
								onOpenChange={(open: boolean) => !open && setEditingLineItem(null)}
								subscriptionId={subscriptionId}
								lineItem={editingLineItem.lineItem}
								currentPeriodStart={subscriptionDetails.current_period_start}
								currentPeriodEnd={subscriptionDetails.current_period_end}
```

- Line 581: `AddSubscriptionChargeDialog`

```tsx
isOpen={isAddChargeDialogOpen}
							onOpenChange={setIsAddChargeDialogOpen}
							onSave={handleAddChargeSave}
							isSaving={isCreatingLineItem}
							defaultCurrency={subscriptionDetails?.currency}
							defaultBillingPeriod={subscriptionDetails?.billing_period}
							defaultStartDate={subscriptionDetails?.start_date}
							subscriptionId={subscriptionId}
```

## src/pages/customer/import-export/ImportExport.tsx

181 lines. Query keys: `['importTasks', page],`

Response/domain field candidates: `data?.items.length`, `row.id`, `data?.items`, `data?.pagination.total`

- Line 125: `ImportFileDrawer`

```tsx
taskId={activeTask} isOpen={drawerOpen} onOpenChange={(value) => setdrawerOpen(value)}
```

- Line 135: `Button`

```tsx
variant='outline'
						onClick={() => {
							refetchTasks();
						}}
```

- Line 143: `Button`

```tsx
onClick={() => setdrawerOpen(true)} className='flex gap-2 items-center '
```

- Line 150: `Button`

```tsx
disabled className='flex gap-2 items-center'
```

- Line 161: `ImportFileDrawer`

```tsx
taskId={activeTask} isOpen={drawerOpen} onOpenChange={(value) => setdrawerOpen(value)}
```

- Line 164: `FlexpriceTable`

```tsx
onRowClick={(row) => {
						setactiveTask(row.id);
						setdrawerOpen(true);
					}}
					data={data?.items ?? []}
					columns={columns}
					showEmptyRow
```

## src/pages/customer/invoices/AddCreditNotePage.tsx

375 lines. Query keys: `['fetchInvoice', invoice_id],`, `['creditNotes'] });`

Response/domain field candidates: `invoice?.line_items`, `invoice.line_items.map`, `item.quantity`, `item.amount`, `item.id`, `item.display_name`, `invoice.customer?.external_id`, `invoice.invoice_number`, `data.id`, `invoice.payment_status`, `item.max_amount`, `invoice?.currency`, `invoice?.invoice_number`, `invoice?.amount_paid`, `invoice?.amount_remaining`, `item.unit_price`, `item.amount.toString`

- Line 207: `Dialog`

```tsx
isOpen={showConfirmModal} onOpenChange={setShowConfirmModal} title={t('creditNotes.confirmDialogTitle')}
```

- Line 229: `Button`

```tsx
onClick={() => setShowConfirmModal(false)} variant='outline'
```

- Line 232: `Button`

```tsx
onClick={() => {
								setShowConfirmModal(false);
								handleSubmit();
							}}
							disabled={createCreditNoteMutation.isPending}
```

- Line 278: `Select`

```tsx
options={reasonOptions}
							value={selectedReason}
							onChange={(value) => setSelectedReason(value as CREDIT_NOTE_REASON)}
							placeholder={t('creditNotes.selectAReason')}
							className='max-w-md'
```

- Line 289: `AddChargesButton`

```tsx
onClick={() => setShowMemo(!showMemo)} label={t('creditNotes.addMemo')}
```

- Line 291: `Textarea`

```tsx
label={t('creditNotes.memoOptional')}
								value={memo}
								onChange={(value) => setMemo(value)}
								placeholder={t('creditNotes.memoNote')}
								rows={3}
								className='resize-none mt-4'
```

- Line 319: `Input`

```tsx
variant='formatted-number'
											value={item.amount.toString()}
											onChange={(value) => handleAmountChange(item.id, value)}
											min={0}
											inputPrefix={getCurrencySymbol(invoiceCurrency)}
											max={item.max_amount}
											step={0.01}
											className='max-w-40'
											placeholder={t('creditNotes.amountPlaceholder')}
```

- Line 362: `Button`

```tsx
isLoading={createCreditNoteMutation.isPending}
						onClick={() => setShowConfirmModal(true)}
						disabled={!selectedReason || validLineItems.length === 0 || createCreditNoteMutation.isPending}
```

## src/components/molecules/InvoiceTaxAssociationTable/InvoiceTaxAssociationTable.tsx

130 lines. Query keys:

Response/domain field candidates: `data.map`, `data.filter`, `row.tax_rate_code`, `row.priority`, `row.auto_apply`, `row.currency`

- Line 70: `ActionButton`

```tsx
id={row.tax_rate_code}
					copyId={{ entityType: 'Tax Rate' }}
					deleteMutationFn={() => handleDelete(row.tax_rate_code)}
					refetchQueryKey='invoice_tax_overrides'
					entityName={`Tax Override ${row.tax_rate_code}`}
					edit={{
						enabled: !disabled,
						onClick: () => handleEdit(row),
					}}
					archive={{
						enabled: !disabled,
						text: t('actions.delete'),
					}}
```

- Line 91: `TaxAssociationDialog`

```tsx
open={isOpen}
				onOpenChange={setIsOpen}
				entityType={TAXRATE_ENTITY_TYPE.INVOICE}
				entityId='temp'
				onSave={handleSave}
				data={{
					tax_rate_code: selectedTaxOverride?.tax_rate_code || '',
					entity_type: TAXRATE_ENTITY_TYPE.INVOICE,
					entity_id: 'temp',
					priority: selectedTaxOverride?.priority || 1,
					currency: selectedTaxOverride?.currency || defaultCurrency || 'usd',
					auto_apply: selectedTaxOverride?.auto_apply || true,
				}}
				onCancel={() => {
					setIsOpen(false);
					setSelectedTaxOverride(null);
				}}
```

- Line 112: `FormHeader`

```tsx
className='mb-0' title={t('labels.taxRateOverrides')} variant='sub-header'
```

- Line 113: `AddButton`

```tsx
onClick={() => {
							setSelectedTaxOverride(null);
							setIsOpen(true);
						}}
						disabled={disabled}
```

- Line 122: `FlexpriceTable`

```tsx
data={data} columns={columns} showEmptyRow
```

## src/pages/customer/invoices/CreateInvoice.tsx

371 lines. Query keys: `['customer', customerId],`, `['customerTaxAssociations', customerId],`

Response/domain field candidates: `customer?.name`, `item.tax_rate?.code`, `item.currency?.toLowerCase`, `item.auto_apply`, `item.priority`, `item.amount`, `item.quantity`, `item.display_name`, `data.id`, `customer.address_line1`, `customer.address_line2`, `customer.address_city`, `customer.address_state`, `customer.address_postal_code`, `customer.address_country`, `customer?.email`

- Line 220: `FormHeader`

```tsx
title={t('createInvoice.invoiceDetails')} variant='sub-header' titleClassName='font-semibold'
```

- Line 235: `Select`

```tsx
value={currency} options={currencyOptions} onChange={setCurrency}
```

- Line 243: `FormHeader`

```tsx
className='!mb-2' title={user?.tenant.name} variant='sub-header' titleClassName='font-semibold'
```

- Line 250: `FormHeader`

```tsx
className='!mb-2' title={t('createInvoice.billTo')} variant='sub-header' titleClassName='font-semibold'
```

- Line 260: `FormHeader`

```tsx
title={t('createInvoice.orderDetails')} variant='sub-header' titleClassName='font-semibold'
```

- Line 265: `Input`

```tsx
label={index === 0 ? t('createInvoice.itemName') : ''}
											value={item.display_name}
											onChange={(value) => handleLineItemChange(index, 'display_name', value)}
											placeholder={t('createInvoice.itemNamePlaceholder')}
```

- Line 273: `Input`

```tsx
label={index === 0 ? t('createInvoice.quantity') : ''}
											value={item.quantity}
											onChange={(value) => handleLineItemChange(index, 'quantity', value)}
											variant='integer'
											placeholder='1'
```

- Line 282: `Input`

```tsx
label={index === 0 ? t('createInvoice.amount') : ''}
											value={item.amount}
											onChange={(value) => handleLineItemChange(index, 'amount', value)}
											variant='formatted-number'
											inputPrefix={getCurrencySymbol(currency)}
											placeholder={t('creditNotes.amountPlaceholder')}
```

- Line 292: `Input`

```tsx
label={index === 0 ? t('createInvoice.total') : ''}
											value={`${(parseFloat(item.amount || '0') * parseFloat(item.quantity || '0')).toFixed(2)}`}
											disabled
											variant='formatted-number'
											inputPrefix={getCurrencySymbol(currency)}
											placeholder={t('creditNotes.amountPlaceholder')}
```

- Line 302: `Button`

```tsx
variant='outline' className='size-[42px] shrink-0' onClick={() => handleRemoveLineItem(index)}
```

- Line 309: `AddChargesButton`

```tsx
onClick={handleAddLineItem} label={t('createInvoice.addLineItem')}
```

- Line 317: `FormHeader`

```tsx
title={t('createInvoice.taxes')} variant='sub-header' titleClassName='font-semibold'
```

- Line 318: `InvoiceTaxAssociationTable`

```tsx
data={taxOverrides} onChange={setTaxOverrides} defaultCurrency={currency}
```

- Line 324: `FormHeader`

```tsx
title={t('createInvoice.coupons')} variant='sub-header' titleClassName='font-semibold'
```

- Line 358: `Button`

```tsx
variant='outline' className='mr-4' onClick={handleCancel}
```

- Line 361: `Button`

```tsx
onClick={handleSubmit} disabled={isPending}
```

## src/pages/customer/invoices/EditInvoicePage.tsx

872 lines. Query keys: `['invoiceEdit', invoiceId],`

Response/domain field candidates: `invoice.line_items`, `invoice.metadata`, `invoice.due_date`, `invoice.payment_status`, `invoice.invoice_status`, `invoice?.invoice_number`, `invoice.invoice_number`, `invoice?.invoice_status`, `invoice?.due_date`, `invoice?.payment_status`, `row.id`, `row.display_name.trim`, `row.amount`, `row.quantity`, `row.description.trim`, `row.period_start`, `row.period_end`, `row.display_name`, `row.description`, `invoice?.id`, `row?.id`, `invoice.customer_id`, `invoice.customer?.name`, `invoice.issue_date`, `invoice.currency`, `invoice.period_start`, `invoice.period_end`, `invoice.description`, `invoice.subtotal`, `invoice.total`, `invoice.total_prepaid_credits_applied`, `invoice.total_discount`, `invoice.total_tax`, `invoice.amount_paid`, `invoice.overpaid_amount`, `invoice.amount_remaining`, `invoice.amount_due`, `invoice.invoice_type`, `row.key`, `row.value`

- Line 474: `Dialog`

```tsx
isOpen={isVoidConfirmOpen}
					onOpenChange={setIsVoidConfirmOpen}
					title={t('invoices.edit.voidConfirm.title')}
					description={t('invoices.edit.voidConfirm.description')}
```

- Line 480: `Button`

```tsx
variant='outline' onClick={() => setIsVoidConfirmOpen(false)}
```

- Line 483: `Button`

```tsx
onClick={handleVoidConfirmProceed} disabled={isPending}
```

- Line 492: `FormHeader`

```tsx
className='!mb-0' title={t('invoices.edit.detailsTitle')} variant='sub-header' titleClassName='font-semibold'
```

- Line 513: `Select`

```tsx
value={invoiceStatus}
											options={[
												{
													value: INVOICE_STATUS.DRAFT,
													label: t('invoices.status.draft'),
													disabled: invoice.invoice_status !== INVOICE_STATUS.DRAFT,
												},
												{
													value: INVOICE_STATUS.FINALIZED,
													label: t('invoices.status.finalized'),
													disabled: invoice.invoice_status !== INVOICE_STATUS.FINALIZED && !canFinalize,
												},
												{
													value: INVOICE_STATUS.VOIDED,
													label: t('invoices.status.void'),
													disabled: !canVoid,
												},
											]}
											onChange={setInvoiceStatus}
											description={
												invoiceStatus === INVOICE_STATUS.VOIDED && invoiceStatusChanged ? t('invoices.edit.voidOnSaveHint') : undefined
											}
```

- Line 546: `Select`

```tsx
value={paymentStatus}
											options={[
												{ value: PAYMENT_STATUS.PENDING, label: t('invoices.details.paymentStatusModal.pendingLabel') },
												{ value: PAYMENT_STATUS.SUCCEEDED, label: t('invoices.details.paymentStatusModal.succeededLabel') },
												{ value: PAYMENT_STATUS.FAILED, label: t('invoices.details.paymentStatusModal.failedLabel') },
											]}
											onChange={setPaymentStatus}
```

- Line 601: `FormHeader`

```tsx
title={t('invoices.edit.lineItemsTitle')}
									subtitle={t('invoices.edit.manualEditHint')}
									variant='sub-header'
									titleClassName='font-semibold'
									subtitleClassName='!mt-1 text-sm text-content-zinc-muted'
```

- Line 651: `Input`

```tsx
value={row.display_name}
																	onChange={(value) => handleLineItemChange(index, 'display_name', value)}
																	placeholder={t('createInvoice.itemNamePlaceholder')}
```

- Line 656: `Input`

```tsx
value={row.description}
																	onChange={(value) => handleLineItemChange(index, 'description', value)}
																	placeholder={t('invoices.edit.lineItemDescriptionPlaceholder')}
```

- Line 664: `Input`

```tsx
value={row.quantity}
																onChange={(value) => handleLineItemChange(index, 'quantity', value)}
																variant='integer'
																placeholder='1'
```

- Line 672: `Input`

```tsx
value={row.amount}
																onChange={(value) => handleLineItemChange(index, 'amount', value)}
																variant='formatted-number'
																placeholder={t('creditNotes.amountPlaceholder')}
```

- Line 690: `Button`

```tsx
variant='ghost'
																	className='size-8'
																	aria-label={t('common:actions.done')}
																	onClick={() => setRowEditor(null)}
```

- Line 697: `Button`

```tsx
variant='ghost'
																	className='size-8'
																	aria-label={t('common:actions.cancel')}
																	onClick={handleRowEditorCancel}
```

- Line 737: `Button`

```tsx
variant='ghost'
																	className='size-8 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100'
																	aria-label={t('invoices.edit.editLineItem')}
																	onClick={(e) => {
																		e.stopPropagation();
																		handleOpenRowEditor(index);
																	}}
```

- Line 747: `Button`

```tsx
variant='ghost'
																	className='size-8 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100'
																	aria-label={t('invoices.edit.removeLineItem')}
																	onClick={(e) => {
																		e.stopPropagation();
																		handleRemoveLineItemRow(index);
																	}}
```

- Line 773: `AddChargesButton`

```tsx
onClick={handleAddLineItem} label={t('createInvoice.addLineItem')}
```

- Line 778: `Checkbox`

```tsx
id='apply-discount'
								checked={applyDiscount}
								onCheckedChange={(checked) => setApplyDiscount(!!checked)}
								label={t('invoices.edit.applyDiscount')}
								description={t('invoices.edit.applyDiscountDescription')}
```

- Line 789: `InvoiceLineItemTable`

```tsx
title={t('invoices.edit.lineItemsTitle')}
								data={invoice.line_items ?? []}
								subtotal={invoice.subtotal}
								total={invoice.total}
								total_prepaid_credits_applied={invoice.total_prepaid_credits_applied}
								discount={invoice.total_discount}
								total_tax={invoice.total_tax}
								amount_paid={invoice.amount_paid}
								overpaid_amount={invoice.overpaid_amount}
								amount_remaining={Number(invoice.amount_remaining)}
								amount_due={invoice.amount_due}
								currency={invoice.currency}
								invoiceType={invoice.invoice_type as INVOICE_TYPE}
```

- Line 811: `FormHeader`

```tsx
title={t('invoices.edit.metadata')} variant='sub-header' titleClassName='font-semibold'
```

- Line 817: `Input`

```tsx
placeholder={t('common:form.key')}
											value={row.key}
											onChange={(value) => handleMetadataChange(index, 'key', value)}
											disabled={!isEditable}
```

- Line 825: `Textarea`

```tsx
placeholder={t('common:form.value')}
											value={row.value}
											onChange={(value) => handleMetadataChange(index, 'value', value)}
											textAreaClassName='min-h-6 h-6 rounded-md'
											className='rounded-md'
											disabled={!isEditable}
```

- Line 834: `Button`

```tsx
variant='ghost'
										className='size-10'
										onClick={() => setMetadataRows((prev) => prev.filter((_, i) => i !== index))}
										disabled={!isEditable}
										aria-label={t('common:form.remove')}
```

- Line 846: `AddChargesButton`

```tsx
onClick={() => setMetadataRows((prev) => [...prev, { key: '', value: '' }])}
										label={t('common:form.addAnotherItem')}
```

- Line 857: `Button`

```tsx
variant='outline' className='mr-4' onClick={handleCancel}
```

- Line 861: `Button`

```tsx
onClick={handleSave} disabled={!hasChanges || isPending}
```

## src/pages/customer/invoices/InvoiceDetailsPage.tsx

89 lines. Query keys: `['payments', invoiceId],`, `['creditNotes', invoiceId],`

Response/domain field candidates:

- Line 53: `InvoicePaymentsTable`

```tsx
data={payments?.items ?? []}
```

- Line 71: `CreditNoteTable`

```tsx
data={creditNotes?.items ?? []}
```

## src/pages/customer/invoices/InvoicePage.tsx

389 lines. Query keys: `'fetchInvoices',`

Response/domain field candidates: `row.subscription_customer`, `row.invoice_status?.toUpperCase`, `row.invoice_number`, `row.currency`, `row.amount_due`, `row.invoice_status`, `row.customer?.name`, `row.customer?.id`, `row.customer.id`, `row.customer.name`, `row.payment_status`, `row.due_date`, `row.id`

- Line 336: `InvoiceTableMenu`

```tsx
data={row}
```

## src/components/organisms/QueryableDataArea/TutorialCards.tsx

60 lines. Query keys:

Response/domain field candidates: `item.imageUrl`, `item.imageUrl.trim`, `item.onClick`, `item.title`

## src/pages/customer/payments/PaymentList.tsx

64 lines. Query keys: `['payments', page],`

Response/domain field candidates:

- Line 57: `InvoicePaymentsTable`

```tsx
data={payments?.items ?? []}
```

## src/pages/customer/payments/WalletTransactionList.tsx

284 lines. Query keys: `'fetchAllWalletTransactionsMain',`

Response/domain field candidates: `customer?.name`, `customer?.email`

## src/pages/customer/subscriptions/Subscriptions.tsx

343 lines. Query keys: `'fetchSubscriptions',`

Response/domain field candidates: `row.customer_id`, `row.customer?.name`, `row.plan_id`, `row.plan?.name`, `row.subscription_status`, `row.start_date`, `row.current_period_end`, `row.id`, `row.current_period_start`, `row?.customer_id`, `row?.id`

- Line 230: `ActionButton`

```tsx
id={row.id}
							copyId={{ entityType: 'Subscription' }}
							deleteMutationFn={async () => Promise.resolve()}
							refetchQueryKey='fetchSubscriptions'
							isArchiveDisabled={true}
							entityName={t('subscriptions.listPage.entityNameForActions')}
							edit={{
								path: `${RouteNames.subscriptions}/${row.id}/edit`,
								disabled: !canWriteSubscription,
								disabledReason: canWriteSubscription ? undefined : t('subscriptions.listPage.writeDeniedTooltip'),
							}}
							archive={{
								enabled: false,
							}}
							customActions={[
								{
									text: t('subscriptions.listPage.cancelAction'),
									icon: <Trash2 />,
									enabled: row.subscription_status !== SUBSCRIPTION_STATUS.CANCELLED,
									onClick: () => setCancelSubscription({ id: row.id, currentPeriodStart: row.current_period_start }),
									disabled: !canWriteSubscription,
									disabledReason: canWriteSubscription ? undefined : t('subscriptions.listPage.writeDeniedTooltip'),
								},
							]}
```

- Line 269: `AddButton`

```tsx
onClick={handleAddSubscription}
```

- Line 273: `AddButton`

```tsx
disabled
```

- Line 327: `SubscriptionCancelDialog`

```tsx
isOpen={!!cancelSubscription}
				onOpenChange={(open) => {
					if (!open) {
						setCancelSubscription(null);
					}
				}}
				subscriptionId={cancelSubscription?.id}
				currentPeriodStart={cancelSubscription?.currentPeriodStart}
				refetchQueryKeys={['fetchSubscriptions']}
```

## src/pages/customer/tabs/CustomerAnalyticsTab.tsx

784 lines. Query keys: `['customer', customerId],`, `['usage', customerId, debouncedUsageParams],`, `['cost-analytics', customerId, debouncedCostParams],`, `['fetchFeatures2'],`

Response/domain field candidates: `customer?.external_id`, `customer.external_id`, `feature.id`, `item.total_usage`, `item.type`, `item.id`, `item.value`, `row.sub_line_item_id`, `row.price_id`, `row.meter_id`, `row.feature_id`, `row.name`, `row.total_usage_display`, `row.total_usage`, `row.reporting_unit`, `row.reporting_unit.unit_singular`, `row.reporting_unit.unit_plural`, `row.unit`, `row.unit_plural`, `row.total_cost`, `row.currency`, `row.price?.entity_type`, `row.price`, `row.cogs`, `row.margin`, `feature.group`, `price.group`, `item.group`, `item.feature?.group`, `item.price?.group`

- Line 329: `FeatureMultiSelect`

```tsx
label={t('tabPanels.analytics.featuresLabel')}
								placeholder={t('tabPanels.analytics.featuresPlaceholder')}
								values={selectedFeatures.map((f) => f.id)}
								onChange={setSelectedFeatures}
								className='text-sm'
```

- Line 366: `UiCheckbox`

```tsx
id='include-children' checked={includeChildren} onCheckedChange={(v) => setIncludeChildren(Boolean(v))}
```

- Line 381: `TableSkeleton`

```tsx

```

- Line 386: `TableSkeleton`

```tsx

```

- Line 450: `UsageDataTable`

```tsx
items={mergedUsageItems}
```

- Line 457: `CostDataTable`

```tsx
items={unmatchedCostItems}
```

- Line 494: `TableRow`

```tsx
key={usageRowKey(row, childIndex)}
					className='h-10 align-middle border-b border-line bg-surface hover:bg-surface-subtle/50 transition-colors'
```

- Line 497: `TableCell`

```tsx
className='py-2.5 pl-4 font-normal text-content-secondary text-[13px] align-middle'
```

- Line 506: `TableCell`

```tsx
className='py-2.5 font-normal text-content-tertiary text-[13px]'
```

- Line 507: `TableCell`

```tsx
className='py-2.5 font-normal text-content-tertiary text-[13px]'
```

- Line 508: `TableCell`

```tsx
className='py-2.5 font-normal text-content-tertiary text-[13px]'
```

- Line 509: `TableCell`

```tsx
className='py-2.5 font-normal text-content-tertiary text-[13px]'
```

- Line 681: `Table`

```tsx

```

- Line 682: `TableHeader`

```tsx
className='h-10 bg-surface-subtle border-b border-line rounded-t-md'
```

- Line 683: `TableRow`

```tsx
className='rounded-t-md border-b border-line'
```

- Line 684: `TableHead`

```tsx
className='rounded-tl-md pl-4 font-semibold text-content-secondary text-[13px]'
```

- Line 687: `TableHead`

```tsx
className='font-semibold text-content-secondary text-[13px]'
```

- Line 690: `TableHead`

```tsx
className='font-semibold text-content-secondary text-[13px]'
```

- Line 693: `TableHead`

```tsx
className='font-semibold text-content-secondary text-[13px]'
```

- Line 696: `TableHead`

```tsx
className='rounded-tr-md font-semibold text-content-secondary text-[13px]'
```

- Line 701: `TableBody`

```tsx

```

- Line 712: `TableRow`

```tsx
role='button'
										tabIndex={0}
										onClick={() => bucket.items.length > 0 && toggleGroup(bucket.groupKey)}
										onKeyDown={(e) => {
											if ((e.key === 'Enter' || e.key === ' ') && bucket.items.length > 0) {
												e.preventDefault();
												toggleGroup(bucket.groupKey);
											}
										}}
										className={cn(
											'h-10 align-middle border-b border-line bg-surface cursor-pointer hover:bg-surface-subtle/50 transition-colors',
											bucket.items.length === 0 && 'border-b-0',
											bucket.items.length === 0 && 'cursor-default',
										)}
```

- Line 727: `TableCell`

```tsx
className='pl-4 py-2.5 align-middle'
```

- Line 735: `TableCell`

```tsx
className='py-2.5 font-normal text-content-secondary text-[13px]'
```

- Line 736: `TableCell`

```tsx
className='py-2.5 font-normal text-content-tertiary text-[13px]'
```

- Line 739: `TableCell`

```tsx
className='py-2.5 font-normal text-content-tertiary text-[13px]'
```

- Line 742: `TableCell`

```tsx
className='py-2.5 font-normal text-content-tertiary text-[13px]'
```

- Line 751: `TableRow`

```tsx
key={`ungrouped:${usageRowKey(row, index)}`}
								className='h-10 align-middle border-b border-line bg-surface hover:bg-surface-subtle/50 transition-colors'
```

- Line 754: `TableCell`

```tsx
className='pl-4 py-2.5 font-normal text-content-secondary text-[13px]'
```

- Line 763: `TableCell`

```tsx
className='py-2.5 font-normal text-content-tertiary text-[13px]'
```

- Line 764: `TableCell`

```tsx
className='py-2.5 font-normal text-content-tertiary text-[13px]'
```

- Line 765: `TableCell`

```tsx
className='py-2.5 font-normal text-content-tertiary text-[13px]'
```

- Line 766: `TableCell`

```tsx
className='py-2.5 font-normal text-content-tertiary text-[13px]'
```

- Line 770: `TableRow`

```tsx
className='bg-surface'
```

- Line 771: `TableCell`

```tsx
colSpan={5} className='pl-4 py-4 font-normal text-content-muted text-[13px]'
```

## src/pages/customer/tabs/CustomerInformationTab.tsx

312 lines. Query keys: `['fetchCustomerDetails', customerId],`, `['connections', CONNECTION_PROVIDER_TYPE.STRIPE],`, `['subscriptionsByInvoicingCustomer', customerId],`, `['customersByIds', sortedSubscriberIdsKey],`

Response/domain field candidates: `row.name`, `row.external_id`, `row.subscriptionCount`, `customer?.metadata`, `customer?.external_id`, `customer?.name`, `customer?.email`, `customer?.timezone?.trim`, `customer.timezone`, `customer?.address_line1`, `customer?.address_country`, `customer.address_country`, `customer?.address_line2`, `customer?.address_state`, `customer?.address_city`, `customer?.address_postal_code`, `row?.id`, `row.id`

- Line 216: `Button`

```tsx
variant='outline' size='sm' onClick={() => setShowSaveCardModal(true)} className='!h-9 flex items-center gap-2'
```

- Line 223: `Button`

```tsx
variant='outline' size='icon' onClick={copyToClipboard} title={t('tabPanels.information.sharePortalLinkTitle')}
```

- Line 226: `CreateCustomerDrawer`

```tsx
trigger={
											<Button variant={'outline'} size={'icon'}>
												<Pencil />
											</Button>
										}
										open={customerDrawerOpen}
										onOpenChange={setcustomerDrawerOpen}
										data={customer}
```

- Line 228: `Button`

```tsx
variant={'outline'} size={'icon'}
```

- Line 249: `Button`

```tsx
variant='outline' size='icon' onClick={() => setShowMetadataModal(true)}
```

- Line 296: `FlexpriceTable`

```tsx
data={invoicedSubscriberRows}
								columns={invoicedSubscribersColumns}
								showEmptyRow
								variant='no-bordered'
								onRowClick={(row) => row?.id && navigate(`${RouteNames.customers}/${row.id}`)}
```

## src/pages/customer/tabs/CustomerUsageEventsTab.tsx

331 lines. Query keys: `['fetchCustomerDetails', customerId],`

Response/domain field candidates: `customer?.external_id`, `response.events`, `response.iter_last_key`, `response.has_more`

- Line 308: `Button`

```tsx
variant='outline' onClick={refetchEvents}
```

- Line 313: `EventsTable`

```tsx
data={events}
```

## src/pages/customer/tabs/CustomerInvoiceTab.tsx

113 lines. Query keys: `['invoice', customerId, page],`, `['subscriptionCustomers', subCustIds],`

Response/domain field candidates: `data?.items`, `data.items.map`, `invoice.id`, `invoice.addInvoice`, `invoice.writeDeniedTooltip`, `data?.items?.length`, `invoice.title`, `invoice.emptySubtitle`, `invoice.paginationUnit`, `data?.pagination.total`

- Line 73: `AddButton`

```tsx
label={t('tabPanels.invoice.addInvoice')}
			onClick={() => {
				navigate(`${RouteNames.customers}/${customerId}/invoices/create`);
			}}
```

- Line 82: `AddButton`

```tsx
disabled label={t('tabPanels.invoice.addInvoice')}
```

- Line 105: `CustomerInvoiceTable`

```tsx
onRowClick={handleShowDetails} customerId={customerId} data={enrichedInvoices}
```

## src/pages/customer/tabs/CustomerOverviewTab.tsx

340 lines. Query keys: `['customerSubscriptions', customerId, limit, offset, sanitizedFilters, sanitizedSorts],`, `['plansByFilter', uniquePlanIds],`, `['subscriptionOverride', sub.id],`, `['usage', customerId],`, `['upcomingCreditGrantApplications', customerId],`, `['fetchCustomerDetails', customerId],`

Response/domain field candidates: `plan.id`, `plan.name`, `data.subscriptionId`, `data.hasOverride`, `row.id`

- Line 285: `AddButton`

```tsx
onClick={handleAddSubscription}
```

- Line 289: `AddButton`

```tsx
disabled
```

- Line 304: `SubscriptionTable`

```tsx
onRowClick={(row) => {
					navigate(`${RouteNames.customers}/${customerId}/subscription/${row.id}`);
				}}
				data={subscriptionsWithPlan as Subscription[]}
				subscriptionOverrides={subscriptionOverrides}
```

- Line 328: `CustomerUsageTable`

```tsx
data={usageData?.features ?? []}
```

- Line 332: `UpcomingCreditGrantApplicationsTable`

```tsx
data={upcomingCreditGrantApplications?.items ?? []} customerId={customerId}
```

## src/pages/customer/tabs/CustomerTaxAssociationTab.tsx

135 lines. Query keys: `['fetchTaxAssociations', customerId, page],`

Response/domain field candidates:

- Line 87: `AddButton`

```tsx
onClick={handleAddTaxAssociation} disabled={false}
```

- Line 91: `AddButton`

```tsx
disabled
```

- Line 100: `TaxAssociationDialog`

```tsx
open={dialogOpen}
					onOpenChange={setDialogOpen}
					entityType={TAXRATE_ENTITY_TYPE.CUSTOMER}
					entityId={customerId!}
					onSave={handleSaveTaxAssociation}
					onCancel={handleCancelTaxAssociation}
```

- Line 118: `TaxAssociationTable`

```tsx
data={taxAssociationsData.items} showDelete={!isArchived && canWriteTax}
```

- Line 122: `TaxAssociationDialog`

```tsx
open={dialogOpen}
				onOpenChange={setDialogOpen}
				entityType={TAXRATE_ENTITY_TYPE.CUSTOMER}
				entityId={customerId!}
				onSave={handleSaveTaxAssociation}
				onCancel={handleCancelTaxAssociation}
```

## src/pages/customer/tabs/CustomerWalletTab.tsx

587 lines. Query keys: `['fetchWallets', customerId],`, `['fetchWalletBalances', customerId, activeWallet?.id],`, `['fetchWalletsTransactions', customerId, activeWallet?.id, limit, offset],`

Response/domain field candidates: `wallet.name`, `wallet.id`, `wallet.writeDeniedTooltip`, `wallet.alertSettingsWriteDeniedTooltip`, `wallet.emptyTitle`, `wallet.emptySubtitle`, `wallet.addWallet`, `wallet.topupWallet`, `wallet.detailsTitle`, `wallet.balanceLabel`, `wallet.currentBalanceShort`, `wallet.ongoingBalanceShort`, `wallet.currentBalanceTooltip`, `wallet.creditsSuffix`, `wallet.noTransactionsTitle`, `wallet.noTransactionsSubtitle`, `wallet.transactionsTitle`, `wallet.transactionsPaginationUnit`, `wallet.noMetadataTitle`, `wallet.noMetadataHint`

- Line 257: `Dialog`

```tsx
open={showTopupModal} onOpenChange={() => setShowTopupModal(false)}
```

- Line 305: `WalletAlertDialog`

```tsx
open={showAlertDialog}
				alertSettings={activeWallet?.alert_settings}
				currency={activeWallet?.currency}
				onSave={async (alertSettings) => {
					if (!activeWallet?.id) return;
					try {
						await WalletApi.updateWallet(activeWallet.id!, {
							alert_settings: alertSettings,
						});
						setShowAlertDialog(false);
						refetchQueries(['fetchWallets', customerId!]);
						toast.success('Alert settings updated successfully');
					} catch (e) {
						logger.error('Failed to update alert settings', e);
						toast.error('Failed to update alert settings');
					}
				}}
				onClose={() => setShowAlertDialog(false)}
```

- Line 344: `AddButton`

```tsx
label={t('tabPanels.wallet.addWallet')} onClick={() => setShowCreateWalletModal(true)}
```

- Line 348: `AddButton`

```tsx
label={t('tabPanels.wallet.addWallet')} disabled
```

- Line 360: `Select`

```tsx
options={walletOptions}
									value={activeWallet?.id}
									onChange={(value) => {
										const selectedWallet = wallets?.find((wallet) => wallet.id === value) || null;
										setActiveWallet(selectedWallet);
										setQueryParam('activeWalletId', value || '');
									}}
```

- Line 376: `Button`

```tsx
onClick={() => setShowTopupModal(true)}
```

- Line 383: `Button`

```tsx
disabled
```

- Line 395: `Button`

```tsx
variant={'outline'} prefixIcon={<EllipsisVertical />} size={'icon'}
```

- Line 519: `FormHeader`

```tsx
title={t('tabPanels.wallet.noTransactionsTitle')}
										variant='sub-header'
										subtitle={t('tabPanels.wallet.noTransactionsSubtitle')}
```

- Line 528: `FormHeader`

```tsx
title={t('tabPanels.wallet.transactionsTitle')} titleClassName='!font-semibold' variant='form-title'
```

- Line 531: `WalletTransactionsTable`

```tsx
data={transactionsData?.items || []}
```

- Line 547: `Button`

```tsx
variant='outline' size='icon' onClick={() => setShowMetadataModal(true)}
```

- Line 553: `Button`

```tsx
disabled variant='outline' size='icon'
```

## src/pages/customer/taxes/TaxrateDetailsPage.tsx

203 lines. Query keys: `['fetchTaxRate', taxrateId],`

Response/domain field candidates:

- Line 137: `Button`

```tsx
onClick={() => setTaxDrawerOpen(true)} variant={'outline'} className='flex gap-2'
```

- Line 144: `Button`

```tsx
disabled variant={'outline'} className='flex gap-2'
```

- Line 153: `Button`

```tsx
onClick={() => archiveTaxRate()}
							disabled={taxData?.status === ENTITY_STATUS.ARCHIVED}
							variant={'outline'}
							className='flex gap-2'
```

- Line 164: `Button`

```tsx
disabled variant={'outline'} className='flex gap-2'
```

- Line 173: `TaxDrawer`

```tsx
data={taxData as TaxRate} open={taxDrawerOpen} onOpenChange={setTaxDrawerOpen} refetchQueryKeys={['fetchTaxRate']}
```

## src/pages/customer/taxes/TaxRatesPage.tsx

118 lines. Query keys: `['fetchTaxRates', page],`

Response/domain field candidates:

- Line 77: `TaxDrawer`

```tsx
data={activeTax as TaxRate | null}
					open={taxDrawerOpen}
					onOpenChange={setTaxDrawerOpen}
					refetchQueryKeys={['fetchTaxRates']}
```

- Line 92: `AddButton`

```tsx
onClick={handleCreateNew}
```

- Line 96: `AddButton`

```tsx
disabled
```

- Line 103: `TaxTable`

```tsx
data={taxData?.items || []} onEdit={handleEdit}
```

- Line 107: `TaxDrawer`

```tsx
data={activeTax as TaxRate | null}
				open={taxDrawerOpen}
				onOpenChange={setTaxDrawerOpen}
				refetchQueryKeys={['fetchTaxRates']}
```

## src/pages/developer/developer.tsx

274 lines. Query keys: `['secret-keys', page, limit, offset],`

Response/domain field candidates:

- Line 188: `ActionButton`

```tsx
id={rowData.id}
								copyId={{ entityType: 'Secret Key' }}
								deleteMutationFn={async (id: string) => {
									await SecretKeysApi.deleteSecretKey(id);
								}}
								refetchQueryKey='secret-keys'
								entityName={rowData?.name}
								// edit={{
								// 	enabled: true,
								// 	onClick: () => {},
								// }}
								edit={{ enabled: false }}
								archive={{
									text: t('common:actions.delete'),
									icon: <TrashIcon />,
									disabled: !canWriteSecret,
									disabledReason: canWriteSecret ? undefined : t('apiKeys.writeDeniedTooltip'),
								}}
```

- Line 227: `SecretKeyDrawer`

```tsx
isOpen={isSecretKeyDrawerOpen} onOpenChange={setIsSecretKeyDrawerOpen}
```

- Line 250: `Button`

```tsx
prefixIcon={<Plus />} onClick={handleAddSecretKey}
```

- Line 256: `Button`

```tsx
disabled prefixIcon={<Plus />}
```

- Line 264: `FlexpriceTable`

```tsx
showEmptyRow columns={columns} data={secretKeys?.items || []}
```

## src/components/molecules/ServiceAccountDrawer/ServiceAccountDrawer.tsx

219 lines. Query keys: `['rbac-roles', 'service_account'],`, `['service-accounts'] });`, `['service-accounts'] });`

Response/domain field candidates: `data.name`

- Line 106: `Dialog`

```tsx
isOpen={isOpen}
				onOpenChange={onOpenChange}
				title={t('developers:serviceAccountDrawer.editTitle')}
				description={t('developers:serviceAccountDrawer.editDescription')}
```

- Line 112: `Input`

```tsx
label={t('developers:labels.name')}
						placeholder={t('developers:serviceAccountDrawer.namePlaceholder')}
						value={name}
						onChange={setName}
```

- Line 118: `Button`

```tsx
isLoading={isPending} disabled={isPending || !name.trim()} onClick={() => updateServiceAccount()}
```

- Line 144: `Input`

```tsx
label={t('developers:labels.name')}
					placeholder={t('developers:serviceAccountDrawer.namePlaceholder')}
					value={name}
					onChange={setName}
```

- Line 177: `Checkbox`

```tsx
id={`role-${role.value}`}
												checked={selectedRoles.includes(role.value)}
												onCheckedChange={() => toggleRole(role.value)}
```

- Line 210: `Button`

```tsx
isLoading={isPending} disabled={!isCreateFormValid || isRolesError} onClick={() => createServiceAccount()}
```

## src/pages/developer/ServiceAccounts.tsx

190 lines. Query keys: `['service-accounts', page],`

Response/domain field candidates: `row.name`, `row.id.slice`, `row.id`, `row.roles`, `row.roles.length`, `row.roles.map`, `row.tenant?.created_at`, `row.tenant?.updated_at`

- Line 61: `CopyIdButton`

```tsx
id={row.id} entityType='Service Account'
```

- Line 106: `ActionButton`

```tsx
id={row.id}
						copyId={{ entityType: 'Service Account' }}
						entityName={row.name || row.id}
						deleteMutationFn={async () => UserApi.deleteUser(row.id)}
						refetchQueryKey='service-accounts'
						edit={{
							enabled: true,
							onClick: () => handleEdit(row),
							disabled: !canWriteUser,
							disabledReason: canWriteUser ? undefined : t('serviceAccounts.writeDeniedTooltip'),
						}}
						// edit={{ enabled: false }}
						archive={{
							enabled: true,
							text: t('common:actions.delete'),
							icon: <Trash2 className='h-4 w-4' />,
							disabled: !canWriteUser,
							disabledReason: canWriteUser ? undefined : t('serviceAccounts.writeDeniedTooltip'),
						}}
```

- Line 145: `ServiceAccountDrawer`

```tsx
isOpen={isDrawerOpen} onOpenChange={setIsDrawerOpen} data={selectedAccount}
```

- Line 166: `Button`

```tsx
prefixIcon={<Plus />} onClick={handleAdd}
```

- Line 172: `Button`

```tsx
disabled prefixIcon={<Plus />}
```

- Line 180: `FlexpriceTable`

```tsx
showEmptyRow columns={serviceAccountColumns} data={serviceAccountsResponse?.items || []}
```

## src/pages/developer/WorkflowsPage.tsx

228 lines. Query keys: `'fetchWorkflows',`

Response/domain field candidates: `row.workflow_id`, `row.run_id`, `row.workflow_type`, `row.status`, `row.start_time`, `row.close_time`, `row.duration_ms`

- Line 193: `Button`

```tsx
variant='outline' onClick={() => refetchQueries('fetchWorkflows')} aria-label={t('common:actions.refresh')}
```

## src/pages/developer/WorkflowDetailsPage.tsx

151 lines. Query keys: `['workflowDetails', workflowId, runId],`

Response/domain field candidates: `row.status`, `row.start_time`, `row.close_time`, `row.error`, `row.error.message`

- Line 112: `Button`

```tsx
variant='outline' prefixIcon={<ArrowLeft className='h-4 w-4' />} onClick={() => navigate(RouteNames.workflows)}
```

- Line 125: `Button`

```tsx
variant='outline' size='sm' prefixIcon={<ArrowLeft className='h-4 w-4' />} onClick={() => navigate(RouteNames.workflows)}
```

- Line 138: `FlexpriceTable`

```tsx
columns={activityColumns} data={wfResolved.activities} showEmptyRow={false}
```

## src/components/molecules/IntegrationDrawer/IntegrationDrawer.tsx

110 lines. Query keys:

Response/domain field candidates:

- Line 78: `Input`

```tsx
label={t('integrationDrawer.connectionName')}
					placeholder={t('integrationDrawer.connectionNamePlaceholder')}
					value={formData.name}
					onChange={(value) => handleChange('name', value)}
					error={errors.name}
					description={t('integrationDrawer.connectionNameHint')}
```

- Line 86: `Input`

```tsx
label={t('integrationDrawer.apiSecretKey')}
					placeholder={t('integrationDrawer.apiSecretPlaceholder')}
					type='password'
					value={formData.apiKey}
					onChange={(value) => handleChange('apiKey', value)}
					error={errors.apiKey}
```

- Line 97: `Button`

```tsx
variant='outline' onClick={() => onOpenChange(false)} className='flex-1'
```

- Line 100: `Button`

```tsx
onClick={handleSave} className='flex-1'
```

## src/components/molecules/StripeConnectionDrawer/StripeConnectionDrawer.tsx

423 lines. Query keys:

Response/domain field candidates: `plan?.inbound`, `subscription?.inbound`, `invoice?.outbound`, `price?.outbound`

- Line 280: `Input`

```tsx
label={t('integrationDrawer.connectionName')}
					placeholder={t('integrations.stripe.connectionPlaceholder')}
					value={formData.name}
					onChange={(value) => handleChange('name', value)}
					error={errors.name}
					description={t('integrations.stripe.connectionNameHint')}
```

- Line 291: `Input`

```tsx
label={t('integrations.stripe.secretKeyLabel')}
						placeholder={t('integrations.stripe.secretKeyPlaceholder')}
						type='password'
						value={formData.secret_key}
						onChange={(value) => handleChange('secret_key', value)}
						error={errors.secret_key}
						description={t('integrations.stripe.secretKeyHint')}
```

- Line 314: `Switch`

```tsx
checked={formData.sync_config.plan} onCheckedChange={(checked) => handleSyncConfigChange('plan', checked)}
```

- Line 323: `Switch`

```tsx
checked={formData.sync_config.invoice} onCheckedChange={(checked) => handleSyncConfigChange('invoice', checked)}
```

- Line 332: `Switch`

```tsx
checked={formData.sync_config.price} onCheckedChange={(checked) => handleSyncConfigChange('price', checked)}
```

- Line 341: `Switch`

```tsx
checked={formData.sync_config.subscription}
								onCheckedChange={(checked) => handleSyncConfigChange('subscription', checked)}
```

- Line 356: `Input`

```tsx
label={t('connection.webhook.secretLabel')}
								placeholder={t('integrations.stripe.webhookSecretPlaceholder')}
								type='password'
								value={formData.webhook_secret}
								onChange={(value) => handleChange('webhook_secret', value)}
								error={errors.webhook_secret}
								description={t('integrations.stripe.webhookSecretDescription')}
```

- Line 374: `Button`

```tsx
size='xs' variant='outline' onClick={handleCopyWebhookUrl} className='flex items-center gap-1'
```

- Line 410: `Button`

```tsx
variant='outline' onClick={() => onOpenChange(false)} className='flex-1' disabled={isPending}
```

- Line 413: `Button`

```tsx
onClick={handleSave} className='flex-1' isLoading={isPending} disabled={isPending}
```

## src/components/molecules/RazorpayConnectionDrawer/RazorpayConnectionDrawer.tsx

354 lines. Query keys:

Response/domain field candidates: `invoice?.outbound`

- Line 230: `Input`

```tsx
label={t('integrationDrawer.connectionName')}
					placeholder={t('connection.razorpay.connectionPlaceholder')}
					value={formData.name}
					onChange={(value) => handleChange('name', value)}
					error={errors.name}
					description={t('connection.razorpay.connectionHint')}
```

- Line 241: `Input`

```tsx
label={t('connection.razorpay.keyId')}
						value={formData.key_id}
						onChange={(value) => handleChange('key_id', value)}
						error={errors.key_id}
						description={t('connection.razorpay.keyIdHint')}
```

- Line 252: `Input`

```tsx
label={t('connection.labels.secretKey')}
						placeholder={t('connection.razorpay.secretKeyPlaceholder')}
						type='password'
						value={formData.secret_key}
						onChange={(value) => handleChange('secret_key', value)}
						error={errors.secret_key}
						description={t('connection.razorpay.secretKeyHint')}
```

- Line 275: `Switch`

```tsx
checked={formData.sync_config.invoice} onCheckedChange={(checked) => handleSyncConfigChange('invoice', checked)}
```

- Line 287: `Input`

```tsx
label={t('connection.webhook.secretLabel')}
								placeholder={t('connection.webhook.secretPlaceholder')}
								type='password'
								value={formData.webhook_secret}
								onChange={(value) => handleChange('webhook_secret', value)}
								error={errors.webhook_secret}
								description={t('connection.webhook.secretDescription')}
```

- Line 305: `Button`

```tsx
size='xs' variant='outline' onClick={handleCopyWebhookUrl} className='flex items-center gap-1'
```

- Line 341: `Button`

```tsx
variant='outline' onClick={() => onOpenChange(false)} className='flex-1' disabled={isPending}
```

- Line 344: `Button`

```tsx
onClick={handleSave} className='flex-1' isLoading={isPending} disabled={isPending}
```

## src/components/molecules/ChargebeeConnectionDrawer/ChargebeeConnectionDrawer.tsx

380 lines. Query keys:

Response/domain field candidates: `invoice?.outbound`

- Line 242: `Input`

```tsx
label={t('integrationDrawer.connectionName')}
					placeholder={t('connection.chargebee.connectionNamePlaceholder')}
					value={formData.name}
					onChange={(value) => handleChange('name', value)}
					error={errors.name}
					description={t('connection.chargebee.connectionNameHint')}
```

- Line 253: `Input`

```tsx
label={t('connection.labels.apiKey')}
						value={formData.api_key}
						onChange={(value) => handleChange('api_key', value)}
						error={errors.api_key}
						type='password'
						description={t('connection.chargebee.apiKeyHint')}
```

- Line 265: `Input`

```tsx
label={t('connection.chargebee.site')}
						placeholder={t('connection.chargebee.sitePlaceholder')}
						value={formData.site}
						onChange={(value) => handleChange('site', value)}
						error={errors.site}
						description={t('connection.chargebee.siteHint')}
```

- Line 287: `Switch`

```tsx
checked={formData.sync_config.invoice} onCheckedChange={(checked) => handleSyncConfigChange('invoice', checked)}
```

- Line 299: `Input`

```tsx
label={t('connection.chargebee.webhookUsername')}
								placeholder={t('connection.chargebee.webhookUsernamePlaceholder')}
								value={formData.webhook_username}
								onChange={(value) => handleChange('webhook_username', value)}
								error={errors.webhook_username}
								description={t('connection.chargebee.webhookUsernameHint')}
```

- Line 313: `Input`

```tsx
label={t('connection.chargebee.webhookPassword')}
								placeholder={t('connection.chargebee.webhookPasswordPlaceholder')}
								type='password'
								value={formData.webhook_password}
								onChange={(value) => handleChange('webhook_password', value)}
								error={errors.webhook_password}
								description={t('connection.chargebee.webhookPasswordHint')}
```

- Line 331: `Button`

```tsx
size='xs' variant='outline' onClick={handleCopyWebhookUrl} className='flex items-center gap-1'
```

- Line 367: `Button`

```tsx
variant='outline' onClick={() => onOpenChange(false)} className='flex-1' disabled={isPending}
```

- Line 370: `Button`

```tsx
onClick={handleSave} className='flex-1' isLoading={isPending} disabled={isPending}
```

## src/components/molecules/QuickBooksConnectionDrawer/QuickBooksConnectionDrawer.tsx

534 lines. Query keys:

Response/domain field candidates: `invoice?.outbound`, `response.session_id`, `response.session_id.substring`, `response.oauth_url`

- Line 331: `Input`

```tsx
label={t('integrationDrawer.connectionName')}
					placeholder={t('connection.quickBooks.connectionNamePlaceholder')}
					value={formData.name}
					onChange={(value) => handleChange('name', value)}
					error={errors.name}
					description={t('connection.quickBooks.connectionNameHint')}
```

- Line 342: `Input`

```tsx
label={t('connection.quickBooks.clientId')}
						placeholder={t('connection.quickBooks.clientIdPlaceholder')}
						type='password'
						value={formData.client_id}
						onChange={(value) => handleChange('client_id', value)}
						error={errors.client_id}
						description={t('connection.quickBooks.clientIdHint')}
```

- Line 355: `Input`

```tsx
label={t('connection.quickBooks.qbClientSecret')}
						placeholder={t('connection.quickBooks.qbClientSecretPlaceholder')}
						type='password'
						value={formData.client_secret}
						onChange={(value) => handleChange('client_secret', value)}
						error={errors.client_secret}
						description={t('connection.quickBooks.qbClientSecretHint')}
```

- Line 377: `Input`

```tsx
label={t('connection.quickBooks.incomeAccountOptional')}
					placeholder={t('connection.quickBooks.incomeAccountPlaceholder')}
					value={formData.income_account_id}
					onChange={(value) => handleChange('income_account_id', value)}
					error={errors.income_account_id}
					description={t('connection.quickBooks.incomeAccountHint')}
```

- Line 398: `Switch`

```tsx
checked={formData.sync_config.invoice} onCheckedChange={(checked) => handleSyncConfigChange('invoice', checked)}
```

- Line 407: `Switch`

```tsx
checked={formData.sync_config.payment} onCheckedChange={(checked) => handleSyncConfigChange('payment', checked)}
```

- Line 424: `Input`

```tsx
label={t('connection.quickBooks.webhookVerifierOptional')}
								placeholder={t('connection.quickBooks.webhookVerifierPlaceholder')}
								type='password'
								value={formData.webhook_verifier_token}
								onChange={(value) => handleChange('webhook_verifier_token', value)}
								description={t('connection.quickBooks.webhookVerifierHint')}
```

- Line 441: `Button`

```tsx
size='xs' variant='outline' onClick={handleCopyWebhookUrl} className='flex items-center gap-1'
```

- Line 503: `Button`

```tsx
size='xs' variant='outline' onClick={handleCopyRedirectUri} className='flex items-center gap-1'
```

- Line 521: `Button`

```tsx
variant='outline' onClick={() => onOpenChange(false)} className='flex-1' disabled={isPending}
```

- Line 524: `Button`

```tsx
onClick={handleSave} className='flex-1' isLoading={isPending} disabled={isPending}
```

## src/components/molecules/ZohoBooksConnectionDrawer/ZohoBooksConnectionDrawer.tsx

327 lines. Query keys:

Response/domain field candidates: `response.session_id`, `response.oauth_url`

- Line 205: `Input`

```tsx
label={t('integrationDrawer.connectionName')}
					placeholder={t('connection.zohoBooks.connectionPlaceholder')}
					value={formData.name}
					onChange={(value) => handleChange('name', value)}
					error={errors.name}
```

- Line 215: `Input`

```tsx
label={t('connection.quickBooks.clientId')}
							type='password'
							placeholder={t('connection.zohoBooks.clientIdPlaceholder')}
							value={formData.client_id}
							onChange={(value) => handleChange('client_id', value)}
							error={errors.client_id}
```

- Line 223: `Input`

```tsx
label={t('connection.quickBooks.qbClientSecret')}
							type='password'
							placeholder={t('connection.zohoBooks.clientSecretPlaceholder')}
							value={formData.client_secret}
							onChange={(value) => handleChange('client_secret', value)}
							error={errors.client_secret}
```

- Line 234: `Input`

```tsx
label={t('connection.zohoBooks.organizationId')}
					placeholder={t('connection.zohoBooks.organizationIdPlaceholder')}
					value={formData.organization_id}
					onChange={(value) => handleChange('organization_id', value)}
					error={errors.organization_id}
					description={t('connection.zohoBooks.organizationIdHint')}
					disabled={!!connection}
```

- Line 244: `Input`

```tsx
label={t('connection.zohoBooks.accountsServer')}
					placeholder={t('connection.zohoBooks.accountsServerPlaceholder')}
					value={formData.accounts_server}
					onChange={(value) => handleChange('accounts_server', value)}
					error={errors.accounts_server}
					description={t('connection.zohoBooks.accountsServerHint')}
					disabled={!!connection}
```

- Line 269: `Button`

```tsx
size='xs'
								variant='outline'
								onClick={handleCopyWebhookUrl}
								className='flex items-center gap-1 shrink-0'
								disabled={!webhookUrl}
```

- Line 280: `Input`

```tsx
label={t('connection.zohoBooks.webhookSecret')}
						type='password'
						placeholder={
							connection ? t('connection.zohoBooks.webhookSecretPlaceholderEdit') : t('connection.zohoBooks.webhookSecretPlaceholderCreate')
						}
						value={formData.webhook_secret}
						onChange={(value) => handleChange('webhook_secret', value)}
						error={errors.webhook_secret}
						description={connection ? t('connection.zohoBooks.webhookSecretDescEdit') : t('connection.zohoBooks.webhookSecretDescCreate')}
```

- Line 298: `Button`

```tsx
size='xs' variant='outline' onClick={handleCopyRedirectUri} className='flex items-center gap-1'
```

- Line 314: `Button`

```tsx
variant='outline' onClick={() => onOpenChange(false)} className='flex-1' disabled={isPending}
```

- Line 317: `Button`

```tsx
onClick={handleSave} className='flex-1' isLoading={isPending} disabled={isPending}
```

## src/components/molecules/WhopConnectionDrawer/WhopConnectionDrawer.tsx

303 lines. Query keys:

Response/domain field candidates: `invoice?.outbound`

- Line 203: `Input`

```tsx
label={t('integrationDrawer.connectionName')}
					placeholder={t('connection.whop.connectionPlaceholder')}
					value={formData.name}
					onChange={(value) => handleChange('name', value)}
					error={errors.name}
					description={t('connection.whop.connectionHint')}
```

- Line 215: `Input`

```tsx
label={t('connection.labels.apiKey')}
							placeholder={t('connection.whop.apiKeyPlaceholder')}
							type='password'
							value={formData.api_key}
							onChange={(value) => handleChange('api_key', value)}
							error={errors.api_key}
							description={t('connection.whop.apiKeyHint')}
```

- Line 224: `Input`

```tsx
label={t('connection.whop.companyId')}
							placeholder={t('connection.whop.companyIdPlaceholder')}
							value={formData.company_id}
							onChange={(value) => handleChange('company_id', value)}
							error={errors.company_id}
							description={t('connection.whop.companyIdHint')}
```

- Line 236: `Input`

```tsx
label={t('connection.whop.productIdOptional')}
					placeholder={t('connection.whop.productIdPlaceholder')}
					value={formData.product_id}
					onChange={(value) => handleChange('product_id', value)}
					description={t('connection.whop.productIdHint')}
```

- Line 254: `Switch`

```tsx
checked={formData.sync_config.invoice} onCheckedChange={handleSyncConfigChange}
```

- Line 263: `Input`

```tsx
label={t('connection.whop.webhookSecret')}
							type='password'
							placeholder={
								connection ? t('connection.whop.webhookSecretPlaceholderEdit') : t('connection.whop.webhookSecretPlaceholderCreate')
							}
							value={formData.webhook_secret}
							onChange={(value) => handleChange('webhook_secret', value)}
							error={errors.webhook_secret}
							className='text-info-deep'
							description={connection ? t('connection.whop.webhookSecretDescEdit') : t('connection.whop.webhookSecretDescCreate')}
```

- Line 279: `Button`

```tsx
size='xs' variant='outline' onClick={handleCopyWebhookUrl} className='flex items-center gap-1'
```

- Line 290: `Button`

```tsx
variant='outline' onClick={() => onOpenChange(false)} className='flex-1' disabled={isPending}
```

- Line 293: `Button`

```tsx
onClick={handleSave} className='flex-1' isLoading={isPending} disabled={isPending}
```

## src/pages/insights-tools/integrations/IntegrationDetails.tsx

362 lines. Query keys: `['connections', name],`

Response/domain field candidates: `item.name`, `item.connection_status`, `item.provider_type`, `item.id`

- Line 146: `Button`

```tsx
disabled variant='outline' className='flex gap-2 items-center'
```

- Line 150: `Button`

```tsx
onClick={handleAdd} className='flex gap-2 items-center'
```

- Line 156: `Button`

```tsx
disabled className='flex gap-2 items-center'
```

- Line 167: `StripeConnectionDrawer`

```tsx
isOpen={isDrawerOpen}
					onOpenChange={(open) => {
						setIsDrawerOpen(open);
						if (!open) setEditingConnection(null);
					}}
					connection={editingConnection}
					onSave={handleSaveConnection}
```

- Line 177: `RazorpayConnectionDrawer`

```tsx
isOpen={isDrawerOpen}
					onOpenChange={(open) => {
						setIsDrawerOpen(open);
						if (!open) setEditingConnection(null);
					}}
					connection={editingConnection}
					onSave={handleSaveConnection}
```

- Line 187: `ChargebeeConnectionDrawer`

```tsx
isOpen={isDrawerOpen}
					onOpenChange={(open) => {
						setIsDrawerOpen(open);
						if (!open) setEditingConnection(null);
					}}
					connection={editingConnection}
					onSave={handleSaveConnection}
```

- Line 197: `HubSpotConnectionDrawer`

```tsx
isOpen={isDrawerOpen}
					onOpenChange={(open) => {
						setIsDrawerOpen(open);
						if (!open) setEditingConnection(null);
					}}
					connection={editingConnection}
					onSave={handleSaveConnection}
```

- Line 207: `QuickBooksConnectionDrawer`

```tsx
isOpen={isDrawerOpen}
					onOpenChange={(open) => {
						setIsDrawerOpen(open);
						if (!open) setEditingConnection(null);
					}}
					connection={editingConnection}
					onSave={handleSaveConnection}
```

- Line 217: `ZohoBooksConnectionDrawer`

```tsx
isOpen={isDrawerOpen}
					onOpenChange={(open) => {
						setIsDrawerOpen(open);
						if (!open) setEditingConnection(null);
					}}
					connection={editingConnection}
					onSave={handleSaveConnection}
```

- Line 227: `NomodConnectionDrawer`

```tsx
isOpen={isDrawerOpen}
					onOpenChange={(open) => {
						setIsDrawerOpen(open);
						if (!open) setEditingConnection(null);
					}}
					connection={editingConnection}
					onSave={handleSaveConnection}
```

- Line 237: `MoyasarConnectionDrawer`

```tsx
isOpen={isDrawerOpen}
					onOpenChange={(open) => {
						setIsDrawerOpen(open);
						if (!open) setEditingConnection(null);
					}}
					connection={editingConnection}
					onSave={handleSaveConnection}
```

- Line 247: `PaddleConnectionDrawer`

```tsx
isOpen={isDrawerOpen}
					onOpenChange={(open) => {
						setIsDrawerOpen(open);
						if (!open) setEditingConnection(null);
					}}
					connection={editingConnection}
					onSave={handleSaveConnection}
```

- Line 257: `WhopConnectionDrawer`

```tsx
isOpen={isDrawerOpen}
					onOpenChange={(open) => {
						setIsDrawerOpen(open);
						if (!open) setEditingConnection(null);
					}}
					connection={editingConnection}
					onSave={handleSaveConnection}
```

- Line 267: `TabsConnectionDrawer`

```tsx
isOpen={isDrawerOpen}
					onOpenChange={(open) => {
						setIsDrawerOpen(open);
						if (!open) setEditingConnection(null);
					}}
					connection={editingConnection}
					onSave={handleSaveConnection}
```

- Line 277: `IntegrationDrawer`

```tsx
isOpen={isDrawerOpen}
					onOpenChange={(open) => {
						setIsDrawerOpen(open);
						if (!open) setEditingConnection(null);
					}}
					provider={name}
					providerName={integration.name}
					connection={editingConnection}
					onSave={handleSaveConnection}
```

- Line 293: `FormHeader`

```tsx
variant='form-component-title' title={t('insightsTools.integrations.connectedAccountsTitle')}
```

- Line 305: `Button`

```tsx
variant='outline' size='icon' onClick={() => handleEdit(item)} disabled={!canWriteConnection}
```

- Line 308: `Button`

```tsx
variant='outline'
											size='icon'
											onClick={() => handleDeleteConnection(item.id, item.name)}
											disabled={isDeletingConnection || !canWriteConnection}
											isLoading={isDeletingConnection}
```

- Line 328: `FormHeader`

```tsx
variant='form-component-title' title={infoItem.title}
```

- Line 339: `Dialog`

```tsx
title={t('insightsTools.integrations.deleteConnectionConfirmTitle', { name: connectionToDelete?.name ?? '' })}
				description={t('insightsTools.integrations.deleteConnectionIrreversible')}
				titleClassName='text-lg font-normal text-content-heading'
				isOpen={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
				showCloseButton={false}
```

- Line 348: `Button`

```tsx
variant='outline' onClick={cancelDeleteConnection}
```

- Line 351: `Button`

```tsx
onClick={confirmDeleteConnection} isLoading={isDeletingConnection} disabled={isDeletingConnection}
```

## src/pages/insights-tools/integrations/Integrations.tsx

587 lines. Query keys: `['connections', listKey],`, `['connections', providerKey] });`

Response/domain field candidates: `data?.connections`

- Line 138: `StripeConnectionDrawer`

```tsx
isOpen={isDrawerOpen}
							onOpenChange={(open) => {
								setIsDrawerOpen(open);
								if (!open) {
									setEditingConnection(null);
									setActiveIntegration(null);
								}
							}}
							connection={editingConnection}
							onSave={() => {
								connectionQueries.forEach((q) => q.refetch?.());
								setIsDrawerOpen(false);
								setEditingConnection(null);
								setActiveIntegration(null);
							}}
```

- Line 156: `RazorpayConnectionDrawer`

```tsx
isOpen={isDrawerOpen}
							onOpenChange={(open) => {
								setIsDrawerOpen(open);
								if (!open) {
									setEditingConnection(null);
									setActiveIntegration(null);
								}
							}}
							connection={editingConnection}
							onSave={() => {
								connectionQueries.forEach((q) => q.refetch?.());
								setIsDrawerOpen(false);
								setEditingConnection(null);
								setActiveIntegration(null);
							}}
```

- Line 174: `ChargebeeConnectionDrawer`

```tsx
isOpen={isDrawerOpen}
							onOpenChange={(open) => {
								setIsDrawerOpen(open);
								if (!open) {
									setEditingConnection(null);
									setActiveIntegration(null);
								}
							}}
							connection={editingConnection}
							onSave={() => {
								connectionQueries.forEach((q) => q.refetch?.());
								setIsDrawerOpen(false);
								setEditingConnection(null);
								setActiveIntegration(null);
							}}
```

- Line 192: `HubSpotConnectionDrawer`

```tsx
isOpen={isDrawerOpen}
							onOpenChange={(open) => {
								setIsDrawerOpen(open);
								if (!open) {
									setEditingConnection(null);
									setActiveIntegration(null);
								}
							}}
							connection={editingConnection}
							onSave={() => {
								connectionQueries.forEach((q) => q.refetch?.());
								setIsDrawerOpen(false);
								setEditingConnection(null);
								setActiveIntegration(null);
							}}
```

- Line 210: `QuickBooksConnectionDrawer`

```tsx
isOpen={isDrawerOpen}
							onOpenChange={(open) => {
								setIsDrawerOpen(open);
								if (!open) {
									setEditingConnection(null);
									setActiveIntegration(null);
								}
							}}
							connection={editingConnection}
							onSave={() => {
								connectionQueries.forEach((q) => q.refetch?.());
								setIsDrawerOpen(false);
								setEditingConnection(null);
								setActiveIntegration(null);
							}}
```

- Line 228: `ZohoBooksConnectionDrawer`

```tsx
isOpen={isDrawerOpen}
							onOpenChange={(open) => {
								setIsDrawerOpen(open);
								if (!open) {
									setEditingConnection(null);
									setActiveIntegration(null);
								}
							}}
							connection={editingConnection}
							onSave={() => {
								connectionQueries.forEach((q) => q.refetch?.());
								setIsDrawerOpen(false);
								setEditingConnection(null);
								setActiveIntegration(null);
							}}
```

- Line 246: `NomodConnectionDrawer`

```tsx
isOpen={isDrawerOpen}
							onOpenChange={(open) => {
								setIsDrawerOpen(open);
								if (!open) {
									setEditingConnection(null);
									setActiveIntegration(null);
								}
							}}
							connection={editingConnection}
							onSave={() => {
								connectionQueries.forEach((q) => q.refetch?.());
								setIsDrawerOpen(false);
								setEditingConnection(null);
								setActiveIntegration(null);
							}}
```

- Line 264: `MoyasarConnectionDrawer`

```tsx
isOpen={isDrawerOpen}
							onOpenChange={(open) => {
								setIsDrawerOpen(open);
								if (!open) {
									setEditingConnection(null);
									setActiveIntegration(null);
								}
							}}
							connection={editingConnection}
							onSave={() => {
								connectionQueries.forEach((q) => q.refetch?.());
								setIsDrawerOpen(false);
								setEditingConnection(null);
								setActiveIntegration(null);
							}}
```

- Line 282: `PaddleConnectionDrawer`

```tsx
isOpen={isDrawerOpen}
							onOpenChange={(open: boolean) => {
								setIsDrawerOpen(open);
								if (!open) {
									setEditingConnection(null);
									setActiveIntegration(null);
								}
							}}
							connection={editingConnection}
							onSave={() => {
								connectionQueries.forEach((q) => q.refetch?.());
								setIsDrawerOpen(false);
								setEditingConnection(null);
								setActiveIntegration(null);
							}}
```

- Line 300: `WhopConnectionDrawer`

```tsx
isOpen={isDrawerOpen}
							onOpenChange={(open) => {
								setIsDrawerOpen(open);
								if (!open) {
									setEditingConnection(null);
									setActiveIntegration(null);
								}
							}}
							connection={editingConnection}
							onSave={() => {
								connectionQueries.forEach((q) => q.refetch?.());
								setIsDrawerOpen(false);
								setEditingConnection(null);
								setActiveIntegration(null);
							}}
```

- Line 318: `TabsConnectionDrawer`

```tsx
isOpen={isDrawerOpen}
							onOpenChange={(open) => {
								setIsDrawerOpen(open);
								if (!open) {
									setEditingConnection(null);
									setActiveIntegration(null);
								}
							}}
							connection={editingConnection}
							onSave={() => {
								connectionQueries.forEach((q) => q.refetch?.());
								setIsDrawerOpen(false);
								setEditingConnection(null);
								setActiveIntegration(null);
							}}
```

- Line 336: `AwsMarketplaceConnectionDrawer`

```tsx
isOpen={isDrawerOpen}
							onOpenChange={(open) => {
								setIsDrawerOpen(open);
								if (!open) {
									setEditingConnection(null);
									setActiveIntegration(null);
								}
							}}
							connection={editingConnection}
							onSave={() => {
								connectionQueries.forEach((q) => q.refetch?.());
								setIsDrawerOpen(false);
								setEditingConnection(null);
								setActiveIntegration(null);
							}}
```

- Line 354: `GcpMarketplaceConnectionDrawer`

```tsx
isOpen={isDrawerOpen}
							onOpenChange={(open) => {
								setIsDrawerOpen(open);
								if (!open) {
									setEditingConnection(null);
									setActiveIntegration(null);
								}
							}}
							connection={editingConnection}
							onSave={() => {
								connectionQueries.forEach((q) => q.refetch?.());
								setIsDrawerOpen(false);
								setEditingConnection(null);
								setActiveIntegration(null);
							}}
```

- Line 372: `AzureMarketplaceConnectionDrawer`

```tsx
isOpen={isDrawerOpen}
							onOpenChange={(open) => {
								setIsDrawerOpen(open);
								if (!open) {
									setEditingConnection(null);
									setActiveIntegration(null);
								}
							}}
							connection={editingConnection}
							onSave={() => {
								connectionQueries.forEach((q) => q.refetch?.());
								setIsDrawerOpen(false);
								setEditingConnection(null);
								setActiveIntegration(null);
							}}
```

- Line 390: `IntegrationDrawer`

```tsx
isOpen={isDrawerOpen}
							onOpenChange={(open: boolean) => {
								setIsDrawerOpen(open);
								if (!open) {
									setEditingConnection(null);
									setActiveIntegration(null);
								}
							}}
							provider={activeIntegration.id}
							providerName={activeIntegration.name}
							connection={editingConnection}
							onSave={() => {
								connectionQueries.forEach((q) => q.refetch?.());
								setIsDrawerOpen(false);
								setEditingConnection(null);
								setActiveIntegration(null);
							}}
```

- Line 533: `Button`

```tsx
type='button'
									variant='outline'
									size='icon'
									className='h-8 w-8'
									onClick={() => onOpenDrawer?.('edit')}
									disabled={integration.premium || isPreviewConnection || !canWriteConnection}
```

- Line 542: `Button`

```tsx
type='button'
									variant='outline'
									size='icon'
									className='h-8 w-8'
									onClick={() => setDisconnectDialogOpen(true)}
									disabled={integration.premium || !canWriteConnection}
```

- Line 556: `Switch`

```tsx
checked={connected}
								onCheckedChange={handleToggle}
								disabled={integration.premium || !canWriteConnection}
								className='data-[state=checked]:bg-accent-emerald data-[state=checked]:border-accent-emerald'
```

- Line 567: `Dialog`

```tsx
isOpen={disconnectDialogOpen}
				onOpenChange={setDisconnectDialogOpen}
				title={t('insightsTools.integrations.disconnectTitle', { name: integration.name })}
				description={t('insightsTools.integrations.disconnectDescription')}
				descriptionClassName='mt-2'
```

- Line 574: `Button`

```tsx
variant='outline' onClick={() => setDisconnectDialogOpen(false)} disabled={isDeletingConnection}
```

- Line 577: `Button`

```tsx
variant='destructive' onClick={handleConfirmDisconnect} disabled={isDeletingConnection || !connection?.id}
```

## src/pages/insights-tools/exports/Exports.tsx

133 lines. Query keys:

Response/domain field candidates:

- Line 48: `FormHeader`

```tsx
title={t('insightsTools.exports.overviewSectionTitle')} variant='sub-header'
```

- Line 79: `FormHeader`

```tsx
title={t('insightsTools.exports.exportProvidersTitle')} variant='sub-header'
```

## src/components/molecules/S3ConnectionDrawer/S3ConnectionDrawer.tsx

256 lines. Query keys:

Response/domain field candidates:

- Line 172: `Input`

```tsx
label={t('integrationDrawer.connectionName')}
					placeholder={t('connection.s3.connectionNamePlaceholder')}
					value={formData.name}
					onChange={(value) => handleChange('name', value)}
					error={errors.name}
					description={t('connection.s3.connectionNameHint')}
```

- Line 191: `Switch`

```tsx
id='flexprice-managed'
								checked={formData.is_flexprice_managed}
								onCheckedChange={(checked) => handleChange('is_flexprice_managed', checked)}
```

- Line 201: `Input`

```tsx
label={t('connection.s3.awsAccessKey')}
									placeholder={t('connection.s3.awsAccessKeyPlaceholder')}
									value={formData.aws_access_key_id}
									onChange={(value) => handleChange('aws_access_key_id', value)}
									error={errors.aws_access_key_id}
									description={t('connection.s3.awsAccessKeyHint')}
```

- Line 210: `Input`

```tsx
label={t('connection.s3.awsSecretKey')}
									placeholder={t('connection.s3.awsSecretKeyPlaceholder')}
									type='password'
									value={formData.aws_secret_access_key}
									onChange={(value) => handleChange('aws_secret_access_key', value)}
									error={errors.aws_secret_access_key}
									description={t('connection.s3.awsSecretKeyHint')}
```

- Line 220: `Input`

```tsx
label={t('connection.s3.sessionToken')}
									placeholder={t('connection.s3.sessionTokenPlaceholder')}
									type='password'
									value={formData.aws_session_token}
									onChange={(value) => handleChange('aws_session_token', value)}
									description={t('connection.s3.sessionTokenHint')}
```

- Line 243: `Button`

```tsx
variant='outline' onClick={() => onOpenChange(false)} className='flex-1'
```

- Line 246: `Button`

```tsx
onClick={handleSave} className='flex-1' isLoading={isPending}
```

## src/pages/insights-tools/exports/S3Exports.tsx

240 lines. Query keys: `['connections', 's3'],`, `['export-counts', connections.map((c) => c.id)],`

Response/domain field candidates: `response.items.filter`

- Line 95: `Button`

```tsx
variant='outline' onClick={() => navigate('/tools/exports')} className='flex items-center gap-2'
```

- Line 100: `Button`

```tsx
onClick={() => {
							setIsDrawerOpen(true);
						}}
						className='flex items-center gap-2'
```

- Line 111: `Button`

```tsx
disabled className='flex items-center gap-2'
```

- Line 123: `FormHeader`

```tsx
variant='form-component-title' title={t('insightsTools.exports.connectionsTitle')}
```

- Line 152: `Button`

```tsx
variant='outline'
											size='sm'
											onClick={() => handleViewExports(connection.id)}
											className='flex items-center gap-1'
```

- Line 160: `Button`

```tsx
variant='outline'
											size='icon'
											onClick={() => handleDeleteConnection(connection.id, connection.name)}
											disabled={isDeletingConnection || !canWriteConnection}
											isLoading={isDeletingConnection}
```

- Line 180: `Button`

```tsx
variant='outline'
								onClick={() => {
									setIsDrawerOpen(true);
								}}
								className='flex items-center gap-2 mx-auto'
```

- Line 192: `Button`

```tsx
disabled variant='outline' className='flex items-center gap-2 mx-auto'
```

- Line 227: `S3ConnectionDrawer`

```tsx
isOpen={isDrawerOpen}
				onOpenChange={(open) => {
					setIsDrawerOpen(open);
				}}
				connection={null}
				onSave={handleSaveConnection}
```

## src/components/molecules/ExportDrawer/ExportDrawer.tsx

618 lines. Query keys:

Response/domain field candidates:

- Line 369: `Select`

```tsx
value={formData.entity_type}
						onChange={(value) => handleChange('entity_type', value as SCHEDULED_ENTITY_TYPE)}
						error={errors.entity_type}
						options={[
							{ value: SCHEDULED_ENTITY_TYPE.EVENTS, label: t('exportDrawer.entityTypes.events') },
							{ value: SCHEDULED_ENTITY_TYPE.INVOICE, label: t('exportDrawer.entityTypes.invoice') },
							{ value: SCHEDULED_ENTITY_TYPE.CREDIT_TOPUPS, label: t('exportDrawer.entityTypes.creditTopups') },
							{ value: SCHEDULED_ENTITY_TYPE.CREDIT_USAGE, label: t('exportDrawer.entityTypes.creditUsage') },
							{ value: SCHEDULED_ENTITY_TYPE.USAGE_ANALYTICS, label: t('exportDrawer.entityTypes.usageAnalytics') },
						]}
```

- Line 387: `Select`

```tsx
value={formData.interval}
						onChange={(value) => handleChange('interval', value as SCHEDULED_TASK_INTERVAL)}
						error={errors.interval}
						options={[
							{ value: SCHEDULED_TASK_INTERVAL.HOURLY, label: t('exportDrawer.interval.hourly') },
							{ value: SCHEDULED_TASK_INTERVAL.DAILY, label: t('exportDrawer.interval.daily') },
						]}
```

- Line 403: `Input`

```tsx
label={t('exportDrawer.s3.bucket')}
							placeholder={t('exportDrawer.s3.bucketPlaceholder')}
							value={formData.bucket}
							onChange={(value) => handleChange('bucket', value)}
							error={errors.bucket}
							description={t('exportDrawer.s3.bucketHint')}
```

- Line 413: `Input`

```tsx
label={t('exportDrawer.s3.region')}
							placeholder={t('exportDrawer.s3.regionPlaceholder')}
							value={formData.region}
							onChange={(value) => handleChange('region', value)}
							error={errors.region}
							description={t('exportDrawer.s3.regionHint')}
```

- Line 423: `Input`

```tsx
label={t('exportDrawer.s3.keyPrefix')}
							placeholder={t('exportDrawer.s3.keyPrefixPlaceholder')}
							value={formData.key_prefix}
							onChange={(value) => handleChange('key_prefix', value)}
							error={errors.key_prefix}
							description={t('exportDrawer.s3.keyPrefixHint')}
```

- Line 437: `Select`

```tsx
value={formData.compression}
						onChange={(value) => handleChange('compression', value)}
						options={[
							{ value: 'none', label: t('exportDrawer.compression.none') },
							{ value: 'gzip', label: t('exportDrawer.compression.gzip') },
						]}
```

- Line 451: `Select`

```tsx
value={formData.encryption}
						onChange={(value) => handleChange('encryption', value)}
						options={[{ value: 'AES256', label: t('exportDrawer.encryption.aes256') }]}
```

- Line 517: `Select`

```tsx
value={field.entity_type}
													onChange={(value) => updateMetadataField(index, 'entity_type', value)}
													options={entityTypeOptions}
```

- Line 522: `Input`

```tsx
placeholder={t('exportDrawer.metadata.fieldKeyPlaceholder')}
													value={field.field_key}
													onChange={(value) => updateMetadataField(index, 'field_key', value)}
```

- Line 536: `Input`

```tsx
placeholder={t('exportDrawer.metadata.columnNamePlaceholder')}
														value={field.column_name}
														onChange={(value) => updateMetadataField(index, 'column_name', value)}
```

- Line 572: `Input`

```tsx
label={t('exportDrawer.endpoint.label')}
						placeholder={t('exportDrawer.endpoint.placeholder')}
						value={formData.endpoint_url}
						onChange={(value) => handleChange('endpoint_url', value)}
						description={t('exportDrawer.endpoint.description')}
```

- Line 605: `Button`

```tsx
variant='outline' onClick={() => onOpenChange(false)} className='flex-1'
```

- Line 608: `Button`

```tsx
onClick={handleSave} className='flex-1' isLoading={isPending}
```

## src/pages/insights-tools/exports/ExportManagement.tsx

183 lines. Query keys: `['connection', connectionId],`, `['scheduled-tasks', connectionId],`

Response/domain field candidates:

- Line 81: `Button`

```tsx
variant='outline' onClick={() => navigate('/tools/exports/s3')} className='flex items-center gap-2'
```

- Line 86: `AddButton`

```tsx
onClick={() => {
							setIsDrawerOpen(true);
						}}
```

- Line 94: `AddButton`

```tsx
disabled
```

- Line 103: `FormHeader`

```tsx
variant='form-component-title' title={t('insightsTools.exports.exportTasksTitle')}
```

- Line 121: `Button`

```tsx
variant='outline' size='sm' onClick={() => handleViewDetails(task.id)} className='flex items-center gap-1'
```

- Line 125: `Button`

```tsx
variant='outline'
										size='icon'
										onClick={() => handleDeleteTask(task.id, task.entity_type)}
										disabled={isDeletingTask || !canWriteTask}
										isLoading={isDeletingTask}
```

- Line 144: `Button`

```tsx
variant='outline'
								onClick={() => {
									setIsDrawerOpen(true);
								}}
								className='!p-5 !bg-surface-panel !border-line-muted flex items-center gap-2 mx-auto'
```

- Line 156: `Button`

```tsx
disabled variant='outline' className='!p-5 !bg-surface-panel !border-line-muted flex items-center gap-2 mx-auto'
```

- Line 168: `ExportDrawer`

```tsx
isOpen={isDrawerOpen}
				onOpenChange={(open) => {
					setIsDrawerOpen(open);
				}}
				connectionId={connectionId!}
				connection={connection}
				exportTask={null}
				onSave={handleSaveExport}
```

## src/components/molecules/ForceRunDrawer/ForceRunDrawer.tsx

152 lines. Query keys:

Response/domain field candidates:

- Line 90: `Dialog`

```tsx
open={isOpen} onOpenChange={handleOpenChange} modal={false}
```

- Line 91: `DialogContent`

```tsx
className='w-full max-w-md bg-surface' {...outsideDismissGuards}
```

- Line 92: `DialogHeader`

```tsx

```

- Line 93: `DialogTitle`

```tsx

```

- Line 94: `DialogDescription`

```tsx

```

- Line 138: `DialogFooter`

```tsx

```

- Line 139: `Button`

```tsx
variant='outline' onClick={handleClose} disabled={isLoading} className='flex-1'
```

- Line 142: `Button`

```tsx
onClick={handleConfirm} isLoading={isLoading} className='flex-1'
```

## src/components/molecules/TaskRunsTable/TaskRunsTable.tsx

281 lines. Query keys: `['task-runs', scheduledTaskId, taskType, statusFilter, page],`

Response/domain field candidates: `data.download_url`, `row.task_status`, `row.metadata?.start_time`, `row.metadata?.end_time`, `row.started_at`, `row.file_url`, `row.task_status.toLowerCase`, `row.id`

- Line 200: `ActionButton`

```tsx
id={row.id}
							copyId={{ entityType: 'Task Run' }}
							deleteMutationFn={async () => {}}
							refetchQueryKey='task-runs'
							entityName={t('taskRunsTable.entityTask')}
							disableToast={true}
							edit={{ enabled: false }}
							archive={{ enabled: false }}
							customActions={[
								{
									text: t('taskRunsTable.downloadFile'),
									icon: <Download className='size-4' />,
									onClick: () => handleDownload(row.id),
									enabled: true,
								},
							]}
```

- Line 250: `Select`

```tsx
value={statusFilter} onChange={(value) => setStatusFilter(value)} options={statusOptions}
```

- Line 255: `Select`

```tsx
value={dateRangeFilter} onChange={(value) => setDateRangeFilter(value)} options={timeRangeOptions}
```

- Line 259: `FlexpriceTable`

```tsx
columns={columns} data={filteredRuns} showEmptyRow={filteredRuns.length === 0 && !isLoading}
```

## src/pages/insights-tools/exports/ExportDetails.tsx

267 lines. Query keys: `['scheduled-task', exportId],`, `['connection', connectionId],`

Response/domain field candidates:

- Line 115: `Button`

```tsx
onClick={() => navigate(`/tools/exports/s3/${connectionId}/export`)}
```

- Line 125: `Button`

```tsx
variant='outline' onClick={() => navigate(`/tools/exports/s3/${connectionId}/export`)} className='flex items-center gap-2'
```

- Line 131: `Button`

```tsx
onClick={handleToggleTask}
						disabled={isTogglingTask || !canWriteTask}
						isLoading={isTogglingTask}
						className='flex items-center gap-2'
```

- Line 139: `Button`

```tsx
variant='outline'
						onClick={() => setIsForceRunDrawerOpen(true)}
						disabled={isForceRunning || !canWriteTask}
						isLoading={isForceRunning}
						className='flex items-center gap-2'
```

- Line 148: `Button`

```tsx
variant='outline'
						onClick={handleDeleteTask}
						disabled={isDeletingTask || !canWriteTask}
						isLoading={isDeletingTask}
						className='flex items-center gap-2 text-danger hover:text-danger-strong'
```

- Line 173: `FormHeader`

```tsx
variant='form-component-title' title={t('insightsTools.exports.basicInformation')}
```

- Line 201: `FormHeader`

```tsx
variant='form-component-title' title={t('insightsTools.exports.s3Configuration')}
```

- Line 235: `FormHeader`

```tsx
variant='form-component-title' title={t('insightsTools.exports.timestamps')}
```

- Line 251: `TaskRunsTable`

```tsx
scheduledTaskId={exportId!} taskType='EXPORT'
```

- Line 256: `ForceRunDrawer`

```tsx
isOpen={isForceRunDrawerOpen}
				onOpenChange={setIsForceRunDrawerOpen}
				onConfirm={handleForceRun}
				isLoading={isForceRunning}
```

## src/pages/insights-tools/exports/TaskRunsPage.tsx

39 lines. Query keys:

Response/domain field candidates:

- Line 21: `Button`

```tsx
variant='outline'
					onClick={() => navigate(RouteNames.s3ExportDetails.replace(':connectionId', connectionId!).replace(':exportId', exportId!))}
					className='flex items-center gap-2'
```

- Line 32: `TaskRunsTable`

```tsx
scheduledTaskId={exportId!} taskType='EXPORT'
```

## src/pages/insights-tools/usage-syncs/UsageSyncs.tsx

237 lines. Query keys: `'usageRecords',`

Response/domain field candidates: `item.customer_id`, `item.plan_id`, `row.customer_id`, `row.subscription_id`, `row.customer_name`, `row.customer_external_id`, `row.plan_id`, `row.plan_name`, `row.currency`, `row.amount`, `row.currency?.toUpperCase`, `row.period_start`, `row.period_end`, `row.syncs`, `row.id`

- Line 178: `ActionButton`

```tsx
id={row.id}
						copyId={{ entityType: t('insightsTools.usageSyncs.entityName') }}
						deleteMutationFn={async () => {}}
						refetchQueryKey='usageRecords'
						entityName={t('insightsTools.usageSyncs.entityName')}
						disableToast={true}
						edit={{ enabled: false }}
						archive={{ enabled: false }}
```

- Line 196: `UsageRecordSyncsDrawer`

```tsx
record={activeRecord} isOpen={drawerOpen} onOpenChange={setDrawerOpen}
```

## src/pages/insights-tools/revenue/Revenue.tsx

583 lines. Query keys: `['revenue-dashboard', selectedFilter],`

Response/domain field candidates: `data?.summaries`, `data?.items`, `row.currency`, `row.customer_name`, `row.external_customer_id`, `data?.summaries?.`, `data?.graph`, `row.customer_id`, `row.total_revenue`, `row.total_usage_revenue`, `row.total_fixed_revenue`, `row.voice_minutes`, `row.cpm`, `data.map`

- Line 192: `Select`

```tsx
options={FILTER_OPTIONS} value={selectedFilter} onChange={(value) => handleFilterChange(value as RevenueFilterValue)}
```

- Line 196: `Select`

```tsx
options={currencyOptions}
								value={selectedCurrency}
								onChange={(value) => {
									setSelectedCurrency(value as string);
									setCurrentPage(1);
									setSearch('');
								}}
```

- Line 322: `Button`

```tsx
onClick={() => setSelectedFilter('this_quarter')} className='mt-4'
```

- Line 356: `Input`

```tsx
placeholder={t('insightsTools.revenue.searchCustomersPlaceholder')}
									value={search}
									onChange={(e) => handleSearch(e.target.value)}
									className='pl-8 h-8 text-[13px] border-line bg-surface-subtle focus:bg-surface placeholder:text-content-subtle'
```

- Line 378: `Table`

```tsx

```

- Line 379: `TableHeader`

```tsx
className='h-10 bg-surface-subtle border-b border-line rounded-t-md'
```

- Line 380: `TableRow`

```tsx
className='rounded-t-md border-b border-line'
```

- Line 381: `TableHead`

```tsx
className='rounded-tl-md pl-4 font-semibold text-content-secondary text-[13px]'
```

- Line 385: `TableHead`

```tsx
className='font-semibold text-content-secondary text-[13px]'
```

- Line 389: `TableHead`

```tsx
className='font-semibold text-content-secondary text-[13px]'
```

- Line 392: `TableHead`

```tsx
className='font-semibold text-content-secondary text-[13px]'
```

- Line 395: `TableHead`

```tsx
className={`font-semibold text-content-secondary text-[13px] ${!showVoiceColumns ? 'rounded-tr-md' : ''}`}
```

- Line 399: `TableHead`

```tsx
className='font-semibold text-content-secondary text-[13px]'
```

- Line 404: `TableHead`

```tsx
className='rounded-tr-md font-semibold text-content-secondary text-[13px]'
```

- Line 410: `TableBody`

```tsx

```

- Line 414: `TableRow`

```tsx
key={`${row.customer_id}:${row.currency}`}
											className='h-10 align-middle border-b border-line bg-surface hover:bg-surface-subtle/50 transition-colors'
```

- Line 417: `TableCell`

```tsx
className='py-2.5 pl-4 font-normal text-content-secondary text-[13px] align-middle'
```

- Line 422: `TableCell`

```tsx
className='py-2.5 font-semibold text-content-secondary text-[13px]'
```

- Line 430: `TableCell`

```tsx
className='py-2.5 font-normal text-content-tertiary text-[13px]'
```

- Line 433: `TableCell`

```tsx
className='py-2.5 font-normal text-content-tertiary text-[13px]'
```

- Line 437: `TableCell`

```tsx
className='py-2.5 font-normal text-content-tertiary text-[13px]'
```

- Line 442: `TableCell`

```tsx
className='py-2.5 font-normal text-content-tertiary text-[13px]'
```

- Line 450: `TableRow`

```tsx
className='bg-surface'
```

- Line 451: `TableCell`

```tsx
colSpan={showVoiceColumns ? 6 : selectedCurrency === '' ? 5 : 4}
											className='pl-4 py-4 font-normal text-content-muted text-[13px]'
```

- Line 473: `Button`

```tsx
type='button'
									variant='outline'
									size='icon'
									onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
									disabled={currentPage === 1}
									className={cn('size-8', currentPage === 1 && 'text-content-disabled cursor-not-allowed')}
```

- Line 482: `Button`

```tsx
type='button'
									variant='outline'
									size='icon'
									onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
									disabled={currentPage === totalPages}
									className={cn('size-8', currentPage === totalPages && 'text-content-disabled cursor-not-allowed')}
```

## src/pages/onboarding/onboarding.tsx

161 lines. Query keys:

Response/domain field candidates:

- Line 103: `Button`

```tsx
onClick={() => {
											window.open('https://calendly.com/flexprice-30mins-chat/manish', '_blank');
										}}
```

## src/pages/onboarding/steps/OnboardingOrgStep.tsx

34 lines. Query keys:

Response/domain field candidates:

- Line 19: `Input`

```tsx
id='onboarding-org-name'
				placeholder={t('tenantSetup.orgNamePlaceholder')}
				value={orgName}
				onChange={onOrgNameChange}
				required
				error={error}
				className='rounded-lg border-line-zinc'
				disabled={disabled}
```

## src/pages/onboarding/steps/OnboardingOrgUrlStep.tsx

35 lines. Query keys:

Response/domain field candidates:

- Line 19: `Input`

```tsx
id='onboarding-org-url'
				type='url'
				placeholder={t('tenantSetup.orgUrlPlaceholder')}
				value={orgUrl}
				onChange={onOrgUrlChange}
				required
				error={error}
				className='rounded-lg border-line-zinc'
				disabled={disabled}
```

## src/pages/onboarding/useOnboardingTenant.ts

115 lines. Query keys: `['tenant-onboarding'],`

Response/domain field candidates:

## src/pages/onboarding/OnboardingTenant.tsx

66 lines. Query keys:

Response/domain field candidates:

- Line 44: `Button`

```tsx
onClick={handleContinue} className='h-11 w-full rounded-lg' isLoading={isPending} disabled={isPending}
```

## src/pages/onboarding/PricingSetupPage.tsx

566 lines. Query keys: `[SIDEBAR_PRICING_PROMO_QUERY_KEY], exact: false });`

Response/domain field candidates:

- Line 473: `Button`

```tsx
type='button'
									onClick={() => void handleConfirmCreate()}
									className='rounded-xl px-5 py-2.5 shadow-sm active:scale-95'
```

## src/components/organisms/EntityChargesPage/EntityChargesPage.tsx

491 lines. Query keys: `[entityType.toLowerCase(), entityId],`

Response/domain field candidates: `price.internal_state`, `price.price_unit_type`, `price.currency`, `price.type`, `price.billing_period`, `price.billing_period_count`, `price.billing_model`, `price.bucket_size`, `price.meter_id`, `price.filter_values`, `price.lookup_key`, `price.invoice_cadence`, `price.trial_period_days`, `price.description`, `price.display_name`, `price.metadata`, `price.transform_quantity`, `price.group_id`, `price.min_quantity`, `price.start_date`, `price.amount`, `price.amount.trim`, `price.tier_mode`, `price.tiers?.map`, `price.price_unit_config`

- Line 416: `RecurringChargesForm`

```tsx
price={charge}
							entityType={priceEntityType}
							entityId={entityId}
							entityName={entityData?.name || entityName}
							onAdd={(charge) => handleRecurringChargeAdd(index, charge)}
							onUpdate={(price) => handleRecurringChargeUpdate(index, price)}
							onDeleteClicked={() => handleRecurringChargeDelete(index)}
							onEditClicked={() => handleRecurringChargeEdit(index)}
```

- Line 432: `UsagePricingForm`

```tsx
price={charge}
							entityType={priceEntityType}
							entityId={entityId}
							onAdd={(charge) => handleUsageChargeAdd(index, charge)}
							onUpdate={(charge) => handleUsageChargeUpdate(index, charge)}
							onEditClicked={() => handleUsageChargeEdit(index)}
							onDeleteClicked={() => handleUsageChargeDelete(index)}
```

- Line 456: `AddChargesButton`

```tsx
onClick={() => handleAddNewPrice(PRICE_TYPE.FIXED)}
							label={t('entityChargesPage.addFixedCharge')}
							aria-label={`Add fixed charge to ${entityType.toLowerCase()}`}
```

- Line 461: `AddChargesButton`

```tsx
onClick={() => handleAddNewPrice(PRICE_TYPE.USAGE)}
							label={t('entityChargesPage.addUsageBasedCharges')}
							aria-label={`Add usage-based charges to ${entityType.toLowerCase()}`}
```

- Line 471: `Button`

```tsx
isLoading={isPending}
						disabled={!canSave}
						onClick={handleSaveConfirm}
						aria-label={
							canSave
								? t('entityChargesPage.saveChargesAria', {
										entity: t(`entityChargesPage.entityLabelsLower.${entityType}`),
									})
								: t('entityChargesPage.cannotSaveChargesAria')
						}
```

## src/pages/product-catalog/addons/AddonDetails.tsx

573 lines. Query keys: `['fetchAddon', id],`

Response/domain field candidates: `row.end_date`, `row.id`, `row.type`, `feature?.unit_plural`, `feature?.unit_singular`, `row?.feature?.id`, `row?.feature?.name`, `row?.feature_type`, `row?.id`, `row?.status`

- Line 240: `ActionButton`

```tsx
id={row?.id}
					copyId={{ entityType: 'Entitlement' }}
					deleteMutationFn={async () => {
						return await EntitlementApi.delete(row?.id);
					}}
					refetchQueryKey='fetchAddon'
					entityName={row?.feature?.name}
					edit={{ enabled: false }}
					archive={{
						enabled: row?.status !== ENTITY_STATUS.ARCHIVED,
						text: 'Delete',
						icon: <Trash2 />,
						disabled: !canWriteEntitlement,
						disabledReason: canWriteEntitlement ? undefined : entitlementWriteDeniedTooltip,
					}}
```

- Line 386: `Button`

```tsx
prefixIcon={<Plus />} onClick={() => navigate(`${RouteNames.addonCharges.replace(':addonId', id!)}`)}
```

- Line 392: `Button`

```tsx
disabled prefixIcon={<Plus />}
```

- Line 400: `Button`

```tsx
prefixIcon={<Plus />} onClick={() => setEntitlementDrawerOpen(true)}
```

- Line 406: `Button`

```tsx
disabled prefixIcon={<Plus />}
```

- Line 432: `Button`

```tsx
onClick={() => setAddonDrawerOpen(true)} variant={'outline'} className='flex gap-2'
```

- Line 439: `Button`

```tsx
disabled variant={'outline'} className='flex gap-2'
```

- Line 448: `Button`

```tsx
onClick={() => archiveAddon()}
							disabled={addonData?.status !== ENTITY_STATUS.PUBLISHED}
							variant={'outline'}
							className='flex gap-2'
```

- Line 459: `Button`

```tsx
disabled variant={'outline'} className='flex gap-2'
```

- Line 468: `AddonDrawer`

```tsx
data={addonData} open={addonDrawerOpen} onOpenChange={setAddonDrawerOpen} refetchQueryKeys={['fetchAddon']}
```

- Line 469: `AddEntitlementDrawer`

```tsx
selectedFeatures={addonData.entitlements?.map((v) => v.feature)}
				entitlements={addonData.entitlements}
				entityType={ENTITLEMENT_ENTITY_TYPE.ADDON}
				entityId={addonData.id}
				isOpen={entitlementDrawerOpen}
				onOpenChange={(value) => setEntitlementDrawerOpen(value)}
				refetchQueryKeys={['fetchAddon', 'fetchEntitlements']}
```

- Line 482: `UpdatePriceDialog`

```tsx
isOpen={isPriceDialogOpen}
					onOpenChange={setIsPriceDialogOpen}
					price={selectedPriceForEdit}
					planId={addonData.id}
					onSuccess={handlePriceUpdateSuccess}
```

- Line 493: `UpdatePriceDetailsDrawer`

```tsx
price={selectedPriceForDetailsEdit}
					open={isDetailsDrawerOpen}
					onOpenChange={setIsDetailsDrawerOpen}
					refetchQueryKeys={['fetchAddon']}
```

- Line 502: `Dialog`

```tsx
open={showTerminateModal} onOpenChange={setShowTerminateModal}
```

- Line 523: `FlexpriceTable`

```tsx
columns={chargeColumns} data={addonData?.prices ?? []}
```

- Line 533: `FlexpriceTable`

```tsx
showEmptyRow
							data={addonData.entitlements || []}
							columns={getEntitlementColumns(
								addonData.id,
								t('common:labels.unlimited'),
								t('catalog:features.form.unitDefault'),
								t('catalog:features.form.unitsDefault'),
								canWriteEntitlement,
								t('catalog:plans.entitlementsTab.writeDeniedTooltip'),
							)}
```

## src/pages/product-catalog/addons/Addons.tsx

253 lines. Query keys: `'fetchAddons',`

Response/domain field candidates: `row?.status`, `row?.updated_at`, `row?.id`, `row?.name`

- Line 165: `ActionButton`

```tsx
id={row?.id}
							copyId={{ entityType: 'Addon' }}
							deleteMutationFn={async () => {
								return await AddonApi.Delete(row?.id);
							}}
							refetchQueryKey='fetchAddons'
							entityName={row?.name}
							edit={{
								enabled: false,
								onClick: () => handleEdit(row),
							}}
							archive={{
								enabled: row?.status !== ENTITY_STATUS.ARCHIVED,
								disabled: !canWriteAddon,
								disabledReason: canWriteAddon ? undefined : t('addons.writeDeniedTooltip'),
							}}
```

- Line 195: `AddButton`

```tsx
onClick={handleOnAdd}
```

- Line 199: `AddButton`

```tsx
disabled onClick={handleOnAdd}
```

- Line 204: `AddonDrawer`

```tsx
data={activeAddon} open={addonDrawerOpen} onOpenChange={setAddonDrawerOpen} refetchQueryKeys={['fetchAddons']}
```

## src/pages/product-catalog/cost-sheets/CostSheetDetails.tsx

444 lines. Query keys: `['fetchCostSheet', id],`, `['costSheetCharges', id, limit, offset, mergedFilters, sanitizedSorts],`

Response/domain field candidates: `row.type`

- Line 299: `Button`

```tsx
prefixIcon={<Plus />} onClick={handleAddCharges}
```

- Line 305: `Button`

```tsx
disabled prefixIcon={<Plus />}
```

- Line 334: `Button`

```tsx
onClick={() => setCostSheetDrawerOpen(true)} variant='outline' prefixIcon={<Pencil />}
```

- Line 340: `Button`

```tsx
disabled variant='outline' prefixIcon={<Pencil />}
```

- Line 347: `Button`

```tsx
onClick={() => archiveCostSheet()}
							disabled={costSheetData.status !== ENTITY_STATUS.PUBLISHED}
							variant='outline'
							prefixIcon={<EyeOff />}
```

- Line 357: `Button`

```tsx
disabled variant='outline' prefixIcon={<EyeOff />}
```

- Line 365: `CostSheetDrawer`

```tsx
data={costSheetData}
				open={costSheetDrawerOpen}
				onOpenChange={setCostSheetDrawerOpen}
				refetchQueryKeys={['fetchCostSheet', 'costSheetCharges']}
```

- Line 381: `Input`

```tsx
type='search'
									size='sm'
									placeholder={t('catalog:costSheets.details.searchCharges')}
									value={searchTerm}
									onChange={handleSearch}
									inputPrefix={<Search className='h-4 w-4 text-muted-foreground' />}
```

- Line 406: `FlexpriceTable`

```tsx
columns={chargeColumns}
									data={pricesResponse?.items ?? []}
									showEmptyRow
									tableClassName='table-fixed w-full'
```

## src/pages/product-catalog/cost-sheets/CostSheets.tsx

260 lines. Query keys: `'fetchCostSheets',`

Response/domain field candidates: `row?.status`, `row?.updated_at`, `row?.id`, `row?.name`

- Line 165: `ActionButton`

```tsx
id={row?.id}
							copyId={{ entityType: 'Cost Sheet' }}
							deleteMutationFn={async () => {
								return await CostSheetApi.DeleteCostSheet(row?.id);
							}}
							refetchQueryKey='fetchCostSheets'
							entityName={row?.name}
							edit={{
								enabled: true,
								onClick: () => handleEdit(row),
								disabled: !canWriteCostSheet,
								disabledReason: canWriteCostSheet ? undefined : t('costSheets.writeDeniedTooltip'),
							}}
							archive={{
								enabled: row?.status !== ENTITY_STATUS.ARCHIVED,
								disabled: !canWriteCostSheet,
								disabledReason: canWriteCostSheet ? undefined : t('costSheets.writeDeniedTooltip'),
							}}
```

- Line 197: `AddButton`

```tsx
onClick={handleOnAdd}
```

- Line 201: `AddButton`

```tsx
disabled onClick={handleOnAdd}
```

- Line 206: `CostSheetDrawer`

```tsx
data={activeCostSheet}
				open={costSheetDrawerOpen}
				onOpenChange={setCostSheetDrawerOpen}
				refetchQueryKeys={['fetchCostSheets']}
```

## src/pages/product-catalog/coupons/CouponDetails.tsx

143 lines. Query keys: `['fetchCouponDetails', id],`

Response/domain field candidates:

## src/pages/product-catalog/coupons/Coupons.tsx

278 lines. Query keys: `'fetchCoupons',`

Response/domain field candidates: `row.type`, `row.amount_off`, `row.currency`, `row.percentage_off`, `row.max_redemptions`, `row.total_redemptions`, `row.status`, `row.updated_at`, `row.id`

- Line 188: `ActionButton`

```tsx
id={row.id}
						copyId={{ entityType: 'Coupon' }}
						deleteMutationFn={(id) => CouponApi.deleteCoupon(id)}
						refetchQueryKey='fetchCoupons'
						entityName={t('coupons.table.entityName')}
						edit={{
							path: `${RouteNames.couponDetails}/${row.id}`,
							onClick: () => handleEdit(row),
							disabled: !canWriteCoupon,
							disabledReason: canWriteCoupon ? undefined : t('coupons.writeDeniedTooltip'),
						}}
						archive={{
							enabled: row.status === ENTITY_STATUS.PUBLISHED,
							disabled: !canWriteCoupon,
							disabledReason: canWriteCoupon ? undefined : t('coupons.writeDeniedTooltip'),
						}}
```

- Line 219: `AddButton`

```tsx
onClick={handleCreateCoupon}
```

- Line 223: `AddButton`

```tsx
disabled onClick={handleCreateCoupon}
```

- Line 272: `CouponDrawer`

```tsx
data={selectedCoupon} open={isDrawerOpen} onOpenChange={setIsDrawerOpen} refetchQueryKeys={['fetchCoupons']}
```

## src/pages/product-catalog/features/AddFeature.tsx

1107 lines. Query keys: `[SIDEBAR_PRICING_PROMO_QUERY_KEY], exact: false });`

Response/domain field candidates: `data.meter`, `data.name`, `data.reporting_unit?.conversion_rate`, `data.type`, `data.lookup_key`, `data.unit_singular`, `data.unit_plural`, `data.reporting_unit?.unit_singular`, `data.reporting_unit?.unit_plural`, `data.group_id`, `data.description`, `item.value`, `data.meter?.aggregation`, `data.meter?.event_name`

- Line 345: `Input`

```tsx
label={t('catalog:features.form.name')}
				placeholder={t('catalog:features.form.namePlaceholder')}
				value={data.name || ''}
				error={errors.name}
				onChange={handleNameChange}
```

- Line 356: `Select`

```tsx
label={t('catalog:features.form.type')}
					options={FEATURE_TYPE_OPTIONS}
					className='w-full overflow-hidden'
					value={data.type}
					onChange={handleTypeChange}
```

- Line 376: `AddChargesButton`

```tsx
label={t('catalog:features.form.lookupKey')} onClick={() => onUpdateFormState({ showLookupKey: true })}
```

- Line 379: `AddChargesButton`

```tsx
label={t('catalog:features.form.unitName')} onClick={() => onUpdateFormState({ showUnitName: true })}
```

- Line 380: `AddChargesButton`

```tsx
label={t('catalog:features.form.displayUnitName')}
									onClick={() => onUpdateFormState({ showReportingUnitName: true })}
```

- Line 386: `AddChargesButton`

```tsx
label={t('catalog:features.form.featureDescription')}
							onClick={() => onUpdateFormState({ showDescription: true })}
```

- Line 390: `AddChargesButton`

```tsx
label={t('catalog:features.form.addGroup')} onClick={() => onUpdateFormState({ showGroup: true })}
```

- Line 393: `Input`

```tsx
label={t('catalog:features.form.lookupKey')}
						placeholder={t('catalog:features.form.lookupKeyPlaceholder')}
						value={data.lookup_key || ''}
						error={errors.lookup_key}
						onChange={(lookup_key) => onUpdateFeature({ lookup_key })}
```

- Line 414: `AddChargesButton`

```tsx
label={t('catalog:features.form.lookupKey')}
												onClick={() => onUpdateFormState({ showLookupKey: true })}
```

- Line 419: `AddChargesButton`

```tsx
label={t('catalog:features.form.unitNameLower')}
											onClick={() => onUpdateFormState({ showUnitName: true })}
```

- Line 423: `AddChargesButton`

```tsx
label={t('catalog:features.form.displayUnitName')}
											onClick={() => onUpdateFormState({ showReportingUnitName: true })}
```

- Line 428: `AddChargesButton`

```tsx
label={t('catalog:features.form.featureDescriptionLower')}
												onClick={() => onUpdateFormState({ showDescription: true })}
```

- Line 434: `AddChargesButton`

```tsx
label={t('catalog:features.form.addGroup')}
												onClick={() => onUpdateFormState({ showGroup: true })}
```

- Line 444: `Input`

```tsx
label={t('catalog:features.form.unitSingular')}
													placeholder={t('catalog:features.form.unitSingularPh')}
													value={data.unit_singular || ''}
													onChange={handleUnitSingularChange}
```

- Line 450: `Input`

```tsx
label={t('catalog:features.form.unitPlural')}
													placeholder={t('catalog:features.form.unitPluralPh')}
													value={data.unit_plural || ''}
													onChange={(unit_plural) => onUpdateFeature({ unit_plural })}
```

- Line 460: `Input`

```tsx
label={t('catalog:features.form.displayUnitSingular')}
													placeholder={t('catalog:features.form.displayUnitSingularPh')}
													value={data.reporting_unit?.unit_singular ?? ''}
													onChange={handleReportingUnitSingularChange}
```

- Line 466: `Input`

```tsx
label={t('catalog:features.form.displayUnitPlural')}
													placeholder={t('catalog:features.form.displayUnitPluralPh')}
													value={data.reporting_unit?.unit_plural ?? ''}
													onChange={(unit_plural) =>
														onUpdateFeature({
															reporting_unit: {
																unit_singular: data.reporting_unit?.unit_singular ?? '',
																unit_plural,
																conversion_rate: data.reporting_unit?.conversion_rate ?? '',
															},
														})
													}
```

- Line 480: `Input`

```tsx
label={t('catalog:features.form.conversionFactor')}
													placeholder={t('catalog:features.form.conversionFactorPh')}
													description={t('catalog:features.form.conversionFormula')}
													value={data.reporting_unit?.conversion_rate ?? ''}
													onChange={(conversion_rate) =>
														onUpdateFeature({
															reporting_unit: {
																unit_singular: data.reporting_unit?.unit_singular ?? '',
																unit_plural: data.reporting_unit?.unit_plural ?? '',
																conversion_rate,
															},
														})
													}
```

- Line 504: `AddChargesButton`

```tsx
label={t('catalog:features.form.lookupKey')}
														onClick={() => onUpdateFormState({ showLookupKey: true })}
```

- Line 510: `AddChargesButton`

```tsx
label={t('catalog:features.form.unitNameLower')}
														onClick={() => onUpdateFormState({ showUnitName: true })}
```

- Line 516: `AddChargesButton`

```tsx
label={t('catalog:features.form.displayUnitNameLower')}
														onClick={() => onUpdateFormState({ showReportingUnitName: true })}
```

- Line 522: `AddChargesButton`

```tsx
label={t('catalog:features.form.featureDescriptionLower')}
														onClick={() => onUpdateFormState({ showDescription: true })}
```

- Line 528: `AddChargesButton`

```tsx
label={t('catalog:features.form.addGroup')}
														onClick={() => onUpdateFormState({ showGroup: true })}
```

- Line 542: `AddChargesButton`

```tsx
label={t('catalog:features.form.lookupKey')}
										onClick={() => onUpdateFormState({ showLookupKey: true })}
```

- Line 548: `AddChargesButton`

```tsx
label={t('catalog:features.form.featureDescriptionLower')}
										onClick={() => onUpdateFormState({ showDescription: true })}
```

- Line 554: `AddChargesButton`

```tsx
label={t('catalog:features.form.addGroup')} onClick={() => onUpdateFormState({ showGroup: true })}
```

- Line 559: `SelectGroup`

```tsx
entityType={GROUP_ENTITY_TYPE.FEATURE}
								label={t('catalog:features.form.group')}
								placeholder={t('catalog:features.form.groupPlaceholder')}
								value={data.group_id ?? ''}
								onChange={(group) => onUpdateFeature({ group_id: group?.id ?? undefined })}
								showLookupKey={false}
```

- Line 569: `Textarea`

```tsx
label={t('catalog:features.form.featureDescriptionLabel')}
								placeholder={t('catalog:features.form.descriptionPlaceholder')}
								value={data.description || ''}
								error={errors.description}
								className='!min-h-32'
								onChange={(description) => onUpdateFeature({ description })}
```

- Line 627: `Input`

```tsx
value={meter?.event_name || ''}
				placeholder={t('catalog:features.form.eventNamePlaceholder')}
				label={t('catalog:features.form.eventName')}
				description={t('catalog:features.form.eventNameHelp')}
				error={meterErrors.event_name}
				onChange={handleEventNameChange}
```

- Line 639: `AddChargesButton`

```tsx
label={t('catalog:features.form.eventFilters')}
						onClick={() => onUpdateFormState({ showEventFilters: true })}
						className='self-start'
```

- Line 647: `FormHeader`

```tsx
title={t('catalog:features.form.eventFiltersTitle')}
							subtitle={t('catalog:features.form.eventFiltersSubtitle')}
							variant='form-component-title'
```

- Line 807: `Select`

```tsx
options={AGGREGATION_OPTIONS}
					value={meter?.aggregation?.type || AGGREGATION_OPTIONS[0].value}
					onChange={handleAggregationTypeChange}
					description={t('catalog:features.form.aggregationChoose')}
					label={t('catalog:features.form.aggregationFunction')}
					placeholder={t('catalog:features.form.aggregationFunctionPh')}
					error={meterErrors.aggregation_type}
					hideSelectedTick={true}
```

- Line 819: `Input`

```tsx
value={meter?.aggregation?.field || ''}
						disabled={meter?.aggregation?.type === METER_AGGREGATION_TYPE.COUNT}
						onChange={handleAggregationFieldChange}
						label={t('catalog:features.form.aggregationField')}
						placeholder={t('catalog:features.form.aggregationFieldPh')}
						description={t('catalog:features.form.aggregationFieldHelp')}
						error={meterErrors.aggregation_field}
```

- Line 843: `Input`

```tsx
id='feature-custom-expression'
							value={meter?.aggregation?.expression || ''}
							onChange={handleAggregationExpressionChange}
							placeholder={t('catalog:features.form.customExpressionPh')}
							description={<span className='whitespace-pre-line'>{t('catalog:features.form.customExpressionHelp')}</span>}
							error={meterErrors.aggregation_expression}
```

- Line 855: `Input`

```tsx
value={multiplierInput}
						onChange={handleMultiplierChange}
						label={t('catalog:features.form.aggregationMultiplier')}
						placeholder={t('catalog:features.form.aggregationMultiplierPh')}
						description={t('catalog:features.form.aggregationMultiplierHelp')}
						error={meterErrors.aggregation_multiplier}
```

- Line 868: `AddChargesButton`

```tsx
label={t('catalog:features.form.groupByButton')} onClick={() => onUpdateFormState({ showGroupBy: true })}
```

- Line 871: `AddChargesButton`

```tsx
label={t(
									formState.showCustomExpression
										? 'catalog:features.form.aggregationFieldButton'
										: 'catalog:features.form.customExpressionButton',
								)}
								onClick={toggleCustomExpression}
```

- Line 882: `Input`

```tsx
value={meter?.aggregation?.group_by || ''}
							onChange={handleGroupByChange}
							label={t('catalog:features.form.groupBy')}
							placeholder={t('catalog:features.form.groupByPlaceholder')}
							description={t('catalog:features.form.groupByHelp')}
```

- Line 1093: `Button`

```tsx
isLoading={isPending} disabled={isCtaDisabled} onClick={handleSubmit}
```

## src/pages/product-catalog/plans/PlanDetailsPage.tsx

342 lines. Query keys: `['fetchPlan', planId],`, `['planSyncWorkflows', planId],`, `['fetchPlan', planId] });`, `['planSyncWorkflows', planId] });`

Response/domain field candidates: `response.items`, `data?.items`

- Line 252: `CopyIdButton`

```tsx
id={planData.id} entityType='Plan'
```

- Line 261: `Button`

```tsx
onClick={() => syncPlan()}
										disabled={isSyncing || isSyncRunning || !canWritePlan || isFullySynced}
										isLoading={isSyncing}
										variant='outline'
										className='flex gap-2'
```

- Line 302: `Button`

```tsx
variant='outline' prefixIcon={<EllipsisVertical />} size='icon'
```

- Line 305: `PlanDrawer`

```tsx
data={planData as Plan} open={planDrawerOpen} onOpenChange={setPlanDrawerOpen} refetchQueryKeys={['fetchPlan']}
```

- Line 306: `DuplicatePlanDialog`

```tsx
planId={planId!}
				plan={planData}
				open={duplicateDialogOpen}
				onOpenChange={setDuplicateDialogOpen}
				refetchQueryKeys={['fetchPlan', 'planEntitlements']}
```

## src/pages/product-catalog/features/FeatureDetails.tsx

559 lines. Query keys: `['fetchFeatureDetails', featureId],`, `['fetchLinkedEntitlements', featureId],`, `['fetchLinkedPrices', featureId, data?.meter?.id],`

Response/domain field candidates: `row.entity_type`, `row.entity_id`, `row.plan?.name`, `row.addon?.name`, `data?.meter?.id`, `price.entity_type`, `data?.name`, `plan?.name`, `plan?.status`, `feature?.unit_plural`, `feature?.unit_singular`, `data?.meter?.event_name`, `data?.meter?.filters`, `data?.meter?.aggregation?.field`, `data?.meter?.aggregation.field`, `data?.status`, `data?.id`, `data.id`, `data?.type`, `data?.alert_settings`, `response?.data?.error?.message`, `data.meter.filters.length`, `data?.meter?.filters?.map`, `data?.meter?.aggregation.type`, `data?.meter?.aggregation?.expression`, `data?.unit_singular`, `data?.unit_plural`, `data?.reporting_unit`, `data.reporting_unit.unit_singular`, `data.reporting_unit.unit_plural`, `data?.meter?.reset_usage`, `data?.meter?.aggregation?.type`, `data?.meter?.aggregation?.bucket_size`, `data?.meter?.aggregation.bucket_size`, `data?.meter?.aggregation?.group_by`, `data.meter.aggregation.group_by`

- Line 365: `Button`

```tsx
isLoading={isArchiving}
								disabled={isArchiving || data?.status !== ENTITY_STATUS.PUBLISHED}
								variant={'outline'}
								size={'lg'}
								onClick={() => archiveFeature()}
								className='flex gap-1 px-3'
```

- Line 378: `Button`

```tsx
disabled variant={'outline'} size={'lg'} className='flex gap-1 px-3'
```

- Line 387: `Button`

```tsx
variant={'outline'} prefixIcon={<EllipsisVertical />} size={'icon'} className='h-10 w-10 p-0'
```

- Line 395: `CopyIdButton`

```tsx
id={data.id} entityType='Feature'
```

- Line 401: `FeatureAlertDialog`

```tsx
open={showAlertDialog}
					alertSettings={data?.alert_settings}
					onSave={async (alertSettings: AlertSettings) => {
						if (!featureId) return;
						try {
							await FeatureApi.updateFeature(featureId, {
								alert_settings: alertSettings,
							});
							setShowAlertDialog(false);
							refetchQueries(['fetchFeatureDetails', featureId]);
							toast.success('Alert settings updated successfully');
						} catch (e: any) {
							const errorMessage = e?.response?.data?.error?.message || e?.message || 'Failed to update alert settings';
							toast.error(errorMessage);
						}
					}}
					onClose={() => setShowAlertDialog(false)}
```

- Line 428: `FlexpriceTable`

```tsx
showEmptyRow columns={priceColumns} data={linkedPrices?.items ?? []} variant='no-bordered'
```

- Line 439: `FlexpriceTable`

```tsx
showEmptyRow columns={columns} data={planOrAddonEntitlements} variant='no-bordered'
```

- Line 546: `FeatureDrawer`

```tsx
data={data}
						open={isDrawerOpen}
						onOpenChange={setIsDrawerOpen}
						refetchQueryKeys={['fetchFeatureDetails', featureId]}
```

## src/pages/product-catalog/features/Features.tsx

354 lines. Query keys: `'fetchFeatures',`

Response/domain field candidates: `row?.group?.id`, `row.group.id`, `row.group.name`, `row?.type`, `row?.status`, `row?.updated_at`, `row?.id`, `row?.name`

- Line 260: `ActionButton`

```tsx
id={row?.id}
							copyId={{ entityType: 'Feature' }}
							deleteMutationFn={async () => {
								return await FeatureApi.deleteFeature(row?.id);
							}}
							refetchQueryKey='fetchFeatures'
							entityName={row?.name}
							archive={{
								enabled: row?.status !== ENTITY_STATUS.ARCHIVED,
								disabled: !canWriteFeature,
								disabledReason: canWriteFeature ? undefined : t('features.writeDeniedTooltip'),
							}}
							edit={{
								enabled: true,
								onClick: () => handleEdit(row),
								disabled: !canWriteFeature,
								disabledReason: canWriteFeature ? undefined : t('features.writeDeniedTooltip'),
							}}
```

- Line 294: `AddButton`

```tsx

```

- Line 299: `AddButton`

```tsx
disabled
```

- Line 348: `FeatureDrawer`

```tsx
data={selectedFeature} open={isDrawerOpen} onOpenChange={setIsDrawerOpen} refetchQueryKeys={['fetchFeatures']}
```

## src/pages/product-catalog/plans/AddCharges.tsx

26 lines. Query keys: `['fetchPlan', planId],`

Response/domain field candidates:

## src/pages/product-catalog/plans/Plans.tsx

410 lines. Query keys: `['fetchPlans', 'header-probe-has-plans'],`, `'fetchPlans',`

Response/domain field candidates: `response.pagination?.total`, `response.items?.length`, `row.id`, `row.status`, `row.updated_at`, `response.items`, `response.pagination`

- Line 246: `Button`

```tsx
variant='ghost' size='icon' className='size-8'
```

- Line 267: `Button`

```tsx
variant='outline'
						prefixIcon={<WandSparkles className='text-content-black' />}
						onClick={() => navigate(RouteNames.pricingSetup, { state: { from: 'plans' } })}
						className='!border-accent-indigo-line !bg-surface !p-5 text-accent-indigo hover:bg-accent-indigo-muted hover:text-accent-indigo-strong'
```

- Line 277: `Button`

```tsx
disabled
								variant='outline'
								prefixIcon={<WandSparkles className='text-content-black' />}
								className='!border-accent-indigo-line !bg-surface !p-5 text-accent-indigo'
```

- Line 299: `Button`

```tsx
variant='outline'
								prefixIcon={<WandSparkles className='text-accent-indigo' />}
								onClick={() => navigate(RouteNames.pricingSetup, { state: { from: 'plans' } })}
								className='border-accent-indigo-line text-accent-indigo hover:bg-accent-indigo-muted hover:text-accent-indigo-strong'
```

- Line 309: `Button`

```tsx
disabled
										variant='outline'
										prefixIcon={<WandSparkles className='text-accent-indigo' />}
										className='border-accent-indigo-line text-accent-indigo'
```

- Line 320: `AddButton`

```tsx
onClick={handleOnAdd}
```

- Line 324: `AddButton`

```tsx
disabled onClick={handleOnAdd}
```

- Line 330: `PlanDrawer`

```tsx
data={activePlan} open={planDrawerOpen} onOpenChange={setPlanDrawerOpen} refetchQueryKeys={['fetchPlans']}
```

- Line 331: `DuplicatePlanDialog`

```tsx
planId={planToDuplicate?.id ?? ''}
				plan={planToDuplicate}
				open={duplicateDialogOpen}
				onOpenChange={(open) => {
					setDuplicateDialogOpen(open);
					if (!open) setPlanToDuplicate(null);
				}}
				refetchQueryKeys={['fetchPlans']}
```

- Line 341: `Dialog`

```tsx
isOpen={archiveDialogOpen}
				onOpenChange={setArchiveDialogOpen}
				title={t('plans.archive.title')}
				description={t('plans.archive.confirmDescription', { name: planToArchive?.name ?? '' })}
```

- Line 347: `Button`

```tsx
variant='outline' onClick={() => setArchiveDialogOpen(false)}
```

- Line 350: `Button`

```tsx
variant='destructive' onClick={() => planToArchive && archivePlan(planToArchive.id)} disabled={isArchiving}
```

## src/pages/product-catalog/plans/Pricing.tsx

66 lines. Query keys:

Response/domain field candidates:

- Line 54: `AddButton`

```tsx
onClick={() => setPlanDrawerOpen(true)}
```

- Line 60: `PlanDrawer`

```tsx
open={planDrawerOpen} onOpenChange={setPlanDrawerOpen} refetchQueryKeys={['fetchPlansPricingCard']}
```

## src/pages/product-catalog/plans/tabs/PlanOverviewTab.tsx

60 lines. Query keys: `['fetchPlan', planId],`

Response/domain field candidates: `response.items`

- Line 48: `PlanPriceTable`

```tsx
plan={planData}
				onPriceUpdate={() => {
					refetchQueries(['fetchPlan', planId!]);
					refetchQueries(['planChargesSearch', planId!]);
				}}
```

## src/pages/product-catalog/plans/tabs/PlanEntitlementsTab.tsx

216 lines. Query keys: `['planEntitlements', planId],`

Response/domain field candidates: `feature?.unit_plural`, `feature?.unit_singular`, `feature?.name`, `row?.feature?.id`, `row?.feature?.name`, `row?.feature_type`, `row?.usage_reset_period`, `row?.id`, `row?.status`

- Line 128: `ActionButton`

```tsx
id={row?.id}
						copyId={{ entityType: 'Entitlement' }}
						deleteMutationFn={async () => {
							return await EntitlementApi.delete(row?.id);
						}}
						refetchQueryKey='planEntitlements'
						entityName={row?.feature?.name}
						edit={{ enabled: false }}
						archive={{
							enabled: row?.status !== ENTITY_STATUS.ARCHIVED,
							text: 'Delete',
							icon: <Trash2 />,
							disabled: !canWriteEntitlement,
							disabledReason: !canWriteEntitlement ? t('catalog:plans.entitlementsTab.writeDeniedTooltip') : undefined,
						}}
```

- Line 162: `Button`

```tsx
prefixIcon={<Plus />} onClick={() => setDrawerOpen(true)}
```

- Line 168: `Button`

```tsx
disabled prefixIcon={<Plus />}
```

- Line 177: `AddEntitlementDrawer`

```tsx
selectedFeatures={entitlements?.map((v: any) => v.feature)}
				entitlements={entitlements}
				planId={planId!}
				entityType={ENTITLEMENT_ENTITY_TYPE.PLAN}
				entityId={planId!}
				isOpen={drawerOpen}
				onOpenChange={setDrawerOpen}
				refetchQueryKeys={['planEntitlements', planId!]}
```

- Line 201: `FlexpriceTable`

```tsx
showEmptyRow data={entitlements} columns={columnData}
```

## src/pages/product-catalog/plans/tabs/PlanCreditGrantsTab.tsx

147 lines. Query keys: `['planCreditGrants', planId],`

Response/domain field candidates:

- Line 103: `Button`

```tsx
prefixIcon={<Plus />} onClick={() => setCreditGrantModalOpen(true)} disabled={isCreatingCreditGrant}
```

- Line 109: `Button`

```tsx
disabled prefixIcon={<Plus />}
```

- Line 130: `CreditGrantsTable`

```tsx
data={creditGrants}
							onDelete={async () => {
								refetchQueries(['planCreditGrants', planId!]);
							}}
							showEmptyRow
```

## src/pages/product-catalog/plans/tabs/PlanInformationTab.tsx

177 lines. Query keys: `['fetchPlan', planId],`

Response/domain field candidates:

- Line 100: `PlanDrawer`

```tsx
trigger={
											<Button variant={'outline'} size={'icon'}>
												<Pencil />
											</Button>
										}
										open={planDrawerOpen}
										onOpenChange={setPlanDrawerOpen}
										data={planData as Plan}
										refetchQueryKeys={['fetchPlan', planId!]}
```

- Line 102: `Button`

```tsx
variant={'outline'} size={'icon'}
```

- Line 114: `Button`

```tsx
variant={'outline'} size={'icon'} disabled
```

- Line 132: `Button`

```tsx
variant='outline' size='icon' onClick={() => setShowMetadataModal(true)}
```

- Line 138: `Button`

```tsx
variant='outline' size='icon' disabled
```

## src/pages/product-catalog/groups/Groups.tsx

182 lines. Query keys: `'fetchGroups',`

Response/domain field candidates: `row.entity_type`, `row.status`, `row.updated_at`, `row.id`, `response.items`, `response.pagination`

- Line 83: `ActionButton`

```tsx
id={row.id}
						copyId={{ entityType: 'Group' }}
						deleteMutationFn={(id) => GroupApi.deleteGroup(id)}
						refetchQueryKey='fetchGroups'
						entityName={t('groups.table.entityName')}
						edit={{
							enabled: true,
							onClick: () => handleEdit(row),
							disabled: !canWriteGroup,
							disabledReason: canWriteGroup ? undefined : t('groups.writeDeniedTooltip'),
						}}
						archive={{
							enabled: row.status === ENTITY_STATUS.PUBLISHED,
							disabled: !canWriteGroup,
							disabledReason: canWriteGroup ? undefined : t('groups.writeDeniedTooltip'),
						}}
```

- Line 112: `AddButton`

```tsx
onClick={handleOnAdd}
```

- Line 116: `AddButton`

```tsx
disabled onClick={handleOnAdd}
```

- Line 121: `GroupDrawer`

```tsx
data={activeGroup} open={groupDrawerOpen} onOpenChange={setGroupDrawerOpen} refetchQueryKeys={['fetchGroups']}
```

## src/pages/product-catalog/groups/GroupHeader.tsx

38 lines. Query keys: `['fetchGroupDetails', groupId],`

Response/domain field candidates:

- Line 29: `CopyIdButton`

```tsx
id={group.id} entityType='Group'
```

## src/pages/product-catalog/groups/GroupProfilePage.tsx

114 lines. Query keys: `['fetchGroupDetails', groupId],`

Response/domain field candidates:

## src/pages/product-catalog/groups/tabs/GroupOverviewTab.tsx

590 lines. Query keys: `['fetchGroupDetails', groupId],`, `['fetchGroupFeatures', groupId, mergedFeatureFilters, featureSorts],`, `['groupChargesSearch', groupId, mergedFilters, searchSorts, page, limit],`

Response/domain field candidates: `price.start_date?.trim`, `price.start_date`, `price.end_date?.trim`, `price.end_date`, `price.entity_id?.trim`, `price.entity_type`, `price.entity_id`, `row.display_name`, `row.type`, `row.invoice_cadence`, `row.billing_period`, `row?.id`, `row.id`, `row.name`, `row?.name`, `row?.type`, `row?.status`, `row?.updated_at`

- Line 545: `FlexpriceTable`

```tsx
showEmptyRow columns={chargeColumns} data={tableItems}
```

- Line 577: `FlexpriceTable`

```tsx
columns={featureColumns}
						data={features}
						onRowClick={(row) => row?.id && navigate(`${RouteNames.featureDetails}/${row.id}`)}
						showEmptyRow
```

## src/pages/product-catalog/groups/tabs/GroupInformationTab.tsx

55 lines. Query keys: `['fetchGroupDetails', groupId],`

Response/domain field candidates:

## src/pages/product-catalog/price-units/PriceUnits.tsx

296 lines. Query keys: `'fetchPriceUnits',`

Response/domain field candidates: `row?.base_currency?.toUpperCase`, `row?.conversion_rate`, `row?.status`, `row?.updated_at`, `row?.id`, `row?.name`

- Line 204: `ActionButton`

```tsx
id={row?.id}
							copyId={{ entityType: 'Price Unit' }}
							deleteMutationFn={async () => {
								return await PriceUnitApi.DeletePriceUnit(row?.id);
							}}
							refetchQueryKey='fetchPriceUnits'
							entityName={row?.name}
							edit={{
								enabled: true,
								onClick: () => handleEdit(row),
								disabled: !canWritePriceUnit,
								disabledReason: canWritePriceUnit ? undefined : t('priceUnits.writeDeniedTooltip'),
							}}
							archive={{
								enabled: row?.status !== ENTITY_STATUS.ARCHIVED,
								disabled: !canWritePriceUnit,
								disabledReason: canWritePriceUnit ? undefined : t('priceUnits.writeDeniedTooltip'),
							}}
```

- Line 236: `AddButton`

```tsx
onClick={handleOnAdd}
```

- Line 240: `AddButton`

```tsx
disabled onClick={handleOnAdd}
```

- Line 245: `PriceUnitDrawer`

```tsx
data={activePriceUnit}
				open={priceUnitDrawerOpen}
				onOpenChange={setPriceUnitDrawerOpen}
				refetchQueryKeys={['fetchPriceUnits']}
```

## src/pages/settings/team/OrganizationInfoCard.tsx

111 lines. Query keys:

Response/domain field candidates:

- Line 60: `UpdateTenantDrawer`

```tsx
data={user}
									open={editOpen}
									onOpenChange={setEditOpen}
									trigger={
										canWriteTenant ? (
											<Button
												variant='ghost'
												size='icon'
												className='h-6 w-6 shrink-0 text-content-zinc-subtle hover:text-content-zinc-tertiary'
												aria-label={t('organization.editOrganization')}>
												<Pencil className='h-4 w-4' />
											</Button>
										) : (
											<Tooltip content={t('organization.writeDeniedTooltip')}>
												<span tabIndex={0} className='inline-block'>
													<Button
														variant='ghost'
														size='icon'
														disabled
														className='h-6 w-6 shrink-0 text-content-zinc-subtle'
														aria-label={t('organization.editOrganization')}>
														<Pencil className='h-4 w-4' />
													</Button>
												</span>
											</Tooltip>
										)
									}
```

- Line 66: `Button`

```tsx
variant='ghost'
												size='icon'
												className='h-6 w-6 shrink-0 text-content-zinc-subtle hover:text-content-zinc-tertiary'
												aria-label={t('organization.editOrganization')}
```

- Line 76: `Button`

```tsx
variant='ghost'
														size='icon'
														disabled
														className='h-6 w-6 shrink-0 text-content-zinc-subtle'
														aria-label={t('organization.editOrganization')}
```

## src/components/molecules/RolePicker/RolePicker.tsx

119 lines. Query keys:

Response/domain field candidates:

- Line 61: `Button`

```tsx
variant='outline' size='sm' className='mt-2' onClick={onRetry}
```

- Line 84: `CheckboxPrimitive.Root`

```tsx
id={inputId}
									checked={isChecked}
									onCheckedChange={() => onToggle(role.id)}
									aria-label={role.name}
									className={cn(
										'mt-0.5 h-4 w-4 shrink-0 rounded-full border shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed',
										isChecked ? 'border-content-zinc-bold bg-content-zinc-bold' : 'border-line-strong bg-transparent',
									)}
```

- Line 93: `CheckboxPrimitive.Indicator`

```tsx
className='flex items-center justify-center text-surface'
```

## src/components/molecules/EditUserRolesDialog/EditUserRolesDialog.tsx

208 lines. Query keys: `['user-detail', user?.id],`

Response/domain field candidates:

- Line 119: `Dialog`

```tsx
isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={t('members.editRoles.title')}
			description={t('members.editRoles.description')}
			titleClassName='text-lg font-semibold text-content-zinc-bold'
			descriptionClassName='text-sm text-content-zinc-muted'
			className='rounded-xl border border-line-subtle shadow-lg sm:max-w-[560px]'
```

- Line 142: `CopyIdButton`

```tsx
id={displayUser.id} entityType='User' className='h-5 w-5 shrink-0'
```

- Line 192: `Button`

```tsx
variant='outline' onClick={() => onOpenChange(false)} disabled={isPending}
```

- Line 195: `Button`

```tsx
onClick={handleSubmit}
						disabled={isPending || selectedRoleIds.length === 0 || !hasChanges || isLoadingRoles || isRolesError}
						isLoading={isPending}
```

## src/pages/settings/team/useTenantMembers.ts

38 lines. Query keys: `settingsQueryKeys.teamMembersRoot(),`

Response/domain field candidates: `data?.items`, `data?.pagination?.total`, `data?.items?.length`

## src/pages/settings/team/UsersSection.tsx

584 lines. Query keys:

Response/domain field candidates: `row.join`, `row.id`, `row.email`

- Line 328: `ActionButton`

```tsx
id={row.id}
						entityName={row.email || row.id}
						deleteMutationFn={() => UserApi.removeUserFromTenant(row.id)}
						refetchQueryKey={settingsQueryKeys.teamMembersRoot()[0]}
						edit={{ enabled: true, text: t('members.actions.editRoles'), onClick: () => setEditingUser(row) }}
						archive={{
							enabled: totalMembers > 1,
							text: t('members.actions.remove'),
							icon: <Trash2 className='h-4 w-4' />,
						}}
```

- Line 359: `AddButton`

```tsx
label={t('members.actions.invite')} onClick={openInviteDialog}
```

- Line 363: `AddButton`

```tsx
label={t('members.actions.invite')} disabled
```

- Line 378: `Button`

```tsx
variant='outline' onClick={() => refetch()}
```

- Line 385: `FlexpriceTable`

```tsx
columns={columns} data={paginatedMembers} showEmptyRow
```

- Line 403: `Dialog`

```tsx
isOpen={userDialogOpen}
				onOpenChange={(open) => {
					if (!open) closeUserDialog();
					else setUserDialogOpen(true);
				}}
				title={t('members.addMember.title')}
				description={t('members.addMember.description')}
				titleClassName='text-lg font-semibold text-content-zinc-bold'
				descriptionClassName='text-sm text-content-zinc-muted'
				className='rounded-xl border border-line-subtle shadow-lg sm:max-w-[560px]'
```

- Line 427: `Input`

```tsx
id='member-email'
								type='email'
								placeholder={t('members.addMember.emailPlaceholder')}
								value={email}
								onChange={(value) => setEmail(value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										handleAddUser();
									}
								}}
								autoFocus
								className='border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0'
```

- Line 462: `Button`

```tsx
onClick={handleAddUser}
							disabled={createUser.isPending || selectedRoleIds.length === 0 || isLoadingRoles || isRolesError}
							isLoading={createUser.isPending}
```

- Line 472: `Dialog`

```tsx
isOpen={passwordDialogOpen}
				onOpenChange={(open) => (open ? setPasswordDialogOpen(true) : handleClosePasswordDialog())}
				title={t('members.credentials.title')}
				description={t('members.credentials.description')}
				className='w-full max-w-[480px] rounded-xl border border-line-subtle shadow-lg'
```

- Line 510: `Input`

```tsx
id='temp-password'
								readOnly
								type={showPassword ? 'text' : 'password'}
								value={oneTimePassword ?? ''}
								className='min-h-[24px] flex-1 border-0 bg-transparent py-0 pl-2 pr-24 font-mono text-sm text-content-zinc-bold focus-visible:ring-0'
```

- Line 551: `Button`

```tsx
onClick={handleCopyLoginLink} className='shrink-0'
```

- Line 555: `Button`

```tsx
variant='outline' size='sm' onClick={handleDownloadCsv} className='shrink-0'
```

- Line 559: `Button`

```tsx
variant='outline' size='sm' onClick={handleCopyAll} className='shrink-0'
```

- Line 578: `EditUserRolesDialog`

```tsx
user={editingUser} isOpen={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}
```

## src/pages/settings/billing/useCustomCurrencyConfiguration.ts

57 lines. Query keys: `settingsQueryKeys.customCurrencyConfig(environmentId),`, `settingsQueryKeys.customCurrencyConfig(environmentId) });`

Response/domain field candidates:

## src/pages/settings/SettingsFormActions.tsx

44 lines. Query keys:

Response/domain field candidates:

- Line 18: `Button`

```tsx
onClick={onSave} isLoading={isSaving} disabled={disabled}
```

- Line 26: `Button`

```tsx
variant='outline' onClick={onReset} disabled={disabled || isSaving}
```

## src/pages/settings/billing/CustomCurrencyConfigurationSection.tsx

292 lines. Query keys:

Response/domain field candidates: `row.factors`, `row.id`, `row.code`, `row.name`, `row.symbol`, `row.code.toUpperCase`, `item.id`

- Line 147: `Select`

```tsx
options={fiatOptions}
								value={draft.defaultFiatCurrency}
								onChange={setSettlementCurrency}
								disabled={isDisabled}
								placeholder={t('billing.customCurrencyConfiguration.fields.settlementPlaceholder')}
								ariaLabel={settlementLabel}
```

- Line 190: `Select`

```tsx
options={addableFiatOptions}
										value=''
										onChange={addFiat}
										disabled={isDisabled}
										placeholder={t('billing.customCurrencyConfiguration.actions.addConversionCurrency')}
										className='w-40'
										ariaLabel={t('billing.customCurrencyConfiguration.actions.addConversionCurrency')}
```

- Line 215: `Input`

```tsx
value={row.code}
											onChange={(value) => updateRow(row.id, { code: value.toLowerCase().slice(0, 3) })}
											placeholder={t('billing.customCurrencyConfiguration.fields.codePlaceholder')}
											disabled={isDisabled}
```

- Line 222: `Input`

```tsx
label={nameLabel}
										value={row.name}
										onChange={(value) => updateRow(row.id, { name: value })}
										placeholder={t('billing.customCurrencyConfiguration.fields.namePlaceholder')}
										disabled={isDisabled}
```

- Line 229: `Input`

```tsx
label={symbolLabel}
										value={row.symbol}
										onChange={(value) => updateRow(row.id, { symbol: value })}
										placeholder={t('billing.customCurrencyConfiguration.fields.symbolPlaceholder')}
										disabled={isDisabled}
```

- Line 241: `Input`

```tsx
key={fiat}
												label={t('billing.customCurrencyConfiguration.fields.rate', { fiat: fiat.toUpperCase() })}
												value={row.factors[fiat] ?? ''}
												onChange={(value) => updateFactor(row.id, fiat, value)}
												placeholder={t('billing.customCurrencyConfiguration.fields.ratePlaceholder')}
												disabled={isDisabled}
```

- Line 253: `Button`

```tsx
variant='outline'
									size='icon'
									className='absolute end-4 top-10'
									disabled={isDisabled || draft.currencies.length === 1}
									aria-label={t('billing.customCurrencyConfiguration.actions.removeCurrency', {
										currency: row.code.toUpperCase() || codeLabel,
									})}
									onClick={() => setDraft((prev) => ({ ...prev, currencies: prev.currencies.filter((item) => item.id !== row.id) }))}
```

- Line 268: `AddButton`

```tsx
variant='outline'
								disabled={isDisabled || !draft.defaultFiatCurrency}
								label={t('billing.customCurrencyConfiguration.actions.addCurrency')}
								onClick={() => setDraft((prev) => ({ ...prev, currencies: [...prev.currencies, newRow(prev.fiatCurrencies)] }))}
```

- Line 279: `SettingsFormActions`

```tsx
onSave={handleSave}
						isSaving={isSaving}
						disabled={isLoading || isError || !canWriteSetting || !!errorKey}
						disabledReason={canWriteSetting ? undefined : t('superAdmin.writeDeniedTooltip')}
```

## src/pages/settings/billing/useInvoiceConfiguration.ts

53 lines. Query keys: `settingsQueryKeys.invoiceConfig,`

Response/domain field candidates:

## src/pages/settings/billing/InvoiceConfigurationSection.tsx

271 lines. Query keys:

Response/domain field candidates:

- Line 156: `Input`

```tsx
value={draft.prefix} onChange={(value) => updateDraft('prefix', value)} disabled={updateConfiguration.isPending}
```

- Line 163: `Input`

```tsx
value={draft.separator}
								onChange={(value) => updateDraft('separator', value)}
								disabled={updateConfiguration.isPending}
```

- Line 174: `Select`

```tsx
value={draft.format}
								options={dateFormatOptions}
								onChange={(value) => updateDraft('format', value as InvoiceNumberFormat)}
								disabled={updateConfiguration.isPending}
```

- Line 186: `Input`

```tsx
value={draft.timezone} onChange={(value) => updateDraft('timezone', value)} disabled={updateConfiguration.isPending}
```

- Line 193: `Input`

```tsx
type='number'
								value={String(draft.start_sequence)}
								variant='number'
								onChange={(value) => updateDraft('start_sequence', Number(value || 0))}
								disabled={updateConfiguration.isPending}
```

- Line 206: `Input`

```tsx
min={1}
								max={10}
								inputMode='numeric'
								value={suffixLengthInput}
								variant='integer'
								onChange={setSuffixLengthInput}
								onBlur={normalizeSuffixLengthInput}
								disabled={updateConfiguration.isPending}
```

- Line 222: `Input`

```tsx
type='number'
								value={String(draft.due_date_days)}
								variant='number'
								onChange={(value) => updateDraft('due_date_days', Number(value || 0))}
								disabled={updateConfiguration.isPending}
```

- Line 237: `Input`

```tsx
inputMode='numeric'
										variant='integer'
										value={delayValueInput}
										onChange={setDelayValueInput}
										disabled={updateConfiguration.isPending}
```

- Line 246: `Select`

```tsx
value={delayUnit}
										options={delayUnitOptions}
										onChange={(value) => setDelayUnit(value as FinalizationDelayUnit)}
										disabled={updateConfiguration.isPending}
```

- Line 257: `SettingsFormActions`

```tsx
onReset={handleReset}
						onSave={handleSave}
						isSaving={updateConfiguration.isPending || resetToDefaults.isPending}
						disabled={isLoading || !canWriteSetting}
						disabledReason={canWriteSetting ? undefined : t('superAdmin.writeDeniedTooltip')}
```

## src/pages/settings/billing/useSubscriptionConfiguration.ts

51 lines. Query keys: `settingsQueryKeys.subscriptionConfig,`

Response/domain field candidates:

## src/pages/settings/billing/SubscriptionConfigurationSection.tsx

165 lines. Query keys:

Response/domain field candidates:

- Line 121: `Input`

```tsx
type='number'
									value={gracePeriodInput}
									variant='number'
									suffix={t('billing.subscriptionConfiguration.fields.gracePeriodSuffix')}
									onChange={setGracePeriodInput}
									onBlur={() => {
										const normalized = normalizeGracePeriodDays(gracePeriodInput);
										setGracePeriodInput(String(normalized));
										setDraft((prev) => ({ ...prev, grace_period_days: normalized }));
									}}
									disabled={updateConfiguration.isPending}
```

- Line 151: `SettingsFormActions`

```tsx
onReset={handleReset}
						onSave={handleSave}
						isSaving={updateConfiguration.isPending}
						disabled={isLoading || !canWriteSetting}
						disabledReason={canWriteSetting ? undefined : t('superAdmin.writeDeniedTooltip')}
```

## src/pages/settings/customer-portal/useCustomerPortalConfig.ts

42 lines. Query keys: `settingsQueryKeys.customerPortalConfig,`

Response/domain field candidates:

## src/pages/settings/customer-portal/CustomerPortalTab.tsx

114 lines. Query keys:

Response/domain field candidates:

- Line 100: `SettingsFormActions`

```tsx
onReset={handleReset}
						onSave={handleSave}
						isSaving={updateConfig.isPending}
						disabled={isLoading || !canWritePortal}
						disabledReason={canWritePortal ? undefined : t('superAdmin.writeDeniedTooltip')}
```

## src/pages/settings/customer-onboarding/OnboardingActionSetEditor.tsx

285 lines. Query keys:

Response/domain field candidates: `wallet.expirationUnits.`, `wallet.types.prePaid`, `wallet.types.prePaidHint`, `wallet.types.postPaid`, `wallet.types.postPaidHint`, `wallet.title`, `subscription.title`, `wallet.type`, `wallet.currency`, `wallet.conversionRate`, `wallet.initialCredits`, `wallet.expireCredits`, `wallet.expirationDuration`, `wallet.expirationUnit`, `subscription.plan`, `subscription.billingCycle`, `subscription.startDate`, `wallet.description`, `wallet.typeHint`, `wallet.typePlaceholder`, `wallet.currencyHint`, `wallet.conversionRateHint`, `wallet.initialCreditsHint`, `wallet.initialCreditsPlaceholder`, `wallet.expireCreditsHint`, `wallet.expirationDurationHint`, `wallet.expirationDurationPlaceholder`, `wallet.expirationUnitHint`, `wallet.expirationUnitPlaceholder`, `subscription.description`, `subscription.planHint`, `subscription.plansLoading`, `subscription.planPlaceholder`, `subscription.noPlans`, `subscription.billingCycleHint`, `subscription.startDateHint`, `subscription.startDatePlaceholder`

- Line 122: `Select`

```tsx
value={value.walletType || WALLET_TYPE.PRE_PAID}
								options={walletTypeOptions}
								placeholder={t('customerOnboarding.workflow.wallet.typePlaceholder')}
								onChange={(next) => patch({ walletType: (next as WALLET_TYPE) || WALLET_TYPE.PRE_PAID })}
								disabled={disabled}
```

- Line 135: `Select`

```tsx
value={value.walletCurrency}
								options={currencyOptions}
								onChange={(next) => patch({ walletCurrency: next || DEFAULT_CURRENCY_CODE })}
								disabled={disabled}
```

- Line 147: `Input`

```tsx
value={value.walletConversionRate}
								variant='number'
								onChange={(next) => patch({ walletConversionRate: next })}
								disabled={disabled}
```

- Line 159: `Input`

```tsx
value={value.walletInitialCreditsToLoad}
								variant='formatted-number'
								formatOptions={{
									allowDecimals: true,
									allowNegative: false,
									decimalSeparator: '.',
									thousandSeparator: ',',
								}}
								placeholder={t('customerOnboarding.workflow.wallet.initialCreditsPlaceholder')}
								onChange={(next) => patch({ walletInitialCreditsToLoad: next })}
								disabled={disabled}
```

- Line 191: `Input`

```tsx
value={value.walletCreditsExpirationDuration}
										variant='formatted-number'
										formatOptions={{
											allowDecimals: false,
											allowNegative: false,
											decimalSeparator: '.',
											thousandSeparator: ',',
										}}
										placeholder={t('customerOnboarding.workflow.wallet.expirationDurationPlaceholder')}
										onChange={(next) => patch({ walletCreditsExpirationDuration: next })}
										disabled={disabled || !showCreditsExpiry || !value.walletCreditsExpireEnabled}
```

- Line 210: `Select`

```tsx
value={value.walletCreditsExpirationDurationUnit}
										options={creditExpirationUnitOptions}
										placeholder={t('customerOnboarding.workflow.wallet.expirationUnitPlaceholder')}
										onChange={(next) => patch({ walletCreditsExpirationDurationUnit: (next as CREDIT_GRANT_PERIOD_UNIT) || '' })}
										disabled={disabled || !showCreditsExpiry || !value.walletCreditsExpireEnabled}
```

- Line 240: `Select`

```tsx
value={value.subscriptionPlanId}
								options={resolvedPlanOptions}
								placeholder={
									arePlansLoading
										? t('customerOnboarding.workflow.subscription.plansLoading')
										: t('customerOnboarding.workflow.subscription.planPlaceholder')
								}
								noOptionsText={t('customerOnboarding.workflow.subscription.noPlans')}
								onChange={(next) => patch({ subscriptionPlanId: next })}
								disabled={disabled || arePlansLoading}
```

- Line 258: `Select`

```tsx
value={value.subscriptionBillingCycle}
								options={billingCycleOptions}
								onChange={(next) => patch({ subscriptionBillingCycle: (next as BILLING_CYCLE) || BILLING_CYCLE.ANNIVERSARY })}
								disabled={disabled}
```

- Line 270: `Input`

```tsx
value={value.subscriptionStartDate}
								onChange={(next) => patch({ subscriptionStartDate: next })}
								placeholder={t('customerOnboarding.workflow.subscription.startDatePlaceholder')}
								disabled={disabled}
```

## src/pages/settings/customer-onboarding/CustomWorkflowCard.tsx

102 lines. Query keys:

Response/domain field candidates: `wallet.title`, `subscription.title`

- Line 62: `Button`

```tsx
type='button'
					variant='ghost'
					size='sm'
					className='h-8 shrink-0 px-2 text-content-zinc-muted hover:text-danger'
					onClick={onRemove}
					disabled={disabled}
					aria-label={t('customerOnboarding.workflow.customWorkflows.remove')}
```

- Line 80: `Input`

```tsx
value={value.label}
							onChange={(next) => onChange({ ...value, label: next.slice(0, CUSTOM_WORKFLOW_NAME_MAX_LENGTH) })}
							placeholder={t('customerOnboarding.workflow.customWorkflows.namePlaceholder')}
							maxLength={CUSTOM_WORKFLOW_NAME_MAX_LENGTH}
							disabled={disabled}
```

## src/pages/settings/customer-onboarding/useCustomerOnboardingConfig.ts

234 lines. Query keys: `settingsQueryKeys.customerOnboardingConfig,`, `settingsQueryKeys.customerOnboardingPlans,`

Response/domain field candidates: `response.items`

## src/pages/settings/customer-onboarding/CustomerOnboardingTab.tsx

222 lines. Query keys:

Response/domain field candidates: `plan.id`, `plan.name`, `plan.description`

- Line 199: `AddButton`

```tsx
className='self-start'
							label={t('customerOnboarding.workflow.customWorkflows.add')}
							variant='outline'
							onClick={addCustomWorkflow}
							disabled={isSaving || !canWriteSetting}
```

- Line 208: `SettingsFormActions`

```tsx
onReset={handleReset}
						onSave={handleSave}
						isSaving={isSaving}
						disabled={isLoading || !canWriteSetting}
						disabledReason={canWriteSetting ? undefined : t('superAdmin.writeDeniedTooltip')}
```

## src/pages/settings/alerts/useWalletAlertSettings.ts

49 lines. Query keys: `settingsQueryKeys.walletBalanceAlertConfig,`

Response/domain field candidates:

## src/pages/settings/alerts/WalletAlertSettings.tsx

123 lines. Query keys:

Response/domain field candidates:

- Line 87: `Switch`

```tsx
checked={draft.alert_enabled}
							onCheckedChange={(enabled) => setDraft((prev) => setWalletAlertDraftEnabled(prev, enabled))}
							disabled={isLoading || updateSettings.isPending}
							aria-label={alertsTitle}
```

- Line 104: `Button`

```tsx
onClick={handleSave} isLoading={updateSettings.isPending} disabled={updateSettings.isPending}
```

- Line 110: `Button`

```tsx
disabled
```

## src/pages/settings/appearance/ThemeSettings.tsx

47 lines. Query keys:

Response/domain field candidates:

- Line 31: `Switch`

```tsx
checked={theme === 'dark'}
							onCheckedChange={(enabled) => setTheme(enabled ? 'dark' : 'light')}
							aria-label={t('appearance.theme.toggleAriaLabel')}
```

## src/pages/settings/saml-sso/useSamlConfig.ts

79 lines. Query keys: `settingsQueryKeys.samlConfig,`, `settingsQueryKeys.samlConfig });`

Response/domain field candidates:

## src/pages/settings/saml-sso/SamlSsoTab.tsx

317 lines. Query keys:

Response/domain field candidates:

- Line 187: `Input`

```tsx
value={metadataUrl} disabled className='flex-1'
```

- Line 188: `Button`

```tsx
variant='outline' size='icon' onClick={handleCopyMetadataUrl} title={t('saml.config.copyMetadataUrl')}
```

- Line 199: `Input`

```tsx
value={ssoLoginUrl} disabled className='flex-1'
```

- Line 200: `Button`

```tsx
variant='outline' size='icon' onClick={handleCopySsoLoginUrl} title={t('saml.config.copySsoLoginUrl')}
```

- Line 242: `Input`

```tsx
label={t('saml.config.idpEntityId')}
							description={t('saml.config.idpEntityIdDescription')}
							placeholder={t('saml.config.idpEntityIdPlaceholder')}
							value={draft.idp_entity_id}
							disabled={isSaving}
							error={errors.idp_entity_id}
							onChange={(value) => setDraft((prev) => ({ ...prev, idp_entity_id: value }))}
```

- Line 252: `Input`

```tsx
label={t('saml.config.idpSsoUrl')}
							description={t('saml.config.idpSsoUrlDescription')}
							placeholder={t('saml.config.idpSsoUrlPlaceholder')}
							value={draft.idp_sso_url}
							disabled={isSaving}
							error={errors.idp_sso_url}
							onChange={(value) => setDraft((prev) => ({ ...prev, idp_sso_url: value }))}
```

- Line 262: `Textarea`

```tsx
label={t('saml.config.idpCertificate')}
							description={t('saml.config.idpCertificateDescription')}
							placeholder={t('saml.config.idpCertificatePlaceholder')}
							value={draft.idp_certificate}
							disabled={isSaving}
							error={errors.idp_certificate}
							textAreaClassName='min-h-[180px] font-mono text-xs'
							onChange={(value) => setDraft((prev) => ({ ...prev, idp_certificate: value }))}
```

- Line 282: `Input`

```tsx
label={t('saml.config.emailAttribute')}
							description={t('saml.config.emailAttributeDescription')}
							placeholder={t('saml.config.emailAttributePlaceholder')}
							value={draft.email_attribute}
							disabled={isSaving}
							onChange={(value) => setDraft((prev) => ({ ...prev, email_attribute: value }))}
```

- Line 291: `Select`

```tsx
label={t('saml.config.defaultRole')}
							description={t('saml.config.defaultRoleDescription')}
							placeholder={t('saml.config.defaultRolePlaceholder')}
							options={roleOptions}
							value={draft.default_role || undefined}
							disabled={isSaving}
							error={errors.default_role}
							onChange={(value) => setDraft((prev) => ({ ...prev, default_role: value as SamlDefaultRole }))}
```

- Line 303: `SettingsFormActions`

```tsx
onReset={handleReset}
						onSave={handleSave}
						isSaving={isSaving}
						disabled={isLoading || !canWriteSetting}
						disabledReason={canWriteSetting ? undefined : t('superAdmin.writeDeniedTooltip')}
```

## src/pages/usage/events/Events.tsx

313 lines. Query keys:

Response/domain field candidates: `response.events`, `response.iter_last_key`, `response.has_more`

- Line 290: `Button`

```tsx
variant='outline' onClick={refreshEvents}
```

- Line 295: `EventsTable`

```tsx
data={events}
```

## src/pages/usage/query/Query.tsx

329 lines. Query keys: `['fetchUsage', apiParams],`

Response/domain field candidates: `item.window_size`, `item.value`, `feature.meter_id`

- Line 241: `SelectFeature`

```tsx
featureTypes={[FEATURE_TYPE.METERED]}
						label=''
						className='w-full rounded-xl max-h-9'
						onChange={(feature: Feature) => {
							if (feature) {
								setSelectedFeature(feature);
								setSelectedMeter(feature.meter_id);
							}
						}}
						value={selectedFeature?.id}
						placeholder={t('usage.query.selectMeteredFeaturePlaceholder')}
```

- Line 256: `Select`

```tsx
className='w-full rounded-xl max-h-9'
						onChange={(value) => setWindowSize(value)}
						value={windowSize}
						options={windowSizeOptions.map((option) => ({ label: option.label, value: option.value }))}
```

- Line 263: `Button`

```tsx
variant='outline' onClick={() => fetchUsage()}
```

## src/pages/usage/cost-analytics/CostAnalytics.tsx

192 lines. Query keys: `['cost-analytics', debouncedApiParams],`

Response/domain field candidates: `feature.id`

- Line 108: `FeatureMultiSelect`

```tsx
label={t('usage.costAnalytics.featuresLabel')}
							placeholder={t('usage.costAnalytics.selectFeaturesPlaceholder')}
							values={selectedFeatures.map((f) => f.id)}
							onChange={setSelectedFeatures}
							onFeaturesFetched={setFetchedFeatures}
							className='text-sm'
```

- Line 118: `Input`

```tsx
label={t('usage.costAnalytics.customerIdLabel')}
							placeholder={t('usage.costAnalytics.externalCustomerIdPlaceholder')}
							value={customerId}
							onChange={setCustomerId}
							className='text-sm'
```

- Line 181: `CostDataTable`

```tsx
items={costData.cost_analytics}
```

## src/pages/webhooks/WebhookDashboard.tsx

117 lines. Query keys: `prefetch.queryKey(envId ?? ''),`

Response/domain field candidates: `data?.svix_enabled`, `data?.token`, `data?.app_id`, `data.token`, `data.app_id`, `data?.url`

## src/pages/home/DashboardPage.tsx

223 lines. Query keys: `['monitoring', 'dashboard', environmentId, debouncedMonitoringParams],`

Response/domain field candidates:

## src/components/customer-portal/PortalHeader.tsx

58 lines. Query keys:

Response/domain field candidates: `customer.name`, `customer.email`

## src/components/customer-portal/WalletTab.tsx

174 lines. Query keys: `['portal-wallets'],`, `['portal-wallet-balance', activeWallet?.id],`, `['portal-wallet-transactions', activeWallet?.id, limit, offset],`

Response/domain field candidates: `wallet.emptyTitle`, `wallet.emptyDescription`, `wallet.fallbackName`, `wallet.defaultName`, `wallet.balance`, `wallet.credits`, `wallet.valueSuffix`, `wallet.transactionHistory`, `wallet.noTransactionsTitle`, `wallet.noTransactionsDescription`

- Line 102: `Select`

```tsx
value={activeWallet?.id || ''}
					onChange={(value) => setSelectedWalletId(value)}
					options={walletOptions}
					className='w-full max-w-xs'
```

- Line 158: `WalletTransactionsTable`

```tsx
data={transactionsData.items}
```

## src/components/customer-portal/widgets/SubscriptionsWidget.tsx

80 lines. Query keys:

Response/domain field candidates: `subscription.current_period_start`, `subscription.current_period_end`, `subscription.subscription_status`, `subscription.trial_end`, `subscription.id`, `subscription.plan?.name`

## src/components/atoms/PortalTable/PortalTable.tsx

133 lines. Query keys:

Response/domain field candidates: `data.map`

- Line 106: `PortalTable`

```tsx

```

- Line 107: `PortalTableHeader`

```tsx

```

- Line 110: `PortalTableHead`

```tsx
key={i} align={column.align} className={column.className}
```

- Line 116: `PortalTableBody`

```tsx

```

- Line 118: `PortalTableRow`

```tsx
key={getRowKey(row, index)}
						interactive={Boolean(onRowClick)}
						onClick={onRowClick ? () => onRowClick(row) : undefined}
```

- Line 123: `PortalTableCell`

```tsx
key={i} align={column.align} className={column.className}
```

## src/components/customer-portal/invoiceStatus.ts

21 lines. Query keys:

Response/domain field candidates: `invoice.invoice_status`, `invoice.payment_status`

## src/components/customer-portal/widgets/InvoiceDetailDrawer.tsx

193 lines. Query keys: `portalInvoiceQueryKey(invoice?.id),`

Response/domain field candidates: `invoice.payment_status`, `invoice.invoice_status`, `invoice.due_date`, `invoice?.id`, `item.id`, `item.display_name`, `item.quantity`, `item.amount`

- Line 175: `Button`

```tsx
onClick={() => onPay(detail)} isLoading={payPendingId === detail.id} disabled={payPendingId !== null}
```

- Line 180: `Button`

```tsx
variant='outline' onClick={() => onDownload(detail)} disabled={isDownloading}
```

## src/components/customer-portal/checkoutHandoff.ts

71 lines. Query keys:

Response/domain field candidates: `data?.type`

## src/components/customer-portal/useCheckoutReturn.ts

158 lines. Query keys: `['portal-checkout-session', sessionId],`

Response/domain field candidates: `data?.checkout_status`

## src/components/customer-portal/widgets/CheckoutLinkDialog.tsx

88 lines. Query keys:

Response/domain field candidates:

- Line 65: `Dialog`

```tsx
isOpen={url !== null}
			onOpenChange={onOpenChange}
			title={t(`checkoutLink.${purpose}Title`)}
			description={t(`checkoutLink.${purpose}Description`)}
```

- Line 74: `Button`

```tsx
onClick={() => openPaymentUrl(url)} prefixIcon={<ExternalLink />}
```

- Line 77: `Button`

```tsx
variant='outline' onClick={copy} prefixIcon={<Copy />}
```

## src/components/customer-portal/usePortalIntegrations.ts

59 lines. Query keys: `portalIntegrationsQueryKey,`

Response/domain field candidates: `data?.payment_integrations`

## src/components/customer-portal/widgets/usePayInvoice.ts

70 lines. Query keys:

Response/domain field candidates: `response.payment_action?.url`

## src/components/customer-portal/widgets/InvoicesWidget.tsx

282 lines. Query keys: `portalInvoicesQueryKey,`

Response/domain field candidates: `invoice.payment_status`, `invoice.invoice_status`, `invoice.due_date`, `invoice.id`, `invoice.finalized_at`, `invoice.created_at`, `invoice.invoice_number`, `invoice.id.slice`, `invoice.currency`, `invoice.total`, `invoice.invoice_number?.toLowerCase`, `invoice.invoice_status?.toLowerCase`, `invoice.payment_status?.toLowerCase`

- Line 54: `PortalTable`

```tsx

```

- Line 55: `PortalTableHeader`

```tsx

```

- Line 57: `PortalTableHead`

```tsx

```

- Line 58: `PortalTableHead`

```tsx

```

- Line 59: `PortalTableHead`

```tsx

```

- Line 60: `PortalTableHead`

```tsx
align='end'
```

- Line 61: `PortalTableHead`

```tsx
align='end'
```

- Line 64: `PortalTableBody`

```tsx

```

- Line 66: `PortalTableRow`

```tsx
key={invoice.id}
```

- Line 67: `PortalTableCell`

```tsx
className='text-content-secondary'
```

- Line 70: `PortalTableCell`

```tsx
className='font-medium'
```

- Line 75: `PortalTableCell`

```tsx

```

- Line 76: `PortalTableCell`

```tsx
align='end' className='font-medium'
```

- Line 84: `PortalTableCell`

```tsx
align='end'
```

- Line 126: `PortalTableEmpty`

```tsx
colSpan={5}
```

- Line 207: `CheckoutLinkDialog`

```tsx
url={checkoutUrl} onOpenChange={(open) => !open && clearCheckoutUrl()}
```

- Line 208: `InvoiceDetailDrawer`

```tsx
invoice={detailInvoice}
				isOpen={detailInvoice !== null}
				onOpenChange={(open) => {
					if (!open) setDetailInvoice(null);
				}}
				onDownload={openInvoiceDownload}
				isDownloading={busyDownloadInvoiceId !== null}
				onPay={(invoice) => payInvoice(invoice.id)}
				payPendingId={payingInvoiceId}
```

- Line 219: `InvoiceDownloadFormatDialog`

```tsx
open={isDownloadDialogOpen}
				onOpenChange={(open) => {
					setIsDownloadDialogOpen(open);
					if (!open) {
						setDownloadTarget(null);
					}
				}}
				isPdfPending={isDownloading}
				isCsvPending={isCsvExportPending}
				onSelectPdf={async () => {
					if (!downloadTarget) return;
					await downloadPdfAsync(downloadTarget.id);
				}}
				onSelectCsv={async () => {
					if (!downloadTarget) return;
					setIsCsvExportPending(true);
					try {
						const full = downloadTarget.line_items?.length ? downloadTarget : await CustomerPortalApi.getInvoice(downloadTarget.id);
						const rows = downloadInvoiceLineItemsCsv(full);
						if (rows === 0) {
							toast.error(t('toast.noBillableLineItems'));
						} else {
							toast.success(t('toast.invoiceCsvDownloaded'));
						}
					} catch {
						toast.error(t('errors.exportInvoice'));
					} finally {
						setIsCsvExportPending(false);
					}
				}}
```

- Line 268: `InvoicesTable`

```tsx
invoices={filteredInvoices}
					onOpenDownloadFormat={openInvoiceDownload}
					downloadPendingId={busyDownloadInvoiceId}
					onView={setDetailInvoice}
					onPay={(invoice) => payInvoice(invoice.id)}
					payPendingId={payingInvoiceId}
```

## src/components/molecules/Wallet/WalletTransactionsTable.tsx

141 lines. Query keys:

Response/domain field candidates: `wallet.table.emptyCell`, `wallet.table.columnTransactions`, `wallet.table.columnPaymentDate`, `wallet.table.columnExpiryDate`, `wallet.table.columnAmount`, `row.id`

- Line 122: `PortalDataTable`

```tsx
columns={columnData.map((column, index) => ({
					title: column.title,
					// Amount is the last column and is money: it goes right, per the portal's
					// one alignment rule.
					align: index === columnData.length - 1 ? ('end' as const) : ('start' as const),
					render: (row: WalletTransaction) =>
						'render' in column && column.render ? column.render(row) : String(row[column.fieldName!] ?? ''),
				}))}
				data={data}
				getRowKey={(row) => row.id}
```

- Line 137: `FlexpriceTable`

```tsx
columns={columnData} data={data}
```

## src/components/customer-portal/usePortalWallet.ts

29 lines. Query keys: `portalWalletsQueryKey,`

Response/domain field candidates:

## src/components/customer-portal/widgets/TopUpForm.tsx

255 lines. Query keys: `portalPaymentMethodsQueryKey,`

Response/domain field candidates: `wallet.id`, `response.checkout_session?.payment_action`, `response.checkout_session?.id`, `response.checkout_session.id`, `response.checkout_session?.checkout_status`, `response.checkout_session?.failure_reason`, `response.checkout_session`, `wallet.currency`, `wallet.topup_conversion_rate`, `wallet.conversion_rate`, `wallet.credits`

- Line 170: `Input`

```tsx
variant='formatted-number'
				label={t('topUp.creditsLabel')}
				placeholder={t('topUp.creditsPlaceholder')}
				value={credits}
				onChange={setCredits}
				disabled={isPending}
				suffix={t('wallet.credits')}
				description={chargeAmount ? <span>{t('topUp.chargeSummary', { amount: `${currencySymbol}${chargeAmount}` })}</span> : undefined}
```

- Line 181: `Input`

```tsx
label={t('topUp.descriptionLabel')}
				placeholder={t('topUp.descriptionPlaceholder')}
				value={description}
				onChange={setDescription}
				disabled={isPending}
```

- Line 245: `Button`

```tsx
className='w-full' onClick={() => topUp()} disabled={!isValid || isPending} isLoading={isPending}
```

## src/components/customer-portal/widgets/TopUpWidget.tsx

52 lines. Query keys:

Response/domain field candidates: `wallet.emptyTitle`, `wallet.emptyDescription`

- Line 45: `TopUpForm`

```tsx
wallet={wallet} onActionUrl={setCheckoutUrl}
```

- Line 46: `CheckoutLinkDialog`

```tsx
url={checkoutUrl} onOpenChange={(open) => !open && setCheckoutUrl(null)}
```

## src/components/customer-portal/widgets/TopUpButton.tsx

46 lines. Query keys:

Response/domain field candidates:

- Line 27: `Button`

```tsx
size={size} onClick={() => setIsOpen(true)} prefixIcon={<Plus />}
```

- Line 30: `Dialog`

```tsx
isOpen={isOpen} onOpenChange={setIsOpen} title={t('topUp.title')} description={t('topUp.description')}
```

- Line 31: `TopUpForm`

```tsx
wallet={wallet}
					onDone={() => setIsOpen(false)}
					onActionUrl={(url) => {
						setIsOpen(false);
						setCheckoutUrl(url);
					}}
```

- Line 40: `CheckoutLinkDialog`

```tsx
url={checkoutUrl} onOpenChange={(open) => !open && setCheckoutUrl(null)}
```

## src/components/customer-portal/widgets/AutoTopUpForm.tsx

190 lines. Query keys:

Response/domain field candidates: `wallet.auto_topup?.enabled`, `wallet.auto_topup?.threshold`, `wallet.auto_topup?.amount`, `wallet.auto_topup?.cooldown?.value`, `wallet.auto_topup.cooldown.value`, `wallet.auto_topup?.cooldown?.unit`, `wallet.id`, `wallet.currency`

- Line 101: `Input`

```tsx
label={t('autoTopUp.thresholdLabel')}
						placeholder={t('autoTopUp.thresholdPlaceholder')}
						description={t('autoTopUp.thresholdHelp')}
						type='number'
						step='0.01'
						min='0'
						value={threshold}
						onChange={setThreshold}
						disabled={isPending}
						inputPrefix={currencySymbol}
```

- Line 114: `Input`

```tsx
label={t('autoTopUp.amountLabel')}
						placeholder={t('autoTopUp.amountPlaceholder')}
						description={t('autoTopUp.amountHelp')}
						type='number'
						step='0.01'
						min='0'
						value={amount}
						onChange={setAmount}
						disabled={isPending}
						inputPrefix={currencySymbol}
```

- Line 138: `Input`

```tsx
label={t('autoTopUp.cooloffValueLabel')}
								placeholder={t('autoTopUp.cooloffPlaceholder')}
								type='number'
								min='1'
								value={cooldownValue}
								onChange={setCooldownValue}
								disabled={isPending}
```

- Line 147: `Select`

```tsx
label={t('autoTopUp.cooloffUnitLabel')}
								value={cooldownUnit}
								onChange={(value) => setCooldownUnit(value as DurationUnit)}
								options={DURATION_UNITS.map((unit) => ({ value: unit, label: t(`autoTopUp.cooloffUnits.${unit}`) }))}
								disabled={isPending}
```

- Line 181: `Button`

```tsx
onClick={() => save()} disabled={!isValid || isPending} isLoading={isPending}
```

## src/components/customer-portal/useChargeableMethod.ts

42 lines. Query keys: `portalPaymentMethodsQueryKey,`

Response/domain field candidates: `data?.providers`

## src/components/customer-portal/widgets/AutoTopUpWidget.tsx

50 lines. Query keys:

Response/domain field candidates: `wallet.emptyTitle`, `wallet.emptyDescription`, `wallet.id`, `wallet.auto_topup`

- Line 44: `AutoTopUpForm`

```tsx
key={formKey} wallet={wallet} hasChargeableMethod={hasChargeableMethod}
```

## src/components/customer-portal/widgets/PaymentMethodsWidget.tsx

284 lines. Query keys: `portalPaymentMethodsQueryKey,`

Response/domain field candidates: `response.action.type`, `response.action.url`, `data?.providers`

- Line 230: `Button`

```tsx
size='sm' onClick={() => addMethod(addProvider)} isLoading={isAdding} prefixIcon={<Plus />}
```

- Line 235: `CheckoutLinkDialog`

```tsx
url={setupUrl} purpose='setup' onOpenChange={(open) => !open && setSetupUrl(null)}
```

- Line 236: `Dialog`

```tsx
isOpen={pendingDelete !== null}
				onOpenChange={(open) => !open && setPendingDelete(null)}
				title={t('paymentMethods.removeTitle')}
				description={t('paymentMethods.removeConfirm')}
```

- Line 242: `Button`

```tsx
variant='outline' onClick={() => setPendingDelete(null)} disabled={isDeleting}
```

- Line 245: `Button`

```tsx
variant='destructive' onClick={() => pendingDelete && deleteMethod(pendingDelete)} isLoading={isDeleting}
```

## src/components/customer-portal/widgets/WalletActions.tsx

55 lines. Query keys:

Response/domain field candidates: `wallet.moreActions`

- Line 41: `Button`

```tsx
variant='outline' size='icon' prefixIcon={<EllipsisVertical />} aria-label={t('wallet.moreActions')}
```

- Line 43: `Dialog`

```tsx
isOpen={isAutoTopUpOpen}
				onOpenChange={setIsAutoTopUpOpen}
				title={t('autoTopUp.title')}
				description={t('autoTopUp.description')}
```

- Line 48: `AutoTopUpForm`

```tsx
wallet={wallet} hasChargeableMethod={hasChargeableMethod} onDone={() => setIsAutoTopUpOpen(false)}
```

## src/components/customer-portal/widgets/AccountSummaryWidget.tsx

134 lines. Query keys: `['portal-invoices-all'],`, `['portal-subscriptions'],`

Response/domain field candidates: `response?.items`, `wallet?.currency`, `wallet?.balance`

- Line 127: `TopUpButton`

```tsx

```

## src/components/customer-portal/TabRenderer.tsx

95 lines. Query keys:

Response/domain field candidates:

- Line 84: `TopUpButton`

```tsx

```

## src/components/customer-portal/SectionContent.tsx

264 lines. Query keys: `['portal-subscriptions'],`, `['portal-usage'],`

Response/domain field candidates:

## src/pages/customer-portal/CustomerPortal.tsx

205 lines. Query keys: `['portal-customer'],`, `['portal-wallets'],`, `portalInvoicesQueryKey,`

Response/domain field candidates:

## src/pages/customer-portal/CustomerPortalWrapper.tsx

102 lines. Query keys:

Response/domain field candidates:

- Line 47: `Button`

```tsx
onClick={onAction}
							className='w-full sm:w-auto min-w-[140px] transition-all duration-200 hover:opacity-90'
							variant='outline'
```

## src/pages/checkout/CheckoutPage.tsx

392 lines. Query keys:

Response/domain field candidates:

- Line 211: `Button`

```tsx
onClick={() => window.location.reload()} variant='outline' className='min-w-[140px]'
```

- Line 336: `Button`

```tsx
onClick={() => window.location.reload()} variant='outline' className='min-w-[140px]'
```

## src/components/organisms/EmptyPage/EmptyPage.tsx

117 lines. Query keys:

Response/domain field candidates:

- Line 54: `AddButton`

```tsx
label={addButtonLabel}
			disabled={addDisabled}
			onClick={() => {
				if (onAddClick && !addDisabled) {
					onAddClick();
				}
			}}
```

- Line 96: `Button`

```tsx
disabled variant={'outline'} className='!p-5 !bg-surface-panel !border-line-muted'
```

- Line 102: `Button`

```tsx
variant={'outline'} onClick={card?.buttonAction} className='!p-5 !bg-surface-panel !border-line-muted'
```

## src/components/organisms/PlanPriceTable/PlanPriceTable.tsx

633 lines. Query keys: `['planChargesSearch', plan.id, searchFilters, searchSorts, page, limit, showExpiredPrices],`

Response/domain field candidates: `row.id`, `price.start_date`, `price.start_date.trim`, `price.end_date`, `price.end_date.trim`, `plan.id`, `row.display_name`, `row.type`, `row.invoice_cadence`, `row.billing_period`, `row.end_date`, `row.end_date.trim`

- Line 551: `Dialog`

```tsx
open={showTerminateModal} onOpenChange={setShowTerminateModal}
```

- Line 565: `UpdatePriceDialog`

```tsx
isOpen={isPriceDialogOpen}
					onOpenChange={setIsPriceDialogOpen}
					price={selectedPriceForEdit}
					planId={plan.id}
					onSuccess={handlePriceUpdateSuccess}
```

- Line 576: `UpdatePriceDetailsDrawer`

```tsx
price={selectedPriceForDetailsEdit}
					open={isDetailsDrawerOpen}
					onOpenChange={setIsDetailsDrawerOpen}
					refetchQueryKeys={['fetchPlan']}
```

- Line 590: `Button`

```tsx
prefixIcon={<Plus />} onClick={() => navigate(`${RouteNames.plan}/${plan.id}/add-charges`)}
```

- Line 596: `Button`

```tsx
disabled prefixIcon={<Plus />}
```

- Line 621: `FlexpriceTable`

```tsx
showEmptyRow columns={chargeColumns} data={tableItems}
```

## src/components/molecules/SubscriptionAddonTable/SubscriptionAddonModal.tsx

437 lines. Query keys: `['addons'],`

Response/domain field candidates: `response.items`, `data.metadata`, `data.line_item_commitments`, `data.addon_id`, `data.override_line_items`, `price.type`, `row.price.display_name`, `row.price.meter?.name`, `row.price.type`, `row.price`, `row.price.id`

- Line 342: `Dialog`

```tsx
isOpen={isOpen}
			showCloseButton={false}
			onOpenChange={onOpenChange}
			title={data ? t('subscriptionAddon.editAddonTitle') : t('subscriptionAddon.addAddonTitle')}
			className='sm:max-w-[900px]'
```

- Line 350: `Select`

```tsx
label={t('subscriptionAddon.labelAddon')}
						placeholder={t('subscriptionAddon.placeholderSelectAddon')}
						options={filteredAddonOptions}
						value={formData.addon_id || ''}
						onChange={handleAddonSelect}
						error={errors.addon_id}
```

- Line 376: `FlexpriceTable`

```tsx
columns={addonChargeColumns} data={selectedAddonPrices.map((p) => ({ price: p }))}
```

- Line 403: `PriceOverrideDialog`

```tsx
isOpen={isOverrideDialogOpen}
					onOpenChange={setIsOverrideDialogOpen}
					price={selectedOverridePrice}
					onPriceOverride={handlePriceOverride}
					onResetOverride={handleResetOverride}
					overriddenPrices={overriddenPrices}
```

- Line 415: `CommitmentConfigDialog`

```tsx
isOpen={isCommitmentDialogOpen}
					onOpenChange={setIsCommitmentDialogOpen}
					price={selectedCommitmentPrice}
					onSave={handleCommitmentSave}
					currentConfig={commitmentMap[selectedCommitmentPrice.id]}
					currentTimeBuckets={commitmentMap[selectedCommitmentPrice.id]?.commitment_time_buckets}
					billingPeriod={billingPeriod}
```

- Line 427: `Button`

```tsx
variant='outline' onClick={handleCancel}
```

- Line 430: `Button`

```tsx
onClick={handleSave}
```

## src/components/molecules/SubscriptionAddonTable/SubscriptionAddonTable.tsx

212 lines. Query keys: `['addons'],`

Response/domain field candidates: `data.map`, `response.items`, `row.addon_id`, `row.override_line_items`, `row.start_date`, `row.end_date`, `row.internal_id`

- Line 160: `ActionButton`

```tsx
id={row.addon_id}
							copyId={{ entityType: 'Addon' }}
							deleteMutationFn={() => handleDelete(row.internal_id)}
							refetchQueryKey='addons'
							entityName={addonDetails?.name || row.addon_id}
							edit={{
								enabled: !disabled,
								onClick: () => handleEdit(row),
							}}
							archive={{
								enabled: !disabled,
								text: t('subscriptionAddon.remove'),
							}}
```

- Line 200: `FormHeader`

```tsx
className='mb-0' title={t('labels.addons')} variant='sub-header'
```

- Line 201: `AddButton`

```tsx
onClick={handleOpenCreate} disabled={disabled}
```

- Line 204: `FlexpriceTable`

```tsx
data={extendedData} columns={columns} showEmptyRow
```

## src/components/organisms/Subscription/PhaseList.tsx

481 lines. Query keys:

Response/domain field candidates: `price?.type`

- Line 363: `PhaseForm`

```tsx
key={`edit-${index}`}
							initialData={phaseFormData}
							prices={prices}
							billingPeriod={billingPeriod}
							currency={currency}
							disabled={disabled}
							onSave={handleSavePhase}
							onCancel={handleCancelEdit}
							isEditing={true}
							minStartDate={previousPhaseStartDate}
							maxEndDate={nextPhaseEndDate}
```

- Line 444: `PhaseForm`

```tsx
initialData={{
								start_date: newPhaseStartDate,
								end_date: null,
								coupons: [],
								line_item_coupons: {},
								priceOverrides: {},
								metadata: {},
							}}
							prices={prices}
							billingPeriod={billingPeriod}
							currency={currency}
							disabled={disabled}
							onSave={handleSavePhase}
							onCancel={handleCancelEdit}
							isEditing={false}
							minStartDate={previousPhaseStartDate}
							maxEndDate={subscriptionEndDate}
```

- Line 468: `Button`

```tsx
onClick={handleAddPhase}
					variant='outline'
					className='w-full !mt-4'
					disabled={disabled || editingIndex !== null || isCreating}
```

## src/components/organisms/Subscription/AdditionalPlanPricesSection.tsx

120 lines. Query keys:

Response/domain field candidates:

- Line 68: `Checkbox`

```tsx
id={`additional-cadence-${group.key}`}
							checked={isChecked}
							disabled={disabled}
							onCheckedChange={(next) => onToggle(group.key, !!next)}
```

- Line 100: `FormHeader`

```tsx
variant='form-component-title'
				title={t('organisms.additionalPlanPrices.title')}
				subtitle={t('organisms.additionalPlanPrices.explainer')}
				className='mb-3'
```

- Line 108: `FlexpriceTable`

```tsx
columns={columns} data={rows}
```

## src/components/organisms/Subscription/LineItemGroupingSection.tsx

64 lines. Query keys:

Response/domain field candidates:

- Line 49: `Switch`

```tsx
id={TOGGLE_ID} className='mt-0.5 shrink-0' checked={checked} onCheckedChange={onChange} disabled={disabled}
```

- Line 57: `FormHeader`

```tsx
variant='form-component-title' title={t('organisms.lineItemGrouping.title')} className='mb-3'
```

## src/components/organisms/Subscription/SubscriptionForm.tsx

1282 lines. Query keys: `['planIdsWithCharges', planIds],`, `['creditGrants', state.selectedPlan],`, `['planEntitlements', state.selectedPlan],`, `['addonEntitlements', addonIds],`

Response/domain field candidates: `item.price`, `response.items.forEach`, `price.entity_id`, `response.items.length`, `response.pagination?.total`, `plan.id`, `plan.name`, `price.billing_period.toLowerCase`, `price.currency`, `item.tempId`, `data.find`, `data.some`, `data.map`, `data.filter`, `customer?.id`, `customer.id`

- Line 705: `FormHeader`

```tsx
title={t('organisms.subscriptionForm.subscriptionDetails')} variant='sub-header'
```

- Line 709: `CustomerSearchSelect`

```tsx
value={customerPicker.value}
						onChange={customerPicker.onChange}
						includeNoneOption={false}
						display={{
							label: t('subscriptionCreate.selectCustomerLabel'),
							placeholder: t('subscriptionCreate.selectCustomerPlaceholder'),
						}}
```

- Line 725: `Select`

```tsx
value={state.selectedPlan}
						options={plansWithCharges}
						onChange={handlePlanChange}
						label={t('organisms.subscriptionForm.planRequired')}
						disabled={isDisabled || isLoadingPlanDetails || isCustomerSelectionPending}
						placeholder={t('organisms.subscriptionForm.selectPlan')}
						error={
							plansError
								? t('organisms.subscriptionForm.loadPlansError')
								: isPlanDetailsError
									? t('organisms.subscriptionForm.loadPlanDetailsError')
									: undefined
						}
```

- Line 748: `Select`

```tsx
key={availableBillingPeriods.map((opt) => opt.value).join(',')}
					value={state.billingPeriod}
					options={availableBillingPeriods}
					onChange={handleBillingPeriodChange}
					label={t('organisms.subscriptionForm.billingPeriodRequired')}
					disabled={isDisabled || isLoadingPlanDetails}
					placeholder={t('organisms.subscriptionForm.selectBillingPeriod')}
```

- Line 761: `Select`

```tsx
key={availableCurrencies.map((opt) => opt.value).join(',')}
					value={state.currency}
					options={availableCurrencies}
					onChange={(value) => setState((prev) => ({ ...prev, currency: value }))}
					label={t('organisms.subscriptionForm.currencyRequired')}
					disabled={isDisabled || isLoadingPlanDetails}
					placeholder={t('organisms.subscriptionForm.selectCurrency')}
```

- Line 774: `BillingCycleSelector`

```tsx
value={state.billingCycle}
					onChange={(value) =>
						setState((prev) => ({
							...prev,
							billingCycle: value,
							billingAnchor: value === BILLING_CYCLE.CALENDAR ? undefined : prev.billingAnchor,
						}))
					}
					disabled={isDisabled || isLoadingPlanDetails}
```

- Line 789: `AddSubscriptionChargeDialog`

```tsx
isOpen={isAddChargeDialogOpen}
					onOpenChange={(open) => {
						setAddChargeDialogOpen(open);
						if (!open) setEditingAddedChargeTempId(null);
					}}
					onSave={(item) => {
						if (editingAddedChargeTempId) {
							setState((prev) => ({
								...prev,
								addedSubscriptionLineItems: (prev.addedSubscriptionLineItems ?? []).map((i) => (i.tempId === item.tempId ? item : i)),
							}));
						} else {
							setState((prev) => ({
								...prev,
								addedSubscriptionLineItems: [...(prev.addedSubscriptionLineItems ?? []), item],
							}));
						}
						setEditingAddedChargeTempId(null);
						setAddChargeDialogOpen(false);
					}}
					defaultCurrency={state.currency}
					defaultBillingPeriod={state.billingPeriod}
					initialItem={
						editingAddedChargeTempId != null
							? (state.addedSubscriptionLineItems?.find((i) => i.tempId === editingAddedChargeTempId) ?? null)
							: null
					}
```

- Line 865: `SubscriptionPriceTable`

```tsx
data={currentPrices}
							billingPeriod={state.billingPeriod}
							billingPeriodCount={1}
							currency={state.currency}
							onPriceOverride={overridePrice}
							onResetOverride={resetOverride}
							overriddenPrices={overriddenPrices}
							lineItemCoupons={state.lineItemCoupons}
							onLineItemCouponsChange={handleLineItemCouponsChange}
							onCommitmentChange={handleCommitmentChange}
							disabled={isDisabled}
							subscriptionLevelCoupon={state.linkedCoupon}
							addedLineItems={state.addedSubscriptionLineItems}
							onAddCharge={handleAddCharge}
							onRemoveAddedCharge={handleRemoveAddedCharge}
							onEditAddedCharge={handleEditAddedCharge}
```

- Line 915: `SubscriptionDiscountTable`

```tsx
coupon={state.linkedCoupon}
							onChange={(coupon) => setState((prev) => ({ ...prev, linkedCoupon: coupon }))}
							disabled={isDisabled}
							currency={state.currency}
							allLineItemCoupons={state.lineItemCoupons}
```

- Line 989: `DecimalUsageInput`

```tsx
label={t('organisms.subscriptionForm.commitmentAmount')}
							value={state.commitmentAmount}
							onChange={(value) => setState((prev) => ({ ...prev, commitmentAmount: value }))}
							placeholder={t('organisms.subscriptionForm.commitmentAmountPlaceholder')}
							disabled={isDisabled}
							precision={2}
							min={0}
```

- Line 998: `Select`

```tsx
label={t('organisms.subscriptionForm.commitmentPeriod')}
							value={state.commitmentDuration}
							options={[
								{ label: t('organisms.subscriptionForm.commitmentDaily'), value: 'DAILY' },
								{ label: t('organisms.subscriptionForm.commitmentMonthly'), value: 'MONTHLY' },
								{ label: t('organisms.subscriptionForm.commitmentQuarterly'), value: 'QUARTERLY' },
								{ label: t('organisms.subscriptionForm.commitmentHalfYearly'), value: 'HALF_YEARLY' },
								{ label: t('organisms.subscriptionForm.commitmentAnnual'), value: 'ANNUAL' },
							]}
							onChange={(value) => setState((prev) => ({ ...prev, commitmentDuration: value }))}
							placeholder={t('organisms.subscriptionForm.sameAsBillingPlaceholder')}
							disabled={isDisabled}
```

- Line 1015: `DecimalUsageInput`

```tsx
label={t('organisms.subscriptionForm.overageFactor')}
							value={state.overageFactor}
							onChange={(value) => setState((prev) => ({ ...prev, overageFactor: value }))}
							placeholder={t('organisms.subscriptionForm.overageFactorPlaceholder')}
							disabled={isDisabled}
							precision={2}
							min={0}
```

- Line 1026: `Switch`

```tsx
checked={state.enable_true_up}
								onCheckedChange={(checked) => setState((prev) => ({ ...prev, enable_true_up: checked }))}
								disabled={isDisabled}
```

- Line 1039: `SubscriptionCreditGrantTable`

```tsx
getEmptyCreditGrant={() => getEmptyCreditGrant()}
						data={relevantCreditGrants}
						onChange={(data: InternalCreditGrantRequest[]) => {
							// Check if any plan-level grants were edited or deleted by inspecting the data
							const hasEditedOrDeletedPlanGrants = Array.from(planLevelCreditGrantIds).some((planGrantId) => {
								const grantInData = data.find((g) => g.id === planGrantId);
								// Deleted: not in data anymore
								if (!grantInData) return true;
								// Edited: scope changed from PLAN to SUBSCRIPTION
								if (grantInData.scope === CREDIT_GRANT_SCOPE.SUBSCRIPTION) return true;
								return false;
							});

							// Check if there are any new subscription-level grants (not from plan)
							const hasNewSubscriptionGrants = data.some(
								(grant) => !planLevelCreditGrantIds.has(grant.id) && grant.scope === CREDIT_GRANT_SCOPE.SUBSCRIPTION,
							);

							// If plan grants were modified OR new subscription grants were added, convert all to subscription level
							const shouldConvertAll = hasEditedOrDeletedPlanGrants || (hasNewSubscriptionGrants && planLevelCreditGrantIds.size > 0);

							if (shouldConvertAll) {
								// If any plan-level grant was edited/deleted OR new subscription grant added,
								// convert ALL remaining plan grants to subscription scope
								const convertedGrants = data.map((grant) => {
									// If it's an unedited plan-level grant (still has PLAN scope), convert it now
									if (planLevelCreditGrantIds.has(grant.id) && grant.scope !== CREDIT_GRANT_SCOPE.SUBSCRIPTION) {
										return {
											...grant,
											scope: CREDIT_GRANT_SCOPE.SUBSCRIPTION,
											subscription_id: uniqueId('sub_'),
											plan_id: undefined,
										};
									}
									// Already converted or subscription-level grant, keep as is
									return grant;
								});

								// Store all grants (all are now subscription-level) and mark as modified
								setState((prev) => ({
									...prev,
									creditGrants: convertedGrants,
									hasModifiedPlanCreditGrants: true,
								}));
							} else {
								// No plan grants edited/deleted and no new subscription grants: only store subscription-level grants
								// Plan-level grants will be sent automatically by the backend
								const userGrants = data.filter((grant) => !planLevelCreditGrantIds.has(grant.id));
								setState((prev) => ({
									...prev,
									creditGrants: userGrants,
									hasModifiedPlanCreditGrants: false,
								}));
							}
						}}
						disabled={isDisabled}
						planLevelCreditGrantIds={planLevelCreditGrantIds}
						onMarkAsEdited={handleMarkGrantAsEdited}
						subscriptionId={uniqueId('sub_')}
```

- Line 1106: `SubscriptionTaxAssociationTable`

```tsx
data={state.tax_rate_overrides || []}
						onChange={(data) => setState((prev) => ({ ...prev, tax_rate_overrides: data }))}
						disabled={isDisabled}
```

- Line 1117: `SubscriptionAddonTable`

```tsx
getEmptyAddon={getEmptyAddon}
						data={state.addons || []}
						onChange={(data) => {
							setState((prev) => ({ ...prev, addons: data }));
						}}
						disabled={isDisabled}
						billingPeriod={state.billingPeriod}
						billingPeriodCount={1}
						currency={state.currency}
```

- Line 1135: `FormHeader`

```tsx
className='mb-0' title={t('organisms.subscriptionForm.entitlements')} variant='sub-header'
```

- Line 1136: `EntitlementOverridesTable`

```tsx
entitlements={allEntitlements}
							overrides={state.entitlementOverrides}
							onOverrideChange={handleEntitlementOverride}
							onOverrideReset={handleEntitlementOverrideReset}
```

- Line 1149: `FormHeader`

```tsx
title={t('organisms.subscriptionForm.billingConfiguration')} variant='sub-header'
```

- Line 1151: `Select`

```tsx
value={state.paymentTerms ?? PAYMENT_TERMS_NONE}
							options={paymentTermsOptions}
							onChange={(value) => setState((prev) => ({ ...prev, paymentTerms: value === PAYMENT_TERMS_NONE ? undefined : value }))}
							label={t('organisms.subscriptionForm.paymentTerms')}
							disabled={isDisabled || isLoadingPlanDetails}
							placeholder={t('organisms.subscriptionForm.selectPaymentTerms')}
```

- Line 1159: `CustomerSearchSelect`

```tsx
selfCustomer={subscriberCustomer}
							value={state.invoicingCustomer}
							excludeId={state.customerId}
							onChange={(customer) => {
								setState((prev) => ({
									...prev,
									invoicingCustomer: customer?.id && customer.id !== prev.customerId ? customer : undefined,
								}));
							}}
							display={{
								label: t('organisms.subscriptionForm.billingCustomerLabel'),
								placeholder: t('organisms.subscriptionForm.billingCustomerPlaceholder'),
							}}
							searchPlaceholder={t('organisms.subscriptionForm.searchBillingCustomer')}
							disabled={isDisabled}
```

- Line 1179: `InheritedCustomersTable`

```tsx
data={state.inheritanceCustomers}
							onChange={(customers) => setState((prev) => ({ ...prev, inheritanceCustomers: customers }))}
							disabled={isDisabled}
							subscriberCustomerId={state.customerId}
```

- Line 1204: `Input`

```tsx
id='subscription-billing-trial-days'
										aria-label={t('organisms.subscriptionForm.trialDaysAria')}
										variant='number'
										value={state.subscriptionTrialPeriodDays}
										onChange={(value) => setState((prev) => ({ ...prev, subscriptionTrialPeriodDays: value }))}
										suffix='days'
										placeholder={t('organisms.subscriptionForm.trialDaysPlaceholder')}
										disabled={isDisabled || isLoadingPlanDetails}
```

- Line 1235: `Switch`

```tsx
id='subscription-billing-proration'
										className='shrink-0'
										checked={state.prorationCreateLineItems}
										onCheckedChange={(checked) => setState((prev) => ({ ...prev, prorationCreateLineItems: checked }))}
										disabled={isDisabled}
```

- Line 1260: `DecimalUsageInput`

```tsx
id='subscription-billing-auto-invoice-threshold-amount'
										ariaLabel={t('organisms.subscriptionForm.autoInvoiceAmountAria')}
										suffix={state.currency ? getCurrencySymbol(state.currency) : undefined}
										value={state.autoInvoiceThreshold}
										onChange={(value) => setState((prev) => ({ ...prev, autoInvoiceThreshold: value }))}
										placeholder={t('organisms.subscriptionForm.autoInvoicePlaceholder')}
										disabled={isDisabled || isLoadingPlanDetails || hasFixedSubscriptionChargePrice}
										precision={2}
										min={0}
```

## src/components/organisms/Subscription/UsageTable.tsx

45 lines. Query keys:

Response/domain field candidates: `data?.charges`

- Line 36: `FormHeader`

```tsx
title={t('organisms.usageTable.currentMeterUsage')} variant='sub-header'
```

- Line 38: `FlexpriceTable`

```tsx
columns={columns} data={mappedData}
```

## src/components/organisms/Subscription/SubscriptionWithOverrides.tsx

127 lines. Query keys:

Response/domain field candidates: `price.meter?.name`, `price.description`, `price.currency`, `price.amount`

- Line 63: `Button`

```tsx
variant='outline' size='sm' onClick={resetAllOverrides}
```

- Line 71: `SubscriptionPriceTable`

```tsx
data={prices}
				onPriceOverride={overridePrice}
				onResetOverride={resetOverride}
				overriddenPrices={overriddenPrices}
```

- Line 115: `Button`

```tsx
variant='outline' onClick={resetAllOverrides} disabled={!hasAnyOverrides()}
```

- Line 118: `Button`

```tsx
onClick={handleCreateSubscription} disabled={isSubmitting} className='flex-1'
```

## src/components/organisms/Subscription/PriceOverrideSummary.tsx

122 lines. Query keys:

Response/domain field candidates: `price.price_unit_type`, `price.price_unit_config?.price_unit`, `price.price_unit`, `price.currency`, `price.price_unit_amount`, `price.price_unit_config?.amount`, `price.amount`, `price.meter?.name`, `price.description`

## src/components/organisms/QueryableDataArea/EmptyState.tsx

57 lines. Query keys:

Response/domain field candidates:

- Line 39: `Button`

```tsx
disabled variant='outline' className='!p-5 !bg-surface-panel !border-line-muted'
```

- Line 45: `Button`

```tsx
variant='outline' onClick={config.buttonAction} className='!p-5 !bg-surface-panel !border-line-muted'
```

## src/components/organisms/QueryableDataArea/TableArea.tsx

33 lines. Query keys:

Response/domain field candidates: `data?.items`, `data?.pagination.total`

- Line 14: `FlexpriceTable`

```tsx
columns={tableConfig.columns}
				data={data?.items || []}
				onRowClick={tableConfig.onRowClick}
				showEmptyRow={tableConfig.showEmptyRow}
				hideBottomBorder={tableConfig.hideBottomBorder}
				variant={tableConfig.variant}
```

## src/components/organisms/QueryableDataArea/QueryableDataArea.tsx

493 lines. Query keys: `string;`, `'fetchCustomers',`, `[dataConfig.queryKey, queryKey],`, `[dataConfig.queryKey, 'probe', queryKey],`

Response/domain field candidates: `customer.id`, `data.items.length`

- Line 232: `TableArea`

```tsx
data={data} tableConfig={tableConfig} paginationConfig={paginationConfig}
```

## src/components/organisms/AppPrefetcher.tsx

57 lines. Query keys: `key,`

Response/domain field candidates:

## src/components/organisms/WebhooksPortal/WebhooksPortal.tsx

57 lines. Query keys:

Response/domain field candidates:

- Line 19: `EndpointsTable`

```tsx
onViewEventCatalog={() => setActiveTab(EVENT_CATALOG_TAB)}
```

- Line 22: `MessageLogsTable`

```tsx

```

## src/components/organisms/ErrorPage/ErrorPage.tsx

34 lines. Query keys:

Response/domain field candidates:

- Line 24: `Button`

```tsx

```

## src/components/customer-portal/EventsTable.tsx

63 lines. Query keys:

Response/domain field candidates:

- Line 56: `FlexpriceTable`

```tsx
showEmptyRow columns={columns} data={data} onRowClick={handleRowClick}
```

- Line 57: `EventPropertiesDrawer`

```tsx
isOpen={isDrawerOpen} onOpenChange={setIsDrawerOpen} event={selectedEvent}
```

## src/components/molecules/ConfigKeyValueEditor/ConfigKeyValueEditor.tsx

119 lines. Query keys:

Response/domain field candidates:

- Line 65: `Button`

```tsx
type='button' variant='outline' size='sm' onClick={addRow} className='h-7 gap-1 text-xs'
```

- Line 87: `Input`

```tsx
value={pair.key}
									onChange={(v) => updatePairs(pairs.map((p, i) => (i === index ? { ...p, key: v } : p)))}
									placeholder={t('configKeyValueEditor.keyPlaceholder')}
									className='h-8 text-sm font-mono border-0 shadow-none focus-visible:ring-0 pl-1 pr-0'
```

- Line 96: `Input`

```tsx
value={pair.value}
									onChange={(v) => updatePairs(pairs.map((p, i) => (i === index ? { ...p, value: v } : p)))}
									placeholder={t('configKeyValueEditor.valuePlaceholder')}
									className='h-8 text-sm font-mono border-0 shadow-none focus-visible:ring-0 pl-1 pr-0'
```

## src/components/molecules/CouponAssociation/CouponAssociation.tsx

102 lines. Query keys: `['availableCoupons'],`

Response/domain field candidates: `response.items`, `data.some`, `data.filter`, `row.name`, `row.type`, `row.cadence`, `row.currency.toUpperCase`, `row.id`

- Line 66: `Button`

```tsx
variant='ghost'
					size='sm'
					className='h-8 w-8 p-0 hover:bg-danger-muted hover:text-danger'
					onClick={() => handleDelete(row.id)}
					disabled={disabled}
					aria-label={`Remove coupon ${row.name}`}
```

- Line 82: `FormHeader`

```tsx
className='mb-0' title={t('labels.linkedCoupons')} variant='sub-header'
```

- Line 83: `AddButton`

```tsx
onClick={() => setIsOpen(true)} disabled={disabled}
```

- Line 87: `FlexpriceTable`

```tsx
data={data} columns={columns} showEmptyRow
```

## src/components/molecules/Customer/CustomerOverviewCard.tsx

121 lines. Query keys: `['fetchCustomerDetails', customerId],`

Response/domain field candidates: `customer?.name`, `customer?.email`, `customer?.external_id`, `customer?.address_line1`, `customer?.address_country`, `customer.address_country`, `customer?.address_state`, `customer?.address_city`, `customer?.address_postal_code`

- Line 103: `FormHeader`

```tsx
title={t('overview.sectionTitle')} variant='sub-header'
```

- Line 104: `CreateCustomerDrawer`

```tsx
trigger={
									<Button className='flex gap-2 mx-0 px-2' variant={'outline'}>
										<Pencil /> {t('common:actions.edit')}
									</Button>
								}
								data={customer}
```

- Line 106: `Button`

```tsx
className='flex gap-2 mx-0 px-2' variant={'outline'}
```

## src/components/molecules/ExportRunsList/ExportRunsList.tsx

153 lines. Query keys: `['export-runs', taskId, limit],`

Response/domain field candidates:

- Line 39: `FormHeader`

```tsx
variant='form-component-title' title={t('exportRuns.recentTitle')}
```

## src/components/molecules/PaddleCheckout/PaddleCheckoutButton.tsx

44 lines. Query keys:

Response/domain field candidates:

- Line 39: `Button`

```tsx
onClick={handleClick} className={className} variant={variant}
```

## src/components/molecules/Webhooks/EndpointTestingTab.tsx

68 lines. Query keys:

Response/domain field candidates:

- Line 49: `SearchableSelect`

```tsx
options={options}
					value={selectedEventType}
					onChange={setSelectedEventType}
					placeholder={t('webhooks.endpoints.testing.selectEventType')}
					className='max-w-sm'
```

- Line 59: `Button`

```tsx
disabled={!selectedEventType || isSending} isLoading={isSending} onClick={handleSendExample}
```

## src/components/ui/alert-dialog.tsx

97 lines. Query keys:

Response/domain field candidates:

- Line 17: `AlertDialogPrimitive.Overlay`

```tsx
className={cn(
			'fixed inset-0 z-50 bg-surface-scrim/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
			className,
		)}
		{...props}
		ref={ref}
```

- Line 32: `AlertDialogPortal`

```tsx

```

- Line 33: `AlertDialogOverlay`

```tsx

```

- Line 34: `AlertDialogPrimitive.Content`

```tsx
ref={ref}
			className={cn(
				'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-[6px]',
				className,
			)}
			{...props}
```

- Line 59: `AlertDialogPrimitive.Title`

```tsx
ref={ref} className={cn('text-lg font-semibold', className)} {...props}
```

- Line 66: `AlertDialogPrimitive.Description`

```tsx
ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props}
```

- Line 73: `AlertDialogPrimitive.Action`

```tsx
ref={ref} className={cn(buttonVariants(), className)} {...props}
```

- Line 80: `AlertDialogPrimitive.Cancel`

```tsx
ref={ref} className={cn(buttonVariants({ variant: 'outline' }), 'mt-2 sm:mt-0', className)} {...props}
```
