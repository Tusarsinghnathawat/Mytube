import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'

const app = express()
app.use(cors({
    
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
            'https://mytube-inky.vercel.app' 
        ];
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({
    extended : true,
    limit : "16kb"
}))
app.use(express.static("public"))
app.use(cookieParser())

//routes
import { userRouter } from './routes/user.routes.js'
import { videoRouter } from './routes/video.routes.js'
import { healthcheckRouter } from './routes/healthcheck.routes.js'
import { commentRouter } from './routes/comment.routes.js'
import { likeRouter } from './routes/like.routes.js'
import { subscriptionRouter } from './routes/subscription.routes.js'
import { playlistRouter } from './routes/playlist.routes.js'
import { tweetRouter } from './routes/tweet.routes.js'
import { dashboardRouter } from './routes/dashboard.routes.js'


//rout decleration
//here we are not using app.get insteed we are using app.use because route and controllers are not in same folder hence routes are intrecting with middlewares hecse app.use
app.use("/api/v1/user", userRouter)
// http://localhost:800/api/v1/user
app.use("/api/v1/video", videoRouter)
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/comment", commentRouter)
app.use("/api/v1/like", likeRouter)
app.use("/api/v1/subscription", subscriptionRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/tweet", tweetRouter )
app.use("/api/v1/dashboard", dashboardRouter )


export default app


//Note:
//1. asyncHandler is used to handle errors in async functions, so we don't have to use try-catch blocks everywhere.
//2. apiError is a custom error class to standardize error responses.         