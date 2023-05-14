const express = require('express')
const router = express.Router()
const db = require('../modules/connect-mysql')
const validateToken = require('../middlewares/AuthMiddleware')


// ----[like a post]
router.post('/:pid', validateToken, async (req, res) => {

  if (!req.user){
    return res.json(req.output)
  }
  
  let output = {
    success: false,
    note: ''
  }

  const pid = +req.params.pid || 0
  if (!pid){
    output.note = 'Invalid post ID'
    return res.json(output)
  }

  const {uid} = req.user

  // --[check already liked]
  const sql1 = "SELECT * FROM `likes` WHERE `post_id`=? AND `user_id`=?"
  const [rows1] = await db.query(sql1, [pid, uid])

  // --[already liked -> unlike the post]
  if (rows1.length > 0){
    const sql2 = "DELETE FROM `likes` WHERE `post_id`=? AND `user_id`=?"
    const [result2] = await db.query(sql2, [pid, uid])

    output.success = true
    output.note = 'Disliked the post.'
    output.liked = false
    return res.json(output)
  }

  // --[haven't liked -> like the post]
  const sql = "INSERT INTO `likes`(`post_id`, `user_id`) VALUES (?, ?)"
  const [result] = await db.query(sql, [pid, uid])

  if (result.affectedRows){
    output.success = true
    output.note = 'Liked the post.'
    output.liked = true
  } else {
    output.note = 'sql error'
  }

  return res.json(output)
})

// ----[get a post list that a user has liked]
router.get('/checkLikeList/:uid', async (req, res) => {
  const uid = req.params.uid

  const sql = "SELECT post_id FROM `likes` WHERE user_id=?;"
  let [rows] = await db.query(sql, [uid])

  rows = rows.map(el => {
    return el.post_id
  })

  return res.json(rows)
})


module.exports = router