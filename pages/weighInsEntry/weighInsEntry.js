
import GlobalConfig from "../../config.js";
import Logger from "../../helpers/logger.js";
import RequestHelper from "../../helpers/requestHelper.js";
import toastService from "../../helpers/toastService.js";
import LoadingScreen from "../../helpers/loadingScreen.js";
import loginHelper from "../../helpers/loginHelper.js";
import weighInService from "../../services/weighInService.js";
import DeleteModal from "../../helpers/delete-modal/delete-modal.js";

class WeighInsEntry {
    _cancelled = false;
    _activeController = null;
    signal = null;

    domClasses = Object.freeze({
        weighInContainer: 'weigh-ins-entry-container',
        stoneInput: 'stone-input',
        poundInput: 'pound-input',
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
        const weighIns = await weighInService.GetWeighIns(this.signal);
        LoadingScreen.hideFullScreenLoader();

        if (this._cancelled) return;

        this.sortWeighIns(weighIns);

        for (const weighIn of weighIns) {
            weighInService.addImperialWeights(weighIn);
            this.renderWeightRow(weighIn);
        }
        this.scrollToBottom();
    }

    // Sort weights by date
    // Sort by date in ascending order
    sortWeighIns(weighIns) {
        weighIns.sort((a, b) => {
            const dateA = a.Date;
            const dateB = b.Date;
            return dateA - dateB;
        });
    }

    async #GetWeighIns() {
        const url = `${GlobalConfig.apis.weighIns}/GetWeighIns?userId=${loginHelper.usernameId}`;
        const weights = await RequestHelper.GetJsonWithAuth(url, this.signal);
        if (weights?.error) {
            toastService.addToast('Failed to load weigh ins.', GlobalConfig.LOG_LEVEL.ERROR);
            Logger.log(`Failed to load weigh ins: ${JSON.stringify(weights)}`, GlobalConfig.LOG_LEVEL.ERROR);
            return [];
        }
        return weights;
    }

    renderWeightRow(weighIn) {
        const row = document.createElement('tr');
        const isoDate = this.#getISO8060DateStringFromDateObject(weighIn.Date);
        row.innerHTML = `
          <td hidden class="${this.domClasses.weightId}" data-id=${weighIn.WeighInId}></td>
          <td class="${this.domClasses.dateInput}" value=${isoDate}>${isoDate}</td>
          <td data-label="Stone" class="${this.domClasses.stoneInput}">${weighIn.Stone}</td>
          <td data-label="Pounds" class="${this.domClasses.poundInput}">${weighIn.Pounds}</td>
          <td><button class="delete">Delete</button></td>
        `;

        // Delete events are cleared on leaving this page, so no need to use eventHandler.js.
        row.querySelector('button').addEventListener('click', (evt) => {
            this.deleteRow(evt);
        })
        document.getElementById('tableBody').appendChild(row);
    }

    async addWeighIn(clickAddButtonEvent) {
        const weighIn = this.getWeighIn(clickAddButtonEvent);
        if (!weighIn) return;

        LoadingScreen.showFullScreenLoader();
        const weighInResponse = await this.postWeighIn(weighIn);
        LoadingScreen.hideFullScreenLoader();

        if (!weighInResponse) return;

        weighInService.addImperialWeights(weighInResponse);
        this.renderWeightRow(weighInResponse);
        this.resetAddRow();
        this.scrollToBottom();
    }

    getWeighIn(clickAddButtonEvent) {
        const weighInTableRow = clickAddButtonEvent.target.closest('tr')
        const rawDate = weighInTableRow.querySelector(`.${this.domClasses.dateInput}`).value;
        const rawStone = weighInTableRow.querySelector(`.${this.domClasses.stoneInput}`).value;
        const rawPounds = weighInTableRow.querySelector(`.${this.domClasses.poundInput}`).value;

        if (!this.validateWeighInRequest({
            Stone: rawStone,
            Pounds: rawPounds,
            Date: rawDate
        })) {
            toastService.addToast('Invalid weigh in data.', GlobalConfig.LOG_LEVEL.ERROR);
            return false;
        }

        // Convert the input values to numbers and create a weighIn object
        // Note: Date is already in ISO 8601 format, so we can use it directly
        const weighIn = {
            UsernameId: loginHelper.usernameId,
            WeightKg: Number(
                ((parseFloat(rawStone) * 14 + parseFloat(rawPounds)) / 2.20462).toFixed(2)
            ),
            Date: rawDate
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
        document.querySelector(`.${this.domClasses.stoneInput}`).value = '';
        document.querySelector(`.${this.domClasses.poundInput}`).value = '';
    }

    async deleteWeighIn(id, row) {
        DeleteModal.open('Are you sure you want to delete this weigh in?', async () => {
            const url = `${GlobalConfig.apis.weighIns}/DeleteWeighIn?id=${id}`;
            const response = await RequestHelper.DeleteWithAuth(url);
            if (response?.error)
                return toastService.addToast('Failed to delete weigh in.', GlobalConfig.LOG_LEVEL.ERROR);

            row.parentNode.removeChild(row);
        });
    }

    async deleteRow(evt) {
        const btn = evt.target;
        const row = btn.parentNode.parentNode;

        const id = row.querySelector(`.${this.domClasses.weightId}`)?.getAttribute('data-id');
        if (!id)
            toastService.addToast('Failed to delete weigh in, no ID.', GlobalConfig.LOG_LEVEL.ERROR);

        this.deleteWeighIn(id, row);
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
        if (weighIn && weighIn.Stone !== undefined && weighIn.Pounds !== undefined && weighIn.Date) {

            const { Stone, Pounds, Date } = weighIn;
            if (!this.#isValidStone(Stone)) return toastService.addToast(`Dave weight stone is invalid: ${DavidStone}`, GlobalConfig.LOG_LEVEL.ERROR);
            if (!this.#isValidPound(Pounds)) return toastService.addToast(`Dave weight pounds is invalid: ${DavidPounds}`, GlobalConfig.LOG_LEVEL.ERROR);
            if (!this.#isValidDate(Date)) return toastService.addToast(`Date is invalid: ${Date}`, GlobalConfig.LOG_LEVEL.ERROR);

            return true;
        }
        return false;
    }

    validateWeighInResponse(response) {
        if (response && response.UsernameId && response.WeightKg !== undefined && response.Date && this.#isValidDate(response.Date)) {
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
