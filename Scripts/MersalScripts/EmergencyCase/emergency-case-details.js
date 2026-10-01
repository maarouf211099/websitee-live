$(document).ready(function () {
    $(".dates").kendoDatePicker({
        max: new Date(),
        format: "d/M/yyyy",
    });

    $(".AccordionDiv").accordion({
        collapsible: true,
        header: ".headOfAccordion",
        heightStyle: "content",
        active: 1,
    });


    $(".AccordionDiv").on("accordionactivate", function (event, ui) {
        try {
            $("#scheduler").data("kendoScheduler").refresh();
        } catch (e) {

        }
    });
    $("input[type='checkbox']").each(function (key, value) {
        var elementName = $(this).attr("name");
        $("input[type='hidden'][name='" + elementName + "']").remove();
    });
});

function getMasterCodeEditCase() {
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: SystmeCodeWebAPIBaseUrl + "api/DetailCode/GetMasterCodeByMultiCode?masterCode=EmerNeed,EmerCanDrin,EmerCurrentLocation,EmerIfCaseInHospital,EmerCoronaTests,EmerCoronaSymptoms",
        async: true,
        headers: getHeaders(),
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (data) {
            $("#imgAjaxLoader").hide();
            let htmlNeed = "<option></option>";
            let htmlCanDrinkAndEat = "<option></option>";
            let htmlCurrentLocation = "<option></option>";
            let htmlIfCaseInHospital = "<option></option>";
            $.each(data, function (key, value) {
                var selec = "";
                if (value.masterCodeValue == "EmerNeed") {
                    if ($("#coronaNeedId").val() == value.Id) selec = " selected='selected' ";
                    if (_cultureIsArabic) {
                        htmlNeed += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
                    }
                    else {
                        htmlNeed += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
                    }
                }
                else if (value.masterCodeValue == "EmerCanDrin") {
                    if ($("#coronaCanEatAndDrinkId").val() == value.Id) selec = " selected='selected' ";
                    if (_cultureIsArabic) {
                        htmlCanDrinkAndEat += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
                    }
                    else {
                        htmlCanDrinkAndEat += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
                    }
                }
                else if (value.masterCodeValue == "EmerCurrentLocation") {
                    if ($("#coronaCaseLocationId").val() == value.Id) selec = " selected='selected' ";
                    if (_cultureIsArabic) {
                        htmlCurrentLocation += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
                    }
                    else {
                        htmlCurrentLocation += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
                    }
                }
                else if (value.masterCodeValue == "EmerIfCaseInHospital") {
                    if ($("#coronaHospitalLocationId").val() == value.Id) selec = " selected='selected' ";
                    if (_cultureIsArabic) {
                        htmlIfCaseInHospital += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
                    }
                    else {
                        htmlIfCaseInHospital += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
                    }
                }
                else if (value.masterCodeValue == "EmerCoronaTests") {
                    let chck = ""
                    if (checkIfServiceExsist(value.Id.toString(), '#CoronaForm_CoronaTestIDs')) {
                        chck = "checked";
                    }
                    let temp = '<input  onclick="changeService(#DisesaseId#,' + "'#CoronaForm_CoronaTestIDs'" + ')" type="checkbox" ' + chck + '> #DiseaseName# <br/>';
                    let res = "";
                    if (_cultureIsArabic) {
                        res = temp.replace("#DiseaseName#", value.NameAr).replace("#DisesaseId#", "'" + value.Id + "'");
                    }
                    else {
                        res = temp.replace("#DiseaseName#", value.NameEn).replace("#DisesaseId#", "'" + value.Id + "'");
                    }
                    $(".CoronaTestIdsDiv").append(res);
                }
                else if (value.masterCodeValue == "EmerCoronaSymptoms") {
                    let chck = ""
                    if (checkIfServiceExsist(value.Id.toString(), '#CoronaForm_SymptomsIDs')) {
                        chck = "checked";
                    }
                    let temp = '<input  onclick="changeService(#DisesaseId#,' + "'#CoronaForm_SymptomsIDs'" + ',#ServiceCode#)" type="checkbox" ' + chck + '> #DiseaseName# <br/>';
                    let res = "";
                    if (_cultureIsArabic) {
                        res = temp.replace("#DiseaseName#", value.NameAr).replace("#DisesaseId#", "'" + value.Id + "'");
                    }
                    else {
                        res = temp.replace("#DiseaseName#", value.NameEn).replace("#DisesaseId#", "'" + value.Id + "'");
                    }
                    res = res.replace("#ServiceCode#", "'" + value.Code + "'");
                    $(".SymptomsIDsDiv").append(res);
                }
            });
            $("#CoronaForm_NeedId").html(htmlNeed);
            $("#CoronaForm_CanEatAndDrink").html(htmlCanDrinkAndEat);
            $('#CoronaForm_CaseLocationId').html(htmlCurrentLocation);
            $('#CoronaForm_HospitalLocationId').html(htmlIfCaseInHospital);
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.error);
        }
    });
}
getMasterCodeEditCase();
////////////////

function onSuccessUploadNewEmergencyCase(e) {
    //var dataReslut = e.response;
    //if (dataReslut.success == true) {
    //    createEmergencyRequestForm.hide();
    //    $("#requestMessage").show();
    //    $("#requestMessage").html(dataReslut.successMessage);
    //    createEmergencyRequestForm[0].reset();
    //    $("#CaseHaseFile").val("");
    //    sentNotificationToCommittee(dataReslut.NotificationSubject, dataReslut.NotificationBody, sessionStorage.getItem("Id"));
    //}
    //else {
    //    createEmergencyRequestForm.hide();
    //    $("#requestMessage").html(dataReslut.ErrorMessage);
    //    $("#CaseHaseFile").val("");
    //}
     ;
    toastr.success(SuccessfullyAdd);
    $(".field-validation-error").html("");
    window.location.href = "/EmergencyCase/index?state=" + CaseState;
}


function onUploadEmergencyNewCase(e) {
    var createRequestForHelpForm = $("#EditEmergencyCaseForm");
    if (!createRequestForHelpForm.valid()) {
        $("#CaseFile").data("kendoUpload").trigger("cancel");
        e.preventDefault();
        return;
    };
    var data = {};
    $("#EditEmergencyCaseForm").serializeArray().map(function (x) { data[x.name] = x.value; });
    e.data = { CaseId: $('#CaseIdHID').val() };//data;
}

function onEmergencySelectCaseFile() {
    $("#CaseHaseFile").val("HasFile");
    setTimeout(function () { $(".k-upload-selected").hide(); }, 1);
}

///////////////

//submit
var createEmergencyRequestFormResult = {};
createEmergencyRequestFormResult.response = "";
var createEmergencyRequestForm = $("#EditEmergencyCaseForm");
var EmerCaseId = 0;
createEmergencyRequestForm.submit(function (e) {
    e.preventDefault();
    $('#Mobile').val($('#PhoneNumberAnonymous').val());
    $('#StatusInEgyptIdError').remove();
    $('.divStatus').html('');

    if (!createEmergencyRequestForm.valid()) {
        //if (isAuthenticatedUser == "False" && $("#CaseHaseFile").val() != "HasFile") {
        //    $('.divStatus').append('<span class="field-validation-error" id="StatusInEgyptIdError" data-valmsg-replace="true"><span for="StatusInEgyptId" class="">مرفقات المسحه والتحاليل مطلوبه</span></span>');
        //}
        return;
    }


    //if (isAuthenticatedUser == "False" && $("#CaseHaseFile").val() != "HasFile") {
    //    $('.divStatus').append('<span class="field-validation-error" id="StatusInEgyptIdError" data-valmsg-replace="true"><span for="StatusInEgyptId" class="">مرفقات المسحه والتحاليل مطلوبه</span></span>');
    //    return;
    //}


    let emergencyApiurl = MersalWebAPIBaseUrl + "api/EmergencyCase/EditEmergencyCaseDetails";
    let emergencyData = {};

    emergencyData['CoronaForm'] = {}
    createEmergencyRequestForm.serializeArray().map(function (x) { emergencyData[x.name] = x.value; });

    emergencyData['PhoneNumberAnonymous'] = $('#PhoneNumberAnonymous').val();
    emergencyData['NameAnonymous'] = $('#NameAnonymous').val();
    emergencyData['Mobile'] = emergencyData['PhoneNumberAnonymous'];
    let forms = emergencyData['CoronaForm'];
    let formKey;
    $.each(emergencyData, function (key, value) {
        if (key.startsWith('CoronaForm.')) {
            formKey = key.split('.');
            forms[formKey[1]] = value;
        }
    });
    if (emergencyData.CoronaForm) {
        emergencyData.CoronaForm.AddSymptomOtherText = {
            OtherText: $('#CoronaForm_AddSymptomOtherText_OtherText').val(),
            Id: $('#CoronaForm_AddSymptomOtherText_Id').val()
        }
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

///////////////////
function AddNotes(caseId, isAccepted) {
    let addNoteApiurl = MersalWebAPIBaseUrl + "api/EmergencyCase/AddMedicalCoordinatorNote";

    let note;
    if (isAccepted)
        note = $('#AcceptanceNote').val();
    else
        note = $('#RejectionNote').val();

    let emergencyData = { CaseId: caseId, Note: note, IsAccepted: isAccepted };

    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: addNoteApiurl,
        crossDomain: true,
        headers: getHeaders(),
        data: JSON.stringify(emergencyData),
        async: false,
        success: function (dataReslut) {
            $('#MedicalCoordinatorApprovalBox').modal('hide');
            $('#MedicalCoordinatorRejectionBox').modal('hide');
            toastr.success(SuccessfullyAdd);
            window.location.href = "/EmergencyCase/index?state=" + CaseState;
        },
        error: function (xhr) {
            $('#MedicalCoordinatorApprovalBox').modal('hide');
            $('#MedicalCoordinatorRejectionBox').modal('hide');
            toastr.error('Error!');
        }
    });
}

///////////////
function checkIfServiceExsist(id, divId) {
    var servIds = $(divId).val();
    var servIdArray = servIds.split(",");
    if (servIdArray.indexOf(id) == -1) {
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


function OpenConfirmationPopup(isAcctept) {
    if (isAcctept)
        $('#MedicalCoordinatorApprovalBox').modal('show')
    else
        $('#MedicalCoordinatorRejectionBox').modal('show')
}


//$('#ChangeCaseState').change(function () {
//    let id = $('#ChangeCaseState').val();
//    if (id == emcNeedIsolation) {
//        $('#ChangeCaseStateSub').show();
//    } else {
//        $('#ChangeCaseStateSub').val('');
//        $('#ChangeCaseStateSub').hide();
//    }
//});

function OpenChangeEmergencyCaseStatePopup(modelName) {
    $('#' + modelName).modal('show');
}

$('#ChangeEmergencyCaseStateForm').submit(function (e) {
    e.preventDefault();
    let emergencyApiurl = MersalWebAPIBaseUrl + "api/EmergencyCase/AddCaseComment";
    let emergencyData = {};

    $('#ChangeEmergencyCaseStateForm').serializeArray().map(function (x) { emergencyData[x.name] = x.value; });

    emergencyData['StateId'] = emergencyData['ChangeCaseState'];
    emergencyData['Note'] = emergencyData['Notes'];
    emergencyData['CaseId'] = $('#EmergencyCaseId').val();

    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: emergencyApiurl,
        crossDomain: true,
        headers: getHeaders(),
        data: JSON.stringify(emergencyData),
        async: false,
        success: function (dataReslut) {
            toastr.success(SuccessfullyAdd);
            window.location.href = "/EmergencyCase/index?state=" + CaseState;
        },
        error: function (xhr) {
            toastr.error(xhr)
        }
    });
});

$('#ChangeEmergencyCaseStateByEmergencyDoctorForm').submit(function (e) {
    e.preventDefault();
    let emergencyApiurl = MersalWebAPIBaseUrl + "api/EmergencyCase/AddCaseComment";
    let emergencyData = {};

    $('#ChangeEmergencyCaseStateByEmergencyDoctorForm').serializeArray().map(function (x) { emergencyData[x.name] = x.value; });

    emergencyData['StateId'] = emergencyData['ChangeCaseStateByEmergencyDoctor'];
    emergencyData['Note'] = emergencyData['Notes'];
    emergencyData['CaseId'] = $('#EmergencyCaseId').val();

    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: emergencyApiurl,
        crossDomain: true,
        headers: getHeaders(),
        data: JSON.stringify(emergencyData),
        async: false,
        success: function (dataReslut) {
            toastr.success(SuccessfullyAdd);
            window.location.href = "/EmergencyCase/index?state=" + CaseState;
        },
        error: function (xhr) {
            toastr.error(xhr)
        }
    });
});

$('#ChangeEmergencyCaseStateToDoneForm').submit(function (e) {
    e.preventDefault();
    let emergencyApiurl = MersalWebAPIBaseUrl + "api/EmergencyCase/DoneEmergencyCase";
    let emergencyData = {};

    $('#ChangeEmergencyCaseStateToDoneForm').serializeArray().map(function (x) { emergencyData[x.name] = x.value; });
    emergencyData['CaseId'] = $('#EmergencyCaseId').val();

    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: emergencyApiurl,
        crossDomain: true,
        headers: getHeaders(),
        data: JSON.stringify(emergencyData),
        async: false,
        success: function (dataReslut) {
            toastr.success(SuccessfullyAdd);
            window.location.href = "/EmergencyCase/index?state=" + CaseState;
        },
        error: function (xhr) {
            toastr.error(xhr);
        }
    });
});




function DoneFollowUp() {
    let emergencyApiurl = MersalWebAPIBaseUrl + "api/EmergencyCase/FollowUpEmergencyCase";
    let emergencyData = {};
    emergencyData.CaseId = $('#EmergencyCaseId').val();

    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: emergencyApiurl + "?CaseId=" + $('#EmergencyCaseId').val(),
        crossDomain: true,
        headers: getHeaders(),
        async: false,
        success: function (dataReslut) {
            toastr.success(SuccessfullyAdd);
            window.location.href = "/EmergencyCase/FollowUp"
        },
        error: function (xhr) {
            toastr.error(xhr);
        }
    });
}
