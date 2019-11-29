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
  await User.deleteMany({})

  const saltRounds = 10
  let passwordHash = await bcrypt.hash('sekret', saltRounds)

  const user = new User({
    username: 'root',
    name: 'New Root Two',
    passwordHash,
  })

  await user.save()

  const blog = {
    title: 'title',
    author: 'author',
    url: 'com.dot',
    likes: 1
  }

  const userLogin = {
    username: 'root',
    password: 'sekret'
  }

  const response = await api
    .post('/api/login/')
    .send(userLogin)

  const token = 'bearer ' + response.body.token

  await api
    .post('/api/blogs')
    .set('Authorization', token)
    .send(blog)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  passwordHash = await bcrypt.hash('password', saltRounds)

  const userTwo = new User({
    username: 'userTwo',
    name: 'Mr Two',
    passwordHash,
  })

  await userTwo.save()

  const blogTwo = {
    title: 'titleTwo',
    author: 'authorTwo',
    url: 'com.dot',
    likes: 1
  }

  const userTwoLogin = {
    username: 'userTwo',
    password: 'password'
  }

  const responseTwo = await api
    .post('/api/login/')
    .send(userTwoLogin)

  const tokenTwo = 'bearer ' + responseTwo.body.token

  await api
    .post('/api/blogs')
    .set('Authorization', tokenTwo)
    .send(blogTwo)
    .expect(200)
    .expect('Content-Type', /application\/json/)

})

describe ('check the first two blog posts and users', () => {

  test('First two users and posts', async () => {


    const blogsAtStart = await listHelper.blogsInDb()
    const titles = blogsAtStart.map(b => b.title)

    const usersAtStart = await listHelper.usersInDb()
    const users = usersAtStart.map(u => u.username)

    expect(titles).toContainEqual('title')
    expect(titles).toContainEqual('titleTwo')
    expect(users).toContainEqual('root')
    expect(users).toContainEqual('userTwo')
    expect(blogsAtStart.length).toEqual(2)
    expect(usersAtStart.length).toEqual(2)

  })
})


test ('delete succeeds with status 204 if blog id is valid', async () => {
  const blogsAtStart = await listHelper.blogsInDb()

  const blogToDelete = blogsAtStart[0]
  logger.error(blogToDelete.user.toString())

  let user = {}
  if (blogToDelete.author === 'author') {
    user = {
      username: 'root',
      password: 'sekret'
    }
  } else {
    user = {
      username: 'userTwo',
      password: 'password'
    }
  }

  const response = await api
    .post('/api/login/')
    .send(user)

  const token = 'bearer ' + response.body.token

  await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .set('Authorization', token)
    .expect(204)

  const blogsAtEnd = await listHelper.blogsInDb()
  expect(blogsAtEnd.length).toEqual(1)
  const titles = blogsAtEnd.map(b => b.title)
  expect(titles).not.toContain(blogToDelete.title)
})

test('blog without a like noLike', async() => {
  const user = {
    username: 'root',
    password: 'sekret'
  }
  const response = await api
    .post('/api/login/')
    .send(user)

  const token = 'bearer ' + response.body.token
  const blog = {
    title: 'im a big fat loser',
    author: 'mr fuckwad',
    url: 'lm.ao'
  }

  await api
    .post('/api/blogs')
    .set('Authorization', token)
    .send(blog)
    .expect(200)
    .expect('Content-Type', /application\/json/)


  const blogsAtEnd = await listHelper.blogsInDb()

  const justPosted = _.find(blogsAtEnd, { 'author': blog.author })

  expect(justPosted.likes).toBe(0)
})

describe('addition of a new note', () => {
  test('succeeds with valid data', async () => {

    const user = {
      username: 'root',
      password: 'sekret'
    }
    const response = await api
      .post('/api/login/')
      .send(user)

    const token = 'bearer ' + response.body.token

    const blogToPost = {
      title: 'Scooby dooby doo where are you',
      author: 'an author',
      url: 'www.dopefucknblog.com',
      likes: 1000
    }

    await api
      .post('/api/blogs')
      .set('Authorization', token)
      .send(blogToPost)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await listHelper.blogsInDb()

    const titles = blogsAtEnd.map(b => b.title)

    expect(titles).toContainEqual(blogToPost.title)


  })

  test('fails with status 400 if data invalid -- no title', async () => {

    const user = {
      username: 'root',
      password: 'sekret'
    }
    const response = await api
      .post('/api/login/')
      .send(user)

    const token = 'bearer ' + response.body.token

    const newBlog = {
      author: 'an author',
      url: 'www.dopefucknblog.com',
      likes: 1000
    }

    await api
      .post('/api/blogs/')
      .set('Authorization', token)
      .send(newBlog)
      .expect(400)

  })
  test('fails with status 400 if data invalid -- no url', async () => {
    const user = {
      username: 'root',
      password: 'sekret'
    }
    const response = await api
      .post('/api/login/')
      .send(user)

    const token = 'bearer ' + response.body.token

    const newBlog = {
      title: 'a dope title',
      author: 'an author',
      likes: 1000
    }

    await api
      .post('/api/blogs/')
      .set('Authorization', token)
      .send(newBlog)
      .expect(400)
  })

})

afterAll(() => {
  mongoose.connection.close()
})