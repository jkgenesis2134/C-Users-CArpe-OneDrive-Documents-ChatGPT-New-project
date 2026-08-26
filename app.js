const input = document.querySelector('#inputText');
const count = document.querySelector('#wordCount');
const result = document.querySelector('#resultCard');
const resultText = document.querySelector('#resultText');
const resultTitle = document.querySelector('#resultTitle');
const action = document.querySelector('#actionButton');
const themeToggle = document.querySelector('#themeToggle');
let mode = 'Improve';
let uploadedFile = null;
let uploadedText = '';
themeToggle.addEventListener('click', () => { document.body.classList.toggle('dark'); themeToggle.textContent = document.body.classList.contains('dark') ? '☀' : '☾'; themeToggle.setAttribute('aria-label', document.body.classList.contains('dark') ? 'Switch to light mode' : 'Toggle dark mode'); });
const uploadZone = document.querySelector('#uploadZone');
const fileInput = document.querySelector('#fileInput');
const fileStatus = document.querySelector('#fileStatus');
const fileName = document.querySelector('#fileName');
const fileMessage = document.querySelector('#fileMessage');
function showFile(file){
  if (!file) return;
  const allowed = /\.(txt|md|rtf|pdf|doc|docx|tex|bib|ris)$/i.test(file.name);
  if (!allowed) { fileStatus.hidden=false; fileName.textContent=file.name; fileMessage.textContent='Unsupported file type'; return; }
  if (file.size > 20 * 1024 * 1024) { fileStatus.hidden=false; fileName.textContent=file.name; fileMessage.textContent='File is larger than the 20 MB limit'; return; }
  uploadedFile = file;
  uploadedText = '';
  const extension = file.name.split('.').pop().toUpperCase();
  document.querySelector('.file-type').textContent = extension;
  fileName.textContent = file.name;
  fileMessage.textContent = 'Reading…';
  fileStatus.hidden = false;
  if (/\.(txt|md|rtf|tex|bib|ris)$/i.test(file.name)) {
    const reader = new FileReader();
    reader.onload = () => { uploadedText = String(reader.result || ''); input.value = uploadedText; updateCount(); fileMessage.textContent = `${uploadedText.length.toLocaleString()} characters loaded`; };
    reader.onerror = () => { fileMessage.textContent = 'Could not read this file'; };
    reader.readAsText(file);
  } else if (/\.pdf$/i.test(file.name) && window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    file.arrayBuffer().then(buffer => window.pdfjsLib.getDocument({data: buffer}).promise).then(async pdf => {
      const pages = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        pages.push(content.items.map(item => item.str).join(' '));
      }
      uploadedText = pages.join('\n\n'); input.value = uploadedText; updateCount(); fileMessage.textContent = `${pdf.numPages} page${pdf.numPages === 1 ? '' : 's'} read · ${uploadedText.length.toLocaleString()} characters`;
    }).catch(() => { fileMessage.textContent = 'PDF could not be read in this browser'; });
  } else if (/\.docx$/i.test(file.name) && window.mammoth) {
    file.arrayBuffer().then(buffer => window.mammoth.extractRawText({arrayBuffer: buffer})).then(result => {
      uploadedText = result.value || ''; input.value = uploadedText; updateCount(); fileMessage.textContent = `${uploadedText.length.toLocaleString()} characters loaded`;
    }).catch(() => { fileMessage.textContent = 'DOCX could not be read in this browser'; });
  } else {
    fileMessage.textContent = `${extension} selected · text extraction is not available for this format yet`;
  }
}
uploadZone.addEventListener('click', () => fileInput.click());
uploadZone.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); fileInput.click(); } });
fileInput.addEventListener('change', event => showFile(event.target.files[0]));
['dragenter','dragover'].forEach(type => uploadZone.addEventListener(type, event => { event.preventDefault(); uploadZone.classList.add('dragover'); }));
['dragleave','drop'].forEach(type => uploadZone.addEventListener(type, event => { event.preventDefault(); uploadZone.classList.remove('dragover'); }));
uploadZone.addEventListener('drop', event => showFile(event.dataTransfer.files[0]));
document.querySelector('#removeFile').addEventListener('click', () => { fileInput.value=''; uploadedFile=null; uploadedText=''; fileStatus.hidden=true; });

function updateCount(){ const words = input.value.trim() ? input.value.trim().split(/\s+/).length : 0; count.textContent = `${words} word${words === 1 ? '' : 's'}`; }
input.addEventListener('input', () => { if (uploadedFile) uploadedText = input.value; updateCount(); });
document.querySelectorAll('.mode').forEach(button => button.addEventListener('click', () => { document.querySelector('.mode.active').classList.remove('active'); button.classList.add('active'); mode = button.dataset.mode; action.innerHTML = 'Go <span>→</span>'; }));
document.querySelector('#clearButton').addEventListener('click', () => { input.value=''; uploadedFile=null; uploadedText=''; fileInput.value=''; fileStatus.hidden=true; updateCount(); result.hidden=true; input.focus(); });
action.addEventListener('click', () => {
  const text = (uploadedText || input.value).trim();
  if (!text) { input.focus(); input.placeholder = 'Add a little writing first — even one sentence is enough.'; return; }
  const clean = text.replace(/\s+/g, ' ');
  action.disabled = true; action.innerHTML = 'Analyzing <span>…</span>';
  setTimeout(async () => {
  if (mode === 'Improve') { const aiEvaluation = await requestAiEvaluation(clean); if (aiEvaluation) renderAiEvaluation(aiEvaluation); else renderEvaluation(clean); }
  else {
    const outputs = { Simplify: `In simpler words: “${clean.replace(/utilize/gi,'use').replace(/in order to/gi,'to')}”`, Summarize: `The core idea is: ${clean.split(/[.!?]/)[0].trim()}.`, Grammar: `A polished version: “${clean.charAt(0).toUpperCase()+clean.slice(1).replace(/[.!?]?$/, '.') }”`, Humanize: `A more natural, conversational version: “${clean.replace(/furthermore/gi,'also').replace(/in conclusion/gi,'ultimately').replace(/it is important to note that/gi,'')}”`, Formalize: `A more formal version: “${clean.replace(/a lot of/gi,'many').replace(/get/gi,'obtain').replace(/show/gi,'demonstrate').replace(/can't/gi,'cannot')}”` };
    resultTitle.textContent = mode === 'Summarize' ? 'The core idea' : mode === 'Grammar' ? 'Grammar pass' : mode === 'Simplify' ? 'A simpler version' : mode === 'Humanize' ? 'A more natural version' : 'A more formal version';
    resultText.textContent = outputs[mode]; result.hidden=false;
  }
  action.disabled = false; action.innerHTML = 'Go <span>→</span>';
  result.scrollIntoView({behavior:'smooth',block:'nearest'});
  }, 420);
});
document.querySelector('#copyButton').addEventListener('click', async () => { await navigator.clipboard.writeText(resultText.textContent); document.querySelector('#copyButton').textContent='Copied'; setTimeout(()=>document.querySelector('#copyButton').textContent='Copy text',1400); });
document.querySelector('#downloadButton').addEventListener('click', () => { const report = `CareerMaker report\n${resultTitle.textContent}\n\n${resultText.innerText}\n\nGenerated locally. No manuscript was saved.`; const url = URL.createObjectURL(new Blob([report], {type:'text/plain'})); const link = document.createElement('a'); link.href=url; link.download='careermaker-report.txt'; link.click(); URL.revokeObjectURL(url); });

const toolContent = {
  idea: ['Research idea evaluator', 'Use this before adding another variable or collecting more data.', '<label for="ideaInput">Describe your research idea</label><textarea id="ideaInput" class="tool-textarea" placeholder="Example: Workplace stress may reduce employee self-evaluations through depressive symptoms."></textarea><button class="mini-action" id="ideaAction" type="button">Evaluate idea →</button><div id="ideaResult" class="tool-result" hidden></div>'],
  journal: ['Journal match', 'A transparent target strategy with fit, difficulty, and readiness kept separate.', '<div class="match-row"><b>Stretch</b><span>High prestige · lower probability</span><em>Needs stronger contribution</em></div><div class="match-row"><b>Strong target</b><span>Best fit-to-readiness tradeoff</span><em>Recommended after revision</em></div><div class="match-row"><b>Safety</b><span>Realistic specialty outlet</span><em>Verify current scope first</em></div><p class="tool-note">Live journal names, rankings, fees, and policies will be connected to official sources in the publication-intelligence phase.</p>'],
  conference: ['Conference opportunities', 'A workspace for current calls, deadlines, and strategic value.', '<div class="opportunity-row"><b>Call for papers</b><span>Deadline: verify official source</span><em>Fit pending manuscript topic</em></div><div class="opportunity-row"><b>Workshop / symposium</b><span>Submission type: abstract or proposal</span><em>Useful for early feedback</em></div><p class="tool-note">No deadlines are invented. Current opportunities will be retrieved from official society and conference pages.</p>'],
  format: ['Submission formatter', 'Upload a manuscript and identify the journal or conference requirements.', '<div class="formatter-form"><label for="formatterFile">Manuscript file</label><input id="formatterFile" type="file" accept=".docx,.pdf,.txt,.rtf,.md,.tex" /><label for="targetType">Target type</label><select id="targetType"><option>Journal</option><option>Conference</option><option>Proceedings</option></select><label for="targetName">Journal or conference name</label><input id="targetName" type="text" placeholder="Example: Academy of Management Journal" /><label for="instructionsUrl">Official instructions URL</label><input id="instructionsUrl" type="url" placeholder="https://official-site.example/author-guidelines" /><label for="instructionsFile">Optional instructions or template</label><input id="instructionsFile" type="file" accept=".pdf,.docx,.txt,.md" /><button class="mini-action" id="formatterAction" type="button">Prepare formatting checklist →</button><div id="formatterResult" class="tool-result" hidden></div></div>'],
  citation: ['Citation audit', 'An integrity check is useful only when uncertainty stays visible.', '<div class="format-check"><span>01</span><b>Reference coverage</b><small>Missing, duplicate, or uncited entries</small></div><div class="format-check"><span>02</span><b>Metadata verification</b><small>Title, author, year, journal, DOI</small></div><div class="format-check"><span>03</span><b>Claim support</b><small>Unsupported or contradictory claims</small></div><div class="format-warning">CareerMaker will never invent a citation, DOI, quotation, or source.</div>'],
  integrity: ['Research integrity review', 'Educate and flag; do not accuse.', '<div class="format-check"><span>01</span><b>Claim language</b><small>Unsupported causal or absolute claims</small></div><div class="format-check"><span>02</span><b>Analysis provenance</b><small>Exploratory analysis and HARKing risk</small></div><div class="format-check"><span>03</span><b>Reporting completeness</b><small>Ethics, consent, funding, conflicts</small></div><div class="format-warning">Flags indicate checks to perform—not evidence of misconduct.</div>']
};
document.querySelectorAll('.tool-card').forEach(card => card.addEventListener('click', () => { const [title, intro, body] = toolContent[card.dataset.tool]; const output = document.querySelector('#toolOutput'); output.innerHTML = `<div class="tool-output-head"><div><div class="eyebrow muted">CareerMaker module</div><h3>${title}</h3><p>${intro}</p></div><button class="close-tool" type="button" aria-label="Close module">×</button></div><div class="tool-output-body">${body}</div>`; output.hidden=false; output.querySelector('.close-tool').addEventListener('click', () => { output.hidden=true; }); if(card.dataset.tool === 'idea') setupIdeaEvaluator(); if(card.dataset.tool === 'format') setupFormatter(); output.scrollIntoView({behavior:'smooth',block:'nearest'}); }));
function setupIdeaEvaluator(){ const ideaInput=document.querySelector('#ideaInput'); const ideaAction=document.querySelector('#ideaAction'); const ideaResult=document.querySelector('#ideaResult'); ideaAction.addEventListener('click',()=>{ const idea=ideaInput.value.trim(); if(!idea){ideaInput.focus();return;} const hasMechanism=/\bthrough|because|mediates?|explains?|mechanism\b/i.test(idea); const hasConstructs=idea.split(/\s+/).length>8; ideaResult.innerHTML=`<span class="mini-label">FIRST-PASS READ</span><strong>${hasMechanism ? 'Promising mechanism; test whether it is genuinely distinct.' : 'Topic is visible, but the mechanism is not yet explicit.'}</strong><p>Potential: ${hasConstructs ? 'worth developing' : 'insufficient detail to assess'}. Feasibility depends on measurable constructs, an appropriate sample, and a design that can distinguish competing explanations.</p><ul><li>Define the problem this idea resolves.</li><li>Identify the strongest alternative theory.</li><li>Do not add moderators until the core mechanism is defensible.</li></ul>`; ideaResult.hidden=false; }); }
document.querySelector('#researchMapButton').addEventListener('click', () => { const map=document.querySelector('#mapOutput'); map.hidden=false; map.scrollIntoView({behavior:'smooth',block:'nearest'}); });
function setupFormatter(){ const manuscript=document.querySelector('#formatterFile'); const targetType=document.querySelector('#targetType'); const targetName=document.querySelector('#targetName'); const instructionsUrl=document.querySelector('#instructionsUrl'); const result=document.querySelector('#formatterResult'); document.querySelector('#formatterAction').addEventListener('click',()=>{ if(!manuscript.files[0] || !targetName.value.trim()){ result.innerHTML='<strong>Choose a manuscript and name the target first.</strong><p>The formatter needs both before it can create a useful compliance checklist.</p>'; result.hidden=false; return; } const template=instructionsUrl.value.trim() ? `Official instructions supplied: ${instructionsUrl.value.trim()}` : 'No official instructions URL supplied yet.'; result.innerHTML=`<span class="mini-label">FORMATTER SETUP READY</span><strong>${manuscript.files[0].name} → ${targetName.value.trim()}</strong><p>${targetType.value} submission workflow initialized. ${template}</p><div class="format-check"><span>01</span><b>Content preservation</b><small>Prose, claims, statistics, quotations, and citations stay unchanged</small></div><div class="format-check"><span>02</span><b>Rules to verify</b><small>Font, margins, spacing, headings, tables, figures, anonymity, and word limits</small></div><div class="format-check"><span>03</span><b>Outputs</b><small>Formatted manuscript, compliance report, and unapplied revision recommendations</small></div>`; result.hidden=false; }); }

function renderEvaluation(text){
  const words = text.split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).filter(Boolean).length;
  const hasQuestion = /\?/.test(text);
  const hasEvidence = /\b(because|data|study|studies|evidence|sample|result|findings|method|analysis|research)\b/i.test(text);
  const hasClaim = /\b(show|shows|prove|proves|suggest|suggests|therefore|cause|causes|impact|effect|significant)\b/i.test(text);
  const scores = { Contribution: hasQuestion ? 3 : 2, Theory: hasClaim ? 3 : 2, Literature: hasEvidence ? 3 : 1, Methods: hasEvidence ? 3 : 1, Analysis: hasClaim && hasEvidence ? 3 : 1, Results: hasEvidence ? 3 : 1, Discussion: hasClaim ? 3 : 2, Implications: hasClaim ? 3 : 2, Limitations: 2, Writing: sentences > 2 ? 3 : 2 };
  const pointWeights = {Contribution:20, Theory:15, Literature:10, Methods:15, Analysis:15, Results:5, Discussion:7, Implications:4, Limitations:3, Writing:6};
  const manuscriptScore = Math.round(Object.entries(pointWeights).reduce((total, [dimension, weight]) => total + (scores[dimension] / 5) * weight, 0));
  const average = (Object.values(scores).reduce((a,b)=>a+b,0)/Object.values(scores).length).toFixed(1);
  const sectionCount = ['abstract','introduction','literature review','theory','methods','results','discussion','references'].filter(section => new RegExp(`\\b${section}\\b`, 'i').test(text)).length;
  const paperType = words < 90 ? 'Research idea or abstract' : sectionCount >= 5 ? 'Journal-style manuscript' : sectionCount >= 2 ? 'Incomplete manuscript or proposal' : 'Early manuscript draft';
  const completion = sectionCount >= 5 ? 'Substantive sections detected' : sectionCount >= 2 ? 'Partial structure detected' : 'Insufficient structure detected';
  const binding = !hasEvidence ? 'Evidence and methods are the binding constraint.' : !hasQuestion ? 'The central research question or contribution is not yet explicit.' : 'The next ceiling is set by how clearly the evidence supports the central claim.';
  const verdict = words < 80 ? 'There may be a paper here, but there is not enough evidence in this draft to call it publishable yet.' : 'There is a workable paper-shaped idea here. Its publication ceiling depends on strengthening the contribution and evidence before polishing prose.';
  resultTitle.textContent = 'Paper evaluation';
  resultText.innerHTML = `<div class="score-banner"><div><span class="mini-label">CAREERMAKER MANUSCRIPT SCORE</span><strong>${manuscriptScore}<small>/100</small></strong><span>Provisional screening score · fatal flaws can override averages</span></div><div class="score-ring">${manuscriptScore >= 70 ? 'Promising' : manuscriptScore >= 50 ? 'Developing' : 'Weak'}</div></div><div class="verdict-block"><span class="mini-label">BLUNT VERDICT</span><strong>${verdict}</strong><p>This is an instructional first-pass audit, not an acceptance prediction. It is based only on the text provided; it cannot verify data, code, citations, or whether analyses were executed correctly.</p></div><div class="dimension-grid">${Object.entries(pointWeights).map(([dimension, weight]) => `<div><span>${dimension}</span><b>${scores[dimension]}/5</b><small>${weight} pts</small></div>`).join('')}</div><div class="eval-grid"><div><span class="mini-label">BINDING CONSTRAINT</span><strong>${binding}</strong></div><div><span class="mini-label">PAPER SNAPSHOT</span><strong>${words} words · ${sentences} sentences</strong><small>${hasClaim ? 'Contains claim language.' : 'No clear claim language detected.'}</small></div></div><div class="roadmap"><span class="mini-label">HIGHEST-LEVERAGE NEXT STEPS</span><ol><li>State the specific problem and what changes if your answer is right.</li><li>Connect each major claim to observable evidence, a method, or a cited source.</li><li>Separate what the evidence shows from what it merely suggests.</li></ol></div><button id="furtherButton" class="further-button" type="button">Further evaluation <span>→</span></button>`;
  resultText.insertAdjacentHTML('afterbegin', `<div class="classification-row"><div><span class="mini-label">DETECTED PAPER TYPE</span><strong>${paperType}</strong></div><div><span class="mini-label">COMPLETION STATUS</span><strong>${completion}</strong></div></div>`);
  document.querySelector('#furtherButton').addEventListener('click', () => renderDetailedEvaluation(text, {words, sentences, hasQuestion, hasEvidence, hasClaim, scores, average, binding, manuscriptScore}));
  result.hidden=false;
}

async function requestAiEvaluation(text){
  try { const response = await fetch('/api/analyze', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({text})}); if (!response.ok) return null; const data = await response.json(); return data.evaluation || null; } catch { return null; }
}

function renderAiEvaluation(evaluation){
  resultTitle.textContent = 'AI manuscript evaluation';
  const dimensions = Array.isArray(evaluation.dimensions) ? evaluation.dimensions : [];
  resultText.innerHTML = `<div class="score-banner"><div><span class="mini-label">CAREERMAKER MANUSCRIPT SCORE</span><strong>${Math.round(evaluation.manuscriptScore)}<small>/100</small></strong><span>AI-assisted structured review · inspect evidence before acting</span></div><div class="score-ring">${evaluation.manuscriptScore >= 70 ? 'Promising' : evaluation.manuscriptScore >= 50 ? 'Developing' : 'Weak'}</div></div><div class="classification-row"><div><span class="mini-label">DETECTED PAPER TYPE</span><strong>${evaluation.paperType}</strong></div><div><span class="mini-label">COMPLETION STATUS</span><strong>${evaluation.completionStatus}</strong></div></div><div class="verdict-block"><span class="mini-label">BLUNT VERDICT</span><strong>${evaluation.verdict}</strong><p>AI-generated developmental feedback is not an acceptance prediction. Verify every consequential judgment against the manuscript and source materials.</p></div><div class="dimension-grid">${dimensions.map(dimension => `<div><span>${dimension.name}</span><b>${dimension.score}/5</b><small>${dimension.rationale}</small></div>`).join('')}</div><div class="eval-grid"><div><span class="mini-label">BINDING CONSTRAINT</span><strong>${evaluation.bindingConstraint}</strong></div><div><span class="mini-label">LIMITATIONS</span><strong>${(evaluation.limitations || []).join(' ')}</strong></div></div><div class="roadmap"><span class="mini-label">HIGHEST-LEVERAGE REVISIONS</span><ol>${(evaluation.revisions || []).map(revision => `<li>${revision}</li>`).join('')}</ol></div><button id="furtherButton" class="further-button" type="button">Further evaluation <span>→</span></button>`;
  document.querySelector('#furtherButton').addEventListener('click', () => { const detail = {words:0,sentences:0,hasQuestion:false,hasEvidence:true,hasClaim:true,scores:{Contribution:3,Theory:3,Methods:3,Writing:3},average:'3.0',binding:evaluation.bindingConstraint,manuscriptScore:evaluation.manuscriptScore}; renderDetailedEvaluation(evaluation.verdict, detail); });
  result.hidden=false;
}

function renderDetailedEvaluation(text, summary){
  const {words, sentences, hasQuestion, hasEvidence, hasClaim, scores, average, binding} = summary;
  const sentenceLengths = text.split(/[.!?]+/).filter(Boolean).map(sentence => sentence.trim().split(/\s+/).length);
  const averageSentenceLength = sentenceLengths.length ? sentenceLengths.reduce((a,b)=>a+b,0) / sentenceLengths.length : 0;
  const aiSignals = (averageSentenceLength > 24 ? 1 : 0) + (/\b(furthermore|moreover|in conclusion|it is important to note)\b/gi.test(text) ? 1 : 0) + (sentences > 2 && new Set(sentenceLengths).size <= 2 ? 1 : 0);
  const aiEstimate = Math.min(80, 18 + aiSignals * 17);
  const evidenceNote = hasEvidence ? 'The draft uses some evidence-oriented language, but each important claim still needs a traceable source, method, or result.' : 'No clear evidence, sample, method, or result language was detected. This is the first issue to resolve before polishing.';
  const theoryNote = hasQuestion ? 'A question is visible, but the manuscript should explain the mechanism—not only describe an association or topic.' : 'The research question and theoretical problem are not yet explicit enough to assess.';
  const methodsNote = hasEvidence ? 'Reported-methods audit: look for sampling logic, measurement validity, design fit, missing data, assumptions, robustness checks, effect sizes, and confidence intervals.' : 'Reported-methods audit cannot begin credibly until the design, sample, measures, and analysis are stated.';
  resultTitle.textContent = 'Detailed evaluation';
  resultText.innerHTML = `<div class="detail-intro"><span class="mini-label">SECOND-PASS REVIEW</span><strong>Greater detail, with uncertainty kept visible.</strong><p>This expanded review separates scholarly quality from writing polish. A manuscript-only review can audit what is reported and whether the argument is internally coherent; it cannot independently verify execution.</p></div><div class="detail-section"><span class="mini-label">1 · CONTRIBUTION & ORIGINALITY · ${scores.Contribution}/5</span><h4>What would make this matter?</h4><p>${hasQuestion ? 'The draft has a starting point for a research question.' : 'The draft needs a sharply stated problem before originality can be judged.'} Specify whether the contribution is a new mechanism, boundary condition, theory, method, or meaningful evidence—not merely a new setting or sample.</p><div class="detail-callout">Ask: what recognized uncertainty does this resolve, and what would a reader do differently after learning the answer?</div></div><div class="detail-section"><span class="mini-label">2 · THEORY & ARGUMENT · ${scores.Theory}/5</span><h4>Does the logic explain, or only describe?</h4><p>${theoryNote} Define constructs precisely, distinguish competing explanations, state boundary conditions, and ensure the conclusion does not outrun the premises.</p></div><div class="detail-section"><span class="mini-label">3 · METHODS & ANALYSIS · ${scores.Methods}/5</span><h4>Can the design answer the question?</h4><p>${methodsNote} If the paper makes causal language, confirm temporal ordering, confounding controls, identification, and whether the design supports causal inference. If it is qualitative, evaluate sampling, coding, reflexivity, negative cases, and credibility instead.</p></div><div class="detail-section"><span class="mini-label">4 · RESULTS, EVIDENCE & INTEGRITY · ${hasEvidence ? '3' : '1'}/5</span><h4>Are claims matched to support?</h4><p>${evidenceNote} Check that tables, figures, statistics, quotations, citations, and narrative conclusions agree. Unverified references, missing sources, contradictory evidence, and unsupported causal claims should be flagged—not silently repaired.</p></div><div class="detail-section"><span class="mini-label">5 · WRITING & ARCHITECTURE · ${scores.Writing}/5</span><h4>Does the structure help the reader think?</h4><p>The current draft contains ${sentences} sentence${sentences === 1 ? '' : 's'} across ${words} words. Improve paragraph purpose, transitions, terminology consistency, qualification, and contribution clarity after the research logic is sound. Prose quality must not hide a weak design.</p></div><div class="detail-section"><span class="mini-label">6 · AI-WRITING DIAGNOSTIC · PROBABILISTIC</span><h4>${aiEstimate}% AI-associated pattern estimate</h4><p>This is not an authorship determination. The estimate reflects limited stylistic signals such as sentence uniformity and formulaic transitions. Technical prose, multilingual writing, editing, and short passages can create false positives and false negatives.</p><div class="detail-callout">Recommended human review: inspect the highest-signal passages and compare them with the author's normal writing. Do not use this result as proof of misconduct.</div></div><div class="detail-section"><span class="mini-label">7 · RESEARCH INTEGRITY REVIEW</span><h4>Evidence and reporting checks to complete</h4><p>${hasClaim ? 'Claim language is present. Check causal wording, exploratory analyses, hypothesis timing, and whether every conclusion is supported.' : 'No strong claim language was detected. Confirm that the manuscript states its research question, evidence, and analytic conclusion clearly.'}</p><ul><li>Check for unsupported causal claims and undisclosed exploratory analysis.</li><li>Verify citations, references, numbers, tables, and quotations against source files.</li><li>Flag missing ethics, consent, funding, conflict, or data-availability information where relevant.</li></ul></div><div class="ceiling"><span class="mini-label">CURRENT CEILING</span><strong>${average >= 3 ? 'Developing B candidate' : 'Major redevelopment needed'}</strong><p>${binding} This band is provisional and should move only when the binding constraint is repaired with credible evidence.</p></div><div class="roadmap"><span class="mini-label">PRIORITIZED REVISION ROADMAP</span><ol><li><b>Essential:</b> State the research problem, contribution, and boundaries in one precise paragraph.</li><li><b>Essential:</b> Map every major claim to evidence and remove claims the design cannot support.</li><li><b>Strongly recommended:</b> Add transparent methods, sample details, measures, assumptions, and robustness checks.</li><li><b>Later:</b> Refine prose, tables, figures, formatting, and target-journal fit.</li></ol></div><button id="reviewButton" class="further-button" type="button">Run peer review simulation <span>→</span></button>`;
  document.querySelector('.result-tag').textContent = 'Detailed review';
  document.querySelector('#reviewButton').addEventListener('click', () => { document.querySelector('#reviewPanel').hidden = false; document.querySelector('#reviewPanel').scrollIntoView({behavior:'smooth',block:'start'}); });
}
