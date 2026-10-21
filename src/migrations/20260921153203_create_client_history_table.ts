import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('client_history', (table) => {
		table.increments('client_history_id').notNullable().unique();
		table.string('client_id').references('client_id').inTable('client');;
		table.string('email')
		table.string('name');
		table.text('report');
        table.string('status');		
		table.timestamps(true, true);
	})
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable('client_history')
}

