const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const logger = require('../utils/logger')

blogsRouter.get('/', async (request, response, next) => {

  try {
    const blogs = await Blog.find({})
    response.json(blogs.map(blog => blog.toJSON()))
  } catch (exception) {
    next(exception)
  }

  // Blog.find({}).then(blogs => {
  //   response.json(blogs.map(blog => blog.toJSON()))
  // })
})

blogsRouter.get('/:id', async (request, response, next) => {

  try {
    const blog = await Blog.findById(request.params.id)
    if (blog) {
      response.json(blog.toJSON())
    } else {
      response.send(404).end()
    }
  } catch(exception) {
    next(exception)
  }
})

blogsRouter.post('/', async (request, response, next) => {

  const blog = new Blog(request.body)

  try {
    const savedNote = await blog.save()
    response.json(savedNote.toJSON())
  } catch (exception) {
    next(exception)
  }

  // blog.save()
  //   .then(savedBlog => {
  //     response.json(savedBlog.toJSON())
  //   })
  //   .catch(error => next(error))
})

blogsRouter.delete('/:id', async (request, response, next) => {

  try {
    await Blog.findByIdAndRemove(request.params.id)
    response.status(204).end()
  } catch (exception) {
    next(exception)
  }

})

blogsRouter.put('/:id', async (request, response, next) => {
  const body = request.body

  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes
  }

  try {
    const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
    response.json(updatedBlog.toJSON())
  } catch(exception) {
    next(exception)
  }

  // Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
  //   .then(updatedBlog => {
  //     response.json(updatedBlog.toJSON())
  //   })
  //   .catch(error => next(error))
})

module.exports = blogsRouter
