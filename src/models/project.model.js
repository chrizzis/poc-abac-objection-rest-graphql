import BaseModel from './base.model.js';
import { User } from './index.js'

class Project extends BaseModel {
  static get jsonSchema() {
    return {
      type: 'object',

      properties: {
        id: { type: 'integer' },
        ownerId: { type: 'integer' },
        title: { type: 'string', minLength: 1, maxLength: 255 },
        ownerOnly: { type: 'string', minLength: 1, maxLength: 255 },
        published: { type: 'boolean' }
      },
    };
  }

  static get relationMappings() {
    return {
      owner: {
        relation: this.BelongsToOneRelation,
        // modelClass: 'user.model',
        // modelClass: 'User',
        modelClass: User,
        join: {
          from: 'Project.ownerId',
          to: 'User.id',
        },
      },
    };
  }
};

export default Project