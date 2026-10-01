



function getDetailsEmail(id) {
    $.ajax({
        url: "/EmailTemplateUI/Details?id=" + id,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#imgAjaxLoader").hide();
            $("#EditEmailDiv").html(result);
            $('#EditModalsEmail').modal('show');

        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}


function submitEditEmail() {

    var myForm = $("#EditFormEmail");
    myForm.submit(function (e) {
        $.validator.unobtrusive.parse(myForm)
        e.preventDefault();
        if (!myForm.valid()) return;
        var url = MersalWebAPIBaseUrl + "api/EmailTemplateAPI/EditEmailTemplate"
        var data = {};
        $("#EditFormEmail").serializeArray().map(function (x) { data[x.name] = x.value; });

        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: url,
            headers: getHeaders(),
            data: JSON.stringify(data),
            async: false,
            success: function (data) {
                toastr.success(SuccessfulProcess);
                $('#EditModalsEmail').modal('hide');
            },
            error: function (xhr) {
                toastr.error(xhr.statusText);
            }
        });
    });
    myForm.submit();
}