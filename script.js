document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('url-input');
    const topTextInput = document.getElementById('top-text-input');
    const bottomTextInput = document.getElementById('bottom-text-input');
    const logoInput = document.getElementById('logo-input');
    const githubLogoCheckbox = document.getElementById('github-logo-checkbox');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    const downloadPdfLargeBtn = document.getElementById('download-pdf-large-btn');
    const dotsStyleSelect = document.getElementById('dots-style-select');
    const cornersStyleSelect = document.getElementById('corners-style-select');

    const topTextPreview = document.getElementById('top-text-preview');
    const bottomTextPreview = document.getElementById('bottom-text-preview');
    const canvas = document.getElementById('canvas');

    const GITHUB_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg';

    let customLogo = null;

    const qrCode = new QRCodeStyling({
        width: 256,
        height: 256,
        data: 'https://github.com/gemini-cli',
        image: GITHUB_LOGO_URL,
        dotsOptions: {
            color: '#000000',
            type: 'rounded'
        },
        backgroundOptions: {
            color: '#ffffff',
        },
        imageOptions: {
            crossOrigin: 'anonymous',
            margin: 8,
            imageSize: 0.4
        },
        cornersSquareOptions: {
            type: 'extra-rounded'
        },
        cornersDotOptions: {
            type: 'dot'
        }
    });

    // Initial render
    qrCode.append(canvas);
    githubLogoCheckbox.checked = true;
    urlInput.value = 'https://github.com/gemini-cli';
    topTextInput.value = 'Visita mi perfil';
    bottomTextInput.value = 'Proyecto Gemini';
    updatePreview();

    function updatePreview() {
        const url = urlInput.value.trim();
        topTextPreview.textContent = topTextInput.value;
        bottomTextPreview.textContent = bottomTextInput.value;

        let logoUrl = null;
        if (customLogo) {
            logoUrl = customLogo;
        } else if (githubLogoCheckbox.checked) {
            logoUrl = GITHUB_LOGO_URL;
        }

        qrCode.update({
            data: url || ' ',
            image: logoUrl,
            dotsOptions: {
                type: dotsStyleSelect.value
            },
            cornersSquareOptions: {
                type: cornersStyleSelect.value
            }
        });
    }

    // --- Event Listeners ---
    urlInput.addEventListener('input', updatePreview);
    topTextInput.addEventListener('input', updatePreview);
    bottomTextInput.addEventListener('input', updatePreview);
    dotsStyleSelect.addEventListener('change', updatePreview);
    cornersStyleSelect.addEventListener('change', updatePreview);

    githubLogoCheckbox.addEventListener('change', () => {
        if (githubLogoCheckbox.checked) {
            customLogo = null;
            logoInput.value = ''; // Clear file input
        }
        updatePreview();
    });

    logoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                customLogo = reader.result;
                githubLogoCheckbox.checked = false; // Uncheck GitHub logo option
                updatePreview();
            };
            reader.readAsDataURL(file);
        } else {
            customLogo = null;
            updatePreview();
        }
    });

    // --- PDF Generation Logic ---
    async function generatePdf(type) {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            const qrBlob = await qrCode.getRawData('png');

            if (!qrBlob) {
                alert('No se pudo generar la imagen del QR.');
                return;
            }

            const reader = new FileReader();
            reader.onload = function () {
                const qrDataUrl = this.result;
                const topText = topTextInput.value;
                const bottomText = bottomTextInput.value;
                const pageW = doc.internal.pageSize.getWidth();
                const pageH = doc.internal.pageSize.getHeight();

                if (type === 'grid') {
                    const margin = 10;
                    const cols = 2;
                    const rows = 2;
                    const cellW = (pageW - 2 * margin) / cols;
                    const cellH = (pageH - 2 * margin) / rows;
                    const qrSize = Math.min(cellW, cellH) * 0.7;

                    for (let i = 0; i < rows; i++) {
                        for (let j = 0; j < cols; j++) {
                            const x = margin + j * cellW;
                            const y = margin + i * cellH;
                            const centerX = x + cellW / 2;
                            const centerY = y + cellH / 2;

                            doc.setDrawColor(200);
                            doc.rect(x, y, cellW, cellH);
                            doc.setFontSize(8);
                            doc.text(topText, centerX, centerY - qrSize / 2 - 2, { align: 'center' });
                            doc.addImage(qrDataUrl, 'PNG', centerX - qrSize / 2, centerY - qrSize / 2, qrSize, qrSize);
                            doc.text(bottomText, centerX, centerY + qrSize / 2 + 4, { align: 'center' });
                        }
                    }
                } else if (type === 'large') {
                    const margin = 20;
                    const qrSize = Math.min(pageW, pageH) - 2 * margin;
                    const x = (pageW - qrSize) / 2;
                    const y = (pageH - qrSize) / 2;

                    doc.setFontSize(12);
                    doc.text(topText, pageW / 2, y - 5, { align: 'center' });
                    doc.addImage(qrDataUrl, 'PNG', x, y, qrSize, qrSize);
                    doc.text(bottomText, pageW / 2, y + qrSize + 10, { align: 'center' });
                }

                doc.output('dataurlnewwindow');
            };
            reader.readAsDataURL(qrBlob);

        } catch (error) {
            console.error("Error al generar el PDF:", error);
            alert("No se pudo generar el PDF. Asegúrate de tener conexión a internet para cargar las librerías y revisa la consola del navegador (F12) para más detalles.");
        }
    }

    downloadPdfBtn.addEventListener('click', () => generatePdf('grid'));
    downloadPdfLargeBtn.addEventListener('click', () => generatePdf('large'));
});