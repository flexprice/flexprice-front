import { SortDirection, SortOption } from '@/components/molecules/QueryBuilder';
import { FilterCondition, DataType } from '../common/QueryBuilder';

export const sanitizeFilterConditions = (conditions: FilterCondition[]) => {
	return conditions.filter((condition) => {
		// Check if required base fields are present
		if (!condition.field || !condition.operator) {
			return false;
		}

		// If dataType is not specified, we can't validate the value
		if (!condition.dataType) {
			return false;
		}

		// Validate based on dataType
		switch (condition.dataType) {
			case DataType.STRING:
				// For string type, stringValue should be defined and not empty
				return condition.stringValue !== undefined && condition.stringValue.trim() !== '';

			case DataType.NUMBER:
				// For number type, numberValue should be defined and be a valid number
				return condition.numberValue !== undefined && !isNaN(condition.numberValue);

			case DataType.BOOLEAN:
				// For boolean type, booleanValue should be defined
				return condition.booleanValue !== undefined;

			case DataType.DATE:
				// For date type, dateValue should be defined and be a valid date
				return condition.dateValue !== undefined && !isNaN(condition.dateValue.getTime());

			case DataType.ARRAY:
				// For array type, arrayValue should be defined and not empty
				return condition.arrayValue !== undefined && Array.isArray(condition.arrayValue) && condition.arrayValue.length > 0;

			default:
				// Unknown data type
				return false;
		}
	});
};

export const sanitizeSortConditions = (conditions: SortOption[]) => {
	return Array.isArray(conditions)
		? conditions.filter(
				(condition) =>
					condition?.field?.trim() &&
					condition?.label?.trim() &&
					(!condition.direction || [SortDirection.ASC, SortDirection.DESC].includes(condition.direction)),
			)
		: [];
};
