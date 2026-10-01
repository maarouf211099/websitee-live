 
var RepresentativeDonationForm = $("#RepresentativeDonationForm");
RepresentativeDonationForm.submit(function (e) {
    $.validator.unobtrusive.parse(RepresentativeDonationForm)
        e.preventDefault();
        if (!RepresentativeDonationForm.valid()) return;
        var apiurl = MersalWebAPIBaseUrl + "api/Donation/CreateRepresentativeDonation";
        var data = {};
    $("#RepresentativeDonationForm").serializeArray().map(function (x) { data[x.name] = x.value; });
    data.CaseId = data.DonationDestinationRepresentativeCaseCode;
    console.log(data);
        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: apiurl,
            crossDomain: true,
            headers: getHeaders(),
            data: JSON.stringify(data),
            async: true,
            beforeSend: function () {
                $("#imgAjaxLoader").show();
            },
            success: function (data) { 
                $("#imgAjaxLoader").hide();
                toastr.success(SuccessfullyAdd);
                document.getElementById("RepresentativeDonationForm").reset();
                $('#DonationDestinationRepresentativeId').change();
                $('#codeDiv').show();
                document.getElementById("CodeValue").innerHTML = data;
               /// Popup($(elem).html());

            },
            error: function (xhr) {
                $("#imgAjaxLoader").hide();
                toastr.error(xhr.error);
            }
        });
    }); 



function Popup(data) {
    var mywindow = window.open('', '', '');
    mywindow.document.write('<html><head><title></title>');
    /*optional stylesheet*/ //mywindow.document.write('<link rel="stylesheet" href="main.css" type="text/css" />');
    mywindow.document.write('</head><body >');
    mywindow.document.write(data);
    mywindow.document.write('</body></html>');

    mywindow.document.close(); // necessary for IE >= 10
    mywindow.focus(); // necessary for IE >= 10

    mywindow.print();
    mywindow.close();

    return true;
}