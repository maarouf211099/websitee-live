
//submit mark investigation as Done
function MarkInvestigationDone() {
    if ($("#Recommendation").val() == "") {
        $("#ErrorRecommendationInvestigation").html(PleaseAddComment)
        return;
    }
    if ($("#Conclusions").val() == "") {
        $("#ErrorConclusionsInvestigation").html(PleaseAddComment)
        return;
    }
    var dataBody = {
        Recommendation: $("#Recommendation").val(),
        Conclusions: $("#Conclusions").val(),
        caseId: $("#CaseIdHID").val(),
        InvestigationDateS: $("#InvestigationDate").val(),
        resource: _culture
    }
    //var apiurl = MersalWebAPIBaseUrl + "api/Case/MarkInvestigationDone?caseId=" + $("#CaseIdHID").val() +
    //    "&Recommendation=" + $("#Recommendation").val() + "&Conclusions=" + $("#Conclusions").val() + "&resource=" + _culture;
    var apiurl = MersalWebAPIBaseUrl + "api/Case/MarkInvestigationDone";
    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: apiurl,
        crossDomain: true,
        headers: getHeaders(),
        async: false,
        data: JSON.stringify(dataBody),
        success: function (data) {
            toastr.success(data);
            sentNotificationToGroupFun(ConfirmInvestigateCaseSubject, ConfirmInvestigateCaseBody, sessionStorage.getItem("Id"), 13);
            sentNotificationToCaseCreator(ConfirmInvestigateCaseSubject, ConfirmInvestigateCaseBody, $("#CaseIdHID").val());
            //$('#DetailsCaseModals').modal('hide');
            //$("#grid").data('kendoGrid').dataSource.read();
            //$("#grid").data("kendoGrid").refresh();
            window.location.href = MersalUIBaseUrl + "/Case";
        },
        error: function (xhr) {
            toastr.error(xhr.error);
            //$('#DetailsCaseModals').modal('hide');
            //$("#grid").data('kendoGrid').dataSource.read();
            //$("#grid").data("kendoGrid").refresh(); 
        }
    });
}



function GetInvestigationResult(caseId) {
    $("#InvestigationResultDiv").html("");
    $.ajax({
        url: "/Case/GetInvestigationResult?caseId=" + caseId,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#InvestigationResultDiv").append(result);
            $('#InvestigationResultModals').modal('show');
            $("#imgAjaxLoader").hide();

            //GetAnyMasterDetalisCode("inTY", "InvestigationType", false);
            //AddInvestigationResult();
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}

function GetInvestigationResultForEdit(investigationId) {
    $("#InvestigatorCaseEditDiv").html("");
    $.ajax({
        url: "/Case/GetInvestigationResultForEdit?investigationId=" + investigationId,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#InvestigatorCaseEditDiv").append(result);
            $('#InvestigationResultEditModals').modal('show');
            $("#imgAjaxLoader").hide();
            SubmitInvestigationEdit();
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}

function SubmitInvestigationEdit() {
    var InvestigationResultEditModalsForm = $("#InvestigationResultEditModalsForm");
    InvestigationResultEditModalsForm.submit(function (e) {
        $.validator.unobtrusive.parse(InvestigationResultEditModalsForm)
        e.preventDefault();
        if (!InvestigationResultEditModalsForm.valid()) return;
        var apiurl = MersalWebAPIBaseUrl + "api/Case/UpdateInvestigationDone";
        var data = {};
        InvestigationResultEditModalsForm.serializeArray().map(function (x) { data[x.name] = x.value; });

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

                $("#imgAjaxLoader").hide();
                if (data > 0) {
                    toastr.success(data);
                }
                else {
                    toastr.error(Error);
                }
                $('#InvestigationResultEditModals').modal('hide');
                $('#InvestigationResultModals').modal('hide');
            },
            error: function (xhr) {
                $("#imgAjaxLoader").hide();
                $('#InvestigationResultEditModals').modal('hide');
                $('#InvestigationResultModals').modal('hide');
                toastr.error(xhr.error);
            }
        });
    });



}


function GetCaseComments(caseId) {
    $("#CaseCommentDiv").html("");
    $.ajax({
        url: "/Case/GetCaseComments?caseId=" + caseId,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#CaseCommentDiv").append(result);
            $('#CaseCommentModals').modal('show');
            AddCommentToCase();
            //AddInvestigationResult();
            $("#imgAjaxLoader").hide();
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}
// Get Case Call Result
function GetCaseCallResult(caseId) {
    $("#CaseCallResultDiv").html("");
    $.ajax({
        url: "/Case/GetCaseCallResult?caseId=" + caseId,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#CaseCallResultDiv").append(result);
            $('#CaseCallResultModals').modal('show');
            AddCallResultToCase();
            $("#imgAjaxLoader").hide();
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}


//Get Medical Comments
function GetMedicalComments(caseId) {
    $("#MedicalCommentDiv").html("");
    $.ajax({
        url: "/Case/GetMedicalComments?caseId=" + caseId,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#imgAjaxLoader").hide();
            $("#MedicalCommentDiv").append(result);
            $('#MedicalCommentModals').modal('show');
            AddMedicalCommentToCase();
            //AddInvestigationResult();
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}

//submit add Medical Comment

function AddMedicalCommentToCase() {
    var AddMedicalCommentForm = $("#AddMedicalCommentForm");
    AddMedicalCommentForm.submit(function (e) {
        $.validator.unobtrusive.parse(AddMedicalCommentForm)
        e.preventDefault();
        if (!AddMedicalCommentForm.valid()) return;
        var apiurl = MersalWebAPIBaseUrl + "api/Case/AddMedicalCommentToCase";
        var data = {};
        $("#AddMedicalCommentForm").serializeArray().map(function (x) { data[x.name] = x.value; });
        // console.log(JSON.stringify(data));
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
                $('#MedicalCommentModals').modal('hide');
                $("#imgAjaxLoader").hide();
                if (data > 0) {
                    toastr.success(SuccessfullyAdd);
                    sentNotificationToGroupFun(AddMedicalCommentCaseSubject, AddMedicalCommentCaseBody, sessionStorage.getItem("Id"), 13);
                }
                else {
                    toastr.error(Error);
                }
            },
            error: function (xhr) {
                $("#imgAjaxLoader").hide();
                $('#MedicalCommentModals').modal('hide');
                toastr.error(xhr.error);
            }
        });
    });
}

//submit add Comment
function AddCommentToCase() {
    var AddCaseCommentForm = $("#AddCaseCommentForm");
    AddCaseCommentForm.submit(function (e) {
        $.validator.unobtrusive.parse(AddCaseCommentForm)
        e.preventDefault();
        if (!AddCaseCommentForm.valid()) return;
        var apiurl = MersalWebAPIBaseUrl + "api/Case/AddCommentToCase";
        var data = {};
        $("#AddCaseCommentForm").serializeArray().map(function (x) { data[x.name] = x.value; });
        // console.log(JSON.stringify(data));
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
                $("#imgAjaxLoader").hide();
                $('#CaseCommentModals').modal('hide');
                if (data > 0) {
                    toastr.success(SuccessfullyAdd);
                    sentNotificationToGroupFun(AddCommentCaseSubject, AddCommentCaseBody, sessionStorage.getItem("Id"), 13);
                    SendNotificationsFacebook(AddCommentCaseSubject);
                }
                else {
                    $("#imgAjaxLoader").hide();
                    toastr.error(Error);
                }
            },
            error: function (xhr) {
                $("#imgAjaxLoader").hide();
                $('#CaseCommentModals').modal('hide');
                toastr.error(xhr.error);
            }
        });
    });
}



//submit add Call Result
function AddCallResultToCase() {
    var AddCaseCallResultForm = $("#AddCaseCallResultForm");
    AddCaseCallResultForm.submit(function (e) {
        $.validator.unobtrusive.parse(AddCaseCallResultForm)
        e.preventDefault();
        if (!AddCaseCallResultForm.valid()) return;
        var apiurl = MersalWebAPIBaseUrl + "api/Case/AddCallResultToCase";
        var data = {};
        $("#AddCaseCallResultForm").serializeArray().map(function (x) { data[x.name] = x.value; });
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
                $("#imgAjaxLoader").hide();
                $('#CaseCallResultModals').modal('hide');
                if (data == true) {
                    toastr.success(SuccessfullyAdd);
                }
                else {
                    $("#imgAjaxLoader").hide();
                    toastr.error(Error);
                }
            },
            error: function (xhr) {
                $("#imgAjaxLoader").hide();
                $('#CaseCallResultModals').modal('hide');
                toastr.error(xhr.error);
            }
        });
    });
}

function GetCaseAttachment(caseId) {
    $("#CaseCommentDiv").html("");
    $.ajax({
        url: "/Case/GetCaseAttachment?caseId=" + caseId,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#CaseCommentDiv").append(result);
            $('#CaseAttachmentModals').modal('show');
            $("#imgAjaxLoader").hide();

            //getUploadFileFunction(); 
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}

function DeleteCaseAttachment(attachmentId) {
    let deleteApiurl = MersalWebAPIBaseUrl + "api/Case/DeleteCaseAttachment?attachmentId=" + attachmentId;

    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: deleteApiurl,
        crossDomain: true,
        headers: getHeaders(),
        success: function (result) {
            toastr.success("Successfully");
            $("#" + attachmentId).remove();
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });
}

function addExtensionClass(extension) {
    switch (extension) {
        case '.jpg':
        case '.img':
        case '.png':
        case '.gif':
            return "img-file";
        case '.doc':
        case '.docx':
            return "doc-file";
        case '.xls':
        case '.xlsx':
            return "xls-file";
        case '.pdf':
            return "pdf-file";
        case '.zip':
        case '.rar':
            return "zip-file";
        default:
            return "default-file";
    }
}


function DownloadFile(caseId, FileName) {
    var apiurl = MersalWebAPIBaseUrl + "api/Case/DownloadCaseFile?caseId=" + caseId + "&FileName=" + FileName;
    $.ajax({
        type: "GET",
        // contentType: "application/octet-stream; charset=utf-8",
        url: apiurl,
        crossDomain: true,
        headers: getHeaders(),
        async: true,
        success: function (response) {
            toastr.error(response.status);
            // window.open(data);
            //$('#AddCaseModals').modal('hide');

            //$("#grid").data('kendoGrid').dataSource.read();
            //$("#grid").data("kendoGrid").refresh();
            //if (data > 0) {
            //   toastr.success(SuccessfullyAdd + " - " + data);
            //}
            //else {
            //    toastr.error(Error);
            //} 
        },
        error: function (xhr) {
            //    $('#AddCaseModals').modal('hide');
            toastr.error(xhr.error);
        }
    });
}


//submit add Result
function AddInvestigationResult() {
    var myForm = $("#InvestigationResultForm");
    myForm.submit(function (e) {
        $.validator.unobtrusive.parse(myForm)
        e.preventDefault();
        if (!myForm.valid()) return;
        var apiurl = MersalWebAPIBaseUrl + "api/Case/AddInvestigationResult";
        var data = {};
        $("#InvestigationResultForm").serializeArray().map(function (x) { data[x.name] = x.value; });
        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: apiurl,
            crossDomain: true,
            headers: getHeaders(),
            data: JSON.stringify(data),
            async: true,
            success: function (data) {
                //$('#AddCaseModals').modal('hide');

                //$("#grid").data('kendoGrid').dataSource.read();
                //$("#grid").data("kendoGrid").refresh();
                //if (data > 0) {
                //    toastr.success(SuccessfullyAdd + " - " + data);
                //}
                //else {
                //    toastr.error(Error);
                //} 
                toastr.error("Successfully" + data);
            },
            error: function (xhr) {
                //    $('#AddCaseModals').modal('hide');
                //  toastr.error(xhr.error);
                toastr.error(xhr.statusText);
            }
        });
    });
}

function GetEditCaseVisiteFull(caseId, visitId) {

    $("#EditCaseVisiteFullDiv").html("");
    $.ajax({
        url: "/Case/GetEditCaseFullVisite?caseId=" + caseId + "&visitId=" + visitId,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#imgAjaxLoader").hide();
            $("#EditCaseVisiteFullDiv").append(result);
            $('#CaseVisitResultModals').modal('show');
            $("#VisitDateString").kendoDatePicker({
                max: new Date(),
                format: "d/M/yyyy",
            }).attr("readonly", "readonly");

            $("#FamilyMemberId").prop("disabled", true);
            var selectedValue = $('#FamilyMemberIdValueId').val();
            GetCaseFamilyMembers(caseId, selectedValue);
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            confirmMessageBootstrap("", "لا يوجد حالة بهذا الكود او الحالة مغلقة", 400, 250);
            $("#btnsubmitConfirmationDialog").hide();
        }
    });
}

function DeleteCaseVisit(visitId) {
    let deleteApiurl = MersalWebAPIBaseUrl + "api/Case/DeleteCaseVisit?visitId=" + visitId;

    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: deleteApiurl,
        crossDomain: true,
        headers: getHeaders(),
        success: function (result) {
            toastr.success("Successfully");
            $("#" + visitId).remove();
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });
}
