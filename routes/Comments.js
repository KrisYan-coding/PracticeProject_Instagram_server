const express = require('express')
const router = express.Router()
const db = require('../modules/connect-mysql')
const validateToken = require('../middlewares/AuthMiddleware')

// ----[取得特定 post id 的所有留言]
router.get('/:pid', async (req, res) => {
  let output = {
    success: false,
    pid: req.params.pid,
    result: [],
    error: ''
  }
  
  const pid = +req.params.pid || 0

  if (!pid){
    output.error = 'invalid post id'
    return res.json(output)
  }

  const sql = "SELECT C.*, U.username FROM `comments` AS C JOIN `users` AS U ON U.user_id=C.user_id WHERE `post_id`=?"
  const [rows] = await db.query(sql, [pid])

  if (rows.length < 1){
    output.error = 'post id not exist'
    return res.json(output)
  }

  output.success = true
  output.result = rows

  return res.json(output)
})

// ----[新增一筆留言]
router.post('/', validateToken, async (req, res) => {
  const {comment, post_id: pid, user_id: uid} = req.body

  let output = {
    success: false,
    error: '',
    data: req.body
  }

  if (!comment || !pid){
    output.error = '欄位不足'
    output.code = 400
    return res.json(output)
  }

  const sql = "INSERT INTO `comments`(`comment_body`, `post_id`, `user_id`) VALUES (?, ?, ?)"

  const [result] = await db.query(sql, [comment, pid, uid])
  output.success = !!result.affectedRows

  return res.json(output)
})

// ----[刪除一筆留言]
router.delete('/:cid', validateToken, async (req, res) => {
  let output = {
    success: false,
    error: '',
    result: ''
  }

  // --[確認有 cid]
  const cid = +req.params.cid || 0
  if (! cid){
    output.error = "Invalid comment id"
    return res.json(output)
  }
  
  const sql = "DELETE FROM `comments` WHERE `comment_id`=?"

  const [result] = await db.query(sql, [cid])

  if (result.affectedRows){
    output.success = true
  } else {
    output.error = 'sql error'
  }

  return res.json(output)
})

module.exports = router