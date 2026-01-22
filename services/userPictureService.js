import GlobalConfig from "../config.js";
import Logger from "../helpers/logger.js";
import RequestHelper from "../helpers/requestHelper.js";
import toastService from "../helpers/toastService.js";

class UserPictureService {
    async GetPicture(userId, signal) {
        const url = `${GlobalConfig.apis.userPicture}/GetPicture?userId=${userId}`;
        const pictureResponse = await RequestHelper.GetJsonWithAuth(url, signal);
        if (pictureResponse?.error) {
            toastService.addToast('Failed to get user picture.', GlobalConfig.LOG_LEVEL.ERROR);
            Logger.log(`Failed to get user picture: ${JSON.stringify(pictureResponse)}`, GlobalConfig.LOG_LEVEL.ERROR);
            return [];
        }
        return pictureResponse;
    }
}

export default new WeighInService;
