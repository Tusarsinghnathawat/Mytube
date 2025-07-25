    //approch-2 import the file 
    import dotenv from 'dotenv'
    import connectDB from './db/index.js';
    // import app from './app.js'
    
    dotenv.config({
        path:'./.env'
    });
    
    connectDB()
    // .then(()=>{
    //    // error ke leye listen
    //     app.on("error", (error)=>{
    //         console.log("ERROR : ",error)
    //         throw error
    //     })
    
    //     app.listen(process.env.PORT || 8000,()=>{
    //         console.log(`app is running at port : ${process.env.PORT}`);
    //     })
    // })
    // .catch((err)=>{
    //        console.log("MONGODB connection failed !!",err)
    // })
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    /*
    APPROCH 1 - most of the code(database connectivity code) is written in the index file 
    itself (not the besr approch)
    
    
    
    import express from 'express'
    const app = express()
    
    ;(async()=>{
        try {
            await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    
            app.on("errror",(error)=>{
                console.log("ERRROR : ", error);
                throw error
            })
    
            app.listen(process.env.PORT,()=>{
                console.log(`app is listening on port : ${process.env.PORT}`);
            })
    
        } catch (error) {
            console.log("ERROR : ",error)
            throw err
        }
    })()
    */