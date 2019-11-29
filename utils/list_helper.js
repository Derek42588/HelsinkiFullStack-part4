/* eslint-disable no-unused-vars */

const _ = require('lodash')

const Blog = require('../models/blog')
const User = require('../models/user')

const initialBlogs = [
  {
    title: 'React patterns',
    author: 'Michael Chan',
    url: 'https://reactpatterns.com/',
    likes: 700,
  },
  {
    title: 'Go To Statement Considered Harmful',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
    likes: 5,

  },
  {
    title: 'Lol i made them',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
    likes: 12,
  },
  {
    title: 'Duplicate then tested as if there were no duplicates',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
    likes: 0,
  },
  {
    title: 'Canonical string reduction',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
    likes: 0,
  },
  {
    title: 'First class tests',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll',
    likes: 10,
  },
  {
    title: 'TDD harms architecture',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html',
    likes: 0,
  },
  {
    title: 'Type wars',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
    likes: 2,
  }

]

const nonExistingId = async () => {
  const blog = new Blog({ title: 'gettingDeletedSoon', author: 'lol', url: 'lolll' })

  await blog.save()
  await blog.remove()

  return blog._id.toString()
}

const blogsInDb = async() => {
  const blogs = await Blog.find({})
  return blogs.map(blog => blog.toJSON())
}

const usersInDb = async() => {
  const users = await User.find({})
  return users.map(u => u.toJSON())
}


const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {

  const likesArray = blogs.map(b => b.likes)

  return likesArray.length === 0
    ? 0
    : likesArray.reduce((a,b) => a + b, 0)
}

const favoriteBlog = (blogs) => {
  const likesArray = blogs.map (b => b.likes)

  if (likesArray === 0) {
    return 'no blogs'
  } else {
    const mostLiked = (Math.max(...likesArray))
    return blogs.find( ( { likes }) => likes === mostLiked)
  }
}

const findSpecific = (blogs) => {


  return _.filter(blogs, { 'likes': 700 } )

}

const mostBlogs = (blogs) => {
  let mostPosts = _.countBy(blogs, 'author')

  let topPosts = 0
  let topPoster = ''
  _.forEach(mostPosts, function(value, key) {
    if (value > topPosts) {
      topPosts = value
      topPoster = key
    }
  })

  return {
    author: topPoster,
    blogs: topPosts
  }


}

const mostLikes = (blogs) => {
  // let filter = _.map(blogs, 'author')
  // console.log(filter)

  let filter = _(blogs)
    .map('author')
    .uniq()
    .map(key => ({
      key,
      val: _(blogs).filter({ author: key }).sumBy('likes')
    }))
    .value()

  let likedAuthor = ''
  let likes = 0

  _.forEach(filter, function(uniqueAuthor) {
    if (uniqueAuthor.val > likes ) {
      likes = uniqueAuthor.val,
      likedAuthor = uniqueAuthor.key
    }

  })

  return {
    author: likedAuthor,
    likes: likes
  }

}

module.exports = {
  usersInDb,
  dummy,
  totalLikes,
  favoriteBlog,
  findSpecific,
  mostBlogs,
  mostLikes,
  initialBlogs,
  blogsInDb,
  nonExistingId
}