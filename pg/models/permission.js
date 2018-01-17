'use strict';
module.exports = (sequelize, DataTypes) => {
  var Permission = sequelize.define('Permission', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    permissionName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    priority: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    updatedBy: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      },
      // beforeFind: function (options) {
      //    options.attributes.exclude = ['createdAt', 'updatedAt'];
      //    return options;
      // }
    }
  });
  return Permission;
};
