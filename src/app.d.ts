import type { SessionUser } from '../server/auth/sessions';

declare global {
	namespace App {
		interface Locals {
			user: SessionUser | null;
		}
		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
		interface Error {}
		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
		interface PageData {}
		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
		interface PageState {}
		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
		interface Platform {}
	}
}

export {};
