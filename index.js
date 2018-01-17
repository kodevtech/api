// Dependencies
const express         = require('express');
const config          = require('./config/config');
const api             = require('./routes/routes');
const auth            = require('./routes/authRoutes');
const YAML            = require('yamljs');
const swaggerUi       = require('swagger-ui-express');
const swaggerDocument = YAML.load('./swagger/swagger.yaml');
const app             = express();

// Middlewares setup
require('./config/middlewares')(app);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api', api);
app.use('/auth', auth);
app.use('/uploads', express.static('uploads'));

// Start listening
app.listen(config.port, () => {
  console.log('Sever started http://localhost:%s', config.port);
});

process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});

module.exports = app;
