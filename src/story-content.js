import { planets, sunInfo } from './data.js'

/* Le récit, chapitre par chapitre. Chaque chapitre est une étape du voyage : la
   caméra s'y pose, et le texte s'y dévoile en « temps » successifs (beats) au fil du
   défilement. Les planètes reprennent les fiches de data.js (origine du nom, récit,
   le saviez-vous) pour que les deux modes racontent la même histoire. */

const byId = Object.fromEntries(planets.map((p) => [p.id, p]))
const AU_KM = 149.6

const planetChapter = (id, num, subtitle, lead, side) => {
  const p = byId[id]
  return {
    id, kind: 'planet', num, side, accent: p.accent, au: p.distance,
    title: p.name, subtitle,
    beats: [
      { label: 'Arrivée', lead, text: p.description },
      { label: 'Origine du nom', text: p.myth },
      { label: 'Récit', text: p.story },
      { label: 'Le saviez-vous ?', text: p.wow, wow: true },
    ],
    stats: [
      { label: 'Diamètre', count: p.diameter, unit: 'km' },
      { label: 'Distance au Soleil', count: Math.round(p.distance * AU_KM), unit: 'millions de km' },
      { label: 'Une année', value: p.orbitalPeriod },
      { label: 'Un jour', value: p.dayLength },
      { label: 'Température', value: p.temperature },
    ],
  }
}

export const chapters = [
  {
    id: 'intro', kind: 'intro', num: '', title: 'Le récit', au: null,
  },
  {
    id: 'nebula', kind: 'nebula', num: 'I', side: 'left', accent: '#c9a7ff', au: null,
    title: 'Le nuage', subtitle: 'Au commencement, il y a 4,6 milliards d’années',
    beats: [
      { label: 'Avant tout', lead: 'Avant le Soleil, avant la Terre, il n’y avait ici qu’un immense nuage de gaz et de poussière — froid, sombre, silencieux — dérivant lentement dans la galaxie.' },
      { label: 'L’effondrement', text: 'Une perturbation — peut-être l’onde de choc d’une étoile voisine qui explose — rompt l’équilibre. Le nuage commence à s’effondrer sous son propre poids.' },
      { label: 'Le disque', text: 'En se contractant, il tourne de plus en plus vite et s’aplatit en disque, comme une patineuse qui ramène les bras. Au centre, la matière s’entasse et chauffe. Dans le disque, les poussières s’agglomèrent : grains, cailloux, rochers… futures planètes.' },
      { label: 'Le saviez-vous ?', wow: true, text: 'Certaines météorites tombées sur Terre renferment des grains de poussière plus anciens que le Soleil lui-même : les cendres d’étoiles disparues, antérieures à toute notre histoire.' },
    ],
    stats: [
      { label: 'Âge du système', value: '4,57 milliards d’années' },
      { label: 'Masse captée par le Soleil', value: '99,86 %' },
      { label: 'Naissance des planètes', value: '10 à 100 millions d’années' },
    ],
  },
  {
    id: 'sun', kind: 'sun', num: 'II', side: 'left', accent: '#ffcf7a', au: 0,
    title: 'Le Soleil', subtitle: 'Et la lumière fut',
    beats: [
      { label: 'L’allumage', lead: 'Au cœur du disque, la pression et la chaleur deviennent telles que les noyaux d’hydrogène se mettent à fusionner. Une étoile s’allume. La nôtre.', text: sunInfo.description },
      { label: 'Origine du nom', text: sunInfo.myth },
      { label: 'Récit', text: sunInfo.story },
      { label: 'Le saviez-vous ?', text: sunInfo.wow, wow: true },
    ],
    stats: [
      { label: 'Diamètre', count: 1392700, unit: 'km' },
      { label: 'Surface', value: '5 500 °C' },
      { label: 'Cœur', value: '15 millions °C' },
      { label: 'Âge', value: '4,6 milliards d’années' },
    ],
  },
  planetChapter('mercury', 'III', 'Le messager brûlé',
    'Premier monde après le Soleil : une boule de roche nue, criblée de cratères, où le jour cuit et la nuit gèle.', 'left'),
  planetChapter('venus', 'IV', 'La jumelle voilée',
    'Presque la taille de la Terre, et pourtant l’enfer : sous ses nuages dorés, il fait assez chaud pour faire fondre le plomb.', 'right'),
  planetChapter('earth', 'V', 'Le monde bleu',
    'Troisième rocher depuis le Soleil. Ni trop près, ni trop loin : juste assez pour que l’eau reste liquide — et que la vie s’y invite.', 'left'),
  planetChapter('mars', 'VI', 'Le désert rouge',
    'Un monde rouillé, froid et silencieux, dont les lits de rivières asséchés racontent qu’il fut peut-être, autrefois, couvert d’eau.', 'right'),
  {
    id: 'belt', kind: 'belt', num: 'VII', side: 'left', accent: '#cbb89a', au: 2.7,
    title: 'La ceinture', subtitle: 'Les ruines d’un monde qui n’est jamais né',
    beats: [
      { label: 'Traversée', lead: 'Entre Mars et Jupiter s’étend un champ de débris : des millions de rochers, restes du disque originel qui ne sont jamais parvenus à former une planète.' },
      { label: 'Pourquoi pas de planète ?', text: 'La gravité colossale de Jupiter, toute proche, a sans cesse secoué ces fragments : au lieu de s’assembler en douceur, ils se sont percutés et brisés.' },
      { label: 'Récit', text: 'En 1801, l’astronome Giuseppe Piazzi découvre Cérès, d’abord saluée comme une nouvelle planète. Il faudra deux siècles pour qu’elle trouve sa vraie place : planète naine, reine de la ceinture.' },
      { label: 'Le saviez-vous ?', wow: true, text: 'Malgré les films, la ceinture est presque vide : toute sa masse réunie ne pèse qu’environ 3 % de notre Lune, et Cérès à elle seule en représente près de 40 %.' },
    ],
    stats: [
      { label: 'Distance au Soleil', value: '2,2 à 3,3 UA' },
      { label: 'Plus grand corps', value: 'Cérès — 940 km' },
      { label: 'Masse totale', value: '≈ 3 % de la Lune' },
    ],
  },
  planetChapter('jupiter', 'VIII', 'Le roi des planètes',
    'Deux fois et demie plus massif que toutes les autres planètes réunies : un géant de gaz dont les tempêtes durent des siècles.', 'right'),
  planetChapter('saturn', 'IX', 'Le joyau',
    'Des anneaux larges de près de 275 000 km, mais épais, par endroits, d’une dizaine de mètres à peine : des milliards de blocs de glace en orbite.', 'left'),
  planetChapter('uranus', 'X', 'La planète couchée',
    'Une géante de glace bleu pâle qui roule sur le flanc — sans doute renversée, il y a des milliards d’années, par une collision titanesque.', 'right'),
  planetChapter('neptune', 'XI', 'La sentinelle bleue',
    'Aux confins du système, à 4,5 milliards de kilomètres du Soleil, soufflent les vents les plus violents jamais mesurés sur une planète : plus de 2 000 km/h.', 'left'),
  {
    id: 'epilogue', kind: 'epilogue', num: 'Épilogue', side: 'left', accent: '#9bd5d1', au: 40,
    title: 'Un point bleu pâle', subtitle: '14 février 1990',
    beats: [
      { label: 'Le dernier regard', lead: 'À environ 6 milliards de kilomètres d’ici, la sonde Voyager 1 se retourne une dernière fois et photographie les planètes qu’elle laisse derrière elle.' },
      { label: 'Vous êtes ici', text: 'Sur l’image, la Terre n’occupe même pas un pixel : un minuscule point pâle, suspendu dans un rayon de soleil. Tout ce que l’humanité a jamais vécu tient dans ce grain de lumière.' },
      { label: 'Et maintenant ?', text: 'Voyager 1 file toujours, à plus de 60 000 km/h. Elle approche désormais d’un jour-lumière de distance : la lumière du Soleil met près de vingt-quatre heures à la rattraper.' },
      { label: 'Fin du voyage', final: true, text: 'Le système solaire, lui, continue de tourner. À vous de l’explorer.' },
    ],
  },
]
