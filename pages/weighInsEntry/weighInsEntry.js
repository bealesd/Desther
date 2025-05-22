
import GlobalConfig from "../../config.js";
import Logger from "../../helpers/Logger.js";
import LoginHelper from "../../helpers/loginHelper.js";
import RequestHelper from "../../helpers/requestHelper.js";
import toastService from "../../helpers/toastService.js";

class WeighInsEntry {

    constructor() {
        toastService.addToast('On Weigh Ins Entry Page.', GlobalConfig.LOG_LEVEL.INFO);

        document.querySelector('#addWeighIn').addEventListener('click', (evt) => {
            this.addEntry(evt);
        });

        document.querySelector('.dateInput').value = this.#dateOfToday();

        this.init();
    }

    async init() {
        const weighIns = await this.#GetWeighIns();
        for (const weighIn of weighIns) {
            this.renderWeightRow(weighIn.Id, weighIn.Date, weighIn.DavidStone, weighIn.DavidPounds, weighIn.EstherStone, weighIn.EstherPounds);
        }
    }

    #dateOfToday() {
        return this.#getISO8060DateStringFromDateObject(new Date());
    }

    #getISO8060DateStringFromDateObject(dateObject) {
        return dateObject.toISOString().split('T')[0];
    }

    async #GetWeighIns() {
        const url = `${GlobalConfig.apis.weighIns}/GetWeighIns`;
        const weights = await RequestHelper.GetJsonWithAuth(url);
        if (weights?.error)
            return [];
        
        weights.forEach(weight => {
            weight.Date = new Date(weight.Date);
        });

        // Sort weights by date
        // Sort by date in ascending order
        weights.sort((a, b) => {
            const dateA = a.Date;
            const dateB =b.Date;
            return dateA - dateB;
        });

        return weights;
    }

    renderWeightRow(id, date, dStone, dPounds, eStone, ePounds) {
        const row = document.createElement('tr');
        date = this.#getISO8060DateStringFromDateObject(date);
        row.innerHTML = `
          <td hidden class="weight-Id" data-id=${id}></td>
          <td class="dateInput" value=${date}>${date}</td>
          <td class="dStoneInput">${dStone}</td>
          <td class="dPoundsInput">${dPounds}</td>
          <td class="eStoneInput">${eStone}</td>
          <td class="ePoundsInput">${ePounds}</td>
          <td><button class="delete">Delete</button></td>
        `;

        row.querySelector('button').addEventListener('click', (evt) => {
            this.deleteRow(evt);
        })
        document.getElementById('tableBody').appendChild(row);
    }

    async addEntry(evt) {
        const weighInTableRow = evt.target.closest('tr')
        const weightDateValue = weighInTableRow.querySelector('.dateInput').value;
        const weightDaveStoneValue = weighInTableRow.querySelector('.dStoneInput').value;
        const weightDavePoundsValue = weighInTableRow.querySelector('.dPoundsInput').value;
        const weightEstherStoneValue = weighInTableRow.querySelector('.eStoneInput').value;
        const weightEstherPoundsValue = weighInTableRow.querySelector('.ePoundsInput').value;

        if (!this.#isValidStone(weightDaveStoneValue)) return alert(`Dave weight stone is invalid: ${weightDaveStoneValue}`);
        if (!this.#isValidPound(weightDavePoundsValue)) return alert(`Dave weight pounds is invalid: ${weightDavePoundsValue}`);
        if (!this.#isValidStone(weightEstherStoneValue)) return alert(`Esther weight stone is invalid: ${weightEstherStoneValue}`);
        if (!this.#isValidPound(weightEstherPoundsValue)) return alert(`Esther weight pounds is invalid: ${weightEstherPoundsValue}`);
        if (!this.#isValidDate(weightDateValue)) return alert(`Date is invalid: ${weightDateValue}`);

        const dateObject = new Date(weightDateValue);

        const weighIn = {
            Id: null,
            DavidStone: parseFloat(weightDaveStoneValue),
            DavidPounds: parseFloat(weightDavePoundsValue),
            EstherStone: parseFloat(weightEstherStoneValue),
            EstherPounds: parseFloat(weightEstherPoundsValue),
            Date: dateObject
        };

        const weighInAdded = await this.postWeighIn(weighIn);
        if (!weighInAdded) return;

        this.renderWeightRow(weighIn.Id, this.#getISO8060DateStringFromDateObject(dateObject), weighIn.DavidStone, weighIn.DavidPounds, weighIn.EstherStone, weighIn.EstherPounds);

        // Reset inputs
        document.getElementById('dateInput').value = '';
        document.getElementById('dStoneInput').value = '';
        document.getElementById('dPoundsInput').value = '';
        document.getElementById('eStoneInput').value = '';
        document.getElementById('ePoundsInput').value = '';
    }

    deleteRow(evt) {
        const btn = evt.target;
        const row = btn.parentNode.parentNode;

        const id = row.querySelector('.weight-Id')?.getAttribute('data-id');
        if (!id) {
            toastService.addToast('Failed to delete weigh in, no ID.', GlobalConfig.LOG_LEVEL.ERROR);
        }

        if (!confirm('Are you sure you want to delete this weigh in?')) {
            return;
        }

        const url = `${GlobalConfig.apis.weighIns}/DeleteWeighIn?id=${id}`;
        const response = RequestHelper.DeleteWithAuth(url);
        if (response?.error) {
            toastService.addToast('Failed to delete weigh in.', GlobalConfig.LOG_LEVEL.ERROR);
            return;
        }

        row.parentNode.removeChild(row);
    }

    async postWeighIn(weighIn) {
        const url = `${GlobalConfig.apis.weighIns}/AddWeighIn`;
        const data = {
            Id: weighIn.Id,
            DavidStone: weighIn.DavidStone,
            DavidPounds: weighIn.DavidPounds,
            EstherStone: weighIn.EstherStone,
            EstherPounds: weighIn.EstherPounds,
            Date: weighIn.Date
        };

        const response = await RequestHelper.PostJsonWithAuth(url, data);
        if (response?.error) {
            toastService.addToast('Failed to add weigh in.', GlobalConfig.LOG_LEVEL.ERROR);
            return false;
        } else {
            toastService.addToast('Weigh in added successfully.', GlobalConfig.LOG_LEVEL.INFO);
            return true;
        }
    }

    #isValidDate(weightDate) {
        try {
            const dateObject = new Date(weightDate);
            return this.#getISO8060DateStringFromDateObject(dateObject) === weightDate;
        } catch (_) {
            return false;
        }
    }

    #isValidStone(rawWeight) {
        try {
            const weight = parseFloat(rawWeight);
            // Check if the weight is a number and within the valid range
            return weight < 20 && weight > 5;
        } catch (_) {
            return false;
        }
    }

    #isValidPound(rawWeight) {
        try {
            const weight = parseFloat(rawWeight);
            return weight < 14 && weight >= 0;
        } catch (_) {
            return false;
        }
    }
}

// Called by contentLoader, when loading the correspond page.
window.scripts = { init: () => { new WeighInsEntry(); } }
