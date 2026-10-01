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

function GenderFilter(element) {
    element.kendoDropDownList({
        dataSource: [
            { text: "Male", value: "6807" },
            { text: "Female", value: "6808" }
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
                    //Id: { type: "string" },
                    //Name: { type: "string" },
                    //Description: { type: "string" },
                    //Mobile: { type: "string" },
                    //Age: { type: "string" },
                    //Region: { type: "string" },
                    //ServiceName: { type: "string" },
                    //DisesName: { type: "string" },
                    //CreatedOn: { type: "date" },
                    Id: { type: "string" },
                    Name: { type: "string" },
                    Description: { type: "string" },
                    Mobile: { type: "string" },
                    Phone: { type: "string" },
                    Age: { type: 'string' },
                    NationalityName: { type: 'string' },
                    Governorate: { type: 'string' },
                    District: { type: 'string' },
                    Region: { type: "string" },
                    ServiceName: { type: "string" },
                    DisesName: { type: "string" },
                    CreatedOn: { type: "date" },
                    ReligionName: { type: 'string' },
                    StatusInEgyptName: { type: 'string' },
                    GenderName: { type: 'string' },
                    CaseStatus: { type: 'string' }
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
        sortable: false,
        groupable: {
            messages: {
                empty: DragaColumnHeaderAndDropItHereToGroupByThatColumn, //Drag a column header and drop it here to group by that column"
            }
        },
        columns: [


            {
                field: "Id",
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
                    //var allowToUser = false;
                    //var isFilter = $("#IsFilters").val();
                    //if (dataItem.row_number == 1 && isFilter == "NoFilter") { //allowToUser
                    //    var _grid = $("#grid").data("kendoGrid");
                    //    var pageNumber = _grid.dataSource.page();
                    //    if (pageNumber == 1) {
                    //        allowToUser = true;
                    //    }
                    //}
                    //return "<a href='/Case/Details?id=" + dataItem.Id + "&allowToUser=" + allowToUser + "' target='_blank'>" + dataItem.Id + "</a>";
                    return "<a href='/Case/Details?id=" + dataItem.Id + "' target='_blank'>" + dataItem.Id + "</a>";

                },
                width: 100,
            },
            {
                field: "Name",
                title: CaseName,
                template: function (dataItem) {
                    //var allowToUser = false;
                    //var isFilter = $("#IsFilters").val();
                    //if (dataItem.row_number == 1 && isFilter == "NoFilter") { //allowToUser
                    //    var _grid = $("#grid").data("kendoGrid");
                    //    var pageNumber = _grid.dataSource.page();
                    //    if (pageNumber == 1) {
                    //        allowToUser = true;
                    //    }
                    //}
                    //return "<a href='/Case/Details?id=" + dataItem.Id + "&allowToUser=" + allowToUser + "' target='_blank'>" + dataItem.Name + "</a>";
                    return "<a href='/Case/Details?id=" + dataItem.Id + "' target='_blank'>" + dataItem.Name + "</a>";
                },
                width: 170,
                locked: true,
            },
            {
                command: [
                    {
                        name: "Report",
                        text: "",
                        iconClass: "fa fa-print",
                        click: function (e) {
                            var tr = $(e.target).closest("tr");
                            var dataRow = this.dataItem(tr);
                            var rowIdx = $("tr", grid.tbody).index(tr);
                            var ReportUrl = MersalUIBaseUrl + "Reports1/ReportViewer.aspx?ReportName=CaseDetails&ReportType=pdf&CaseId=" + dataRow.Id;
                            var win = window.open(ReportUrl, '_blank');
                            win.focus();
                        },
                    },
                ]
                , title: Report, width: 90,
            },
            {
                field: "Description",
                title: Description,
                width: 250,
            },
            {
                field: "Mobile",
                title: Mobile,
                width: 120,
            },
            {
                field: "Phone",
                title: Phone,
                width: 120,
            },
            {
                field: "Age",
                title: Age,
                type: "string",
                filterable: {
                    extra: false,
                    ui: AgeFilter
                },
                width: 50,
            },
            {
                field: "GenderName",
                title: Gender,
                type: "string",
                width: 80,
                //filterable: {
                //    extra: false,
                //    ui: GenderFilter
                //},
            },
            {
                field: "NationalityName",
                title: Nationality,
                width: 120,
            },
            {
                field: "ReligionName",
                title: Religion,
                width: 120,
            },
            {
                field: "StatusInEgyptName",
                title: StatusInEgypt,
                width: 120,
            },
            {
                field: "GovernorateName",
                title: Governorate,
                width: 120,
            },
            {
                field: "DistrictName",
                title: District,
                width: 120,
            },

            {
                field: "Region",
                title: Region,
                width: 120,
            },

            {
                field: "AddressLine1",
                title: AddressLine1,
                width: 200,
            },
            {
                field: "ServiceName",
                title: ServiceName,
                width: 130,
            },
            {
                field: "DisesName",
                title: DisesName,
                width: 130,
            },
            {
                field: "CaseStatus",
                title: CaseStatus,
                width: 130,
            },
            {
                field: "CreatedOn",
                title: CreatedOn,
                type: "date",
                format: "{0:d/M/yyyy h:mm}",
                parseFormats: ["MM/dd/yyyy h:mm:ss"],
                //filterable: false,
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
                , width: 130

            },
            {
                command: [
                    {
                        name: "History",
                        text: "",
                        iconClass: "fa fa-print",
                        click: function (e) {
                            var tr = $(e.target).closest("tr");
                            var dataRow = this.dataItem(tr);
                            var rowIdx = $("tr", grid.tbody).index(tr);
                            var ReportUrl = MersalUIBaseUrl + "Reports1/ReportViewer.aspx?ReportName=CaseHistory&ReportType=pdf&CaseId=" + dataRow.Id;
                            var win = window.open(ReportUrl, '_blank');
                            win.focus();
                        },
                    },
                ]
                , title: "History", width: 90,
            },

        ]
    });
    $('.k-grid-filter').click(function () {
        $('.k-animation-container').addClass('k-rtl');
    });

    //$("#grid").data("kendoGrid").bind("dataBound", function () {
    //    if (this.dataSource.filter()) {
    //        $("#IsFilters").val("Filter");
    //    }
    //    else {
    //        $("#IsFilters").val("NoFilter");
    //    }
    //});

    $("#grid").data("kendoGrid").bind("filterMenuInit", filterMenuInit);

};

function getCasesServices() {
    $.ajax({
        type: "GET",
        contentType: "application/json",
        url: SystmeCodeWebAPIBaseUrl + "api/DetailCode/GetMasterCodeByMultiCode?masterCode=cSrv,cDis",
        async: true,
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
                        //if (checkIfServiceExsist(value.Id.toString())) {
                        //    chck = "checked";
                        //}
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
