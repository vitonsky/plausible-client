import { EventTransformer } from '../Plausible';

export class CookieStorage implements Storage {
	get length(): number {
		return document.cookie
			.split(';')
			.map((c) => c.trim())
			.filter((c) => c).length;
	}

	clear(): void {
		const cookies = document.cookie.split(';');
		for (const cookie of cookies) {
			const eqPosition = cookie.indexOf('=');
			const name =
				eqPosition > -1 ? cookie.substr(0, eqPosition).trim() : cookie.trim();
			document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
		}
	}

	getItem(key: string): string | null {
		const match = document.cookie.match(
			new RegExp(
				'(?:^|; )' +
					key.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1') +
					'=([^;]*)',
			),
		);
		return match ? decodeURIComponent(match[1]) : null;
	}

	key(index: number): string | null {
		const keys = document.cookie.split(';').map((c) => c.trim().split('=')[0]);
		return keys[index] || null;
	}

	removeItem(key: string): void {
		document.cookie = `${key}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
	}

	setItem(key: string, value: string): void {
		document.cookie = `${key}=${encodeURIComponent(value)};path=/`;
	}
}

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
		this.store =
			config.store || localStorage || sessionStorage || new CookieStorage();
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
	get = () => self.crypto.randomUUID(),
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
