export PGPASSWORD='5okharoth'
psql --username=bheng \
-h iproject.cjbvry0ekzyh.us-east-1.rds.amazonaws.com \
-d postgres \
-c "DROP DATABASE iproject;"

export PGPASSWORD='5okharoth'
psql --username=bheng \
-h iproject.cjbvry0ekzyh.us-east-1.rds.amazonaws.com \
-d postgres \
-c "CREATE DATABASE iproject;"

sequelize db:migrate
sequelize db:seed:all

#done
