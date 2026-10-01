
var selectedInvestegator;
function SetInvestegatorData(e) {
    try {
        var object = this.dataItem(this.select());
        $("#CaseInvestigtor_InvestigtorId").val(object.Value);
        $("#CaseInvestigtor_InvestigtorEmail").val(object.Email);
        selectedInvestegator = object.Text;
    } catch (ex) {

    }
}
function submitAssginCaseToInvestigetor() {

    if ($("#CaseInvestigtor_InvestigtorId").val() == 0) return;
    var apiurl = MersalWebAPIBaseUrl + "api/Case/AssginInvestigetorToCase";
    var data = {};
    $("#frmAssginCaseToInvestigetor").serializeArray().map(function (x) { data[x.name] = x.value; });
    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: apiurl,
        crossDomain: true,
        headers: getHeaders(),
        data: JSON.stringify(data),
        async: false,
        success: function (data) {
            if (data > 0) {
                toastr.success(SuccessfullyAssginCaseToInvestigetor);
                sentNotificationToGroupFun(AssignCaseToInvestigatorSubject, AssignCaseToInvestigatorBody, sessionStorage.getItem("Id"), 13);
                var NotificationData =
                    {
                        ItemType: 1,
                        NotificationSubject: "New case",
                        NotificationBody: "you have been assgined to new case",
                        Recipients: $("#CaseInvestigtor_InvestigtorEmail").val(),
                        NotificationType: 7,
                        NotificationPriority: 4,
                        CreatedOn: new Date(),//myDateNow,
                        usersId: $("#CaseInvestigtor_InvestigtorId").val(),
                        CC: $("#CaseInvestigtor_InvestigtorEmail").val(),
                    };
                sentNotification(NotificationData);

            }
            else {
                toastr.error(Error);

            }
            $('#AssginCaseToInvestigatorModals').modal('hide');


        },
        error: function (xhr) {
            toastr.error(xhr.error);

            $('#AssginCaseToInvestigatorModals').modal('hide');
        }
    });

}


function confirmAssignCaseToInvestigetor() {
    var myForm = $("#frmAssginCaseToInvestigetor");
    myForm.submit(function (e) {
        e.stopImmediatePropagation();
        $.validator.unobtrusive.parse(myForm);
        e.preventDefault();
        if ($("#CaseInvestigtor_InvestigtorId").val() == 0) return;
        var body = AssignToInvestigatorBody.replace("{{Investigator}}", selectedInvestegator);
        confirmMessageBootstrap(AssignToInvestigatorMsg, body, 420, 300, submitAssginCaseToInvestigetor);
    });
}

function getCaseInvestigetor(CaseId, isExptionInvestigation) {
    $("#InvestigatorCaseDiv").html("");
    $.ajax({
        url: "/Case/CaseInvestigator?caseId=" + CaseId,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#InvestigatorCaseDiv").append(result);
            $('#AssginCaseToInvestigatorModals').modal('show');
            $("#isExptionInvestigation").val(isExptionInvestigation);
            // submitAssginCaseToInvestigetor();
            confirmAssignCaseToInvestigetor();
            $("#imgAjaxLoader").hide();
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}


function validatieAssignCaseToEmployee() {
    var myForm = $("#frmAssginCaseToEmployee");
    myForm.submit(function (e) {
        e.stopImmediatePropagation();
        $.validator.unobtrusive.parse(myForm);
        e.preventDefault();
        if ($("#EmployeeId").val() == 0) return;
        var apiurl = MersalWebAPIBaseUrl + "api/Case/AssginEmployeeToCase";
        var data = {};
        $("#frmAssginCaseToEmployee").serializeArray().map(function (x) { data[x.name] = x.value; });
        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: apiurl,
            crossDomain: true,
            headers: getHeaders(),
            data: JSON.stringify(data),
            async: false,
            success: function (data) {
                toastr.success(SuccessfulProcess);
                $('#AssginCaseToEmployeeModals').modal('hide');
            },
            error: function (xhr) {
                toastr.error(xhr.error);
                $('#AssginCaseToEmployeeModals').modal('hide');
            }
        });

    });
}

function DeleteEmployeeAssign(id) {
    var apiurl = MersalWebAPIBaseUrl + "api/Case/DeleteCaseAssignFromEmployee?Id=" + id;

    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: apiurl,
        crossDomain: true,
        headers: getHeaders(),
        async: false,
        success: function (data) {
            toastr.success(SuccessfulProcess);
            $('#' + id).find('td:eq(1)').text("تم");
            $('#' + id).find('td:eq(2)').html("");

        },
        error: function (xhr) {
            toastr.error(xhr.error);
        }
    });
    
}

function submitAssginCaseToEmployee() {
    var myForm = $("#frmAssginCaseToEmployee");
    myForm.submit(function (e) {
        e.stopImmediatePropagation();
        $.validator.unobtrusive.parse(myForm);
        e.preventDefault();
        if ($("#EmployeeId").val() == 0) return;
        var apiurl = MersalWebAPIBaseUrl + "api/Case/AssginEmployeeToCase";
        var data = {};
        $("#frmAssginCaseToEmployee").serializeArray().map(function (x) { data[x.name] = x.value; });
        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: apiurl,
            crossDomain: true,
            headers: getHeaders(),
            data: JSON.stringify(data),
            async: false,
            success: function (e) {
                if (e != 0) {
                    toastr.success(SuccessfulProcess);
                    $('#Userstable').append(
                        "<tr id=" + e + ">"
                        + "<td>" + data.SearchForEmployee2_input + "</td>"
                        + "<td>" + "المسئول الان" + "</td>"
                        + "<td>" + ' <i class="fa fa-trash" style="cursor:pointer" onclick="DeleteEmployeeAssign('+e+')"></i>' + "</td>"
                        +" </tr > "
                    );
                }
                else {
                    toastr.error("لم يتم الحفظ");
                }

                //$('#AssginCaseToEmployeeModals').modal('hide');
            },
            error: function (xhr) {
                toastr.error(xhr.error);
                //$('#AssginCaseToEmployeeModals').modal('hide');
            }
        });

    });
}

function getCaseEmployee(CaseId) {
    $("#EmployeeCaseDiv").html("");
    $.ajax({
        url: "/Case/CaseEmployee?caseId=" + CaseId,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#EmployeeCaseDiv").append(result);
            $('#AssginCaseToEmployeeModals').modal('show');
            submitAssginCaseToEmployee();
            $("#imgAjaxLoader").hide();
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}


function getCaseDoctor(CaseId) {
    $("#DoctorCaseDiv").html("");
    $.ajax({
        url: "/Case/GetCaseDoctorById?caseId=" + CaseId,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#imgAjaxLoader").hide();
            $("#DoctorCaseDiv").append(result);
            $('#AssginCaseToDoctorModals').modal('show');
            //$("#isExptionInvestigation").val(isExptionInvestigation);
            submitAssginCaseToDoctor();
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}


function submitAssginCaseToDoctor() {
    var AssginCaseToDoctorForm = $("#AssginCaseToDoctorForm");
    AssginCaseToDoctorForm.submit(function (e) {
        $('#Doctormsg').modal('hide');
        //e.stopImmediatePropagation();
        // $.validator.unobtrusive.parse(AssginCaseToDoctorForm);
        var userval = $("#SearchForDoctor").val();
        if (userval == '') {
            $('#Doctormsg').modal('show');
            e.preventDefault();
            return;
        }
        e.preventDefault();
        if ($("#CaseDoctor_DoctorId").val() == 0) return;
        var apiurl = MersalWebAPIBaseUrl + "api/Case/AssignDoctorToCase";
        var data = {};
        $("#AssginCaseToDoctorForm").serializeArray().map(function (x) { data[x.name] = x.value; });
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
                $('#AssginCaseToDoctorModals').modal('hide');
                toastr.success(SuccessfulProcess);
                sentNotificationToGroupFun(AssignCaseToDoctorSubject, AssignCaseToDoctorBody, sessionStorage.getItem("Id"), 13);
                if (data > 0) {
                    //toastr.success(SuccessfullyAssginDoctorToCase);
                    var NotificationData =
                        {
                            ItemType: 1,
                            NotificationSubject: "New case",
                            NotificationBody: "you have been assgined to new case",
                            Recipients: $("#CaseDoctor_DoctorEmail").val(),
                            NotificationType: 7,
                            NotificationPriority: 4,
                            CreatedOn: new Date(),//myDateNow,
                            usersId: $("#CaseDoctor_DoctorId").val(),
                            CC: $("#CaseDoctor_DoctorEmail").val(),
                        };
                    sentNotification(NotificationData);

                }
                else {
                    $("#imgAjaxLoader").hide();
                    toastr.error(Error);
                }


            },
            error: function (xhr) {
                toastr.error(xhr.error);
                $('#AssginCaseToDoctorModals').modal('hide');
            }
        });

    });
}

function SetDoctorData(e) {
    try {
        var object = this.dataItem(this.select());
        $("#CaseDoctor_DoctorId").val(object.Value);
        $("#CaseDoctor_DoctorEmail").val(object.Email);
    } catch (ex) {

    }
}

function getMasterCodeEditCase() {
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: SystmeCodeWebAPIBaseUrl + "api/DetailCode/GetMasterCodeByMultiCode?masterCode=CasC,CasP,Coun,cSrv,cDis,SSTa,FrnQ,HouS,NAT,RLG,STINEGY,GEND",
        async: true,
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (data) {
            $("#imgAjaxLoader").hide();
            var htmlCategory = "<option></option>";
            var htmlCountry = "";
            var htmlPriority = "";
            var htmlService = "";
            var htmlDisease = "";
            var htmlSocialStatus = "";
            var htmlnationality = "";
            var htmlFurniture = "";
            var htmlHomeType = "";
            var htmlReligions = "<option></option>";
            var htmlStatusInEgypt = "<option></option>";
            var htmlGender = "<option></option>";
            $(".caseServiceDiv").html("");
            $(".caseDiseaseDiv").html("");
            var perantId = $("#caseCategoryHID").val();
            $.each(data, function (key, value) {
                var selec = "";
                if (value.masterCodeValue == "CasC") {
                    if ($("#caseCategoryHID").val() == value.Id) selec = " selected='selected' ";
                    if (_cultureIsArabic) {
                        htmlCategory += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
                    }
                    else {
                        htmlCategory += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
                    }
                }
                else if (value.masterCodeValue == "CasP") {
                    if ($("#casePriorityHID").val() == value.Id) selec = " selected='selected' ";
                    if (_cultureIsArabic) {
                        htmlPriority += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
                    }
                    else {
                        htmlPriority += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
                    }
                }
                else if (value.masterCodeValue == "Coun") {
                    if ($("#caseCountryHID").val() == value.Id) {
                        selec = " selected='selected' ";
                        //select Governrate
                        getGovernrateEditCase(value.Id, "GovernorateAdminEditCase");
                    };
                    if (_cultureIsArabic) {
                        htmlCountry += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
                    }
                    else {
                        htmlCountry += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
                    }
                }
                else if (value.masterCodeValue == "SSTa") {
                    if ($("#socialStatusHID").val() == value.Id) {
                        selec = " selected='selected' ";
                    };
                    if (_cultureIsArabic) {
                        htmlSocialStatus += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
                    }
                    else {
                        htmlSocialStatus += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
                    }
                }
                else if (value.masterCodeValue == "RLG") {
                    if ($("#religionHID").val() == value.Id) {
                        selec = " selected='selected' ";
                    };
                    if (_cultureIsArabic) {
                        htmlReligions += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
                    }
                    else {
                        htmlReligions += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
                    }
                }
                else if (value.masterCodeValue == "STINEGY") {
                    if ($("#statusInEgyptHID").val() == value.Id) {
                        selec = " selected='selected' ";
                    };
                    if (_cultureIsArabic) {
                        htmlStatusInEgypt += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
                    }
                    else {
                        htmlStatusInEgypt += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
                    }
                }
                else if (value.masterCodeValue == "GEND") {
                    if ($("#GenderHID").val() == value.Id) {
                        selec = " selected='selected' ";
                    };
                    if (_cultureIsArabic) {
                        htmlGender += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
                    }
                    else {
                        htmlGender += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
                    }
                }
                else if (value.masterCodeValue == "NAT") {
                    if ($("#nationalityHID").val() == value.Id) {
                        selec = " selected='selected' ";
                    };
                    if (_cultureIsArabic) {
                        htmlnationality += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
                    }
                    else {
                        htmlnationality += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
                    }
                }
                else if (value.masterCodeValue == "FrnQ") {
                    if ($("#caseFurnitureHID").val() == value.Id) {
                        selec = " selected='selected' ";
                    };
                    if (_cultureIsArabic) {
                        htmlFurniture += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
                    }
                    else {
                        htmlFurniture += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
                    }
                }
                else if (value.masterCodeValue == "HouS") {
                    if ($("#caseHomeTypeHID").val() == value.Id) {
                        selec = " selected='selected' ";
                    };
                    if (_cultureIsArabic) {
                        htmlHomeType += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
                    }
                    else {
                        htmlHomeType += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
                    }
                }
                else if (value.masterCodeValue == "cSrv") {
                    if (value.Parent) {
                        //if (perantId == value.Parent.Id) {
                            var chck = ""
                            if (checkIfServiceExsist(value.Id.toString())) {
                                chck = "checked";
                            }
                            var temp = '<div class="col-sm-3"><input  onclick="changeService(#ServiceId#)"  type="checkbox"  ' + chck + ' > #ServiceName# </div>';
                            var res = "";
                            if (_cultureIsArabic) {
                                res = temp.replace("#ServiceName#", value.NameAr).replace("#ServiceId#", "'" + value.Id + "'");
                            }
                            else {
                                res = temp.replace("#ServiceName#", value.NameEn).replace("#ServiceId#", "'" + value.Id + "'");
                        }
                            $(".caseServiceDiv").append(res);
                        //}
                    }
                }
                else if (value.masterCodeValue == "cDis") {
                    if (value.Parent) {
                        //if (perantId == value.Parent.Id) {
                            var chck = ""
                            if (checkIfServiceExsist(value.Id.toString())) {
                                chck = "checked";
                            }
                            var temp = '<div class="col-sm-3"><input  onclick="changeService(#DisesaseId#)" type="checkbox" ' + chck + '> #DiseaseName# </div>';
                            var res = "";
                            if (_cultureIsArabic) {
                                res = temp.replace("#DiseaseName#", value.NameAr).replace("#DisesaseId#", "'" + value.Id + "'");
                            }
                            else {
                                res = temp.replace("#DiseaseName#", value.NameEn).replace("#DisesaseId#", "'" + value.Id + "'");
                            }
                            $(".caseDiseaseDiv").append(res);
                        //}
                    }
                }
            });
            $("#Category").html(htmlCategory);
            $("#Priority").html(htmlPriority);
            $("#Country").html(htmlCountry);
            $("#SocialStatus").html(htmlSocialStatus);
            $("#Nationality").html(htmlnationality);
            $("#Furniture").html(htmlFurniture);
            $("#HomeType").html(htmlHomeType);
            $("#ReligionId").html(htmlReligions);
            $("#StatusInEgyptId").html(htmlStatusInEgypt);
            $("#Gender").html(htmlGender);
            GetAllFunctionCaseCustomAttr();
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.error);
        }
    });
}
getMasterCodeEditCase();

function getCasesServices() {
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: SystmeCodeWebAPIBaseUrl + "api/DetailCode/GetMasterCodeByMultiCode?masterCode=cSrv,cDis",
        async: true,
        success: function (data) {
            $(".caseServiceDiv").html("");
            $(".caseDiseaseDiv").html("");
            var perantId = $("#caseCategoryHID").val();
            $.each(data, function (key, value) {
                //if (value.Parent) {
                    //if (perantId == value.Parent.Id) {
                        if (value.masterCodeValue == "cSrv") {
                            var chck = ""
                            if (checkIfServiceExsist(value.Id.toString())) {
                                chck = "checked";
                            }
                            var temp = '<div class="col-sm-3"><input  onclick="changeService(#ServiceId#)"  type="checkbox"  ' + chck + ' > #ServiceName# </div>';
                            var res = "";
                            if (_cultureIsArabic) {
                                res = temp.replace("#ServiceName#", value.NameAr).replace("#ServiceId#", "'" + value.Id + "'");
                            }
                            else {
                                res = temp.replace("#ServiceName#", value.NameEn).replace("#ServiceId#", "'" + value.Id + "'");
                            }
                            $(".caseServiceDiv").append(res);
                        }
                        else if (value.masterCodeValue == "cDis") {
                            var chck = ""
                            if (checkIfServiceExsist(value.Id.toString())) {
                                chck = "checked";
                            }
                            var temp = '<div class="col-sm-3"><input  onclick="changeService(#DisesaseId#)" type="checkbox" ' + chck + '> #DiseaseName# </div>';
                            var res = "";
                            if (_cultureIsArabic) {
                                res = temp.replace("#DiseaseName#", value.NameAr).replace("#DisesaseId#", "'" + value.Id + "'");
                            }
                            else {
                                res = temp.replace("#DiseaseName#", value.NameEn).replace("#DisesaseId#", "'" + value.Id + "'");
                            }
                            $(".caseDiseaseDiv").append(res);
                        }
                    //}
                //}
            });
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });
}

function getGovernrateEditCase(countryId, elementId) {
    if (countryId == null || countryId == 0) {
        $("#" + elementId).html("");
        $("#" + elementId).val("");
        return;
    }
    var url = SystmeCodeWebAPIBaseUrl + "api/DetailCode/GetByParentId?parentId=" + countryId;// $("#Country").val();
    var htmlGovernorate = "";
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: url,
        async: true,
        success: function (data) {
            $.each(data, function (key, value) {
                var selec = "";
                if (value.masterCodeValue == "Gove") {
                    if ($("#caseGovernorateHID").val() == value.Id) {
                        selec = " selected='selected' "
                        //select District
                        getDistrictEditCase(value.Id, "DistrictAdminEditCase")
                    };
                    if (_cultureIsArabic) {
                        htmlGovernorate += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
                    }
                    else {
                        htmlGovernorate += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
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

function getDistrictEditCase(governorateId, elementId) {
    if (governorateId == null || governorateId == 0) {
        $("#" + elementId).html("");
        $("#" + elementId).val("");
        return;
    }
    var url = SystmeCodeWebAPIBaseUrl + "api/DetailCode/GetByParentId?parentId=" + governorateId;
    var htmlDistrict = "";
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: url,
        async: true,
        success: function (data) {
            $.each(data, function (key, value) {
                var selec = "";
                if (value.masterCodeValue == "Dist") {
                    if ($("#caseDistrictHID").val() == value.Id) selec = " selected='selected' ";
                    if (_cultureIsArabic) {
                        htmlDistrict += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
                    }
                    else {
                        htmlDistrict += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
                    }
                }
            });
            $("#" + elementId).html(htmlDistrict);
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });
}


//function getDetails(CaseId, rowIdx) {
//    $("#DetailsCaseDiv").html("");
//    $.ajax({
//        url: "/Case/Details" + '/' + CaseId,
//        type: 'Get',
//        dataType: "html",
//        contentType: 'application/html; charset=utf-8',
//        beforeSend: function () {
//            //$("#imgAjaxLoader").show();
//        },
//        success: function (result) {
//            $("#DetailsCaseDiv").append(result);
//            $('#DetailsCaseModals').modal('show');
//            getMasterCodeEditCase();
//            CountryChange();
//            GovernorateChange();
//            EditCase();
//            var isFilter = $("#IsFilters").val();
//            if (rowIdx == 1 && isFilter == "NoFilter") { //allowToUser
//                var grid = $("#grid").data("kendoGrid");
//                var pageNumber = grid.dataSource.page();
//                if (pageNumber == 1) {
//                    $(".allowToUser").show();
//                }
//            }
//            if (_cultureIsArabic) {
//                kendo.culture("ar-EG");
//            }
//            GetAllFunctionCaseCustomAttr();
//        },
//        error: function (xhr) {
//            //$("#imgAjaxLoader").hide();
//            toastr.error(xhr.statusText);
//        }
//    }); 
//}

function FirstApprove(accept_Reject) {
    var apiurl = MersalWebAPIBaseUrl + "api/Case/FirstApprove?caseId=" + $("#CaseIdHID").val() + "&stateCode=" + accept_Reject +
        "&comment=" + $("#txtCommentToCaseState").val() + "&CallResult=" + $("#txtCallResultToCaseState").val();
    if (accept_Reject === "csRJ") {
        if ($("#txtCommentToCaseState").val() == "") {
            $("#ErrorCommentToCaseState").html(PleaseAddComment)
            return;
        }
    }
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: apiurl,
        crossDomain: true,
        headers: getHeaders(),
        async: true,
        success: function (data) {
            //$('#DetailsCaseModals').modal('hide');
            if (accept_Reject === "csUN") {
                //$("#grid").data('kendoGrid').dataSource.read();
                //$("#grid").data("kendoGrid").refresh();
                toastr.success(SuccessfullyAccept);
                sentNotificationToGroupFun(FirstAcceptCaseSubject, FirstAcceptCaseBody, sessionStorage.getItem("Id"), 13);

            }
            else if (accept_Reject === "csRJ") {
                toastr.error(SuccessfullyReject);
                sentNotificationToGroupFun(FirstRejectCaseSubject, firstRejectCaseBody, sessionStorage.getItem("Id"), 13);
                //$("#grid").data('kendoGrid').dataSource.read();
                //$("#grid").data("kendoGrid").refresh();
            }
            window.location.href = MersalUIBaseUrl + "/Case";
        },
        error: function (xhr) {
            //$('#DetailsCaseModals').modal('hide');
            toastr.error(xhr.statusText);
        }
    });

}

function SecondApprove(accept_Reject) { //csOP -- csRJ
    var apiurl = MersalWebAPIBaseUrl + "api/Case/SecondApprove?caseId=" + $("#CaseIdHID").val()
        + "&comment=" + $("#txtCommentToCaseState").val() + "&stateCode=" + accept_Reject;
    //+ "&needed=" +
    //$("#txtNeeded").val() + "&priority=" + $("#Priority").val() + "&Category=" + $("#Category").val() +
    //"&RequiredAmount=" + $("#txtRequiredAmount").val();

    if (accept_Reject === "csRJ") {
        if ($("#txtCommentToCaseState").val() == "") {
            $("#ErrorCommentToCaseState").html(PleaseAddComment)
            return;
        }
    }
    //if (!$.isNumeric($("#txtRequiredAmount").val())) {
    //    $("#ErrorRequiredAmountToCaseState").html("Please Add Number");
    //    return;
    //}

    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: apiurl,
        crossDomain: true,
        headers: getHeaders(),
        async: true,
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (data) {
            $("#imgAjaxLoader").hide();
            //$('#DetailsCaseModals').modal('hide');
            if (accept_Reject === "csOP") {
                toastr.success(SuccessfullyAccept);
                sentNotificationToGroupFun(SecondAcceptCaseSubject, SecondAcceptCaseBody, sessionStorage.getItem("Id"), 13);
                //$("#grid").data('kendoGrid').dataSource.read();
                //$("#grid").data("kendoGrid").refresh();
            }
            else if (accept_Reject === "csRJ") {
                toastr.error(SuccessfullyReject);
                sentNotificationToGroupFun(SecondRejectCaseSubject, SecondRejectCaseBody, sessionStorage.getItem("Id"), 13);
                //$("#grid").data('kendoGrid').dataSource.read();
                //$("#grid").data("kendoGrid").refresh();
            }
            window.location.href = MersalUIBaseUrl + "/Case";
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            //$('#DetailsCaseModals').modal('hide');
            toastr.error(xhr.statusText);
        }
    });

}

//submit Edit case 
var EditCaseAdminForm = $("#EditCaseAdminForm");
EditCaseAdminForm.submit(function (e) {
    //var LoginUserId = $("#LoginUserId").val();
    EditCaseAdminForm.removeData("validator") /* added by the raw jquery.validate plugin */
        .removeData("unobtrusiveValidation");  /* added by the jquery unobtrusive plugin */

    $.validator.unobtrusive.parse(EditCaseAdminForm);
    e.preventDefault();
    if (!EditCaseAdminForm.valid()) return;
    var apiurl = MersalWebAPIBaseUrl + "api/Case/EditCaseDetails";
    var data = {};
    $.extend(data, { CustomAttributeValues: GEtCustomeAttr() });
    $("#EditCaseAdminForm").serializeArray().map(function (x) { data[x.name] = x.value; });
    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: apiurl,
        crossDomain: true,
        headers: getHeaders(),
        data: JSON.stringify(data),
        async: false,
        success: function (data) {
            toastr.success(SuccessfulProcess);
            sentNotificationToGroupFun(EditCaseSubject, EditCaseBody, sessionStorage.getItem("Id"), 13);
        },
        error: function (xhr) {
            toastr.error(xhr.error);
        }
    });
});

function GetFinalApprove(caseId) {
    $("#CaseFinalApporveDiv").html("");
    $.ajax({
        url: "/Case/GetFinalApprove?caseId=" + caseId,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#CaseFinalApporveDiv").append(result);
            $('#CaseFinalApproveModals').modal('show');
            submitFinalApprove();
            fillParentAccountDropdown();
            GetAnyMasterDetalisCode("CasC", "CaseCategoryId", false, true, $("#caseCategoryHID").val());
            //SearchForEmployee();
            $("#imgAjaxLoader").hide();
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}

function AssignTaskToDelegate() {
    $("#AssignTaskToDelegateDiv").html("");
    $.ajax({
        url: "/Case/AssignTaskToDelegate",
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            //$("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#AssignTaskToDelegateDiv").append(result);
            $('#AssignTaskToDelegateModals').modal('show');
            submitAssignTaskToDelegate();
            //SearchForEmployee();
        },
        error: function (xhr) {

            //$("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}


function fillParentAccountDropdown() {
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: MersalWebAPIBaseUrl + "api/Accounts/GetAllAccountByParentId?parentID=",
        async: true,
        success: function (data) {
            var htmlParentAccount = "<option value=''></option>";
            $.each(data, function (key, value) {
                htmlParentAccount += "<option value=" + value.Id + "  >" + value.Name + "</option>";
            });
            $("#ParentAccountId").html(htmlParentAccount);
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });
}



function SetEmployeeData(e) {
    try {
        var object = this.dataItem(this.select());
        $("#EmployeeId").val(object.Value);
        $("#EmployeeEmail").val(object.Email);
    } catch (ex) {

    }
}


//submit add FinalApprove
function submitFinalApprove() {
    var myForm = $("#FinalApproveForm");
    myForm.submit(function (e) {
        if ($("#EmployeeId").val() == 0) {
            $("#EmployeeIdErrorMessage").css("display", "block");
        }
        else {
            $("#EmployeeIdErrorMessage").css("display", "none");
        }
        //var upload = $("#CaseImageFinalApprove").data("kendoUpload");
        //var Imagelen = upload.wrapper.find(".k-file").length;
        //if (Imagelen === 0) {
        //    $("#CaseImageErrorMessage").css("display", "block");
        //    $.validator.unobtrusive.parse(myForm)
        //    e.preventDefault();
        //    return;
        //}
        //else {
        //    $("#CaseImageErrorMessage").css("display", "none");
        //}
        $.validator.unobtrusive.parse(myForm)
        e.preventDefault();
        if (!myForm.valid()) return;
        var apiurl = MersalWebAPIBaseUrl + "api/Case/SubmitFinalApprove?resource=" + _culture;
        var data = {};
        $("#FinalApproveForm").serializeArray().map(function (x) { data[x.name] = x.value; });
        //console.log(JSON.stringify(data));
        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: apiurl,
            crossDomain: true,
            headers: getHeaders(),
            data: JSON.stringify(data),
            async: false,

            success: function (data) {
                $('#CaseFinalApproveModals').modal('hide');
                data = JSON.parse(data);
                if (data.success == true) {
                    $("#btnGetFinalApprove").hide();
                    toastr.success(data.successMessage);
                    sentNotificationToGroupFun(FinalApproveCaseSubject, FinalApproveCaseBody, sessionStorage.getItem("Id"), 13);
                    var NotificationData =
                        {
                            ItemType: 1,
                            NotificationSubject: "Open Case",
                            NotificationBody: "you have been assgined to Follow Up Case",
                            Recipients: $("#EmployeeEmail").val(),
                            NotificationType: 7,
                            NotificationPriority: 4,
                            CreatedOn: new Date(),
                            usersId: $("#EmployeeId").val(),
                        };
                    sentNotification(NotificationData);
                    sentNotificationToCaseCreator(FinalApproveCaseSubject, FinalApproveCaseBody, $("#CaseIdHID").val());
                    //$("#grid").data('kendoGrid').dataSource.read();
                    //$("#grid").data("kendoGrid").refresh();
                }
                else {
                    toastr.error(data.ErrorMessage);
                }
            },
            error: function (xhr) {

                $('#AddCaseModals').modal('hide');
                toastr.error(xhr.error);
            }
        });
    });
}

function ValidateCustomeAttr() {
    var isValid = true;
    $("#CustomAttr .Errore").hide();
    var inputs = $("#CustomAttr :input");
    for (var i = 0; i < inputs.length; i++) {

        var element = $(inputs[i]);
        var minlenght = element.attr("minlenght");
        var maxlenght = element.attr("maxlenght");
        var mindate = element.attr("mindate");
        var maxdate = element.attr("maxdate");
        var minvalue = element.attr("minvalue");
        var maxvalue = element.attr("maxvalue");

        if (element.attr("required") != undefined && element.val() == "") {
            element.closest("div").append('<label class="Errore field-validation-error" for=""  style="display: inline-block;">' + RequiredRES + '</label>')
            isValid = false;
        } else if (minlenght != "" && minlenght != undefined && element.val().length <= minlenght) {
            element.closest("div").append('<label class="Errore field-validation-error" for=""  style="display: inline-block;">' + MinLenghtError + minlenght + '</label>')
            isValid = false;

        }


        else if (maxlenght != "" && maxlenght != undefined && element.val.length >= maxlenght) {
            element.closest("div").append('<label class="Errore field-validation-error" for=""  style="display: inline-block;">' + MaxLenghtError + maxlenght + '</label>')
            isValid = false;

        }

        else if (mindate != "" && mindate != undefined && element.val() != "") {
            var dateMin = null;
            var dateMax = null;
            if (mindate == "now") {
                var dateMin = ReturnDate("");
                mindate = DateNow;
            }
            else {
                var dateMin = ReturnDate(mindate);

            }
            if (maxdate == "now") {
                var dateMax = ReturnDate("")
                maxdate = DateNow;

            }
            else {
                var dateMax = ReturnDate(maxdate);
            }
            var Date = element.data("kendoDatePicker").value();

            if (Date < dateMin) {
                element.closest("div").append('<label class="Errore field-validation-error" for=""  style="display: inline-block;">' + MinDateError + " " + mindate + '</label>')
                isValid = false;

            }
            else if (Date > dateMax) {
                element.closest("div").append('<label class="Errore field-validation-error" for=""  style="display: inline-block;">' + MaxDateError + " " + maxdate + '</label>')
                isValid = false;

            }
        }



        else if (maxvalue != "" && maxvalue != undefined && parseFloat(element.val()) > parseFloat(maxvalue)) {
            element.closest("div").append('<label class="Errore field-validation-error" for=""  style="display: inline-block;">' + MaxValueError + maxvalue + '</label>')
            isValid = false;

        }
        else if (minvalue != "" && minvalue != undefined && parseFloat(element.val()) < parseFloat(minvalue)) {
            element.closest("div").append('<label class="Errore field-validation-error" for=""  style="display: inline-block;">' + MinValueError + minvalue + '</label>')
            isValid = false;

        }


    }
    return isValid;
}

function ReturnDate(str) {
    if (str != "") {
        return new Date(str)
    }
    else {
        return new Date()
    }
}

function GEtCustomeAttr() {
    var arr = [];
    var inputs = $("#CustomAttr :input");
    for (var i = 0; i < inputs.length; i++) {
        if ($(inputs[i]).val() != "") { }
        if ($(inputs[i]).val() != "") {
            var item = {
                CaseCategory: $("#Category").val(),
                AttributeId: inputs[i].id,
                AttributeValue: $(inputs[i]).val(),
                CaseId: $("#CaseIdHID").val(),

            }
            arr.push(item);
        }

    }
    return arr;
}

function showInvestegatorSchedule(CaseId, CaseName) {
    var url = "/Case/GetReminderView?id=" + CaseId + "&CaseName=" + CaseName;
    $("#scheduleModelBody").html("");
    $.ajax({
        url: url,// "/Case/GetReminderView/id=" + CaseId + "&CaseName="+CaseName,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#imgAjaxLoader").hide();
            $("#scheduleModelBody").append(result);
            $('#CaseScheduleModals').modal('show');
            $("#scheduler").data("kendoScheduler").refresh();
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}
//.dismissModel
$(document).on('hide.bs.modal', '#CaseScheduleModals', function () {
    $("#scheduleModelBody").html("");
});

$(document).on('hide.bs.modal', '.dismissModel', function () {
    $(".dismissClearDiv").html("");
});

$(document).on('shown.bs.modal', '#CaseScheduleModals', function () {
    $("#scheduler").data("kendoScheduler").refresh();
});


function GetAddFollowResult(CaseId) {
    $("#CaseAddVisitResulDiv").html("");
    $.ajax({
        url: "/Case/GetAddCaseVisiteResult?caseId=" + CaseId,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#imgAjaxLoader").hide();
            $("#CaseAddVisitResulDiv").append(result);
            $('#CaseVisitResultModals').modal('show');
            if (_cultureIsArabic) {
                kendo.culture("ar-EG");
            }
            $("#VisitDateString").kendoDatePicker({
                max: new Date(),
                format: "d/M/yyyy",
            }).attr("readonly", "readonly");
            var changeService = new RegExp('changeService', 'g');
            var checked = new RegExp('checked', 'g');
            var visiteServiceSTR = $(".caseServiceDiv").html().replace(changeService, 'changeServiceVisite').replace(checked, '');
            var visiteDiseaseSTR = $(".caseDiseaseDiv").html().replace(changeService, 'changeServiceVisite').replace(checked, '');
            $("#VisiteServiceDiv").append(visiteServiceSTR);
            $("#VisiteDiseaseDiv").append(visiteDiseaseSTR);
            if (visiteDiseaseSTR == "") {
                $("#VisiteDiseaseParentDiv").hide();
            }
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}

function onUploadVisitResult(e) {
    e.data = {
        CaseId: $("#CaseId").val(),
        VisitDateString: $("#VisitDateString").val(),
        VisitResult: $("#VisitResult").val(),
        VisiteServiceIDs: $("#VisiteServiceIDs").val(),
    };
}

var kendoUploadButton;
function onSelectVisitResult(e) {
    setTimeout(function () {
        kendoUploadButton = $(".k-upload-selected , .k-upload-button");
        kendoUploadButton.hide();
    }, 1);
    $("#hasFile").val(true);
}

function submitVisitResult() {
    $("#VisitDateErrorMassage,#VisitResultErrorMassage").html("");
    if ($("#VisitDateString ").val() == "") {
        $("#VisitDateErrorMassage").html(DateError);
        return;
    }
    else if ($("#VisitResult").val() == "") {
        $("#VisitResultErrorMassage").html(VisitResultError);
        return;
    }

    kendoUploadButton = $(".k-upload-selected");
    if ($("#hasFile").val()) {
        kendoUploadButton.click();
    }
    else {
        var result = {
            CaseId: $("#CaseId").val(),
            VisitDateString: $("#VisitDateString").val(),
            VisitResult: $("#VisitResult").val(),
            VisiteServiceIDs: $("#VisiteServiceIDs").val(),
        };
        $.ajax({
            type: "POST",
            contentType: 'application/json; charset=utf-8',
            url: "/Case/AddCaseVisiteResult ",
            data: JSON.stringify(result),
            beforeSend: function () {
                $("#imgAjaxLoader").show();
            },
            success: function (data) {
                $("#imgAjaxLoader").hide();
                toastr.success(SuccessfulProcess);
                sentNotificationToGroupFun(AddFollowToCaseSubject, AddFollowToCaseBody, sessionStorage.getItem("Id"), 13);

            },
            error: function (xhr) {
                $("#imgAjaxLoader").hide();
                toastr.error(xhr.statusText);
            }
        });
    }
    $('#CaseVisitResultModals').modal('hide');
}


function GetCaseVisitResult(caseId) {
    $("#CaseVisitResultDiv").html("");
    $.ajax({
        url: "/Case/GetCaseVisitsResult?caseId=" + caseId,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#imgAjaxLoader").hide();
            $("#CaseVisitResultDiv").append(result);
            $('#CaseVisitResultListModals').modal('show');
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}

function GetCaseHistory(caseId) {
    $("#CaseCaseHistoryDiv").html("");
    $.ajax({
        url: "/Case/GetCaseHistory?caseId=" + caseId,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#imgAjaxLoader").hide();
            $("#CaseCaseHistoryDiv").append(result);
            $('#CaseHistoryModals').modal('show');
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}

///-----ServiceCaseDetails----/// 
function checkIfServiceExsist(id) {
    var servIds = $("#serviceIDs").val();
    var servIdArray = servIds.split(",");
    if (servIdArray.indexOf(id) == -1) {
        return false;
    }
    else {
        return true;
    }
}

function changeService(id) {
    if (checkIfServiceExsist(id)) {
        removeSerivceId(id);
    }
    else {
        appendServiceId(id);
    }
}

function removeSerivceId(serviceid) {
    var servIds = $("#serviceIDs").val();
    var servIdArray = servIds.split(",");
    servIdArray.deleteElem(serviceid)
    //servIdArray.remove(serviceid);
    servIds = servIdArray.toString();
    $("#serviceIDs").val(servIds);
}

function appendServiceId(serviceid) {
    var servIds = $("#serviceIDs").val();
    if (servIds != "") {
        servIds += ",";
    }
    servIds += serviceid;
    $("#serviceIDs").val(servIds);
}
///-----ServiceCaseDetails----///


///-----ServiceVisite----///
function checkIfServiceVisiteExsist(id) {
    var servIds = $("#VisiteServiceIDs").val();
    var servIdArray = servIds.split(",");
    if (servIdArray.indexOf(id) == -1) {
        return false;
    }
    else {
        return true;
    }
}

function changeServiceVisite(id) {
    if (checkIfServiceVisiteExsist(id)) {
        removeSerivceVisiteId(id);
    }
    else {
        appendServiceVisiteId(id);
    }
}

function removeSerivceVisiteId(serviceid) {
    var servIds = $("#VisiteServiceIDs").val();
    var servIdArray = servIds.split(",");
    servIdArray.deleteElem(serviceid)
    servIds = servIdArray.toString();
    $("#VisiteServiceIDs").val(servIds);
}

function appendServiceVisiteId(serviceid) {
    var servIds = $("#VisiteServiceIDs").val();
    if (servIds != "") {
        servIds += ",";
    }
    servIds += serviceid;
    $("#VisiteServiceIDs").val(servIds);
}
///-----ServiceVisite----///
function checkboxPublishAsMain() {
    if (JSON.parse($("#PublishAsMain").val())) {
        $("#PublishAsMain").val("false");
    } else {
        $("#PublishAsMain").val("true");
    }
}

function checkboxPublishHome() {
    if (JSON.parse($("#PublishAtHome").val())) {
        $("#PublishAtHome").val("false");
    } else {
        $("#PublishAtHome").val("true");
    }
}

function checkboxPublishWeb() {
    if (JSON.parse($("#PublishAtWebsite").val())) {
        $("#PublishAtWebsite").val("false");
    } else {
        $("#PublishAtWebsite").val("true");
    }
}

function ArchivingCase(id) {

    $("#CaseArchiveDiv").html("");
    $.ajax({
        url: "/Case/GetArchiveCase?caseId=" + caseId,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#CaseArchiveDiv").append(result);
            fillDropDown('Cast', '#ReasonForArchiveId', archiveArr);
            $('#CaseArchiveModals').modal('show');
            $("#imgAjaxLoader").hide();
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });

}

function SubmitArchive(e) {
    var CaseArchiveResultForm = $("#CaseArchiveResultForm");
    $.validator.unobtrusive.parse(CaseArchiveResultForm);
    e.preventDefault();
    if (!CaseArchiveResultForm.valid()) return;
    var data = {};
    CaseArchiveResultForm.serializeArray().map(function (x) {
        data[x.name] = x.value;
    });


    var url = MersalWebAPIBaseUrl + "api/Case/ArchivingCase"
    $.ajax({
        type: "POST",
        contentType: "application/json",
        headers: getHeaders(),
        url: url,
        data: JSON.stringify(data),
        async: true,
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (data) {
            $("#imgAjaxLoader").hide();
            toastr.success(SuccessfulProcess);
            sentNotificationToGroupFun(ArchiveCaseSubject, ArchiveCaseBody, sessionStorage.getItem("Id"), 13);
            sentNotificationToCaseCreator(ArchiveCaseSubject, ArchiveCaseBody, $("#CaseIdHID").val());
            window.location.href = MersalUIBaseUrl + "/Case";
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });

}


function fillDropDown(code, dropDownId, filterArr) {
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: SystmeCodeWebAPIBaseUrl + "api/DetailCode/GetMasterCodeByMultiCode?masterCode=" + code,
        async: true,
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (data) {
            $("#imgAjaxLoader").hide();
            var html = "<option></option>";
            $.each(data, function (key, value) {
                if (filterArr != undefined) {
                    if ($.inArray(value.Code, filterArr) != -1) {
                        if (_cultureIsArabic) {
                            html += "<option value=" + value.Id + " >" + value.NameAr + "</option>";
                        }
                        else {
                            html += "<option value=" + value.Id + " >" + value.NameEn + "</option>";
                        }
                    }
                }
                else {
                    if (_cultureIsArabic) {
                        html += "<option value=" + value.Id + " >" + value.NameAr + "</option>";
                    }
                    else {
                        html += "<option value=" + value.Id + " >" + value.NameEn + "</option>";
                    }
                }
            });
            $(dropDownId).html(html);
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.error);
        }
    });


}



function ConfirmArchivingCase(id) {
    var url = MersalWebAPIBaseUrl + "api/Case/ArchivingCase?id=" + id
    $.ajax({
        type: "POST",
        contentType: "application/json",
        headers: getHeaders(),
        url: url,
        async: true,
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (data) {
            $("#imgAjaxLoader").hide();
            //$("#grid").data('kendoGrid').dataSource.read();
            //$("#grid").data("kendoGrid").refresh();
            toastr.success(SuccessfulProcess);
            sentNotificationToGroupFun(ArchiveCaseSubject, ArchiveCaseBody, sessionStorage.getItem("Id"), 13);
            sentNotificationToCaseCreator(ArchiveCaseSubject, ArchiveCaseBody, $("#CaseIdHID").val());

        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}

function GetCaseFamilyMember(caseId) {
    $("#PopupDiv").html("");
    $.ajax({
        url: "/Case/GetCaseFamilyMember?caseId=" + caseId,
        type: 'Get',
        async: false,
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            //$("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#PopupDiv").append(result);
            fillDropDown('NAT', '#FamliyMemberNationality');
            fillDropDown('RLG', '#FamilyMemberReligionId');
            fillDropDown('GEND', '#FamilyMemberGenderId');
            $('#CaseFamilyMemberModals').modal('show');
            AddCaseFamilyMember();
        },
        error: function (xhr) {
            //$("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}

function openEditCaseFamilyMember(familyMemberId) {
    $("#EditCaseMemberDiv").html("");
    $.ajax({
        url: "/Case/EditCaseFamilyMember?famliyMemberId=" + familyMemberId,
        type: 'Get',
        async: false,
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#imgAjaxLoader").hide();
            $("#EditCaseMemberDiv").append(result);
            $('#EditCaseFamilyModal').modal('show');
            submitEditCaseFamilyMember();
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}

function submitEditCaseFamilyMember() {
    var editCaseFamilyMemberForm = $("#EditCaseFamilyAdminForm");
    editCaseFamilyMemberForm.submit(function (e) {
        $.validator.unobtrusive.parse(editCaseFamilyMemberForm);
        e.preventDefault();
        if (!editCaseFamilyMemberForm.valid()) return;
        var apiurl = MersalWebAPIBaseUrl + "api/Case/UpdateCaseFamilyMember";
        var data = {};
        editCaseFamilyMemberForm.serializeArray().map(function (x) { data[x.name] = x.value; });
        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: apiurl,
            crossDomain: true,
            headers: getHeaders(),
            data: JSON.stringify(data),
            async: false,
            success: function (data) {
                toastr.success(SuccessfulProcess);
                $('#EditCaseFamilyModal').modal('hide');
                $('#CaseFamilyMemberModals').modal('hide');
            },
            error: function (xhr) {
                toastr.error(xhr.error);
            }
        });
    });
}

//submit add CaseFamilyMember
function AddCaseFamilyMember() {
    var AddCaseFamilyMemberForm = $("#AddCaseFamilyMemberForm");
    AddCaseFamilyMemberForm.submit(function (e) {
        $.validator.unobtrusive.parse(AddCaseFamilyMemberForm);
        e.preventDefault();
        if (!AddCaseFamilyMemberForm.valid()) return;
        var apiurl = MersalWebAPIBaseUrl + "api/Case/AddCaseFamilyMember";
        var data = {};
        $("#AddCaseFamilyMemberForm").serializeArray().map(function (x) { data[x.name] = x.value; });
        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: apiurl,
            crossDomain: true,
            headers: getHeaders(),
            data: JSON.stringify(data),
            async: false,
            success: function (data) {
                toastr.success(SuccessfullyAdd);
            },
            error: function (xhr) {
                toastr.error(xhr.error);
            }
        });
        $("#AddCaseFamilyMemberForm").trigger('reset');
        // $('#CaseFamilyMemberModals').modal('hide');
    });
}

function DeleteCaseFamilyMember(Id) {
    $.ajax({
        url: MersalWebAPIBaseUrl + "api/Case/DeleteCaseFamilyMember?Id=" + Id,
        type: 'GET',
        async: false,
        dataType: "html",
        headers: getHeaders(),
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            //$("#imgAjaxLoader").show();
        },
        success: function (result) {
            toastr.success(SuccessfulProcess);
            $("#" + Id).remove();
        },
        error: function (xhr) {
            //$("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}

function GetCaseFamilyBudget(caseId) {
    $("#PopupDiv").html("");
    $.ajax({
        url: "/Case/GetCaseFamilyBudget?caseId=" + caseId,
        type: 'Get',
        async: false,
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            //$("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#PopupDiv").append(result);
            $('#CaseFamilyBudgetModals').modal('show');
            AddCaseFamilyBudget();
            GetAnyMasterDetalisCode('ACCU', 'Currency', false, true, "", "", false);
        },
        error: function (xhr) {
            //$("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}

//submit add CaseFamilyBudget
function AddCaseFamilyBudget() {
    var AddCaseFamilyBudgetForm = $("#AddCaseFamilyBudgetForm");
    AddCaseFamilyBudgetForm.submit(function (e) {
        $.validator.unobtrusive.parse(AddCaseFamilyBudgetForm);
        e.preventDefault();
        if (!AddCaseFamilyBudgetForm.valid()) return;
        var apiurl = MersalWebAPIBaseUrl + "api/Case/AddCaseFamilyBudget";
        var data = {};
        $("#AddCaseFamilyBudgetForm").serializeArray().map(function (x) { data[x.name] = x.value; });
        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: apiurl,
            crossDomain: true,
            headers: getHeaders(),
            data: JSON.stringify(data),
            async: false,
            success: function (data) {
                toastr.success(SuccessfullyAdd);
            },
            error: function (xhr) {
                toastr.error(xhr.error);
            }
        });
        $("#AddCaseFamilyBudgetForm").trigger('reset');
        //$('#CaseFamilyBudgetModals').modal('hide');
    });
}

function openEditCaseFamilyBudget(budgetId) {
    $("#EditCaseBudgetDiv").html("");
    $.ajax({
        url: "/Case/EditCaseFamilyBudget?budgetId=" + budgetId,
        type: 'Get',
        async: false,
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#imgAjaxLoader").hide();
            $("#EditCaseBudgetDiv").append(result);
            $('#EditCaseBudgetModal').modal('show');
            submitEditCaseFamilyBudget();
            GetAnyMasterDetalisCode('ACCU', 'EditCaseBudgetForm #Currency', false, true, $('#CurrencyValueId').val(), "", false);
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}

function submitEditCaseFamilyBudget() {

    var editCaseFamilyBudgetForm = $("#EditCaseBudgetForm");
    editCaseFamilyBudgetForm.submit(function (e) {
        $.validator.unobtrusive.parse(editCaseFamilyBudgetForm);
        e.preventDefault();
        if (!editCaseFamilyBudgetForm.valid()) return;
        var apiurl = MersalWebAPIBaseUrl + "api/Case/UpdateCaseFamilyBudget";
        var data = {};
        editCaseFamilyBudgetForm.serializeArray().map(function (x) { data[x.name] = x.value; });
        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: apiurl,
            crossDomain: true,
            headers: getHeaders(),
            data: JSON.stringify(data),
            async: false,
            success: function (data) {
                toastr.success(SuccessfulProcess);
                $('#EditCaseBudgetModal').modal('hide');
                $('#CaseFamilyBudgetModals').modal('hide');
            },
            error: function (xhr) {
                toastr.error(xhr.error);
            }
        });
    });
}

function DeleteCaseFamilyBudget(Id) {
    $.ajax({
        url: MersalWebAPIBaseUrl + "api/Case/DeleteCaseFamilyBudget?Id=" + Id,
        type: 'GET',
        async: false,
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        headers: getHeaders(),
        beforeSend: function () {
            //$("#imgAjaxLoader").show();
        },
        success: function (result) {
            toastr.success(SuccessfulProcess);
            $("#" + Id).remove();
        },
        error: function (xhr) {
            //$("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}

function GetCaseAssistantDetails(caseId) {
    $("#PopupDiv").html("");
    $.ajax({
        url: "/Case/GetCaseAssistantDetails?caseId=" + caseId,
        type: 'Get',
        async: false,
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            //$("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#PopupDiv").append(result);
            $('#CaseAssistantDetailsModals').modal('show');
            AddCaseAssistantDetails();
            GetAnyMasterDetalisCode('ACCU', 'Currency', false, true, "", "", false);
        },
        error: function (xhr) {
            //$("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}

//submit add CaseAssistantDetails
function AddCaseAssistantDetails() {
    var AddCaseAssistantDetailsForm = $("#AddCaseAssistantDetailsForm");
    AddCaseAssistantDetailsForm.submit(function (e) {
        $.validator.unobtrusive.parse(AddCaseAssistantDetailsForm);
        e.preventDefault();
        if (!AddCaseAssistantDetailsForm.valid()) return;
        var apiurl = MersalWebAPIBaseUrl + "api/Case/AddCaseAssistantDetails";
        var data = {};
        $("#AddCaseAssistantDetailsForm").serializeArray().map(function (x) { data[x.name] = x.value; });
        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: apiurl,
            crossDomain: true,
            headers: getHeaders(),
            data: JSON.stringify(data),
            async: false,
            success: function (data) {
                toastr.success(SuccessfullyAdd);
            },
            error: function (xhr) {
                toastr.error(xhr.error);
            }
        });
        $("#AddCaseAssistantDetailsForm").trigger('reset');
        //$('#CaseAssistantDetailsModals').modal('hide');
    });
}

function DeleteCaseAssistantDetails(Id) {
    $.ajax({
        url: MersalWebAPIBaseUrl + "api/Case/DeleteCaseAssistantDetails?Id=" + Id,
        type: 'GET',
        async: false,
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        headers: getHeaders(),
        beforeSend: function () {
            //$("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#" + Id).remove();
            toastr.success(SuccessfulProcess);
        },
        error: function (xhr) {
            //$("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}

$(document).ready(function () {
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
    //$("input[type='checkbox']").change(function () {
    //    var elementName = $(this).attr("name");
    //    var elementId = $(this).attr("id");
    //    $("[name='" + elementName + "']").val(this.checked);

    //    $("#" + elementId).val(this.checked);
    //});
    $("input[type='checkbox']").each(function (key, value) {
        var elementName = $(this).attr("name");
        $("input[type='hidden'][name='" + elementName + "']").remove();
    });
});


//submit AssignTaskToDelegate
function submitAssignTaskToDelegate() {
    $('#Delegatemsg').hide();
    var AssignTaskForm = $("#AssignTaskForm");
    AssignTaskForm.submit(function (e) {
        var userval = $("#usersId").val();
        if (userval == '') {
            $.validator.unobtrusive.parse(AssignTaskForm);
            $('#Delegatemsg').show();
            e.preventDefault();
            return;
        }
        $.validator.unobtrusive.parse(AssignTaskForm);
        e.preventDefault();
        if (!AssignTaskForm.valid()) return;
        var data = {};
        $("#AssignTaskForm").serializeArray().map(function (x) { data[x.name] = x.value; });
        //console.log(JSON.stringify(data));
        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: "/Case/AddDelegateTask?caseId=" + $("#CaseIdHID").val(),
            crossDomain: true,
            headers: getHeaders(),
            data: JSON.stringify(data),
            async: false,
            success: function (data) {
                $('#AssignTaskToDelegateModals').modal('hide');
                toastr.success(SuccessfullyAdd);
            },
            error: function (xhr) {
                //$('#AddCaseModals').modal('hide');
                toastr.error(xhr.error);
            }
        });
    });
}

function ConfirmExclusionCase() {
    var apiurl = MersalWebAPIBaseUrl + "api/Case/ExclusionCase?caseId=" + $("#CaseIdHID").val() + "&stateCode=" + $("#CaseState").val();
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: apiurl,
        crossDomain: true,
        headers: getHeaders(),
        async: true,
        success: function (data) {
            toastr.success(SuccessfulProcess);
            sentNotificationToGroupFun(ExclusionCaseSubject, ExclusionCaseBody, sessionStorage.getItem("Id"), 13);
            sentNotificationToCaseCreator(ExclusionCaseSubject, ExclusionCaseBody, $("#CaseIdHID").val());
            window.location.href = MersalUIBaseUrl + "/Case";
        },
        error: function (xhr) {
            //$('#DetailsCaseModals').modal('hide');
            toastr.error(xhr.statusText);
        }
    });
}

function ExclusionCase() {
    var CallBackFunction = function () { ConfirmExclusionCase(); };
    confirmMessageBootstrap(ExclusionConfrimMsg, ExclusionMsg, 400, 250, CallBackFunction);
}

function ConfirmRestoreCase() {
    var apiurl = MersalWebAPIBaseUrl + "api/Case/RestoreCase?caseId=" + $("#CaseIdHID").val() + "&stateCode=" + $("#CaseState").val();
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
            $("#imgAjaxLoader").hide();
            toastr.success(SuccessfulProcess);
            sentNotificationToGroupFun(RestoreCaseSubject, RestoreCaseBody, sessionStorage.getItem("Id"), 13);
            window.location.href = MersalUIBaseUrl + "/Case";

        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            //$('#DetailsCaseModals').modal('hide');
            toastr.error(xhr.statusText);
        }
    });
}

function RestoreCase() {
    var CallBackFunction = function () { ConfirmRestoreCase(); };
    confirmMessageBootstrap(RestoreConfrimMsg, RestoreMsg, 400, 250, CallBackFunction);
}

//var Notapiurl = NotificationAPIBaseUrl + "api/NoticationItem/sentNotificationToGroup/";
//var subject = EditSubject;
//var NotificationData = { NotificationSubject: subject, NotificationBody: "HP", userId: 117, GroupId: 13 };
/////
//$.ajax({
//    type: "POST",
//    contentType: "application/json",
//    url: Notapiurl,
//    crossDomain: true,
//    headers: getHeaders(),
//    data: JSON.stringify(NotificationData),
//    async: false,
//    success: function (data2) {
//        toastr.success(SuccessfulProcess);

//    },
//    error: function (xhr) {
//        alert("dd");
//        toastr.error(xhr.error);
//    }
//});

function getCasePublishData() {
    $("#CasePublishDataDiv").html("");
    $.ajax({
        url: "/Case/GetCasePublishData?caseId=" + caseId,
        type: 'Get',
        async: false,
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        success: function (result) {
            $("#CasePublishDataDiv").append(result);
            EditCasePublishData();
            $('#CasePublishDataModals').modal('show');
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });
}

//submit CasePublishData
function EditCasePublishData() {
    var CasePublishDataForm = $("#CasePublishDataForm");
    CasePublishDataForm.submit(function (e) {
        $.validator.unobtrusive.parse(CasePublishDataForm);
        e.preventDefault();
        if (!CasePublishDataForm.valid()) return;
        var apiurl = MersalWebAPIBaseUrl + "api/Case/EditCasePublishData";
        var data = {};
        $("#CasePublishDataForm").serializeArray().map(function (x) { data[x.name] = x.value; });
        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: apiurl,
            crossDomain: true,
            headers: getHeaders(),
            data: JSON.stringify(data),
            async: false,
            success: function (data) {
                toastr.success(SuccessfulProcess);
            },
            error: function (xhr) {
                toastr.error(xhr.error);
            }
        });
        $('#CasePublishDataModals').modal('hide');
    });
}


