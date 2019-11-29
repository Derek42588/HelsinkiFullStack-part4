/* eslint-disable no-unused-vars */
const listHelper = require('../utils/list_helper')
const logger = require ('../utils/logger')
const _ = require('lodash')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')
const User = require('../models/user')
const bcrypt = require('bcrypt')

beforeEach(async () => {
  await Blog.deleteMany({})

  const blogObjects = listHelper.initialBlogs
    .map(blog => new Blog(blog))

  const promiseArray = blogObjects.map(blog => blog.save())
  await Promise.all(promiseArray)

})



test('dummy returns one', () => {
  const blogs = []

  const result = listHelper.dummy(blogs)
  expect(result).toBe(1)
})

describe('total likes', () => {
  const listWithOneBlog = [
    {
      _id: '5a422aa71b54a676234d17f8',
      title: 'Go To Statement Considered Harmful',
      author: 'Edsger W. Dijkstra',
      url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
      likes: 5,
      __v: 0
    }
  ]


  test('of empty list is zero', () => {
    const result = listHelper.totalLikes([])
    expect(result).toBe(0)
  })

  test('when list only has one blog equals the likes of that', () => {
    const result = listHelper.totalLikes(listWithOneBlog)
    expect(result).toBe(5)
  })

  test('of a bigger list is calculated right', () => {
    const result = listHelper.totalLikes(listHelper.initialBlogs)
    expect(result).toBe(36 + 693)

  })

  describe('favorite blog', () => {
    test('finding the favorite blog', () => {
      const result = listHelper.favoriteBlog(listHelper.initialBlogs)
      expect(result.title).toEqual('React patterns')

    //   console.log(result)
    })
  })

  describe('find one specific blog', () => {
    test('finding a specific blog', () => {
      const result = listHelper.findSpecific(listHelper.initialBlogs)

      expect(result[0].title).toEqual('React patterns')
    })
  })

  describe('most posts', () => {
    test('finding who posted the most', () => {
      const result = listHelper.mostBlogs(listHelper.initialBlogs)
      expect(result).toEqual({
        author: 'Edsger W. Dijkstra',
        blogs: 4
      })
    })
  })

  describe('most likes', () => {
    test('finding who was liked the most', () => {
      const result = listHelper.mostLikes(listHelper.initialBlogs)
      console.log(result)
      expect(result).toEqual({
        author: 'Michael Chan',
        likes: 700
      })
    })
  })

})

describe('when there are initially blogs saved', () => {

  test('blogs are returned as JSON', async () => {
    await api
      .get('/api/blogs/')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })


  test ('all blogs are returned mongo', async () => {
    const response = await api.get('/api/blogs/')

    expect(response.body.length).toBe(listHelper.initialBlogs.length)
  })

  test ('a specific blog is within the returned blogs', async () => {
    const response = await api.get('/api/blogs/')

    const titles = response.body.map(b => b.title)

    expect(titles).toContain('Go To Statement Considered Harmful')
  })

})

describe('viewing a specific note', () => {

  test ('succeeds with a valid id', async () => {
    const blogsAtStart = await listHelper.blogsInDb()

    const blogToView = blogsAtStart[0]

    const resultBlog = await api
      .get(`/api/blogs/${blogToView.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    expect(resultBlog.body).toEqual(blogToView)
  })

  test('fails with status 404 if note does not exist', async () => {
    const validNonExistingId = await listHelper.nonExistingId()

    logger.error(validNonExistingId)

    await api
      .get(`/api/blogs/${validNonExistingId}`)
      .expect(404)
  })

  test('fails with status 400 if id is invalid', async () => {
    const invalidId = '5a3d5da59070081a82a3445'

    await api
      .get(`/api/blogs/${invalidId}`)
      .expect(400)
  })

})

test ('update an updateBlog', async () => {
  const blogsAtStart = await listHelper.blogsInDb()

  const blogToUpdate = blogsAtStart[0]

  blogToUpdate.title = 'lmao get fucked'

  await api
    .put(`/api/blogs/${blogsAtStart[0].id}`)
    .send(blogToUpdate)
    .expect(200)

  const blogsAtEnd = await listHelper.blogsInDb()

  expect(blogsAtEnd[0].title).toBe(blogToUpdate.title)


})

test('whats the name of the idField', async() => {
  const blogsAtStart = await listHelper.blogsInDb()
  const blog = blogsAtStart[0]

  expect(blog.id).toBeDefined()

})

describe('when there is initially one user at db', () => {
  beforeEach(async () => {
    await User.deleteMany({})
    const saltRounds = 10
    const passwordHash = await bcrypt.hash('sekret', saltRounds)

    const user = new User({
      username: 'root',
      name: 'Rooty rootface',
      passwordHash,
    })

    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await listHelper.usersInDb()

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await listHelper.usersInDb()
    expect(usersAtEnd.length).toBe(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).toContain(newUser.username)
  })

  test('password that is 3 characters or less will fail', async () => {
    const usersAtStart = await listHelper.usersInDb()

    const newUser = {
      username: 'uniqueBoi',
      name: 'fail please',
      password: '333'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('password must be longer than 3 characters')

    const usersAtEnd = await listHelper.usersInDb()
    expect(usersAtEnd.length).toBe(usersAtStart.length)
  })

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await listHelper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('`username` to be unique')

    const usersAtEnd = await listHelper.usersInDb()
    expect(usersAtEnd.length).toBe(usersAtStart.length)
  })

  test('user creation fails with proper status code and message if username is blank', async () => {
    const usersAtStart = await listHelper.usersInDb()

    const newUser = {
      name: 'Superuser',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('`username` is required')
    logger.error(result.body.error)

    const usersAtEnd = await listHelper.usersInDb()
    expect(usersAtEnd.length).toBe(usersAtStart.length)
  })

  test('user creation fails with proper status code and message if password is blank', async () => {
    const usersAtStart = await listHelper.usersInDb()

    const newUser = {
      username: 'uniqueDude',
      name: 'Superuser'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('please enter a password')
    logger.error(result.body.error)

    const usersAtEnd = await listHelper.usersInDb()
    expect(usersAtEnd.length).toBe(usersAtStart.length)
  })
})

afterAll(() => {
  mongoose.connection.close()
})