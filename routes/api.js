/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

var expect = require("chai").expect;
var MongoClient = require("mongodb").MongoClient;
var ObjectId = require("mongodb").ObjectID;

const CONNECTION_STRING = process.env.DB;

module.exports = function(app) {
  app
    .route("/api/issues/:project")

    .get(function(req, res) {
      const project = req.params.project;
      let { query } = req;
      if (query._id) query._id = new ObjectId(query._id);
      if (query.open) query.open = query.open === "true" ? true : false;
      MongoClient.connect(CONNECTION_STRING, function(err, client) {
        if (err) console.error(err);
        else {
          let db = client.db("issuetracker");
          var collection = db.collection(project);
          collection.find(query).toArray((err, results) => res.json(results));
        }
      });
    })

    .post(function(req, res) {
      const project = req.params.project;
      const issue = {
        issue_title: req.body.issue_title,
        issue_text: req.body.issue_text,
        created_on: new Date(),
        updated_on: new Date(),
        created_by: req.body.created_by,
        assigned_to: req.body.assigned_to || "",
        open: true,
        status_text: req.body.status_text || ""
      };
      if (!issue.issue_title || !issue.issue_text || !issue.created_by) {
        res.send("Error - missing inputs");
      } else {
        MongoClient.connect(CONNECTION_STRING, function(err, client) {
          if (err) console.error(err);
          else {
            let db = client.db("issuetracker");
            var collection = db.collection(project);
            collection.insertOne(issue, function(err, doc) {
              issue._id = doc.insertedId;
              res.json(issue);
            });
          }
        });
      }
    })

    .put(function(req, res) {
      const project = req.params.project;
      const issue = req.body._id;
      delete req.body._id;
      let updates = req.body;
      for (let element in updates) {
        if (!updates[element]) {
          delete updates[element];
        }
      }
      if (updates.open) updates.open = updates.open === "true" ? true : false;
      if (Object.keys(updates).length === 0) res.send("Error - no updates");
      else {
        updates.updated_on = new Date();
        MongoClient.connect(CONNECTION_STRING, function(err, client) {
          if (err) console.error(err);
          else {
            let db = client.db("issuetracker");
            var collection = db.collection(project);
            //collection.findAndModify({query: { _id: new ObjectId(issue), }, sort:{_id:1}, update:{$set: updates}, new: true})
            collection.findAndModify(
              { _id: new ObjectId(issue) },
              [["_id", 1]],
              { $set: updates },
              { new: true },
              function(err, doc) {
                !err
                  ? res.send("Update successful")
                  : res.send("Update error " + issue + " " + err);
              }
            );
          }
        });
      }
    })

    .delete(function(req, res) {
      const project = req.params.project;
      const issue = req.body._id;
      if (!issue) {
        res.send("Error - no id");
      } else {
        MongoClient.connect(CONNECTION_STRING, function(err, client) {
          if (err) console.error(err);
          else {
            let db = client.db("issuetracker");
            let collection = db.collection(project);
            collection.findAndRemove({ _id: new ObjectId(issue) }, function(
              err,
              doc
            ) {
              !err
                ? res.send("Deleted successfully " + doc.value._id)
                : res.send("Deletion error " + doc.value._id + " " + err);
            });
          }
        });
      }
    });
};
