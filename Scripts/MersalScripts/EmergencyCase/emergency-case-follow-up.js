var GetAllCasesUrl = MersalWebAPIBaseUrl + "api/EmergencyCase/GetFollowUpCases";


kendo.culture(_culture);

// kendo grid
var CaseState = "";
function SetCaseState(caseState) {

    // if (caseState == "") {
    //   $('#panelGrid').hide();
    //} else {
    $('#panelGrid').show();
    CaseState = caseState;
    RefreshGird();
    //}
}

function addParameterMapToGrid(options) {
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

function DiagnosisFilter(element) {
    element.kendoDropDownList({
        dataSource: [
            { text: CoronaSuspicion, value: CoronaSuspicion },
            { text: OtherEmergency, value: OtherEmergency },
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
                Id: "EmergencyCaseId",
                fields: {
                    Code: { type: "string" },
                    CaseName: { type: "string" },
                    CreatedBy: { type: "string" }
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
            fileName: "List Of Cases.xlsx",
            allPages: true,
            filterable: true

        },
        dataBound: function (e) {

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
            buttonCount: 10
        },
        resizable: true,
        width: '100%',
        scrollable: true,
        groupable: {
            messages: {
                empty: DragaColumnHeaderAndDropItHereToGroupByThatColumn, //Drag a column header and drop it here to group by that column"
            }
        },
        columns: [
            {
                field: "Code",
                title: CaseCode,
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
                    return "<a href='/EmergencyCase/Details?id=" + dataItem.EmergencyCaseId + "&followUp=true' target='_blank'>" + dataItem.Code + "</a>";

                },
                width: 250,
            },
            {
                field: "CaseName",
                title: CaseName,
                template: function (dataItem) {
                    return "<a href='/EmergencyCase/Details?id=" + dataItem.EmergencyCaseId + "&followUp=true' target='_blank'>" + dataItem.CaseName + "</a>";
                },
                width: 250,
                locked: true,
            },
            {
                field: "Age",
                title: Age,
                width: 120,
            },
            {
                field: "Diagnosis",
                title: Diagnosis,
                type: "string",
                filterable: {
                    extra: false,
                    ui: DiagnosisFilter
                },
                width: 160,
            },
            {
                field: "HospitalName",
                title: HospitalName,
                width: 150,
            },
            {
                field: "RequiredAmount",
                title: RequiredAmount,
                width: 150,
            },
            {
                field: "NameAnonymous",
                title: NameAnonymous,
                width: 160,
            },
            {
                field: "PhoneNumberAnonymous",
                title: PhoneNumberAnonymous,
                width: 160,
            },
            {
                field: "CreatedBy",
                title: CreatedBy,
                type: "string",
                width: 250
            },
            {
                field: "CreatedOn",
                title: CreatedOn,
                type: "date",
                template: "#= kendo.toString(kendo.parseDate(CreatedOn, 'yyyy-MM-dd'), 'd/M/yyyy') #",
                format: "{0:d/M/yyyy h:mm}",
                parseFormats: ["MM/dd/yyyy h:mm:ss"],
                filterable: {
                    extra: false, //do not show extra filters
                    operators: {
                        date: {
                            eq: IsEqualTo,
                            after: After,
                            befor: Before,
                        }
                    },
                    ui: function (element) {
                        if (_cultureIsArabic) {
                            kendo.culture("ar-EG");
                        }
                        element.kendoDatePicker({
                            format: "d/M/yyyy"
                        });
                    }
                }
                , width: 265

            },
            {
                field: "HospitalEntryDate",
                title: HospitalEntryDate,
                type: "date",
                template: "#= kendo.toString(kendo.parseDate(HospitalEntryDate, 'yyyy-MM-dd'), 'd/M/yyyy') #",
                format: "{0:d/M/yyyy h:mm}",
                parseFormats: ["MM/dd/yyyy h:mm:ss"],
                filterable: {
                    extra: false, //do not show extra filters
                    operators: {
                        date: {
                            eq: IsEqualTo,
                            after: After,
                            befor: Before,
                        }
                    },
                    ui: function (element) {
                        if (_cultureIsArabic) {
                            kendo.culture("ar-EG");
                        }
                        element.kendoDatePicker({
                            format: "d/M/yyyy"
                        });
                    }
                }
                , width: 265

            },
        ]
    });
    $('.k-grid-filter').click(function () {
        $('.k-animation-container').addClass('k-rtl');
    });

    
    $("#grid").data("kendoGrid").bind("filterMenuInit", filterMenuInit);

}

function getCasesServices() {
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: SystmeCodeWebAPIBaseUrl + "api/DetailCode/GetMasterCodeByMultiCode?masterCode=cSrv,cDis",
        async: true,
        headers: getHeaders(),
        beforeSend: function () {
            $("#imgAjaxLoader").show();
        },
        success: function (data) {
            $("#imgAjaxLoader").hide();
            $(".caseServiceDiv").html("");
            $(".caseDiseaseDiv").html("");
            var perantId = $("#caseCategoryHID").val();
            $.each(data, function (key, value) {
                if (perantId == value.ParentId) { //Parent.Id) {
                    if (value.masterCodeValue == "cSrv") {
                        var chck = ""
                        //if (checkIfServiceExsist(value.Id.toString())) {
                        //    chck = "checked";
                        //}
                        var temp = '<div class="col-sm-3"><input  onclick="changeService(#ServiceId#)"  type="checkbox"  ' + chck + ' > #ServiceName# </div>';
                        var res = "";
                        if (_cultureIsArabic) {
                            res = temp.replace("#ServiceName#", value.NameAr).replace("#ServiceId#", "'" + value.Id + "'");
                        }
                        else {
                            res = temp.replace("#ServiceName#", value.NameEn).replace("#ServiceId#", "'" + value.Id + "'");
                        }
                        $(".caseServiceDiv").append(res);
                    }

                    else if (value.masterCodeValue == "cDis") {
                        var chck = ""
                        var temp = '<div class="col-sm-3"><input  onclick="changeService(#DisesaseId#)" type="checkbox" ' + chck + '> #DiseaseName# </div>';
                        var res = "";
                        if (_cultureIsArabic) {
                            res = temp.replace("#DiseaseName#", value.NameAr).replace("#DisesaseId#", "'" + value.Id + "'");
                        }
                        else {
                            res = temp.replace("#DiseaseName#", value.NameEn).replace("#DisesaseId#", "'" + value.Id + "'");
                        }
                        $(".caseDiseaseDiv").append(res);
                    }
                }
            });
        },
        error: function (xhr) {
            $("#imgAjaxLoader").hide();
            toastr.error(xhr.statusText);
        }
    });
}
