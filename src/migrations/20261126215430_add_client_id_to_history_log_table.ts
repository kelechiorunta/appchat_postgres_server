import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable('history_log', (table) => {
		table.string('client_id').references('client_id').inTable('client');
	})
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable('history_log', (table) => {
		table.dropColumn('client_id');
	})
}

