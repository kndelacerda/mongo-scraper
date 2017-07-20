const express = require("express"),
    bodyParser = require("body-parser"),
    logger = require("morgan"),
    mongoose = require("mongoose"),
    request = require("request"),
    cheerio = require("cheerio"),
    PORT = process.env.PORT || 3000;
exphbs = require('express-handlebars'),
    util = require('util'),
    jquery = require('jquery');

var Article = require('./models/articleModel.js'),
    Note = require('./models/noteModel.js');

var Promise = require("bluebird");

mongoose.Promise = Promise;

var app = express();

app.engine('hbs', exphbs({
    extname: 'hbs',
    defaultLayout: 'main',
    layoutsDir: __dirname + '/views/layouts/',
    partialsDir: __dirname + '/views/partials/'
}));

app.set('view engine', 'handlebars');

app.use(logger("dev"));
app.use(bodyParser.urlencoded({
    extended: false
}));

// Makes Public a static directory
app.use(express.static("public"));

// Database configuration with mongoose
mongoose.connect("mongodb://heroku_4s57gdsl:dg12u18a81l15ddhgmedl3h7tj@ds019866.mlab.com:19866/heroku_4s57gdsl");
var db = mongoose.connection;

db.on("error", function(error) {
    console.log("Mongoose Error: ", error);
});

// Once logged in to the DB through Mongoose, a success message will be logged
db.once("open", function() {
    console.log("Successfully connected to Mongoose.");
});

app.use(logger('combined'));
logger('combined', { buffer: true });

request("https://www.dailykos.com", function(error, response, html) {

    // Loads the HTML into Cheerio
    var $ = cheerio.load(html);

    // 
    $(".story").each(function(i, element) {
        var storyTitle = $(element).find(".story-title.heading").children("a").first().text();
        var storyDate = $(element).find(".author-date.visible-sm-block").children("span.timestamp").first().text();
        var storyLink = $(element).find(".story-title.heading").children("a").first().attr("href");
        var para1 = $(element).find(".story-intro").find("p").first().text();

        var newArticle = new Article({
            title: storyTitle,
            date: storyDate,
            link: "https://www.dailykos.com" + storyLink,
            story: para1
        });

        newArticle.save(function(err, data) {
            if (err) {
                console.log("newArticle save error is " + err);
            } else {
                console.log(data);
            }
        });
    });
});

app.get('/', function(req, res) {
    var article = new Article(req.query);
    // Mongoose call for all articles
    article.retrieveAll(res);

});

app.get('/detail', function(req, res) {
    var article = new Article(req.query);
    article.retrieveOne(req, res);
});

app.get('/submit', function(req, res) {
    var note = new Note(req.query);
    console.log('Note instance ' + note);
    note.saveNote(req, res, Article, note);
});

app.get('/shownotes', function(req, res) {
    var article = new Article(req.query);
    console.log('Article instance ' + article);
    article.viewNotes(req, res, Note, article);
});

app.listen(PORT, function() {
    console.log('App listening on port ' + PORT);
});