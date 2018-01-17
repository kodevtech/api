// Dependencies
const Router = require('express').Router();
const userController = require('../controllers/users');
const companyController = require('../controllers/companies');
const permissionController = require('../controllers/permission');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const UPLOAD_PATH = 'uploads';

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, `${UPLOAD_PATH}/`)
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + '.png')
  }
});

const imageFilter = function(req, file, cb) {
  // accept image only
  console.log(file);
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: imageFilter
}); // multer configuration

// Routes
Router.get('/test', (req, res) => res.status(200).send({
  message: 'Welcome to the auth test API!',
}));

// Fetch user
Router.get('/info', userController.getUser);

Router.post('/profile', userController.updateProfile);

Router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    console.log(req.file);
    console.log(req.user);
    res.send({
      success: true,
      path: req.file.path
    });
  } catch (err) {
    res.status(400).send({
      error: err
    })
  }
});

Router.post('/removeUpload', async (req, res) => {
  try {
    console.log("removeUpload",req.body);
    if(req.body.filename)
      fs.unlink(req.body.filename);

    res.send({
      success: true
    });
  } catch (err) {
    res.status(400).send({
      error: err
    })
  }
});

Router.delete('/users', userController.deleteUser);


// Fetch User Details
Router.get('/user/:id', userController.getUserById);

// For Updating User Details
Router.put('/user', userController.updateProfileByID);

// For Removing User Details
Router.delete('/user', userController.deleteUserByID);

// For Company Operation
// Adding New Company Details
Router.post('/company', companyController.saveCompany);

// Fetch Company Details
Router.get('/company/:id', companyController.getCompany);

// Fetch All Company Details
Router.get('/companies', companyController.getCompanies);

// Fetch All Company Users Details
Router.get('/companyUser/:id', companyController.getCompanyUsers);

// For Updating Company Details
Router.put('/company', companyController.updateCompany);

// For Removing Company Details
Router.delete('/company', companyController.deleteCompany);

// For Permission Operation
// Adding New Permission Details
Router.post('/permission', permissionController.savePermission);

// Fetch Permission Details
Router.get('/permission/:id', permissionController.getPermission);

// Fetch All Permission Details
Router.get('/permissions', permissionController.getPermissions);

// For Updating Permission Details
Router.put('/permission', permissionController.updatePermission);

// For Removing Permission Details
Router.delete('/permission', permissionController.deletePermission);

// Signup User
Router.post('/user', userController.createUser);

module.exports = Router;
