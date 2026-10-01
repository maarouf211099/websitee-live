




//submit add case  
function AddCase() {
    var AddCaseAdminForm = $("#AddCaseAdminForm");
    AddCaseAdminForm.submit(function (e) {
        $.validator.unobtrusive.parse(AddCaseAdminForm)
        e.preventDefault();
        $('#StatusInEgyptIdError').remove();
        if (!AddCaseAdminForm.valid()) {
            if ($('.divStatus').css("display") != "none" && $('#StatusInEgyptId').val() == '') {
                $('.divStatus').append('<span class="field-validation-error" id="StatusInEgyptIdError" data-valmsg-replace="true"><span for="StatusInEgyptId" class="">وضع الحاله مطلوب</span></span>');
            }
            return;
        }

        if ($('.divStatus').css("display") != "none" && $('#StatusInEgyptId').val() == '') {
            $('#StatusInEgyptIdError').remove();
            $('.divStatus').append('<span class="field-validation-error" id="StatusInEgyptIdError" data-valmsg-replace="true"><span for="StatusInEgyptId" class="">وضع الحاله مطلوب</span></span>');
            return;
        }
       // if (!AddCaseAdminForm.valid()) return;
        var NewCase = {};
        $("#AddCaseAdminForm").serializeArray().map(function (x) { NewCase[x.name] = x.value; });
        var apiurl = MersalWebAPIBaseUrl + "api/Case/AddCaseAdmin";
        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: apiurl,
            crossDomain: true,
            headers: getHeaders(),
            data: JSON.stringify(NewCase),
            async: false,
            success: function (data) {
                toastr.success(SuccessfulProcess);
                sentNotificationToGroupFun(AddCaseSubject, AddCaseBody, sessionStorage.getItem("Id"), 13);
                if (NewCase.Priority == 1075) {
                    var Message = "تم إضافة حالة حرجة جديدة";
                    SendNotificationsFacebook(Message);
                }
                $('#AddCaseAdminForm')[0].reset();
                $("#grid").data('kendoGrid').dataSource.read();
                $("#grid").data("kendoGrid").refresh();
                //$('#AddCaseModals').modal('hide');
                //data = JSON.parse(data); 
                //   // sentNotificationToCommittee(data.NotificationSubject, data.NotificationBody, sessionStorage.getItem("Id"));
                //if (data.success == true) {
                //}
                //else {
                //    toastr.error(data.ErrorMessage);
                //}
            },
            error: function (xhr) {
                // $('#AddCaseModals').modal('hide');
                toastr.error(xhr.error);
            }
        });
    });
}

function getMasterCodeAddCase(code, elementId) {
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: SystmeCodeWebAPIBaseUrl + "api/DetailCode/GetMasterCodeByMultiCode?masterCode=" + code,
        async: true,
        success: function (data) {
            var optionsHtml = "<option value=''></option>";
            $.each(data, function (key, value) {
                var selec = "";
                if ($("#caseCategoryHID").val() == value.Id) selec = " selected='selected' ";
                if ($("#casePriorityHID").val() == value.Id) selec = " selected='selected' ";

                if (_cultureIsArabic) {
                    optionsHtml += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
                }
                else {
                    optionsHtml += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
                }
            });

            $("#" + elementId).html(optionsHtml);
        },
        error: function (xhr) {
            toastr.error(xhr.error);
        }
    });
}

//function getMasterCodeAddCase() {
//    $.ajax({
//        type: "GET",
//        contentType: "application/json",
//        url: SystmeCodeWebAPIBaseUrl + "api/DetailCode/GetMasterCodeByMultiCode?masterCode=CasC,CasS,CasP,GEND,STINEGY,RLG,NAT",
//        async: true,
//        success: function (data) {
//            var htmlCategory = "";
//            var htmlSource = "";
//            var htmlPriority = "";
//            var htmlGender = "<option value=''></option>";
//            var htmlReligion = "<option value=''></option>";
//            var htmlStatusInEgypt = "<option value=''></option>";
//            var htmlNationality = "<option value=''></option>";
//            $.each(data, function (key, value) {
//                var selec = "";
//                if (value.masterCodeValue == "CasC") {
//                    if ($("#caseCategoryHID").val() == value.Id) selec = " selected='selected' ";
//                    if (_cultureIsArabic) {
//                        htmlCategory += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
//                    }
//                    else {
//                        htmlCategory += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
//                    }
//                }
//                else if (value.masterCodeValue == "NAT") {
//                    if (_cultureIsArabic) {
//                        htmlNationality += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
//                    }
//                    else {
//                        htmlNationality += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
//                    }
//                }
//                else if (value.masterCodeValue == "GEND") {
//                    if (_cultureIsArabic) {
//                        htmlGender += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
//                    }
//                    else {
//                        htmlGender += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
//                    }
//                }
//                else if (value.masterCodeValue == "STINEGY") {
//                    if (_cultureIsArabic) {
//                        htmlStatusInEgypt += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
//                    }
//                    else {
//                        htmlStatusInEgypt += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
//                    }
//                }
//                else if (value.masterCodeValue == "RLG") {
//                    if (_cultureIsArabic) {
//                        htmlReligion += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
//                    }
//                    else {
//                        htmlReligion += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
//                    }
//                }
//                else if (value.masterCodeValue == "CasS") {//1076
//                    if (_cultureIsArabic) {
//                        htmlSource += "<option value=" + value.Id + " >" + value.NameAr + "</option>";
//                    }
//                    else {
//                        htmlSource += "<option value=" + value.Id + " >" + value.NameEn + "</option>";
//                    }
//                }
//                else if (value.masterCodeValue == "CasP") {
//                    if ($("#casePriorityHID").val() == value.Id) selec = " selected='selected' ";
//                    if (_cultureIsArabic) {
//                        htmlPriority += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
//                    }
//                    else {
//                        htmlPriority += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
//                    }
//                }
//            });
//            $("#Source").html(htmlSource);
//            $("#Category").html(htmlCategory);
//            $("#Priority").html(htmlPriority);
//            $("#Gender").html(htmlGender);
//            $("#ReligionId").html(htmlReligion);
//            $("#StatusInEgyptId").html(htmlStatusInEgypt);
//            $("#Nationality").html(htmlNationality);
//        },
//        error: function (xhr) {
//            toastr.error(xhr.error);
//        }
//    });
//}

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



//$("#btnPopupCreateCase").click(function () {
//    $("#createCaseDiv").html("");
//    $.ajax({
//        url: "/Case/Create",
//        type: 'Get',
//        dataType: "html",
//        contentType: 'application/html; charset=utf-8',
//        beforeSend: function () {
//            //$("#imgAjaxLoader").show();
//        },
//        success: function (result) {
//            $("#createCaseDiv").append(result);
//            $('#AddCaseModals').modal('show');

//            getMasterCodeAddCase();
//            GetCountryMasteCode();
//            CountryChange();
//            AddCase();
//            GovernorateChange();
//            TextBoxToDatePicker();
//        },
//        error: function (xhr) {
//            //$("#imgAjaxLoader").hide();
//            toastr.error(xhr.statusText);
//        }
//    });

//});


function AddNewCaseAdmin() {
    $("#createCaseDiv").html("");
    $.ajax({
        url: "/Case/Create",
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#imgAjaxLoader").hide();
            $("#createCaseDiv").append(result);
            $('#AddCaseModals').modal('show');

            AddCase();
            getMasterCodeAddCase("CasC", "Category");
            getMasterCodeAddCase("NAT", "Nationality");
            getMasterCodeAddCase("GEND", "Gender");
            getMasterCodeAddCase("STINEGY", "StatusInEgyptId");
            getMasterCodeAddCase("RLG", "ReligionId");
            getMasterCodeAddCase("CasS", "Source");
            getMasterCodeAddCase("CasP", "Priority");
            GetCountryMasteCode();
            CountryChange();
            GovernorateChange();
            changeCategory();
            nationalityChange();
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });

};
function changeCategory() {
    $("#Category").change(function () {
        $("#caseCategoryHID").val($("#Category").val());
       // $("#serviceIDs").val("");
        getCasesServices();
    });
}

//$('.popup-ajax').popover({
//    "html": true,
//    "content": function () {
//        var div_id = "tmp-id-" + $.now();
//        return details_in_popup("/Case/Create", div_id);
//    }
//});

//function details_in_popup(link, div_id) {
//    $.ajax({
//        url: link,
//        success: function (response) {
//            $('#' + div_id).html(response);
//        }
//    });
//    return '<div id="' + div_id + '">Loading...</div>';
//}

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