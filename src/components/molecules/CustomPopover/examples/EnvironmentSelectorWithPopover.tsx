import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import EnvironmentApi from '@/api/EnvironmentApi';
import { Blocks, Rocket, Server, ChevronsUpDown } from 'lucide-react';
import { queryClient } from '@/core/services/tanstack/ReactQueryProvider';
import useUser from '@/hooks/useUser';
import { Skeleton } from '@/components/ui/skeleton';
import CustomPopover from '../CustomPopover';

// Example of refactoring the EnvironmentSelector to use the CustomPopover component
const EnvironmentSelectorWithPopover: React.FC<{ className?: string }> = ({ className }) => {
	const { loading, user } = useUser();

	const {
		data: environments = [],
		isLoading,
		error,
	} = useQuery({
		queryKey: ['environments'],
		queryFn: () => EnvironmentApi.getLocalEnvironments(),
		retry: 2,
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
		switch (type) {
			case 'PRODUCTION':
				return <Rocket className='h-4 w-4' />;
			case 'SANDBOX':
				return <Server className='h-4 w-4' />;
			default:
				return <Blocks className='h-4 w-4' />;
		}
	};

	const handleChange = (environmentId: string) => {
		EnvironmentApi.setActiveEnvironment(environmentId);
		setActiveEnvironment(environments?.find((env) => env.id === environmentId) || environments[0]);
		// Only invalidate relevant queries instead of all queries
		queryClient.invalidateQueries({ queryKey: ['environments'] });
		queryClient.invalidateQueries({ queryKey: ['user'] });
		setIsOpen(false);
	};

	// If activeEnvironment is null, use the first environment as a fallback
	const currentEnvironment = activeEnvironment || environments[0];

	// Create the trigger button for the popover
	const trigger = (
		<div className='w-full mt-2 flex items-center justify-between h-6 rounded-md gap-2 bg-contain cursor-pointer'>
			<div className='flex items-center text-start gap-2'>
				<span className='size-9 bg-black text-white flex justify-center items-center bg-contain rounded-md'>
					{user?.tenant?.name
						?.split(' ')
						.map((n) => n[0])
						.join('')
						.slice(0, 2) || 'UN'}
				</span>
				<div className='text-start'>
					<p className='font-semibold text-sm'>{user?.tenant?.name || 'Unknown'}</p>
					<p className='text-xs text-muted-foreground'>{currentEnvironment?.name || 'No environment'}</p>
				</div>
			</div>
			<button type='button'>
				<ChevronsUpDown className='h-4 w-4 opacity-50' />
			</button>
		</div>
	);

	return (
		<div className={cn('mt-1 w-full', className)}>
			<CustomPopover trigger={trigger} open={isOpen} onOpenChange={setIsOpen} contentClassName='w-full mt-2 p-0'>
				<div className='py-1'>
					{environments.map((env) => (
						<button
							key={env.id}
							className='w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-start'
							onClick={() => handleChange(env.id)}>
							{getEnvironmentIcon(env.type)}
							<span>{env.name}</span>
						</button>
					))}
				</div>
			</CustomPopover>
		</div>
	);
};

export default EnvironmentSelectorWithPopover;
