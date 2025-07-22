/**
 * @internal
 */
type EventPayload = {
	readonly n: string;
	readonly u: Location['href'];
	readonly d: Location['hostname'];
	readonly r: Document['referrer'] | null;
	readonly w: Window['innerWidth'];
	readonly h: 1 | 0;
	readonly p?: string;
	readonly revenue?: string;
};

/**
 * Options used when initializing the tracker.
 */

export type PlausibleInitOptions = {
	/**
	 * The domain to bind the event to.
	 * Defaults to `location.hostname`
	 */
	readonly domain: Location['hostname'];
	/**
	 * The API host where the events will be sent.
	 * Defaults to `'https://plausible.io'`
	 */
	readonly apiHost: string;

	/**
	 * Predicate that receive event and decide should event be sent or be skipped
	 * @param event current event object
	 * @returns `boolean`, if `false` - request will be skipped
	 */
	readonly filter?: (event: EventProps, eventName: string) => boolean;

	/**
	 * Event object transformer
	 * @param event current event object
	 * @returns new event object
	 */
	readonly transform?: (event: EventProps, eventName: string) => EventProps;
};

export type EventProps = {
	url: string;
	referrer: string | null;
	deviceWidth: number;
	hashMode?: boolean;
	props?: Record<string, string | number | null | undefined>;
	revenue?: {
		currency: string;
		amount: number | string;
	};
};

export class Plausible {
	constructor(private readonly config: PlausibleInitOptions) {}

	public trackEvent(eventName: string, data?: Pick<EventProps, 'props' | 'revenue'>) {
		return this.sendEvent(eventName, data);
	}

	public sendEvent(eventName: string, data?: Pick<EventProps, 'props' | 'revenue'>) {
		return this.sendRequest(eventName, {
			hashMode: false,
			url: location.href,
			referrer: document.referrer || null,
			deviceWidth: window.innerWidth,
			...data,
		});
	}

	private sendRequest = async (eventName: string, data: EventProps) => {
		const { apiHost, domain, filter, transform } = this.config;

		// Skip event
		if (filter && !filter(data, eventName)) return;

		// Transform data
		if (transform) {
			data = transform(data, eventName);
		}

		const payload: EventPayload = {
			n: eventName,
			u: data.url,
			d: domain,
			r: data.referrer,
			w: data.deviceWidth,
			h: data.hashMode ? 1 : 0,
			p: data && data.props ? JSON.stringify(data.props) : undefined,
			revenue: data && data.revenue ? JSON.stringify(data.revenue) : undefined,
		};

		const response = await fetch(`${apiHost}/api/event`, {
			method: 'POST',
			headers: {
				'Content-Type': 'text/plain',
			},
			body: JSON.stringify(payload),
			keepalive: true,
		});

		if (!response.ok) throw new Error(response.statusText);

		await response.text();
	};
}
