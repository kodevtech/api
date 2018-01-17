/******** To Perform CRUD Operation on Permission ********/

const config = require('../config/config');
const Permission = require('../pg/models').Permission;

const utils = require('../controllers/utils');
const moment = require('moment');
const _ = require('lodash');

const permissionsDefault = ['High','Medium','Low','None'];

// Adding New Permission
async function savePermission(req, res) {
  try {
    const permissionName = req.body.permissionName ? req.body.permissionName.trim() : null;
    const priority = req.body.priority ? req.body.priority : 0;

    if (!permissionName || !priority) {
      return res.status(422).send({
        error: 'Permission Name and priority are required.'
      });
    }

    if (isNaN(priority)) {
      return res.status(422).send({
        error: 'Priority should be number'
      });
    }

    // Check if Permission already exists
    let permissionResp = await Permission.findAll({
      where: {
        $or: [
          {
              permissionName:
              {
                  $eq: permissionName
              }
          },
          {
              priority:
              {
                  $eq: priority
              }
          },
        ]
      },
    });

    if (permissionResp.length) {
      return res.status(400).send({
        error: 'The Permission with this name or priority is already created.'
      });
    }

    // Check if Permission already exists
    // let permission = await Permission.findAll({
    //   where: {
    //     permissionName: {
    //       $eq: permissionName
    //     }
    //   },
    // });

    const newPermission = {
      permissionName,
      priority
    };

    let data = await Permission.create(newPermission);

    return res.json({
      'success': true,
      'message': 'Successfully Created',
      'id': data.dataValues.id
    });
  } catch (err) {
    console.log("Error Adding Permission.", err);
    res.status(400).send({
      error: err.message
    })
  }
}

// Get Permission
async function getPermission(req, res) {
  try {
    let permission = await Permission.findById(req.params.id);
    // console.log(permission);
    if (permission) {
      return res.json({
        id: permission.id,
        permissionName: permission.permissionName,
        priority: permission.priority,
      });
    } else {
      return res.status(401).send({
        error: 'No permission found'
      });
    }

  } catch (err) {
    console.log("Error finding Permission", err);
    res.status(400).send({
      error: err.message
    })
  }
}

// Get Companies
async function getPermissions(req, res) {
  try {
    let permissionData = await Permission.findAll({
      where: {
        'permissionName': {
          $ne: 'Super'
        }
      }
    });
    let permissions = [];

    let permissionsResp = await Promise.all(permissionData.map(
      async permission => {
        permissions.push({
          id: permission.id,
          permissionName: permission.permissionName,
          priority: permission.priority
        });
      }));

    return res.json({
      'permissions': permissions
    });

  } catch (err) {
    console.log("Permission Error", err);
    res.status(400).send({
      error: err.message
    })
  }
}

// Update Permission
async function updatePermission(req, res) {
  try {
    let updateData = {
      'permissionName': req.body.permissionName,
      'priority': req.body.priority,
      'updatedBy': req.user.id,
      'updatedAt': moment().utc()
    };

    let permission = await Permission.findById(req.body.id);


    let checkPerm = await _.find(permissionsDefault, function (o){
      if (permission.permissionName == o) return o;
    });

    if(checkPerm){
      return res.status(400).send({
        error: 'You can\'t update default permission'
      });
    }

    await Permission.update(updateData, {
      where: {
        'id': {
          $eq: req.body.id
        }
      }
    });
    return res.json({
      'success': true,
      'message': 'Permission Successfully updated'
    });
  } catch (err) {
    console.log("updatePermission Error", err);
    res.status(400).send({
      error: err.message
    })
  }
}

// Delete Permission
async function deletePermission(req, res) {
  try {

    let permission = await Permission.findById(req.body.id);

    let checkPerm = await _.find(permissionsDefault, function (o){
      if (permission.permissionName == o) return o;
    });
    if(checkPerm){
      return res.status(400).send({
        error: 'You can\'t delete default permission'
      });
    }
    let permissionDelete = await Permission.destroy({
      where: {
        'id': {
          $eq: req.body.id
        }
      }
    });
    // console.log(permissionDelete);
    return res.json({
      'success': true,
      'message': 'Successfully deleted'
    });
  } catch (err) {
    console.log("permission Error", err);
    res.status(400).send({
      error: err.message
    })
  }
}

// Exports
module.exports = {
  savePermission,
  getPermission,
  getPermissions,
  updatePermission,
  deletePermission
};
