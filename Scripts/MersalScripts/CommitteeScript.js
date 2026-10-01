$("#txtSearchUser").keyup(function () {
    var apiurl = UserNamagementWebAPIBaseUrl + "/api/User/searchForUser"; //?search=" + this.value;
    $.ajax({
        type: "Get",
        contentType: "application/json; charset=utf-8",
        url: apiurl,
        crossDomain: true,
        headers: getHeaders(),
        data: {
            search: this.value
        },
        async: false,
        success: function (data) {
            var html = "";
            $.each(data, function (i, val) {
                html += "<li id='userId_" + val.Id + "' data-value='user'>" + val.UserName + " </li>";
            });
            $("#autocompleteListOfUser").html(html);
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });
    activeDragDrop();
});
activeDragDrop();

function activeDragDrop() {
    $("#autocompleteListOfUser li").draggable({
        //helper: "clone",
        helper: function () {
            return "<b><u>" + $(this).text() + "</u></b>";
        },
        cursor: "pointer",
        revert: "invalid",
    });
    $("#divUser").droppable({//"li[data-value='user']",
        //accept: "li[data-value='user']",
        accept: function (d) {
            var userExists = $("#CommitteeListOfUser").find('#' + d.attr('id')).length;
            return userExists < 1; 
        },
        drop: function (event, ui) {
            $("#CommitteeListOfUser").append(ui.draggable);
            // activeDragDrop();
        },
        hoverClass: "highlight",
    });

    /////------
    $("#CommitteeListOfUser li").draggable({
        //helper: "clone",
        helper: function () {
            return "<b><u>" + $(this).text() + "</u></b>";
        },
        cursor: "pointer",
        revert: "invalid",
    });
    $("#AllDivUser").droppable({
        accept: "li[data-value='user']",
        drop: function (event, ui) {
            $("#autocompleteListOfUser").append(ui.draggable);
            //activeDragDrop();
        },
        hoverClass: "highlight",
    });
}




//submit
$("#AddUser").click(function () {
    $("#committeErrormsgspan").css("display", "none");
    if ($("#CommitteeListOfUser li").size() == 0) {
        toastr.error();
    }
    else if ($("#CommitteeListOfUser li").size() % 2 != 0) {
        var IDs = "";
        $("#CommitteeListOfUser li").each(function () {
            IDs += $(this).attr('id').substring(7) + ",";
        });
        var apiurl = MersalWebAPIBaseUrl + "api/Committee/ManageCommittee";
        var data = { "usersIds": IDs };
        if (IDs === "") {
            toastr.error("Please Add User");
            return;
        }
        $.ajax({
            type: "POST",
            contentType: "application/json; charset=utf-8",
            url: apiurl,
            crossDomain: true,
            headers: getHeaders(),
            data: JSON.stringify(data),
            async: false,
            success: function (dataCallback) {
                if (dataCallback === "-1") {
                    toastr.error(Error);
                }
                else {
                    toastr.success(SuccessfullyAdd);
                }
            },
            error: function (xhr) {
                toastr.error(Error);
            }
        });
    }
    else {
        $("#committeErrormsgspan").css("display", "block");
        // toastr.error("Commite Number  Must Be Odd");
    }
});