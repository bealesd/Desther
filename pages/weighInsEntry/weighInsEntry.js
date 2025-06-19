
import GlobalConfig from "../../config.js";
import Logger from "../../helpers/Logger.js";
import LoginHelper from "../../helpers/loginHelper.js";
import RequestHelper from "../../helpers/requestHelper.js";
import toastService from "../../helpers/toastService.js";

class WeighInsEntry {
    domClasses = Object.freeze({
        weighInContainer: 'weigh-ins-entry-container',
    });

    domIds = Object.freeze({
        weighInTableFooter: 'weigh-in-table-footer'
    });

    constructor() {
        toastService.addToast('On Weigh Ins Entry Page.', GlobalConfig.LOG_LEVEL.INFO);

        document.querySelector('#addWeighIn').addEventListener('click', (evt) => {
            this.addWeighIn(evt);
        });

        document.querySelector('.dateInput').value = this.#dateOfToday();

        this.init();
    }

    async init() {
        const weighIns = await this.#GetWeighIns();
        for (const weighIn of weighIns) {
            // weighIn format:
            // {
            //     "Id": 149,
            //     "DavidStone": 10,
            //     "DavidPounds": 6,
            //     "EstherStone": 8,
            //     "EstherPounds": 6,
            //     "Date": instanceof Date
            // }
            this.renderWeightRow(weighIn);
        }
        this.scrollToBottom();
    }

    async #GetWeighIns() {
        const url = `${GlobalConfig.apis.weighIns}/GetWeighIns`;
        const weights = await RequestHelper.GetJsonWithAuth(url);
        if (weights?.error) {
            toastService.addToast('Failed to load weigh ins.', GlobalConfig.LOG_LEVEL.ERROR);
            Logger.log(`Failed to load weigh ins: ${JSON.stringify(weights)}`, GlobalConfig.LOG_LEVEL.ERROR);
            return [];
        }

        weights.forEach(weight => {
            weight.Date = new Date(weight.Date);
        });

        // Sort weights by date
        // Sort by date in ascending order
        weights.sort((a, b) => {
            const dateA = a.Date;
            const dateB = b.Date;
            return dateA - dateB;
        });

        return weights;
    }

    renderWeightRow(weighIn) {
        // weighIn format:
        // {
        //     "Id": 149,
        //     "DavidStone": 10,
        //     "DavidPounds": 6,
        //     "EstherStone": 8,
        //     "EstherPounds": 6,
        //     "Date": instanceof Date
        // }

        const row = document.createElement('tr');
        const isoDate = this.#getISO8060DateStringFromDateObject(weighIn.Date);
        row.innerHTML = `
          <td hidden class="weight-Id" data-id=${weighIn.Id}></td>
          <td class="dateInput" value=${isoDate}>${isoDate}</td>
          <td data-label="D St" class="dStoneInput">${weighIn.DavidStone}</td>
          <td data-label="D Lb" class="dPoundsInput">${weighIn.DavidPounds}</td>
          <td data-label="E St" class="eStoneInput">${weighIn.EstherStone}</td>
          <td data-label="E Lb" class="ePoundsInput">${weighIn.EstherPounds}</td>
          <td><button class="delete">Delete</button></td>
        `;

        // Delete events are cleared on leaving this page, so no need to use eventHandler.js.
        row.querySelector('button').addEventListener('click', (evt) => {
            this.deleteRow(evt);
        })
        document.getElementById('tableBody').appendChild(row);
    }

    async addWeighIn(clickAddButtonEvent) {
        const weighIn = this.getWeighInObject(clickAddButtonEvent);
        if (!weighIn) return;

        const weighInResponse = await this.postWeighIn(weighIn);
        if (!weighInResponse) return;

        this.renderWeightRow(weighInResponse);
        this.resetAddRow();
        this.scrollToBottom();
    }

    getWeighInObject(clickAddButtonEvent) {
        const weighInTableRow = clickAddButtonEvent.target.closest('tr')
        const rawDate = weighInTableRow.querySelector('.dateInput').value;
        const rawDavidStone = weighInTableRow.querySelector('.dStoneInput').value;
        const rawDavidPounds = weighInTableRow.querySelector('.dPoundsInput').value;
        const rawEstherStone = weighInTableRow.querySelector('.eStoneInput').value;
        const rawEstherPounds = weighInTableRow.querySelector('.ePoundsInput').value;

        if (!this.validateWeighInRequest({
            DavidStone: rawDavidStone,
            DavidPounds: rawDavidPounds,
            EstherStone: rawEstherStone,
            EstherPounds: rawEstherPounds,
            Date: rawDate
        })) {
            toastService.addToast('Invalid weigh in data.', GlobalConfig.LOG_LEVEL.ERROR);
            return false;
        }

        // Convert the input values to numbers and create a weighIn object
        // Note: Date is already in ISO 8601 format, so we can use it directly
        const weighIn = {
            DavidStone: parseFloat(rawDavidStone),
            DavidPounds: parseFloat(rawDavidPounds),
            EstherStone: parseFloat(rawEstherStone),
            EstherPounds: parseFloat(rawEstherPounds),
            Date: new Date(rawDate)
        };
        return weighIn;
    }

    async postWeighIn(weighIn) {
        const url = `${GlobalConfig.apis.weighIns}/AddWeighIn`;
        const response = await RequestHelper.PostJsonWithAuth(url, weighIn);

        if (response?.error) {
            toastService.addToast('Failed to add weigh in.', GlobalConfig.LOG_LEVEL.ERROR);
            return false;
        } else if (this.validateWeighInResponse(response)) {
            toastService.addToast('Weigh in added successfully.', GlobalConfig.LOG_LEVEL.INFO);
            response.Date = new Date(response.Date);
            return response;
        }
        else {
            toastService.addToast('Unexpected weigh in response.', GlobalConfig.LOG_LEVEL.ERROR);
            Logger.log(`Unexpected weigh in response: ${JSON.stringify(response)}`, GlobalConfig.LOG_LEVEL.ERROR);
            return false;
        }
    }

    resetAddRow() {
        document.querySelector('.dateInput').value = '';
        document.querySelector('.dStoneInput').value = '';
        document.querySelector('.dPoundsInput').value = '';
        document.querySelector('.eStoneInput').value = '';
        document.querySelector('.ePoundsInput').value = '';
    }

    async deleteRow(evt) {
        const btn = evt.target;
        const row = btn.parentNode.parentNode;

        const id = row.querySelector('.weight-Id')?.getAttribute('data-id');
        if (!id)
            toastService.addToast('Failed to delete weigh in, no ID.', GlobalConfig.LOG_LEVEL.ERROR);

        if (!confirm('Are you sure you want to delete this weigh in?'))
            return;

        const url = `${GlobalConfig.apis.weighIns}/DeleteWeighIn?id=${id}`;
        const response = await RequestHelper.DeleteWithAuth(url);
        if (response?.error)
            return toastService.addToast('Failed to delete weigh in.', GlobalConfig.LOG_LEVEL.ERROR);

        row.parentNode.removeChild(row);
    }

    #dateOfToday() {
        return this.#getISO8060DateStringFromDateObject(new Date());
    }

    #getISO8060DateStringFromDateObject(dateObject) {
        // Get YYYY-MM-DD in local time, not UTC
        const year = dateObject.getFullYear();
        const month = String(dateObject.getMonth() + 1).padStart(2, '0');
        const day = String(dateObject.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    validateWeighInRequest(weighIn) {
        // Check if the request has the required properties
        if (weighIn && weighIn.DavidStone !== undefined && weighIn.DavidPounds !== undefined &&
            weighIn.EstherStone !== undefined && weighIn.EstherPounds !== undefined && weighIn.Date) {

            const { DavidStone, DavidPounds, EstherStone, EstherPounds, Date } = weighIn;
            if (!this.#isValidStone(DavidStone)) return alert(`Dave weight stone is invalid: ${DavidStone}`);
            if (!this.#isValidPound(DavidPounds)) return alert(`Dave weight pounds is invalid: ${weightDavePoundDavidPoundsValue}`);
            if (!this.#isValidStone(EstherStone)) return alert(`Esther weight stone is invalid: ${EstherStone}`);
            if (!this.#isValidPound(EstherPounds)) return alert(`Esther weight pounds is invalid: ${EstherPounds}`);
            if (!this.#isValidDate(Date)) return alert(`Date is invalid: ${Date}`);

            return true;
        }
        return false;
    }

    validateWeighInResponse(response) {
        // Check if the response has the required properties
        // response format:
        // {
        //     "Id": 149,
        //     "DavidStone": 10,
        //     "DavidPounds": 6,
        //     "EstherStone": 8,
        //     "EstherPounds": 6,
        //     "Date": "2025-06-05T00:00:00"
        // }
        if (response && response.Id && response.DavidStone !== undefined && response.DavidPounds !== undefined &&
            response.EstherStone !== undefined && response.EstherPounds !== undefined && response.Date && this.#isValidDate(response.Date)) {
            return true;
        }
        return false;
    }

    #isValidDate(weightDate) {
        try {
            const dateObject = new Date(weightDate);
            return weightDate.startsWith(this.#getISO8060DateStringFromDateObject(dateObject));
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

    scrollToBottom() {
        const weighInTableFooter = document.querySelector(`#${this.domIds.weighInTableFooter}`);
        weighInTableFooter?.scrollIntoViewIfNeeded();
    }
}

// Called by contentLoader, when loading the correspond page.
window.scripts = { init: () => { new WeighInsEntry(); } }
