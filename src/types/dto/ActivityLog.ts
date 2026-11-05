import { z } from 'zod';

export const ActorTypeSchema = z.enum(['user', 'api_key', 'system', 'customer_portal']);
export type ActorType = z.infer<typeof ActorTypeSchema>;

export const AnnotatedChangeSchema = z.object({
	from: z.unknown().optional(),
	to: z.unknown().optional(),
	redacted: z.boolean().optional(),
	label: z.string().default(''),
	format: z.string().default('text'),
});
export type AnnotatedChange = z.infer<typeof AnnotatedChangeSchema>;

export const AnnotatedMetaSchema = z.object({
	value: z.unknown(),
	label: z.string().default(''),
	format: z.string().default('text'),
});
export type AnnotatedMeta = z.infer<typeof AnnotatedMetaSchema>;

export const ActivityItemSchema = z.object({
	id: z.string(),
	entity_type: z.string(),
	entity_id: z.string(),
	entity_label: z.string().default(''),
	action: z.string(),
	actor: z.object({
		type: ActorTypeSchema,
		id: z.string(),
		label: z.string().default(''),
		user_id: z.string().optional(),
	}),
	source: z.string(),
	customer_id: z.string().optional(),
	subscription_id: z.string().optional(),
	request_id: z.string().optional(),
	occurred_at: z.string(),
	changes: z.record(AnnotatedChangeSchema).optional(),
	snapshot: z.record(z.unknown()).optional(),
	metadata: z.record(AnnotatedMetaSchema).optional(),
	display: z.object({
		summary: z.string(),
		entity_label: z.string().default(''),
		parts: z.object({
			actor: z.string(),
			verb: z.string(),
			entity_type: z.string(),
			entity: z.string(),
		}),
	}),
});
export type ActivityItem = z.infer<typeof ActivityItemSchema>;

export const ListActivityResponseSchema = z.object({
	items: z.array(ActivityItemSchema),
	next_cursor: z.string().optional(),
	has_more: z.boolean(),
});
export type ListActivityResponse = z.infer<typeof ListActivityResponseSchema>;

export interface ActivityQuery {
	entity_type?: string;
	entity_id?: string;
	customer_id?: string;
	subscription_id?: string;
	actor_type?: string;
	actor_id?: string;
	exclude_actor_types?: string[];
	actions?: string[];
	request_id?: string;
	start_time?: string;
	end_time?: string;
	cursor?: string;
	limit?: number;
}

export type ActivityScope =
	| { kind: 'all' }
	| { kind: 'entity'; entityType: string; entityId: string }
	| { kind: 'customer'; customerId: string }
	| { kind: 'request'; requestId: string };

export const scopeToQuery = (scope: ActivityScope): Partial<ActivityQuery> => {
	switch (scope.kind) {
		case 'entity':
			return { entity_type: scope.entityType, entity_id: scope.entityId };
		case 'customer':
			return { customer_id: scope.customerId };
		case 'request':
			return { request_id: scope.requestId };
		default:
			return {};
	}
};
