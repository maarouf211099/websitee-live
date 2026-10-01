
var GetAllDonationStatisticsUrl = MersalWebAPIBaseUrl + "api/DonationStatistics/GetAllDonationStatistics";
var PostLoggingDetailsUrl = "/Logger/PostLoggerInformation"
//var HiddenColumns = ['phone', 'email']

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
                url: GetAllDonationStatisticsUrl,
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
                return data.Total;
            },
            data: function (data) {
                return data.Data;
            },

            model: {
                Id: "Id",
                fields: {
                    Id: { type: "string" },
                    Code: { type: "string" },
                    NameArabic: { type: "string" },
                    NameEnglish: { type: "string" },
                    Value: { type: "number" },
                    TargetValue: { type: "string" }
                }
            }
        },

        type: "json",
        pageSize: 10,
        serverPaging: true,
        serverFiltering: true,
        serverSorting: true,
        //aggregate: [
        //    { field: "ValueAmount", aggregate: "sum" }
        //]
    });

    
    $("#grid").kendoGrid({
        toolbar: [{
            name: "excel",
            text: ExeportToExcel,
        }],
        excel: {
            fileName: "List-Of-Donation-Statistics.xlsx",
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
                title: 'Id',
                filterable: false,
                hidden: true
            },
            {
                field: "Code",
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
                field: "NameArabic",
                title: NameArabic,

            },
            {
                field: "NameEnglish",
                title: NameEnglish,

            },
            {
                field: "Value",
                title: Value,

            },
            {
                field: "TargetValue",
                title: TargetValue,

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
                            getDonationStatisticsDetails(dataRow.Id, rowIdx);
                        }
                    },




                ]
                , title: Details, width: 90,
            }
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

            //{
            //    field: "CreatedOn",
            //    title: CreatedOn,
            //    type: "date",
            //    format: "{0:d/M/yyyy h:mm}",
            //    parseFormats: ["MM/dd/yyyy h:mm:ss"],
            //    //filterable: false,
            //    filterable: {
            //        extra: false, //do not show extra filters
            //        operators: {
            //            date: {
            //                eq: IsEqualTo,
            //                after: After,
            //                befor: Before,
            //            }
            //        },
            //        ui: function (element) {
            //            if (_cultureIsArabic) {
            //                kendo.culture("ar-EG");
            //            }
            //            element.kendoDatePicker({
            //                format: "d/M/yyyy"
            //            });
            //        }
            //    }
            //    , width: 130

            //}
        ],
         excelExport: function (e) {
            e.preventDefault();
             
            
         }

        
    });

    

    var hiddengrid = $("#gridTwo").kendoGrid({
        autobind: false,
        dataSource: dataSource,
        excel: { allPages: true },
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

function getDonationStatisticsDetails(id, rowIdx) {
    $("#DonationStatisticsDetailsDiv").html("");
    $.ajax({
        url: "/Donation/DonationStatisticsDetails/" + id,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {

            $("#imgAjaxLoader").hide();
            $("#DonationStatisticsDetailsDiv").append(result);
            $('#DonationStatisticsModel').modal('show');
            AddEventEditDonationStatisticsForm();
            $("input[type=hidden][name=IsDone]").remove();
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}

function AddEventEditDonationStatisticsForm() {
    var myForm = $("#EditDonationStatisticsForm");
    myForm.submit(function (e) {
        debugger;
        $.validator.unobtrusive.parse(myForm)
        e.preventDefault();
        if (!myForm.valid()) return;
        //var url = "/Donation/EditRepresentativeDonation"
        var url = MersalWebAPIBaseUrl + "api/DonationStatistics/Update"
        var data = {};
        $("#EditDonationStatisticsForm").serializeArray().map(function (x) { data[x.name] = x.value; });
        data.Code = $("#Code").val();
        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: url,
            headers: getHeaders(),
            data: JSON.stringify(data),
            async: false,
            success: function (data) {
                toastr.success(SuccessfulProcess);
                $('#DonationStatisticsModel').modal('hide');
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