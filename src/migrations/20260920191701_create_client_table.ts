import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('client', (table) => {
		table.increments('id').notNullable().unique();
		table.string('client_id').primary();
		table.string('name');
		table.string('email');
		table.string('phone');
		table.text('address');
	    table.string('password');
	})
}


export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable('client')
}

