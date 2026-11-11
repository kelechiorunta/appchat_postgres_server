import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('group_chat', (table) => {
		table.increments('group_chat_id').primary();
		table.string('name').notNullable().unique();
	})
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable('group_chat');
}

