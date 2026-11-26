import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('history_log', (table) => {
		table.increments('history_log_id').notNullable();
    	table.text('report');
    	table.string('status');
    	table.timestamps(true, true);
	})
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable('history_log');
}

