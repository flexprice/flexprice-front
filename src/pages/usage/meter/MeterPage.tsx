import { Button, Loader, Page, SectionHeader, ShortPagination, Spacer } from '@/components/atoms';
import { FiFolderPlus } from 'react-icons/fi';
import { BillableMetricTable } from '@/components/molecules';
import { Link, useNavigate } from 'react-router-dom';
import { MeterApi } from '@/api/MeterApi';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ReactSVG } from 'react-svg';
import usePagination from '@/hooks/usePagination';
import { RouteNames } from '@/core/routes/Routes';

const MeterPage = () => {
	const { limit, offset, page } = usePagination();
	const navigate = useNavigate();
	const fetchMeters = async () => {
		return await MeterApi.getAllMeters({
			limit,
			offset,
		});
	};

	const {
		data: meterData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['fetchMeters', page],
		queryFn: fetchMeters,
	});

	if (isLoading) {
		return <Loader />;
	}

	if (isError) {
		toast.error('Error fetching meters');
	}
	if (meterData?.items.length === 0) {
		return (
			<div className='h-screen w-full flex justify-center items-center'>
				<div className='w-full flex flex-col items-center '>
					<ReactSVG src={'/assets/svg/empty box.svg'} />
					<p className='font-sans text-2xl font-bold'>Add your first Meter</p>
					<p className='text-[#71717A] font-normal '>
						{'A billable base metric is used to measure usage, and act as a foundation of pricing (e.g., API calls for an API product).'}
					</p>
					<Spacer height={'16px'} />
					<Link to='/usage-tracking/meter/add-meter'>
						<Button>
							<FiFolderPlus />
							<span>Add Meter</span>
						</Button>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<Page>
			<SectionHeader
				showButton
				showFilter
				showSearch
				title='Meter'
				onButtonClick={() => navigate(RouteNames.addMeter)}
				buttonIcon={<FiFolderPlus />}
				buttonText='Add Meter'
			/>

			<div>
				<BillableMetricTable data={meterData?.items || []} />
				<Spacer className='!h-4' />
				<ShortPagination unit='Meters' totalItems={meterData?.pagination.total ?? 0} />
			</div>
		</Page>
	);
};

export default MeterPage;
