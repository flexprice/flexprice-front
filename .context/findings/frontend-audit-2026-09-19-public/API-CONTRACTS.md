# API contracts and request construction

Source methods are authoritative for this checkout. Generic response types are compile-time contracts; they do not prove runtime validation. Method bodies preserve parameter generation, payload changes and response transformations.

## RbacApi.getAllRoles

`src/api/RbacApi.ts:25`

Base path: `'/rbac'`. Returns: `Promise<RbacRole[]>`.

Parameters: `userType?: 'user' | 'service_account'`

```ts
{
		const url = generateQueryParams(`${this.baseUrl}/roles`, { user_type: userType });
		const response = await AxiosClient.get<GetRolesResponse>(url);
		return response.roles;
	}
```

## RbacApi.getRoleById

`src/api/RbacApi.ts:32`

Base path: `'/rbac'`. Returns: `Promise<RbacRole>`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.get<RbacRole>(`${this.baseUrl}/roles/${id}`);
	}
```

## FeatureApi.createFeature

`src/api/FeatureApi.ts:23`

Base path: `'/features'`. Returns: `Promise<FeatureResponse>`.

Parameters: `data: CreateFeatureRequest`

```ts
{
		return await AxiosClient.post<FeatureResponse, CreateFeatureRequest>(this.baseUrl, data);
	}
```

## FeatureApi.getFeatureById

`src/api/FeatureApi.ts:32`

Base path: `'/features'`. Returns: `Promise<FeatureResponse>`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.get<FeatureResponse>(`${this.baseUrl}/${id}`);
	}
```

## FeatureApi.listFeatures

`src/api/FeatureApi.ts:41`

Base path: `'/features'`. Returns: `Promise<ListFeaturesResponse>`.

Parameters: `filter: FeatureFilter = {}`

```ts
{
		const url = generateQueryParams(this.baseUrl, filter);
		return await AxiosClient.get<ListFeaturesResponse>(url);
	}
```

## FeatureApi.updateFeature

`src/api/FeatureApi.ts:52`

Base path: `'/features'`. Returns: `Promise<FeatureResponse>`.

Parameters: `id: string`; `data: UpdateFeatureRequest`

```ts
{
		return await AxiosClient.put<FeatureResponse, UpdateFeatureRequest>(`${this.baseUrl}/${id}`, data, {
			allowEmptyKeys: ['group_id'],
		});
	}
```

## FeatureApi.deleteFeature

`src/api/FeatureApi.ts:62`

Base path: `'/features'`. Returns: `Promise<void>`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.delete<void>(`${this.baseUrl}/${id}`);
	}
```

## FeatureApi.listFeaturesByFilter

`src/api/FeatureApi.ts:71`

Base path: `'/features'`. Returns: `Promise<ListFeaturesResponse>`.

Parameters: `filter: FeatureFilter`

```ts
{
		return await AxiosClient.post<ListFeaturesResponse, FeatureFilter>(`${this.baseUrl}/search`, filter);
	}
```

## FeatureApi.getAllFeatures

`src/api/FeatureApi.ts:82`

Base path: `'/features'`. Returns: `Promise<GetFeaturesResponse>`.

Parameters: `payload: GetFeaturesPayload = {}`

```ts
{
		const url = generateQueryParams(this.baseUrl, {
			...payload,
			expand: 'meters',
		});
		return await AxiosClient.get<GetFeaturesResponse>(url);
	}
```

## FeatureApi.getFeaturesByFilter

`src/api/FeatureApi.ts:93`

Base path: `'/features'`. Returns: `Promise<GetFeaturesResponse>`.

Parameters: `payload: GetFeatureByFilterPayload`

```ts
{
		return await AxiosClient.post<GetFeaturesResponse, GetFeatureByFilterPayload>(`${this.baseUrl}/search`, payload);
	}
```

## FeatureApi.updateFeatureLegacy

`src/api/FeatureApi.ts:100`

Base path: `'/features'`. Returns: `Promise<FeatureResponse>`.

Parameters: `id: string`; `data: UpdateFeaturePayload`

```ts
{
		return await AxiosClient.put<FeatureResponse, UpdateFeaturePayload>(`${this.baseUrl}/${id}`, data);
	}
```

## SupportChatApi.getIdentityToken

`src/api/SupportChatApi.ts:11`

Base path: `'/users/chat'`. Returns: `Promise<SupportChatTokenResponse>`.

Parameters:

```ts
{
		return await AxiosClient.post<SupportChatTokenResponse>(`${this.baseUrl}/verify`);
	}
```

## TenantApi.getTenantById

`src/api/TenantApi.ts:8`

Base path: `'/tenants'`. Returns: `None`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.get<Tenant>(`${this.baseUrl}/${id}`);
	}
```

## TenantApi.updateTenant

`src/api/TenantApi.ts:12`

Base path: `'/tenants'`. Returns: `None`.

Parameters: `data: UpdateTenantRequest`

```ts
{
		return await AxiosClient.put<Tenant, UpdateTenantRequest>(`${this.baseUrl}/update`, data);
	}
```

## TenantApi.getTenantBillingDetails

`src/api/TenantApi.ts:16`

Base path: `'/tenants'`. Returns: `None`.

Parameters:

```ts
{
		return await AxiosClient.get<GetBillingdetailsResponse>(`${this.baseUrl}/billing`);
	}
```

## CustomerApi.getCustomerById

`src/api/CustomerApi.ts:24`

Base path: `'/customers'`. Returns: `Promise<CustomerResponse>`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.get<CustomerResponse>(`${this.baseUrl}/${id}`);
	}
```

## CustomerApi.getCustomerByLookupKey

`src/api/CustomerApi.ts:28`

Base path: `'/customers'`. Returns: `Promise<CustomerResponse>`.

Parameters: `lookupKey: string`

```ts
{
		return await AxiosClient.get<CustomerResponse>(`${this.baseUrl}/lookup/${lookupKey}`);
	}
```

## CustomerApi.getCustomerByExternalId

`src/api/CustomerApi.ts:32`

Base path: `'/customers'`. Returns: `Promise<CustomerResponse>`.

Parameters: `externalId: string`

```ts
{
		return await AxiosClient.get<CustomerResponse>(`${this.baseUrl}/external/${externalId}`);
	}
```

## CustomerApi.getCustomers

`src/api/CustomerApi.ts:40`

Base path: `'/customers'`. Returns: `Promise<ListCustomersResponse>`.

Parameters: `filter: CustomerFilter = {}`

```ts
{
		const params: Record<string, string | number | undefined> = {};
		if (filter.limit != null) params.limit = filter.limit;
		if (filter.offset != null) params.offset = filter.offset;
		if (filter.expand != null) params.expand = filter.expand;
		if (filter.external_id != null) params.external_id = filter.external_id;
		if (filter.email != null) params.email = filter.email;
		if (filter.start_time != null) params.start_time = filter.start_time;
		if (filter.end_time != null) params.end_time = filter.end_time;
		if (filter.customer_ids?.length) params.customer_ids = filter.customer_ids.join(',');
		if (filter.external_ids?.length) params.external_ids = filter.external_ids.join(',');
		// parent_customer_ids removed from customer APIs (subscription hierarchy replaces customer parent linkage)
		const url = generateQueryParams(this.baseUrl, params);
		return await AxiosClient.get<ListCustomersResponse>(url);
	}
```

## CustomerApi.getAllCustomers

`src/api/CustomerApi.ts:57`

Base path: `'/customers'`. Returns: `Promise<ListCustomersResponse>`.

Parameters: `{ limit = 10, offset = 0 }: Pagination`

```ts
{
		return await this.getCustomers({ limit, offset });
	}
```

## CustomerApi.getCustomersByFilters

`src/api/CustomerApi.ts:65`

Base path: `'/customers'`. Returns: `Promise<ListCustomersResponse>`.

Parameters: `payload: GetCustomerByFiltersPayload`

```ts
{
		return await AxiosClient.post<ListCustomersResponse>(`${this.baseUrl}/search`, payload);
	}
```

## CustomerApi.deleteCustomerById

`src/api/CustomerApi.ts:69`

Base path: `'/customers'`. Returns: `Promise<void>`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.delete(`${this.baseUrl}/${id}`);
	}
```

## CustomerApi.getCustomerSubscriptions

`src/api/CustomerApi.ts:73`

Base path: `'/customers'`. Returns: `Promise<GetCustomerSubscriptionsResponse>`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.get(`/subscriptions?customer_id=${id}`);
	}
```

## CustomerApi.getCustomerSubscriptionById

`src/api/CustomerApi.ts:77`

Base path: `'/customers'`. Returns: `Promise<Subscription>`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.get(`/subscriptions/${id}`);
	}
```

## CustomerApi.createCustomer

`src/api/CustomerApi.ts:81`

Base path: `'/customers'`. Returns: `Promise<CustomerResponse>`.

Parameters: `customer: CreateCustomerRequest`

```ts
{
		return await AxiosClient.post<CustomerResponse>(`${this.baseUrl}`, customer);
	}
```

## CustomerApi.updateCustomer

`src/api/CustomerApi.ts:85`

Base path: `'/customers'`. Returns: `Promise<CustomerResponse>`.

Parameters: `customer: UpdateCustomerRequest`; `id: string`

```ts
{
		return await AxiosClient.put<CustomerResponse>(`${this.baseUrl}/${id}`, customer);
	}
```

## CustomerApi.getEntitlements

`src/api/CustomerApi.ts:89`

Base path: `'/customers'`. Returns: `Promise<GetCustomerEntitlementsResponse>`.

Parameters: `payload: GetCustomerEntitlementPayload`

```ts
{
		return await AxiosClient.get(`${this.baseUrl}/${payload.customer_id}/entitlements`);
	}
```

## CustomerApi.getUsageSummary

`src/api/CustomerApi.ts:93`

Base path: `'/customers'`. Returns: `Promise<GetUsageSummaryResponse>`.

Parameters: `payload: GetCustomerEntitlementPayload`

```ts
{
		return await AxiosClient.get(`${this.baseUrl}/${payload.customer_id}/usage`);
	}
```

## CustomerApi.getCustomerUsageSummary

`src/api/CustomerApi.ts:101`

Base path: `'/customers'`. Returns: `Promise<GetUsageSummaryResponse>`.

Parameters: `queryParams: {
		external_customer_id?: string;
		customer_id?: string;
	}`

```ts
{
		const url = generateQueryParams(`${this.baseUrl}/usage`, queryParams);
		return await AxiosClient.get<GetUsageSummaryResponse>(url);
	}
```

## CustomerApi.getCustomerInvoiceSummary

`src/api/CustomerApi.ts:113`

Base path: `'/customers'`. Returns: `Promise<any>`.

Parameters: `customerId: string`

```ts
{
		return await AxiosClient.get(`${this.baseUrl}/${customerId}/invoices/summary`);
	}
```

## CustomerApi.getUpcomingCreditGrantApplications

`src/api/CustomerApi.ts:120`

Base path: `'/customers'`. Returns: `Promise<ListCreditGrantApplicationsResponse>`.

Parameters: `customerId: string`

```ts
{
		return await AxiosClient.get<ListCreditGrantApplicationsResponse>(`${this.baseUrl}/${customerId}/grants/upcoming`);
	}
```

## CustomerApi.createDashboardSession

`src/api/CustomerApi.ts:129`

Base path: `'/customers'`. Returns: `Promise<DashboardSessionResponse>`.

Parameters: `externalId: string`

```ts
{
		return await AxiosClient.get<DashboardSessionResponse>(`${this.baseUrl}/portal/${externalId}`);
	}
```

## CustomerApi.searchCustomers

`src/api/CustomerApi.ts:140`

Base path: `'/customers'`. Returns: `Promise<ListCustomersResponse>`.

Parameters: `query: string`; `limit: number = 50`

```ts
{
		// If query is empty, return all customers without filters
		if (!query || query.trim() === '') {
			return await this.getCustomersByFilters({
				limit,
				offset: 0,
				filters: [],
				sort: [],
				status: ENTITY_STATUS.PUBLISHED,
			});
		}

		// Create filters for name and email contains search
		const filters: TypedBackendFilter[] = [
			{
				field: 'name',
				operator: FilterOperator.CONTAINS,
				data_type: DataType.STRING,
				value: { string: query },
			},
		];

		return await this.getCustomersByFilters({
			limit,
			offset: 0,
			filters,
			sort: [],
		});
	}
```

## SubscriptionApi.getSubscription

`src/api/SubscriptionApi.ts:47`

Base path: `'/subscriptions'`. Returns: `Promise<SubscriptionResponse>`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.get<SubscriptionResponse>(`${this.baseUrl}/${id}`);
	}
```

## SubscriptionApi.getSubscriptionV2

`src/api/SubscriptionApi.ts:57`

Base path: `'/subscriptions'`. Returns: `Promise<SubscriptionResponse>`.

Parameters: `id: string`; `options?: { expand?: string }`

```ts
{
		const params = new URLSearchParams();
		if (options?.expand !== undefined) {
			params.append('expand', options.expand);
		}
		const queryString = params.toString();
		const url = queryString ? `${this.baseUrl}/${id}/v2?${queryString}` : `${this.baseUrl}/${id}/v2`;
		return await AxiosClient.get<SubscriptionResponse>(url);
	}
```

## SubscriptionApi.createSubscription

`src/api/SubscriptionApi.ts:70`

Base path: `'/subscriptions'`. Returns: `Promise<SubscriptionResponse>`.

Parameters: `payload: CreateSubscriptionRequest`

```ts
{
		return await AxiosClient.post(this.baseUrl, payload);
	}
```

## SubscriptionApi.updateSubscription

`src/api/SubscriptionApi.ts:77`

Base path: `'/subscriptions'`. Returns: `Promise<SubscriptionResponse>`.

Parameters: `id: string`; `payload: UpdateSubscriptionRequest`

```ts
{
		return await AxiosClient.put<SubscriptionResponse>(`${this.baseUrl}/${id}`, payload);
	}
```

## SubscriptionApi.listSubscriptions

`src/api/SubscriptionApi.ts:84`

Base path: `'/subscriptions'`. Returns: `Promise<ListSubscriptionsResponse>`.

Parameters: `payload: ListSubscriptionsPayload`

```ts
{
		const url = generateQueryParams(this.baseUrl, payload);
		return await AxiosClient.get<ListSubscriptionsResponse>(url);
	}
```

## SubscriptionApi.searchSubscriptions

`src/api/SubscriptionApi.ts:92`

Base path: `'/subscriptions'`. Returns: `Promise<ListSubscriptionsResponse>`.

Parameters: `payload: ListSubscriptionsPayload`

```ts
{
		return await AxiosClient.post(`${this.baseUrl}/search`, { ...payload });
	}
```

## SubscriptionApi.cancelSubscription

`src/api/SubscriptionApi.ts:99`

Base path: `'/subscriptions'`. Returns: `Promise<void | CancelSubscriptionResponse>`.

Parameters: `id: string`; `payload: CancelSubscriptionPayload | CancelSubscriptionRequest`

```ts
{
		return await AxiosClient.post(`${this.baseUrl}/${id}/cancel`, payload);
	}
```

## SubscriptionApi.activateSubscription

`src/api/SubscriptionApi.ts:113`

Base path: `'/subscriptions'`. Returns: `Promise<SubscriptionResponse>`.

Parameters: `id: string`; `payload: { start_date: string }`

```ts
{
		return await AxiosClient.post<SubscriptionResponse>(`${this.baseUrl}/${id}/activate`, payload);
	}
```

## SubscriptionApi.getSubscriptionUsage

`src/api/SubscriptionApi.ts:124`

Base path: `'/subscriptions'`. Returns: `Promise<SubscriptionUsage>`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.post(`${this.baseUrl}/usage`, { subscription_id: id });
	}
```

## SubscriptionApi.getUsageBySubscription

`src/api/SubscriptionApi.ts:131`

Base path: `'/subscriptions'`. Returns: `Promise<GetUsageBySubscriptionResponse>`.

Parameters: `payload: GetUsageBySubscriptionRequest | { subscription_id: string }`

```ts
{
		return await AxiosClient.post<GetUsageBySubscriptionResponse>(`${this.baseUrl}/usage`, payload);
	}
```

## SubscriptionApi.getSubscriptionInvoicesPreview

`src/api/SubscriptionApi.ts:140`

Base path: `'/subscriptions'`. Returns: `Promise<GetSubscriptionPreviewResponse>`.

Parameters: `payload: GetSubscriptionDetailsPayload`

```ts
{
		return await AxiosClient.post('/invoices/preview', payload, {
			timeout: 60000, // 1 minute
		});
	}
```

## SubscriptionApi.addAddonToSubscription

`src/api/SubscriptionApi.ts:153`

Base path: `'/subscriptions'`. Returns: `Promise<AddonAssociationResponse>`.

Parameters: `payload: AddAddonRequest`

```ts
{
		return await AxiosClient.post<AddonAssociationResponse>(`${this.baseUrl}/addon`, payload);
	}
```

## SubscriptionApi.getActiveAddons

`src/api/SubscriptionApi.ts:160`

Base path: `'/subscriptions'`. Returns: `Promise<ListAddonAssociationsResponse>`.

Parameters: `subscriptionId: string`

```ts
{
		return await AxiosClient.get<ListAddonAssociationsResponse>(`${this.baseUrl}/${subscriptionId}/addons/associations`);
	}
```

## SubscriptionApi.removeAddonFromSubscription

`src/api/SubscriptionApi.ts:167`

Base path: `'/subscriptions'`. Returns: `Promise<{ message: string }>`.

Parameters: `payload: RemoveAddonRequest`

```ts
{
		return await AxiosClient.delete(`${this.baseUrl}/addon`, payload);
	}
```

## SubscriptionApi.createSubscriptionLineItem

`src/api/SubscriptionApi.ts:178`

Base path: `'/subscriptions'`. Returns: `Promise<SubscriptionLineItemResponse>`.

Parameters: `subscriptionId: string`; `payload: CreateSubscriptionLineItemRequest`

```ts
{
		return await AxiosClient.post<SubscriptionLineItemResponse>(`${this.baseUrl}/${subscriptionId}/lineitems`, payload);
	}
```

## SubscriptionApi.updateSubscriptionLineItem

`src/api/SubscriptionApi.ts:188`

Base path: `'/subscriptions'`. Returns: `Promise<SubscriptionLineItemResponse>`.

Parameters: `id: string`; `payload: UpdateSubscriptionLineItemRequest`

```ts
{
		return await AxiosClient.put<SubscriptionLineItemResponse>(`${this.baseUrl}/lineitems/${id}`, payload);
	}
```

## SubscriptionApi.deleteSubscriptionLineItem

`src/api/SubscriptionApi.ts:198`

Base path: `'/subscriptions'`. Returns: `Promise<void>`.

Parameters: `id: string`; `payload: DeleteSubscriptionLineItemRequest`

```ts
{
		return await AxiosClient.delete(`${this.baseUrl}/lineitems/${id}`, payload);
	}
```

## SubscriptionApi.searchSubscriptionLineItems

`src/api/SubscriptionApi.ts:206`

Base path: `'/subscriptions'`. Returns: `Promise<ListSubscriptionLineItemsResponse>`.

Parameters: `filter: SubscriptionLineItemFilter`

```ts
{
		return await AxiosClient.post<ListSubscriptionLineItemsResponse>(`${this.baseUrl}/lineitems/search`, filter);
	}
```

## SubscriptionApi.getSubscriptionEntitlements

`src/api/SubscriptionApi.ts:217`

Base path: `'/subscriptions'`. Returns: `None`.

Parameters: `subscriptionId: string`

```ts
{
		return await AxiosClient.get<GetSubscriptionEntitlementsResponse>(`${this.baseUrl}/${subscriptionId}/entitlements`);
	}
```

## SubscriptionApi.getUpcomingCreditGrantApplications

`src/api/SubscriptionApi.ts:228`

Base path: `'/subscriptions'`. Returns: `Promise<ListCreditGrantApplicationsResponse>`.

Parameters: `subscriptionId: string`

```ts
{
		return await AxiosClient.get<ListCreditGrantApplicationsResponse>(`${this.baseUrl}/${subscriptionId}/grants/upcoming`);
	}
```

## SubscriptionApi.previewSubscriptionChange

`src/api/SubscriptionApi.ts:240`

Base path: `'/subscriptions'`. Returns: `Promise<PreviewSubscriptionChangeResponse>`.

Parameters: `id: string`; `payload: PreviewSubscriptionChangeRequest`

```ts
{
		return await AxiosClient.post<PreviewSubscriptionChangeResponse>(`${this.baseUrl}/${id}/change/preview`, payload);
	}
```

## SubscriptionApi.executeSubscriptionChange

`src/api/SubscriptionApi.ts:251`

Base path: `'/subscriptions'`. Returns: `Promise<ExecuteSubscriptionChangeResponse>`.

Parameters: `id: string`; `payload: ExecuteSubscriptionChangeRequest`

```ts
{
		return await AxiosClient.post<ExecuteSubscriptionChangeResponse>(`${this.baseUrl}/${id}/change/execute`, payload);
	}
```

## SubscriptionApi.previewSubscriptionModify

`src/api/SubscriptionApi.ts:266`

Base path: `'/subscriptions'`. Returns: `Promise<SubscriptionModifyResponse>`.

Parameters: `id: string`; `payload: ExecuteSubscriptionModifyRequest`

```ts
{
		return await AxiosClient.post<SubscriptionModifyResponse>(`${this.baseUrl}/${id}/modify/preview`, payload);
	}
```

## SubscriptionApi.executeSubscriptionModify

`src/api/SubscriptionApi.ts:277`

Base path: `'/subscriptions'`. Returns: `Promise<SubscriptionModifyResponse>`.

Parameters: `id: string`; `payload: ExecuteSubscriptionModifyRequest`

```ts
{
		return await AxiosClient.post<SubscriptionModifyResponse>(`${this.baseUrl}/${id}/modify/execute`, payload);
	}
```

## TaxApi.createTaxRate

`src/api/TaxApi.ts:20`

Base path: `'/taxes'`. Returns: `Promise<TaxRateResponse>`.

Parameters: `payload: CreateTaxRateRequest`

```ts
{
		return await AxiosClient.post<TaxRateResponse>(`${this.baseUrl}/rates`, payload);
	}
```

## TaxApi.getTaxRate

`src/api/TaxApi.ts:24`

Base path: `'/taxes'`. Returns: `Promise<TaxRateResponse>`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.get<TaxRateResponse>(`${this.baseUrl}/rates/${id}`);
	}
```

## TaxApi.listTaxRates

`src/api/TaxApi.ts:28`

Base path: `'/taxes'`. Returns: `Promise<ListTaxRatesResponse>`.

Parameters: `filter?: TaxRateFilter`

```ts
{
		const url = filter ? generateQueryParams(`${this.baseUrl}/rates`, filter) : `${this.baseUrl}/rates`;
		return await AxiosClient.get<ListTaxRatesResponse>(url);
	}
```

## TaxApi.updateTaxRate

`src/api/TaxApi.ts:33`

Base path: `'/taxes'`. Returns: `Promise<TaxRateResponse>`.

Parameters: `id: string`; `payload: UpdateTaxRateRequest`

```ts
{
		return await AxiosClient.put<TaxRateResponse>(`${this.baseUrl}/rates/${id}`, payload);
	}
```

## TaxApi.deleteTaxRate

`src/api/TaxApi.ts:37`

Base path: `'/taxes'`. Returns: `Promise<void>`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.delete(`${this.baseUrl}/rates/${id}`);
	}
```

## TaxApi.createTaxAssociation

`src/api/TaxApi.ts:42`

Base path: `'/taxes'`. Returns: `Promise<TaxAssociationResponse>`.

Parameters: `payload: CreateTaxAssociationRequest`

```ts
{
		return await AxiosClient.post<TaxAssociationResponse>(`${this.baseUrl}/associations`, payload);
	}
```

## TaxApi.getTaxAssociation

`src/api/TaxApi.ts:46`

Base path: `'/taxes'`. Returns: `Promise<TaxAssociationResponse>`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.get<TaxAssociationResponse>(`${this.baseUrl}/associations/${id}`);
	}
```

## TaxApi.updateTaxAssociation

`src/api/TaxApi.ts:50`

Base path: `'/taxes'`. Returns: `Promise<TaxAssociationResponse>`.

Parameters: `id: string`; `payload: TaxAssociationUpdateRequest`

```ts
{
		return await AxiosClient.put<TaxAssociationResponse>(`${this.baseUrl}/associations/${id}`, payload);
	}
```

## TaxApi.deleteTaxAssociation

`src/api/TaxApi.ts:54`

Base path: `'/taxes'`. Returns: `Promise<void>`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.delete(`${this.baseUrl}/associations/${id}`);
	}
```

## TaxApi.listTaxAssociations

`src/api/TaxApi.ts:58`

Base path: `'/taxes'`. Returns: `Promise<ListTaxAssociationsResponse>`.

Parameters: `filter?: TaxAssociationFilter`

```ts
{
		const url = filter ? generateQueryParams(`${this.baseUrl}/associations`, filter) : `${this.baseUrl}/associations`;
		return await AxiosClient.get<ListTaxAssociationsResponse>(url);
	}
```

## CouponApi.createCoupon

`src/api/CouponApi.ts:10`

Base path: `'/coupons'`. Returns: `Promise<Coupon>`.

Parameters: `payload: CreateCouponRequest`

```ts
{
		return await AxiosClient.post(`${this.baseUrl}`, payload);
	}
```

## CouponApi.getCouponById

`src/api/CouponApi.ts:14`

Base path: `'/coupons'`. Returns: `Promise<Coupon>`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.get(`${this.baseUrl}/${id}`);
	}
```

## CouponApi.updateCoupon

`src/api/CouponApi.ts:18`

Base path: `'/coupons'`. Returns: `Promise<Coupon>`.

Parameters: `id: string`; `payload: UpdateCouponRequest`

```ts
{
		return await AxiosClient.put(`${this.baseUrl}/${id}`, payload);
	}
```

## CouponApi.deleteCoupon

`src/api/CouponApi.ts:22`

Base path: `'/coupons'`. Returns: `Promise<void>`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.delete(`${this.baseUrl}/${id}`);
	}
```

## CouponApi.getAllCoupons

`src/api/CouponApi.ts:26`

Base path: `'/coupons'`. Returns: `Promise<ListCouponsResponse>`.

Parameters: `{ limit = 10, offset = 0 }: Pagination`

```ts
{
		const url = generateQueryParams(this.baseUrl, { limit, offset });
		return await AxiosClient.get(url);
	}
```

## CouponApi.getCouponsByFilters

`src/api/CouponApi.ts:31`

Base path: `'/coupons'`. Returns: `Promise<ListCouponsResponse>`.

Parameters: `payload: CouponFilter`

```ts
{
		return await AxiosClient.post(`${this.baseUrl}/search`, payload);
	}
```

## CouponApi.listCouponAssociations

`src/api/CouponApi.ts:35`

Base path: `'/coupons'`. Returns: `Promise<ListCouponAssociationsResponse>`.

Parameters: `filter?: CouponAssociationFilter`

```ts
{
		const url = filter ? generateQueryParams(`${this.baseUrl}/associations`, filter) : `${this.baseUrl}/associations`;
		return await AxiosClient.get<ListCouponAssociationsResponse>(url);
	}
```

## EntitlementApi.create

`src/api/EntitlementApi.ts:20`

Base path: `'/entitlements'`. Returns: `None`.

Parameters: `data: CreateEntitlementRequest`

```ts
{
		return await AxiosClient.post<EntitlementResponse>(this.baseUrl, data);
	}
```

## EntitlementApi.createBulk

`src/api/EntitlementApi.ts:29`

Base path: `'/entitlements'`. Returns: `None`.

Parameters: `data: CreateBulkEntitlementRequest`

```ts
{
		return await AxiosClient.post<CreateBulkEntitlementResponse>(`${this.baseUrl}/bulk`, data);
	}
```

## EntitlementApi.get

`src/api/EntitlementApi.ts:38`

Base path: `'/entitlements'`. Returns: `None`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.get<EntitlementResponse>(`${this.baseUrl}/${id}`);
	}
```

## EntitlementApi.search

`src/api/EntitlementApi.ts:47`

Base path: `'/entitlements'`. Returns: `None`.

Parameters: `filters: EntitlementFilter`

```ts
{
		return await AxiosClient.post<ListEntitlementsResponse>(`${this.baseUrl}/search`, filters);
	}
```

## EntitlementApi.update

`src/api/EntitlementApi.ts:57`

Base path: `'/entitlements'`. Returns: `None`.

Parameters: `id: string`; `data: UpdateEntitlementRequest`

```ts
{
		return await AxiosClient.put<EntitlementResponse>(`${this.baseUrl}/${id}`, data);
	}
```

## EntitlementApi.delete

`src/api/EntitlementApi.ts:66`

Base path: `'/entitlements'`. Returns: `None`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.delete<void>(`${this.baseUrl}/${id}`);
	}
```

## AddonApi.List

`src/api/AddonApi.ts:17`

Base path: `'/addons'`. Returns: `Promise<GetAddonsResponse>`.

Parameters: `payload: GetAddonsPayload = {}`

```ts
{
		const url = generateQueryParams(this.baseUrl, {
			...payload,
			expand: 'prices,meters,entitlements',
		});
		return await AxiosClient.get<GetAddonsResponse>(url);
	}
```

## AddonApi.Get

`src/api/AddonApi.ts:25`

Base path: `'/addons'`. Returns: `None`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.get<AddonResponse>(`${this.baseUrl}/${id}`);
	}
```

## AddonApi.GetByLookupKey

`src/api/AddonApi.ts:29`

Base path: `'/addons'`. Returns: `None`.

Parameters: `lookupKey: string`

```ts
{
		return await AxiosClient.get<AddonResponse>(`${this.baseUrl}/lookup/${lookupKey}`);
	}
```

## AddonApi.Create

`src/api/AddonApi.ts:33`

Base path: `'/addons'`. Returns: `None`.

Parameters: `data: CreateAddonRequest`

```ts
{
		return await AxiosClient.post<Addon, CreateAddonRequest>(this.baseUrl, data);
	}
```

## AddonApi.Update

`src/api/AddonApi.ts:37`

Base path: `'/addons'`. Returns: `None`.

Parameters: `id: string`; `data: UpdateAddonRequest`

```ts
{
		return await AxiosClient.put<Addon, UpdateAddonRequest>(`${this.baseUrl}/${id}`, data);
	}
```

## AddonApi.Delete

`src/api/AddonApi.ts:41`

Base path: `'/addons'`. Returns: `None`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.delete<void>(`${this.baseUrl}/${id}`);
	}
```

## AddonApi.ListByFilter

`src/api/AddonApi.ts:45`

Base path: `'/addons'`. Returns: `None`.

Parameters: `payload: GetAddonByFilterPayload`

```ts
{
		return await AxiosClient.post<GetAddonsResponse, GetAddonByFilterPayload>(`${this.baseUrl}/search`, payload);
	}
```

## AddonApi.GetEntitlements

`src/api/AddonApi.ts:49`

Base path: `'/addons'`. Returns: `None`.

Parameters: `addonId: string`

```ts
{
		return await AxiosClient.get<ListEntitlementsResponse>(`${this.baseUrl}/${addonId}/entitlements`);
	}
```

## GroupApi.createGroup

`src/api/GroupApi.ts:16`

Base path: `'/groups'`. Returns: `None`.

Parameters: `data: CreateGroupRequest`

```ts
{
		return await AxiosClient.post<GroupResponse, CreateGroupRequest>(this.baseUrl, data);
	}
```

## GroupApi.getAllGroups

`src/api/GroupApi.ts:20`

Base path: `'/groups'`. Returns: `None`.

Parameters: `{ limit, offset }: Pagination`

```ts
{
		const payload = {
			limit,
			offset,
		};
		const url = generateQueryParams(this.baseUrl, payload);
		return await AxiosClient.get<ListGroupsResponse>(url);
	}
```

## GroupApi.getGroupById

`src/api/GroupApi.ts:29`

Base path: `'/groups'`. Returns: `None`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.get<GroupResponse>(`${this.baseUrl}/${id}`);
	}
```

## GroupApi.updateGroup

`src/api/GroupApi.ts:33`

Base path: `'/groups'`. Returns: `None`.

Parameters: `id: string`; `data: UpdateGroupRequest`

```ts
{
		return await AxiosClient.put<GroupResponse, UpdateGroupRequest>(`${this.baseUrl}/${id}`, data);
	}
```

## GroupApi.deleteGroup

`src/api/GroupApi.ts:37`

Base path: `'/groups'`. Returns: `None`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.delete<void>(`${this.baseUrl}/${id}`);
	}
```

## GroupApi.searchGroups

`src/api/GroupApi.ts:41`

Base path: `'/groups'`. Returns: `None`.

Parameters: `query: string`; `{ limit, offset }: Pagination`

```ts
{
		const payload = {
			limit,
			offset,
			query,
		};
		return await AxiosClient.post<ListGroupsResponse>(`${this.baseUrl}/search`, payload);
	}
```

## GroupApi.getGroupsByFilter

`src/api/GroupApi.ts:50`

Base path: `'/groups'`. Returns: `None`.

Parameters: `payload: GroupFilter`

```ts
{
		return await AxiosClient.post<ListGroupsResponse>(`${this.baseUrl}/search`, payload);
	}
```

## GroupApi.addEntityToGroup

`src/api/GroupApi.ts:54`

Base path: `'/groups'`. Returns: `None`.

Parameters: `id: string`; `data: AddEntityToGroupRequest`

```ts
{
		return await AxiosClient.post<GroupResponse, AddEntityToGroupRequest>(`${this.baseUrl}/${id}/entities`, data);
	}
```

## AlertLogsApi.listAlertLogsByFilter

`src/api/AlertLogsApi.ts:36`

Base path: `'/alerts'`. Returns: `Promise<ListAlertLogsResponse>`.

Parameters: `payload: ListAlertLogsByFilterPayload`

```ts
{
		return await AxiosClient.post<ListAlertLogsResponse>(`${this.baseUrl}/search`, payload);
	}
```

## AuthApi.Login

`src/api/AuthApi.ts:7`

Base path: `'/auth'`. Returns: `None`.

Parameters: `email: string`; `password: string`

```ts
{
		return await AxiosClient.post<LocalUser>(`${this.baseUrl}/login`, { email, password } as LoginData);
	}
```

## AuthApi.Signup

`src/api/AuthApi.ts:11`

Base path: `'/auth'`. Returns: `None`.

Parameters: `data: SignupData`

```ts
{
		return await AxiosClient.post<LocalUser>(`${this.baseUrl}/signup`, data);
	}
```

## AuthApi.Logout

`src/api/AuthApi.ts:15`

Base path: `'/auth'`. Returns: `None`.

Parameters:

```ts
{
		return await AxiosClient.post(`${this.baseUrl}/logout`);
	}
```

## AuthApi.VerifyEmail

`src/api/AuthApi.ts:19`

Base path: `'/auth'`. Returns: `None`.

Parameters: `token: string`

```ts
{
		return await AxiosClient.post(`${this.baseUrl}/signup/confirmation`, { token });
	}
```

## AuthApi.ResetPassword

`src/api/AuthApi.ts:23`

Base path: `'/auth'`. Returns: `None`.

Parameters: `token: string`; `newPassword: string`

```ts
{
		return await AxiosClient.post(`${this.baseUrl}/reset-password`, { token, newPassword });
	}
```

## AuthApi.ResendVerificationEmail

`src/api/AuthApi.ts:27`

Base path: `'/auth'`. Returns: `None`.

Parameters: `email: string`

```ts
{
		return await AxiosClient.post(`${this.baseUrl}/resend-verification`, { email });
	}
```

## ConnectionApi.List

`src/api/ConnectionApi.ts:9`

Base path: `'/connections'`. Returns: `Promise<GetConnectionsResponse>`.

Parameters: `payload: GetConnectionsPayload = {}`

```ts
{
		const url = generateQueryParams(this.baseUrl, payload);
		return await AxiosClient.get<GetConnectionsResponse>(url);
	}
```

## ConnectionApi.Get

`src/api/ConnectionApi.ts:14`

Base path: `'/connections'`. Returns: `Promise<Connection>`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.get<Connection>(`${this.baseUrl}/${id}`);
	}
```

## ConnectionApi.ListPublished

`src/api/ConnectionApi.ts:18`

Base path: `'/connections'`. Returns: `Promise<GetConnectionsResponse>`.

Parameters:

```ts
{
		return this.List({ status: ENTITY_STATUS.PUBLISHED });
	}
```

## ConnectionApi.Create

`src/api/ConnectionApi.ts:22`

Base path: `'/connections'`. Returns: `Promise<Connection>`.

Parameters: `payload: CreateConnectionPayload`

```ts
{
		return await AxiosClient.post<Connection>(this.baseUrl, payload);
	}
```

## ConnectionApi.Update

`src/api/ConnectionApi.ts:26`

Base path: `'/connections'`. Returns: `Promise<Connection>`.

Parameters: `id: string`; `payload: Partial<UpdateConnectionPayload>`

```ts
{
		return await AxiosClient.put<Connection>(`${this.baseUrl}/${id}`, payload);
	}
```

## ConnectionApi.Delete

`src/api/ConnectionApi.ts:30`

Base path: `'/connections'`. Returns: `Promise<void>`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.delete(`${this.baseUrl}/${id}`);
	}
```

## CostSheetApi.ListCostSheets

`src/api/CostSheetApi.ts:17`

Base path: `'/costs'`. Returns: `Promise<GetCostSheetsResponse>`.

Parameters: `payload: GetCostSheetsPayload = {}`

```ts
{
		const url = generateQueryParams(this.baseUrl, {
			...payload,
			expand: 'prices',
		});
		return await AxiosClient.get<GetCostSheetsResponse>(url);
	}
```

## CostSheetApi.GetCostSheetById

`src/api/CostSheetApi.ts:25`

Base path: `'/costs'`. Returns: `None`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.get<CostSheetResponse>(`${this.baseUrl}/${id}`);
	}
```

## CostSheetApi.GetCostSheetByLookupKey

`src/api/CostSheetApi.ts:29`

Base path: `'/costs'`. Returns: `None`.

Parameters: `lookupKey: string`

```ts
{
		return await AxiosClient.get<CostSheetResponse>(`${this.baseUrl}/lookup/${lookupKey}`);
	}
```

## CostSheetApi.CreateCostSheet

`src/api/CostSheetApi.ts:33`

Base path: `'/costs'`. Returns: `None`.

Parameters: `data: CreateCostSheetRequest`

```ts
{
		return await AxiosClient.post<CostSheet, CreateCostSheetRequest>(this.baseUrl, data);
	}
```

## CostSheetApi.UpdateCostSheet

`src/api/CostSheetApi.ts:37`

Base path: `'/costs'`. Returns: `None`.

Parameters: `id: string`; `data: UpdateCostSheetRequest`

```ts
{
		return await AxiosClient.put<CostSheet, UpdateCostSheetRequest>(`${this.baseUrl}/${id}`, data);
	}
```

## CostSheetApi.DeleteCostSheet

`src/api/CostSheetApi.ts:41`

Base path: `'/costs'`. Returns: `None`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.delete<void>(`${this.baseUrl}/${id}`);
	}
```

## CostSheetApi.GetCostSheetsByFilter

`src/api/CostSheetApi.ts:45`

Base path: `'/costs'`. Returns: `None`.

Parameters: `payload: GetCostSheetsByFilterPayload`

```ts
{
		return await AxiosClient.post<GetCostSheetsResponse, GetCostSheetsByFilterPayload>(`${this.baseUrl}/search`, payload);
	}
```

## CostSheetApi.GetActiveCostSheetForTenant

`src/api/CostSheetApi.ts:49`

Base path: `'/costs'`. Returns: `None`.

Parameters:

```ts
{
		return await AxiosClient.get<CostSheetResponse>(`${this.baseUrl}/active`);
	}
```

## CostSheetApi.GetCostAnalytics

`src/api/CostSheetApi.ts:60`

Base path: `'/costs'`. Returns: `Promise<GetDetailedCostAnalyticsResponse>`.

Parameters: `payload: GetCostAnalyticsRequest`

```ts
{
		return await AxiosClient.post<GetDetailedCostAnalyticsResponse>(`${this.baseUrl}/analytics`, payload);
	}
```

## CostSheetApi.GetCostAnalyticsV2

`src/api/CostSheetApi.ts:68`

Base path: `'/costs'`. Returns: `Promise<GetDetailedCostAnalyticsResponse>`.

Parameters: `payload: GetCostAnalyticsRequest`

```ts
{
		return await AxiosClient.post<GetDetailedCostAnalyticsResponse>(`${this.baseUrl}/analytics-v2`, payload);
	}
```

## CreditGrantApi.create

`src/api/CreditGrantApi.ts:23`

Base path: `'/creditgrants'`. Returns: `None`.

Parameters: `data: CreateCreditGrantRequest`

```ts
{
		return AxiosClient.post<CreditGrantResponse, CreateCreditGrantRequest>(this.baseUrl, data);
	}
```

## CreditGrantApi.get

`src/api/CreditGrantApi.ts:32`

Base path: `'/creditgrants'`. Returns: `None`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.get<CreditGrantResponse>(`${this.baseUrl}/${id}`);
	}
```

## CreditGrantApi.list

`src/api/CreditGrantApi.ts:41`

Base path: `'/creditgrants'`. Returns: `None`.

Parameters: `filters: CreditGrantFilter`

```ts
{
		const url = generateQueryParams(this.baseUrl, filters);
		return await AxiosClient.get<ListCreditGrantsResponse>(url);
	}
```

## CreditGrantApi.search

`src/api/CreditGrantApi.ts:51`

Base path: `'/creditgrants'`. Returns: `None`.

Parameters: `payload: SearchCreditGrantsRequest`

```ts
{
		return await AxiosClient.post<SearchCreditGrantsResponse>(`${this.baseUrl}/search`, payload);
	}
```

## CreditGrantApi.update

`src/api/CreditGrantApi.ts:61`

Base path: `'/creditgrants'`. Returns: `None`.

Parameters: `id: string`; `data: UpdateCreditGrantRequest`

```ts
{
		return await AxiosClient.put<CreditGrantResponse, UpdateCreditGrantRequest>(`${this.baseUrl}/${id}`, data);
	}
```

## CreditGrantApi.delete

`src/api/CreditGrantApi.ts:71`

Base path: `'/creditgrants'`. Returns: `None`.

Parameters: `id: string`; `data?: DeleteCreditGrantRequest`

```ts
{
		return await AxiosClient.delete<void, DeleteCreditGrantRequest>(`${this.baseUrl}/${id}`, data);
	}
```

## CreditGrantApi.cancelFuture

`src/api/CreditGrantApi.ts:80`

Base path: `'/creditgrants'`. Returns: `None`.

Parameters: `data: CancelFutureCreditGrantRequest`

```ts
{
		return await AxiosClient.post<void, CancelFutureCreditGrantRequest>(`${this.baseUrl}/cancel`, data);
	}
```

## CreditNoteApi.getCreditNotes

`src/api/CreditNoteApi.ts:19`

Base path: `'/creditnotes'`. Returns: `Promise<ListCreditNotesResponse>`.

Parameters: `params: GetAllCreditNotesPayload = {}`

```ts
{
		const url = generateQueryParams(this.baseUrl, params);
		return await AxiosClient.get<ListCreditNotesResponse>(url);
	}
```

## CreditNoteApi.getCreditNoteById

`src/api/CreditNoteApi.ts:28`

Base path: `'/creditnotes'`. Returns: `Promise<CreditNote>`.

Parameters: `creditNoteId: string`

```ts
{
		return await AxiosClient.get<CreditNote>(`${this.baseUrl}/${creditNoteId}`);
	}
```

## CreditNoteApi.createCreditNote

`src/api/CreditNoteApi.ts:36`

Base path: `'/creditnotes'`. Returns: `Promise<CreditNote>`.

Parameters: `params: CreateCreditNoteParams`

```ts
{
		return await AxiosClient.post<CreditNote, CreateCreditNoteParams>(this.baseUrl, params);
	}
```

## CreditNoteApi.finalizeCreditNote

`src/api/CreditNoteApi.ts:44`

Base path: `'/creditnotes'`. Returns: `Promise<CreditNote>`.

Parameters: `params: ProcessDraftCreditNoteParams`

```ts
{
		return await AxiosClient.post<CreditNote>(`${this.baseUrl}/${params.credit_note_id}/finalize`);
	}
```

## CreditNoteApi.processDraftCreditNote

`src/api/CreditNoteApi.ts:52`

Base path: `'/creditnotes'`. Returns: `Promise<CreditNote>`.

Parameters: `params: ProcessDraftCreditNoteParams`

```ts
{
		return this.finalizeCreditNote(params);
	}
```

## CreditNoteApi.voidCreditNote

`src/api/CreditNoteApi.ts:60`

Base path: `'/creditnotes'`. Returns: `Promise<CreditNote>`.

Parameters: `params: VoidCreditNoteParams`

```ts
{
		const { credit_note_id, ...voidData } = params;
		return await AxiosClient.post<CreditNote>(`${this.baseUrl}/${credit_note_id}/void`, voidData);
	}
```

## CreditNoteApi.getCreditNotesByInvoice

`src/api/CreditNoteApi.ts:69`

Base path: `'/creditnotes'`. Returns: `Promise<ListCreditNotesResponse>`.

Parameters: `invoiceId: string`

```ts
{
		return await this.getCreditNotes({ invoice_id: invoiceId });
	}
```

## CustomerPortalApi.getCustomer

`src/api/CustomerPortalApi.ts:43`

Base path: `'/customer/portal'`. Returns: `Promise<Customer>`.

Parameters:

```ts
{
		return await AxiosClient.get<Customer>(`${this.baseUrl}/info`);
	}
```

## CustomerPortalApi.updateCustomer

`src/api/CustomerPortalApi.ts:50`

Base path: `'/customer/portal'`. Returns: `Promise<Customer>`.

Parameters: `payload: UpdateCustomerRequest`

```ts
{
		return await AxiosClient.put<Customer>(`${this.baseUrl}/info`, payload);
	}
```

## CustomerPortalApi.getUsageSummary

`src/api/CustomerPortalApi.ts:57`

Base path: `'/customer/portal'`. Returns: `Promise<GetUsageSummaryResponse>`.

Parameters: `query?: GetCustomerUsageSummaryRequest`

```ts
{
		const url = generateQueryParams(`${this.baseUrl}/usage`, query || {});
		return await AxiosClient.get<GetUsageSummaryResponse>(url);
	}
```

## CustomerPortalApi.getSubscriptions

`src/api/CustomerPortalApi.ts:65`

Base path: `'/customer/portal'`. Returns: `Promise<ListSubscriptionsResponse>`.

Parameters: `payload: DashboardPaginatedRequest`

```ts
{
		return await AxiosClient.post<ListSubscriptionsResponse>(`${this.baseUrl}/subscriptions`, payload);
	}
```

## CustomerPortalApi.getSubscription

`src/api/CustomerPortalApi.ts:72`

Base path: `'/customer/portal'`. Returns: `Promise<SubscriptionResponse>`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.get<SubscriptionResponse>(`${this.baseUrl}/subscriptions/${id}`);
	}
```

## CustomerPortalApi.getInvoices

`src/api/CustomerPortalApi.ts:79`

Base path: `'/customer/portal'`. Returns: `Promise<GetInvoicesResponse>`.

Parameters: `payload: DashboardPaginatedRequest`

```ts
{
		return await AxiosClient.post<GetInvoicesResponse>(`${this.baseUrl}/invoices`, payload);
	}
```

## CustomerPortalApi.getInvoice

`src/api/CustomerPortalApi.ts:86`

Base path: `'/customer/portal'`. Returns: `Promise<Invoice>`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.get<Invoice>(`${this.baseUrl}/invoices/${id}`);
	}
```

## CustomerPortalApi.getWallets

`src/api/CustomerPortalApi.ts:93`

Base path: `'/customer/portal'`. Returns: `Promise<WalletResponse[]>`.

Parameters:

```ts
{
		return await AxiosClient.post<WalletResponse[]>(`${this.baseUrl}/wallets`, {});
	}
```

## CustomerPortalApi.getWallet

`src/api/CustomerPortalApi.ts:100`

Base path: `'/customer/portal'`. Returns: `Promise<WalletResponse>`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.get<WalletResponse>(`${this.baseUrl}/wallets/${id}`);
	}
```

## CustomerPortalApi.getAnalytics

`src/api/CustomerPortalApi.ts:107`

Base path: `'/customer/portal'`. Returns: `Promise<GetUsageAnalyticsResponse>`.

Parameters: `payload: DashboardAnalyticsRequest`

```ts
{
		return await AxiosClient.post<GetUsageAnalyticsResponse>(`${this.baseUrl}/analytics/revenue`, payload);
	}
```

## CustomerPortalApi.getCostAnalytics

`src/api/CustomerPortalApi.ts:114`

Base path: `'/customer/portal'`. Returns: `Promise<GetDetailedCostAnalyticsResponse>`.

Parameters: `payload: DashboardCostAnalyticsRequest`

```ts
{
		return await AxiosClient.post<GetDetailedCostAnalyticsResponse>(`${this.baseUrl}/analytics/cost`, payload);
	}
```

## CustomerPortalApi.downloadInvoicePdf

`src/api/CustomerPortalApi.ts:121`

Base path: `'/customer/portal'`. Returns: `Promise<void>`.

Parameters: `invoiceId: string`

```ts
{
		const url = generateQueryParams(`${this.baseUrl}/invoices/${invoiceId}/pdf`, { url: true });
		const response = await AxiosClient.get<{ presigned_url: string }>(url);
		const presignedUrl = response.presigned_url;
		window.open(presignedUrl, '_blank');
	}
```

## CustomerPortalApi.getWalletBalance

`src/api/CustomerPortalApi.ts:131`

Base path: `'/customer/portal'`. Returns: `Promise<RealtimeWalletBalance>`.

Parameters: `walletId: string`

```ts
{
		return await AxiosClient.get<RealtimeWalletBalance>(`${this.baseUrl}/wallets/${walletId}`);
	}
```

## CustomerPortalApi.getWalletTransactions

`src/api/CustomerPortalApi.ts:138`

Base path: `'/customer/portal'`. Returns: `Promise<WalletTransactionResponse>`.

Parameters: `payload: {
		walletId: string;
		limit?: number;
		offset?: number;
	}`

```ts
{
		const { walletId, limit = 10, offset = 0 } = payload;
		const url = generateQueryParams(`${this.baseUrl}/wallets/${walletId}/transactions`, { limit, offset });
		return await AxiosClient.get<WalletTransactionResponse>(url);
	}
```

## CustomerPortalApi.topUpWallet

`src/api/CustomerPortalApi.ts:152`

Base path: `'/customer/portal'`. Returns: `Promise<PortalTopUpResponse>`.

Parameters: `walletId: string`; `payload: PortalTopUpRequest`

```ts
{
		return await AxiosClient.post<PortalTopUpResponse>(`${this.baseUrl}/wallets/${walletId}/top-up`, payload);
	}
```

## CustomerPortalApi.updateAutoTopup

`src/api/CustomerPortalApi.ts:160`

Base path: `'/customer/portal'`. Returns: `Promise<unknown>`.

Parameters: `walletId: string`; `payload: PortalAutoTopupRequest`

```ts
{
		return await AxiosClient.put<unknown>(`${this.baseUrl}/wallets/${walletId}/auto-topup`, payload);
	}
```

## CustomerPortalApi.payInvoice

`src/api/CustomerPortalApi.ts:168`

Base path: `'/customer/portal'`. Returns: `Promise<PortalPayInvoiceResponse>`.

Parameters: `invoiceId: string`; `payload: PortalPayInvoiceRequest = {}`

```ts
{
		return await AxiosClient.post<PortalPayInvoiceResponse>(`${this.baseUrl}/invoices/${invoiceId}/pay`, payload);
	}
```

## CustomerPortalApi.getPaymentMethods

`src/api/CustomerPortalApi.ts:176`

Base path: `'/customer/portal'`. Returns: `Promise<SavedPaymentMethodsResponse>`.

Parameters: `query?: PortalListPaymentMethodsQuery`

```ts
{
		const url = generateQueryParams(`${this.baseUrl}/payment-methods`, query || {});
		return await AxiosClient.get<SavedPaymentMethodsResponse>(url);
	}
```

## CustomerPortalApi.addPaymentMethod

`src/api/CustomerPortalApi.ts:185`

Base path: `'/customer/portal'`. Returns: `Promise<AddPaymentMethodResponse>`.

Parameters: `payload: PortalAddPaymentMethodRequest`

```ts
{
		return await AxiosClient.post<AddPaymentMethodResponse>(`${this.baseUrl}/payment-methods`, payload);
	}
```

## CustomerPortalApi.deletePaymentMethod

`src/api/CustomerPortalApi.ts:194`

Base path: `'/customer/portal'`. Returns: `Promise<SavedPaymentMethodsResponse>`.

Parameters: `payload: PortalDeletePaymentMethodRequest`

```ts
{
		return await AxiosClient.post<SavedPaymentMethodsResponse>(`${this.baseUrl}/payment-methods/delete`, payload);
	}
```

## CustomerPortalApi.setDefaultPaymentMethod

`src/api/CustomerPortalApi.ts:199`

Base path: `'/customer/portal'`. Returns: `Promise<SavedPaymentMethodsResponse>`.

Parameters: `payload: PortalSetDefaultPaymentMethodRequest`

```ts
{
		return await AxiosClient.post<SavedPaymentMethodsResponse>(`${this.baseUrl}/payment-methods/default`, payload);
	}
```

## CustomerPortalApi.getIntegrations

`src/api/CustomerPortalApi.ts:207`

Base path: `'/customer/portal'`. Returns: `Promise<PortalIntegrationsResponse>`.

Parameters:

```ts
{
		return await AxiosClient.get<PortalIntegrationsResponse>(`${this.baseUrl}/integrations`);
	}
```

## CustomerPortalApi.getCheckoutSession

`src/api/CustomerPortalApi.ts:212`

Base path: `'/customer/portal'`. Returns: `Promise<PortalCheckoutSession>`.

Parameters: `sessionId: string`

```ts
{
		return await AxiosClient.get<PortalCheckoutSession>(`${this.baseUrl}/checkout-sessions/${sessionId}`);
	}
```

## CustomerPortalApi.cancelCheckoutSession

`src/api/CustomerPortalApi.ts:216`

Base path: `'/customer/portal'`. Returns: `Promise<PortalCheckoutSession>`.

Parameters: `sessionId: string`

```ts
{
		return await AxiosClient.post<PortalCheckoutSession>(`${this.baseUrl}/checkout-sessions/${sessionId}/cancel`, {});
	}
```

## CustomerPortalApi.getConfig

`src/api/CustomerPortalApi.ts:225`

Base path: `'/customer/portal'`. Returns: `Promise<PortalConfig>`.

Parameters:

```ts
{
		try {
			const response = await AxiosClient.get<{ value: Partial<PortalConfig> }>(`${this.baseUrl}/config`);
			if (response?.value) {
				return deepMergePortalConfig(DEFAULT_PORTAL_CONFIG, response.value);
			}
			return DEFAULT_PORTAL_CONFIG;
		} catch {
			// No config stored yet or network error — use bundled defaults silently
			return DEFAULT_PORTAL_CONFIG;
		}
	}
```

## DashboardApi.getRevenues

`src/api/DashboardApi.ts:69`

Base path: `'/dashboard'`. Returns: `Promise<DashboardRevenuesResponse>`.

Parameters: `payload?: DashboardRevenuesRequest`

```ts
{
		// Transform nested request format to flat format if needed
		const requestPayload = payload?.revenue_trend
			? {
					window_size: payload.revenue_trend.window_size || 'MONTH',
					window_count: payload.revenue_trend.window_count || 3,
				}
			: {
					window_size: 'MONTH',
					window_count: 3,
				};
		return await AxiosClient.post<DashboardRevenuesResponse>(`${this.baseUrl}/revenues`, requestPayload);
	}
```

## EntityIntegrationMappingApi.createEntityIntegrationMapping

`src/api/EntityIntegrationMappingApi.ts:37`

Base path: `'/entity-integration-mappings'`. Returns: `Promise<EntityIntegrationMapping>`.

Parameters: `data: CreateEntityIntegrationMappingRequest`

```ts
{
		return await AxiosClient.post<EntityIntegrationMapping>(this.baseUrl, data);
	}
```

## EntityIntegrationMappingApi.listEntityIntegrationMappings

`src/api/EntityIntegrationMappingApi.ts:45`

Base path: `'/entity-integration-mappings'`. Returns: `Promise<ListEntityIntegrationMappingsResponse>`.

Parameters: `payload: Pagination = { limit: 10, offset: 0 }`

```ts
{
		const url = generateQueryParams(this.baseUrl, payload);
		return await AxiosClient.get<ListEntityIntegrationMappingsResponse>(url);
	}
```

## EntityIntegrationMappingApi.getEntityIntegrationMapping

`src/api/EntityIntegrationMappingApi.ts:56`

Base path: `'/entity-integration-mappings'`. Returns: `Promise<EntityIntegrationMapping>`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.get<EntityIntegrationMapping>(`${this.baseUrl}/${id}`);
	}
```

## EntityIntegrationMappingApi.deleteEntityIntegrationMapping

`src/api/EntityIntegrationMappingApi.ts:64`

Base path: `'/entity-integration-mappings'`. Returns: `Promise<void>`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.delete<void>(`${this.baseUrl}/${id}`);
	}
```

## EventsApi.getRawEvents

`src/api/EventsApi.ts:24`

Base path: `'/events'`. Returns: `Promise<GetEventsResponse>`.

Parameters: `payload: GetEventsPayload`

```ts
{
		const url = generateQueryParams(EventsApi.baseUrl, payload);
		return await AxiosClient.get<GetEventsResponse>(url);
	}
```

## EventsApi.getEventDebug

`src/api/EventsApi.ts:33`

Base path: `'/events'`. Returns: `Promise<GetEventDebugResponse>`.

Parameters: `eventId: string`

```ts
{
		const url = generateQueryParams(`${EventsApi.baseUrl}/lookup`, { id: eventId });
		return await AxiosClient.get<GetEventDebugResponse>(url);
	}
```

## EventsApi.queryEvents

`src/api/EventsApi.ts:42`

Base path: `'/events'`. Returns: `Promise<GetEventsResponse>`.

Parameters: `payload: GetEventsRequest`

```ts
{
		return await AxiosClient.post<GetEventsResponse>(`${EventsApi.baseUrl}/query`, payload);
	}
```

## EventsApi.getUsageByMeter

`src/api/EventsApi.ts:46`

Base path: `'/events'`. Returns: `Promise<GetUsageByMeterResponse>`.

Parameters: `payload: GetUsageByMeterPayload`

```ts
{
		return await AxiosClient.post<GetUsageByMeterResponse>(`${EventsApi.baseUrl}/usage/meter`, {
			...payload,
		});
	}
```

## EventsApi.getUsage

`src/api/EventsApi.ts:56`

Base path: `'/events'`. Returns: `Promise<GetUsageResponse>`.

Parameters: `payload: GetUsageRequest`

```ts
{
		return await AxiosClient.post<GetUsageResponse>(`${EventsApi.baseUrl}/usage`, payload);
	}
```

## EventsApi.fireEvents

`src/api/EventsApi.ts:64`

Base path: `'/events'`. Returns: `Promise<void>`.

Parameters: `payload: FireEventsPayload`

```ts
{
		return await AxiosClient.post<void>(`/portal/onboarding/events`, {
			...payload,
		});
	}
```

## EventsApi.getUsageAnalytics

`src/api/EventsApi.ts:74`

Base path: `'/events'`. Returns: `Promise<GetUsageAnalyticsResponse>`.

Parameters: `payload: GetUsageAnalyticsRequest`

```ts
{
		return await AxiosClient.post<GetUsageAnalyticsResponse>(`${EventsApi.baseUrl}/analytics`, payload);
	}
```

## EventsApi.getUsageAnalyticsV2

`src/api/EventsApi.ts:82`

Base path: `'/events'`. Returns: `Promise<GetUsageAnalyticsResponse>`.

Parameters: `payload: GetUsageAnalyticsRequest`

```ts
{
		return await AxiosClient.post<GetUsageAnalyticsResponse>(`${EventsApi.baseUrl}/analytics-v2`, payload);
	}
```

## EventsApi.getMonitoringData

`src/api/EventsApi.ts:90`

Base path: `'/events'`. Returns: `Promise<GetMonitoringDataResponse>`.

Parameters: `payload: GetMonitoringDataRequest`

```ts
{
		const url = generateQueryParams(`${EventsApi.baseUrl}/monitoring`, payload);
		return await AxiosClient.get<GetMonitoringDataResponse>(url);
	}
```

## EventsApi.getHuggingFaceBillingData

`src/api/EventsApi.ts:99`

Base path: `'/events'`. Returns: `Promise<GetHuggingFaceBillingDataResponse>`.

Parameters: `payload: GetHuggingFaceBillingDataRequest`

```ts
{
		return await AxiosClient.post<GetHuggingFaceBillingDataResponse>(`${EventsApi.baseUrl}/huggingface-billing`, payload);
	}
```

## ExportRunApi.getAllExportRuns

`src/api/ExportRunApi.ts:38`

Base path: `'/export-runs'`. Returns: `Promise<GetExportRunsResponse>`.

Parameters: `payload: GetExportRunsPayload = {}`

```ts
{
		const url = generateQueryParams(this.baseUrl, payload);
		return await AxiosClient.get<GetExportRunsResponse>(url);
	}
```

## ExportRunApi.getExportRunById

`src/api/ExportRunApi.ts:43`

Base path: `'/export-runs'`. Returns: `Promise<ExportRun>`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.get<ExportRun>(`${this.baseUrl}/${id}`);
	}
```

## ExportRunApi.getExportRunsByTaskId

`src/api/ExportRunApi.ts:47`

Base path: `'/export-runs'`. Returns: `Promise<GetExportRunsResponse>`.

Parameters: `taskId: string`; `payload: Omit<GetExportRunsPayload, 'scheduled_task_id'> = {}`

```ts
{
		return await this.getAllExportRuns({ ...payload, scheduled_task_id: taskId });
	}
```

## IntegrationsApi.installIntegration

`src/api/IntegrationsApi.ts:6`

Base path: `'/secrets/integrations'`. Returns: `None`.

Parameters: `request: CreateIntegrationRequest`

```ts
{
		return await AxiosClient.post(`${this.baseUrl}/${request.provider}`, request);
	}
```

## IntegrationsApi.getIntegration

`src/api/IntegrationsApi.ts:10`

Base path: `'/secrets/integrations'`. Returns: `None`.

Parameters: `provider: string`

```ts
{
		return await AxiosClient.get<IntegrationResponse>(`${this.baseUrl}/by-provider/${provider}`);
	}
```

## IntegrationsApi.getLinkedInIntegration

`src/api/IntegrationsApi.ts:14`

Base path: `'/secrets/integrations'`. Returns: `None`.

Parameters:

```ts
{
		return await AxiosClient.get<LinkedinIntegrationResponse>(`${this.baseUrl}/linked`);
	}
```

## IntegrationsApi.uninstallIntegration

`src/api/IntegrationsApi.ts:18`

Base path: `'/secrets/integrations'`. Returns: `None`.

Parameters: `provider: string`

```ts
{
		return await AxiosClient.delete(`${this.baseUrl}/${provider}`);
	}
```

## InvoiceApi.listInvoices

`src/api/InvoiceApi.ts:35`

Base path: `None`. Returns: `Promise<GetInvoicesResponse>`.

Parameters: `filter: InvoiceFilter = {}`

```ts
{
		return await AxiosClient.post<GetInvoicesResponse>(`${this.baseurl}/search`, filter);
	}
```

## InvoiceApi.getCustomerInvoices

`src/api/InvoiceApi.ts:40`

Base path: `None`. Returns: `Promise<GetInvoicesListResponse>`.

Parameters: `customerId: string`; `pagination?: { limit: number; offset: number }`

```ts
{
		return await AxiosClient.post<GetInvoicesListResponse>(`${this.baseurl}/search`, {
			customer_id: customerId,
			// Explicitly include all known invoice statuses; backend defaults may exclude some (e.g. SKIPPED).
			invoice_status: Object.values(INVOICE_STATUS),
			skip_line_items: true,
			sort: [
				{
					field: 'period_start',
					direction: SortDirection.DESC,
				},
			],
			...pagination,
		});
	}
```

## InvoiceApi.getInvoiceById

`src/api/InvoiceApi.ts:59`

Base path: `None`. Returns: `Promise<Invoice>`.

Parameters: `invoiceId: string`

```ts
{
		return await AxiosClient.get<Invoice>(`${this.baseurl}/${invoiceId}`);
	}
```

## InvoiceApi.updateInvoicePaymentStatus

`src/api/InvoiceApi.ts:63`

Base path: `None`. Returns: `Promise<Invoice>`.

Parameters: `invoiceId: string`; `payload: UpdatePaymentStatusPayload`

```ts
{
		return await AxiosClient.put<Invoice>(`${this.baseurl}/${invoiceId}/payment`, payload);
	}
```

## InvoiceApi.updateInvoiceStatus

`src/api/InvoiceApi.ts:67`

Base path: `None`. Returns: `Promise<Invoice>`.

Parameters: `payload: UpdateInvoiceStatusPayload`

```ts
{
		return await AxiosClient.put<Invoice>(`${this.baseurl}/${payload.invoiceId}/status`, payload);
	}
```

## InvoiceApi.voidInvoice

`src/api/InvoiceApi.ts:71`

Base path: `None`. Returns: `None`.

Parameters: `invoiceId: string`; `payload?: VoidInvoicePayload`

```ts
{
		return await AxiosClient.post(`${this.baseurl}/${invoiceId}/void`, payload);
	}
```

## InvoiceApi.finalizeInvoice

`src/api/InvoiceApi.ts:75`

Base path: `None`. Returns: `None`.

Parameters: `invoiceId: string`

```ts
{
		return await AxiosClient.post(`${this.baseurl}/${invoiceId}/finalize`);
	}
```

## InvoiceApi.attemptPayment

`src/api/InvoiceApi.ts:79`

Base path: `None`. Returns: `None`.

Parameters: `invoiceId: string`

```ts
{
		return await AxiosClient.post(`${this.baseurl}/${invoiceId}/payment/attempt`);
	}
```

## InvoiceApi.getInvoicePreview

`src/api/InvoiceApi.ts:83`

Base path: `None`. Returns: `None`.

Parameters: `payload: GetInvoicePreviewPayload`

```ts
{
		return await AxiosClient.post<Invoice>(`${this.baseurl}/preview`, payload);
	}
```

## InvoiceApi.createInvoice

`src/api/InvoiceApi.ts:87`

Base path: `None`. Returns: `Promise<Invoice>`.

Parameters: `payload: CreateInvoicePayload`

```ts
{
		return await AxiosClient.post<Invoice>(`${this.baseurl}`, payload);
	}
```

## InvoiceApi.updateInvoice

`src/api/InvoiceApi.ts:92`

Base path: `None`. Returns: `Promise<Invoice>`.

Parameters: `invoiceId: string`; `payload: UpdateInvoicePayload`

```ts
{
		return await AxiosClient.put<Invoice>(`${this.baseurl}/${invoiceId}`, payload);
	}
```

## InvoiceApi.modifyInvoice

`src/api/InvoiceApi.ts:101`

Base path: `None`. Returns: `Promise<InvoiceModifyResponse>`.

Parameters: `invoiceId: string`; `payload: ExecuteInvoiceModifyPayload`

```ts
{
		return await AxiosClient.post<InvoiceModifyResponse>(`${this.baseurl}/${invoiceId}/modify/execute`, payload);
	}
```

## InvoiceApi.recalculateInvoice

`src/api/InvoiceApi.ts:105`

Base path: `None`. Returns: `Promise<RecalculateInvoiceResponse>`.

Parameters: `invoiceId: string`

```ts
{
		return await AxiosClient.post<RecalculateInvoiceResponse>(`${this.baseurl}/${invoiceId}/recalculate`);
	}
```

## InvoiceApi.getInvoicePdf

`src/api/InvoiceApi.ts:109`

Base path: `None`. Returns: `None`.

Parameters: `invoiceId: string`; `invoiceNo?: string`

```ts
{
		const downloadFileName = invoiceNo ? `invoice-${invoiceNo}.pdf` : `invoice-${invoiceId}.pdf`;

		const response = await fetch(`${config.api.baseUrl}${this.baseurl}/${invoiceId}/pdf`, {
			headers: {
				Authorization: `Bearer ${await AuthService.getAcessToken()}`,
				'X-Environment-ID': EnvironmentApi.getActiveEnvironmentId() || '',
				Accept: 'application/pdf',
			},
		});

		if (!response.ok) {
			throw new Error('Failed to fetch PDF');
		}

		const arrayBuffer = await response.arrayBuffer();
		const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
		const url = window.URL.createObjectURL(blob);

		// Create a temporary link element
		const link = document.createElement('a');
		link.href = url;
		link.download = downloadFileName;

		// Append to body, click and remove
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		// Clean up the URL object
		window.URL.revokeObjectURL(url);
	}
```

## InvoiceApi.downloadInvoicePdf

`src/api/InvoiceApi.ts:142`

Base path: `None`. Returns: `None`.

Parameters: `invoiceId: string`

```ts
{
		const params = { url: true };
		const url = generateQueryParams(`${this.baseurl}/${invoiceId}/pdf`, params);
		const response = await AxiosClient.get<{ presigned_url: string }>(url);
		const presignedUrl = response.presigned_url;

		window.open(presignedUrl, '_blank');
	}
```

## InvoiceApi.downloadInvoiceCsv

`src/api/InvoiceApi.ts:152`

Base path: `None`. Returns: `number`.

Parameters: `invoice: Invoice`

```ts
{
		return downloadInvoiceLineItemsCsv(invoice);
	}
```

## InvoiceApi.triggerCommunication

`src/api/InvoiceApi.ts:156`

Base path: `None`. Returns: `None`.

Parameters: `invoiceId: string`

```ts
{
		return await AxiosClient.post(`${this.baseurl}/${invoiceId}/comms/trigger`);
	}
```

## MeterApi.createMeter

`src/api/MeterApi.ts:8`

Base path: `'/meters'`. Returns: `None`.

Parameters: `data: CreateMeterRequest`

```ts
{
		return await AxiosClient.post<MeterResponse, CreateMeterRequest>(this.baseUrl, data);
	}
```

## MeterApi.getAllMeters

`src/api/MeterApi.ts:12`

Base path: `'/meters'`. Returns: `None`.

Parameters: `{ limit, offset }: Pagination`

```ts
{
		return await AxiosClient.get<GetAllMetersResponse>(`${this.baseUrl}?limit=${limit}&offset=${offset}`);
	}
```

## MeterApi.getAllActiveMeters

`src/api/MeterApi.ts:16`

Base path: `'/meters'`. Returns: `None`.

Parameters:

```ts
{
		return await AxiosClient.get<GetAllMetersResponse>(`${this.baseUrl}?status=published&limit=1000`);
	}
```

## MeterApi.getMeterById

`src/api/MeterApi.ts:20`

Base path: `'/meters'`. Returns: `None`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.get<MeterResponse>(`${this.baseUrl}/${id}`);
	}
```

## MeterApi.updateMeter

`src/api/MeterApi.ts:24`

Base path: `'/meters'`. Returns: `None`.

Parameters: `id: string`; `data: UpdateMeterRequest`

```ts
{
		return await AxiosClient.put<MeterResponse, UpdateMeterRequest>(`${this.baseUrl}/${id}`, data);
	}
```

## MeterApi.deleteMeter

`src/api/MeterApi.ts:28`

Base path: `'/meters'`. Returns: `None`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.delete<void>(`${this.baseUrl}/${id}`);
	}
```

## MeterApi.disableMeter

`src/api/MeterApi.ts:32`

Base path: `'/meters'`. Returns: `None`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.post<void>(`${this.baseUrl}/${id}/disable`);
	}
```

## MeterApi.listMeters

`src/api/MeterApi.ts:36`

Base path: `'/meters'`. Returns: `None`.

Parameters: `{ limit, offset }: Pagination`

```ts
{
		return await AxiosClient.get<ListMetersResponse>(`${this.baseUrl}?limit=${limit}&offset=${offset}`);
	}
```

## OnboardingApi.generateEvents

`src/api/OnboardingApi.ts:27`

Base path: `'/portal/onboarding'`. Returns: `Promise<void>`.

Parameters: `payload: FireEventsPayload`

```ts
{
		return await AxiosClient.post<void>(`${this.baseUrl}/events`, payload);
	}
```

## OnboardingApi.setupDemo

`src/api/OnboardingApi.ts:35`

Base path: `'/portal/onboarding'`. Returns: `Promise<SetupDemoResponse>`.

Parameters: `payload: SetupDemoRequest`

```ts
{
		return await AxiosClient.post<SetupDemoResponse>(`${this.baseUrl}/setup`, payload);
	}
```

## OnboardingApi.recordOnboardingData

`src/api/OnboardingApi.ts:43`

Base path: `'/portal/onboarding'`. Returns: `Promise<void>`.

Parameters: `payload: OnboardingDataRequest`

```ts
{
		const webAppUrl = config.integrations.googleSheetsWebAppUrl;

		if (!webAppUrl) {
			console.warn('VITE_GOOGLE_SHEETS_WEB_APP_URL is not configured. Skipping onboarding data recording.');
			return;
		}

		// Use a "simple" fetch request to avoid CORS preflight (OPTIONS) where possible.
		// Note: `Content-Type: application/json` would trigger a preflight in browsers.
		const controller = new AbortController();
		const timeoutId = window.setTimeout(() => controller.abort(), 10_000);

		try {
			const res = await fetch(webAppUrl, {
				method: 'POST',
				headers: {
					// Keep request "simple" to reduce preflight chances (Google Apps Script can still read raw body).
					'Content-Type': 'text/plain;charset=UTF-8',
				},
				body: JSON.stringify(payload),
				signal: controller.signal,
			});

			// This is non-critical telemetry; don't hard-fail onboarding on sheet issues.
			if (!res.ok) {
				const text = await res.text().catch(() => '');
				console.warn('Failed to record onboarding data to Google Sheets.', {
					status: res.status,
					statusText: res.statusText,
					body: text,
				});
			}
		} catch (err) {
			console.warn('Failed to record onboarding data to Google Sheets.', err);
		} finally {
			window.clearTimeout(timeoutId);
		}
	}
```

## OAuthApi.InitiateOAuth

`src/api/OAuthApi.ts:69`

Base path: `'/oauth'`. Returns: `Promise<InitiateOAuthResponse>`.

Parameters: `payload: InitiateOAuthRequest`

```ts
{
		return await AxiosClient.post<InitiateOAuthResponse>(`${this.baseUrl}/init`, payload);
	}
```

## OAuthApi.CompleteOAuth

`src/api/OAuthApi.ts:82`

Base path: `'/oauth'`. Returns: `Promise<CompleteOAuthResponse>`.

Parameters: `payload: CompleteOAuthRequest`

```ts
{
		return await AxiosClient.post<CompleteOAuthResponse>(`${this.baseUrl}/complete`, payload);
	}
```

## PaymentApi.createPayment

`src/api/PaymentApi.ts:9`

Base path: `'/payments'`. Returns: `None`.

Parameters: `data: RecordPaymentPayload`

```ts
{
		return await AxiosClient.post<Payment>(this.baseUrl, data);
	}
```

## PaymentApi.getPaymentById

`src/api/PaymentApi.ts:13`

Base path: `'/payments'`. Returns: `None`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.get<Payment>(`${this.baseUrl}/${id}`);
	}
```

## PaymentApi.updatePayment

`src/api/PaymentApi.ts:17`

Base path: `'/payments'`. Returns: `None`.

Parameters: `id: string`; `data: Partial<Payment>`

```ts
{
		return await AxiosClient.put<Payment>(`${this.baseUrl}/${id}`, data);
	}
```

## PaymentApi.deletePayment

`src/api/PaymentApi.ts:21`

Base path: `'/payments'`. Returns: `None`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.delete(`${this.baseUrl}/${id}`);
	}
```

## PaymentApi.getAllPayments

`src/api/PaymentApi.ts:25`

Base path: `'/payments'`. Returns: `None`.

Parameters: `payload: GetAllPaymentsPayload`

```ts
{
		const url = generateQueryParams(this.baseUrl, payload);
		return await AxiosClient.get<GetAllPaymentsResponse>(url);
	}
```

## PaymentApi.createSetupIntent

`src/api/PaymentApi.ts:30`

Base path: `'/payments'`. Returns: `None`.

Parameters: `customerId: string`; `data: {
			success_url: string;
			cancel_url: string;
			provider: string;
			set_default?: boolean;
		}`

```ts
{
		return await AxiosClient.post<{
			setup_intent_id: string;
			checkout_session_id: string;
			checkout_url: string;
			client_secret: string;
			status: string;
			usage: string;
			customer_id: string;
			created_at: number;
			expires_at: number;
		}>(`${this.baseUrl}/customers/${customerId}/setup/intent`, data);
	}
```

## PaymentApi.getMoyasarSetupIntent

`src/api/PaymentApi.ts:52`

Base path: `'/payments'`. Returns: `None`.

Parameters: `customerId: string`; `successUrl?: string`

```ts
{
		return await AxiosClient.post<{
			status: string;
			customer_id: string;
			checkout_url: string;
		}>(`${this.baseUrl}/customers/${customerId}/setup/intent`, {
			provider: 'moyasar',
			success_url: successUrl ?? window.location.origin,
		});
	}
```

## PaymentApi.processPayment

`src/api/PaymentApi.ts:63`

Base path: `'/payments'`. Returns: `Promise<Payment>`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.post<Payment>(`${this.baseUrl}/${id}/process`);
	}
```

## PaymentApi.getCustomerPaymentMethods

`src/api/PaymentApi.ts:67`

Base path: `'/payments'`. Returns: `None`.

Parameters: `customerId: string`

```ts
{
		return await AxiosClient.get(`${this.baseUrl}/customers/${customerId}/methods`);
	}
```

## PlanApi.createPlan

`src/api/PlanApi.ts:28`

Base path: `'/plans'`. Returns: `None`.

Parameters: `data: CreatePlanRequest`

```ts
{
		return await AxiosClient.post<CreatePlanResponse, CreatePlanRequest>(this.baseUrl, data);
	}
```

## PlanApi.getPlansByFilter

`src/api/PlanApi.ts:36`

Base path: `'/plans'`. Returns: `None`.

Parameters: `payload: GetPlansByFilterPayload = {}`

```ts
{
		const { limit = 10, offset = 0, filters = [], sort = [] } = payload;

		const requestPayload = {
			...payload,
			limit,
			offset,
			filters,
			sort,
		};

		return await AxiosClient.post<GetAllPlansResponse>(`${this.baseUrl}/search`, requestPayload);
	}
```

## PlanApi.getPlanById

`src/api/PlanApi.ts:50`

Base path: `'/plans'`. Returns: `None`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.get<PlanResponse>(`${this.baseUrl}/${id}`);
	}
```

## PlanApi.updatePlan

`src/api/PlanApi.ts:54`

Base path: `'/plans'`. Returns: `None`.

Parameters: `id: string`; `data: UpdatePlanRequest`

```ts
{
		return await AxiosClient.put<PlanResponse, UpdatePlanRequest>(`${this.baseUrl}/${id}`, data);
	}
```

## PlanApi.deletePlan

`src/api/PlanApi.ts:58`

Base path: `'/plans'`. Returns: `None`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.delete<void>(`${this.baseUrl}/${id}`);
	}
```

## PlanApi.clonePlan

`src/api/PlanApi.ts:62`

Base path: `'/plans'`. Returns: `None`.

Parameters: `id: string`; `data: ClonePlanRequest`

```ts
{
		return await AxiosClient.post<PlanResponse, ClonePlanRequest>(`${this.baseUrl}/${id}/clone`, data);
	}
```

## PlanApi.synchronizePlanPricesWithSubscription

`src/api/PlanApi.ts:66`

Base path: `'/plans'`. Returns: `None`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.post<SynchronizePlanPricesWithSubscriptionResponse>(`${this.baseUrl}/${id}/sync/subscriptions`);
	}
```

## PriceApi.ListPrices

`src/api/PriceApi.ts:24`

Base path: `'/prices'`. Returns: `None`.

Parameters: `filters?: PriceFilter`

```ts
{
		const url = filters ? generateQueryParams(this.baseUrl, filters) : this.baseUrl;
		return await AxiosClient.get<GetAllPricesResponse>(url);
	}
```

## PriceApi.GetPriceById

`src/api/PriceApi.ts:34`

Base path: `'/prices'`. Returns: `None`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.get<PriceResponse>(`${this.baseUrl}/${id}`);
	}
```

## PriceApi.CreatePrice

`src/api/PriceApi.ts:44`

Base path: `'/prices'`. Returns: `None`.

Parameters: `data: CreatePriceRequest`

```ts
{
		return await AxiosClient.post<PriceResponse>(this.baseUrl, data);
	}
```

## PriceApi.CreateBulkPrice

`src/api/PriceApi.ts:54`

Base path: `'/prices'`. Returns: `None`.

Parameters: `data: CreateBulkPriceRequest`

```ts
{
		return await AxiosClient.post<CreateBulkPriceResponse>(`${this.baseUrl}/bulk`, data);
	}
```

## PriceApi.UpdatePrice

`src/api/PriceApi.ts:66`

Base path: `'/prices'`. Returns: `None`.

Parameters: `id: string`; `data: UpdatePriceRequest`

```ts
{
		// allowEmptyKeys so that group_id: '' is sent when user selects "None" to clear the group
		return await AxiosClient.put<PriceResponse>(`${this.baseUrl}/${id}`, data, { allowEmptyKeys: ['group_id'] });
	}
```

## PriceApi.DeletePrice

`src/api/PriceApi.ts:77`

Base path: `'/prices'`. Returns: `None`.

Parameters: `id: string`; `data?: DeletePriceRequest`

```ts
{
		return await AxiosClient.delete<void>(`${this.baseUrl}/${id}`, data || {});
	}
```

## PriceApi.searchPrices

`src/api/PriceApi.ts:86`

Base path: `'/prices'`. Returns: `None`.

Parameters: `payload: SearchPricesRequest`

```ts
{
		return await AxiosClient.post<SearchPricesResponse>(`${this.baseUrl}/search`, payload);
	}
```

## PriceUnitApi.CreatePriceUnit

`src/api/PriceUnitApi.ts:20`

Base path: `'/prices/units'`. Returns: `None`.

Parameters: `data: CreatePriceUnitRequest`

```ts
{
		return await AxiosClient.post<CreatePriceUnitResponse>(this.baseUrl, data);
	}
```

## PriceUnitApi.ListPriceUnits

`src/api/PriceUnitApi.ts:29`

Base path: `'/prices/units'`. Returns: `None`.

Parameters: `filters?: PriceUnitFilter`

```ts
{
		const url = filters ? generateQueryParams(this.baseUrl, filters) : this.baseUrl;
		return await AxiosClient.get<ListPriceUnitsResponse>(url);
	}
```

## PriceUnitApi.GetPriceUnit

`src/api/PriceUnitApi.ts:39`

Base path: `'/prices/units'`. Returns: `None`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.get<PriceUnitResponse>(`${this.baseUrl}/${id}`);
	}
```

## PriceUnitApi.GetPriceUnitByCode

`src/api/PriceUnitApi.ts:48`

Base path: `'/prices/units'`. Returns: `None`.

Parameters: `code: string`

```ts
{
		return await AxiosClient.get<PriceUnitResponse>(`${this.baseUrl}/code/${code}`);
	}
```

## PriceUnitApi.UpdatePriceUnit

`src/api/PriceUnitApi.ts:58`

Base path: `'/prices/units'`. Returns: `None`.

Parameters: `id: string`; `data: UpdatePriceUnitRequest`

```ts
{
		return await AxiosClient.put<PriceUnitResponse>(`${this.baseUrl}/${id}`, data);
	}
```

## PriceUnitApi.DeletePriceUnit

`src/api/PriceUnitApi.ts:67`

Base path: `'/prices/units'`. Returns: `None`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.delete<void>(`${this.baseUrl}/${id}`);
	}
```

## PriceUnitApi.ListPriceUnitsByFilter

`src/api/PriceUnitApi.ts:76`

Base path: `'/prices/units'`. Returns: `None`.

Parameters: `filter: PriceUnitFilter`

```ts
{
		return await AxiosClient.post<ListPriceUnitsResponse>(`${this.baseUrl}/search`, filter);
	}
```

## SecretKeysApi.getAllSecretKeys

`src/api/SecretKeysApi.ts:24`

Base path: `'/secrets/api/keys'`. Returns: `None`.

Parameters: `pagination: Pagination`

```ts
{
		const url = generateQueryParams(this.baseUrl, pagination);
		return await AxiosClient.get<GetAllSecretKeysResponse>(url);
	}
```

## SecretKeysApi.getSecretKeyById

`src/api/SecretKeysApi.ts:29`

Base path: `'/secrets/api/keys'`. Returns: `None`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.get<SecretKey>(`${this.baseUrl}/${id}`);
	}
```

## SecretKeysApi.createSecretKey

`src/api/SecretKeysApi.ts:33`

Base path: `'/secrets/api/keys'`. Returns: `None`.

Parameters: `data: CreateSecretKeyPayload`

```ts
{
		return await AxiosClient.post<CreateSecretKeyResponse>(this.baseUrl, data);
	}
```

## SecretKeysApi.deleteSecretKey

`src/api/SecretKeysApi.ts:37`

Base path: `'/secrets/api/keys'`. Returns: `None`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.delete(`${this.baseUrl}/${id}`);
	}
```

## SettingsApi.getSettingByKey

`src/api/SettingsApi.ts:22`

Base path: `'/settings'`. Returns: `Promise<Setting>`.

Parameters: `key: string`

```ts
{
		return await AxiosClient.get<Setting>(`${this.baseUrl}/${key}`);
	}
```

## SettingsApi.updateSettingByKey

`src/api/SettingsApi.ts:30`

Base path: `'/settings'`. Returns: `Promise<Setting>`.

Parameters: `key: string`; `data: UpdateSettingRequest`

```ts
{
		return await AxiosClient.put<Setting>(`${this.baseUrl}/${key}`, data);
	}
```

## SettingsApi.deleteSettingByKey

`src/api/SettingsApi.ts:38`

Base path: `'/settings'`. Returns: `Promise<void>`.

Parameters: `key: string`

```ts
{
		return await AxiosClient.delete<void>(`${this.baseUrl}/${key}`);
	}
```

## SettingsApi.resetSettingToDefaults

`src/api/SettingsApi.ts:46`

Base path: `'/settings'`. Returns: `Promise<Setting>`.

Parameters: `key: string`

```ts
{
		try {
			await this.deleteSettingByKey(key);
		} catch (error) {
			if (!isHttpNotFoundError(error)) throw error;
		}

		return this.getSettingByKey(key);
	}
```

## TaskApi.addTask

`src/api/TaskApi.ts:21`

Base path: `'/tasks'`. Returns: `None`.

Parameters: `data: AddTaskPayload`

```ts
{
		return await AxiosClient.post<ImportTask, AddTaskPayload>(`${this.baseUrl}`, data);
	}
```

## TaskApi.getTaskById

`src/api/TaskApi.ts:25`

Base path: `'/tasks'`. Returns: `Promise<ImportTask>`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.get(`${this.baseUrl}/${id}`);
	}
```

## TaskApi.updateTaskStatus

`src/api/TaskApi.ts:29`

Base path: `'/tasks'`. Returns: `Promise<ImportTask>`.

Parameters: `id: string`; `status: string`

```ts
{
		return await AxiosClient.put<ImportTask>(`${this.baseUrl}/${id}/status`, { status });
	}
```

## TaskApi.getAllTasks

`src/api/TaskApi.ts:33`

Base path: `'/tasks'`. Returns: `Promise<GetTasksResponse>`.

Parameters: `payload: GetTasksPayload = {}`

```ts
{
		const url = generateQueryParams(this.baseUrl, payload);
		return await AxiosClient.get(url);
	}
```

## TaskApi.getAllScheduledTasks

`src/api/TaskApi.ts:39`

Base path: `'/tasks'`. Returns: `Promise<GetScheduledTasksResponse>`.

Parameters: `payload: GetScheduledTasksPayload = {}`

```ts
{
		const url = generateQueryParams(this.scheduledBaseUrl, payload);
		return await AxiosClient.get<GetScheduledTasksResponse>(url);
	}
```

## TaskApi.getScheduledTaskById

`src/api/TaskApi.ts:44`

Base path: `'/tasks'`. Returns: `Promise<ScheduledTask>`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.get<ScheduledTask>(`${this.scheduledBaseUrl}/${id}`);
	}
```

## TaskApi.createScheduledTask

`src/api/TaskApi.ts:48`

Base path: `'/tasks'`. Returns: `Promise<ScheduledTask>`.

Parameters: `payload: CreateScheduledTaskPayload`

```ts
{
		return await AxiosClient.post<ScheduledTask>(this.scheduledBaseUrl, payload);
	}
```

## TaskApi.updateScheduledTask

`src/api/TaskApi.ts:52`

Base path: `'/tasks'`. Returns: `Promise<ScheduledTask>`.

Parameters: `id: string`; `payload: UpdateScheduledTaskPayload`

```ts
{
		return await AxiosClient.put<ScheduledTask>(`${this.scheduledBaseUrl}/${id}`, payload);
	}
```

## TaskApi.deleteScheduledTask

`src/api/TaskApi.ts:56`

Base path: `'/tasks'`. Returns: `Promise<void>`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.delete(`${this.scheduledBaseUrl}/${id}`);
	}
```

## TaskApi.forceRunScheduledTask

`src/api/TaskApi.ts:60`

Base path: `'/tasks'`. Returns: `Promise<void>`.

Parameters: `id: string`; `payload?: ForceRunPayload`

```ts
{
		return await AxiosClient.post(`${this.scheduledBaseUrl}/${id}/run`, payload || {});
	}
```

## TaskApi.downloadTaskFile

`src/api/TaskApi.ts:65`

Base path: `'/tasks'`. Returns: `Promise<DownloadTaskFileResponse>`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.get<DownloadTaskFileResponse>(`${this.baseUrl}/${id}/download`);
	}
```

## TaskRunApi.getAllTaskRuns

`src/api/TaskRunApi.ts:54`

Base path: `'/tasks'`. Returns: `Promise<GetTaskRunsResponse>`.

Parameters: `payload: GetTaskRunsPayload = {}`

```ts
{
		const url = generateQueryParams(this.baseUrl, payload);
		return await AxiosClient.get<GetTaskRunsResponse>(url);
	}
```

## TaskRunApi.getTaskRunById

`src/api/TaskRunApi.ts:59`

Base path: `'/tasks'`. Returns: `Promise<TaskRun>`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.get<TaskRun>(`${this.baseUrl}/${id}`);
	}
```

## TaskRunApi.getTaskRunsByScheduledTaskId

`src/api/TaskRunApi.ts:63`

Base path: `'/tasks'`. Returns: `Promise<GetTaskRunsResponse>`.

Parameters: `scheduledTaskId: string`; `payload: Omit<GetTaskRunsPayload, 'scheduled_task_id'> = {}`

```ts
{
		return await this.getAllTaskRuns({ ...payload, scheduled_task_id: scheduledTaskId });
	}
```

## UsageRecordApi.searchUsageRecords

`src/api/UsageRecordApi.ts:7`

Base path: `'/usage-records/search'`. Returns: `Promise<ListUsageRecordsResponse>`.

Parameters: `payload: UsageRecordFilter`

```ts
{
		return await AxiosClient.post<ListUsageRecordsResponse>(this.baseUrl, payload);
	}
```

## WalletApi.getCustomerWallets

`src/api/WalletApi.ts:23`

Base path: `'/wallets'`. Returns: `Promise<Wallet[]>`.

Parameters: `data: GetCustomerWalletsPayload`

```ts
{
		const url = generateQueryParams(`/customers${this.baseUrl}`, data);
		return await AxiosClient.get<Wallet[]>(url);
	}
```

## WalletApi.getWalletTransactions

`src/api/WalletApi.ts:28`

Base path: `'/wallets'`. Returns: `Promise<WalletTransactionResponse>`.

Parameters: `{ walletId, limit = 10, offset = 0 }: WalletTransactionPayload`

```ts
{
		return await AxiosClient.get<WalletTransactionResponse>(`${this.baseUrl}/${walletId}/transactions?limit=${limit}&offset=${offset}`);
	}
```

## WalletApi.getWalletBalance

`src/api/WalletApi.ts:32`

Base path: `'/wallets'`. Returns: `Promise<RealtimeWalletBalance>`.

Parameters: `walletId: string`

```ts
{
		return await AxiosClient.get<RealtimeWalletBalance>(`${this.baseUrl}/${walletId}/balance/real-time`);
	}
```

## WalletApi.getWalletBalanceV2

`src/api/WalletApi.ts:36`

Base path: `'/wallets'`. Returns: `Promise<RealtimeWalletBalance>`.

Parameters: `walletId: string`

```ts
{
		return await AxiosClient.get<RealtimeWalletBalance>(`${this.baseUrl}/${walletId}/balance/real-time-v2`);
	}
```

## WalletApi.createWallet

`src/api/WalletApi.ts:39`

Base path: `'/wallets'`. Returns: `Promise<Wallet>`.

Parameters: `data: CreateWalletPayload`

```ts
{
		return await AxiosClient.post<Wallet>(`${this.baseUrl}`, data);
	}
```

## WalletApi.topupWallet

`src/api/WalletApi.ts:43`

Base path: `'/wallets'`. Returns: `Promise<TopupWalletResponse>`.

Parameters: `data: TopupWalletPayload`

```ts
{
		return await AxiosClient.post<TopupWalletResponse>(`${this.baseUrl}/${data.walletId}/top-up`, data);
	}
```

## WalletApi.debitWallet

`src/api/WalletApi.ts:47`

Base path: `'/wallets'`. Returns: `Promise<Wallet>`.

Parameters: `data: DebitWalletPayload`

```ts
{
		return await AxiosClient.post<Wallet>(`${this.baseUrl}/${data.walletId}/debit`, data);
	}
```

## WalletApi.terminateWallet

`src/api/WalletApi.ts:51`

Base path: `'/wallets'`. Returns: `Promise<void>`.

Parameters: `walletId: string`

```ts
{
		return await AxiosClient.post<void>(`${this.baseUrl}/${walletId}/terminate`, {});
	}
```

## WalletApi.updateWallet

`src/api/WalletApi.ts:55`

Base path: `'/wallets'`. Returns: `Promise<WalletResponse>`.

Parameters: `walletId: string`; `data: UpdateWalletRequest`

```ts
{
		return await AxiosClient.put<WalletResponse>(`${this.baseUrl}/${walletId}`, { ...data });
	}
```

## WalletApi.getAllWalletTransactionsByFilter

`src/api/WalletApi.ts:60`

Base path: `'/wallets'`. Returns: `Promise<WalletTransactionResponse>`.

Parameters: `payload: GetWalletTransactionsByFilterPayload`

```ts
{
		return await AxiosClient.post<WalletTransactionResponse, GetWalletTransactionsByFilterPayload>(
			`${this.baseUrl}/transactions/search`,
			payload,
		);
	}
```

## WalletApi.listWallets

`src/api/WalletApi.ts:68`

Base path: `'/wallets'`. Returns: `Promise<ListWalletsResponse>`.

Parameters: `payload: ListWalletsPayload = {}`

```ts
{
		const url = generateQueryParams(this.baseUrl, payload);
		return await AxiosClient.get<ListWalletsResponse>(url);
	}
```

## WalletApi.listWalletsByFilter

`src/api/WalletApi.ts:74`

Base path: `'/wallets'`. Returns: `Promise<ListWalletsResponse>`.

Parameters: `payload: ListWalletsByFilterPayload`

```ts
{
		return await AxiosClient.post<ListWalletsResponse, ListWalletsByFilterPayload>(`${this.baseUrl}/search`, payload);
	}
```

## WorkflowApi.search

`src/api/WorkflowApi.ts:15`

Base path: `'/workflows'`. Returns: `Promise<ListWorkflowsResponse>`.

Parameters: `payload: WorkflowExecutionFilterRequest`

```ts
{
		return await AxiosClient.post<ListWorkflowsResponse>(`${this.baseUrl}/search`, payload);
	}
```

## WorkflowApi.getDetails

`src/api/WorkflowApi.ts:22`

Base path: `'/workflows'`. Returns: `Promise<WorkflowDetailsResponse>`.

Parameters: `workflowId: string`; `runId: string`

```ts
{
		return await AxiosClient.get<WorkflowDetailsResponse>(`${this.baseUrl}/${workflowId}/${runId}`);
	}
```

## WorkflowApi.getSummary

`src/api/WorkflowApi.ts:29`

Base path: `'/workflows'`. Returns: `Promise<WorkflowSummaryResponse>`.

Parameters: `workflowId: string`; `runId: string`

```ts
{
		return await AxiosClient.get<WorkflowSummaryResponse>(`${this.baseUrl}/${workflowId}/${runId}/summary`);
	}
```

## WorkflowApi.getTimeline

`src/api/WorkflowApi.ts:36`

Base path: `'/workflows'`. Returns: `Promise<WorkflowTimelineResponse>`.

Parameters: `workflowId: string`; `runId: string`

```ts
{
		return await AxiosClient.get<WorkflowTimelineResponse>(`${this.baseUrl}/${workflowId}/${runId}/timeline`);
	}
```

## WorkflowApi.getBatch

`src/api/WorkflowApi.ts:43`

Base path: `'/workflows'`. Returns: `Promise<BatchWorkflowsResponse>`.

Parameters: `payload: BatchWorkflowsRequest`

```ts
{
		return await AxiosClient.post<BatchWorkflowsResponse>(`${this.baseUrl}/batch`, payload);
	}
```

## WebhookApi.getWebhookDashboardUrl

`src/api/WebhookApi.ts:5`

Base path: `'/webhooks'`. Returns: `None`.

Parameters:

```ts
{
		const baseUrl = '/webhooks';
		return AxiosClient.get<WebhookDashboardResponse>(`${baseUrl}/dashboard`);
	}
```

## AlertSettingApi.create

`src/api/AlertSettingApi.ts:18`

Base path: `'/alerts/setting'`. Returns: `None`.

Parameters: `data: CreateAlertSettingsRequest`

```ts
{
		return AxiosClient.post<AlertSettingResponse, CreateAlertSettingsRequest>(this.baseUrl, data);
	}
```

## AlertSettingApi.get

`src/api/AlertSettingApi.ts:27`

Base path: `'/alerts/setting'`. Returns: `None`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.get<AlertSettingResponse>(`${this.baseUrl}/${id}`);
	}
```

## AlertSettingApi.search

`src/api/AlertSettingApi.ts:36`

Base path: `'/alerts/setting'`. Returns: `None`.

Parameters: `payload: SearchAlertSettingsRequest`

```ts
{
		return await AxiosClient.post<SearchAlertSettingsResponse, SearchAlertSettingsRequest>(`${this.baseUrl}/search`, payload);
	}
```

## AlertSettingApi.update

`src/api/AlertSettingApi.ts:46`

Base path: `'/alerts/setting'`. Returns: `None`.

Parameters: `id: string`; `data: UpdateAlertSettingsRequest`

```ts
{
		return await AxiosClient.put<AlertSettingResponse, UpdateAlertSettingsRequest>(`${this.baseUrl}/${id}`, data);
	}
```

## AlertSettingApi.delete

`src/api/AlertSettingApi.ts:55`

Base path: `'/alerts/setting'`. Returns: `None`.

Parameters: `id: string`

```ts
{
		return await AxiosClient.delete<void>(`${this.baseUrl}/${id}`);
	}
```

## IntegrationMappingApi.getIntegrationConfig

`src/api/IntegrationMappingApi.ts:63`

Base path: `'/integrations'`. Returns: `Promise<IntegrationConfigResponse>`.

Parameters:

```ts
{
		return await AxiosClient.get<IntegrationConfigResponse>(`${this.baseUrl}/config`);
	}
```

## IntegrationMappingApi.getIntegrationMappings

`src/api/IntegrationMappingApi.ts:67`

Base path: `'/integrations'`. Returns: `Promise<IntegrationMappingsResponse>`.

Parameters: `entityType: string`; `entityId: string`

```ts
{
		const params = { entity_type: entityType, entity_id: entityId };
		const url = generateQueryParams(`${this.baseUrl}/mappings`, params);
		return await AxiosClient.get<IntegrationMappingsResponse>(url);
	}
```

## IntegrationMappingApi.syncIntegration

`src/api/IntegrationMappingApi.ts:73`

Base path: `'/integrations'`. Returns: `Promise<{ message: string }>`.

Parameters: `request: IntegrationSyncRequest`

```ts
{
		return await AxiosClient.post<{ message: string }>(`${this.baseUrl}/sync`, request);
	}
```

## IntegrationMappingApi.linkIntegration

`src/api/IntegrationMappingApi.ts:77`

Base path: `'/integrations'`. Returns: `Promise<IntegrationLinkResponse>`.

Parameters: `request: IntegrationLinkRequest`

```ts
{
		return await AxiosClient.post<IntegrationLinkResponse>(`${this.baseUrl}/link`, request);
	}
```

## IntegrationMappingApi.delinkIntegration

`src/api/IntegrationMappingApi.ts:81`

Base path: `'/integrations'`. Returns: `Promise<IntegrationDelinkResponse>`.

Parameters: `request: IntegrationDelinkRequest`

```ts
{
		return await AxiosClient.delete<IntegrationDelinkResponse>(`${this.baseUrl}/link`, request);
	}
```

## EnvironmentApi.getAllEnvironments

`src/api/EnvironmentApi.ts:40`

Base path: `'/environments'`. Returns: `Promise<ListEnvironmentResponse>`.

Parameters:

```ts
{
		try {
			return await AxiosClient.get<ListEnvironmentResponse>(this.baseUrl);
		} catch (error) {
			return { environments: [], total: 0 } as ListEnvironmentResponse;
		}
	}
```

## EnvironmentApi.getEnvironmentById

`src/api/EnvironmentApi.ts:48`

Base path: `'/environments'`. Returns: `Promise<Environment | null>`.

Parameters: `id: string`

```ts
{
		try {
			return await AxiosClient.get<Environment>(`${this.baseUrl}/${id}`);
		} catch (error) {
			return null;
		}
	}
```

## EnvironmentApi.createEnvironment

`src/api/EnvironmentApi.ts:56`

Base path: `'/environments'`. Returns: `Promise<Environment | null>`.

Parameters: `payload: CreateEnvironmentPayload`

```ts
{
		return await AxiosClient.post<Environment>(this.baseUrl, payload);
	}
```

## EnvironmentApi.cloneEnvironment

`src/api/EnvironmentApi.ts:60`

Base path: `'/environments'`. Returns: `Promise<CloneEnvironmentResponse>`.

Parameters: `sourceEnvironmentId: string`; `payload: CloneEnvironmentPayload`

```ts
{
		return await AxiosClient.post<CloneEnvironmentResponse>(`${this.baseUrl}/${sourceEnvironmentId}/clone`, payload);
	}
```

## EnvironmentApi.updateEnvironment

`src/api/EnvironmentApi.ts:64`

Base path: `'/environments'`. Returns: `Promise<Environment | null>`.

Parameters: `id: string`; `payload: UpdateEnvironmentPayload`

```ts
{
		return await AxiosClient.put<Environment>(`${this.baseUrl}/${id}`, payload);
	}
```

## EnvironmentApi.getActiveEnvironmentId

`src/api/EnvironmentApi.ts:68`

Base path: `'/environments'`. Returns: `string | null`.

Parameters:

```ts
{
		return localStorage.getItem(ACTIVE_ENVIRONMENT_ID_KEY);
	}
```

## EnvironmentApi.setActiveEnvironmentId

`src/api/EnvironmentApi.ts:72`

Base path: `'/environments'`. Returns: `void`.

Parameters: `environmentId: string`

```ts
{
		localStorage.setItem(ACTIVE_ENVIRONMENT_ID_KEY, environmentId);
		resolveEnvReady?.();
		resolveEnvReady = null;
	}
```

## EnvironmentApi.waitForActiveEnvironment

`src/api/EnvironmentApi.ts:81`

Base path: `'/environments'`. Returns: `Promise<void>`.

Parameters: `timeoutMs = 5000`

```ts
{
		return Promise.race([getEnvReadyPromise(), new Promise<void>((resolve) => setTimeout(resolve, timeoutMs))]);
	}
```

## UserApi.getTenantMembers

`src/api/UserApi.ts:25`

Base path: `'/users'`. Returns: `Promise<GetServiceAccountsResponse>`.

Parameters: `params: GetTenantMembersParams`

```ts
{
		const filters: TypedBackendFilter[] = [
			{
				field: 'status',
				operator: FilterOperator.EQUAL,
				data_type: DataType.STRING,
				value: { string: 'published' },
			},
		];
		return await AxiosClient.post<GetServiceAccountsResponse>(`${this.baseUrl}/search`, {
			limit: params.limit,
			offset: params.offset,
			type: 'user',
			filters,
			sort: [
				{
					field: 'created_at',
					direction: 'desc',
				},
			],
		});
	}
```

## UserApi.getAllUsers

`src/api/UserApi.ts:49`

Base path: `'/users'`. Returns: `Promise<GetServiceAccountsResponse>`.

Parameters:

```ts
{
		const response = await AxiosClient.post<GetServiceAccountsResponse>(`${this.baseUrl}/search`, {
			limit: 1000,
			offset: 0,
			type: 'user',
			filters: [],
			sort: [
				{
					field: 'created_at',
					direction: 'desc',
				},
			],
		});
		return response;
	}
```

## UserApi.getUserById

`src/api/UserApi.ts:70`

Base path: `'/users'`. Returns: `Promise<User | undefined>`.

Parameters: `userId: string`

```ts
{
		const response = await AxiosClient.post<GetServiceAccountsResponse>(`${this.baseUrl}/search`, {
			user_ids: [userId],
			type: 'user',
			limit: 1,
		});
		return response.items[0];
	}
```

## UserApi.getServiceAccounts

`src/api/UserApi.ts:80`

Base path: `'/users'`. Returns: `Promise<GetServiceAccountsResponse>`.

Parameters: `params: { limit: number; offset: number } = { limit: 10, offset: 0 }`

```ts
{
		const response = await AxiosClient.post<GetServiceAccountsResponse>(`${this.baseUrl}/search`, {
			limit: params.limit,
			offset: params.offset,
			type: 'service_account',
			sort: [
				{
					field: 'created_at',
					direction: 'desc',
				},
			],
		});
		return response;
	}
```

## UserApi.createUser

`src/api/UserApi.ts:98`

Base path: `'/users'`. Returns: `Promise<User>`.

Parameters: `data: CreateUserRequest`

```ts
{
		return await AxiosClient.post<User, CreateUserRequest>(this.baseUrl, data);
	}
```

## UserApi.addUserToTenant

`src/api/UserApi.ts:106`

Base path: `'/users'`. Returns: `Promise<CreateTenantUserResponse>`.

Parameters: `data: CreateTenantUserRequest`

```ts
{
		return await AxiosClient.post<CreateTenantUserResponse, CreateTenantUserRequest>(this.v1UsersUrl, data);
	}
```

## UserApi.createServiceAccount

`src/api/UserApi.ts:111`

Base path: `'/users'`. Returns: `Promise<User>`.

Parameters: `data: CreateServiceAccountPayload`

```ts
{
		return await AxiosClient.post<User>(this.baseUrl, data);
	}
```

## UserApi.updateUser

`src/api/UserApi.ts:116`

Base path: `'/users'`. Returns: `Promise<User>`.

Parameters: `data: UpdateTenantPayload`

```ts
{
		return await AxiosClient.put<User, UpdateTenantPayload>(`tenants/update`, data);
	}
```

## UserApi.updateServiceAccount

`src/api/UserApi.ts:121`

Base path: `'/users'`. Returns: `Promise<User>`.

Parameters: `id: string`; `data: { name?: string; metadata?: Record<string, string> }`

```ts
{
		return await AxiosClient.put<User, typeof data>(`${this.baseUrl}/${id}`, data);
	}
```

## UserApi.removeUserFromTenant

`src/api/UserApi.ts:130`

Base path: `'/users'`. Returns: `Promise<void>`.

Parameters: `userId: string`

```ts
{
		return await AxiosClient.post<void>(`${this.baseUrl}/${userId}/remove`);
	}
```

## UserApi.deleteUser

`src/api/UserApi.ts:139`

Base path: `'/users'`. Returns: `Promise<void>`.

Parameters: `userId: string`

```ts
{
		return await AxiosClient.delete<void>(`${this.baseUrl}/${userId}`);
	}
```

## UserApi.updateUserRoles

`src/api/UserApi.ts:144`

Base path: `'/users'`. Returns: `Promise<User>`.

Parameters: `id: string`; `roles: string[]`

```ts
{
		return await AxiosClient.put<User, UpdateUserRolesRequest>(`${this.baseUrl}/${id}/roles`, { roles });
	}
```

## UserApi.me

`src/api/UserApi.ts:148`

Base path: `'/users'`. Returns: `Promise<User>`.

Parameters:

```ts
{
		return await AxiosClient.get<User>(`${this.baseUrl}/me`);
	}
```

## RevenueDashboardApi.getRevenueDashboard

`src/api/RevenueDashboardApi.ts:7`

Base path: `'/dashboard/revenue-dashboard'`. Returns: `Promise<RevenueDashboardResponse>`.

Parameters: `payload: RevenueDashboardRequest`

```ts
{
		return await AxiosClient.post<RevenueDashboardResponse>(this.baseUrl, payload);
	}
```

## AiPricingParseApi.parseGemini

`src/api/AiPricingParseApi.ts:19`

Base path: `None`. Returns: `Promise<PricingSchema>`.

Parameters: `body: ParseGeminiPricingRequest`

```ts
{
		return await AxiosClient.post<PricingSchema, ParseGeminiPricingRequest>(this.path, body);
	}
```
