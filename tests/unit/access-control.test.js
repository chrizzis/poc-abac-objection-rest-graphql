import { User, Project } from '../../src/models/index.js'
import Role from '../../src/access-control/role.js'
import { filterDynamic } from '../helpers/index.js'

describe("Find queries & serialization", () => {
  // beforeAll(async () => {
  // });
  // beforeEach(async () => {
  // });
  // afterAll(async () => {
  // })
  describe("User", () => {
    let user
    test('read access w/ anonymous user', async () => {
      const anon = { role: Role.Anonymous }
      user = await User.query().findById(1).authUser(anon)
      const serializedUser = user.authorizeRead(anon)
      const filteredSerialized = filterDynamic(serializedUser)
      expect(filteredSerialized).not.toHaveProperty('password')
      expect(filteredSerialized).toMatchSnapshot()
    })

    test('read access w/ owner user', async () => {
      const ownerId = 1
      const owner = { role: Role.User, id: ownerId }
      user = await User.query().findById(ownerId).authUser(owner)
      const serializedUser = user.authorizeRead(owner)
      const filteredSerialized = filterDynamic(serializedUser)
      expect(filteredSerialized).toHaveProperty('password')
      expect(filteredSerialized).toMatchSnapshot()
    })
  });
  describe("Project", () => {
    let published
    let unpublished
    test('read published w/ anonymous user', async () => {
      const anon = { role: Role.Anonymous }
      published = await Project.query().findById(4).authUser(anon)
      const serialized = published.authorizeRead(anon)
      expect(serialized).toHaveProperty('published', true)
      expect(serialized).not.toHaveProperty('ownerOnly')
      expect(serialized).toMatchSnapshot()
    })
    test('read unpublished w/ anonymous user', async () => {
      const anon = { role: Role.Anonymous }
      try {
        await Project.query().findById(1).authUser(anon)
      } catch (e) {
        expect(e).toHaveProperty('status', 401)
      }
    })

    test('read unowned unpublished w/ registered user', async () => {
      const unpublishedNonOwnerId = 2
      const userId = 1
      const user = { role: Role.User, id: userId }
      try {
        await Project.query().findById(unpublishedNonOwnerId).authUser(user)
      } catch (e) {
        expect(e).toHaveProperty('status', 403)
      }
    })

    test('read owned unpublished w/ registered user', async () => {
      const ownerId = 1
      const owner = { role: Role.User, id: ownerId }
      unpublished = await Project.query().findById(1).authUser(owner)
      const seralized = unpublished.authorizeRead(owner)
      expect(seralized).toHaveProperty('published', false)
      expect(seralized).toHaveProperty('ownerOnly')
      expect(seralized).toMatchSnapshot()
    })
  });

  // current plugin works for simple queries, but User.query().withGraphFetched('projects').authUser(req.user) requires drilling down into each user
  // will have to dynamically call withgraphfetched to keep refs to projects for auth methods ()
  // what does auth do: all or nothing. what about auth on nested graph?
  // what if authUser can do all the heavy lifting?
  // if this is a list of things, filter to accessible, else try to auth it, if authed, authRead??
  // should I do instead: User.query().withGraphFetched('projects').map(u=>{...u, projects: u.projects.authUser(req.user)})
  describe('User-Project graph', () => {
    test('read access w/ anonymous user', async () => {
      const anon = { role: Role.Anonymous }
      // const workingModifiers = 'accessibleBy'
      const workingModifiers = 'accessibleList, accessibleEntity'
      const userProjects = await User.query()
        .withGraphFetched(`projects(${workingModifiers})`)
        // TODO: userProjects.map(u=>...u.projects.map(p=>p.authorizeRead)) wasnt working b/c class info was lost for user.projects[] (not user)
        .modifiers({
          // filters list
          accessibleList(builder) {
            builder.accessibleBy(anon);
          },
          // TODO: casl.permittedFieldsOf needs a hydrated resource instance to check against
          // TODO: trying to transform in static.afterFind but dont know how to return the correct shit without rebuilding the graph
          // filters fields from entity
          accessibleEntity(builder) {
            builder.selectAccessible(anon)
          }
          // modifiers must by synchronous
          // this is async (requires db to return results)
          // looking into instance hooks: $formatJson
          // authorizeRead(builder) {
          //   builder.authorizeRead(req.user);
          // }
        })
      // .runAfter(async (models, queryBuilder) => {
      //   const foo = queryBuilder.selectAccessible(anon)
      //   // authorizeRead(anon)
      //   return foo;
      // })

      const serialized = userProjects.map(u => {
        // return u.authorizeRead(anon)
        return u
      })
      const filteredSerialized = filterDynamic(serialized)
      expect(filteredSerialized).toMatchSnapshot()
    })
  })
});