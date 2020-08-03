var MongoClient = require('mongodb').MongoClient;
var Server = require('mongodb').Server;

var url = "mongodb://localhost:27017/";

MongoClient.connect(url, { useUnifiedTopology: true }, (err, conn) => {
    if (err) throw err;
    db = conn.db("test");
    db.collection("test").find().then((msg) => {
        console.log(msg);
    });
    db.collection("test").insertOne({ hello: "kitty" }).catch((err) => {
        console.log(err);
    }).then(() => {
        conn.close();
    })
})