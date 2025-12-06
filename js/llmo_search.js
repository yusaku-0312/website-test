/**
 * LLMO Free Diagnostic Tool - Main Logic with Lead Generation
 */

// ==========================================
// ==========================================
// CONFIGURATION
// ==========================================

// TODO: ここにGASのウェブアプリURLを貼り付けてください (スプレッドシート記録用)
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxYgCD2SLlDbpOGH7RzVqvDl6m2wSB7i9cz_ELWRVaABwyFnkCNVA38RQOcHG3sTazs/exec";

// TODO: 診断用プロキシURLを設定
const GAS_PROXY_URL = "https://script.google.com/macros/s/AKfycbx8rd0CzTSGVW0sA28STxRbAi5b7FlRTp5tfN4rhM5WItW4N8EJgcMZpI4YIAwVAMd_/exec";

// ==========================================
// STATE MANAGEMENT
// ==========================================
let isRunning = false;

// 同期用フラグ
let isDiagnosisComplete = false;
let isLeadSubmitted = false;

// ユーザー入力データ保持用
let userData = {
    domain: "",
    companyName: "",
    contactName: "",
    contactEmail: ""
};

// 診断結果データ保持用
let results = {
    total: 0,
    success: 0,
    mentions: 0,
    citations: 0,
    personaText: ""
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function sanitizeDomain(input) {
    return input.trim().replace(/^https?:\/\//, '').split('/')[0];
}

function addLog(message, isError = false) {
    const consoleEl = document.getElementById("debug-log-content");
    if (!consoleEl) return;

    const entry = document.createElement("div");
    entry.className = isError ? "log-entry log-error" : "log-entry log-info";

    const time = new Date().toLocaleTimeString();
    entry.textContent = `[${time}] ${message}`;

    consoleEl.appendChild(entry);
    consoleEl.scrollTop = consoleEl.scrollHeight;
}

async function callProxy(type, payload) {
    const body = { type, ...payload };
    addLog(`[REQ] type=${type}`);

    try {
        const res = await fetch(GAS_PROXY_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            throw new Error(`Proxy Error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();

        // GAS側からのデバッグログを表示
        if (data.debugLog && Array.isArray(data.debugLog)) {
            data.debugLog.forEach(log => addLog(`[GAS] ${log}`));
        }

        if (!data.ok) {
            throw new Error(`Proxy Logic Error: ${data.errorMessage || data.error || "unknown error"}`);
        }

        addLog(`[RES] OK`);
        return data;

    } catch (e) {
        addLog(`[ERR] ${e.message}`, true);
        throw e;
    }
}

// ==========================================
// LOGIC: DIAGNOSIS STEPS
// ==========================================

async function estimatePersona(domain) {
    updateStatus("企業分析中... (ペルソナ推定)", 5);

    const data = await callProxy("persona", { domain });
    const text = data.personaText || "ペルソナ推定に失敗しました。";

    results.personaText = text;

    updateStatus("ペルソナ推定が完了しました", 20);
    return text;
}

async function generateQuestions(personaText) {
    updateStatus("検索シミュレーション用質問を生成中...", 20);

    const data = await callProxy("questions", { personaText });
    const questions = Array.isArray(data.questions) ? data.questions : [];

    if (questions.length === 0) {
        alert("質問生成に失敗しました。もう一度お試しください。");
        throw new Error("Failed to generate questions");
    }

    updateStatus("質問生成が完了しました", 30);
    return questions;
}

async function executeSearchLoop(questions, domain, companyName) {
    const total = questions.length;
    results.total = total;
    results.success = 0;
    results.mentions = 0;
    results.citations = 0;

    for (let i = 0; i < total; i++) {
        const question = questions[i];

        const progressPercent = 30 + Math.round(((i + 1) / total) * 70);
        updateStatus(`検索実行中... (${i + 1}/${total})`, progressPercent);

        try {
            const data = await callProxy("search", {
                question,
                domain,
                companyName,
            });

            results.success++;

            if (data.mentioned) {
                results.mentions++;
            }
            if (data.cited) {
                results.citations++;
            }
        } catch (e) {
            console.error(`Error processing question ${i}:`, e);
            // エラー時はスキップして次へ
        }
    }
}

// ==========================================
// LOGIC: RESULT & LEAD HANDLING
// ==========================================

/**
 * 診断とリード送信の両方が完了しているかチェックして処理を進める
 */
async function checkAndFinalize() {
    const leadBtn = document.getElementById("leadSubmitBtn");

    if (isDiagnosisComplete && isLeadSubmitted) {
        // 両方完了 -> GAS送信 -> 結果表示
        leadBtn.textContent = "データを送信中...";
        leadBtn.disabled = true;

        await sendDataToGAS();

        document.getElementById("leadFormArea").style.display = "none";
        document.getElementById("progressArea").style.display = "none";


        document.getElementById("resultArea").style.display = "block";
        renderChart();

    } else if (isDiagnosisComplete && !isLeadSubmitted) {
        // 診断完了待機中
        updateStatus("診断完了。結果を表示するにはフォームを送信してください。", 100);
        leadBtn.textContent = "送信して結果を見る";
        leadBtn.disabled = false;

    } else if (!isDiagnosisComplete && isLeadSubmitted) {
        // フォーム送信済み、診断待ち
        leadBtn.textContent = "診断完了までお待ちください...";
        leadBtn.disabled = true;
    }
}

/**
 * GASへデータを送信
 */
async function sendDataToGAS() {
    const mentionRate = results.success > 0 ? (results.mentions / results.success) * 100 : 0;
    const citationRate = results.success > 0 ? (results.citations / results.success) * 100 : 0;

    const payload = {
        timestamp: new Date().toISOString(),
        companyName: userData.companyName,
        targetDomain: userData.domain,
        contactName: userData.contactName,
        contactEmail: userData.contactEmail,
        source: "LLMO_Diagnosis_Tool",
        result_mention: mentionRate.toFixed(1),
        result_citation: citationRate.toFixed(1)
    };

    try {
        // GAS Web AppへPOST (no-corsモードは使いません。GAS側で適切なレスポンスを返せば通常モードでOK)
        // もしCORSエラーが出る場合は mode: 'no-cors' を検討しますが、結果が取れなくなります
        await fetch(GAS_WEB_APP_URL, {
            method: "POST",
            body: JSON.stringify(payload)
        });
        console.log("Data sent to GAS successfully.");
    } catch (e) {
        console.error("Failed to send data to GAS:", e);
        // 送信失敗してもユーザーには結果を見せる
    }
}

function renderChart() {
    const ctx = document.getElementById('resultChart').getContext('2d');
    const mentionRate = results.success > 0 ? (results.mentions / results.success) * 100 : 0;
    const citationRate = results.success > 0 ? (results.citations / results.success) * 100 : 0;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['表示割合 (Mention Rate)', '引用割合 (Citation Rate)'],
            datasets: [{
                label: `スコア`,
                data: [mentionRate, citationRate],
                backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(75, 192, 192, 0.6)'],
                borderColor: ['rgba(54, 162, 235, 1)', 'rgba(75, 192, 192, 1)'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { callback: (val) => val + "%" }
                }
            }
        }
    });
}

function updateStatus(text, percent) {
    document.getElementById("statusText").textContent = text;
    document.getElementById("progressPercent").textContent = `${percent}%`;
    document.getElementById("progressBar").style.width = `${percent}%`;
}

// ==========================================
// EVENT LISTENERS
// ==========================================

// 1. 診断開始ボタン
document.getElementById("startBtn").addEventListener("click", async () => {
    if (isRunning) return;

    const domainInput = document.getElementById("companyDomain").value;
    const nameInput = document.getElementById("companyName").value;

    if (!domainInput || !nameInput) {
        alert("企業URLと企業名を入力してください。");
        return;
    }

    // GAS URLチェック
    if (!GAS_WEB_APP_URL || GAS_WEB_APP_URL === "YOUR_GAS_WEB_APP_URL_HERE") {
        console.warn("GAS URLが設定されていません。");
    }

    // 初期化
    userData.domain = sanitizeDomain(domainInput);
    userData.companyName = nameInput;

    isRunning = true;
    isDiagnosisComplete = false;
    isLeadSubmitted = false;

    // UI切り替え
    document.getElementById("startBtn").disabled = true;
    document.getElementById("initialForm").style.display = "none"; // 初期フォーム隠す
    document.getElementById("progressArea").style.display = "block";

    // リードフォーム表示 (アニメーション付き)
    const leadArea = document.getElementById("leadFormArea");
    leadArea.style.display = "block";

    addLog("Diagnosis started for: " + userData.domain);

    try {
        // --- 非同期で診断実行 ---
        (async () => {
            try {
                const persona = await estimatePersona(userData.domain);
                const questions = await generateQuestions(persona);
                await executeSearchLoop(questions, userData.domain, userData.companyName);

                // 診断完了
                isDiagnosisComplete = true;
                await checkAndFinalize();
            } catch (error) {
                console.error("Diagnosis process error:", error);
                alert("診断中にエラーが発生しました。");
                isRunning = false;
            }
        })();

    } catch (e) {
        console.error("Init error:", e);
    }
});

// 2. リード送信ボタン
document.getElementById("leadSubmitBtn").addEventListener("click", async () => {
    const cName = document.getElementById("contactName").value;
    const cEmail = document.getElementById("contactEmail").value;

    if (!cName || !cEmail) {
        alert("担当者名とメールアドレスを入力してください。");
        return;
    }

    userData.contactName = cName;
    userData.contactEmail = cEmail;
    isLeadSubmitted = true;

    // ボタンの状態更新
    const btn = document.getElementById("leadSubmitBtn");
    btn.textContent = "情報を受け付けました。診断完了を待機中...";
    btn.disabled = true;

    // 診断状況をチェック
    await checkAndFinalize();
});