const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// MIDLEWARES

app.use(helmet());

if (process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
};

const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP. Please try again in one hour!'
});

app.use('/api',limiter);

app.use(express.json({limit: '10kb'}));

//Data sanitisation against NoSQL query injection
app.use(mongoSanitize());

//Data sanitisation against XSS
app.use(xss());

//Prevent parameter pollution
app.use(hpp({
    whitelist: ['duration', 'ratingQuantity', 'ratingAverage', 'maxGroupSize', 'difficulty', 'price']
}));

app.use((req, res, next) =>{
    console.log('Hello from the middleware');
    next();
});

app.use((req, res, next) =>{
    req.requestTime = new Date().toISOString();
    next();
});

// ROUTES
app.use('/api/v1/tours',tourRouter);
app.use('/api/v1/users',userRouter);
 
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;