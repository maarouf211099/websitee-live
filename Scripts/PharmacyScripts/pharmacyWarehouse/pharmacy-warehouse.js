var GetAllCasesUrl = MersalWebAPIBaseUrl + "api/PharmacyWarehouse/GetPharmacyWarehouseMedicines";

kendo.culture(_culture);




function Design() {
    $('.k-animation-container').css('margin-left', '0px');
    $('.k-animation-container').css('padding-left', '0px');
    $('.k-invalid-msg').hide();
}

function addParameterMapToGrid(options) {              
    return options;
}


function refreshGird() {
    var krtl = "";
    if (_cultureIsArabic) {
        krtl = "k-rtl";
    }
    $('#panelGrid').html('<div id="grid" class="' + krtl + '"></div>');
    BindGrid();
}

$(document).ready(function(){
refreshGird();    
$('#panelGrid').show('slow');
    
})



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
                    Id: { editable: false, type: "number" },
                    RemainingCount: { editable: false, type: "number", nullable: true },
                    CommercialName: { editable: false, type: "string", nullable: true },
                    NameAr: { editable: false, type: "string", nullable: true },
                }   
            }
        },
        type: "json",
        pageSize: 10,
        serverPaging: true,
        serverFiltering: true,
        serverSorting: true,

    });

  let grid =  $("#grid").kendoGrid({
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
                field: "CommercialName",
                title: "اسم الدواء",
                width: 350,
            }
            ,
            {
                field: "RemainingCount",
                title: "المخزون",
                width: 350,
            },
            {
                field: "NameAr",
                title: "المخزن",
                width: 350,
                    
            }
        ]
    });
    $('.k-grid-filter').click(function () {
        $('.k-animation-container').addClass('k-rtl');
    });

};



