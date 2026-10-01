var GetAllCampaignsHomeCounterUrl = MersalWebAPIBaseUrl + "api/CampaignsHomeCounter/GetAllCampaignsHomeCounters";

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
                url: GetAllCampaignsHomeCounterUrl,
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
                    TitleAr: { type: "string" },
                    TitleEn: { type: "string" },
                    GoalTotal: { type: "string" },                  
                    GoalUnit: { type: "string" } , 
                    IsActive: { type: "bool" },
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
            fileName: "List Of CampaignsHomeCounters.xlsx",
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
                field: "Id",
                filterable: false,
                hidden: true,
                attributes: { "class": "id-cell" }
            },
            {
                field: "TitleAr",
                title: TitleAr,
                width: 130,
            },
            {
                field: "TitleEn",
                title: TitleEn,
                width: 130,
            },
            {
                field: "GoalTotal",
                title: GoalTotal,
                width: 130,
            },
            {
                field: "GoalUnit",
                title: GoalUnit,
                width: 130,
            },
            {
                field: "IsActive",
                title: IsActive,
                width: 130,
            },
            {
                command: [
                    {
                        name: "edit",
                        text: " ",
                        iconClass: "fa fa-edit",
                        click: function (e) {
                            //var tr = $(e.target).closest("tr");
                            //var dataRow = this.dataItem(tr);
                            //var ReportUrl = MersalUIBaseUrl + "/CampaignsHomeCounter/GetById?Id=" + dataRow.Id;
                            //var win = window.open(ReportUrl, '_blank');
                            //win.focus();
                            
                            //AddNewCampaignsHomeCounter();
                            var tr = $(e.target).closest("tr");
                            var id = tr.find('.id-cell').text();
                            EditCampaignsHomeCounter(id);
                           // Edit(id);
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

function Edit(Id) {

    $("#createCampaignsHomeCounterDiv").html("");
    $.ajax({
        url: "/CampaignsHomeCounter/Edit?id=" + Id,
        type: 'Get',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            //$("#imgAjaxLoader").show();
        },
        success: function (result) {
            //$("#createCampaignsHomeCounterDiv").append(result);
            $('#AddCampaignsHomeCounterModals').modal('show');
            //AddCampaignsHomeCounter();
            //loadAllDDl();
        },
        error: function (xhr) {
            //$("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
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



