
import GlobalConfig from "../../config.js";
import EventHandler from "../../helpers/eventHandler.js";
import RequestHelper from "../../helpers/requestHelper.js";
import toastService from "../../helpers/toastService.js";
import LoadingScreen from '../../helpers/loadingScreen.js'

class WeightChartSetup {
    _cancelled = false;
    _activeController = null;
    signal = null;

    weighIns = [];
    updateIntervalInSeconds = 10;

    async init() {
        this._activeController = new AbortController();
        this.signal = this._activeController?.signal;

        LoadingScreen.showFullScreenLoader();
        this.weighIns = await this.#GetWeighIns();
        LoadingScreen.hideFullScreenLoader();

        if (this._cancelled) return;

        if (this.weighIns.length === 0) {
            const message = `No weigh ins found.`;
            toastService.addToast(message, GlobalConfig.LOG_LEVEL.WARNING);
            return;
        }

        new WeightChart(this.weighIns);
    }

    async #GetWeighIns() {
        const url = `${GlobalConfig.apis.weighIns}/GetWeighIns`;
        const weights = await RequestHelper.GetJsonWithAuth(url, this.signal);
        if (weights?.error)
            return [];
        return weights;
    }
}

// Called by contentLoader, when loading the correspond page.
window.scripts = {
    app: null,

    init: function () {
        this.app = new WeightChartSetup();
        this.app.init();
    },

    destroy: function () {
        this.app?._activeController?.abort();
        this.app._cancelled = true;
    }
}



class WeightChart {
    domIds = Object.freeze({
        weighInChart: 'weighInChart',
        weighInsGraphArea: 'weigh-ins-graph-area',
        weighInsButtons: 'weigh-ins-buttons'
    });

    constructor(weighIns) {
        this.canvas = document.getElementById(this.domIds.weighInChart);
        const ctx = this.canvas.getContext('2d');

        this.ctx = ctx;
        this.weighIns = weighIns;
        this._averageWeightDavid = this.calculateAverage('David');
        this._averageWeightEsther = this.calculateAverage('Esther');
        this.chart = this.createChart();

        this.addResetButtonHandler();
    }

    addResetButtonHandler() {
        // is this done many times?
        const weighInButton = document.querySelector(`#${this.domIds.weighInsButtons} button`);
        EventHandler.overwriteEvent({
            'id': 'resetWeighInButtonEvent',
            'eventType': 'click',
            'element': weighInButton,
            'callback': () => {
                this.chart.resetZoom();
            }
        });
    }

    calculateAverage(person) {
        const total = this.weighIns.reduce((sum, entry) => {
            const value = person === 'David'
                ? entry.DavidStone + entry.DavidPounds / 14
                : entry.EstherStone + entry.EstherPounds / 14;
            return sum + value;
        }, 0);
        return total / this.weighIns.length;
    }

    decimalToStonePounds(decimal) {
        const stone = Math.floor(decimal);
        const pounds = Math.round((decimal - stone) * 14);
        return { stone, pounds };
    }

    createChart() {
        return new Chart(this.ctx, {
            type: 'line',
            data: {
                labels: this.weighIns.map(w => w.Date),
                datasets: [
                    {
                        label: 'Dave',
                        data: this.weighIns.map(w => w.DavidStone + w.DavidPounds / 14),
                        borderColor: 'rgba(20,20,255,1)',
                        backgroundColor: 'rgba(20,20,255,0.3)',
                        fill: true,
                        tension: 0.5,
                        borderWidth: 0.5,
                        pointBackgroundColor: 'rgba(29,20,255,0.7)',
                        pointBorderColor: 'rgba(29,20,255,0.9)'
                    },
                    {
                        label: 'Esther',
                        data: this.weighIns.map(w => w.EstherStone + w.EstherPounds / 14),
                        borderColor: 'rgba(255,20,147,1)',
                        backgroundColor: 'rgba(255,20,147,0.3)',
                        fill: true,
                        tension: 0.5,
                        borderWidth: 0.5,
                        pointBackgroundColor: 'rgba(255,20,147,0.7)',
                        pointBorderColor: 'rgba(255,20,147,0.9)'
                    }
                ]
            },
            options: {
                responsive: true,
                resizeDelay: 200,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const date = new Date(context.label).toLocaleDateString('en-GB');
                                const weight = this.decimalToStonePounds(context.parsed.y);
                                const average = context.dataset.label === 'Dave'
                                    ? this.decimalToStonePounds(this._averageWeightDavid)
                                    : this.decimalToStonePounds(this._averageWeightEsther);

                                return [
                                    context.dataset.label,
                                    `Date: ${date}`,
                                    `Weight: ${weight.stone} st ${weight.pounds} lbs`,
                                    `Average: ${average.stone} st ${average.pounds} lbs`
                                ];
                            }
                        }
                    },
                    zoom: {
                        zoom: {
                            wheel: { enabled: true },
                            pinch: { enabled: true },
                            mode: 'xy'
                        },
                        pan: {
                            enabled: true,
                            mode: 'xy'
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'month',
                            tooltipFormat: 'MMM yyyy'
                        },
                        title: {
                            display: true,
                            text: 'Date',
                            color: '#00f'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Weight (stone)',
                            color: '#00f'
                        }
                    }
                }
            }
        });
    }
}
