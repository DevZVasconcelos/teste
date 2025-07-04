// PDF Generation function with improved A4 rendering and email functionality
async function generatePDF() {
    const { jsPDF } = window.jspdf;
    
    try {
        // Show loading state
        const pdfBtn = document.querySelector('.btn-pdf');
        const originalText = pdfBtn.innerHTML;
        pdfBtn.innerHTML = '<span>⏳</span> Gerando PDF...';
        pdfBtn.disabled = true;
        
        // Hide the PDF button temporarily
        const pdfContainer = document.querySelector('.pdf-button-container');
        pdfContainer.style.display = 'none';
        
        // Get the form content
        const element = document.getElementById('form-content');
        
        // Create a temporary container optimized for A4 PDF generation
        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = `
            position: absolute;
            top: -9999px;
            left: -9999px;
            width: 794px;
            background: white;
            font-family: Arial, sans-serif;
            padding: 30px;
            box-sizing: border-box;
            font-size: 11px;
            line-height: 1.3;
            color: #333;
        `;
        
        // Clone the content
        const clonedElement = element.cloneNode(true);
        
        // Apply A4-specific styles to the cloned element
        clonedElement.style.cssText = `
            width: 734px;
            margin: 0;
            padding: 0;
            background: white;
            font-size: 11px;
            line-height: 1.3;
            color: #333;
        `;
        
        // Apply print-specific styles to cloned content
        const printStyles = `
            .header-content { 
                display: flex !important; 
                flex-direction: row !important; 
                justify-content: space-between !important; 
                align-items: center !important;
                text-align: left !important;
            }
            .info-grid { 
                display: grid !important; 
                grid-template-columns: repeat(3, 1fr) !important; 
                gap: 15px !important;
            }
            .field-row { 
                display: flex !important; 
                flex-direction: row !important; 
                gap: 15px !important; 
                margin-bottom: 12px !important;
            }
            .emergency-row { 
                display: flex !important; 
                flex-direction: row !important; 
                align-items: flex-end !important;
            }
            .emergency-name { flex: 2.5 !important; }
            .emergency-relation { flex: 1 !important; }
            .emergency-phone { flex: 1.2 !important; }
            .question-header { 
                display: flex !important; 
                flex-direction: row !important; 
                align-items: center !important; 
                flex-wrap: wrap !important;
            }
            .date-location { 
                justify-content: flex-start !important; 
            }
            .field-group { 
                flex: 1 !important; 
            }
            .field-group label {
                font-size: 9px !important;
                font-weight: bold !important;
                margin-bottom: 3px !important;
            }
            .yes-no-options {
                display: flex !important;
                gap: 15px !important;
                margin: 0 10px !important;
            }
        `;
        
        const styleElement = document.createElement('style');
        styleElement.textContent = printStyles;
        clonedElement.appendChild(styleElement);
        
        // Fix input values in the cloned element
        const originalInputs = element.querySelectorAll('input');
        const clonedInputs = clonedElement.querySelectorAll('input');
        
        originalInputs.forEach((input, index) => {
            if (clonedInputs[index]) {
                if (input.type === 'radio') {
                    clonedInputs[index].checked = input.checked;
                    if (input.checked) {
                        // Add visual indicator for checked radio buttons
                        const label = clonedInputs[index].nextElementSibling;
                        if (label && label.classList.contains('radio-text')) {
                            label.innerHTML = label.innerHTML.replace('( )', '(X)');
                        }
                    }
                } else {
                    clonedInputs[index].value = input.value;
                    // Convert input to styled text for PDF
                    const span = document.createElement('span');
                    span.textContent = input.value || '';
                    span.style.cssText = `
                        border-bottom: 1px solid #333;
                        display: inline-block;
                        min-width: 120px;
                        padding: 2px 4px;
                        font-size: 10px;
                        min-height: 14px;
                        vertical-align: bottom;
                    `;
                    clonedInputs[index].parentNode.replaceChild(span, clonedInputs[index]);
                }
            }
        });
        
        // Remove radio inputs and replace with text
        const radioInputs = clonedElement.querySelectorAll('input[type="radio"]');
        radioInputs.forEach(radio => {
            radio.style.display = 'none';
        });
        
        tempContainer.appendChild(clonedElement);
        document.body.appendChild(tempContainer);
        
        // Wait for rendering
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Configure html2canvas with A4-optimized settings
        const canvas = await html2canvas(tempContainer, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: 794,
            height: tempContainer.scrollHeight,
            scrollX: 0,
            scrollY: 0,
            logging: false,
            letterRendering: true,
            foreignObjectRendering: false,
            imageTimeout: 0,
            removeContainer: true,
            onclone: function(clonedDoc) {
                // Ensure all styles are applied in the cloned document
                const clonedBody = clonedDoc.body;
                clonedBody.style.fontFamily = 'Arial, sans-serif';
                clonedBody.style.fontSize = '11px';
                clonedBody.style.lineHeight = '1.3';
                clonedBody.style.color = '#333';
            }
        });
        
        // Remove temporary container
        document.body.removeChild(tempContainer);
        
        // Show the PDF button again
        pdfContainer.style.display = 'block';
        
        // Create PDF with A4 dimensions
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // A4 dimensions in mm
        const pdfWidth = 210;
        const pdfHeight = 297;
        const margin = 8;
        const contentWidth = pdfWidth - (margin * 2);
        const contentHeight = pdfHeight - (margin * 2);
        
        // Convert canvas to image
        const imgData = canvas.toDataURL('image/png', 1.0);
        
        // Calculate scaling to fit A4 perfectly
        const canvasAspectRatio = canvas.height / canvas.width;
        const contentAspectRatio = contentHeight / contentWidth;
        
        let finalWidth = contentWidth;
        let finalHeight = contentWidth * canvasAspectRatio;
        
        // If content is too tall for one page, we'll handle pagination
        if (finalHeight > contentHeight) {
            // Calculate how many pages we need
            const pagesNeeded = Math.ceil(finalHeight / contentHeight);
            const pageHeight = contentHeight;
            
            for (let page = 0; page < pagesNeeded; page++) {
                if (page > 0) {
                    pdf.addPage();
                }
                
                // Calculate the portion of the image for this page
                const sourceY = (page * pageHeight / finalHeight) * canvas.height;
                const sourceHeight = Math.min(
                    (pageHeight / finalHeight) * canvas.height,
                    canvas.height - sourceY
                );
                
                // Create a canvas for this page
                const pageCanvas = document.createElement('canvas');
                const pageCtx = pageCanvas.getContext('2d');
                pageCanvas.width = canvas.width;
                pageCanvas.height = sourceHeight;
                
                // Create image from original canvas
                const img = new Image();
                await new Promise((resolve) => {
                    img.onload = () => {
                        pageCtx.drawImage(img, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);
                        
                        const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
                        
                        pdf.addImage(pageImgData, 'PNG', margin, margin, finalWidth, pageHeight, '', 'FAST');
                        resolve();
                    };
                    img.src = imgData;
                });
            }
        } else {
            // Single page - center vertically
            const yOffset = margin + (contentHeight - finalHeight) / 2;
            pdf.addImage(imgData, 'PNG', margin, yOffset, finalWidth, finalHeight, '', 'FAST');
        }
        
        // Generate filename
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
        const filename = `termo-responsabilidade-ecoacao-${dateStr}-${timeStr}.pdf`;
        
        // Get the PDF as blob for email functionality
        const pdfBlob = pdf.output('blob');
        
        // Save PDF locally
        pdf.save(filename);
        
        // Show success notification with email option
        showSuccessWithEmailOption(filename, pdfBlob);
        
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        showNotification('Erro ao gerar PDF. Tente novamente.', 'error');
    } finally {
        // Restore button state
        const pdfBtn = document.querySelector('.btn-pdf');
        const pdfContainer = document.querySelector('.pdf-button-container');
        if (pdfContainer) pdfContainer.style.display = 'block';
        if (pdfBtn) {
            pdfBtn.innerHTML = '<span>📄</span> Salvar PDF';
            pdfBtn.disabled = false;
        }
    }
}

// Enhanced success notification with email option
function showSuccessWithEmailOption(filename, pdfBlob) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create enhanced notification element
    const notification = document.createElement('div');
    notification.className = 'notification notification-success';
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-header">
                <span class="notification-icon">✅</span>
                <span class="notification-message">PDF gerado com sucesso!</span>
                <button class="notification-close" onclick="this.closest('.notification').remove()">×</button>
            </div>
            <div class="notification-actions">
                <button class="btn-email" onclick="sendPDFByEmail('${filename}', arguments[0])" data-blob="">
                    <span>📧</span> Enviar por Email
                </button>
                <button class="btn-whatsapp" onclick="shareToWhatsApp('${filename}')">
                    <span>📱</span> Compartilhar
                </button>
            </div>
        </div>
    `;
    
    // Store blob reference
    notification.querySelector('.btn-email').pdfBlob = pdfBlob;
    
    // Add enhanced styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
        border-radius: 12px;
        padding: 0;
        display: block;
        z-index: 1001;
        box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        animation: slideIn 0.4s ease-out;
        max-width: 350px;
        font-size: 14px;
        overflow: hidden;
    `;
    
    // Add enhanced styles if not already present
    if (!document.querySelector('#enhanced-notification-styles')) {
        const style = document.createElement('style');
        style.id = 'enhanced-notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            .notification-content {
                padding: 0;
            }
            .notification-header {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 16px;
                border-bottom: 1px solid #c3e6cb;
            }
            .notification-message {
                flex: 1;
                font-weight: 500;
            }
            .notification-close {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                opacity: 0.7;
                color: #155724;
            }
            .notification-close:hover {
                opacity: 1;
            }
            .notification-actions {
                display: flex;
                gap: 0;
            }
            .btn-email, .btn-whatsapp {
                flex: 1;
                padding: 12px 16px;
                border: none;
                background: transparent;
                color: #155724;
                cursor: pointer;
                font-size: 13px;
                font-weight: 500;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                transition: background-color 0.2s ease;
            }
            .btn-email:hover {
                background: rgba(21, 87, 36, 0.1);
            }
            .btn-whatsapp:hover {
                background: rgba(21, 87, 36, 0.1);
            }
            .btn-email {
                border-right: 1px solid #c3e6cb;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 10 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }
    }, 10000);
}

// Send PDF by email function
function sendPDFByEmail(filename, event) {
    const button = event.target.closest('.btn-email');
    const pdfBlob = button.pdfBlob;
    
    if (!pdfBlob) {
        showNotification('Erro: PDF não encontrado. Gere o PDF novamente.', 'error');
        return;
    }
    
    // Get form data for email subject and body
    const nomeInput = document.querySelector('input[name="nome"]');
    const emailInput = document.querySelector('input[name="email"]');
    
    const participantName = nomeInput ? nomeInput.value : 'Participante';
    const participantEmail = emailInput ? emailInput.value : '';
    
    // Create email content
    const subject = `Termo de Responsabilidade - EcoAção - ${participantName}`;
    const body = `Olá,

Segue em anexo o Termo de Responsabilidade preenchido para as atividades da EcoAção Turismo de Aventura.

Participante: ${participantName}
Data de geração: ${new Date().toLocaleDateString('pt-BR')}

Atenciosamente,
EcoAção Turismo de Aventura`;

    // Try to use Web Share API if available (mobile devices)
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], filename, { type: 'application/pdf' })] })) {
        const file = new File([pdfBlob], filename, { type: 'application/pdf' });
        navigator.share({
            title: subject,
            text: body,
            files: [file]
        }).then(() => {
            showNotification('PDF compartilhado com sucesso!', 'success');
        }).catch((error) => {
            console.log('Erro ao compartilhar:', error);
            fallbackEmailMethod(subject, body, pdfBlob, filename, participantEmail);
        });
    } else {
        // Fallback for desktop browsers
        fallbackEmailMethod(subject, body, pdfBlob, filename, participantEmail);
    }
}

// Fallback email method for desktop
function fallbackEmailMethod(subject, body, pdfBlob, filename, participantEmail) {
    // Create a download link for the PDF
    const url = URL.createObjectURL(pdfBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = filename;
    
    // Create mailto link
    const mailtoLink = `mailto:${participantEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body + '\n\nNota: O arquivo PDF foi baixado automaticamente. Anexe-o ao email antes de enviar.')}`;
    
    // Download PDF and open email client
    downloadLink.click();
    window.location.href = mailtoLink;
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    showNotification('PDF baixado! Cliente de email aberto.', 'success');
}

// Share to WhatsApp function
function shareToWhatsApp(filename) {
    const nomeInput = document.querySelector('input[name="nome"]');
    const participantName = nomeInput ? nomeInput.value : 'Participante';
    
    const message = `📋 *Termo de Responsabilidade - EcoAção*

Participante: ${participantName}
Data: ${new Date().toLocaleDateString('pt-BR')}

Termo de responsabilidade preenchido para as atividades de turismo de aventura da EcoAção.

🏞️ *EcoAção Turismo de Aventura*`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    showNotification('WhatsApp aberto! Anexe o PDF manualmente.', 'success');
}

// Standard notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
        color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
        border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
        border-radius: 8px;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        gap: 8px;
        z-index: 1001;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
        font-size: 14px;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Form validation and enhancement
document.addEventListener('DOMContentLoaded', function() {
    // Add input masks for specific fields
    const cpfInput = document.querySelector('input[name="cpf"]');
    const cepInput = document.querySelector('input[name="cep"]');
    const celularInput = document.querySelector('input[name="celular"]');
    const fixoInput = document.querySelector('input[name="fixo"]');
    const telefoneInput = document.querySelector('input[name="telefone"]');
    
    // CPF mask
    if (cpfInput) {
        cpfInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            e.target.value = value;
        });
    }
    
    // CEP mask
    if (cepInput) {
        cepInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/(\d{5})(\d)/, '$1-$2');
            e.target.value = value;
        });
    }
    
    // Phone masks
    [celularInput, fixoInput, telefoneInput].forEach(input => {
        if (input) {
            input.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length <= 10) {
                    value = value.replace(/(\d{2})(\d)/, '($1) $2');
                    value = value.replace(/(\d{4})(\d)/, '$1-$2');
                } else {
                    value = value.replace(/(\d{2})(\d)/, '($1) $2');
                    value = value.replace(/(\d{5})(\d)/, '$1-$2');
                }
                e.target.value = value;
            });
        }
    });
    
    // Auto-save form data to localStorage
    const form = document.getElementById('adventureForm');
    const formInputs = form.querySelectorAll('input, select, textarea');
    const radioInputs = document.querySelectorAll('input[type="radio"]');
    
    // Load saved data
    formInputs.forEach(input => {
        const savedValue = localStorage.getItem(`form_${input.name}`);
        if (savedValue && input.type !== 'radio') {
            input.value = savedValue;
        }
    });
    
    // Load saved radio data
    radioInputs.forEach(input => {
        const savedValue = localStorage.getItem(`form_${input.name}`);
        if (savedValue && input.value === savedValue) {
            input.checked = true;
        }
    });
    
    // Save data on input
    formInputs.forEach(input => {
        input.addEventListener('input', function() {
            if (this.type !== 'radio') {
                localStorage.setItem(`form_${this.name}`, this.value);
            }
        });
    });
    
    // Save radio data
    radioInputs.forEach(input => {
        input.addEventListener('change', function() {
            if (this.checked) {
                localStorage.setItem(`form_${this.name}`, this.value);
            }
        });
    });
    
    // Clear saved data function (can be called from console)
    window.clearFormData = function() {
        formInputs.forEach(input => {
            localStorage.removeItem(`form_${input.name}`);
        });
        radioInputs.forEach(input => {
            localStorage.removeItem(`form_${input.name}`);
        });
        location.reload();
    };
    
    console.log('📋 Formulário EcoAção carregado com sucesso!');
    console.log('💡 Funcionalidades disponíveis:');
    console.log('   • Geração de PDF otimizada para A4');
    console.log('   • Envio por email automático');
    console.log('   • Compartilhamento via WhatsApp');
    console.log('   • clearFormData(): Limpar dados salvos');
});