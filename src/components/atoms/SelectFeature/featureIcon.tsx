import { FEATURE_TYPE } from '@/models/Feature';
import { Gauge, Settings2, SquareCheckBig, Wrench } from 'lucide-react';

export const getFeatureIcon = (featureType: string) => {
	const className = 'size-4 opacity-80 text-muted-foreground';
	if (featureType === FEATURE_TYPE.BOOLEAN) {
		return <SquareCheckBig className={className} />;
	} else if (featureType === FEATURE_TYPE.METERED) {
		return <Gauge className={className} />;
	} else if (featureType === FEATURE_TYPE.STATIC) {
		return <Wrench className={className} />;
	} else if (featureType === FEATURE_TYPE.CONFIG) {
		return <Settings2 className={className} />;
	}
};
