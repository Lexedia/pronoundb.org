/*
 * Copyright (c) Cynthia Rey et al., All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import type { APIContext } from 'astro'
import { transformSetsToIdentifier } from '@pronoundb/pronouns/legacy'

import { LookupRequestsCounter, LookupIdsCounter, LookupHitCounter, ApiCallVersionCounter } from '@server/metrics.js'
import { lookupPronouns } from '@server/database/users.js'

const providers = [
	'discord',
	'github',
	'minecraft',
	'twitch',
	'twitter',
]

export async function GET (ctx: APIContext) {
	ApiCallVersionCounter.inc({ version: 1 })

	const platform = ctx.url.searchParams.get('platform')
	const id = ctx.url.searchParams.get('id')

	if (!platform || !id) {
		return new Response(
			JSON.stringify({
				errorCode: 400,
				error: 'Bad request',
				message: '`platform` and `id` query parameters are required.',
			}),
			{ status: 400, headers: { 'content-type': 'application/json' } }
		)
	}

	if (!providers.includes(platform)) {
		return new Response(
			JSON.stringify({
				errorCode: 400,
				error: 'Bad request',
				message: '`platform` is not a valid platform.',
			}),
			{ status: 400, headers: { 'content-type': 'application/json' } }
		)
	}

	const users = await lookupPronouns(platform, [ id ])
	const user = users[0]

	// Collect metrics
	LookupRequestsCounter.inc({ platform: platform, method: 'single' })
	LookupIdsCounter.inc({ platform: platform })
	if (user) LookupHitCounter.inc({ platform: platform })

	const body = JSON.stringify({ pronouns: transformSetsToIdentifier(user?.pronouns.en) })
	return new Response(body, {
		headers: {
			vary: 'origin',
			'access-control-allow-methods': 'GET',
			'access-control-allow-origin': '*',
			'access-control-allow-headers': 'x-pronoundb-source',
			'access-control-max-age': '600',
			'content-type': 'application/json',
		},
	})
}

export function OPTIONS () {
	return new Response(null, {
		status: 204,
		headers: {
			vary: 'origin',
			'access-control-allow-methods': 'GET',
			'access-control-allow-origin': '*',
			'access-control-allow-headers': 'x-pronoundb-source',
			'access-control-max-age': '600',
		},
	})
}

export function ALL () {
	return new Response(JSON.stringify({ statusCode: 405, error: 'Method not allowed' }), { status: 405 })
}
