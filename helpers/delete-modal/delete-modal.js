class DeleteModal {
    /**
     * Displays a custom confirmation dialog.
     * This method is part of the class, but the modal elements are appended to the body.
     * @param {string} message - The message to display in the confirmation dialog.
     * @param {function} onConfirm - Callback function to execute if user confirms.
     */
    static open(message, onConfirm) {
        const modalOverlay = document.createElement('div');
        modalOverlay.style.cssText = `
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background-color: rgba(0, 0, 0, 0.6); display: flex;
                    justify-content: center; align-items: center; z-index: 1000;
                `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
                    background-color: #282828;
                    color: rgb(227, 227, 227);
                    padding: 30px; border-radius: 12px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4); text-align: center;
                    max-width: 400px; width: 90%;
                    display: flex; flex-direction: column; gap: 20px;
                    font-family: 'Inter', sans-serif;
                `;

        const messagePara = document.createElement('p');
        messagePara.textContent = message;
        messagePara.style.cssText = `
                    font-size: 1.1rem; color: rgb(227, 227, 227); margin-bottom: 15px;
                `;

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
                    display: flex; justify-content: center; gap: 15px;
                `;

        const confirmButton = document.createElement('button');
        confirmButton.textContent = 'Yes, Delete';
        confirmButton.style.cssText = `
                    background-color: #dc2626; color: white; padding: 10px 20px;
                    border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;
                    transition: background-color 0.2s ease;
                `;
        confirmButton.onmouseover = () => confirmButton.style.backgroundColor = '#b91c1c';
        confirmButton.onmouseout = () => confirmButton.style.backgroundColor = '#dc2626';
        confirmButton.onclick = () => {
            onConfirm();
            document.body.removeChild(modalOverlay);
        };

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.style.cssText = `
                    background-color: #4a5568;
                    color: white; padding: 10px 20px;
                    border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;
                    transition: background-color 0.2s ease;
                `;
        cancelButton.onmouseover = () => cancelButton.style.backgroundColor = '#2d3748';
        cancelButton.onmouseout = () => cancelButton.style.backgroundColor = '#4a5568';
        cancelButton.onclick = () => {
            document.body.removeChild(modalOverlay);
        };

        buttonContainer.appendChild(confirmButton);
        buttonContainer.appendChild(cancelButton);
        modalContent.appendChild(messagePara);
        modalContent.appendChild(buttonContainer);
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
    }


}

export default DeleteModal;
