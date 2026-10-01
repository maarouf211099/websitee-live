
var GetAllDonationUrl = MersalWebAPIBaseUrl + "api/Donation/GetAllDonationOnline";
var PostLoggingDetailsUrl = "/Logger/PostLoggerInformation"
var HiddenColumns = ['phone', 'email']
var totalAmount = 0;

if (_cultureIsArabic) {
    var Code = "الكود";
}
else {
    var Code = "Code";
}

// kendo grid

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
                    Id: { type: "string" },
                    //Name: { type: "string" },
                    CreatedOn: { type: "date" },
                    //ValueAmount: { type: "string" },
                    //TitleName: { type: "string" },
                    DonationTypeAr: { type: "string" },
                    Address: { type: "string" },
                    Email: { type: "string" },
                    Phone: { type: "string" },
                    CaseId: { type: "string" },
                    PaymentTypeDescription: { type: "string" },

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
        height: 650,
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
                title: Code,
                filterable: {
                    operators: {
                        string: {
                            eq: IsEqualTo,
                            neq: IsNotEqualTo,
                        }
                    }
                }

            },
            {
                field: "AccountName",
                //headerAttributes: { style: "text-align:center" },
                title: DonationName
            },
            {
                field: "DonationTypeAr",
                title: DonationDestination,
            },
            {
                field: "CaseId",
                title: CaseCode,
                filterable: {
                    operators: {
                        string: {
                            eq: IsEqualTo,
                            neq: IsNotEqualTo,
                        }
                    }
                }
            },
            {
                field: "Address",
                title: address,
            },
            //{
            //    field: "Email",
            //    title: Email,
            //    attributes: {
            //        "class": "emailrow"
            //    },
            //    headerAttributes: {
            //        "class" : "email"
            //    }
            //},
            //{
            //    field: "Phone",
            //    title: Phone,

            //    headerAttributes: {
            //        "class": "phone"
            //    }
            //},
            {
                field: "ValueAmount",
                title: ValueAmount,
                footerTemplate: "Sum: #= sum # ",

                filterable: {
                    operators: {
                        string: {
                            eq: IsEqualTo,
                            gt: IsGreaterThan,
                            lt: IsLessThan
                        }
                    }
                }
            },
            {
                field: "PaymentTypeDescription",
                title: PaymentType,
                filterable: {
                    operators: {
                        string: {
                            eq: IsEqualTo,
                            neq: IsNotEqualTo,
                        }
                    }
                }
            },

            {
                field: "CreatedOn",
                title: CreatedOn,
                type: "date",
                format: "{0:d/M/yyyy h:mm tt}",
                parseFormats: ["MM/dd/yyyy h:mm:ss tt"],
                //filterable: false,
                filterable: {
                    extra: false, //do not show extra filters
                    operators: {
                        date: {
                            eq: IsEqualTo,
                            after: After,
                            befor: Before,
                        }
                    },
                    ui: function (element) {
                        if (_cultureIsArabic) {
                            kendo.culture("ar-EG");
                        }
                        element.kendoDatePicker({
                            format: "d/M/yyyy"
                        });
                    }
                }
                , width: 130

            }
        ],
         excelExport: function (e) {
            e.preventDefault();
         }
    });

    

    var hiddengrid = $("#gridTwo").kendoGrid({
        autobind: false,
        dataSource: dataSource,
        excel: {
            fileName: OnlineDonationExcelSheet,
            headerAttributes: { style: "text-align:center" },
            allPages: true,
            filterable: true
        },
        columns: [
            {
                field: "Id",
                title: Code
            },
            {
                field: "ValueAmount",
                title: ValueAmount,
                footerTemplate: "Sum: #= sum # ",
            },
            {
                field: "AccountName",
                title: DonationName
            },
            {
                field: "Address",
                title: address,
            },
            {
                field: "Email",
                headerAttributes: { style: "text-align:center" },
                title: Email,
            },
            {
                field: "CreatedOn",
                title: CreatedOn,
                type: "date",
                format: "{0:d/M/yyyy h:mm}",
                parseFormats: ["MM/dd/yyyy h:mm:ss"],
                width: 130
            },
            {
                field: "Phone",
                title: Phone,
            },
            {
                field: "CaseId",
                title: CaseCode
            },
            {
                field: "DonationTypeAr",
                title: DonationDestination
            },
            {
                field: "PaymentTypeDescription",
                title: PaymentType
            },

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
                logType : "ExcelExportLogger"
            }
        })
    });

    // Check on Privilege
    ExcelExportPrivilege == 'False' && $(".k-grid-toolbar").hide();

    $('.k-grid-filter').click(function () {
        $('.k-animation-container').addClass('k-rtl');
    });


});

kendo.culture(_culture);


function getDonationBankTransferDetails(DonationId, rowIdx) {
    $("#OnlineDonationDetailsDiv").html("");
    $.ajax({
        url: "/Donation/DonationBankTransferDetails" + '/' + DonationId,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#imgAjaxLoader").hide();

            $("#OnlineDonationDetailsDiv").append(result);
            $('#DonationBankTransferDetailsModals').modal('show');

            if (rowIdx == 1) {
                var grid = $("#grid").data("kendoGrid")
                var pageNumber = grid.dataSource.page();
                if (pageNumber == 1) {
                    $(".allowToUser").show();
                }
            }
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}


function ConfirmDonationBankTransfer() {
    var apiurl = MersalWebAPIBaseUrl + "api/Donation/ConfirmDonationBankTransfer?TransferId=" + $("#TransferIdHID").val() + "&ValueAmount=" + $("#ValueAmount").val();
    if ($("#ValueAmount").val() === "") {
        $("#ErrorValueAmount").html(PleaseAddValueAmount)
        return;
    }
    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: apiurl,
        crossDomain: true,
        headers: getHeaders(),
        async: true,
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (data) {
            $("#imgAjaxLoader").hide();
            $('#DonationBankTransferDetailsModals').modal('hide');
            data = JSON.parse(data);
            if (data.success == true) {
                sentNotificationToCommittee(data.NotificationSubject, data.NotificationBody, sessionStorage.getItem("Id"));
                toastr.success(SuccessfulProcess);
                $("#grid").data('kendoGrid').dataSource.read();
                $("#grid").data("kendoGrid").refresh();
            }
            else {
                $("#grid").data('kendoGrid').dataSource.read();
                $("#grid").data("kendoGrid").refresh();
                //toastr.error(ErrorMessage);
                console.log(ErrorMessage);
            }
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });

}



function datePicker(args) {

    args.element.kendoDatePicker({
        format: "dd/MM/yyyy"
    });

}