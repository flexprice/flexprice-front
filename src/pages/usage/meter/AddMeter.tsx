import { MeterForm } from '@/components/organisms';
import { RouteNames } from '@/core/routes/Routes';
import { Meter } from '@/models/Meter';
import { MeterApi } from '@/api/MeterApi';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AddMeterPage = () => {
	const navigate = useNavigate();

	const { mutate: createMeter, isPending } = useMutation({
		mutationKey: ['addMeter'],
		mutationFn: async (data: Partial<Meter>) => {
			const res = await MeterApi.createMeter(data);
			return res;
		},

		onSuccess: async () => {
			toast.success('Meter created successfully');
			navigate(RouteNames.meter);
		},
		onError: (error: ServerError) => {
			toast.error(error.error.message || 'Error creating meter');
		},
	});

	const handleCreateMeter = (data: Meter) => {
		createMeter(data);
	};

	return (
		<div className='h-screen w-full'>
			<MeterForm isLoading={isPending} onSubmit={(data) => handleCreateMeter(data)} />
		</div>
	);
};

export default AddMeterPage;
