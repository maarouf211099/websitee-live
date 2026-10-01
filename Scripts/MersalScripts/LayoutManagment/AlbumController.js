

function getCreateAblum() {
    $('#CreateAlbumModals').modal('show');
}
function AddImageToExistAblum(albumId) {
    $('#CreateAlbumModals').modal('show');
    $("#AlbumId").val(albumId);
}
function ConfirmDeleteSlide(imageId) {
    var url = MersalWebAPIBaseUrl + "api/Albums/DeleteAlbum?id=" + imageId
    $.ajax({
        type: "POST",
        contentType: "application/json",
        headers: getHeaders(),
        url: url,
        async: false,
        success: function (data) {
           
            $('#ImagesModals').modal('show');
            $('#DeleteAlbumForm').trigger("reset");
            toastr.success(SuccessfulProcess);
            document.location.reload(true);

            //$("#grid").data("kendoGrid").dataSource.read();
            //$("#grid").data("kendoGrid").refresh();
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });
}
function getImageDetails(ImageId) {
    $("#EditImage").html("");
    $.ajax({
        url: "/Album/AlbumDetails" + '/' + ImageId,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#imgAjaxLoader").hide();
            $("#EditImage").append(result);
            //$('#ImagesModals').modal('show');
            $('#AlbumDetailsModals').modal('show');
            
            //$('#AlbumDetailsModals').modal('show');
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}
function getImageDetails2(ImageId) {
    $("#EditImage").html("");
    $.ajax({
        url: "/Album/AlbumDetails" + '/' + ImageId,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            //$("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#EditImage").append(result);
            //$('#ImagesModals').modal('show');
            $('#AlbumDetailsModals').modal('show');

            //$('#AlbumDetailsModals').modal('show');
        },
        error: function (xhr) {
            //$("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}

function DeleteImage(imageId) {
    var CallBackFunction = function () { ConfirmDeleteSlide(imageId); };
    $('#ImagesModals').modal('hide');
   confirmMessageBootstrap(ConfirmDelete,sureDelete, 400, 250, CallBackFunction);
}


function onUploadAlbumImageCreate(e) {
    var myForm = $("#CreateAlbumForm");
    if (!myForm.valid()) {
        $("#Image").data("kendoUpload").trigger("cancel");
        e.preventDefault();
        return;
    };
    var data = {};
    $("#CreateAlbumForm").serializeArray().map(function (x) { data[x.name] = x.value; });
    e.data = data;
}
function onSuccessUploadDataCreate(e) {
    toastr.success(SuccessfulProcess);
    $('#CreateAlbumModals').modal('hide');
    $('#CreateAlbumForm').trigger("reset");
    document.location.reload(true);
}
//function confirmMessageBootstrap(title, HTMLMessage, width, height, InjectedSuccessionFunction) {

//    $("#ConfirmationMassageHeader").html(title);
//    $("#ConfirmationMassageH3").html(HTMLMessage);
//    $('#cofirmationMessageModals').modal('show');
//    $("#btnsubmitConfirmationDialog").on("click", function () {
//        InjectedSuccessionFunction();
//        $('#cofirmationMessageModals').modal('hide');
//        document.location.reload(true);
//    });
//}