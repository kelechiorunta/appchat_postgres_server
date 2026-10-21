import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable('client', (table) => {
		table.string('avatar_url');
	})
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable('client', (table) => {
		table.dropColumn('avatar_url');
	})
}

