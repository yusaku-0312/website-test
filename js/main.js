/**
 * LLMO Free Diagnostic Tool - Main Logic with Lead Generation
 */

// ==========================================
// CONFIGURATION
// ==========================================

// サーバー側で環境変数を出力させる
const GAS_WEB_APP_URL = "<%= process.env.GAS_WEB_APP_URL %>";
const API_KEYS = [
    "<%= process.env.GEMINI_API_KEY_1 %>",
    "<%= process.env.GEMINI_API_KEY_2 %>",
    "<%= process.env.GEMINI_API_KEY_3 %>"
];

// 使用するモデル
const MODEL_REASONING = "gemini-2.5-flash";
const MODEL_SEARCH = "gemini-2.5-flash";

const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// ==========================================
// STATE MANAGEMENT
// ==========================================
let currentKeyIndex = 0;
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

function getApiKey() {
    return API_KEYS[currentKeyIndex];
}

function rotateApiKey() {
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    console.log(`[System] Switched to API Key Index: ${currentKeyIndex}`);
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function sanitizeDomain(input) {
    return input.trim().replace(/^https?:\/\//, '').split('/')[0];
}

async function callGeminiApi(modelName, payload, retryCount = 0) {
    const apiKey = getApiKey();
    const url = `${API_BASE_URL}/${modelName}:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            return await response.json();
        }

        if (response.status === 429) {
            console.warn("[API] 429 Too Many Requests. Rotating key...");
            rotateApiKey();
            if (retryCount < 1) {
                await sleep(1000);
                return callGeminiApi(modelName, payload, retryCount + 1);
            }
        } else if (response.status >= 500) {
            console.warn(`[API] Server Error ${response.status}. Retrying...`);
            if (retryCount < 1) {
                await sleep(2000);
                return callGeminiApi(modelName, payload, retryCount + 1);
            }
        }

        throw new Error(`API Error: ${response.status} ${response.statusText}`);

    } catch (error) {
        console.error("[API] Request Failed:", error);
        throw error;
    }
}

// ==========================================
// LOGIC: DIAGNOSIS STEPS
// ==========================================

async function estimatePersona(domain) {
    updateStatus("企業分析中... (ペルソナ推定)", 5);
    const prompt = `
## 企業URL
${domain}

## 指示
上記の企業URLからこの企業について調査し、最終的にこの企業がどんなペルソナをターゲットとしているか予測し以下の形式で出力してください。

## 注意点
- 出力形式以外の属性は追加しないでください。
- 任意項目は不要なら省略してください。
- 任意の項目の中で不要と判定したものは出力の中にラベルすら含めないてください。
- 「ニーズ」は3つ必須。

## 出力形式
"""
##基本情報
性別（任意）：
年代（任意）：
居住地（任意）：
職種（任意）：
業種（任意）：
趣味（任意）：
家族構成（任意）：
ニーズ（３つ必須）：
・〜〜〜
・〜〜〜
・〜〜〜
"""
    `;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }]
    };

    const data = await callGeminiApi(MODEL_REASONING, payload);
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "ペルソナ推定に失敗しました。";
    results.personaText = text;
    return text;
}

async function generateQuestions(personaText) {
    const TOTAL_QUESTIONS = 100;
    const BATCH_COUNT = 5;
    const QUESTIONS_PER_BATCH = 20;
    let allQuestions = [];

    for (let i = 0; i < BATCH_COUNT; i++) {
        updateStatus(`検索シミュレーション用質問を生成中... (${i + 1}/${BATCH_COUNT}セット目)`, 10 + (i * 2)); // 10% -> 20% range

        const prompt = `
以下の人がAIで検索する場面を想像してその人がAIに聞く可能性がある代表的な質問を作って。
本当に作るかを考えたいので基本的に簡潔にして（質問は${QUESTIONS_PER_BATCH}個のみで）。
質問を生成するときにニーズを参照する場合は、複数のニーズの中からランダムにどれか１つを選んでそれを参照するようにして。

${personaText}

出力形式（JSONのみ出力すること）
{
  "prompt": [
    "質問1",
    "質問2",
    ...,
    "質問${QUESTIONS_PER_BATCH}"
  ]
}
        `;

        const payload = { contents: [{ parts: [{ text: prompt }] }] };

        try {
            const data = await callGeminiApi(MODEL_REASONING, payload);
            let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
            text = text.replace(/```json/g, "").replace(/```/g, "").trim();

            const json = JSON.parse(text);
            if (Array.isArray(json.prompt)) {
                allQuestions = allQuestions.concat(json.prompt);
            }
        } catch (e) {
            console.error(`Question generation batch ${i + 1} failed:`, e);
            // Continue to next batch even if one fails, to try to get some questions
        }

        // Short delay between generation batches
        await sleep(500);
    }

    if (allQuestions.length === 0) {
        alert("質問生成に失敗しました。もう一度お試しください。");
        throw new Error("Failed to generate any questions");
    }

    // Ensure we don't exceed 100 if API returns more
    return allQuestions.slice(0, TOTAL_QUESTIONS);
}

async function executeSearchLoop(questions, domain, companyName) {
    const total = questions.length;
    results.total = total;
    results.success = 0;
    results.mentions = 0;
    results.citations = 0;

    const BATCH_SIZE = 5;

    for (let i = 0; i < total; i += BATCH_SIZE) {
        const batch = questions.slice(i, i + BATCH_SIZE);
        const promises = batch.map(async (question, index) => {
            const currentIdx = i + index;
            const progressPercent = Math.round(((currentIdx + 1) / total) * 80) + 20;
            updateStatus(`検索実行中... (${currentIdx + 1}/${total})`, progressPercent);

            try {
                const payload = {
                    contents: [{ parts: [{ text: question }] }],
                    tools: [{ google_search: {} }],
                    safetySettings: [
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                    ]
                };

                const data = await callGeminiApi(MODEL_SEARCH, payload);

                if (data.candidates?.[0]?.finishReason === "SAFETY") {
                    return;
                }

                const candidate = data.candidates?.[0];
                if (!candidate) return;

                results.success++;

                const responseText = candidate.content?.parts?.map(p => p.text).join("") || "";
                if (responseText.includes(companyName)) {
                    results.mentions++;
                }

                const groundingChunks = candidate.groundingMetadata?.groundingChunks || [];
                let isCited = false;
                for (const chunk of groundingChunks) {
                    if (chunk.web?.uri && chunk.web.uri.includes(domain)) {
                        isCited = true;
                        break;
                    }
                }
                if (isCited) {
                    results.citations++;
                }

            } catch (e) {
                console.error(`Error processing question ${currentIdx}:`, e);
            }
        });

        await Promise.all(promises);
        await sleep(200);
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