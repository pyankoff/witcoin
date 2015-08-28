Template.createChannel.events({
  "submit .new-channel": function(event) {
    event.preventDefault();

    var channel = {
          providerId: Random.id(),
          providerAddress: event.target.address.value,
          providerName: event.target.name.value
    }

    Session.set("providerId", channel.providerId);

    Meteor.call("createChannel", channel, 
      function(error, result) {
        if (!error) {
          Router.go("channel", {_id: result._id, hii: "asdf"});
        }
      });
  }
});

Template.channel.helpers({
  channelName: function() {
    return this.providerName;
  },
  isProvider: function() {
    return this.providerId == Session.get('providerId');
  }
});

Template.messageList.helpers({
  messages: function () {
    console.log(this._id);
    var query = Messages.find({channelId: this._id});

    var init = true;

    query.observeChanges({
      added: function (id, message) {
          if (!init) 
            console.log(id);
      }
    });

    init = false;
    return query;
  }
});

Template.newProviderMessage.events({
  "submit .new-message": function (event) {
    event.preventDefault();

    var message = {
      channelId: this._id,
      text: event.target.message.value,
      sender: this.providerName
    }

    Meteor.call("sendMessage", message);

    event.target.message.value = "";
  }
});

Template.newClientMessage.events({
  "submit .new-message": function (event) {
    event.preventDefault();

    var message = {
      channelId: this._id,
      text: event.target.message.value,
      sender: "makaka"
    }

    var insight = new bitExplorers.Insight('testnet');

    var providerAddress = "mrS6NTGrcW8QT1g3caYupyQtxvk9WM2zim";//this.providerAddress;

    var customerAddress = 'mkAHsyhDGe9yA271RQ9rQSJVYbFtwx5HiE'
    var customerPrivate = 'a96511bd65dc4fbb0409bf3e51ac8e18853e05c6e133b1b1d78e1d34a995d1a7'

    insight.getUnspentUtxos(customerAddress, function(err, utxos) {
      if (!err) {
        // console.log("utxos: ", utxos);

        var transaction = new bitcore.Transaction()
            .from(utxos)
            .to(providerAddress, 100000)
            .change(customerAddress)
            .fee(1000)
            .sign(customerPrivate);

        insight.broadcast(transaction, function(err, txId) {
          if (err) { 
            console.log(err) 
          } else { 
            message.txId = txId;
            Meteor.call("sendMessage", message);
          } 
        });

      } else {
        console.log(err);
      } 
    });

    event.target.message.value = "";
  }
});


