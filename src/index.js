// require('dotenv').config({ path: './env' })
import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from './app.js'
dotenv.config({
    path: './.env'
})



connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
        })
    })
    .catch((err) => {
        console.log("MONGO db connection failed !!! ", err);
    })









/* first type----------

import express from"express"
const app = express()

( async () => {
    try{
        mongoose.connect(`${process.env.MONGODB_URI}`)
        app.on("error", (error) => {
            console.log("ERROR: ",error);
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })

    } catch (error) {
        console.error("ERROR: ", error);
        throw err
    }
})()
*/