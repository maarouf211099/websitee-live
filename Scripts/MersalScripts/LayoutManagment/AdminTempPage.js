
$(document).ready(function () { 
    var getDeleted =  getUrlParameter("isdeleted");
    if (getDeleted == "true") {
        $("#ViewTempPageDeleted").hide();
        $("#ViewTempPageActive").show();
    }
});
$("#CreateTempPageForm").submit(function (e) {
    e.preventDefault();
    var url = MersalWebAPIBaseUrl + "api/TempPageAPI/AddTempPage";
    var data = {};
    $("#CreateTempPageForm").serializeArray().map(function (x) { data[x.name] = x.value; });
    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: url,
        headers: getHeaders(),
        data: JSON.stringify(data),
        async: false,
        success: function (data) {
            $('#TempPageModals').modal('hide');
            $('#CreateTempPageForm').trigger("reset");
            toastr.success(SuccessfulProcess);
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });
});




function getTempPageDetails(id) {
    $.ajax({
        url: "/TempPageUI/GetTempPageDetails?Id=" + id,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#imgAjaxLoader").hide();
            $("#EditTempPageDiv").html(result);
            EditTempPageForm();
            $('#EditTempPageModals').modal('show');

        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}



function EditTempPageForm() {
    $("#EditTempPageForm").submit(function (e) {
        e.preventDefault();
        var url = MersalWebAPIBaseUrl + "api/TempPageAPI/UpdateTempPage";
        var data = {};
        $("#EditTempPageForm").serializeArray().map(function (x) { data[x.name] = x.value; });
        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: url,
            headers: getHeaders(),
            data: JSON.stringify(data),
            async: false,
            success: function (data) {
                $('#EditTempPageModals').modal('hide');
                toastr.success(SuccessfulProcess);
            },
            error: function (xhr) {
                toastr.error(xhr.statusText);
            }
        });
    });

}



function ConfirmDeleteTempPage(id) {
    var url = MersalWebAPIBaseUrl + "api/TempPageAPI/DeleteTempPage?id=" + id
    $.ajax({
        type: "POST",
        contentType: "application/json",
        headers: getHeaders(),
        url: url,
        async: false,
        success: function (data) {
            toastr.success(SuccessfulProcess);
            $("#S_" + id).remove();
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });
}

function DeleteTempPage(id) {
    var CallBackFunction = function () { ConfirmDeleteTempPage(id); };
    confirmMessageBootstrap(ConfirmDelete, sureDelete, 400, 250, CallBackFunction);
}

