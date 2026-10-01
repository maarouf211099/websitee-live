
$(document).ready(function () {
    var getDeleted = getUrlParameter("isdeleted");
    if (getDeleted == "true") {
        $("#ViewTempPageDeleted").hide();
        $("#ViewTempPageActive").show();
    }
});


function onSelectImageCreateTempPageBlock(e) {
    $("#btnSubmitCreateTempPageBlock").hide();
}

function onUploadCreateTempPageBlock(e) {
    var data = {};
    $("#CreateTempPageBlockForm").serializeArray().map(function (x) { data[x.name] = x.value; });
    e.data = data;
}

function onSuccessCreateTempPageBlock() {
    $('#CreateTempPageBlockModals').modal('hide');
    toastr.success(SuccessfulProcess);
}




$("#CreateTempPageBlockForm").submit(function (e) {
    e.preventDefault();
    var url = MersalWebAPIBaseUrl + "api/TempPageAPI/AddTempBlock";
    var data = {};

    var myForm = $("#CreateTempPageBlockForm");
    if (!myForm.valid()) {
        e.preventDefault();
        return;
    };

    $("#CreateTempPageBlockForm").serializeArray().map(function (x) { data[x.name] = x.value; });
    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: url,
        headers: getHeaders(),
        data: JSON.stringify(data),
        async: false,
        success: function (data) {
            $('#CreateTempPageBlockModals').modal('hide');
            $('#CreateTempPageBlockForm').trigger("reset");
            toastr.success(SuccessfulProcess);
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });
});




function GetTempPageBlockDetails(id) {
    $.ajax({
        url: "/TempPageUI/GetTempPageBlockDetails?Id=" + id,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#imgAjaxLoader").hide();
            $("#EditTempPageBlockDiv").html(result);
            EditTempPageBlockForm();
            $('#EditTempPageBlockModals').modal('show');

        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}





function onSelectImageEditTempPageBlock(e) {
    $("#btnSubmitEditTempPageBlock").hide();
}

function onUploadEditTempPageBlock(e) {
    var data = {};
    $("#EditTempPageBlockForm").serializeArray().map(function (x) { data[x.name] = x.value; });
    e.data = data;
}

function onSuccessEditTempPageBlock() {
    $('#EditTempPageBlockModals').modal('hide');
    toastr.success(SuccessfulProcess);
}



function EditTempPageBlockForm() {
    $("#EditTempPageBlockForm").submit(function (e) {
        e.preventDefault();
        var url = MersalWebAPIBaseUrl + "api/TempPageAPI/UpdateTempBlock";
        var data = {};
        $("#EditTempPageBlockForm").serializeArray().map(function (x) { data[x.name] = x.value; });
        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: url,
            headers: getHeaders(),
            data: JSON.stringify(data),
            async: false,
            success: function (data) {
                $('#EditTempPageBlockModals').modal('hide');
                $('#EditTempPageBlockForm').trigger("reset");
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



function ConfirmDeleteTempPageBlock(id) {
    var url = MersalWebAPIBaseUrl + "api/TempPageAPI/DeleteTempBlock?id=" + id
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

function DeleteTempPageBlock(id) {
    var CallBackFunction = function () { ConfirmDeleteTempPageBlock(id); };
    confirmMessageBootstrap(ConfirmDelete, sureDelete, 400, 250, CallBackFunction);
}



