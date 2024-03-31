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

import database from './database/database.js'

const CHROME = 'https://chromewebstore.google.com/detail/pronoundb/nblkbiljcjfemkfjnhoobnojjgjdmknf?hl=en'
const FIREFOX = 'https://addons.mozilla.org/api/v5/addons/addon/pronoundb'
const EDGE = 'https://microsoftedge.microsoft.com/addons/getproductdetailsbycrxid/jbgjogfdlgjohdacngknlohahhaiaodn'

let lastFetch: number
let stats = {
	users: 0,
	chrome: {
		version: '0.0.0',
		users: 0,
		rating: 0,
	},
	firefox: {
		version: '0.0.0',
		users: 0,
		rating: 0,
	},
	edge: {
		version: '0.0.0',
		users: 0,
		rating: 0,
	},
}

async function fetchChromeStats () {
	const data = await fetch(CHROME).then((r) => r.text())
	const version = data.match(/\\"version\\":\\"([0-9.]+)\\"/)?.[1] ?? '0.0.0'
	const install = data.match(/>([0-9,]+) users</)?.[1]?.replace(/,/g, '') ?? '0'
	const stars = Number(data.match(/>([0-9.]+) out of 5</)?.[1] ?? 0)

	return {
		version: version,
		users: Number(`${install[0]}${'0'.repeat(install.length - 1)}`),
		rating: Math.round(stars * 2) / 2,
	}
}

async function fetchFirefoxStats () {
	const data = await fetch(FIREFOX).then((r) => r.json()) as any
	const install = data.average_daily_users.toString()

	return {
		version: data.current_version.version,
		users: Number(`${install[0]}${'0'.repeat(install.length - 1)}`),
		rating: Math.round(data.ratings.average * 2) / 2,
	}
}

async function fetchEdgeStats () {
	const data = await fetch(EDGE).then((r) => r.json()) as any
	const install = data.activeInstallCount.toString()

	return {
		version: data.version,
		users: Number(`${install[0]}${'0'.repeat(install.length - 1)}`),
		rating: Math.round(data.averageRating * 2) / 2,
	}
}

async function fetchStats () {
	lastFetch = Date.now() // Update last fetch immediately to prevent concurrent re-fetches
	const [ count, chrome, firefox, edge ] = await Promise.all([
		database.collection('accounts').estimatedDocumentCount(),
		fetchChromeStats(),
		fetchFirefoxStats(),
		fetchEdgeStats(),
	])

	stats = {
		users: count,
		chrome: chrome,
		firefox: firefox,
		edge: edge,
	}
}

await fetchStats()
export default function getStats () {
	if ((Date.now() - lastFetch) > 3600e3 && import.meta.env.PROD) {
		// Initiate a re-fetch in background, but don't wait for new data
		// We can serve stale data and wait for new one to arrive
		fetchStats()
	}

	return stats
}
