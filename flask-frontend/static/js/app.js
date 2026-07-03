const form = document.getElementById('searchForm');
const loading = document.getElementById('loading');
const heroSection = document.getElementById('heroSection');
const dashboard = document.getElementById('dashboard');
const loadingText = document.getElementById('loadingText');
const dropZone = document.getElementById('dropZone');
const imageInput = document.getElementById('imageInput');

// Camera Scanner Elements
const startCameraBtn = document.getElementById('startCameraBtn');
const cameraModal = document.getElementById('cameraModal');
const closeCameraBtn = document.getElementById('closeCameraBtn');
const cameraPreview = document.getElementById('cameraPreview');
const cameraCanvas = document.getElementById('cameraCanvas');
const captureBtn = document.getElementById('captureBtn');
const scanBeam = document.getElementById('scanBeam');
const radarSweep = document.getElementById('radarSweep');
const confidenceScore = document.getElementById('confidenceScore');
const confidenceRing = document.getElementById('confidenceRing');
const scanStatus = document.getElementById('scanStatus');
const detectionCount = document.getElementById('detectionCount');
const detectionBoxes = document.getElementById('detectionBoxes');
const aiParticles = document.getElementById('aiParticles');
const detectedMedicineCard = document.getElementById('detectedMedicineCard');
const detectedMedicineInfo = document.getElementById('detectedMedicineInfo');
const viewDetailsBtn = document.getElementById('viewDetailsBtn');

let priceChart = null;
let cameraStream = null;
let detectedData = null;
let particleInterval = null;
let scanInterval = null;

const loadingMessages = [
    'Initializing AI Engine...',
    'Processing with ML model...',
    'Analyzing medicine data...',
    'Computing risk predictions...'
];

const imageLoadingMessages = [
    'Initializing AI Engine...',
    'Processing image with OCR...',
    'Analyzing medicine image with MedVision+...',
    'Extracting medicine information...'
];

// Camera Scanner Functions
startCameraBtn.addEventListener('click', async () => {
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        cameraPreview.srcObject = cameraStream;
        cameraModal.classList.remove('hidden');
        scanStatus.textContent = 'Ready to Scan';
        confidenceScore.textContent = '0%';
        detectionCount.textContent = '0';
        startAIParticles();
    } catch (err) {
        alert('Camera access denied. Please enable camera permissions.');
    }
});

closeCameraBtn.addEventListener('click', () => {
    stopCamera();
});

function startAIParticles() {
    particleInterval = setInterval(() => {
        const particle = document.createElement('div');
        particle.className = 'ai-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 2 + 's';
        aiParticles.appendChild(particle);
        setTimeout(() => particle.remove(), 3000);
    }, 500);
}

function createDetectionBox(x, y, width, height, label) {
    const box = document.createElement('div');
    box.className = 'detection-box';
    box.style.left = x + 'px';
    box.style.top = y + 'px';
    box.style.width = width + 'px';
    box.style.height = height + 'px';
    
    const labelDiv = document.createElement('div');
    labelDiv.className = 'detection-label';
    labelDiv.textContent = label;
    box.appendChild(labelDiv);
    
    detectionBoxes.appendChild(box);
    return box;
}

function updateConfidenceRing(percent) {
    const circumference = 2 * Math.PI * 24;
    const offset = circumference - (percent / 100) * circumference;
    confidenceRing.style.strokeDashoffset = offset;
}

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    if (particleInterval) clearInterval(particleInterval);
    if (scanInterval) clearInterval(scanInterval);
    cameraModal.classList.add('hidden');
    scanBeam.classList.add('hidden');
    radarSweep.classList.add('hidden');
    detectedMedicineCard.classList.add('hidden');
    detectionBoxes.innerHTML = '';
    aiParticles.innerHTML = '';
}

captureBtn.addEventListener('click', async () => {
    scanStatus.textContent = 'Scanning...';
    scanBeam.classList.remove('hidden');
    radarSweep.classList.remove('hidden');
    detectionCount.textContent = '1';
    
    // Simulate detection box
    setTimeout(() => {
        createDetectionBox(150, 120, 200, 150, 'MEDICINE DETECTED');
    }, 800);
    
    // Simulate confidence increase
    let confidence = 0;
    const confInterval = setInterval(() => {
        confidence += Math.random() * 12;
        if (confidence > 87) confidence = 87;
        confidenceScore.textContent = Math.round(confidence) + '%';
        updateConfidenceRing(confidence);
    }, 150);
    
    // Capture image from video
    cameraCanvas.width = cameraPreview.videoWidth;
    cameraCanvas.height = cameraPreview.videoHeight;
    const ctx = cameraCanvas.getContext('2d');
    ctx.drawImage(cameraPreview, 0, 0);
    
    cameraCanvas.toBlob(async (blob) => {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        
        try {
            const formData = new FormData();
            formData.append('image', file);
            
            const response = await fetch('/api/upload-medicine-image', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            clearInterval(confInterval);
            
            if (response.ok) {
                confidenceScore.textContent = Math.round(data.confidence * 100) + '%';
                updateConfidenceRing(data.confidence * 100);
                scanStatus.textContent = 'Detection Complete';
                scanBeam.classList.add('hidden');
                radarSweep.classList.add('hidden');
                
                detectedData = data.data;
                
                // Show detected medicine card
                detectedMedicineInfo.innerHTML = `
                    <p class="text-white"><span class="text-gray-400">Medicine:</span> <span class="font-bold text-cyan-400 glow-text">${data.medicine_name}</span></p>
                    <p class="text-white"><span class="text-gray-400">Confidence:</span> <span class="font-bold text-green-400">${Math.round(data.confidence * 100)}%</span></p>
                    <p class="text-gray-400 text-xs mt-2">AI analysis complete. Click below for full report.</p>
                `;
                detectedMedicineCard.classList.remove('hidden');
            } else {
                scanStatus.textContent = 'Detection Failed';
                scanBeam.classList.add('hidden');
                radarSweep.classList.add('hidden');
                detectionBoxes.innerHTML = '';
                alert(data.error || 'Unable to detect medicine clearly.');
            }
        } catch (err) {
            clearInterval(confInterval);
            scanStatus.textContent = 'Error';
            scanBeam.classList.add('hidden');
            radarSweep.classList.add('hidden');
            detectionBoxes.innerHTML = '';
            alert('Scan failed: ' + err.message);
        }
    }, 'image/jpeg', 0.95);
});

viewDetailsBtn.addEventListener('click', () => {
    if (detectedData) {
        stopCamera();
        displayResults(detectedData);
        heroSection.classList.add('hidden');
        dashboard.classList.remove('hidden');
    }
});

// Drag and Drop
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('border-blue-500', 'bg-blue-50');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('border-blue-500', 'bg-blue-50');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-blue-500', 'bg-blue-50');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        handleImageUpload(file);
    }
});

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleImageUpload(file);
    }
});

function handleImageUpload(file) {
    uploadImage(file);
}

async function uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    loading.classList.remove('hidden');
    let msgIndex = 0;
    const msgInterval = setInterval(() => {
        loadingText.textContent = imageLoadingMessages[msgIndex % imageLoadingMessages.length];
        msgIndex++;
    }, 1500);
    
    try {
        const response = await fetch('/api/upload-medicine-image', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        clearInterval(msgInterval);
        loading.classList.add('hidden');
        
        if (!response.ok) {
            alert(data.error || 'Unable to detect medicine clearly. Please upload a clearer image.');
            return;
        }
        
        if (data.data) {
            displayResults(data.data);
            heroSection.classList.add('hidden');
            dashboard.classList.remove('hidden');
        } else {
            alert(`Detected: ${data.medicine_name} (Confidence: ${Math.round(data.confidence * 100)}%)\nNo detailed information available.`);
        }
        
    } catch (err) {
        clearInterval(msgInterval);
        loading.classList.add('hidden');
        alert('Upload failed: ' + err.message);
    }
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const medicineName = document.getElementById('medicineName').value.trim();
    if (!medicineName) return;
    
    loading.classList.remove('hidden');
    let msgIndex = 0;
    const msgInterval = setInterval(() => {
        loadingText.textContent = loadingMessages[msgIndex % loadingMessages.length];
        msgIndex++;
    }, 1500);
    
    try {
        const response = await fetch(`/api/search?name=${encodeURIComponent(medicineName)}`);
        const data = await response.json();
        
        clearInterval(msgInterval);
        loading.classList.add('hidden');
        
        if (!response.ok) {
            alert(data.error || 'Failed to fetch medicine information');
            return;
        }
        
        displayResults(data);
        heroSection.classList.add('hidden');
        dashboard.classList.remove('hidden');
        
    } catch (err) {
        clearInterval(msgInterval);
        loading.classList.add('hidden');
        alert(err.message);
    }
});

function displayResults(data) {
    // Verified side effects database (overrides AI for accuracy)
    const verifiedSideEffects = {
        // Pain Relievers & Anti-inflammatory
        'aspirin': ['Stomach upset', 'Heartburn', 'Nausea', 'Increased bleeding risk', 'Bruising', 'Allergic reactions (rare)'],
        'paracetamol': ['Nausea', 'Stomach pain', 'Loss of appetite', 'Rash', 'Liver damage (overdose)'],
        'acetaminophen': ['Nausea', 'Stomach pain', 'Loss of appetite', 'Rash', 'Liver damage (overdose)'],
        'ibuprofen': ['Stomach upset', 'Heartburn', 'Nausea', 'Dizziness', 'Increased bleeding risk'],
        'diclofenac': ['Stomach pain', 'Nausea', 'Diarrhea', 'Headache', 'Dizziness', 'Increased blood pressure'],
        'naproxen': ['Stomach upset', 'Heartburn', 'Headache', 'Drowsiness', 'Dizziness'],
        
        // Antibiotics
        'azithromycin': ['Nausea', 'Diarrhea', 'Stomach pain', 'Headache', 'Dizziness'],
        'amoxicillin': ['Nausea', 'Diarrhea', 'Rash', 'Yeast infection', 'Allergic reactions'],
        'ciprofloxacin': ['Nausea', 'Diarrhea', 'Dizziness', 'Headache', 'Tendon damage risk'],
        'metronidazole': ['Nausea', 'Metallic taste', 'Headache', 'Loss of appetite', 'Dizziness'],
        'cephalexin': ['Diarrhea', 'Nausea', 'Stomach upset', 'Headache', 'Dizziness'],
        'doxycycline': ['Nausea', 'Vomiting', 'Sun sensitivity', 'Diarrhea', 'Loss of appetite'],
        
        // Steroids & Corticosteroids
        'dexamethasone': ['Weight gain', 'Mood changes', 'Increased blood sugar', 'Weakened immune system', 'Bone loss', 'Increased eye pressure'],
        'prednisone': ['Weight gain', 'Mood swings', 'Increased appetite', 'Insomnia', 'Weakened immune system', 'High blood sugar'],
        'prednisolone': ['Weight gain', 'Mood changes', 'Increased appetite', 'Fluid retention', 'High blood pressure'],
        'hydrocortisone': ['Skin thinning', 'Acne', 'Increased hair growth', 'Mood changes', 'Insomnia'],
        'betamethasone': ['Skin irritation', 'Burning sensation', 'Dryness', 'Itching', 'Redness'],
        
        // Blood Thinners & Anticoagulants
        'warfarin': ['Bleeding', 'Bruising', 'Blood in urine/stool', 'Severe headache', 'Requires regular monitoring'],
        'heparin': ['Bleeding', 'Bruising', 'Injection site reactions', 'Low platelet count', 'Allergic reactions'],
        'clopidogrel': ['Bleeding', 'Bruising', 'Nosebleeds', 'Stomach pain', 'Diarrhea'],
        
        // Diabetes Medications
        'metformin': ['Nausea', 'Diarrhea', 'Stomach upset', 'Metallic taste', 'Vitamin B12 deficiency (long-term)'],
        'insulin': ['Low blood sugar', 'Weight gain', 'Injection site reactions', 'Swelling', 'Rash'],
        'glimepiride': ['Low blood sugar', 'Nausea', 'Dizziness', 'Headache', 'Weight gain'],
        'sitagliptin': ['Headache', 'Stuffy nose', 'Sore throat', 'Upper respiratory infection'],
        
        // Blood Pressure Medications
        'amlodipine': ['Swelling of ankles', 'Dizziness', 'Flushing', 'Headache', 'Fatigue'],
        'atenolol': ['Dizziness', 'Fatigue', 'Cold hands/feet', 'Slow heartbeat', 'Depression'],
        'losartan': ['Dizziness', 'Stuffy nose', 'Back pain', 'Diarrhea', 'Fatigue'],
        'enalapril': ['Dizziness', 'Headache', 'Fatigue', 'Dry cough', 'Nausea'],
        
        // Antidepressants & Anxiety
        'sertraline': ['Nausea', 'Diarrhea', 'Insomnia', 'Dry mouth', 'Dizziness', 'Sexual dysfunction'],
        'fluoxetine': ['Nausea', 'Headache', 'Insomnia', 'Drowsiness', 'Anxiety', 'Loss of appetite'],
        'escitalopram': ['Nausea', 'Insomnia', 'Fatigue', 'Dry mouth', 'Dizziness', 'Sweating'],
        'alprazolam': ['Drowsiness', 'Dizziness', 'Memory problems', 'Confusion', 'Dependence risk'],
        'diazepam': ['Drowsiness', 'Fatigue', 'Muscle weakness', 'Confusion', 'Dependence risk'],
        
        // Acid Reflux & Stomach
        'omeprazole': ['Headache', 'Nausea', 'Diarrhea', 'Stomach pain', 'Gas'],
        'pantoprazole': ['Headache', 'Diarrhea', 'Nausea', 'Stomach pain', 'Dizziness'],
        'ranitidine': ['Headache', 'Constipation', 'Diarrhea', 'Nausea', 'Stomach pain'],
        
        // Allergy & Antihistamines
        'cetirizine': ['Drowsiness', 'Dry mouth', 'Fatigue', 'Headache', 'Dizziness'],
        'loratadine': ['Headache', 'Drowsiness', 'Dry mouth', 'Fatigue', 'Nervousness'],
        'fexofenadine': ['Headache', 'Drowsiness', 'Nausea', 'Dizziness', 'Menstrual cramps'],
        
        // Pain Medications (Opioids)
        'tramadol': ['Dizziness', 'Nausea', 'Constipation', 'Drowsiness', 'Headache', 'Dependence risk'],
        'codeine': ['Drowsiness', 'Constipation', 'Nausea', 'Dizziness', 'Dependence risk'],
        'morphine': ['Drowsiness', 'Constipation', 'Nausea', 'Confusion', 'Respiratory depression', 'Dependence risk'],
        'oxycodone': ['Drowsiness', 'Constipation', 'Nausea', 'Dizziness', 'Respiratory depression', 'Dependence risk'],
        
        // Thyroid Medications
        'levothyroxine': ['Weight changes', 'Hair loss', 'Headache', 'Insomnia', 'Nervousness'],
        'liothyronine': ['Weight loss', 'Tremors', 'Headache', 'Insomnia', 'Sweating'],
        
        // Cholesterol Medications
        'atorvastatin': ['Muscle pain', 'Headache', 'Nausea', 'Diarrhea', 'Joint pain'],
        'simvastatin': ['Muscle pain', 'Headache', 'Constipation', 'Nausea', 'Stomach pain'],
        'rosuvastatin': ['Muscle pain', 'Headache', 'Dizziness', 'Nausea', 'Weakness']
    };
    
    // High-risk medicines that require doctor consultation
    const highRiskMedicines = [
        // Blood Thinners
        'aspirin', 'warfarin', 'heparin', 'clopidogrel',
        
        // Diabetes Medications
        'insulin', 'metformin', 'glimepiride', 'sitagliptin',
        
        // Steroids & Corticosteroids
        'prednisone', 'prednisolone', 'dexamethasone', 'hydrocortisone', 'betamethasone',
        
        // Antibiotics
        'azithromycin', 'ciprofloxacin', 'amoxicillin', 'metronidazole', 'cephalexin', 'doxycycline',
        
        // Controlled Substances & Opioids
        'diazepam', 'alprazolam', 'codeine', 'tramadol', 'morphine', 'oxycodone',
        
        // Antidepressants
        'sertraline', 'fluoxetine', 'escitalopram',
        
        // Blood Pressure Medications
        'amlodipine', 'atenolol', 'losartan', 'enalapril',
        
        // Thyroid Medications
        'levothyroxine', 'liothyronine',
        
        // Cholesterol Medications
        'atorvastatin', 'simvastatin', 'rosuvastatin'
    ];
    
    // Calculate dynamic confidence based on data quality and safety
    let sideEffects = data.usage_information?.side_effects || data.safety_info?.common_side_effects || [];
    
    // Override with verified side effects if available
    const composition = (data.medicine_info?.composition || '').toLowerCase();
    const brandName = (data.medicine_info?.brand_name || '').toLowerCase();
    
    for (const [medicine, effects] of Object.entries(verifiedSideEffects)) {
        if (composition.includes(medicine) || brandName.includes(medicine)) {
            sideEffects = effects;
            break;
        }
    }
    
    const uses = data.usage_information?.uses || [];
    const hasManufacturer = data.medicine_info?.manufacturer && data.medicine_info.manufacturer !== 'N/A';
    
    // Check if it's a high-risk medicine
    const isHighRisk = highRiskMedicines.some(med => 
        composition.includes(med) || brandName.includes(med)
    );
    
    // Base confidence calculation
    let confidence = 70;
    if (hasManufacturer) confidence += 10;
    if (uses.length >= 3) confidence += 10;
    if (sideEffects.length > 0) confidence += 5;
    
    // Reduce confidence for high-risk medicines
    if (isHighRisk) confidence -= 20;
    if (sideEffects.length > 5) confidence -= 15;
    if (sideEffects.some(e => e.toLowerCase().includes('severe') || e.toLowerCase().includes('allergic') || e.toLowerCase().includes('bleeding'))) confidence -= 10;
    
    confidence = Math.max(60, Math.min(95, confidence));
    
    // Update confidence display
    document.getElementById('confidenceText').textContent = `${confidence}%`;
    
    // Doctor recommendation based on confidence and side effects
    let recommendation = '';
    let recommendationColor = '';
    
    if (isHighRisk) {
        recommendation = '⛔ PRESCRIPTION REQUIRED. Doctor consultation mandatory. Do not self-medicate.';
        recommendationColor = 'text-red-400';
    } else if (confidence < 70 || sideEffects.length > 5) {
        recommendation = '⚠ Doctor consultation recommended. Potential risks identified.';
        recommendationColor = 'text-red-400';
    } else if (confidence >= 70 && confidence < 85) {
        recommendation = '⚠ Consult pharmacist before use. Monitor for side effects.';
        recommendationColor = 'text-yellow-400';
    } else {
        recommendation = '✓ Generally safe for self-medication. Follow dosage instructions.';
        recommendationColor = 'text-green-400';
    }
    
    // Add recommendation banner
    const banner = document.getElementById('statusBanner');
    if (banner) {
        const existingRec = banner.querySelector('.recommendation-text');
        if (existingRec) existingRec.remove();
        
        const recDiv = document.createElement('div');
        recDiv.className = `recommendation-text mt-4 p-4 rounded-xl bg-slate-800/50 border ${recommendationColor.includes('green') ? 'border-green-500/30' : recommendationColor.includes('yellow') ? 'border-yellow-500/30' : 'border-red-500/30'}`;
        recDiv.innerHTML = `<p class="text-sm font-semibold ${recommendationColor}">${recommendation}</p>`;
        banner.appendChild(recDiv);
    }
    
    // Medicine Overview
    if (data.medicine_info) {
        const info = data.medicine_info;
        document.getElementById('medicineInfo').innerHTML = `
            <div class="space-y-2">
                <p class="text-gray-300"><span class="font-semibold text-cyan-400">Brand:</span> ${info.brand_name || 'N/A'}</p>
                <p class="text-gray-300"><span class="font-semibold text-cyan-400">Composition:</span> ${info.composition || 'N/A'}</p>
                <p class="text-gray-300"><span class="font-semibold text-cyan-400">Strength:</span> ${info.strength || 'N/A'}</p>
                <p class="text-gray-300"><span class="font-semibold text-cyan-400">Dosage:</span> ${info.dosage_form || 'N/A'}</p>
                <p class="text-gray-300"><span class="font-semibold text-cyan-400">Usage:</span> ${info.common_uses || data.usage_information?.uses || 'N/A'}</p>
                <p class="text-gray-300"><span class="font-semibold text-cyan-400">Manufacturer:</span> ${info.manufacturer || 'N/A'}</p>
            </div>
        `;
    }
    
    // Common Side Effects
    if (sideEffects.length > 0) {
        document.getElementById('sideEffectsInfo').innerHTML = `
            <ul class="space-y-2">
                ${sideEffects.map(effect => `<li class="flex items-start gap-3 text-gray-300 text-sm"><span class="text-orange-400 flex-shrink-0">⚠</span><span>${effect}</span></li>`).join('')}
            </ul>
        `;
    } else {
        document.getElementById('sideEffectsInfo').innerHTML = '<p class="text-gray-500 text-sm">No side effects data available</p>';
    }
    
    // Alternative Medicines
    const alternatives = data.pricing_information?.alternatives_sorted_by_price || data.alternatives_sorted_by_price || [];
    if (alternatives.length > 0) {
        document.getElementById('alternativesInfo').innerHTML = alternatives.slice(0, 5).map((alt, idx) => `
            <div class="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition border border-green-500/20">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-400 rounded-lg flex items-center justify-center text-white font-bold text-xs" style="box-shadow: 0 0 15px rgba(34, 197, 94, 0.4);">${idx + 1}</div>
                    <span class="font-medium text-gray-200">${alt.brand_name || 'N/A'}</span>
                </div>
                <span class="text-xs font-bold text-green-400 bg-green-500/20 px-2 py-1 rounded border border-green-500/50">₹${alt.price || 'N/A'}</span>
            </div>
        `).join('');
    } else {
        document.getElementById('alternativesInfo').innerHTML = '<p class="text-gray-500 text-sm">No alternatives available</p>';
    }
    
    // Detailed Composition
    if (data.medicine_info) {
        const info = data.medicine_info;
        const usesComp = data.usage_information?.uses || [];
        const sideEffectsComp = data.usage_information?.side_effects || [];
        
        document.getElementById('compositionInfo').innerHTML = `
            <div class="p-4 bg-gray-800/50 rounded-lg border border-blue-500/20 hover:bg-blue-500/10 hover:border-blue-500/40 transition-all duration-300 cursor-pointer">
                <p class="text-xs text-blue-400 mb-2 font-semibold">ACTIVE INGREDIENT</p>
                <p class="text-white font-bold text-lg">${info.composition || 'N/A'}</p>
            </div>
            <div class="p-4 bg-gray-800/50 rounded-lg border border-blue-500/20 hover:bg-blue-500/10 hover:border-blue-500/40 transition-all duration-300 cursor-pointer">
                <p class="text-xs text-blue-400 mb-2 font-semibold">STRENGTH & FORM</p>
                <p class="text-gray-300">${info.strength || 'N/A'} - ${info.dosage_form || 'N/A'}</p>
            </div>
            ${usesComp.length > 0 ? `
            <div class="p-4 bg-gray-800/50 rounded-lg border border-blue-500/20 hover:bg-blue-500/10 hover:border-blue-500/40 transition-all duration-300 cursor-pointer">
                <p class="text-xs text-blue-400 mb-2 font-semibold">THERAPEUTIC USES</p>
                <ul class="text-gray-300 text-sm space-y-1">
                    ${usesComp.slice(0, 5).map(use => `<li class="flex items-start gap-3"><span class="text-blue-400 flex-shrink-0">•</span><span>${use}</span></li>`).join('')}
                </ul>
            </div>
            ` : ''}
        `;
    }
}
