import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('chat', (table) => {
		table.increments('chat_id');
		table.string('senderId').references('client_id').inTable('client');
		table.string('receiverId').references('client_id').inTable('client');
		table.text('chat_message');
		table.boolean('isRead').defaultTo(true);
		table.timestamps(true, true);
	})
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable('chat');
}

