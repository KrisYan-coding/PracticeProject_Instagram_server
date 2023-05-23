const express = require('express')
const router = express.Router()
const db = require('../modules/connect-mysql')
const validateToken = require('../middlewares/AuthMiddleware')
const upload = require('./../modules/upload')


// --[get post list]
router.get('/', validateToken, async (req, res) => {
  
  if (req.output.success){
    const sql = 'SELECT a.*, b.post_id AS count_likes_check, COUNT(a.id) AS count_likes, c.username AS new_username, c.image FROM `posts` AS a LEFT JOIN `likes` AS b ON a.id=b.post_id LEFT JOIN users AS c ON a.user_id=c.user_id GROUP BY a.id;'
    let [rows] = await db.query(sql)
  
    rows = rows.map( el => {
      if (el.count_likes_check===null){
        el.count_likes=0
      }
      return el
    })

    const sql4 = "SELECT a.*, COUNT(*) AS count_comment, b.post_id AS count_comment_check FROM `posts` AS a LEFT JOIN comments AS b ON a.id=b.post_id GROUP BY a.id;"
    let [rows4] = await db.query(sql4)
  
    let commentCount = {}
    rows4.map( el => {
      if (el.count_comment_check!==null){
        commentCount[el.id] = el.count_comment
      }
      return
    })

    let postImagesID = rows.map(el => el.id)
    const sql3 = `SELECT * FROM post_images WHERE post_id IN (${postImagesID});`
    const [rows3] = await db.query(sql3)
    const postImages = rows3.reduce((sum, el) => {
      const oldList = sum[el.post_id]? sum[el.post_id] : []
      const newList = [...oldList, el.post_image]

      return {...sum, [el.post_id]: newList}
    }, {})
  
    let likedList = []
    if (req.user){
      const sql2 = "SELECT * FROM `likes` WHERE user_id=?"
      let [rows2] = await db.query(sql2, [req.user.uid])
      likedList = rows2.map(el => {
        return el.post_id
      })
    }

    

    return res.json({success: true, posts: rows, likedList, postImages, commentCount})

  } else {
    return res.json({success: false})
  }

  
})

// --[create a post]
router.post('/', validateToken, async (req, res) => {
  if (!req.output.success){
    console.log('123')
    return res.json(req.output)
  }

  let output = {
    success: false,
    error: '',
    data: req.body,
    note: ''
  }

  const {title, postText} = req.body
  const {username, uid} = req.user

  if (!title){
    output.error = '標題為必填'
    return res.json(output)
  }
  if (!postText){
    output.error = '內容為必填'
    return res.json(output)
  }
  if (!username){
    output.error = '使用者為必填'
    return res.json(output)
  }

  const sql = 'INSERT INTO `posts`(`title`, `postText`, `user_id`, `username`) VALUES (?, ?, ?, ?)'
  const [result] = await db.query(sql, [title, postText, uid, username])
  output.success = result.affectedRows

  return res.json(output)
})

// --[get a post by post id]
router.get('/byId/:pid', async (req, res) => {

  let output = {
    success: false,
    error: '',
    note: req.params.pid
  }

  const pid = +req.params.pid || 0
  if (!pid){
    output.error = 'invalid pid'
    return res.json(output)
  }

  const sql = "SELECT * FROM `posts` WHERE `id`=?"

  const [rows] = await db.query(sql, [pid])

  return res.json(rows)
})

// --[delete a post]
router.post('/delete/:pid', validateToken, async (req, res) => {
  let output = {
    result: '',
    error: ''
  }

  if (req.output.success) {
    const pid = req.params.pid
    const sql = "DELETE FROM `posts` WHERE `id`=?"
    const [result] = await db.query(sql, [pid])
    if (result.affectedRows){
      output.result += "delete from `posts` OK"
    }
    const sql2 = "DELETE FROM `likes` WHERE `post_id`=?"
    const [result2] = await db.query(sql2, [pid])
    if (result2.affectedRows){
      output.result += " ;delete from `likes` OK"
    }
    const sql3 = "DELETE FROM `comments` WHERE `post_id`=?"
    const [result3] = await db.query(sql3, [pid])
    if (result3.affectedRows){
      output.result += " ;delete from `comments` OK"
    }

  } else {
    output.error = req.output.error
  }

  return res.json(output)
})

// --[get posts by user id]
router.get('/byUserId/:uid', async (req, res) => {
  const uid = req.params.uid

  const sql = "SELECT a.*, b.post_id AS count_likes_check, COUNT(a.id) AS count_likes, c.username AS new_username, c.image FROM `posts` AS a LEFT JOIN `likes` AS b ON a.id=b.post_id LEFT JOIN users AS c ON a.user_id=c.user_id WHERE a.user_id=? GROUP BY a.id;"
  let [rows] = await db.query(sql, [uid])

  rows = rows.map(el => {
    if (el.count_likes_check===null){
      el.count_likes = 0
    }
    return el
  })

  let postImagesID = rows.map(el => el.id)
  console.log(postImagesID)
  let postImages = {}
  if (postImagesID.length){
    const sql3 = `SELECT * FROM post_images WHERE post_id IN (${postImagesID});`
    const [rows3] = await db.query(sql3)
    postImages = rows3.reduce((sum, el) => {
      const oldList = sum[el.post_id]? sum[el.post_id] : []
      const newList = [...oldList, el.post_image]
  
      return {...sum, [el.post_id]: newList}
    }, {})
  }

  return res.json({posts: rows, postImages})
})

// --[edit a post]
router.post('/edit', [validateToken, upload.none()], async (req, res) => {
  const {pid, title, postText} = req.body
  // note: multipart-formdata 要用 multer upload 來解析

  const output = {
    success: false
  }

  // console.log(pid, title, postText)
  const sql = "UPDATE `posts` SET `title`=?,`postText`=? WHERE `id`=?"
  const [result] = await db.query(sql, [title, postText, pid])
  if (result.affectedRows){
    output.success = true
  }

  return res.json(output)
})

// --[delete a post]
router.delete('/delete/:pid', async (req, res) => {
  const {pid} = req.params

  const output = {
    success: false
  }

  const sql = "DELETE FROM `posts` WHERE `id`=?"
  const [result] = await db.query(sql, [pid])
  if (result.affectedRows){
    output.success = true
  }

  return res.json(output)

})


module.exports = router