import { cn } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import EnvironmentApi from '@/api/EnvironmentApi';
import { Blocks, Rocket, Server, ChevronsUpDown } from 'lucide-react';
import { useGlobalLoading } from '@/core/services/tanstack/ReactQueryProvider';
import useUser from '@/hooks/useUser';
import { Select, SelectContent } from '@/components/ui/select';
import * as SelectPrimitive from '@radix-ui/react-select';
import { SelectOption } from '@/components/atoms/Select/Select';
import { useSidebar } from '@/components/ui/sidebar';
import { useNavigate } from 'react-router-dom';
import { RouteNames } from '@/core/routes/Routes';

interface Props {
	disabled?: boolean;
	className?: string;
	noOptionsText?: string;
}
const SelectTrigger = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Trigger>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
	<SelectPrimitive.Trigger ref={ref} className={cn('w-full', className)} {...props}>
		{children}
	</SelectPrimitive.Trigger>
));

const SelectItem = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
	<SelectPrimitive.Item
		ref={ref}
		className={cn(
			'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
			className,
		)}
		{...props}>
		<SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
	</SelectPrimitive.Item>
));

const EnvironmentSelector: React.FC<Props> = ({ disabled = false, className }) => {
	const { loading, user } = useUser();
	const { open: sidebarOpen } = useSidebar();
	const navigate = useNavigate();
	const { setLoading } = useGlobalLoading();

	const {
		data: environments = [],
		isLoading,
		error,
	} = useQuery({
		queryKey: ['environments'],
		queryFn: () => EnvironmentApi.getLocalEnvironments(),
		// Handle potential API errors
		staleTime: 5 * 60 * 1000, // 5 minutes
	});

	const [isOpen, setIsOpen] = useState(false);
	// Initialize with null to avoid potential race conditions
	const [activeEnvironment, setActiveEnvironment] = useState<(typeof environments)[0] | null>(null);

	useEffect(() => {
		if (environments && environments.length > 0) {
			setActiveEnvironment(environments.find((env) => env.isActive) || environments[0]);
		}
	}, [environments]);

	if (isLoading || loading)
		return (
			<div>
				<Skeleton className='h-10 w-full' />
			</div>
		);

	// Handle the case where there are no environments
	if (environments.length === 0) {
		return <div className='p-2 text-sm text-muted-foreground'>No environments available</div>;
	}

	// Handle errors
	if (error) {
		return <div className='p-2 text-sm text-red-500'>Error loading environments</div>;
	}

	const getEnvironmentIcon = (type: string) => {
		switch (type.toUpperCase()) {
			case 'PRODUCTION':
				return <Rocket className='h-4 w-4' />;
			case 'SANDBOX':
				return <Server className='h-4 w-4' />;
			default:
				return <Blocks className='h-4 w-4' />;
		}
	};

	const options: SelectOption[] =
		environments?.map((env) => ({
			value: env.id,
			label: env.name,
			prefixIcon: getEnvironmentIcon(env.type),
			onSelect: () => handleChange(env.id),
			// description: env.type === 'production' ? 'Live Environment' : 'Testing Environment',
		})) || [];

	const handleChange = async (newValue: string) => {
		setLoading(true); // Start loading state
		EnvironmentApi.setActiveEnvironment(newValue);
		setActiveEnvironment(environments?.find((env) => env.id === newValue) || environments?.[0]);
		// await refetchQueries(); // Refetch all queries
		setLoading(false); // End loading state
		navigate(RouteNames.home);
	};

	// If activeEnvironment is null, use the first environment as a fallback
	const currentEnvironment = activeEnvironment || environments[0];

	return (
		<div className={cn('mt-1 w-full', className)}>
			<Select open={isOpen} onOpenChange={setIsOpen} value={currentEnvironment?.id} onValueChange={handleChange} disabled={disabled}>
				<SelectTrigger>
					<div
						onClick={() => setIsOpen(!isOpen)}
						className={`w-full mt-2 flex items-center justify-between h-6 rounded-md gap-2 bg-contain`}>
						<div className='flex items-center text-start gap-2'>
							<span className='size-9 bg-black text-white flex justify-center items-center bg-contain rounded-md'>
								{user?.tenant?.name
									?.split(' ')
									.map((n) => n[0])
									.join('')
									.slice(0, 2) || 'UN'}
							</span>
							<div className={cn('text-start', sidebarOpen ? '' : 'hidden')}>
								<p className='font-semibold text-sm'>{user?.tenant?.name || 'Unknown'}</p>
								<p className='text-xs text-muted-foreground'>{currentEnvironment?.name || 'No environment'}</p>
							</div>
						</div>
						<button type='button' className={cn(sidebarOpen ? '' : 'hidden')}>
							<ChevronsUpDown className='h-4 w-4 opacity-50' />
						</button>
					</div>
				</SelectTrigger>
				<SelectContent className='w-full mt-2'>
					{options.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							<div className='flex items-center gap-2 text-muted-foreground'>
								{option.prefixIcon}
								{option.label}
							</div>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
};

export default EnvironmentSelector;
