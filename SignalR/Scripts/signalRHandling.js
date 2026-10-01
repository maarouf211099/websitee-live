

var SRClient = {};

SRClient.connect = function (userId) {

    // $.connection.hub.logging = true;
    var SRUserId = userId;
    if (SRUserId != null) {
        $.connection.hub.transportConnectTimeout = 3000;

        //$.connection.hub.url = "http://192.168.50.106:8083/signalr";
        $.connection.hub.url = SignalRServiceURL;
        $.connection.hub.qs = { 'userId': SRUserId };
        var notify = $.connection.notificationHub;


        notify.client.notify = function (subject, body,notifyId) {

            Notifier.success(body, subject);
            notify.server.userRecieved(SRUserId, notifyId);

        };

        $.connection.hub.start().done(function () {
            var x = $.connection.hub.id;
        });
    }
};