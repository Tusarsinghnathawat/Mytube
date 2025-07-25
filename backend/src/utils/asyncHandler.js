//wrapper function to handle async errors in Express.js
//This utility function is used to wrap asynchronous route handlers or middleware functions in Express.js.

//kind of boiler plate for error handeling through try catch
//higher-order function used in Node.js (usually with Express) to simplify error handling in asynchronous route handlers or middleware

//const asyncHandler = () => {}    ---> normal functionn
//const asyncHandler = (fun) => () => {} --->higher order function i.e we can pass function as paramert also

const asyncHandler = (funct) =>async (req, res, next) => {
    try {
        await funct(req, res, next)
    } catch (error) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            success : false,
            message : error.message || "Internal Server Error",
        })
    }
}

export {asyncHandler}