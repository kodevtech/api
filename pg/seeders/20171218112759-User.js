'use strict';
const config = require('../../config/config');
const bcrypt = require('bcrypt');
const uuidv4 = require('uuid/v4');
const salt = bcrypt.genSaltSync(10);
const adminHash = bcrypt.hashSync('super'+config.defaultAdminPassword, salt);


module.exports = {
  up: (queryInterface, Sequelize) => {
    //         /*
    //           Add altering commands here.
    //           Return a promise to correctly handle asynchronicity.
    //
    //           Example:
    //           return queryInterface.bulkInsert('Person', [{
    //             name: 'John Doe',
    //             isBetaMember: false
    //           }], {});
    //         */
    return queryInterface.bulkInsert('Users', [{
      id: uuidv4(),
      userName: 'admin',
      firstName: 'Super',
      lastName: 'Admin',
      email: config.appSupport,
      password: adminHash,
      isVerified: true,
      permissionId: process.env.uuid_perm,
      companyId: process.env.uuid_comp
    }], {});
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('Person', null, {});
    */
    process.env.uuid_perm = '';
    process.env.uuid_comp = '';
    return queryInterface.bulkDelete('Users', null, {});
  }
};
