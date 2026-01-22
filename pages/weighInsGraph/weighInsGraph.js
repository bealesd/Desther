
import GlobalConfig from "../../config.js";
import EventHandler from "../../helpers/eventHandler.js";
import RequestHelper from "../../helpers/requestHelper.js";
import toastService from "../../helpers/toastService.js";
import LoadingScreen from '../../helpers/loadingScreen.js'
import loginHelper from "../../helpers/loginHelper.js";
import weighInService from "../../services/weighInService.js";

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
        this.weighIns = await weighInService.GetWeighIns(this.signal);
        LoadingScreen.hideFullScreenLoader();

        if (this._cancelled) return;

        if (this.weighIns.length === 0) {
            const message = `No weigh ins found.`;
            toastService.addToast(message, GlobalConfig.LOG_LEVEL.WARNING);
            return;
        }

        for (const weighIn of this.weighIns) {
            weighInService.addImperialWeights(weighIn);
        }

        new WeightChart(this.weighIns);
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
        this._averageWeight = this.calculateAverage();

        this._averageKilo = this.weighIns.length
            ? this.weighIns.reduce((sum, w) => sum + w.WeightKg, 0) / this.weighIns.length
            : 0;

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

    calculateAverage() {
        const total = this.weighIns.reduce((sum, entry) => {
            const value = entry.Stone + entry.Pounds / 14;
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
        const isPink = loginHelper.usernameId === 5;
        return new Chart(this.ctx, {
            type: 'line',
            data: {
                labels: this.weighIns.map(w => w.Date),
                datasets: [
                    {
                        label: 'Imperial',
                        data: this.weighIns.map(w => w.Stone + w.Pounds / 14),
                        borderColor: !isPink ? 'rgba(20,20,255,1)' : 'rgba(255,20,147,1)',
                        backgroundColor: !isPink ? 'rgba(20,20,255,0.3)' : 'rgba(255,20,147,0.3)',
                        fill: true,
                        tension: 0.5,
                        borderWidth: 0.5,
                        pointBackgroundColor: !isPink ? 'rgba(29,20,255,0.7)' : 'rgba(255,20,147,0.7)',
                        pointBorderColor: !isPink ? 'rgba(29,20,255,0.9)' : 'rgba(255,20,147,0.9)'
                    },
                    {
                        label: 'Metric',
                        data: this.weighIns.map(w => w.WeightKg),
                        borderColor: !isPink ? 'rgba(20,20,255,1)' : 'rgba(255,20,147,1)',
                        backgroundColor: !isPink ? 'rgba(20,20,255,0.3)' : 'rgba(255,20,147,0.3)',
                        fill: true,
                        tension: 0.5,
                        borderWidth: 0.5,
                        pointBackgroundColor: !isPink ? 'rgba(29,20,255,0.7)' : 'rgba(255,20,147,0.7)',
                        pointBorderColor: !isPink ? 'rgba(29,20,255,0.9)' : 'rgba(255,20,147,0.9)',
                         hidden: true 
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
                                const date = new Date(context.label)
                                    .toLocaleDateString('en-GB');

                                const isMetric = context.dataset.label === 'Metric';

                                if (isMetric) {
                                    const kg = context.parsed.y;
                                    const avgKg = this._averageKilo;

                                    return [
                                        'Metric',
                                        `Date: ${date}`,
                                        `Weight: ${kg.toFixed(1)} kg`,
                                        `Average: ${avgKg.toFixed(1)} kg`
                                    ];
                                }

                                // Imperial
                                const weight = this.decimalToStonePounds(context.parsed.y);
                                const average = this.decimalToStonePounds(this._averageWeight);

                                return [
                                    'Imperial',
                                    `Date: ${date}`,
                                    `Weight: ${weight.stone} st ${weight.pounds} lbs`,
                                    `Average: ${average.stone} st ${average.pounds} lbs`
                                ];
                            },
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
                            text: 'Weight',
                            color: '#00f'
                        }
                    }
                }
            }
        });
    }
}
