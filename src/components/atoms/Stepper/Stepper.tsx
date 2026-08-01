import { cn } from '@/lib/utils';
import React, { FC } from 'react';
import { IoCheckmarkCircleSharp } from 'react-icons/io5';

interface Step {
	label: string;
}

interface StepperProps {
	steps: Step[];
	activeStep: number; // Current active step (0-based index)
}

const Stepper: FC<StepperProps> = ({ steps, activeStep }) => {
	return (
		<div className='flex items-center w-full'>
			{steps.map((step, index) => {
				const isActive = index === activeStep;
				const isCompleted = index < activeStep;

				return (
					<React.Fragment key={index}>
						{/* Step Circle */}
						<div className='flex items-center py-4 select-none'>
							<div
								className={cn('flex items-center justify-center size-5 rounded-full  text-base', {
									'': isCompleted,
									'border-stepper-active text-content-black border': isActive && !isCompleted,
									'border-stepper-line text-stepper-idle bg-[#00000005] border': !isActive && !isCompleted,
								})}>
								{isCompleted ? (
									<IoCheckmarkCircleSharp className='text-stepper-active size-5' />
								) : (
									<span className='text-xs'>{index + 1}</span>
								)}
							</div>

							{/* Step Label */}
							<div
								className={cn('ms-2 text-xs font-semibold', {
									'text-stepper-active': isCompleted || isActive,
									'text-stepper-idle': !isCompleted && !isActive,
								})}>
								{step.label}
							</div>
						</div>

						{/* Divider */}
						{index < steps.length - 1 && (
							<div
								className={cn('flex-1 border mx-2', {
									'bg-content-black': isCompleted,
									'bg-surface-bold': !isCompleted,
								})}></div>
						)}
					</React.Fragment>
				);
			})}
		</div>
	);
};

export default Stepper;
