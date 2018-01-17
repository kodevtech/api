const config = {
  dev: 'development',
  test: 'test',
  prod: 'production',
  port: process.env.PORT || 3002,
  /* Backend API Port */
  expireTime: '7d',
  /* JWT Token Expiry */
  appName: process.env.APP_NAME || 'Admin',
  /* Used in email template */
  appSupport: process.env.APP_SUPPORT_ID || 'support@admin.com',
  /* Used in email template as sender ID*/
  mailTokenExpiry: process.env.MAIL_TOKEN_EXPIRY || 10,
  /* Token expiry for RESET, Verify mail */
  secrets: {
    jwt: process.env.JWT || 'secret123' /* Encrypt JWT token with secret key */
  },
  email: {
    username: process.env.SMTP_EMAIL || 'test@gmail.com',
    /* SMTP username */
    password: process.env.SMTP_PWD || 'testing123',
    /* SMTP password */
    accountName: process.env.SMTP_PROVIDER || 'gmail',
    /* SMTP Provider */
  },
  defaultAdminPassword: process.env.DEFAULT_ADMIN_PWD || 'admin123',
  siteUrl: process.env.APP_URL || 'http://localhost:4202' /* Url for website */
};

// Setting environment variable
process.env.NODE_ENV = process.env.NODE_ENV || config.dev;
config.env = process.env.NODE_ENV;

module.exports = config;
