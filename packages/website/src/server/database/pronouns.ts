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

import type { RowList } from 'postgres'
import type { Sets } from '@pronoundb/pronouns/sets'
import type { PronounsSets } from './database.js'

import { DatabaseLatencySummary } from '@server/metrics.js'
import sql from './database.js'

export async function findPronounsOf (userId: string, locale?: undefined): Promise<RowList<PronounsSets[]>>
export async function findPronounsOf (userId: string, locale: string): Promise<PronounsSets>
export async function findPronounsOf (userId: string, locale?: string) {
	if (locale) {
		const finishTimer = DatabaseLatencySummary.startTimer({ type: 'read', op: 'find_pronouns_with_locale' })
		const result = await sql<PronounsSets[]>`
			SELECT locale, sets
			FROM pronouns
			WHERE user_id = ${userId}
			  AND locale = ${locale}
		`

		finishTimer()
		return result[0]
	}

	const finishTimer = DatabaseLatencySummary.startTimer({ type: 'read', op: 'find_pronouns' })
	const res = await sql<PronounsSets[]>`
		SELECT locale, sets
		FROM pronouns
		WHERE user_id = ${userId}
	`

	finishTimer()
	return res
}

export async function setPronouns (userId: string, locale: string, sets: Sets) {
	const finishTimer = DatabaseLatencySummary.startTimer({ type: 'write', op: 'update_pronouns' })
	await sql`
		INSERT INTO pronouns (user_id, locale, sets)
		VALUES (${userId}, ${locale}, ${sets})
		ON CONFLICT (user_id, locale) DO UPDATE SET sets = EXCLUDED.sets
	`

	finishTimer()
}

export async function deletePronouns (userId: string, locale: string) {
	const finishTimer = DatabaseLatencySummary.startTimer({ type: 'write', op: 'delete_pronouns' })
	await sql`
		DELETE
		FROM pronouns
		WHERE user_id = ${userId}
		  AND locale = ${locale}
	`

	finishTimer()
}
