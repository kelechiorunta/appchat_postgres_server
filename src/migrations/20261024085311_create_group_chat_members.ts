import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('group_chat_members', (table) => {
		table.string('client_id')
		.notNullable()
		.references('client_id')
		.inTable('client')
		.onDelete('CASCADE')

		table.integer('group_chat_id')
		.notNullable()
		.references('group_chat_id')
		.inTable('group_chat')
		.onDelete('CASCADE')

		table.primary(['client_id', 'group_chat_id'])
	})
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable('group_chat_members')
}

