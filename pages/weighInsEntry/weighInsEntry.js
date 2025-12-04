
import GlobalConfig from "../../config.js";
import Logger from "../../helpers/logger.js";
import RequestHelper from "../../helpers/requestHelper.js";
import toastService from "../../helpers/toastService.js";
import LoadingScreen from "../../helpers/loadingScreen.js";

class WeighInsEntry {
    _cancelled = false;
    _activeController = null;
    signal = null;

    domClasses = Object.freeze({
        weighInContainer: 'weigh-ins-entry-container',
        stoneInputDavid: 'stone-input-david',
        stoneInputEsther: 'stone-input-esther',
        poundInputDavid: 'pound-input-david',
        poundInputEsther: 'pound-input-esther',
        dateInput: 'date-input',
        weightId: 'weight-id',
    });

    domIds = Object.freeze({
        weighInTableFooter: 'weigh-in-table-footer',
        addWeighIn: 'add-weigh-in',
    });

    async init() {
        this._activeController = new AbortController();
        this.signal = this._activeController?.signal;

        document.querySelector(`#${this.domIds.addWeighIn}`).addEventListener('click', (evt) => {
            this.addWeighIn(evt);
        });

        document.querySelector(`.${this.domClasses.dateInput}`).value = this.#dateOfToday();

        LoadingScreen.showFullScreenLoader();
        const weighIns = await this.#GetWeighIns();
        LoadingScreen.hideFullScreenLoader();

        if (this._cancelled) return;

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
        const weights = await RequestHelper.GetJsonWithAuth(url, this.signal);
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
          <td hidden class="${this.domClasses.weightId}" data-id=${weighIn.Id}></td>
          <td class="${this.domClasses.dateInput}" value=${isoDate}>${isoDate}</td>
          <td data-label="David Stone" class="${this.domClasses.stoneInputDavid}">${weighIn.DavidStone}</td>
          <td data-label="David Pounds" class="${this.domClasses.poundInputDavid}">${weighIn.DavidPounds}</td>
          <td data-label="Esther Stone" class="${this.domClasses.stoneInputEsther}">${weighIn.EstherStone}</td>
          <td data-label="Esther Pounds" class="${this.domClasses.poundInputEsther}">${weighIn.EstherPounds}</td>
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

        LoadingScreen.showFullScreenLoader();
        const weighInResponse = await this.postWeighIn(weighIn);
        LoadingScreen.hideFullScreenLoader();

        if (!weighInResponse) return;

        this.renderWeightRow(weighInResponse);
        this.resetAddRow();
        this.scrollToBottom();
    }

    getWeighInObject(clickAddButtonEvent) {
        const weighInTableRow = clickAddButtonEvent.target.closest('tr')
        const rawDate = weighInTableRow.querySelector(`.${this.domClasses.dateInput}`).value;
        const rawDavidStone = weighInTableRow.querySelector(`.${this.domClasses.stoneInputDavid}`).value;
        const rawDavidPounds = weighInTableRow.querySelector(`.${this.domClasses.poundInputDavid}`).value;
        const rawEstherStone = weighInTableRow.querySelector(`.${this.domClasses.stoneInputEsther}`).value;
        const rawEstherPounds = weighInTableRow.querySelector(`.${this.domClasses.poundInputEsther}`).value;

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
        document.querySelector(`.${this.domClasses.dateInput}`).value = '';
        document.querySelector(`.${this.domClasses.stoneInputDavid}`).value = '';
        document.querySelector(`.${this.domClasses.stoneInputEsther}`).value = '';
        document.querySelector(`.${this.domClasses.poundInputDavid}`).value = '';
        document.querySelector(`.${this.domClasses.poundInputEsther}`).value = '';
    }

    async deleteRow(evt) {
        const btn = evt.target;
        const row = btn.parentNode.parentNode;

        const id = row.querySelector(`.${this.domClasses.weightId}`)?.getAttribute('data-id');
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
            if (!this.#isValidStone(DavidStone)) return toastService.addToast(`Dave weight stone is invalid: ${DavidStone}`, GlobalConfig.LOG_LEVEL.ERROR);
            if (!this.#isValidPound(DavidPounds)) return toastService.addToast(`Dave weight pounds is invalid: ${DavidPounds}`, GlobalConfig.LOG_LEVEL.ERROR);
            if (!this.#isValidStone(EstherStone)) return toastService.addToast(`Esther weight stone is invalid: ${EstherStone}`, GlobalConfig.LOG_LEVEL.ERROR);
            if (!this.#isValidPound(EstherPounds)) return toastService.addToast(`Esther weight pounds is invalid: ${EstherPounds}`, GlobalConfig.LOG_LEVEL.ERROR);
            if (!this.#isValidDate(Date)) return toastService.addToast(`Date is invalid: ${Date}`, GlobalConfig.LOG_LEVEL.ERROR);

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

    // Check if the weight is a number and within the valid range
    #isValidStone(rawWeight) {
        if (this.#isInteger(rawWeight)) {
            const weight = parseInt(rawWeight, 10);
            return weight < 20 && weight > 5;
        }
        return false;
    }

    #isValidPound(rawWeight) {
        if (this.#isInteger(rawWeight)) {
            const weight = parseInt(rawWeight, 10);
            return weight < 14 && weight >= 0;
        }
        return false;
    }

    /* Check if the value is a whole integer
     * @param {any} value - The value to check, integer or string or float
     * @returns {boolean} - True if the value is an integer, false otherwise
     */
    #isInteger(value) {
        try {
            value = value?.toString().trim()
            return `${parseInt(value)}` === `${value}`;
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
window.scripts = {
    app: null,

    init: function () {
        this.app = new WeighInsEntry();
        this.app.init();
    },

    destroy: function () {
        this.app?._activeController?.abort();
        this.app._cancelled = true;
    }
}
