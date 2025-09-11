
import GlobalConfig from "../../config.js";
import toastService from "../../helpers/toastService.js";
import addedPensionByPeriodicalContributionFactors from "../../data/added_pension_by_periodical_contribution_factors.js";
import addedPensionRevaluationFactorByYears from "../../data/added_pension_revaluation_factors.js";

class Pension {
    constructor() {
        toastService.addToast('On Pension Page.', GlobalConfig.LOG_LEVEL.INFO, true);

        this.defaults = {
            '25_26': {
                "age": 39,
                "pensionPayments": [
                    {
                        'type': "self+dependants",
                        'period': 'monthly',
                        'amount': 830
                    }
                ],
                "normalPensionAge": 68,
            },
            '24_25': {
                "age": 38,
                "pensionPayments": [
                    {
                        'type': "self+dependants",
                        'period': 'yearly',
                        'amount': 2129
                    },
                    {
                        'type': "self+dependants",
                        'period': 'monthly',
                        'amount': 520
                    }
                ],
                "normalPensionAge": 68,
            },
            '23_24': {
                "age": 37,
                "pensionPayments": [
                    {
                        'type': "self+dependants",
                        'period': 'monthly',
                        'amount': 554
                    },
                    {
                        'type': "self",
                        'period': 'monthly',
                        'amount': 115
                    }
                ],
                "normalPensionAge": 68,
            },
            '22_23': {
                "age": 36,
                "pensionPayments": [
                    {
                        'type': "self",
                        'period': 'monthly',
                        'amount': 115
                    }
                ],
                "normalPensionAge": 68,
            }
        }

        this.parameters = this.defaults['24_25'];

        this.setFormValues(this.defaults['24_25']);
        document.querySelector("#yearSelector").selected = "24_25";

        this.addYearListener();
        this.addAnotherPensionPaymentListener();

        document.getElementById("pensionForm").addEventListener("submit", (e) => {
            e.preventDefault();
            try {
                const defaults = {
                    "age": { min: 18, max: 100 },
                    "normalPensionAge": { min: 58, max: 80 },
                    "type": ["self", "self+dependants"],
                    'period': ['monthly', 'yearly'],
                };

                const payments = [];
                const paymentElements = [...document.querySelectorAll('.added-pension-payment')];
                for (const paymentElement of paymentElements) {
                    const type = paymentElement.querySelector('.addedPensionType').value;
                    if (!defaults.type.includes(type)) {
                        alert(`type must be one of: ${defaults.type.join(", ")}`);
                        return;
                    }

                    const period = paymentElement.querySelector('.addedPensionPeriod').value;
                    if (!defaults.period.includes(period)) {
                        alert(`period must be one of: ${defaults.period.join(", ")}`);
                        return;
                    }

                    const amount = parseFloat(paymentElement.querySelector('.added-pension-amount').value);
                    if (isNaN(amount) || amount < 0) {
                        alert("amount must be a positive number.");
                        return;
                    }
                    payments.push({ type: type, period: period, amount: amount });
                }

                const age = parseInt(document.getElementById("age").value, 10);
                if (typeof age !== "number" || age < defaults.age.min || age > defaults.age.max) {
                    alert(`Age must be between ${defaults.age.min} and ${defaults.age.max}.`);
                    return;
                }

                const normalPensionAge = parseInt(document.getElementById("normalPensionAge").value, 10);
                if (typeof normalPensionAge !== "number" || normalPensionAge < normalPensionAge.min || normalPensionAge > defaults.normalPensionAge.max) {
                    alert(`Normal pension age must be between ${defaults.normalPensionAge.min} and ${defaults.normalPensionAge.max}.`);
                    return;
                }

                this.parameters = {
                    age: age,
                    normalPensionAge: normalPensionAge,
                    payments: payments
                }
            }
            catch (error) {
                alert("Invalid JSON format in parameters. Please check your input.");
                return;
            }

            const resultElement = document.createElement("div");
            const resultContainer = document.createElement("div");
            resultContainer.classList.add("results-container");
            resultElement.appendChild(resultContainer);

            let resultContainerHTML = '';
            for (const payment of this.parameters.payments) {
                let totalContributionsForYear;
                if (payment.period === 'monthly')
                    totalContributionsForYear = 12 * payment.amount;
                else if (payment.period === 'yearly')
                    totalContributionsForYear = payment.amount;
                const addedPension = this.calculateAddedPensionForYearForGivenAge(totalContributionsForYear, this.parameters.age, payment.type);
                resultContainerHTML +=
                    `
                        <div class="results-block">
                            <h4>${payment.period.toUpperCase()} - ${payment.type.toUpperCase()}</h4>
                            <table>
                                <tr>
                                <td>${payment.period} Contribution:</td>
                                <td>£${payment.amount}</td>
                                <td class="calc">→ £${totalContributionsForYear} total</td>
                                </tr>
                                <tr>
                                <td>Calculated Pension:</td>
                                <td></td>
                                <td class="calc">£${addedPension}</td>
                                </tr>
                            </table>
                        </div>
                `;
            }
            resultContainer.innerHTML = resultContainerHTML;
            document.querySelector("#pension-results").appendChild(resultElement.firstElementChild);
        });
    }

    addPensionFormSubmitListener() {
        document.getElementById("pensionForm").addEventListener("submit", (e) => {
            e.preventDefault();
            try {
                const defaults = {
                    "age": { min: 18, max: 100 },
                    "normalPensionAge": { min: 58, max: 80 },
                    "type": ["self", "self+dependants"],
                    'period': ['monthly', 'yearly'],
                };

                const payments = [];
                const paymentElements = [...document.querySelectorAll('.added-pension-payment')];
                for (const paymentElement of paymentElements) {
                    const type = paymentElement.querySelector('.addedPensionType').value;
                    if (!defaults.type.includes(type)) {
                        alert(`type must be one of: ${defaults.type.join(", ")}`);
                        return;
                    }

                    const period = paymentElement.querySelector('.addedPensionPeriod').value;
                    if (!defaults.period.includes(period)) {
                        alert(`period must be one of: ${defaults.period.join(", ")}`);
                        return;
                    }

                    const amount = parseFloat(paymentElement.querySelector('.added-pension-amount').value);
                    if (isNaN(amount) || amount < 0) {
                        alert("amount must be a positive number.");
                        return;
                    }
                    payments.push({ type: type, period: period, amount: amount });
                }

                const age = parseInt(document.getElementById("age").value, 10);
                if (typeof age !== "number" || age < defaults.age.min || age > defaults.age.max) {
                    alert(`Age must be between ${defaults.age.min} and ${defaults.age.max}.`);
                    return;
                }

                const normalPensionAge = parseInt(document.getElementById("normalPensionAge").value, 10);
                if (typeof normalPensionAge !== "number" || normalPensionAge < normalPensionAge.min || normalPensionAge > defaults.normalPensionAge.max) {
                    alert(`Normal pension age must be between ${defaults.normalPensionAge.min} and ${defaults.normalPensionAge.max}.`);
                    return;
                }

                this.parameters = {
                    age: age,
                    normalPensionAge: normalPensionAge,
                    payments: payments
                }
            }
            catch (error) {
                alert("Invalid JSON format in parameters. Please check your input.");
                return;
            }

            const resultElement = document.createElement("div");
            const resultContainer = document.createElement("div");
            resultContainer.classList.add("results-container");
            resultElement.appendChild(resultContainer);

            let resultContainerHTML = '';
            for (const payment of this.parameters.payments) {
                let totalContributionsForYear;
                if (payment.period === 'monthly')
                    totalContributionsForYear = 12 * payment.amount;
                else if (payment.period === 'yearly')
                    totalContributionsForYear = payment.amount;
                const addedPension = this.calculateAddedPensionForYearForGivenAge(totalContributionsForYear, this.parameters.age, payment.type);
                resultContainerHTML +=
                    `
                        <div class="results-block">
                            <h4>${payment.period.toUpperCase()} - ${payment.type.toUpperCase()}</h4>
                            <table>
                                <tr>
                                <td>${payment.period} Contribution:</td>
                                <td>£${payment.amount}</td>
                                <td class="calc">→ £${totalContributionsForYear} total</td>
                                </tr>
                                <tr>
                                <td>Calculated Pension:</td>
                                <td></td>
                                <td class="calc">£${addedPension}</td>
                                </tr>
                            </table>
                        </div>
                `;
            }
            resultContainer.innerHTML = resultContainerHTML;
            document.querySelector("#pension-results").appendChild(resultElement.firstElementChild);
        });
    }

    addYearListener() {
        document.getElementById("yearSelector").addEventListener("change", (e) => {
            const year = e.target.value;
            const data = this.defaults[year];
            if (!data) return;

            this.setFormValues(data);
        });
    }

    addAnotherPensionPaymentListener() {
        document.getElementById("addAnotherPensionPayment").addEventListener("click", (e) => {
            e.preventDefault();
            this.addHtmlPaymentRow();
        });
    }

    addHtmlPaymentRow() {
        const allPensionDivs = document.querySelectorAll('.added-pension-payment');
        const lastDiv = allPensionDivs[allPensionDivs.length - 1];
        const newDiv = lastDiv.cloneNode(true);

        // 3. Find all input, select, and textarea elements within the new clone.
        const inputs = newDiv.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            // A. For text-based inputs and textareas, clear the value.
            if (input.type === 'text' || input.type === 'number' || input.type === 'email' || input.tagName === 'TEXTAREA') {
                input.value = '';
            }
            // B. For checkboxes and radio buttons, uncheck them.
            else if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false;
            }
            // C. For select elements, reset to the first option.
            else if (input.tagName === 'SELECT') {
                input.selectedIndex = 0;
            }
        });

        // Append the new div to the last existing one
        if (lastDiv) {
            lastDiv.appendChild(newDiv);
        }
    }

    setFormValues(pension) {
        const pensionPaymentsTotal = pension.pensionPayments.length;
        if (pensionPaymentsTotal > 1) {
            for (let i = 1; i < pensionPaymentsTotal; i++) {
                this.addHtmlPaymentRow();
                this.setHtmlValuesForPayment(i, pension.pensionPayments[i]);
            }
        }
        else {
             this.setHtmlValuesForPayment(0, pension.pensionPayments[0]);
        }

        document.getElementById("age").value = pension.age;
        document.getElementById("normalPensionAge").value = pension.normalPensionAge;
    }

    setHtmlValuesForPayment(index, payment) {
        const pensionDiv = document.querySelectorAll('.added-pension-payment')[index];
        pensionDiv.querySelector('.addedPensionType').value = payment.type;
        pensionDiv.querySelector('.addedPensionPeriod').value = payment.period;
        pensionDiv.querySelector('.added-pension-amount').value = payment.amount;
    }

    /**
     * Calculates added pension for the whole year for a given age
     *
     * @param {number} totalContributionsForPeriod the total contributed amount of added pension for the year
     * @param {number} age the age of the person for that year
     * @returns {number} added pension pot for that year
     */
    calculateAddedPensionForYearForGivenAge = (totalContributionsForPeriod, age, pensionType) => {
        return Math.round(
            totalContributionsForPeriod / (this.getAddedPensionByPeriodicalContributionFactors(age, pensionType) * this.getAddedPensionRevaluationFactorByYears(age))
        );
    };

    /**
     * Gets the added pension by periodical contribution factors
     *
     * https://www.civilservicepensionscheme.org.uk/media/btmmnayj/alpha-added-pension-factors-and-guidance.pdf
     *
     * @param {age}
     * @returns {float}
     */
    getAddedPensionByPeriodicalContributionFactors = (age, pensionType) => {
        const factorPart = addedPensionByPeriodicalContributionFactors[this.parameters.normalPensionAge][age];
        return factorPart[pensionType == "self+dependants" ? 2 : 0];
    };

    /**
     * Gets the added pension revaluation factor by years
     *
     * https://www.civilservicepensionscheme.org.uk/media/oislhmme/early-and-late-retirement-factors-and-guidance-alpha.pdf
     *
     * @param {age}
     * @returns {float}
     */
    getAddedPensionRevaluationFactorByYears = (age) => {
        return addedPensionRevaluationFactorByYears[this.parameters.normalPensionAge - age].factor;
    };
}

// Called by contentLoader, when loading the correspond page.
window.scripts = { init: () => { new Pension(); } }
