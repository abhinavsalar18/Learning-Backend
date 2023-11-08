// This utility function will accept a function and handler all try catch code 
//1-> using Promises

const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(
            requestHandler(req, res, next)
        ).catch((error) => {
            next(error);
        });
    }
}




//2-> using try-catch
// const asyncHandler = () => {}  normal function
// const asyncHandler = (func) => {() => {}}  higher order function(functions accepting or returning function)
// const asyncHandler = (func) => async () => {}   just bracket removed like - {async () => {}}

const asyncHandler_ = (requestHandler) => {
   return async (req, res, next) => { // we have use return otherwise remove {} like in last example above
        try{
            await requestHandler(req, res, next);
        } catch (error){
            res.status(error.code || 404).json({
                status: false,
                message: error.message
            });
        }
    }
}

export default asyncHandler;