import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable('chat', (table) => {
		table.text('video_url').defaultTo('');
	})
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable('chat', (table) => {
		table.dropColumn('video_url');
	})
}

