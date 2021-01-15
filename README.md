# Among us - pédagogie

## TODO Room side
- [X] Création de room (gestion par socket)
- [X] Cycle de partie (ATTENTE - JEU - MEETING - FIN)
- [ ] Envoie d'un code par un joueur
- [ ] Alerte aux autres joueurs
- [ ] Buzz à partir de X codes rentrés
- [ ] Victoire fin de tâches ou plus de joueurs en vie

## TODO Client
- [X] Page d'accueil : Nouvelle partie / Rejoindre
- [ ] Ecran d'information de début de partie (crewmate/impostor)
- [ ] Page d'exercices -> page de code
- [ ] Page de meeting

## Save
### Liste event :
Les évenements (abstraits) peuvent avoir différentes formes :
- Les évenements qui informent le serveur et qu'il faut transmettre aux autre joueurs
- Les évenements qui informent le serveur et que lui seul doit traîter
- Les évenements envoyés par le serveur pour répondre à un client spécifique

#### Symétrique
- ~~Nouveau joueur~~
- ~~Depart joueur~~
- ~~Debut de partie~~
- Entré d'un code
- Appui sur le buzz
- Fin de partie
#### Client -> Serveur
- Joueur tué
- Tâche complété

#### 16/12/2020
- Sabotage
- Variables configurable début de lobby
- Easter egg cheat