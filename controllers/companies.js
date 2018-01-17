/******** To Perform CRUD Operation on Company ********/
const config = require('../config/config');
const Company = require('../pg/models').Company;
const User = require('../pg/models').User;
const Permission = require('../pg/models').Permission;

const utils = require('../controllers/utils');
const moment = require('moment');
const bcrypt = require('bcrypt');
const faker = require('faker');



// Adding New Company
async function saveCompany(req, res) {
  try {
    const companyName = req.body.companyName ? req.body.companyName.trim() : null;
    const city = req.body.city ? req.body.city.trim() : '';
    const limit = req.body.limit ? req.body.limit : 200;
    // const contactNumber = req.body.contactNumber ? req.body.contactNumber.trim() : '';

    if (!companyName || !city) {
      return res.status(400).send({
        error: 'Company name and City are required.'
      });
    }

    if (req.user.role !== 'Super') {
      return res.status(400).send({
        error: 'You are not authorized to perform this action .Contact your admin'
      });
    }

    // Check if name already exists
    let company = await Company.findAll({
      where: {
        companyName: {
          $eq: companyName
        }
      },
    });

    if (company.length) {
      return res.status(400).send({
        error: 'The Company is already registered.'
      });
    }

    const newCompany = {
      companyName,
      city,
      limit
      // contactNumber
    };

    let companyData = await Company.create(newCompany);

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(config.defaultAdminPassword, salt);

    const companyEmail = faker.internet.email(companyName).toLowerCase();
    const companyUsername = faker.internet.userName(companyName);
    const companyfirstName = 'Company';
    const companylastName = 'Admin';

    let permissionData = await Permission.find({
      where: {
        'permissionName': {
          $eq: 'High'
        }
      }
    });

    // console.log(permissionData);

    const newUser = {
      userName: companyUsername,
      email: companyEmail,
      password: hash,
      firstName: companyfirstName,
      lastName: companylastName,
      updatedBy: req.user.id,
      isVerified: true,
      companyId: companyData.dataValues.id,
      permissionId: permissionData.dataValues.id
    };
    // default verified with pwd
    let userData = await User.create(newUser);

    return res.json({
      'success': true,
      'message': 'Successfully Created',
      'id': companyData.dataValues.id,
      'email': userData.dataValues.email
    });
  } catch (err) {
    console.log("Error Adding Company.", err);
    res.status(400).send({
      error: err.message
    })
  }
}

// Get Company
async function getCompany(req, res) {
  try {
    console.log(req.params.id);
    let company = await Company.findById(req.params.id);

    if (company) {
      return res.json({
        id: company.id,
        companyName: company.companyName,
        city: company.city,
        limit: company.limit,
        logo: company.logo,
      });
    } else {
      return res.status(401).send({
        error: 'No company found'
      });
    }

  } catch (err) {
    console.log("company Error", err);
    res.status(400).send({
      error: err.message
    })
  }
}

//Get Companies
async function getCompanies(req, res) {
  try {
    console.log(req.user);
    let companyData;
    if (req.user.role === 'Super') {

      companyData = await Company.findAll({
        attributes: {
          exclude: ['updatedBy', 'createdAt', 'updatedAt']
        },
        include: [{
            model: User,
            attributes: ['email','userName']
          }
        ],
        where: {
          'companyName': {
            $ne: 'Admin'
          }
        }
      });

    } else if (req.user.role !== 'Super') {

      companyData = await Company.findAll({
        attributes: {
          exclude: ['updatedBy', 'createdAt', 'updatedAt']
        },
        include: [{
            model: User,
            attributes: ['email','userName']
          }
        ],
        where: {
          'companyName': {
            $ne: 'Admin'
          },
          'id': req.user.companyId
        },
      });

    }

    // companyData = companyData.toJSON();
    // console.log(companyData);
    let companies = [];

    let companiesResp = await Promise.all(companyData.map(
      async company => {
        // console.log(company);
        companies.push({
          id: company.id,
          companyName: company.companyName,
          city: company.city,
          limit: company.limit,
          logo: company.logo,
          email: company.Users[0].email
        });
      }));

    return res.json({
      'companies': companies
    });

  } catch (err) {
    console.log("company Error", err);
    res.status(400).send({
      error: err.message
    })
  }
}


//Get Users
async function getCompanyUsers(req, res) {
  try {

    // if (req.user.role !== 'Super') {
    //   return res.status(400).send({
    //     error: 'You are not authorized to perform this action .Contact your admin'
    //   });
    // }

    // let usersData = await User.findAll({
    //   where: {
    //     'companyId': {
    //       $eq: req.params.id
    //     }
    //   }
    // });
    let usersData;

    if (req.user.role !== 'None') {

      usersData = await User.findAll({
        attributes: {
          exclude: ['createdAt', 'updatedAt']
        },
        include: [{
            model: Permission,
            attributes: ['permissionName','priority']
          }
        ],
        where: {
          'companyId': {
            $eq: req.params.id
          }
        }
      });

    } else if (req.user.role !== 'Super') {

      usersData = await User.findAll({
        attributes: {
          exclude: ['createdAt', 'updatedAt']
        },
        include: [{
            model: Permission,
            attributes: ['permissionName','priority']
          }
        ],
        where: {
          'id': {
            $eq: req.user.id
          }
        }
      });

    }


    if (!usersData.length) {
      return res.status(400).send({
        error: 'No user for this company'
      });
    }

    let users = [];

    let usersResp = await Promise.all(usersData.map(
      async user => {
        // console.log(user);
        users.push({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          userName: user.userName,
          email: user.email,
          permission: user.Permission.permissionName,
          priority: user.Permission.priority,
          isVerified: user.isVerified,
          imagePath: user.imagePath
        });
      }));

    return res.json({
      'users': users
    });

  } catch (err) {
    console.log("users Error", err);
    res.status(400).send({
      error: err.message
    })
  }
}

//Update Company
async function updateCompany(req, res) {
  try {
    let updateData = {
      'city': req.body.city,
      'limit': req.body.limit ? req.body.limit : 200
    };

    if(req.body.companyName){
      updateData.companyName = req.body.companyName ;
    }

    await Company.update(updateData, {
      where: {
        'id': {
          $eq: req.body.id
        }
      }
    });

    return res.json({
      'success': true,
      'message': 'Successfully updated'
    });
  } catch (err) {
    console.log("updateCompany Error", err);
    res.status(400).send({
      error: err.message
    })
  }
}

//Delete Company
async function deleteCompany(req, res) {
  try {

    if (req.user.role !== 'Super') {
      return res.status(400).send({
        error: 'You are not authorized to perform this action .Contact your admin'
      });
    }

    let userDelete = await User.destroy({
      where: {
        'companyId': {
          $eq: req.body.id
        }
      }
    });

    let companyDelete = await Company.destroy({
      where: {
        'id': {
          $eq: req.body.id
        }
      }
    });
    console.log(userDelete,companyDelete);
    if(userDelete && companyDelete) {
      return res.json({
        'success': true,
        'message': 'Successfully deleted'
      });
    } else {
      return res.status(400).send({
        error: 'No compnay found'
      });
    }
  } catch (err) {
    console.log("deleteCompany Error", err);
    res.status(400).send({
      error: err.message
    })
  }
}

// Exports
module.exports = {
  saveCompany,
  getCompany,
  updateCompany,
  deleteCompany,
  getCompanies,
  getCompanyUsers
};
