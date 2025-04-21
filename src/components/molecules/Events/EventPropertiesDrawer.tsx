import { FC } from 'react';
import { Sheet } from '@/components/atoms';
import { Event } from '@/models/Event';
import { Highlight, themes } from 'prism-react-renderer';
import { Copy } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	event: Event | null;
}

const EventPropertiesDrawer: FC<Props> = ({ isOpen, onOpenChange, event }) => {
	const handleCopyCode = () => {
		if (!event) return;
		navigator.clipboard.writeText(JSON.stringify(event, null, 2));
		toast.success('Properties copied to clipboard!');
	};

	if (!event) return null;

	return (
		<Sheet isOpen={isOpen} onOpenChange={onOpenChange} title='Event Details' size='lg'>
			<div className='flex flex-col h-full'>
				<div className='my-6 px-1 pb-8'>
					{/* <div className='mb-4'>
						<h3 className='text-lg font-normal text-foreground'>Event Details</h3>
						<p className='text-sm text-gray-400'>Properties sent with this event</p>
					</div> */}
					<div className='rounded-lg overflow-hidden border border-gray-200'>
						<div className='relative'>
							<Highlight theme={themes.nightOwl} code={JSON.stringify(event, null, 2)} language='json'>
								{({ className, style, tokens, getLineProps, getTokenProps }) => (
									<pre className={`${className} p-4 overflow-x-auto`} style={style}>
										{tokens.map((line, i) => (
											<div key={i} {...getLineProps({ line })}>
												{line.map((token, key) => (
													<span key={key} {...getTokenProps({ token })} className='text-sm font-normal font-fira-code' />
												))}
											</div>
										))}
									</pre>
								)}
							</Highlight>
							<button
								onClick={handleCopyCode}
								className='absolute top-3 right-3 p-2 bg-gray-800/30 hover:bg-gray-800/50 rounded-md text-white transition-colors'
								title='Copy to clipboard'>
								<Copy size={16} />
							</button>
						</div>
					</div>
				</div>
			</div>
		</Sheet>
	);
};

export default EventPropertiesDrawer;
