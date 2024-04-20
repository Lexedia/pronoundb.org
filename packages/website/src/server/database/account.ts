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

import type { ObjectId } from 'mongodb'
import type { Sets } from '@pronoundb/pronouns/sets'
import database from './database.js'
import { DatabaseLatencySummary } from '../metrics.js'

export const collection = database.collection<Account>('accounts')
await collection.createIndex({ 'accounts.id': 1, 'accounts.platform': 1 })
await collection.createIndex({ 'accounts.platform': 1 })

export type Account = {
	accounts: ExternalAccount[]
	decoration: string | null
	sets: { [locale: string]: Sets }

	availableDecorations: string[]
}

export type ExternalAccount = {
	id: string
	name: string
	platform: string
}

export type PronounsOfUser = {
	account: ExternalAccount
	decoration: string
	sets: { [locale: string]: Sets }
}

export async function createAccount (from: ExternalAccount) {
	const existingAccount = await findByExternalAccount(from)
	if (existingAccount) return null

	const finishTimer = DatabaseLatencySummary.startTimer({ type: 'write', op: 'create_account' })
	const result = await collection.insertOne({
		accounts: [ from ],
		decoration: null,
		sets: {},

		availableDecorations: [],
	})

	finishTimer()
	return result.insertedId
}

export async function findById (id: ObjectId) {
	return collection.findOne({ _id: id })
}

export async function findByExternalAccount (external: ExternalAccount) {
	const finishTimer = DatabaseLatencySummary.startTimer({ type: 'read+write', op: 'find_from_external' })

	// Find and also update account's display name in one go
	// This isn't efficient as it requires a write lock every time, but I frankly do not care
	// Future Cynthia, if you're mad know you were already mad at this back when you wrote it you dumbcat
	// -- Cynthia
	const account = await collection.findOneAndUpdate(
		{ 'accounts.id': external.id, 'accounts.platform': external.platform },
		{ $set: { 'accounts.$[account].name': external.name } },
		{ arrayFilters: [ { 'account.platform': external.platform, 'account.id': external.id } ] }
	)

	finishTimer()
	return account
}

export function findPronounsOf (platform: string, externalIds: string[]) {
	const finishTimer = DatabaseLatencySummary.startTimer({ type: 'read', op: 'lookup' })

	// perf: first filtering ($match) needs to be done before doing anything to ensure we hit the index.
	// once initial filtering is done, we can do whatever as the dataset is small enough.
	// it was behaving with 10k+ docs, it should be ridiculously fast for <=50 docs...
	const pronouns = collection.aggregate<PronounsOfUser>([
		{
			$match: {
				accounts: {
					$elemMatch: {
						platform: platform,
						id: { $in: externalIds },
					},
				},
			},
		},
		{
			$project: {
				_id: 0,
				decoration: 1,
				sets: 1,
				account: {
					$first: {
						$filter: {
							input: '$accounts',
							as: 'account',
							cond: {
								$and: [
									{ $eq: [ '$$account.platform', platform ] },
									{ $in: [ '$$account.id', externalIds ] },
								],
							},
						},
					},
				},
			},
		},
	])

	pronouns.addListener('close', () => finishTimer())
	return pronouns
}

// UPDATE PRONOUNS

export async function updatePronouns (userId: ObjectId, pronouns: Sets, locale: string) {
	const finishTimer = DatabaseLatencySummary.startTimer({ type: 'write', op: 'set_pronouns' })
	await collection.updateOne({ _id: userId }, { $set: { [`sets.${locale}`]: pronouns } })
	finishTimer()
}

export async function deletePronouns (userId: ObjectId, locale: string) {
	const finishTimer = DatabaseLatencySummary.startTimer({ type: 'write', op: 'clear_pronouns' })
	await collection.updateOne({ _id: userId }, { $unset: { [`sets.${locale}`]: 1 } })
	finishTimer()
}

// UPDATE DECORATIONS

export async function updateDecoration (userId: ObjectId, decoration: string | null) {
	const finishTimer = DatabaseLatencySummary.startTimer({ type: 'write', op: 'update_decoration' })
	await collection.updateOne({ _id: userId }, { $set: { decoration: decoration } })
	finishTimer()
}

// UPDATE ACCOUNTS

export async function addLinkedAccount (userId: ObjectId, account: ExternalAccount) {
	const finishTimer = DatabaseLatencySummary.startTimer({ type: 'write', op: 'add_linked_account' })
	await collection.updateOne({ _id: userId }, { $push: { accounts: account } })
	finishTimer()
}

export async function removeLinkedAccount (userId: ObjectId, platform: string, externalId: string) {
	const finishTimer = DatabaseLatencySummary.startTimer({ type: 'write', op: 'remove_linked_account' })
	await collection.updateOne({ _id: userId }, { $pull: { accounts: { platform: platform, id: externalId } } })
	finishTimer()
}

// DELETE

export async function deleteAccount (id: ObjectId) {
	const finishTimer = DatabaseLatencySummary.startTimer({ type: 'write', op: 'delete_account' })
	await collection.deleteOne({ _id: id })
	finishTimer()
}
