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

import type { ExternalAccount, User, UserData, UserLookupData } from './database.js'
import sql from './database.js'
import { uuidv7 } from 'uuidv7'
import { DatabaseLatencySummary } from '@server/metrics.js'

export async function createUser (account: ExternalAccount) {
	const id = uuidv7()

	try {
		const finishTimer = DatabaseLatencySummary.startTimer({ type: 'write', op: 'create_user' })
		const res = await sql.begin(
			async (sql) => {
				const userResult = await sql<User[]>`
					INSERT INTO users (id)
					VALUES (${id})
					RETURNING id, decoration, available_decorations
				`

				await sql`
					INSERT INTO accounts (platform, account_id, account_name, user_id)
					VALUES (${account.platform}, ${account.accountId}, ${account.accountName}, ${id})
				`

				return userResult[0]
			},
		)

		finishTimer()
		return res
	} catch (e) {
		if (e instanceof sql.PostgresError && e.code === '23505' && e.table_name === 'accounts') {
			// Account already exists. Handle gracefully.
			return null
		}

		// Handle chaotically.
		throw e
	}
}

export async function findUser (uuid: string) {
	const finishTimer = DatabaseLatencySummary.startTimer({ type: 'read', op: 'find_user' })
	const resultUser = await sql<User[]>`
		SELECT id, decoration, available_decorations
		FROM users
		WHERE id = ${uuid}
	`

	finishTimer()
	return resultUser[0]
}

export async function findUserData (uuid: string) {
	const finishTimer = DatabaseLatencySummary.startTimer({ type: 'read', op: 'find_user_data' })
	const result = await sql<UserData[]>`
		SELECT users.id,
			   users.decoration,
			   users.available_decorations,
			   coalesce(
				   (SELECT json_object_agg(locale, sets) FROM pronouns WHERE user_id = users.id),
				   '{}'
			   )                                                                  AS pronouns,
			   (SELECT json_agg(accounts) FROM accounts WHERE user_id = users.id) AS accounts
		FROM users
		WHERE id = ${uuid}
	`

	finishTimer()
	return result[0]
}

export async function findByExternalAccount (platform: string, id: string) {
	const finishTimer = DatabaseLatencySummary.startTimer({ type: 'read', op: 'find_from_external' })
	const resultUser = await sql<User[]>`
		SELECT users.id, users.decoration, users.available_decorations
		FROM users
				 INNER JOIN accounts ON accounts.user_id = users.id
		WHERE accounts.platform = ${platform}
		  AND accounts.account_id = ${id}
	`

	finishTimer()
	return resultUser[0]
}

export async function lookupPronouns (platform: string, ids: string[]) {
	const finishTimer = DatabaseLatencySummary.startTimer({ type: 'read', op: 'lookup' })
	const res = await sql<UserLookupData[]>`
		SELECT accounts.account_id,
			   users.decoration,
			   coalesce(
				   (SELECT json_object_agg(locale, sets) FROM pronouns WHERE user_id = users.id),
				   '{}'
			   ) AS pronouns
		FROM accounts
				 LEFT JOIN users ON users.id = accounts.user_id
		WHERE accounts.platform = ${platform}
		  AND accounts.account_id IN ${sql(ids)}
	`

	finishTimer()
	return res
}

export async function updateDecoration (uuid: string, decoration: string | null) {
	const finishTimer = DatabaseLatencySummary.startTimer({ type: 'write', op: 'update_decoration' })
	await sql`
		UPDATE users
		SET decoration = ${decoration}
		WHERE id = ${uuid}
	`

	finishTimer()
}

export async function deleteUser (uuid: string) {
	const finishTimer = DatabaseLatencySummary.startTimer({ type: 'write', op: 'delete_user' })
	await sql`
		DELETE
		FROM users
		WHERE id = ${uuid}
	`

	finishTimer()
}
