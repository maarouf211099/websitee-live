 
function DeleteUserExist(id) { 
        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: MersalWebAPIBaseUrl + "api/CampaignAPI/DeleteUserInCampaign?UserId=" + id + "&campaignId=" + $("#Id").val(),
            headers: getHeaders(),
            async: false,
            success: function (data) {
                toastr.success(SuccessfulProcess);
                $("[UserId='" + id + "']").remove();
            },
            error: function (xhr) {
                toastr.error(xhr.statusText);
            }
        });
    }

function DeleteDestinationExist(id) { 
    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: MersalWebAPIBaseUrl + "api/CampaignAPI/DeleteDestinationInCampaign?DestinationId=" + id,
        headers: getHeaders(),
        async: false,
        success: function (data) {
            toastr.success(SuccessfulProcess);
            $("[DestinationId='" + id + "']").remove();
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });
}

function DeleteImageExist(id) {
    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: MersalWebAPIBaseUrl + "api/CampaignAPI/DeleteImageInCampaign?ImageId=" + id,
        headers: getHeaders(),
        async: false,
        success: function (data) {
            toastr.success(SuccessfulProcess);
            $("[ImageId='" + id + "']").remove();
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });

       
}

$(document).ready(function () {
    if (_cultureIsArabic) {
        kendo.culture("ar-EG");
    }
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


    var url = SystmeCodeWebAPIBaseUrl + "api/DetailCode/GetMasterCodeByMultiCode?masterCode=Gove";
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: url,
        async: true,
        success: function (data) {
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
            $("#Governorate").html(htmlGovernorate);
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });


});

$("#Governorate").change(function () {
    var url = SystmeCodeWebAPIBaseUrl + "api/DetailCode/GetByParentId?parentId=" + $("#Governorate").val();
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: url,
        async: false,
        success: function (data) {
            var htmlDistrict = "<option value=''></option>";
            $.each(data, function (key, value) {
                if (_cultureIsArabic) {
                    htmlDistrict += "<option value=" + value.Id + " >" + value.NameAr + "</option>";
                }
                else {
                    htmlDistrict += "<option value=" + value.Id + " >" + value.NameEn + "</option>";
                }
            });
            $("#District").html(htmlDistrict);
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });
});

function addDestination() {
    var id = Math.floor((Math.random() * 10000000)); //Math.random().toString(36).substring(7);
    var result = {
        Governorate: $("#Governorate").val(),
        District: $("#District").val(),
        Region: $("#Region").val(),
        Id: id,
    };
    $.ajax({
        type: "POST",
        contentType: 'application/json; charset=utf-8',
        url: "/CampaignUI/addDestination ",
        data: JSON.stringify(result),
        async: false,
        success: function (data) {
            if (data.success == "success") {
                var temp = '<p id="#Id#"> #Text# <i class="fa fa-times-circle-o" onclick="removeDestination(#removeId#)"></i></p>';
                var text = $("#Governorate option:selected").html() + '     ' + $("#District option:selected").html() + '     ' + $("#Region").val();
                var res = temp.replace("#Id#", id).replace("#removeId#", "'" + id + "'").replace("#Text#", text);
                $("#distinationDiv").append(res);
            } else {
                toastr.error(data.success);
            }
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });

}

function removeDestination(id) {
    $.ajax({
        type: "POST",
        contentType: 'application/json; charset=utf-8',
        url: "/CampaignUI/removeDestination/" + id,
        async: false,
        success: function (data) {
            if (data.success == "success") {
                $("#" + id).remove();
            } else {
                toastr.error(data.success);
            }
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });


}


var EditCampaignForm = $("#EditCampaignForm");
EditCampaignForm.submit(function (e) {

    var startdate = $("#StartDateS").val();
    var enddate = $("#EndDateS").val();
        //new Date(d1) < new Date(d2
        if (startdate.toDate("dd/mm/yyyy", "/") > enddate.toDate("dd/mm/yyyy", "/")) {
            //  $.validator.unobtrusive.parse(CreateCampaignForm)
            e.preventDefault();
            toastr.warning(datemsg);
            return;
        }
    
    $.validator.unobtrusive.parse(EditCampaignForm)
    e.preventDefault();
    if (!EditCampaignForm.valid()) return;
    debugger; 
    var uploadImages = $("#CampataignImages").data("kendoUpload");
    var Imagelen = uploadImages.wrapper.find(".k-file").length;

    if (Imagelen === 0) {
        $("#CampaignImageErrorMessage").css("display", "block");
        $.validator.unobtrusive.parse(CreateCampaignForm)
        e.preventDefault();
        return;
    }
    else {
        $("#CampaignImageErrorMessage").css("display", "none");
    }

    var url = MersalUIBaseUrl + "/CampaignUI/Edit";
    var Submitdata = {};
    $("#EditCampaignForm").serializeArray().map(function (x) { Submitdata[x.name] = x.value; });

    Submitdata.campaignUsersDTOListIDs = $("#membersMulti").data("kendoMultiSelect").value();
    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: url,
        crossDomain: true,
        headers: getHeaders(),
        data: JSON.stringify(Submitdata),
        async: false,
        success: function (result) {
            if (result.success == "success") {
                toastr.success(SuccessfulProcess);
                setTimeout(function () { window.location.href = "/CampaignUI" }, 1000);
            }
            else {
                toastr.error(ErrorMessage);
            }
        },
        error: function (xhr) {
            toastr.error(xhr.error);
        }
    });
});

$("input[type='checkbox']").each(function () {
    var elementName = $(this).attr("name");
    $("[name='" + elementName + "']").val(this.checked);
});


$("input[type='checkbox']").change(function () {
    var elementName = $(this).attr("name");
    $("[name='" + elementName + "']").val(this.checked);
});

function ArchivingCampaign(id) {
    var CallBackFunction = function () { ConfirmArchivingCampaign(id); };
    confirmMessageBootstrap(ArchivingCampaignTitle, ConfirmArchivingCampaignTitle, 400, 250, CallBackFunction);
}


function ConfirmArchivingCampaign(id) {
    var url = MersalWebAPIBaseUrl + "api/CampaignAPI/ArchivedCampaign?id=" + id
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
            toastr.success(SuccessfulProcess);
            window.location.href = "/CampaignUI";
        },
        error: function (xhr) {
         $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}