Template.customer.onRendered(function() {

})

Template.provider.onRendered(function() {
  var providerKey = new bitcore.PrivateKey(bitcore.Networks.testnet);

  console.log('provider key: ' + providerKey.toString());
});

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

    var name = "makaka";
    var text = event.target.message.value;

    var insight = new bitExplorers.Insight('testnet');

    var providerAddress = 'mrS6NTGrcW8QT1g3caYupyQtxvk9WM2zim'

    var customerAddress = 'mkAHsyhDGe9yA271RQ9rQSJVYbFtwx5HiE'
    var customerPrivate = 'a96511bd65dc4fbb0409bf3e51ac8e18853e05c6e133b1b1d78e1d34a995d1a7'

    insight.getUnspentUtxos(customerAddress, function(err, utxos) {
      if (!err) {
        console.log("utxos: ", utxos);

        var transaction = new bitcore.Transaction()
            .from(utxos[0])
            .to(providerAddress, 100000)
            .change(customerAddress)
            .fee(1000)
            .sign(customerPrivate);

        insight.broadcast(transaction, function(err, txId) {
          if (err) { 
            console.log(err) 
          } else { 
            console.log(txId)
            Meteor.call("sendMessage", name, text, txId);
          } 
        });

      } else {
        console.log(err);
      } 
    });

    

    event.target.message.value = "";
  }
});


