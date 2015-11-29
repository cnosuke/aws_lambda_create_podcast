// stub of event
var event = {
  "Records": [
    {}
  ]
}

// stub of context
var context = {
    invokeid: 'invokeid',
    done: function(err,message){
        return;
    },
    succeed: function(msg){
      console.log(msg);
    },
    fail: function(msg){
      console.log(msg);
    }
};

var lambda = require("./index.js");
lambda.handler(event,context);
