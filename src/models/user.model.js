import BaseModel from './base.model.js';
import { Project } from './index.js'

class User extends BaseModel {
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['username', 'password', 'email', 'firstName', 'lastName'],

      properties: {
        id: { type: 'integer' },
        username: { type: 'string', minLength: 1, maxLength: 255 },
        firstName: { type: 'string', minLength: 1, maxLength: 255 },
        lastName: { type: 'string', minLength: 1, maxLength: 255 },
        email: { type: 'string', minLength: 1, maxLength: 255 },
        password: { type: 'string', minLength: 1, maxLength: 255 },
        // role: { type: 'enum' },
      },
    };
  }

  static get relationMappings() {
    return {
      projects: {
        relation: this.HasManyRelation,
        modelClass: Project,
        join: {
          from: 'User.id',
          to: 'Project.ownerId',
        },
      },
    };
  }
};

export default User

