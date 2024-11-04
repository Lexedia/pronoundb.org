import type { ExternalAccount } from '@server/database/database.ts'
import type { FlashMessage } from '@server/flash.ts'

export const oauthVersion = 2
export const clientId = import.meta.env.OAUTH_OSU_CLIENT
export const clientSecret = import.meta.env.OAUTH_OSU_SECRET

export const authorizationUrl = 'https://osu.ppy.sh/oauth/authorize'
export const tokenUrl = 'https://osu.ppy.sh/oauth/token'
export const scopes = [ 'identify' ]

export async function getSelf (token: string): Promise<ExternalAccount | FlashMessage | null> {
	const res = await fetch('https://osu.ppy.sh/api/v2/me', {
		headers: {
			Accept: 'application/json',
			Authorization: `Bearer ${token}`,
			'User-Agent': 'PronounDB Authentication Agent/2.0 (+https://pronoundb.org)',
		},
	})

	if (!res.ok) return null
	const data = await res.json()

	return {
		platform: 'osu',
		accountId: data.id,
		accountName: data.username,
	}
}
