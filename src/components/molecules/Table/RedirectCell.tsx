import { FC, HTMLAttributeAnchorTarget, ReactNode } from 'react';
import { Link } from 'react-router';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
	redirectUrl: string;
	children: ReactNode;
	allowRedirect?: boolean;
	target?: HTMLAttributeAnchorTarget;
	className?: string;
}

const RedirectCell: FC<Props> = ({ redirectUrl, children, allowRedirect = true, target = '_self', className }) => {
	if (!allowRedirect) {
		return <div className='min-w-0 truncate'>{children}</div>;
	}

	return (
		<div className={cn('min-w-0 max-w-full', className)}>
			<Link
				target={target}
				to={redirectUrl}
				aria-hidden='true'
				className='flex min-w-0 max-w-full items-center gap-2 underline decoration-dashed decoration-[1px] decoration-content-muted/50 underline-offset-4 group'>
				<span className='min-w-0 truncate'>{children}</span>
				<ExternalLink className='size-4 shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-40' />
			</Link>
		</div>
	);
};

export default RedirectCell;
