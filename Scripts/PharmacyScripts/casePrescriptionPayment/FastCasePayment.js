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

function BindGrid() {
    $('.modal').on('hide.bs.modal', function () {
        $("#grid").data("kendoGrid").dataSource.read();
        $("#grid").data('kendoGrid').refresh();
    });

    var dataSource = new kendo.data.DataSource({
        schema: {
            total: function (data) {
                return data.Total;

            },
            data: function (data) {
                return data.Data;
            }
            ,
            model: {
                Id: "MedicineId",
                fields: {
                    MedicineId: { type: "int" },
                    Unit: { type: "int" },
                    UnitName: { type: "string" },
                    Quantity: { type: "int" }
                }
            }
        },
        type: "json",
        pageSize: 10,
        serverPaging: false,
        serverFiltering: false,
        serverSorting: false,
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
        dataSource: dataSource,
        sortable: false,
        pageable: true,
        resizable: true,
        groupable: true,
        width: '100%',
        scrollable: true,
        columns: [
            {
                field: "MedicineName",
                title: "اسم الدواء",
                width: 130,
            },
            {
                field: "Quantity",
                title: "الكميه",
                width: 130,
            },
            {
                field: "UnitName",
                title: "الوحده",
                width: 130,
            },
            {
                command: [
                    {
                        name: "delete",
                        text: " ",
                        iconClass: "fa fa-trash",
                        click: function (e) {
                            var tr = $(e.target).closest("tr");
                            var grid = $("#grid").data("kendoGrid");
                            var dataItem = grid.dataItem(tr);
                            grid.dataSource.remove(dataItem);
                        },
                    },
                ]
                , title: "", width: 50,
            }
        ]
    });
    $('.k-grid-filter').click(function () {
        $('.k-animation-container').addClass('k-rtl');
    });

}


function AddCasePrescriptionMedicineItem() {

    var addRecieptItemForm = $("#AddCasePrescriptionMedicineForm");
    addRecieptItemForm.submit(function (e) {
        e.preventDefault();
        $.validator.unobtrusive.parse(addRecieptItemForm)
        var newRecieptItem = { MedicineName: $("#MedicineId").data("kendoDropDownList").text(), UnitName: $(".Unit :selected").text() };
        addRecieptItemForm.serializeArray().map(function (x) { newRecieptItem[x.name] = x.value; });
        var grid = $("#grid").data("kendoGrid");
        grid.dataSource.add(newRecieptItem);
    });
}

$("#grid").on("click", "button.remove", function (e) {
    e.preventDefault();
    var $tr = $(this).closest("tr"),
        grid = $("#grid").data("kendoGrid"),
        dataItem = grid.dataItem($tr);

    grid.dataSource.remove(dataItem);
});

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


function SubmitFastCasePaymentItem(e) {
    let addRecieptItemForm = $("#AddRecieptForm");
    $.validator.unobtrusive.parse(addRecieptItemForm);
    if (!addRecieptItemForm.valid()) return;
    let apiurl = MersalWebAPIBaseUrl + "api/CasePrescriptionMedicine/Add";

    let data = [];
    let gridData = $("#grid").data("kendoGrid").dataSource.data();

    let caseDetails = {};
    addRecieptItemForm.serializeArray().map(function (x) { caseDetails[x.name] = x.value; });

    $.each(gridData, function (index, item) {
        let medicineData = { CaseId: caseDetails.CaseId, MedicineId: item.MedicineId, Unit: item.Unit, Quantity: item.Quantity, CasePrescriptionId: caseDetails.CasePrescriptionId };
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