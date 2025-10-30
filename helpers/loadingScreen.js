export default class LoadingScreen {
    static showFullScreenLoader() {
        document.getElementById('full-screen-loader').style.display = 'flex';
    }

    static hideFullScreenLoader() {
        document.getElementById('full-screen-loader').style.display = 'none';
    }
}
