var GetAllCasesUrl = MersalWebAPIBaseUrl + "api/PharmacyReciept/GetPharmacyReceiptMedicines";

kendo.culture(_culture);


function Design() {
    $('.k-animation-container').css('margin-left', '0px');
    $('.k-animation-container').css('padding-left', '0px');
    $('.k-invalid-msg').hide();
}

function addParameterMapToGrid(options) {
    $.extend(options, { receiptId: $("#receiptNumber").data("kendoComboBox").value() });
    return options;
}


 function filterReceipts() {
        return {
            text: $("#receiptNumber").data("kendoComboBox").input.val(),
            supplierId: $("#supplier").data("kendoComboBox").value()
        };
}


function refreshGird() {
    $('#panelGrid').hide('slow')
    var krtl = "";
    if (_cultureIsArabic) {
        krtl = "k-rtl";
    }
    $('#panelGrid').html('<div id="grid" class="' + krtl + '"></div>');
    BindGrid();
    $('#panelGrid').show('slow')
}

$(document).ready(function(){
    $('#panelCombox').show('slow');
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
                    Quantity: { editable: true, type: "number", nullable: true },
                    UnitId: { editable: false, type: "number", nullable: true },
                    UnitName: { editable: false, type: "string", nullable: true },
                    MedicineName: { editable: false, type: "string", nullable: true },
                    AlternateMedicineName: { editable: false, type: "string", nullable: true },
                    CreatedOn : {type: "date"}
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
        dataBound: onDataBound,
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
                template: "<input type='checkbox' class='checkbox' checked/>",
                width: 50,
            },
            {
                field: "MedicineName",
                title: "اسم الدواء",
                width: 350,
            },
            {
                field: "UnitName",
                title: "الوحده",
                width: 250,
            }
            ,
            {
                field: "MedicinePrice",
                title: "سعر الدواء",
                width: 350,
            },
            {
                field: "MersalMedicinePrice",
                title: "سعر مرسال",
                width: 350,
            }
        ]
    });
    $('.k-grid-filter').click(function () {
        $('.k-animation-container').addClass('k-rtl');
    });

    $("#grid").data("kendoGrid").bind("filterMenuInit", filterMenuInit);

    grid.data("kendoGrid").table.on("click", ".checkbox" , selectRow);
};




function filterMenuInit(e) {
    if (e.field === "Age") {
        var firstValueDropDown = e.container.find("select:eq(0)").data("kendoDropDownList");

        setTimeout(function () {
            firstValueDropDown.wrapper.hide();
        });
    }
}



var checkedIds = [];

    //on click of the checkbox:
function selectRow() {
        var checked = this.checked,
        row = $(this).closest("tr"),
        grid = $("#grid").data("kendoGrid"),
        dataItem = grid.dataItem(row);
        if (checked) {
            //-select the row
             checkedIds.push( dataItem.Id);
            } else {
            //-remove selection
              checkedIds = checkedIds.filter(item => item == dataItem.Id);
        }
}

//on dataBound event restore previous selected rows:
    function onDataBound(e) {
        var view = this.dataSource.view();
        for(var i = 0; i < view.length;i++){
           checkedIds.push(view[i].Id);
        }
    }

    var interchangeForCaseForm = $("#interchangeForCompanyform");
interchangeForCaseForm.submit(function (e) {
        $.validator.unobtrusive.parse(interchangeForCaseForm)
        e.preventDefault();
        if (!interchangeForCaseForm.valid())
            return;
        
    let data = {ReceiptMedicines: checkedIds, ReceiptId :  $("#receiptNumber").data("kendoComboBox").value() };
    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: MersalWebAPIBaseUrl + 'api/PharmacyReciept/ReturnReceiptMedicines',
        crossDomain: true,
        headers: getHeaders(),
        data: JSON.stringify(data),
        success: function (data) {
               toastr.success(SuccessfulProcess);
            }
        });
});




