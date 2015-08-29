var provider = null;
var chat = null;

function providerStartMonitoring() {
  var query = Messages.find({chatId: chat._id});

  query.observeChanges({
    added: function (id, message) {
      if (message.messageToProvider != null) {
        receivedRefund = message.messageToProvider;
        console.log("receivedRefund: ", receivedRefund);

        var messageToConsumer = 
            provider.signRefund(receivedRefund).toJSON();

        console.log("messageToConsumer: ", messageToConsumer);
        var message = {chatId: chat._id, messageToConsumer: messageToConsumer}        

        Meteor.call("sendMessage", message);
      } else if (message.paymentTx != null) {
        console.log("messageTx: ", message.paymentTx);

        var payment = provider.validPayment(message.paymentTx);

        console.log("provider valid payment: ", payment);
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
      providerStartMonitoring();
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
  },
  "click #finish": function(e) {
    console.log("finish pressed");

    insight.broadcast(provider.paymentTx, function(err, txid) {
      if (err) {
        console.log('Error broadcasting');
      } else {
        console.log('broadcasted as', txid);
      }
    });
  }
});



var consumer = null;
var chatId = null;
var insight = new bitExplorers.Insight('testnet');

function consumerStartMonitoring() {
  var query = Messages.find({chatId: chatId});

  query.observeChanges({
    added: function (id, message) {
      if (message.messageToConsumer != null) {
        console.log("consumer: ", consumer);

        console.log("commitment is signed: ", consumer.commitmentTx.isFullySigned());

        signedRefund = message.messageToConsumer;
        console.log("signedRefund: ",  signedRefund);

        if (consumer.validateRefund(signedRefund)) {
          console.log('validated');

          insight.broadcast(consumer.commitmentTx, function(err, txid) {
            if (err) {
              console.log('Error broadcasting');
            } else {
              console.log('broadcasted as', txid);
              Session.set("channelSet", true);
            }
          });
        } else {
          console.log('error');
        }
      } else {
        console.log(message);
      }
    }
  });
};

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

  chatId = this.data._id;

  var providerAddress = this.data.providerAddress;//this.providerAddress;

  var fundingKey = new PrivateKey('b0031d5d5f081e73c2ffa3bbedc630aceb2d97c711dbf36dd9c1c5843566b130', 'testnet');
  var commitmentKey = new PrivateKey('testnet');
  
  var refundAddress = 'mkAHsyhDGe9yA271RQ9rQSJVYbFtwx5HiE'; //make consumer

  //need to get it from provider
  var providerPublicKey = this.data.providerPublicKey;

  consumer = new Consumer({
    network: 'testnet',
    fundingKey: fundingKey,
    refundAddress: refundAddress,
    commitmentKey: commitmentKey,
    providerPublicKey: providerPublicKey,
    providerAddress: providerAddress
  });

  Session.set("fundingAddress", fundingKey.toAddress().toString());

  checkFunding();

  function checkFunding() {
    insight.getUnspentUtxos(consumer.fundingAddress, function(err, utxos) {
      console.log("utxos: ", utxos);
      if (utxos.length > 0) {
        consumer.processFunding(utxos)
        consumer.commitmentTx._updateChangeOutput();
        // console.log(consumer.commitmentTx.toJSON());

        var messageToProvider = consumer.setupRefund().toJSON();
        var message = {chatId: chatId, messageToProvider: messageToProvider};
        console.log("messageToProvider: ", messageToProvider);

        Meteor.call("sendMessage", message);
        consumerStartMonitoring();
      } else {
        setTimeout(checkFunding, 10000);
      }
    });
  }

});

Template.consumer.events({
  "submit .new-message": function (e) {
    e.preventDefault();

    consumer.incrementPaymentBy(10000);
    var paymentTx = consumer.paymentTx.toObject();
    console.log("consumer: ", consumer.paymentTx);
    console.log("payment: ", paymentTx);

    var message = {
      chatId: chatId,
      text: e.target.message.value,
      sender: "makaka",
      paymentTx: paymentTx
    }
    
    Meteor.call("sendMessage", message);

    e.target.message.value = "";
  }
});


Template.messageList.helpers({
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

