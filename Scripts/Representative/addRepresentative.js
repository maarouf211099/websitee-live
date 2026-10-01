
function AddNewRepresentative() {
    var createRepresentativeDiv =  $("#createRepresentativeDiv")
    createRepresentativeDiv.html("");
    $.ajax({
        url: "/Representative/Create",
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#imgAjaxLoader").hide();
            createRepresentativeDiv.append(result);
            $('#AddRepresentativeModals').modal('show');
            AddRepresentative();
            //getMasterCodeAddCase();
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });

}



function AddRepresentative() {
    
    var addRepresentativeForm = $("#AddRepresentativeForm");
    addRepresentativeForm.submit(function (e) {
        $.validator.unobtrusive.parse(addRepresentativeForm)
        e.preventDefault();

        var newRepresentative = {};
        addRepresentativeForm.serializeArray().map(function (x) { newRepresentative[x.name] = x.value; });
        newRepresentative["IsActive"] = $("#IsActive").prop('checked');
        var apiurl = MersalWebAPIBaseUrl + "api/Representative/AddRepresentative";
        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: apiurl,
            crossDomain: true,
            headers: getHeaders(),
            data: JSON.stringify(newRepresentative),
            async: false,
            success: function (data) {
                toastr.success(SuccessfulProcess);
                console.log(newRepresentative);
                $('#AddRepresentativeForm')[0].reset();
                $("#grid").data('kendoGrid').dataSource.read();
                $("#grid").data("kendoGrid").refresh();
                $('#AddRepresentativeModals').modal('hide');
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

function EditRepresentative(id) {
    var createRepresentativeDiv = $("#createRepresentativeDiv")
    createRepresentativeDiv.html("");
    $.ajax({
        url: "/Representative/Edit?id=" + id,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#imgAjaxLoader").hide();
            createRepresentativeDiv.append(result);
            $('#AddRepresentativeModals').modal('show');
            AddRepresentative();
            //getMasterCodeAddCase();
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });


}