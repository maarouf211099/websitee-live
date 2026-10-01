var GetAllCasesSearchUrl = MersalWebAPIBaseUrl + "api/Case/GetAllCases";

kendo.culture(_culture);

function addParameterMapToGrid(options) {
    $.extend(options, { filterByState: "1" });
    $.extend(options, { _culture: _culture });
    return options;
}

function RefreshGird() {
    var krtl = "";
    if (_cultureIsArabic) {
        krtl = "k-rtl";
    }
    $('#panelGrid').html('<div id="grid" class="' + krtl + '"></div>');
    BindGrid();
}

function AgeFilter(element) {
    element.kendoDropDownList({
        dataSource: [
            { text: Babys, value: "Babys" },
            { text: Children, value: "Children" },
            { text: Youth, value: "Youth" },
            { text: Older, value: "Older" }
        ],
        dataTextField: "text",
        dataValueField: "value",
        optionLabel: " "
    });
}

function filterMenuInit(e) {
    if (e.field === "Age") {
        var firstValueDropDown = e.container.find("select:eq(0)").data("kendoDropDownList");

        setTimeout(function () {
            firstValueDropDown.wrapper.hide();
        });
    }
}


function BindGrid() {
    $('.modal').on('hide.bs.modal', function () {
        $("#grid").data("kendoGrid").dataSource.read();
        $("#grid").data('kendoGrid').refresh();
    });

    var dataSource = new kendo.data.DataSource({
        transport: {
            read: {
                url: GetAllCasesSearchUrl,
                dataType: "json",
                headers: getHeaders(),
            },
            parameterMap: function (options, operation) {
                return addParameterMapToGrid(options)
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
                    Id: { type: "string" },
                    Name: { type: "string" },
                    Description: { type: "string" },
                    Mobile: { type: "string" },
                    Phone: { type: "string" },
                    Age: { type: 'string' },
                    NationalityName: { type: 'string' },
                    Governorate: { type: 'string' },
                    District: { type: 'string' },
                    Region: { type: "string" },
                    ServiceName: { type: "string" },
                    DisesName: { type: "string" },
                    CreatedOn: { type: "date" },
                    ReligionName: { type: 'string' },
                    StatusInEgyptName: { type: 'string' },
                    GenderName: { type: 'string' },
                    CaseStatus: { type: 'string' }
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
            fileName: "List Of Cases.xlsx",
            allPages: true,
            filterable: true

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
        //filterable : true,
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
        groupable: {
            messages: {
                empty: DragaColumnHeaderAndDropItHereToGroupByThatColumn, //Drag a column header and drop it here to group by that column"
            }
        },
        columns: [
            {
                field: "Id",
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
                template: "<a href='/CasePrescriptionPayment/FastCasePayment?CaseId=#=Id#&CaseName=#=Name#' target='_blank'>#=Id#</a>",
            },
            {
                field: "Name",
                title: CaseName,
                width: 200,
                locked: true,
                template: "<a href='/CasePrescriptionPayment/FastCasePayment?CaseId=#=Id#&CaseName=#=Name#' target='_blank'>#=Name#</a>",

            },
            {
                command: [
                    {
                        name: "Report",
                        text: "",
                        iconClass: "fa fa-print",
                        click: function (e) {
                            var tr = $(e.target).closest("tr");
                            var dataRow = this.dataItem(tr);
                            var rowIdx = $("tr", grid.tbody).index(tr);
                            var ReportUrl = MersalUIBaseUrl + "Reports1/ReportViewer.aspx?ReportName=CaseDetails&ReportType=pdf&CaseId=" + dataRow.Id;
                            var win = window.open(ReportUrl, '_blank');
                            win.focus();
                        },
                    },
                ]
                , title: Report, width: 150,
            },
            {
                field: "Description",
                title: Description,
                width: 440,
            },
            {
                field: "Mobile",
                title: Mobile,
                width: 157,
            },
            {
                field: "Phone",
                title: Phone,
                width: 150,
            },
            {
                field: "Age",
                title: Age,
                type: "string",
                filterable: {
                    extra: false,
                    ui: AgeFilter
                },
                width: 110,
            },
            {
                field: "GenderName",
                title: Gender,
                type: "string",
                width: 130
            },
            {
                field: "NationalityName",
                title: Nationality,
                width: 150,
            },
            {
                field: "ReligionName",
                title: Religion,
                width: 150,
            }

        ]
    });
    $('.k-grid-filter').click(function () {
        $('.k-animation-container').addClass('k-rtl');
    });

    
    $("#grid").data("kendoGrid").bind("filterMenuInit", filterMenuInit);

}