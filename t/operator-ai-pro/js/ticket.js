document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const queueId = urlParams.get('id');

    if (!queueId) {
        alert('Chipta topilmadi!');
        window.location.href = 'index.html';
        return;
    }

    // Set tracker link immediately
    document.getElementById('btn-tracker').href = `tracker.html?id=${queueId}`;

    fetchQueueData(queueId);

    // Download Handler
    document.getElementById('btn-download').addEventListener('click', downloadTicket);
});

async function fetchQueueData(id) {
    let queue = null;

    // 1. Try fetching from API (Best for latest status)
    try {
        const response = await fetch(`/api/queue/${id}`);
        const data = await response.json();
        if (data.success) {
            queue = data.queue;
        }
    } catch (error) {
        console.warn('API fetch failed, trying local database:', error);
    }

    // 2. Fallback to Local Database (if API failed or returned nothing)
    if (!queue && typeof Database !== 'undefined') {
        queue = Database.getQueue(id);
    }

    if (queue) {
        // Enrich data if service name is missing (common issue if only ID is saved)
        if (!queue.serviceName && typeof Database !== 'undefined') {
            const service = Database.getService(queue.serviceId);
            if (service) queue.serviceName = service.name;
        }
        if (!queue.staffName && queue.staffId && typeof Database !== 'undefined') {
            const staff = Database.getStaffMember(queue.staffId);
            if (staff) queue.staffName = staff.name;
        }

        renderTicket(queue);
    } else {
        // If still nothing, it might be a sync issue.
        // Alert is annoying, maybe just show placeholders or redirect
        if (confirm('Chipta ma\'lumotlari topilmadi. Bosh sahifaga qaytasizmi?')) {
            window.location.href = 'index.html';
        }
    }
}

function renderTicket(queue) {
    document.getElementById('t-number').textContent = queue.number || queue.queueNumber || '---';
    document.getElementById('t-date').textContent = queue.date || new Date().toLocaleDateString();
    document.getElementById('t-time').textContent = queue.time || '---';
    document.getElementById('t-service').textContent = queue.serviceName || queue.service || 'Xizmat tanlanmagan';
    document.getElementById('t-id').textContent = `ID: ${queue.id.substring(0, 8)}...`;

    // Additional details if available in HTML
    const staffEl = document.getElementById('t-staff');
    if (staffEl) {
        staffEl.textContent = queue.staffName || 'Istalgan mutaxassis';
    }

    // Generate QR Code
    const qrContent = `${window.location.origin}/tracker.html?id=${queue.id}`;
    const qrContainer = document.getElementById('qrcode');
    const qrImg = document.getElementById('t-qr');

    if (qrContainer && typeof QRCode !== 'undefined') {
        qrContainer.innerHTML = ''; // Clear the current img tag
        new QRCode(qrContainer, {
            text: qrContent,
            width: 128,
            height: 128,
            colorDark: "#0f172a",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        // Ensure the generated canvas/img is centered and styled
        setTimeout(() => {
            const generated = qrContainer.querySelector('img, canvas');
            if (generated) {
                generated.style.display = 'block';
                generated.style.margin = '0 auto';
                generated.style.borderRadius = '8px';
            }
        }, 100);
    } else if (qrImg) {
        qrImg.src = Utils.generateQRCode(qrContent, 128);
    }
}

function downloadTicket() {
    const element = document.getElementById("ticket-visual");

    // Use html2canvas
    html2canvas(element, {
        backgroundColor: null, // Keep transparency settings if any
        scale: 2 // Higher quality
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `ticket-${document.getElementById('t-number').textContent}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    });
}
