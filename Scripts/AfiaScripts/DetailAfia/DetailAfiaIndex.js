var GetAllMedicineUrl = MersalWebAPIBaseUrl + "api/DetailAfia/search";

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
                    Phone1: { type: "string" },
                    Phone2: { type: "string" },
                    MasterName: { type: "string" },
                    Specialization: { type: "string" },
                    IsActive: { type: "bool" },
                    Exceptions: { type: "string" },
                    Discounts: { type: "string" },
                    Provider: { type: "string" },
                    Address: { type: "string" },
                    city: { type: "string" },
                    RegistraionCode: { type: "string" },
                }
            }
        },
        type: "json",
        pageSize: 10,
        serverPaging: true,
        serverFiltering: true,
        serverSorting: true,

    });
    var exportFlag = false;

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
        excelExport: function (e) {
            if (!exportFlag) {
                e.sender.showColumn(2);
                e.sender.showColumn(3);
                e.sender.showColumn(4);
                e.sender.showColumn(5);
                e.sender.showColumn(6);
                e.preventDefault();
                exportFlag = true;
                setTimeout(function () {
                    e.sender.saveAsExcel();
                });
            } else {
                e.sender.hideColumn(2);
                e.sender.hideColumn(3);
                e.sender.hideColumn(4);
                e.sender.hideColumn(5);
                e.sender.hideColumn(6);
                
                exportFlag = false;
            }
            }
        ,
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
                field: "MasterNameAr",
                title: MasterName,
                width: 175,
                template: function (dataItem) {
                    let result = '';

                    if (_cultureIsArabic)
                        result += dataItem.MasterNameAr;
                    else
                        result += dataItem.MasterNameAr;


                    return result;
                }
            },
            {
                field: "Phone1",
                title: Phone1,
                width: 130,
                hidden: true,

            },
            
            {
                field: "Phone2",
                title: Phone2,
                width: 130,
                hidden: true,

            },
            {
                field: "Address",
                title: Address,
                width: 180,
                hidden: true,

            },
            {
                field: "Exceptions",
                title: Exceptions,
                width: 180,
                hidden: true,

            },

            {
                field: "Discounts",
                title: Discounts,
                width: 180,
                hidden: true,

            },

           

            {
                field: "Specialization",
                title: Specialization,
                width: 200
            },

            //{
            //    field: "IsActive",
            //    title: IsActive,
            //    width: 200,
            //},

            //{
            //    field: "Icon",
            //    title: Icon,
            //    width: 185,
            //    template: function (dataItem) {
            //        let result = '';

            //        if (dataItem.Icon && dataItem.Icon != null)
            //            result += Icon + " = " + dataItem.Icon;


            //        if (dataItem.Discounts && dataItem.Discounts != null)
            //            result += ' , ' + ' السعر = ' + dataItem.Discounts

            //        if (dataItem.Exceptions && dataItem.Exceptions != null)
            //            result += ' , ' + ' عدد الوحدات = ' + dataItem.Exceptions


            //        return result;
            //    }
            //},
          

            {
                field: "Provider",
                title: Provider,
                width: 180,
                
            },
           

            {
                field: "city",
                title: city,
                width: 180,
            },
            {
                field: "RegistraionCode",

                title: RegistraionCode,
                width: 180,
            },
            {
                command: [
                    {
                        name: "edit",
                        text: " ",
                        iconClass: "fa fa-edit",
                        click: function (e) {
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
                            DeleteAfia(id);
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

function ConfirmDeleteSlide(id) {
    $.ajax({
        url: MersalWebAPIBaseUrl + "api/DetailAfia/delete?id=" + id,
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



function onUploadAlbumImageCreate(e) {
    debugger;
  
}
function onSuccessUploadDataCreate(e) {
    toastr.success(SuccessfulProcess);
    console.log(e);
    Icon ="\\"+ e.files[0].name
    $.ajax({
        url: MersalWebAPIBaseUrl + "api/DetailAfia/importExcel?file="+Icon,
        type: "put",
        contentType: false, // Not to set any content header  
        processData: false, // Not to process data  
       
        success: function (result) {
            alert(saved);
        },
        error: function (err) {
            alert(err.statusText);
        }
    });
    //$('#CreateAlbumModals').modal('hide');
    // $('#CreateAlbumForm').trigger("reset");
    //   document.location.reload(true);
}