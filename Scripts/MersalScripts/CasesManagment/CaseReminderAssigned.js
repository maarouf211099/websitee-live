var GetAllCasesUrl = MersalWebAPIBaseUrl + "api/Case/GetAllCaseReminderAssigned";

kendo.culture(_culture);


function RefreshGird() {
    var krtl = "";
    if (_cultureIsArabic) {
        krtl = "k-rtl";
    }
    $('#panelGrid').html('<div id="grid" class="' + krtl + '"></div>');
    BindGrid();
}

function BindGrid() {
    $('.modal').on('hide.bs.modal', function () {
        $("#grid").data("kendoGrid").dataSource.read();
        $("#grid").data('kendoGrid').refresh();
    });

    var dataSource = new kendo.data.DataSource({
        transport: {
            read: {
                url: GetAllCasesUrl,
                dataType: "json",
                headers: getHeaders(),
            },
            parameterMap: function (options, operation) {
                return addParameterMapToGrid(options)
            },
        },
        change: function (e) {
            //if (dataSource.filter()) {
            //    $("#IsFilters").val("Filter");
            //}
            //else {
            //    $("#IsFilters").val("NoFilter");
            //}
        },
        schema: {
            total: function (data) {
                return data.Total;

            },
            data: function (data) {

                return data.Data;
            }
            ,
            model: {
                Id: "ReminderId",
                fields: {
                    CaseId: { type: "number" },
                    CaseName: { type: "string" },
                    User: { type: "string" },
                    Start: { type: "date" },
                    End: { type: 'date' },
                    Title: { type: "string" },
                    Description: { type: 'string' }
                }
            }
        },
        type: "json",
        pageSize: 10,
        serverPaging: true,
        serverFiltering: true,
        serverSorting: true,

    });

    $("#grid").kendoGrid({
        toolbar: [
            {
                name: "excel",
                text: ExeportToExcel,
            }
        ],
        excel: {
            fileName: "List-Of-Task-Assigned.xlsx",
            allPages: true,
            filterable: true

        },
        dataBound: function (e) {
        },
        dataSource: dataSource,
        filterable: {
            extra: false,
            messages: {
                info: "",
                filter: Filter,
                clear: Clear,
            },
            operators: {
                string: {
                    eq: IsEqualTo,
                    neq: IsNotEqualTo,
                    startswith: StartsWith,
                    contains: Contains,
                    doesnotcontain: doesnotcontain,
                    endswith: endswith,
                }
            }
        },
        filterable: false,
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
            buttonCount: 10
        },
        resizable: true,
        width: '100%',
        scrollable: true,
        sortable: false,
        groupable: {
            messages: {
                empty: DragaColumnHeaderAndDropItHereToGroupByThatColumn, //Drag a column header and drop it here to group by that column"
            }
        },
        columns: [
            {
                field: "CaseId",
                title: CaseCode,
                locked: true,
                lockable: false,
                filterable: {
                    operators: {
                        string: {
                            eq: IsEqualTo,
                            neq: IsNotEqualTo,
                        }
                    }
                },
                width: 100,
            },
            {
                field: "CaseName",
                title: CaseName,
                width: 225,
                locked: true,
            },
            {
                field: "User",
                title: Delegate,
                width: 250,
            },{
                field: "Start",
                title: DateFrom,
                type: "date",
                format: "{0:d/M/yyyy}",
                parseFormats: ["MM/dd/yyyy"],
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
                , width: 170
            },
            {
                field: "End",
                title: DateTo,
                type: "date",
                format: "{0:d/M/yyyy}",
                parseFormats: ["MM/dd/yyyy"],
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
                , width: 170
            },
            {
                field: "Title",
                title: Title,
                width: 160,
            },
            {
                field: "Description",
                title: Description,
                type: "string",
                width: 160,
            }
            
            
        ]
    });
    $('.k-grid-filter').click(function () {
        $('.k-animation-container').addClass('k-rtl');
    });

    
    $("#grid").data("kendoGrid")//.bind("filterMenuInit", filterMenuInit);

};

function addParameterMapToGrid(options) {
    $.extend(options, { _culture: _culture });
    return options;
}

RefreshGird();












