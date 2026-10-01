

//Configration 

//var FacebookAppId =  '1062363573874167'; //mersal admin test
//var client_secret = '910315a524ba4e7a1202783e61a374dd'; //mersal admin test

var FacebookAppId = '2181065378784359'; //mersal admin  
var client_secret = 'd4880ccfdf3ebd6cdea76bbe06b45e42';//mersal admin  

//Configration

// initialize and setup facebook js sdk
window.fbAsyncInit = function () {
    FB.init({
        //appId: '1062363573874167', //mersal admin 
        appId: '2181065378784359', //test mersal notification
        xfbml: true,
        version: 'v2.8'
    });
};

(function (d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) { return; }
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

// login with facebook with extra permissions
function JoinApp() {
    FB.login(function (response) {
        console.log(response, response.status);
        if (response.status === 'connected') {
            var apiurl = MersalWebAPIBaseUrl + "api/FacebookAppApi/AddUser";
            var data = { UserFBId: response.authResponse.userID, FBAppId: FacebookAppId };
            $.ajax({
                type: "POST",
                contentType: "application/json",
                url: apiurl,
                crossDomain: true,
                headers: getHeaders(),
                data: JSON.stringify(data),
                async: true,
                beforeSend: function () {
                    $("#imgAjaxLoader").show();
                },
                success: function (data) {
                    toastr.success(SuccessfulProcess);
                    $("#imgAjaxLoader").hide();
                },
                error: function (xhr) {
                    toastr.error(xhr.error);
                    $("#imgAjaxLoader").hide();
                }
            });
        } else if (response.status === 'not_authorized') {
            toastr.error('You are not logged into Facebook.');
        } else {
            toastr.error('error');
        }

    }, { scope: 'email' });

}

// Create Web  Request 'GET'
function httpGet(theUrl) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", theUrl, false); // false for synchronous request
    xmlHttp.send(null);
    return xmlHttp;
}

// Send Notifications Test
function SendNotificationsFacebook(Message_180) {
    var access = httpGet('https://graph.facebook.com/oauth/access_token?client_id=' + FacebookAppId + '&client_secret=' + client_secret + '&grant_type=client_credentials');
    if (access.status == 200) {
        var access_token = access.responseText.split('access_token=')[1];
        if (access_token != "") {

            //Facebookuserids --> Notifications
            var apiurl = MersalWebAPIBaseUrl + "api/FacebookAppApi/GetUsersAppId?AppId=" + FacebookAppId;
            $.ajax({
                type: "GET",
                contentType: "application/json",
                url: apiurl,
                crossDomain: true,
                headers: getHeaders(),
                async: true,
                beforeSend: function () {
                    $("#imgAjaxLoader").show();
                },
                success: function (data) { 
                    var notificationsBody = { access_token: access_token, template: Message_180, href: 'URL' };
                    for (var i = 0; i < data.length; i++) {
                        FB.api('/' + data[i] + '/notifications', 'POST', notificationsBody, function (response) {
                            console.log(response, data[i]);
                        });
                    } 
                    $("#imgAjaxLoader").hide(); 
                },
                error: function (xhr) {
                    toastr.error(xhr.error);
                    $("#imgAjaxLoader").hide();
                }
            });
            //Facebookuserids --> Notifications 

        }
    }
}


function getaccessToken() {
    var access_token = httpGet('https://graph.facebook.com/oauth/access_token?client_id=' + FacebookAppId + '&client_secret=' + client_secret + '&grant_type=client_credentials');
    return access_token.responseText.split('access_token=')[1];
}
