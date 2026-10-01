
function ChangeCulture() {

    $("#languageLink").click(function () {

        window.location = $(this).attr("href");
    })
}

function logout() {
    window.location = "/Account/LogOff";
}


var myLoginForm = $("#LoginForm");
myLoginForm.submit(function (e) {
    e.preventDefault();
    if (!myLoginForm.valid()) return;

    var apiurl = "/Account/LoginAjax";
    var data = {};
    myLoginForm.serializeArray().map(function (x) { data[x.name] = x.value; });
    console.log(JSON.stringify(data));
    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: apiurl,
        crossDomain: true,
        headers: getHeaders(),
        data: JSON.stringify(data),
        async: false,
        success: function (data) {
            if (data.result) {
                sessionStorage.setItem("Id", data.userDetails.Id);
                sessionStorage.setItem("UserName", data.userDetails.UserName);
                sessionStorage.setItem("MenuItems", data.userDetails.MenuItems);
                sessionStorage.setItem("Privileges", data.userDetails.Privileges);
                sessionStorage.setItem("token_type", data.userDetails.token_type);
                sessionStorage.setItem("Authorization", data.userDetails.access_Token);
                $(".popup-form").removeClass("active").slideUp();
                $("body").find(".popup").fadeOut();
            }
            else {
                $("#loginErrorMassage").html(data.message);
            }
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });
});


var RegisterForm = $("#RegisterForm");
RegisterForm.submit(function (e) {
    var valideEmail = $("#RegisterMailValid").val();
    if (valideEmail == "false") {
        var validator = $(this).validate();
        var errors = { Email: ThisEmailAlreadyRegisted };
        setTimeout(function () { validator.showErrors(errors); }, 1);
    }
});


function GetCountryMasteCode() {
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: SystmeCodeWebAPIBaseUrl + "api/DetailCode/GetMasterCodeByMultiCode?masterCode=Coun",
        async: true,
        headers: getHeaders(),
        success: function (data) {
            var htmlCountry = "<option value=''></option>";
            $.each(data, function (key, value) {
                
                if (value.masterCodeValue === "Coun") {
                    var selec = '';
                    if (value.Id == 1076) {
                        selec = " selected='selected' ";
                    }
                    if (_cultureIsArabic) {
                        htmlCountry += "<option value=" + value.Id + selec + "  >" + value.NameAr + "</option>";
                    }
                    else {
                        htmlCountry += "<option value=" + value.Id + selec +" >" + value.NameEn + "</option>";
                    }
                }
            });
            $(".Country").html(htmlCountry);
            $('.Country').trigger('change');
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });
}
GetCountryMasteCode();

function CountryChange() {
    $(".Country").change(function () {
        if ($(this).hasClass("request-Country")) {
            getGovernrate($(this).val(), "GovernorateRequest");
        }
        else if ($(this).hasClass("regiser-Country")) {
            getGovernrate($(this).val(), "GovernorateRegister");
        }
        else if ($(this).hasClass("adminAddCase-Country")) {
            getGovernrate($(this).val(), "GovernorateAdminAddCase");
        }
        else if ($(this).hasClass("adminEditCase-Country")) {
            getGovernrate($(this).val(), "GovernorateAdminEditCase");
        }
    });
}
CountryChange();
 
function getGovernrate(countryId, elementId) {
    if (countryId == null || countryId == 0) {
        $("#" + elementId).html("");
        $("#" + elementId).val("");
        return;
    }
    var url = SystmeCodeWebAPIBaseUrl + "api/DetailCode/GetByParentId?parentId=" + countryId;// $("#Country").val();
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: url,
        async: true,
        headers: getHeaders(),
        success: function (data) {
            // var htmlGovernorate = "<option value='0'></option>";
            var htmlGovernorate = "<option value=''></option>";
            $.each(data, function (key, value) {
                if (value.masterCodeValue == "Gove") {
                    if (_cultureIsArabic) {
                        htmlGovernorate += "<option value=" + value.Id + " >" + value.NameAr + "</option>";
                    }
                    else {
                        htmlGovernorate += "<option value=" + value.Id + " >" + value.NameEn + "</option>";
                    }
                }
            });
            $("#" + elementId).html(htmlGovernorate);
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });
}

function GovernorateChange() {
    $(".Governorate").change(function () {
        if ($(this).hasClass("Request-Governorate")) {
            getDistrict($(this).val(), "DistrictRequest");
        }
        else if ($(this).hasClass("adminAddCase")) {
            getDistrict($(this).val(), "DistrictAdminAddCase");
        }
        else if ($(this).hasClass("adminEditCase")) {
            getDistrict($(this).val(), "DistrictAdminEditCase");
        }
        else if ($(this).hasClass("regiser-Governorate")) {
            getDistrict($(this).val(), "DistrictRegister");
        }
    });
}

GovernorateChange();
nationalityChange();
function nationalityChange() {
    $("#Nationality").change(function () {
        $('#StatusInEgyptIdError').remove();
        let selectedText = $(this).find("option:selected").text();
        if (selectedText != 'مصري' && selectedText != 'مصرى' && selectedText != 'Egyptian') {
            $('.divStatus').show("slow");
        }
        else {
            $('.divStatus').hide("slow");
        }
    });
}


function getDistrict(GovernorateId, elementId) {
    if (GovernorateId == null || GovernorateId == 0) {
        $("#" + elementId).html("");
        $("#" + elementId).val("");
        return;
    }
    var url = SystmeCodeWebAPIBaseUrl + "api/DetailCode/GetByParentId?parentId=" + GovernorateId;
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: url,
        async: true,
        headers: getHeaders(),
        success: function (data) {
            if (data != null) {
                var htmlDistrict = "<option value=''></option>";
                $.each(data, function (key, value) {
                    if (value.masterCodeValue == "Dist") {
                        if (_cultureIsArabic) {
                            htmlDistrict += "<option value=" + value.Id + " >" + value.NameAr + "</option>";
                        }
                        else {
                            htmlDistrict += "<option value=" + value.Id + " >" + value.NameEn + "</option>";
                        }
                    }
                });
                $("#" + elementId).html(htmlDistrict);
            }
            else {
                $("#" + elementId).html("");
                $("#" + elementId).val("");
            }
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });
}



function sentNotification(data) {
    var apiurl = NotificationAPIBaseUrl + "api/NoticationItem/addItem";
    console.log(JSON.stringify(data));
    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: apiurl,
        crossDomain: true,
        headers: getHeaders(),
        data: JSON.stringify(data),
        async: true,
        success: function (data) {
            console.log("Successfully notification");
        },
        error: function (xhr) {
            console.log("error notification");
        }
    });
}

function sentNotificationToCommittee(NotificationSubject, NotificationBody, userId) {
    var apiurl = MersalWebAPIBaseUrl + "api/Committee/sentNotificationToCommittee?NotificationSubject=" + NotificationSubject +
        "&NotificationBody=" + NotificationBody + "&userId=" + userId;
    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: apiurl,
        crossDomain: true,
        headers: getHeaders(),
        async: true,
        success: function (data) {
            console.log("Successfully notification");
        },
        error: function (xhr) {
            console.log("error notification");
        }
    });
}



if (_cultureIsArabic) {
    kendo.culture("ar-EG");
}

function TextBoxToDatePicker() {
    if (_cultureIsArabic) {
        kendo.culture("ar-EG");
    }
    $(".DateTillNow").kendoDatePicker({
        max: new Date(),
        format: "MM/dd/yyyy",
    }).attr("readonly", "readonly");
    $(".DatekendoDatePicker").kendoDatePicker({
        format: "d/M/yyyy",
    }).attr("readonly", "readonly");
}
TextBoxToDatePicker();

function postAndRedirect(url, postData) {
    var postFormStr = "<form method='POST' action='" + url + "'>\n";

    for (var key in postData) {
        if (postData.hasOwnProperty(key)) {
            postFormStr += "<input type='hidden' name='" + key + "' value='" + postData[key] + "'></input>";
        }
    }

    postFormStr += "</form>";

    var formElement = $(postFormStr);

    $('body').append(formElement);
    $(formElement).submit();
}


function GoToSystemCode() {

    var redirect = SystmeCodeUIUrl + "Account/AuthorizedLogin";
    var postFormStr = "<form method='POST' action='" + redirect + "'>\n";

    postFormStr += "<input type='hidden' name='token' value='" + sessionStorage.getItem("Authorization") + "'></input>";
    postFormStr += "<input type='hidden' name='token_type' value='" + sessionStorage.getItem("token_type") + "'></input>";

    postFormStr += "</form>";

    var formElement = $(postFormStr);

    $('body').append(formElement);
    $(formElement).submit();
}
function GoToUserManagement() {
    var redirect = UserNamagementUIUrl + "Account/AuthorizedLogin";
    var postFormStr = "<form method='POST' action='" + redirect + "'>\n";

    postFormStr += "<input type='hidden' name='token' value='" + sessionStorage.getItem("Authorization") + "'></input>";
    postFormStr += "<input type='hidden' name='token_type' value='" + sessionStorage.getItem("token_type") + "'></input>";

    postFormStr += "</form>";

    var formElement = $(postFormStr);

    $('body').append(formElement);
    $(formElement).submit();
}


$.validator.setDefaults({
    ignore: []
});


function confirmMessage(title, HTMLMessage, width, height, InjectedSuccessionFunction) {
    var isAccepted = true;
    $('<div></div>').appendTo('body')
   .html('<div>' + HTMLMessage + '</div>')
   .dialog({
       modal: true,
       title: title,
       zIndex: 10000,
       width: width,
       height: height,
       autoOpen: true,
       width: 'auto',
       resizable: false,
       buttons: {
           Yes: function () {
               // $(obj).removeAttr('onclick');
               // $(obj).parents('.Parent').remove();
               isAccepted = true;
               $(this).dialog("close");
               InjectedSuccessionFunction();
               return isAccepted
           },
           No: function () {
               isAccepted = false;
               $(this).dialog("close");
               return isAccepted;
           }
       },
       close: function (event, ui) {
           $(this).remove();
           dialogIsOpened = false;
           return isAccepted;
       }
   });
    return isAccepted;
}

var confirmMessageBootstrapHandler; 
function confirmMessageBootstrap(title, HTMLMessage, width, height, InjectedSuccessionFunction) {

    $("#ConfirmationMassageHeader").html(title);
    $("#ConfirmationMassageH3").html(HTMLMessage);
    $('#cofirmationMessageModals').modal('show');
    confirmMessageBootstrapHandler = InjectedSuccessionFunction;
}

function btnsubmitConfirmationDialog() {
    confirmMessageBootstrapHandler();
    $('#cofirmationMessageModals').modal('hide');
}
function sentNotificationToGroupFun(NotificationSubject, NotificationBody, userId, GroupId)
{
    var Notapiurl = NotificationAPIBaseUrl + "api/NoticationItem/sentNotificationToGroup?NotificationSubject=" + NotificationSubject + "&NotificationBody=" + NotificationBody + "&userId=" + userId + "&GroupId=" + GroupId;
    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: Notapiurl,
        crossDomain: true,
        headers: getHeaders(),
        data: {},
        async: true,
        success: function (data) {
            return true;
            //toastr.success(SuccessfulProcess);
        },
        error: function (xhr) { 
            toastr.error(xhr.error);
            return false;
        }
    });
}

function sentNotificationToCaseCreator(NotificationSubject, NotificationBody, CaseId) {
    var Notapiurl = NotificationAPIBaseUrl + "api/NoticationItem/sentNotificationToCaseCreator?NotificationSubject=" + NotificationSubject + "&NotificationBody=" + NotificationBody + "&CaseId=" + CaseId ;
    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: Notapiurl,
        crossDomain: true,
        headers: getHeaders(),
        data: {},
        async: true,
        success: function (data) {
            console.log("Successfully notification");
        },
        error: function (xhr) {
            console.log("error notification");
        } 
    });
}




function setIsMailValid() {
    var validator = $("#RegisterForm").validate();
    var url = UserNamagementWebAPIBaseUrl + "ValidateEmail?Email=" + $("#EmailRegist").val();
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: url,
        async: true,
        headers: getHeaders(),
        success: function (data) {
            $("#RegisterMailValid").val(data);
            if (data) {
                $("#RegisterForm").validate({ errorPlacement: function (error, element) { } });
            } else {
                var errors = { Email: ThisEmailAlreadyRegisted };
                setTimeout(function () { validator.showErrors(errors); }, 1);
            }
        }
    });
}


