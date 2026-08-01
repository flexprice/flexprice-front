import { FC, HTMLAttributeAnchorTarget, ReactNode } from 'react';
import { Link } from 'react-router';
import { ExternalLink } from 'lucide-react';

interface Props {
	redirectUrl: string;
	children: ReactNode;
	allowRedirect?: boolean;
	target?: HTMLAttributeAnchorTarget;
	className?: string;
}

const RedirectCell: FC<Props> = ({ redirectUrl, children, allowRedirect = true, target = '_self', className }) => {
	if (!allowRedirect) {
		return <div>{children}</div>;
	}

	return (
		<div className={className}>
			<Link
				target={target}
				to={redirectUrl}
				aria-hidden='true'
				className='flex items-center gap-2 max-w-fit group underline decoration-dashed decoration-[1px] decoration-content-muted/50 underline-offset-4'>
				{children}
				<ExternalLink className='w-4 h-4 opacity-0 group-hover:opacity-40 transition-opacity duration-200' />
			</Link>
		</div>
	);
};

export default RedirectCell;
