var GetAllCasePrescriptionUrl = MersalWebAPIBaseUrl + "api/CasePrescriptionMedicine/GetAllCasePrescriptionsForPayment";



kendo.culture(_culture);


function RefreshGird() {
    var krtl = "";
    if (_cultureIsArabic) {
        krtl = "k-rtl";
    }
    $('#panelGrid').html('<div id="grid" class="' + krtl + '"></div>');
    BindGrid();
    getMasterCodeAddCase();
    AddCasePrescriptionMedicineItem();
}

function addParameterMapToGrid(options) {
     ;
    $.extend(options, { CasePrescriptionId: CasePrescriptionId });
    return options;
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
            },
            parameterMap: function (options, operation) {
                if (operation == "read" && options) {
                    return addParameterMapToGrid(options)
                }
            }
        },
        change: function (e) {
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
                Id: "CasePrescriptionMedicineId",
                fields: {
                    CasePrescriptionMedicineId: { editable: false, type: "number" },
                    Quantity: { editable: true, type: "number", nullable: true },
                    UnitId: { editable: false, type: "number", nullable: true },
                    UnitName: { editable: false, type: "string", nullable: true },
                    MedicineCommercialName: { editable: false, type: "string", nullable: true },
                    MedicineId: { editable: false, type: "number", nullable: true },
                    CasePrescriptionId: { editable: false, type: "number", nullable: true },
                    AlternativeMedicineId: { type: "number", nullable: true, editable: false }
                }
            }
        },
        type: "json",
        pageSize: 10,
        serverPaging: true,
        serverFiltering: false,
        serverSorting: false
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
            console.log(e);
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
        editable: {
            mode: "inline"
        },
        cancel: function (e) {
            $('#grid').data('kendoGrid').dataSource.cancelChanges();
        },
        // selectable: true,
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
                field: "MedicineCommercialName",
                title: "اسم الدواء",
                width: 350,
            }
            ,
            {
                field: "Quantity",
                title: "الكميه",
                width: 350,
            },
            {
                field: "UnitName",
                title: "الوحده",
                width: 250,
            }

            ,
            {
                field: "AlternativeMedicineId",
                title: " الدواء البديل",
                width: 250,
                editor: productDropDownEditor
            },
            {
                template: "<input type='checkbox' class='checkbox' checked/>",
                width: 50,
            },
            {
                command: [
                    {
                        className: "btn-danger", name: "edit",
                        text: { edit: "تعديل", cancel: "الغاء", update: "تعديل" }
                    }
                ]
            }

        ]
    });
    $('.k-grid-filter').click(function () {
        $('.k-animation-container').addClass('k-rtl');
    });


    $("#grid").data("kendoGrid").bind("filterMenuInit", filterMenuInit);

}



function filterMenuInit(e) {
    if (e.field === "Age") {
        var firstValueDropDown = e.container.find("select:eq(0)").data("kendoDropDownList");

        setTimeout(function () {
            firstValueDropDown.wrapper.hide();
        });
    }
}

function productDropDownEditor(container, options) {
    $('<input data-text-field="CommercialName" data-value-field="Id" data-bind="value:' + options.field + '"/>')
        .appendTo(container)
        .kendoDropDownList({
            autoBind: false,
            dataSource: {
                type: "json",
                transport: {
                    read: MersalWebAPIBaseUrl + "api/Medicine/GetMedicinesLookup"
                }
            }
        });
}

function getMasterCodeAddCase() {
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: SystmeCodeWebAPIBaseUrl + "api/DetailCode/GetMasterCodeByMultiCode?masterCode=MedUnit",
        async: true,
        success: function (data) {
            var htmlDrp = "<option value=''></option>";
            $.each(data, function (key, value) {
                var selec = "";
                if ($("#Unit").val() == value.Id) selec = " selected='selected' ";
                if (_cultureIsArabic) {
                    htmlDrp += "<option value=" + value.Id + selec + " >" + value.NameAr + "</option>";
                }
                else {
                    htmlDrp += "<option value=" + value.Id + selec + " >" + value.NameEn + "</option>";
                }
            });
            $("#Unit").html(htmlDrp);
        },
        error: function (xhr) {
            toastr.error(xhr.error);
        }
    });
}

function AddCasePrescriptionMedicineItem() {
    var addRecieptItemForm = $("#AddCasePrescriptionMedicineForm");
    addRecieptItemForm.submit(function (e) {
        e.preventDefault();
        $.validator.unobtrusive.parse(addRecieptItemForm);
        var newRecieptItem = { MedicineCommercialName: $("#MedicineId").data("kendoDropDownList").text()
                             , UnitName: $(".Unit :selected").text() 
                             , UnitId : $(".Unit").val()
                             };
        addRecieptItemForm.serializeArray().map(function (x) { newRecieptItem[x.name] = x.value; });
        var grid = $("#grid").data("kendoGrid");
        grid.dataSource.add(newRecieptItem);
    });
}



function submitCasePayment(){
    let apiurl = MersalWebAPIBaseUrl + "api/CasePrescriptionMedicine/Add";

    let data = [];
    let gridData = $("#grid").data("kendoGrid").dataSource.data();

    $.each(gridData, function (index, item) {
        let medicineData = { CaseId: $("#CaseId").val()
                           , MedicineId: item.MedicineId
                           , Unit: item.UnitId
                           , Quantity: item.Quantity
                           , CasePrescriptionId: item.CasePrescriptionId
                           };
        data.push(medicineData);
    });

    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: apiurl,
        crossDomain: true,
        headers: getHeaders(),
        data: JSON.stringify(data),
        async: true,
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (data) {
            $("#imgAjaxLoader").hide();
            if (data) {
                toastr.success(savedSuccessfully);
            }
            else {
                toastr.error(Error);
            }
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.error);
        }
    });


}