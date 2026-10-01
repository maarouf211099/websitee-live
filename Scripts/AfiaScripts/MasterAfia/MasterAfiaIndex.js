var GetAllMedicineUrl = MersalWebAPIBaseUrl + "api/MasterAfia/search";

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
                    CreateOn: { type: "string" },
                    NameAr: { type: "string" },
                    NameEn: { type: "string" },
                    DescriptionEn: { type: "string" },
                    DescriptionAr: { type: "string" },
                    
                    IsActive: { type: "bool" },
                    Icon: { type: "string" },
                   
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
            fileName: "List Of Afia Details.xlsx",
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
                field: "Name",
                title: Name,
                width: 130,
                template: function (dataItem) {
                    let result = '';

                    if (_cultureIsArabic)
                        result +=  dataItem.NameAr;
                    else
                        result += dataItem.NameEn;




                    return result;
                }
            },
            {
                field: "Description",
                title: Description,
                width: 175,
                template: function (dataItem) {
                    let result = '';
                    
                    if (_cultureIsArabic)
                        result +=  dataItem.DescriptionAr;
                    else
                        result +=  dataItem.DescriptionEn;


                    

                    return result;
                }
            },

            //{
            //    field: "Specialization",
            //    title: Specialization,
            //    width: 200
            //},

            //{
            //    field: "IsActive",
            //    title: IsActive,
            //    width: 200,
            //},

            //{
            //    field: "Exceptions",
            //    title: Exceptions,
            //    width: 180,
            //},

            //{
            //    field: "Discounts",
            //    title: Discounts,
            //    width: 180,
            //},

           
            //{
            //    field: "Address",
            //    title: Address,
            //    width: 180,
            //},

            //{
            //    field: "city",
            //    title: city,
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
                            var tr = $(e.target).closest("tr");
                            var id = tr.find('.id-cell').text();
                            Edit(id);
                        },
                    },
                    {
                        name: "delete",
                        text: " ",
                        iconClass: "fa  fa-trash fa-fw ",
                        click: function (e) {
                            var tr = $(e.target).closest("tr");
                            var id = tr.find('.id-cell').text();
                            DeleteAfia(id)                        },
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

function ConfirmDeleteSlide(id) {
    $.ajax({
        url: MersalWebAPIBaseUrl + "api/MasterAfia/delete?id=" + id,
        type: 'POST',
        dataType: "html",
        contentType: 'application/html; charset=utf-8',
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (result) {
            $("#imgAjaxLoader").hide();
            RefreshGird();
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}

function DeleteAfia(id) {
    var CallBackFunction = function () { ConfirmDeleteSlide(id); };
    confirmMessageBootstrap(ConfirmDelete, sureDelete, 400, 250, CallBackFunction);
}