var DeleteOrRestoreURL = "/Activities/DeleteOrRestore";

   function DataBound() {
        $(".freeEvent").each(function (i) {
            var data = $(this).attr("eventPrice");
            if (isNumber(data)) {
                $(this).html(data);
            }
            else {
                $(this).html(Free);
            }
        });
        $(".academia").each(function (i) {
            var data = $(this).attr("isAcademia");
            if (data =="true") {  
                $(this).html(IsAcademia);
            }
            else {
                $(this).html(IsPublic);
            }
        });
    }
function deleteActivity(Id) {
    $.ajax({
        url: DeleteOrRestoreURL,
        type: 'GET',
        data: {
            Id: Id,
            IsDelete: true
        },
        contentType: 'application/json; charset=utf-8',
         beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
         success: function (result) {
             $("#imgAjaxLoader").hide();
            $('#deleteView').html(result);
            $('#deleteView').modal('show');
        }
    });
}


function gridParameters() {
    if ($("#IsDeleted").val() == "True") {
        $('#ActiivitiesGrid').data('kendoGrid').hideColumn(5);
        $('#ActiivitiesGrid').data('kendoGrid').hideColumn(6);
        $('#ActiivitiesGrid').data('kendoGrid').hideColumn(8);
        $('#ActiivitiesGrid').data('kendoGrid').showColumn(7);
    } else {
        $('#ActiivitiesGrid').data('kendoGrid').showColumn(5);
        $('#ActiivitiesGrid').data('kendoGrid').showColumn(6);
        
        $('#ActiivitiesGrid').data('kendoGrid').showColumn(8);
        $('#ActiivitiesGrid').data('kendoGrid').hideColumn(7);
    }
    return { 'IsDeleted': $("#IsDeleted").val() };
}

function changeDelete() {
    if ($("#IsDeleted").val() == "True") {
        $("#IsDeleted").val("False");
        $('#btn_showDelete').text(ShowDeleted);
    } else {
        $("#IsDeleted").val("True");
        $('#btn_showDelete').text(ShowAll);
    }
    $('#ActiivitiesGrid').data('kendoGrid').dataSource.read();
}

function editActivity(Id) {
    var Editurl =  "/Activities/Edit?Id=" + Id;
    window.location.href = Editurl;
}

function ActivityMembers(Id) {
    window.location.href = "/Activities/ActivityMembersList?Id=" + Id;
}

function restoreActivity(Id) {
    $.ajax({
        url: DeleteOrRestoreURL,
        data: {
            Id: Id,
            IsDelete: false
        },
        type: 'GET',
        contentType: 'application/json; charset=utf-8',
        success: function (result) {
            $('#deleteView').html(result);
            $('#deleteView').modal('show');
        }
    });
}
