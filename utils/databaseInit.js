const mongoose = require("mongoose");
require('dotenv').config()


const databaseConnection = () => {

    try {
        mongoose.connect(
            process.env.MONGO_URL,
            { useNewUrlParser: true, useUnifiedTopology: true }
        );
    }catch(e){
        console.log("could not connect");
    }

    const db = mongoose.connection;
    db.on("error", console.error.bind(console, "MongoDB connection error:"));
    db.once("open", () => {
        console.log("Connected to MongoDB");
    });

}

module.exports = databaseConnection