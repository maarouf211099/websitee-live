
function AddNewMedicine() {
    var createMedicineDiv =  $("#createMedicineDiv")
    createMedicineDiv.html("");
    $.ajax({
        url: "/Medicine/Create",
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#imgAjaxLoader").hide();
            createMedicineDiv.append(result);
            $('#AddMedicineModals').modal('show');
            AddMedicine();
            getMasterCodeAddCase();
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });

}

function AddMedicine() {
    var addMedicineForm = $("#AddMedicineForm");
    addMedicineForm.submit(function (e) {
        $.validator.unobtrusive.parse(addMedicineForm)
        e.preventDefault();

        var newMedicine = {};
        addMedicineForm.serializeArray().map(function (x) { newMedicine[x.name] = x.value; });
        var apiurl = MersalWebAPIBaseUrl + "api/Medicine/AddMedicine";
        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: apiurl,
            crossDomain: true,
            headers: getHeaders(),
            data: JSON.stringify(newMedicine),
            async: false,
            success: function (data) {
                toastr.success(SuccessfulProcess);
                console.log(newMedicine);
                $('#AddMedicineForm')[0].reset();
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
        url: SystmeCodeWebAPIBaseUrl + "api/DetailCode/GetMasterCodeByMultiCode?masterCode=MedUnit",
        async: true,
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
