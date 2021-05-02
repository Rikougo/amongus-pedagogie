var typeSelectionne = false;

var reponse = document.getElementById("reponse");

function menuType(choix){
    //console.log(choix.selectedIndex);
    switch(choix.selectedIndex){
        case 0:
            typeSelectionne = false;
            vider();
            break;
        case 1:
            typeSelectionne = true;
            vider();
            genVraiFaux();
            break;
        case 2:
            typeSelectionne = true;
            vider();
            genQCM(4);
            break;
        case 3:
            typeSelectionne = true;
            vider();
            genCalcul();
            break;
        case 4:
            typeSelectionne = true;
            vider();
            genReponseSimple();
            break;
    }
}

function vider(){
    reponse.innerHTML = "";
}

function genVraiFaux(){
    reponse.innerHTML = "<label class=\"inline\" for=\"vrai\">Vrai</label>" + 
                        "<input id=\"vrai\" name=\"reponse\" type=\"radio\" value=\"true\"/ required>" + 
                        "<label class=\"inline\" for=\"faux\">Faux</label>" + 
                        "<input id=\"faux\" name=\"reponse\" type=\"radio\" value=\"false\"/>" ;
}

function genQCM(nb){
    for(let i=1; i<nb+1; i++){
        reponse.innerHTML += "<label for=\"choix "+i+"\">Choix "+i+"</label>" +
                             "<input id=\"choix "+i+"\" name=\"choix "+i+"\" type=\"text\" required/>" + 
                             "<input id=\"choix "+i+"\" name=\"reponse\" type=\"checkbox\" value="+i+" />";
    }
}


function genCalcul(nb){
    reponse.innerHTML = "<label for=\"calcul\">Présisez le calcul à effectuer (mettez les variables entre \" \" dans l'intitulé)</label>"+
                        "<textarea id=\"reponse\" name=\"reponse\" rows=\"3\" cols=\"100\" required></textarea>";
}

function genReponseSimple(){
    reponse.innerHTML = "<label for=\"reponse\">Quelle est la réponse attendue?</label>"+
                        "<textarea id=\"reponse\" name=\"reponse\" rows=\"3\" cols=\"100\" required></textarea>";
}



function handleFormSubmit(event) {
    event.preventDefault();
    
    if(typeSelectionne){
        let data = new FormData(event.target);
  
        var formJSON = Object.fromEntries(data.entries());
  
        if(formJSON.type == "QCM"){
            // traitement différent dans le cas d'un QCM car il faut récupérer toutes les checkboxs
            formJSON.reponse = data.getAll('reponse'); 
        }
        
        let results = document.querySelector('.results pre');
        results.innerText = JSON.stringify(formJSON, null, 2);
    }
    else{
        window.alert("Choisissez un type d'exercice!");
    }
    
}
  
var form = document.querySelector('.exercice-form');
form.addEventListener('submit', handleFormSubmit);