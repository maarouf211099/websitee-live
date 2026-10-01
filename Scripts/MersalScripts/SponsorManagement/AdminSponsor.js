

function getCreateSponsor() {
    $('#CreateSponsorModals').modal('show');
}



function onUploadSponsorCreate(e) {
    var myForm = $("#CreateSponsorForm");
    if (!myForm.valid()) {
        $("#Image").data("kendoUpload").trigger("cancel");
        e.preventDefault();
        return;
    };
    var data = {};
    $("#CreateSponsorForm").serializeArray().map(function (x) { data[x.name] = x.value; });
    e.data = data;
}

function onSuccessUploadDataCreateSponsor(e) {
    toastr.success(SuccessfulProcess);
    $('#CreateSponsorModals').modal('hide');
    $('#CreateSponsorForm').trigger("reset");
     document.location.reload(true);
}
















function getSponsorDetails(id) {
    $.ajax({
        url: "/SponsorUI/GetSponsorDetails?SponsorId=" + id,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#imgAjaxLoader").hide();
            $("#EditSponsor").html(result);
            $('#EditSponsorModals').modal('show');

        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}


function onSelectImageSponsor(e) {
    $("#btnSubmitEditSponsor").hide();
}

function onUploadSponsorEdit(e) {
    var myForm = $("#EditSponsorForm");
    if (!myForm.valid()) {
        $("#EditImage").data("kendoUpload").trigger("cancel");
        e.preventDefault();
        return;
    };
    var data = {};
    $("#EditSponsorForm").serializeArray().map(function (x) { data[x.name] = x.value; });
    e.data = data;
}

function onSuccessUploadDataEditSponsor() {
    toastr.success(SuccessfulProcess);
    $('#EditSponsorModals').modal('hide');
}


function submitEditSponsor() {

    var myForm = $("#EditSponsorForm");
    myForm.submit(function (e) {
        $.validator.unobtrusive.parse(myForm)
        e.preventDefault();
        if (!myForm.valid()) return;
        var url = "/SponsorUI/EditSponsor"
        var data = {};
        $("#EditSponsorForm").serializeArray().map(function (x) { data[x.name] = x.value; });

        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: url,
            headers: getHeaders(),
            data: JSON.stringify(data),
            async: false,
            success: function (data) {
                toastr.success(SuccessfulProcess);
                $('#EditSponsorModals').modal('hide');
                document.location.reload(true);

            },
            error: function (xhr) {
                toastr.error(xhr.statusText);
            }
        });
    });
    myForm.submit();
}



















function ConfirmDeleteSposor(id) {
    var url = MersalWebAPIBaseUrl + "api/Sponsor/DeleteSponsor?id=" + id
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

function DeleteSponsor(id) {
    var CallBackFunction = function () { ConfirmDeleteSposor(id); };
    confirmMessageBootstrap(ConfirmDelete, sureDelete, 400, 250, CallBackFunction);
}