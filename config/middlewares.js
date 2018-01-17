// Setup middlewares
const morgan = require('morgan');
const bodyParser = require('body-parser');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const expressJwt = require('express-jwt');
const config = require('../config/config');
const models = require('../pg/models');
const path = require('path');

module.exports = (app) => {
  app.use(morgan('dev'));
  app.use(compression());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(helmet());
  app.use(cors());

  // activate restriction
  app.use('/auth', expressJwt({
    secret: config.secrets.jwt
  }), function(req, res, next) {
    // if (!req.user.admin) return res.sendStatus(401);
    // res.sendStatus(200);
    req.user = req.user.data;
    next();
  });

  // override default msg
  app.use(function(err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
      return res.status(401).send({
        error: 'Unauthorized'
      });
    }
  });

  // Relations

  models.User.belongsTo(models.Company, {
    foreignKey: 'companyId',
    targetKey: 'id'
  });
  // Company.hasMany(User);
  models.User.belongsTo(models.Permission, {
    foreignKey: 'permissionId',
    targetKey: 'id'
  });

  models.Company.hasMany(models.User, {
    foreignKey: 'companyId',
    targetKey: 'id'
  });

  models.Permission.hasMany(models.User, {
    foreignKey: 'permissionId',
    targetKey: 'id'
  });

};
