Meteor.publish('messages', function() {
  return Messages.find();
});

Meteor.publish('chats', function() {
  return Chats.find();
});