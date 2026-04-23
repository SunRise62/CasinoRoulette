# Roulette Européenne

Simulateur de roulette européenne en vanilla HTML/CSS/JS. Aucune dépendance, aucun framework.

## Fonctionnalités

- Roue animée dessinée sur `<canvas>` avec 37 cases colorées
- Bille ivoire qui tourne en sens inverse de la roue et atterrit sur le numéro tiré
- Résultat détaillé : couleur, parité, moitié, douzaine, colonne, numéro plein
- Historique des 20 derniers tirages
- Table des gains en panneau accordéon (sous l'historique)
- Raccourci clavier : `Espace` ou `Entrée` pour lancer un tirage
- Responsive — fonctionne sur mobile dès 360 px de large
- Respecte `prefers-reduced-motion`

## Structure

```
├── index.html   # Structure HTML
├── style.css    # Styles (variables CSS, thème casino sombre/doré)
└── script.js    # Logique : dessin canvas, animation, tirage, accordion
```

## Lancement

Ouvre `index.html` dans un navigateur. Aucun serveur requis.

```bash
# Ou avec un serveur local minimal
npx serve .
python3 -m http.server 8080
```

## Détails techniques

### Séquence des numéros

La roue suit la séquence officielle de la roulette européenne :

```
0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36,
11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9,
22, 18, 29, 7, 28, 12, 35, 3, 26
```

### Animation

La roue tourne en sens négatif (horaire). La bille tourne en sens positif (anti-horaire). Les deux s'arrêtent avec une fonction d'ease `1 - (1-t)^n`. L'angle cible de la roue est calculé pour que le milieu de la case tirée pointe vers le sommet (sous le pointeur doré). La bille glisse vers l'intérieur dans les 25 % finaux de l'animation.

### Tirage

Le numéro est tiré via `Math.random()` au moment du clic, avant le début de l'animation. Il n'y a pas de biais : chaque numéro a une probabilité de 1/37.

## Avantage maison

La roulette européenne a un seul zéro. L'avantage de la maison est de **2,70 %** sur toutes les mises (1/37 ≈ 2,70 %).

---

Ce projet est un simulateur. Il ne permet pas de miser de l'argent réel.
