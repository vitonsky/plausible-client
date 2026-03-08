export class CookieStorage implements Storage {
	get length(): number {
		if (typeof document === 'undefined') return 0;

		return document.cookie
			.split(';')
			.map((c) => c.trim())
			.filter((c) => c).length;
	}

	clear(): void {
		if (typeof document === 'undefined') return;

		const cookies = document.cookie.split(';');
		for (const cookie of cookies) {
			const eqPosition = cookie.indexOf('=');
			const name =
				eqPosition > -1 ? cookie.substr(0, eqPosition).trim() : cookie.trim();
			document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
		}
	}

	getItem(key: string): string | null {
		if (typeof document === 'undefined') return null;

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
		if (typeof document === 'undefined') return null;

		const keys = document.cookie.split(';').map((c) => c.trim().split('=')[0]);
		return keys[index] || null;
	}

	removeItem(key: string): void {
		if (typeof document === 'undefined') return;

		document.cookie = `${key}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
	}

	setItem(key: string, value: string): void {
		if (typeof document === 'undefined') return;

		document.cookie = `${key}=${encodeURIComponent(value)};path=/`;
	}
}
