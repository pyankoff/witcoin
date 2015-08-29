var provider = null;
var chat = null;

function startMonitoring() {
  var query = Messages.find({chatId: chat._id});

  query.observeChanges({
    added: function (id, message) {
      if (message.messageToProvider) {
        receivedRefund = message.messageToProvider;
        console.log(receivedRefund);

        var messageToConsumer = provider.signRefund(receivedRefund);

        console.log(messageToConsumer);
        var message = {chatId: chat._id, messageToConsumer: messageToConsumer.toJSON()}        

        Meteor.call("sendMessage", message);
      }
    }
  });
};

Template.provider.helpers({
  noChat: function() {
    return !Session.get("providerId");
  },
  chat: function() {
    return chat;
  }
});



Template.provider.events({
  "submit .new-chat": function(e) {
    e.preventDefault();

    var providerAddress = 'mrS6NTGrcW8QT1g3caYupyQtxvk9WM2zim';//e.target.address.value;
    var providerName = e.target.name.value;
    
    provider = new bitChannel.Provider({
      network: 'testnet',
      paymentAddress: providerAddress
    });

    var providerPublicKey = provider.getPublicKey().toJSON();
    var providerId = Random.id();

    chat = {
      providerId: providerId,
      providerAddress: providerAddress,
      providerName: providerName,
      providerPublicKey: providerPublicKey
    }

    Chats.insert(chat, function(error, result) {
      chat = Chats.findOne(result);
      Session.set("providerId", providerId);
      startMonitoring();
    });
  },
  "submit .new-message": function (e) {
    e.preventDefault();

    var message = {
      chatId: chat._id,
      text: e.target.message.value,
      sender: this.providerName
    }

    Meteor.call("sendMessage", message);

    e.target.message.value = "";
  }
});






Template.consumer.helpers({
  chatName: function() {
    return this.providerName;
  },
  noChannel: function() {
    return !Session.get("channelSet");
  },
  fundingAddress: function() {
    return Session.get("fundingAddress");
  }
});

Template.consumer.onRendered(function() {
  var PrivateKey = bitcore.PrivateKey;
  var Consumer = bitChannel.Consumer;

  var chatId = this.data._id;

  var providerAddress = 'mrS6NTGrcW8QT1g3caYupyQtxvk9WM2zim';//this.providerAddress;

  var fundingKey = new PrivateKey('b0031d5d5f081e73c2ffa3bbedc630aceb2d97c711dbf36dd9c1c5843566b130', 'testnet');
  var commitmentKey = new PrivateKey('testnet');
  
  var refundAddress = 'mkAHsyhDGe9yA271RQ9rQSJVYbFtwx5HiE'; //make consumer

  //need to get it from provider
  var providerPublicKey = '034a6bb80afe3f12b843892c6715de6027be36247d9fb02bc29b7ef3703998e29c'

  var consumer = new Consumer({
    fundingKey: fundingKey,
    refundAddress: refundAddress,
    commitmentKey: commitmentKey,
    providerPublicKey: providerPublicKey,
    providerAddress: providerAddress
  });

  Session.set("fundingAddress", fundingKey.toAddress().toString());

  var insight = new bitExplorers.Insight('testnet');

  checkFunding();

  function checkFunding() {
    insight.getUnspentUtxos(consumer.fundingAddress, function(err, utxos) {
      // console.log(utxos);
      if (utxos.length > 0) {
        consumer.processFunding(utxos)
        // consumer.commitmentTx._updateChangeOutput();
        console.log(consumer.commitmentTx.toJSON());

        var messageToProvider = consumer.setupRefund().toJSON();
        var message = {chatId: chatId, messageToProvider: messageToProvider}        

        Meteor.call("sendMessage", message);
      } else {
        setTimeout(checkFunding, 10000);
      }
    });
  }

});

Template.consumer.events({
  "submit .new-message": function (e) {
    e.preventDefault();

    var message = {
      chatId: this._id,
      text: e.target.message.value,
      sender: "makaka"
    }

    e.target.message.value = "";
  }
});


Template.consumer.helpers({
  messages: function () {
    var query = Messages.find({chatId: this._id});

    var init = true;

    query.observeChanges({
      added: function (id, message) {
          if (!init) 
            console.log(message);
      }
    });

    init = false;
    return query;
  }
});

