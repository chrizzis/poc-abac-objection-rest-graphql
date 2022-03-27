import { User, Project } from '../../src/models/index.js'
import Role from '../../src/access-control/role.js'
import { filterDynamic } from '../helpers/index.js'

describe("Find queries & serialization", () => {
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
  describe('User-Project graph', () => {
    test('read access w/ anonymous user', async () => {
      const anon = { role: Role.Anonymous }
      const workingModifiers = 'accessibleList, accessibleEntity'
      const userProjects = await User.query()
        .withGraphFetched(`projects(${workingModifiers})`)
        .modifiers({
          // filters list
          accessibleList(builder) {
            builder.accessibleBy(anon);
          },
          // filters fields from entity
          accessibleEntity(builder) {
            builder.selectAccessible(anon)
          }
        })

      const filteredSerialized = filterDynamic(userProjects)
      expect(filteredSerialized).toMatchSnapshot()
    })
  })
});