import knex from "knex";

export async function up(knex: knex) {
  return knex.schema.createTable("class_schedule", (table) => {
    table.increments("id").primary();
    table.integer("dia_semana").notNullable();

    // Aqui vai verificar de que hora até que hora o professor atende
    table.integer("horario_inicio").notNullable();
    table.integer("horario_fim").notNullable();

    table
      .integer("class_id")
      .notNullable()
      .references("id")
      .inTable("classes")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
  });
}

export async function down(knex: knex) {
  return knex.schema.dropTable("class_schedule");
}
