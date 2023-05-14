const {verify} = require('jsonwebtoken')

const validateToken = (req, res, next) => {
  let output = {
    success: false,
    error: '',
    code: 0
  }

  const user = req.header('user')
  // console.log('user', !user)

  if (! user){
    output.error = 'Not Logined.'
    output.code = 100
  } else {
    try{
      const validToken = verify(user, 'someRandomString')
      // --decoded session
      
      if (validToken){
        req.user = validToken
        output.success = true
      } else {
        output.error = 'Invalid token.'
        output.code = 200
      }
    } catch(err){
      output.error = `Invalid token. JWT error: ${err}`
      output.code = 300
    }
  }

  req.output = output
  return next()
}

module.exports = validateToken