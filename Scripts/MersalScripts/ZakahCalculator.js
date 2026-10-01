/**All Forms For Zakat */
var GoldForm = document.getElementById("GoldForm"),
    PreciousStones = document.getElementById("PreciousStones"),
    SilverForm = document.getElementById("SilverForm"),
    MoneyForm = document.getElementById("MoneyForm"),
    LoansAndInvestments = document.getElementById("LoansAndInvestments"),
    RealEstateInvestments = document.getElementById("RealEstateInvestments");
BusinessForm = document.getElementById("BusinessForm"),
    CompaniesSharesForm = document.getElementById("CompaniesSharesForm"),
    AgriculturalProductsForm = document.getElementById("AgriculturalProductsForm"),
    GeneralResponsibilitiesForm = document.getElementById("GeneralResponsibilitiesForm");

/**Variables to sum etch section */
var totalZakat,
    totalGoldAmount,
    totalPreciousStones,
    totalSilverValue,
    totalMoney,
    totalLoansAndInvestments,
    totalRealEstateInvestments,
    totalBusinessValue,
    totalCompaniesSharesValue,
    totalAgriculturalProductsValue,
    totalAnimalsAndBirdsValue,
    totalGeneralResponsibilitiesValue = 0;


/**
 * All Event Listeners At Form For Zakat
 */
addAllEventListeners();





function addAllEventListeners() {

    /** On Gold Form change  */
    GoldForm.addEventListener("input", function () {
        totalGoldAmount = calculateEstimatedGoldFormValue('weight24', 'price24', 'EstimatedValue24')
            + calculateEstimatedGoldFormValue('weight22', 'price22', 'EstimatedValue22') +
            calculateEstimatedGoldFormValue('weight18', 'price18', 'EstimatedValue18');
        // debugger
        const anotherAmount = $("#AnotherGoldAmount").val();
        if (anotherAmount) totalGoldAmount += parseFloat(anotherAmount) * 0.025;

        calcAndBindAllAmount();
    });



    addInputEventListener(PreciousStones, 'totalPreciousStones');
    addInputEventListener(SilverForm, 'totalSilverValue');
    addInputEventListener(MoneyForm, 'totalMoney');
    addInputEventListener(LoansAndInvestments, 'totalLoansAndInvestments');
    addInputEventListener(RealEstateInvestments, 'totalRealEstateInvestments');
    addInputEventListener(BusinessForm, 'totalBusinessValue');
    addInputEventListener(CompaniesSharesForm, 'totalCompaniesSharesValue');
    addInputEventListener(AgriculturalProductsForm, 'totalAgriculturalProductsValue');
    addInputEventListener(AnimalsAndBirdsForm, 'totalAnimalsAndBirdsValue');
    addInputEventListener(GeneralResponsibilitiesForm, 'totalGeneralResponsibilitiesValue');

}

function addInputEventListener(formElement, totalValueVariableName) {
    formElement.addEventListener("input", function () {
        const total = calculateTotalFormValues(formElement.id);
        window[totalValueVariableName] = total;
        calcAndBindAllAmount();
        $(`#${totalValueVariableName}Display`)?.html(total != 0 ? formatNumber(total) : '');

    });
}



/**calculateEstimatedGoldFormValue */
function calculateEstimatedGoldFormValue(weightElement, priceElement, outputElementId) {

    const weight = GoldForm.elements[weightElement].valueAsNumber;
    const price = GoldForm.elements[priceElement].valueAsNumber;

    const estimatedValue = isNaN(weight) || isNaN(price) ? 0 : weight * price;
    $(`#${outputElementId}`).html(estimatedValue != 0 ? formatNumber(estimatedValue) : '')

    return estimatedValue * .025
}


function calculateTotalFormValues(formId) {
    let total = 0;

    $(`#${formId} input`).each(function () {
        const inputValue = $(this).val();
        if (inputValue === '') {
            return; // skip empty fields
        }
        const inputAmount = isNaN(inputValue) ? 0 : parseFloat(inputValue);
        total += inputAmount * 0.025;
    });

    return total;
}


function calcAndBindAllAmount() {
    const allZakat = [
        totalZakat,
        totalGoldAmount,
        totalPreciousStones,
        totalSilverValue,
        totalMoney,
        totalLoansAndInvestments,
        totalRealEstateInvestments,
        totalBusinessValue,
        totalCompaniesSharesValue,
        totalAgriculturalProductsValue,
        totalAnimalsAndBirdsValue,
        totalGeneralResponsibilitiesValue
    ];
    const total = allZakat.reduce((acc, item) => !isNaN(item) ? acc + item : acc, 0);
    $("#totalAmount").val(total != 0 ? formatNumber(total) : '');
}

function formatNumber(num) {
    const formattedNum = (num).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return formattedNum.toString();
}