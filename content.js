const session_dictionnary = {};
let lang_dest ="";
let lang_src ="";
const langue_session = 'fr';
const langue_apprentissage = 'en';
let classe_paires_vides = "";

document.addEventListener('click', (event) => {
  if(event != null && event.target!=null){
    const zone = document.querySelector("div[data-test]");
    const type_evenement = zone.getAttribute('data-test');
    // if(event.target.tagName == "TEXTAREA"){
      if(type_evenement==="challenge challenge-translate"){
        translateTextInTextArea();
        const correction = answerCorrection();
        if(correction!==undefined)storeCorrection(textToTranslate(),correction);
      }
      else if(type_evenement==="challenge challenge-match") {
        translatePairButtons();
      }
    }
});
document.addEventListener('keydown', (event) => {
  if(event != null){
    const zone = document.querySelector("div[data-test]");
    const type_evenement = zone.getAttribute('data-test');
    if(event.key == 'ArrowRight' && type_evenement==="challenge challenge-translate"){
      translateTextInTextArea();
    }
    else if( event.key==='Enter' && type_evenement==="challenge challenge-translate"){
      updateLocalValuesFromTextArea();
      const correction = answerCorrection();
      if(correction!==undefined)storeCorrection(textToTranslate(),correction);
    }
  }
});

function translatePairButtons(){
  const boutons = getPairsButtons();
  const pair_classes = {};
  for(const bouton of boutons){
   const class_name = bouton.className;
   if(class_name in pair_classes)pair_classes[class_name].push(bouton);
   else pair_classes[class_name]=[bouton];
  }
  for(const classe in pair_classes){
    if(pair_classes[classe].length==2){
      // Le premier élément est tojours celui de la langue de session
      lang_src==langue_session;
      lang_dest = langue_apprentissage;
      const mot_langsession = pair_classes[classe][0].getElementsByTagName('span')[1].innerText;
      const mot_langappr = pair_classes[classe][1].getElementsByTagName('span')[1].innerText;
      storeCorrection(mot_langappr,mot_langsession);
    }
  }
}

function getPairsButtons(){
  const zone = document.querySelector("div[data-test]");
  if(zone!==null && zone !== undefined)return  zone.getElementsByTagName('button');
  return undefined;
}
function textToTranslate() {
  let texte = "";
  const divs = document.getElementsByTagName("div");
  for(const dir of divs){
    if(dir.hasAttribute("dir")){
      const spans = dir.getElementsByTagName("span");
      for(const span of spans){
        if(span.innerText.length>0){
          texte = span.innerText;
          break;
        }
      }
      break;
    }
  }
  return texte;
}
async function translation(text,source,target){
  const dico = (source===langue_apprentissage)?session_dictionnary: swapDico();
  let trad = translateWithLocalDictionnary(text,dico);
  //if(trad===undefined)trad = await translateAPI(text,source,target);
 // if(trad==undefined)trad=translateByDiff(text,dico);
  return trad;
}
async function translateByDiff(text,dictionnary){
  const mots = getMots(text);
  console.log(subSentenses(text,dictionnary));
  return undefined;
}
function subSentenses(sentense,dictionnary){
 const sub_phrases = [];
 for(const phrase in dictionnary){
  if(sentense.includes(phrase))sub_phrases.push(phrase);
 }
 return sub_phrases;
}



function getMots(text, minuscule=false){
  const x = text.replace(/[-?!,.;_]+/g, " ");
  const mots = x.trim().split(" ").filter(chaine=>chaine.length>0);
  if(minuscule){
    for(let i=0;i<mots.length;i++){
      mots[i]=mots[i].toLowerCase();
    }
  }
  return mots;
}

function translateWithLocalDictionnary(text,dictionnary){
  if(text in dictionnary)return dictionnary[text];
  return undefined;
}

function swapDico(){
    const dico_swapped = {};
    for(const key in session_dictionnary){
      const value = session_dictionnary[key];
      dico_swapped[value]=key;
    }
    return dico_swapped;
  }
  async function translateAPI(text, source,target){
  const options = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'X-RapidAPI-Key': '6281b64e64msh5da2fb1b6cc0fecp126467jsne1b737973a57',
      'X-RapidAPI-Host': 'microsoft-translator-text.p.rapidapi.com'
    },
    body: '[{"Text":"'+text+'"}]'
  };
  
  return fetch('https://microsoft-translator-text.p.rapidapi.com/translate?to%5B0%5D='+target+'&api-version=3.0&from='+source+'&profanityAction=NoAction&textType=plain', options)
    .then(response => response.json())
    .then(response => {return response[0].translations[0].text})
    .catch(err => console.error(err));
}

function answerCorrection(){
  const banniere = getBanniere();
  if(banniere!==null){
    const res_incorrect = document.querySelector("div[data-test='blame blame-incorrect']");
    const res_correct = document.querySelector("div[data-test='blame blame-correct']");
    const res_correct_exists =  (res_correct !== null && res_correct !== undefined);
    const res_incorrect_exists = (res_incorrect!==null && res_incorrect !== undefined) ;
    if(res_incorrect_exists||res_correct_exists){
      const current_res = res_correct_exists?res_correct:res_incorrect;
      // On veut le texte qui est juste après le titre (Bonne réponse, Mauvaise réponse)
      const res_correction =current_res.querySelector('h2').nextSibling;
      if(res_correction!== null)return res_correction.innerText;
    }
    if(res_correct){ // La réponse est parfaitement correcte
      const text_area = getTextArea();
      if(text_area!==undefined){
        return text_area.innerHTML;
      }
    }
  }
  return undefined;
}

function storeCorrection(text,correction){
  if(lang_src!==langue_apprentissage) {
    const tmp = text;
    text = correction;
    correction = tmp;
  }
  session_dictionnary[text] = correction;
  console.log(session_dictionnary);
}



async function sendTranslationToUser(text){
  const input =  getTextArea();
  await copyText(text)
  input.placeholder ="Traduction copiée !\nVous pouvez maintenant la coller";
  return input;
}
function getTextArea(){
  return document.getElementsByTagName("textarea")[0];
}
function getBanniere(){
  return document.getElementById('session/PlayerFooter');
}
async function copyText(text) {
  const permission = await navigator.permissions.query({ name: 'clipboard-read' });
  if (permission.state === 'denied')  return console.error("Probleme de permissions")
  try {await navigator.clipboard.writeText(text)}
  catch (e) {console.error(e.message)}
}

async function translateTextInTextArea(){
  updateLocalValuesFromTextArea();
  const texte = textToTranslate();
  const text_area = getTextArea();
  text_area.placeholder = "Traduction en cours...";
  const trad = await translation(texte,lang_src,lang_dest);
  if(text_area.innerText.length==0 && text_area.value.length==0){
    if(trad!==undefined)await sendTranslationToUser(trad);
    else text_area.placeholder = "Traduction non trouvée.. Il faut réfléchir !";
  }
}

function updateLocalValuesFromTextArea(){
  const text_area = getTextArea();
  lang_dest = text_area.getAttribute('lang');
  lang_src = lang_dest==langue_session?langue_apprentissage:langue_session;
}

