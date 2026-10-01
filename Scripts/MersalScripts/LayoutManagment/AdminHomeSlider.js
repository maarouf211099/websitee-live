




function getCreateSlide() {
    $('#CreateHomeSlideForm').trigger("reset");
    $('#CreateHomeSlideModals').modal('show');
}

function onUploadHomeSlideImageCreate(e) {
    var myForm = $("#CreateHomeSlideForm");
    if (!myForm.valid()) {
        $("#Image").data("kendoUpload").trigger("cancel");
        e.preventDefault();
        return;
    };
    var data = {};
    $("#CreateHomeSlideForm").serializeArray().map(function (x) { data[x.name] = x.value; });
    e.data = data;
}

function onSuccessUploadDataCreate(e) {
    toastr.success(SuccessfulProcess);
    $('#CreateHomeSlideModals').modal('hide');
    $('#CreateHomeSlideForm').trigger("reset");
}



function getSlideDetails(id) {
    $.ajax({
        url: "/HomeSlider/GetSlideDetails?slideId=" + id,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#imgAjaxLoader").hide();
            $("#EditHomeSlide").html(result);
            $('#EditHomeSlideModals').modal('show');

        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}


function onSelectImage(e) {
    $("#btnSubmitEdit").hide();
}

function onUploadHomeSlideImageEdit(e) {
    var myForm = $("#EditHomeSlideForm");
    if (!myForm.valid()) {
        $("#EditImage").data("kendoUpload").trigger("cancel");
        e.preventDefault();
        return;
    };
    var data = {};
    $("#EditHomeSlideForm").serializeArray().map(function (x) { data[x.name] = x.value; });
    e.data = data;
}

function onSuccessUploadDataEdit() {
    toastr.success(SuccessfulProcess);
    $('#EditHomeSlideModals').modal('hide');
}


function submitEditSlide() {

    var myForm = $("#EditHomeSlideForm");
    myForm.submit(function (e) {
        $.validator.unobtrusive.parse(myForm)
        e.preventDefault();
        if (!myForm.valid()) return;
        var url = "/HomeSlider/EditHomeSlider"
        var data = {};
        $("#EditHomeSlideForm").serializeArray().map(function (x) { data[x.name] = x.value; });

        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: url,
            headers: getHeaders(),
            data: JSON.stringify(data),
            async: false,
            success: function (data) {
                toastr.success(SuccessfulProcess);
                $('#EditHomeSlideModals').modal('hide');
            },
            error: function (xhr) {
                toastr.error(xhr.statusText);
            }
        });
    });
    myForm.submit();
}



function ConfirmDeleteSlide(id) {
    var url = MersalWebAPIBaseUrl + "api/HomeSlider/DeleteSlider?id=" + id
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
function DeleteSlide(id) {
    var CallBackFunction = function () { ConfirmDeleteSlide(id); };
    confirmMessageBootstrap(ConfirmDelete, sureDelete, 400, 250, CallBackFunction);
}


