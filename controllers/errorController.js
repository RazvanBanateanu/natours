const AppError = require ('./../utils/appError');

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};

const handelDuplicateFieldsDB = err => {

    const value = err.keyValue.name;

    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400);
};

const handelValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el=>el.message);

    const message = `Invalid input data. ${errors.join(' ')}`;
    return new AppError(message, 400);
};

const handelJWTError = err => new AppError('Invalid token. Please log in again!', 401);


const handelJWTExpiredError = err => new AppError('Token expired. Please log in again!', 401);


const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });    
};

const sendErrorProd = (err, res) => {
    if(err.isOperational){
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });  
    }else{
        console.error('ERROR', err);

        res.status(500).json({
            status:'error',
            message: 'Something went wrong!'
        });
    }
};

module.exports = (err, req, res, next) => {
    
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    const environment = process.env.NODE_ENV;


    if(environment === 'development'){
        sendErrorDev(err, res);
    } else if (environment === 'production'){
        let error = { ...err, name: err.name };

        console.log(error);

        if(error.name === 'CastError') error = handleCastErrorDB(error);
        if(error.code === 11000) error = handelDuplicateFieldsDB(error);
        if (error.name === 'ValidationError') error = handelValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handelJWTError(error);
        if (error.name === 'TokenExpiredError') error = handelJWTExpiredError(error);

        sendErrorProd(error, res);
    }
};      
    

