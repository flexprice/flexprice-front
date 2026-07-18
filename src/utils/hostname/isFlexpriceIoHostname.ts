export const isFlexpriceIoHostname = (hostname: string): boolean => hostname === 'flexprice.io' || hostname.endsWith('.flexprice.io');

export const isFlexpriceContactEnabled = (): boolean => typeof window !== 'undefined' && isFlexpriceIoHostname(window.location.hostname);
