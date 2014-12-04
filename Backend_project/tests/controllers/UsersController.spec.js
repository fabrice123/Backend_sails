/**
 * Created by fabrice on 27/11/2014.
 */
var User = require('../../api/models/User'),
    sinon = require('sinon'),
    assert = require('assert');
var Sails = require('sails');


describe('The User failer Model', function () {
    var app;
    before(function (done) {

        // Lift Sails and start the server
        Sails.lift({

            log: {
                level: 'error'
            }

        }, function (err, sails) {

            // Instantiates new sails application
            app = sails;

            // Instantiates controller
           console.log(sails);

            // Lets testing framework know async call is done
            done(err, sails);
        });
    });
    describe('The User failer Model', function () {
        console.log(User.attributes.name);

      assert.notEqual(User.attributes.name,User.attributes.name);

    });




// Gets run after each test
    after(function(done) {

        // Destroys application
        app.lower(done);

    });
});