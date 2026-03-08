import { EventTransformer } from '../Plausible';
import { getSessionId } from '../utils/uid';
import { CookieStorage } from './CookieStorage';

export interface UIDStorage {
	get(): string | null;
	set(value: string): void;
}

export class BrowserUIDStorage implements UIDStorage {
	private readonly store: Storage;
	private readonly key: string;
	constructor(
		config: {
			store?: Storage;
			key?: string;
		} = {},
	) {
		if (config.store) this.store = config.store;
		else {
			const webStorageFallback =
				typeof window !== 'undefined'
					? localStorage || sessionStorage
					: undefined;
			this.store = webStorageFallback || new CookieStorage();
		}

		this.key = config.key || 'plausible_uid';
	}

	public get(): string | null {
		return this.store.getItem(this.key);
	}

	public set(value: string): void {
		this.store.setItem(this.key, value);
	}
}

export const userId = ({
	name = 'uid',
	storage = new BrowserUIDStorage(),
	get = getSessionId,
}: {
	/**
	 * Property name
	 * @default `uid``
	 */
	name?: string;

	/**
	 * Function that returns unique ID
	 * @default uses `self.crypto.randomUUID()` https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID
	 */
	get?: () => string;

	/**
	 * Object to persist ID
	 * @default uses `BrowserUIDStorage`
	 */
	storage?: UIDStorage;
} = {}): EventTransformer => {
	return (event) => {
		if (!event.props) event.props = {};

		let uid = storage.get();
		if (!uid) {
			uid = get();
			storage.set(uid);
		}

		event.props[name] = uid;
		return event;
	};
};
