//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://josuem4918:95nzTVsZFDTjEQKX@cluster0.i8gwrxi.mongodb.net/todolistDB", {
  useNewUrlParser: true
});

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model('Items', itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + buton to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find({}).exec()
    .then(foundItems => {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
          .then(function() {
            res.redirect("/");
          });
      } else {
        res.render("list", {
          listTitle: "Today",
          newListItems: foundItems
        });
      }
    })
});

app.get("/:customlistName", function(req, res) {
  const customlistName = _.capitalize(req.params.customlistName);
  List.findOne({
      name: customlistName
    })
    .then(function(foundList) {
      if (!foundList) {
        console.log("Doesn't exist!");
        const list = new List({
          name: customlistName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customlistName);
      } else {
        console.log("Exist!");
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    })
    .catch(function(err) {
      console.log(err);
    });
});

app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({
        name: listName
      })
      .then(foundList => {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      });
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .then((removedItem) => {
        if (removedItem) {
          res.redirect("/");
        }
      });
  } else {
    List.findOneAndUpdate({
        name: listName
      }, {
        $pull: {
          items: {
            _id: checkedItemId
          }
        }
      }, {
        useFindAndModify: false
      })
      .then((foundList) => {
        if (foundList) {
          res.redirect("/" + listName);
        }
      });
  }
});

app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
