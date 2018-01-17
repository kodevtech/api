// Dependencies
const nodemailer = require('nodemailer');
const config = require('../config/config');
const moment = require('moment');
const User = require('../pg/models').User;
const Company = require('../pg/models').Company;

const mailSetup = nodemailer.createTransport({
  service: config.email.accountName,
  auth: {
    user: config.email.username,
    pass: config.email.password
  }
});


async function validateEmail(email) {
  let errorMessage = '';
  const regex = /\S+@\S+\.\S+/;
  const trimmedEmail = email.trim();

  if (trimmedEmail.length > 40) {
    errorMessage = '* Email is too long, please use shorter email address';
  }

  if (!regex.test(trimmedEmail) || trimmedEmail.length === 0) {
    errorMessage = '* Email must be in valid format';
  }

  return errorMessage;
}

async function validatePassword(password) {
  const errorMessages = [];
  // if (password.length > 50) {
  //     errorMessages.push('* Must be fewer than 50 chars');
  // }
  //
  // if (password.length < 8) {
  //     errorMessages.push('* Must be longer than 7 chars');
  // }
  //
  // if (!password.match(/[\!\@\#\$\%\^\&\*]/g)) {
  //     errorMessages.push('* Missing a symbol(! @ # $ % ^ & *)');
  // }
  //
  // if (!password.match(/\d/g)) {
  //     errorMessages.push('* Missing a number');
  // }
  //
  // if (!password.match(/[a-z]/g)) {
  //     errorMessages.push('* Missing a lowercase letter');
  // }
  //
  // if (!password.match(/[A-Z]/g)) {
  //     errorMessages.push('* Missing an uppercase letter');
  // }
  return errorMessages;
}

async function validateStringLength(text, limit) {
  let errorMessage = '';
  if (text.trim().length > limit) {
    errorMessage = `* Cannot be more than ${limit} characters`;
  } else if (text.trim().length <= 0) {
    errorMessage = '* Cannot be empty';
  } else {
    errorMessage = '';
  }
  return errorMessage;
}

async function randString(x) {
  let s = '';
  while (s.length < x && x > 0) {
    let r = Math.random();
    s += (r < 0.1 ? Math.floor(r * 100) : String.fromCharCode(Math.floor(r * 26) + (r > 0.5 ? 97 : 65)));
  }
  return s;
}

// Dynamic template for mail
async function mailTemplate(type, user, url) {
  let template;
  // Reset
  if (type === 'reset') {
    template = '<H2>Hi ' + user.userName + ',</H2>' +
      '<p>' + config.appName + ' recently received a request for a reset password.</p> <br /> ' +
      '<p>To change your account password, please click on this <a href=' + url + '>link</a>.</p><br /> ' +
      '<p>If you did not request this change, you do not need to do anything .</p> <br /> ' +
      '<p>This link will expire in ' + config.mailTokenExpiry + ' minutes.</p> <br /> ' +
      'Thanks, <br /> ' + config.appName + ' Support';
  } else if (type === 'set') {
    template = '<H2>Hi ' + user.userName + ',</H2>' +
      '<p>' + user.companyName + ' has created account.</p> <br /> ' +
      '<p>To set your account password, please click on this <a href=' + url + '>link</a>.</p><br /> ' +
      '<p>This link will expire in ' + config.mailTokenExpiry + ' minutes.</p> <br /> ' +
      'Thanks, <br /> ' + config.appName + ' Support';
  } else {
    //  Verify
    template = '<H2>Hi ' + user.userName + ',</H2>' +
      '<p>Please verify your account by clicking <a href=' + url + '>this link</a>. ' +
      'If you are unable to do so, copy and paste the following link into your browser:</p><p>' + url + '</p>' +
      '<p>This link will expire in ' + config.mailTokenExpiry + ' minutes.</p> <br /> ' +
      'Thanks, <br /> ' + config.appName + ' Support';
  }
  return template;
}

async function sendMail(user, type) {
  console.log('sendMail');
  // console.log(user);
  let myToken = await randString(6);
  let siteUrl = config.siteUrl + '/verify?token=' + myToken;
  let responseData = false;
  user.userName = user.firstName || user.lastName || user.userName ? user.firstName || user.lastName || user.userName : 'User';
  let subject = 'Confirm your account';

  // Override settings for reset
  if (type === 'reset') {
    myToken = 'pass_' + myToken;
    subject = 'Forgot password request';
    siteUrl = config.siteUrl + '#/login?info=newPassword&token=' + myToken;
  } else if (type === 'set') {
    myToken = 'pass_' + myToken;
    subject = 'Account created';
    siteUrl = config.siteUrl + '#/login?info=setPassword&token=' + myToken;
    let company = await Company.findById(user.companyId);
    user.companyName = company.companyName;
  }

  // mail object
  let mailOptions = {
    from: config.appName + ' <' + config.appSupport + '>', // sender address
    subject: subject,
    to: user.email, // list of receivers
    html: await mailTemplate(type, user, siteUrl),
    priority: 'high'
  };

  // send mail with defined transport object
  let mailStatus = await mailSetup.sendMail(mailOptions);
  // log mail responses
  console.log(mailStatus);

  if (mailStatus) {
    let expires_in = moment().add(config.mailTokenExpiry, 'minutes');
    expires_in = expires_in.toISOString();
    let data = {
      'expiresIn': expires_in,
      'recoveryToken': myToken
    };
    responseData = await tokenUpdateInDB(data, user.id)
  }
  return {
    status: responseData,
    token: myToken
  };
}

// Token validate
async function validateToken(reqs, query) {
  console.log('Validate token');
  // find with token
  let resp = {};
  let user = await User.findAll({
    where: query
  });
  let emptyToken = {
    recoveryToken: null,
    expiresIn: null
  };
  // console.log(user);
  // check conditions
  if (!user[0]) {
    resp.status = false;
    resp.msg = reqs.email ? 'Invalid User' : 'Invalid Token';
    resp.user = false;
  } else if (user[0].isVerified && reqs.type !== 'reset') {
    resp.status = false;
    resp.msg = 'User is already verified';
    resp.user = false;
    await tokenUpdateInDB(emptyToken, user[0].id);
  } else {
    console.log('Token %s : %s', moment().toISOString(), moment(user[0].expiresIn).toISOString());
    if (moment().toISOString() > moment(user[0].expiresIn).toISOString()) {
      resp.status = false;
      resp.user = false;
      resp.msg = 'Link has been expired. Please check recovery option by clicking on forgot password';

      await tokenUpdateInDB(emptyToken, user[0].id);
    } else {
      resp.status = true;
      resp.user = user[0];
      resp.msg = 'Token is valid';
    }
  }
  return resp;
}

async function tokenUpdateInDB(data, id) {
  let userDBUpdate = await User.update(data, {
    where: {
      'id': {
        $eq: id
      }
    }
  });
  console.log("Token in DB updated", userDBUpdate);
  return true;
}

async function updateDatabase(query) {
  let dbUpdate = await query;

  console.log("DB updated", dbUpdate);
  return true;
}

module.exports = {
  validateEmail,
  validatePassword,
  validateStringLength,
  validateToken,
  randString,
  mailTemplate,
  sendMail,
  tokenUpdateInDB,
  updateDatabase
};
