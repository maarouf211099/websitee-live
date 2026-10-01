



function getCreateDonationSlide() {
    $('#CreateDonationSlideModals').modal('show');
}



function onUploadDonationSlideCreate(e) {
    var myForm = $("#CreateDonationSlideForm");
    if (!myForm.valid()) {
        $("#Image").data("kendoUpload").trigger("cancel");
        e.preventDefault();
        return;
    };
    var data = {};
    $("#CreateDonationSlideForm").serializeArray().map(function (x) { data[x.name] = x.value; });
    e.data = data;
}

function onSuccessUploadDataCreateDonation(e) {
    toastr.success(SuccessfulProcess);
    $('#CreateDonationSlideModals').modal('hide');
    $('#CreateDonationSlideForm').trigger("reset");
}







function getSlideDetails(id) {
    $.ajax({
        url: "/DonationSlider/GetSlideDetails?slideId=" + id,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#imgAjaxLoader").hide();
            $("#EditDonationSlide").html(result);
            $('#EditDonationSlideModals').modal('show');

        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}


function onSelectImageDonation(e) {
    $("#btnSubmitEditDonation").hide();
}

function onUploadDonationSlideEdit(e) {
    var myForm = $("#EditDonationSlideForm");
    if (!myForm.valid()) {
        $("#EditImage").data("kendoUpload").trigger("cancel");
        e.preventDefault();
        return;
    };
    var data = {};
    $("#EditDonationSlideForm").serializeArray().map(function (x) { data[x.name] = x.value; });
    e.data = data;
}

function onSuccessUploadDataEditDonation() {
    toastr.success(SuccessfulProcess);
    $('#EditDonationSlideModals').modal('hide');
}


function submitEditSlideDonation() {

    var myForm = $("#EditDonationSlideForm");
    myForm.submit(function (e) {
        $.validator.unobtrusive.parse(myForm)
        e.preventDefault();
        if (!myForm.valid()) return;
        var url = "/DonationSlider/EditDonationSlider"
        var data = {};
        $("#EditDonationSlideForm").serializeArray().map(function (x) { data[x.name] = x.value; });

        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: url,
            headers: getHeaders(),
            data: JSON.stringify(data),
            async: false,
            success: function (data) {
                toastr.success(SuccessfulProcess);
                $('#EditDonationSlideModals').modal('hide');
            },
            error: function (xhr) {
                toastr.error(xhr.statusText);
            }
        });
    });
    myForm.submit();
}













function ConfirmDeleteSlide(id) {
    var url = MersalWebAPIBaseUrl + "api/DonationSlider/DeleteSlider?id=" + id
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

