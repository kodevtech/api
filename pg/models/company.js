'use strict';
module.exports = (sequelize, DataTypes) => {
  const Company = sequelize.define('Company', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    limit: {
      type: DataTypes.INTEGER,
      defaultValue: 200
    },
    logo: {
      type: DataTypes.STRING,
      allowNull: true,
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

  return Company;
};
