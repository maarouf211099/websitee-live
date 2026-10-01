
    $(document).ready(function () {
        $.ajax({
            type: "GET",
            contentType: "application/json",
            url: MersalWebAPIBaseUrl + "api/Accounts/GetAllAccountByParentId?parentID=",
            async: true,
             beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
            success: function (data) {
              $("#imgAjaxLoader").hide();
                var htmlParentAccount = "<option value=''></option>";
                $.each(data, function (key, value) {
                    htmlParentAccount += "<option value=" + value.Id + "  >" + value.Name + "</option>";
                });
                $("#ParentAccountId").html(htmlParentAccount);
            },
            error: function (xhr) {
              $("#imgAjaxLoader").hide();
                toastr.error(xhr.statusText);
            }
        });
        var createActivityForm = $('#CreateForm');
        createActivityForm.submit(function (sub) {
            
            var sendAjax = true;
            sub.preventDefault();
            var $form = $(this);
            if (!$form.valid()) {
                sendAjax = false;
            }
           // $("#ActivityReminderErrorMessage").css("display", "none");
            $("#ActivityImageErrorMessage").css("display", "none");
            var data = $form.serializeObject();
            //if ($("#scheduler").data("kendoScheduler").dataSource.data().length == 0) { 
                
            //    $("#ActivityReminderErrorMessage").css("display", "block");
            //    sendAjax = false;
            //}
            var uploadImages = $("#activitiesaImage").data("kendoUpload");
            var Imagelen = uploadImages.wrapper.find(".k-file").length;
            if (Imagelen === 0) {
                $("#ActivityImageErrorMessage").css("display", "block");
                sendAjax = false; 
            }

           // data["Scheduler"] = $("#scheduler").data("kendoScheduler").dataSource.at(0);
             

           // data["ActivityMembers"] = GetMembers();
            data.ActivityMembersDTOListIDs = $("#membersMulti").data("kendoMultiSelect").value();
                addActivity(data);
            //if (sendAjax) {
            //    data["Images"] = [];

            //    var images = [];
            //    $.ajax({
           
            //        url: '/Activities/getImages',
            //        dataType: 'json',
            //        async: false,
            //        headers: getHeaders(),
            //        success: function (imag) {
            //            $.each(imag, function (v, databytes) {
            //                var e = v.split(".");
            //                data["Images"].push({ 'data': databytes, 'IsActive': true, ext:e[e.length-1] })

            //            })
            //            addActivity(data);

            //        },
            //        error: function (xhr) {
            //            toastr.error(xhr.statusText);
            //        }
            //    })

            //} else {
            //    return;
            //}
        });

        $("#IsFree").change(function () {
            var fees = $("#Fees").data("kendoNumericTextBox");
            if ($(this).is(':checked')) {
                fees.value(null);
                fees.enable(false);
            } else {
                fees.enable(true);
            }
        });

        //$("#SchedulerDiv").accordion({
        //    collapsible: true,
        //    animated: true,
        //    autoHeight: true,
        //    active: true
        //});

        //$("#SchedulerDiv").on("accordionactivate", function (event, ui) {
        //    $("#scheduler").data("kendoScheduler").refresh();
        //});
    })

function GetMembers() {
    var mem = [];
    $.each($("#membersMulti").data("kendoMultiSelect").value(), function () {
        mem.push({ UserId: this });
    })
    return mem;
}

function GetReminder() {
    var reminderdata = $("#scheduler").data("kendoScheduler").dataSource.data();
    if (reminderdata.length > 0) {

    }
    else {

    }
}

function addActivity(data) {
    $.ajax({
        type: 'POST',
        contentType: "application/json; charset=utf-8",
        url: MersalUIBaseUrl + 'Activities/Create',
        data: JSON.stringify(data),
        //async: false,
        headers: getHeaders(),
        //crossDomain: true,
        success: function (msg) { 
            document.getElementById("CreateForm").reset();
            //$("#scheduler").data("kendoScheduler").dataSource.data([]);;
            //$.ajax({
               
            //    url: '/Activities/deleteImagesSession',
            //    async: false,
            //    headers: getHeaders(),
            //    success: function (data) {
            //        toastr.success(SuccessfulProcess);
            //    },
            //    error: function (xhr) {
            //        toastr.error(xhr.statusText);
            //    }
            //});


        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });
        
}

    

function onUploadActivityImage(e, data) { 
    var x = e;
    var y = data;
}

$.fn.serializeObject = function () {

    var o = {};
    var a = this.serializeArray();
    $.each(a, function () {
        
        if (o.hasOwnProperty(this.name)) {
            //if (!o[this.name].push) {
            //    o[this.name] = [o[this.name]];
            //}
            //o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

