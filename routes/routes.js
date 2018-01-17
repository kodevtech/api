// Dependencies
const Router = require('express').Router();
const userController = require('../controllers/users');

// Routes
Router.get('/test', (req, res) => res.status(200).send({
  message: 'Welcome to the test API!',
}));

// Before we send back JWT, let's check if
// user's email and password match what we have in the database
Router.post('/login', userController.verifyUser, userController.signIn);

// Signup User
Router.post('/signup', userController.saveUser);

// Verify Token
Router.post('/verify', userController.verifyToken);

// Verify Token
Router.post('/reset', userController.resetPassword);

Router.post('/set', userController.setPassword);

// Signup User
Router.post('/getToken', userController.getToken);


module.exports = Router;
