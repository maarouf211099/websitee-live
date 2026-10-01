
var GetAllCasesUrl = MersalWebAPIBaseUrl + "api/Case/GetAllCases";

kendo.culture(_culture);

// kendo grid
var CaseState = "";
function SetCaseState(caseState) {
    if (caseState == "") {
        $('#panelGrid').hide();
    } else {
        $('#panelGrid').show();
        CaseState = caseState;
        RefreshGird();
    }
}

function addParameterMapToGrid(options) {
    $.extend(options, { filterByState: CaseState });
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
                url: GetAllCasesUrl,
                dataType: "json",
                headers: getHeaders(),
            },
            //parameterMap: function (options, type) {
            //    return options;
            //}, 
            //parameterMap: function (options, operation) {
            //    var caseStateURL = getUrlParameter("Cstate");
            //    //console.log(caseStateURL);
            //    var filterByState = { filterByState: caseStateURL };
            //    $.extend(options, filterByState);
            //    //console.log(options);
            //    return options;
            //}
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
            }
            ,

            model: {
                Id: "Id",
                fields: {
                    Id: { type: "string" },
                    Name: { type: "string" },
                    // Description: { type: "string" },
                    Age: { type: "string" },
                    Region: { type: "string" },
                    ServiceName: { type: "string" },
                    //DisesName: { type: "string" },
                    //CreatedOn: { type: "date" },
                    Amount: { type: "number", validation: { min: 0, required: true } },
                    MedicalDuration: { type: "number", validation: { min: 0, required: true } },
                    MedicalDescription: { type: "string" },
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

        toolbar: [{
            name: "excel",
            text: ExeportToExcel,
        }],
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
            buttonCount: 5
        },
        resizable: true,
        width: '100%',
        sortable: false,
        groupable: {
            messages: {
                empty: DragaColumnHeaderAndDropItHereToGroupByThatColumn,//Drag a column header and drop it here to group by that column"
            }
        },
        columns: [
            {
                field: "Id",
                title: CaseCode,
                filterable: {
                    operators: {
                        string: {
                            eq: IsEqualTo,
                            neq: IsNotEqualTo,
                        }
                    }
                }
            },
            {
                field: "Name",
                title: CaseName,

            },
            //{
            //    field: "Description",
            //    title: Description,

            //},
            {
                field: "Age",
                title: Age,
                type: "string",
                filterable: {
                    extra: false,
                    ui: AgeFilter
                }
            },
            {
                field: "Region",
                title: Region,
            },
            {
                field: "ServiceName",
                title: ServiceName,
            },

             {
                 field: "Amount",
                 title: Amount,
                 template: kendo.template($(".slotsTemplate").html()),
                 width: 200,
             },
              {
                  field: "MedicalDuration",
                  title: MedicalDuration,
                  template: kendo.template($(".slotsTemplate").html()),
                  width: 200,
                  hidden: true,
              },
               {//ner
                   field: "MedicalDescription",
                   title: MedicalDescription,
                   template: kendo.template($(".textTemplate").html()),
                   width: 200,
                   hidden: true,
               },

        {
            command: [
                {
                    name: "Add",
                    text: "",
                    iconClass: "fa fa-plus-circle",
                    click: function (e) {
                        var tr = $(e.target).closest("tr");
                        var tds = tr.find("td");
                        // var Amount = tds.eq(7).find('.numeric').val();
                        var Amount = tds.eq(5).find('.numeric').val();

                        // var MedicalDurationVal = tds.eq(8).find('.numeric').val();
                        var MedicalDurationVal = tds.eq(6).find('.numeric').val();

                        //var MedicalPlanVal = tds.eq(9).find('.text').val();
                        var MedicalPlanVal = tds.eq(7).find('.text').val();
                        var dataRow = this.dataItem(tr);
                        var rowIdx = $("tr", grid.tbody).index(tr);
                        var Type = $("#TypeId").val();
                        AddMonthlyCases(dataRow.Id, dataRow.Name, Amount, MedicalDurationVal, MedicalPlanVal, Type);
                    },
                },
            ]
            , title: Addition, width: 100,
        }
        ]
    });
    $('.k-grid-filter').click(function () {
        $('.k-animation-container').addClass('k-rtl');
    });
};
var count = 0;
var total = 0;
function AddMonthlyCases(CaseId, Name, Amount, MedicalDurationVal, MedicalPlanVal, Type) {
    var id = Math.floor((Math.random() * 100000)); //Math.random().toString(36).substring(7);
    var typeCode = $("#TypeId option:selected").attr("code");

    if (Amount == '') {
        toastr.warning(AddAmountToCase);
        return;
    }
    var result = {
        MedicalDuration: MedicalDurationVal,
        MedicalDescription: MedicalPlanVal,
        CaseId: CaseId,
        Amount: Amount,
        caseName: Name,
        Id: id,
    };
    $.ajax({
        type: "POST",
        contentType: 'application/json; charset=utf-8',
        url: "/monthlyCase/addCaseMonthly ",
        data: JSON.stringify(result),
        async: false,
        success: function (data) {
            if (data.success == "success") {

                //toastr.success(SuccessfullyAdd);
                //var template = '<tr><td>' + "#Code#" + '</td><td>' + "#Name#" + '</td><td>' + "#Amount#" + '</td><td><input type="button" class="rmvbtn" value="' + Delete + '"/></td><td><i class="fa fa-times-circle-o" onclick="removeMonthlyCase(#removeId#)"></i></td></tr>';
                var template = '<tr  id=#Id#><td>' + "#Code#" + '</td><td>' + "#Name#" + '</td><td>' + "#Amount#" + '</td><td class="medical">' + "#MedicalDuration#" + '</td><td class="medical">' + "#MedicalPlan#" + '</td><td><i class="fa fa-times-circle-o" onclick="removeMonthlyCase(#removeId#,#CaseAmount#)"></i></td></tr>';
                if (Amount != '') {
                    count++;
                    total += parseFloat(Amount);

                    $("#lblCountMonthlyCases").html(count);
                    $("#lblCasesMonthlyValueAmount").html(total);

                    var res = template
                        .replace("#Id#", "'" + id + "'")
                                    .replace("#Code#", CaseId)
                                    .replace("#Name#", Name)
                                    .replace("#Amount#", Amount)
                                    .replace("#removeId#", "'" + id + "'")
                                    .replace("#CaseAmount#", "'" + Amount + "'")
                                    .replace("#MedicalDuration#", MedicalDurationVal)
                                    .replace("#MedicalPlan#", MedicalPlanVal)
                    $("#monthlyCasestbl").append(res);
                    if (typeCode != "MoMD") {
                        $(".medical").hide();

                    }
                }
            }
            else {
                toastr.error(data.success);
            }
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });



}
function removeMonthlyCase(caseid, Amount) {
    $.ajax({
        type: "POST",
        contentType: 'application/json; charset=utf-8',
        url: "/monthlyCase/removeMonthlyCase?caseid=" + caseid,
        async: false,
        success: function (data) {
            count--;
            total -= parseFloat(Amount);
            $("#lblCountMonthlyCases").html(count);
            $("#lblCasesMonthlyValueAmount").html(total);
            if (data.success == "success") {
                $("#" + caseid).remove();

                // toastr.success(SuccessfullyRemoved);
            } else {
                toastr.error(data.success);
            }
        },
        error: function (xhr) {
            toastr.error(xhr.statusText);
        }
    });


}



var CreateMonthlyCasesForm = $("#createMonthlyCasesRequestForm");
CreateMonthlyCasesForm.submit(function (e) {

    $.validator.unobtrusive.parse(CreateMonthlyCasesForm)
    e.preventDefault();
    if (!CreateMonthlyCasesForm.valid()) return;


    var url = MersalUIBaseUrl + "monthlyCase/Create";
    var Submitdata = {};
    $("#createMonthlyCasesRequestForm").serializeArray().map(function (x) { Submitdata[x.name] = x.value; });
    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: url,
        crossDomain: true,
        headers: getHeaders(),
        data: JSON.stringify(Submitdata),
        async: false,
        success: function (result) {
            if (result.success == "success") {
                toastr.success(SuccessfulProcess);
                setTimeout(function () { window.location.href = "/monthlyCase" }, 1000);
            }
            else {
                toastr.error(ErrorMessage);
            }
        },
        error: function (xhr) {
            toastr.error(xhr.error);
        }
    });
});
//ner


$('#TypeId').change(function () {
    var grid = $("#grid").data("kendoGrid");
    var test = $("#TypeId option:selected").attr("code");
    if (test == "MoMD") {
        $(".medical").show();
        grid.showColumn("MedicalDuration");
        grid.showColumn("MedicalDescription");

    }
    else {

        $(".medical").hide();
        grid.hideColumn("MedicalDuration");
        grid.hideColumn("MedicalDescription");
    }
});


//GetAnyMasterDetalisCode('MCTY', 'TypeId', false, true, "", "");
GetAnyMasterDetalisCode('cSrv', 'TypeId', false, true, "");
