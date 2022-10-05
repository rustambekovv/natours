const AppError = require('../utilis/appError');

const handleCastErrorDB = err=>{
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err=>{
    const value = err.keyValue.name;
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = err=>{
    const errors = Object.values(err.errors).map(el=>el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
}

const handleJWTError = ()=> new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = ()=> new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev = (err, req, res)=>{
    if(req.originalUrl.startsWith('/api')){
        res.status(err.statusCode).json({
            status: err.status,
            error:err,
            message:err.message,
            // stack:err.stack
        });
    }
        console.error('ERROR', err);
        res.status(err.statusCode).render('error',{
            title: 'Something went wrong!',
            msg: err.message
        });
    
};

const sendErrorProd = (err, req, res)=>{
    if(req.originalUrl.startsWith('/api')){
        if(err.isOperational){
            res.status(err.statusCode).json({
                status:err.status,
                message:err.message
            });
        }    
            console.error('ERROR', err);
            res.status(500).json({
                status: 'error',
                message: 'Something went very wrong!'
            })
        
    } 
        if(err.isOperational){
            res.status(err.statusCode).render('error',{
                title: 'Something went wrong!',
                msg: err.message
            });
        }   
            console.error('ERROR', err);
            res.status(err.statusCode).render('error',{
                title: 'Something went wrong!',
                msg: 'Please try again.'
            });
};

module.exports = (err,req,res,next)=>{
    // console.log(err.stack)
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    
    if(process.env.NODE_ENV==='development'){
        sendErrorDev(err, req, res)
    } else if(process.env.NODE_ENV==='production'){
        let error = {...err};
        error.message = err.message;
        if(err.name==='CastError') error = handleCastErrorDB(error);
        if(err.code===11000) error = handleDuplicateFieldsDB(error);
        if(err.name=== 'ValidationError') error = handleValidationErrorDB(error);
        if(err.name==='JsonWebTokenError') error = handleJWTError();
        if(err.name==='TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, req, res)
    }
    
};  