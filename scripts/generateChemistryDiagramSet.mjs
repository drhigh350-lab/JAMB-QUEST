import { mkdirSync, writeFileSync } from 'node:fs';

const out = '/home/ubuntu/webdev-static-assets';
mkdirSync(out, { recursive: true });

const wrap = (content, viewBox = '0 0 900 540') => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="900" height="540" role="img">
<rect width="100%" height="100%" fill="#ffffff"/>
<style>
  .line{stroke:#111827;stroke-width:5;fill:none;stroke-linecap:round;stroke-linejoin:round}
  .thin{stroke:#111827;stroke-width:3;fill:none;stroke-linecap:round;stroke-linejoin:round}
  .dash{stroke:#64748b;stroke-width:3;stroke-dasharray:10 9;fill:none}
  .t{font:600 38px Arial,sans-serif;fill:#111827}
  .s{font:500 28px Arial,sans-serif;fill:#111827}
  .l{font:700 34px Arial,sans-serif;fill:#0f172a}
  .accent{fill:#b45309}
</style>${content}</svg>`;

const write = (name, content, box) => writeFileSync(`${out}/${name}.svg`, wrap(content, box), 'utf8');

write('jamb-quest-chem-2-chloro-2-methylbutane', `
<text class="t" x="105" y="285">CH₃</text><line class="line" x1="230" y1="260" x2="330" y2="260"/><line class="line" x1="370" y1="260" x2="480" y2="260"/><line class="line" x1="520" y1="260" x2="630" y2="260"/>
<text class="t" x="330" y="275">C</text><text class="t" x="490" y="285">CH₂</text><text class="t" x="650" y="285">CH₃</text>
<line class="line" x1="356" y1="225" x2="356" y2="135"/><text class="t" x="331" y="110">Cl</text><line class="line" x1="356" y1="300" x2="356" y2="388"/><text class="t" x="323" y="440">CH₃</text>
<text class="s accent" x="95" y="500">2-chloro-2-methylbutane</text>`);

write('jamb-quest-chem-2-bromo-2-methylbutane', `
<text class="t" x="105" y="285">CH₃</text><line class="line" x1="230" y1="260" x2="330" y2="260"/><line class="line" x1="370" y1="260" x2="480" y2="260"/><line class="line" x1="520" y1="260" x2="630" y2="260"/>
<text class="t" x="330" y="275">C</text><text class="t" x="490" y="285">CH₂</text><text class="t" x="650" y="285">CH₃</text>
<line class="line" x1="356" y1="225" x2="356" y2="135"/><text class="t" x="322" y="110">Br</text><line class="line" x1="356" y1="300" x2="356" y2="388"/><text class="t" x="323" y="440">CH₃</text>
<text class="s accent" x="95" y="500">2-bromo-2-methylbutane</text>`);

write('jamb-quest-chem-2-methylpropan-2-ol', `
<text class="t" x="115" y="285">CH₃</text><line class="line" x1="245" y1="260" x2="350" y2="260"/><line class="line" x1="390" y1="260" x2="510" y2="260"/><text class="t" x="350" y="275">C</text><text class="t" x="530" y="285">OH</text>
<line class="line" x1="377" y1="225" x2="377" y2="135"/><text class="t" x="344" y="110">CH₃</text><line class="line" x1="377" y1="300" x2="377" y2="388"/><text class="t" x="344" y="440">CH₃</text>
<text class="s accent" x="95" y="500">2-methylpropan-2-ol</text>`);

write('jamb-quest-chem-activation-energy', `
<line class="line" x1="110" y1="430" x2="790" y2="430"/><line class="line" x1="110" y1="430" x2="110" y2="95"/>
<path class="line" d="M145 260 C270 260 285 260 350 260 C410 260 420 110 505 110 C585 110 605 330 680 330"/>
<line class="dash" x1="145" y1="260" x2="700" y2="260"/><line class="thin" x1="450" y1="252" x2="450" y2="122"/><path class="thin" d="M442 135 L450 120 L458 135 M442 240 L450 255 L458 240"/>
<text class="l accent" x="475" y="205">y</text><text class="s" x="90" y="80">Energy</text><text class="s" x="545" y="485">Reaction path</text><text class="s" x="145" y="245">Reactants</text><text class="s" x="650" y="360">Products</text><text class="s" x="490" y="95">Transition state</text>`);

write('jamb-quest-chem-ion-table', `
<rect class="line" x="60" y="125" width="780" height="235"/><line class="thin" x1="60" y1="205" x2="840" y2="205"/>
${[170,280,390,500,610,720].map(x => `<line class="thin" x1="${x}" y1="125" x2="${x}" y2="360"/>`).join('')}
<text class="l" x="82" y="180">Cations</text><text class="l" x="92" y="285">Anions</text>
<text class="t" x="190" y="180">Al³⁺</text><text class="t" x="300" y="180">Ca²⁺</text><text class="t" x="410" y="180">Cu²⁺</text><text class="t" x="520" y="180">Fe³⁺</text><text class="t" x="640" y="180">K⁺</text>
<text class="t" x="205" y="285">Br⁻</text><text class="t" x="295" y="285">CO₃²⁻</text><text class="t" x="410" y="285">NO₃⁻</text><text class="t" x="535" y="285">S²⁻</text><text class="t" x="625" y="285">SO₄²⁻</text>`);

write('jamb-quest-chem-equilibrium', `
<text class="l" x="130" y="190">2XY₃(g)  ⇌  X₂(g)  +  3Y₂(g)</text>
<line class="thin" x1="190" y1="305" x2="600" y2="305"/><text class="t" x="350" y="275">[X₂][Y₂]³</text><text class="t" x="350" y="360">[XY₃]²</text><text class="l accent" x="120" y="330">Kc =</text>`);

write('jamb-quest-chem-substitution-reaction', `
<text class="l" x="80" y="270">C₃H₈(g)  +  Cl₂(g)</text><line class="line" x1="430" y1="250" x2="570" y2="250"/><path class="thin" d="M555 236 L578 250 L555 264"/><text class="s" x="450" y="205">UV light</text><text class="l" x="590" y="270">C₃H₇Cl(g) + HCl(g)</text>
<text class="s accent" x="310" y="410">Substitution reaction</text>`);

write('jamb-quest-chem-solubility-graph', `
<line class="line" x1="110" y1="430" x2="800" y2="430"/><line class="line" x1="110" y1="430" x2="110" y2="80"/>
<path class="line" d="M120 410 L690 100"/><path class="line" d="M120 320 L690 90"/><path class="line" d="M120 260 L760 260"/><path class="line" d="M120 400 Q390 310 700 430"/>
<text class="l" x="700" y="100">X</text><text class="l" x="700" y="145">Y</text><text class="l" x="770" y="250">Z</text><text class="l" x="710" y="450">Q</text>
<text class="s" x="585" y="490">Temperature / °C</text><text class="s" x="18" y="65" transform="rotate(-90 18,65)">Solubility / g per 100 g water</text>`);

write('jamb-quest-chem-esterification-table', `
<rect class="line" x="70" y="135" width="760" height="190"/><line class="thin" x1="70" y1="220" x2="830" y2="220"/>
${[220,370,520,670].map(x => `<line class="thin" x1="${x}" y1="135" x2="${x}" y2="325"/>`).join('')}
<text class="l" x="115" y="195">Compound</text><text class="l" x="165" y="285">Formula</text>
<text class="l" x="275" y="195">I</text><text class="l" x="425" y="195">II</text><text class="l" x="575" y="195">III</text><text class="l" x="725" y="195">IV</text>
<text class="t" x="270" y="285">ROH</text><text class="t" x="395" y="285">RCOR′</text><text class="t" x="560" y="285">ROR′</text><text class="t" x="700" y="285">RCOOH</text>
<text class="s accent" x="220" y="430">Alcohol + carboxylic acid  →  ester + water</text>`);
