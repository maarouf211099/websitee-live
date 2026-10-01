
function AddNewCurrencyRate() {
    var createCurrencyRateDiv =  $("#createCurrencyRateDiv")
    createCurrencyRateDiv.html("");
    $.ajax({
        url: "/CurrencyRate/Create",
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#imgAjaxLoader").hide();
            createCurrencyRateDiv.append(result);
            $('#AddCurrencyRateModals').modal('show');
            AddCurrencyRate();
            //getMasterCodeAddCase();
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });

}



function AddCurrencyRate() {
    
    var addCurrencyRateForm = $("#AddCurrencyRateForm");
    addCurrencyRateForm.submit(function (e) {
        $.validator.unobtrusive.parse(addCurrencyRateForm)
        e.preventDefault();

        var newCurrencyRate = {};
        addCurrencyRateForm.serializeArray().map(function (x) { newCurrencyRate[x.name] = x.value; });
        newCurrencyRate["IsActive"] = $("#IsActive").prop('checked');
        var apiurl = MersalWebAPIBaseUrl + "api/CurrencyRate/AddCurrencyRate";
        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: apiurl,
            crossDomain: true,
            headers: getHeaders(),
            data: JSON.stringify(newCurrencyRate),
            async: false,
            success: function (data) {
                toastr.success(SuccessfulProcess);
                console.log(newCurrencyRate);
                $('#AddCurrencyRateForm')[0].reset();
                $("#grid").data('kendoGrid').dataSource.read();
                $("#grid").data("kendoGrid").refresh();
                $('#AddCurrencyRateModals').modal('hide');
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
        url: SystmeCodeWebAPIBaseUrl + "api/DetailCode/GetMasterCodeByMultiCode?masterCode=MedUnit",
        async: true,
        headers: getHeaders(),
        success: function (data) {
            var htmlDrp = "<option value=''></option>";
            $.each(data, function (key, value) {
                var selec = "";
                if ($("#Unit").val() == value.Id) selec = " selected='selected' ";
                if (_cultureIsArabic) {
                    htmlDrp += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
                }
                else {
                    htmlDrp += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
                }
            });
            $("#SmallUnit").html(htmlDrp);
            $("#MidddleUnit").html(htmlDrp);
            $("#LargeUnit").html(htmlDrp);
           
        },
        error: function (xhr) {
            toastr.error(xhr.error);
        }
    });
}

function EditCurrencyRate(id) {
    var createCurrencyRateDiv = $("#createCurrencyRateDiv")
    createCurrencyRateDiv.html("");
    $.ajax({
        url: "/CurrencyRate/Edit?id=" + id,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#imgAjaxLoader").hide();
            createCurrencyRateDiv.append(result);
            $('#AddCurrencyRateModals').modal('show');
            AddCurrencyRate();
            //getMasterCodeAddCase();
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });


}