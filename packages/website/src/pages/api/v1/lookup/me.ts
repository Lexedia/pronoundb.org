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

import { authenticate } from '@server/auth.js'
import { ApiCallVersionCounter } from '@server/metrics.js'

function getCorsHeaders (request: APIContext['request']) {
	const origin = request.headers.get('origin')
	const isFirefox = request.headers.get('origin')?.startsWith('moz-extension://')

	return isFirefox
		? {
			Vary: 'Origin',
			'Access-Control-Allow-Methods': 'GET',
			'Access-Control-Allow-Origin': origin!,
			'Access-Control-Allow-Headers': 'X-PronounDB-Source',
			'Access-Control-Allow-Credentials': 'true',
			'Access-Control-Max-Age': '7200',
		}
		: {
			Vary: 'Origin',
			'Access-Control-Allow-Methods': 'GET',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Headers': 'X-PronounDB-Source',
			'Access-Control-Max-Age': '7200',
		}
}

export async function GET (ctx: APIContext) {
	ApiCallVersionCounter.inc({ version: 1 })

	const user = await authenticate(ctx, true)
	const body = JSON.stringify({ pronouns: transformSetsToIdentifier(user?.pronouns.en) })
	return new Response(body, {
		headers: {
			...getCorsHeaders(ctx.request),
			'Content-Type': 'application/json',
		},
	})
}

export function OPTIONS ({ request }: APIContext) {
	return new Response(null, {
		status: 204,
		headers: getCorsHeaders(request),
	})
}

export function ALL () {
	return new Response(JSON.stringify({ statusCode: 405, error: 'Method not allowed' }), { status: 405 })
}
