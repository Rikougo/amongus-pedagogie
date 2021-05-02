var listeExos = document.getElementById("ListeExos");
var intitule = document.getElementById("intitule");
var reponse = document.getElementById("reponse");

var tabEx = [];
var exAct;
var tabV;

function chercheCouple(nom){
    for(let i=0; i<tabEx.length; i++) {
        let couple = tabEx[i];
        if (couple[0] == nom){
			exAct = couple[1];
            return couple[1];
        }
    }
	console.log("Erreur lors de la recherche de couple!")
	exAct = tabEx[0][1];//
    return tabEx[0][1]; // renvoie du premier Exo par défaut
}

function menuMatiere(choix){
    switch(choix.options[choix.selectedIndex].text){
        case "Mathématiques":
			//console.log("maths");
			vider();
			remplir("Mathématiques");
            break;
        case "Physique-Chimie":
			//console.log("phy");
			vider();
			remplir("Physique-Chimie");
            break;
        case "Histoire":
			//console.log("histoire");
			vider();
			remplir("Histoire");
            break;
        case "Informatique":
			//console.log("info");
			vider();
			remplir("Informatique");
            break;
        case "-Autre-":
			//console.log("autre");
			vider();
			remplir("-Autre-");
			break;
		default:
			vider();
    }
}

function vider(){
	listeExos.innerHTML = "";
	intitule.innerHTML = "";
	reponse.innerHTML = "";
	tabEx = [];
}

function remplir(matiere){
	jsonExos.forEach(ex => {
		if(ex.matiere == matiere){
			listeExos.innerHTML += "<option>" + ex.nomEx + "</option>";
			tabEx.push([ex.nomEx, ex]);
		}
	});
}


function menuExos(choix){
	if(choix.length == 0){
		window.alert("Aucun exercice pour la matière selectionnée!");
	}
	else{
		let ex = chercheCouple(choix.options[choix.selectedIndex].text)
		//console.log(ex);
		creerExo(ex);
	}
}


function creerExo(ex){
	switch (ex.type){
		case "Vrai / Faux":
			intitule.innerHTML = "<h1>Intitulé Exercice:<h1><p>" + ex.intitule;
			reponse.innerHTML = "<form>"+
								"<label class=\"inline\" for=\"vrai\">Vrai</label>" + 
								"<input id=\"vrai\" name=\"reponse\" type=\"radio\" value=\"true\" required/>" + 
								"<label class=\"inline\" for=\"faux\">Faux</label>" + 
								"<input id=\"faux\" name=\"reponse\" type=\"radio\" value=\"false\"/>" +
								"<br><button type=\"submit\">Valider</button>" +
								"</form>";
			break
		case "QCM":
			intitule.innerHTML = "<h1>Intitulé Exercice:<h1><p>" + ex.intitule;
			let myStr = "<form>"; 
			//reponse.innerHTML = "<form>"; // -> ferme directement le form -> utiliser une string pour tout ajouter d'un coup dans le innerHTML
			for(let i=1; i<5; i++){
				/*reponse.innerHTML += "<label class=\"inline\" for=\"choix "+i+"\">"+ exAct["choix "+i] +"</label>" +
									 "<input id=\"choix "+i+"\" name=\"reponse\" type=\"checkbox\" value="+i+" /><br>";
				*/
				myStr += "<label class=\"inline\" for=\"choix "+i+"\">"+ exAct["choix "+i] +"</label>" +
						 "<input id=\"choix "+i+"\" name=\"reponse\" type=\"checkbox\" value="+i+" /><br>";
			}
			//reponse.innerHTML += "<br><button type=\"submit\">Valider</button>";
			//reponse.innerHTML += "</form>";
			myStr += "<br><button type=\"submit\">Valider</button></form>";
			reponse.innerHTML = myStr;
			break
		case "Calcul":
			let intituleR = rando(ex.intitule);
			intitule.innerHTML = "<h1>Intitulé Exercice:<h1><p>" + intituleR;
			//intitule.innerHTML = "<h1>Intitulé Exercice:<h1><p>" + ex.intitule;
			reponse.innerHTML = "<form>"+
								"<label for=\"reponse\">Réponse</label>" + 
								"<input id=\"reponse\" name=\"reponse\" type=\"text\" required/>" + 
								"<br><button type=\"submit\">Valider</button>" +
								"</form>";
			break
		case "Réponse Simple":
			intitule.innerHTML = "<h1>Intitulé Exercice:<h1><p>" + ex.intitule;
			reponse.innerHTML = "<form>"+
								"<label for=\"reponse\">Réponse</label>" + 
								"<input id=\"reponse\" name=\"reponse\" type=\"text\" required/>" + 
								"<br><button type=\"submit\">Valider</button>" +
								"</form>";
			break
	}
	//reponse.innerHTML += "<br><button onclick=\"checkReponse()\">Valider</button>";
	//reponse.innerHTML += "<br><button type=\"submit\">Valider</button>";
	reponse.addEventListener('submit', checkReponse);
}

// Renvoie l'intitulé d'un exo calcul après remplacement des variables dans l'intitule d'origine et MAJ dico avec les nouvelles valeurs des variables
function rando(intitule){
	let tabTexte = intitule.split("\""); //split a chaque " -> isoler facilement les variables -> [str, var, str, var...]
	let newIntitule = "";
	tabV = {};
	for (let i=0; i<tabTexte.length; i++){
		if(!(i%2 == 0)){
			let rng = Math.floor(Math.random() * 100); 
			tabV[tabTexte[i]] = rng; // MAJ dico var: valeur
			newIntitule += rng;
		}
		else{
			newIntitule += tabTexte[i]
		}
	}
	return newIntitule;
}

//fonction calculant la bonne réponse en fonction de la formule donnée en réponse de l'exo
function calculRep(rep){ 
	let newRep = rep;
	for (let v in tabV) {
		//console.log("dans l'équation "+ newRep +" on remplace "+ v +" par "+tabV[v]);
		newRep = newRep.replace(v, tabV[v]);
	}
	//console.log(newRep);
	return eval(newRep);
}

// renvoie true si tableau a == tableau b
function same(a, b){ 
	if(a.length == b.length){
		for(let i=0; i<a.length; i++){
			if(!(a[i] == b[i])){
				return false;
			}
		}
		return true;
	}
	return false;
}

function checkReponse(event){
	//console.log("click");
	event.preventDefault();
	let data = new FormData(event.target);
	let repJSON = Object.fromEntries(data.entries());
	switch (exAct.type){
		case "Vrai / Faux":
			window.alert(repJSON.reponse == exAct.reponse);
			break
		case "QCM":
			repJSON.reponse = data.getAll('reponse');
			//console.log(repJSON.reponse);
			//console.log(exAct.reponse);
			window.alert(same(repJSON.reponse, exAct.reponse));
			break
		case "Calcul":
			let correct = calculRep(exAct.reponse);
			window.alert(repJSON.reponse == correct);
			break
		case "Réponse Simple":
			window.alert(repJSON.reponse == exAct.reponse);
			break
	}
}



