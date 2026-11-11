import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("group_chat_message", (table) => {
    table.increments("group_chat_message_id").primary();

	table.string("client_id", 255).notNullable();
    table.integer("group_chat_id").notNullable();
	
	table.foreign(["client_id", "group_chat_id"])
	.references(["client_id", "group_chat_id"])
	.inTable("group_chat_members")
	.onDelete("CASCADE");

    table.text("message").notNullable();
	table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("group_chat_message");
}

