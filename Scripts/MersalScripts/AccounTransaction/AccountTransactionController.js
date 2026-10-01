var transactionId = 0;
function getReverse(Id) {
    transactionId = Id;
    $("#ReverseModal").modal("show")
    $("#descriptionValid").hide();
    $("#reverseDescription").val('')
}
function reverseExecute() {
    $("#descriptionValid").hide();
    var description = $("#reverseDescription").val();
    if (description == null || description == "") {
        $("#descriptionValid").show();
        return;
    }
    var apiurl = MersalWebAPIBaseUrl + "api/AccountTransaction/ReverseTransaction?transactionId=" + transactionId + "&description=" + description;
    $.ajax({
        type: "get",
        contentType: "application/json",
        url: apiurl,
        crossDomain: true,
        headers: getHeaders(),
        //data: JSON.stringify(DTO),
        async: false,
        success: function (data) {

            if (data > 0) {
                toastr.success(SuccessfullyAdd + " - " + data);
                HideAnyModal();
            }
            else {
                toastr.error(Error);
            }
        },
        error: function (xhr) {
            HideAnyModal();
            toastr.error(xhr.error);
        }
    });
}
kendo.culture(_culture);
$(function () {

    $('.modal').on('hide.bs.modal', function () {
        $("#grid").data("kendoGrid").dataSource.read();
    });

    BindGrid()
    $('.k-grid-filter').click(function () {
        $('.k-animation-container').addClass('k-rtl');
    });

    $("#AccountDRP").kendoComboBox({
        placeholder: AccountDRPPlacholder,
        dataTextField: "Name",
        dataValueField: "Id",
        filter: "contains",
        dataSource: {
            transport: {
                read: {
                    url: MersalWebAPIBaseUrl + "api/Accounts/GetAllAccount",
                    headers: getHeaders()
                }
            }
        }
          ,
        filter: "contains",
        suggest: true,
    });
});

kendo.culture(_culture);
function HideAnyModal() {
    $(".modal").modal('hide');
}

function BindGrid() {
    var GetAllTransactionsUrl = MersalWebAPIBaseUrl + "api/AccountTransaction/GetAllTransaction?describtion=" + $('#describtion').val() + "&AccountId=" + $('#AccountDRP').val();

    var dataSource = new kendo.data.DataSource({
        transport: {
            read: {
                url: GetAllTransactionsUrl,
                dataType: "json",
                headers: getHeaders(),
            },
            parameterMap: function (options, operation) {
                //var caseStateURL = getUrlParameter("Cstate");
                //console.log(caseStateURL);
                //var filterByState = { filterByState: caseStateURL };
                //$.extend(options, filterByState);
                //$.extend(options, filterByState);
                //console.log(options);
                return options;
            }
        },
        schema: {
            total: function (data) {
                return data.Total;

            },
            data: function (data) {

                return data.Data;
            },

            model: {
                Id: "Id",
                fields: {
                    Id: { type: "number" },
                    value: { type: "number" },
                    describtion: { type: "string" },

                    CreatedOn: { type: "date" },
                }
            }
        },
        type: "json",
        pageSize: 10,
        serverPaging: true,
        serverFiltering: true,
        serverSorting: true
    });
    $("#grid").kendoGrid({
        dataSource: dataSource,
        filterable: {
            extra: false
        },
        //filterable : true,
        sortable: true,
        pageable: {
            messages: {
                itemsPerPage: '',
                display: '',
                page: '',
                of: '',
                empty: ''
            },

            refresh: true,
            pageSizes: true,
            buttonCount: 5
        },
        resizable: true,
        width: '100%',
        sortable: false,

        columns: [
            {
                field: "Id",
                title: 'Id',
                filterable: false,
                hidden: true,

            },
            {
                field: "valueGrid",
                title: valueTitle,

            },
            {
                field: "describtion",
                title: dexriptionTitle,

            },
            {
                field: typeColume,
                title: typeTitle,

            },

            {
                field: "CreateOn",
                title: CreatedOn,
                type: "date",
                format: "{0:d/MM/yyyy }",
                //parseFormats: ["MM/dd/yyyy h:mm:ss"],
                //filterable: false,
                filterable: {
                    extra: true, //do not show extra filters
                    operators: {
                        date: {
                            eq: "Is equal to",
                            after: "Is after",
                            befor: "Is before"
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
            },

        {
            filterable: false,
            sortable: false,
            title: reverseTitle,
            template: "<div class='text-center'><a style='cursor: pointer;color: \\#3c8dbc!important' onclick=getReverse(#=Id#)><i class='fa  fa-refresh fa-fw fa-2x'></i></a></div>"

        }
        ]
    });
}