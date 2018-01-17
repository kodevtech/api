'use strict';
const uuidv4 = require('uuid/v4');
process.env.uuid_perm = uuidv4();

module.exports = {
  up: (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkInsert('Person', [{
        name: 'John Doe',
        isBetaMember: false
      }], {});
    */
    return queryInterface.bulkInsert('Permissions', [{
      id: process.env.uuid_perm,
      permissionName: 'Super',
      priority: 0
    }, {
      id: uuidv4(),
      permissionName: 'High',
      priority: 4
    }, {
      id: uuidv4(),
      permissionName: 'Medium',
      priority: 3
    }, {
      id: uuidv4(),
      permissionName: 'Low',
      priority: 2
    }, {
      id: uuidv4(),
      permissionName: 'None',
      priority: 1
    }], {});
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('Person', null, {});
    */
    return queryInterface.bulkDelete('Permissions', null, {});
  }
};
