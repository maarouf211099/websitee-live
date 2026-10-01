
function AddNewCampaignsHomeCounter() {
    var createCampaignsHomeCounterDiv =  $("#createCampaignsHomeCounterDiv")
    createCampaignsHomeCounterDiv.html("");
    $.ajax({
        url: "/CampaignsHomeCounter/Create",
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#imgAjaxLoader").hide();
            createCampaignsHomeCounterDiv.append(result);
            $('#AddCampaignsHomeCounterModals').modal('show');
            
            AddCampaignsHomeCounter();
            getMasterCodeAddCase();
            getPages();
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });

}



function AddCampaignsHomeCounter() {
    
    var addCampaignsHomeCounterForm = $("#AddCampaignsHomeCounterForm");
    addCampaignsHomeCounterForm.submit(function (e) {
        $.validator.unobtrusive.parse(addCampaignsHomeCounterForm)
        e.preventDefault();

        var newCampaignsHomeCounter = {};
        addCampaignsHomeCounterForm.serializeArray().map(function (x) { newCampaignsHomeCounter[x.name] = x.value; });
        newCampaignsHomeCounter["IsActive"] = $("#IsActive").prop('checked');
        //newCampaignsHomeCounter["DonationDestinationId"] = $("#SelectDonationDestinationIds").val();
        newCampaignsHomeCounter["DonationDestinationIds"] = $("#SelectDonationDestinationIds").val().join(", ");
        newCampaignsHomeCounter["Base64Image"] = $("#b64").text().replace(/^data:image\/(png|jpg|jpeg);base64,/, "");

        var apiurl = MersalWebAPIBaseUrl + "api/CampaignsHomeCounter/AddCampaignsHomeCounter";
        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: apiurl,
            crossDomain: true,
            headers: getHeaders(),
            data: JSON.stringify(newCampaignsHomeCounter),
            async: false,
            success: function (data) {
                toastr.success(SuccessfulProcess);
                console.log(newCampaignsHomeCounter);
                $('#AddCampaignsHomeCounterForm')[0].reset();
                $("#grid").data('kendoGrid').dataSource.read();
                $("#grid").data("kendoGrid").refresh();
                $('#AddCampaignsHomeCounterModals').modal('hide');
            },
            error: function (xhr) {
                toastr.error(xhr.error);
            }
        });
    });
}

function getMasterCodeAddCase() {
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: SystmeCodeWebAPIBaseUrl + "api/DetailCode/GetAllDonationDestination",
        async: true,
        headers: getHeaders(),
        success: function (data) {
            //<option value=''></option>
            var htmlDrp = "";
            $.each(data, function (key, value) {
                var selec = "";
                if ($("#Unit").val() == value.Id) selec = " selected='selected' ";
                if (_cultureIsArabic) {
                    htmlDrp += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
                }
                else {
                    htmlDrp += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
                }
            });
            $("#SelectDonationDestinationIds").html(htmlDrp);
            var required = $("#SelectDonationDestinationIds").kendoMultiSelect().data("kendoMultiSelect");
            var list = $("#DonationDestinationIds").val().split(",");
            for (var i = 0; i < list?.length; i++)
                list[i] = parseInt(list[i], 10);
            required.value(list);
           
        },
        error: function (xhr) {
            toastr.error(xhr.error);
        }
    });
}

function EditCampaignsHomeCounter(id) {
    var createCampaignsHomeCounterDiv = $("#createCampaignsHomeCounterDiv")
    createCampaignsHomeCounterDiv.html("");
    $.ajax({
        url: "/CampaignsHomeCounter/Edit?id=" + id,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#imgAjaxLoader").hide();
            createCampaignsHomeCounterDiv.append(result);
            $('#AddCampaignsHomeCounterModals').modal('show');
            AddCampaignsHomeCounter();
            getMasterCodeAddCase();
            getPages();
            GetCampaignsHomeCounter(id);
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });


}

function base64ToBlob(base64, mime) {
    mime = mime || '';
    var sliceSize = 1024;
    var byteChars = window.atob(base64);
    var byteArrays = [];

    for (var offset = 0, len = byteChars.length; offset < len; offset += sliceSize) {
        var slice = byteChars.slice(offset, offset + sliceSize);

        var byteNumbers = new Array(slice.length);
        for (var i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        var byteArray = new Uint8Array(byteNumbers);

        byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: mime });
}


function GetCampaignsHomeCounter(id) {

    $.ajax({
        url: MersalWebAPIBaseUrl + "api/CampaignsHomeCounter/GetById?id=" + id,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
        },
        success: function (result) {
            var responce = JSON.parse(result);
            var StartedOn = new Date(responce.StartedOn);
            var EndedOn = new Date(responce.EndedOn);
            EndedOn = EndedOn.setDate(EndedOn.getDate() + 1);
            StartedOn = StartedOn.setDate(StartedOn.getDate() + 1);

            $("#EndedOn").datepicker("option", "dateFormat", "dd-mm-yyyy");
            $("#StartedOn").datepicker("option", "dateFormat", "dd-mm-yyyy");

            $('#StartedOn').val(new Date(StartedOn).toISOString().split('T')[0]);
            if (responce.EndedOn != null && responce.EndedOn != undefined)
                $('#EndedOn').val(new Date(EndedOn).toISOString().split('T')[0]);

            $("#EndedOn").datepicker('option', 'minDate', StartedOn);
            $("#StartedOn").datepicker('option', 'maxDate', EndedOn);
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });


}


function getPages() {
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: MersalWebAPIBaseUrl + "api/DynamicPages/GetPagesLookup?type=2",
        async: true,
        headers: getHeaders(),
        success: function (data) {
            //<option value=''></option>
            var htmlDrp = "";
            $.each(data, function (key, value) {
                var selec = "";
                if ($("#ProjectDestinationId").val() == value.Id) {
                    selec = " selected='selected' ";
                    $(".ProjectDestinationUrl").val("/DynamicPage/RenderPage?id=" + $("#ProjectDestinationId").val())
                }

                if (_cultureIsArabic) {
                    htmlDrp += "<option value=" + value.Id + selec + " >" + value.TitleAR + "</option>";
                }
                else {
                    htmlDrp += "<option value=" + value.Id + selec + " >" + value.TitleEN + "</option>";
                }
            });
            $(".ProjectDestinationId").append(htmlDrp);
 
        },
        error: function (xhr) {
            toastr.error(xhr.error);
        }
    });
}

function ProjectDestinationidchange() {
    var ProjectDestinationId = $(".ProjectDestinationId").val()
    $(".ProjectDestinationUrl").val("/DynamicPage/RenderPage?id=" + ProjectDestinationId)
    $("#ProjectDestinationUrl").val( ProjectDestinationId)

}
function ProjectDestinationurlchange() {
    var ProjectDestinationurl = $(".ProjectDestinationUrl").val()
    $(".ProjectDestinationId").val(ProjectDestinationurl.split("=")[1])
    $("#ProjectDestinationId").val(ProjectDestinationurl.split("=")[1])

}