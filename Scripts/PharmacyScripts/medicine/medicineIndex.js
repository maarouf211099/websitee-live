var GetAllMedicineUrl = MersalWebAPIBaseUrl + "api/Medicine/GetAllMedicines";

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
                url: GetAllMedicineUrl,
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
                Id: "Id",
                fields: {
                    Id: { type: "int" },
                    ScientificName: { type: "string" },
                    CommercialName: { type: "string" },
                    SmallUnit: { type: "string" },
                    SmallUnitCount: { type: "number" },
                    SmallUnitPrice: { type: "number" },
                    MidddleUnit: { type: "string" },
                    MidddleUnitCount: { type: "number" },
                    MidddleUnitPrice: { type: "number" },
                    LargeUnit: { type: "string" },
                    LargeUnitCount: { type: "number" },
                    LargeUnitPrice: { type: "number" },
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
            fileName: "List Of Medicines.xlsx",
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
                field: "ScientificName",
                title: ScientificName,
                width: 130,
            },
            {
                field: "Description",
                title: Description,
                width: 250,
            },
            {
                field: "CommercialName",
                title: CommercialName,
                width: 130,
            },
            {
                field: "SmallUnit",
                title: SmallUnit,
                width: 175,
                template: function (dataItem) {
                    let result = '';

                    if (dataItem.SmallUnit && dataItem.SmallUnit != null)
                        result += SmallUnit + " = " + dataItem.SmallUnit;

                    if (dataItem.SmallUnitPrice && dataItem.SmallUnitPrice != null)
                        result += ' , ' + ' السعر = ' + dataItem.SmallUnitPrice

                    if (dataItem.SmallUnitCount && dataItem.SmallUnitCount != null)
                        result += ' , ' + ' عدد الوحدات = ' + dataItem.SmallUnitCount


                    return result;
                }
            },

            //{
            //    field: "SmallUnitCount",
            //    title: SmallUnitCount,
            //    width: 200
            //},

            //{
            //    field: "SmallUnitPrice",
            //    title: SmallUnitPrice,
            //    width: 200,
            //},

            {
                field: "MidddleUnit",
                title: MidddleUnit,
                width: 185,
                template: function (dataItem) {
                    let result = '';

                    if (dataItem.MidddleUnit && dataItem.MidddleUnit != null)
                        result += MidddleUnit + " = " + dataItem.MidddleUnit;


                    if (dataItem.MidddleUnitPrice && dataItem.MidddleUnitPrice != null)
                        result += ' , ' + ' السعر = ' + dataItem.MidddleUnitPrice

                    if (dataItem.MidddleUnitCount && dataItem.MidddleUnitCount != null)
                        result += ' , ' + ' عدد الوحدات = ' + dataItem.MidddleUnitCount


                    return result;
                }
            },
            //{
            //    field: "MidddleUnitCount",
            //    title: MidddleUnitCount,
            //    width: 180,
            //},

            //{
            //    field: "MidddleUnitPrice",
            //    title: MidddleUnitPrice,
            //    width: 180,
            //},

            {
                field: "LargeUnit",
                title: LargeUnit,
                width: 180,
                template: function (dataItem) {
                    let result = '';

                    if (dataItem.LargeUnit && dataItem.LargeUnit != null)
                        result += LargeUnit + " = " + dataItem.LargeUnit;

                    if (dataItem.LargeUnitCount && dataItem.LargeUnitCount != null)
                        result += ' , ' + ' السعر = ' + dataItem.LargeUnitCount

                    if (dataItem.LargeUnitPrice && dataItem.LargeUnitPrice != null)
                        result += ' , ' + ' عدد الوحدات = ' + dataItem.LargeUnitPrice


                    return result;
                }
            },
            //{
            //    field: "LargeUnitCount",
            //    title: LargeUnitCount,
            //    width: 180,
            //},

            //{
            //    field: "LargeUnitPrice",
            //    title: LargeUnitPrice,
            //    width: 180,
            //},
            {
                command: [
                    {
                        name: "edit",
                        text: " ",
                        iconClass: "fa fa-edit",
                        click: function (e) {
                            //var tr = $(e.target).closest("tr");
                            //var dataRow = this.dataItem(tr);
                            //var ReportUrl = MersalUIBaseUrl + "/Medicine/Edit?CaseId=" + dataRow.Id;
                            //var win = window.open(ReportUrl, '_blank');
                            //win.focus();
                        },
                    },
                ]
                , title: "", width: 90,
            }
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

