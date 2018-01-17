// Dependencies
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const config = require('../config/config');
const User = require('../pg/models').User;
const Company = require('../pg/models').Company;
const Permission = require('../pg/models').Permission;
const utils = require('../controllers/utils');
const moment = require('moment');
const fs = require('fs');

// Authenticate the user
async function verifyUser(req, res, next) {
  try {
    const email = req.body.email;
    const password = req.body.password;
    // console.log(req.body);
    // if no email or password then send
    if (!email || !password) {
      return res.status(400).send({
        error: 'You need valid email and password'
      });
    }
    // if the passwords match for the email
    let user = await User.findAll({
      where: {
        email: {
          $eq: email
        }
      },
    });

    if (!user[0]) {
      return res.status(401).send({
        error: 'No user with the given email'
      });
    }
    console.log(user[0]);
    if (!user[0].password) {
      return res.status(401).send({
        error: 'No credentials found. Check your mail or Contact your admin'
      });
    }

    // checking the passowords
    if (!bcrypt.compareSync(password, user[0].password)) {
      return res.status(401).send({
        error: 'Incorrect credentials'
      });
    }

    if (!user[0].isVerified) {
      return res.status(401).send({
        error: 'Account is not verified'
      });
    }
    // if everything is good, then attach to req.user  and call next so the controller
    // sign a token from the req.user.id

    let userPermComp = await User.findOne({
      attributes: {
        exclude: ['password', 'recoveryToken', 'expiresIn', 'updatedBy', 'createdAt', 'updatedAt']
      },
      include: [{
          model: Company,
          attributes: ['companyName']
        },
        {
          model: Permission,
          attributes: ['permissionName']
        }
      ],
      where: {
        email: {
          $eq: email
        }
      }
    });

    req.user = userPermComp.toJSON();
    req.user.role = req.user.Permission.permissionName;

    // req.user = user[0];

    console.log(req.user);

    return next();
  } catch (err) {
    console.log("verifyUser Error", err);
    return next(err)
  }
}

// Sign token
async function signToken(id) {
  return jwt.sign({
      'data': id
    },
    config.secrets.jwt, {
      expiresIn: config.expireTime
    }
  );
}

// Login
async function signIn(req, res) {
  // req.user will be there from the middleware
  // Then we can just create a token and send it back
  try {
    const token = await signToken(req.user);
    return res.json({
      token,
      user: {
        userName: req.user.userName,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        role: req.user.role,
        imagePath: req.user.imagePath
      },
    });
  } catch (err) {
    console.log("signIn Error", err);
    res.status(400).send({
      error: err
    })
  }
}

// Register new user
async function saveUser(req, res) {
  try {
    const userName = req.body.userName ? req.body.userName.trim() : null;
    const email = req.body.email ? req.body.email.trim() : '';
    const password = req.body.password ? req.body.password.trim() : '';
    const firstName = req.body.firstName ? req.body.firstName.trim() : null;
    const lastName = req.body.lastName ? req.body.lastName.trim() : null;
    const updatedBy = req.body.updatedBy ? req.body.updatedBy.trim() : "";
    const imagePath = req.user.imagePath ? req.user.imagePath : null;

    console.log("req.body = ", req.body);

    if (!email || !password) {
      return res
        .status(422)
        .send({
          error: 'Email and password are required.'
        });
    }

    if (userName) {
      if (userName.length > 10) {
        return res
          .status(400)
          .send({
            error: 'Username must be less than 10 characters.'
          });
      }
    }

    const emailValidationError = await utils.validateEmail(email);
    if (emailValidationError.length > 0) {
      return res
        .status(400)
        .send({
          error: emailValidationError
        }); // array of errors
    }

    const passwordValidationError = await utils.validatePassword(password);
    if (passwordValidationError.length > 0) {
      return res
        .status(400)
        .send({
          error: passwordValidationError
        });
    }

    // Check if email already exists
    let user = await User.findAll({
      where: {
        email: {
          $eq: email
        }
      },
    });

    if (user.length > 0) {
      return res
        .status(400)
        .send({
          error: 'The email is already registered.'
        });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    const newUser = {
      userName,
      email,
      password: hash,
      firstName,
      lastName,
      updatedBy,
      imagePath
    };

    let data = await User.create(newUser);

    // call
    let resp = triggerMail(data.dataValues, 'verify');
    console.log("sending response ...");
    // NOT WAITING FOR MAIL Response
    res.json({
      // token: await signToken(data.id),
      user: {
        // id: data.id,
        userName: data.userName,
        email: data.email,
      },
    });
  } catch (err) {
    console.log("saveUser Error", err);
    res.status(400).send({
      error: err.message
    })
  }
}

// Create new user
async function createUser(req, res) {
  try {
    const userName = req.body.userName ? req.body.userName.trim() : null;
    const email = req.body.email ? req.body.email.trim() : '';
    const firstName = req.body.firstName ? req.body.firstName.trim() : null;
    const lastName = req.body.lastName ? req.body.lastName.trim() : null;
    const updatedBy = req.user.id;
    const companyId = req.body.companyId;
    const permissionId = req.body.permissionId;
    const imagePath = req.user.imagePath ? req.user.imagePath : null;


    console.log("req.body = ", req.body);
    if (!email || !permissionId) {
      return res
        .status(422)
        .send({
          error: 'Email and permission are required.'
        });
    }

    if (userName) {
      if (userName.length > 10) {
        return res
          .status(400)
          .send({
            error: 'Username must be less than 10 characters.'
          });
      }
    }

    const emailValidationError = await utils.validateEmail(email);
    if (emailValidationError.length > 0) {
      return res
        .status(400)
        .send({
          error: emailValidationError
        }); // array of errors
    }

    // const passwordValidationError = await utils.validatePassword(password);
    // if (passwordValidationError.length > 0) {
    //   return res
    //     .status(400)
    //     .send({
    //       error: passwordValidationError
    //     });
    // }

    // Check if email already exists
    let user = await User.findAll({
      where: {
        email: {
          $eq: email
        }
      },
    });

    if (user.length > 0) {
      return res
        .status(400)
        .send({
          error: 'The email is already registered.'
        });
    }

    // const salt = bcrypt.genSaltSync(10);
    // const hash = bcrypt.hashSync(password, salt);

    const newUser = {
      userName,
      email,
      // password: hash,
      firstName,
      lastName,
      updatedBy,
      permissionId,
      companyId,
      imagePath
    };

    let data = await User.create(newUser);

    // call
    let resp = triggerMail(data.dataValues, 'set');
    console.log("sending response ...");
    // NOT WAITING FOR MAIL Response
    res.json({
      // token: await signToken(data.id),
      user: {
        // id: data.id,
        userName: data.userName,
        email: data.email,
      },
    });
  } catch (err) {
    console.log("saveUser Error", err);
    res.status(400).send({
      error: err.message
    })
  }
}

// Trigger mail
async function triggerMail(data, type) {
  try {
    // send Mail
    let resp = await utils.sendMail(data, type);
    // console.log(resp);
    console.log("token updated " + resp);
    return resp;
  } catch (err) {
    console.log("triggerMail Error", err);
    res.status(400).send({
      error: err.message
    })
  }
}

// Get one user : AUTH
async function getUser(req, res) {
  try {
    // console.log(req.user);
    let user = await User.findById(req.user.id);

    if (!user || user.email.length <= 0) {
      return res.status(400).send({
        error: 'No user found'
      });
    }
    return res.json({
      id: user.id,
      userName: user.userName,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: req.user.role,
      imagePath: user.imagePath
    });
  } catch (err) {
    console.log("getUser Error", err);
    res.status(400).send({
      error: err.message
    })
  }
}

// Get one user : AUTH
async function getUserById(req, res) {
  try {
    let user = await User.findById(req.params.id);

    if (!user || user.email.length <= 0) {
      return res.status(400).send({
        error: 'No user found'
      });
    }
    return res.json({
      id: user.id,
      userName: user.userName,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isVerified: user.isVerified,
      permissionId: user.permissionId,
      imagePath: user.imagePath ? user.imagePath : ''
    });

  } catch (err) {
    console.log("getUser Error", err);
    res.status(400).send({
      error: err.message
    })
  }
}


// Verify user email account : API
async function verifyToken(req, res) {
  try {
    // find with token
    let customQuery = {
      'recoveryToken': {
        $eq: req.body.token
      }
    };
    // validate token
    let tokenCheck = await utils.validateToken(req.body, customQuery);
    // console.log(tokenCheck.msg);
    if (!tokenCheck.status) {
      return res.status(400).send({
        error: tokenCheck.msg
      });
    } else {
      // Update record and verify
      let updateData = {
        'recoveryToken': null,
        'expiresIn': null,
        'isVerified': true
      };
      let status = await utils.tokenUpdateInDB(updateData, tokenCheck.user.id);
      console.log("verification status " + status);
      return res.json({
        'success': true,
        'message': 'Successfully verified'
      });
    }
  } catch (err) {
    console.log("verifyToken Error", err);
    res.status(400).send({
      error: err.message
    })
  }
}

// Reset user password  : API
async function resetPassword(req, res) {
  try {
    // find with token
    let customQuery = {
      'recoveryToken': {
        $eq: req.body.token
      }
    };
    // validate token
    let tokenCheck = await utils.validateToken(req.body, customQuery);
    // console.log(tokenCheck);
    if (!req.body.password) {
      return res.status(400).send({
        error: 'Password is required'
      });
    } else if (req.body.password.length < 6) {
      return res.status(400).send({
        error: 'Minimum 6 characters required'
      });
    } else if (!tokenCheck.status) {
      return res.status(400).send({
        error: tokenCheck.msg
      });
    } else {
      // Update record and verify
      let salt = bcrypt.genSaltSync(10);
      let hash = bcrypt.hashSync(req.body.password, salt);
      let updateData = {
        'isVerified': true,
        'recoveryToken': null,
        'expiresIn': null,
        'password': hash
      };

      let status = await utils.tokenUpdateInDB(updateData, tokenCheck.user.id);
      console.log("resetPassword" + status);
      return res.json({
        'success': true,
        'message': 'Password updated'
      });
    }
  } catch (err) {
    console.log("resetPassword Error", err);
    res.status(400).send({
      error: err.message
    })
  }
}

// Set user password  : API
async function setPassword(req, res) {
  try {
    // find with token
    let customQuery = {
      'recoveryToken': {
        $eq: req.body.token
      }
    };
    // validate token
    let tokenCheck = await utils.validateToken(req.body, customQuery);
    // console.log(tokenCheck);
    if (!req.body.password) {
      return res.status(400).send({
        error: 'Password is required'
      });
    } else if (req.body.password.length < 6) {
      return res.status(400).send({
        error: 'Minimum 6 characters required'
      });
    } else if (!tokenCheck.status) {
      return res.status(400).send({
        error: tokenCheck.msg
      });
    } else {
      // Update record and verify
      let salt = bcrypt.genSaltSync(10);
      let hash = bcrypt.hashSync(req.body.password, salt);
      let updateData = {
        'isVerified': true,
        'recoveryToken': null,
        'expiresIn': null,
        'password': hash
      };

      let status = await utils.tokenUpdateInDB(updateData, tokenCheck.user.id);
      console.log("setPassword" + status);
      return res.json({
        'success': true,
        'message': 'Password updated'
      });
    }
  } catch (err) {
    console.log("resetPassword Error", err);
    res.status(400).send({
      error: err.message
    })
  }
}

// Verify user email account : API
async function getToken(req, res) {
  try {
    let customQuery = {
      'email': {
        $eq: req.body.email
      }
    };
    // validate token
    console.log(customQuery);
    let tokenCheck = await utils.validateToken(req.body, customQuery);

    // invalid
    if (!tokenCheck.status) {
      return res.status(400).send({
        error: tokenCheck.msg
      });
    } else {
      let mailStatus = await triggerMail(tokenCheck.user, req.body.type);
      console.log("send mail " + mailStatus);
      return res.json({
        'success': true,
        'message': 'The mail has been sent successfully',
        'token': mailStatus.token
      });
    }
  } catch (err) {
    console.log("getToken Error", err);
    res.status(400).send({
      error: err.message
    })
  }
}

async function updateProfile(req, res) {
  try {
    let updateData = {
      'firstName': req.body.firstName,
      'lastName': req.body.lastName,
      'userName': req.body.userName,
      'imagePath': req.body.imagePath
    };

    let status = await utils.tokenUpdateInDB(updateData, req.user.id);
    console.log(req.user.imagePath, req.user);
    if(req.user.imagePath != req.body.imagePath){

      fs.unlink(req.user.imagePath);
      req.user.imagePath = req.body.imagePath;
    }
    return res.json({
      'success': true,
      'message': 'Successfully updated'
    });
  } catch (err) {
    console.log("updateProfile Error", err);
    res.status(400).send({
      error: err.message
    })
  }
}

async function updateProfileByID(req, res) {
  try {
    let updateData = {
      'firstName': req.body.firstName,
      'lastName': req.body.lastName,
      'userName': req.body.userName,
      'imagePath': req.body.imagePath
    };

    if (req.body.hasOwnProperty('isVerified')) {
      updateData.isVerified = req.body.isVerified;
    }

    let status = await utils.tokenUpdateInDB(updateData, req.body.id);
    return res.json({
      'success': true,
      'message': 'Successfully updated'
    });
  } catch (err) {
    console.log("updateProfile Error", err);
    res.status(400).send({
      error: err.message
    })
  }
}

async function deleteUser(req, res) {
  try {
    let userDBUpdate = await User.destroy({
      where: {
        'id': {
          $eq: req.user.id
        }
      }
    });
    return res.json({
      'success': true,
      'message': 'Successfully deleted'
    });
  } catch (err) {
    console.log("deleteUser Error", err);
    res.status(400).send({
      error: err.message
    })
  }
}

async function deleteUserByID(req, res) {
  try {
    console.log("delete user");
    let userDBUpdate = await User.destroy({
      where: {
        'id': {
          $eq: req.body.id
        }
      }
    });

    console.log(userDBUpdate);
    return res.json({
      'success': true,
      'message': 'Successfully deleted'
    });
  } catch (err) {
    console.log("deleteUser Error", err);
    res.status(400).send({
      error: err.message
    })
  }
}

// Exports
module.exports = {
  verifyUser,
  signToken,
  saveUser,
  createUser,
  getUser,
  signIn,
  verifyToken,
  getToken,
  resetPassword,
  setPassword,
  triggerMail,
  updateProfile,
  updateProfileByID,
  deleteUser,
  deleteUserByID,
  getUserById
};
