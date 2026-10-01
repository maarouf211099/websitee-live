

function getDelete(id) {
    var CallBackFunction = function () { ConfirmDeleteSposor(id); };
    confirmMessageBootstrap(ConfirmDelete, sureDelete, 400, 250, CallBackFunction);
}

function ConfirmDeleteSposor(id) {
    var url = MersalWebAPIBaseUrl + "api/CampaignAPI/Delete?id=" + id
    $.ajax({
        type: "POST",
        contentType: "application/json",
        headers: getHeaders(),
        url: url,
        async: false,
        success: function (data) {
            toastr.success(SuccessfulProcess);
            $("#Grid").data('kendoGrid').dataSource.read();
            $("#Grid").data("kendoGrid").refresh();
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });
}