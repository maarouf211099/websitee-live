
function AddNewDetailAfia() {
    var createDetailAfiaDiv =  $("#createDetailAfiaDiv")
    createDetailAfiaDiv.html("");
    $.ajax({
        url: "/DetailAfia/Add",
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#imgAjaxLoader").hide();
            createDetailAfiaDiv.append(result);
            $('#AddDetailAfiaModals').modal('show');
            AddDetailAfia();
            getMasterCodeAddCase();
            getgoverments();
            getsubspecialty();
          
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });

}
function Edit(id) {
    var createCampaignsHomeCounterDiv = $("#createDetailAfiaDiv")
    createCampaignsHomeCounterDiv.html("");
    $.ajax({
        url: "/DetailAfia/Edit?id=" + id,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#imgAjaxLoader").hide();
            createCampaignsHomeCounterDiv.append(result);
            getMasterCodeAddCase();
            getgoverments();
            getsubspecialty();

            
            $('#AddDetailAfiaModals').modal('show');
            AddDetailAfia();
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });


}

function Delete(id) {

    $.ajax({
        url: MersalWebAPIBaseUrl + "api/DetailAfia/delete?id=" + id,
        type: 'POST',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#imgAjaxLoader").hide();
            RefreshGird();
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });


}

function AddDetailAfia() {
    var addDetailAfiaForm = $("#AddDetailAfiaForm");
    addDetailAfiaForm.submit(function (e) {
        $.validator.unobtrusive.parse(addDetailAfiaForm)
        e.preventDefault();

        var newDetailAfia = {};
        addDetailAfiaForm.serializeArray().map(function (x) { newDetailAfia[x.name] = x.value; });
        var apiurl = MersalWebAPIBaseUrl + "api/DetailAfia/add";
        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: apiurl,
            crossDomain: true,
            headers: getHeaders(),
            data: JSON.stringify(newDetailAfia),
            async: false,
            success: function (data) {
                toastr.success(SuccessfulProcess);
                console.log(newDetailAfia);
                $('#AddDetailAfiaForm')[0].reset();
                $('#AddDetailAfiaModals').modal('hide');

                $("#grid").data('kendoGrid').dataSource.read();
                $("#grid").data("kendoGrid").refresh();
            },
            error: function (xhr) {
                toastr.error(xhr.error);
            }
        });
    });
}

function getMasterCodeAddCase() {
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: MersalWebAPIBaseUrl + "api/MasterAfia/getalllookup",
        async: true,
        success: function (data) {
            var htmlDrp = "<option value='null'></option>";
            $.each(data, function (key, value) {
                var selec = "";
                if (_cultureIsArabic) {
                    htmlDrp += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
                }
                else {
                    htmlDrp += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
                }
            });
            $(".LargeUnit").append(htmlDrp);

            $('.LargeUnit').val(MasterId);
           
        },
        error: function (xhr) {
            toastr.error(xhr.error);
        }
    });
}

function getgoverments() {
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: SystmeCodeWebAPIBaseUrl + "api/DetailCode/GetByMasterCodeId?masterCodeId=1024",
        async: true,
        success: function (data) {
            var htmlDrp = "<option value='null'></option>";
            $.each(data, function (key, value) {
                var selec = "";
                if (_cultureIsArabic) {
                    htmlDrp += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
                }
                else {
                    htmlDrp += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
                }
            });
            $(".goverments").append(htmlDrp);
            if (GovermentId) {

            $('.goverments').val(GovermentId);
            getRegions(GovermentId);
            }

            $('.goverments').change(e => {
                getRegions($('.goverments').val())

            })

        },
        error: function (xhr) {
            toastr.error(xhr.error);
        }
    });
}

function getRegions(parentId) {
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: SystmeCodeWebAPIBaseUrl + "api/DetailCode/GetByParentId?parentId=" + parentId,
        async: true,
        success: function (data) {
            var htmlDrp = "<option value='null'></option>";
            $.each(data, function (key, value) {
                var selec = "";
                if (_cultureIsArabic) {
                    htmlDrp += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
                }
                else {
                    htmlDrp += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
                }
            });
            $(".Region").append(htmlDrp);

            $('.Region').val(RegionId);

        },
        error: function (xhr) {
            toastr.error(xhr.error);
        }
    });
}
function getsubspecialty() {
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: SystmeCodeWebAPIBaseUrl + "api/DetailCode/GetByMasterCodeId?masterCodeId=5079",
        async: true,
        success: function (data) {
            var htmlDrp = "<option value='null'></option>";
            $.each(data, function (key, value) {
                var selec = "";
                if (_cultureIsArabic) {
                    htmlDrp += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
                }
                else {
                    htmlDrp += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
                }
            });
            $(".subspecialty").append(htmlDrp);
            if (subspecialtyId)
            $('.subspecialty').val(subspecialtyId);

        },
        error: function (xhr) {
            toastr.error(xhr.error);
        }
    });
}