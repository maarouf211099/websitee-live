


//submit
var createEmergencyRequestFormResult = {};
createEmergencyRequestFormResult.response = "";
var createEmergencyRequestForm = $("#createEmergencyRequestForm");
var EmerCaseId = 0;
createEmergencyRequestForm.submit(function (e) {
    e.preventDefault();
    $('#Mobile').val($('#PhoneNumberAnonymous').val());
    $('#StatusInEgyptIdError').remove();
    $('.divStatus').html('');
    let option = $('#EmergencyServiceType option:selected').attr('code');
    if (option == 'CoronaSus') {
        $('#emergencyForm').html('');
    }
    else if (option == 'otherEmer') {
        $('#coronaForm').html('');
    }

    if (!createEmergencyRequestForm.valid()) {
        if (isAuthenticatedUser == "False" && $("#CaseHaseFile").val() != "HasFile") {
            $('.divStatus').append('<span class="field-validation-error" id="StatusInEgyptIdError" data-valmsg-replace="true"><span for="StatusInEgyptId" class="">مرفقات المسحه والتحاليل مطلوبه</span></span>');
        }
        //if ($('.divStatus').css("display") != "none" && $('#StatusInEgypt').val() == '') {
        //    $('.divStatus').append('<span class="field-validation-error" id="StatusInEgyptIdError" data-valmsg-replace="true"><span for="StatusInEgyptId" class="">وضع الحاله مطلوب</span></span>');
        //}
        return;
    }

    //if ($('.divStatus').css("display") != "none" && $('#StatusInEgypt').val() == '') {
    //    $('#StatusInEgyptIdError').remove();
    //    $('.divStatus').append('<span class="field-validation-error" id="StatusInEgyptIdError" data-valmsg-replace="true"><span for="StatusInEgyptId" class="">وضع الحاله مطلوب</span></span>');
    //    return;
    //}

    if (isAuthenticatedUser == "False" && $("#CaseHaseFile").val() != "HasFile") {
        $('.divStatus').append('<span class="field-validation-error" id="StatusInEgyptIdError" data-valmsg-replace="true"><span for="StatusInEgyptId" class="">مرفقات المسحه والتحاليل مطلوبه</span></span>');
        return;
    }

   
    let emergencyApiurl = MersalUIBaseUrl + "EmergencyCase/CreateEmergencyRequest";
    let emergencyData = {};

    $("#createEmergencyRequestForm").serializeArray().map(function (x) { emergencyData[x.name] = x.value; });

    emergencyData['PhoneNumberAnonymous'] = $('#PhoneNumberAnonymous').val();
    emergencyData['NameAnonymous'] = $('#NameAnonymous').val();
    emergencyData['Mobile'] = emergencyData['PhoneNumberAnonymous'];

    if (option == 'CoronaSus') {
        emergencyData['EmergencyForm'] = null;
    }
    else {
        emergencyData['CoronaForm'] = null;
    }

    

    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: emergencyApiurl,
        crossDomain: true,
        headers: getHeaders(),
        data: JSON.stringify(emergencyData),
        async: false,
        success: function (dataReslut) {
            createEmergencyRequestFormResult.response = JSON.parse(dataReslut);
            EmerCaseId =  createEmergencyRequestFormResult.response.CaseId;
            console.log('any'+EmerCaseId);
            if ($("#CaseHaseFile").val() == "HasFile") {
                $(".k-upload-selected").click();
                return;
            }
            onSuccessUploadNewEmergencyCase(createEmergencyRequestFormResult);
        },
        error: function (xhr) {
            $("#createEmergencyRequestForm").hide();
            $("#requestMessage").show();
            $("#requestMessage").html("<span>Your Request Failed To Complete</span>");
        }
    });
});


function validateTab(tab) {
    var valid = true;
    $(tab).filter(':input:visible').each(function (index, elem) {
        var isElemValid = tab.validate().element(elem);
        if (isElemValid != null) { //this covers elements that have no validation rule
            valid = valid & isElemValid;
        }
    });
    return valid;
}

function onSuccessUploadNewEmergencyCase(e) {
    var dataReslut = e.response;
    if (dataReslut.success == true) {
        $("#createEmergencyRequestForm").hide();
        $("#requestMessage").show();
        $("#requestMessage").html(dataReslut.successMessage);
        $("#createEmergencyRequestForm")[0].reset();
        $("#CaseHaseFile").val("");
        sentNotificationToCommittee(dataReslut.NotificationSubject, dataReslut.NotificationBody, sessionStorage.getItem("Id"));
    }
    else {
        $("#createEmergencyRequestForm").hide();
        $("#requestMessage").html(dataReslut.ErrorMessage);
        $("#CaseHaseFile").val("");
    }
    $(".field-validation-error").html("");
}

$('#EmergencyServiceType').change(function (e) {
    var option = $('option:selected', this).attr('code');
    if (option == 'CoronaSus') {
        $('.coronaForm').show(1000);
        $('.emergencyForm').hide(1000);
    }
    else {
        $('.coronaForm').hide(1000);
        $('.emergencyForm').show(1000);
    }
});

$("#CoronaForm_UseOxygen").change(function (e) {
    var option = $(this).val();
    if (option == 'true') {
        $('.usOxygenContainer').show(1000);
    }
    else {
        $('.usOxygenContainer').hide(1000);
    }
});

$("#CoronaForm_PCRTest").change(function (e) {
    var option = $(this).val();
    if (option == 'true') {
        $('.PCRTestContainer').show(1000);
    }
    else {
        $('.PCRTestContainer').hide(1000);
    }
});

$('#CoronaForm_IsTheTempertureHigh').change(function (e) {
    var option = $(this).val();
    if (option == 'true') {
        $('.tempertureContainer').show(1000);
    }
    else {
        $('.tempertureContainer').hide(1000);
    }
});

$('#CoronaForm_HasChronicDiseases').change(function (e) {
    var option = $(this).val();
    if (option == 'true') {
        $('.chronicDiseasesNamesContainer').show(1000);
    }
    else {
        $('.chronicDiseasesNamesContainer').hide(1000);
    }
});

$('#CoronaForm_CaseLocationId').change(function (e) {
    var option = $('option:selected', this).attr('code');
    if (option == 'EmerHospital') {
        $('.hospitalLocationContainer').show(1000);
    }
    else {
        $('.hospitalLocationContainer').hide(1000);
    }
});


$(document).ready(function () {
    $("input[type='checkbox']").change(function () {
        var elementName = $(this).attr("name");
        $("[name='" + elementName + "']").val(this.checked);
    });
});




function onUploadEmergencyNewCase(e) {
    var createRequestForHelpForm = $("#createEmergencyRequestForm");
    if (!createRequestForHelpForm.valid()) {
        $("#CaseFile").data("kendoUpload").trigger("cancel");
        e.preventDefault();
        return;
    };
    var data = {};
    $("#createEmergencyRequestForm").serializeArray().map(function (x) { data[x.name] = x.value; });
    e.data = { CaseId: EmerCaseId };//data;
}

function onEmergencySelectCaseFile() {
    //   debugger;
    $("#CaseHaseFile").val("HasFile");
    setTimeout(function () { $(".k-upload-selected").hide(); }, 1);
}

///////////////

function checkIfServiceExsist(id,divId) {
    var servIds = $(divId).val();
    var servIdArray = servIds.split(",");
    if(servIdArray.indexOf(id) == -1) {
        return false;
    }
    else {
        return true;
    }
}

function changeService(id, divId, code) {
    if (divId == '#CoronaForm_SymptomsIDs') {
        if (code == 'EmerCoronaSymtomsOther') {
            if (checkIfServiceExsist(id, divId)) {
                $('#CoronaForm_AddSymptomOtherText_OtherText').val('');
                $('#CoronaForm_AddSymptomOtherText_Id').val('');
                $('.otherContainer').hide();
            } else {
                $('#CoronaForm_AddSymptomOtherText_Id').val(id);
                $('.otherContainer').show();
            }
        }
    }
    if (checkIfServiceExsist(id, divId)) {
        removeSerivceId(id, divId);
    }
    else {
        appendServiceId(id, divId);
    }
}

function removeSerivceId(serviceid, divId) {
    var servIds = $(divId).val();
    var servIdArray = servIds.split(",");
    servIdArray.deleteElem(serviceid)
    servIds = servIdArray.toString();
    $(divId).val(servIds);
}

function appendServiceId(serviceid, divId) {
    var servIds = $(divId).val();
    if (servIds != "") {
        servIds += ",";
    }
    servIds += serviceid;
    $(divId).val(servIds);
}
/////////////////


function getMasterCodeEmergencyCase() {
    $.ajax({
        type: "GET",
        contentType: "application/json",
        headers: getHeaders(),
        url: SystmeCodeWebAPIBaseUrl + "api/DetailCode/GetMasterCodeByMultiCode?masterCode=EmerCoronaSymptoms,EmerCoronaTests",
        async: true,
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (data) {
            $("#imgAjaxLoader").hide();
            $(".CoronaTestIdsDiv").html("");
            $(".SymptomsIDsDiv").html("");
            $.each(data, function (key, value) {
                if (value.masterCodeValue == "EmerCoronaSymptoms") {
                    let temp = '<div class="row"><div class="col-sm-12" style="text-align:center;">#ServiceName#<input  onclick="changeService(#ServiceId#,' + "'#CoronaForm_SymptomsIDs'" +',#ServiceCode#)"  type="checkbox"  ' + ' >  </div></div><br />';
                    let res = "";
                    if (_cultureIsArabic) {
                        res = temp.replace("#ServiceName#", value.NameAr).replace("#ServiceId#", "'" + value.Id + "'");
                    }
                    else {
                        res = temp.replace("#ServiceName#", value.NameEn).replace("#ServiceId#", "'" + value.Id + "'");
                    }
                    res = res.replace("#ServiceCode#", "'" + value.Code + "'");
                    $(".SymptomsIDsDiv").append(res);
                }
                else if (value.masterCodeValue == "EmerCoronaTests") {

                    let temp = '<div class="row"><div class="col-sm-12" style="text-align:center;"> #DiseaseName#<input  onclick="changeService(#DisesaseId#,'+"'#CoronaForm_CoronaTestIDs'"+')" type="checkbox" ' + '>  </div></div><br />';
                    let res = "";
                    if (_cultureIsArabic) {
                        res = temp.replace("#DiseaseName#", value.NameAr).replace("#DisesaseId#", "'" + value.Id + "'");
                    }
                    else {
                        res = temp.replace("#DiseaseName#", value.NameEn).replace("#DisesaseId#", "'" + value.Id + "'");
                    }
                    $(".CoronaTestIdsDiv").append(res);
                }
            });
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.error);
        }
    });
}

getMasterCodeEmergencyCase();


