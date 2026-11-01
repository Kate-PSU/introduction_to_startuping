"use strict";

const STORAGE_KEY = "linguistic-startup-idea-lab-v1";
const STEP_TITLES = ["Исходные данные","Design Thinking","SCAMPER","Выбор направления","Ценностное предложение","SMART-эксперимент","Итоговый пакет"];
const initialState = {step:0,fields:{},checks:{},ideas:[{name:"",value:3,feasibility:3,novelty:3},{name:"",value:3,feasibility:3,novelty:3},{name:"",value:3,feasibility:3,novelty:3}]};
let state = loadState();
let saveTimer;

const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const clean = value => String(value || "").trim();
const fallback = (value, text) => clean(value) || `[${text}]`;
const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));

function loadState(){
  try{
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(!saved || typeof saved !== "object") return structuredClone(initialState);
    return {...structuredClone(initialState),...saved,fields:{...(saved.fields||{})},checks:{...(saved.checks||{})},ideas:Array.isArray(saved.ideas)&&saved.ideas.length?saved.ideas:structuredClone(initialState.ideas)};
  }catch{return structuredClone(initialState)}
}

function scheduleSave(){
  clearTimeout(saveTimer);
  $("#saveState").textContent="Сохраняем…";
  saveTimer=setTimeout(()=>{
    localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
    $("#saveState").textContent="Черновик сохранён";
  },250);
}

function hydrateFields(){
  $$('[data-field]').forEach(el=>{
    el.value=state.fields[el.dataset.field]||"";
    el.addEventListener("input",()=>{
      state.fields[el.dataset.field]=el.value;
      updateLivePreviews();
      scheduleSave();
    });
  });
  $$('[data-check]').forEach(el=>{
    el.checked=Boolean(state.checks[el.dataset.check]);
    el.addEventListener("change",()=>{state.checks[el.dataset.check]=el.checked;scheduleSave()});
  });
}

function field(name){return state.fields[name]||""}

function povText(){
  return `Пользователь: ${fallback(field("dtUser")||field("audience"),"конкретный представитель сегмента")}. Потребность: ${fallback(field("dtNeed"),"что ему необходимо сделать")}. Инсайт: ${fallback(field("dtInsight"),"почему это важно и что объясняет его поведение")}.`;
}

function oneLineText(){
  return `Целевая аудитория — ${fallback(field("audience"),"сегмент")}. Проблема — ${fallback(field("problem"),"наблюдаемое затруднение")}. Решение — ${fallback(field("solution"),"предлагаемый способ")}. Ценность — ${fallback(field("value"),"ожидаемый результат")}. Текущая альтернатива — ${fallback(field("alternative"),"существующий способ")}. Ключевое отличие — ${fallback(field("difference"),"отличие решения")}.`;
}

function smartText(){
  const date=field("smartT") ? new Date(`${field("smartT")}T00:00:00`).toLocaleDateString("ru-RU") : "[срок]";
  return `Срок — ${date}. Действие — ${fallback(field("smartS"),"конкретный эксперимент")}. Реалистичный масштаб — ${fallback(field("smartA"),"объём проверки")}. Метрика — ${fallback(field("smartM"),"измеримый показатель")}. Проверяемая гипотеза — ${fallback(field("smartR"),"ключевое допущение")}.`;
}

function pitchText(){
  const project=clean(field("project")) ? `${clean(field("project"))}. ` : "";
  return `${project}${oneLineText()} Ближайшая проверка — ${fallback(field("smartS"),"первый эксперимент")}.`;
}

function updateLivePreviews(){
  $("#povPreview").textContent=povText();
  $("#oneLinePreview").textContent=oneLineText();
  $("#smartPreview").textContent=smartText();
  if(state.step===6) renderResults();
}

function renderDots(){
  const nav=$("#stepDots");nav.innerHTML="";
  STEP_TITLES.forEach((title,index)=>{
    const button=document.createElement("button");
    button.type="button";button.title=`Шаг ${index+1}: ${title}`;button.setAttribute("aria-label",button.title);
    if(index===state.step) button.className="active";
    button.addEventListener("click",()=>goToStep(index));nav.append(button);
  });
}

function renderStep(){
  state.step=Math.max(0,Math.min(STEP_TITLES.length-1,Number(state.step)||0));
  $$(".step").forEach((el,index)=>el.classList.toggle("active",index===state.step));
  $("#stepLabel").textContent=`Шаг ${state.step+1} из ${STEP_TITLES.length}`;
  $("#stepTitle").textContent=STEP_TITLES[state.step];
  $("#progressBar").style.width=`${((state.step+1)/STEP_TITLES.length)*100}%`;
  $("#prevButton").disabled=state.step===0;
  $("#nextButton").textContent=state.step===STEP_TITLES.length-1?"Вернуться к началу ↺":"Далее →";
  renderDots();
  if(state.step===3) renderIdeas();
  if(state.step===6) renderResults();
  scheduleSave();
  window.scrollTo({top:0,behavior:"smooth"});
}

function goToStep(index){state.step=index;renderStep()}

function renderIdeas(){
  const root=$("#ideaCards");root.innerHTML="";
  state.ideas.forEach((idea,index)=>{
    const card=document.createElement("div");card.className="idea-card";
    card.innerHTML=`
      <label>Вариант идеи<textarea rows="3" data-idea-name="${index}" placeholder="Опишите решение">${escapeHtml(idea.name)}</textarea></label>
      ${scoreControl(index,"value","Ценность")}
      ${scoreControl(index,"feasibility","Реализуемость")}
      ${scoreControl(index,"novelty","Отличие")}
      <button type="button" data-remove-idea="${index}" title="Удалить вариант" aria-label="Удалить вариант">×</button>`;
    root.append(card);updateIdeaTotal(card,index);
  });
  $$('[data-idea-name]',root).forEach(el=>el.addEventListener("input",()=>{state.ideas[+el.dataset.ideaName].name=el.value;updateIdeaTotal(el.closest(".idea-card"),+el.dataset.ideaName);scheduleSave()}));
  $$('[data-idea-score]',root).forEach(el=>el.addEventListener("input",()=>{const [index,key]=el.dataset.ideaScore.split(":");state.ideas[+index][key]=+el.value;el.nextElementSibling.textContent=el.value;updateIdeaTotal(el.closest(".idea-card"),+index);scheduleSave()}));
  $$('[data-remove-idea]',root).forEach(el=>el.addEventListener("click",()=>{if(state.ideas.length===1)return showToast("Оставьте хотя бы один вариант");state.ideas.splice(+el.dataset.removeIdea,1);renderIdeas();scheduleSave()}));
}

function scoreControl(index,key,label){
  const value=Number(state.ideas[index][key]||3);
  return `<label>${label}<input type="range" min="1" max="5" value="${value}" data-idea-score="${index}:${key}"><span class="idea-score">${value}</span></label>`;
}

function updateIdeaTotal(card,index){
  const old=card.querySelector(".total-score");if(old)old.remove();
  const sum=["value","feasibility","novelty"].reduce((acc,key)=>acc+Number(state.ideas[index][key]||0),0);
  const tag=document.createElement("span");tag.className="idea-score total-score";tag.textContent=`Итого: ${sum}/15`;
  card.querySelector("label:first-child").append(tag);
}

function addIdea(){
  state.ideas.push({name:"",value:3,feasibility:3,novelty:3});renderIdeas();scheduleSave();
}

function resultItems(){
  const scamper=["S","C","A","M","P","E","R"].map(letter=>clean(field(`sc${letter}`))?`${letter}: ${clean(field(`sc${letter}`))}`:"").filter(Boolean).join("\n");
  return [
    ["Проблемная гипотеза",`Сегмент — ${fallback(field("audience"),"конкретная аудитория")}. Ситуация — ${fallback(field("situation"),"контекст возникновения проблемы")}. Наблюдаемая проблема — ${fallback(field("problem"),"затруднение пользователя")}. Последствия — ${fallback(field("consequence"),"потери или ограничения")}. Основание гипотезы — ${fallback(field("evidence"),"данные для проверки")}.`],
    ["Point of View",povText()],
    ["Вопрос «Как мы можем…?»",fallback(field("hmw"),"сформулируйте открытый вопрос")],
    ["SCAMPER и выбранные варианты",scamper||"[Заполните хотя бы несколько направлений SCAMPER]"],
    ["Ценностное предложение",oneLineText()],
    ["Объяснение без жаргона",fallback(field("plainVersion"),"объясните идею простыми словами")],
    ["Короткий питч",pitchText()],
    ["SMART-цель эксперимента",`${smartText()} Правило решения: ${fallback(field("decisionRule"),"если…, то…")}`]
  ];
}

function renderResults(){
  const root=$("#results");root.innerHTML="";
  resultItems().forEach(([title,text],index)=>{
    const card=document.createElement("article");card.className=`result-card${[3,4,6,7].includes(index)?" wide":""}`;
    const h=document.createElement("h3");h.textContent=title;const p=document.createElement("p");p.textContent=text;card.append(h,p);root.append(card);
  });
}

function markdownResult(){
  const title=clean(field("project"))||"Идея лингвистического стартапа";
  const sections=resultItems().map(([heading,text])=>`## ${heading}\n\n${text}`).join("\n\n");
  const checks=Object.entries({user:"Указан конкретный пользователь",problem:"Проблема наблюдаема",alternatives:"Учтены альтернативы",hypothesis:"Идея обозначена как гипотеза",experiment:"Есть эксперимент и правило решения"}).map(([key,label])=>`- [${state.checks[key]?"x":" "}] ${label}`).join("\n");
  return `# ${title}\n\n${sections}\n\n## Самопроверка\n\n${checks}\n`;
}

function downloadMarkdown(){
  const blob=new Blob([markdownResult()],{type:"text/markdown;charset=utf-8"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");
  a.href=url;a.download=`${(clean(field("project"))||"idea-lab").replace(/[^a-zа-яё0-9_-]+/gi,"_")}.md`;a.click();URL.revokeObjectURL(url);showToast("Файл подготовлен");
}

async function copyResult(){
  try{await navigator.clipboard.writeText(markdownResult());showToast("Результат скопирован")}
  catch{showToast("Не удалось скопировать — скачайте файл")}
}

function showToast(message){const toast=$("#toast");toast.textContent=message;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),2200)}

function init(){
  hydrateFields();renderIdeas();updateLivePreviews();renderStep();
  $("#prevButton").addEventListener("click",()=>goToStep(state.step-1));
  $("#nextButton").addEventListener("click",()=>goToStep(state.step===STEP_TITLES.length-1?0:state.step+1));
  $("#addIdea").addEventListener("click",addIdea);
  $("#downloadMd").addEventListener("click",downloadMarkdown);
  $("#copyResult").addEventListener("click",copyResult);
  $("#printResult").addEventListener("click",()=>window.print());
  $("#resetButton").addEventListener("click",()=>$("#resetDialog").showModal());
  $("#cancelReset").addEventListener("click",()=>$("#resetDialog").close());
  $("#confirmReset").addEventListener("click",()=>{localStorage.removeItem(STORAGE_KEY);state=structuredClone(initialState);location.reload()});
}

init();
