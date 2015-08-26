


Template.messageList.helpers({
  messages: function () {
    var query = Messages.find({});

    var init = true;

    query.observeChanges({
      added: function (id, message) {
          if ( ! init) 
            console.log(id);
      }
    });

    init = false;
    return query;
  }
});

Template.newMessage.events({
  "submit .new-message": function (event) {
    event.preventDefault();

    var name = event.target.name.value;
    var text = event.target.message.value;

    Meteor.call("sendMessage", name, text);

    event.target.message.value = "";
  }
});


