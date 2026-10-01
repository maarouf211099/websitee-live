GetAndDrawCount(MersalWebAPIBaseUrl + "api/Activities/CountActivityMembers?Id=" + $("#ActivityId").val())
function GetAndDrawCount(apiurl) {

    $.ajax({
        type: "get",
        contentType: "application/json",
        url: apiurl,
        crossDomain: true,
        headers: getHeaders(),

        async: true,
        success: function (data) {
            if (data == null)
            {
                $("#lblCountMembers").html(0);
            }
            else
            {
            $("#lblCountMembers").html(data);
            }
        },
        error: function (xhr) {


            toastr.error(xhr.error);
        }
    });
}
GetAndDrawActivityValueAmount(MersalWebAPIBaseUrl + "api/Activities/ActivityValueAmount?Id=" + $("#ActivityId").val())
function GetAndDrawActivityValueAmount(apiurl) {

    $.ajax({
        type: "get",
        contentType: "application/json",
        url: apiurl,
        crossDomain: true,
        headers: getHeaders(),

        async: true,
        success: function (data) {
            if(data==null)
            {
            $("#lblActivityValueAmount").html(0);
            }
            else
            {
            $("#lblActivityValueAmount").html(data);
            }
        },
        error: function (xhr) {


            toastr.error(xhr.error);
        }
    });
}