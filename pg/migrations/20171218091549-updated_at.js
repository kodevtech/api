'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        /*
          Add altering commands here.
          Return a promise to correctly handle asynchronicity.

          Example:
          return queryInterface.createTable('users', { id: Sequelize.INTEGER });
        */

        // return queryInterface.addConstraint('users', ['cid'], {
        //   type: 'FOREIGN KEY',
        //   name: 'cid',
        //   references: { //Required field
        //     table: 'companies',
        //     field: 'id'
        //   },
        //   onDelete: 'cascade',
        //   onUpdate: 'cascade'
        // });
        queryInterface.addColumn('Users', 'companyId', Sequelize.DataTypes.UUID);
        queryInterface.addColumn('Users', 'permissionId', Sequelize.DataTypes.UUID);

        queryInterface.addConstraint('Users', ['companyId'], {
          type: 'FOREIGN KEY',
          name: 'custom_fkey_company_id',
          references: { //Required field
            table: 'Companies',
            field: 'id'
          },
          onDelete: 'cascade',
          onUpdate: 'cascade'
        });

        return queryInterface.addConstraint('Users', ['permissionId'], {
          type: 'FOREIGN KEY',
          name: 'custom_fkey_permission_id',
          references: { //Required field
            table: 'Permissions',
            field: 'id'
          },
          onDelete: 'cascade',
          onUpdate: 'cascade'
        });

    },

    down: (queryInterface, Sequelize) => {
        /*
          Add reverting commands here.
          Return a promise to correctly handle asynchronicity.

          Example:
          return queryInterface.dropTable('users');
        */
        // queryInterface.removeColumn('Users', 'recoveryToken');
        // queryInterface.removeColumn('Users', 'isVerified');
        return queryInterface.removeConstraint('Users', 'custom_fkey_company_id');
    }
};
