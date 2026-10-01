
var GetAllCasePrescriptionUrl = MersalWebAPIBaseUrl + "api/CasePrescription/GetAllCasePrescriptionsForPayment";


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
                url: GetAllCasePrescriptionUrl,
                dataType: "json",
                headers: getHeaders(),
            }
        },
        change: function (e) {
            if (dataSource.filter()) {
                $("#IsFilters").val("Filter");
            }
            else {
                $("#IsFilters").val("NoFilter");
            }
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
                Id: "CasePrescriptionId",
                fields: {
                    CasePrescriptionId: { type: "int" },
                    CaseId: { type: "int" },
                    CaseName: { type: "string" },
                    Prescription: { type: "string" },
                    CreatedOn: { type: "date" }
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
            fileName: "List-Of-Cas-Prescriptions.xlsx",
            allPages: true,
            filterable: true

        },
        dataBound: function (e) {
            console.log("dataBound");
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
                empty: DragaColumnHeaderAndDropItHereToGroupByThatColumn,
            }
        },
        columns: [
            {
                field: "CaseId",
                title: CaseId,
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
                template: function (dataItem) {
                    var casePaymentViewModel = {};
                    var data = {
                          CasePrescriptionId: dataItem.CasePrescriptionId
                        , CaseName: dataItem.CaseName
                        , CaseId: dataItem.CaseId
                    };
                    casePaymentViewModel = jQuery.param(data);
                    return "<a href='/CasePrescriptionPayment/CasePayment?" + casePaymentViewModel + "' target='_blank'>" + dataItem.CaseId + "</a>";
                },
                width: 170,
            },
            {
                field: "CaseName",
                title: CaseName,
                width: 500,
            },
            {
                field: "Prescription",
                title: Prescription,
                width: 380,
                template: function (dataItem) {
                    return "";
                }
            },
            {
                field: "CreatedOn",
                title: CreatedOn,
                format: "{0:d/M/yyyy h:mm}",
                parseFormats: ["MM/dd/yyyy h:mm:ss"],
                width: 400,
            },
            {
                command: [
                    {
                        name: "Report",
                        text: "",
                        iconClass: "fa fa-info",
                        click: function (e) {
                            var tr = $(e.target).closest("tr");
                            var dataRow = this.dataItem(tr);
                            var ReportUrl = MersalUIBaseUrl + "CasePrescriptionPayment/CasePayment?CasePrescriptionId=" + dataRow.CasePrescriptionId + "&CaseName=" + dataRow.CaseName +"&CaseId="+ dataRow.CaseId;
                            var win = window.open(ReportUrl, '_blank');
                            win.focus();
                        },
                    },
                ]
                , title: "", width: 280,
            },
        ]
    });
    $('.k-grid-filter').click(function () {
        $('.k-animation-container').addClass('k-rtl');
    });

    $("#grid").data("kendoGrid").bind("filterMenuInit", filterMenuInit);

}


function addParameterMapToGrid(options) {
    $.extend(options, { _culture: _culture });
    return options;
}

function filterMenuInit(e) {
    if (e.field === "Age") {
        var firstValueDropDown = e.container.find("select:eq(0)").data("kendoDropDownList");

        setTimeout(function () {
            firstValueDropDown.wrapper.hide();
        });
    }
}