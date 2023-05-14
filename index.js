const express = require('express')
const cors = require('cors')
const app = express()
require('dotenv').config()
const bodyParser = require("body-parser")

// ------[express-session]
const session = require('express-session');

// ------[express-mysql-session 要在 express-session require 後才 require，要將 session 參數傳入]
const MysqlStore = require('express-mysql-session')(session);
// --得到 class MysqlStore

// ------[database]
const db = require('./modules/connect-mysql');
const sessionStore = new MysqlStore({}, db);
// --argv -first: 連線資料庫的帳號密碼，如果已經有建立 db 連線就給{}； -second: 已建立的 db 連線


// ------[設定 session middleware]--
app.use(session({
  saveUninitialized: false, // session尚未初始化前是否要儲存
  resave: false, // 沒有變更內容時是否要強制回存
  secret: 'djnfjvjknfvjnienekkopjidkm', // 加密用的字串
  store: sessionStore, // session 要儲存到資料庫(session + db)，資料庫會自動生成一個 "sessions" 資料表
  cookie: {
    maxAge: 1200_000, // cookie 存活時間，毫秒
  }
}));

app.use(bodyParser.json())
app.use(express.json()) // 解析 form-data
app.use(express.urlencoded({ extended: true }));
// ------[設定 cors middleware]--
// const corsOptions = {
//   credentials: true,  // res "Access-Control-Allow-Credentials: true"
//   origin: (origin, callback) => {
//     console.log({origin}); // origin: 從哪裡來拜訪的(PD)，會設定給 res "Access-Control-Allow-Origin: origin"，發 fetch 才有
//     callback(null, true);
//     // --argv -first: error/null
//     // 沒有設白名單，沒有設條件，任何 PDP 來的 req 都可以接受
//   },
// };
app.use(cors())

// app.use(express.urlencoded({extended: false}))


app.use('/posts', require('./routes/Posts'))
app.use('/comments', require('./routes/Comments'))
app.use('/auth', require('./routes/Users'))
app.use('/likes', require('./routes/Likes'))

app.get('/set-sess', (req, res) => {
  req.session.test2 = {
    a : 100
  }
  req.session.save()
  res.json(req.session)
})

app.get('/try-sess', (req, res) => {
  res.json(req.session)
})

const port = process.env.PORT || 3001

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})