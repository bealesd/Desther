
import GlobalConfig from "../../config.js";
import toastService from "../../helpers/toastService.js";
import addedPensionByPeriodicalContributionFactors from "../../data/added_pension_by_periodical_contribution_factors.js";
import addedPensionRevaluationFactorByYears from "../../data/added_pension_revaluation_factors.js";

class Pension {
    constructor() {
        toastService.addToast('On Pension Page.', GlobalConfig.LOG_LEVEL.INFO, true);

        const defaults = {
            '25_26':{
                "age": 39,
                "oneTimeAddedPensionPayment": 0,
                "oneTimeAddedPensionType": "self+dependants",
                "monthlyAddedPensionPaymentType1": 830,
                "monthlyAddedPensionPaymentType2": 0,
                "normalPensionAge": 68,
                "addedPensionType1": "self+dependants",
                "addedPensionType2": "self",
            },
            '24_25':{
                "age": 38,
                "oneTimeAddedPensionPayment": 2129,
                "oneTimeAddedPensionType": "self+dependants",
                "monthlyAddedPensionPaymentType1": 520,
                "monthlyAddedPensionPaymentType2": 0,
                "normalPensionAge": 68,
                "addedPensionType1": "self+dependants",
                "addedPensionType2": "self",
            },
            '23_24': {
                "age": 37,
                "oneTimeAddedPensionPayment": 0,
                "oneTimeAddedPensionType": "self+dependants",
                "monthlyAddedPensionPaymentType1": 554,
                "monthlyAddedPensionPaymentType2": 115,
                "normalPensionAge": 68,
                "addedPensionType1": "self+dependants",
                "addedPensionType2": "self",
            },
            '22_23': {
                "age": 36,
                "oneTimeAddedPensionPayment": 0,
                "oneTimeAddedPensionType": "self+dependants",
                "monthlyAddedPensionPaymentType1": 0,
                "monthlyAddedPensionPaymentType2": 115,
                "normalPensionAge": 68,
                "addedPensionType1": "self+dependants",
                "addedPensionType2": "self",
            }
        }

        this.parameters = defaults['24_25'];

        document.querySelector("#params").value = JSON.stringify(defaults['24_25'], null, 4);
        document.querySelector("#yearSelector").selected = "24_25";

        document.querySelector("#yearSelector").addEventListener("change", (event) => {
            const year = event.target.value;
            document.querySelector("#params").value = JSON.stringify(defaults[`${year}`], null, 4);    
        });
        
        document.querySelector("#calculate").addEventListener("click", () => {
            try {
                this.parameters = JSON.parse(document.querySelector("#params").value);
                const p = this.parameters;
                const defaults = {
                    "age": { min: 18, max: 100 },
                    "normalPensionAge": { min: 58, max: 80 },
                    "addedPensionType": ["self", "self+dependants"],
                };

                if (typeof p.age !== "number" || p.age < defaults.age.min || p.age > defaults.age.max) {
                    alert(`Age must be between ${defaults.age.min} and ${defaults.age.max}.`);
                    return;
                }
                if (typeof p.normalPensionAge !== "number" || p.normalPensionAge < defaults.normalPensionAge.min || p.normalPensionAge > defaults.normalPensionAge.max)  {
                    alert(`Normal pension age must be between ${defaults.normalPensionAge.min} and ${defaults.normalPensionAge.max}.`);
                    return;
                }
                if (!defaults.addedPensionType.includes(p.addedPensionType1)) {
                    alert(`addedPensionType1 must be one of: ${defaults.addedPensionType.join(", ")}`);
                    return;
                }
                if (!defaults.addedPensionType.includes(p.addedPensionType2)) {
                    alert(`addedPensionType2 must be one of: ${defaults.addedPensionType.join(", ")}`);
                    return;
                }
                if (typeof p.monthlyAddedPensionPaymentType1 !== "number" || p.monthlyAddedPensionPaymentType1 < 0) {
                    alert("monthlyAddedPensionPaymentType1 must be a positive number.");
                    return;
                }
                if (typeof p.monthlyAddedPensionPaymentType2 !== "number" || p.monthlyAddedPensionPaymentType2 < 0) {
                    alert("monthlyAddedPensionPaymentType2 must be a positive number.");
                    return;
                }
                const maxMonthly = Math.min(p.pensionableEarnings / 12, 2000);
                if (p.monthlyAddedPensionPayment > maxMonthly) {
                    alert(`monthlyAddedPensionPayment cannot be more than £${maxMonthly.toFixed(2)} (pensionableEarnings/12, max £2000).`);
                    return;
                }
            }
            catch (error) {
                alert("Invalid JSON format in parameters. Please check your input.");
                return;
            }

            let addedPensionForOneTimePayment = this.calculateAddedPensionForYearForGivenAge(this.parameters.oneTimeAddedPensionPayment, this.parameters.age, this.parameters.addedPensionType1);
           
            let totalContributionsForYearType1 = 12 * this.parameters.monthlyAddedPensionPaymentType1;
            let addedPensionForYearType1 = this.calculateAddedPensionForYearForGivenAge(totalContributionsForYearType1, this.parameters.age, this.parameters.addedPensionType1);
            
            let totalContributionsForYearType2 = 12 * this.parameters.monthlyAddedPensionPaymentType2;
            let addedPensionForYearType2 = this.calculateAddedPensionForYearForGivenAge(totalContributionsForYearType2, this.parameters.age, this.parameters.addedPensionType2);

            const resultElement = document.createElement("div");
            resultElement.innerHTML = `
                    <p>------------</p>
                    <p>${JSON.stringify(this.parameters)}</p>
                    <p>------------------------------------------------------------------------------------</p>
                    <p>total contributions for ${this.parameters.addedPensionType1}: £${totalContributionsForYearType1}</p>
                    <p>added pension for ${this.parameters.addedPensionType1}: £${addedPensionForYearType1}</p>
                    <p>------------------------------------------------------------------------------------</p>
                    <p>total contributions for ${this.parameters.addedPensionType2}: £${totalContributionsForYearType2}</p>   
                    <p>added pension for ${this.parameters.addedPensionType2}: £${addedPensionForYearType2}</p>
                    <p>------------------------------------------------------------------------------------</p>
                    <p>total contributions for one time payment: ${this.parameters.addedPensionType1}: £${this.parameters.oneTimeAddedPensionPayment}</p>
                    <p>added pension one time payment for ${this.parameters.addedPensionType1}: £${addedPensionForOneTimePayment}</p>
            `;

            document.querySelector("#results").appendChild(resultElement);
        });
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
