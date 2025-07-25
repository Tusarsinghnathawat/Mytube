//Purpose :-  used to handle and format errors consistently across a Node.js backend, especially in APIs (like REST or GraphQL).
//it extends the built-in Error class to create a custom error type that includes additional properties like status code, data, and error details.
//This allows developers to throw and catch errors in a structured way, making it easier to handle errors in a consistent manner across the application.
class apiError extends Error{
    constructor(
        statusCode,
        message = "something went wrong",
        error = [],
        stack = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success =false;
        this.error = error

        if(stack){
            this.stack = stack
        }
        else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {apiError}