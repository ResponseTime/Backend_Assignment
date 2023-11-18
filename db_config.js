const { MongoClient } = require("mongodb");
const uri = "mongodb://mongo://27017/db_node";
const client = new MongoClient(uri);
client.connect((err) => {
  if (err) {
    throw err;
  }
});
const db = client.db("db_node");
module.exports = db;
