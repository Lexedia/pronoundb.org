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

import type { ExternalAccount } from './database.js'
import sql from './database.js'
import { DatabaseLatencySummary } from '@server/metrics.js'

export async function addExternalAccount (userId: string, account: ExternalAccount) {
	const finishTimer = DatabaseLatencySummary.startTimer({ type: 'write', op: 'add_external_account' })
	const result = await sql`
		INSERT INTO accounts (platform, account_id, account_name, user_id)
		VALUES (${account.platform}, ${account.accountId}, ${account.accountName}, ${userId})
		ON CONFLICT (platform, account_id) DO UPDATE SET account_name = EXCLUDED.account_name
		WHERE accounts.user_id = EXCLUDED.user_id
		RETURNING user_id
	`

	finishTimer()
	return result.length === 1
}

export async function updateExternalAccount (account: ExternalAccount) {
	const finishTimer = DatabaseLatencySummary.startTimer({ type: 'write', op: 'update_external_account' })
	await sql`
		UPDATE accounts
		SET account_name = ${account.accountName}
		WHERE platform = ${account.platform}
		  AND account_id = ${account.accountId}
	`

	finishTimer()
}

export async function deleteExternalAccount (platform: string, accountId: string) {
	const finishTimer = DatabaseLatencySummary.startTimer({ type: 'write', op: 'delete_external_account' })
	await sql`
		DELETE
		FROM accounts
		WHERE platform = ${platform}
		  AND account_id = ${accountId}
	`

	finishTimer()
}
