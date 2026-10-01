

var GetAllDonationUrl = MersalWebAPIBaseUrl + "api/Donation/GetAllDonationByBankTransfer";
var PostLoggingDetailsUrl = "/Logger/PostLoggerInformation"


var totalAmount=0;
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
                headers: getHeaders(),
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
            total: function (data) {
               // console.log(data.Aggregates);
                totalAmount = data.Aggregates;
                if (totalAmount != null)
                    $("#TotalAmount").text("أجمالى التبرعات "+totalAmount.toString());
                return data.Total;

            },
            data: function (data) {

                return data.Data;
            },
            
            model: {
                Id: "Id",
                fields: {
                    Id: { type: "number" },
                    //Name: { type: "string" },
                    CreatedOn: { type: "date" },
                    Phone: { type: "string" },
                    ValueAmount: { type: "number" },
                    DonationTypeAr: { type: "string" },
                    TitleName: { type: "string" },
                    DonationTypeAr: { type: "string" },
                    //DonationCase: { type: "string" },
                    CaseId: { type: "string" },
                    AccountName: { type: "string" },

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

    function onRequestEnd (e) {
        debugger;
        if (e.response.Data && e.response.Data.length) {
            var data = e.response.Data;
            if ( e.type == "read") {
         
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
            fileName: "List Of Cases.xlsx",
            allPages: true,
            filterable: false

        },
        dataSource: dataSource,
        //filterable: {
        //    extra: false
        //},
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
                field: "DonationName",
                title: DonationName,

            },
            {
                field: "DonationTypeAr",
                title: DonationDestination,
                filterable: true
            },
            {
                field: "CaseId",
                title: CaseCode,
                filterable: true
            },
            {
                field: "Id",
                title: 'Id',
                filterable: false,
                hidden: true,
            },
            //{
            //    field: "AccountName",
            //    title: AccountName,

            //},
            //{
            //    field: "TitleName",
            //    title: TitleName,
            //},
            {
                field: "ValueAmount",
                title: ValueAmount,
                aggregates: ["sum"],
                footerTemplate: "Sum: #=sum#"    ,
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
                field: "CreatedOn",
                title: CreatedOn,
                type: "date",
                format: "{0:d/M/yyyy h:mm tt}",
                parseFormats: ["MM/dd/yyyy h:mm:ss tt"],
               
               // editor: customDateTimePickerEditor,
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
                command: [
                    {
                        name: "details",
                        text: "",
                        iconClass: "fa  fa-info-circle",
                        click: function (e) {
                            var tr = $(e.target).closest("tr");
                            var dataRow = this.dataItem(tr);
                            var rowIdx = $("tr", grid.tbody).index(tr);
                            getDonationBankTransferDetails(dataRow.Id, rowIdx);
                        }
                    },

                ], title: Details, width: 90,
            }
        ],
        excelExport: function (e) {
            e.preventDefault();
        }
    });

   

    $('.k-grid-filter').click(function () {
        $('.k-animation-container').addClass('k-rtl');
    });

    var hiddengrid = $("#gridTwo").kendoGrid({
        autobind: false,
        dataSource: dataSource,
        excel: {
            fileName: "List Of Donation by bank transfer.xlsx",
            allPages: true,
            filterable: true
        },
        columns: [
            {
                field: "DonationName",
                title: DonationName
            },
            {
                field: "Phone",
                title: Phone
            },
            {
                field: "DonationTypeAr",
                title: DonationDestination
            },
            {
                field: "CaseId",
                title: CaseCode
            },

            {
                field: "AccountName",
                title: AccountName

            },
            {
                field: "TitleName",
                title: TitleName
            },
            {
                field: "ValueAmount",
                title: ValueAmount,
                aggregates: ["sum"],
                footerTemplate: "Sum: #=sum#"
            },
            {
                field: "CreatedOn",
                title: CreatedOn,
                type: "date",
                format: "{0:d/M/yyyy h:mm}",
                parseFormats: ["MM/dd/yyyy h:mm:ss"]
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


});

kendo.culture(_culture);


function getDonationBankTransferDetails(DonationId, rowIdx) {
    $("#DonationBankTransferDetailsDiv").html("");
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

            $("#DonationBankTransferDetailsDiv").append(result);
            $('#DonationBankTransferDetailsModals').modal('show');
            AddEventDonateByBankTransferForm();
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

function AddEventDonateByBankTransferForm() {
    var myForm = $("#DonationbyBankTransferForm");
    myForm.submit(function (e) {
        console.log(myForm);
        $.validator.unobtrusive.parse(myForm)
        e.preventDefault();
        if (!myForm.valid()) return;
        //var url = "/Donation/UpdateBankTransfareDonation"
        var url = MersalWebAPIBaseUrl + "api/Donation/UpdateBankTransfareDonation"
        var data = {};
        $("#DonationbyBankTransferForm").serializeArray().map(function (x) { data[x.name] = x.value; });

        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: url,
            headers: getHeaders(),
            data: JSON.stringify(data),
            async: false,
            success: function (data) {
                toastr.success(SuccessfulProcess);
                $('#DonationBankTransferDetailsModals').modal('hide');
                $("#grid").data("kendoGrid").dataSource.read();
                $("#grid").data("kendoGrid").refresh();
            },
            error: function (xhr) {
                toastr.error(xhr.statusText);
            }
        });
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

function ConfirmDonationBankTransfer() {
    var myForm = $("#DonationbyBankTransferForm");
        $.validator.unobtrusive.parse(myForm)
        if (!myForm.valid()) return;
        var data = {};
        $("#DonationbyBankTransferForm").serializeArray().map(function (x) { data[x.name] = x.value; });
        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: MersalWebAPIBaseUrl + "api/Donation/UpdateBankTransfareDonation",
            headers: getHeaders(),
            data: JSON.stringify(data),
            async: false,
            success: function (data) {
            },
            error: function (xhr) {
                toastr.error(xhr.statusText);
            }
        });
    
    var apiurl = MersalWebAPIBaseUrl + "api/Donation/ConfirmDonationBankTransfer?TransferId=" + $("#TransferIdHID").val() + "&ValueAmount=" + $("#ValueAmount").val() + "&FCYRate=" + $("#FCYRate").val();
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

function confirmConfirmedByAccounts(id) {
    var CallBackFunction = function () { ConfirmedByAccountsDonationBankTransfer(id); };
    confirmMessageBootstrap("", confirmConfirmedByAccountsTitle, 400, 250, CallBackFunction);
}

function ConfirmedByAccountsDonationBankTransfer() {
     
    var apiurl = MersalWebAPIBaseUrl + "api/Donation/ConfirmedByAccountsDonationBankTransfer?TransferId=" + $("#TransferIdHID").val() + "&ValueAmount=" + $("#ValueAmount").val();
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
            toastr.success(SuccessfulProcess);
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
