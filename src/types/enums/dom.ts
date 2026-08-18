/** Browser events treated as "the user is still here" by the inactivity timer. */
export enum UserActivityEvent {
	MouseMove = 'mousemove',
	KeyDown = 'keydown',
	Scroll = 'scroll',
	TouchStart = 'touchstart',
}

/** `document.readyState` values we compare against. */
export enum DocumentReadyState {
	Complete = 'complete',
}
