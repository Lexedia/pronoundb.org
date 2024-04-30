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

import { providers } from '@server/oauth/providers.js'
import { lookupPronouns } from '@server/database/users.js'
import {
	ApiCallVersionCounter,
	LookupBulkSizeHistogram,
	LookupHitCounter,
	LookupIdsCounter,
	LookupRequestsCounter,
} from '@server/metrics.js'

export async function GET (ctx: APIContext) {
	ApiCallVersionCounter.inc({ version: 2 })

	const platform = ctx.url.searchParams.get('platform')
	const idsStr = ctx.url.searchParams.get('ids')

	if (!platform || !idsStr) {
		return new Response(
			JSON.stringify({
				code: 400,
				error: 'Bad request',
				message: '`platform` and `ids` query parameters are required.',
			}),
			{
				status: 400,
				headers: {
					'access-control-allow-methods': 'GET',
					'access-control-allow-origin': '*',
					'access-control-allow-headers': 'x-pronoundb-source',
					'access-control-max-age': '600',
					'content-type': 'application/json',
				},
			}
		)
	}

	if (!providers.includes(platform)) {
		return new Response(
			JSON.stringify({
				code: 400,
				error: 'Bad request',
				message: '`platform` is not a valid platform.',
			}),
			{
				status: 400,
				headers: {
					'access-control-allow-methods': 'GET',
					'access-control-allow-origin': '*',
					'access-control-allow-headers': 'x-pronoundb-source',
					'access-control-max-age': '600',
					'content-type': 'application/json',
				},
			}
		)
	}

	const ids = new Set(idsStr.split(',').filter((a) => a))
	const idsCount = ids.size
	if (idsCount < 1 || idsCount > 50) {
		return new Response(
			JSON.stringify({
				code: 400,
				error: 'Bad request',
				message: '`ids` must contain between 1 and 50 IDs.',
			}),
			{
				status: 400,
				headers: {
					'access-control-allow-methods': 'GET',
					'access-control-allow-origin': '*',
					'access-control-allow-headers': 'x-pronoundb-source',
					'access-control-max-age': '600',
					'content-type': 'application/json',
				},
			}
		)
	}

	const usersFound = await lookupPronouns(platform, Array.from(ids))

	const res = {} as any
	for (let i = 0; i < usersFound.length; i++) {
		const user = usersFound[i]!
		res[user.accountId] = {
			decoration: user.decoration,
			sets: user.pronouns,
		}
	}

	// Collect metrics
	const method = idsCount === 1 ? 'single' : 'bulk'
	LookupRequestsCounter.inc({ platform: platform, method: method })
	LookupIdsCounter.inc({ platform: platform }, idsCount)
	LookupHitCounter.inc({ platform: platform }, usersFound.length)
	if (method === 'bulk') {
		LookupBulkSizeHistogram.observe({ platform: platform }, idsCount)
	}

	const body = JSON.stringify(res)
	return new Response(body, {
		headers: {
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
