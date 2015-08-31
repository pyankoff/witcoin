Router.configure({ 
  layoutTemplate: 'layout',
  waitOn: function() {
    return [ Meteor.subscribe('messages'),
             Meteor.subscribe('chats') ];
  }
});

Router.map(function() { 
  this.route('bs', {path: '/bs'});
  this.route('provider', {path: '/'});
  this.route('consumer', {
    path: '/chat/:_id',
    data: function() { 
      return Chats.findOne(this.params._id); 
    }
  });
});