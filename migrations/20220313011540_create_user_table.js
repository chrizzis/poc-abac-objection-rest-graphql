/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const up = async (knex) => {
  await knex.schema.createTable('User', (table) => {
    table.increments('id').primary();
    table.string('username').unique().notNullable()
    table.string('email').unique().notNullable();
    table.string('firstName');
    table.string('lastName');
    table.string('password');
    table.timestamp('createdAt').defaultTo(knex.fn.now(6));
    table.enum('role', ['admin', 'moderator', 'user'], { useNative: true, enumName: 'roles' })
  });
  // TODO: temp for minimum jwt auth
  await knex.schema.createTable('Project', (table) => {
    table.increments('id').primary();
    table.integer('ownerId');
    table.string('title');
    table.string('ownerOnly');
    table.boolean('published').defaultTo(false);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const down = async (knex) => {
  await knex.schema.dropTable('User');
  await knex.schema.dropTable('Project');
};

export {
  up,
  down
}
