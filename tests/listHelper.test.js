/* eslint-disable no-unused-vars */
const listHelper = require('../utils/list_helper')
const logger = require ('../utils/logger')
const _ = require('lodash')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')

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
      .get('/api/blogs')
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

describe('addition of a new note', () => {
  test('succeeds with valid data', async () => {
    const blogToPost = {
      title: 'Scooby dooby doo where are you',
      author: 'an author',
      url: 'www.dopefucknblog.com',
      likes: 1000
    }

    await api
      .post('/api/blogs')
      .send(blogToPost)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await listHelper.blogsInDb()

    const titles = blogsAtEnd.map(b => b.title)

    expect(titles).toContainEqual(blogToPost.title)


  })

  test('fails with status 400 if data invalid -- no title', async () => {
    const newBlog = {
      author: 'an author',
      url: 'www.dopefucknblog.com',
      likes: 1000
    }

    await api
      .post('/api/blogs/')
      .send(newBlog)
      .expect(400)
  })
  test('fails with status 400 if data invalid -- no url', async () => {
    const newBlog = {
      title: 'a dope title',
      author: 'an author',
      likes: 1000
    }

    await api
      .post('/api/blogs/')
      .send(newBlog)
      .expect(400)
  })

})

describe('delition of a note', () => {
  test ('succeeds with status 204 if id is valud', async () => {
    const blogsAtStart = await listHelper.blogsInDb()

    const blogToDelete = blogsAtStart[0]

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .expect(204)

    const blogsAtEnd = await listHelper.blogsInDb()

    expect(blogsAtEnd.length).toEqual(listHelper.initialBlogs.length -1)

    const titles = blogsAtEnd.map(b => b.title)

    expect(titles).not.toContain(blogToDelete.title)
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

test('blog without a like noLike', async() => {
  const blog = {
    title: 'im a big fat loser',
    author: 'mr fuckwad',
    url: 'lm.ao'
  }

  await api
    .post('/api/blogs')
    .send(blog)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await listHelper.blogsInDb()

  const justPosted = _.find(blogsAtEnd, { 'author': blog.author })

  expect(justPosted.likes).toBe(0)
})


afterAll(() => {
  mongoose.connection.close()
})