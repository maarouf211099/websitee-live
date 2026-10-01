var GetAllDonationUrl = MersalWebAPIBaseUrl + "api/Donation/GetAllDonateThroughOtherMeans";
var PostLoggingDetailsUrl = "/Logger/PostLoggerInformation"
var totalAmount = 0;
$(function () {
    $('.modal').on('hide.bs.modal', function () {
        $("#grid").data("kendoGrid").dataSource.read();
    });



    var dataSource = new kendo.data.DataSource({
        transport: {
            read: {
                url: GetAllDonationUrl,
                dataType: "json",
                headers: getHeaders()

            },
            parameterMap: function (options, type) {
                if ($("#hidIsDone").val() == "true") {
                    $.extend(options, { IsDone: true });
                }
                else
                    $.extend(options, { IsDone: false });

                return options;
            },
        },
        schema: {
            //total: data.Total,
            total: function (data) {
                totalAmount = data.Aggregates;
                if (totalAmount != null)
                    $("#TotalAmount").text("أجمالى التبرعات " + totalAmount.toString());
                return data.Total;

            },
            data: function (data) {

                return data.Data;
            },

            model: {
                Id: "Id",
                fields: {
                    Id: { type: "number" },
                    Name: { type: "string" },
                    ValueAmount: { type: "number" },
                    TransferNumber: { type: "string" },
                    CreatedOn: { type: "date" },
                    TransferDate: { type: "date" },
                    CaseId: { type: "string" },
                }
            }
        },

        type: "json",
        pageSize: 10,
        requestEnd: onRequestEnd,
        serverPaging: true,
        serverFiltering: true,

        serverSorting: true,
        aggregate: [
            { field: "ValueAmount", aggregate: "sum" }
        ]
    });

    function onRequestEnd(e) {

        if (e.response.Data && e.response.Data.length) {
            var data = e.response.Data;
            if (e.type == "read") {
                //loopRecords(data);
            }
        }
    }
    function loopRecords(data) {
        for (var i = 0; i < data.length; i++) {
            var creationDate = data[i].CreatedOn;
            var dt = new Date(creationDate);
            dt.setHours(dt.getHours() + 2);

            data[i].CreatedOn = dt;
        }
    }

    $("#grid").kendoGrid({
        toolbar: [{
            name: "excel",
            text: ExeportToExcel,
        }],
        excel: {
            fileName: "List-Of-Online-Donations.xlsx",
            allPages: true,
            filterable: true,
        },

        dataSource: dataSource,
        //height: 650,
        //filterable: true,
        filterable: {
            extra: false,
            operators: {
                string: {
                    eq: IsEqualTo,
                    neq: IsNotEqualTo,
                    startswith: StartsWith,
                    contains: Contains,
                    doesnotcontain: doesnotcontain,
                    endswith: endswith,

                }
            },
            messages: {
                info: "",
                filter: Filter,
                clear: Clear,

            }

        },
        sortable: true,
        pageable: {
            messages: {
                itemsPerPage: itemsPerPage,
                display: display,
                page: page,
                of: of,
                empty: empty
            },

            refresh: true,
            pageSizes: true,
            buttonCount: 5
        },
        noRecords: {
            template: function (e) {
                var page = $("#grid").getKendoGrid().dataSource.page();
                return "No data available on current page. Current page is: " + page;
            }
        },
        resizable: true,
        width: '100%',
        sortable: false,
        groupable: {
            messages: {
                empty: DragaColumnHeaderAndDropItHereToGroupByThatColumn,//Drag a column header and drop it here to group by that column"
            }
        },
        columns: [

            {
                field: "Id",
                title: 'Id',
                filterable: false,
                hidden: true,
            },
            {
                field: "DonationName",
                title: DonationName,
            },
            {
                field: "DonationDestinationAr",
                title: DonationDestination,
            },
            {
                field: "CaseId",
                title: CaseCode,

            },
            {
                field: "ValueAmount",
                title: ValueAmount,
                footerTemplate: "Sum: #= sum # ",
                filterable: {
                    operators: {
                        number: {
                            eq: IsEqualTo,
                            gt: IsGreaterThan,
                            lt: IsLessThan
                        }
                    }
                }

            },
            {
                field: "TransferNumber",
                title: TransferNumber,

            },
            {
                field: "DonationOtherWayNameAr",
                title: DonationOtherWayName,

            },
            {
                field: "CurencyAr",
                title: Curency,

            },
            {
                field: "TransferDate",
                title: TransferDate,
                type: "date",
                format: "{0:d/M/yyyy h:mm tt}",
                parseFormats: ["MM/dd/yyyy h:mm:ss tt"],
                //filterable: false,
                filterable: {
                    messages: {
                        and: AndOperator,
                        or: OrOperator
                    },
                    extra: true,
                    operators: {
                        date: {
                            eq: IsEqualTo,
                            gt: After,
                            lt: Before,
                        }
                    },
                    ui: function (element) {
                        if (_cultureIsArabic) {
                            kendo.culture("ar-EG");
                        }
                        element.kendoDatePicker({
                            format: "0:d/M/yyyy h:mm"
                        });
                    }
                }
                , width: 130
            },
            {
                field: "CreatedOn",
                title: CreatedOn,
                type: "date",
                format: "{0:d/M/yyyy h:mm tt}",
                parseFormats: ["MM/dd/yyyy h:mm:ss tt"],
                //filterable: false,
                filterable: {
                    messages: {
                        and: AndOperator,
                        or: OrOperator
                    },
                    extra: true,
                    operators: {
                        date: {
                            eq: IsEqualTo,
                            gt: After,
                            lt: Before,
                        }
                    },
                    ui: function (element) {
                        if (_cultureIsArabic) {
                            kendo.culture("ar-EG");
                        }
                        element.kendoDatePicker({
                            format: "0:d/M/yyyy h:mm"
                        });
                    }
                }
                , width: 130
            },
            {
                field: "Phone",
                title: 'Phone',
                filterable: false,
                hidden: true,
            },
            {
                command: [
                    {
                        name: "details",
                        text: "",
                        iconClass: "fa  fa-info-circle",
                        click: function (e) {
                            var tr = $(e.target).closest("tr");
                            var dataRow = this.dataItem(tr);
                            var rowIdx = $("tr", grid.tbody).index(tr);
                            getDonateThroughOtherMeansDetails(dataRow.Id, rowIdx);
                        }
                    },




                ]
                , title: Details, width: 90,
            },
        ],
        excelExport: function (e) {
            e.preventDefault();


        }


    });



    var hiddengrid = $("#gridTwo").kendoGrid({
        autobind: false,
        dataSource: dataSource,
        excel: {
            fileName: "List-Of-Donations-with-Other-Means.xlsx",
            allPages: true,
            filterable: true
        },
        columns: [
            {
                field: "DonationDestinationAr",
                title: DonationDestination,

            },
            {
                field: "CaseId",
                title: CaseCode,

            },
            {
                field: "DonationName",
                title: DonationName,

            },
            {
                field: "Phone",
                title: Phone,
            },
            {
                field: "ValueAmount",
                title: ValueAmount,
                footerTemplate: "Sum: #= sum # "

            },
            {
                field: "TransferNumber",
                title: TransferNumber,

            },
            {
                field: "DonationOtherWayNameAr",
                title: DonationOtherWayName,

            },
            {
                field: "CurencyAr",
                title: Curency,

            },
            {
                field: "TransferDate",
                title: TransferDate,
                type: "date",
                format: "{0:d/M/yyyy h:mm}",
                parseFormats: ["MM/dd/yyyy h:mm:ss"],
            },
            {

                field: "CreatedOn",
                title: CreatedOn,
                type: "date",
                format: "{0:d/M/yyyy h:mm}",
                parseFormats: ["MM/dd/yyyy h:mm:ss"],
            }
        ],
        noRecords: true,
        dataBound: function () {
            $("#gridTwo").replaceWith('<div></div>')
        },
    }).data("kendoGrid");



    // onClick Data Logging
    $(".k-grid-excel").click(function () {

        hiddengrid.dataSource.read().then(function () {
            hiddengrid.saveAsExcel();
        });


        $.ajax({
            url: PostLoggingDetailsUrl,
            type: "POST",
            dataType: "text",
            cache: false,
            data: {
                UserName: UserName,
                logType: "ExcelExportLogger"
            }
        })
    });

    // Check on Privilege
    //  ExcelExportPrivilege == 'False' && $(".k-grid-toolbar").hide();

    $('.k-grid-filter').click(function () {
        $('.k-animation-container').addClass('k-rtl');
    });


});

kendo.culture(_culture);



function getDonateThroughOtherMeansDetails(id, rowIdx) {
    $("#DonateThroughOtherMeansDiv").html("");
    $.ajax({
        url: "/Donation/DonateThroughOtherMeansDetails/" + id,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {

            $("#imgAjaxLoader").hide();
            $("#DonateThroughOtherMeansDiv").append(result);
            $('#DonateThroughOtherMeansModel').modal('show');
            AddEventDonateThroughOtherMeansForm();
            $("input[type=hidden][name=IsDone]").remove();
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}



function AddEventDonateThroughOtherMeansForm() {
    var myForm = $("#EditDonationByOthersTransfareForm");
    myForm.submit(function (e) {
        $.validator.unobtrusive.parse(myForm)
        e.preventDefault();
        if (!myForm.valid()) return;
        //var url = "/Donation/EditRepresentativeDonation"
        var url = MersalWebAPIBaseUrl + "api/Donation/UpdateOtherTransfareDonation"
        var data = {};
        $("#EditDonationByOthersTransfareForm").serializeArray().map(function (x) { data[x.name] = x.value; });

        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: url,
            headers: getHeaders(),
            data: JSON.stringify(data),
            async: false,
            success: function (data) {
                toastr.success(SuccessfulProcess);
                $('#DonateThroughOtherMeansModel').modal('hide');
                $("#grid").data("kendoGrid").dataSource.read();
                $("#grid").data("kendoGrid").refresh();
            },
            error: function (xhr) {
                toastr.error(xhr.statusText);
            }
        });
    });

    //$("#IsDone").change(function () {
    //    if ($(this).is(':checked')) {
    //        $("[name='IsDone']").val(true);
    //    } else { 
    //        $("[name='IsDone']").val(false);
    //    }
    //});



}


function confirmedByAccountsDonateThroughOtherMeans(id) {
    var CallBackFunction = function () { ConfirmedByAccountsDonateThroughOtherMeans(id); };
    confirmMessageBootstrap("", confirmConfirmedByAccountsTitle, 400, 250, CallBackFunction);
}

function ConfirmedByAccountsDonateThroughOtherMeans(id) {
    var myForm = $("#EditDonationByOthersTransfareForm");
    $.validator.unobtrusive.parse(myForm)
    if (!myForm.valid()) return;
    //var url = "/Donation/EditRepresentativeDonation"
    var url = MersalWebAPIBaseUrl + "api/Donation/UpdateOtherTransfareDonation"
    var data = {};
    $("#EditDonationByOthersTransfareForm").serializeArray().map(function (x) { data[x.name] = x.value; });
    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: url,
        headers: getHeaders(),
        data: JSON.stringify(data),
        async: false,
        success: function (data) {
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
            return;
        }
    });

    var url = MersalWebAPIBaseUrl + "api/Donation/ConfirmCollectDonateThroughOtherMeans?id=" + id + "&amount=" + $('#Amount').val();
    $.ajax({
        type: "POST",
        contentType: "application/json",
        headers: getHeaders(),
        url: url,
        async: false,
        success: function (data) {
            toastr.success(SuccessfulProcess);
            $("#DonateThroughOtherMeansModel").modal('hide');
            $("#grid").data("kendoGrid").dataSource.read();
            $("#grid").data("kendoGrid").refresh();
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });
}

$("input[type=radio][name=ridIsDone]").change(function () {
    if ($(this).val() == "true") {
        $("#hidIsDone").val(true);
    } else
        $("#hidIsDone").val(false);


    $("#grid").data("kendoGrid").dataSource.read();
    $("#grid").data("kendoGrid").refresh();

});


