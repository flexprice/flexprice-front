import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TabItem {
	value: string;
	label: string;
	content: React.ReactNode;
}

interface CustomTabsProps {
	tabs: TabItem[];
	defaultValue?: string;
	className?: string;
}

const CustomTabs = ({ tabs, defaultValue = tabs[0]?.value, className }: CustomTabsProps) => {
	return (
		<Tabs defaultValue={defaultValue} className={cn('w-full', className)}>
			<TabsList className=' space-x-3 bg-transparent'>
				{tabs.map((tab) => (
					<TabsTrigger
						key={tab.value}
						value={tab.value}
						className={cn(
							'text-[15px] font-normal text-gray-500 px-3 py-1 rounded-md',
							'data-[state=active]:text-gray-900 data-[state=active]:bg-[#F9FAFB]',
							'hover:text-gray-900 transition-colors',
							'data-[state=inactive]:border  data-[state=inactive]:border-border',
							'bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0',
						)}>
						<p className='text-sm font-medium'>{tab.label}</p>
					</TabsTrigger>
				))}
			</TabsList>
			<div className='mt-4'>
				{tabs.map((tab) => (
					<TabsContent className='mt-0 p-0' key={tab.value} value={tab.value}>
						{tab.content}
					</TabsContent>
				))}
			</div>
		</Tabs>
	);
};

export default CustomTabs;
