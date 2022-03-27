import { Model } from 'objection';
import { User, Project } from '../../src/models/index.js';
import Role from '../../src/access-control/role.js'

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
async function seed(knex) {
  Model.knex(knex);

  // Deletes ALL existing entries
  await User.query().delete();
  await Project.query().delete();

  // https://vincit.github.io/objection.js/guide/query-examples.html#graph-inserts
  // insertGraph operation is not atomic by default! You need to start a transaction and pass it to the query using any of the supported ways.
  await User.query().insertGraph([
    {
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@email.com',
      username: 'alice-immutable',
      password: 'alice',
      projects: [
        // TODO: ownerId is TEMP until trx
        { id: 1, ownerId: 1, title: 'Project by Alice', ownerOnly: 'only alice can see this' },
        { id: 4, ownerId: 1, title: 'Published project by Alice', ownerOnly: 'only alice can see this', published: true },
      ],
      role: Role.User,
    },
    {
      firstName: 'Bob',
      lastName: 'Smith',
      email: 'bob@email.com',
      username: 'bob-immutable',
      password: 'bob',
      projects: [
        { id: 2, ownerId: 2, title: 'Project by Bob', ownerOnly: 'only bob can see this' },
        { id: 5, ownerId: 2, title: 'Published project by Bob', ownerOnly: 'only bob can see this', published: true },
      ],
      role: Role.User,
    },
    {
      firstName: 'Eve',
      lastName: 'Smith',
      username: 'eve-immutable',
      email: 'eve@email.com',
      password: 'eve',
      projects: [
        { id: 3, ownerId: 3, title: 'Project by Eve', ownerOnly: 'only eve can see this' },
        { id: 6, ownerId: 3, title: 'Published project by Eve', ownerOnly: 'only eve can see this', published: true },
      ],
      role: Role.User,
    },
  ]);
};

export { seed }