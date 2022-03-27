import interpret from '.././../src/access-control/interpret.js'

describe('function interpret - equality ONLY', () => {
  let aclConditions;
  let reqConditions;

  describe('api examples', () => {
    describe('req only', () => {
      test('GET /entities', () => {
        reqConditions = {}
        const queryFilters = interpret(reqConditions)
        expect(queryFilters).toEqual([])
      })
      test('GET /users/:userId/entities/:id', () => {
        reqConditions = {
          $and: {
            id: 'req.params.id',
            ownerId: 'req.params.userId'
          }
        }
        const queryFilters = interpret(reqConditions)
        expect(queryFilters).toEqual([
          { where: { id: 'req.params.id', ownerId: 'req.params.userId' } },
        ])
      })
      test(`GET /entities?or={rating:4,size:'large'}`, () => {
        reqConditions = {
          $or: {
            rating: 5,
            size: 'large',
          }
        }
        const queryFilters = interpret(reqConditions)
        expect(queryFilters).toEqual([
          { where: { rating: 5 } },
          { orWhere: { size: 'large' } },
        ])
      })
      test('GET /published/:id', () => {
        reqConditions = {
          $limitOr: {
            published: true
          },
          $and: {
            id: 'req.params.id'
          }
        }
        const queryFilters = interpret(reqConditions)
        expect(queryFilters).toEqual([
          { where: { id: 'req.params.id', published: true } },
        ])
      })
      test(`GET /users/:userId/published?or={rating:5,size:'large'}`, () => {
        reqConditions = {
          $limitOr: {
            published: true
          },
          $and: {
            ownerId: 'req.params.userId'
          },
          $or: {
            rating: 5,
            size: 'large',
          }
        }
        const queryFilters = interpret(reqConditions)
        expect(queryFilters).toEqual([
          { where: { ownerId: 'req.params.userId', published: true } },
          {
            andWhere: [
              { where: { rating: 5 } },
              { orWhere: { size: 'large' } },
            ]
          },
        ])
      })
    })
    describe('acl filtered', () => {
      test('GET /acl-entities', () => {
        aclConditions = {
          $or: [{
            published: true,
            ownerId: 'req.user.id',
          }]
        }
        reqConditions = {}
        const queryFilters = interpret(reqConditions, aclConditions)
        expect(queryFilters).toEqual([
          { where: { published: true } },
          { orWhere: { ownerId: 'req.user.id' } },
        ])
      })
      test('GET /acl-entities/:id', () => {
        aclConditions = {
          $or: [{
            published: true,
            ownerId: 'req.user.id',
          }]
        }
        reqConditions = {
          $and: {
            id: 'req.params.id'
          }
        }
        const queryFilters = interpret(reqConditions, aclConditions)
        expect(queryFilters).toEqual([
          { where: { id: 'req.params.id' } },
          {
            andWhere: [
              { where: { published: true } },
              { orWhere: { ownerId: 'req.user.id' } },
            ],
          }
        ])
      })
      test('GET /acl-published', () => {
        aclConditions = {
          $or: [{
            published: true,
            ownerId: 'req.user.id',
          }]
        }
        reqConditions = {
          $limitOr: {
            published: true
          },
        }
        const queryFilters = interpret(reqConditions, aclConditions)
        expect(queryFilters).toEqual([
          { where: { published: true } },
        ])
      })
      test('GET /acl-published/:id', () => {
        aclConditions = {
          $or: [{
            published: true,
            ownerId: 'req.user.id',
          }]
        }
        reqConditions = {
          $limitOr: {
            published: true
          },
          $and: {
            id: 'req.params.id'
          }
        }
        const queryFilters = interpret(reqConditions, aclConditions)
        expect(queryFilters).toEqual([
          { where: { id: 'req.params.id', published: true } },
        ])
      })
      test('GET /users/:userId/acl-published/:id', () => {
        aclConditions = {
          $or: [{
            published: true,
            ownerId: 'req.user.id',
          }]
        }
        reqConditions = {
          $limitOr: {
            published: true
          },
          $and: {
            ownerId: 'req.params.userId',
            id: 'req.params.id'
          }
        }
        const queryFilters = interpret(reqConditions, aclConditions)
        expect(queryFilters).toEqual([
          { where: { id: 'req.params.id', ownerId: 'req.params.userId', published: true } },
        ])
      })
      test('GET /users/:userId/acl-entities/:id?or={rating:5}', () => {
        aclConditions = {
          $or: [{
            published: true,
            ownerId: 'req.user.id',
          }]
        }
        reqConditions = {
          $and: {
            ownerId: 'req.params.userId',
            id: 'req.params.id'
          },
          $or: {
            rating: 5
          }
        }
        const queryFilters = interpret(reqConditions, aclConditions)
        expect(queryFilters).toEqual([
          { where: { id: 'req.params.id', ownerId: 'req.params.userId' } },
          {
            andWhere: [
              { where: { published: true } },
              { orWhere: { rating: 5 } },
            ]
          },
        ])
      })
    })
  })
  describe('validation (req only, acl is trusted)', () => {
    const invalidConditions = {
      array: [],
      object: {},
      function: () => { },
    }
    for (const [key, value] of Object.entries(invalidConditions)) {
      test(`throws if a request condition value is a ${key}`, () => {
        reqConditions = {
          $limitOr: {
            published: true,
            [key]: value
          },
        }

        expect.assertions(1);
        try {
          interpret(reqConditions)
        } catch (e) {
          expect(e.message).toBe("validation");
        }
      })
    }
  })
})