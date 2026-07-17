import OrganizationInfoCard from './OrganizationInfoCard';
import UsersSection from './UsersSection';

const TeamTab = () => {
	return (
		<div className='flex flex-col gap-6'>
			<OrganizationInfoCard />
			<UsersSection />
		</div>
	);
};

export default TeamTab;
