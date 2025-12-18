// LLMO Diagnostic Tool Logic

// ==========================================
// CONFIGURATION
// ==========================================
// ユーザーがデプロイ後に書き換える場所
const GAS_PROXY_URL = "https://script.google.com/macros/s/AKfycbwee5QGd4hKfU1qzvFDJRUtEqE05LrH7HNDE5LqU7zE_neqFeJEcXbFt5VNaiI0SRxV/exec";
const GAS_RECORD_URL = "https://script.google.com/macros/s/AKfycbzJQI9L1DXA24URj-1yIygwiFBCg9xDSG8jELmVfiv38T2aOoOBCoAgMkPPoVVrQVXfjQ/exec";

// ==========================================
// STATE MANAGEMENT
// ==========================================
const state = {
    domain: "",
    companyName: "",
    persona: "",
    questions: [],
    results: {
        total: 0,
        mentioned: 0,
        cited: 0
    },
    isProcessing: false,
    analysisComplete: false,
    userInfoSubmitted: false,
    userName: "",
    userEmail: ""
};

// ==========================================
// DOM ELEMENTS
// ==========================================
const els = {
    startBtn: document.getElementById('startBtn'),
    companyUrl: document.getElementById('companyUrl'),
    companyName: document.getElementById('companyName'),
    errorArea: document.getElementById('errorArea'),
    inputSection: document.getElementById('input-section'),
    waitingSection: document.getElementById('waiting-section'),
    progressSection: document.getElementById('progress-section'),
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText'),
    resultsSection: document.getElementById('results-section'),
    saveBtn: document.getElementById('saveBtn'),
    userName: document.getElementById('userName'),
    userEmail: document.getElementById('userEmail'),
    chartCanvas: document.getElementById('resultChart')
};

// ==========================================
// EVENT LISTENERS
// ==========================================
els.startBtn.addEventListener('click', startDiagnostic);
els.saveBtn.addEventListener('click', handleUserInfoSubmit);

// ==========================================
// CORE FUNCTIONS
// ==========================================

async function startDiagnostic() {
    if (state.isProcessing) return;

    // Validation
    const url = els.companyUrl.value.trim();
    const name = els.companyName.value.trim();

    if (!url || !name) {
        showError("URLと企業名を入力してください。");
        return;
    }

    // Reset State
    state.domain = url;
    state.companyName = name;
    state.persona = "";
    state.questions = [];
    state.results = { total: 0, mentioned: 0, cited: 0 };
    state.isProcessing = true;
    state.analysisComplete = false;
    state.userInfoSubmitted = false;
    state.userName = "";
    state.userEmail = "";

    // UI Reset
    els.errorArea.style.display = 'none';
    els.inputSection.style.display = 'none';
    els.waitingSection.style.display = 'block';
    els.resultsSection.style.display = 'none';
    els.saveBtn.disabled = false;
    els.saveBtn.textContent = "結果を表示する";

    updateProgress(5, "初期化中...");
    log("Diagnostic started for: " + name);

    // Start Analysis in Background
    runAnalysisFlow();
}

async function runAnalysisFlow() {
    try {
        // Step 1: Persona Estimation
        await stepPersona();

        // Step 2: Question Generation
        await stepQuestions();

        // Step 3: Search Loop
        await stepSearchLoop();

        // Mark Analysis as Complete
        state.analysisComplete = true;
        updateProgress(100, "分析完了。情報を入力して結果をご覧ください。");
        log("Analysis flow completed.");

        // Try to finalize if user info is already submitted
        checkAndFinalize();

    } catch (e) {
        showError("エラーが発生しました: " + e.message);
        log("CRITICAL ERROR: " + e.message);
        state.isProcessing = false;
        // Show input section again to allow retry
        els.inputSection.style.display = 'block';
        els.waitingSection.style.display = 'none';
    }
}

async function handleUserInfoSubmit() {
    const name = els.userName.value.trim();
    const email = els.userEmail.value.trim();

    if (!name || !email) {
        alert("お名前とメールアドレスを入力してください。");
        return;
    }

    state.userName = name;
    state.userEmail = email;
    state.userInfoSubmitted = true;

    els.saveBtn.disabled = true;
    els.saveBtn.textContent = "分析完了を待っています...";

    log("User info submitted.");
    checkAndFinalize();
}

function checkAndFinalize() {
    if (state.analysisComplete && state.userInfoSubmitted) {
        finalize();
    } else if (state.userInfoSubmitted && !state.analysisComplete) {
        // User is waiting for analysis
        els.saveBtn.textContent = "分析中...しばらくお待ちください";
    } else if (state.analysisComplete && !state.userInfoSubmitted) {
        // Analysis done, waiting for user input
        els.saveBtn.textContent = "結果を表示する (分析完了)";
        els.saveBtn.disabled = false;
    }
}

async function finalize() {
    // Both conditions met
    log("Finalizing results...");

    // Save Record
    await submitRecord();

    // Show Results
    els.waitingSection.style.display = 'none';
    els.resultsSection.style.display = 'block';
    renderCharts();

    state.isProcessing = false;
}

// ------------------------------------------
// Analysis Steps
// ------------------------------------------

async function stepPersona() {
    updateProgress(10, "企業サイトを分析中...");
    log("Requesting persona analysis...");

    const payload = {
        type: "persona",
        domain: state.domain,
        companyName: state.companyName
    };

    const res = await callProxy(payload);
    if (!res.ok) throw new Error("Persona analysis failed");

    state.persona = res.personaText;
    log("Persona estimated.");
}

async function stepQuestions() {
    updateProgress(30, "検索質問を生成中...");
    log("Generating questions...");

    const payload = {
        type: "questions",
        personaText: state.persona,
        companyName: state.companyName
    };

    const res = await callProxy(payload);
    if (!res.ok) throw new Error("Question generation failed");

    state.questions = res.questions;
    log(`Generated ${state.questions.length} questions.`);
}

async function stepSearchLoop() {
    const total = state.questions.length;
    updateProgress(40, `AI検索診断を開始 (${total}問)...`);

    for (let i = 0; i < total; i++) {
        const q = state.questions[i];
        const progressPercent = 40 + Math.floor(((i + 1) / total) * 50); // 40% -> 90%
        updateProgress(progressPercent, `診断中 (${i + 1}/${total}): ${q.substring(0, 15)}...`);

        try {
            const payload = {
                type: "search",
                question: q,
                companyName: state.companyName,
                domain: state.domain
            };

            const res = await callProxy(payload);

            state.results.total++;
            if (res.mentioned) state.results.mentioned++;
            if (res.cited) state.results.cited++;

            log(`[${i + 1}/${total}] Mentioned: ${res.mentioned}, Cited: ${res.cited}`);

            await new Promise(r => setTimeout(r, 500));

        } catch (e) {
            log(`Error in search loop for "${q}": ${e.message}`);
        }
    }
}

function renderCharts() {
    const ctx = els.chartCanvas.getContext('2d');
    const total = state.results.total || 1;
    const mentionRate = Math.round((state.results.mentioned / total) * 100);
    const citationRate = Math.round((state.results.cited / total) * 100);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['自社名言及率'],
            datasets: [{
                label: 'スコア (%)',
                data: [mentionRate],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.6)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

async function submitRecord() {
    const payload = {
        timestamp: new Date().toISOString(),
        companyName: state.companyName,
        domain: state.domain,
        email: state.userEmail,
        userName: state.userName,
        mentionRate: (state.results.mentioned / state.results.total),
        citationRate: (state.results.cited / state.results.total)
    };

    try {
        await fetch(GAS_RECORD_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        log("Record submitted.");
    } catch (e) {
        console.error(e);
        log("Failed to submit record.");
    }
}

// ==========================================
// UTILITIES
// ==========================================

async function callProxy(payload) {
    if (GAS_PROXY_URL.includes("YOUR_GAS_PROXY")) {
        throw new Error("GAS Proxy URLが設定されていません。");
    }

    try {
        const response = await fetch(GAS_PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();

        if (data.debugLog && Array.isArray(data.debugLog)) {
            data.debugLog.forEach(l => log("[GAS] " + l));
        }

        return data;

    } catch (e) {
        log("Fetch Error: " + e.message);
        throw e;
    }
}

function updateProgress(percent, text) {
    els.progressBar.style.width = percent + '%';
    els.progressText.textContent = text;
}

function log(msg) {
    console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

function showError(msg) {
    els.errorArea.textContent = msg;
    els.errorArea.style.display = 'block';
}
