
import GlobalConfig from "../../config.js";
import toastService from "../../helpers/toastService.js";
import addedPensionByPeriodicalContributionFactors from "../../data/added_pension_by_periodical_contribution_factors.js";
import addedPensionRevaluationFactorByYears from "../../data/added_pension_revaluation_factors.js";

class Pension {
    domClasses = Object.freeze({
        weighInContainer: 'weigh-ins-entry-container',
        removeSectionBtn: 'remove-section-btn',
        addedPensionPayment :'added-pension-payment',
        addedPensionType: 'added-pension-type',
        addedPensionPeriod: 'added-pension-period',
        addedPensionAmount: 'added-pension-amount',
    });

    domIds = Object.freeze({
        yearSelector: 'year-selector',
        pensionForm: 'pension-form',
        addAnotherPensionPayment: 'add-another-pension-payment',
        pensionResults: 'pension-results',
        addedPensionContainer: 'added-pension-container',
        ageInput: 'age',
        normalPensionAgeInput: 'normal-pension-age',
    });

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
        document.querySelector(`#${this.domIds.yearSelector}`).selected = "24_25";

        this.addYearListener();
        this.addAnotherPensionPaymentListener();
        this.calculatePensionForecastListener();
    }

    calculatePensionForecastListener() {
        document.getElementById(this.domIds.pensionForm).addEventListener("submit", (e) => {
            e.preventDefault();

            const isValid = this.validatePensionForm();
            if (!isValid) return;

            this.addPensionForecastHtmlResult();
        });
    }

    validatePensionForm() {
        try {
            const defaults = {
                "age": { min: 18, max: 100 },
                "normalPensionAge": { min: 58, max: 80 },
                "type": ["self", "self+dependants"],
                'period': ['monthly', 'yearly'],
            };

            const payments = [];
            const paymentElements = [...document.querySelectorAll(`.${this.domClasses.addedPensionPayment}`)];
            for (const paymentElement of paymentElements) {
                const type = paymentElement.querySelector(`.${this.domClasses.addedPensionType}`).value;
                if (!defaults.type.includes(type)) {
                    toastService.addToast(`Type must be one of: ${defaults.type.join(", ")}`, GlobalConfig.LOG_LEVEL.ERROR)
                    return;
                }

                const period = paymentElement.querySelector(`.${this.domClasses.addedPensionPeriod}`).value;
                if (!defaults.period.includes(period)) {
                    toastService.addToast(`Period must be one of: ${defaults.period.join(", ")}`, GlobalConfig.LOG_LEVEL.ERROR)
                    return;
                }

                const amount = parseFloat(paymentElement.querySelector(`.${this.domClasses.addedPensionAmount}`).value);
                if (isNaN(amount) || amount < 0) {
                    toastService.addToast(`Amount must be a positive number.`, GlobalConfig.LOG_LEVEL.ERROR)
                    return;
                }
                payments.push({ type: type, period: period, amount: amount });
            }

            const age = parseInt(document.getElementById(this.domIds.ageInput).value, 10);
            if (typeof age !== "number" || age < defaults.age.min || age > defaults.age.max) {
                toastService.addToast(`Age must be between ${defaults.age.min} and ${defaults.age.max}.`, GlobalConfig.LOG_LEVEL.ERROR)
                return;
            }

            const normalPensionAge = parseInt(document.getElementById(this.domIds.normalPensionAgeInput).value, 10);
            if (typeof normalPensionAge !== "number" || normalPensionAge < normalPensionAge.min || normalPensionAge > defaults.normalPensionAge.max) {
                toastService.addToast(`Normal pension age must be between ${defaults.normalPensionAge.min} and ${defaults.normalPensionAge.max}.`, GlobalConfig.LOG_LEVEL.ERROR)
                return;
            }

            this.parameters = {
                age: age,
                normalPensionAge: normalPensionAge,
                payments: payments
            }
            return true;
        }
        catch (error) {
            toastService.addToast(`Invalid JSON format in parameters. Please check your input.`, GlobalConfig.LOG_LEVEL.ERROR)
            return false;
        }
    }

    addYearListener() {
        document.getElementById(this.domIds.yearSelector).addEventListener("change", (e) => {
            const year = e.target.value;
            const data = this.defaults[year];
            if (!data) return;

            this.setFormValues(data);
        });
    }

    addAnotherPensionPaymentListener() {
        document.getElementById(this.domIds.addAnotherPensionPayment).addEventListener("click", (e) => {
            e.preventDefault();
            this.addHtmlPaymentRow();
        });
    }

    removePensionPaymentListener(index) {
        document.querySelectorAll(`.${this.domClasses.removeSectionBtn}`)[index].addEventListener("click", (e) => {
            e.preventDefault();
            e.target.closest(`.${this.domClasses.addedPensionPayment}`).remove();
        });
    }

    addPensionForecastHtmlResult() {
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
        document.querySelector(`#${this.domIds.pensionResults}`).appendChild(resultElement.firstElementChild);
    }

    addHtmlPaymentRow() {
        const rows = [...document.querySelectorAll(`.${this.domClasses.addedPensionPayment}`)].length;
        const index = rows;

        const addedPensionPayment = document.createElement('div');
        addedPensionPayment.classList.add(this.domClasses.addedPensionPayment);
        addedPensionPayment.dataset.index = rows - 1;

        const html = `
            <div class="section-header-row">
                <h3 class="pension-section-header">Pension Payment ${index}</h3>
                <button type="button" class="remove-section-btn">Remove Section</button>
            </div>

            <div class="form-row">
                <label>
                    Type
                    <select class="${this.domClasses.addedPensionType}" name="${this.domClasses.addedPensionType}">
                        <option value="self">Self</option>
                        <option value="self+dependants">Self + Dependants</option>
                    </select>
                </label>

                <label>
                    Period
                    <select class="${this.domClasses.addedPensionPeriod}" name="${this.domClasses.addedPensionPeriod}">
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                    </select>
                </label>
            </div>

            <label>
                Amount
                <input type="number" class="${this.domClasses.addedPensionAmount}" name="${this.domClasses.addedPensionAmount}" min="0" step="1">
            </label>
        `;
        addedPensionPayment.innerHTML = html;

        const addedPensionContainer = document.querySelector(`#${this.domIds.addedPensionContainer}`);
        addedPensionContainer.appendChild(addedPensionPayment);

        this.removePensionPaymentListener(index);
    }

    resetForm() {
        const allPensionDivs = [...document.querySelectorAll(`.${this.domClasses.addedPensionPayment}`)];
        for (let i = 0; i < allPensionDivs.length; i++) {
            allPensionDivs[i].remove();
        }
    }

    setFormValues(pension) {
        this.resetForm();

        const pensionPaymentsTotal = pension.pensionPayments.length;
        for (let i = 0; i < pensionPaymentsTotal; i++) {
            this.addHtmlPaymentRow();
            this.setHtmlValuesForPayment(i, pension.pensionPayments[i]);
        }

        document.getElementById(this.domIds.ageInput).value = pension.age;
        document.getElementById(this.domIds.normalPensionAgeInput).value = pension.normalPensionAge;
    }

    setHtmlValuesForPayment(index, payment) {
        const pensionDiv = document.querySelectorAll(`.${this.domClasses.addedPensionPayment}`)[index];
        pensionDiv.querySelector(`.${this.domClasses.addedPensionType}`).value = payment.type;
        pensionDiv.querySelector(`.${this.domClasses.addedPensionPeriod}`).value = payment.period;
        pensionDiv.querySelector(`.${this.domClasses.addedPensionAmount}`).value = payment.amount;
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
