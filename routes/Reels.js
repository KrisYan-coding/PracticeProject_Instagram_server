const express = require('express')
const router = express.Router()
const db = require('../modules/connect-mysql')
const validateToken = require('../middlewares/AuthMiddleware')


router.get('/home-reels/:uid', validateToken, async (req, res) => {

  if (req.output.success){
    const uid = req.params.uid

    const sql = "SELECT a.*, b.username, b.image FROM `reels_all` AS a LEFT JOIN `users` AS b ON a.user_id=b.user_id WHERE a.user_id IN (SELECT user_id_followed FROM `follow` WHERE user_id_follower=?) ORDER BY a.upload_datetime DESC;"

    const [rows] = await db.query(sql, [uid])

    let idxRecord = {} // user_id: index in array
    let idxCount = 0
    // const reelsByUser = rows.reduce((sum, el) => {
    //   if (idxRecord[el.user_id] !== undefined){
    //     sum[idxRecord[el.user_id]].push(el)
    //   } else {
    //     idxRecord[el.user_id] = idxCount
    //     sum.push([el])
    //     idxCount += 1
    //   }

    //   return sum
    // }, [])
    const reelsByUser = rows.reduce((sum, el) => {
      if (idxRecord[el.user_id] === undefined){
        idxRecord[el.user_id] = idxCount
        sum.push({userid: el.user_id, username: el.username, image: el.image})
        idxCount += 1
      }

      return sum
    }, [])

    return res.json({validation: true, reels: rows, reelsByUser})

  } else {
    return res.json({validation: false})
  }


})

module.exports = router