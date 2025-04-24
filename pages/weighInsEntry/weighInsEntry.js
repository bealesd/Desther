
import GlobalConfig from "../../config.js";
import Logger from "../../helpers/Logger.js";
import LoginHelper from "../../helpers/loginHelper.js";
import RequestHelper from "../../helpers/requestHelper.js";
import toastService from "../../helpers/toastService.js";

class WeighInsEntry {

    constructor() {
        toastService.addToast('On Weigh Ins Entry Page.', GlobalConfig.LOG_LEVEL.INFO);

        document.querySelector('#addWeighIn').addEventListener('click', (evt) => {
            this.addEntry2(evt);
        });

        document.querySelector('.dateInput').value = this.#dateOfToday();

        this.init();
    }

    async init(){
        const weighIns = await this.#GetWeighIns();
        for (const weighIn of weighIns) {
            this.addEntry1(this.#getISO8060DateStringFromDateObject(new Date(weighIn.Date)), weighIn.DavidStone, weighIn.DavidPounds, weighIn.EstherStone, weighIn.EstherPounds);
        }
    }

    #dateOfToday() {
        return this.#getISO8060DateStringFromDateObject(new Date());
    }

    #getISO8060DateStringFromDateObject(dateObject) {
        return dateObject.toISOString().split('T')[0];
    }

    #sortByDate(a, b) {
        if (a.Date < b.Date) return -1;
        else if (a.Date > b.Date) return 1;
        else return 0;
    }

    async #GetWeighIns() {
        const url = `${GlobalConfig.apis.weighIns}/GetWeighIns`;
        const weights = await RequestHelper.GetJsonWithAuth(url);
        if (weights?.error)
            return [];
        return weights;
    }

    addEntry1(date, dStone, dPounds, eStone, ePounds) {

        const row = document.createElement('tr');
        row.innerHTML = `
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

        // // Reset inputs
        // document.getElementById('dateInput').value = '';
        // document.getElementById('dStoneInput').value = '';
        // document.getElementById('dPoundsInput').value = '';
        // document.getElementById('eStoneInput').value = '';
        // document.getElementById('ePoundsInput').value = '';
    }

    addEntry2(evt) {
        const weighInTableRow = evt.target.closest('tr')
        const date = weighInTableRow.querySelector('.dateInput').value;
        const dStone = weighInTableRow.querySelector('.dStoneInput').value;
        const dPounds = weighInTableRow.querySelector('.dPoundsInput').value;
        const eStone = weighInTableRow.querySelector('.eStoneInput').value;
        const ePounds = weighInTableRow.querySelector('.ePoundsInput').value;

        if (!date || dStone === '' || dPounds === '' || eStone === '' || ePounds === '') {
            alert('All fields must be filled in.');
            return;
        }

        if (dPounds < 0 || dPounds > 13 || ePounds < 0 || ePounds > 13) {
            alert('Pounds must be between 0 and 13.');
            return;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
          <td class="dateInput" value=${this.#dateOfToday()}>${date}</td>
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
        row.parentNode.removeChild(row);
    }
}

// Called by contentLoader, when loading the correspond page.
window.scripts = { init: () => { new WeighInsEntry(); } }
