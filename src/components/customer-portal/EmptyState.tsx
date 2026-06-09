interface EmptyStateProps {
	title: string;
	description?: string;
	icon?: React.ReactNode;
}

const EmptyState = ({ title, description, icon }: EmptyStateProps) => {
	return (
		<div className='flex flex-col items-center justify-center py-16 px-4'>
			{icon && <div className='mb-3 text-zinc-300'>{icon}</div>}
			<p className='text-sm font-medium text-muted-foreground mb-1'>{title}</p>
			{description && <p className='text-xs text-muted-foreground text-center max-w-sm mt-1'>{description}</p>}
		</div>
	);
};

export default EmptyState;
