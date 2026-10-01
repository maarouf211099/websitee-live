

var MonthlyCasesRequestURL = MersalWebAPIBaseUrl + "api/monthlyCasesAPI/GetRequestCases?RequestId=" + RequestId;

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

                return data.Data;
            },

            model: {
                Id: "Id",
                fields: {
                    Id: { type: "number" },
                    CaseCode: { type: "string" },
                    CaseName: { type: "string" },
                    Amount: { type: "string" },
                   
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
            filterable: false

        },
        dataSource: dataSource,
        //filterable: {
        //    extra: false
        //},
        filterable: false,

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
                 field: "CaseCode",
                 title: CaseCode,
             },
            {
                field: "CaseName",
                title: CaseName,
            },
            {
                field: "Amount",
                title: Amount,
            },
         {
             command: [
                 {
                     name: "delete",
                     text: "",
                     iconClass: "fa fa-trash-o",
                     click: function (e) {
                         var tr = $(e.target).closest("tr");
                         var dataRow = this.dataItem(tr);
                         var rowIdx = $("tr", grid.tbody).index(tr);
                         DeleteCase(dataRow.Id);
                     }
                 },
             ]
         },
       
        ]
    });

    $('.k-grid-filter').click(function () {
        $('.k-animation-container').addClass('k-rtl');
    });


});

kendo.culture(_culture);
function ConfirmDeleteCase(id) {
    var url = MersalWebAPIBaseUrl + "api/monthlyCasesAPI/DeleteCaseFromRequest?id=" + id
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
            location.reload();
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });
}

function DeleteCase(id) {
    var CallBackFunction = function () { ConfirmDeleteCase(id); };
    confirmMessageBootstrap(ConfirmDelete, sureDelete, 400, 250, CallBackFunction);
}
