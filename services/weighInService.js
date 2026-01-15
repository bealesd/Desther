import GlobalConfig from "../config.js";
import Logger from "../helpers/logger.js";
import loginHelper from "../helpers/loginHelper.js";
import RequestHelper from "../helpers/requestHelper.js";
import toastService from "../helpers/toastService.js";

class WeighInService {
    async GetWeighIns(signal) {
        const url = `${GlobalConfig.apis.weighIns}/GetWeighIns?userId=${loginHelper.usernameId}`;
        const weights = await RequestHelper.GetJsonWithAuth(url, signal);
        if (weights?.error) {
            toastService.addToast('Failed to load weigh ins.', GlobalConfig.LOG_LEVEL.ERROR);
            Logger.log(`Failed to load weigh ins: ${JSON.stringify(weights)}`, GlobalConfig.LOG_LEVEL.ERROR);
            return [];
        }
        return weights;
    }

    addImperialWeights(weighIn) {
        const totalPounds = weighIn.WeightKg * 2.20462;
        const stone = Math.floor(totalPounds / 14);
        const pounds = Math.round(totalPounds - stone * 14);

        weighIn.Date = new Date(weighIn.Date);
        weighIn.Stone = stone;
        weighIn.Pounds = pounds;
    }

}

export default new WeighInService;
