


 
function onUploadNewCase(e) {
    var createRequestForHelpForm = $("#createRequestForHelpForm");
    if (!createRequestForHelpForm.valid()) {
        $("#CaseFile").data("kendoUpload").trigger("cancel");
        e.preventDefault();
        return;
    };
    var data = {};
    $("#createRequestForHelpForm").serializeArray().map(function (x) { data[x.name] = x.value; });
    e.data = data;
}



//submit
var createRequestForHelpFormResult={};
createRequestForHelpFormResult.response="";
var createRequestForHelpForm = $("#createRequestForHelpForm");
createRequestForHelpForm.submit(function (e) {
    e.preventDefault();
    $('#StatusInEgyptIdError').remove();
    if (!createRequestForHelpForm.valid()){
        if ($('.divStatus').css("display") != "none" && $('#StatusInEgypt').val() == '') {
            $('.divStatus').append('<span class="field-validation-error" id="StatusInEgyptIdError" data-valmsg-replace="true"><span for="StatusInEgyptId" class="">وضع الحاله مطلوب</span></span>');
        }
        return;
    }

    if ($('.divStatus').css("display") != "none" && $('#StatusInEgypt').val() == '') {
        $('#StatusInEgyptIdError').remove();
        $('.divStatus').append('<span class="field-validation-error" id="StatusInEgyptIdError" data-valmsg-replace="true"><span for="StatusInEgyptId" class="">وضع الحاله مطلوب</span></span>');
        return;
    }

    if ($("#CaseHaseFile").val() == "HasFile") {
        $(".k-upload-selected").click();
        return;
    }  
    var apiurl = MersalUIBaseUrl + "Case/Create";
    var data = {};
    $("#createRequestForHelpForm").serializeArray().map(function (x) { data[x.name] = x.value; });
    data.txtDisesaseType = $("#txtDisesaseType").val();
    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: apiurl,
        crossDomain: true,
        headers: getHeaders(),
        data: JSON.stringify(data),
        async: false,
        success: function (dataReslut) { 
            createRequestForHelpFormResult.response = JSON.parse(dataReslut);
            onSuccessUploadNewCase(createRequestForHelpFormResult);
        },
        error: function (xhr) {
            $("#createRequestForHelpForm").hide();
            $("#requestMessage").show();
            $("#requestMessage").html("<span>Your Request Failed To Complete</span>");
        }
    });
});

function onSelectCaseFile() {
    $("#CaseHaseFile").val("HasFile"); 
    setTimeout(function () { $(".k-upload-selected").hide(); }, 1);
}

function onSuccessUploadNewCase(e) {

    var dataReslut = e.response;
    if (dataReslut.success == true) {
        $("#createRequestForHelpForm").hide(); 
        $("#requestMessage").show();
        $("#requestMessage").html(dataReslut.successMessage);
        $("#createRequestForHelpForm")[0].reset();
        $("#CaseHaseFile").val("");
        sentNotificationToCommittee(dataReslut.NotificationSubject, dataReslut.NotificationBody, sessionStorage.getItem("Id"));
        // var caseData = JSON.stringify(data);
        //var Id = sessionStorage.getItem("Id");
        //if (Id != 0) {
        //    if (data.Email) {
        //        var NotificationData =
        //            {
        //                ItemType: 1,
        //                NotificationSubject: "طلب مساعدة",
        //                NotificationBody: "لقد تم إستقبال طلبكم بنجاح برقم : " + dataReslut.caseCode,
        //                Recipients: data.Email,
        //                NotificationType: 1,
        //                NotificationPriority: 4,
        //                CreatedOn: new Date(),
        //            };
        //        sentNotification(NotificationData);
        //    }
        //}
    }
    else {
        //$("#createRequestForHelpForm")[0].reset();
        $("#createRequestForHelpForm").hide();
        $("#requestMessage").html(dataReslut.ErrorMessage);
        $("#CaseHaseFile").val(""); 
    }
    $(".field-validation-error").html("");
}

 