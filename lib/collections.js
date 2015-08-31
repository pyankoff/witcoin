Messages = new Meteor.Collection('messages');
Chats = new Meteor.Collection('chats');


Meteor.methods({
  sendMessage: function (message) {
    Messages.insert(message);
  }
});
