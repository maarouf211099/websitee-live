var GetAllRepresentativeDonationUrl = MersalWebAPIBaseUrl + "api/Donation/GetAllRepresentativeDonation";
var PostLoggingDetailsUrl = "/Logger/PostLoggerInformation"
var totalAmount = 0;
// kendo grid
$(function () {

    $('.modal').on('hide.bs.modal', function () {
        $("#grid").data("kendoGrid").dataSource.read();
    });

    var dataSource = new kendo.data.DataSource({
        transport: {
            read: {
                url: GetAllRepresentativeDonationUrl,
                dataType: "json",
                headers: getHeaders(),
            },
            parameterMap: function (options, type) {
                //if ($("input[type=radio][name=ridIsDone]").val() == "true")
                if ($("#hidIsDone").val() == 1) {
                    $.extend(options, { IsDone: true });
                }
                else if ($("#hidIsDone").val() == 0) {
                    $.extend(options, { IsDone: false });
                }
                else if ($("#hidIsDone").val() == 2) {
                    $.extend(options, { IsDone: true, IsConfirmed: true });
                }
               
                return options;
            },
        },
        schema: {
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
                    NameAnonymous: { type: "string" },
                    Phone: { type: "string" },
                    AddressAnonymous: { type: "string" },
                    EmailAnonymous: { type: "string" },
                    Amount: { type: "number" },
                    TitleName: { type: "string" },
                    DonationTypeAr: { type: "string" },
                    Code: { type:"string"},
                    CreatedOn: { type: "date" },
                    //DonationCase:{ type:"string"},
                }
            }
        },
        type: "json",
        pageSize: 10,
        requestEnd: onRequestEnd,
        serverPaging: true,
        serverFiltering: true,
        parameterMap: function (data, type) {
            if (type == "read") {
                return {
                    page: data.page,
                    pageSize: data.pageSize
                }
            }
        },
        serverSorting: true,
        
        aggregate: [
            { field: "Amount", aggregate: "sum" },
            { field: "ReceiptValue", aggregate: "sum" }
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
            fileName: "List Of RepresentativeDonation.xlsx",
            allPages: true,
            filterable: true

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
                //itemsPerPage: '@SystemCodesResources.ItemsPerPage',
                //display: '@SystemCodesResources.Items',
                //page: '@SystemCodesResources.Page',
                //of: '@SystemCodesResources.Of',
                //empty: '@SystemCodesResources.Empty'

                itemsPerPage: '',
                display: '',
                page: '',
                of: '',
                empty: ''
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
                field: "Id",
                title: 'Id',
                filterable: false,
                hidden: true,
            },
            {
                field: "NameAnonymous",
                title: NameAnonymous,
            },
            {
                field: "Code",
                title: CaseCode,

            },
            {
                field: "DonationTypeAr",
                title: DonationDestination,

            },

            //{
            //    field: "Case",
            //    title: DonationCase,
                
            //},
            {
                field: "Phone",
                title: PhoneNumberAnonymous,
                hidden: true
            },
            {
                field: "AddressAnonymous",
                title: AddressAnonymous,

            },
            //{
            //    field: "EmailAnonymous",
            //    title: EmailAnonymous,

            //},
            {
                field: "TitleName",
                title: TitleName,
            },
            {
                field: "Amount",
                title: Amount,
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
                field: "ReceiptValue",
                title: ReceiptValue,
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
            command: [
                {
                    name: "details",
                    text: "",
                    iconClass: "fa  fa-info-circle",
                    click: function (e) {
                        var tr = $(e.target).closest("tr");
                        var dataRow = this.dataItem(tr);
                        var rowIdx = $("tr", grid.tbody).index(tr);
                        getRepresentativeDonationDetails(dataRow.Id, rowIdx);
                    }
                },
             

            ]
            , title: Details, width: 90,
        },
    //    {
    //    command: [
         
    //         {
    //             name: "delete",
    //             text: "",
    //             iconClass: "fa fa-trash-o",
    //             click: function (e) {
    //                 var tr = $(e.target).closest("tr");
    //                 var dataRow = this.dataItem(tr);
    //                 var rowIdx = $("tr", grid.tbody).index(tr);
    //                 DeleteRepresentativeDonation(dataRow.Id);
    //             }
    //         },

    //    ]
    //    , title: Delete, width: 90,
    //}
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
            fileName: "List Of RepresentativeDonation.xlsx",
            allPages: true,
            filterable: true
        },
        columns: [
            {
                field: "Code",
                title: CaseCode,

            },
            {
                field: "DonationTypeAr",
                title: DonationDestination,

            },
            {
                field: "NameAnonymous",
                title: NameAnonymous,

            },
            {
                field: "Phone",
                title: Phone
            },
            {
                field: "AddressAnonymous",
                title: AddressAnonymous,

            },
            {
                field: "EmailAnonymous",
                title: EmailAnonymous,

            },
            {
                field: "TitleName",
                title: TitleName,
            },
            {
                field: "Amount",
                title: Amount,
                footerTemplate: "Sum: #= sum # "
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


});

kendo.culture(_culture);

function getRepresentativeDonationDetails(RepresentativeDonationId, rowIdx) {
    $("#RepresentativeDonationDetailsDiv").html("");
    $.ajax({
        url: "/Donation/RepresentativeDonationDetails/" + RepresentativeDonationId,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {            
            $("#imgAjaxLoader").hide();
            $("#RepresentativeDonationDetailsDiv").append(result);
            $('#RepresentativeDonationModals').modal('show');
            AddEventRepresentativeDonationForm();
            $("input[type=hidden][name=IsDone]").remove();
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}

function AddEventRepresentativeDonationForm() {
    var myForm = $("#EditRepresentativeDonationForm");
    myForm.submit(function (e) {
        $.validator.unobtrusive.parse(myForm)
        e.preventDefault();
        if (!myForm.valid()) return;
        //var url = "/Donation/EditRepresentativeDonation"
        var url = MersalWebAPIBaseUrl + "api/Donation/EditRepresentativeDonation"
        var data = {};
        $("#EditRepresentativeDonationForm").serializeArray().map(function (x) { data[x.name] = x.value; });
        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: url,
            headers: getHeaders(),
            data: JSON.stringify(data),
            async: false,
            success: function (data) {
                toastr.success(SuccessfulProcess);
                $('#RepresentativeDonationModals').modal('hide');
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

    $('#CaseId').on("keypress", function (e) {
        $(this).val($(this).val().trim());
        if (e.which === 32)
            return false;
    });

    $('#CaseId').on("blur", function (e) {
        $(this).val($(this).val().trim());
    });

} 
$("input[type=radio][name=ridIsDone]").change(function () {
    if ($(this).val() == "1") {
        $("#hidIsDone").val("1");
    }
    else if ($(this).val() == "2") {
        $("#hidIsDone").val("2");
    }
    else
        $("#hidIsDone").val("0");
    
   
        $("#grid").data("kendoGrid").dataSource.read();
        $("#grid").data("kendoGrid").refresh();
    
});

function ConfirmDeleteRepresentativeDonation(id) {
    var url = MersalWebAPIBaseUrl + "api/Donation/DeleteRepresentativeDonation?id=" + id
    $.ajax({
        type: "POST",
        contentType: "application/json",
        headers: getHeaders(),
        url: url,
        async: false,
        success: function (data) {
            toastr.success(SuccessfulProcess);
            $("#grid").data("kendoGrid").dataSource.read();
            $("#grid").data("kendoGrid").refresh();
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });
}

function DeleteRepresentativeDonation(id) {
    var CallBackFunction = function () { ConfirmDeleteRepresentativeDonation(id); };
    confirmMessageBootstrap(ConfirmDelete, sureDelete, 400, 250, CallBackFunction);
}

function ConfirmCollectRepresentativeDonation(id) {
    var url = MersalWebAPIBaseUrl + "api/Donation/CollectRepresentativeDonation?id=" + id
    $.ajax({
        type: "POST",
        contentType: "application/json",
        headers: getHeaders(),
        url: url,
        async: false,
        success: function (data) {
            toastr.success(SuccessfulProcess);
           // $("#btnSubmitEdit").click();
          //  document.getElementById('EditRepresentativeDonationForm').submit();
           // $("#RepresentativeDonationModals").modal('hide');
           // $("#grid").data("kendoGrid").dataSource.read();
           // $("#grid").data("kendoGrid").refresh();
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });
}


function ConfirmedByAccounts(id) {
    var url = MersalWebAPIBaseUrl + "api/Donation/ConfirmedByAccounts?id=" + id
    $.ajax({
        type: "POST",
        contentType: "application/json",
        headers: getHeaders(),
        url: url,
        async: false,
        success: function (data) {
            toastr.success(SuccessfulProcess);
            $("#RepresentativeDonationModals").modal('hide');
            $("#grid").data("kendoGrid").dataSource.read();
            $("#grid").data("kendoGrid").refresh();
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });
}

function confirmDonation(id) {
    var CallBackFunction = function () { ConfirmCollectRepresentativeDonationAndEdit(id); };
    confirmMessageBootstrap("", ConfirmCollectDonation, 400, 250, CallBackFunction);
}

function ConfirmCollectRepresentativeDonationAndEdit(id) {
    $("#btnSubmitEdit").click();
    ConfirmCollectRepresentativeDonation(id);
}


function confirmConfirmedByAccounts(id) {
    $("#btnSubmitEdit").click();
    var CallBackFunction = function () { ConfirmedByAccounts(id); };
    confirmMessageBootstrap("", confirmConfirmedByAccountsTitle, 400, 250, CallBackFunction);
}


function PrintElem(elem)
  {
      Popup($(elem).html());
  }

function Popup(data)
{
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
function PrintReset(voucherNumber, Date, representativeName, Amount, volunteerName, Address) {
    $("#voucherNumber").html(voucherNumber);
    $("#Date").html(Date);
    $("#representativeName").html(representativeName);
    $("#Amount").html(Amount);
    $("#volunteerName").html( volunteerName);
    $("#Address").html( Address);
    PrintElem("#PrintDIV");
}



