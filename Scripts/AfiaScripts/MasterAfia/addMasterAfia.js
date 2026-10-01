
function AddNewMasterAfia() {
    var createMasterAfiaDiv =  $("#createMasterAfiaDiv")
    createMasterAfiaDiv.html("");
    $.ajax({
        url: "/MasterAfia/Add",
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#imgAjaxLoader").hide();
            createMasterAfiaDiv.append(result);
            $('#AddMasterAfiaModals').modal('show');
            AddMasterAfia();
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });

}
function Delete(id) {

    $.ajax({
        url: MersalWebAPIBaseUrl + "api/MasterAfia/delete?id=" + id,
        type: 'POST',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#imgAjaxLoader").hide();
            RefreshGird();
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });


}
function AddMasterAfia() {
    var addMasterAfiaForm = $("#AddMasterAfiaForm");
    addMasterAfiaForm.submit(function (e) {
        $.validator.unobtrusive.parse(addMasterAfiaForm)
        e.preventDefault();

        var newMasterAfia = {};
        addMasterAfiaForm.serializeArray().map(function (x) { newMasterAfia[x.name] = x.value; });
        newMasterAfia["IsActive"] = $("#IsActive").is(":checked")
        newMasterAfia["Icon"] = Icon
        var apiurl = MersalWebAPIBaseUrl + "api/MasterAfia/Add";
        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: apiurl,
            crossDomain: true,
            headers: getHeaders(),
            data: JSON.stringify(newMasterAfia),
            async: false,
            success: function (data) {
                toastr.success(SuccessfulProcess);
                console.log(newMasterAfia);
                $('#AddMasterAfiaModals').modal('hide');

                $('#AddMasterAfiaForm')[0].reset();
                $("#grid").data('kendoGrid').dataSource.read();
                $("#grid").data("kendoGrid").refresh();
            },
            error: function (xhr) {
                toastr.error(xhr.error);
            }
        });
    });
}

function Edit(id) {
    var createCampaignsHomeCounterDiv = $("#createMasterAfiaDiv")
    createCampaignsHomeCounterDiv.html("");
    $.ajax({
        url: "/MasterAfia/Edit?id=" + id,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#imgAjaxLoader").hide();
            createCampaignsHomeCounterDiv.append(result);
            $('#AddMasterAfiaModals').modal('show');
            AddMasterAfia();
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });


}


function onUploadAlbumImageCreate(e) {
    var myForm = $("#AddMasterAfiaForm");
    if (!myForm.valid()) {
        $("#Image").data("kendoUpload").trigger("cancel");
        e.preventDefault();
        return;
    };
    var data = {};
    $("#AddMasterAfiaForm").serializeArray().map(function (x) { data[x.name] = x.value; });
    e.data = data;
}
function onSuccessUploadDataCreate(e) {
    toastr.success(SuccessfulProcess);
    console.log(e);
    Icon = "/images/"+e.files[0].name
    //$('#CreateAlbumModals').modal('hide');
   // $('#CreateAlbumForm').trigger("reset");
 //   document.location.reload(true);
}