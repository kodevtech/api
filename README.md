# Registration

# Run locally

# 1\. Make sure to install and run PostgreSQL first.

FOR MAC

```
brew update
brew install postgres
createdb registration
```

# 2\. Run

```
npm i
npm run start
```

_or_

```
npm run init
```

# 3\. Create database

```
createdb registration

```

# 4\. **SEQUELIZE-CLI**

# UP

```
sudo npm install -g sequelize-cli

sequelize db:migrate
sequelize db:seed:all
```

# DOWN

```
sequelize db:seed:undo:all
sequelize db:migrate:undo:all
```

_Note : default environment mode is development_
