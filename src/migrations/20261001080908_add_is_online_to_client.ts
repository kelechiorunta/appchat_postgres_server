import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable('client', (table) => {
		table.boolean('isOnline').defaultTo(false);
	})
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable('client', (table) => {
		table.dropColumn('isOnline');
	})
}

