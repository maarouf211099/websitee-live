

var MonthlyCasesRequestURL = MersalWebAPIBaseUrl + "api/monthlyCasesAPI/GetMonthlyCasesRequests";

// kendo grid
$(function () {
    $('.modal').on('hide.bs.modal', function () {
        try {
            $("#grid").data("kendoGrid").dataSource.read();
        } catch (e) {

        }
    });

    var dataSource = new kendo.data.DataSource({
        transport: {
            read: {
                url: MonthlyCasesRequestURL,
                dataType: "json",
                headers: getHeaders(),
            },
            parameterMap: function (options, type) {
                return options;
            },
        },
        schema: {
            total: function (data) {
                return data.Total;

            },
            data: function (data) {
                debugger;
                return data.Data;
            },

            model: {
                Id: "Id",
                fields: {
                    Id: { type: "number" },
                    Title: { type: "string" },
                    Description: { type: "string" },
                    TypeAr: { type: "string" },
                    CaseCount: { type: "number" },
                    Total: { type: "number" },
                    CreatedOn: { type: "date" },
                }
            }
        },
        type: "json",
        pageSize: 10,
        serverPaging: true,
        serverFiltering: true,
        serverSorting: true
    });



    $("#grid").kendoGrid({

        toolbar: [{
            name: "excel",
            text: ExeportToExcel,
        }],
        excel: {
            fileName: "List Of MonthlyCases.xlsx",
            allPages: true,
            filterable: false, 
        },
        dataSource: dataSource,
        filterable: {
            extra: false,
            operators: {
                string: {
                    eq: IsEqualTo,
                    neq: IsNotEqualTo,
                    startswith: StartsWith,
                    contains: Contains,
                    doesnotcontain: doesnotcontain,
                    endswith: endswith
                }
            },
            messages: {
                info: "",
                filter: Filter,
                clear: Clear,
                and: AndOperator,
                or: OrOperator
            }

        },
        //filterable: false,

        sortable: true,
        pageable: {
              messages: {
                info: "",
                filter: Filter,
                clear: Clear,
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
                 field: "TypeAr",
                 title: Type,
             },
             {
                field: "Title",
                title: Title,
             },
             {
                 field: "Description",
                 title: Description,
             },
           
             {
                   field: "CaseCount",
                 title: CaseCount,
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
                field: "Total",
                 title: Total,
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
             command: [
                     {
                         name: "ShowRequestCases",
                         text: "",
                             iconClass: "fa  fa-info-circle",
                         click: function (e) {
                             var tr = $(e.target).closest("tr");
                             var dataRow = this.dataItem(tr);
                             var rowIdx = $("tr", grid.tbody).index(tr);
                             DetailsUrl = MersalUIBaseUrl + "/monthlyCase/RequestCasesDetails/" + dataRow.Id;
                             var win = window.open(DetailsUrl, '_blank');
                             win.focus();

                         }
                     },
               
              

            ], title: Details, width: 90,
        },
            {
                command: [

                          {
                                 name: "CashReciept",
                                 text: "",
                                 iconClass: "fa fa-files-o",
                                 click: function (e) {
                                     var tr = $(e.target).closest("tr");
                                     var dataRow = this.dataItem(tr);
                                     //var rowIdx = $("tr", grid.tbody).index(tr);
                                     GetRequestReciept(dataRow.Id);
                                 }
                             },

                ]
                  , title: Cases, width: 90,
            }
        ]
    });

    $('.k-grid-filter').click(function () {
        $('.k-animation-container').addClass('k-rtl');
    });


});

kendo.culture(_culture);
function GetRequestReciept(RequestId) {
    $("#RequestDetails").html("");
    $.ajax({
        url: "/monthlyCase/GetRequestReciept?id=" + RequestId,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
         $("#imgAjaxLoader").hide();
            $("#RequestDetails").append(result);
            $('#RequestRecieptModals').modal('show');
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}