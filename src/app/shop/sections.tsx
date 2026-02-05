export interface SectionConfig {
  id: string;
  titleKey: string;
  categories: string[];
  bgGradient: string;
  svgPattern: string;
  svgColor: string;
}

export const SECTIONS: SectionConfig[] = [
  {
    id: "shampoo-fragrance",
    titleKey: "shop.sectionShampooFragrance",
    categories: ["cuidado"],
    bgGradient: "from-emerald-50/40 via-turquesa/5 to-green-50/30",
    svgColor: "text-turquesa",
    svgPattern: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" fill="currentColor" class="w-full h-full"><g opacity="0.5"><rect x="80" y="0" width="8" height="600" rx="4"/><rect x="80" y="80" width="16" height="3" rx="1.5" transform="translate(-4,0)"/><rect x="80" y="180" width="16" height="3" rx="1.5" transform="translate(-4,0)"/><rect x="80" y="300" width="16" height="3" rx="1.5" transform="translate(-4,0)"/><rect x="80" y="420" width="16" height="3" rx="1.5" transform="translate(-4,0)"/><rect x="80" y="520" width="16" height="3" rx="1.5" transform="translate(-4,0)"/><path d="M88 70 Q120 40 130 60 Q140 80 120 90 Q100 100 88 80" /><path d="M80 170 Q50 140 40 160 Q30 180 50 190 Q70 200 80 180" /><path d="M88 290 Q130 260 140 280 Q150 300 130 315 Q110 330 88 300" /><path d="M80 410 Q40 380 30 400 Q20 420 40 435 Q60 450 80 420" /><rect x="250" y="0" width="6" height="600" rx="3"/><rect x="250" y="120" width="14" height="3" rx="1.5" transform="translate(-4,0)"/><rect x="250" y="260" width="14" height="3" rx="1.5" transform="translate(-4,0)"/><rect x="250" y="380" width="14" height="3" rx="1.5" transform="translate(-4,0)"/><rect x="250" y="500" width="14" height="3" rx="1.5" transform="translate(-4,0)"/><path d="M256 110 Q286 80 296 100 Q306 120 286 130 Q266 140 256 120" /><path d="M250 250 Q220 220 210 240 Q200 260 220 270 Q240 280 250 260" /><path d="M256 370 Q296 340 306 360 Q316 380 296 395 Q276 410 256 380" /><rect x="440" y="0" width="7" height="600" rx="3.5"/><rect x="440" y="60" width="15" height="3" rx="1.5" transform="translate(-4,0)"/><rect x="440" y="200" width="15" height="3" rx="1.5" transform="translate(-4,0)"/><rect x="440" y="340" width="15" height="3" rx="1.5" transform="translate(-4,0)"/><rect x="440" y="470" width="15" height="3" rx="1.5" transform="translate(-4,0)"/><path d="M440 50 Q410 20 400 40 Q390 60 410 70 Q430 80 440 60" /><path d="M447 190 Q477 160 487 180 Q497 200 477 210 Q457 220 447 200" /><path d="M440 330 Q400 300 390 320 Q380 340 400 355 Q420 370 440 340" /><rect x="620" y="0" width="5" height="600" rx="2.5"/><rect x="620" y="150" width="13" height="3" rx="1.5" transform="translate(-4,0)"/><rect x="620" y="310" width="13" height="3" rx="1.5" transform="translate(-4,0)"/><rect x="620" y="450" width="13" height="3" rx="1.5" transform="translate(-4,0)"/><path d="M625 140 Q655 110 665 130 Q675 150 655 160 Q635 170 625 150" /><path d="M620 300 Q590 270 580 290 Q570 310 590 320 Q610 330 620 310" /><path d="M625 440 Q665 410 675 430 Q685 450 665 465 Q645 480 625 450" /></g></svg>`,
  },
  {
    id: "fajas",
    titleKey: "shop.sectionFajas",
    categories: ["fajas"],
    bgGradient: "from-rosa-light/10 via-perla to-rosa/5",
    svgColor: "text-rosa-light",
    svgPattern: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" fill="none" stroke="currentColor" stroke-width="1.5" class="w-full h-full"><g opacity="0.5"><path d="M0 80 Q200 40 400 80 Q600 120 800 80" /><path d="M0 120 Q200 160 400 120 Q600 80 800 120" /><path d="M0 200 Q200 160 400 200 Q600 240 800 200" /><path d="M0 240 Q200 280 400 240 Q600 200 800 240" /><path d="M0 320 Q200 280 400 320 Q600 360 800 320" /><path d="M0 360 Q200 400 400 360 Q600 320 800 360" /><path d="M0 440 Q200 400 400 440 Q600 480 800 440" /><path d="M0 480 Q200 520 400 480 Q600 440 800 480" /><path d="M0 560 Q200 520 400 560 Q600 600 800 560" /></g></svg>`,
  },
  {
    id: "cinturillas",
    titleKey: "shop.sectionCinturillas",
    categories: ["cinturillas"],
    bgGradient: "from-dorado/5 via-amber-50/30 to-perla",
    svgColor: "text-dorado",
    svgPattern: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="currentColor" class="w-full h-full"><defs><pattern id="lace" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse"><g opacity="0.4"><path d="M50 10 L90 50 L50 90 L10 50 Z" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="50" cy="10" r="4"/><circle cx="90" cy="50" r="4"/><circle cx="50" cy="90" r="4"/><circle cx="10" cy="50" r="4"/><path d="M50 35 Q60 45 50 50 Q40 45 50 35" /><path d="M50 65 Q60 55 50 50 Q40 55 50 65" /><path d="M35 50 Q45 40 50 50 Q45 60 35 50" /><path d="M65 50 Q55 40 50 50 Q55 60 65 50" /></g></pattern></defs><rect width="200" height="200" fill="url(#lace)"/></svg>`,
  },
  {
    id: "tops-shorts",
    titleKey: "shop.sectionTopsShorts",
    categories: ["tops", "shorts"],
    bgGradient: "from-coral/5 via-rosa-light/10 to-perla",
    svgColor: "text-coral",
    svgPattern: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="currentColor" class="w-full h-full"><g opacity="0.35"><path d="M60 80 Q65 60 70 70 Q80 50 85 65 Q95 55 90 70 Q100 65 95 80 Q85 85 80 78 Q75 85 70 80 Q65 88 60 80Z"/><circle cx="77" cy="73" r="5"/><path d="M200 40 Q205 20 210 30 Q220 10 225 25 Q235 15 230 30 Q240 25 235 40 Q225 45 220 38 Q215 45 210 40 Q205 48 200 40Z"/><circle cx="217" cy="33" r="5"/><path d="M340 100 Q345 80 350 90 Q360 70 365 85 Q375 75 370 90 Q380 85 375 100 Q365 105 360 98 Q355 105 350 100 Q345 108 340 100Z"/><circle cx="357" cy="93" r="5"/><path d="M120 200 Q125 180 130 190 Q140 170 145 185 Q155 175 150 190 Q160 185 155 200 Q145 205 140 198 Q135 205 130 200 Q125 208 120 200Z"/><circle cx="137" cy="193" r="5"/><path d="M280 180 Q285 160 290 170 Q300 150 305 165 Q315 155 310 170 Q320 165 315 180 Q305 185 300 178 Q295 185 290 180 Q285 188 280 180Z"/><circle cx="297" cy="173" r="5"/><path d="M50 320 Q55 300 60 310 Q70 290 75 305 Q85 295 80 310 Q90 305 85 320 Q75 325 70 318 Q65 325 60 320 Q55 328 50 320Z"/><circle cx="67" cy="313" r="5"/><path d="M190 300 Q195 280 200 290 Q210 270 215 285 Q225 275 220 290 Q230 285 225 300 Q215 305 210 298 Q205 305 200 300 Q195 308 190 300Z"/><circle cx="207" cy="293" r="5"/><path d="M330 280 Q335 260 340 270 Q350 250 355 265 Q365 255 360 270 Q370 265 365 280 Q355 285 350 278 Q345 285 340 280 Q335 288 330 280Z"/><circle cx="347" cy="273" r="5"/><path d="M100 380 Q105 360 110 370 Q120 350 125 365 Q135 355 130 370 Q140 365 135 380 Q125 385 120 378 Q115 385 110 380 Q105 388 100 380Z"/><circle cx="117" cy="373" r="5"/><path d="M260 360 Q265 340 270 350 Q280 330 285 345 Q295 335 290 350 Q300 345 295 360 Q285 365 280 358 Q275 365 270 360 Q265 368 260 360Z"/><circle cx="277" cy="353" r="5"/></g></svg>`,
  },
];
